# PRD / Creative Brief — Boosteryuk Official Music Video

| Item | Nilai |
|---|---|
| Versi | 1.2 (13 Nov 2026: gait jalan/lari biomekanis, sepatu menapak, rambut shaggy cokelat; v1.1: tangan anatomis, mic, logo resmi) |
| Tanggal | 9 Nov 2026 |
| Pemilik | Boosteryuk (boosteryuk.com) |
| Status | Selesai v1 (render final + audit) |

## 1. Latar belakang & tujuan
Boosteryuk punya lagu jingle (3:53) berlirik Indonesia tentang perjalanan kreator yang menemukan solusi **SMM panel** tercepat. Kita butuh **video musik resmi** sepanjang durasi lagu untuk YouTube, Reels/TikTok (versi potong), dan materi iklan.

**Tujuan**
1. Menceritakan perjalanan emosional satu karakter: bangun tidur → bikin konten → sepi penonton → sedih → ingat Boosteryuk → tumbuh.
2. Memperkenalkan dua lini layanan: **SMM Panel** (followers, likes, views, dsb.) dan **Hosting & VPS tercepat**.
3. Memperkuat brand: warna, wordmark, dan domain `boosteryuk.com` tampil konsisten.

## 2. Audiens
Kreator konten pemula–menengah dan pelaku UMKM/toko online di Indonesia (18–35 tahun), mobile-first.

## 3. Kebutuhan fungsional
| ID | Kebutuhan | Prioritas |
|---|---|---|
| F1 | Durasi video = durasi lagu (233,712 dtk) | Wajib |
| F2 | Karakter kartun utama yang **sama** di setiap scene, ekspresif, gerakan tidak kaku | Wajib |
| F3 | Adegan sesuai makna tiap kalimat lirik | Wajib |
| F4 | Scene berganti cepat; cut disinkronkan ke ketukan (beat) | Wajib |
| F5 | Subtitle **kecil, bawah-tengah**, sinkron dengan lirik | Wajib |
| F6 | Alur pembuka: bangun tidur → lihat HP → buat konten → sepi → sedih → ingat Boosteryuk | Wajib |
| F7 | Tema SMM panel + jasa hosting tercepat | Wajib |
| F8 | End card berisi logo, domain, dan layanan | Sebaiknya |
| F9 | File SRT terpisah (bisa diunggah sebagai CC) | Sebaiknya |

## 4. Kebutuhan non-fungsional
- **Spesifikasi output:** 1920×1080, 30 fps CFR, H.264 (CRF 18, yuv420p), AAC 192 kbps, MP4 faststart.
- **Reproducible:** seluruh video dibangun dari kode (satu perintah `node src/make.js`), tanpa aset berlisensi pihak ketiga.
- **Brand-safe:** di luar logo resmi Boosteryuk (yang memuat ikon platform dan dipakai apa adanya), tidak ada logo platform pihak ketiga yang digambar sendiri; nama platform hanya teks. Tidak ada klaim angka yang tidak berasal dari Boosteryuk sendiri.
- **Keterbacaan subtitle:** ≤ 42 karakter/baris, ≤ 2 baris, kontras tinggi (outline + latar semi-transparan).

## 5. Spesifikasi brand (dari repo `Dzbot01/boosteryuk.com`)
- Warna utama: cyan `#22d3ee` / `#06b6d4` / `#0891b2`, navy `#0f172a`.
- **Logo resmi** (v1.1): `assets/logo/boosteryuk-logo.png` (PNG transparan dari pemilik brand, sama dengan `LOGO_URL` di situs). Dipakai di semua kemunculan logo; wordmark teks hanya cadangan jika gambar gagal dimuat.
- Font: Plus Jakarta Sans (teks), Bricolage Grotesque (display).
- Klaim yang dipakai (sumber: og-image situs): "SMM Panel", "698+ Layanan", "★ 4,9", "Support 24/7", "Booster Media Sosial Terpercaya".

## 6. Struktur cerita (ringkas)
| Bagian | Waktu | Isi |
|---|---|---|
| Intro | 0:00–0:12 | Kota subuh, judul, tidur, alarm, bangun, cek HP |
| Verse 1 | 0:12–0:37 | Langkah pertama, ganti baju, rencana, rekam konten, edit, unggah, menunggu |
| Pre-chorus | 0:37–1:07 | Statistik sepi, sedih, bingung, menangis → lampu ide → ingat Boosteryuk → pesan |
| Chorus 1 | 1:07–1:32 | Roket meluncur, lari, angka naik, kecepatan, garansi, pohon tumbuh |
| Verse 2 | 1:32–2:31 | Logo hero, dashboard, layanan lengkap, tepat sasaran, interaksi, grafik, **keamanan & hosting**, kreator & UMKM, bersama, kepercayaan |
| Chorus 2 | 2:31–3:00 | Panggung konser, angka naik, surfing petir, garansi 100%, tangga, trofi |
| Bridge | 3:00–3:25 | Senja, jam berjalan, kejar bintang "Peluang", jalan ke arah jelas |
| Outro | 3:25–3:53 | Montage hosting, fitur, dansa bersama, logo slam, end card |

Detail per shot: lihat [`STORYBOARD.md`](STORYBOARD.md).

## 7. Kriteria penerimaan
- [x] Durasi video = 233,7 dtk (± 1 frame) dan audio tidak terpotong.
- [x] 77 shot; rata-rata ~3 dtk/shot, chorus ~2,5 dtk/shot.
- [x] Karakter utama identik (rambut, wajah, hoodie cyan) di semua scene.
- [x] Subtitle 34 px (≈3,1% tinggi frame), bawah-tengah, sinkron dengan SRT.
- [x] Tidak ada frame kosong/putih penuh (lihat AUDIT).

## 8. Di luar cakupan (v1)
Versi vertikal 9:16, sulih suara/voice-over, terjemahan subtitle, animasi lip-sync per fonem.

## 9. Risiko & mitigasi
| Risiko | Mitigasi |
|---|---|
| Transkrip SRT otomatis keliru (mis. "Buster Yuk") | Dikoreksi ke "Boosteryuk"; kalimat dipecah ulang di batas kalimat |
| Klaim layanan tidak akurat | Hanya klaim yang tampil di situs resmi; tanpa angka uptime/harga |
| Hak cipta visual | Semua grafis digambar dari kode; tanpa logo pihak ketiga |
