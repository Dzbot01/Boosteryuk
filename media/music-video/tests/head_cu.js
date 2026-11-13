const { createCanvas, loadAssets } = require('../src/engine');
const C = require('../src/character'); const fs = require('fs');
(async () => { await loadAssets(); const cv = createCanvas(1920, 1080), ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1920, 1080);
  [['neutral', 0], ['happy', -0.5], ['sad', 0.5], ['determined', 0]].forEach(([e, tn], i) => C.drawHeadAt(ctx, 260 + i * 470, 560, 2.0, 0, { expr: e, turn: tn, t: 1, blink: false }));
  fs.writeFileSync(process.argv[2], cv.toBuffer('image/png')); })();
