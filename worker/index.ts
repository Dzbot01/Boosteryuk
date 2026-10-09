export default {
  async fetch(request, env) {
    const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
    const url=new URL(request.url);
    try{
      if(url.pathname.includes("/channels")){
        const res=await fetch("https://tripay.co.id/api/merchant/payment-channel",{headers:{Authorization:"Bearer "+String(env.TRIPAY_API_KEY).trim()}});
        return new Response(await res.text(),{headers:{...cors,"Content-Type":"application/json"}});
      }
      if(url.pathname.includes("/create")){
        const b=await request.json();
        const amount=parseInt(b.amount);
        const merchant_ref=String(b.merchant_ref||"BY-"+Date.now()).trim();
        const merchant_code=String(env.TRIPAY_MERCHANT_CODE||"").trim();
        const privateKey=String(env.TRIPAY_PRIVATE_KEY||"").trim();
        const apiKey=String(env.TRIPAY_API_KEY||"").trim();
        
        if(!merchant_code||!privateKey||!apiKey) return new Response(JSON.stringify({success:false,message:"ENV TRIPAY belum di set di Cloudflare"}),{status:500,headers:{...cors,"Content-Type":"application/json"}});

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
        // balikin debug biar tau raw nya apa
        const debug={_debug_raw:raw,_debug_merchant_code:merchant_code,_debug_ref:merchant_ref,_debug_amount:amount,tripay_response:JSON.parse(txt)};
        return new Response(JSON.stringify(debug),{status:r.status,headers:{...cors,"Content-Type":"application/json"}});
      }
      return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
    }catch(e){return new Response(JSON.stringify({error:e.message,stack:e.stack}),{status:500,headers:{...cors,"Content-Type":"application/json"}});}
  }
}
