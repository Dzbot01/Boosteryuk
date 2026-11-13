import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../index";
import { classifyHost, isChallengeHtml, routeByHost } from "../childpanel/proxy";

const ctx = { waitUntil() {}, passThroughOnException() {} };
afterEach(() => vi.unstubAllGlobals());

describe("classifyHost", () => {
  it.each([
    ["api.boosteryuk.com", { kind: "worker" }],
    ["boosteryuk.boosteryukid.workers.dev", { kind: "worker" }],
    ["localhost", { kind: "worker" }],
    ["boosteryuk.com", { kind: "passthrough" }],
    ["www.boosteryuk.com", { kind: "passthrough" }],
    ["wa-origin.boosteryuk.com", { kind: "passthrough" }],
    ["admin.boosteryuk.com", { kind: "passthrough" }],
    ["a.b.boosteryuk.com", { kind: "passthrough" }],
    ["-bad.boosteryuk.com", { kind: "passthrough" }],
    ["toko1.boosteryuk.com", { kind: "child", sub: "toko1" }],
    ["Guri-Store.BoosterYuk.com", { kind: "child", sub: "guri-store" }],
  ])("%s", (host, expected) => {
    expect(classifyHost(host)).toEqual(expected);
  });

  it("honours env overrides", () => {
    expect(classifyHost("panel.example.id", { CHILD_PANEL_ROOT: "example.id" })).toEqual({ kind: "passthrough" });
    expect(classifyHost("shop.example.id", { CHILD_PANEL_ROOT: "example.id" })).toEqual({ kind: "child", sub: "shop" });
    expect(classifyHost("toko1.boosteryuk.com", { CHILD_PANEL_PASSTHROUGH: "toko1" })).toEqual({ kind: "passthrough" });
  });
});

describe("isChallengeHtml", () => {
  it("detects the aes.js / __test page only in HTML", () => {
    const page = '<html><script src="/aes.js"></script><script>document.cookie="__test="+x</script></html>';
    expect(isChallengeHtml("text/html; charset=UTF-8", page)).toBe(true);
    expect(isChallengeHtml("application/json", page)).toBe(false);
    expect(isChallengeHtml("text/html", "<html>ok</html>")).toBe(false);
  });
});

describe("routeByHost", () => {
  it("returns null for the worker's own API host (old endpoints untouched)", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await routeByHost(new Request("https://api.boosteryuk.com/api/email/send"), {}, ctx)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("passes reserved hosts (bot tunnel) straight through", async () => {
    const f = vi.fn(async () => new Response("tunnel"));
    vi.stubGlobal("fetch", f);
    const req = new Request("https://wa-origin.boosteryuk.com/session/1", { method: "POST", body: "{}" });
    const res = await routeByHost(req, {}, ctx);
    expect(await res!.text()).toBe("tunnel");
    expect(f).toHaveBeenCalledWith(req);
  });

  it("proxies a child subdomain to the main origin with tenant header", async () => {
    let seen: Request | undefined;
    vi.stubGlobal("fetch", vi.fn(async (r: Request) => {
      seen = r;
      const h = new Headers({ "content-type": "application/json", location: "https://boosteryuk.com/overview" });
      h.append("set-cookie", "__test=abc; Domain=boosteryuk.com; Path=/");
      return new Response('{"ok":true}', { status: 302, headers: h });
    }));
    const req = new Request("https://toko1.boosteryuk.com/api/login.php?x=1", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "__test=abc", "cf-connecting-ip": "1.2.3.4" },
      body: '{"email":"a"}',
    });
    const res = (await routeByHost(req, {}, ctx))!;
    expect(seen!.url).toBe("https://boosteryuk.com/api/login.php?x=1");
    expect(seen!.method).toBe("POST");
    expect(await seen!.text()).toBe('{"email":"a"}');
    expect(seen!.headers.get("x-child-panel")).toBe("toko1");
    expect(seen!.headers.get("x-forwarded-host")).toBe("toko1.boosteryuk.com");
    expect(seen!.headers.get("x-forwarded-for")).toBe("1.2.3.4");
    expect(seen!.headers.get("cookie")).toBe("__test=abc");
    expect(seen!.redirect).toBe("manual");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://toko1.boosteryuk.com/overview");
    expect(res.headers.get("set-cookie")).not.toMatch(/domain=/i);
    expect(res.headers.get("x-child-panel")).toBe("toko1");
  });

  it("health endpoint reports the AeonFree challenge as blocked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response('<script src="/aes.js"></script>document.cookie="__test=1"', { headers: { "content-type": "text/html" } })));
    const res = (await routeByHost(new Request("https://toko1.boosteryuk.com/__child/health"), {}, ctx))!;
    const j: any = await res.json();
    expect(j.ok).toBe(false);
    expect(j.probes["/"].challenge).toBe(true);
  });

  it("returns a friendly 502 when the origin is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connect timeout"); }));
    const res = (await routeByHost(new Request("https://toko1.boosteryuk.com/"), {}, ctx))!;
    expect(res.status).toBe(502);
    expect(res.headers.get("x-child-panel")).toBe("toko1");
  });
});

describe("worker entry keeps old behaviour on api host", () => {
  it("root of api.boosteryuk.com still answers Worker OK without proxying", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const res = await worker.fetch(new Request("https://api.boosteryuk.com/"), {}, ctx);
    const j: any = await res.json();
    expect(j.status).toBe(true);
    expect(j.msg).toBe("Worker OK");
    expect(f).not.toHaveBeenCalled();
  });

  it("child subdomain goes through the proxy, not the old routes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>home</html>", { headers: { "content-type": "text/html" } })));
    const res = await worker.fetch(new Request("https://toko1.boosteryuk.com/api/telegram/link"), {}, ctx);
    expect(res.headers.get("x-child-panel")).toBe("toko1");
  });
});
