'use strict';
// Render shots to individual H.264 files. Usage: node src/render.js <idx> [idx...]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createCanvas, W, H, FPS } = require('./engine');
const { shots, drawFrame } = require('./timeline');

const OUT = path.join(__dirname, '..', 'out', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-g', '60', '-r', String(FPS)];

async function renderShot(s, ctx) {
  const final = path.join(OUT, `${String(s.idx).padStart(3, '0')}.mp4`);
  const tmp = final.replace(/\.mp4$/, '.part.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', ...ENC, tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exit ${c} on shot ${s.idx}`)))));
  for (let f = s.f0; f < s.f1; f++) {
    drawFrame(ctx, f / FPS);
    const d = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(d.buffer, d.byteOffset, d.byteLength))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done; fs.renameSync(tmp, final);
}

(async () => {
  await require('./engine').loadAssets();
  const ids = process.argv.slice(2).map(Number);
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  for (const i of ids) {
    const t0 = Date.now(); await renderShot(shots[i], ctx);
    console.log(`shot ${i} ${shots[i].name} frames=${shots[i].f1 - shots[i].f0} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
})().catch(e => { console.error(e); process.exit(1); });
