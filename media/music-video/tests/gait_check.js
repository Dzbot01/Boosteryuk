// Numeric QA: (1) planted-foot world slip, (2) IK reach gap (foot target unreachable -> floating foot).
const C = require('../src/character');
function check(name, poseAt, xAt, s, dur) {
  let maxGap = 0, maxSlip = 0, maxDrop = 0, prev = {};
  for (let t = 0; t <= dur; t += 1 / 120) {
    const pose = C.resolve(Object.assign({ turn: 0.85, x: 0, y: 0 }, poseAt(t)));
    for (const k of ['legL', 'legR']) {
      const leg = pose[k]; const planted = leg.y === 0 && Math.abs(leg.pitch || 0) < 0.01;
      const wx = xAt(t) + s * leg.x;
      if (planted && prev[k] && prev[k].planted) maxSlip = Math.max(maxSlip, Math.abs(wx - prev[k].wx));
      prev[k] = { planted, wx };
    }
    const g = C._geo(pose);
    for (const [k, lk] of [['L', 'legL'], ['R', 'legR']]) { if (pose[lk].y >= -1) maxGap = Math.max(maxGap, g.legs[k].gap); } maxDrop = Math.max(maxDrop, g.drop);
  }
  console.log(`${name.padEnd(12)} slip/frame(120fps) max ${maxSlip.toFixed(3)} px | planted-foot reach gap max ${maxGap.toFixed(2)} units | pelvis drop max ${maxDrop.toFixed(1)}`);
}
check('walk', t => C.walkPose(136 * t, { step: 68 }), t => 136 * 1.1 * t, 1.1, 3);
check('walk-calm', t => C.walkPose(100 * t, { step: 60 }), t => 100 * t, 1, 3);
check('run', t => C.runPose(301 * t), t => 301 * 1.1 * t, 1.1, 3);
