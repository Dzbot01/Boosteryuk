'use strict';
// Backgrounds & environment effects.
const { W, H, P, clamp, lerp, rgba, mixC, gradStops, rr, ell, circ, fs, line, glow, text, mulberry32, noise, hash, beat, starPath, sparkle, heartPath } = require('./engine');
const OUT = P.out;

// time of day 0 night .22 dawn .5 day .78 sunset 1 night
const SKY_TOP = [[0, '#0b1230'], [0.2, '#3b2f6b'], [0.3, '#7cb7f0'], [0.5, '#4fb3f6'], [0.72, '#6b5bd6'], [0.82, '#2a1f5c'], [1, '#0b1230']];
const SKY_BOT = [[0, '#1d2a5a'], [0.2, '#ff9f7a'], [0.3, '#cfeaff'], [0.5, '#bfe6ff'], [0.72, '#ffa36c'], [0.82, '#7a3f78'], [1, '#1d2a5a']];
function sky(ctx, x, y, w, h, tod, t = 0, o = {}) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, gradStops(SKY_TOP, tod)); g.addColorStop(1, gradStops(SKY_BOT, tod));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const night = clamp(1 - Math.abs(tod - 0.5) / 0.32); // 1 at day
  const dark = 1 - clamp((Math.min(Math.abs(tod - 0.0), Math.abs(tod - 1)) < 0.16 ? 1 : 0) + 0);
  // stars
  const starA = clamp((0.25 - Math.min(tod, 1 - tod)) / 0.12);
  if (starA > 0) { const r = mulberry32(7); for (let i = 0; i < 80; i++) { const sx = x + r() * w, sy = y + r() * h * 0.7; ctx.globalAlpha = starA * (0.5 + 0.5 * Math.sin(t * 3 + i)); circ(ctx, sx, sy, 1 + r() * 2); fs(ctx, '#fff'); } ctx.globalAlpha = 1; }
  // sun / moon
  if (o.sun !== false) {
    const sa = (tod - 0.18) / 0.66; // 0..1 across the day
    if (sa > -0.05 && sa < 1.05) {
      const sx = x + w * (0.12 + 0.76 * sa), sy = y + h * (0.85 - Math.sin(clamp(sa) * Math.PI) * 0.65);
      const col = tod < 0.3 || tod > 0.68 ? '#ffb36b' : '#fff3b0';
      glow(ctx, sx, sy, Math.min(w, h) * 0.45, col, 0.6); circ(ctx, sx, sy, Math.min(w, h) * 0.07); fs(ctx, col);
    }
  }
  if (o.clouds !== false) clouds(ctx, x, y, w, h, t, o.cloudSpeed || 12, tod);
}
function cloudShape(ctx, cx, cy, s, col, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
  for (const [dx, dy, r] of [[-1, 0.15, 0.55], [-0.35, -0.25, 0.7], [0.35, -0.1, 0.62], [0.95, 0.2, 0.45], [0, 0.3, 0.6]]) { circ(ctx, cx + dx * s, cy + dy * s, r * s); ctx.fill(); }
  ctx.restore();
}
function clouds(ctx, x, y, w, h, t, speed, tod) {
  const r = mulberry32(3); const col = tod > 0.7 || tod < 0.25 ? '#ffd9c7' : '#ffffff';
  for (let i = 0; i < 6; i++) {
    const s = 30 + r() * 45, base = r() * (w + 400), cy = y + h * (0.1 + r() * 0.45);
    const cx = x - 200 + ((base + t * speed * (0.6 + r())) % (w + 400));
    cloudShape(ctx, cx, cy, s * (w / 1920 + 0.5), col, 0.85);
  }
}

function city(ctx, t, o = {}) {
  const { y0 = 820, tod = 0.5, scroll = 0, layers = 2, lights = null } = o;
  const night = clamp(1 - Math.abs(tod - 0.5) * 3.2 + 0.0); // not used
  const lightA = lights !== null ? lights : clamp((Math.abs(tod - 0.5) - 0.18) / 0.15);
  for (let L = 0; L < layers; L++) {
    const r = mulberry32(11 + L * 7); const col = L === 0 ? mixC('#5b6fa8', '#273258', clamp(Math.abs(tod - 0.5) * 2)) : mixC('#3b4a7a', '#151c38', clamp(Math.abs(tod - 0.5) * 2));
    let x = -200 - ((scroll * (0.4 + L * 0.5)) % 400);
    while (x < W + 200) {
      const bw = 80 + r() * 120, bh = (L === 0 ? 180 : 110) + r() * (L === 0 ? 260 : 220); const by = y0 - bh + L * 40;
      ctx.fillStyle = col; ctx.fillRect(x, by, bw, bh + 300);
      if (r() > 0.6) { ctx.fillRect(x + bw * 0.4, by - 30, 6, 30); }
      if (lightA > 0) { ctx.fillStyle = rgba('#ffe08a', 0.85 * lightA); for (let wy = by + 18; wy < y0 + L * 40 - 10; wy += 26) for (let wx = x + 12; wx < x + bw - 14; wx += 22) if (hash(wx * 0.37 + wy * 1.7 + L) > 0.55) ctx.fillRect(wx, wy, 10, 13); }
      x += bw + 6 + r() * 20;
    }
  }
}

// Bedroom (front view). opts: tod (window sky), dim (0..1 darkness), blue (sad tint), t
function bedroom(ctx, t, o = {}) {
  const { tod = 0.32, dim = 0, blue = 0, rain = 0 } = o;
  const wall = mixC(mixC('#fde3c3', '#cfd8f0', blue), '#2b3157', dim * 0.85);
  const wall2 = mixC(mixC('#f6cfa1', '#b6c3e6', blue), '#222848', dim * 0.85);
  let g = ctx.createLinearGradient(0, 0, 0, 820); g.addColorStop(0, wall); g.addColorStop(1, wall2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 830);
  // wallpaper stripes
  ctx.fillStyle = rgba('#ffffff', 0.12 * (1 - dim)); for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 30, 820);
  // window
  ctx.save(); rr(ctx, 180, 150, 460, 420, 18); ctx.clip(); sky(ctx, 180, 150, 460, 420, tod, t, { cloudSpeed: 8 }); city(ctx, t, { y0: 610, tod, layers: 1 });
  if (rain) { ctx.strokeStyle = rgba('#cbd5e1', 0.6 * rain); ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const rx = 180 + hash(i) * 460, ry = 150 + ((hash(i + 9) * 420 + t * 600) % 420); line(ctx, rx, ry, rx - 6, ry + 26, rgba('#cbd5e1', 0.6 * rain), 2); } }
  ctx.restore();
  rr(ctx, 180, 150, 460, 420, 18); fs(ctx, null, '#ffffff', 22); rr(ctx, 180, 150, 460, 420, 18); fs(ctx, null, OUT, 5);
  line(ctx, 410, 150, 410, 570, '#ffffff', 14); line(ctx, 180, 360, 640, 360, '#ffffff', 14);
  rr(ctx, 160, 568, 500, 26, 8); fs(ctx, '#ffffff', OUT, 5);
  // curtains
  for (const [cx, d] of [[150, 1], [670, -1]]) { ctx.beginPath(); ctx.moveTo(cx - 40 * d, 120); ctx.lineTo(cx + 70 * d, 120); ctx.quadraticCurveTo(cx + 30 * d + Math.sin(t) * 6, 380, cx + 50 * d, 640); ctx.lineTo(cx - 40 * d, 640); ctx.closePath(); fs(ctx, mixC('#22c3df', '#1b4a6b', dim * 0.7), OUT, 5); }
  rr(ctx, 90, 108, 640, 18, 9); fs(ctx, '#94a3b8', OUT, 4);
  // poster & shelf above bed
  rr(ctx, 1180, 170, 200, 260, 10); fs(ctx, mixC('#1e293b', '#0f172a', dim), OUT, 5);
  ctx.save(); rr(ctx, 1180, 170, 200, 260, 10); ctx.clip(); glow(ctx, 1280, 300, 160, P.cyan, 0.5); starPath(ctx, 1280, 290, 54, 0); fs(ctx, P.yellow, OUT, 4); text(ctx, 'DREAM', 1280, 390, { size: 34, color: '#fff', font: 'BG800' }); text(ctx, 'BIG', 1280, 200, { size: 26, color: P.cyan, font: 'BG800' }); ctx.restore();
  rr(ctx, 1440, 300, 300, 18, 6); fs(ctx, '#a16207', OUT, 4);
  for (let i = 0; i < 5; i++) { rr(ctx, 1460 + i * 26, 230 - (i % 2) * 14, 22, 70 + (i % 2) * 14, 4); fs(ctx, ['#ef4444', '#22d3ee', '#facc15', '#a78bfa', '#34d399'][i], OUT, 3.5); }
  // potted plant on shelf
  rr(ctx, 1640, 250, 56, 50, 10); fs(ctx, '#fb923c', OUT, 4);
  for (const a of [-0.8, -0.3, 0.2, 0.7]) { ctx.save(); ctx.translate(1668, 252); ctx.rotate(a + Math.sin(t * 1.5 + a) * 0.05); ell(ctx, 0, -34, 13, 34); fs(ctx, '#22c55e', OUT, 3.5); ctx.restore(); }
  // floor
  g = ctx.createLinearGradient(0, 820, 0, H); g.addColorStop(0, mixC('#c98a55', '#3a2c3a', dim * 0.8)); g.addColorStop(1, mixC('#a86c3f', '#2a1f2e', dim * 0.8)); ctx.fillStyle = g; ctx.fillRect(0, 820, W, 260);
  ctx.strokeStyle = rgba('#000', 0.12); ctx.lineWidth = 3; for (let y = 860; y < H; y += 50) line(ctx, 0, y, W, y, rgba('#000', 0.12), 3);
  line(ctx, 0, 822, W, 822, OUT, 5);
  ell(ctx, 760, 960, 330, 70); fs(ctx, mixC('#f472b6', '#4c2c56', dim * 0.7), OUT, 5); ell(ctx, 760, 960, 260, 48); fs(ctx, null, rgba('#fff', 0.5), 4);
  if (blue > 0 || dim > 0) { ctx.fillStyle = rgba('#1e3a8a', 0.18 * blue); ctx.fillRect(0, 0, W, H); }
}
// Bed pieces (drawn by scene so character can sit between layers)
function bedBack(ctx, o = {}) {
  const dim = o.dim || 0;
  rr(ctx, 900, 470, 70, 360, 18); fs(ctx, mixC('#8b5a2b', '#3b2a22', dim), OUT, 5);
  rr(ctx, 1680, 600, 50, 230, 14); fs(ctx, mixC('#8b5a2b', '#3b2a22', dim), OUT, 5);
  rr(ctx, 940, 690, 780, 110, 24); fs(ctx, mixC('#ffffff', '#5b6488', dim), OUT, 5);
  rr(ctx, 980, 600, 200, 100, 40); fs(ctx, mixC('#e0f2fe', '#475077', dim), OUT, 5);
}
function blanket(ctx, x0, x1, top, t, o = {}) {
  const dim = o.dim || 0; const breathe = o.breathe ? Math.sin(t * 2) * 4 : 0;
  ctx.beginPath(); ctx.moveTo(x0, 800); ctx.lineTo(x0 - 10, top + 30); ctx.quadraticCurveTo(x0 + 40, top - 10 - breathe, (x0 + x1) / 2, top - 6 - breathe * 1.4); ctx.quadraticCurveTo(x1 - 60, top + 4 - breathe, x1, top + 30); ctx.lineTo(x1 + 10, 810); ctx.closePath();
  fs(ctx, mixC('#3b82f6', '#26305a', dim), OUT, 5);
  ctx.save(); ctx.clip(); ctx.fillStyle = rgba('#ffffff', 0.15); for (let x = x0 - 40; x < x1 + 40; x += 60) { ctx.fillRect(x, top - 40, 22, 300); } ctx.restore();
  rr(ctx, x0 - 14, top + 18, 40, 14, 6); fs(ctx, rgba('#ffffff', 0.0));
}
function nightstand(ctx, t, o = {}) {
  const dim = o.dim || 0;
  rr(ctx, 700, 700, 170, 130, 12); fs(ctx, mixC('#b07a45', '#3b2a22', dim), OUT, 5); line(ctx, 712, 760, 858, 760, OUT, 4); circ(ctx, 785, 730, 6); fs(ctx, OUT); circ(ctx, 785, 795, 6); fs(ctx, OUT);
  // lamp
  rr(ctx, 812, 640, 14, 60, 4); fs(ctx, '#64748b', OUT, 3.5);
  ctx.beginPath(); ctx.moveTo(780, 650); ctx.lineTo(858, 650); ctx.lineTo(840, 590); ctx.lineTo(798, 590); ctx.closePath(); fs(ctx, '#fde68a', OUT, 4.5);
  if (o.lamp) glow(ctx, 820, 640, 220, '#fde68a', 0.45 * o.lamp);
}
function alarmClock(ctx, x, y, s, t, ring = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (ring) { ctx.rotate(Math.sin(t * 60) * 0.12 * ring); ctx.translate(Math.sin(t * 47) * 3 * ring, 0); }
  line(ctx, -26, 30, -36, 46, OUT, 8); line(ctx, 26, 30, 36, 46, OUT, 8);
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 30, -36, 18, Math.PI, 0); ctx.closePath(); fs(ctx, '#facc15', OUT, 4.5); }
  circ(ctx, 0, 0, 46); fs(ctx, P.red, OUT, 5); circ(ctx, 0, 0, 36); fs(ctx, '#fff', OUT, 3.5);
  line(ctx, 0, 0, 0, -24, OUT, 5); line(ctx, 0, 0, 16, 6, OUT, 5); circ(ctx, 0, 0, 4); fs(ctx, OUT);
  ctx.restore();
  if (ring) { for (let k = 0; k < 3; k++) { const a = -2.2 + k * 0.5, r1 = 60 * s, r2 = 86 * s + Math.sin(t * 30) * 6; for (const d of [-1, 1]) line(ctx, x + d * Math.cos(a) * r1 * -1, y + Math.sin(a) * r1, x + d * Math.cos(a) * r2 * -1, y + Math.sin(a) * r2, OUT, 6); } }
}

// Desk / workspace area
function deskRoom(ctx, t, o = {}) {
  const { tod = 0.45, dim = 0, blue = 0 } = o;
  const wall = mixC(mixC('#e8f4ff', '#c5d0ee', blue), '#253054', dim * 0.85);
  let g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, wall); g.addColorStop(1, mixC('#d4e6f7', '#1e2747', dim * 0.85)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rgba('#ffffff', 0.25 * (1 - dim)); for (let x = 40; x < W; x += 120) ctx.fillRect(x, 0, 6, 760);
  // window right
  ctx.save(); rr(ctx, 1380, 120, 400, 360, 16); ctx.clip(); sky(ctx, 1380, 120, 400, 360, tod, t); city(ctx, t, { y0: 520, tod, layers: 1 }); ctx.restore();
  rr(ctx, 1380, 120, 400, 360, 16); fs(ctx, null, '#ffffff', 18); rr(ctx, 1380, 120, 400, 360, 16); fs(ctx, null, OUT, 5); line(ctx, 1580, 120, 1580, 480, '#fff', 12);
  // pegboard with sticky notes
  rr(ctx, 160, 140, 380, 260, 14); fs(ctx, mixC('#fef3c7', '#3b3550', dim), OUT, 5);
  const notes = [['#fde047', -0.08], ['#f9a8d4', 0.06], ['#a5f3fc', -0.04], ['#bbf7d0', 0.08]];
  notes.forEach(([c, a], i) => { ctx.save(); ctx.translate(230 + i * 85, 220 + (i % 2) * 70); ctx.rotate(a); rr(ctx, -34, -34, 68, 68, 4); fs(ctx, c, OUT, 3.5); line(ctx, -20, -10, 20, -10, rgba(OUT, 0.5), 3); line(ctx, -20, 4, 12, 4, rgba(OUT, 0.5), 3); ctx.restore(); });
  // floor
  ctx.fillStyle = mixC('#94a3b8', '#1e2238', dim); ctx.fillRect(0, 860, W, 220); line(ctx, 0, 860, W, 860, OUT, 5);
}
function desk(ctx, x0 = 300, x1 = 1620, y = 760, dim = 0) {
  rr(ctx, x0, y, x1 - x0, 34, 10); fs(ctx, mixC('#f8fafc', '#4b5578', dim), OUT, 5);
  rr(ctx, x0 + 40, y + 34, 30, 260, 6); fs(ctx, mixC('#cbd5e1', '#3b4466', dim), OUT, 5); rr(ctx, x1 - 70, y + 34, 30, 260, 6); fs(ctx, mixC('#cbd5e1', '#3b4466', dim), OUT, 5);
}

// Dark brand background with rays, grid and particles.
function brandBg(ctx, t, o = {}) {
  const { rays = 1, grid = 1, col = P.cyan, cx = W / 2, cy = H / 2, pulse = 0, top = '#0b1a33', bot = P.navy } = o;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (rays) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.15); ctx.fillStyle = rgba(col, 0.06 * rays * (1 + pulse));
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1800, -110); ctx.lineTo(1800, 110); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  glow(ctx, cx, cy, 700, col, 0.28 + pulse * 0.2);
  if (grid) { ctx.fillStyle = rgba('#94a3b8', 0.16 * grid); for (let y = 30; y < H; y += 60) for (let x = 30; x < W; x += 60) { ctx.fillRect(x - 1.5, y - 1.5, 3, 3); } }
  const r = mulberry32(5); for (let i = 0; i < 40; i++) { const px = r() * W, sp = 20 + r() * 50, py = (r() * H - t * sp) % H; const yy = py < 0 ? py + H : py; ctx.globalAlpha = 0.25 + 0.5 * r(); circ(ctx, px, yy, 1.5 + r() * 3); fs(ctx, i % 3 ? col : '#fff'); }
  ctx.globalAlpha = 1;
}

function speedLines(ctx, t, o = {}) {
  const { cx = W / 2, cy = H / 2, n = 70, col = '#ffffff', a = 0.5, inner = 260 } = o;
  const r = mulberry32(9); ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, sp = 1.2 + r() * 2, ph = (t * sp + r()) % 1;
    const r1 = inner + ph * 1400, r2 = r1 + 80 + ph * 260;
    ctx.globalAlpha = a * ph; line(ctx, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2, col, 2 + ph * 6);
  }
  ctx.restore();
}
function hSpeed(ctx, t, o = {}) { // horizontal speed streaks
  const { a = 0.5, col = '#ffffff', dir = -1, n = 30 } = o; const r = mulberry32(21);
  ctx.save();
  for (let i = 0; i < n; i++) { const y = r() * H, len = 120 + r() * 380, sp = 1500 + r() * 2000; const x = ((r() * (W + 800) + t * sp) % (W + 800)) - 400; const xx = dir < 0 ? W - x : x; ctx.globalAlpha = a * (0.3 + r() * 0.7); line(ctx, xx, y, xx + len * dir * -1, y, col, 2 + r() * 5); }
  ctx.restore();
}

function confetti(ctx, t, t0, o = {}) {
  const { n = 90, seed = 1, cols = [P.cyan, P.yellow, P.pink, '#fff', P.purple, P.lime], gravity = 520, x0 = W / 2, burst = false } = o;
  const lt = t - t0; if (lt < 0) return; const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length]; let x, y;
    if (burst) { const ang = -Math.PI / 2 + (r() - 0.5) * 2.4, sp = 600 + r() * 900; x = x0 + Math.cos(ang) * sp * lt; y = (o.y0 || H) + Math.sin(ang) * sp * lt + gravity * lt * lt; x += Math.sin(lt * 4 + i) * 20; }
    else { x = r() * W + Math.sin(lt * 2 + i) * 40; y = -40 - r() * H * 1.2 + lt * (180 + r() * 220); }
    if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(lt * (3 + r() * 6) + i); ctx.scale(1, Math.cos(lt * 8 + i)); ctx.fillStyle = c; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
  }
}
function fireworks(ctx, t, list) { // list: [[t0,x,y,col]]
  for (const [t0, x, y, col] of list) {
    const lt = t - t0; if (lt < 0 || lt > 1.6) continue; const k = lt / 1.6;
    if (lt < 0.25) { const yy = H + (y - H) * (lt / 0.25); line(ctx, x, yy, x, yy + 40, rgba(col, 0.8), 4); continue; }
    const e = (lt - 0.25) / 1.35; const R = 40 + 220 * (1 - Math.pow(1 - e, 3));
    ctx.save(); ctx.globalAlpha = 1 - e;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const px = x + Math.cos(a) * R, py = y + Math.sin(a) * R + e * e * 60; line(ctx, x + Math.cos(a) * R * 0.75, y + Math.sin(a) * R * 0.75 + e * e * 50, px, py, col, 5); circ(ctx, px, py, 4); fs(ctx, '#fff'); }
    if (e < 0.2) glow(ctx, x, y, 200, col, 0.6 * (1 - e * 5));
    ctx.restore();
  }
}

function stage(ctx, t, o = {}) {
  const { screen = null } = o; const b = beat(t);
  let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#1a1040'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // truss
  ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 40, W, 28); for (let x = 0; x < W; x += 40) { line(ctx, x, 40, x + 40, 68, '#334155', 3); }
  // LED wall
  rr(ctx, 520, 110, 880, 480, 16); fs(ctx, '#050914', '#334155', 8);
  if (screen) { ctx.save(); rr(ctx, 530, 120, 860, 460, 10); ctx.clip(); screen(ctx, 530, 120, 860, 460); ctx.fillStyle = rgba('#000', 0.18); for (let y = 120; y < 580; y += 6) ctx.fillRect(530, y, 860, 2); ctx.restore(); }
  // side speakers
  for (const sx of [300, 1500]) { rr(ctx, sx, 300, 120, 300, 12); fs(ctx, '#111827', '#334155', 5); for (const cy of [380, 510]) { circ(ctx, sx + 60, cy, 42 + b.pulse * 6); fs(ctx, '#1f2937', '#475569', 5); circ(ctx, sx + 60, cy, 16); fs(ctx, '#0b1222'); } }
  // spotlights
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const beams = [[200, P.cyan, 0.9], [700, P.purple, 1.7], [1220, P.pink, 2.3], [1720, P.cyan, 3.1]];
  for (const [bx, col, ph] of beams) {
    const ang = Math.PI / 2 + Math.sin(t * 1.2 + ph) * 0.45; const len = 1300;
    const ex = bx + Math.cos(ang) * len, ey = 60 + Math.sin(ang) * len; const wdt = 180;
    const lg = ctx.createLinearGradient(bx, 60, ex, ey); lg.addColorStop(0, rgba(col, 0.42 + b.pulse * 0.2)); lg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx - 10, 60); ctx.lineTo(bx + 10, 60); ctx.lineTo(ex + Math.sin(ang) * wdt, ey - Math.cos(ang) * wdt); ctx.lineTo(ex - Math.sin(ang) * wdt, ey + Math.cos(ang) * wdt); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  for (const [bx] of beams) { rr(ctx, bx - 22, 52, 44, 30, 6); fs(ctx, '#334155', OUT, 4); }
  // stage floor
  g = ctx.createLinearGradient(0, 760, 0, H); g.addColorStop(0, '#24305a'); g.addColorStop(1, '#0d1430'); ctx.fillStyle = g; ctx.fillRect(0, 760, W, 320); line(ctx, 0, 762, W, 762, P.cyan, 4);
  ctx.globalAlpha = 0.25; ctx.save(); ctx.translate(0, 1524); ctx.scale(1, -1); ctx.restore(); ctx.globalAlpha = 1;
}
function crowd(ctx, t, o = {}) {
  const { y0 = 1080, a = 1, col = '#070b1a' } = o; const b = beat(t); const r = mulberry32(31);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
  for (let i = 0; i < 22; i++) {
    const x = i * 92 + r() * 30, h = 90 + r() * 50; const bob = Math.sin(b.phase * Math.PI) * (6 + r() * 8) * (i % 2 ? 1 : -1);
    const hy = y0 - h + bob; circ(ctx, x, hy, 34); ctx.fill(); rr(ctx, x - 50, hy + 26, 100, 200, 40); ctx.fill();
    if (r() > 0.35) { const side = r() > 0.5 ? 1 : -1; const wave = Math.sin(t * 6 + i) * 0.2; ctx.save(); ctx.translate(x + side * 34, hy + 40); ctx.rotate(side * (-0.35 + wave) - (side < 0 ? 0 : 0)); rr(ctx, -10, -150, 20, 150, 10); ctx.fill(); circ(ctx, 0, -152, 15); ctx.fill(); ctx.restore(); }
  }
  ctx.restore();
}

function serverRoom(ctx, t, o = {}) {
  const vx = W / 2, vy = 470; const b = beat(t);
  let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#06101f'); g.addColorStop(1, '#0b1730'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  glow(ctx, vx, vy, 500, P.cyan, 0.35);
  // floor grid
  ctx.save(); ctx.strokeStyle = rgba(P.cyan, 0.35); ctx.lineWidth = 2;
  for (let i = -12; i <= 12; i++) line(ctx, vx, vy, vx + i * 260, H, rgba(P.cyan, 0.3), 2);
  const sp = o.speed || 1; for (let k = 0; k < 14; k++) { const z = ((k / 14 + t * 0.35 * sp) % 1); const y = vy + Math.pow(z, 2.2) * (H - vy); line(ctx, 0, y, W, y, rgba(P.cyan, 0.08 + z * 0.3), 2); }
  ctx.restore();
  // racks on both sides (receding slices)
  for (const side of [-1, 1]) {
    for (let k = 7; k >= 0; k--) {
      const z0 = k / 8, z1 = (k + 1) / 8; const f = z => Math.pow(z, 1.6);
      const xA = vx + side * (80 + f(z0) * 900), xB = vx + side * (80 + f(z1) * 900);
      const tA = vy - 60 - f(z0) * 560, bA = vy + 40 + f(z0) * 560, tB = vy - 60 - f(z1) * 560, bB = vy + 40 + f(z1) * 560;
      ctx.beginPath(); ctx.moveTo(xA, tA); ctx.lineTo(xB, tB); ctx.lineTo(xB, bB); ctx.lineTo(xA, bA); ctx.closePath(); fs(ctx, k % 2 ? '#111c33' : '#0e1830', '#1e3a5f', 2);
      const rows = 9; for (let r2 = 0; r2 < rows; r2++) {
        const u = (r2 + 0.5) / rows; const yA = lerp(tA, bA, u), yB = lerp(tB, bB, u);
        line(ctx, lerp(xA, xB, 0.08), lerp(yA, yB, 0.08), lerp(xA, xB, 0.92), lerp(yA, yB, 0.92), '#1b2b4a', Math.max(1, (bB - tB) / rows * 0.5));
        for (let l = 0; l < 4; l++) { const on = hash(k * 31 + r2 * 7 + l + side * 3 + Math.floor(t * 6 + l)) > 0.45; if (!on) continue; const u2 = 0.2 + l * 0.12; const lx = lerp(xA, xB, u2), ly = lerp(yA, yB, u2); circ(ctx, lx, ly, Math.max(1.5, (bB - tB) / 120)); fs(ctx, l % 3 ? P.cyan : P.green); }
      }
    }
  }
  // data streams
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = mulberry32(17);
  for (let i = 0; i < 40; i++) { const ang = r() * Math.PI * 2, ph = (t * (0.5 + r()) * sp + r()) % 1; const d1 = 40 + Math.pow(ph, 2) * 1300; const x = vx + Math.cos(ang) * d1, y = vy + Math.sin(ang) * d1 * 0.6; line(ctx, x, y, x + Math.cos(ang) * (20 + ph * 140), y + Math.sin(ang) * (20 + ph * 140) * 0.6, rgba(i % 4 ? P.cyan : '#ffffff', ph), 1 + ph * 4); }
  ctx.restore();
}

function hills(ctx, t, o = {}) {
  const { tod = 0.3, scroll = 0 } = o;
  sky(ctx, 0, 0, W, H, tod, t, { cloudSpeed: 10 });
  city(ctx, t, { y0: 640, tod, layers: 1, lights: 0.4 });
  const layers = [['#7bd389', 640, 60, 0.3], ['#4fb878', 720, 80, 0.6], ['#2f9e6a', 820, 70, 1]];
  for (const [col, y0, amp, par] of layers) {
    ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + Math.sin((x + scroll * par) * 0.004 + y0) * amp + Math.sin((x + scroll * par) * 0.011) * amp * 0.3); ctx.lineTo(W, H); ctx.closePath(); fs(ctx, mixC(col, '#3b2f6b', clamp(Math.abs(tod - 0.5) * 1.6 - 0.2)), OUT, 4);
  }
}

module.exports = { sky, city, clouds, cloudShape, bedroom, bedBack, blanket, nightstand, alarmClock, deskRoom, desk, brandBg, speedLines, hSpeed, confetti, fireworks, stage, crowd, serverRoom, hills };
