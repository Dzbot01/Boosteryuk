# Riset, Benchmark & Referensi

## 1. Analisis audio (data primer)
| Metrik | Hasil |
|---|---|
| Durasi | 233,712 dtk (48 kHz stereo MP3, 192 kbps) |
| Tempo | 161,5 BPM (interval beat 0,3715 dtk); 614 beat terdeteksi |
| Bagian energi tinggi | 1:08–1:32 (chorus 1), 2:32–2:56 (chorus 2), 3:27–3:50 (outro) |
| Bagian tenang | 0:00–0:12 intro, 1:33–1:36, 2:57–3:05 |

Implikasi: cut dan aksi karakter dikunci ke grid beat; shot di chorus dibuat lebih pendek (±2,5 dtk) daripada verse (±3–4 dtk).

## 2. Brand (audit repo `Dzbot01/boosteryuk.com`)
- Token warna Tailwind v4: palet biru/indigo/sky dipetakan ulang ke **cyan** (`#22d3ee`, `#06b6d4`, `#0891b2`, `#0e7490`), latar `#0f172a`.
- Font: `--font-sans: Plus Jakarta Sans`, `--font-display: Bricolage Grotesque`.
- OG image: wordmark "Booster" cyan + "yuk" putih, pill "SMM PANEL", klaim "698+ Layanan", "★ 4,9", "24/7 Support".
- Logo PNG di-host di domain eksternal yang diblokir dari environment → wordmark digambar ulang dari font brand (sesuai OG image).

## 3. Benchmark praktik terbaik → keputusan
| Referensi | Prinsip | Diterapkan sebagai |
|---|---|---|
| Netflix Timed Text Style Guide (umum & Indonesia) | Subtitle di bawah-tengah, maks 42 karakter/baris, maks 2 baris, durasi cukup dibaca | 34 px bawah-tengah, cue dipecah di batas kalimat, 2 cue panjang dibuat 2 baris |
| 12 Prinsip Animasi (Disney/Alan Becker; Clip Studio guide) | Squash & stretch, anticipation, follow-through, slow-in/out, arcs, secondary action, exaggeration | Squash saat mendarat, jongkok sebelum lompat, rambut/tali hoodie *lag*, easing back/elastic, lengan rubber-hose melengkung |
| Panduan ritme montage (CapCut: *Montage Rhythm*) | Kecepatan cut mengikuti energi musik; cut di downbeat | Shot di-*snap* ke beat; chorus pakai cut lebih rapat + zoom punch + flash |
| Video musik animasi berkarakter (mis. *Stuck in the Sound — Let's Go*, *Jenny*) | Satu protagonis konsisten membawa emosi; perubahan suasana lewat warna/cahaya | Palet biru-redup saat sedih, kuning-hangat saat ide muncul, cyan brand saat solusi |

## 4. Prinsip konten iklan yang dijaga
- Masalah → titik balik → solusi → bukti → ajakan (struktur *problem–agitate–solve*).
- Tidak memakai logo platform pihak ketiga; nama platform hanya sebagai teks layanan.
- Angka pertumbuhan di HP adalah cerita karakter fiktif, bukan janji hasil.

## Sumber
- Netflix Partner Help — Timed Text Style Guide: General Requirements: https://backlothelp.netflix.com/hc/en-us/articles/215758617
- Netflix Partner Help — Indonesian Timed Text Style Guide: https://backlothelp.netflix.com/hc/en-us/articles/216009727
- Clip Studio — Tips for Mastering the 12 Principles of Animation: https://www.clipstudio.net/en/animation/12-principles/
- CG Wire — The 12 Principles of Animation (2026): https://blog.cg-wire.com/12-principles-animation/
- CapCut — Montage Rhythm: Match Cut Speed to Music: https://www.capcut.com/create/music-video-pacing-emotional-montage-rhythm
- Between the Frames — Fundamentals of Animation in *Stuck in the Sound — Let's Go*: https://medium.com/betweentheframes/fundamentals-of-animation-in-stuck-in-the-sound-lets-go-3a12a4dd0665
- Between the Frames — Animation Fundamentals: *Jenny* (Official Music Video): https://medium.com/betweentheframes/animation-fundamentals-jenny-official-music-video-be625b4cf101
