// Visual check: walk & run cycles (8 phases each), front stance feet, hair turnaround.
const { createCanvas, P, text, line, loadAssets } = require('../src/engine');
const C = require('../src/character');
const fs = require('fs');
(async () => {
  await loadAssets();
  const cv = createCanvas(1920, 1080), ctx = cv.getContext('2d');
  ctx.fillStyle = '#eef4fb'; ctx.fillRect(0, 0, 1920, 1080);
  for (const gy of [330, 690]) line(ctx, 0, gy, 1920, gy, '#94a3b8', 3);
  const N = 8;
  for (let i = 0; i < N; i++) {
    const wd = (i / N) * 136, rd = (i / N) * 224;
    C.drawChar(ctx, Object.assign({ x: 130 + i * 235, y: 330, s: 0.72, t: 1, turn: 0.85, blink: false, expr: 'calm', shadow: 0.6 }, C.walkPose(wd)));
    C.drawChar(ctx, Object.assign({ x: 130 + i * 235, y: 690, s: 0.72, t: 1, turn: 0.85, blink: false, expr: 'fierce', shadow: 0.6 }, C.runPose(rd)));
    text(ctx, `jalan ${i + 1}/8`, 130 + i * 235, 352, { size: 18, color: P.navy });
    text(ctx, `lari ${i + 1}/8`, 130 + i * 235, 712, { size: 18, color: P.navy });
  }
  [-0.9, -0.45, 0, 0.45, 0.9].forEach((tn, i) => { C.drawChar(ctx, { x: 200 + i * 380, y: 1050, s: 0.72, t: 1, turn: tn, expr: 'happy', blink: false }); });
  fs.writeFileSync(process.argv[2], cv.toBuffer('image/png'));
})();
