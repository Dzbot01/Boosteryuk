'use strict';
// Brand wordmark, phone/laptop UIs, cards, stamps and story props.
const { W, H, P, clamp, lerp, E, rgba, mixC, rr, ell, circ, fs, line, glow, text, tw, heartPath, starPath, sparkle, ICON, beat, mulberry32, hash, ASSETS } = require('./engine');
const { drawHeadAt } = require('./character');
const OUT = P.out;

// ---------- brand ----------
// Official Boosteryuk logo (assets/logo/boosteryuk-logo.png, 964x498 after trim).
// `size` keeps the old wordmark scale: drawn width = 4.3 * size, centred on (x, y).
function logo(ctx, x, y, size, o = {}) {
  const img = ASSETS.logo; if (!img) return wordmark(ctx, x, y, size, o);
  const { alpha = 1, glowA = 0, tagline = null, align = 'center' } = o;
  const w = size * 4.3, h = w * img.height / img.width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (glowA > 0) glow(ctx, x0 + w / 2, y + h * 0.1, w * 0.62, P.cyan, 0.32 * glowA);
  ctx.drawImage(img, x0, y - h / 2, w, h);
  if (tagline) text(ctx, tagline, x0 + w / 2, y + h / 2 + size * 0.22, { size: size * 0.24, color: '#e2e8f0', font: 'PJS700' });
  ctx.restore();
  return w;
}
function wordmark(ctx, x, y, size, o = {}) {
  const { alpha = 1, glowA = 0, pill = false, tagline = null, align = 'center', yukCol = '#ffffff', boosterCol = P.cyan, shadow = true } = o;
  const a = tw(ctx, 'Booster', size, 'PJS800'), b = tw(ctx, 'yuk', size, 'PJS800');
  const total = a + b; const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (glowA > 0) glow(ctx, x0 + total / 2, y, total * 0.75, P.cyan, 0.35 * glowA);
  if (shadow) { text(ctx, 'Booster', x0 + 4, y + size * 0.06, { size, color: rgba('#000000', 0.25), align: 'left' }); text(ctx, 'yuk', x0 + a + 4, y + size * 0.06, { size, color: rgba('#000000', 0.25), align: 'left' }); }
  text(ctx, 'Booster', x0, y, { size, color: boosterCol, align: 'left' });
  text(ctx, 'yuk', x0 + a, y, { size, color: yukCol, align: 'left' });
  if (pill) { const pw = size * 1.9, ph = size * 0.36, py = y - size * 0.95; rr(ctx, x0, py - ph / 2, pw, ph, ph / 2); fs(ctx, rgba(P.cyan, 0.12), rgba(P.cyan, 0.6), 2); circ(ctx, x0 + ph * 0.55, py, ph * 0.16); fs(ctx, '#34d399'); text(ctx, 'SMM PANEL', x0 + ph * 0.9, py + 1, { size: ph * 0.5, color: P.cyanL, align: 'left', font: 'PJS800', spacing: 3 }); }
  if (tagline) text(ctx, tagline, x0 + total / 2, y + size * 0.75, { size: size * 0.24, color: '#e2e8f0', font: 'PJS700' });
  ctx.restore();
  return total;
}

// ---------- devices ----------
function phone(ctx, x, y, w, h, rotA = 0, o = {}) {
  const { screen = null, back = false, glowA = 0, t = 0, scale = 1 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotA); ctx.scale(scale, scale);
  const r = w * 0.16;
  if (glowA) glow(ctx, 0, 0, h * 0.9, P.cyan, 0.35 * glowA);
  rr(ctx, -w / 2, -h / 2, w, h, r); fs(ctx, back ? '#1e293b' : '#0b1222', OUT, Math.max(3, w * 0.025));
  if (back) {
    rr(ctx, -w / 2 + w * 0.1, -h / 2 + w * 0.1, w * 0.36, w * 0.36, w * 0.09); fs(ctx, '#0f172a', '#475569', 2);
    circ(ctx, -w / 2 + w * 0.2, -h / 2 + w * 0.2, w * 0.06); fs(ctx, '#020617', '#64748b', 2); circ(ctx, -w / 2 + w * 0.36, -h / 2 + w * 0.36, w * 0.06); fs(ctx, '#020617', '#64748b', 2);
    // tiny brand bolt
    circ(ctx, 0, h * 0.08, w * 0.09); fs(ctx, P.cyan); ICON.bolt(ctx, 0, h * 0.08, w * 0.11, '#0f172a');
  } else {
    const m = w * 0.045; const sw = w - m * 2, sh = h - m * 2;
    ctx.save(); rr(ctx, -w / 2 + m, -h / 2 + m, sw, sh, r * 0.8); ctx.clip(); ctx.translate(-w / 2 + m, -h / 2 + m);
    if (screen) screen(ctx, sw, sh); else { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, sw, sh); }
    ctx.restore();
    rr(ctx, -w * 0.14, -h / 2 + m + 6, w * 0.28, w * 0.07, w * 0.035); fs(ctx, '#000');
  }
  ctx.restore();
}
function laptop(ctx, x, y, w, o = {}) {
  const { screen = null, open = 1, glowA = 0 } = o; const h = w * 0.62;
  ctx.save(); ctx.translate(x, y);
  if (glowA) glow(ctx, 0, -h / 2, w * 0.8, P.cyan, 0.3 * glowA);
  const sh = h * open;
  rr(ctx, -w / 2, -sh, w, sh, 18); fs(ctx, '#1e293b', OUT, 5);
  if (open > 0.3) { ctx.save(); rr(ctx, -w / 2 + 16, -sh + 16, w - 32, sh - 30, 8); ctx.clip(); ctx.translate(-w / 2 + 16, -sh + 16); if (screen) screen(ctx, w - 32, sh - 30); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-w / 2 - 50, 0); ctx.lineTo(w / 2 + 50, 0); ctx.lineTo(w / 2 + 70, 30); ctx.lineTo(-w / 2 - 70, 30); ctx.closePath(); fs(ctx, '#cbd5e1', OUT, 5);
  rr(ctx, -60, 6, 120, 10, 5); fs(ctx, '#94a3b8');
  ctx.restore();
}

// ---------- screens (draw in 0..w, 0..h) ----------
function appBar(ctx, w, title, dark = false) {
  ctx.fillStyle = dark ? '#0b1222' : '#ffffff'; ctx.fillRect(0, 0, w, w * 0.2);
  text(ctx, '9:41', w * 0.1, w * 0.07, { size: w * 0.04, color: dark ? '#fff' : '#0f172a', align: 'left', font: 'PJS700' });
  text(ctx, title, w / 2, w * 0.14, { size: w * 0.055, color: dark ? '#fff' : '#0f172a', font: 'PJS800' });
}
function fmt(n) { if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + 'M'; if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.', ',') + 'K'; return Math.round(n).toLocaleString('id-ID'); }
function avatar(ctx, x, y, r, expr = 'happy', t = 0) {
  circ(ctx, x, y, r); fs(ctx, P.cyanL, OUT, Math.max(2, r * 0.06));
  ctx.save(); circ(ctx, x, y, r); ctx.clip(); drawHeadAt(ctx, x, y + r * 0.25, r / 110, 0, { expr, t, blink: false }); ctx.restore();
  circ(ctx, x, y, r); fs(ctx, null, OUT, Math.max(2, r * 0.06));
}
// social profile / post stats screen (generic app, no real platform marks)
function socialScreen(ctx, w, h, o = {}) {
  const { followers = 12, likes = 3, views = 40, comments = 0, t = 0, expr = 'happy', mode = 'post', highlight = 0 } = o;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, h); appBar(ctx, w, mode === 'post' ? 'Postingan' : 'Profil');
  if (mode === 'profile') {
    avatar(ctx, w / 2, w * 0.42, w * 0.15, expr, t);
    text(ctx, '@kreator.muda', w / 2, w * 0.66, { size: w * 0.055, color: '#0f172a', font: 'PJS800' });
    const st = [[fmt(followers), 'Followers'], [fmt(likes), 'Likes'], [fmt(views), 'Views']];
    st.forEach(([v, l], i) => { const cx = w * (0.2 + i * 0.3); text(ctx, v, cx, w * 0.82, { size: w * (0.075 + (i === 0 ? highlight * 0.02 : 0)), color: i === 0 && highlight ? P.cyan6 : '#0f172a', font: 'PJS800' }); text(ctx, l, cx, w * 0.9, { size: w * 0.038, color: '#64748b', font: 'PJS600' }); });
    const cols = ['#fca5a5', '#a5f3fc', '#fde68a', '#c4b5fd', '#bbf7d0', '#fbcfe8'];
    for (let i = 0; i < 6; i++) { const gx = (i % 3) * (w / 3), gy = w * 1.0 + Math.floor(i / 3) * (w / 3) * 1.3; ctx.fillStyle = cols[i]; ctx.fillRect(gx + 3, gy, w / 3 - 6, (w / 3) * 1.3 - 6); ICON.play(ctx, gx + w / 6, gy + w * 0.2, w * 0.1, '#ffffff'); }
  } else {
    // post thumbnail with the character
    ctx.save(); ctx.beginPath(); ctx.rect(0, w * 0.2, w, h * 0.62); ctx.clip();
    const g = ctx.createLinearGradient(0, w * 0.2, 0, w * 0.2 + h * 0.62); g.addColorStop(0, '#a5f3fc'); g.addColorStop(1, '#f0abfc'); ctx.fillStyle = g; ctx.fillRect(0, w * 0.2, w, h * 0.62);
    drawHeadAt(ctx, w / 2, w * 0.2 + h * 0.36, w / 260, 0, { expr: 'grin', t, blink: false });
    ICON.play(ctx, w / 2, w * 0.2 + h * 0.31, w * 0.16, rgba('#ffffff', 0.85));
    ctx.restore();
    const yy = w * 0.2 + h * 0.62 + w * 0.12;
    const items = [['eye', fmt(views)], ['heart', fmt(likes)], ['comment', fmt(comments)], ['share', '0']];
    items.forEach(([ic, v], i) => { const cx = w * (0.14 + i * 0.24); ICON[ic](ctx, cx, yy, w * 0.09, ic === 'heart' ? (likes > 50 ? P.red : '#94a3b8') : '#475569'); text(ctx, v, cx, yy + w * 0.1, { size: w * 0.05, color: '#0f172a', font: 'PJS800' }); });
  }
}
function uploadScreen(ctx, w, h, k, t = 0) {
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, h); appBar(ctx, w, 'Unggah');
  rr(ctx, w * 0.12, w * 0.32, w * 0.76, h * 0.42, 24); const g = ctx.createLinearGradient(0, w * 0.32, 0, w * 0.32 + h * 0.42); g.addColorStop(0, '#a5f3fc'); g.addColorStop(1, '#f0abfc'); fs(ctx, g, OUT, 3);
  ctx.save(); rr(ctx, w * 0.12, w * 0.32, w * 0.76, h * 0.42, 24); ctx.clip(); drawHeadAt(ctx, w / 2, w * 0.32 + h * 0.24, w / 330, 0, { expr: 'grin', t, blink: false }); ctx.restore();
  const by = w * 0.32 + h * 0.42 + w * 0.16;
  if (k < 1) {
    text(ctx, 'Mengunggah… ' + Math.floor(k * 100) + '%', w / 2, by, { size: w * 0.07, color: '#0f172a', font: 'PJS800' });
    rr(ctx, w * 0.12, by + w * 0.07, w * 0.76, w * 0.05, w * 0.025); fs(ctx, '#e2e8f0'); rr(ctx, w * 0.12, by + w * 0.07, w * 0.76 * k, w * 0.05, w * 0.025); fs(ctx, P.cyan5);
  } else {
    circ(ctx, w / 2, by + w * 0.03, w * 0.08); fs(ctx, P.green); ICON.check(ctx, w / 2, by + w * 0.03, w * 0.12, '#fff');
    text(ctx, 'Berhasil diposting!', w / 2, by + w * 0.17, { size: w * 0.07, color: '#0f172a', font: 'PJS800' });
  }
}
function reminderScreen(ctx, w, h, t, k) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#f472b6'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  text(ctx, '07:00', w / 2, h * 0.2, { size: w * 0.22, color: '#fff', font: 'PJS800' });
  text(ctx, 'Senin, Hari Baru!', w / 2, h * 0.29, { size: w * 0.06, color: '#e0f2fe', font: 'PJS700' });
  const a = E.back(clamp(k)); ctx.save(); ctx.translate(w / 2, h * 0.45); ctx.scale(a, a);
  rr(ctx, -w * 0.42, -w * 0.13, w * 0.84, w * 0.26, w * 0.06); fs(ctx, rgba('#ffffff', 0.92));
  circ(ctx, -w * 0.3, 0, w * 0.07); fs(ctx, P.cyan5); ICON.play(ctx, -w * 0.29, 0, w * 0.07, '#fff');
  text(ctx, 'Pengingat', -w * 0.19, -w * 0.045, { size: w * 0.04, color: '#64748b', align: 'left', font: 'PJS700' });
  text(ctx, 'Bikin konten hari ini!', -w * 0.19, w * 0.035, { size: w * 0.056, color: '#0f172a', align: 'left', font: 'PJS800' });
  ctx.restore();
}
function boosteryukScreen(ctx, w, h, t, o = {}) {
  const { k = 1, sel = -1, press = 0, done = 0, scroll = 0 } = o;
  ctx.fillStyle = '#0b1222'; ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.8, w * 0.3, w * 0.9, P.cyan, 0.25);
  // header
  logo(ctx, w * 0.08, w * 0.13, w * 0.085, { align: 'left', shadow: false });
  for (let i = 0; i < 3; i++) rr(ctx, w * 0.8, w * 0.1 + i * w * 0.025, w * 0.1, w * 0.012, 3), fs(ctx, '#cbd5e1');
  ctx.save(); ctx.translate(0, -scroll);
  text(ctx, 'Booster Media Sosial', w * 0.08, w * 0.32, { size: w * 0.065, color: '#fff', align: 'left', font: 'PJS800' });
  text(ctx, 'Tercepat & Terpercaya', w * 0.08, w * 0.4, { size: w * 0.065, color: P.cyan, align: 'left', font: 'PJS800' });
  const items = [['user', 'Followers', 'Mulai dari 100'], ['heart', 'Likes', 'Proses instan'], ['eye', 'Views', 'Super cepat'], ['comment', 'Komentar', 'Bergaransi'], ['share', 'Share & Save', 'Aman']];
  items.forEach(([ic, lab, sub], i) => {
    const ap = E.back(clamp(k * 5 - i * 0.6)); if (ap <= 0) return;
    const y = w * 0.52 + i * w * 0.24; const x = w * 0.06 + (1 - ap) * w;
    const on = sel === i;
    rr(ctx, x, y, w * 0.88, w * 0.2, w * 0.05); fs(ctx, on ? rgba(P.cyan, 0.22) : '#111c33', on ? P.cyan : '#1e3a5f', on ? 4 : 2);
    circ(ctx, x + w * 0.12, y + w * 0.1, w * 0.065); fs(ctx, on ? P.cyan : rgba(P.cyan, 0.18)); ICON[ic](ctx, x + w * 0.12, y + w * 0.1, w * 0.07, on ? '#0b1222' : P.cyan);
    text(ctx, lab, x + w * 0.23, y + w * 0.075, { size: w * 0.05, color: '#fff', align: 'left', font: 'PJS800' });
    text(ctx, sub, x + w * 0.23, y + w * 0.135, { size: w * 0.036, color: '#94a3b8', align: 'left', font: 'PJS600' });
    text(ctx, '›', x + w * 0.8, y + w * 0.1, { size: w * 0.08, color: on ? P.cyan : '#475569', font: 'PJS800' });
  });
  ctx.restore();
  // order button
  const by = h - w * 0.32; const sc = 1 - press * 0.08;
  ctx.save(); ctx.translate(w / 2, by + w * 0.08); ctx.scale(sc, sc);
  rr(ctx, -w * 0.42, -w * 0.08, w * 0.84, w * 0.16, w * 0.08); fs(ctx, done ? P.green : P.cyan5, OUT, 3);
  text(ctx, done ? 'Pesanan Diproses ⚡'.replace('⚡', '') : 'Pesan Sekarang', done ? -w * 0.03 : 0, 2, { size: w * 0.055, color: '#0b1222', font: 'PJS800' });
  if (done) ICON.bolt(ctx, w * 0.31, 0, w * 0.07, '#0b1222');
  ctx.restore();
  if (press > 0 && press < 1) { circ(ctx, w / 2, by + w * 0.08, w * 0.6 * press); fs(ctx, rgba('#ffffff', 0.35 * (1 - press))); }
}
function growthScreen(ctx, w, h, t, k, o = {}) {
  const { from = 128, to = 12800, label = 'Followers' } = o;
  ctx.fillStyle = '#0b1222'; ctx.fillRect(0, 0, w, h); glow(ctx, w / 2, h * 0.3, w, P.cyan, 0.3);
  text(ctx, label, w / 2, h * 0.14, { size: w * 0.06, color: '#94a3b8', font: 'PJS700' });
  const v = lerp(from, to, E.out(clamp(k)));
  const bump = beat(t).pulse * 0.06;
  text(ctx, fmt(v), w / 2, h * 0.25, { size: w * (0.2 + bump), color: '#fff', font: 'PJS800' });
  rr(ctx, w * 0.28, h * 0.32, w * 0.44, w * 0.1, w * 0.05); fs(ctx, rgba(P.green, 0.2)); text(ctx, '▲ ' + Math.round(lerp(0, 98, clamp(k))) + '%', w / 2, h * 0.32 + w * 0.05, { size: w * 0.05, color: '#4ade80', font: 'PJS800' });
  // chart
  const x0 = w * 0.08, x1 = w * 0.92, y0 = h * 0.82, y1 = h * 0.45; const n = 40; const kk = clamp(k * 1.2);
  ctx.beginPath(); for (let i = 0; i <= n * kk; i++) { const u = i / n; const yy = y0 - (y0 - y1) * (Math.pow(u, 2.2) + Math.sin(u * 20) * 0.02); const xx = lerp(x0, x1, u); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.strokeStyle = P.cyan; ctx.lineWidth = w * 0.02; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  const u = clamp(Math.floor(n * kk) / n); const hx = lerp(x0, x1, u), hy = y0 - (y0 - y1) * (Math.pow(u, 2.2) + Math.sin(u * 20) * 0.02); glow(ctx, hx, hy, w * 0.12, P.cyan, 0.8); circ(ctx, hx, hy, w * 0.025); fs(ctx, '#fff');
  for (let i = 0; i < 7; i++) { const ph = (t * 0.9 + i / 7) % 1; heartPath(ctx, w * (0.15 + 0.7 * hash(i)), h * 0.95 - ph * h * 0.6, w * 0.08); ctx.globalAlpha = Math.sin(ph * Math.PI) * clamp(k * 3); fs(ctx, i % 2 ? '#ff4d6d' : P.pink); ctx.globalAlpha = 1; }
}
function dashScreen(ctx, w, h, t, k) {
  ctx.fillStyle = '#0b1222'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0f1a30'; ctx.fillRect(0, 0, w * 0.18, h);
  logo(ctx, w * 0.02, h * 0.08, w * 0.024, { align: 'left', shadow: false });
  ['Dashboard', 'Pesan Baru', 'Layanan', 'Riwayat', 'Deposit', 'Hosting'].forEach((s, i) => { if (i === 0) { rr(ctx, w * 0.01, h * 0.16 + i * h * 0.09 - h * 0.035, w * 0.16, h * 0.07, 8); fs(ctx, rgba(P.cyan, 0.2)); } text(ctx, s, w * 0.03, h * 0.16 + i * h * 0.09, { size: w * 0.017, color: i ? '#94a3b8' : P.cyan, align: 'left', font: 'PJS700' }); });
  const cards = [['Total Pesanan', '1.248', P.cyan], ['Diproses', '36', P.yellow], ['Selesai', '1.212', '#4ade80']];
  cards.forEach(([l, v, c], i) => { const a = clamp(k * 4 - i * 0.5); const x = w * (0.21 + i * 0.26), y = h * 0.08 + (1 - E.out(a)) * 30; ctx.globalAlpha = a; rr(ctx, x, y, w * 0.24, h * 0.2, 14); fs(ctx, '#111c33', '#1e3a5f', 2); text(ctx, l, x + w * 0.015, y + h * 0.06, { size: w * 0.016, color: '#94a3b8', align: 'left', font: 'PJS700' }); text(ctx, v, x + w * 0.015, y + h * 0.14, { size: w * 0.04, color: c, align: 'left', font: 'PJS800' }); ctx.globalAlpha = 1; });
  // chart bars
  const bx = w * 0.21, by = h * 0.92, bw = w * 0.76; rr(ctx, bx, h * 0.34, bw, h * 0.62, 14); fs(ctx, '#111c33', '#1e3a5f', 2);
  for (let i = 0; i < 12; i++) { const hh = (0.15 + 0.7 * Math.pow((i + 1) / 12, 1.4) + 0.05 * Math.sin(i * 2)) * h * 0.45 * E.out(clamp(k * 2 - i * 0.06)); rr(ctx, bx + 30 + i * (bw - 60) / 12, by - hh, (bw - 60) / 12 - 14, hh, 6); fs(ctx, i === 11 ? P.cyan : rgba(P.cyan, 0.45)); }
}

// ---------- UI pieces ----------
function chip(ctx, x, y, label, o = {}) {
  const { icon = null, col = P.cyan, size = 34, alpha = 1, bg = '#0b1222', fg = '#ffffff' } = o;
  const w = tw(ctx, label, size, 'PJS800') + (icon ? size * 1.9 : size * 1.1);
  ctx.save(); ctx.globalAlpha *= alpha; rr(ctx, x - w / 2, y - size * 0.85, w, size * 1.7, size * 0.85); fs(ctx, bg, col, 4);
  if (icon) { circ(ctx, x - w / 2 + size * 0.95, y, size * 0.6); fs(ctx, col); ICON[icon](ctx, x - w / 2 + size * 0.95, y, size * 0.7, bg); }
  text(ctx, label, x + (icon ? size * 0.42 : 0), y + 1, { size, color: fg, font: 'PJS800' });
  ctx.restore(); return w;
}
function card(ctx, x, y, w, h, o = {}) {
  const { icon = 'user', label = '', sub = '', col = P.cyan, alpha = 1, flip = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(Math.max(0.02, flip), 1);
  rr(ctx, -w / 2, -h / 2, w, h, 26); fs(ctx, '#111c33', col, 4);
  circ(ctx, 0, -h * 0.14, h * 0.2); fs(ctx, rgba(col, 0.2), col, 3); ICON[icon](ctx, 0, -h * 0.14, h * 0.22, col);
  text(ctx, label, 0, h * 0.18, { size: h * 0.13, color: '#fff', font: 'PJS800' });
  if (sub) text(ctx, sub, 0, h * 0.33, { size: h * 0.085, color: '#94a3b8', font: 'PJS600' });
  ctx.restore();
}
function stamp(ctx, x, y, label, k, o = {}) {
  const { col = P.green, size = 90, rot = -0.12, icon = 'check' } = o; if (k <= 0) return;
  const s = k < 1 ? lerp(2.4, 1, E.out(k)) : 1; const a = clamp(k * 3);
  const w = tw(ctx, label, size, 'BG800') + size * 1.6;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  rr(ctx, -w / 2, -size * 0.85, w, size * 1.7, 22); fs(ctx, rgba(col, 0.15), col, 10);
  rr(ctx, -w / 2 + 14, -size * 0.85 + 14, w - 28, size * 1.7 - 28, 14); fs(ctx, null, col, 4);
  if (icon) { circ(ctx, -w / 2 + size * 0.85, 0, size * 0.46); fs(ctx, col); ICON[icon](ctx, -w / 2 + size * 0.85, 0, size * 0.6, '#fff'); }
  text(ctx, label, size * 0.4, 4, { size, color: col, font: 'BG800' });
  ctx.restore();
}
function bubble(ctx, x, y, w, h, tx, ty, o = {}) { // thought bubble with trailing circles toward (tx,ty)
  const { alpha = 1, fill = '#ffffff', content = null, k = 1 } = o; if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4; if (k < u * 0.6) continue; circ(ctx, lerp(tx, x, u * 0.8), lerp(ty, y + h / 2, u * 0.8), 10 + i * 9); fs(ctx, fill, OUT, 5); }
  const s = E.back(clamp((k - 0.4) / 0.6)); if (s > 0) {
    ctx.translate(x, y); ctx.scale(s, s);
    const blobs = 10; ctx.beginPath(); for (let i = 0; i <= blobs; i++) { const a = (i / blobs) * Math.PI * 2; const px = Math.cos(a) * w / 2, py = Math.sin(a) * h / 2; if (!i) ctx.moveTo(px, py); else { const am = ((i - 0.5) / blobs) * Math.PI * 2; ctx.quadraticCurveTo(Math.cos(am) * w / 2 * 1.18, Math.sin(am) * h / 2 * 1.2, px, py); } }
    ctx.closePath(); fs(ctx, fill, OUT, 6);
    if (content) { ctx.save(); ell(ctx, 0, 0, w / 2 - 6, h / 2 - 6); ctx.clip(); content(ctx); ctx.restore(); }
  }
  ctx.restore();
}
function toast(ctx, x, y, label, o = {}) {
  const { icon = 'heart', col = P.red, alpha = 1, s = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s, s);
  const w = tw(ctx, label, 30, 'PJS800') + 92;
  rr(ctx, -w / 2, -34, w, 68, 34); fs(ctx, '#ffffff', OUT, 4);
  circ(ctx, -w / 2 + 36, 0, 24); fs(ctx, col); ICON[icon](ctx, -w / 2 + 36, 0, 28, '#fff');
  text(ctx, label, 22, 2, { size: 30, color: '#0f172a', font: 'PJS800' });
  ctx.restore();
}

// ---------- props ----------
function rocket(ctx, x, y, s, t, o = {}) {
  const { flame = 1, logoOn = true } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (flame > 0) { const f = 1 + 0.15 * Math.sin(t * 40); ctx.save(); ctx.scale(1, flame * f); glow(ctx, 0, 230, 200, '#fb923c', 0.8); ctx.beginPath(); ctx.moveTo(-50, 150); ctx.quadraticCurveTo(-30, 300, 0, 380); ctx.quadraticCurveTo(30, 300, 50, 150); fs(ctx, '#fb923c', OUT, 5); ctx.beginPath(); ctx.moveTo(-26, 150); ctx.quadraticCurveTo(-14, 250, 0, 300); ctx.quadraticCurveTo(14, 250, 26, 150); fs(ctx, '#fde047'); ctx.restore(); }
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 60, 40); ctx.quadraticCurveTo(d * 130, 90, d * 120, 180); ctx.lineTo(d * 55, 140); ctx.closePath(); fs(ctx, P.cyan5, OUT, 6); }
  ctx.beginPath(); ctx.moveTo(0, -260); ctx.bezierCurveTo(110, -170, 90, 60, 60, 160); ctx.lineTo(-60, 160); ctx.bezierCurveTo(-90, 60, -110, -170, 0, -260); ctx.closePath(); fs(ctx, '#f8fafc', OUT, 6);
  ctx.save(); ctx.clip(); ctx.fillStyle = P.cyan5; ctx.fillRect(-120, -260, 240, 70); ctx.fillStyle = '#e2e8f0'; ctx.fillRect(30, -260, 100, 440); ctx.restore();
  ctx.beginPath(); ctx.moveTo(0, -260); ctx.bezierCurveTo(110, -170, 90, 60, 60, 160); ctx.lineTo(-60, 160); ctx.bezierCurveTo(-90, 60, -110, -170, 0, -260); ctx.closePath(); fs(ctx, null, OUT, 6);
  circ(ctx, 0, -100, 42); fs(ctx, '#7dd3fc', OUT, 7); ell(ctx, -12, -112, 10, 16, 0.5); fs(ctx, '#fff');
  if (logoOn) logo(ctx, 0, 52, 30);
  rr(ctx, -62, 150, 124, 24, 8); fs(ctx, '#64748b', OUT, 5);
  ctx.restore();
}
function speedometer(ctx, x, y, r, k, t, o = {}) {
  const { label = 'TERCEPAT' } = o;
  ctx.save(); ctx.translate(x, y);
  glow(ctx, 0, 0, r * 1.5, P.cyan, 0.35 * k);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(0, 0); ctx.closePath(); fs(ctx, '#0b1222', OUT, 8);
  const seg = [[P.green, 0, 0.4], [P.yellow, 0.4, 0.7], [P.red, 0.7, 1]];
  for (const [c, a0, a1] of seg) { ctx.beginPath(); ctx.arc(0, 0, r * 0.82, Math.PI * (0.8 + 1.4 * a0), Math.PI * (0.8 + 1.4 * a1)); ctx.strokeStyle = c; ctx.lineWidth = r * 0.12; ctx.lineCap = 'butt'; ctx.stroke(); }
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.8 + 1.4 * i / 10); line(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, '#e2e8f0', 5); }
  const a = Math.PI * (0.8 + 1.4 * clamp(k)) + Math.sin(t * 50) * 0.02 * k;
  ctx.beginPath(); ctx.moveTo(Math.cos(a + 1.57) * 14, Math.sin(a + 1.57) * 14); ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.lineTo(Math.cos(a - 1.57) * 14, Math.sin(a - 1.57) * 14); ctx.closePath(); fs(ctx, '#fff', OUT, 4);
  circ(ctx, 0, 0, 24); fs(ctx, P.cyan, OUT, 5);
  text(ctx, label, 0, r * 0.5, { size: r * 0.2, color: k > 0.9 ? P.cyan : '#94a3b8', font: 'BG800' });
  ctx.restore();
}
function shieldBig(ctx, x, y, s, t, o = {}) {
  const { lock = 1, scan = 1 } = o; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glow(ctx, 0, 0, 380, P.cyan, 0.4);
  const path = () => { ctx.beginPath(); ctx.moveTo(0, -230); ctx.quadraticCurveTo(110, -160, 200, -165); ctx.quadraticCurveTo(215, 100, 0, 240); ctx.quadraticCurveTo(-215, 100, -200, -165); ctx.quadraticCurveTo(-110, -160, 0, -230); ctx.closePath(); };
  path(); fs(ctx, P.cyan5, OUT, 9);
  ctx.save(); path(); ctx.clip(); ctx.fillStyle = P.cyan6; ctx.fillRect(0, -260, 260, 520);
  if (scan) { const sy = -230 + ((t * 300) % 470); const g = ctx.createLinearGradient(0, sy - 60, 0, sy); g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(1, rgba('#ffffff', 0.5)); ctx.fillStyle = g; ctx.fillRect(-220, sy - 60, 440, 60); line(ctx, -220, sy, 220, sy, '#fff', 4); }
  ctx.restore(); path(); fs(ctx, null, OUT, 9);
  if (lock) { ctx.save(); ctx.scale(lock, lock); ctx.beginPath(); ctx.arc(0, -30, 48, Math.PI, 0); ctx.lineTo(48, 0); ctx.moveTo(-48, 0); ctx.lineTo(-48, -30); fs(ctx, null, OUT, 26); ctx.beginPath(); ctx.arc(0, -30, 48, Math.PI, 0); ctx.lineTo(48, 0); ctx.moveTo(-48, 0); ctx.lineTo(-48, -30); fs(ctx, null, '#e2e8f0', 14); rr(ctx, -72, -10, 144, 116, 22); fs(ctx, P.yellow, OUT, 7); circ(ctx, 0, 36, 14); fs(ctx, OUT); rr(ctx, -6, 40, 12, 32, 5); fs(ctx, OUT); ctx.restore(); }
  ctx.restore();
}
function trophy(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); glow(ctx, 0, -60, 260, P.gold, 0.5);
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 92, -110, 44, 0, Math.PI * 2); fs(ctx, null, OUT, 26); ctx.beginPath(); ctx.arc(d * 92, -110, 44, 0, Math.PI * 2); fs(ctx, null, P.gold, 14); }
  ctx.beginPath(); ctx.moveTo(-100, -190); ctx.lineTo(100, -190); ctx.quadraticCurveTo(100, -10, 0, 10); ctx.quadraticCurveTo(-100, -10, -100, -190); ctx.closePath(); fs(ctx, P.gold, OUT, 7);
  ctx.save(); ctx.clip(); ctx.fillStyle = '#f59e0b'; ctx.fillRect(30, -200, 90, 220); ctx.restore();
  rr(ctx, -18, 6, 36, 50, 6); fs(ctx, '#f59e0b', OUT, 6); rr(ctx, -70, 52, 140, 44, 10); fs(ctx, '#78350f', OUT, 6);
  text(ctx, '#1', 0, -100, { size: 70, color: '#fff', font: 'BG800', stroke: OUT, lw: 8 });
  sparkle(ctx, -70, -160, 18 + Math.sin(t * 8) * 6, '#fff'); sparkle(ctx, 60, -60, 12 + Math.cos(t * 9) * 5, '#fff');
  ctx.restore();
}
function plant(ctx, x, y, k, t, o = {}) { // grows into a tree with heart/star fruits
  const s = o.s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -70, -10, 140, 90, 18); fs(ctx, '#fb923c', OUT, 6); rr(ctx, -80, -24, 160, 26, 10); fs(ctx, '#f97316', OUT, 6);
  const hgt = 40 + 420 * E.out(clamp(k));
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(Math.sin(t * 1.5) * 10, -hgt / 2, 0, -hgt); ctx.strokeStyle = OUT; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 18; ctx.stroke();
  const crown = E.back(clamp(k * 1.3 - 0.2));
  if (crown > 0) {
    const blobs = [[0, -hgt - 40, 120], [-110, -hgt + 20, 90], [110, -hgt + 20, 90], [-60, -hgt - 110, 90], [70, -hgt - 100, 95]];
    for (const pass of [0, 1]) for (const [bx, by, r] of blobs) { circ(ctx, bx * crown, by + (1 - crown) * 100, r * crown); if (!pass) { ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.stroke(); } else { ctx.fillStyle = '#22c55e'; ctx.fill(); } }
    const fr = [[-120, -hgt + 10, 'heart'], [100, -hgt - 20, 'star'], [-30, -hgt - 130, 'heart'], [60, -hgt + 50, 'heart'], [-60, -hgt - 40, 'star'], [130, -hgt - 110, 'heart']];
    fr.forEach(([fx, fy, ic], i) => { const a = E.back(clamp(k * 2.2 - 1 - i * 0.12)); if (a <= 0) return; ctx.save(); ctx.translate(fx * crown, fy); ctx.scale(a, a); if (ic === 'heart') { heartPath(ctx, 0, 0, 52); fs(ctx, '#ff4d6d', OUT, 5); } else { starPath(ctx, 0, 0, 30); fs(ctx, P.yellow, OUT, 5); } ctx.restore(); });
  } else { for (const d of [-1, 1]) { ctx.save(); ctx.translate(0, -hgt); ctx.rotate(d * 0.8); ell(ctx, 0, -26, 16, 30); fs(ctx, '#22c55e', OUT, 5); ctx.restore(); } }
  ctx.restore();
}
function wateringCan(ctx, x, y, ang, pour, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(30, -10); ctx.lineTo(110, -50); ctx.lineTo(118, -38); ctx.lineTo(40, 14); fs(ctx, '#38bdf8', OUT, 5);
  rr(ctx, -50, -30, 90, 70, 16); fs(ctx, '#38bdf8', OUT, 6); ctx.beginPath(); ctx.arc(-6, -30, 30, Math.PI, 0); fs(ctx, null, OUT, 14); ctx.beginPath(); ctx.arc(-6, -30, 30, Math.PI, 0); fs(ctx, null, '#38bdf8', 7);
  if (pour) for (let i = 0; i < 10; i++) { const ph = (t * 3 + i / 10) % 1; circ(ctx, 118 + ph * 50 + Math.sin(i) * 8, -40 + ph * ph * 220, 5); fs(ctx, rgba('#7dd3fc', pour * (1 - ph * 0.5))); }
  ctx.restore();
}
function mic(ctx, x, y, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2 + Math.PI); rr(ctx, -9, -8, 18, 70, 8); fs(ctx, '#334155', OUT, 4); circ(ctx, 0, 70, 20); fs(ctx, '#94a3b8', OUT, 4); ctx.restore(); }
function micAt(ctx, x, y, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); rr(ctx, -9, -10, 18, 64, 8); fs(ctx, '#334155', OUT, 4); circ(ctx, 0, -22, 20); fs(ctx, '#cbd5e1', OUT, 4); ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(14, -30); ctx.moveTo(-16, -20); ctx.lineTo(16, -20); fs(ctx, null, '#64748b', 2); ctx.restore(); }
function ringLight(ctx, x, y, s, on = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); line(ctx, 0, 0, 0, 420, OUT, 14); line(ctx, 0, 0, 0, 420, '#475569', 7); for (const d of [-1, 0, 1]) line(ctx, 0, 420, d * 80, 520, '#475569', 8); if (on) glow(ctx, 0, -60, 260, '#fff7d6', 0.55 * on); circ(ctx, 0, -60, 110); fs(ctx, null, OUT, 34); circ(ctx, 0, -60, 110); fs(ctx, null, on ? '#fffbe6' : '#cbd5e1', 22); ctx.restore(); }
function tripodPhone(ctx, x, y, s, t, rec = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (const d of [-1, 0, 1]) line(ctx, 0, 0, d * 90, 330, '#334155', 9); line(ctx, 0, -40, 0, 20, '#334155', 12); phone(ctx, 0, -130, 120, 230, 0, { back: true }); if (rec) { circ(ctx, 34, -215, 12); fs(ctx, Math.sin(t * 8) > 0 ? P.red : '#7f1d1d', OUT, 3); } ctx.restore(); }
function whiteboard(ctx, x, y, w, h, k, t) {
  rr(ctx, x - w / 2, y - h / 2, w, h, 14); fs(ctx, '#ffffff', OUT, 7); rr(ctx, x - w / 2 + 10, y + h / 2 - 4, w - 20, 16, 6); fs(ctx, '#94a3b8', OUT, 4);
  text(ctx, 'RENCANA KONTEN', x, y - h / 2 + 50, { size: 40, color: P.navy, font: 'BG800' });
  const items = ['Cari ide konten', 'Jadwal posting', 'Rekam & edit', 'Tumbuh!'];
  items.forEach((s, i) => { const a = clamp(k * 4.5 - i); if (a <= 0) return; const yy = y - h / 2 + 120 + i * 62; rr(ctx, x - w / 2 + 40, yy - 18, 36, 36, 6); fs(ctx, '#fff', OUT, 4); if (a > 0.6) ICON.check(ctx, x - w / 2 + 58, yy, 40, P.green, 7); ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2 + 90, yy - 30, (w - 120) * clamp(a * 1.4), 60); ctx.clip(); text(ctx, s, x - w / 2 + 92, yy + 2, { size: 34, color: i === 3 ? P.cyan6 : '#334155', align: 'left', font: 'PJS800' }); ctx.restore(); });
  const ak = clamp(k * 2 - 1); if (ak > 0) { ctx.save(); ctx.translate(x + w / 2 - 110, y + 40); ctx.beginPath(); ctx.moveTo(-60, 60); ctx.lineTo(-20, 20 * (1 - ak) + 0); ctx.lineTo(10, 30); ctx.lineTo(60 * ak, -60 * ak); fs(ctx, null, P.red, 7); if (ak > 0.9) { ctx.beginPath(); ctx.moveTo(60, -60); ctx.lineTo(36, -56); ctx.moveTo(60, -60); ctx.lineTo(58, -36); fs(ctx, null, P.red, 7); } ctx.restore(); }
}
function target(ctx, x, y, r, hit = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); const cols = [P.red, '#fff', P.red, '#fff', P.yellow];
  rr(ctx, -12, r * 0.9, 24, r * 0.8, 6); fs(ctx, '#92400e', OUT, 5);
  cols.forEach((c, i) => { circ(ctx, 0, 0, r * (1 - i * 0.19)); fs(ctx, c, OUT, 6); });
  if (hit > 0) for (let i = 0; i < 3; i++) { const ph = clamp(hit * 1.5 - i * 0.2); if (ph <= 0 || ph >= 1) continue; circ(ctx, 0, 0, r * 0.2 + ph * r * 1.4); ctx.globalAlpha = 1 - ph; fs(ctx, null, P.yellow, 8); ctx.globalAlpha = 1; }
  ctx.restore();
}
function dart(ctx, x, y, a, s = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); line(ctx, -90, 0, 0, 0, OUT, 14); line(ctx, -90, 0, 0, 0, '#e2e8f0', 7); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(26, 0); ctx.lineTo(0, 7); fs(ctx, '#94a3b8', OUT, 4); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-100, d * 26); ctx.lineTo(-90, 0); fs(ctx, P.cyan, OUT, 4); } ctx.restore(); }
function bigClock(ctx, x, y, r, t, speed = 1) {
  ctx.save(); ctx.translate(x, y); circ(ctx, 0, 0, r + 18); fs(ctx, P.cyan5, OUT, 8); circ(ctx, 0, 0, r); fs(ctx, '#fff', OUT, 6);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(ctx, Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, OUT, i % 3 ? 5 : 10); }
  const m = t * speed * Math.PI * 2, hh = m / 12;
  line(ctx, 0, 0, Math.cos(hh - Math.PI / 2) * r * 0.5, Math.sin(hh - Math.PI / 2) * r * 0.5, OUT, 16);
  line(ctx, 0, 0, Math.cos(m - Math.PI / 2) * r * 0.75, Math.sin(m - Math.PI / 2) * r * 0.75, P.cyan6, 10);
  circ(ctx, 0, 0, 16); fs(ctx, OUT);
  ctx.restore();
}
function signpost(ctx, x, y, label, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -12, -300, 24, 300, 6); fs(ctx, '#92400e', OUT, 5); ctx.beginPath(); ctx.moveTo(-40, -290); ctx.lineTo(260, -290); ctx.lineTo(310, -245); ctx.lineTo(260, -200); ctx.lineTo(-40, -200); ctx.closePath(); fs(ctx, P.navy, OUT, 6); logo(ctx, 125, -245, 46, { shadow: false }); ctx.restore(); }
function serverRack(ctx, x, y, w, h, t, o = {}) {
  rr(ctx, x, y, w, h, 12); fs(ctx, '#1e293b', OUT, 6);
  const n = Math.floor((h - 30) / 46);
  for (let i = 0; i < n; i++) { const yy = y + 15 + i * 46; rr(ctx, x + 14, yy, w - 28, 38, 6); fs(ctx, '#0f172a', '#334155', 2); for (let l = 0; l < 3; l++) { const on = hash(i * 13 + l + Math.floor(t * 8 + i)) > 0.4; circ(ctx, x + w - 34 - l * 18, yy + 19, 5); fs(ctx, on ? (l ? P.cyan : P.green) : '#1e293b'); } for (let s2 = 0; s2 < 4; s2++) line(ctx, x + 28 + s2 * 14, yy + 10, x + 28 + s2 * 14, yy + 28, '#334155', 4); }
}
function storefront(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -260, -380, 520, 380, 12); fs(ctx, '#fef3c7', OUT, 6);
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-260 + i * 65, -380); ctx.lineTo(-260 + (i + 1) * 65, -380); ctx.lineTo(-260 + (i + 1) * 65, -320); ctx.quadraticCurveTo(-260 + (i + 0.5) * 65, -290, -260 + i * 65, -320); ctx.closePath(); fs(ctx, i % 2 ? '#fff' : P.red, OUT, 4); }
  rr(ctx, -150, -470, 300, 80, 12); fs(ctx, P.navy, OUT, 6); text(ctx, 'TOKO ONLINE', 0, -428, { size: 40, color: P.cyan, font: 'BG800' });
  for (let i = 0; i < 3; i++) { rr(ctx, -200 + i * 140, -170 - (i % 2) * 40, 110, 90, 8); fs(ctx, '#d6a35c', OUT, 5); line(ctx, -145 + i * 140, -170 - (i % 2) * 40, -145 + i * 140, -80 - (i % 2) * 40, '#a16207', 6); }
  ctx.restore();
}
function camera(ctx, x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -60, -40, 120, 80, 14); fs(ctx, '#1e293b', OUT, 5); rr(ctx, -30, -56, 40, 20, 5); fs(ctx, '#334155', OUT, 4); circ(ctx, 10, 0, 30); fs(ctx, '#0f172a', OUT, 5); circ(ctx, 10, 0, 17); fs(ctx, '#38bdf8'); circ(ctx, 4, -6, 6); fs(ctx, '#fff'); ctx.restore(); }
function barChart(ctx, x, y, w, h, k, t, o = {}) {
  const n = o.n || 6; const bw = w / n;
  for (let i = 0; i < n; i++) { const a = E.back(clamp(k * n - i)); const hh = h * (0.18 + 0.82 * (i + 1) / n) * a; rr(ctx, x + i * bw + 12, y - hh, bw - 24, hh, 12); fs(ctx, i === n - 1 ? P.cyan : mixC(P.cyan6, P.cyan, i / n), OUT, 6); }
  line(ctx, x - 20, y, x + w + 20, y, OUT, 8);
}
function mug(ctx, x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -40, -60, 80, 80, 14); fs(ctx, '#fff', OUT, 5); ctx.beginPath(); ctx.arc(44, -22, 20, -1.4, 1.4); fs(ctx, null, OUT, 12); ctx.beginPath(); ctx.arc(44, -22, 20, -1.4, 1.4); fs(ctx, null, '#fff', 6); circ(ctx, 0, -24, 14); fs(ctx, P.cyan); ICON.bolt(ctx, 0, -24, 18, '#fff'); for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.7; ctx.beginPath(); ctx.moveTo(-14 + i * 14, -70 - ph * 60); ctx.quadraticCurveTo(-4 + i * 14, -84 - ph * 60, -14 + i * 14, -100 - ph * 60); fs(ctx, null, '#fff', 5); ctx.globalAlpha = 1; } ctx.restore(); }
function poof(ctx, x, y, k, s = 1) { if (k <= 0 || k >= 1) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = 1 - k; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const d = 40 + k * 160; circ(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.8, 60 * (1 - k * 0.5)); fs(ctx, '#ffffff', OUT, 4); } for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3; sparkle(ctx, Math.cos(a) * (120 + k * 160), Math.sin(a) * (120 + k * 160), 22, P.yellow); } ctx.restore(); }

module.exports = { logo, phone, laptop, socialScreen, uploadScreen, reminderScreen, boosteryukScreen, growthScreen, dashScreen, avatar, fmt, chip, card, stamp, bubble, toast, rocket, speedometer, shieldBig, trophy, plant, wateringCan, mic, micAt, ringLight, tripodPhone, whiteboard, target, dart, bigClock, signpost, serverRack, storefront, camera, barChart, mug, poof };
