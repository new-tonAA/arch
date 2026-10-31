import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry,
  paperTexture, poly, taper, hatch, text, measure, rgba, F, makeCanvas
} from '../common.js';

const INK = '#1c1510';
const PAPER = '#f1e8d2';
let paper, grain;

function init() {
  if (paper) return;
  paper = paperTexture(2880, 1620, 31, PAPER, '#e4d6b8');
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = hash(i * .73) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 16; }
  g.putImageData(im, 0, 0);
}
init();

function edge(ctx, a, b, w, p) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([lerp(a[0], b[0], u) + Math.sin(u * 8) * .4, lerp(a[1], b[1], u)]); }
  taper(ctx, pts, w, w * .75, p, INK);
}

function column(ctx, t) {
  const cx = 600;
  const t0 = 102.6;
  const top = 320, bot = 840;
  const shaft = [[cx - 58, top], [cx + 58, top], [cx + 64, bot], [cx - 64, bot]];
  ctx.fillStyle = PAPER; poly(ctx, shaft); ctx.fill();
  // flutes
  for (let f = 0; f < 9; f++) {
    const u = f / 8, x = lerp(cx - 50, cx + 50, u);
    taper(ctx, [[x, top + 8], [x + (u - .5) * 8, bot - 6]], .9, 1.3, ss(seg(t, t0 + .3 + f * .03, t0 + 1.4 + f * .03)), INK);
  }
  // shadow right side
  hatch(ctx, [[cx + 12, top], [cx + 58, top], [cx + 64, bot], [cx + 14, bot]], { angle: 1.31, spacing: 4.2, width: 1.5, progress: ss(seg(t, t0 + .7, t0 + 2.2)), phase: 3 });
  hatch(ctx, [[cx + 12, top], [cx + 58, top], [cx + 64, bot], [cx + 14, bot]], { angle: .63, spacing: 6.5, width: 1.0, progress: ss(seg(t, t0 + 1.6, t0 + 2.8)), phase: 5 });
  // capital
  const ab = [[cx - 76, top - 38], [cx + 76, top - 38], [cx + 76, top - 18], [cx - 76, top - 18]];
  const ech = [[cx - 76, top - 18], [cx + 76, top - 18], [cx + 58, top], [cx - 58, top]];
  ctx.fillStyle = PAPER; poly(ctx, ab); ctx.fill(); poly(ctx, ech); ctx.fill();
  hatch(ctx, [[cx + 6, top - 38], [cx + 76, top - 38], [cx + 58, top], [cx + 10, top]], { angle: 1.28, spacing: 4, width: 1.3, progress: ss(seg(t, t0 + .4, t0 + 1.4)), phase: 2 });
  // necking rings
  for (let i = 0; i < 3; i++) { const y = top + 4 + i * 7; edge(ctx, [cx - 52, y], [cx + 52, y], 1.2, ss(seg(t, t0 + .5 + i * .05, t0 + 1 + i * .05))); }
  // base
  const b1 = [[cx - 66, bot], [cx + 66, bot], [cx + 72, bot + 20], [cx - 72, bot + 20]];
  const b2 = [[cx - 82, bot + 20], [cx + 82, bot + 20], [cx + 82, bot + 42], [cx - 82, bot + 42]];
  ctx.fillStyle = PAPER; poly(ctx, b1); ctx.fill(); poly(ctx, b2); ctx.fill();
  hatch(ctx, [[cx + 6, bot], [cx + 66, bot], [cx + 72, bot + 20], [cx + 10, bot + 20]], { angle: 1.31, spacing: 4, width: 1.2, progress: ss(seg(t, t0 + .6, t0 + 1.5)), phase: 8 });
  // outlines
  for (const [a, b, w, d] of [[[cx - 58, top], [cx - 64, bot], 2.2, 0], [[cx + 58, top], [cx + 64, bot], 2.4, .1], [[cx, top], [cx, bot], 1, .2]]) edge(ctx, a, b, w, ss(seg(t, t0 + d, t0 + 1.2 + d)));
  poly(ctx, ab); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.globalAlpha = ss(seg(t, t0 + .6, t0 + 1.2)); ctx.stroke();
  poly(ctx, ech); ctx.stroke();
  poly(ctx, b1); ctx.stroke(); poly(ctx, b2); ctx.stroke(); ctx.globalAlpha = 1;
  // cast shadow
  hatch(ctx, [[cx + 70, 850], [cx + 220, 850], [cx + 300, 930], [cx + 80, 930]], { angle: .72, spacing: 5, width: 1.1, progress: ss(seg(t, t0 + 1.4, t0 + 2.6)), phase: 9 });
}

function vine(ctx, t) {
  const p = ss(seg(t, 106.4, 108.4));
  if (p <= 0) return;
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    pts.push([600 - 54 + Math.sin(u * 8.5) * 26, 850 - u * 430]);
  }
  const n = Math.max(2, Math.floor(pts.length * p));
  ctx.save();
  ctx.strokeStyle = '#2f6b4f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i < n; i++) { if (i === 0) ctx.moveTo(...pts[i]); else ctx.lineTo(...pts[i]); } ctx.stroke();
  ctx.strokeStyle = '#4a8a63'; ctx.lineWidth = 1.4; ctx.stroke();
  // leaves
  const R = mulberry(12);
  for (let i = 3; i < n; i += 3) {
    const u = i / 30;
    if (hash(i * 2.3) > .82) continue;
    const side = i % 2 ? 1 : -1;
    const x = pts[i][0] + side * (10 + hash(i) * 14), y = pts[i][1] + (hash(i * 3) - .5) * 10;
    ctx.save(); ctx.translate(x, y); ctx.rotate(side * (.5 + hash(i) * .6));
    ctx.fillStyle = '#3f7d57'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2b5a3e'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function title(ctx, t) {
  const p = ss(seg(t, 108.0, 109.2));
  if (!p) return;
  ctx.save(); ctx.beginPath(); ctx.rect(980, 380, 800 * p, 420); ctx.clip();
  text(ctx, '窗', 1000, 650, { size: 230, font: F.serif, color: INK });
  text(ctx, 'T H E   W I N D O W', 1004, 720, { size: 22, font: F.georgia, color: INK, spacing: 6 });
  text(ctx, '一部建筑史  ·  A HISTORY OF THE OPENING', 1004, 758, { size: 16, font: F.song, color: INK, spacing: 1.4, alpha: .8 });
  ctx.restore();
  // a small note, like a plate
  ctx.save(); ctx.globalAlpha = .65 * p;
  text(ctx, 'PLATE IX  ·  THE OPENING', 1004, 820, { size: 12, font: F.georgia, color: INK, spacing: 2.4 });
  ctx.strokeStyle = 'rgba(28,21,16,.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(1004, 832); ctx.lineTo(1420, 832); ctx.stroke();
  ctx.restore();
}

function closeSlit(ctx, t) {
  const p = ss(seg(t, 110.0, 111.4));
  if (!p) return;
  const gap = lerp(W, 2, eio(p));
  ctx.save(); ctx.fillStyle = '#060504';
  ctx.fillRect(0, 0, (W - gap) / 2, H);
  ctx.fillRect((W + gap) / 2, 0, (W - gap) / 2, H);
  if (gap > 6) {
    const g = ctx.createLinearGradient(960 - gap / 2 - 30, 0, 960 + gap / 2 + 30, 0);
    g.addColorStop(0, 'rgba(255,200,130,0)'); g.addColorStop(.5, `rgba(255,212,150,${.18 * p})`); g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.fillRect(960 - gap / 2 - 30, 0, gap + 60, H);
  }
  ctx.restore();
  const out = ss(seg(t, 111.2, 112.0));
  if (out > 0) { ctx.save(); ctx.globalAlpha = out; ctx.fillStyle = '#060504'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

export function draw(ctx, t) {
  init();
  ctx.drawImage(paper, 0, 0, W, H);
  const vg = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(80,50,20,.14)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  column(ctx, t);
  vine(ctx, t);
  title(ctx, t);
  // plate mark
  ctx.save(); ctx.globalAlpha = ss(seg(t, 103, 104)); ctx.strokeStyle = 'rgba(60,42,22,.45)'; ctx.lineWidth = 1.2;
  ctx.strokeRect(94, 62, W - 188, H - 124); ctx.restore();
  closeSlit(ctx, t);
  ctx.save(); ctx.globalAlpha = .08; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
