/**
 * =============================================================
 *  services/tripay.ts — integrasi Tripay Payment Gateway
 * -------------------------------------------------------------
 *  • Signature dibuat dengan HMAC-SHA256 (Web Crypto API)
 *    sesuai dokumentasi Tripay: hash(privateKey, merchantRef+amount)
 *  • Base URL bisa sandbox / production
 *  • Tersedia opsi proxy, karena API Tripay tidak mengizinkan
 *    pemanggilan langsung dari browser (CORS).
 *
 *  ⚠ PRIVATE KEY di file ini terlihat oleh siapa pun yang membuka
 *    halaman. Untuk produksi, pindahkan pemanggilan ke backend.
 * ============================================================= */

const LS_KEY = 'boosteryuk.tripay.config.v1';

export const TRIPAY_SANDBOX = 'https://tripay.co.id/api-sandbox';
export const TRIPAY_PRODUCTION = 'https://tripay.co.id/api';

export interface TripayConfig {
  apiKey: string;
  privateKey: string;
  baseUrl: string;
  /** URL proxy/backend Anda. Kosong = panggil Tripay langsung. */
  proxyUrl: string;
}

export const DEFAULT_TRIPAY_CONFIG: TripayConfig = {
  apiKey: 'dm7yGKcaTU6ddxLJc5fqVcrJ4thWElh7IX0mmOKN',
  privateKey: 'dm7yGKcaTU6ddxLJc5fqVcrJ4thWElh7IX0mmOKN',
  baseUrl: TRIPAY_SANDBOX,
  proxyUrl: '',
};

export function loadConfig(): TripayConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_TRIPAY_CONFIG;
    const parsed = JSON.parse(raw) as Partial<TripayConfig>;
    return { ...DEFAULT_TRIPAY_CONFIG, ...parsed };
  } catch {
    return DEFAULT_TRIPAY_CONFIG;
  }
}

export function saveConfig(config: TripayConfig) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config));
  } catch {
    /* penyimpanan lokal tidak tersedia */
  }
}

/* ------------------------------ signature ------------------------------ */

/** Ubah ArrayBuffer menjadi string hex (lowercase). */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** HMAC-SHA256 → hex, memakai Web Crypto API. */
export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Web Crypto tidak tersedia. Buka halaman ini lewat HTTPS atau localhost agar signature bisa dibuat.',
    );
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(signature);
}

/* -------------------------------- types -------------------------------- */

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  product_url?: string;
  image_url?: string;
}

export interface Instruction {
  title: string;
  steps: string[];
}

export interface TripayTransaction {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_code: string | null;
  pay_url: string | null;
  checkout_url: string;
  status: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND';
  expired_time: number;
  order_items: OrderItem[];
  instructions: Instruction[];
  qr_string: string | null;
  qr_url: string | null;
  created_time?: number;
}

export interface CreateTransactionInput {
  method: string;
  merchantRef: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderItems: OrderItem[];
  callbackUrl?: string;
  returnUrl?: string;
  expiredTime?: number;
}

export class TripayError extends Error {
  constructor(
    message: string,
    readonly kind: 'api' | 'network' | 'cors' | 'config',
  ) {
    super(message);
    this.name = 'TripayError';
  }
}

/* ------------------------------ transport ------------------------------ */

/** Bangun URL final — lewat proxy bila dikonfigurasi. */
function resolveUrl(config: TripayConfig, path: string): string {
  const target = `${config.baseUrl}${path}`;
  if (!config.proxyUrl.trim()) return target;
  const proxy = config.proxyUrl.trim();
  return `${proxy}${proxy.includes('?') ? '&' : '?'}target=${encodeURIComponent(target)}`;
}

async function request<T>(config: TripayConfig, path: string, init: RequestInit): Promise<T> {
  if (!config.apiKey.trim()) {
    throw new TripayError('API Key belum diisi. Buka panel "Pengaturan API".', 'config');
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(config, path), {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TripayError(
      `Tidak dapat menghubungi Tripay (${message}). API Tripay tidak mengizinkan permintaan langsung dari browser (CORS) — isi URL proxy/backend Anda di "Pengaturan API".`,
      'cors',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new TripayError(
      `Respon Tripay tidak valid (HTTP ${response.status}). Pastikan URL & API Key benar.`,
      'api',
    );
  }

  const body = payload as { success?: boolean; message?: string; data?: T };
  if (!response.ok || body.success === false) {
    throw new TripayError(body.message || `Permintaan gagal (HTTP ${response.status}).`, 'api');
  }

  return (body.data ?? (payload as T)) as T;
}

/* -------------------------------- API calls ------------------------------ */

/** Bentuk request siap kirim (url + header + body) beserta signature-nya. */
export interface PreparedRequest {
  path: string;
  method: 'GET' | 'POST';
  body?: string;
  signature: string;
}

/**
 * Siapkan body POST /transaction/create.
 * Signature close-payment = HMAC-SHA256(privateKey, merchant_ref + amount).
 */
export async function prepareCreateTransaction(
  input: CreateTransactionInput,
  config: TripayConfig,
): Promise<PreparedRequest> {
  const signature = await hmacSha256Hex(input.merchantRef + input.amount, config.privateKey.trim());
  return {
    path: '/transaction/create',
    method: 'POST',
    signature,
    body: JSON.stringify({
      method: input.method,
      merchant_ref: input.merchantRef,
      amount: input.amount,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || undefined,
      order_items: input.orderItems,
      callback_url: input.callbackUrl || undefined,
      return_url: input.returnUrl || undefined,
      expired_time: input.expiredTime || undefined,
      signature,
    }),
  };
}

/**
 * Siapkan GET /transaction/status.
 * Signature status = HMAC-SHA256(privateKey, merchant_ref).
 */
export async function prepareStatusRequest(
  merchantRef: string,
  config: TripayConfig,
): Promise<PreparedRequest> {
  const signature = await hmacSha256Hex(merchantRef, config.privateKey.trim());
  return {
    path: `/transaction/status?merchant_ref=${encodeURIComponent(merchantRef)}&signature=${signature}`,
    method: 'GET',
    signature,
  };
}

/** Kirim request yang sudah disiapkan (dipakai ulang oleh helper di bawah). */
export async function sendPrepared<T>(config: TripayConfig, prepared: PreparedRequest): Promise<T> {
  return request<T>(config, prepared.path, { method: prepared.method, body: prepared.body });
}

/** POST /transaction/create — membuat invoice pembayaran. */
export async function createTransaction(
  input: CreateTransactionInput,
  config: TripayConfig,
): Promise<TripayTransaction> {
  const prepared = await prepareCreateTransaction(input, config);
  return sendPrepared<TripayTransaction>(config, prepared);
}

/** GET /transaction/status — cek status invoice (dipakai untuk polling). */
export async function getTransactionStatus(
  merchantRef: string,
  config: TripayConfig,
): Promise<TripayTransaction> {
  const prepared = await prepareStatusRequest(merchantRef, config);
  return request<TripayTransaction>(config, prepared.path, { method: prepared.method });
}

/**
 * Ubah request menjadi perintah cURL.
 * Berguna saat browser memblokir panggilan langsung (CORS) — perintah ini
 * bisa dijalankan dari terminal atau disalin ke backend.
 */
export function toCurl(prepared: PreparedRequest, config: TripayConfig): string {
  const lines = [
    `curl -X ${prepared.method} '${resolveUrl(config, prepared.path)}'`,
    `  -H 'Authorization: Bearer ${config.apiKey.trim()}'`,
    `  -H 'Accept: application/json'`,
  ];
  if (prepared.body) {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d '${prepared.body.replace(/'/g, "'\\''")}'`);
  }
  return lines.join(' \\\n');
}

/* ----------------------- channel pembayaran merchant ----------------------- */

/** Struktur biaya channel (rupiah flat + persen). */
export interface ChannelFee {
  flat: number;
  percent: number;
}

/** Satu channel pembayaran dari GET /merchant/payment-channel. */
export interface PaymentChannel {
  group: string;
  code: string;
  name: string;
  type: string;
  fee_merchant: ChannelFee;
  fee_customer: ChannelFee;
  total_fee: ChannelFee;
  minimum_fee?: number;
  maximum_fee?: number;
  minimum_amount?: number;
  maximum_amount?: number;
  icon_url?: string | null;
  active: boolean;
}

/**
 * GET /merchant/payment-channel
 * Mengembalikan semua channel pembayaran milik merchant beserta
 * biaya, nominal minimum/maksimum, dan status aktifnya.
 */
export async function getPaymentChannels(config: TripayConfig): Promise<PaymentChannel[]> {
  const data = await request<unknown>(config, '/merchant/payment-channel', { method: 'GET' });
  const list = Array.isArray(data)
    ? data
    : ((data as { data?: unknown; channels?: unknown }).data ??
       (data as { channels?: unknown }).channels ??
       []);
  if (!Array.isArray(list)) return [];
  return list as PaymentChannel[];
}

/**
 * Total biaya channel untuk sebuah nominal:
 * flat + (amount × percent / 100), dibatasi minimum_fee & maximum_fee.
 */
export function channelFeeTotal(channel: PaymentChannel, amount: number): number {
  const raw = (channel.total_fee?.flat ?? 0) + (amount * (channel.total_fee?.percent ?? 0)) / 100;
  const min = channel.minimum_fee;
  const max = channel.maximum_fee;
  let fee = raw;
  if (typeof min === 'number' && fee < min) fee = min;
  if (typeof max === 'number' && fee > max) fee = max;
  return Math.round(fee);
}

/** Nomor invoice unik, mis. INV345675 / INV-1712345678901. */
export function makeMerchantRef(prefix = 'INV'): string {
  return `${prefix}${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;
}

/** URL QR fallback bila Tripay tidak mengirim qr_url. */
export function qrImageUrl(content: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(content)}`;
}
