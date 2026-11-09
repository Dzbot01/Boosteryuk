'use strict';
// Shots 1:32 – 3:53 (verse 2, hosting, chorus 2, bridge, outro)
const { En, C, U, B, act, cu, pov, flash, labelTop, holdPhone } = require('./kit');
const { W, H, P, clamp, lerp, K, E, prog, beat, voc, rgba, glow, rr, fs, circ, line, text, sparkle, heartPath, starPath, ICON, camera, noise, mulberry32 } = En;
const { walk, run, merge } = C;

const S = [];
const add = (at, name, draw, o = {}) => S.push(Object.assign({ at, name, draw }, o));

// S30 logo hero
add(92.3, 'logo-hero', (ctx, lt, T) => {
  const b = beat(T); B.brandBg(ctx, T, { pulse: b.pulse });
  const s = lt < 0.35 ? lerp(2.6, 1, E.out(lt / 0.35)) : 1 + b.pulse * 0.015;
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(s, s); U.logo(ctx, 0, 0, 190, { glowA: 1, pill: true, alpha: clamp(lt / 0.2) }); ctx.restore();
  U.chip(ctx, W / 2, 560, 'SMM Panel  •  Hosting & VPS', { size: 36, alpha: prog(lt, 0.6, 0.9) });
  act(ctx, l => ({ x: 960, y: 1080 + 420 - E.back(clamp((l - 0.7) / 0.5)) * 300, s: 1.3, t: T + (l - lt), expr: 'grin', armL: { x: -110, y: -50, bend: 1, hand: 'open' }, armR: { x: 110, y: -50, bend: -1, hand: 'open' }, fx: { sparkle: 0.6 } }), lt);
  flash(ctx, lt, 0.25, 0.7);
}, { trans: 'zoom' });
// S31 dashboard on giant laptop
add(96.0, 'dashboard', (ctx, lt, T) => {
  B.deskRoom(ctx, T, { tod: 0.45 });
  U.laptop(ctx, 780, 820, 900, { screen: (c, w, h) => U.dashScreen(c, w, h, T, prog(lt, 0.2, 2.2)), glowA: 1, open: E.back(clamp(lt / 0.5)) });
  act(ctx, l => ({ x: 1500, y: 990, s: 1.3, t: T + (l - lt), turn: -0.5, expr: 'happy', talk: 0.7, armL: { x: -120, y: -30, bend: -1, hand: 'point' }, armR: { x: 16, y: 96, bend: -1 } }), lt);
});
// S32 service grid
add(99.2, 'services', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse * 0.6 });
  labelTop(ctx, '698+ LAYANAN', prog(lt, 0, 0.3), { y: 110, size: 70 });
  const svc = [['user', 'Followers'], ['heart', 'Likes'], ['eye', 'Views'], ['comment', 'Komentar'], ['play', 'Subscribers'], ['share', 'Share'], ['bookmark', 'Save'], ['live', 'Live Views']];
  svc.forEach(([ic, lb], i) => { const k = clamp((lt - 0.2 - i * 0.12) / 0.35); const fl = Math.cos((1 - E.out(k)) * Math.PI / 2); const x = 820 + (i % 4) * 270, y = 380 + Math.floor(i / 4) * 300; U.card(ctx, x, y, 240, 260, { icon: ic, label: lb, alpha: k > 0 ? 1 : 0, flip: fl, col: i % 2 ? P.cyan : P.cyan3 }); });
  act(ctx, l => ({ x: 330, y: 1000, s: 1.35, t: T + (l - lt), turn: 0.4, expr: 'happy', talk: 0.6, armR: { x: 120, y: -40, bend: -1, hand: 'point' }, armL: { x: -16, y: 96, bend: 1 } }), lt);
});
// S33 platforms
add(102.2, 'platforms', (ctx, lt, T) => {
  B.brandBg(ctx, T, {});
  const pl = ['TikTok', 'Instagram', 'YouTube', 'Shopee', 'Threads', 'Facebook'];
  pl.forEach((p, i) => { const a = (i / pl.length) * Math.PI * 2 + lt * 0.8; const x = 960 + Math.cos(a) * 560, y = 520 + Math.sin(a) * 300; U.chip(ctx, x, y, p, { size: 40, alpha: prog(lt, i * 0.1, i * 0.1 + 0.3), col: [P.cyan, P.pink, P.red, P.orange, '#e2e8f0', P.blue][i] }); });
  act(ctx, l => ({ x: 960, y: 960, s: 1.3, t: T + (l - lt), expr: 'happy', armR: { x: -36, y: 70 + Math.sin(l * 9) * 6, bend: -1, hand: 'point' }, crouch: Math.sin(l * 3) * 3, ...holdPhone() }), lt);
});
// S34 dart throw
add(104.8, 'dart', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0.4 });
  const hit = clamp((lt - 2.55) / 0.8);
  U.target(ctx, 1500, 470, 210, hit, T);
  const fly = clamp((lt - 1.9) / 0.65);
  act(ctx, l => { const wind = prog(l, 0.3, 1.6, 'inOut'), thr = prog(l, 1.6, 1.9, 'out'); return { x: 520, y: 990, s: 1.35, t: T + (l - lt), turn: 0.6, expr: l < 1.9 ? 'focused' : l < 2.6 ? 'oh' : 'excited', lean: lerp(-0.08 * wind, 0.14, thr),
    armR: thr > 0 ? { x: lerp(-60, 120, thr), y: lerp(-60, -20, thr), bend: -1, hand: 'open' } : { x: lerp(40, -60, wind), y: lerp(-40, -60, wind), bend: -1, hand: 'hold' },
    armL: { x: 60, y: 20, bend: 1, hand: 'open' }, hold: thr > 0 ? {} : { R: (c, x, y) => U.dart(c, x + 10, y - 6, -0.2, 0.8) } }; }, lt);
  if (fly > 0 && fly < 1) { const x = lerp(700, 1500, fly), y = lerp(560, 470, fly) - Math.sin(fly * Math.PI) * 120; U.dart(ctx, x, y, Math.atan2(-Math.cos(fly * Math.PI) * 120 * Math.PI - 90, 800) * 0.3, 1.1); }
  if (fly >= 1) U.dart(ctx, 1490, 470, 0, 1.1);
  if (hit > 0) labelTop(ctx, 'TEPAT SASARAN!', clamp(hit * 2), { y: 140 });
});
add(108.2, 'cheer', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse });
  B.confetti(ctx, T, 108.2, { burst: true, y0: 1100, n: 80, seed: 8 });
  act(ctx, l => Object.assign(cu(960, 430, 1.8), { t: T + (l - lt), expr: 'joy', armR: { x: 30, y: -110 + Math.sin(l * 14) * 10, bend: -1, hand: 'fist' }, armL: { x: -40, y: 30, bend: 1, hand: 'fist' }, crouch: -Math.abs(Math.sin(l * 7)) * 10, fx: { sparkle: 1 } }), lt);
});
// S36 notifications pop
add(110.1, 'notifs', (ctx, lt, T) => {
  B.deskRoom(ctx, T, { tod: 0.5 });
  glow(ctx, 960, 540, 600, P.cyan, 0.25);
  act(ctx, l => ({ x: 960, y: 980, s: 1.3, t: T + (l - lt), expr: lt < 1.6 ? 'grin' : 'love', armR: { x: -16, y: 96, bend: -1 }, fx: { hearts: 1 }, crouch: Math.sin(l * 4) * 3, ...holdPhone({ tilt: 0.06 + Math.sin(T * 60) * 0.02 }) }), lt);
  const toasts = [[420, 260, '+1.250 likes', 'heart', P.red], [1500, 300, '+320 followers', 'user', P.cyan6], [380, 620, '+86 komentar', 'comment', P.purple], [1540, 640, '+2,4K views', 'eye', P.orange], [960, 160, '+150 share', 'share', P.green]];
  toasts.forEach(([x, y, l, ic, c], i) => { const k = clamp((lt - 0.15 - i * 0.45) / 0.3); if (k > 0) U.toast(ctx, x, y + Math.sin(T * 2 + i) * 8, l, { icon: ic, col: c, s: E.back(k) }); });
});
// S37a bar climb
add(113.35, 'bar-climb', (ctx, lt, T) => {
  const camX = lerp(860, 1100, E.inOut(clamp(lt / 3.4))), camY = lerp(640, 520, E.inOut(clamp(lt / 3.4)));
  ctx.save(); camera(ctx, { zoom: 1.0, x: camX, y: camY });
  B.sky(ctx, -200, -300, W + 400, H + 600, 0.42, T); B.city(ctx, T, { y0: 960, tod: 0.42, layers: 2 });
  ctx.fillStyle = '#334155'; ctx.fillRect(-300, 960, W + 600, 400);
  const k = prog(lt, 0, 2.2); U.barChart(ctx, 400, 960, 1300, 620, k, T, { n: 6 });
  const bw = 1300 / 6; const heights = [...Array(6)].map((_, i) => 620 * (0.18 + 0.82 * (i + 1) / 6));
  const pos = clamp(lt / 0.55, 0, 5.4); const i0 = Math.min(5, Math.floor(pos)); const f = pos - i0; const i1 = Math.min(5, i0 + 1);
  const x = 400 + bw * (i0 + 0.5) + (i1 > i0 ? bw * E.inOut(f) : 0); const yA = 960 - heights[i0] * E.back(clamp(k * 6 - i0)), yB = 960 - heights[i1] * E.back(clamp(k * 6 - i1));
  const y = lerp(yA, yB, E.inOut(f)) - Math.sin(f * Math.PI) * (i1 > i0 ? 140 : 0);
  act(ctx, l => ({ x, y, s: 0.85, t: T + (l - lt), turn: 0.6, expr: 'grin', crouch: f < 0.15 || f > 0.85 ? 14 : -4, armL: { x: -60, y: -60, bend: 1, hand: 'fist' }, armR: { x: 60, y: -80, bend: -1, hand: 'fist' }, legL: { x: -30, y: f > 0.15 && f < 0.85 ? -30 : 0 }, legR: { x: 30, y: f > 0.15 && f < 0.85 ? -20 : 0 }, shadow: 0 }), lt);
  ctx.restore();
});
add(116.8, 'flag-top', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.3, 1.1, E.out(clamp(lt / 3.4))), x: 960, y: 520 });
  B.sky(ctx, -200, -200, W + 400, H + 400, 0.3, T); B.city(ctx, T, { y0: 1000, tod: 0.3, layers: 2 });
  rr(ctx, 700, 700, 520, 500, 14); fs(ctx, P.cyan, P.out, 8);
  const up = E.back(clamp((lt - 0.4) / 0.5));
  ctx.save(); ctx.translate(1060, 700); line(ctx, 0, 0, 0, -380 * up, P.out, 16); line(ctx, 0, 0, 0, -380 * up, '#e2e8f0', 9);
  if (up > 0.6) { const wv = Math.sin(T * 6) * 10; ctx.beginPath(); ctx.moveTo(0, -380 * up); ctx.quadraticCurveTo(110, -380 * up - 20 + wv, 230, -380 * up + wv); ctx.lineTo(230, -260 * up + wv); ctx.quadraticCurveTo(110, -280 * up - wv, 0, -260 * up); ctx.closePath(); fs(ctx, P.navy, P.out, 6); U.logo(ctx, 115, -320 * up + wv * 0.5, 36, { shadow: false }); }
  ctx.restore();
  act(ctx, l => ({ x: 880, y: 700, s: 1.0, t: T + (l - lt), turn: 0.3, expr: lt < 0.9 ? 'fierce' : 'laugh', armR: { x: 100, y: lt < 0.9 ? -40 : -110, bend: -1, hand: 'fist' }, armL: { x: -60, y: -90, bend: 1, hand: 'open' }, fx: { sparkle: prog(lt, 0.9, 1.2) } }), lt);
  U.chip(ctx, 960, 180, 'Konsisten & Pasti', { icon: 'check', col: P.green, size: 44, alpha: prog(lt, 1.0, 1.3) });
  ctx.restore();
});
// S38 tech transition
add(120.2, 'tech-transition', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0.6 });
  // code panel
  const a = prog(lt, 0.2, 0.6); ctx.save(); ctx.globalAlpha = a; rr(ctx, 1080, 240, 640, 420, 18); fs(ctx, rgba('#020617', 0.9), P.cyan, 4);
  const lines = ['$ deploy --server tercepat', '> menyiapkan VPS …', '> SSL aktif ✓', '> website online ✓', '> boost order #1248 ✓'];
  lines.forEach((s, i) => { const k = clamp((lt - 0.4 - i * 0.35) / 0.3); if (k <= 0) return; text(ctx, s.slice(0, Math.floor(s.length * k)).replace('✓', ''), 1120, 300 + i * 70, { size: 32, font: 'PJS700', color: i === 0 ? P.cyan : '#e2e8f0', align: 'left' }); if (k >= 1 && s.includes('✓')) ICON.check(ctx, 1640, 300 + i * 70, 40, '#4ade80'); });
  ctx.restore();
  act(ctx, l => ({ x: 600, y: 1000, s: 1.45, t: T + (l - lt), turn: 0.35, expr: 'determined', acc: { headset: true }, armL: { x: 60, y: 20 + Math.sin(l * 20) * 6, bend: 1, hand: 'fist' }, armR: { x: -20, y: 30 + Math.sin(l * 20 + 2) * 6, bend: -1, hand: 'fist' } }), lt);
});
// S39 security shield
add(123.0, 'security', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse * 0.5 });
  const s = E.back(clamp(lt / 0.4)); U.shieldBig(ctx, 760, 520, 1.25 * s, T, { lock: E.back(clamp((lt - 0.3) / 0.3)) });
  ['Data aman', 'Akun terlindungi', 'Tanpa password'].forEach((l, i) => U.chip(ctx, 760, 870 + i * 0, '', { size: 1, alpha: 0 }));
  U.chip(ctx, 760, 900, 'Aman & Terlindungi', { icon: 'shield', size: 40, alpha: prog(lt, 0.6, 0.9) });
  act(ctx, l => ({ x: 1450, y: 990, s: 1.4, t: T + (l - lt), turn: -0.4, expr: 'smug', armR: { x: 20, y: -70, bend: -1, hand: 'ok' }, armL: { x: -16, y: 96, bend: 1 } }), lt);
});
// S40 server room – fastest hosting
add(125.9, 'server-room', (ctx, lt, T) => {
  B.serverRoom(ctx, T, { speed: 1.6 });
  labelTop(ctx, 'HOSTING & VPS TERCEPAT', prog(lt, 0.1, 0.4), { y: 120, size: 72 });
  act(ctx, l => ({ x: 960, y: 1010, s: 1.4, t: T + (l - lt), expr: 'fierce', acc: { headset: true }, swingAdd: 0.7 + Math.sin(l * 25) * 0.15, lean: -0.05, armL: { x: 46, y: 92, bend: 1, hand: 'hold' }, armR: { x: -46, y: 92, bend: -1, hand: 'hold' },
    hold: { L: (c, x, y) => { U.laptop(c, x + 46, y + 24, 150, { screen: (cc, w, h) => { cc.fillStyle = '#0b1222'; cc.fillRect(0, 0, w, h); U.logo(cc, w / 2, h / 2, 22, { shadow: false }); } }); } } }), lt);
  U.chip(ctx, 360, 600, 'Super Cepat', { icon: 'bolt', size: 40, alpha: prog(lt, 0.6, 0.9) });
  U.chip(ctx, 1560, 600, 'Server Stabil', { icon: 'server', size: 40, alpha: prog(lt, 0.9, 1.2) });
});
// S41 split creator / business
add(128.8, 'split', (ctx, lt, T) => {
  const d = E.out(clamp(lt / 0.4));
  ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1010 * d + 0, 0); ctx.lineTo(910 * d, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
  B.deskRoom(ctx, T, { tod: 0.5 }); U.ringLight(ctx, 170, 380, 0.7, 1);
  act(ctx, l => ({ x: 520, y: 990, s: 1.3, t: T + (l - lt), turn: 0.3, expr: 'grin', talk: 0.6, acc: { cap: true }, armR: { x: 30, y: 10, bend: -1, hand: 'hold' }, armL: { x: -60, y: -60, bend: 1, hand: 'open' }, hold: { R: (c, x, y) => U.camera(c, x + 10, y - 20, 0.7) } }), lt);
  text(ctx, 'KREATOR', 380, 140, { size: 64, font: 'BG800', color: P.cyan, stroke: P.out, lw: 12 });
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 910 * d, 0); ctx.lineTo(W - 1010 * d, H); ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
  B.sky(ctx, 900, 0, 1100, H, 0.45, T); ctx.fillStyle = '#94a3b8'; ctx.fillRect(900, 900, 1100, 200);
  U.storefront(ctx, 1600, 900, 0.95, T);
  act(ctx, l => ({ x: 1330, y: 990, s: 1.3, t: T + (l - lt), turn: -0.3, expr: 'happy', acc: { apron: true }, armL: { x: 40, y: 10, bend: 1, hand: 'hold' }, armR: { x: -40, y: 10, bend: -1, hand: 'hold' },
    hold: { L: (c, x, y) => { rr(c, x - 4, y - 70, 110, 90, 8); fs(c, '#d6a35c', P.out, 5); line(c, x + 51, y - 70, x + 51, y + 20, '#a16207', 6); } } }), lt);
  text(ctx, 'PELAKU USAHA', 1530, 140, { size: 60, font: 'BG800', color: P.yellow, stroke: P.out, lw: 12 });
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.moveTo(1010 * d, 0); ctx.lineTo(910 * d, H); fs(ctx, null, P.out, 18); ctx.beginPath(); ctx.moveTo(1010 * d, 0); ctx.lineTo(910 * d, H); fs(ctx, null, P.cyan, 8); ctx.restore();
});
add(132.2, 'high-five', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse });
  const k = E.inOut(clamp(lt / 0.6)); const hit = lt > 0.6;
  act(ctx, l => { const kk = E.inOut(clamp(l / 0.6)); return { x: lerp(500, 760, kk), y: 990, s: 1.3, t: T + (l - lt), turn: 0.5, expr: hit ? 'laugh' : 'grin', acc: { cap: true }, armR: { x: 70, y: -110, bend: -1, hand: 'open' }, armL: { x: -16, y: 96, bend: 1 }, lean: 0.08 * kk }; }, lt);
  act(ctx, l => { const kk = E.inOut(clamp(l / 0.6)); return { x: lerp(1420, 1160, kk), y: 990, s: 1.3, t: T + (l - lt) + 0.4, turn: -0.5, expr: hit ? 'laugh' : 'grin', acc: { apron: true }, armL: { x: -70, y: -110, bend: 1, hand: 'open' }, armR: { x: 16, y: 96, bend: -1 }, lean: -0.08 * kk, blinkOff: 1.3 }; }, lt);
  if (hit) { const p2 = clamp((lt - 0.6) / 0.4); ctx.save(); ctx.globalAlpha = 1 - p2; starPath(ctx, 960, 520, 60 + p2 * 120, p2, 8, 0.45); fs(ctx, P.yellow, P.out, 6); ctx.restore(); text(ctx, 'TOS!', 960, 330, { size: 90 * E.back(clamp(p2 * 3)), font: 'BG800', color: '#fff', stroke: P.out, lw: 14 }); }
});
// S42 friends together
add(134.4, 'together', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.0, 1.08, lt / 6), x: 960, y: 560 });
  B.hills(ctx, T, { tod: 0.28 });
  const cast = [['sari', 'pink', 420], ['budi', 'orange', 720], ['main', 'hoodie', 1010], ['maya', 'purple', 1320]];
  cast.forEach(([c, o, x], i) => act(ctx, l => { const bb = beat(T + l - lt + i * 0.0); const ph = (bb.i + i) % 2 === 0; const jj = ph ? Math.sin(bb.phase * Math.PI) : 0; return { x, y: 960, s: c === 'main' ? 1.0 : 0.9, cast: c, outfit: o, t: T + (l - lt) + i, blinkOff: i * 0.7, expr: ['joy', 'laugh', 'grin', 'happy'][i], jump: jj * 70, armL: { x: -50, y: -100 + (1 - jj) * 60, bend: 1, hand: 'open' }, armR: { x: 50, y: -100 + (1 - jj) * 60, bend: -1, hand: 'open' } }; }, lt));
  B.confetti(ctx, T, 134.4, { n: 60, seed: 4 });
  ctx.restore();
});
// S43 numbers vs trust heart
add(140.4, 'numbers-heart', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0.5 });
  const fade = 1 - prog(lt, 2.0, 2.8);
  ['1K', '10K', '100K', '1M', '50K', '5K'].forEach((s, i) => { const a = (i / 6) * Math.PI * 2 + lt * 0.4; text(ctx, s, 960 + Math.cos(a) * 620, 500 + Math.sin(a) * 300, { size: 90 + (i % 3) * 20, font: 'BG800', color: rgba('#94a3b8', 0.9), stroke: P.out, lw: 10, alpha: fade * prog(lt, i * 0.12, i * 0.12 + 0.3) }); });
  const hk = E.back(clamp((lt - 2.2) / 0.5));
  act(ctx, l => ({ x: 960, y: 1000, s: 1.5, t: T + (l - lt), expr: lt < 2.2 ? 'confused' : 'happy', look: lt < 2.2 ? [Math.sin(l * 2.5), -0.6] : [0, 0.3], armL: hk > 0 ? { x: 56, y: -10, bend: 1, hand: 'open' } : { x: -16, y: 96, bend: 1 }, armR: hk > 0 ? { x: -56, y: -10, bend: -1, hand: 'open' } : { x: 16, y: 96, bend: -1 } }), lt);
  if (hk > 0) { glow(ctx, 960, 690, 300 * hk, '#ff4d6d', 0.5); heartPath(ctx, 960, 690, 170 * hk * (1 + Math.sin(T * 8) * 0.04)); fs(ctx, '#ff4d6d', P.out, 7); circ(ctx, 925, 655, 16 * hk); fs(ctx, '#fff'); }
});
// S44 trust handshake
add(146.2, 'handshake', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: '#facc15', rays: 0.6 });
  const shake = Math.sin(lt * 14) * 10 * (lt > 0.6 && lt < 2.6 ? 1 : 0);
  act(ctx, l => ({ x: 680, y: 1000, s: 1.4, t: T + (l - lt), turn: 0.55, expr: 'happy', armR: { x: 110, y: 30 + shake, bend: 1, hand: 'fist' }, armL: { x: -16, y: 96, bend: 1 } }), lt);
  act(ctx, l => ({ x: 1240, y: 1000, s: 1.4, t: T + (l - lt) + 2, cast: 'budi', outfit: 'orange', turn: -0.55, flip: -1, expr: 'happy', armR: { x: 110, y: 30 + shake, bend: 1, hand: 'fist' }, armL: { x: -16, y: 96, bend: 1 }, blinkOff: 1 }), lt);
  const a = E.back(clamp((lt - 0.5) / 0.5));
  ctx.save(); ctx.translate(960, 300); ctx.scale(a, a); ICON.shield(ctx, 0, 0, 200, P.cyan); fs(ctx, null, P.out, 7); heartPath(ctx, 0, 6, 90); fs(ctx, '#fff', P.out, 4); ctx.restore();
  U.chip(ctx, 960, 470, 'Terpercaya 4,9', { icon: 'star', size: 40, col: P.yellow, alpha: prog(lt, 1.0, 1.3) });
});
// S45 build-up crouch
add(150.4, 'buildup', (ctx, lt, T) => {
  const b = beat(T); B.brandBg(ctx, T, { pulse: b.pulse * 1.5 });
  for (let i = 0; i < 30; i++) { const a = i * 2.4, r = 700 * (1 - ((lt * 1.2 + i / 30) % 1)); sparkle(ctx, 960 + Math.cos(a) * r, 600 + Math.sin(a) * r * 0.6, 10, P.cyan); }
  act(ctx, l => Object.assign({ x: 960, y: 1000, s: lerp(1.4, 1.7, l / 1.5) }, { t: T + (l - lt), expr: 'fierce', crouch: 40, squash: -0.08, lean: 0.1, armL: { x: -50, y: 50, bend: 1, hand: 'fist' }, armR: { x: 50, y: 50, bend: -1, hand: 'fist' }, swingAdd: Math.sin(l * 30) * 0.1 }), lt);
});

// ===== CHORUS 2 – stage =====
const ledLogo = T => (c, x, y, w, h) => { B.brandBg(c, T, { cx: x + w / 2, cy: y + h / 2 }); U.logo(c, x + w / 2, y + h / 2, 110 * (1 + beat(T).pulse * 0.05), { glowA: 1 }); };
add(151.9, 'stage-jump', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.0, shake: lt < 0.7 ? 0 : (1 - clamp((lt - 0.7) / 0.4)) * 14, t: T });
  B.stage(ctx, T, { screen: ledLogo(T) });
  act(ctx, l => { const jj = l < 0.7 ? Math.sin((l / 0.7) * Math.PI) : 0; return { x: lerp(500, 960, clamp(l / 0.7)), y: 900, s: 1.2, t: T + (l - lt), expr: l < 0.7 ? 'laugh' : 'fierce', jump: jj * 260, squash: l > 0.7 && l < 0.85 ? -0.12 : 0, armR: { x: 30, y: -40, bend: -1, hand: 'hold' }, armL: { x: -90, y: -90, bend: 1, hand: 'open' }, hold: { R: (c, x, y) => U.micAt(c, x, y, -0.3) } }; }, lt);
  B.crowd(ctx, T, { y0: 1120 });
  ctx.restore(); flash(ctx, lt, 0.2, 0.8);
}, { trans: 'zoom' });
add(154.5, 'stage-sing', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.4, x: 960, y: 610 });
  B.stage(ctx, T, { screen: ledLogo(T) });
  act(ctx, l => { const bb = beat(T + l - lt); return { x: 960, y: 900, s: 1.2, t: T + (l - lt), expr: 'happy', talk: clamp(voc(T + l - lt) * 1.3), crouch: Math.sin(bb.phase * Math.PI) * 14, headTilt: (bb.i % 2 ? 1 : -1) * 0.08, armR: { x: -20, y: -50, bend: -1, hand: 'hold' }, armL: { x: -100, y: -60 + Math.sin(bb.phase * Math.PI) * -30, bend: 1, hand: 'open' }, hold: { R: (c, x, y) => U.micAt(c, x, y, -0.6) } }; }, lt);
  ctx.restore();
  B.crowd(ctx, T, { y0: 1160 });
});
add(157.9, 'pov-growth-2', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => U.growthScreen(c, w, h, T, prog(lt, 0.1, 2.3), { from: 12800, to: 128000, label: 'Views' }), { bg: 'brand', glowA: 1, shake: 0.5, tilt: 0.04 });
  U.toast(ctx, 1480, 320, 'Akun makin naik!', { icon: 'rocket', col: P.cyan6, s: E.back(clamp((lt - 0.6) / 0.3)) });
  flash(ctx, lt, 0.18, 0.6);
}, { trans: 'zoom' });
add(160.6, 'stage-spin', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.15, x: 960, y: 540, rot: Math.sin(lt * 2) * 0.03 });
  B.stage(ctx, T, { screen: ledLogo(T) });
  act(ctx, l => { const s2 = clamp((l - 0.2) / 1.4); const a = s2 * Math.PI * 4; const bb = beat(T + l - lt); return { x: 960, y: 900, s: 1.25, t: T + (l - lt), turn: Math.sin(a), flip: Math.cos(a) < 0 ? -1 : 1, expr: 'laugh', armL: { x: -110, y: -30, bend: 1, hand: 'open' }, armR: { x: 110, y: -30, bend: -1, hand: 'open' }, crouch: Math.sin(bb.phase * Math.PI) * 10, swingAdd: 0.5 }; }, lt);
  B.crowd(ctx, T, { y0: 1140 });
  ctx.restore();
});
add(163.35, 'bolt-surf', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0 }); B.speedLines(ctx, T, { a: 0.6, n: 90 });
  const y = 640 + Math.sin(T * 3) * 20;
  ctx.save(); ctx.translate(960, y + 50); ctx.rotate(-0.08); ctx.scale(2.4, 2.0); ctx.rotate(Math.PI / 2 * 0.0); glow(ctx, 0, 0, 260, P.yellow, 0.4);
  ctx.beginPath(); ctx.moveTo(-170, -10); ctx.lineTo(20, -40); ctx.lineTo(0, -12); ctx.lineTo(170, -18); ctx.lineTo(-20, 30); ctx.lineTo(0, 4); ctx.closePath(); fs(ctx, P.yellow, P.out, 3); ctx.restore();
  act(ctx, l => ({ x: 960, y: y + 10, s: 1.1, t: T + (l - lt), turn: 0.7, expr: 'fierce', crouch: 22, lean: 0.12, legL: { x: -56, y: 0, bend: 1 }, legR: { x: 56, y: 0, bend: -1 }, armL: { x: -120, y: -30, bend: 1, hand: 'open' }, armR: { x: 110, y: -10, bend: -1, hand: 'open' }, swingAdd: 0.9, shadow: 0 }), lt);
  labelTop(ctx, 'PROSES TERCEPAT', prog(lt, 0.1, 0.4), { y: 140, size: 76 });
});
add(166.4, 'garansi-2', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: '#4ade80', pulse: beat(T).pulse });
  const k = prog(lt, 0.1, 1.2, 'out');
  ctx.save(); ctx.translate(620, 500); circ(ctx, 0, 0, 230); fs(ctx, '#0b1222', P.out, 8); ctx.beginPath(); ctx.arc(0, 0, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); fs(ctx, null, '#22c55e', 34); text(ctx, Math.round(k * 100) + '%', 0, -10, { size: 120, font: 'BG800', color: '#fff' }); text(ctx, 'HASIL PASTI', 0, 80, { size: 34, font: 'PJS800', color: '#86efac' }); ctx.restore();
  U.stamp(ctx, 620, 860, 'BERGARANSI', prog(lt, 1.2, 1.5), { col: '#22c55e', size: 70 });
  act(ctx, l => ({ x: 1380, y: 1000, s: 1.45, t: T + (l - lt), turn: -0.35, expr: 'wink', armR: { x: 40, y: -70, bend: -1, hand: 'thumb' }, armL: { x: -16, y: 96, bend: 1 }, crouch: Math.sin(beat(T + l - lt).phase * Math.PI) * 8 }), lt);
});
add(169.5, 'stairs', (ctx, lt, T) => {
  const camY = lerp(560, 120, E.inOut(clamp(lt / 4.8))), camX = lerp(760, 1180, E.inOut(clamp(lt / 4.8)));
  ctx.save(); camera(ctx, { zoom: 1.0, x: camX, y: camY });
  B.sky(ctx, -400, -700, W + 900, H + 1400, 0.42, T, { sun: false });
  for (let i = 0; i < 6; i++) B.cloudShape(ctx, 300 + i * 330, 600 - i * 180, 70, '#fff', 0.9);
  const steps = 10; for (let i = 0; i < steps; i++) { const x = 300 + i * 120, y = 980 - i * 90; rr(ctx, x, y, 160, 60, 10); fs(ctx, i % 2 ? P.cyan : P.cyan5, P.out, 6); if (i % 3 === 2) text(ctx, ['1K', '10K', '100K'][Math.floor(i / 3)], x + 80, y + 30, { size: 30, font: 'BG800', color: '#fff' }); }
  const pos = clamp(lt / 0.42, 0, 9); const i0 = Math.floor(pos), f = pos - i0;
  const x = 380 + (i0 + f) * 120, y = 980 - i0 * 90 - E.inOut(f) * 90;
  act(ctx, l => merge({ x, y, s: 0.8, t: T + (l - lt), turn: 0.7, expr: 'grin', shadow: 0 }, walk(l, 1.2, 30, 30)), lt);
  ctx.restore();
});
add(174.3, 'podium', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: P.gold, pulse: beat(T).pulse });
  rr(ctx, 760, 760, 400, 340, 14); fs(ctx, P.gold, P.out, 8); text(ctx, '1', 960, 900, { size: 160, font: 'BG800', color: '#fff', stroke: P.out, lw: 12 });
  rr(ctx, 380, 860, 380, 240, 14); fs(ctx, '#cbd5e1', P.out, 8); rr(ctx, 1160, 900, 380, 200, 14); fs(ctx, '#d97706', P.out, 8);
  act(ctx, l => { const jj = l < 0.6 ? Math.sin((l / 0.6) * Math.PI) : 0; return { x: 960, y: 760, s: 1.1, t: T + (l - lt), expr: l < 0.6 ? 'oh' : 'joy', jump: jj * 200, squash: l > 0.6 && l < 0.75 ? -0.1 : 0, armL: { x: -50, y: -110, bend: 1, hand: 'open' }, armR: { x: 50, y: -110, bend: -1, hand: 'open' } }; }, lt);
});
add(176.26, 'trophy', (ctx, lt, T) => {
  const b = beat(T); B.brandBg(ctx, T, { col: P.gold, pulse: b.pulse });
  B.fireworks(ctx, T, [[176.4, 380, 280, P.cyan], [176.9, 1540, 250, P.pink], [177.6, 520, 220, P.yellow], [178.2, 1400, 300, P.cyan], [178.9, 300, 300, P.purple]]);
  U.logo(ctx, 1500, 900, 70, { glowA: 0.5 });
  act(ctx, l => ({ x: 960, y: 1010, s: 1.25, t: T + (l - lt), expr: 'laugh', acc: { crown: true }, armL: { x: 34, y: -150, bend: 1, hand: 'hold' }, armR: { x: -34, y: -150, bend: -1, hand: 'hold' }, crouch: Math.sin(b.phase * Math.PI) * 8,
    hold: { Lfront: (c, x, y) => U.trophy(c, x + 50, y - 60, 0.62, T) } }), lt);
  B.confetti(ctx, T, 176.26, { n: 100, seed: 9 });
  flash(ctx, lt, 0.2, 0.7);
}, { trans: 'zoom' });

// ===== BRIDGE =====
add(180.0, 'sunset', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.05, 1.15, lt / 2.1), x: 960, y: 560 });
  B.hills(ctx, T, { tod: 0.74, scroll: 0 });
  act(ctx, l => ({ x: 760, y: 900, s: 1.1, t: T + (l - lt), turn: 0.65, expr: 'calm', look: [1, -0.4], armL: { x: -16, y: 96, bend: 1 }, armR: { x: 16, y: 96, bend: -1 }, swingAdd: Math.sin(l * 2) * 0.2 }), lt);
  ctx.restore();
});
add(182.1, 'big-clock', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: P.blue, rays: 0.5 });
  U.bigClock(ctx, 960, 470, 330, lt * 3, 1);
  act(ctx, l => merge({ x: lerp(260, 1660, l / 3), y: 1010, s: 1.1, t: T + (l - lt), turn: 0.85, expr: 'determined' }, walk(l, 1.9, 40, 24)), lt);
});
add(185.1, 'days-walk', (ctx, lt, T) => {
  const tod = (0.3 + lt * 0.33) % 1;
  B.hills(ctx, T, { tod, scroll: lt * 500 });
  for (let i = 0; i < 4; i++) { const ph = clamp((lt - i * 0.6) / 1.4); if (ph <= 0 || ph >= 1) continue; ctx.save(); ctx.translate(1700 - ph * 1600, 300 - Math.sin(ph * Math.PI) * 150); ctx.rotate(ph * 6); rr(ctx, -60, -70, 120, 140, 10); fs(ctx, '#fff', P.out, 5); rr(ctx, -60, -70, 120, 34, 10); fs(ctx, P.red, P.out, 5); text(ctx, String(9 + i), 0, 20, { size: 60, font: 'BG800', color: P.navy }); ctx.restore(); }
  act(ctx, l => merge({ x: 900, y: 960, s: 1.1, t: T + (l - lt), turn: 0.85, expr: 'determined' }, walk(l, 1.9, 40, 24)), lt);
});
add(188.1, 'chase-star', (ctx, lt, T) => {
  const scroll = T * 700; B.sky(ctx, 0, 0, W, H, 0.5, T); B.city(ctx, T, { y0: 820, tod: 0.5, scroll }); ctx.fillStyle = '#475569'; ctx.fillRect(0, 880, W, 200); line(ctx, 0, 880, W, 880, P.out, 6);
  B.hSpeed(ctx, T, { a: 0.35 });
  const caught = lt > 2.7; const sx = caught ? null : lerp(1500, 1250, clamp(lt / 2.7)), sy = 420 + Math.sin(T * 4) * 30;
  if (!caught) { glow(ctx, sx, sy, 160, P.yellow, 0.7); starPath(ctx, sx, sy, 60, T * 2); fs(ctx, P.yellow, P.out, 6); text(ctx, 'PELUANG', sx, sy + 100, { size: 40, font: 'BG800', color: '#fff', stroke: P.out, lw: 10 }); }
  act(ctx, l => { if (l < 2.4) return merge({ x: lerp(500, 900, l / 2.4), y: 880, s: 1.1, t: T + (l - lt), turn: 0.85, expr: 'fierce', swingAdd: 0.4 }, run(l, 2.6, 54)); const jk = clamp((l - 2.4) / 0.8); return { x: lerp(900, 1180, jk), y: 880, s: 1.1, t: T + (l - lt), turn: 0.7, expr: jk > 0.4 ? 'excited' : 'fierce', jump: Math.sin(jk * Math.PI) * 300, armR: { x: 60, y: -120, bend: -1, hand: jk > 0.4 ? 'hold' : 'open' }, armL: { x: -40, y: 30, bend: 1, hand: 'fist' }, legL: { x: -40, y: -20 }, legR: { x: 40, y: -40 },
    hold: jk > 0.4 ? { Rfront: (c, x, y) => { glow(c, x, y - 40, 120, P.yellow, 0.6); starPath(c, x, y - 40, 50, T); fs(c, P.yellow, P.out, 5); } } : {} }; }, lt);
});
add(191.8, 'hold-star', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: P.yellow, rays: 0.8 });
  act(ctx, l => Object.assign(cu(960, 460, 1.7), { t: T + (l - lt), expr: lt < 1.2 ? 'determined' : 'grin', look: [0.4, 0.6], armL: { x: 56, y: -6, bend: 1, hand: 'open' }, armR: { x: -56, y: -6, bend: -1, hand: 'open' },
    hold: { Lfront: (c, x, y) => { glow(c, x + 56, y - 30, 160, P.yellow, 0.7); starPath(c, x + 56, y - 30, 56, Math.sin(T * 2) * 0.2); fs(c, P.yellow, P.out, 5); sparkle(c, x + 80, y - 60, 12, '#fff'); } }, fx: { sparkle: 0.8 } }), lt);
});
add(194.1, 'signpost-walk', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.25, 1.0, E.inOut(clamp(lt / 5.8))), x: lerp(820, 960, clamp(lt / 5.8)), y: 560 });
  B.hills(ctx, T, { tod: lerp(0.22, 0.3, lt / 5.8) });
  ctx.beginPath(); ctx.moveTo(300, 1100); ctx.quadraticCurveTo(900, 900, 1500, 760); ctx.lineTo(1580, 770); ctx.quadraticCurveTo(1000, 930, 620, 1100); ctx.closePath(); fs(ctx, '#e7c79a', P.out, 4);
  ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(T * 4); for (let i = 0; i < 6; i++) { const u = (i / 6 + T * 0.2) % 1; const x = lerp(500, 1520, u), y = lerp(1060, 770, u); circ(ctx, x, y, 8); fs(ctx, P.cyan); } ctx.restore();
  U.signpost(ctx, 1240, 860, 0.9);
  act(ctx, l => merge({ x: lerp(560, 1060, l / 5.8), y: lerp(1030, 900, l / 5.8), s: lerp(1.0, 0.85, l / 5.8), t: T + (l - lt), turn: 0.75, expr: 'calm' }, walk(l, 1.3, 30, 18)), lt);
  ctx.restore();
});
add(199.9, 'turn-grin', (ctx, lt, T) => {
  B.hills(ctx, T, { tod: 0.32 });
  B.fireworks(ctx, T, [[200.4, 500, 260, P.cyan], [201.0, 1450, 230, P.pink], [201.8, 760, 200, P.yellow], [202.6, 1250, 280, P.cyan], [203.4, 350, 240, P.purple]]);
  const la = E.back(clamp((lt - 1.4) / 0.6)); ctx.save(); ctx.translate(960, 220); ctx.scale(la, la); U.logo(ctx, 0, 0, 140, { glowA: 1 }); ctx.restore();
  act(ctx, l => { const tk = E.inOut(clamp((l - 0.2) / 0.6)); return { x: 960, y: 1080, s: 1.3, t: T + (l - lt), turn: lerp(0.8, 0, tk), expr: tk > 0.5 ? 'grin' : 'calm', armR: l > 1.0 ? { x: 30, y: -116, bend: -1, hand: 'point' } : { x: 16, y: 96, bend: -1 }, armL: { x: -16, y: 96, bend: 1, hand: 'fist' }, fx: { sparkle: prog(l, 1.4, 1.8) } }; }, lt);
});

// ===== OUTRO =====
add(204.4, 'hosting-montage', (ctx, lt, T) => {
  B.serverRoom(ctx, T, { speed: 2 });
  for (const x of [120, 1580]) U.serverRack(ctx, x, 300, 220, 640, T);
  labelTop(ctx, 'HOSTING TERCEPAT', prog(lt, 0, 0.3), { y: 130, size: 80 });
  act(ctx, l => ({ x: 960, y: 1010, s: 1.35, t: T + (l - lt), expr: 'determined', acc: { headset: true }, armL: { x: 60, y: 20 + Math.sin(l * 22) * 6, bend: 1, hand: 'fist' }, armR: { x: -60, y: 20 + Math.sin(l * 22 + 2) * 6, bend: -1, hand: 'fist' }, swingAdd: 0.5 }), lt);
  rr(ctx, 700, 840, 520, 40, 10); fs(ctx, '#1e293b', P.cyan, 4);
});
add(207.4, 'features', (ctx, lt, T) => {
  const b = beat(T); B.brandBg(ctx, T, { pulse: b.pulse });
  const f = [['bolt', 'Proses Cepat', 480, 330], ['shield', 'Bergaransi', 1440, 330], ['tag', 'Harga Transparan', 480, 760], ['headset', 'Support 24/7', 1440, 760]];
  f.forEach(([ic, l, x, y], i) => { const k = E.back(clamp((lt - i * 0.37) / 0.3)); if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); circ(ctx, 0, -40, 90); fs(ctx, rgba(P.cyan, 0.18), P.cyan, 5); ICON[ic](ctx, 0, -40, 100, P.cyan); text(ctx, l, 0, 100, { size: 46, font: 'PJS800', color: '#fff', stroke: P.out, lw: 8 }); ctx.restore(); });
  act(ctx, l => ({ x: 960, y: 1000, s: 1.2, t: T + (l - lt), expr: 'happy', armL: { x: -100, y: -60, bend: 1, hand: 'point' }, armR: { x: 100, y: -60, bend: -1, hand: 'point' }, crouch: Math.sin(beat(T + l - lt).phase * Math.PI) * 10 }), lt);
});
add(210.4, 'friends-dance', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.05, x: 960, y: 540 });
  B.stage(ctx, T, { screen: ledLogo(T) });
  const cast = [['sari', 'pink', 480], ['main', 'hoodie', 820], ['budi', 'orange', 1120], ['maya', 'purple', 1440]];
  cast.forEach(([c, o, x], i) => act(ctx, l => { const bb = beat(T + l - lt); const side = (bb.i % 2 ? 1 : -1) * (i % 2 ? 1 : -1); return { x, y: 900, s: 0.95, cast: c, outfit: o, t: T + (l - lt) + i, blinkOff: i, expr: ['laugh', 'grin', 'joy', 'happy'][i], crouch: Math.sin(bb.phase * Math.PI) * 14, headTilt: side * 0.08, lean: side * 0.06, armL: { x: side > 0 ? -90 : -40, y: side > 0 ? -90 : 40, bend: 1, hand: 'open' }, armR: { x: side > 0 ? 40 : 90, y: side > 0 ? 40 : -90, bend: -1, hand: 'open' } }; }, lt));
  B.crowd(ctx, T, { y0: 1160 });
  ctx.restore();
});
add(213.4, 'wave-counters', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse * 0.5 });
  U.toast(ctx, 420, 300, '12,8K followers', { icon: 'user', col: P.cyan6, s: E.back(clamp((lt - 0.2) / 0.3)) });
  U.toast(ctx, 1500, 300, '128K views', { icon: 'eye', col: P.orange, s: E.back(clamp((lt - 0.6) / 0.3)) });
  U.toast(ctx, 420, 680, '24K likes', { icon: 'heart', col: P.red, s: E.back(clamp((lt - 1.0) / 0.3)) });
  U.toast(ctx, 1500, 680, '1,2K komentar', { icon: 'comment', col: P.purple, s: E.back(clamp((lt - 1.4) / 0.3)) });
  act(ctx, l => ({ x: 960, y: 1000, s: lerp(1.5, 1.25, E.inOut(clamp(l / 4.4))), t: T + (l - lt), expr: 'grin', armR: { x: 70 + Math.sin(l * 9) * 26, y: -100, bend: -1, hand: 'open' }, ...holdPhone(), look: [0, -0.2], headTilt: 0 }), lt);
});
add(217.84, 'logo-slam', (ctx, lt, T) => {
  const b = beat(T); B.brandBg(ctx, T, { pulse: b.pulse * 1.5 });
  B.fireworks(ctx, T, [[218.0, 300, 260, P.cyan], [218.6, 1620, 240, P.pink], [219.8, 500, 200, P.yellow], [221.6, 1450, 260, P.cyan], [222.4, 380, 260, P.purple], [223.2, 1560, 220, P.yellow]]);
  const slams = [0, 3.6]; let s = 1; for (const t0 of slams) { const k = lt - t0; if (k >= 0 && k < 0.35) s = lerp(2.2, 1, E.out(k / 0.35)); }
  ctx.save(); ctx.translate(W / 2, 380); ctx.scale(s * (1 + b.pulse * 0.02), s * (1 + b.pulse * 0.02)); U.logo(ctx, 0, 0, 200, { glowA: 1.2, pill: true }); ctx.restore();
  act(ctx, l => { const bb = beat(T + l - lt); const jj = Math.sin(bb.phase * Math.PI); return { x: 960, y: 1050, s: 1.2, t: T + (l - lt), expr: 'laugh', jump: jj * 70, armL: { x: -60, y: -110, bend: 1, hand: 'open' }, armR: { x: 60, y: -110, bend: -1, hand: 'open' } }; }, lt);
  flash(ctx, lt, 0.2, 0.8); flash(ctx, lt - 3.6, 0.2, 0.8);
}, { trans: 'zoom' });
add(225.0, 'end-card', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0.6 });
  U.logo(ctx, 820, 400, 170, { glowA: 1, pill: true, alpha: prog(lt, 0, 0.4) });
  text(ctx, 'Booster Media Sosial Tercepat & Terpercaya', 820, 520, { size: 40, font: 'PJS700', color: '#e2e8f0', alpha: prog(lt, 0.3, 0.7) });
  text(ctx, 'boosteryuk.com', 820, 620, { size: 72, font: 'PJS800', color: P.cyan, alpha: prog(lt, 0.6, 1.0) });
  ['SMM Panel', 'Hosting & VPS', 'Support 24/7'].forEach((l, i) => U.chip(ctx, 520 + i * 300, 760, l, { size: 32, alpha: prog(lt, 1.0 + i * 0.25, 1.3 + i * 0.25) }));
  act(ctx, l => ({ x: 1560, y: 1000, s: 1.2, t: T + (l - lt), turn: -0.3, expr: 'happy', armR: { x: 70 + Math.sin(l * 8) * 24, y: -100, bend: -1, hand: 'open' }, armL: { x: -16, y: 96, bend: 1 } }), lt);
  const out = prog(lt, 7.0, 8.6); if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
});

module.exports = S;
