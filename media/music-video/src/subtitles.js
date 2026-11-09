'use strict';
// Cleaned lyric cues. Source: assets/lyrics_original.srt (auto-transcribed).
// Changes: "Buster Yuk" -> brand spelling "Boosteryuk"; cues re-segmented at sentence boundaries
// (split times interpolated by character count inside the original cue); [musik] descriptors removed.
const { P, clamp, rr, fs, text, tw, rgba } = require('./engine');

const CUES = [
  [12.80, 16.50, 'Setiap langkah dimulai dari keyakinan.'],
  [19.16, 22.50, 'Membangun mimpi dengan perencanaan.'],
  [24.60, 29.08, 'Konten dibuat dengan kesungguhan.'],
  [31.14, 34.50, 'Kini saatnya mendapat perhatian.'],
  [37.34, 40.48, 'Perjalanan tidak selalu mudah.'],
  [40.48, 43.42, 'Perlu strategi yang terarah.'],
  [43.42, 47.26, 'Bukan sekadar menunggu hasil.'],
  [48.58, 54.40, 'Tetapi memilih solusi\nyang tepat dan stabil.'],
  [54.40, 58.70, 'Ketika peluang datang menghampiri.'],
  [60.60, 65.82, 'Keputusan tepat menentukan arah hari ini.'],
  [67.90, 73.14, 'Boosteryuk! Mendukung\nsetiap langkahmu maju.'],
  [73.90, 79.14, 'Boosteryuk! Meningkatkan performa akunmu.'],
  [79.14, 85.50, 'Pilihan proses tercepat dan bergaransi\nmemberi hasil yang pasti.'],
  [86.14, 90.02, 'Untuk perkembangan yang lebih berarti.'],
  [92.28, 96.00, 'Boosteryuk hadir sebagai solusi.'],
  [99.18, 102.20, 'SMM panel dengan layanan lengkap.'],
  [104.84, 108.18, 'Dirancang untuk kebutuhan yang tepat.'],
  [110.10, 113.35, 'Dari peningkatan interaksi'],
  [113.35, 120.20, 'hingga pertumbuhan yang\nkonsisten dan pasti.'],
  [123.02, 125.89, 'Keamanan menjaga prioritas.'],
  [125.89, 128.76, 'Kecepatan menjadi kualitas.'],
  [128.76, 132.20, 'Bagi kreator maupun pelaku usaha.'],
  [134.46, 139.70, 'Semua dapat berkembang bersama.'],
  [140.48, 144.02, 'Pertumbuhan bukan sekadar angka.'],
  [146.28, 150.36, 'Tetapi kepercayaan yang dijaga.'],
  [151.92, 156.98, 'Boosteryuk! Mendukung\nsetiap langkahmu maju.'],
  [157.90, 163.35, 'Boosteryuk! Meningkatkan performa akunmu.'],
  [163.35, 169.52, 'Pilihan proses tercepat dan bergaransi\nmemberi hasil yang pasti.'],
  [169.52, 174.32, 'Untuk jenjang yang lebih tinggi.'],
  [176.26, 180.02, 'Boosteryuk! Pilihan terbaik hari ini.'],
  [182.10, 188.08, 'Waktu terus berjalan.'],
  [188.08, 191.78, 'Kesempatan tidak menunggu.'],
  [194.08, 199.92, 'Saatnya bertumbuh dengan arah yang jelas'],
  [199.92, 204.40, 'bersama Boosteryuk!'],
  [217.84, 225.00, 'Boosteryuk! Boosteryuk!'],
];

const SIZE = 34;          // small: ~3.1% of frame height
const LINE_H = 44;
const BOTTOM = 1080 - 54; // baseline of last line

function drawSubs(ctx, t) {
  for (const [a, b, str] of CUES) {
    if (t < a - 0.01 || t > b + 0.01) continue;
    const fade = Math.min(clamp((t - a) / 0.14), clamp((b - t) / 0.14));
    const rise = (1 - clamp((t - a) / 0.14)) * 8;
    const lines = str.split('\n');
    ctx.save(); ctx.globalAlpha = fade;
    lines.forEach((ln, i) => {
      const y = BOTTOM - (lines.length - 1 - i) * LINE_H + rise;
      const w = tw(ctx, ln, SIZE, 'PJS700');
      rr(ctx, 960 - w / 2 - 18, y - SIZE * 0.78, w + 36, SIZE * 1.42, 12); fs(ctx, rgba('#0b1222', 0.5));
      text(ctx, ln, 960, y, { size: SIZE, font: 'PJS700', color: '#ffffff', stroke: rgba('#0b1222', 0.85), lw: 6, base: 'middle' });
    });
    ctx.restore();
  }
}
function srt() {
  const f = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
  return CUES.map(([a, b, s], i) => `${i + 1}\n${f(a)} --> ${f(b)}\n${s}\n`).join('\n');
}
module.exports = { CUES, drawSubs, srt };
