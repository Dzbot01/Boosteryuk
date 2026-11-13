'use strict';
// Expressive rubber-hose cartoon character rig.
// Character space: origin = point between the feet on the ground, y grows downward (up is negative).
const { clamp, lerp, ell, circ, rr, fs, rgba, P, heartPath, starPath, sparkle, text, noise, hash, glow, line } = require('./engine');

const OUT = P.out;
const CAST = {
  main: { skin: '#e4a774', skinD: '#c98a59', hair: '#1d1714', hairH: '#3d3029', style: 'spiky', iris: '#3a2416' },
  sari: { skin: '#f1c49c', skinD: '#d8a477', hair: '#40261a', hairH: '#61402c', style: 'long', iris: '#3a2416' },
  budi: { skin: '#b97a4c', skinD: '#9c6039', hair: '#141212', hairH: '#2e2b2b', style: 'buzz', iris: '#24160e' },
  maya: { skin: '#f3d0aa', skinD: '#dcb186', hair: '#7a3a1e', hairH: '#a35a33', style: 'bun', iris: '#3a2416' },
};
const OUTFIT = {
  hoodie: { top: '#25c4df', topD: '#0f9bb6', pants: '#2a3954', shoe: '#ffffff', sole: '#22d3ee', cuff: '#0f9bb6', badge: true },
  pajama: { top: '#a9cdfd', topD: '#7fb0ee', pants: '#a9cdfd', shoe: 'skin', sole: null, cuff: '#7fb0ee', dots: '#ffffff' },
  pink: { top: '#f472b6', topD: '#d94c95', pants: '#3b3f6b', shoe: '#ffffff', sole: '#f472b6', cuff: '#d94c95' },
  orange: { top: '#fb923c', topD: '#e0701c', pants: '#2f3a52', shoe: '#ffffff', sole: '#fb923c', cuff: '#e0701c' },
  purple: { top: '#a78bfa', topD: '#8366e8', pants: '#2f3550', shoe: '#ffffff', sole: '#a78bfa', cuff: '#8366e8' },
  green: { top: '#34d399', topD: '#15b07a', pants: '#2b3a4f', shoe: '#ffffff', sole: '#34d399', cuff: '#15b07a' },
};

// ---------- expressions ----------
// eye: normal|wide|happy|closed|squeeze|star|heart|wink ; lidTop 0..1 ; lidAng (+angry/-sad) ; lidBot ; browY ; browAng (+sad inner up, -angry)
// mOpen 0..1 ; smile -1..1 ; mW width mult ; blush ; pupil ; eyeS
const BASE = { eye: 'normal', lidTop: 0.08, lidAng: 0, lidBot: 0, browY: 0, browAng: 0, mOpen: 0, smile: 0.25, mW: 1, blush: 0.3, pupil: 1, eyeS: 1 };
const EXPR = {
  neutral: {},
  calm: { lidTop: 0.2, smile: 0.35 },
  happy: { lidTop: 0.04, lidBot: 0.28, browY: -5, mOpen: 0.35, smile: 0.95, mW: 1.2, blush: 0.55 },
  grin: { lidTop: 0.0, lidBot: 0.3, browY: -8, mOpen: 0.55, smile: 1, mW: 1.4, blush: 0.6 },
  laugh: { eye: 'happy', browY: -10, mOpen: 0.85, smile: 1, mW: 1.35, blush: 0.75 },
  joy: { eye: 'happy', browY: -8, mOpen: 0.45, smile: 1, mW: 1.25, blush: 0.7 },
  smug: { lidTop: 0.38, lidBot: 0.12, browY: -2, browAng: -0.15, smile: 0.75, mW: 1.15, blush: 0.4 },
  sad: { lidTop: 0.34, lidAng: -0.45, browY: 2, browAng: 0.55, mOpen: 0.04, smile: -0.8, mW: 0.85, pupil: 1.12, blush: 0.15 },
  cry: { lidTop: 0.42, lidAng: -0.5, browY: 0, browAng: 0.7, mOpen: 0.55, smile: -1, mW: 1.0, pupil: 1.15, blush: 0.45 },
  worried: { lidTop: 0.12, lidAng: -0.25, browY: -3, browAng: 0.45, mOpen: 0.14, smile: -0.4, mW: 0.75, pupil: 0.95 },
  confused: { lidTop: 0.18, browY: -4, browAng: 0.2, mOpen: 0.06, smile: -0.25, mW: 0.7 },
  surprised: { eye: 'wide', lidTop: 0, browY: -15, mOpen: 0.62, smile: 0, mW: 0.55, pupil: 0.8, blush: 0.2 },
  shocked: { eye: 'wide', lidTop: 0, browY: -19, mOpen: 0.95, smile: -0.25, mW: 0.75, pupil: 0.55, blush: 0.1 },
  determined: { lidTop: 0.3, lidAng: 0.35, browY: 4, browAng: -0.45, mOpen: 0, smile: 0.4, mW: 0.95, blush: 0.3 },
  fierce: { lidTop: 0.26, lidAng: 0.4, browY: 4, browAng: -0.5, mOpen: 0.4, smile: 0.7, mW: 1.25, blush: 0.35 },
  sleepy: { lidTop: 0.62, browY: 5, mOpen: 0.08, smile: 0.05, mW: 0.8, blush: 0.25 },
  asleep: { eye: 'closed', browY: 3, mOpen: 0.16, smile: 0.1, mW: 0.6, blush: 0.4 },
  yawn: { eye: 'squeeze', browY: -6, browAng: 0.2, mOpen: 1, smile: 0, mW: 0.95, blush: 0.3 },
  dreamy: { lidTop: 0.26, lidBot: 0.18, browY: -7, browAng: 0.15, mOpen: 0.12, smile: 0.7, blush: 0.65 },
  focused: { lidTop: 0.32, browY: 3, browAng: -0.25, mOpen: 0, smile: 0, mW: 0.65 },
  excited: { eye: 'star', browY: -12, mOpen: 0.8, smile: 1, mW: 1.35, blush: 0.7 },
  love: { eye: 'heart', browY: -8, mOpen: 0.5, smile: 1, mW: 1.2, blush: 0.85 },
  wink: { eye: 'wink', browY: -6, mOpen: 0.42, smile: 0.95, mW: 1.2, blush: 0.6 },
  hopeful: { lidTop: 0.05, browY: -8, browAng: 0.3, mOpen: 0.08, smile: 0.35, mW: 0.8, blush: 0.4, pupil: 1.12 },
  sigh: { lidTop: 0.5, lidAng: -0.3, browY: 2, browAng: 0.4, mOpen: 0.3, smile: -0.3, mW: 0.6 },
  oh: { eye: 'wide', lidTop: 0, browY: -12, mOpen: 0.45, smile: 0.1, mW: 0.5, pupil: 0.9 },
};
const NUMS = ['lidTop', 'lidAng', 'lidBot', 'browY', 'browAng', 'mOpen', 'smile', 'mW', 'blush', 'pupil', 'eyeS'];
function exprVals(expr) {
  if (Array.isArray(expr)) { // [a, b, k]
    const a = exprVals(expr[0]), b = exprVals(expr[1]), k = clamp(expr[2]);
    const r = {}; for (const n of NUMS) r[n] = lerp(a[n], b[n], k); r.eye = k < 0.5 ? a.eye : b.eye; return r;
  }
  if (typeof expr === 'object') return Object.assign({}, BASE, expr);
  return Object.assign({}, BASE, EXPR[expr] || {});
}

// ---------- pose ----------
const DEF = {
  x: 960, y: 900, s: 1, flip: 1, turn: 0, lean: 0, crouch: 0, jump: 0, squash: 0, headTilt: 0, headDX: 0, headDY: 0,
  armL: { x: -16, y: 100, bend: 1, hand: 'open' }, armR: { x: 16, y: 100, bend: -1, hand: 'open' },
  legL: { x: -30, y: 0, bend: 1 }, legR: { x: 30, y: 0, bend: -1 },
  expr: 'neutral', face: null, look: [0, 0], outfit: 'hoodie', cast: 'main', acc: {}, fx: {}, hold: {}, t: 0,
  blink: true, talk: 0, shadow: 1, hideLegs: false, armsBehind: false,
};
function resolve(p) {
  const r = Object.assign({}, DEF, p);
  r.armL = Object.assign({}, DEF.armL, p.armL); r.armR = Object.assign({}, DEF.armR, p.armR);
  r.legL = Object.assign({}, DEF.legL, p.legL); r.legR = Object.assign({}, DEF.legR, p.legR);
  r.acc = p.acc || {}; r.fx = p.fx || {}; r.hold = p.hold || {};
  r.E = exprVals(r.expr);
  if (r.face) Object.assign(r.E, r.face);
  if (r.talk) { // mouth flaps
    const f = 0.5 + 0.5 * Math.sin(r.t * 17) * Math.sin(r.t * 7.3 + 1);
    r.E.mOpen = clamp(r.E.mOpen * 0.4 + r.talk * (0.15 + 0.75 * f));
    if (r.E.mW < 0.8) r.E.mW = 0.85;
  }
  return r;
}
function rot(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return { x: x * c - y * s, y: x * s + y * c }; }
// ---------- anatomical IK ----------
// Two-bone IK in 3D (x right, y down, z toward camera) projected orthographically.
// Segment lengths are fixed (no rubber stretching); the bend plane is chosen by a pole vector,
// so elbows always flex the anatomical way (down/out/back) and knees bend forward/outward.
const L_UP = 62, L_FORE = 58, L_THIGH = 59, L_SHIN = 57;
function rotY(v, a) { const c = Math.cos(a), s = Math.sin(a); return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c }; }
function ik3(S, T, L1, L2, pole) {
  let dx = T.x - S.x, dy = T.y - S.y, dz = T.z - S.z; let d = Math.hypot(dx, dy, dz) || 1e-6;
  const maxR = (L1 + L2) * 0.995, minR = Math.abs(L1 - L2) + 6;
  const k = d > maxR ? maxR / d : d < minR ? minR / d : 1;
  dx *= k; dy *= k; dz *= k; d *= k;
  const H = { x: S.x + dx, y: S.y + dy, z: S.z + dz };
  const u = { x: dx / d, y: dy / d, z: dz / d };
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pd = pole.x * u.x + pole.y * u.y + pole.z * u.z;
  let v = { x: pole.x - pd * u.x, y: pole.y - pd * u.y, z: pole.z - pd * u.z }; let vl = Math.hypot(v.x, v.y, v.z);
  if (vl < 1e-4) { v = { x: 0, y: 0, z: -1 }; vl = 1; }
  v = { x: v.x / vl, y: v.y / vl, z: v.z / vl };
  const Ej = { x: S.x + u.x * a + v.x * h, y: S.y + u.y * a + v.y * h, z: S.z + u.z * a + v.z * h };
  return { E: Ej, H, reach: d / (L1 + L2), flex: Math.PI - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)))) };
}
// How far in front of the body a hand naturally sits (hands near the body's midline and between hips and head come forward).
function autoZ(hx, hy) {
  const inX = clamp(1 - (Math.abs(hx) - 34) / 40), inY = clamp((hy + 345) / 50) * clamp((-78 - hy) / 40);
  return 62 * inX * inY;
}
function mouthPos(p, head) { // mouth in character space
  const th = p.turn * 0.8; const m = rot(84 * Math.sin(th) * 0.95, 52, p.lean + p.headTilt);
  return { x: head.x + m.x, y: head.y + m.y };
}
function geo(p) {
  const sx = 1 - p.squash * 0.5, sy = 1 + p.squash;
  const hip = { x: 0, y: -110 + p.crouch };
  const T = (lx, ly) => { const v = rot(lx * sx, ly * sy, p.lean); return { x: hip.x + v.x, y: hip.y + v.y }; };
  const shL = T(-50, -84), shR = T(50, -84);
  const hpL = T(-24, -8), hpR = T(24, -8);
  const neck = T(0, -98);
  const hd = rot(p.headDX, -74 + p.headDY, p.lean + p.headTilt);
  const head = { x: neck.x + hd.x, y: neck.y + hd.y };
  const mouth = mouthPos(p, head);
  const th = p.turn * 0.8;
  const arms = {};
  for (const [k, side, sh, arm] of [['L', -1, shL, p.armL], ['R', 1, shR, p.armR]]) {
    let t2, z;
    if (p.mic === k) { // hand below/beside the mouth, mic aimed between lower lip and chin
      t2 = { x: mouth.x + side * 30, y: mouth.y + 66 }; z = 46;
    } else {
      const a = rot(arm.x, arm.y, p.lean * 0.6); t2 = { x: sh.x + a.x, y: sh.y + a.y };
      z = arm.z !== undefined ? arm.z : autoZ(t2.x, t2.y);
    }
    const pole = rotY({ x: side * 0.5, y: 1, z: -0.6 }, th);
    if (arm.elbowOut) { pole.x += side * arm.elbowOut; pole.y -= arm.elbowOut * 0.5; }
    const r = ik3({ x: sh.x, y: sh.y, z: 0 }, { x: t2.x, y: t2.y, z }, L_UP, L_FORE, pole);
    arms[k] = { S: sh, E: r.E, H: r.H, flex: r.flex };
  }
  const legs = {};
  for (const [k, side, hp, leg] of [['L', -1, hpL, p.legL], ['R', 1, hpR, p.legR]]) {
    const pole = rotY({ x: side * 0.35, y: 0, z: 1 }, th);
    const r = ik3({ x: hp.x, y: hp.y, z: 0 }, { x: leg.x, y: leg.y, z: leg.z || 0 }, L_THIGH, L_SHIN, pole);
    legs[k] = { S: hp, E: r.E, H: r.H };
  }
  return { sx, sy, hip, T, shL, shR, hL: arms.L.H, hR: arms.R.H, hpL, hpR, neck, head, mouth, arms, legs };
}

// ---------- limbs ----------
function jointPath(ctx, A, B, C) {
  const ab = Math.hypot(B.x - A.x, B.y - A.y) || 1, bc = Math.hypot(C.x - B.x, C.y - B.y) || 1;
  const r = Math.min(14, ab * 0.35, bc * 0.35);
  const p1 = { x: B.x + (A.x - B.x) * r / ab, y: B.y + (A.y - B.y) * r / ab }, p2 = { x: B.x + (C.x - B.x) * r / bc, y: B.y + (C.y - B.y) * r / bc };
  ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(p1.x, p1.y); ctx.quadraticCurveTo(B.x, B.y, p2.x, p2.y); ctx.lineTo(C.x, C.y);
}
function joint(ctx, A, B, C, w, col, cuff) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  jointPath(ctx, A, B, C); ctx.strokeStyle = OUT; ctx.lineWidth = w + 10; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  if (cuff) { const p1 = { x: lerp(B.x, C.x, 0.74), y: lerp(B.y, C.y, 0.74) }, p2 = { x: lerp(B.x, C.x, 0.88), y: lerp(B.y, C.y, 0.88) }; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = cuff; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.stroke(); ctx.lineCap = 'round'; }
  return Math.atan2(C.y - B.y, C.x - B.x);
}
// Handheld mic held mid-handle, grille 2-8 cm from the mouth, aimed between lower lip and chin.
function drawMic(ctx, H, mouth, side) {
  const target = { x: mouth.x + side * 8, y: mouth.y + 16 };
  let dx = target.x - H.x, dy = target.y - H.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const ball = { x: H.x + dx * Math.max(36, d - 4), y: H.y + dy * Math.max(36, d - 4) };
  const tail = { x: H.x - dx * 30, y: H.y - dy * 30 };
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(ball.x - dx * 14, ball.y - dy * 14); ctx.strokeStyle = OUT; ctx.lineWidth = 22; ctx.stroke(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 13; ctx.stroke();
  ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(Math.atan2(dy, dx));
  ell(ctx, 0, 0, 17, 19); fs(ctx, '#cbd5e1', OUT, 4.5);
  for (const gx of [-8, 0, 8]) line(ctx, gx, -15, gx, 15, '#64748b', 2);
  rr(ctx, -22, -11, 8, 22, 3); fs(ctx, '#94a3b8', OUT, 3);
  ctx.restore();
}
function qpt(a, c, b, t) { const u = 1 - t; return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }; }
function limb(ctx, a, b, len, bend, w, col, cuff) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  const sag = d < len ? Math.sqrt(len * len - d * d) * 0.62 : 0;
  const nx = -dy / d, ny = dx / d;
  const c = { x: (a.x + b.x) / 2 + nx * sag * bend, y: (a.y + b.y) / 2 + ny * sag * bend };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
  ctx.strokeStyle = OUT; ctx.lineWidth = w + 10; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  if (cuff) {
    const p1 = qpt(a, c, b, 0.8), p2 = qpt(a, c, b, 0.9);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = cuff; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.stroke(); ctx.lineCap = 'round';
  }
  const pe = qpt(a, c, b, 0.92);
  return { c, ang: Math.atan2(b.y - pe.y, b.x - pe.x) };
}

function hand(ctx, x, y, ang, type, cast, side) {
  const sk = cast.skin;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const L = [];
  const up = -Math.PI / 2 - ang; // screen-up in local coords
  const ux = Math.cos(up), uy = Math.sin(up);
  switch (type) {
    case 'fist': case 'hold':
      L.push({ c: 1, x: 4, y: 0, r: 15 }); break;
    case 'point':
      L.push({ c: 1, x: 2, y: 0, r: 14 }, { l: 1, x1: 8, y1: -4, x2: 30, y2: -6, w: 9 }); break;
    case 'thumb':
      L.push({ c: 1, x: 2, y: 0, r: 15 }, { l: 1, x1: 2 + ux * 6, y1: uy * 6, x2: 2 + ux * 26, y2: uy * 26, w: 10 }); break;
    case 'peace':
      L.push({ c: 1, x: 2, y: 0, r: 14 }, { l: 1, x1: 8, y1: -4, x2: 30, y2: -12, w: 8 }, { l: 1, x1: 8, y1: 2, x2: 30, y2: 8, w: 8 }); break;
    case 'ok':
      L.push({ c: 1, x: 2, y: 0, r: 14 }, { l: 1, x1: 8, y1: 6, x2: 26, y2: 12, w: 7 }, { l: 1, x1: 8, y1: 0, x2: 28, y2: 2, w: 7 }, { l: 1, x1: 8, y1: -6, x2: 26, y2: -10, w: 7 }); break;
    default: { // open
      L.push({ c: 1, x: 4, y: 0, r: 15 });
      for (const a of [-0.55, -0.18, 0.18, 0.55]) L.push({ l: 1, x1: 10, y1: a * 10, x2: 10 + Math.cos(a) * 15, y2: a * 10 + Math.sin(a) * 15, w: 8 });
      const th = side < 0 ? -1.35 : 1.35; L.push({ l: 1, x1: 2, y1: 0, x2: 2 + Math.cos(th) * 18, y2: Math.sin(th) * 18, w: 9 });
    }
  }
  const lw = 4;
  for (const pass of [0, 1]) for (const s of L) {
    if (s.c) { circ(ctx, s.x, s.y, s.r); if (!pass) { ctx.strokeStyle = OUT; ctx.lineWidth = lw * 2; ctx.stroke(); } else { ctx.fillStyle = sk; ctx.fill(); } }
    else { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.lineCap = 'round'; ctx.strokeStyle = pass ? sk : OUT; ctx.lineWidth = pass ? s.w : s.w + lw * 2; ctx.stroke(); }
  }
  if (type === 'fist' || type === 'hold') { ctx.beginPath(); ctx.arc(8, 0, 8, -1.2, 1.2); ctx.strokeStyle = rgba(cast.skinD, 0.9); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}

function shoe(ctx, ft, side, p, o, cast) {
  const dir = Math.abs(p.turn) > 0.25 ? Math.sign(p.turn) : side * 0.5;
  const x = ft.x + dir * 9, y = ft.y - 7;
  if (o.shoe === 'skin') { ell(ctx, x, y + 2, 20, 12); fs(ctx, cast.skin, OUT, 5); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(clamp((ft.lift || 0) * -0.01 * dir, -0.5, 0.5));
  ctx.beginPath(); ctx.moveTo(-22, 8); ctx.quadraticCurveTo(-24, -12, -4, -13); ctx.quadraticCurveTo(26 * Math.sign(dir || 1) * 0 + 24, -8, 26, 6); ctx.quadraticCurveTo(26, 10, 20, 10); ctx.lineTo(-18, 10); ctx.closePath();
  fs(ctx, o.shoe, OUT, 5);
  if (o.sole) { rr(ctx, -21, 4, 46, 7, 3); fs(ctx, o.sole); }
  ctx.restore();
}

// ---------- torso ----------
function bodyPath(ctx) {
  ctx.beginPath(); ctx.moveTo(-46, 8); ctx.quadraticCurveTo(-53, -40, -55, -76);
  ctx.quadraticCurveTo(-55, -101, -30, -103); ctx.lineTo(30, -103); ctx.quadraticCurveTo(55, -101, 55, -76);
  ctx.quadraticCurveTo(53, -40, 46, 8); ctx.quadraticCurveTo(0, 15, -46, 8); ctx.closePath();
}
function torso(ctx, p, o, cast, swing) {
  // hood / collar behind the head
  if (p.outfit !== 'pajama') { ell(ctx, 0, -100, 47, 17); fs(ctx, o.topD, OUT, 5); }
  rr(ctx, -13, -118, 26, 26, 9); fs(ctx, cast.skinD, OUT, 4);
  bodyPath(ctx); fs(ctx, o.top, OUT, 5);
  ctx.save(); bodyPath(ctx); ctx.clip();
  ctx.globalAlpha = 0.5; ell(ctx, 66, -40, 34, 90); ctx.fillStyle = o.topD; ctx.fill(); ctx.globalAlpha = 1;
  if (o.dots) {
    ctx.fillStyle = o.dots;
    for (let yy = -100; yy < 20; yy += 22) for (let xx = -60; xx < 60; xx += 22) { circ(ctx, xx + ((yy / 22) % 2 ? 11 : 0), yy, 3.5); ctx.fill(); }
  } else { ctx.fillStyle = o.topD; ctx.fillRect(-60, -4, 120, 20); }
  ctx.restore();
  bodyPath(ctx); fs(ctx, null, OUT, 5);
  if (p.outfit === 'pajama') {
    ctx.beginPath(); ctx.moveTo(-24, -102); ctx.lineTo(0, -74); ctx.lineTo(24, -102); fs(ctx, null, OUT, 4);
    for (const by of [-60, -38, -16]) { circ(ctx, 0, by, 4); fs(ctx, '#fff', OUT, 2); }
  } else {
    // kangaroo pocket
    ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-24, -36); ctx.lineTo(24, -36); ctx.lineTo(30, -6); fs(ctx, null, rgba(OUT, 0.55), 3.5);
    // drawstrings swing
    for (const sx of [-12, 12]) {
      const ex = sx + swing * 10, ey = -66;
      ctx.beginPath(); ctx.moveTo(sx, -100); ctx.quadraticCurveTo(sx + swing * 4, -82, ex, ey); fs(ctx, null, '#ffffff', 3.5);
      circ(ctx, ex, ey + 2, 3.2); fs(ctx, '#fff', OUT, 1.5);
    }
    if (o.badge) { // tiny brand bolt on chest
      ctx.save(); ctx.translate(-30, -68); circ(ctx, 0, 0, 10); fs(ctx, '#fff', OUT, 2.5);
      ctx.beginPath(); ctx.moveTo(1.5, -7); ctx.lineTo(-4.5, 1); ctx.lineTo(-0.5, 1); ctx.lineTo(-1.5, 7); ctx.lineTo(4.5, -1); ctx.lineTo(0.5, -1); ctx.closePath(); fs(ctx, P.cyan6); ctx.restore();
    }
  }
  if (p.acc.apron) {
    ctx.beginPath(); ctx.moveTo(-34, -78); ctx.lineTo(34, -78); ctx.lineTo(38, 10); ctx.quadraticCurveTo(0, 16, -38, 10); ctx.closePath(); fs(ctx, '#b45309', OUT, 4);
    rr(ctx, -18, -40, 36, 22, 5); fs(ctx, '#92400e', OUT, 3);
    line(ctx, -34, -78, -46, -100, '#b45309', 5); line(ctx, 34, -78, 46, -100, '#b45309', 5);
  }
}

// ---------- head ----------
function hairBack(ctx, cast, th, swing) {
  const shift = -Math.sin(th) * 10;
  ctx.fillStyle = cast.hair;
  if (cast.style === 'long') {
    ctx.beginPath(); ctx.moveTo(-96 + shift, -10); ctx.quadraticCurveTo(-112 + shift + swing * 8, 110, -70 + shift + swing * 14, 130);
    ctx.lineTo(70 + shift + swing * 14, 130); ctx.quadraticCurveTo(112 + shift + swing * 8, 110, 96 + shift, -10); ctx.closePath(); fs(ctx, cast.hair, OUT, 5);
  }
  if (cast.style === 'bun') { circ(ctx, shift * 1.5 + swing * 4, -112, 34); fs(ctx, cast.hair, OUT, 5); }
  ell(ctx, shift, -12, 93, 88); fs(ctx, cast.hair, OUT, 5);
}
function hairFront(ctx, cast, th, swing) {
  const R = 93; const sx = phi => R * Math.sin(clamp(phi + th, -1.5707, 1.5707));
  const cx = -Math.sin(th) * 4;
  const list = [];
  const style = cast.style;
  let fr;
  if (style === 'spiky') fr = [[1.5, 4], [1.15, -36], [0.95, -16], [0.66, -50], [0.46, -26], [0.16, -54], [-0.08, -28], [-0.36, -52], [-0.6, -26], [-0.86, -46], [-1.12, -12], [-1.5, 4]];
  else if (style === 'long') fr = [[1.5, 30], [1.2, -10], [0.8, -30], [0.4, -36], [0.0, -30], [-0.3, -20], [-0.5, -40], [-0.9, -34], [-1.2, -8], [-1.5, 30]];
  else if (style === 'bun') fr = [[1.5, 6], [1.1, -30], [0.7, -44], [0.2, -50], [-0.2, -44], [-0.6, -48], [-1.0, -32], [-1.5, 6]];
  else fr = [[1.5, -6], [1.0, -52], [0.3, -60], [-0.3, -60], [-1.0, -52], [-1.5, -6]];
  const domePath = (c) => {
    c.beginPath(); c.moveTo(cx - 96, -6); c.ellipse(cx, -6, 96, style === 'buzz' ? 86 : 93, 0, Math.PI, Math.PI * 2, false);
    let prev = { x: sx(fr[0][0]), y: fr[0][1] }; c.lineTo(prev.x, prev.y);
    for (let i = 1; i < fr.length - 1; i++) { const v = { x: sx(fr[i][0]), y: fr[i][1] }, n = { x: sx(fr[i + 1][0]), y: fr[i + 1][1] }; c.quadraticCurveTo(v.x, v.y, (v.x + n.x) / 2, (v.y + n.y) / 2); }
    c.lineTo(sx(fr[fr.length - 1][0]), fr[fr.length - 1][1]); c.closePath();
  };
  list.push({ p: domePath });
  if (style === 'spiky') {
    for (const [a, len] of [[200, 30], [228, 36], [258, 40], [290, 36], [320, 30]]) {
      const ar = (a * Math.PI) / 180, bx = cx + Math.cos(ar) * 90, by = -6 + Math.sin(ar) * 88;
      const tipA = ar + swing * 0.35 + 0.15;
      list.push({ p: c => { c.beginPath(); c.moveTo(cx + Math.cos(ar - 0.2) * 88, -6 + Math.sin(ar - 0.2) * 86); c.quadraticCurveTo(bx + Math.cos(tipA) * len * 0.6, by + Math.sin(tipA) * len * 0.6, bx + Math.cos(tipA + 0.25) * len, by + Math.sin(tipA + 0.25) * len); c.quadraticCurveTo(bx, by, cx + Math.cos(ar + 0.22) * 88, -6 + Math.sin(ar + 0.22) * 86); c.closePath(); } });
    }
  }
  for (const pass of [0, 1]) for (const s of list) { s.p(ctx); if (!pass) { ctx.strokeStyle = OUT; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.stroke(); } else { ctx.fillStyle = cast.hair; ctx.fill(); } }
  // sheen
  ctx.beginPath(); ctx.ellipse(cx - 20, -62, 46, 18, -0.2, Math.PI * 1.1, Math.PI * 1.75); ctx.strokeStyle = cast.hairH; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
  if (style === 'spiky') { // ahoge with spring
    const tx = cx + 18 + swing * 26, ty = -138 + Math.abs(swing) * 6;
    ctx.beginPath(); ctx.moveTo(cx + 2, -96); ctx.quadraticCurveTo(cx + 2 + swing * 10, -128, tx, ty);
    ctx.strokeStyle = OUT; ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = cast.hair; ctx.lineWidth = 6; ctx.stroke();
  }
}

function eye(ctx, x, y, side, f, E, look, blinkK, cast, t) {
  const rx = 17 * E.eyeS * (0.4 + 0.6 * f), ry = 21 * E.eyeS;
  let mode = E.eye;
  if (mode === 'wink') mode = side > 0 ? 'happy' : 'normal';
  if ((mode === 'normal' || mode === 'wide') && blinkK > 0.8) mode = 'closed'; // full blink reads as a closed lid line
  ctx.save(); ctx.translate(x, y);
  if (mode === 'happy') {
    ctx.beginPath(); ctx.moveTo(-rx, 6); ctx.quadraticCurveTo(0, -ry * 1.25, rx, 6); fs(ctx, null, OUT, 6.5);
  } else if (mode === 'closed') {
    ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, 14, rx, 0); fs(ctx, null, OUT, 6);
    line(ctx, -rx * side * -1 * 0.9, 2, -rx * side * -1 * 1.25, -4, OUT, 4);
  } else if (mode === 'squeeze') {
    const d = side < 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(-rx * d * 0.8, -12); ctx.lineTo(rx * d * 0.8, 0); ctx.lineTo(-rx * d * 0.8, 12); fs(ctx, null, OUT, 6.5);
  } else if (mode === 'star') {
    starPath(ctx, 0, 0, 24, Math.sin(t * 6) * 0.25); fs(ctx, P.yellow, OUT, 4.5); sparkle(ctx, 6, -8, 6, '#fff');
  } else if (mode === 'heart') {
    const s = 34 * (1 + 0.12 * Math.sin(t * 14)); heartPath(ctx, 0, 2, s); fs(ctx, '#ff4d6d', OUT, 4); circ(ctx, -6, -6, 4); fs(ctx, '#fff');
  } else { // normal / wide
    const wide = mode === 'wide';
    const erx = rx * (wide ? 1.12 : 1), ery = ry * (wide ? 1.12 : 1);
    ell(ctx, 0, 0, erx, ery); fs(ctx, '#ffffff');
    ctx.save(); ell(ctx, 0, 0, erx, ery); ctx.clip();
    const pr = 11.5 * E.pupil * (wide ? 0.7 : 1);
    const px = clamp(look[0], -1, 1) * erx * 0.42, py = clamp(look[1], -1, 1) * ery * 0.4;
    circ(ctx, px, py + 1, pr); fs(ctx, cast.iris); circ(ctx, px, py + 1, pr * 0.55); fs(ctx, '#0b0705');
    circ(ctx, px - pr * 0.38, py - pr * 0.4, pr * 0.36); fs(ctx, '#fff'); circ(ctx, px + pr * 0.35, py + pr * 0.42, pr * 0.16); fs(ctx, '#fff');
    // lids
    const lt = Math.max(wide ? 0 : E.lidTop, blinkK);
    if (lt > 0.01) {
      const yE = -ery + 2 * ery * lt; const slope = E.lidAng * 0.55 * -side;
      ctx.beginPath(); ctx.moveTo(-erx - 4, yE - slope * (erx + 4)); ctx.lineTo(erx + 4, yE + slope * (erx + 4)); ctx.lineTo(erx + 4, -ery - 4); ctx.lineTo(-erx - 4, -ery - 4); ctx.closePath(); fs(ctx, cast.skin);
      ctx.beginPath(); ctx.moveTo(-erx - 4, yE - slope * (erx + 4)); ctx.lineTo(erx + 4, yE + slope * (erx + 4)); fs(ctx, null, OUT, 4.5);
    }
    if (E.lidBot > 0.01 && blinkK < 0.9) {
      const yb = ery - 2 * ery * E.lidBot * 0.7;
      ctx.beginPath(); ctx.moveTo(-erx - 4, ery + 4); ctx.lineTo(-erx - 4, yb + 6); ctx.quadraticCurveTo(0, yb - 8, erx + 4, yb + 6); ctx.lineTo(erx + 4, ery + 4); ctx.closePath(); fs(ctx, cast.skin);
      ctx.beginPath(); ctx.moveTo(-erx, yb + 5); ctx.quadraticCurveTo(0, yb - 7, erx, yb + 5); fs(ctx, null, rgba(OUT, 0.7), 3);
    }
    ctx.restore();
    ell(ctx, 0, 0, erx, ery); fs(ctx, null, OUT, 4.5);
    // lash flick
    if (lt < 0.9) line(ctx, side * erx * 0.85, -ery * 0.55 + lt * ery, side * (erx + 7), -ery * 0.8 + lt * ery, OUT, 4);
  }
  ctx.restore();
}

function mouth(ctx, x, y, f, E) {
  const w = 21 * E.mW * (0.5 + 0.5 * f); const open = E.mOpen, sm = E.smile;
  const cy = -sm * 8;
  ctx.save(); ctx.translate(x, y);
  if (open < 0.06) {
    ctx.beginPath(); ctx.moveTo(-w, cy); ctx.quadraticCurveTo(0, 2 * (sm * 6) - cy, w, cy); fs(ctx, null, OUT, 5.5);
    if (sm > 0.5) { line(ctx, -w - 2, cy - 4, -w + 1, cy + 2, OUT, 3); line(ctx, w + 2, cy - 4, w - 1, cy + 2, OUT, 3); }
  } else {
    const mTop = -open * (3 + 10 * Math.max(0, -sm));
    const mBot = 6 * open + open * (22 + 18 * sm);
    const path = () => { ctx.beginPath(); ctx.moveTo(-w, cy); ctx.quadraticCurveTo(0, 2 * mTop - cy, w, cy); ctx.quadraticCurveTo(0, 2 * mBot - cy, -w, cy); ctx.closePath(); };
    path(); fs(ctx, '#5a1222');
    ctx.save(); path(); ctx.clip();
    if (open > 0.6 || sm < 0.1) { ell(ctx, 0, mBot + 2, w * 0.7, 9 + open * 9); fs(ctx, '#f0758d'); }
    if (sm > -0.2 && open > 0.2) { ctx.fillStyle = '#fff'; ctx.fillRect(-w - 4, mTop - 30, w * 2 + 8, 30 + 7 + open * 2); }
    ctx.restore();
    path(); fs(ctx, null, OUT, 5);
  }
  ctx.restore();
}

function blinkAmt(t) {
  const per = 3.3, k = Math.floor(t / per), off = hash(k) * 1.8; const lt = t - k * per - off;
  if (lt < 0 || lt > 0.16) return 0; return Math.sin((lt / 0.16) * Math.PI);
}

function drawHead(ctx, p, cast, swing) {
  const E = p.E; const th = p.turn * 0.8; const t = p.t;
  const fx = phi => 84 * Math.sin(phi + th), fz = phi => Math.cos(phi + th);
  hairBack(ctx, cast, th, swing);
  const earBehind = [], earFront = [];
  for (const side of [-1, 1]) { const z = fz(side * 1.57); (z > 0.22 ? earFront : earBehind).push(side); }
  const drawEar = side => { const ex = 86 * Math.sin(side * 1.57 + th); ell(ctx, ex, 14, 13, 18); fs(ctx, cast.skin, OUT, 4.5); ell(ctx, ex, 15, 6, 9); fs(ctx, cast.skinD); };
  earBehind.forEach(drawEar);
  ell(ctx, 0, 4, 86, 81); fs(ctx, cast.skin, OUT, 5);
  ctx.save(); ell(ctx, 0, 4, 86, 81); ctx.clip(); ctx.globalAlpha = 0.35;
  ell(ctx, -Math.sign(th || 1) * 92, 20, 30, 90); fs(ctx, cast.skinD); ctx.globalAlpha = 1; ctx.restore();
  earFront.forEach(drawEar);
  // blush
  if (E.blush > 0.02) for (const side of [-1, 1]) { const phi = side * 0.78, z = fz(phi); if (z > 0.1) { ell(ctx, fx(phi), 40, 15 * z, 9); fs(ctx, rgba('#ff6b8b', 0.5 * E.blush)); } }
  // eyes
  const bk = p.blink && (E.eye === 'normal') ? blinkAmt(t + (p.blinkOff || 0)) : 0;
  for (const side of [-1, 1]) { const phi = side * 0.42, z = fz(phi); if (z > 0.05) eye(ctx, fx(phi), 10, side, z, E, p.look, bk, cast, t); }
  // nose
  { const nx = fx(0) * 1.02, z = fz(0); ctx.beginPath(); ctx.moveTo(nx - 4 * z, 30); ctx.quadraticCurveTo(nx + 3 * Math.sign(th || 0.0001) + 0, 36, nx + 4 * z, 30); fs(ctx, null, rgba(cast.skinD, 1), 4); }
  mouth(ctx, fx(0) * 0.95, 52, fz(0), E);
  hairFront(ctx, cast, th, swing);
  // brows (over hair)
  for (const side of [-1, 1]) {
    const phi = side * 0.42, z = fz(phi); if (z < 0.08) continue;
    const bx = fx(phi), by = -21 + E.browY; const L = 15 * (0.45 + 0.55 * z);
    const inner = by - E.browAng * 13, outer = by + E.browAng * 13 * 0.6 + 2;
    ctx.beginPath(); ctx.moveTo(bx + side * L, outer); ctx.quadraticCurveTo(bx, by - 5, bx - side * L, inner);
    ctx.strokeStyle = cast.skin; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = cast.hair; ctx.lineWidth = 4; ctx.stroke();
  }
  // accessories on head
  const acc = p.acc;
  if (acc.glasses) for (const side of [-1, 1]) { const phi = side * 0.42, z = fz(phi); if (z > 0.1) { ell(ctx, fx(phi), 10, 27 * z, 25); fs(ctx, rgba('#ffffff', 0.18), OUT, 4.5); } }
  if (acc.cap) {
    const cx = -Math.sin(th) * 4; const back = -Math.sign(th || 0.3);
    ctx.beginPath(); ctx.ellipse(cx, -40, 98, 70, 0, Math.PI, Math.PI * 2); ctx.closePath(); fs(ctx, acc.cap === true ? P.cyan5 : acc.cap, OUT, 5);
    ctx.beginPath(); ctx.moveTo(cx + back * 70, -44); ctx.quadraticCurveTo(cx + back * 128, -40, cx + back * 126, -24); ctx.lineTo(cx + back * 72, -32); ctx.closePath(); fs(ctx, '#0e7490', OUT, 5);
    line(ctx, cx - 90, -42, cx + 90, -42, OUT, 4); circ(ctx, cx, -110, 7); fs(ctx, '#0e7490', OUT, 3);
  }
  if (acc.headset) {
    ctx.beginPath(); ctx.ellipse(0, -10, 100, 104, 0, Math.PI * 1.05, Math.PI * 1.95); fs(ctx, null, OUT, 14); ctx.beginPath(); ctx.ellipse(0, -10, 100, 104, 0, Math.PI * 1.05, Math.PI * 1.95); fs(ctx, null, '#334155', 8);
    for (const side of [-1, 1]) { const ex = 92 * Math.sin(side * 1.4 + th); if (fz(side * 1.4) > -0.4) { rr(ctx, ex - 14, -10, 28, 40, 10); fs(ctx, '#1e293b', OUT, 4); rr(ctx, ex - 6, -2, 12, 24, 5); fs(ctx, P.cyan); } }
    const ex = 92 * Math.sin(-1.4 + th); ctx.beginPath(); ctx.moveTo(ex, 20); ctx.quadraticCurveTo(ex + 10, 60, fx(0) - 26, 58); fs(ctx, null, OUT, 6); circ(ctx, fx(0) - 26, 58, 7); fs(ctx, '#1e293b', OUT, 3);
  }
  if (acc.crown) {
    ctx.beginPath(); const cy = -112; ctx.moveTo(-46, cy + 26); ctx.lineTo(-52, cy - 14); ctx.lineTo(-26, cy + 4); ctx.lineTo(0, cy - 26); ctx.lineTo(26, cy + 4); ctx.lineTo(52, cy - 14); ctx.lineTo(46, cy + 26); ctx.closePath(); fs(ctx, P.gold, OUT, 5);
    for (const gx of [-26, 0, 26]) { circ(ctx, gx, cy + 14, 5); fs(ctx, gx ? P.cyan : P.red, OUT, 2); }
  }
  // face fx
  const fx2 = p.fx;
  if (fx2.tears) {
    const a = fx2.tears;
    for (const side of [-1, 1]) {
      const phi = side * 0.42, z = fz(phi); if (z < 0.1) continue; const ex = fx(phi);
      ctx.beginPath(); ctx.moveTo(ex - 6, 28); ctx.quadraticCurveTo(ex + side * 4 + Math.sin(t * 9) * 3, 60, ex + side * 2, 92); ctx.lineTo(ex + side * 2 + 12, 92); ctx.quadraticCurveTo(ex + side * 8 + 8, 60, ex + 8, 28); ctx.closePath();
      fs(ctx, rgba('#7dd3fc', 0.85 * a), rgba('#38bdf8', a), 3);
      for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + k / 3 + (side > 0 ? 0.5 : 0)) % 1; ell(ctx, ex + side * 8 + side * ph * 30, 96 + ph * 70, 5, 7); fs(ctx, rgba('#7dd3fc', a * (1 - ph))); }
    }
  }
  if (fx2.sweat) { const ph = (t * 0.8) % 1; ctx.save(); ctx.translate(fx(1.0) + 14, -36 + ph * 26); ctx.globalAlpha = fx2.sweat * (1 - ph * 0.6); ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(12, 4, 0, 10); ctx.quadraticCurveTo(-12, 4, 0, -16); fs(ctx, '#bae6fd', '#38bdf8', 3.5); ctx.restore(); }
}

function drawHeadAt(ctx, x, y, s, a, pose) {
  const p = resolve(pose); const cast = CAST[p.cast] || CAST.main;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); drawHead(ctx, p, cast, pose.swing || 0); ctx.restore();
}

// ---------- full body ----------
function drawChar(ctx, pose, prevPose) {
  const p = resolve(pose); const cast = CAST[p.cast] || CAST.main; const o = OUTFIT[p.outfit] || OUTFIT.hoodie;
  const g = geo(p);
  let swing = 0;
  if (prevPose) {
    const pp = resolve(prevPose); const g2 = geo(pp);
    const vx = (g.head.x - g2.head.x) + (p.jump - pp.jump) * 0 + (p.x - pp.x) / p.s, vy = (g.head.y - g2.head.y) - (p.jump - pp.jump) + (p.y - pp.y) / p.s;
    swing = clamp(-vx * 0.05 + vy * 0.025 * Math.sign(vx || 1), -0.9, 0.9);
  }
  swing += Math.sin(p.t * 2.1) * 0.06 + (pose.swingAdd || 0);
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s * p.flip, p.s);
  if (p.shadow) { ell(ctx, 0, 2, 78 * (1 - clamp(p.jump / 400) * 0.5), 14); fs(ctx, rgba('#0b1222', 0.22 * p.shadow * (1 - clamp(p.jump / 500) * 0.6))); }
  ctx.translate(0, -p.jump);
  const bodyRot = p.bodyRot || 0;
  if (bodyRot) { ctx.translate(0, -150); ctx.rotate(bodyRot); ctx.translate(0, 150); }
  // legs
  if (!p.hideLegs) {
    for (const [side, leg, k] of [[-1, p.legL, 'L'], [1, p.legR, 'R']]) {
      const L = g.legs[k]; joint(ctx, L.S, L.E, L.H, 30, o.pants);
      shoe(ctx, Object.assign({}, L.H, { lift: leg.lift }), side, p, o, cast);
    }
  }
  const armList = [[-1, p.armL, g.shL, 'L'], [1, p.armR, g.shR, 'R']];
  const drawArm = ([side, arm, sh, k]) => {
    const A = g.arms[k], hp = A.H;
    const ang = joint(ctx, A.S, A.E, A.H, 25, o.top, o.cuff);
    const prop = p.hold[k];
    if (prop) prop(ctx, hp.x, hp.y, ang, p);
    if (p.mic === k) drawMic(ctx, hp, g.mouth, side);
    hand(ctx, hp.x, hp.y, arm.handRot !== undefined ? arm.handRot : ang, p.mic === k ? 'fist' : arm.hand, cast, side * p.flip);
    if (p.hold[k + 'front']) p.hold[k + 'front'](ctx, hp.x, hp.y, ang, p);
  };
  // arms flagged as behind
  armList.filter(a => a[1].behind).forEach(drawArm);
  ctx.save(); ctx.translate(g.hip.x, g.hip.y); ctx.rotate(p.lean); ctx.scale(g.sx, g.sy); torso(ctx, p, o, cast, swing); ctx.restore();
  // arms that go in front of torso but behind head
  armList.filter(a => !a[1].behind && a[1].underHead).forEach(drawArm);
  ctx.save(); ctx.translate(g.head.x, g.head.y); ctx.rotate(p.lean + p.headTilt); ctx.scale(1 + p.squash * 0.15, 1 - p.squash * 0.1);
  drawHead(ctx, p, cast, swing);
  ctx.restore();
  armList.filter(a => !a[1].behind && !a[1].underHead).forEach(drawArm);
  if (p.hideLegs && p.cover) p.cover(ctx, p, g);
  // above-head fx (character space)
  const hx = g.head.x, hy = g.head.y;
  if (p.fx.zzz) for (let k = 0; k < 3; k++) { const ph = (p.t * 0.45 + k / 3) % 1; text(ctx, 'Z', hx + 90 + ph * 70 + Math.sin(ph * 6) * 10, hy - 90 - ph * 120, { size: 30 + ph * 26, color: '#fff', stroke: OUT, lw: 8, alpha: p.fx.zzz * Math.sin(ph * Math.PI) }); }
  if (p.fx.bulb) bulb(ctx, hx + 6, hy - 210, p.fx.bulb, p.t);
  if (p.fx.cloud) rainCloud(ctx, hx, hy - 230, p.fx.cloud, p.t);
  if (p.fx.sparkle) for (let k = 0; k < 6; k++) { const a = k * 1.05 + p.t * 0.8; const r = 150 + Math.sin(p.t * 3 + k) * 14; sparkle(ctx, hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.9, 12 + 8 * Math.sin(p.t * 7 + k * 2), k % 2 ? P.yellow : '#fff', p.fx.sparkle * (0.5 + 0.5 * Math.sin(p.t * 6 + k))); }
  if (p.fx.excl) { const s = p.fx.excl; text(ctx, '!', hx + 120, hy - 140, { size: 110 * s, color: P.yellow, stroke: OUT, lw: 12, font: 'BG800' }); }
  if (p.fx.q) for (let k = 0; k < 3; k++) { const a = p.fx.q; const ox = [-130, 120, 20][k], oy = [-120, -150, -190][k]; text(ctx, '?', hx + ox + Math.sin(p.t * 3 + k) * 8, hy + oy + Math.cos(p.t * 2.5 + k) * 8, { size: 64 + k * 10, color: '#fff', stroke: OUT, lw: 10, alpha: a, font: 'BG800' }); }
  if (p.fx.hearts) for (let k = 0; k < 5; k++) { const ph = (p.t * 0.7 + k / 5) % 1; heartPath(ctx, hx + Math.sin(k * 2.3 + ph * 5) * 120, hy - 60 - ph * 220, 26 + 10 * Math.sin(k)); ctx.globalAlpha = p.fx.hearts * Math.sin(ph * Math.PI); fs(ctx, '#ff4d6d', OUT, 3); ctx.globalAlpha = 1; }
  ctx.restore();
}

function bulb(ctx, x, y, a, t) {
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); const s = 0.6 + 0.4 * clamp(a * 1.3);
  ctx.scale(s, s);
  glow(ctx, 0, -10, 140, '#fde047', 0.7);
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2 + t * 0.5; line(ctx, Math.cos(ang) * 70, -10 + Math.sin(ang) * 70, Math.cos(ang) * 95, -10 + Math.sin(ang) * 95, '#fde047', 9); }
  ctx.beginPath(); ctx.arc(0, -16, 44, Math.PI * 0.8, Math.PI * 2.2); ctx.quadraticCurveTo(22, 22, 20, 36); ctx.lineTo(-20, 36); ctx.quadraticCurveTo(-22, 22, -42, 10); ctx.closePath(); fs(ctx, '#fef08a', OUT, 6);
  rr(ctx, -20, 36, 40, 26, 6); fs(ctx, '#94a3b8', OUT, 5); line(ctx, -18, 49, 18, 49, OUT, 3);
  ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(-6, -6); ctx.lineTo(0, 8); ctx.lineTo(6, -6); ctx.lineTo(12, 10); fs(ctx, null, '#f59e0b', 4);
  ell(ctx, -16, -30, 8, 14, 0.5); fs(ctx, '#fff');
  ctx.restore();
}
function rainCloud(ctx, x, y, a, t) {
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y);
  ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let k = 0; k < 9; k++) { const ph = (t * 2.2 + hash(k) ) % 1; const rx = -80 + k * 20; ctx.globalAlpha = clamp(a) * (1 - ph); line(ctx, rx, 30 + ph * 150, rx - 6, 52 + ph * 150, '#93c5fd', 5); }
  ctx.globalAlpha = clamp(a);
  const blobs = [[-60, 0, 42], [-15, -22, 52], [40, -8, 46], [80, 10, 34], [0, 16, 50]];
  for (const pass of [0, 1]) for (const [bx, by, r] of blobs) { circ(ctx, bx, by, r); if (!pass) { ctx.strokeStyle = OUT; ctx.lineWidth = 10; ctx.stroke(); } else { ctx.fillStyle = '#64748b'; ctx.fill(); } }
  ell(ctx, -20, -20, 34, 12); fs(ctx, rgba('#94a3b8', 0.9));
  ctx.restore();
}

// ---------- motion helpers ----------
function walk(t, speed = 1.6, stride = 34, lift = 22) {
  const ph = t * speed * Math.PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    legL: { x: -20 + s * stride, y: -Math.max(0, c) * lift, bend: 1, lift: Math.max(0, c) * lift },
    legR: { x: 20 - s * stride, y: -Math.max(0, -c) * lift, bend: -1, lift: Math.max(0, -c) * lift },
    armL: { x: -18 - s * stride * 0.9, y: 96, bend: 1, hand: 'fist' },
    armR: { x: 18 + s * stride * 0.9, y: 96, bend: -1, hand: 'fist' },
    crouch: 3 + Math.abs(c) * 7, headTilt: s * 0.03,
  };
}
function run(t, speed = 2.6, stride = 52) {
  const ph = t * speed * Math.PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    legL: { x: -12 + s * stride, y: -Math.max(0, c) * 46, bend: 1 },
    legR: { x: 12 - s * stride, y: -Math.max(0, -c) * 46, bend: -1 },
    armL: { x: -14 - s * 36, y: 52 - Math.abs(s) * 14, bend: 1, hand: 'fist' },
    armR: { x: 14 + s * 36, y: 52 - Math.abs(s) * 14, bend: -1, hand: 'fist' },
    crouch: 6 + Math.abs(c) * 12, jump: Math.abs(c) * 10, lean: 0.12,
  };
}
// Natural gesture presets (hand targets relative to the shoulder; IK bends the elbow anatomically)
const GEST = {
  wave: (t, side = 1) => ({ x: side * (60 + Math.sin(t * 9) * 16), y: -64, hand: 'open' }),   // upper arm out, forearm up
  pump: (side = 1) => ({ x: side * 42, y: -64, hand: 'fist' }),                               // fist at head height, elbow bent
  scratch: (side = 1) => ({ x: -side * 12, y: -112, hand: 'fist', elbowOut: 1.4 }),             // hand on head, elbow raised outward
};
const STAND = () => ({ legL: { x: -30, y: 0, bend: 1 }, legR: { x: 30, y: 0, bend: -1 } });
function idle(t) { return { crouch: Math.sin(t * 2.2) * 2.5, headTilt: Math.sin(t * 1.3) * 0.03, lean: Math.sin(t * 0.9) * 0.015 }; }
function merge(...objs) { const r = {}; for (const o of objs) if (o) for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && typeof o[k] !== 'function' && r[k] && typeof r[k] === 'object') r[k] = Object.assign({}, r[k], o[k]); else r[k] = o[k]; } return r; }

module.exports = { GEST, drawChar, drawHeadAt, resolve, EXPR, CAST, OUTFIT, walk, run, idle, STAND, merge, bulb, rainCloud, hand };
