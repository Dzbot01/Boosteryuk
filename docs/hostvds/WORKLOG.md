# Worklog

## 2026-10-22 — v0.1 HostVDS VPS data worker
- Riset: HostVDS = OpenStack (Keystone v3 di `os-api.hostvds.com/identity`, region `eu-west2`). Tidak ada dokumentasi API publik khusus HostVDS → pakai API OpenStack standar + service catalog.
- Akses repo `Dzbot01/Boosteryuk` gagal dari sesi cloud (GitHub App/akses belum diberikan) → proyek dibangun lokal dengan struktur repo (`worker/index.ts`, `wrangler.toml` di root), siap digabung.
- Implementasi: `worker/openstack.ts` (Keystone, catalog, cache token, retry), `worker/mappers.ts` (Nova → VpsSummary), `worker/index.ts` (router, auth, CORS, edge cache).
- Validasi: tsc, 12 unit test, wrangler dry-run, smoke test workerd lokal. Lihat AUDIT.md.
- Temuan: password OpenStack terekspos di bucket Supabase public → wajib dirotasi.
- Berikutnya: uji live `/api/catalog`, rotasi kredensial, fase 2 (aksi start/stop/reboot, snapshot D1 + Cron).

## 2026-10-22 — v0.2 integrasi ke repo + UI Order VPS
- Repo dijadikan public → clone berhasil. Ternyata `worker/index.ts` adalah Worker utama (SPA assets + Tripay), jadi modul HostVDS dipindah ke `worker/hostvds/` dan di-mount di `/api/vps/*`.
- `wrangler.toml`: compatibility_date 2026-10-01, `run_worker_first = ["/api/*"]`, observability, vars HostVDS, daftar secret.
- Endpoint publik baru `/api/vps/catalog` (flavor berharga, image, region).
- Frontend: `src/services/vpsApi.ts` (fetch + mapping + hook `useVpsCatalog`), `OrderVpsPage.tsx` memakai data live dengan skeleton & fallback; `RegionCard` mendukung region tanpa data ping; tipe `PlanSpec/ImageSpec/RegionSpec` diperluas (opsional, kompatibel).
- Verifikasi dengan api-ref OpenStack → paginasi Glance diperbaiki.
- Berikutnya: deploy + `wrangler secret put OS_PASSWORD/VPS_API_KEY`, cek `/api/vps/endpoints`, isi `REGION_META` & `VPS_PRICING` sesuai HostVDS, sambungkan tombol "Buat Server" ke `POST /servers` (fase 2).

## 2026-10-23 — v0.3 frontend memanggil Worker langsung
- PR #1 di-merge; build production Cloudflare sukses. Build preview PR gagal (kemungkinan pengaturan preview di dashboard, kode yang sama lolos di `main`).
- Commit `728b65d` (owner) menghapus `[assets]` dari `wrangler.toml` → Worker kini hanya API, frontend di-host Vercel.
- Akibatnya `fetch('/api/vps/catalog')` same-origin tidak sampai ke Worker → halaman selalu fallback. Fix: `vpsApi.ts` memanggil `https://boosteryuk.boosteryukid.workers.dev` (override `VITE_VPS_API_URL`). CORS Worker sudah `*`.
- Tambah `src/vite-env.d.ts` (tipe `import.meta.env`) → error TS frontend 11 → 9.

## 2026-10-23 — Header scroll + mode demo + 2 deployment Vercel
- `Header.tsx`: di posisi paling atas header polos (tanpa card/border/bayangan); setelah scroll > 12px berubah jadi card mengambang transparan (glass, `bg-white/55` + blur). Transisi 300ms, listener scroll pasif + rAF.
- `AuthContext.tsx`: `VITE_DEMO_MODE=true` → `DemoAuthProvider` (langsung login sebagai user demo, tanpa memanggil API auth). Tanpa env ini `RealAuthProvider` = logika lama tanpa perubahan; kode demo ikut terbuang dari bundle production (diverifikasi: string `demo-token` tidak ada di bundle prod).
- Badge "DEMO" di header hanya pada build demo.
- Deploy: 2 project Vercel baru — production (auth asli) dan testing (demo).
- Vercel (akun masciosa-7110, project baru, deploy dari branch `feat/header-scroll-demo-mode` @ `aa6ef3a`):
  - Production (auth asli): https://boosteryuk-production.vercel.app — bundle `index-CyIj9d_D.js` = build prod yang dites.
  - Testing (demo, `VITE_DEMO_MODE=true`): https://boosteryuk-testing.vercel.app — bundle `index-DfpRFx2M.js` = build demo yang dites.
  - Vercel Authentication diubah ke "preview only" agar URL production kedua project bisa diakses publik.
  - Tambah `vercel.json` (rewrite SPA) supaya deep link seperti `/ordervps` tidak 404.
  - Catatan: project belum terhubung Git → push berikutnya tidak auto-deploy; deploy ulang manual atau hubungkan repo di Vercel.
