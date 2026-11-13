'use strict';
// Shared shot-building helpers.
const En = require('./engine');
const C = require('./character');
const U = require('./ui');
const B = require('./bg');
const { W, H, P, clamp, lerp, rgba, glow, rr, fs, circ, line, text, mulberry32 } = En;

// draw an actor with secondary-motion lag
function act(ctx, fn, lt) { C.drawChar(ctx, fn(lt), fn(lt - 0.07)); }
// close-up placement: head centre on screen at (x, hy) with scale s
function cu(x, hy, s) { return { x, y: hy + 288 * s, s }; }

// Phone held in a hand, seen from the user's POV.
function pov(ctx, lt, T, screen, o = {}) {
  const { bg = 'room', tilt = -0.035, shake = 0, glowA = 0.6, x = 960, y = 560, s = 1, finger = null, thumbSwipe = 0 } = o;
  if (bg === 'room') { const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100); g.addColorStop(0, o.c1 || '#f6d8b5'); g.addColorStop(1, o.c2 || '#c79a76'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); bokeh(ctx, T, o.bokeh || ['#ffffff', '#ffe4b5']); }
  else if (bg === 'blue') { const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100); g.addColorStop(0, '#5b6b9a'); g.addColorStop(1, '#1e2747'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); bokeh(ctx, T, ['#93c5fd', '#64748b']); }
  else B.brandBg(ctx, T, { pulse: En.beat(T).pulse * 0.5 });
  const wob = Math.sin(lt * 1.7) * 0.01 + (shake ? En.noise(T * 20) * 0.02 * shake : 0);
  const pw = 450 * s, ph = 920 * s;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt + wob);
  // holding hand (left) behind phone bottom
  const cast = C.CAST.main;
  // sleeve from bottom-left
  ctx.lineCap = 'round';
  line(ctx, -pw * 0.62, ph * 0.75, -pw * 0.42, ph * 0.38, P.out, 120 * s); line(ctx, -pw * 0.62, ph * 0.75, -pw * 0.42, ph * 0.38, '#25c4df', 100 * s);
  U.phone(ctx, 0, 0, pw, ph, 0, { screen, glowA });
  // fingers wrapping left edge
  for (let i = 0; i < 3; i++) { En.ell(ctx, -pw * 0.5, ph * 0.12 + i * 52 * s, 34 * s, 22 * s, 0.2); fs(ctx, cast.skin, P.out, 4); }
  En.ell(ctx, -pw * 0.43, ph * 0.38, 70 * s, 58 * s); fs(ctx, cast.skin, P.out, 5);
  ctx.restore();
  if (finger) { // pointing finger from bottom right toward (fx,fy)
    const [fx, fy] = finger; const sx = W + 60, sy = H + 160;
    const ang = Math.atan2(fy - sy, fx - sx); const dx = Math.cos(ang), dy = Math.sin(ang);
    const hs = 3.2; const hx = fx - dx * 30 * hs, hy = fy - dy * 30 * hs + 6 * hs;
    ctx.save(); ctx.lineCap = 'round';
    line(ctx, sx, sy, hx - dx * 40, hy - dy * 40, P.out, 104); line(ctx, sx, sy, hx - dx * 40, hy - dy * 40, '#25c4df', 86);
    ctx.translate(hx, hy); ctx.scale(hs, hs); C.hand(ctx, 0, 0, ang, 'point', cast, 1);
    ctx.restore();
  }
}
function bokeh(ctx, T, cols) { const r = mulberry32(44); for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, rad = 40 + r() * 90; glow(ctx, x + Math.sin(T * 0.3 + i) * 20, y, rad, cols[i % cols.length], 0.25); } }

// Overlays
function flash(ctx, lt, dur = 0.2, a = 0.75, col = '#ffffff') { if (lt < 0) return; const k = 1 - lt / dur; if (k <= 0 || k > 1) return; ctx.save(); ctx.globalAlpha = a * k * k; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function scribbles(ctx, T, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; const r = mulberry32(77);
  for (let i = 0; i < 7; i++) {
    const cx = 300 + r() * 1320, cy = 160 + r() * 600; ctx.beginPath(); ctx.moveTo(cx, cy);
    let x = cx, y = cy; for (let k = 0; k < 5; k++) { const nx = x + (r() - 0.5) * 260, ny = y + (r() - 0.5) * 200; ctx.quadraticCurveTo(x + (r() - 0.5) * 200 + Math.sin(T * 2 + i) * 20, y + (r() - 0.5) * 200, nx, ny); x = nx; y = ny; }
    fs(ctx, null, rgba('#ffffff', 0.7), 6);
    const ang = Math.atan2(y - cy, x - cx); line(ctx, x, y, x - Math.cos(ang - 0.5) * 30, y - Math.sin(ang - 0.5) * 30, rgba('#ffffff', 0.7), 6); line(ctx, x, y, x - Math.cos(ang + 0.5) * 30, y - Math.sin(ang + 0.5) * 30, rgba('#ffffff', 0.7), 6);
  }
  ctx.restore();
}
function glitch(ctx, cv, k, T) { // horizontal slice offsets on the current canvas content
  if (k <= 0) return; const r = mulberry32(Math.floor(T * 30));
  for (let i = 0; i < 8; i++) { const y = Math.floor(r() * H), h = Math.floor(20 + r() * 80), dx = Math.floor((r() - 0.5) * 120 * k); try { const img = ctx.getImageData(0, y, W, h); ctx.putImageData(img, dx, y); } catch (e) { /* noop */ } }
  ctx.save(); ctx.globalAlpha = 0.25 * k; ctx.fillStyle = P.cyan; ctx.fillRect(0, Math.floor(r() * H), W, 6); ctx.restore();
}
function labelTop(ctx, str, a = 1, o = {}) { // headline banner near top
  const { y = 110, size = 64, col = '#ffffff', accent = P.cyan } = o; if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; const s = En.E.back(clamp(a)); ctx.translate(W / 2, y); ctx.scale(s, s);
  text(ctx, str, 0, 0, { size, font: 'BG800', color: col, stroke: P.out, lw: 14 });
  ctx.restore();
}

// Pose fragment: phone held low in the left hand so the face stays visible.
function holdPhone(o = {}) {
  const { x = 44, y = 82, tilt = 0.08 } = o;
  return { armL: { x, y, bend: 1, hand: 'hold' }, look: [0, 0.75], headTilt: 0.1,
    hold: { L: (c, hx, hy) => U.phone(c, hx + 20, hy - 26, 54, 100, tilt, { back: true }) } };
}
module.exports = { En, C, U, B, act, cu, pov, bokeh, flash, scribbles, glitch, labelTop, holdPhone };
