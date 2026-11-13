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
- Tidak ada logo platform pihak ketiga yang digambar sendiri; nama platform tampil sebagai teks saja. Sejak v1.1, logo resmi Boosteryuk (yang memuat ikon platform) dipakai apa adanya.
- Klaim yang dipakai hanya yang tampil di situs resmi: 698+ Layanan, 4,9, Support 24/7, Bergaransi, Proses Cepat. Untuk hosting: "Tercepat/Super Cepat/Server Stabil", tanpa angka uptime.

## 4. Keterbatasan yang diketahui
- Lip-sync panggung memakai envelope energi vokal, bukan fonem.
- Lirik dipecah ulang dengan waktu interpolasi per jumlah karakter (± 0,3 s dari ucapan sebenarnya).
- ~~Logo PNG resmi tidak bisa diunduh dari environment (domain diblokir), jadi wordmark digambar ulang dari font brand.~~ Diselesaikan di v1.1: logo resmi dari pemilik brand dipakai.
- Ukuran 1080p ±98 MB melebihi batas file GitHub (100 MB tidak aman untuk git), sehingga MP4 tidak di-commit. Video bisa dibangun ulang dengan `node src/make.js`.

---
# Audit v1.1 — 13 Nov 2026 (gerak tangan, mic, logo)

## Perubahan yang diaudit
1. Lengan & kaki: rubber-hose → **IK dua-tulang 3D anatomis** (ADR-005).
2. Mic diarahkan ke mulut (grip tengah, grille di bawah bibir).
3. Logo resmi menggantikan wordmark di 17 titik: judul, gelembung ingatan, kartu brand, header aplikasi di HP, dashboard, roket, logo-hero, bendera, layar LED panggung, trofi, papan arah, langit, logo-slam, end card, dll.

## Hasil
| Cek | Hasil |
|---|---|
| Audit otomatis (`tools/audit.js`) | **10/10 PASS** (7012 frame, 233,733 s, 1080p30, AAC) |
| Lembar uji 16 pose (`tests/arm_sheet.js`) | Siku selalu menekuk ke bawah/luar; tidak ada lengan melar; telapak mengikuti lengan bawah |
| Sekuens gerak 10 fps: bernyanyi, melambai, lari | Mic tetap di depan mulut di semua frame; melambai berporos di siku; lengan lari menekuk ±90° |
| Contact sheet penempatan logo (11 scene) | Logo terbaca, tidak terpotong, tidak menabrak subtitle |

## Temuan & perbaikan
| # | Temuan | Perbaikan |
|---|---|---|
| 15 | Lengan melambai/kepal lurus kaku setelah IK (target di luar jangkauan) | Preset `GEST.wave` / `GEST.pump` dengan siku menekuk |
| 16 | Garuk kepala: siku menggantung di bawah | `elbowOut` 1,4 → siku terangkat ke samping |
| 17 | Ayunan tangan lari terlalu lebar | Amplitudo 46 → 36, tangan dekat badan |
| 18 | HP terlalu besar (seperti tablet) | 64×118 → 54×100 |
| 19 | Logo LED panggung tertutup kepala | Logo digeser ke 40% tinggi layar |
| 20 | Kedipan penuh tampak seperti lingkaran mata kosong | Kedipan > 80% digambar sebagai garis kelopak tertutup |

---
# Audit v1.2 — 13 Nov 2026 (gait, sepatu, rambut)

## Uji numerik (`node tests/gait_check.js`, sampling 120 Hz)
| Gait | Slip kaki menapak | Celah jangkauan kaki menapak | Turun pinggul maks |
|---|---|---|---|
| Jalan cepat (langkah 68, 2,0 langkah/s) | **0,000 px** | **0,00** | 15,8 |
| Jalan santai (langkah 60) | **0,000 px** | **0,00** | 13,5 |
| Lari (langkah 112, 161,5 spm) | **0,000 px** | **0,00** | 15,6 |

## Uji visual
- `tests/gait_sheet.js`: 8 fase jalan + 8 fase lari. Terlihat heel-strike, push-off di bola kaki, fase melayang saat lari, lengan berlawanan dengan kaki, badan condong saat lari, dan kaki/lengan jauh di belakang badan.
- `tests/head_cu.js`: rambut shaggy di 4 ekspresi dan 3 sudut kepala.
- Contact sheet scene jalan/lari (feet-step, run-forward, stairs, big-clock, days-walk, chase-star, signpost-walk) dan 22 scene berdiri: sol sepatu rata di tanah dan menyatu dengan ujung celana.

## Temuan & perbaikan
| # | Temuan | Perbaikan |
|---|---|---|
| 21 | Langkah berbasis waktu → kaki meluncur (contoh: big-clock 467 px/s vs langkah ±160 px/s) | Gait berbasis jarak; kecepatan scene = panjang langkah × cadence |
| 22 | Sepatu terpisah & sedikit terangkat (lingkaran bulat di ujung celana) | Model pergelangan + telapak; sol di tanah, ujung celana di atas sepatu |
| 23 | Tangga terlalu tinggi (90 px per anak tangga, > panjang kaki) | 30 px per anak tangga, satu anak tangga per langkah |
| 24 | Kaki tidak sampai ke tanah di langkah terlebar (celah 10–15) | Penurunan pinggul otomatis → 0 |
| 25 | Alis berhalo kulit terlihat aneh di atas poni | Alis cokelat tua dengan halo kilau rambut |
| 26 | Rambut belakang membentuk "kait" di sisi rahang | Bagian bawah rambut belakang disembunyikan di balik wajah |

Audit otomatis video final: lihat `out/audit.txt`.
