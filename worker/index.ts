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
      // 1. GET RESEND API KEY
      if (url.pathname === "/api/resend/key") {
        if (request.method !== "GET") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const suppliedToken = request.headers.get("X-Endpoint-Token") || "";

        if (
          !env.RESEND_ENDPOINT_TOKEN ||
          suppliedToken !== String(env.RESEND_ENDPOINT_TOKEN)
        ) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        if (!env.RESEND_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_KEY is not configured" }), {
            status: 500,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ RESEND_KEY: env.RESEND_KEY }), {
          status: 200,
          headers: {
            ...cors,
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
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

      // 4. CALLBACK - FORWARD TO AEONFREE
      if (url.pathname.includes("/callback")) {
        const bodyText = await request.text();
        const tripaySignature = request.headers.get("x-callback-signature") || "";

        console.log("Tripay Callback:", bodyText);

        const forwardTask = async () => {
          try {
            const aeonfreeUrl = "https://boosteryuk.com/api/callback.php";

            const f = await fetch(aeonfreeUrl, {
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

        if (ctx && ctx.waitUntil) {
          ctx.waitUntil(forwardTask());
        } else {
          await forwardTask();
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