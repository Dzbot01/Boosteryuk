# Audit QA — Boosteryuk Official Music Video v1

Tanggal: 9 Nov 2026 · File: `out/Boosteryuk_Official_Music_Video_1080p.mp4` (±98 MB)

## 1. Audit otomatis (`node tools/audit.js`)
| Hasil | Cek | Detail |
|---|---|---|
| PASS | Video 1920×1080 H.264 | h264, yuv420p |
| PASS | 30 fps CFR | r=30/1, avg=30/1 |
| PASS | Jumlah frame = lagu | 7012 frame (target 7012) |
| PASS | Audio AAC stereo | 48 kHz, 192 kbps |
| PASS | Durasi = lagu (±0,05 s) | kontainer 233,733 s; audio 233,680 s; lagu 233,712 s |
| PASS | Σ frame shot = total | 77 shot |
| PASS | Cue subtitle urut, ≤ 2 baris | 35 cue |
| PASS | ≤ 42 karakter/baris | terpanjang 41 |
| PASS | Tidak ada segmen hitam | hanya fade-out yang disengaja di 3:53,5 |
| PASS | Tidak ada frame putih > 0,15 s | — |

**10/10 lolos.**

## 2. Audit visual (contact sheet 80+ frame + sekuens gerak 10 fps)
Temuan pada pass pertama dan perbaikannya:

| # | Temuan | Perbaikan |
|---|---|---|
| 1 | Alis tertutup poni (tidak terbaca) | Poni dinaikkan 12 px; alis diberi halo warna kulit |
| 2 | HP menutupi wajah di 6 scene | Helper `holdPhone()`: HP dipegang rendah, wajah menunduk |
| 3 | Karakter tertutup laptop (editing) | Karakter dinaikkan, laptop dipendekkan |
| 4 | Close-up menangis/lampu ide terpotong di bawah | Kamera digeser (y 470 → 650/610) |
| 5 | Shot kaki masih memperlihatkan kepala terpotong | Zoom 2,4 → 3,1, fokus ke kaki |
| 6 | Tangan penunjuk di POV terlalu kecil vs lengan | Tangan diskalakan 3,2× dan diposisikan dari ujung jari |
| 7 | **Frame putih penuh di logo-slam** (flash ke-2 aktif sebelum waktunya) | `flash()` mengabaikan waktu negatif & alpha > 1 |
| 8 | Glyph "★" tidak ada di font brand | Diganti ikon bintang vektor |
| 9 | Trofi menutupi wajah | Lengan & trofi dinaikkan |
| 10 | Teks "TOKO ONLINE" terpotong di split-screen | Etalase digeser |
| 11 | Petir surfing terlalu tipis | Skala vertikal 1,0 → 2,0 |
| 12 | Teks layar HP terlalu kecil | Ukuran font layar dinaikkan ±25% |

Temuan pada pass kedua (audit otomatis):

| # | Temuan | Perbaikan |
|---|---|---|
| 13 | 7010/7012 frame (opsi `-shortest` memotong 2 frame karena padding AAC) | `-shortest` dihapus |
| 14 | 4 baris subtitle 44 karakter (> 42) | Dipecah jadi 2 baris; hanya 11 shot yang dirender ulang |

## 3. Konsistensi brand & karakter
- Karakter utama (rambut jabrik, kulit sawo matang, hoodie cyan berlogo petir) identik di 77 shot; piyama hanya di adegan pagi sebelum "ganti baju".
- Wordmark Booster/yuk, warna cyan/navy, dan font Plus Jakarta Sans/Bricolage Grotesque dipakai di seluruh video.
- Tidak ada logo platform pihak ketiga. Nama platform tampil sebagai teks saja.
- Klaim yang dipakai hanya yang tampil di situs resmi: 698+ Layanan, 4,9, Support 24/7, Bergaransi, Proses Cepat. Untuk hosting: "Tercepat/Super Cepat/Server Stabil", tanpa angka uptime.

## 4. Keterbatasan yang diketahui
- Lip-sync panggung memakai envelope energi vokal, bukan fonem.
- Lirik dipecah ulang dengan waktu interpolasi per jumlah karakter (± 0,3 s dari ucapan sebenarnya).
- Logo PNG resmi tidak bisa diunduh dari environment (domain diblokir), jadi wordmark digambar ulang dari font brand.
- Ukuran 1080p ±98 MB melebihi batas file GitHub (100 MB tidak aman untuk git), sehingga MP4 tidak di-commit. Video bisa dibangun ulang dengan `node src/make.js`.
