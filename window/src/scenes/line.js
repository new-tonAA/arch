import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry,
  paperTexture, poly, taper, hatch, bandHatch, text, measure, rgba, lerpColor, F, makeCanvas
} from '../common.js';

const INK = '#3b2a1a';
const PAPER = '#efe5cf';
const VP = { x: 960, y: 548 };
let paper, grain;

function init() {
  if (paper) return;
  paper = paperTexture(2880, 1620, 23, PAPER, '#e2d2b4');
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = hash(i * .83) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 16; }
  g.putImageData(im, 0, 0);
}
init();

function cam(t) {
  let s = 1.12 - .12 * eio(seg(t, 45.5, 49.0));
  s *= 1 + .012 * ss(seg(t, 37, 45));
  return { s, fx: 960, fy: 540 };
}

function frame(ctx, t, k) {
  const p = ss(seg(t, 37.0, 37.8));
  if (!p) return;
  ctx.save(); ctx.globalAlpha = .95;
  ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * k;
  ctx.strokeRect(380, 168, 1160, 760);
  ctx.lineWidth = 1.1 * k; ctx.strokeRect(390, 178, 1140, 740);
  // corner ticks
  for (const [x, y] of [[380, 168], [1540, 168], [380, 928], [1540, 928]]) {
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke();
  }
  ctx.restore();
}

function construct(ctx, t, k) {
  const p = ss(seg(t, 37.3, 39.4));
  if (!p) return;
  ctx.save(); ctx.globalAlpha = .48 * p; ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = .9 * k;
  ctx.setLineDash([10, 8]);
  // horizon + vanishing point
  ctx.beginPath(); ctx.moveTo(200, VP.y); ctx.lineTo(1720, VP.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(VP.x, VP.y, 4.5, 0, 7); ctx.fillStyle = '#6b4a2e'; ctx.fill();
  // orthogonals from frame to VP
  for (let i = 0; i < 13; i++) {
    const x = 380 + i * (1160 / 12);
    const xx = lerp(x, VP.x, p), yy = lerp(928, VP.y, p);
    ctx.beginPath(); ctx.moveTo(x, 928); ctx.lineTo(xx, yy); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const y = 168 + i * (760 / 7);
    const xx = lerp(380, VP.x, p), yy = lerp(y, VP.y, p);
    ctx.beginPath(); ctx.moveTo(380, y); ctx.lineTo(xx, yy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1540, y); ctx.lineTo(lerp(1540, VP.x, p), lerp(y, VP.y, p)); ctx.stroke();
  }
  ctx.restore();
}

// project a point in a simple one-point perspective street
function P(x, y, z) {
  const s = 1 / (1 + z * .16);
  return [VP.x + (x - VP.x) * s, VP.y + (y - VP.y) * s];
}

function arcade(ctx, t, k, side) {
  const p = ss(seg(t, 39.4, 42.4));
  if (!p) return;
  const sgn = side;
  ctx.save();
  const cols = [];
  for (let i = 0; i < 8; i++) {
    const z = i * .30;
    const x = 960 + sgn * (230 + i * 58);
    const yT = 360 - i * 2, yB = 884 - i * 10;
    const a = P(x, yT, z), b = P(x, yB, z);
    cols.push({ a, b, z, x });
    const w = 11 / (1 + z * .16);
    ctx.globalAlpha = .95 * Math.min(1, p * 1.6 - i * .05);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); ctx.moveTo(a[0] - w, a[1]); ctx.lineTo(b[0] - w, b[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a[0] + w, a[1]); ctx.lineTo(b[0] + w, b[1]); ctx.stroke();
    // capital and base
    ctx.beginPath(); ctx.moveTo(a[0] - w * 1.7, a[1] + 6); ctx.lineTo(a[0] + w * 1.7, a[1] + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b[0] - w * 1.6, b[1]); ctx.lineTo(b[0] + w * 1.6, b[1]); ctx.stroke();
    // fluting
    for (let f = -1; f <= 1; f++) {
      ctx.globalAlpha = .35 * p;
      ctx.beginPath(); ctx.moveTo(a[0] + f * w * .45, a[1] + 10); ctx.lineTo(b[0] + f * w * .45, b[1] - 6); ctx.stroke();
    }
  }
  // arches and entablature between columns
  for (let i = 0; i < cols.length - 1; i++) {
    const c0 = cols[i], c1 = cols[i + 1];
    ctx.globalAlpha = .85 * p; ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * k;
    const y = Math.min(c0.a[1], c1.a[1]) + 10;
    ctx.beginPath(); ctx.moveTo(c0.a[0], c0.a[1] + 10); ctx.quadraticCurveTo((c0.a[0] + c1.a[0]) / 2, y - 34, c1.a[0], c1.a[1] + 10); ctx.stroke();
    // spandrel shadow
    hatch(ctx, [[c0.a[0], c0.a[1] + 2], [c1.a[0], c1.a[1] + 2], [c1.a[0], c1.a[1] + 26], [c0.a[0], c0.a[1] + 26]], { angle: 1.25, spacing: 7, width: .7 * k, progress: p, phase: i });
    // entablature
    ctx.globalAlpha = .8 * p;
    ctx.beginPath(); ctx.moveTo(c0.a[0], c0.a[1] - 24); ctx.lineTo(c1.a[0], c1.a[1] - 24); ctx.stroke();
  }
  ctx.restore();
}

function dome(ctx, t, k) {
  const p = ss(seg(t, 39.8, 43.2));
  if (!p) return;
  ctx.save(); ctx.globalAlpha = .96 * p; ctx.strokeStyle = INK; ctx.lineWidth = 1.9 * k;
  const cx = VP.x, baseY = VP.y + 128, rx = 208, drumH = 104, domeH = 236;
  // drum
  ctx.beginPath(); ctx.ellipse(cx, baseY, rx, 26, 0, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, baseY - drumH, rx, 26, 0, 0, 7); ctx.stroke();
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + i / 8 * Math.PI;
    const x = cx + Math.cos(a) * rx, y = baseY - drumH * .5;
    ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - drumH); ctx.stroke();
    // arched window on the drum
    ctx.beginPath(); ctx.moveTo(x - 12, baseY - 22); ctx.lineTo(x - 12, baseY - 58);
    ctx.arc(x, baseY - 58, 12, Math.PI, 0); ctx.lineTo(x + 12, baseY - 22); ctx.stroke();
  }
  // dome silhouette + ribs
  ctx.beginPath(); ctx.ellipse(cx, baseY - drumH, rx, domeH, 0, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, baseY - drumH, rx, 26, 0, 0, Math.PI, true); ctx.stroke();
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    ctx.beginPath();
    for (let j = 0; j <= 24; j++) {
      const a = Math.PI / 2 * (j / 24);
      const rr = rx * Math.cos(a), hh = domeH * Math.sin(a);
      const x = cx + Math.cos(Math.PI + u * Math.PI) * rr;
      const y = baseY - drumH - hh;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // latitude bands
  for (const u of [.35, .65]) {
    const hh = domeH * u, rr = rx * Math.sqrt(1 - u * u);
    ctx.beginPath(); ctx.ellipse(cx, baseY - drumH - hh, rr, 12, 0, Math.PI, 0); ctx.stroke();
  }
  // lantern
  ctx.beginPath(); ctx.moveTo(cx - 20, baseY - drumH - domeH); ctx.lineTo(cx - 20, baseY - drumH - domeH - 44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 20, baseY - drumH - domeH); ctx.lineTo(cx + 20, baseY - drumH - domeH - 44); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, baseY - drumH - domeH - 44, 20, Math.PI, 0); ctx.stroke();
  // portico
  const py = baseY + 6, ph = 170;
  ctx.beginPath(); ctx.moveTo(cx - 210, py + ph); ctx.lineTo(cx - 210, py); ctx.lineTo(cx + 210, py); ctx.lineTo(cx + 210, py + ph); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const x = cx - 180 + i * 72;
    ctx.beginPath(); ctx.moveTo(x, py + 8); ctx.lineTo(x, py + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, py + 8); ctx.lineTo(x + 7, py + 8); ctx.stroke();
  }
  // pediment
  ctx.beginPath(); ctx.moveTo(cx - 230, py); ctx.lineTo(cx, py - 54); ctx.lineTo(cx + 230, py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 210, py); ctx.lineTo(cx, py - 40); ctx.lineTo(cx + 210, py); ctx.stroke();
  // right-hand shading
  hatch(ctx, [[cx + 6, baseY - drumH - 210], [cx + rx - 4, baseY - drumH - 40], [cx + rx - 4, baseY - drumH - 8], [cx + 6, baseY - drumH - 8]], { angle: 1.2, spacing: 7.5, width: .75 * k, progress: p, phase: 5 });
  ctx.restore();
}

function paving(ctx, t, k) {
  const p = ss(seg(t, 38.6, 40.4));
  if (!p) return;
  ctx.save(); ctx.globalAlpha = .55 * p; ctx.strokeStyle = INK; ctx.lineWidth = .9 * k;
  for (let i = 1; i < 12; i++) {
    const x = 280 + i * 124;
    ctx.beginPath(); ctx.moveTo(x, 930); ctx.lineTo(lerp(x, VP.x, .82), lerp(930, VP.y, .82)); ctx.stroke();
  }
  for (let i = 1; i < 9; i++) {
    const u = i / 9;
    const y = lerp(930, VP.y + 40, u * u);
    const spread = lerp(760, 240, u);
    ctx.beginPath(); ctx.moveTo(VP.x - spread, y); ctx.lineTo(VP.x + spread, y); ctx.stroke();
  }
  ctx.restore();
}

function figure(ctx, t, k) {
  const p = ss(seg(t, 43.4, 44.4));
  if (!p) return;
  const x = 700, y = 800, h = 84;
  ctx.save(); ctx.globalAlpha = .8 * p; ctx.fillStyle = '#3b2a1a';
  ctx.beginPath(); ctx.arc(x, y - h, 9, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 10, y - h + 10); ctx.lineTo(x + 10, y - h + 10); ctx.lineTo(x + 14, y - 8); ctx.lineTo(x - 14, y - 8); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - 13, y - 8, 9, 40); ctx.fillRect(x + 4, y - 8, 9, 40);
  ctx.restore();
}

function wash(ctx, t) {
  const p = ss(seg(t, 44.2, 47.2));
  if (!p) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  const regions = [
    { pts: [[380, 168], [1540, 168], [1540, 470], [380, 470]], col: '#8fb0c9', a: .42, t: 44.2 },
    { pts: [[380, 470], [1540, 470], [1540, 930], [380, 930]], col: '#c9a06a', a: .18, t: 44.8 },
    { pts: [[660, 450], [1260, 450], [1260, 700], [660, 700]], col: '#b46b4a', a: .26, t: 45.2 },
    { pts: [[380, 700], [1540, 700], [1540, 930], [380, 930]], col: '#8f8a5a', a: .20, t: 45.8 },
  ];
  for (const r of regions) {
    const q = ss(seg(t, r.t, r.t + 2.0)) * p;
    if (q <= 0) continue;
    const cx = r.pts.reduce((a, b) => a + b[0], 0) / 4, cy = r.pts.reduce((a, b) => a + b[1], 0) / 4;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 420);
    g.addColorStop(0, rgba(r.col, r.a * q)); g.addColorStop(1, rgba(r.col, 0));
    ctx.fillStyle = g; poly(ctx, r.pts); ctx.fill();
    ctx.globalAlpha = .10 * q; ctx.fillStyle = r.col; poly(ctx, r.pts); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function notes(ctx, t) {
  const p = ss(seg(t, 46.8, 48.4));
  if (!p) return;
  ctx.save(); ctx.globalAlpha = p;
  text(ctx, 'DE PICTURA  ·  1435', 150, 900, { size: 22, font: F.georgia, color: INK, spacing: 3 });
  text(ctx, 'finestra aperta', 150, 936, { size: 30, font: F.fell, color: INK, italic: true });
  text(ctx, '一扇敞开的窗', 150, 972, { size: 22, font: F.kai, color: INK, alpha: .8 });
  // small eye/ray diagram
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(1700, 870, 26, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(1700, 870, 6, 0, 7); ctx.fillStyle = INK; ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(1700 + Math.cos(a) * 34, 870 + Math.sin(a) * 34); ctx.lineTo(1700 + Math.cos(a) * 58, 870 + Math.sin(a) * 58); ctx.stroke();
  }
  text(ctx, 'OCULUS', 1650, 952, { size: 13, font: F.cons, color: INK, spacing: 2, alpha: .7 });
  ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { s, fx, fy } = cam(t);
  const k = 1 / Math.pow(s, .5);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-fx, -fy);
  ctx.drawImage(paper, 0, 0, W, H);
  const vg = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(80,50,20,.13)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  frame(ctx, t, k);
  construct(ctx, t, k);
  paving(ctx, t, k);
  arcade(ctx, t, k, -1);
  arcade(ctx, t, k, 1);
  dome(ctx, t, k);
  figure(ctx, t, k);
  wash(ctx, t);
  notes(ctx, t);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .08; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
