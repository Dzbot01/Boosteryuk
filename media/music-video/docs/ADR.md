# Architecture Decision Records (ADR)

## ADR-001 — Pipeline render: Canvas 2D prosedural (Node) → ffmpeg
**Status:** Diterima · 9 Nov 2026

**Konteks.** Video 3:53 berisi ±77 scene animasi kartun yang harus sinkron ke beat dan lirik, dapat direvisi per scene, dan dibangun di container cloud tanpa GUI (2 vCPU, 7 GB RAM) tanpa aset gambar berlisensi.

**Opsi yang dibandingkan**
| Opsi | Kelebihan | Kekurangan |
|---|---|---|
| A. Tool NLE/AE manual | Kualitas tinggi | Tidak tersedia di environment, tidak reproducible |
| B. HTML/CSS + Playwright screenshot | API web familiar | Overhead browser ~50–100 ms/frame, sinkronisasi waktu rumit |
| C. **Canvas 2D di Node (`@napi-rs/canvas`, Skia) → raw RGBA → ffmpeg** | Deterministik (frame = f(t)), ±27 fps render 1080p per worker, tanpa browser | Semua gambar harus dibuat dari kode |
| D. Remotion (React) | Ekosistem video React | Butuh Chromium + bundling; berat untuk 2 vCPU; syarat lisensi untuk perusahaan |

**Keputusan.** Opsi C. Setiap frame dihitung murni dari waktu `t`, jadi revisi satu shot cukup render ulang file shot itu.

**Konsekuensi.**
- Satu file MP4 per shot (CRF 18, veryfast, 30 fps) → digabung `concat -c copy` → mux audio `-c:v copy` (tidak ada encode ganda).
- File ditulis sebagai `.part.mp4` lalu di-rename setelah ffmpeg exit 0 (mencegah file setengah jadi terpakai).
- 2 worker paralel diseimbangkan menurut jumlah frame.

## ADR-002 — Rig karakter: rubber-hose + wajah parametrik + kepala pseudo-3D
**Status:** Diterima (bagian anggota tubuh *digantikan* oleh ADR-005 pada v1.1)

**Konteks.** Diminta karakter kartun yang "tidak kaku" dan "punya ekspresi", identik di semua scene.

**Keputusan.**
- **Anggota tubuh rubber-hose**: lengan/kaki berupa kurva Bézier kuadratik dengan panjang tetap; makin dekat tangan ke bahu, makin melengkung (siku/lutut lentur). Ini memberi kesan lentur khas kartun tanpa sistem tulang.
- **Wajah parametrik**: 25+ preset ekspresi (happy, sad, cry, shocked, determined, excited/star-eyes, love, wink, yawn, dll.) dari 11 parameter numerik (kelopak, sudut alis, bukaan mulut, senyum, blush, ukuran pupil). Ekspresi bisa di-*blend* (`[a, b, k]`).
- **Kepala pseudo-3D**: fitur wajah diposisikan dengan `x = R·sin(φ+θ)` dan dipendekkan `cos(φ+θ)`, sehingga kepala bisa menoleh/berputar mulus.
- **Secondary motion**: pose dievaluasi di `t` dan `t−0,07 s`; selisih posisi kepala menggerakkan rambut (ahoge), tali hoodie, dsb. (prinsip *follow-through*).
- Kedipan otomatis pseudo-acak, squash & stretch, *anticipation* (jongkok sebelum lompat), *easing* back/elastic.

**Alternatif ditolak:** sprite sheet (tidak ada aset), Spine/Lottie (tool tidak tersedia, butuh aset).

## ADR-003 — Sinkronisasi musik dari analisis audio
**Status:** Diterima

`librosa` → tempo 161,5 BPM, 614 beat, fase downbeat, energi per detik, dan envelope vokal per frame (30 fps). Awal shot di-*snap* ke beat terdekat (toleransi ±0,2 s); bounce karakter, pulse UI, dan lip-sync panggung memakai data ini.

## ADR-004 — Subtitle: burn-in via Canvas + SRT terpisah
**Status:** Diterima

- Subtitle digambar di frame (font brand Plus Jakarta Sans 700, 34 px, outline + latar navy 50%), posisi bawah-tengah, fade 0,14 s.
- SRT asli (transkrip otomatis) dikoreksi: "Buster Yuk" → **"Boosteryuk"**, kalimat yang terpotong lintas cue dipecah ulang di batas kalimat (waktu interpolasi per jumlah karakter), deskriptor `[musik]` dihapus.
- SRT bersih diekspor ke `out/Boosteryuk_lirik_ID.srt` untuk CC YouTube.

## ADR-005 — Lengan & kaki anatomis: IK dua-tulang 3D dengan pole vector (v1.1)
**Status:** Diterima · 13 Nov 2026

**Konteks.** Umpan balik: tangan "asal tekuk". Lengan rubber-hose v1 berupa satu kurva dengan arah tekuk yang ditentukan tanda `bend`, sehingga siku bisa melengkung ke dalam atau ke atas dan lengan bisa memanjang melebihi panjangnya. Itu tidak mungkin pada lengan asli.

**Keputusan.**
- Lengan = **lengan atas (62) + lengan bawah (58)**, kaki = **paha (59) + betis (57)** dengan panjang tetap. Tidak ada stretch: target di luar jangkauan dijepit ke jangkauan maksimum.
- Solver **IK dua-tulang di 3D** (x kanan, y bawah, z ke arah kamera) lalu diproyeksikan ortografis. Kedalaman z membuat lengan yang menjulur ke depan tampak memendek (*foreshortening*), seperti lengan asli dilihat dari depan.
- Bidang tekuk ditentukan **pole vector** (prinsip yang sama dengan solver 2-bone IK Maya/Unreal):
  - siku → bawah-luar-belakang `(±0,5, 1, −0,6)`, diputar mengikuti arah hadap tubuh (`turn`);
  - lutut → depan-luar `(±0,35, 0, 1)`. Saat karakter menghadap samping, lutut menekuk ke arah jalan.
- Siku hanya menekuk satu arah, dalam rentang 0–~150° sesuai sendi engsel siku.
- Tangan dekat garis tengah tubuh (antara pinggul dan kepala) otomatis maju ke depan (`autoZ`), misalnya saat memegang HP, menyanyi, atau memegang hati.
- Preset gestur nyata (`GEST`):
  - `wave`: lengan atas ke samping, lengan bawah tegak, berayun di poros siku;
  - `pump`: kepalan setinggi kepala dengan siku menekuk;
  - `scratch`: siku terangkat ke luar saat menggaruk kepala.
- **Mic** (`pose.mic = 'R'|'L'`): posisi mulut dihitung dari geometri kepala. Tangan diletakkan di bawah-samping mulut, gagang digenggam di tengah, dan grille 2–8 cm dari mulut mengarah ke antara bibir bawah dan dagu (praktik teknik mic panggung).
- Arah telapak tangan mengikuti arah lengan bawah (siku → pergelangan).

**Konsekuensi.** Pose yang dulu mengandalkan lengan "melar" disetel ulang: melambai, kepal ke atas, garuk kepala, lari, dan trofi. Lembar uji visual: `tests/arm_sheet.js` (16 pose).
