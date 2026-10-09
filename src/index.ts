export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // CORS WAJIB - BIAR GAK FAILED TO FETCH
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CALLBACK-SIGNATURE, X-Callback-Signature"
    };

    // Preflight - ini yang bikin 405 kemarin
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    console.log(`${request.method} ${url.pathname}`);

    try {
      // 1. LIST CHANNEL
      if (url.pathname.includes("/channels") && request.method === "GET") {
        const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
          headers: { Authorization: `Bearer ${env.TRIPAY_API_KEY}` }
        });
        const data = await res.text();
        return new Response(data, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 2. CREATE TRANSACTION - INI INTINYA
      // TERIMA 2 ROUTE: /create DAN /create-transaction
      if ((url.pathname.includes("/create-transaction") || url.pathname.includes("/create")) && request.method === "POST") {
        const body: any = await request.json();
        const amount = Number(body.amount);
        const merchant_ref = body.merchant_ref || body.order_id || `BY-${Date.now()}`;
        
        // FIX QRIS2 -> QRIS, biar semua channel bank tetep jalan
        let method = body.method;
        if (!method) throw new Error("method kosong");
        method = method.toUpperCase();
        if (method === "QRIS2") method = "QRIS";

        // Signature: HMAC SHA256(private_key, merchant_ref + amount)
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(env.TRIPAY_PRIVATE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(merchant_ref + amount));
        const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const payload = {
          method,
          merchant_ref,
          amount,
          customer_name: body.customer_name || "Boosteryuk User",
          customer_email: body.customer_email || "user@boosteryuk.com",
          customer_phone: body.customer_phone || "08123456789",
          order_items: body.order_items || [{ sku: "DEPOSIT", name: `Deposit ${method}`, price: amount, quantity: 1 }],
          return_url: "https://boosteryuk.com",
          callback_url: "https://boosteryuk.boosteryukid.workers.dev/api/tripay/callback",
          expired_time: Math.floor(Date.now()/1000) + 86400,
          signature
        };

        const tripayRes = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.TRIPAY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await tripayRes.text();
        return new Response(result, { status: tripayRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 3. CALLBACK
      if (url.pathname.includes("/callback")) {
        const text = await request.text();
        console.log("CALLBACK:", text);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: false, message: `Route not found: ${url.pathname}. Pakai /api/tripay/create atau /api/tripay/create-transaction` }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, error: e.message, stack: e.stack }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
}
