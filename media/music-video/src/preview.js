'use strict';
// Usage: node src/preview.js [--sheet name] t1 t2 ...   (times in seconds)
const fs = require('fs');
const path = require('path');
const { createCanvas, W, H, text } = require('./engine');
const { drawFrame, shotAt } = require('./timeline');

const args = process.argv.slice(2);
let sheet = null; if (args[0] === '--sheet') { sheet = args[1]; args.splice(0, 2); }
const times = args.map(Number);
const out = path.join(__dirname, '..', 'out', 'preview'); fs.mkdirSync(out, { recursive: true });
const cv = createCanvas(W, H), ctx = cv.getContext('2d');
if (!sheet) {
  for (const t of times) { drawFrame(ctx, t); const f = path.join(out, `f_${t.toFixed(2)}.png`); fs.writeFileSync(f, cv.toBuffer('image/png')); console.log(f, shotAt(t).name); }
} else {
  const cols = 4, tw = 480, th = 270, rows = Math.ceil(times.length / cols);
  const sc = createCanvas(cols * tw, rows * (th + 30)), sx = sc.getContext('2d'); sx.fillStyle = '#111'; sx.fillRect(0, 0, sc.width, sc.height);
  times.forEach((t, i) => { drawFrame(ctx, t); const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30); sx.drawImage(cv, x, y, tw, th); text(sx, `${t.toFixed(1)}s ${shotAt(t).name}`, x + 6, y + th + 15, { size: 18, align: 'left', font: 'PJS700', color: '#fff' }); });
  const f = path.join(out, `sheet_${sheet}.png`); fs.writeFileSync(f, sc.toBuffer('image/png')); console.log(f);
}
