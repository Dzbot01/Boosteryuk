export async function onRequestGet(context: any) {
  const { TRIPAY_API_KEY } = context.env;
  try {
    const res = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
      headers: { "Authorization": "Bearer " + TRIPAY_API_KEY }
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
