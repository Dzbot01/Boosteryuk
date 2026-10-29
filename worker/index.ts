import { handleVps, isVpsRequest } from "./hostvds/routes";

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-Callback-Signature, X-Callback-Secret, X-Endpoint-Token"
    };

    const url = new URL(request.url);
//pembatas

    // 0.1 TELEGRAM - LINK AKUN
    if (url.pathname === "/api/telegram/link") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }
      try {
        const body = await request.json() as any;
        const email = body.email;
        const telegram_id = body.telegram_id;

        if (!email || !telegram_id) {
          return new Response(JSON.stringify({ status: false, msg: "email & telegram_id wajib dari bot" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const PHP_API = "https://boosteryuk.com/api/link.php";
        const token = "R4HASIA-BOOSTERYUK-123";

        const forward = await fetch(`${PHP_API}?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email: email, telegram_id: String(telegram_id) })
        });

        const txt = await forward.text();
        console.log("PHP RAW LINK:", txt);

        // kalau PHP bales bukan JSON, bungkus jadi JSON biar bot gak bingung
        try {
            const json = JSON.parse(txt);
            return new Response(JSON.stringify(json), {
                headers: { ...cors, "Content-Type": "application/json" }
            });
        } catch {
            return new Response(JSON.stringify({ status: false, msg: "PHP Error: " + txt.substring(0,300) }), {
                headers: { ...cors, "Content-Type": "application/json" }
            });
        }

      } catch (e: any) {
        return new Response(JSON.stringify({ status: false, msg: "Worker Error: " + e.message }), {
          status: 500, headers: { ...cors, "Content-Type": "application/json" }
        });
      }
    }

    // 0.2 TELEGRAM - CHECK AKUN (UNTUK /start DINAMIS)
    if (url.pathname === "/api/telegram/check") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }
      try {
        const telegram_id = url.searchParams.get("telegram_id");
        if (!telegram_id) {
          return new Response(JSON.stringify({ status: false, msg: "telegram_id wajib" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const PHP_API = "https://boosteryuk.com/api/check.php";
        const token = "R4HASIA-BOOSTERYUK-123";

        const forward = await fetch(`${PHP_API}?token=${token}&telegram_id=${telegram_id}`, {
          method: "GET"
        });

        const txt = await forward.text();
        console.log("PHP RAW CHECK:", txt);

        try {
            const json = JSON.parse(txt);
            return new Response(JSON.stringify(json), {
                headers: { ...cors, "Content-Type": "application/json" }
            });
        } catch {
            return new Response(JSON.stringify({ status: false, msg: "PHP Error: " + txt.substring(0,300) }), {
                headers: { ...cors, "Content-Type": "application/json" }
            });
        }

      } catch (e: any) {
        return new Response(JSON.stringify({ status: false, msg: "Worker Error: " + e.message }), {
          status: 500, headers: { ...cors, "Content-Type": "application/json" }
        });
      }
    }

    // 0.3 TELEGRAM - POTONG SALDO
    if (url.pathname === "/api/telegram/deduct") {
      try {
        let telegram_id = url.searchParams.get("telegram_id") || "";
        let amount = url.searchParams.get("amount") || "0";
        let note = url.searchParams.get("note") || "order bot";
        
        if (request.method === "POST") {
          const body = await request.json().catch(()=> ({}));
          if (body.telegram_id) telegram_id = String(body.telegram_id);
          if (body.amount) amount = String(body.amount);
          if (body.note) note = String(body.note);
        }

        const PHP_API = "https://boosteryuk.com/api/deduct.php";
        const token = "R4HASIA-BOOSTERYUK-123";
        const qs = new URLSearchParams({ token, telegram_id, amount, note });
        const forward = await fetch(`${PHP_API}?${qs.toString()}`);
        const txt = await forward.text();
        return new Response(txt, { headers: { ...cors, "Content-Type": "application/json" } });
      } catch(e) {
        return new Response(JSON.stringify({status:false,msg:e.message}), {status:500, headers:{...cors,"Content-Type":"application/json"}});
      }
    }
    
        // 0.4 TELEGRAM - REFUND
    if (url.pathname === "/api/telegram/refund") {
      try {
        let telegram_id = url.searchParams.get("telegram_id") || "";
        let amount = url.searchParams.get("amount") || "0";
        let note = url.searchParams.get("note") || "refund bot";
        if (request.method === "POST") {
          const body = await request.json().catch(()=> ({}));
          if (body.telegram_id) telegram_id = String(body.telegram_id);
          if (body.amount) amount = String(body.amount);
          if (body.note) note = String(body.note);
        }
        const PHP_API = "https://boosteryuk.com/api/refund.php";
        const token = "R4HASIA-BOOSTERYUK-123";
        const qs = new URLSearchParams({ token, telegram_id, amount, note });
        const forward = await fetch(`${PHP_API}?${qs.toString()}`);
        const txt = await forward.text();
        return new Response(txt, { headers: { ...cors, "Content-Type": "application/json" } });
      } catch(e) {
        return new Response(JSON.stringify({status:false,msg:e.message}), {status:500, headers:{...cors,"Content-Type":"application/json"}});
      }
    }
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
          // 1. EMAIL RESEND - VERSI TANPA TOKEN & TANPA EXPOSE KEY (UNTUK AI BUILDER)
      if (url.pathname === "/api/resend/key" || url.pathname === "/api/email/send" || url.pathname === "/api/resend/send") {
        if (!env.RESEND_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_KEY is not configured" }), {
            status: 500,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        // Kalau cuma di-GET (buat test di browser), kasih info
        if (request.method === "GET") {
          return new Response(JSON.stringify({ 
            ok: true, 
            message: "Endpoint email aktif - cekidku.my.id",
            usage: "POST /api/email/send dengan body { to, subject, html }"
          }), {
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        if (request.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed, use POST" }), {
            status: 405,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const body: any = await request.json();

        if (!body.to || !body.subject) {
          return new Response(JSON.stringify({ error: "Field 'to' dan 'subject' wajib diisi" }), {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${String(env.RESEND_KEY).trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: body.from || "Cekidku <noreply@cekidku.my.id>",
            to: body.to,
            subject: body.subject,
            html: body.html || body.text || "<p>Test email dari Cekidku</p>",
            reply_to: body.reply_to || "support@cekidku.my.id"
          })
        });

        const txt = await resendRes.text();
        return new Response(txt, {
          status: resendRes.status,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      // 2. GET PAYMENT CHANNELS
      if (url.pathname.includes("/channels")) {
        const r = await fetch("https://tripay.co.id/api/merchant/payment-channel", {
          headers: {
            Authorization: "Bearer " + String(env.TRIPAY_API_KEY).trim()
          }
        });

        const txt = await r.text();

        return new Response(txt, {
          status: r.status,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      // 3. CREATE TRANSACTION
      if (url.pathname.includes("/create")) {
        const b: any = await request.json();
        const amount = parseInt(b.amount);
        const merchant_ref = String(b.merchant_ref || "BY-" + Date.now()).trim();
        const merchant_code = String(env.TRIPAY_MERCHANT_CODE).trim();
        const privateKey = String(env.TRIPAY_PRIVATE_KEY).trim();
        const apiKey = String(env.TRIPAY_API_KEY).trim();

        let method = String(b.method || "QRIS").trim().toUpperCase();
        if (method === "QRIS2") method = "QRIS";

        const raw = merchant_code + merchant_ref + amount;
        const enc = new TextEncoder();

        const key = await crypto.subtle.importKey(
          "raw",
          enc.encode(privateKey),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
        const signature = Array.from(new Uint8Array(sigBuf))
          .map(x => x.toString(16).padStart(2, "0"))
          .join("");

        const payload = {
          method,
          merchant_ref,
          amount,
          customer_name: b.customer_name || "User",
          customer_email: b.customer_email || "user@boosteryuk.com",
          customer_phone: "08123456789",
          order_items: [{ sku: "DEP", name: "Deposit", price: amount, quantity: 1 }],
          callback_url: "https://boosteryuk.boosteryukid.workers.dev/api/tripay/callback",
          return_url: "https://boosteryuk.com",
          expired_time: Math.floor(Date.now() / 1000) + 86400,
          signature
        };

        const r = await fetch("https://tripay.co.id/api/transaction/create", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const txt = await r.text();

        return new Response(txt, {
          status: r.status,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }
      // 4. CEK STATUS TRANSAKSI
if (url.pathname.includes("/status")) {
  const ref = url.searchParams.get("reference") || "";
  if (!ref) {
    return new Response(JSON.stringify({ success: false, message: "reference kosong" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const r = await fetch("https://tripay.co.id/api/transaction/detail?reference=" + encodeURIComponent(ref), {
    headers: { Authorization: "Bearer " + String(env.TRIPAY_API_KEY).trim() }
  });
  const txt = await r.text();
  return new Response(txt, { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
}
// POST /api/resend/send
if (url.pathname === "/api/resend/send") {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const suppliedToken = request.headers.get("X-Endpoint-Token") || "";

  if (
    !env.RESEND_ENDPOINT_TOKEN ||
    suppliedToken !== String(env.RESEND_ENDPOINT_TOKEN)
  ) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  if (!env.RESEND_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "RESEND_KEY is not configured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const body: any = await request.json();

  if (!body.from || !body.to || !body.subject || (!body.html && !body.text)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Required fields: from, to, subject, and html or text"
      }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" }
      }
    );
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(env.RESEND_KEY).trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: body.from,
      to: body.to,
      subject: body.subject,
      ...(body.html ? { html: body.html } : {}),
      ...(body.text ? { text: body.text } : {})
    })
  });

  const resendData: any = await resendResponse.json();

  if (!resendResponse.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: resendData }),
      {
        status: resendResponse.status,
        headers: { ...cors, "Content-Type": "application/json" }
      }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, id: resendData.id }),
    {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
   // 4. CALLBACK - FORWARD TO AEONFREE + NOTIFIKASI FOTO TELEGRAM
if (url.pathname.includes("/callback")) {
  const bodyText = await request.text();
  const tripaySignature =
    request.headers.get("x-callback-signature")?.trim() || "";
  const callbackEvent =
    request.headers.get("x-callback-event")?.trim() || "";

  console.log("Tripay Callback:", bodyText);

  // Forward callback ke backend PHP; logic dan konfigurasi lama dipertahankan.
  const forwardTask = async () => {
    try {
      const f = await fetch("https://boosteryuk.com/api/callback.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "X-Callback-Secret": String(
            env.CALLBACK_SECRET || "BOOSTERYUK123"
          ),
          "X-Tripay-Signature": tripaySignature,
          Accept: "application/json, text/plain, */*"
        },
        body: bodyText
      });

      const resText = await f.text();
      console.log("Forward to Aeonfree:", f.status, resText);
    } catch (e: any) {
      console.log("Forward error:", e?.message || e);
    }
  };

  // Kirim foto dan caption ke channel untuk pembayaran sukses yang valid.
  const telegramTask = async () => {
    try {
      const payload = JSON.parse(bodyText);
      const status = String(payload.status || "").toUpperCase();
      const merchantRef = String(payload.merchant_ref || "");
      const amount = Number(payload.total_amount);

      if (
        callbackEvent !== "payment_status" ||
        status !== "PAID" ||
        !merchantRef ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        console.log(
          "Notifikasi Telegram dilewati: callback bukan pembayaran PAID yang valid."
        );
        return;
      }

      const privateKey = String(env.TRIPAY_PRIVATE_KEY || "");

      if (!privateKey || !tripaySignature) {
        console.log(
          "Notifikasi Telegram dilewati: private key atau signature belum tersedia."
        );
        return;
      }

      // Verifikasi signature Tripay menggunakan raw body callback.
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(privateKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const digest = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(bodyText)
      );

      const expectedSignature = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toLowerCase();

      const receivedSignature = tripaySignature.toLowerCase();
      let signatureDifference =
        expectedSignature.length ^ receivedSignature.length;

      const compareLength = Math.min(
        expectedSignature.length,
        receivedSignature.length
      );

      for (let i = 0; i < compareLength; i++) {
        signatureDifference |=
          expectedSignature.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
      }

      if (signatureDifference !== 0) {
        console.log(
          "Notifikasi Telegram dilewati: signature Tripay tidak valid."
        );
        return;
      }

      const botToken = String(env.TELEGRAM_BOT_TOKEN || "");
      const channelId = String(env.TELEGRAM_SUCCESS_CHANNEL || "");
      const imageUrl = String(env.TELEGRAM_SUCCESS_IMAGE || "");

      if (!botToken || !channelId || !imageUrl) {
        console.log(
          "Notifikasi Telegram gagal: TELEGRAM_BOT_TOKEN, TELEGRAM_SUCCESS_CHANNEL, atau TELEGRAM_SUCCESS_IMAGE belum diatur."
        );
        return;
      }

      const safeMerchantRef = merchantRef.replace(/[&<>]/g, "");
      const formattedAmount = amount.toLocaleString("id-ID");
      const caption =
        `✅ <b>Deposit Berhasil</b>\n\n` +
        `💰 Jumlah: Rp${formattedAmount}\n` +
        `🧾 Referensi: <code>${safeMerchantRef}</code>`;

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channelId,
            photo: imageUrl,
            caption,
            parse_mode: "HTML"
          })
        }
      );

      const telegramResult: any = await telegramResponse.json();

      if (!telegramResponse.ok || !telegramResult.ok) {
        console.log("Telegram sendPhoto error:", telegramResult);
        return;
      }

      console.log("Foto notifikasi deposit terkirim ke channel.");
    } catch (e: any) {
      console.log("Telegram notification error:", e?.message || e);
    }
  };

  // Jalankan kedua jalur terpisah agar kegagalan Telegram tidak menghentikan forward PHP.
  if (ctx?.waitUntil) {
    ctx.waitUntil(Promise.allSettled([forwardTask(), telegramTask()]));
  } else {
    await Promise.allSettled([forwardTask(), telegramTask()]);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
}

        // ROOT - biar gak dianggap error sama bot lama
  if (url.pathname === "/" || url.pathname === "") {
    return new Response(JSON.stringify({ status: true, msg: "Worker OK", time: new Date().toISOString() }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ status: false, msg: `Endpoint tidak ditemukan: ${url.pathname}` }), {
    status: 404,
    headers: { ...cors, "Content-Type": "application/json" }
  });
  
  
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
  }
};