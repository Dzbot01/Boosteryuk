export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS helper
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // API TRIPAY CHANNELS
    if (url.pathname === "/api/tripay/channels") {
      if (!env.TRIPAY_API_KEY) {
        return new Response(JSON.stringify({ error: "TRIPAY_API_KEY BELUM DI SET DI RUNTIME VARIABLES!", hint: "Set di Settings > Variables and Secrets, bukan Build variables" }), { status: 500, headers: {...cors, "Content-Type": "application/json" } });
      }
      const r = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
        headers: { Authorization: "Bearer " + env.TRIPAY_API_KEY }
      });
      const d = await r.text();
      return new Response(d, { headers: {...cors, "Content-Type": "application/json" } });
    }

    // API TRIPAY CREATE
    if (url.pathname === "/api/tripay/create" && request.method === "POST") {
      return new Response(JSON.stringify({ ok: true, msg: "create endpoint ready" }), { headers: {...cors, "Content-Type": "application/json" } });
    }

    // SELAIN API = SERVE FRONTEND DARI /dist VIA ASSETS BINDING
    try {
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response("Frontend not found", { status: 404 });
    }
  }
}
