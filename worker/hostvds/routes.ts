/**
 * HostVDS routes mounted under /api/vps/* by worker/index.ts.
 *
 *   GET /api/vps/catalog            public  — plans, images, regions for the order page
 *   GET /api/vps/servers            API_KEY — VPS list (summary)
 *   GET /api/vps/servers/:id        API_KEY — one VPS
 *   GET /api/vps/flavors|images|networks|limits|endpoints   API_KEY — raw OpenStack data
 */
import { OpenStackClient, OpenStackError, type OpenStackConfig } from "./openstack";
import { mapServer, type NovaServer } from "./mappers";
import { mapFlavors, mapImages, parsePricing, type GlanceImage, type NovaFlavor, type VpsCatalog } from "./catalog";

export interface VpsEnv {
  OS_AUTH_URL?: string;
  OS_PROJECT_NAME?: string;
  OS_USERNAME?: string;
  OS_USER_DOMAIN_NAME?: string;
  OS_PROJECT_DOMAIN_ID?: string;
  OS_REGION_NAME?: string;
  OS_INTERFACE?: string;
  OS_PASSWORD?: string; // secret
  VPS_API_KEY?: string; // secret, guards private routes
  VPS_PRICING?: string; // JSON, see catalog.ts PricingConfig
  VPS_CATALOG_TTL?: string; // seconds, default 300
}

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const PREFIX = "/api/vps";

// One client per isolate so the Keystone token is reused across requests.
let client: OpenStackClient | null = null;
let clientKey = "";

export function getClient(env: VpsEnv): OpenStackClient {
  const cfg: OpenStackConfig = {
    authUrl: env.OS_AUTH_URL ?? "",
    username: env.OS_USERNAME ?? "",
    password: env.OS_PASSWORD ?? "",
    projectName: env.OS_PROJECT_NAME ?? "",
    userDomainName: env.OS_USER_DOMAIN_NAME || "Default",
    projectDomainId: env.OS_PROJECT_DOMAIN_ID || "default",
    region: env.OS_REGION_NAME || undefined,
    interface: env.OS_INTERFACE || "public",
  };
  const key = JSON.stringify(cfg);
  if (!client || key !== clientKey) {
    client = new OpenStackClient(cfg);
    clientKey = key;
  }
  return client;
}

async function buildCatalog(os: OpenStackClient, env: VpsEnv): Promise<VpsCatalog> {
  const pricing = parsePricing(env.VPS_PRICING);
  const [flavors, images, session] = await Promise.all([
    os.get<{ flavors: NovaFlavor[] }>("compute", "/flavors/detail"),
    listAllImages(os),
    os.getSession(),
  ]);
  const regions = new Set<string>();
  for (const e of session.catalog.find((c) => c.type === "compute")?.endpoints ?? []) {
    const r = e.region_id ?? e.region;
    if (r && e.interface === (env.OS_INTERFACE || "public")) regions.add(r);
  }
  return {
    source: "hostvds",
    currency: pricing.currency,
    generatedAt: new Date().toISOString(),
    regions: [...regions],
    flavors: mapFlavors(flavors.flavors, pricing),
    images: mapImages(images),
  };
}

// Glance paginates (default page size is often 25) and returns a `next` URI such as
// "/v2/images?marker=…" until the last page. Follow it, with a hard page cap.
const MAX_IMAGE_PAGES = 20;

async function listAllImages(os: OpenStackClient): Promise<GlanceImage[]> {
  const all: GlanceImage[] = [];
  let path: string | undefined = "/images?status=active&visibility=public&limit=200";
  for (let page = 0; path && page < MAX_IMAGE_PAGES; page++) {
    const res: { images: GlanceImage[]; next?: string } = await os.get("image", path);
    all.push(...res.images);
    path = res.next?.replace(/^\/v2(?=\/)/, "");
  }
  return all;
}

type Handler = (os: OpenStackClient, url: URL, params: Record<string, string>) => Promise<unknown>;

const privateRoutes: Array<[RegExp, Handler]> = [
  [
    /^\/servers$/,
    async (os, url) => {
      const qs = new URLSearchParams();
      for (const k of ["status", "name", "limit", "marker"]) {
        const v = url.searchParams.get(k);
        if (v) qs.set(k, v);
      }
      const q = qs.toString();
      const data = await os.get<{ servers: NovaServer[] }>("compute", `/servers/detail${q ? `?${q}` : ""}`);
      if (url.searchParams.get("raw") === "1") return data;
      const servers = data.servers.map(mapServer);
      return { count: servers.length, servers };
    },
  ],
  [
    /^\/servers\/(?<id>[0-9a-fA-F-]{36})$/,
    async (os, url, { id }) => {
      const data = await os.get<{ server: NovaServer }>("compute", `/servers/${id}`);
      return url.searchParams.get("raw") === "1" ? data : { server: mapServer(data.server) };
    },
  ],
  [/^\/flavors$/, (os) => os.get("compute", "/flavors/detail")],
  [/^\/limits$/, (os) => os.get("compute", "/limits")],
  [/^\/images$/, (os) => os.get("image", "/images?limit=500")],
  [/^\/networks$/, (os) => os.get("network", "/networks")],
  [/^\/endpoints$/, (os) => os.catalogSummary()],
];

export function isVpsRequest(url: URL): boolean {
  return url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`);
}

export async function handleVps(
  request: Request,
  env: VpsEnv,
  ctx: Ctx,
  cors: Record<string, string>,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.slice(PREFIX.length) || "/";
  const headers = { ...cors, "access-control-allow-headers": "authorization, x-api-key, content-type" };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, headers);
  if (path === "/" || path === "/health") return json({ ok: true, service: "hostvds" }, 200, headers);

  const missing = (["OS_AUTH_URL", "OS_USERNAME", "OS_PROJECT_NAME", "OS_PASSWORD"] as const).filter((k) => !env[k]);
  if (missing.length) return json({ error: "HostVDS not configured", missing }, 503, headers);

  try {
    if (path === "/catalog") {
      const ttl = Number(env.VPS_CATALOG_TTL ?? "300");
      return await cached(url, ttl, ctx, headers, () => buildCatalog(getClient(env), env));
    }

    if (!env.VPS_API_KEY) return json({ error: "VPS_API_KEY not set" }, 503, headers);
    if (!(await isAuthorized(request, env.VPS_API_KEY))) return json({ error: "Unauthorized" }, 401, headers);

    for (const [re, handler] of privateRoutes) {
      const m = re.exec(path);
      if (m) return json(await handler(getClient(env), url, m.groups ?? {}), 200, { ...headers, "cache-control": "no-store" });
    }
    return json({ error: "Not found" }, 404, headers);
  } catch (err) {
    if (err instanceof OpenStackError) {
      console.error(err.message, err.upstream);
      return json({ error: err.message }, err.status, headers);
    }
    console.error(err);
    return json({ error: "Internal error" }, 500, headers);
  }
}

/** Edge-cache a public JSON response (Cache API); `?fresh=1` bypasses the read. */
async function cached(
  url: URL,
  ttl: number,
  ctx: Ctx,
  headers: Record<string, string>,
  build: () => Promise<unknown>,
): Promise<Response> {
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : undefined;
  const key = new Request(`${url.origin}${url.pathname}`, { method: "GET" });
  if (cache && ttl > 0 && url.searchParams.get("fresh") !== "1") {
    const hit = await cache.match(key);
    if (hit) return withHeaders(hit, { ...headers, "x-cache": "HIT" });
  }
  const res = json(await build(), 200, { ...headers, "cache-control": `public, max-age=${Math.max(ttl, 0)}` });
  if (cache && ttl > 0) ctx.waitUntil(cache.put(key, res.clone()));
  return withHeaders(res, { "x-cache": "MISS" });
}

/** Bearer / X-API-Key check with a constant-time comparison (hash both sides first). */
export async function isAuthorized(request: Request, apiKey: string): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : request.headers.get("x-api-key") ?? "";
  if (!given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(apiKey)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function withHeaders(res: Response, headers: Record<string, string>): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  return out;
}
