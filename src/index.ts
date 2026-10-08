export default {
  async fetch(request, env, ctx) {
    // API Tripay di-handle disini kalo pake Workers, bukan functions/
    const url = new URL(request.url);
    if (url.pathname === "/api/tripay/channels") {
      const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
        headers: { Authorization: "Bearer " + env.TRIPAY_API_KEY }
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }});
    }
    // selain itu serve frontend dari /dist (otomatis dari [assets])
    return new Response("Not found", { status: 404 });
  }
}
