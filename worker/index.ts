export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      if (url.pathname.includes("/channels")) {
        const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
          headers: { Authorization: "Bearer " + String(env.TRIPAY_API_KEY).trim() }
        });
        const data = await res.text();
        return new Response(data, { headers: {...cors, "Content-Type": "application/json"} });
      }
      if (url.pathname.includes("/create")) {
        const b: any = await request.json();
        const amount = parseInt(b.amount);
        const merchant_ref = String(b.merchant_ref || "BY-" + Date.now()).trim();
        const merchant_code = String(env.TRIPAY_MERCHANT_CODE).trim();
        const privateKey = String(env.TRIPAY_PRIVATE_KEY).trim();
        const apiKey = String(env.TRIPAY_API_KEY).trim();
        let method = String(b.method || "QRIS").trim().toUpperCase();
        if (method === "QRIS2") method = "QRIS";
        const raw = merchant_code + merchant_ref + amount;
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(privateKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
        const signature = Array.from(new Uint8Array(sigBuf)).map(function(x){ return x.toString(16).padStart(2,"0"); }).join("");
        const payload = {
          method: method,
          merchant_ref: merchant_ref,
          amount: amount,
          customer_name: b.customer_name || "User",
          customer_email: b.customer_email || "user@boosteryuk.com",
          customer_phone: "08123456789",
          order_items: [{ sku: "DEP", name: "Deposit", price: amount, quantity: 1 }],
          callback_url: "https://boosteryuk.boosteryukid.workers.dev/api/tripay/callback",
          return_url: "https://boosteryuk.com",
          expired_time: Math.floor(Date.now()/1000) + 86400,
          signature: signature
        };
        const r = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const txt = await r.text();
        return new Response(txt, { status: r.status, headers: {...cors, "Content-Type": "application/json"} });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: {...cors, "Content-Type": "application/json"} });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {...cors, "Content-Type": "application/json"} });
    }
  }
}
