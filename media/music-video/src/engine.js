'use strict';
// Core engine: canvas constants, fonts, easing, keyframes, beat sync, drawing helpers, icons.
const path = require('path');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');

const W = 1920, H = 1080, FPS = 30;
const ROOT = path.join(__dirname, '..');
for (const [f, n] of [['PJS-600', 'PJS600'], ['PJS-700', 'PJS700'], ['PJS-800', 'PJS800'], ['BG-800', 'BG800'], ['BG-700', 'BG700']]) {
  GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts', f + '.ttf'), n);
}
const BEATS = require('../analysis/beats.json');
const beats = BEATS.beats;
const BEAT_LEN = 60 / BEATS.tempo;

// Brand palette (from boosteryuk.com: Tailwind cyan scale + slate/navy)
const P = {
  navy: '#0f172a', navy2: '#0b1222', slate: '#1e293b', slate7: '#334155', slate5: '#64748b',
  cyan: '#22d3ee', cyan3: '#67e8f9', cyan5: '#06b6d4', cyan6: '#0891b2', cyan7: '#0e7490', cyanL: '#a5f3fc', cyanXL: '#ecfeff',
  white: '#ffffff', yellow: '#facc15', gold: '#fbbf24', orange: '#fb923c', pink: '#f472b6', red: '#ef4444',
  green: '#22c55e', lime: '#a3e635', purple: '#a78bfa', blue: '#60a5fa', out: '#14213a',
};

// ---------- math ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  linear: k => k,
  in: k => k * k * k,
  out: k => 1 - Math.pow(1 - k, 3),
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  sine: k => -(Math.cos(Math.PI * k) - 1) / 2,
  back: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  elastic: k => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  hold: k => (k >= 1 ? 1 : 0),
};
const prog = (t, a, b, ease = 'linear') => E[ease](clamp((t - a) / (b - a)));
// Keyframes: K(t, [[t0,v0],[t1,v1,'ease'],...])
function K(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const k = E[e || 'inOut'](clamp((t - t0) / (t1 - t0 || 1e-6)));
      return lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }

// ---------- beat sync ----------
function beatIdx(t) {
  if (t < beats[0]) return -1;
  let lo = 0, hi = beats.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (beats[m] <= t) lo = m; else hi = m - 1; }
  return lo;
}
function beat(t) {
  const i = beatIdx(t);
  const b0 = i < 0 ? beats[0] - BEAT_LEN : beats[i];
  const b1 = beats[i + 1] !== undefined ? beats[i + 1] : b0 + BEAT_LEN;
  const since = t - b0;
  const di = (((i - BEATS.downbeat_phase) % 4) + 4) % 4;
  return { i, since, phase: clamp(since / (b1 - b0)), pulse: Math.exp(-since * 9), down: di === 0, inBar: di };
}
function snapBeat(t, tol = 0.2) {
  let best = t, bd = tol;
  for (const b of beats) { const d = Math.abs(b - t); if (d < bd) { bd = d; best = b; } if (b > t + tol) break; }
  return best;
}
function voc(t) { const i = clamp(Math.round(t * FPS), 0, BEATS.voc30.length - 1); return BEATS.voc30[i]; }
function rms(t) { const i = clamp(Math.round(t * FPS), 0, BEATS.rms30.length - 1); return BEATS.rms30[i]; }

// ---------- color ----------
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mixC(h1, h2, k) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(k))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function gradStops(stops, k) { // stops: [[pos,hex],...]
  if (k <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (k <= stops[i][0]) return mixC(stops[i - 1][1], stops[i][1], (k - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
}

// ---------- draw helpers ----------
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), rot, 0, Math.PI * 2); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }
function fs(ctx, fill, stroke, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, col, lw) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke(); }
function glow(ctx, x, y, r, color, a = 1) {
  if (r <= 0 || a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.4, rgba(color, a * 0.45)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function text(ctx, str, x, y, o = {}) {
  const { size = 48, font = 'PJS800', color = '#fff', align = 'center', base = 'middle', stroke = null, lw = 0, alpha = 1, spacing = 0 } = o;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) { try { ctx.letterSpacing = spacing + 'px'; } catch (e) { /* ignore */ } }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.restore();
}
function tw(ctx, str, size, font = 'PJS800') { ctx.save(); ctx.font = `${size}px ${font}`; const w = ctx.measureText(str).width; ctx.restore(); return w; }
// Draw a list of parts with a shared outline (outline pass, then fill pass) so overlaps merge.
function parts(ctx, list, fill, out = P.out, ow = 5) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    for (const s of list) {
      const f = s.fill || fill;
      if (s.c) { circ(ctx, s.x, s.y, s.r); if (pass === 0) { ctx.strokeStyle = out; ctx.lineWidth = ow * 2; ctx.stroke(); } else { ctx.fillStyle = f; ctx.fill(); } }
      else if (s.l) { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.strokeStyle = pass === 0 ? out : f; ctx.lineWidth = pass === 0 ? s.w + ow * 2 : s.w; ctx.stroke(); }
      else if (s.p) { s.p(ctx); if (pass === 0) { ctx.strokeStyle = out; ctx.lineWidth = ow * 2; ctx.stroke(); } else { ctx.fillStyle = f; ctx.fill(); } }
    }
  }
}

// ---------- icons (centered at x,y; s = nominal size) ----------
function heartPath(ctx, x, y, s) {
  const k = s / 2; ctx.beginPath(); ctx.moveTo(x, y + k * 0.85);
  ctx.bezierCurveTo(x - k * 1.7, y - k * 0.15, x - k * 0.85, y - k * 1.3, x, y - k * 0.45);
  ctx.bezierCurveTo(x + k * 0.85, y - k * 1.3, x + k * 1.7, y - k * 0.15, x, y + k * 0.85); ctx.closePath();
}
function starPath(ctx, x, y, r, rot = 0, n = 5, inner = 0.48) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / n; const rr2 = i % 2 ? r * inner : r;
    const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function sparkle(ctx, x, y, r, col = '#fff', a = 1) {
  if (a <= 0 || r <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
const ICON = {
  heart(ctx, x, y, s, col = P.red) { heartPath(ctx, x, y, s); fs(ctx, col); },
  user(ctx, x, y, s, col = '#fff') { circ(ctx, x, y - s * 0.18, s * 0.22); fs(ctx, col); ctx.beginPath(); ctx.arc(x, y + s * 0.42, s * 0.38, Math.PI, 0); ctx.closePath(); fs(ctx, col); },
  play(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x - s * 0.28, y - s * 0.36); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x - s * 0.28, y + s * 0.36); ctx.closePath(); ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = s * 0.12; ctx.stroke(); fs(ctx, col); },
  comment(ctx, x, y, s, col = '#fff') { rr(ctx, x - s * 0.45, y - s * 0.36, s * 0.9, s * 0.62, s * 0.2); fs(ctx, col); ctx.beginPath(); ctx.moveTo(x - s * 0.15, y + s * 0.2); ctx.lineTo(x - s * 0.3, y + s * 0.45); ctx.lineTo(x + s * 0.08, y + s * 0.22); fs(ctx, col); },
  eye(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x, y - s * 0.5, x + s * 0.5, y); ctx.quadraticCurveTo(x, y + s * 0.5, x - s * 0.5, y); fs(ctx, col); circ(ctx, x, y, s * 0.16); fs(ctx, P.navy); },
  check(ctx, x, y, s, col = '#fff', lw) { ctx.beginPath(); ctx.moveTo(x - s * 0.32, y + s * 0.02); ctx.lineTo(x - s * 0.08, y + s * 0.26); ctx.lineTo(x + s * 0.36, y - s * 0.24); ctx.strokeStyle = col; ctx.lineWidth = lw || s * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); },
  bolt(ctx, x, y, s, col = P.yellow) { ctx.beginPath(); const k = s / 2; ctx.moveTo(x + k * 0.15, y - k); ctx.lineTo(x - k * 0.55, y + k * 0.12); ctx.lineTo(x - k * 0.02, y + k * 0.12); ctx.lineTo(x - k * 0.2, y + k); ctx.lineTo(x + k * 0.58, y - k * 0.15); ctx.lineTo(x + k * 0.05, y - k * 0.15); ctx.closePath(); fs(ctx, col); },
  share(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x - s * 0.4, y + s * 0.3); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.15, x + s * 0.12, y - s * 0.12); ctx.lineTo(x + s * 0.12, y - s * 0.38); ctx.lineTo(x + s * 0.45, y - s * 0.02); ctx.lineTo(x + s * 0.12, y + s * 0.28); ctx.lineTo(x + s * 0.12, y + s * 0.06); ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.02, x - s * 0.4, y + s * 0.3); ctx.closePath(); fs(ctx, col); },
  bookmark(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x - s * 0.28, y - s * 0.42); ctx.lineTo(x + s * 0.28, y - s * 0.42); ctx.lineTo(x + s * 0.28, y + s * 0.42); ctx.lineTo(x, y + s * 0.18); ctx.lineTo(x - s * 0.28, y + s * 0.42); ctx.closePath(); fs(ctx, col); },
  live(ctx, x, y, s, col = P.red) { rr(ctx, x - s * 0.5, y - s * 0.3, s, s * 0.6, s * 0.12); fs(ctx, col); text(ctx, 'LIVE', x, y + 1, { size: s * 0.3, color: '#fff' }); },
  star(ctx, x, y, s, col = P.yellow) { starPath(ctx, x, y, s * 0.5); fs(ctx, col); },
  shield(ctx, x, y, s, col = P.cyan) { const k = s / 2; ctx.beginPath(); ctx.moveTo(x, y - k); ctx.quadraticCurveTo(x + k * 0.5, y - k * 0.7, x + k * 0.85, y - k * 0.72); ctx.quadraticCurveTo(x + k * 0.9, y + k * 0.5, x, y + k); ctx.quadraticCurveTo(x - k * 0.9, y + k * 0.5, x - k * 0.85, y - k * 0.72); ctx.quadraticCurveTo(x - k * 0.5, y - k * 0.7, x, y - k); ctx.closePath(); fs(ctx, col); },
  clock(ctx, x, y, s, col = '#fff') { circ(ctx, x, y, s * 0.42); ctx.strokeStyle = col; ctx.lineWidth = s * 0.1; ctx.stroke(); line(ctx, x, y, x, y - s * 0.24, col, s * 0.09); line(ctx, x, y, x + s * 0.18, y, col, s * 0.09); },
  tag(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x - s * 0.42, y - s * 0.1); ctx.lineTo(x - s * 0.1, y - s * 0.42); ctx.lineTo(x + s * 0.42, y - s * 0.42); ctx.lineTo(x + s * 0.42, y + s * 0.1); ctx.lineTo(x + s * 0.1, y + s * 0.42); ctx.closePath(); fs(ctx, col); circ(ctx, x + s * 0.2, y - s * 0.2, s * 0.08); fs(ctx, P.navy); },
  headset(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.arc(x, y + s * 0.05, s * 0.34, Math.PI, 0); ctx.strokeStyle = col; ctx.lineWidth = s * 0.1; ctx.stroke(); rr(ctx, x - s * 0.44, y, s * 0.18, s * 0.3, s * 0.06); fs(ctx, col); rr(ctx, x + s * 0.26, y, s * 0.18, s * 0.3, s * 0.06); fs(ctx, col); },
  server(ctx, x, y, s, col = '#fff') { for (let i = 0; i < 3; i++) { rr(ctx, x - s * 0.42, y - s * 0.42 + i * s * 0.29, s * 0.84, s * 0.24, s * 0.05); fs(ctx, col); circ(ctx, x + s * 0.28, y - s * 0.3 + i * s * 0.29, s * 0.04); fs(ctx, P.green); } },
  rocket(ctx, x, y, s, col = '#fff') { ctx.beginPath(); ctx.moveTo(x, y - s * 0.48); ctx.quadraticCurveTo(x + s * 0.26, y - s * 0.2, x + s * 0.16, y + s * 0.26); ctx.lineTo(x - s * 0.16, y + s * 0.26); ctx.quadraticCurveTo(x - s * 0.26, y - s * 0.2, x, y - s * 0.48); fs(ctx, col); circ(ctx, x, y - s * 0.1, s * 0.08); fs(ctx, P.navy); ctx.beginPath(); ctx.moveTo(x - s * 0.08, y + s * 0.3); ctx.lineTo(x, y + s * 0.5); ctx.lineTo(x + s * 0.08, y + s * 0.3); fs(ctx, P.orange); },
};

function vignette(ctx, a = 0.35) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(5,10,25,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function camera(ctx, { zoom = 1, x = W / 2, y = H / 2, rot = 0, shake = 0, t = 0 } = {}) {
  const sx = shake ? noise(t * 23.1) * shake : 0, sy = shake ? noise(t * 19.7 + 50) * shake : 0;
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
}

// Image assets (async load once before drawing)
const ASSETS = {};
async function loadAssets() {
  if (!ASSETS.logo) ASSETS.logo = await loadImage(path.join(ROOT, 'assets', 'logo', 'boosteryuk-logo.png'));
  return ASSETS;
}

module.exports = {
  ASSETS, loadAssets,
  W, H, FPS, P, BEATS, beats, BEAT_LEN, createCanvas,
  clamp, lerp, E, prog, K, mulberry32, hash, noise,
  beat, beatIdx, snapBeat, voc, rms,
  rgba, mixC, gradStops, rr, ell, circ, fs, line, glow, text, tw, parts,
  heartPath, starPath, sparkle, ICON, vignette, camera,
};
