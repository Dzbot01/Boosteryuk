'use strict';
// Timeline driver: shot list -> frame. Shots are snapped to the nearest beat (±0.2 s) so cuts land on the music.
const { W, H, FPS, E, lerp, clamp, snapBeat, vignette } = require('./engine');
const { drawSubs } = require('./subtitles');

const DURATION = 233.712; // seconds, from ffprobe of assets/song.mp3
const FRAMES = Math.ceil(DURATION * FPS);

const raw = [...require('./shots1'), ...require('./shots2')].sort((a, b) => a.at - b.at);
const shots = raw.map((s, i) => Object.assign({}, s, { idx: i, start: i === 0 ? 0 : snapBeat(s.at, 0.2) }));
shots.forEach((s, i) => { s.end = i < shots.length - 1 ? shots[i + 1].start : DURATION; });
// frame ranges (inclusive start, exclusive end)
shots.forEach(s => { s.f0 = Math.round(s.start * FPS); s.f1 = Math.round(s.end * FPS); });
shots[shots.length - 1].f1 = FRAMES;

function shotAt(t) { let lo = 0; for (let i = 0; i < shots.length; i++) if (shots[i].start <= t + 1e-6) lo = i; return shots[lo]; }

function drawFrame(ctx, t, o = {}) {
  const s = shotAt(t); const lt = t - s.start;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (s.trans === 'zoom' && lt < 0.3) { const z = lerp(1.12, 1, E.out(lt / 0.3)); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
  s.draw(ctx, lt, t, s.end - s.start);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, 0.26);
  if (o.subs !== false) drawSubs(ctx, t);
}

module.exports = { shots, drawFrame, DURATION, FRAMES, shotAt };
