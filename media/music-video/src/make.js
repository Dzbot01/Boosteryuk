'use strict';
// Full build: parallel shot render -> concat (-c copy) -> mux audio -> export cleaned SRT.
// Usage: node src/make.js [--workers 2] [--only i,j,k]
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { shots, FRAMES, DURATION } = require('./timeline');
const { srt } = require('./subtitles');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const args = process.argv.slice(2);
const workers = Number(args[args.indexOf('--workers') + 1]) || 2;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',').map(Number) : null;

function run(cmd, a) { return new Promise((res, rej) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('close', c => (c === 0 ? res() : rej(new Error(cmd + ' exit ' + c)))); }); }

(async () => {
  const t0 = Date.now();
  const todo = (only || shots.map(s => s.idx));
  // greedy balance by frame count
  const bins = Array.from({ length: workers }, () => ({ n: 0, ids: [] }));
  [...todo].sort((a, b) => (shots[b].f1 - shots[b].f0) - (shots[a].f1 - shots[a].f0)).forEach(i => { const b = bins.reduce((m, x) => (x.n < m.n ? x : m)); b.ids.push(i); b.n += shots[i].f1 - shots[i].f0; });
  await Promise.all(bins.filter(b => b.ids.length).map(b => run('node', [path.join(__dirname, 'render.js'), ...b.ids.sort((x, y) => x - y).map(String)])));
  console.log(`render done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const list = shots.map(s => `file '${path.join(OUT, 'shots', String(s.idx).padStart(3, '0') + '.mp4')}'`).join('\n');
  fs.writeFileSync(path.join(OUT, 'concat.txt'), list + '\n');
  const silent = path.join(OUT, 'video_silent.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'concat.txt'), '-c', 'copy', silent]);
  const final = path.join(OUT, 'Boosteryuk_Official_Music_Video_1080p.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', path.join(ROOT, 'assets', 'song.mp3'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    '-metadata', 'title=Boosteryuk - Official Music Video', final]);
  fs.writeFileSync(path.join(OUT, 'Boosteryuk_lirik_ID.srt'), srt());
  console.log('final:', final, `expected frames ${FRAMES}, duration ${DURATION}s, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})().catch(e => { console.error(e); process.exit(1); });
