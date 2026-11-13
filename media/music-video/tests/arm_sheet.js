// Visual regression sheet for anatomical arm/leg IK and mic placement.
const { createCanvas, P, text, loadAssets } = require('../src/engine');
const C = require('../src/character');
const fs = require('fs');
(async () => {
  await loadAssets();
  const cv = createCanvas(1920, 1080), ctx = cv.getContext('2d');
  ctx.fillStyle = '#e8f1fb'; ctx.fillRect(0, 0, 1920, 1080);
  const U = require('../src/ui');
  const poses = [
    ['santai', {}],
    ['lambai', { armR: { x: 74, y: -96, hand: 'open' }, expr: 'happy' }],
    ['tunjuk', { armR: { x: 120, y: -40, hand: 'point' }, turn: 0.3 }],
    ['pegang HP', { armL: { x: 44, y: 82, hand: 'hold' }, look: [0, 0.8], headTilt: 0.1, hold: { L: (c, x, y) => U.phone(c, x + 24, y - 32, 64, 118, 0.08, { back: true }) } }],
    ['nyanyi (mic)', { mic: 'R', talk: 0.6, expr: 'happy', armL: { x: -90, y: -80, hand: 'open' } }],
    ['tangan ke atas', { armL: { x: -50, y: -112, hand: 'open' }, armR: { x: 50, y: -112, hand: 'open' }, expr: 'joy' }],
    ['kepal ke atas', { armR: { x: 34, y: -106, hand: 'fist' }, expr: 'determined' }],
    ['jempol', { armR: { x: 40, y: -60, hand: 'thumb' }, expr: 'wink' }],
    ['pegang hati', { armL: { x: 56, y: -10, hand: 'open' }, armR: { x: -56, y: -10, hand: 'open' }, expr: 'happy' }],
    ['kucek mata', { armR: { x: -18, y: -80, hand: 'fist' }, expr: 'sleepy' }],
    ['garuk kepala', { armR: { x: -14, y: -118, hand: 'fist' }, expr: 'confused' }],
    ['lari', Object.assign({ turn: 0.85, expr: 'fierce' }, C.runPose(30))],
    ['jalan', Object.assign({ turn: 0.85 }, C.walkPose(20))],
    ['ta-da', { armL: { x: -110, y: -50, hand: 'open' }, armR: { x: 110, y: -50, hand: 'open' }, expr: 'grin' }],
    ['tangan di pipi', { armL: { x: 50, y: -20, hand: 'open' }, armR: { x: -50, y: -20, hand: 'open' }, expr: 'excited' }],
    ['jongkok', { crouch: 40, armL: { x: -50, y: 50, hand: 'fist' }, armR: { x: 50, y: 50, hand: 'fist' }, expr: 'fierce' }],
  ];
  poses.forEach(([n, p], i) => {
    const x = 120 + (i % 8) * 240, y = 470 + Math.floor(i / 8) * 520;
    C.drawChar(ctx, Object.assign({ x, y, s: 0.95, t: 1.0, blink: false }, p));
    text(ctx, n, x, y + 40, { size: 24, color: P.navy });
  });
  fs.writeFileSync(process.argv[2], cv.toBuffer('image/png'));
})();
