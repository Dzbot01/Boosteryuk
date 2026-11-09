const { createCanvas, P, text } = require('../src/engine');
const C = require('../src/character');
const fs = require('fs');
const cv = createCanvas(1920, 1080), ctx = cv.getContext('2d');
ctx.fillStyle = '#fde7c8'; ctx.fillRect(0, 0, 1920, 1080);
const ex = ['neutral','happy','grin','laugh','sad','cry','surprised','shocked','determined','sleepy','yawn','excited','love','wink','worried','smug'];
ex.forEach((e, i) => {
  const x = 120 + (i % 8) * 240, y = 470 + Math.floor(i / 8) * 520;
  const extra = i===5?{fx:{tears:1}}:i===14?{fx:{sweat:1}}:{};
  C.drawChar(ctx, Object.assign({ x, y, s: 0.95, expr: e, t: 1.0, turn: (i%3-1)*0.3, armR:{x:30,y:20,bend:-1,hand:['open','fist','point','thumb','peace','ok'][i%6]} }, extra));
  text(ctx, e, x, y + 40, { size: 26, color: P.navy });
});
fs.writeFileSync(process.argv[2], cv.toBuffer('image/png'));
