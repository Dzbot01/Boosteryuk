export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-callback-signature"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 1. LIST CHANNEL
    if (url.pathname === "/api/tripay/channels" && request.method === "GET") {
      const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
        headers: { Authorization: "Bearer " + env.TRIPAY_API_KEY }
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. CREATE TRANSACTION
    if (url.pathname === "/api/tripay/create" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const { amount, method, order_id } = body;
        const signature = await createSignature(env.TRIPAY_MERCHANT_CODE + order_id + amount, env.TRIPAY_PRIVATE_KEY);
        const payload = {
          method, merchant_ref: order_id, amount,
          customer_name: body.customer_name || "Boosteryuk User",
          customer_email: body.customer_email || "user@boosteryuk.my.id",
          order_items: [{ name: "Deposit Boosteryuk", price: amount, quantity: 1 }],
          callback_url: url.origin + "/api/tripay/callback",
          return_url: url.origin + "/payment/success",
          expired_time: Math.floor(Date.now()/1000) + 86400,
          signature
        };
        const res = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: { Authorization: "Bearer " + env.TRIPAY_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 3. CALLBACK
    if (url.pathname === "/api/tripay/callback" && request.method === "POST") {
      const body = await request.text();
      // disini nanti lu update Firestore kalo PAID
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
}

async function createSignature(str: string, privateKey: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(privateKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(str));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
