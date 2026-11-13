# Worklog — Boosteryuk Official Music Video

## 2026-11-09 (WIB)
| Jam | Kegiatan |
|---|---|
| 14:33 | Brief diterima: video musik resmi sepanjang lagu, tema SMM panel + hosting tercepat, karakter kartun ekspresif yang sama di semua scene, subtitle kecil bawah-tengah |
| 14:35 | Inventaris aset: MP3 233,7 s (48 kHz), SRT transkrip otomatis 39 cue |
| 14:36 | Audit brand dari repo `Dzbot01/boosteryuk.com` (warna cyan/navy, font, wordmark, klaim OG) dan `Dzbot01/Boosteryuk` (ada `docs/hostvds` → lini hosting) |
| 14:37 | Analisis audio (librosa): 161,5 BPM, 614 beat, peta energi, envelope vokal 30 fps |
| 14:38 | Riset: Netflix Timed Text Style Guide, 12 prinsip animasi, ritme montage → `docs/RESEARCH.md` |
| 14:40 | ADR render pipeline (Canvas 2D Node → ffmpeg) & rig karakter rubber-hose |
| 14:45 | Engine (easing, keyframe, beat-sync, ikon) + rig karakter; uji 16 ekspresi |
| 14:50 | Background (kamar, ruang kerja, kota, panggung, ruang server, bukit), props, layar UI |
| 14:55 | Timeline 77 shot (shots1: 0:00–1:32, shots2: 1:32–3:53), subtitle bersih |
| 15:00 | Pass QA visual #1 (4 contact sheet) → 12 perbaikan komposisi |
| 15:05 | Render penuh (2 worker, 240 s) → concat → mux audio |
| 15:10 | Audit otomatis 8/10 → perbaiki jumlah frame & panjang baris subtitle → render ulang 11 shot (33 s) → **10/10** |
| 15:12 | Dokumen PRD, ADR, ERD/model data, storyboard (auto), audit, README |
| 15:15 | Commit & push ke GitHub `Dzbot01/Boosteryuk` branch `feat/music-video` (folder `media/music-video/`) |

## Keputusan penting
- Ejaan brand di subtitle: "Buster Yuk" (transkrip) → **Boosteryuk**.
- Deskriptor `[musik]` tidak ditampilkan di video (video musik), tetap bisa ditambahkan di SRT bila perlu.
- MP4 final tidak di-commit (±98 MB); dikirim langsung dan dapat dibangun ulang dari source.

## 2026-11-13 (WIB) — v1.1
| Jam | Kegiatan |
|---|---|
| 15:51 | Umpan balik: gerak tangan harus seperti dunia nyata (bukan asal tekuk), mic diarahkan ke mulut, ganti logo dengan logo resmi |
| 15:53 | Riset: ROM siku (0–150°, fungsional 30–130°), 2-bone IK + pole vector (Maya/Unreal), teknik memegang mic panggung |
| 15:58 | Logo resmi dipotong (964×498, transparan) → `assets/logo/`; loader aset async |
| 16:00 | Rig baru: IK dua-tulang 3D + pole vector (lengan & kaki), auto-depth, rig mic ke mulut, preset gestur |
| 16:05 | Lembar uji 16 pose → setel ulang lambai/kepal/garuk/lari/HP; perbaiki kedipan |
| 16:10 | Render penuh v1.1 (267 s) → audit 10/10 → cek sekuens gerak & penempatan logo |
| 16:15 | Dokumen ADR-005, riset, audit v1.1; commit & push `feat/music-video` |
