import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../index";
import { OpenStackClient } from "../hostvds/openstack";
import { mapServer, type NovaServer } from "../hostvds/mappers";
import { mapImage, mapFlavors, parsePricing, DEFAULT_PRICING, type NovaFlavor } from "../hostvds/catalog";

const env = {
  OS_AUTH_URL: "https://os-api.example/identity",
  OS_PROJECT_NAME: "proj",
  OS_USERNAME: "user",
  OS_USER_DOMAIN_NAME: "Default",
  OS_PROJECT_DOMAIN_ID: "default",
  OS_REGION_NAME: "eu-west2",
  OS_INTERFACE: "public",
  VPS_CATALOG_TTL: "0",
  OS_PASSWORD: "secret-pw",
  VPS_API_KEY: "test-key",
};

const ctx = { waitUntil() {}, passThroughOnException() {} };
const SERVER_ID = "11111111-2222-3333-4444-555555555555";

const catalog = [
  {
    type: "compute",
    name: "nova",
    endpoints: [
      { interface: "public", region_id: "eu-west1", url: "https://wrong.example/compute/v2.1" },
      { interface: "public", region_id: "eu-west2", url: "https://os-api.example/compute/v2.1/" },
      { interface: "internal", region_id: "eu-west2", url: "https://internal.example/compute/v2.1" },
    ],
  },
  { type: "network", endpoints: [{ interface: "public", region_id: "eu-west2", url: "https://os-api.example/networking" }] },
  { type: "image", endpoints: [{ interface: "public", region_id: "eu-west2", url: "https://os-api.example/image" }] },
];

const novaServer: NovaServer = {
  id: SERVER_ID,
  name: "vps-1",
  status: "ACTIVE",
  created: "2026-10-01T00:00:00Z",
  updated: "2026-10-02T00:00:00Z",
  key_name: "mykey",
  image: { id: "img-1" },
  flavor: { original_name: "small", vcpus: 2, ram: 2048, disk: 40 },
  addresses: { public: [{ addr: "203.0.113.10", version: 4 }, { addr: "2001:db8::10", version: 6 }] },
  "OS-EXT-STS:power_state": 1,
  "OS-EXT-STS:vm_state": "active",
  "OS-EXT-STS:task_state": null,
};

const flavors: NovaFlavor[] = [
  { id: "f-big", name: "vds-4-8", vcpus: 4, ram: 8192, disk: 80 },
  { id: "f-small", name: "vds-1-1", vcpus: 1, ram: 1024, disk: 10 },
  { id: "f-off", name: "old", vcpus: 1, ram: 512, disk: 5, "OS-FLV-DISABLED:disabled": true },
  { id: "f-priv", name: "priv", vcpus: 1, ram: 512, disk: 5, "os-flavor-access:is_public": false },
];

const glance = [
  { id: "i-u24", name: "Ubuntu 24.04", status: "active", os_distro: "ubuntu", os_version: "24.04" },
  { id: "i-u22", name: "Ubuntu 22.04", status: "active" },
  { id: "i-dock", name: "Docker CE", status: "active" },
  { id: "i-q", name: "Debian 13", status: "queued" },
];

function keystoneResponse(expiresInMs = 3600_000) {
  return new Response(
    JSON.stringify({ token: { expires_at: new Date(Date.now() + expiresInMs).toISOString(), project: { id: "p-1" }, catalog } }),
    { status: 201, headers: { "x-subject-token": "tok-123", "content-type": "application/json" } },
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/v3/auth/tokens")) return keystoneResponse();
    if (url.startsWith("https://os-api.example/compute/v2.1/servers/detail")) return Response.json({ servers: [novaServer] });
    if (url === `https://os-api.example/compute/v2.1/servers/${SERVER_ID}`) return Response.json({ server: novaServer });
    if (url === "https://os-api.example/compute/v2.1/flavors/detail") return Response.json({ flavors });
    if (url.startsWith("https://os-api.example/image/v2/images?marker=p2")) return Response.json({ images: glance.slice(2) });
    if (url.startsWith("https://os-api.example/image/v2/images"))
      return Response.json({ images: glance.slice(0, 2), next: "/v2/images?marker=p2&status=active&visibility=public" });
    if (url === "https://os-api.example/networking/v2.0/networks") return Response.json({ networks: [] });
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const call = (path: string, key: string | null = "test-key", e: Record<string, string> = env) =>
  worker.fetch(new Request(`https://w.example${path}`, { headers: key ? { authorization: `Bearer ${key}` } : {} }), e, ctx);

describe("existing worker routes still work", () => {
  it("default response unchanged for unknown paths", async () => {
    const res = await call("/api/something", null);
    expect(await res.json()).toEqual({ ok: true, message: "Worker Active" });
  });
});

describe("/api/vps/catalog (public)", () => {
  it("returns priced public flavors, active images and regions without an API key", async () => {
    const res = await call("/api/vps/catalog", null);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.flavors.map((f: any) => f.id)).toEqual(["f-small", "f-big"]);
    expect(body.flavors[0]).toMatchObject({ vcpus: 1, ramMb: 1024, diskGb: 10, priceSource: "formula" });
    expect(body.images.map((i: any) => i.id)).toEqual(["i-u24", "i-u22", "i-dock"]);
    expect(body.images[2]).toMatchObject({ distro: "docker", kind: "app", version: "CE" });
    expect(body.regions).toEqual(["eu-west1", "eu-west2"]);
    const glanceCall = fetchMock.mock.calls.find(([u]) => String(u).includes("/image/v2/images"))!;
    expect(String(glanceCall[0])).toContain("visibility=public");
    // second Glance page fetched via the `next` link
    expect(fetchMock.mock.calls.some(([u]) => String(u) === "https://os-api.example/image/v2/images?marker=p2&status=active&visibility=public")).toBe(true);
  });

  it("503 when HostVDS secrets are missing", async () => {
    const { OS_PASSWORD: _omit, ...rest } = env;
    const res = await call("/api/vps/catalog", null, rest as any);
    expect(res.status).toBe(503);
  });
});

describe("/api/vps private routes", () => {
  it("require the API key", async () => {
    expect((await call("/api/vps/servers", null)).status).toBe(401);
    expect((await call("/api/vps/servers", "nope")).status).toBe(401);
  });

  it("lists servers via the region-matched compute endpoint", async () => {
    const res = await call("/api/vps/servers?status=ACTIVE");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.servers[0]).toMatchObject({ powerState: "RUNNING", ipv4: ["203.0.113.10"], ipv6: ["2001:db8::10"] });
    const novaCall = fetchMock.mock.calls.find(([u]) => String(u).includes("/servers/detail"))!;
    expect(String(novaCall[0])).toBe("https://os-api.example/compute/v2.1/servers/detail?status=ACTIVE");
    expect((novaCall[1]!.headers as Record<string, string>)["openstack-api-version"]).toBe("compute 2.47");
  });

  it("server detail + 404s", async () => {
    expect((await call(`/api/vps/servers/${SERVER_ID}`)).status).toBe(200);
    expect((await call("/api/vps/servers/not-a-uuid")).status).toBe(404);
    expect((await call("/api/vps/nope")).status).toBe(404);
  });

  it("network failure -> 502 and no password leak", async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError("fetch failed");
    });
    const res = await call("/api/vps/servers", "test-key", { ...env, OS_USERNAME: "net-fail" });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("secret-pw");
  });

  it("Keystone rejection -> 502", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("bad creds", { status: 401 }));
    const res = await call("/api/vps/networks", "test-key", { ...env, OS_USERNAME: "bad-creds" });
    expect(res.status).toBe(502);
  });
});

describe("OpenStackClient", () => {
  const cfg = {
    authUrl: "https://os-api.example/identity/",
    username: "u",
    password: "p",
    projectName: "proj",
    userDomainName: "Default",
    projectDomainId: "default",
    region: "eu-west2",
    interface: "public",
  };
  const authCalls = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter(([u]) => String(u).endsWith("/v3/auth/tokens"));

  it("authenticates once under concurrency and sends a scoped v3 body", async () => {
    const c = new OpenStackClient(cfg, fetchMock as unknown as typeof fetch);
    await Promise.all([c.getSession(), c.getSession(), c.getSession()]);
    expect(authCalls(fetchMock)).toHaveLength(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body));
    expect(body.auth.scope.project).toEqual({ name: "proj", domain: { id: "default" } });
  });

  it("re-authenticates near expiry and retries once on 401", async () => {
    fetchMock.mockImplementationOnce(async () => keystoneResponse(60_000));
    const c = new OpenStackClient(cfg, fetchMock as unknown as typeof fetch);
    await c.getSession();
    await c.getSession();
    expect(authCalls(fetchMock)).toHaveLength(2);

    let first = true;
    const f = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/v3/auth/tokens")) return keystoneResponse();
      if (first) {
        first = false;
        return new Response("expired", { status: 401 });
      }
      return Response.json({ flavors: [] });
    });
    const c2 = new OpenStackClient(cfg, f as unknown as typeof fetch);
    await expect(c2.get("compute", "/flavors/detail")).resolves.toEqual({ flavors: [] });
    expect(authCalls(f)).toHaveLength(2);
  });
});

describe("catalog mapping", () => {
  it("pricing: per-flavor override beats formula, minimum applies, bad JSON falls back", () => {
    const pricing = parsePricing('{"flavors":{"vds-4-8":9.99}}');
    const out = mapFlavors(flavors.slice(0, 2), pricing);
    expect(out.find((f) => f.id === "f-big")).toMatchObject({ monthly: 9.99, priceSource: "flavor" });
    expect(out.find((f) => f.id === "f-small")!.monthly).toBe(1.7);
    expect(parsePricing("{oops")).toBe(DEFAULT_PRICING);
  });

  it("image name parsing", () => {
    expect(mapImage({ id: "1", name: "Rocky-9.6", status: "active" })).toMatchObject({ distro: "rocky", version: "9.6", kind: "os" });
    expect(mapImage({ id: "2", name: "Arch", status: "active" })).toMatchObject({ distro: "arch", version: "latest" });
  });

  it("mapServer handles boot-from-volume and old microversion", () => {
    const m = mapServer({ ...novaServer, image: "", flavor: { id: "f-1" }, "OS-EXT-STS:power_state": 4 });
    expect(m).toMatchObject({ imageId: null, powerState: "SHUTDOWN", flavor: { name: "f-1" } });
  });
});
