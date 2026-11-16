import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import worker from "../index";

const env = { TRIPAY_PRIVATE_KEY: "priv-test-key", CALLBACK_SECRET: "cb-secret" };
const body = JSON.stringify({ merchant_ref: "BY-7-1712912345", status: "PAID", total_amount: 10000, amount_received: 10000 });
const sign = (b: string, k = env.TRIPAY_PRIVATE_KEY) => createHmac("sha256", k).update(b).digest("hex");
const req = (sig: string) =>
  new Request("https://api.boosteryuk.com/api/tripay/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Callback-Signature": sig, "X-Callback-Event": "payment_status" },
    body,
  });
// waitUntil menjalankan tugas latar → kumpulkan agar bisa ditunggu di test.
const pending: Promise<unknown>[] = [];
const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException() {} };

afterEach(() => { vi.unstubAllGlobals(); pending.length = 0; });

describe("Tripay callback", () => {
  it("menolak callback dengan signature palsu dan TIDAK meneruskan ke callback.php", async () => {
    const f = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", f);
    const res = await worker.fetch(req("deadbeef"), env as never, ctx as never);
    await Promise.allSettled(pending);
    expect(res.status).toBe(403);
    expect(f.mock.calls.some((c) => String(c[0]).includes("callback.php"))).toBe(false);
  });

  it("menolak bila signature dibuat dengan kunci lain", async () => {
    const f = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", f);
    const res = await worker.fetch(req(sign(body, "kunci-lain")), env as never, ctx as never);
    await Promise.allSettled(pending);
    expect(res.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it("meneruskan callback ber-signature valid ke callback.php dengan X-Callback-Secret", async () => {
    const f = vi.fn(async () => new Response('{"ok":true}'));
    vi.stubGlobal("fetch", f);
    const res = await worker.fetch(req(sign(body)), env as never, ctx as never);
    await Promise.allSettled(pending);
    expect(res.status).toBe(200);
    const call = f.mock.calls.find((c) => String(c[0]).includes("callback.php"));
    expect(call).toBeTruthy();
    const init = call![1] as RequestInit;
    expect((init.headers as Record<string, string>)["X-Callback-Secret"]).toBe("cb-secret");
    expect(init.body).toBe(body);
  });
});
