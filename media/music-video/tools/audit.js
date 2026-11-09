'use strict';
// Automated QA of the final video: streams, duration, frame count, A/V length, black/white flashes, subtitle cue integrity.
const { execFileSync } = require('child_process');
const path = require('path');
const { FRAMES, DURATION, shots } = require('../src/timeline');
const { CUES } = require('../src/subtitles');

const file = process.argv[2] || path.join(__dirname, '..', 'out', 'Boosteryuk_Official_Music_Video_1080p.mp4');
const R = [];
const ok = (name, pass, detail) => R.push({ name, pass, detail });
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', file]).toString());
const v = probe.streams.find(s => s.codec_type === 'video'), a = probe.streams.find(s => s.codec_type === 'audio');
ok('Video 1920x1080 H.264', v && v.width === 1920 && v.height === 1080 && v.codec_name === 'h264', `${v.codec_name} ${v.width}x${v.height} ${v.pix_fmt}`);
ok('30 fps CFR', v.r_frame_rate === '30/1' && v.avg_frame_rate === '30/1', `r=${v.r_frame_rate} avg=${v.avg_frame_rate}`);
const nf = Number(v.nb_read_frames);
ok('Frame count vs song', Math.abs(nf - FRAMES) <= 1, `${nf} frames (target ${FRAMES})`);
ok('Audio AAC stereo', a && a.codec_name === 'aac' && a.channels === 2, `${a.codec_name} ${a.channels}ch ${a.sample_rate}Hz`);
const vd = Number(v.duration), ad = Number(a.duration);
ok('Duration = song (±0.05 s)', Math.abs(Number(probe.format.duration) - DURATION) < 0.05, `container ${Number(probe.format.duration).toFixed(3)} s, video ${vd.toFixed(3)}, audio ${ad.toFixed(3)}, song ${DURATION}`);
ok('Shot frames sum', shots.reduce((s, x) => s + x.f1 - x.f0, 0) === FRAMES, `${shots.length} shots`);
// subtitle cues: ordered, non-overlapping, <=2 lines, <=42 chars/line
let cueOk = true, worst = 0;
CUES.forEach((c, i) => { const lines = c[2].split('\n'); worst = Math.max(worst, ...lines.map(l => l.length)); if (lines.length > 2 || c[1] <= c[0] || (i && c[0] < CUES[i - 1][1] - 1e-6)) cueOk = false; });
ok('Subtitle cues ordered, ≤2 lines', cueOk, `${CUES.length} cues`);
ok('Subtitle ≤42 chars/line', worst <= 42, `longest line ${worst} chars`);
// black / white full frames
let bdErr = ''; try { bdErr = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" -vf "blackdetect=d=0.1:pix_th=0.08" -an -f null - 2>&1 | grep black_start || true`]).toString(); } catch (e) { bdErr = String(e); }
const blacks = bdErr.trim().split('\n').filter(Boolean).map(l => l.replace(/.*black_start:/, 'start:'));
ok('No black segments except intended fade', blacks.every(l => { const s = Number((l.match(/start:([\d.]+)/) || [])[1]); return s < 0.7 || s > 231; }), blacks.join(' | ') || 'none');
let wh = ''; try { wh = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" -vf "negate,blackdetect=d=0.15:pix_th=0.06" -an -f null - 2>&1 | grep black_start || true`]).toString(); } catch (e) { wh = String(e); }
ok('No sustained white frames (>0.15 s)', !wh.trim(), wh.trim() || 'none');
const pass = R.filter(r => r.pass).length;
console.log(R.map(r => `${r.pass ? 'PASS' : 'FAIL'} | ${r.name} | ${r.detail}`).join('\n'));
console.log(`\n${pass}/${R.length} checks passed`);
process.exit(pass === R.length ? 0 : 1);
