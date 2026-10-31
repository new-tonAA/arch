import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry,
  poly, text, measure, rgba, F, makeCanvas
} from '../common.js';

const CREAM = '#f7efdd';
const INK = '#17131f';
const PINK = '#f4a6b8', MINT = '#8fd3c7', YELLOW = '#f6d365', COBALT = '#3d5afe', RED = '#ff5a5f', LILAC = '#c9b6e4';

let grain;
function init() {
  if (grain) return;
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = hash(i * .67) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 14; }
  g.putImageData(im, 0, 0);
}
init();

function pop(t, t0, dur = .35) { return back(clamp((t - t0) / dur, 0, 1), 2.6); }

function cam(t) {
  const u = ss(seg(t, 77, 86));
  const bob = Math.sin((t - 77) * 1.6) * .012 * u;
  const rot = Math.sin((t - 77) * 1.1) * .012 * u;
  let s = 1 + .03 * u;
  if (t > 86.5) s = lerp(s, .93, eio(seg(t, 86.5, 89)));
  return { s, rot, bob };
}

function frame(ctx, t) {
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.strokeRect(336, 255, 1248, 612);
}

function pediment(ctx, t) {
  const p = pop(t, 77.25, .5);
  if (p <= 0) return;
  ctx.save(); ctx.translate(960, 300); ctx.scale(p, p); ctx.translate(-960, -300);
  // broken pediment: two halves, gap in the middle
  ctx.lineWidth = 5; ctx.strokeStyle = INK;
  const L = [[360, 300], [360, 262], [880, 132], [880, 300]];
  const R = [[1040, 300], [1040, 132], [1560, 262], [1560, 300]];
  ctx.fillStyle = PINK; poly(ctx, L); ctx.fill(); ctx.stroke();
  ctx.fillStyle = YELLOW; poly(ctx, R); ctx.fill(); ctx.stroke();
  // inner rules
  ctx.lineWidth = 2;
  poly(ctx, [[392, 292], [392, 268], [858, 164], [858, 292]]); ctx.stroke();
  poly(ctx, [[1062, 292], [1062, 164], [1528, 268], [1528, 292]]); ctx.stroke();
  // floating sphere in the gap
  const bob = Math.sin(t * 2.2) * 8;
  ctx.fillStyle = COBALT; ctx.beginPath(); ctx.arc(960, 196 + bob, 34, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(948, 184 + bob, 10, 0, 7); ctx.fill();
  ctx.restore();
}

function frieze(ctx, t) {
  const p = pop(t, 77.4, .4);
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, p);
  ctx.fillStyle = CREAM; ctx.fillRect(380, 300, 1160, 66);
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(380, 300, 1160, 66);
  const n = 24, w = 1160 / n;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) continue;
    ctx.fillStyle = INK; ctx.fillRect(380 + i * w, 306, w, 54);
  }
  ctx.fillStyle = MINT; ctx.fillRect(820, 300, 280, 66);
  ctx.strokeRect(820, 300, 280, 66);
  text(ctx, 'POST  ·  MODERN', 960, 344, { size: 22, font: F.bahn, weight: '700', color: INK, align: 'center', spacing: 4 });
  ctx.restore();
}

function wing(ctx, t, side) {
  const p = pop(t, 77.45 + (side > 0 ? .08 : 0), .5);
  if (p <= 0) return;
  ctx.save(); ctx.translate(side * 960 + 960, 600); ctx.scale(p, p); ctx.translate(-(side * 960 + 960), -600);
  const x0 = side < 0 ? 380 : 1160, x1 = side < 0 ? 760 : 1540;
  ctx.fillStyle = side < 0 ? LILAC : MINT;
  ctx.fillRect(x0, 366, x1 - x0, 500);
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(x0, 366, x1 - x0, 500);
  // candy pilasters
  for (let i = 0; i < 2; i++) {
    const x = side < 0 ? x0 + 26 + i * 316 : x0 + 26 + i * 316;
    ctx.fillStyle = CREAM; ctx.fillRect(x, 380, 34, 470);
    ctx.strokeRect(x, 380, 34, 470);
    ctx.save(); ctx.beginPath(); ctx.rect(x, 380, 34, 470); ctx.clip();
    for (let y = 380; y < 850; y += 34) {
      ctx.fillStyle = i ? PINK : COBALT; ctx.fillRect(x, y, 34, 17);
    }
    ctx.restore();
  }
  // square windows with zigzag pediments
  const wx = side < 0 ? x0 + 96 : x0 + 96;
  for (let i = 0; i < 2; i++) {
    const x = wx + i * 150;
    ctx.fillStyle = side < 0 ? YELLOW : PINK; ctx.fillRect(x, 470, 104, 120);
    ctx.strokeRect(x, 470, 104, 120);
    // muntins
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 52, 470); ctx.lineTo(x + 52, 590); ctx.moveTo(x, 530); ctx.lineTo(x + 104, 530); ctx.stroke();
    ctx.lineWidth = 4;
    // zigzag lintel
    ctx.beginPath(); ctx.moveTo(x - 12, 462);
    for (let k = 0; k <= 4; k++) ctx.lineTo(x - 12 + k * 32, 462 - (k % 2 ? 14 : 0));
    ctx.stroke();
  }
  // terrazzo dots
  const R = mulberry(side < 0 ? 5 : 9);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = [COBALT, RED, YELLOW, MINT, INK][i % 5];
    const x = x0 + 14 + R() * (x1 - x0 - 28), y = 650 + R() * 190;
    ctx.beginPath(); ctx.arc(x, y, 2 + R() * 5, 0, 7); ctx.fill();
  }
  // squiggle
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, x = x0 + 20 + u * (x1 - x0 - 40), y = 810 + Math.sin(u * Math.PI * 6) * 14;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function portal(ctx, t) {
  const p = pop(t, 77.6, .5);
  if (p <= 0) return;
  ctx.save(); ctx.translate(960, 610); ctx.scale(p, p); ctx.translate(-960, -610);
  const x0 = 790, x1 = 1130, y0 = 380, y1 = 866;
  // portal wall
  ctx.fillStyle = CREAM; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // checked flanks
  for (let j = 0; j < 8; j++) for (let i = 0; i < 2; i++) {
    if ((i + j) % 2) { ctx.fillStyle = INK; ctx.fillRect(x0 + i * 30 + 8, y0 + 20 + j * 56, 28, 54); }
    ctx.fillStyle = (i + j) % 2 ? PINK : COBALT;
    if ((i + j) % 2 === 0) ctx.fillRect(x0 + i * 30 + 8, y0 + 20 + j * 56, 28, 54);
  }
  for (let j = 0; j < 8; j++) for (let i = 0; i < 2; i++) {
    if ((i + j) % 2 === 0) { ctx.fillStyle = YELLOW; ctx.fillRect(x1 - 68 + i * 30, y0 + 20 + j * 56, 28, 54); }
  }
  // circular window
  const cx = 960, cy = 560, r = 128;
  ctx.fillStyle = COBALT; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke();
  ctx.lineWidth = 3;
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.stroke();
  ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill();
  // the wink: a cream lid slides down from the top
  const wink = ss(seg(t, 84.2, 84.7)) * (1 - ss(seg(t, 85.0, 85.6)));
  if (wink > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, 7); ctx.clip();
    ctx.fillStyle = CREAM;
    ctx.beginPath(); ctx.ellipse(cx, cy - r + r * 2.05 * wink, r, r * .92, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - r + 10, cy + 20 * wink); ctx.quadraticCurveTo(cx, cy + 44 * wink, cx + r - 10, cy + 20 * wink); ctx.stroke();
    ctx.restore();
  }
  // lashes
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath(); ctx.moveTo(cx + k * 44, cy - r - 4); ctx.lineTo(cx + k * 54, cy - r - 26); ctx.stroke();
  }
  // ticket label
  ctx.save(); ctx.translate(960, 790); ctx.rotate(-.02);
  ctx.fillStyle = YELLOW; ctx.fillRect(-150, -28, 300, 56); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-150, -28, 300, 56);
  text(ctx, 'MORE IS MORE', 0, 9, { size: 26, font: F.bahn, weight: '700', color: INK, align: 'center', spacing: 4 });
  ctx.restore();
  ctx.restore();
}

function floor(ctx, t) {
  const p = pop(t, 77.2, .5);
  if (p <= 0) return;
  ctx.save();
  ctx.fillStyle = CREAM; ctx.fillRect(0, 866, W, H - 866);
  // checkerboard floor in one-point perspective
  const vx = 960, vy = 700;
  for (let i = -18; i <= 18; i++) {
    for (let j = 0; j < 6; j++) {
      if ((i + j) % 2 === 0) continue;
      const y0 = 866 + j * 34, y1 = y0 + 34;
      const w0 = 70 * (1 + (y0 - 866) / 400), w1 = 70 * (1 + (y1 - 866) / 400);
      const x0 = vx + i * w0, x1 = x0 + w0;
      const x2 = vx + (i + 1) * w1;
      ctx.fillStyle = INK;
      poly(ctx, [[x0, y0], [x1, y0], [x2, y1], [x2 - (x1 - x0), y1]]); ctx.fill();
    }
  }
  ctx.restore();
}

function floaters(ctx, t) {
  const items = [
    { x: 250, y: 240, r: 46, c: RED, t: 80.0, kind: 'circle' },
    { x: 1680, y: 330, r: 38, c: COBALT, t: 80.4, kind: 'tri' },
    { x: 225, y: 620, r: 54, c: YELLOW, t: 81.0, kind: 'circle' },
    { x: 1700, y: 700, r: 44, c: PINK, t: 81.6, kind: 'square' },
    { x: 340, y: 980, r: 0, c: MINT, t: 82.2, kind: 'zig' },
    { x: 1580, y: 980, r: 0, c: LILAC, t: 82.8, kind: 'zig' },
  ];
  for (const it of items) {
    const p = pop(t, it.t, .4);
    if (p <= 0) continue;
    const drift = Math.sin(t * 1.4 + it.x) * 6;
    ctx.save(); ctx.translate(it.x, it.y + drift); ctx.scale(p, p); ctx.rotate(Math.sin(t + it.x) * .05);
    ctx.fillStyle = it.c; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    if (it.kind === 'circle') { ctx.beginPath(); ctx.arc(0, 0, it.r, 0, 7); ctx.fill(); ctx.stroke(); }
    if (it.kind === 'tri') { poly(ctx, [[0, -it.r], [it.r, it.r], [-it.r, it.r]]); ctx.fill(); ctx.stroke(); }
    if (it.kind === 'square') { ctx.fillRect(-it.r, -it.r, it.r * 2, it.r * 2); ctx.strokeRect(-it.r, -it.r, it.r * 2, it.r * 2); }
    if (it.kind === 'zig') {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const x = -80 + i * 20, y = (i % 2 ? -20 : 20); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
}

function explode(ctx, t) {
  const u = ss(seg(t, 87.0, 89.0));
  if (u <= 0) return;
  const R = mulberry(71);
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const x0 = 300 + R() * 1320, y0 = 200 + R() * 760;
    const a = R() * Math.PI * 2, sp = 60 + R() * 300;
    const x = x0 + Math.cos(a) * sp * u + R() * 40;
    const y = y0 + Math.sin(a) * sp * u + 260 * u * u;
    const s = (1 - u) * (6 + R() * 22);
    ctx.globalAlpha = (1 - u) * .9;
    ctx.fillStyle = [PINK, MINT, YELLOW, COBALT, RED, INK][i % 6];
    ctx.save(); ctx.translate(x, y); ctx.rotate(u * (R() - .5) * 7);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  ctx.restore();
  // darken for the cut to data
  ctx.save(); ctx.globalAlpha = u * .92; ctx.fillStyle = '#06090e'; ctx.fillRect(0, 0, W, H); ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { s, rot, bob } = cam(t);
  ctx.save();
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  // background confetti arcs
  ctx.save(); ctx.globalAlpha = .14;
  ctx.strokeStyle = RED; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.arc(120, 1040, 260, 0, 7); ctx.stroke();
  ctx.strokeStyle = COBALT; ctx.beginPath(); ctx.arc(1820, 80, 220, 0, 7); ctx.stroke();
  ctx.restore();
  ctx.translate(W / 2, H / 2 + bob * 100); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  floor(ctx, t);
  wing(ctx, t, -1);
  wing(ctx, t, 1);
  frame(ctx, t);
  pediment(ctx, t);
  frieze(ctx, t);
  portal(ctx, t);
  floaters(ctx, t);
  explode(ctx, t);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
