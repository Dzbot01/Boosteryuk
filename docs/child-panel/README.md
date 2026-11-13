# Child Panel Boosteryuk — Tahap 1: Proxy subdomain lewat Cloudflare Worker

Tujuan: `<nama>.boosteryuk.com` menampilkan website Boosteryuk versi "kloning" (logo, tema,
markup harga, dll milik reseller) **tanpa VPS / hosting berbayar**.

## ADR-001 — Subdomain diarahkan oleh Worker, bukan oleh hosting

**Konteks**
- Website & API PHP berjalan di **AeonFree** (jaringan iFastNet/MOFH, IP `185.27.134.153`).
- Hosting gratis iFastNet hanya melayani hostname yang didaftarkan di control panel dan
  tidak menyediakan wildcard subdomain → request `toko1.boosteryuk.com` langsung ke AeonFree
  tidak akan dikenali.
- DNS `*.boosteryuk.com A 185.27.134.153 (Proxied)` sudah dibuat, jadi semua subdomain sudah
  masuk ke Cloudflare.

**Keputusan**
- Pasang Worker `boosteryuk` (yang sudah melayani `api.boosteryuk.com`) pada route
  `*.boosteryuk.com/*`.
- Worker mengklasifikasikan hostname (`worker/childpanel/proxy.ts → classifyHost`):
  | Host | Perlakuan |
  |---|---|
  | `api.boosteryuk.com`, `*.workers.dev` | alur endpoint lama (tidak berubah) |
  | `boosteryuk.com`, `www`, `wa-origin`, `mail`, … | diteruskan apa adanya (`fetch(request)`) |
  | `<nama>.boosteryuk.com` lain | **child panel** → diteruskan ke `https://boosteryuk.com` + header `X-Child-Panel: <nama>` |
- Karena wildcard DNS sudah ada, **tidak perlu membuat DNS record per subdomain** — subdomain
  "dibuat" cukup dengan mendaftarkannya di database (tahap 2). Membuat record lewat API
  Cloudflare tetap bisa ditambahkan bila diinginkan (lihat "Keputusan yang menunggu").

**Risiko utama (harus dites dulu)**
iFastNet memasang tantangan anti-bot (`/aes.js` + cookie `__test`) dan laporan komunitas
menyebut request server-side (proxy) bisa ditolak serta tantangan kini juga berlaku untuk situs
yang di-proxy Cloudflare. Worker ini meneruskan cookie pengunjung, sehingga ada peluang
browser menyelesaikan tantangan lewat proxy — **tetapi ini belum pasti** dan hanya bisa
dibuktikan di domain asli. Karena itu disediakan endpoint diagnostik:

```
https://<nama-apa-saja>.boosteryuk.com/__child/health
```
- `"ok": true` → Worker bisa mengambil halaman & API AeonFree → lanjut tahap 2.
- `"ok": false` dengan `"challenge": true` → AeonFree menolak proxy → pakai **rencana B**:
  frontend child panel disajikan dari Vercel/Cloudflare (statis), PHP tetap di AeonFree.

**Konsekuensi**
- Setiap halaman child panel = beberapa request Worker (kuota gratis 100.000 request/hari).
  Aset statis (`/assets/*`, gambar) di-cache di edge Cloudflare 1 hari untuk menghemat kuota & hit
  ke AeonFree. Halaman HTML / tantangan tidak pernah di-cache.
- Cookie dari origin ditempelkan ke host child panel (atribut `Domain` dihapus), redirect
  `Location` ke `boosteryuk.com` diubah ke host child panel.

## Langkah setup (dilakukan pemilik akun Cloudflare)

1. Deploy worker: `npm run deploy` (atau `npx wrangler deploy`) dari repo ini.
2. Cloudflare Dashboard → **Workers & Pages → boosteryuk → Settings → Domains & Routes → Add → Route**
   - Route: `*.boosteryuk.com/*`
   - Zone: `boosteryuk.com`
3. Pastikan SSL/TLS mode **Full** (bukan Flexible) dan Universal SSL aktif (mencakup `*.boosteryuk.com`).
4. Tes: buka `https://tes1.boosteryuk.com/__child/health` lalu `https://tes1.boosteryuk.com/`.
5. Cek bot WhatsApp tetap normal: `https://wa-origin.boosteryuk.com/health`.

Variabel opsional (wrangler.toml `[vars]`): `CHILD_PANEL_ROOT`, `CHILD_PANEL_ORIGIN`,
`CHILD_PANEL_API_HOSTS`, `CHILD_PANEL_PASSTHROUGH` (lihat `proxy.ts`).

Rollback: hapus route `*.boosteryuk.com/*` di dashboard — endpoint `api.boosteryuk.com` tidak terpengaruh.

## Tahap 2 (setelah proxy terbukti jalan) — rancangan ERD

```
child_panels
  id              INT PK AUTO_INCREMENT
  owner_user_id   INT  → users.id          (reseller pemilik)
  name            VARCHAR(80)              (nama brand)
  status          ENUM('active','suspended') DEFAULT 'active'
  logo_url        VARCHAR(255) NULL
  theme           JSON  (warna, aksen, header, footer, slider, voice Guri)
  markup_smm_pct  DECIMAL(5,2) DEFAULT 0   (markup % layanan SMM)
  markup_agent_pct DECIMAL(5,2) DEFAULT 0  (markup % sewa Agen AI)
  created_at, updated_at

child_panel_domains
  id              INT PK
  child_panel_id  INT → child_panels.id  (ON DELETE CASCADE)
  hostname        VARCHAR(190) UNIQUE      (mis. toko1.boosteryuk.com)
  is_primary      TINYINT(1)
  created_at
```
- `tenant.php` (resolver): `X-Child-Panel`/`X-Forwarded-Host` → `child_panel_domains.hostname` → `tenant_id`
  → konfigurasi tema & markup. Tanpa header = website utama (tenant 0).
- Harga: harga dasar × (1 + markup) dihitung **di server** (order.php/agent_order.php), bukan di browser.
- Halaman admin "Child Panel": daftar panel, form konfigurasi, input nama subdomain (validasi
  `^[a-z0-9-]{1,32}$` + daftar nama terlarang `RESERVED_SUBDOMAINS`).

## Keputusan
1. **Subdomain cukup didaftarkan di database** (tabel `child_panel_domains`), tanpa membuat DNS
   record per subdomain lewat API Cloudflare — wildcard `*.boosteryuk.com` sudah mengarahkan
   semua subdomain ke Worker. Tidak perlu API token Cloudflare. (Dikonfirmasi pemilik, 13 Nov 2026.)
2. Menunggu: hasil `/__child/health` di domain asli (menentukan rencana A atau B).

## Dampak route ke domain lain
- `boosteryuk.com` (apex) **tidak** cocok dengan pola `*.boosteryuk.com/*` → web utama tidak melewati Worker.
- `www`, `wa-origin`, `mail`, dll **melewati** Worker lalu diteruskan apa adanya (`fetch(request)`), termasuk
  POST dan WebSocket. Efeknya hanya menambah hitungan kuota request Worker (gratis 100.000/hari).
