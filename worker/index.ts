export default {
  async fetch(request, env) {
    const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
    const url=new URL(request.url);
    try{
      if(url.pathname.includes("/channels")){
        const r=await fetch("https://tripay.co.id/api/merchant/payment-channel",{headers:{Authorization:"Bearer "+String(env.TRIPAY_API_KEY).trim()}});
        return new Response(await r.text(),{headers:{...cors,"Content-Type":"application/json"}});
      }
      if(url.pathname.includes("/create")){
        const b=await request.json();
        const amount=parseInt(b.amount);
        const merchant_ref=String(b.merchant_ref||"BY-"+Date.now()).trim();
        const merchant_code=String(env.TRIPAY_MERCHANT_CODE).trim();
        const privateKey=String(env.TRIPAY_PRIVATE_KEY).trim();
        const apiKey=String(env.TRIPAY_API_KEY).trim();
        let method=String(b.method||"QRIS").trim().toUpperCase();
        if(method==="QRIS2") method="QRIS";
        const raw=merchant_code+merchant_ref+amount;
        const enc=new TextEncoder();
        const key=await crypto.subtle.importKey("raw",enc.encode(privateKey),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
        const sigBuf=await crypto.subtle.sign("HMAC",key,enc.encode(raw));
        const signature=Array.from(new Uint8Array(sigBuf)).map(x=>x.toString(16).padStart(2,"0")).join("");
        const payload={method,merchant_ref,amount,customer_name:b.customer_name||"User",customer_email:b.customer_email||"user@boosteryuk.com",customer_phone:"08123456789",order_items:[{sku:"DEP",name:"Deposit",price:amount,quantity:1}],callback_url:"https://boosteryuk.boosteryukid.workers.dev/api/tripay/callback",return_url:"https://boosteryuk.com",expired_time:Math.floor(Date.now()/1000)+86400,signature};
        const r=await fetch("https://tripay.co.id/api/transaction/create",{method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const txt=await r.text();
        return new Response(txt,{status:r.status,headers:{...cors,"Content-Type":"application/json"}});
      }

      // === CALLBACK BARU ===
      if(url.pathname.includes("/callback")){
        const bodyText = await request.text();
        let json;
        try{ json = JSON.parse(bodyText); }catch{ json = {}; }
        
        // Selalu balikin 200 ke Tripay dulu biar gak retry terus
        // Abis itu forward ke aeonfree
        try{
          // GANTI DOMAIN AEONFREE LU DISINI
          const aeonfreeUrl = "https://boosteryuk.com/api/callback.php";
          
          await fetch(aeonfreeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Callback-Secret": String(env.CALLBACK_SECRET||"BOOSTERYUK123"),
              "X-Tripay-Signature": request.headers.get("x-callback-signature")||""
            },
            body: bodyText
          });
        }catch(e){
          // kalau forward gagal jangan bikin tripay retry, tetap log aja
          console.log("Forward error:", e.message);
        }

        // Kalau lu mau debug, bisa simpan log di KV atau console
        console.log("Tripay Callback:", bodyText);

        return new Response(JSON.stringify({success:true}),{headers:{...cors,"Content-Type":"application/json"}});
      }

      return new Response(JSON.stringify({ok:true, message:"Worker Active"}),{headers:{...cors,"Content-Type":"application/json"}});
    }catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...cors,"Content-Type":"application/json"}});}
  }
}