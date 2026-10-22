# ARD — Architecture & Decision Records

## Arsitektur
```
Browser (OrderVpsPage) ──GET /api/vps/catalog──┐
Admin/backend ──Bearer VPS_API_KEY──────────────┤
                                                ▼
              Cloudflare Worker "boosteryuk" (worker/index.ts)
                │  /api/vps/* → worker/hostvds/routes.ts (auth + edge cache)
                │  /channels /create /callback → Tripay (tidak diubah)
                │  selain /api/* → static assets (dist/, SPA)
                ▼
         OpenStackClient (worker/hostvds/openstack.ts)
                             │ 1. POST {OS_AUTH_URL}/v3/auth/tokens  (Keystone, password, project-scoped)
                             │ 2. ambil endpoint dari service catalog (type + region + interface)
                             ▼
             Nova (compute) · Neutron (network) · Glance (image)  @ os-api.hostvds.com
```

## ADR-001 — Pakai REST OpenStack langsung, bukan SDK
- **Konteks**: `python-openstackclient`/`openstacksdk` tidak jalan di Workers; lib JS OpenStack (pkgcloud dll.) bergantung pada Node API & tidak terawat.
- **Keputusan**: klien `fetch` minimal (~200 baris) untuk Keystone v3 + GET JSON.
- **Konsekuensi**: bundle kecil (11 KiB), tanpa dependensi runtime; kita harus menangani token/catalog sendiri.

## ADR-002 — Endpoint dari service catalog, bukan hardcode
- **Konteks**: Hanya `OS_AUTH_URL` yang diketahui pasti. URL Nova/Neutron/Glance HostVDS tidak terdokumentasi publik.
- **Keputusan**: baca catalog dari respons token, pilih by `type` + `region_id == OS_REGION_NAME` + `interface`. Tambah `/v2.0` (network) dan `/v2` (image) bila URL catalog tanpa versi (praktik standar openstacksdk).
- **Konsekuensi**: tahan perubahan URL provider; `/api/catalog` untuk verifikasi.

## ADR-003 — Cache token di memori isolate
- Token Keystone di-cache per isolate, refresh 5 menit sebelum `expires_at`, single-flight saat konkuren, retry sekali bila service balas 401.
- Alternatif KV ditolak untuk v0.1: menyimpan token di KV memperluas permukaan kebocoran; biaya auth per isolate dingin dapat diterima.

## ADR-004 — Nova microversion 2.47
- Agar `flavor` di server berisi vcpus/ram/disk tanpa N+1 request ke `/flavors/{id}`. Mapper tetap fallback ke `flavor.id` bila provider mengabaikan header.

## ADR-005 — Secret di Wrangler Secrets
- `OS_PASSWORD`, `API_KEY` → `wrangler secret put`. Identitas non-rahasia (auth URL, project, region) di `[vars]`.

## ADR-006 — Digabung ke Worker utama, katalog publik vs data server privat
- **Konteks**: repo sudah punya satu Worker yang menyajikan SPA + Tripay. Browser tidak boleh memegang secret.
- **Keputusan**: mount di `/api/vps/*` sebelum cek `path.includes()` lama; `run_worker_first = ["/api/*"]` agar API tidak jatuh ke `index.html`. `/catalog` publik (tanpa data pelanggan), `/servers*` & data mentah wajib `VPS_API_KEY`.
- **Konsekuensi**: satu deploy; perilaku Tripay tidak berubah (dites).

## ADR-007 — Paginasi Glance mengikuti link `next`
- Menurut api-ref Glance v2, `GET /v2/images` mengembalikan `next` sampai halaman terakhir. Worker mengikuti `next` (maks 20 halaman × 200) agar image tidak terpotong.

## ADR-008 — Harga dihitung di Worker
- OpenStack tidak punya data harga. Harga ditentukan server-side (`VPS_PRICING`), bukan di browser, supaya tidak bisa dimanipulasi dan bisa diubah tanpa build ulang frontend.
