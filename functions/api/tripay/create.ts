export async function onRequestPost(context: any) {
  const { TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE } = context.env;
  
  try {
    const body = await context.request.json();
    const { amount, method, order_id } = body; // dari frontend lu

    const signature = await createSignature(TRIPAY_MERCHANT_CODE + order_id + amount, TRIPAY_PRIVATE_KEY);

    const payload = {
      method: method, // misal BRIVA, QRIS, dll
      merchant_ref: order_id,
      amount: amount,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      order_items: [{ name: "Topup Boosteryuk", price: amount, quantity: 1 }],
      callback_url: "https://boosteryuk.pages.dev/api/tripay/callback",
      return_url: "https://boosteryuk.pages.dev/payment/success",
      expired_time: Math.floor(Date.now()/1000) + 24*60*60,
      signature: signature
    };

    const res = await fetch("https://tripay.co.id/api/transaction/create", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + TRIPAY_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });

  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function createSignature(str: string, privateKey: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(privateKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(str));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
