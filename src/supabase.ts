/**
 * supabase.ts
 *
 * Single integration point with the Fayupedia API.
 *
 * Flow:  Browser  →  Supabase Edge Function  →  Fayupedia API
 *
 * The Edge Function (`fayupedia`) is deployed at the URL below and reads its
 * credentials from Supabase Edge Function secrets — they NEVER touch the
 * browser:
 *
 *   FAYUPEDIA_KEY       → the API key
 *   FAYUPEDIA_BASE_URL  → e.g. https://fayupedia.id/api
 *   FAYUPEDIA_ID        → the API id
 *
 * The browser only POSTs `{ action, id }` as JSON. The Edge Function maps
 * `action` to the correct path under FAYUPEDIA_BASE_URL, attaches the
 * FAYUPEDIA_ID + FAYUPEDIA_KEY, calls Fayupedia server-to-server, and
 * returns the raw JSON to us.
 */

export const EDGE_FUNCTION_URL =
  'https://zcxtbtleeeaeqeryiwea.supabase.co/functions/v1/fayupedia';

export interface EdgePayload {
  /** Which Fayupedia endpoint to hit relative to FAYUPEDIA_BASE_URL */
  action: 'status' | 'refill' | 'refill_status';
  /** ID(s) to query. Comma-separated for bulk status checks. */
  id: string;
}

export interface EdgeResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Call the `fayupedia` Edge Function directly over HTTPS.
 *
 * Expected Edge Function body (Deno):
 * ```ts
 * Deno.serve(async (req) => {
 *   const cors = {
 *     'Access-Control-Allow-Origin': '*',
 *     'Content-Type': 'application/json',
 *   };
 *   if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
 *
 *   const { action, id } = await req.json();
 *   const baseUrl = Deno.env.get('FAYUPEDIA_BASE_URL')!;
 *   const apiId   = Deno.env.get('FAYUPEDIA_ID')!;
 *   const apiKey  = Deno.env.get('FAYUPEDIA_KEY')!;
 *
 *   const endpoints: Record<string, string> = {
 *     status:        `${baseUrl}/status`,
 *     refill:        `${baseUrl}/refill`,
 *     refill_status: `${baseUrl}/refill/status`,
 *   };
 *   const endpoint = endpoints[action];
 *   if (!endpoint) return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: cors });
 *
 *   const body = new URLSearchParams({ api_id: apiId, api_key: apiKey, id });
 *   const resp = await fetch(endpoint, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
 *     body: body.toString(),
 *   });
 *   const text = await resp.text();
 *   return new Response(text, { status: resp.status, headers: cors });
 * });
 * ```
 */
export async function invokeProxy<T = unknown>(
  payload: EdgePayload
): Promise<EdgeResponse<T>> {
  let data: T | null = null;
  let error: string | null = null;
  let httpStatus = 0;

  let res: Response;
  try {
    res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      status: 0,
      data: null,
      error: `${e.name || 'Error'}: ${e.message || 'Gagal terhubung ke server.'}`,
    };
  }

  httpStatus = res.status;
  const raw = await res.text();

  // Try to parse JSON (the Edge Function should return the Fayupedia payload).
  try {
    const parsed = JSON.parse(raw) as T;
    if (!res.ok) {
      const anyParsed = parsed as unknown as { error?: string; msg?: string; message?: string };
      error = anyParsed.error || anyParsed.msg || anyParsed.message || `HTTP ${res.status}`;
    } else {
      data = parsed;
    }
  } catch {
    error = raw.trim().slice(0, 300) || `HTTP ${res.status} (respons non-JSON)`;
  }

  return { ok: error === null && data !== null, status: httpStatus, data, error };
}
