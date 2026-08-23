export const LOGO_URL =
  'https://www.image2url.com/r2/default/images/1787411570499-864e1f3c-dccc-4e22-a82f-8831b4ff1739.png';

/**
 * Fayupedia API credentials are NOT stored in the browser.
 * They live exclusively inside the Supabase Edge Function environment
 * as secrets: FAYUPEDIA_ID, FAYUPEDIA_KEY, FAYUPEDIA_BASE_URL.
 *
 * The browser calls the `fayupedia` Edge Function via supabase.ts;
 * the Edge Function then calls Fayupedia server-to-server.
 */

/** Official brand marks via Simple Icons CDN (https://github.com/simple-icons/simple-icons) */
export const SOCIAL_BRANDS = [
  { name: 'YouTube', slug: 'youtube', color: 'FF0000' },
  { name: 'Instagram', slug: 'instagram', color: 'E4405F' },
  { name: 'TikTok', slug: 'tiktok', color: '000000' },
  { name: 'Threads', slug: 'threads', color: '000000' },
  { name: 'X', slug: 'x', color: '000000' },
  { name: 'Telegram', slug: 'telegram', color: '26A5E4' },
  { name: 'Facebook', slug: 'facebook', color: '0866FF' },
  { name: 'WhatsApp', slug: 'whatsapp', color: '25D366' },
] as const;

/** Additional official brand marks for the reverse marquee. */
export const SECONDARY_SOCIAL_BRANDS = [
  { name: 'Roblox', url: 'https://cdn.simpleicons.org/roblox/000000', darkUrl: 'https://cdn.simpleicons.org/roblox/ffffff', darkInvert: false },
  { name: 'LinkedIn', url: 'https://www.svgrepo.com/show/448234/linkedin.svg', darkUrl: 'https://www.svgrepo.com/show/448234/linkedin.svg', darkInvert: false },
  { name: 'Spotify', url: 'https://cdn.simpleicons.org/spotify/1DB954', darkUrl: 'https://cdn.simpleicons.org/spotify/1DB954', darkInvert: false },
  { name: 'SnackVideo', url: 'https://www.svgrepo.com/show/519325/snackvideo.svg', darkUrl: 'https://www.svgrepo.com/show/519325/snackvideo.svg', darkInvert: true },
] as const;

/* ---------- payment ---------- */
export const QRIS_IMAGE =
  'https://www.image2url.com/r2/default/images/1787483438420-9547e664-fedf-4805-afbc-98b8b9bffc9d.jpeg';

export const PAYMENT_INFO_TEXT =
  'Bayar sesuai dengan jumlah dan nominal yang seharusnya dibayarkan harap konfirmasi ke admin via WhatsApp atau Email pada halaman hubungi admin.';

export const ADMIN_WHATSAPP = '088976577719';
export const ADMIN_WHATSAPP_INTL = '6288976577719';
export const ADMIN_EMAIL = 'boosteryukid@gmail.com';

export const WALLETS = [
  {
    id: 'dana',
    label: 'DANA',
    slug: 'dana',
    number: '088976577719',
    holder: 'DIMASXXXX',
    color: '1189D6',
  },
  {
    id: 'gopay',
    label: 'GoPay',
    slug: 'gopay',
    number: '088976577719',
    holder: 'DEDDYXXXX',
    color: '00AED6',
  },
] as const;

export function socialIconUrl(slug: string, color?: string) {
  return color
    ? `https://cdn.simpleicons.org/${slug}/${color}`
    : `https://cdn.simpleicons.org/${slug}`;
}
