import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../index";
import { classifyHost, isChallengeHtml, rewriteHostsInHtml, routeByHost } from "../childpanel/proxy";

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

describe("rewriteHostsInHtml", () => {
  it("keeps the AeonFree challenge redirect on the child host", () => {
    const page = '<script>document.cookie="__test=x; path=/"; location.href="https://boosteryuk.com/?i=1";</script>';
    expect(rewriteHostsInHtml(page, "boosteryuk.com", "tes1.boosteryuk.com")).toContain('location.href="https://tes1.boosteryuk.com/?i=1"');
  });
  it("rewrites escaped and www URLs but not other subdomains", () => {
    const html = '<a href="http://www.boosteryuk.com/x">a</a> "https:\\/\\/boosteryuk.com\\/y" https://api.boosteryuk.com/z https://boosteryuk.com';
    const out = rewriteHostsInHtml(html, "boosteryuk.com", "t.boosteryuk.com");
    expect(out).toContain('href="https://t.boosteryuk.com/x"');
    expect(out).toContain('"https:\\/\\/t.boosteryuk.com\\/y"');
    expect(out).toContain("https://api.boosteryuk.com/z");
    expect(out.endsWith("https://t.boosteryuk.com")).toBe(true);
  });
});

describe("routeByHost", () => {
  it("rewrites the challenge page served through the proxy", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      '<html><script src="/aes.js"></script><script>location.href="https://boosteryuk.com/?i=1";</script></html>',
      { headers: { "content-type": "text/html; charset=UTF-8", "content-length": "120" } })));
    const res = (await routeByHost(new Request("https://tes1.boosteryuk.com/"), {}, ctx))!;
    const body = await res.text();
    expect(body).toContain('location.href="https://tes1.boosteryuk.com/?i=1"');
    expect(body).not.toContain('"https://boosteryuk.com');
    expect(res.headers.get("content-length")).toBeNull();
  });


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
      headers: { "content-type": "application/json", cookie: "__test=abc", "cf-connecting-ip": "1.2.3.4", "x-forwarded-host": "toko1.boosteryuk.com", forwarded: "host=toko1.boosteryuk.com" },
      body: '{"email":"a"}',
    });
    const res = (await routeByHost(req, {}, ctx))!;
    expect(seen!.url).toBe("https://boosteryuk.com/api/login.php?x=1");
    expect(seen!.method).toBe("POST");
    expect(await seen!.text()).toBe('{"email":"a"}');
    expect(seen!.headers.get("x-child-panel")).toBe("toko1");
    // iFastNet memilih domain dari X-Forwarded-Host -> tidak boleh dikirim (penyebab "Domain Suspended")
    expect(seen!.headers.get("x-forwarded-host")).toBeNull();
    expect(seen!.headers.get("x-forwarded-for")).toBeNull();
    expect(seen!.headers.get("x-child-client-ip")).toBe("1.2.3.4");
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

  it("never forwards visitors to the hosting's suspended page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://suspended-domain.net/" } })));
    const res = (await routeByHost(new Request("https://tes1.boosteryuk.com/"), {}, ctx))!;
    expect(res.status).toBe(502);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-child-error")).toContain("suspended-domain.net");
  });

  it("health flags a foreign redirect and probes with the real proxy headers", async () => {
    const seen: Request[] = [];
    vi.stubGlobal("fetch", vi.fn(async (r: Request) => {
      seen.push(r);
      return new Response(null, { status: 302, headers: { location: "https://suspended-domain.net/" } });
    }));
    const res = (await routeByHost(new Request("https://tes1.boosteryuk.com/__child/health", { headers: { "x-forwarded-host": "x" } }), {}, ctx))!;
    const j: any = await res.json();
    expect(j.ok).toBe(false);
    expect(j.probes["/"].foreignRedirect).toBe("suspended-domain.net");
    expect(seen[0].headers.get("x-forwarded-host")).toBeNull();
    expect(seen[0].headers.get("x-child-panel")).toBe("tes1");
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
