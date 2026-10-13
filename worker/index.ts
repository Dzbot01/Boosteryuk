export default {
  async fetch(request: Request, env: any, ctx: any) {
    const cors = {
      "Access-Control-Allow-Origin": "https://boosteryuk.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Callback-Signature, X-Callback-Secret, Authorization, X-Callback-Event",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    try {
      // 1. GET PAYMENT CHANNELS
      if (url.pathname.includes("/channels")) {
        const r = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
          headers: { Authorization: "Bearer " + String(env.TRIPAY_API_KEY).trim() }
        });
        const txt = await r.text();
        return new Response(txt, { status: r.status, headers: {...cors, "Content-Type": "application/json" } });
      }

      // 2. CREATE TRANSACTION - FIXED
      if (url.pathname.includes("/create")) {
        const b: any = await request.json();
        const amount = parseInt(b.amount);
        
        // FIX UTAMA: support camelCase & snake_case
        const merchant_ref = String(b.merchant_ref || b.merchantRef || "BY-" + Date.now()).trim();
        const customer_name = String(b.customer_name || b.customerName || "User").trim();
        const customer_email = String(b.customer_email || b.customerEmail || "user@boosteryuk.com").trim();

        const merchant_code = String(env.TRIPAY_MERCHANT_CODE).trim();
        const privateKey = String(env.TRIPAY_PRIVATE_KEY).trim();
        const apiKey = String(env.TRIPAY_API_KEY).trim();

        let method = String(b.method || "QRIS").trim().toUpperCase();
        if (method === "QRIS2") method = "QRIS";

        console.log("CREATE:", merchant_ref, "USER:", b.user_id, amount, method);

        const raw = merchant_code + merchant_ref + amount;
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(privateKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
        const signature = Array.from(new Uint8Array(sigBuf)).map(x => x.toString(16).padStart(2, "0")).join("");

        const payload = {
          method,
          merchant_ref,
          amount,
          customer_name,
          customer_email,
          customer_phone: b.customer_phone || b.customerPhone || "08123456789",
          order_items: [{ sku: "DEP", name: "Deposit Saldo", price: amount, quantity: 1 }],
          callback_url: "https://api.boosteryuk.com/api/callback.php",
          return_url: "https://boosteryuk.com/deposit",
          expired_time: Math.floor(Date.now() / 1000) + 86400,
          signature
        };

        const r = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const txt = await r.text();
        return new Response(txt, { status: r.status, headers: {...cors, "Content-Type": "application/json" } });
      }

      // 3. CALLBACK - FORWARD KE PHP
      if (url.pathname.includes("/callback")) {
        if (request.method === "GET") {
          return new Response(JSON.stringify({ success: true, msg: "callback active" }), { headers: {...cors, "Content-Type": "application/json" } });
        }
        
        const bodyText = await request.text();
        const tripaySignature = request.headers.get("x-callback-signature") || "";

        const forwardTask = async () => {
          try {
            const f = await fetch("https://boosteryuk.com/api/callback.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Callback-Signature": tripaySignature,
                "X-Callback-Event": request.headers.get("x-callback-event") || "payment_status",
              },
              body: bodyText
            });
            console.log("Forward to callback.php:", f.status, await f.text());
          } catch (e: any) { 
            console.log("Forward Error:", e.message); 
          }
        };

        if (ctx?.waitUntil) ctx.waitUntil(forwardTask());
        else await forwardTask();

        return new Response(JSON.stringify({ success: true }), { headers: {...cors, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ ok: true, message: "Worker Active" }), { headers: {...cors, "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {...cors, "Content-Type": "application/json" } });
    }
  }
}