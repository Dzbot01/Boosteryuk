'use strict';
// Shots 0:00 – 1:32 (intro, verse 1, pre-chorus, chorus 1)
const { En, C, U, B, act, cu, pov, flash, scribbles, labelTop, holdPhone } = require('./kit');
const { W, H, P, clamp, lerp, K, E, prog, beat, rgba, glow, rr, fs, circ, line, text, sparkle, heartPath, starPath, ICON, camera, noise } = En;
const { walk, run, idle, merge } = C;

const phoneBack = (ctx, x, y) => U.phone(ctx, x + 4, y - 52, 74, 136, 0.05, { back: true });
const phoneLit = (a = 1) => (ctx, x, y) => { U.phone(ctx, x + 4, y - 52, 74, 136, 0.05, { back: true }); };

const S = [];
const add = (at, name, draw, o = {}) => S.push(Object.assign({ at, name, draw }, o));

// S01 dawn city + title
add(0.0, 'dawn-title', (ctx, lt, T) => {
  const tod = lerp(0.14, 0.26, lt / 3.4);
  ctx.save(); camera(ctx, { zoom: 1.08, y: lerp(470, 560, E.inOut(clamp(lt / 3.4))) });
  B.sky(ctx, -100, -100, W + 200, H + 300, tod, T, { cloudSpeed: 10 }); B.city(ctx, T, { y0: 900, tod, layers: 2, lights: 0.8 });
  ctx.restore();
  const a = Math.min(prog(lt, 0.5, 1.1, 'out'), 1 - prog(lt, 2.9, 3.35));
  U.logo(ctx, W / 2, 470, 150, { alpha: a, glowA: a, pill: true });
  text(ctx, 'OFFICIAL MUSIC VIDEO', W / 2, 590, { size: 34, color: '#e0f2fe', font: 'PJS800', alpha: a, spacing: 8 });
  flash(ctx, lt, 0.6, 1, '#000');
});

// S02 sleeping, alarm rings
add(3.4, 'sleep', (ctx, lt, T) => {
  const ring = lt > 1.9 ? 1 : 0;
  ctx.save(); camera(ctx, { zoom: lerp(1.0, 1.12, lt / 3.3), x: 1100, y: 560, shake: ring * 3, t: T });
  B.bedroom(ctx, T, { tod: 0.24, dim: 0.45 }); B.nightstand(ctx, T, { dim: 0.45 });
  B.alarmClock(ctx, 745, 660, 0.62, T, ring);
  B.bedBack(ctx, { dim: 0.45 });
  const ex = ring ? (lt > 2.4 ? 'yawn' : ['asleep', 'squeeze'][0]) : 'asleep';
  C.drawHeadAt(ctx, 1085, 628, 0.62, -1.2 + Math.sin(T * 2) * 0.03 + (ring ? Math.sin(T * 30) * 0.04 : 0), { expr: lt > 2.4 ? { eye: 'squeeze', mOpen: 0.3, smile: -0.4, mW: 0.7, browAng: 0.3 } : 'asleep', t: T, blink: false });
  B.blanket(ctx, 1120, 1700, 660, T, { dim: 0.45, breathe: !ring });
  if (!ring) for (let k = 0; k < 3; k++) { const ph = (T * 0.45 + k / 3) % 1; text(ctx, 'Z', 1150 + ph * 70, 520 - ph * 140, { size: 34 + ph * 30, color: '#fff', stroke: P.out, lw: 8, alpha: Math.sin(ph * Math.PI) }); }
  ctx.restore();
  if (ring) { const s = 1 + beat(T).pulse * 0.15; ctx.save(); ctx.translate(560, 300); ctx.rotate(-0.12); ctx.scale(s, s); text(ctx, 'KRIIING!', 0, 0, { size: 110, font: 'BG800', color: P.yellow, stroke: P.out, lw: 16 }); ctx.restore(); }
});

// S03 sit up, stretch, yawn
add(6.7, 'wake-stretch', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.55, x: 1130, y: 560 });
  B.bedroom(ctx, T, { tod: 0.27, dim: 0.2 }); B.nightstand(ctx, T, { dim: 0.2 }); B.alarmClock(ctx, 745, 660, 0.62, T, 0); B.bedBack(ctx, { dim: 0.2 });
  const st = K(lt, [[0, 0], [0.35, 0], [0.9, 1, 'back'], [1.7, 1], [2.1, 0]]);
  const rub = prog(lt, 1.9, 2.2) * (1 - prog(lt, 2.5, 2.7));
  act(ctx, l => ({
    x: 1150, y: 860, s: 1, t: T + (l - lt), outfit: 'pajama', hideLegs: true,
    lean: lerp(0.18, -0.06, st), crouch: lerp(16, -10, st) + Math.sin(l * 2) * 2, headTilt: lerp(0.22, -0.12, st) + rub * 0.1, squash: st * 0.08,
    armL: { x: lerp(-10, -50, st), y: lerp(96, -112, st), bend: 1, hand: st > 0.5 ? 'open' : 'fist' },
    armR: rub > 0.1 ? { x: lerp(15, -18, rub), y: lerp(96, -80, rub), bend: -1, hand: 'fist' } : { x: lerp(10, 50, st), y: lerp(96, -112, st), bend: -1, hand: st > 0.5 ? 'open' : 'fist' },
    expr: lt < 0.4 ? 'sleepy' : lt < 1.75 ? 'yawn' : 'sleepy', swingAdd: 0.3, look: [-0.6, 0.2],
  }), lt);
  B.blanket(ctx, 960, 1700, 735, T, { dim: 0.2 });
  ctx.restore();
});

// S04 checks phone in bed, face lit
add(9.4, 'grab-phone', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 2.0, x: 1150, y: 590 });
  B.bedroom(ctx, T, { tod: 0.28, dim: 0.25 }); B.bedBack(ctx, { dim: 0.25 });
  const up = E.back(clamp(lt / 0.5));
  act(ctx, l => ({
    x: 1150, y: 860, s: 1, t: T + (l - lt), outfit: 'pajama', hideLegs: true, lean: 0.06, crouch: 6, headTilt: 0.08 - up * 0.04,
    armL: { x: lerp(-20, 40, up), y: lerp(96, 84, up), bend: 1, hand: 'hold' }, armR: { x: lerp(20, -40, up), y: lerp(96, 86, up), bend: -1, hand: 'hold' },
    hold: { L: (c, x, y) => U.phone(c, x + 40, y - 30, 72, 128, 0, { back: true }) },
    expr: lt < 0.8 ? 'sleepy' : ['sleepy', 'oh', prog(lt, 0.8, 1.1)], look: [0, 0.6], swingAdd: 0.25,
  }), lt);
  B.blanket(ctx, 960, 1700, 735, T, { dim: 0.25 });
  glow(ctx, 1150, 590, 240, P.cyan, 0.3 * up);
  ctx.restore();
});
add(11.1, 'pov-reminder', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => U.reminderScreen(c, w, h, T, prog(lt, 0.2, 0.7)), { bg: 'room' });
});

// S05a feet step down
add(12.68, 'feet-step', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 3.1, x: 860, y: 950 });
  B.bedroom(ctx, T, { tod: 0.3, dim: 0.1 });
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff7d6'; ctx.beginPath(); ctx.moveTo(420, 560); ctx.lineTo(640, 560); ctx.lineTo(1100, 1080); ctx.lineTo(700, 1080); ctx.closePath(); ctx.fill(); ctx.restore();
  act(ctx, l => merge({ x: 760 + l * 70, y: 965, s: 1, t: T + (l - lt), outfit: 'pajama', turn: 0.6 }, walk(l, 1.1, 30, 18)), lt);
  for (let k = 0; k < 2; k++) { const tk = 0.45 + k * 0.9; const ph = clamp((lt - tk) / 0.5); if (ph > 0 && ph < 1) for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; sparkle(ctx, 760 + tk * 70 + (k ? 20 : -20) + Math.cos(a) * 60 * ph, 965 + Math.sin(a) * 40 * ph, 12, P.yellow, 1 - ph); } }
  ctx.restore();
});
// S05b fist pump, determined
add(14.5, 'fist-pump', (ctx, lt, T) => {
  const b = beat(T);
  ctx.save(); camera(ctx, { zoom: lerp(1.55, 1.68, lt / 2) + b.pulse * 0.015, x: 790, y: 690 });
  B.bedroom(ctx, T, { tod: 0.32 }); B.nightstand(ctx, T); B.bedBack(ctx); B.blanket(ctx, 1120, 1700, 700, T);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff7d6'; ctx.beginPath(); ctx.moveTo(300, 560); ctx.lineTo(560, 560); ctx.lineTo(1000, 1080); ctx.lineTo(600, 1080); ctx.closePath(); ctx.fill(); ctx.restore();
  const pump = E.back(clamp((lt - 0.25) / 0.35));
  act(ctx, l => merge({ x: 760, y: 930, s: 1.05, t: T + (l - lt), outfit: 'pajama', expr: lt < 0.3 ? 'calm' : 'determined', crouch: lerp(10, -6, pump) + Math.sin(l * 9) * 1.5, squash: pump * 0.05, headTilt: -0.05 * pump, lean: -0.04 * pump,
    armR: { x: lerp(20, 34, pump), y: lerp(96, -104, pump), bend: -1, hand: 'fist' }, armL: { x: lerp(-16, 20, pump), y: lerp(96, 50, pump), bend: 1, hand: 'fist' }, fx: { sparkle: pump } }), lt);
  ctx.restore();
});

// S06 spin + outfit change
add(16.5, 'spin-change', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.3, x: 800, y: 600 });
  B.bedroom(ctx, T, { tod: 0.36 }); B.nightstand(ctx, T); B.bedBack(ctx); B.blanket(ctx, 1120, 1700, 700, T);
  const sp = clamp((lt - 0.2) / 0.9); const ang = sp * Math.PI * 4; const changed = lt > 0.75;
  act(ctx, l => {
    const s2 = clamp((l - 0.2) / 0.9); const a2 = s2 * Math.PI * 4; const done = l > 1.2;
    return { x: 760, y: 930, s: 1.05, t: T + (l - lt), outfit: l > 0.75 ? 'hoodie' : 'pajama', turn: s2 < 1 ? Math.sin(a2) : 0, flip: s2 < 1 && Math.cos(a2) < 0 ? -1 : 1,
      expr: done ? 'wink' : 'grin', crouch: done ? 0 : -8, jump: s2 > 0 && s2 < 1 ? Math.sin(s2 * Math.PI) * 40 : 0,
      armL: done ? { x: -18, y: 96, bend: 1, hand: 'open' } : { x: -80, y: -40, bend: 1, hand: 'open' },
      armR: done ? { x: 26, y: -86, bend: -1, hand: 'peace' } : { x: 80, y: -40, bend: -1, hand: 'open' } };
  }, lt);
  U.poof(ctx, 760, 700, (lt - 0.6) / 0.6, 1.3);
  ctx.restore();
});

// S07 planning + dream bubble
add(19.0, 'plan-dream', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.0, 1.08, lt / 3.4), x: 960, y: 540 });
  B.deskRoom(ctx, T, { tod: 0.42 });
  U.whiteboard(ctx, 640, 440, 700, 470, prog(lt, 0.2, 3.0) * 0.5, T);
  const wr = Math.sin(lt * 11) * 10;
  act(ctx, l => ({ x: 1200, y: 930, s: 1.1, t: T + (l - lt), turn: -0.55, expr: lt < 1.2 ? 'focused' : 'dreamy', look: lt < 1.2 ? [-1, -0.2] : [0.5, -1],
    armL: lt < 1.2 ? { x: -150 + Math.sin(l * 11) * 10, y: -40 + Math.cos(l * 9) * 8, bend: -1, hand: 'hold' } : { x: -16, y: 96, bend: 1, hand: 'open' },
    armR: lt < 1.2 ? { x: 16, y: 96, bend: -1 } : { x: -30, y: 6, bend: -1, hand: 'fist' }, crouch: Math.sin(l * 2) * 2, headTilt: lt < 1.2 ? 0 : -0.12,
    hold: { L: (c, x, y) => { rr(c, x - 50, y - 8, 46, 16, 6); fs(c, P.red, P.out, 3); } } }), lt);
  U.bubble(ctx, 1470, 260, 420, 300, 1260, 520, { k: prog(lt, 1.2, 1.8), content: c => {
    const g = c.createLinearGradient(0, -150, 0, 150); g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#fbcfe8'); c.fillStyle = g; c.fillRect(-220, -160, 440, 320);
    U.avatar(c, -110, -10, 70, 'laugh', T); starPath(c, -110, -100, 30, T); fs(c, P.yellow, P.out, 4);
    text(c, '10K', 70, -30, { size: 100, font: 'BG800', color: P.cyan6, stroke: P.out, lw: 10 }); text(c, 'Followers', 70, 50, { size: 34, font: 'PJS800', color: P.navy });
    for (let i = 0; i < 4; i++) { heartPath(c, -40 + i * 60, 110 - ((T * 60 + i * 30) % 60), 26); fs(c, '#ff4d6d', P.out, 2); }
  } });
  ctx.restore();
});
add(22.4, 'whiteboard-cu', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.75, 1.85, lt / 2), x: 640, y: 450 });
  B.deskRoom(ctx, T, { tod: 0.44 });
  const k = 0.5 + prog(lt, 0, 1.9) * 0.5; U.whiteboard(ctx, 640, 440, 700, 470, k, T);
  ctx.restore();
});

// S09a filming content
add(24.5, 'filming', (ctx, lt, T) => {
  const b = beat(T);
  ctx.save(); camera(ctx, { zoom: lerp(1.02, 1.14, lt / 2.3), x: 960, y: 560 });
  B.deskRoom(ctx, T, { tod: 0.48 });
  U.ringLight(ctx, 1380, 400, 0.9, 1); U.tripodPhone(ctx, 1380, 640, 0.9, T, 1);
  const g = b.inBar % 2;
  act(ctx, l => ({ x: 720, y: 930, s: 1.15, t: T + (l - lt), turn: 0.45, expr: 'grin', talk: 0.8, crouch: Math.sin(beat(T + l - lt).phase * Math.PI) * 10, headTilt: g ? 0.08 : -0.06,
    armR: g ? { x: 110, y: -10, bend: -1, hand: 'point' } : { x: 60, y: -80, bend: -1, hand: 'open' }, armL: g ? { x: -60, y: 30, bend: 1, hand: 'open' } : { x: -20, y: 96, bend: 1, hand: 'fist' } }), lt);
  ctx.restore();
});
// S09b recording screen
add(26.8, 'rec-screen', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a5f3fc'); g.addColorStop(1, '#f9a8d4'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const b = beat(T); const d = b.inBar % 2;
    C.drawChar(c, { x: w / 2, y: h * 0.86, s: 0.95, t: T, expr: d ? 'laugh' : 'grin', crouch: Math.sin(b.phase * Math.PI) * 14, armL: { x: d ? -60 : -30, y: d ? -100 : 20, bend: 1, hand: 'open' }, armR: { x: d ? 30 : 60, y: d ? 20 : -100, bend: -1, hand: 'open' }, jump: b.pulse * 20 });
    circ(c, 40, 50, 12); fs(c, Math.sin(T * 8) > 0 ? P.red : '#7f1d1d'); text(c, 'REC 00:' + String(12 + Math.floor(lt)).padStart(2, '0'), 62, 51, { size: 26, color: '#0f172a', align: 'left', font: 'PJS800' });
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; for (const [x, y, dx, dy] of [[20, 90, 1, 1], [w - 20, 90, -1, 1], [20, h - 20, 1, -1], [w - 20, h - 20, -1, -1]]) { line(c, x, y, x + dx * 40, y, '#fff', 4); line(c, x, y, x, y + dy * 40, '#fff', 4); }
  }, { bg: 'room', tilt: 0.03 });
});
// S10 editing
add(29.0, 'editing', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.35, x: 960, y: 560 });
  B.deskRoom(ctx, T, { tod: 0.55 });
  act(ctx, l => ({ x: 960, y: 790, s: 1.3, t: T + (l - lt), expr: 'focused', acc: { glasses: true }, fx: { sweat: 1 }, look: [0, 0.8], headTilt: 0.05, shadow: 0,
    armL: { x: 40, y: 110 + Math.max(0, Math.sin(l * 22)) * -12, bend: 1, hand: 'fist' }, armR: { x: -40, y: 110 + Math.max(0, Math.sin(l * 22 + 2)) * -12, bend: -1, hand: 'fist' } }), lt);
  B.desk(ctx, 300, 1620, 780);
  // laptop back
  ctx.save(); ctx.translate(960, 780); ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(230, 0); ctx.lineTo(214, -170); ctx.lineTo(-214, -170); ctx.closePath(); fs(ctx, '#cbd5e1', P.out, 6); circ(ctx, 0, -85, 34); fs(ctx, P.cyan); ICON.bolt(ctx, 0, -85, 40, '#fff'); ctx.restore();
  U.mug(ctx, 1380, 780, 0.9, T);
  // holographic timeline panel
  const a = prog(lt, 0.1, 0.4, 'out'); ctx.save(); ctx.globalAlpha = a; ctx.translate(1440, 300);
  rr(ctx, -200, -110, 400, 220, 18); fs(ctx, rgba('#0b1222', 0.85), P.cyan, 4);
  const cols = [P.pink, P.cyan, P.yellow, P.purple, P.lime];
  for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i < 4; i++) { rr(ctx, -180 + i * 92 + r2 * 20, -70 + r2 * 52, 80 - r2 * 10, 36, 8); fs(ctx, cols[(i + r2) % 5]); }
  const ph = -180 + ((lt * 160) % 360); line(ctx, ph, -90, ph, 90, '#fff', 4);
  ctx.restore();
  ctx.restore();
});

// S11a upload
add(31.1, 'pov-upload', (ctx, lt, T) => { pov(ctx, lt, T, (c, w, h) => U.uploadScreen(c, w, h, prog(lt, 0.1, 1.2), T), { bg: 'room' }); });
// S11b hopeful crossing fingers
add(32.9, 'hopeful', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.7, 1.85, lt / 1.6), x: 960, y: 520 });
  B.deskRoom(ctx, T, { tod: 0.58 });
  act(ctx, l => ({ x: 960, y: 960, s: 1.15, t: T + (l - lt), expr: 'hopeful', look: [0, -0.8], headTilt: Math.sin(l * 3) * 0.05,
    armL: { x: 46, y: -28, bend: 1, hand: 'peace' }, armR: { x: -46, y: -28, bend: -1, hand: 'peace' }, fx: { sparkle: 0.7 }, crouch: Math.sin(l * 4) * 2 }), lt);
  ctx.restore();
});
// S12 waiting time-lapse
add(34.5, 'waiting', (ctx, lt, T) => {
  const tod = lerp(0.5, 0.8, lt / 2.8);
  ctx.save(); camera(ctx, { zoom: 1.1, x: 960, y: 560 });
  B.deskRoom(ctx, T, { tod, dim: prog(lt, 1.2, 2.8) * 0.35 });
  U.bigClock(ctx, 560, 420, 110, lt * 4, 1);
  act(ctx, l => ({ x: 1000, y: 940, s: 1.15, t: T + (l - lt), expr: lt < 1 ? 'hopeful' : lt < 2 ? 'neutral' : 'worried', look: [0, 0.8], headTilt: 0.12 + lerp(0, 0.1, lt / 2.8),
    armR: { x: -10, y: 96, bend: -1, hand: 'open' }, crouch: lerp(0, 10, lt / 2.8), ...holdPhone() , headTilt: 0.12 + lerp(0, 0.1, lt / 2.8) }), lt);
  const labs = ['1 jam…', '3 jam…', '6 jam…']; const i = Math.min(2, Math.floor(lt / 0.95));
  U.chip(ctx, 1500, 200, labs[i], { icon: 'clock', size: 40 });
  ctx.restore();
});

// S13a low stats
add(37.3, 'pov-low-stats', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => U.socialScreen(c, w, h, { mode: 'post', views: 12, likes: 1, comments: 0, t: T }), { bg: 'blue', glowA: 0.2 });
  const a = prog(lt, 0.5, 0.8); U.chip(ctx, 1480, 380, '+0 likes', { icon: 'heart', col: '#94a3b8', size: 56, alpha: a }); U.chip(ctx, 1480, 540, '+0 followers', { icon: 'user', col: '#94a3b8', size: 56, alpha: prog(lt, 0.8, 1.1) });
});
// S13b sad + raincloud
add(38.9, 'sad-cloud', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 1.6, x: 960, y: 520 });
  B.deskRoom(ctx, T, { tod: 0.84, dim: 0.5, blue: 1 });
  act(ctx, l => ({ x: 960, y: 970, s: 1.1, t: T + (l - lt), expr: ['worried', 'sad', prog(lt, 0, 0.5)], headTilt: 0.12, lean: 0.06, crouch: 14, look: [0, 0.7],
    armR: { x: -14, y: 98, bend: -1 }, ...holdPhone({ tilt: 0.15 }), headTilt: 0.14, fx: { cloud: prog(lt, 0.2, 0.6) } }), lt);
  ctx.restore();
});
// S14 confused – needs a strategy
add(40.5, 'confused', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.1, 1.2, lt / 2.9), x: 960, y: 560 });
  B.deskRoom(ctx, T, { tod: 0.86, dim: 0.55, blue: 1 });
  scribbles(ctx, T, prog(lt, 0, 0.5));
  act(ctx, l => ({ x: 960, y: 950, s: 1.2, t: T + (l - lt), expr: 'confused', look: [Math.sin(l * 2), -0.3], headTilt: Math.sin(l * 2) * 0.12, fx: { q: prog(lt, 0.2, 0.6), sweat: 0.8 },
    armR: { x: -6 + Math.sin(l * 18) * 6, y: -126, bend: -1, hand: 'fist' }, armL: { x: -16, y: 96, bend: 1 } }), lt);
  ctx.restore();
});
// S15a refresh, nothing
add(43.4, 'pov-refresh', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => {
    c.fillStyle = '#f1f5f9'; c.fillRect(0, 0, w, h); text(c, 'Notifikasi', w / 2, w * 0.14, { size: w * 0.06, color: '#0f172a', font: 'PJS800' });
    const pull = Math.max(0, Math.sin((lt % 0.95) / 0.95 * Math.PI)) * 90; c.save(); c.translate(w / 2, w * 0.3 + pull * 0.6); c.rotate(T * 8); c.beginPath(); c.arc(0, 0, 22, 0, 4.6); fs(c, null, P.cyan6, 6); c.restore();
    text(c, 'Belum ada', w / 2, h * 0.48 + pull, { size: w * 0.07, color: '#64748b', font: 'PJS800' }); text(c, 'notifikasi baru', w / 2, h * 0.54 + pull, { size: w * 0.07, color: '#64748b', font: 'PJS800' });
    line(c, w * 0.1, h * 0.75 + pull, w * 0.9, h * 0.75 + pull, '#cbd5e1', 6); text(c, 'grafik: datar', w / 2, h * 0.8 + pull, { size: w * 0.045, color: '#94a3b8', font: 'PJS700' });
  }, { bg: 'blue', glowA: 0.15, finger: [930 + Math.sin(lt * 6.6) * 10, 420 + Math.max(0, Math.sin((lt % 0.95) / 0.95 * Math.PI)) * 160] });
});
// S15b crying
add(45.3, 'cry', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: 2.0, x: 960, y: 650 });
  B.deskRoom(ctx, T, { tod: 0.9, dim: 0.65, blue: 1 });
  act(ctx, l => ({ x: 960, y: 1000, s: 1.1, t: T + (l - lt), expr: 'cry', fx: { tears: 1, cloud: 1 }, headTilt: 0.08 + Math.sin(l * 14) * 0.015, crouch: 18 + Math.sin(l * 14) * 2, lean: 0.05,
    armL: { x: 20, y: 70, bend: 1, hand: 'fist' }, armR: { x: -20, y: 70, bend: -1, hand: 'fist' } }), lt);
  ctx.restore();
});
// S16 lightbulb moment
add(47.3, 'lightbulb', (ctx, lt, T) => {
  const on = lt > 0.32; const z = on ? 2.0 - E.out(clamp((lt - 0.32) / 0.3)) * 0.35 : 2.0;
  ctx.save(); camera(ctx, { zoom: z, x: 960, y: 610 });
  B.deskRoom(ctx, T, { tod: 0.9, dim: on ? 0.2 : 0.6, blue: on ? 0.2 : 1 });
  act(ctx, l => ({ x: 960, y: 1000, s: 1.1, t: T + (l - lt), expr: on ? 'surprised' : 'sad', fx: { tears: on ? 0 : 0.8, bulb: on ? clamp((lt - 0.32) / 0.2) : 0, excl: on ? E.back(clamp((lt - 0.4) / 0.3)) : 0 },
    crouch: on ? -8 : 16, headTilt: on ? -0.05 : 0.1, squash: on ? 0.06 : 0, armL: { x: 20, y: 70, bend: 1, hand: on ? 'open' : 'fist' }, armR: { x: -20, y: 70, bend: -1, hand: on ? 'open' : 'fist' } }), lt);
  ctx.restore();
  if (on) flash(ctx, lt - 0.32, 0.25, 0.8, '#fff7c2');
});
// S17a remembers Boosteryuk
add(48.6, 'remember', (ctx, lt, T) => {
  ctx.save(); camera(ctx, { zoom: lerp(1.15, 1.05, lt / 3), x: 960, y: 560 });
  B.deskRoom(ctx, T, { tod: 0.5 });
  const j = beat(T);
  act(ctx, l => ({ x: 760, y: 960, s: 1.2, t: T + (l - lt), expr: 'excited', jump: lt < 0.6 ? Math.sin(clamp(l / 0.6) * Math.PI) * 110 : 0, squash: lt < 0.6 ? 0.1 : 0,
    armL: { x: -16, y: 90, bend: 1, hand: 'fist' }, armR: { x: 70, y: -100, bend: -1, hand: 'point' }, look: [0.8, -1], fx: { sparkle: 1 } }), lt);
  U.bubble(ctx, 1320, 300, 760, 360, 930, 560, { k: prog(lt, 0.3, 1.0), fill: '#0b1222', content: c => {
    B.brandBg(c, T, { cx: 0, cy: 0 }); U.logo(c, 0, -20, 120, { glowA: 1, pill: true }); text(c, 'Booster media sosial tercepat', 0, 90, { size: 38, color: '#e2e8f0', font: 'PJS700' });
  } });
  ctx.restore();
});
// S17b brand card
add(51.6, 'brand-card', (ctx, lt, T) => {
  const b = beat(T);
  B.brandBg(ctx, T, { pulse: b.pulse });
  const s = E.back(clamp(lt / 0.4));
  ctx.save(); ctx.translate(1080, 430); ctx.scale(s, s); U.logo(ctx, 0, 0, 170 * (1 + b.pulse * 0.02), { glowA: 1, pill: true, tagline: 'Platform booster media sosial tercepat' }); ctx.restore();
  act(ctx, l => ({ x: 380, y: 1080 + lerp(300, 0, E.back(clamp(l / 0.5))), s: 1.5, t: T + (l - lt), expr: 'grin', turn: 0.4, armR: { x: 120, y: -60, bend: -1, hand: 'point' }, armL: { x: -30, y: 80, bend: 1, hand: 'thumb' }, crouch: Math.sin(b.phase * Math.PI) * 6 }), lt);
});
// S18 boosteryuk.com on phone
add(54.4, 'pov-boosteryuk', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => U.boosteryukScreen(c, w, h, T, { k: prog(lt, 0.2, 2.0), scroll: K(lt, [[0, 0], [2.6, 0], [3.6, 120]]) }), { bg: 'brand', glowA: 1 });
  const items = [['Proses cepat', 'bolt', 0.8], ['Bergaransi', 'shield', 1.4], ['Support 24/7', 'headset', 2.0]];
  items.forEach(([l, ic, t0], i) => U.chip(ctx, i % 2 ? 1540 : 380, 330 + i * 190, l, { icon: ic, size: 38, alpha: prog(lt, t0, t0 + 0.25) }));
});
// S19 wow face
add(58.7, 'wow', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse });
  act(ctx, l => Object.assign(cu(960, 470, 2.0), { t: T + (l - lt), expr: 'excited', fx: { sparkle: 1 }, headTilt: Math.sin(l * 3) * 0.05, armL: { x: 50, y: -20, bend: 1, hand: 'open' }, armR: { x: -50, y: -20, bend: -1, hand: 'open' } }), lt);
  glow(ctx, 960, 560, 500, P.cyan, 0.2);
});
// S20a order
add(60.6, 'pov-order', (ctx, lt, T) => {
  const press = lt > 1.5 && lt < 2.0 ? (lt - 1.5) / 0.5 : 0; const done = lt > 1.9 ? 1 : 0;
  const tapX = lt < 0.9 ? 980 : 960, tapY = lt < 0.9 ? 380 : 870;
  const fx = K(lt, [[0, 1500], [0.5, 1020], [0.9, 1020], [1.4, 980], [1.6, 990], [2.2, 1200]]), fy = K(lt, [[0, 1100], [0.5, 330], [0.9, 330], [1.4, 845], [1.6, 860], [2.2, 1100]]);
  pov(ctx, lt, T, (c, w, h) => U.boosteryukScreen(c, w, h, T, { k: 1, sel: lt > 0.6 ? 0 : -1, press, done }), { bg: 'brand', glowA: 1, finger: [fx - 40, fy - 54] });
  if (done) U.toast(ctx, 1500, 300, 'Pesanan diproses!', { icon: 'bolt', col: P.cyan6, s: E.back(clamp((lt - 1.9) / 0.3)) });
});
// S20b decision, arrow up
add(63.2, 'decision', (ctx, lt, T) => {
  B.brandBg(ctx, T, { pulse: beat(T).pulse });
  const a = E.out(clamp(lt / 0.8));
  ctx.save(); ctx.translate(1400, 900 - a * 500); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, -260); ctx.lineTo(150, -60); ctx.lineTo(60, -60); ctx.lineTo(60, 300); ctx.lineTo(-60, 300); ctx.lineTo(-60, -60); ctx.lineTo(-150, -60); ctx.closePath(); fs(ctx, P.cyan, P.out, 10); ctx.restore();
  const nod = Math.max(0, Math.sin(lt * 7)) * (lt < 1.4 ? 1 : 0);
  act(ctx, l => ({ x: 800, y: 1010, s: 1.6, t: T + (l - lt), expr: 'determined', headTilt: Math.max(0, Math.sin(l * 7)) * (l < 1.4 ? 0.14 : 0), armR: { x: 70, y: -40, bend: -1, hand: 'thumb' }, armL: { x: -16, y: 96, bend: 1, hand: 'fist' }, fx: { sparkle: 0.6 } }), lt);
});
// S21 countdown
add(65.8, 'countdown', (ctx, lt, T) => {
  const b = beat(T);
  ctx.save(); camera(ctx, { zoom: 1.0, shake: 3 + lt * 3, t: T });
  B.sky(ctx, -50, -50, W + 100, H + 100, 0.45, T); B.city(ctx, T, { y0: 860, tod: 0.45, layers: 2 });
  rr(ctx, 700, 860, 520, 60, 10); fs(ctx, '#64748b', P.out, 6); ctx.fillStyle = '#94a3b8'; ctx.fillRect(-10, 900, W + 20, 200);
  U.rocket(ctx, 960, 560, 0.95, T, { flame: 0.25 + lt * 0.2 });
  for (let i = 0; i < 6; i++) { const ph = (T * 0.8 + i / 6) % 1; B.cloudShape(ctx, 960 + (i - 2.5) * 120 + ph * (i - 2.5) * 30, 880 - ph * 40, 50 + ph * 30, '#e2e8f0', 0.8 * (1 - ph)); }
  act(ctx, l => ({ x: 1450, y: 960, s: 1.0, t: T + (l - lt), turn: -0.5, expr: 'fierce', armR: { x: 40, y: -100, bend: -1, hand: 'fist' }, armL: { x: -16, y: 96, bend: 1, hand: 'fist' }, crouch: Math.sin(b.phase * Math.PI) * 6 }), lt);
  ctx.restore();
  const n = 3 - Math.min(2, Math.floor(lt / 0.7)); const k = (lt % 0.7) / 0.7;
  ctx.save(); ctx.translate(480, 420); const s = lerp(1.6, 1, E.out(clamp(k * 3))); ctx.scale(s, s); text(ctx, String(n), 0, 0, { size: 260, font: 'BG800', color: '#fff', stroke: P.out, lw: 20, alpha: 1 - k * 0.3 }); ctx.restore();
});

// ===== CHORUS 1 =====
add(67.9, 'rocket-ride', (ctx, lt, T) => {
  const b = beat(T);
  B.sky(ctx, 0, 0, W, H, 0.5, T, { sun: false, clouds: false });
  for (let i = 0; i < 8; i++) { const r = En.hash(i); const y = ((r * 1400 + lt * 1600 * (0.6 + r)) % 1500) - 200; B.cloudShape(ctx, 150 + r * 1600, y, 50 + r * 60, '#ffffff', 0.9); }
  B.hSpeed(ctx, T, { a: 0.0 });
  B.speedLines(ctx, T, { cx: 960, cy: 300, a: 0.45, n: 60 });
  const wob = Math.sin(T * 3) * 0.05; const ry = 560 + Math.sin(T * 4) * 16;
  ctx.save(); ctx.translate(960, ry); ctx.rotate(wob); ctx.translate(-960, -ry);
  U.rocket(ctx, 960, ry + 120, 0.85, T, { flame: 1.4 });
  act(ctx, l => ({ x: 960, y: ry - 10, s: 0.85, t: T + (l - lt), expr: 'laugh', crouch: 52, legL: { x: -88, y: -10, bend: -1 }, legR: { x: 88, y: -10, bend: 1 }, armL: { x: -50, y: 60, bend: 1, hand: 'fist' }, armR: { x: 60 + Math.sin(l * 12) * 20, y: -100, bend: -1, hand: 'open' }, swingAdd: 0.6, shadow: 0 }), lt);
  ctx.restore();
  flash(ctx, lt, 0.2, 0.8);
}, { trans: 'zoom' });
add(70.5, 'run-forward', (ctx, lt, T) => {
  const b = beat(T); const scroll = T * 900;
  B.sky(ctx, 0, 0, W, H, 0.5, T); B.city(ctx, T, { y0: 760, tod: 0.5, layers: 2, scroll });
  ctx.fillStyle = '#334155'; ctx.fillRect(0, 820, W, 260);
  for (let i = -1; i < 10; i++) { const x = i * 260 - (scroll % 260); rr(ctx, x, 800, 230, 50, 10); fs(ctx, i % 2 ? P.cyan : P.cyan5, P.out, 5); ICON.bolt(ctx, x + 115, 825, 30, '#fff'); }
  B.hSpeed(ctx, T, { a: 0.4 });
  act(ctx, l => merge({ x: 900, y: 815, s: 1.1, t: T + (l - lt), turn: 0.85, expr: 'fierce', swingAdd: 0.4 }, run(l, 2.7, 56)), lt);
});
add(73.9, 'pov-growth', (ctx, lt, T) => {
  pov(ctx, lt, T, (c, w, h) => U.growthScreen(c, w, h, T, prog(lt, 0.1, 2.2), { from: 128, to: 12800, label: 'Followers' }), { bg: 'brand', glowA: 1, shake: 0.5 });
  U.toast(ctx, 420, 340, '+12.672 followers', { icon: 'user', col: P.cyan6, s: E.back(clamp((lt - 0.5) / 0.3)) });
  U.toast(ctx, 1500, 620, '+8,4K likes', { icon: 'heart', col: P.red, s: E.back(clamp((lt - 1.0) / 0.3)) });
  flash(ctx, lt, 0.18, 0.6);
}, { trans: 'zoom' });
add(76.5, 'celebrate', (ctx, lt, T) => {
  const b = beat(T);
  B.brandBg(ctx, T, { pulse: b.pulse });
  B.confetti(ctx, T, 76.5, { burst: true, y0: 1100, n: 120, seed: 3 });
  const j = Math.sin(b.phase * Math.PI);
  act(ctx, l => { const bb = beat(T + l - lt); const jj = Math.sin(bb.phase * Math.PI); return { x: 960, y: 960, s: 1.35, t: T + (l - lt), expr: 'excited', jump: jj * 90, squash: bb.phase < 0.12 ? -0.1 : jj * 0.08, armL: { x: -50, y: -110, bend: 1, hand: 'open' }, armR: { x: 50, y: -110, bend: -1, hand: 'open' }, legL: { x: -40 - jj * 20, y: 0, bend: 1 }, legR: { x: 40 + jj * 20, y: 0, bend: -1 }, fx: { sparkle: 1 } }; }, lt);
});
add(79.1, 'speedometer', (ctx, lt, T) => {
  B.brandBg(ctx, T, { rays: 0.5 }); B.hSpeed(ctx, T, { a: 0.5, dir: 1 });
  const k = K(lt, [[0, 0.05], [0.4, 0.05], [1.1, 1.06, 'out'], [1.4, 0.97], [3.2, 1]]);
  U.speedometer(ctx, 640, 560, 300, k, T, { label: 'TERCEPAT' });
  act(ctx, l => ({ x: 1380, y: 990, s: 1.45, t: T + (l - lt), turn: -0.45, expr: 'fierce', lean: -0.12, swingAdd: 0.8 + Math.sin(l * 20) * 0.1, armR: { x: 40, y: -90, bend: -1, hand: 'thumb' }, armL: { x: -60, y: 40, bend: 1, hand: 'fist' } }), lt);
  labelTop(ctx, 'PROSES TERCEPAT', prog(lt, 0.9, 1.2), { y: 130 });
});
add(82.3, 'garansi', (ctx, lt, T) => {
  B.brandBg(ctx, T, { col: '#4ade80', pulse: beat(T).pulse });
  U.stamp(ctx, 700, 470, 'GARANSI', prog(lt, 0.15, 0.45), { col: '#22c55e', size: 120 });
  ['Hasil pasti', 'Isi ulang jika turun', 'Aman'].forEach((s, i) => U.chip(ctx, 700, 700 + i * 100, s, { icon: 'check', col: '#22c55e', size: 34, alpha: prog(lt, 0.9 + i * 0.35, 1.15 + i * 0.35) }));
  act(ctx, l => ({ x: 1420, y: 1000, s: 1.5, t: T + (l - lt), turn: -0.3, expr: 'wink', armR: { x: 30, y: -60, bend: -1, hand: 'thumb' }, armL: { x: -60, y: -40, bend: 1, hand: 'thumb' }, crouch: Math.sin(beat(T + l - lt).phase * Math.PI) * 8, fx: { sparkle: 0.8 } }), lt);
});
add(85.5, 'grow-tree', (ctx, lt, T) => {
  B.hills(ctx, T, { tod: 0.45 });
  U.plant(ctx, 1200, 900, prog(lt, 0.3, 3.4), T, { s: 1.0 });
  act(ctx, l => ({ x: 720, y: 980, s: 1.25, t: T + (l - lt), turn: 0.5, expr: lt < 2 ? 'happy' : 'joy', armR: { x: 100, y: -30, bend: -1, hand: 'hold' }, armL: { x: -16, y: 96, bend: 1, hand: 'open' },
    hold: { R: (c, x, y) => U.wateringCan(c, x + 50, y - 10, 0.35, l < 2.6 ? 1 : 0, T) }, crouch: Math.sin(l * 3) * 3 }), lt);
});
add(90.0, 'dance-spin', (ctx, lt, T) => {
  const b = beat(T);
  B.brandBg(ctx, T, { pulse: b.pulse });
  U.logo(ctx, W / 2, 180, 90, { glowA: 0.6 });
  act(ctx, l => { const s2 = clamp((l - 0.3) / 1.2); const a = s2 * Math.PI * 2; const bb = beat(T + l - lt); return { x: 960, y: 1000, s: 1.5, t: T + (l - lt), turn: Math.sin(a), flip: Math.cos(a) < 0 ? -1 : 1, expr: 'laugh', armL: { x: -110, y: -40 - bb.pulse * 30, bend: 1, hand: 'open' }, armR: { x: 110, y: -40 - bb.pulse * 30, bend: -1, hand: 'open' }, crouch: Math.sin(bb.phase * Math.PI) * 12, swingAdd: 0.4 }; }, lt);
});

module.exports = S;
