# Audit & Validasi — v0.2 (2026-10-22, integrasi ke repo Boosteryuk)

## Validasi yang sudah dijalankan
| Cek | Hasil |
|---|---|
| `tsc --noEmit -p worker` (strict) | ✅ |
| `tsc --noEmit` frontend | 11 error — **semua sudah ada sebelum perubahan ini** (PengaturanAkunPage, ProfilPage, balanceApi, orderApi, …); 0 error baru |
| `vitest run` — 16 tes: rute Tripay lama tetap jalan, catalog publik (filter flavor disabled/private, image non-active, paginasi Glance), auth private, region selection, token reuse/refresh/single-flight, retry 401, network→502, Keystone reject→502, no password leak, pricing, parsing image, mapping UI | ✅ 16/16 |
| `vite build` + `wrangler deploy --dry-run` (run_worker_first diterima) | ✅ 18.99 KiB / gzip 6.45 KiB |
| Chromium (Playwright) render `/ordervps` dengan katalog tiruan: live, fallback (503), mobile 390px; 0 JS error | ✅ |

## Verifikasi terhadap dokumentasi OpenStack (api-ref resmi, sumber di repo openstack/* GitHub)
- Keystone v3: token di header `X-Subject-Token`, body `token.expires_at` + `token.catalog` ✅
- Nova: field `vcpus/ram/disk/original_name` di `server.flavor` mulai microversion **2.47** ✅; `OS-EXT-STS:power_state` 0/1/3/4/6/7 ✅; non-admin hanya menerima flavor public ✅
- Glance v2: filter `visibility`, `status`; paginasi via `next` → **temuan, diperbaiki** (ADR-007)

## Keterbatasan
- **Belum diuji live ke HostVDS**: sandbox pengembangan memblokir `os-api.hostvds.com`. Bentuk respons Keystone/Nova diuji terhadap spesifikasi OpenStack resmi, bukan respons asli HostVDS. Langkah verifikasi pertama setelah deploy: `GET /api/catalog`.
- Microversion 2.47 diasumsikan didukung (Nova Pike, 2017+).

## Temuan keamanan
1. **KRITIS — password OpenStack terekspos publik.** File `env` dan `openrc.sh` ada di bucket Supabase **public** (`.../object/public/video/...`) dan password juga ditempel di chat. Siapa pun dengan URL bisa mengendalikan semua VPS. **Tindakan**: ganti password/app credential di panel HostVDS, hapus kedua file dari bucket public, simpan password baru hanya via `wrangler secret put OS_PASSWORD`.
2. Pertimbangkan **Application Credential** Keystone (read-only role bila tersedia) menggantikan password user — bisa dicabut tanpa mengganti password akun.
3. `CORS_ORIGIN="*"` — persempit ke domain Boosteryuk saat produksi.
4. `openrc.sh`, `.dev.vars`, `.wrangler` ditambahkan ke `.gitignore`.
5. (Di luar scope, kode lama) `worker/index.ts` rute Tripay memakai `path.includes()` dan fallback `CALLBACK_SECRET || "BOOSTERYUK123"` — sebaiknya secret wajib diset.

## Referensi
- Keystone v3 auth: https://docs.openstack.org/api-ref/identity/v3/
- Nova API & microversions: https://docs.openstack.org/api-ref/compute/
- Neutron: https://docs.openstack.org/api-ref/network/v2/ · Glance: https://docs.openstack.org/api-ref/image/v2/
- Wrangler config: https://developers.cloudflare.com/workers/wrangler/configuration/
