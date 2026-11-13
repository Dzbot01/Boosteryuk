/**
 * Child panel proxy — <sub>.boosteryuk.com → website utama di AeonFree.
 *
 * Alur:
 *   DNS  : *.boosteryuk.com  A 185.27.134.153 (Proxied)   ← sudah dibuat
 *   Route: *.boosteryuk.com/*  → Worker ini              ← ditambahkan di dashboard Cloudflare
 *   Worker:
 *     - host = api.boosteryuk.com / *.workers.dev  → TIDAK disentuh (endpoint lama tetap jalan)
 *     - host terdaftar sebagai "passthrough" (www, wa-origin, mail, …) → diteruskan apa adanya
 *     - host lain <sub>.boosteryuk.com            → child panel: request diteruskan ke
 *       https://boosteryuk.com (Host yang dikenal AeonFree) + header X-Child-Panel: <sub>
 *
 * AeonFree (iFastNet) hanya melayani hostname yang terdaftar di control panel dan tidak mendukung
 * wildcard, jadi Worker selalu meminta ke boosteryuk.com lalu memberi tahu PHP subdomain mana
 * yang diminta lewat header X-Child-Panel (dipakai tenant resolver di tahap berikutnya).
 *
 * Diagnostik: buka https://<sub>.boosteryuk.com/__child/health untuk melihat apakah AeonFree
 * menerima request dari Worker atau membalas halaman tantangan anti-bot (aes.js / __test).
 */

export interface ChildPanelEnv {
  /** Domain utama. Default boosteryuk.com */
  CHILD_PANEL_ROOT?: string;
  /** Origin yang dilayani AeonFree. Default https://<root> */
  CHILD_PANEL_ORIGIN?: string;
  /** Host milik Worker ini (endpoint lama), dipisah koma. Default api.<root> */
  CHILD_PANEL_API_HOSTS?: string;
  /** Subdomain yang BUKAN child panel & harus diteruskan apa adanya, dipisah koma. */
  CHILD_PANEL_PASSTHROUGH?: string;
}

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const DEFAULT_PASSTHROUGH = [
  "www", "wa-origin", "mail", "webmail", "smtp", "imap", "pop", "ftp", "cpanel", "vpanel",
  "ns1", "ns2", "autodiscover", "autoconfig", "_dmarc", "status",
];
/** Nama yang tidak boleh dipakai child panel walau belum ada recordnya. */
export const RESERVED_SUBDOMAINS = new Set([
  ...DEFAULT_PASSTHROUGH, "api", "admin", "app", "dashboard", "panel", "static", "cdn", "assets", "dev", "test", "staging",
]);
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

const list = (v: string | undefined, def: string[]) =>
  (v ? v.split(",") : def).map((s) => s.trim().toLowerCase()).filter(Boolean);

function rootOf(env: ChildPanelEnv) {
  return (env.CHILD_PANEL_ROOT || "boosteryuk.com").toLowerCase();
}

export type HostKind =
  | { kind: "worker" } // api.boosteryuk.com, *.workers.dev, localhost → alur endpoint lama
  | { kind: "passthrough" } // www, wa-origin, root, sub bertingkat → teruskan apa adanya
  | { kind: "child"; sub: string };

/** Klasifikasi hostname request. Murni (tanpa I/O) agar mudah diuji. */
export function classifyHost(hostname: string, env: ChildPanelEnv = {}): HostKind {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const root = rootOf(env);
  const apiHosts = list(env.CHILD_PANEL_API_HOSTS, [`api.${root}`]);
  if (apiHosts.includes(host)) return { kind: "worker" };
  if (host !== root && !host.endsWith(`.${root}`)) return { kind: "worker" }; // workers.dev, localhost, dll
  if (host === root) return { kind: "passthrough" };
  const sub = host.slice(0, -(root.length + 1));
  const passthrough = list(env.CHILD_PANEL_PASSTHROUGH, DEFAULT_PASSTHROUGH);
  if (sub.includes(".") || passthrough.includes(sub) || !SUB_RE.test(sub)) return { kind: "passthrough" };
  if (RESERVED_SUBDOMAINS.has(sub)) return { kind: "passthrough" };
  return { kind: "child", sub };
}

/** Deteksi halaman tantangan anti-bot iFastNet/AeonFree (aes.js + cookie __test). */
export function isChallengeHtml(contentType: string | null, body: string): boolean {
  if (!contentType || !contentType.includes("text/html")) return false;
  return /aes\.js/i.test(body) && /__test=/i.test(body);
}

// Header yang TIDAK boleh diteruskan ke AeonFree. Penting: iFastNet memakai X-Forwarded-Host /
// Forwarded untuk memilih domain → host child panel yang tak terdaftar dianggap "Domain Suspended".
const HOP_HEADERS = [
  "host", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor", "cf-worker", "x-real-ip",
  "x-forwarded-host", "x-forwarded-for", "x-forwarded-proto", "x-forwarded-server", "forwarded", "x-original-host", "x-host",
  "connection", "keep-alive", "transfer-encoding", "upgrade",
];

function originUrl(env: ChildPanelEnv, url: URL) {
  const origin = (env.CHILD_PANEL_ORIGIN || `https://${rootOf(env)}`).replace(/\/+$/, "");
  return origin + url.pathname + url.search;
}

async function buildOriginRequest(request: Request, env: ChildPanelEnv, sub: string, url: URL): Promise<Request> {
  const headers = new Headers(request.headers);
  for (const h of HOP_HEADERS) headers.delete(h);
  // Tenant hanya dikirim lewat header khusus (bukan X-Forwarded-Host, lihat HOP_HEADERS).
  headers.set("X-Child-Panel", sub);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("X-Child-Client-IP", ip);
  const hasBody = !["GET", "HEAD"].includes(request.method);
  // Body di-buffer (request panel kecil) agar kompatibel di runtime Workers & Node (tes).
  return new Request(originUrl(env, url), {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });
}

/** Sesuaikan header respons agar cookie & redirect tetap di subdomain child panel. */
function adaptResponse(res: Response, env: ChildPanelEnv, childHost: string, sub: string): Response {
  const root = rootOf(env);
  const out = new Response(res.body, res);
  const loc = out.headers.get("location");
  if (loc) {
    out.headers.set("location", loc.replace(new RegExp(`^https?://(www\\.)?${root.replace(/\./g, "\\.")}(?=/|$)`, "i"), `https://${childHost}`));
  }
  // Cookie dari origin: hapus atribut Domain agar menempel ke host child panel.
  const cookies = typeof (out.headers as any).getSetCookie === "function" ? (out.headers as any).getSetCookie() as string[] : [];
  if (cookies.length) {
    out.headers.delete("set-cookie");
    for (const c of cookies) out.headers.append("set-cookie", c.replace(/;\s*domain=[^;]*/gi, ""));
  }
  out.headers.set("X-Child-Panel", sub);
  return out;
}

/** Sisipkan penanda tenant ke HTML (dibaca frontend di tahap berikutnya). */
function injectTenant(res: Response, sub: string): Response {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html") || typeof HTMLRewriter === "undefined") return res;
  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.prepend(
          `<meta name="x-child-panel" content="${sub}"><script>window.__CHILD_PANEL__=${JSON.stringify(sub)}</script>`,
          { html: true },
        );
      },
    })
    .transform(res);
}

/**
 * Ganti URL absolut domain utama di dalam HTML menjadi host child panel. Penting untuk halaman
 * tantangan AeonFree (aes.js) yang berisi `location.href="https://boosteryuk.com/?i=1"` — tanpa
 * ini browser terlempar ke domain utama. Juga berlaku untuk og:url/canonical index.html.
 * Hanya HTML (kecil); JS/CSS/gambar tidak disentuh.
 */
export function rewriteHostsInHtml(html: string, root: string, childHost: string): string {
  const r = root.replace(/\./g, "\\.");
  return html
    .replace(new RegExp(`https?://(?:www\\.)?${r}(?=[/"'\\s?#<]|$)`, "gi"), `https://${childHost}`)
    .replace(new RegExp(`https?:\\\\/\\\\/(?:www\\.)?${r}(?=\\\\/|["'?#]|$)`, "gi"), `https:\\/\\/${childHost}`);
}

async function rewriteHtml(res: Response, env: ChildPanelEnv, childHost: string): Promise<Response> {
  const ct = res.headers.get("content-type") || "";
  const len = Number(res.headers.get("content-length") || "0");
  if (!ct.includes("text/html") || len > 2_000_000) return res;
  const body = rewriteHostsInHtml(await res.text(), rootOf(env), childHost);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(body, { status: res.status, statusText: res.statusText, headers });
}

const CACHEABLE = /^\/(assets\/|ornaments\/|favicon|apple-touch-icon|og-image|world\.png|.*\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|mp3)$)/i;

/** Aset statis di-cache di edge Cloudflare — mengurangi hit ke AeonFree. Halaman tantangan tidak pernah di-cache. */
async function fetchCached(req: Request, ctx: Ctx | undefined): Promise<Response> {
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  const key = new Request(req.url, { method: "GET" });
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const res = await fetch(req);
  const ct = res.headers.get("content-type") || "";
  if (cache && res.status === 200 && !ct.includes("text/html")) {
    const copy = new Response(res.clone().body, res);
    copy.headers.set("Cache-Control", "public, max-age=86400");
    ctx?.waitUntil(cache.put(key, copy));
  }
  return res;
}

/** Redirect origin ke domain lain (mis. suspended-domain.net) = domain tidak dikenali hosting. */
export function foreignRedirect(res: Response, env: ChildPanelEnv, childHost: string): string | null {
  const loc = res.headers.get("location");
  if (!loc || res.status < 300 || res.status >= 400) return null;
  try {
    const host = new URL(loc, `https://${childHost}`).hostname.toLowerCase();
    const root = rootOf(env);
    return host === root || host.endsWith(`.${root}`) ? null : host;
  } catch {
    return null;
  }
}

async function health(request: Request, env: ChildPanelEnv, sub: string, url: URL): Promise<Response> {
  const probes: Record<string, unknown> = {};
  for (const path of ["/", "/api/site_settings.php"]) {
    const t0 = Date.now();
    try {
      // Header sama persis dengan proxy sungguhan (agar hasil tes mewakili pengunjung asli).
      const probeUrl = new URL(path, url);
      const r = await fetch(await buildOriginRequest(new Request(probeUrl, { headers: request.headers }), env, sub, probeUrl));
      const body = await r.text();
      probes[path] = {
        status: r.status,
        location: r.headers.get("location"),
        foreignRedirect: foreignRedirect(r, env, url.host),
        contentType: r.headers.get("content-type"),
        challenge: isChallengeHtml(r.headers.get("content-type"), body),
        bytes: body.length,
        ms: Date.now() - t0,
      };
    } catch (e) {
      probes[path] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  const blocked = Object.values(probes).some((p: any) => p.challenge || p.error || p.foreignRedirect || (p.status && p.status >= 500));
  return new Response(
    JSON.stringify({
      ok: !blocked,
      sub,
      host: url.host,
      origin: env.CHILD_PANEL_ORIGIN || `https://${rootOf(env)}`,
      probes,
      verdict: blocked
        ? "AeonFree menolak/menantang request dari Worker (lihat probes). Proxy server-side tidak bisa dipakai — perlu arsitektur alternatif."
        : "Worker dapat mengambil halaman & API dari AeonFree. Proxy child panel siap dipakai.",
    }, null, 2),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
  );
}

/** Tangani request child panel. */
export async function handleChildPanel(request: Request, env: ChildPanelEnv, ctx: Ctx | undefined, sub: string): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/__child/health") return health(request, env, sub, url);

  const originReq = await buildOriginRequest(request, env, sub, url);
  try {
    const res = request.method === "GET" && CACHEABLE.test(url.pathname) ? await fetchCached(originReq, ctx) : await fetch(originReq);
    const foreign = foreignRedirect(res, env, url.host);
    if (foreign) {
      // Jangan lempar pengunjung ke halaman hosting (mis. suspended-domain.net).
      return new Response(
        `<!doctype html><meta charset="utf-8"><title>Child panel belum siap</title><p>Panel ini sedang tidak tersedia. Silakan coba lagi nanti.</p>`,
        { status: 502, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Child-Panel": sub, "X-Child-Error": `origin redirect to ${foreign}` } },
      );
    }
    const adapted = await rewriteHtml(adaptResponse(res, env, url.host, sub), env, url.host);
    return injectTenant(adapted, sub);
  } catch (e) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Child panel tidak tersedia</title><p>Server utama tidak bisa dihubungi. Coba lagi beberapa saat.</p>`,
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8", "X-Child-Panel": sub, "X-Child-Error": e instanceof Error ? e.message.slice(0, 120) : "fetch failed" } },
    );
  }
}

/**
 * Pintu masuk dari worker/index.ts. Mengembalikan null bila request BUKAN urusan child panel
 * (api.boosteryuk.com, workers.dev, localhost) sehingga alur endpoint lama berjalan seperti biasa.
 */
export async function routeByHost(request: Request, env: ChildPanelEnv, ctx: Ctx | undefined): Promise<Response | null> {
  const kind = classifyHost(new URL(request.url).hostname, env);
  if (kind.kind === "worker") return null;
  if (kind.kind === "passthrough") return fetch(request); // www, wa-origin (tunnel bot), dll — tidak diubah
  return handleChildPanel(request, env, ctx, kind.sub);
}
