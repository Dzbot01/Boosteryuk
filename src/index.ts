export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CALLBACK-SIGNATURE"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

    const url = new URL(request.url);

    try {
      // LIST
      if (url.pathname.includes("/channels") && request.method === "GET") {
        const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
          headers: { Authorization: `Bearer ${env.TRIPAY_API_KEY}` }
        });
        const data = await res.text();
        return new Response(data, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // CREATE - TERIMA 2 ROUTE
      if ((url.pathname.includes("/create-transaction") || url.pathname.endsWith("/create")) && request.method === "POST") {
        const body: any = await request.json();
        const amount = parseInt(body.amount);
        const merchant_ref = body.merchant_ref || body.order_id || `BY-${Date.now()}`;
        let method = (body.method || "").toUpperCase();
        if (method === "QRIS2") method = "QRIS";

        // === FIX SIGNATURE DISINI ===
        // Tripay: merchant_code + merchant_ref + amount
        const rawSignature = `${env.TRIPAY_MERCHANT_CODE}${merchant_ref}${amount}`;
        
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(env.TRIPAY_PRIVATE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(rawSignature));
        const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const payload = {
          method,
          merchant_ref,
          amount,
          customer_name: body.customer_name || "Boosteryuk User",
          customer_email: body.customer_email || "user@boosteryuk.com",
          customer_phone: body.customer_phone || "08123456789",
          order_items: [{ sku: "DEPOSIT", name: "Deposit", price: amount, quantity: 1 }],
          callback_url: "https://boosteryuk.boosteryukid.workers.dev/api/tripay/callback",
          return_url: "https://boosteryuk.com/deposit",
          expired_time: Math.floor(Date.now()/1000) + 86400,
          signature
        };

        console.log("Payload:", JSON.stringify(payload));
        console.log("RawSig:", rawSignature);

        const tripayRes = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.TRIPAY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await tripayRes.text();
        console.log("Tripay result:", result);
        return new Response(result, { status: tripayRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (url.pathname.includes("/callback")) {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "Not found " + url.pathname }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
}
