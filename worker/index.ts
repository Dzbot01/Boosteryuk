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

    // 0. HOSTVDS VPS API (/api/vps/*)
    if (isVpsRequest(url)) {
      return handleVps(request, env, ctx, cors);
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
      // 4. CALLBACK - FORWARD TO AEONFREE + NOTIFIKASI DEPOSIT TELEGRAM
if (url.pathname.includes("/callback")) {
  const bodyText = await request.text();
  const tripaySignature = request.headers.get("x-callback-signature") || "";

  console.log("Tripay Callback:", bodyText);

  // Jalur lama ke backend website tetap dipertahankan.
  const forwardTask = async () => {
    try {
      const f = await fetch("https://boosteryuk.com/api/callback.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "X-Callback-Secret": String(env.CALLBACK_SECRET || "BOOSTERYUK123"),
          "X-Tripay-Signature": tripaySignature,
          Accept: "application/json, text/plain, */*"
        },
        body: bodyText
      });

      const resText = await f.text();
      console.log("Forward to Aeonfree:", f.status, resText);
    } catch (e: any) {
      console.log("Forward error:", e.message);
    }
  };

  // Jalur baru untuk notifikasi deposit sukses ke channel Telegram.
  const telegramTask = async () => {
    try {
      const payload = JSON.parse(bodyText);
      const merchantRef = String(payload.merchant_ref || "");
      const status = String(payload.status || "").toUpperCase();
      const amount = String(payload.total_amount ?? "");

      // Abaikan selain pembayaran yang benar-benar berstatus PAID.
      if (status !== "PAID" || !merchantRef || !amount) {
        return;
      }

      const merchantCode = String(env.TRIPAY_MERCHANT_CODE || "");
      const privateKey = String(env.TRIPAY_PRIVATE_KEY || "");

      if (!merchantCode || !privateKey || !tripaySignature) {
        console.log("Notifikasi Telegram dilewati: konfigurasi/verifikasi Tripay belum lengkap.");
        return;
      }

      // Verifikasi signature callback Tripay sebelum mengirim notifikasi.
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
        encoder.encode(merchantCode + merchantRef + amount)
      );

      const expectedSignature = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature.toLowerCase() !== tripaySignature.toLowerCase()) {
        console.log("Notifikasi Telegram dilewati: signature Tripay tidak valid.");
        return;
      }

      const botToken = String(env.TELEGRAM_BOT_TOKEN || "");
      const channelId = String(env.TELEGRAM_SUCCESS_CHANNEL || "");

      if (!botToken || !channelId) {
        console.log("Notifikasi Telegram gagal: TELEGRAM_BOT_TOKEN atau TELEGRAM_SUCCESS_CHANNEL belum diatur.");
        return;
      }

      const formattedAmount = Number(amount).toLocaleString("id-ID");
      const message =
        `✅ <b>Deposit Berhasil</b>\n\n` +
        `💰 Jumlah: Rp${formattedAmount}\n` +
        `🧾 Referensi: <code>${merchantRef.replace(/[<&>]/g, "")}</code>`;

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channelId,
            text: message,
            parse_mode: "HTML"
          })
        }
      );

      const telegramResult: any = await telegramResponse.json();

      if (!telegramResponse.ok || !telegramResult.ok) {
        console.log("Telegram send error:", telegramResult);
      } else {
        console.log("Notifikasi deposit terkirim ke channel.");
      }
    } catch (e: any) {
      console.log("Telegram notification error:", e.message);
    }
  };

  if (ctx?.waitUntil) {
    ctx.waitUntil(Promise.allSettled([forwardTask(), telegramTask()]));
  } else {
    await Promise.allSettled([forwardTask(), telegramTask()]);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
}

      return new Response(JSON.stringify({ ok: true, message: "Worker Active" }), {
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