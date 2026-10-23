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

## 2026-10-23 — Revisi header (feedback user)
- Header saat scroll tidak lagi berupa card mengambang (inset + rounded). Posisi, lebar (rata kiri-kanan), tinggi dan isi header **identik** dengan saat di atas; yang berubah hanya latar: transparan → glass `bg-white/55` + blur + garis bawah tipis.
- Diverifikasi di Chromium: bounding box header & isi sama persis sebelum/sesudah scroll (desktop 1280×69, mobile 390×69), radius 0, lebar penuh.

## 2026-10-23 — UI polish, i18n, dark mode, loading modal, WhatsApp preview
Permintaan user (satu batch), semua dengan komentar di kode yang berubah:
1. **Teks:** "Kata mereka yang puas." → "Apa kata mereka." (`ReviewsSection`).
2. **Desktop:** halaman Layanan jadi 2 kolom (form Buat Pesanan rata kiri 440px, slider kanan 16:10 sticky); slider OrderVps `lg:aspect-[3/1]`; utility `.page-align-left` (index.css) membuat kolom sempit di 17 halaman rata kiri sejajar header di ≥ lg. Mobile tidak berubah.
3. **Dihapus:** banner push notifikasi (`PushBanner`), popup "Aktifkan Notifikasi?" (`AutoNotif` di App.tsx), titik indikator di tombol menu header.
4. **Bahasa:** `src/i18n` — LanguageProvider (localStorage `bt-lang`), toggle geser/klik di Pengaturan, penerjemah DOM (MutationObserver) + kamus `en.ts` (≈710 entri, diekstrak otomatis dari JSX via TS compiler lalu diterjemahkan) + pola teks dinamis. Diverifikasi: 19 halaman EN → hanya 2 teks sengaja tidak diterjemahkan (format struk yang di-parse & template pesan WA ke admin). Kembali ke ID mengembalikan teks asli.
5. **Dark mode:** akar masalah = komponen tanpa varian `dark:` + warna inline hex. Fix: token `--by-*` (index.css) untuk BuatPesananCard/OrderVpsPage, codemod yang hanya MENAMBAH varian `dark:` (teks/latar/border/hover) di 29 file (mode terang tidak berubah), pengecualian manual (titik slider, knob toggle, struk kertas putih). Audit kontras otomatis: 213 → 16 teks kontras rendah (sisa = tombol brand, sama di mode terang).
6. **Loading modal:** `InfoModal` (pengumuman tiap buka/refresh) diganti `AuthLoadingModal` — tampil sekali saat auth pertama dimuat. `ProtectedRoute` menunggu `loading` (refresh halaman login-only tidak lagi terlempar ke beranda). Bug overlay tertinggal (timer terbatalkan cleanup) ditemukan saat QA & diperbaiki.
7. **Menu navbar:** logo & nama brand di header menu dihapus; judul "Apa yang sedang kamu butuhkan?".
8. **WhatsApp preview:** meta OG/Twitter baru + `public/og-image.jpg` (1200×630 JPG 99 KB). URL absolut via plugin `siteUrlPlugin` (vite.config.ts): VITE_SITE_URL → domain production Vercel → boosteryuk.com.
   - Screenshot asli boosteryuk.com berhasil diambil di Vercel Sandbox (meta live masih menunjuk cekidku.my.id), tapi file tidak bisa ditransfer keluar sandbox (respons tool dipotong ~2 KB, host sandbox diblokir dari container). Gambar akhirnya diambil dari build production repo yang sama (kode identik dengan boosteryuk.com), aset eksternal yang diblokir disembunyikan.
9. **Deploy & verifikasi (PR #4, `6c3a689`):** Vercel `boosteryuk-production` (dpl_GfQNa999…) & `boosteryuk-testing` (dpl_ACQsdM4g…) READY. HTML live berisi `og:image` absolut ke domain masing-masing; `/og-image.jpg?v=3` → 200 `image/jpeg` 98.906 B. Workers Builds preview Cloudflare gagal (pola lama untuk branch non-main, kode worker tidak disentuh) — dikomentari di PR #4.
