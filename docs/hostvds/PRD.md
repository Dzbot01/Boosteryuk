# PRD — HostVDS VPS Data Worker

## Masalah
Data VPS di HostVDS (status, IP, spesifikasi) hanya bisa dilihat lewat panel `horizon.hostvds.com` atau CLI `openstack`. Aplikasi Boosteryuk butuh data ini lewat HTTP API yang aman, cepat, dan tanpa mengekspos kredensial OpenStack ke frontend.

## Tujuan
1. Endpoint HTTP read-only yang mengembalikan daftar & detail VPS dalam format ringkas.
2. Kredensial OpenStack hanya ada di Cloudflare Secret, tidak pernah di repo/frontend.
3. Latensi rendah: token Keystone di-reuse, respon di-cache singkat di edge.

## Non-goal (versi ini)
- Aksi tulis (create/start/stop/reboot/delete server) — ditunda ke fase 2, butuh audit otorisasi terpisah.
- Penyimpanan historis/metrics (lihat ERD: rencana D1 di fase 2).

## Pengguna
- Backend/frontend Boosteryuk (konsumen API dengan `API_KEY`).
- Admin (debug lewat `/api/catalog`).

## Kebutuhan fungsional
Digabung ke Worker utama `boosteryuk` (`worker/index.ts`) di bawah prefix `/api/vps`.

| ID | Endpoint | Akses | Keterangan |
|----|----------|-------|-----------|
| F1 | `GET /api/vps/health` | publik | cek hidup |
| F2 | `GET /api/vps/catalog` | publik | paket (flavor + harga), image (Glance, public+active), region — dipakai halaman **Order VPS** |
| F3 | `GET /api/vps/servers` | `VPS_API_KEY` | daftar VPS ringkas. Query: `status`, `name`, `limit`, `marker`, `raw=1` |
| F4 | `GET /api/vps/servers/:id` | `VPS_API_KEY` | detail satu VPS |
| F5 | `GET /api/vps/flavors · images · networks · limits · endpoints` | `VPS_API_KEY` | data mentah OpenStack / service catalog |

### UI — `src/pages/OrderVpsPage.tsx`
- Step 02 (paket), 03 (region), 05 (image + swap versi) diisi dari `/api/vps/catalog` via `useVpsCatalog()`.
- Step 04 (network plan) & 06 (IP) tetap statis — OpenStack tidak menyediakan data harga bandwidth.
- Status sumber data: "Live dari HostVDS" / skeleton loading / fallback ke katalog contoh + tombol "Coba lagi".

## Kebutuhan non-fungsional
- Private routes: `Authorization: Bearer <VPS_API_KEY>` atau `X-API-Key`, perbandingan constant-time.
- Error upstream → 502 tanpa membocorkan password; jaringan gagal/timeout 15 dtk → 502; secret belum diset → 503.
- `/api/vps/catalog` di-cache di edge 300 dtk (`VPS_CATALOG_TTL`), bypass `?fresh=1`.
- Harga: `VPS_PRICING` (JSON) — harga per nama flavor, atau rumus vCPU/RAM/disk (ditandai "harga estimasi").

## Kriteria penerimaan
- [x] 16 unit test lulus (worker + mapping frontend).
- [x] `vite build` + `wrangler deploy --dry-run` sukses.
- [x] Render halaman Order VPS di Chromium dengan katalog tiruan: mode live, fallback, mobile.
- [ ] Uji live terhadap `os-api.hostvds.com` (sandbox memblokir host ini).
