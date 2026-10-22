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
