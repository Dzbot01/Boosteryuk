export async function onRequestPost(context: any) {
  const { TRIPAY_PRIVATE_KEY } = context.env;
  try {
    const body = await context.request.json();
    const jsonStr = JSON.stringify(body);
    
    // Validasi signature dari Tripay
    const signature = context.request.headers.get('x-callback-signature');
    const validSig = await createSignature(jsonStr, TRIPAY_PRIVATE_KEY);
    
    if (signature !== validSig) {
      return new Response(JSON.stringify({ message: 'Invalid signature' }), { status: 401 });
    }

    if (body.status === 'PAID') {
      // DISINI LOGIC UPDATE FIRESTORE LU
      // Contoh: update status order jadi PAID
      console.log('PAID:', body.merchant_ref);
      // await updateFirestore(body.merchant_ref, 'PAID');
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function createSignature(str: string, privateKey: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(privateKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(str));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
