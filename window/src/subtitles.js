import { W, H, clamp, lerp, seg, ss, eio, eo, back, text, measure, poly, rgba, F, hash, mulberry } from './common.js';
import { LINES } from './timeline.js';

const INK = '#1c1510';

function active(t) {
  let best = null;
  for (const l of LINES) if (t >= l.t0 && t <= l.t1) best = l;
  return best;
}

function slip(ctx, cx, y, w, h, color, edge = 'rgba(80,55,25,.35)', rot = 0) {
  ctx.save(); ctx.translate(cx, y); ctx.rotate(rot);
  // deckled edge: a slightly irregular polygon
  const R = mulberry(77), pts = [];
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  const push = (x, yy, n) => { for (let i = 0; i < n; i++) pts.push([lerp(x, x, 1) + (i / n - .5) * (x1 - x0), yy + (R() - .5) * 3]); };
  pts.push([x0 + 2, y0 - 1], [x1 - 4, y0 + 1], [x1 + 1, y0 + 3]);
  for (let i = 1; i <= 5; i++) pts.push([x1 + (R() - .5) * 3, lerp(y0, y1, i / 5)]);
  pts.push([x1 - 2, y1 - 1], [x0 + 5, y1 + 1], [x0 - 1, y1 - 2]);
  for (let i = 1; i <= 5; i++) pts.push([x0 + (R() - .5) * 3, lerp(y1, y0, i / 5)]);
  ctx.fillStyle = 'rgba(40,25,10,.18)'; poly(ctx, pts.map(p => [p[0] + 2, p[1] + 4])); ctx.fill();
  ctx.fillStyle = color; poly(ctx, pts); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
  // a faint printed rule
  ctx.strokeStyle = 'rgba(80,55,25,.18)'; ctx.beginPath(); ctx.moveTo(x0 + 18, y0 + 7); ctx.lineTo(x1 - 18, y0 + 7); ctx.stroke();
  ctx.restore();
}

function stone(ctx, l, t) {
  const size = 44, maxW = 1380;
  const w = Math.min(maxW + 96, measure(ctx, l.text, size, F.song, 1) + 110);
  const p = ss(seg(t, l.t0 + .15, l.t0 + .8));
  // the line is cut into the slip from the left
  slip(ctx, W / 2, 988, w, 98, '#f0e4cb', 'rgba(90,62,30,.45)', -.004);
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - w / 2 + 28, 930, (w - 56) * p, 120); ctx.clip();
  text(ctx, l.text, W / 2, 1004, { size, font: F.song, color: INK, align: 'center', spacing: 1 });
  ctx.restore();
}

function glass(ctx, l, t) {
  const size = 43;
  const w = measure(ctx, l.text, size, F.song, 1) + 150;
  const p = ss(seg(t, l.t0 + .1, l.t0 + 1.0));
  const cx = W / 2, y = 956;
  ctx.save(); ctx.translate(cx, y);
  const hw = lerp(20, w / 2, p);
  // parchment banderole with curled ends and a sag
  ctx.beginPath();
  ctx.moveTo(-hw, -30); ctx.quadraticCurveTo(0, -16, hw, -30);
  ctx.lineTo(hw + 22, -24); ctx.quadraticCurveTo(hw + 6, 4, hw + 22, 34);
  ctx.quadraticCurveTo(hw * .5, 26, 0, 30); ctx.quadraticCurveTo(-hw * .5, 26, -hw - 22, 34);
  ctx.quadraticCurveTo(-hw - 6, 4, -hw - 22, -24); ctx.closePath();
  ctx.fillStyle = 'rgba(30,18,8,.35)'; ctx.save(); ctx.translate(3, 5); ctx.fill(); ctx.restore();
  const g = ctx.createLinearGradient(0, -30, 0, 34);
  g.addColorStop(0, '#efdfbc'); g.addColorStop(.55, '#e6d0a4'); g.addColorStop(1, '#dcc08c');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(72,44,16,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,24,.28)'; ctx.beginPath(); ctx.moveTo(-hw + 12, -18); ctx.quadraticCurveTo(0, -8, hw - 12, -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-hw + 12, 22); ctx.quadraticCurveTo(0, 28, hw - 12, 22); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = p;
  text(ctx, l.text, cx, y + 12, { size, font: F.song, color: '#241408', align: 'center', spacing: .8 });
  ctx.restore();
}

function line(ctx, l, t) {
  const size = 36, p = ss(seg(t, l.t0 + .2, l.t0 + 1.2));
  const x = 200, y = 1000;
  if (!p) return;
  const w = measure(ctx, l.text, size, F.kai, .5) + 44;
  slip(ctx, x + w / 2, y - 12, w, 66, 'rgba(244,235,216,.92)', 'rgba(90,62,30,.28)', -.004);
  ctx.save(); ctx.globalAlpha = .95 * p;
  // a handwritten margin note, slightly tilted, with a lead-in stroke
  ctx.rotate(-.006);
  text(ctx, l.text, x + 18, y, { size, font: F.kai, color: '#3b2a1a', spacing: .5 });
  ctx.strokeStyle = 'rgba(59,42,26,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.quadraticCurveTo(x + 300, y + 12, x + Math.min(980, measure(ctx, l.text, size, F.kai)), y + 18); ctx.stroke();
  ctx.restore();
}

function iron(ctx, l, t) {
  const size = 34, p = ss(seg(t, l.t0 + .1, l.t0 + .7));
  const x = 1046, y = 150;
  const w = Math.max(560, measure(ctx, l.text, size, F.hei, .5) + 76);
  ctx.save(); ctx.globalAlpha = p;
  ctx.fillStyle = 'rgba(231,240,249,.10)'; ctx.fillRect(x, y, w, 112);
  ctx.strokeStyle = 'rgba(231,240,249,.85)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, w, 112);
  ctx.strokeStyle = 'rgba(231,240,249,.55)'; ctx.lineWidth = .8; ctx.strokeRect(x + 5, y + 5, w - 10, 102);
  text(ctx, 'NOTE / 02', x + 18, y + 26, { size: 15, font: F.cons, color: '#e7f0f9', spacing: 1.5 });
  ctx.beginPath(); ctx.moveTo(x + 18, y + 36); ctx.lineTo(x + w - 18, y + 36); ctx.strokeStyle = 'rgba(231,240,249,.5)'; ctx.stroke();
  text(ctx, l.text, x + 22, y + 82, { size, font: F.hei, color: '#eef5fc', spacing: .6 });
  ctx.restore();
}

function grid(ctx, l, t) {
  const size = 31, p = ss(seg(t, l.t0 + .1, l.t0 + .6));
  const x = 742, y = 1002;
  ctx.save(); ctx.globalAlpha = p;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 70, y - 34); ctx.stroke();
  text(ctx, '06 / WINDOW', x, y - 42, { size: 13, font: F.bahn, color: '#777', spacing: 2 });
  text(ctx, l.text, x, y, { size, font: F.hei, color: '#111', weight: '500', spacing: .4 });
  ctx.restore();
}

function play(ctx, l, t) {
  const size = 39, p = back(seg(t, l.t0 + .1, l.t0 + .6));
  const w = measure(ctx, l.text, size, F.hei, .5) + 86;
  const x = W - 120 - w / 2, y = 970;
  ctx.save(); ctx.globalAlpha = Math.min(1, p); ctx.translate(x, y); ctx.rotate(.035); ctx.scale(.7 + .3 * p, .7 + .3 * p);
  ctx.fillStyle = 'rgba(20,16,30,.22)'; roundRect(ctx, -w / 2 + 7, -44 + 8, w, 88, 18); ctx.fill();
  ctx.fillStyle = '#fffdf4'; roundRect(ctx, -w / 2, -44, w, 88, 18); ctx.fill();
  ctx.strokeStyle = '#17131f'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ff5a5f'; ctx.beginPath(); ctx.arc(-w / 2 + 26, 0, 8, 0, 7); ctx.fill();
  text(ctx, l.text, 12, 13, { size, font: F.hei, color: '#17131f', align: 'center', weight: '700', spacing: .5 });
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function data(ctx, l, t) {
  const size = 30, p = ss(seg(t, l.t0 + .15, l.t0 + .7));
  const x = 146, y = 928;
  ctx.save(); ctx.globalAlpha = .88 * p;
  ctx.strokeStyle = 'rgba(150,230,220,.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x + 46, y - 40); ctx.lineTo(x + 56, y - 30); ctx.stroke();
  text(ctx, 'LIVE / 2026', x + 68, y - 34, { size: 13, font: F.cons, color: 'rgba(150,230,220,.8)', spacing: 2 });
  text(ctx, l.text, x, y, { size, font: F.hei, color: '#dff6f2', spacing: .5 });
  ctx.restore();
}

function coda(ctx, l, t) {
  stone(ctx, l, t);
}

export function draw(ctx, t) {
  const l = active(t);
  if (!l) return;
  const fn = { stone, glass, line, iron, grid, play, data, coda }[l.scene] || stone;
  fn(ctx, l, t);
}

export function textsAt(t) {
  const l = active(t);
  if (!l) return [];
  const size = { stone: 44, coda: 44, glass: 43, line: 38, iron: 34, grid: 31, play: 39, data: 30 }[l.scene];
  const font = { stone: F.song, coda: F.song, glass: F.song, line: F.kai, iron: F.hei, grid: F.hei, play: F.hei, data: F.hei }[l.scene];
  const w = measure(document.createElement('canvas').getContext('2d'), l.text, size, font, 1);
  let x0 = W / 2 - w / 2, y0 = 930, x1 = W / 2 + w / 2, y1 = 1020;
  if (l.scene === 'line') { x0 = 200; y0 = 960; x1 = x0 + w; y1 = 1024; }
  if (l.scene === 'iron') { x0 = 1080; y0 = 190; x1 = x0 + w; y1 = 270; }
  if (l.scene === 'grid') { x0 = 742; y0 = 960; x1 = x0 + w; y1 = 1020; }
  if (l.scene === 'play') { x0 = W - 120 - w - 86 / 2; y0 = 918; x1 = W - 120 + 86 / 2; y1 = 1022; }
  if (l.scene === 'data') { x0 = 146; y0 = 890; x1 = x0 + w; y1 = 950; }
  return [{ id: l.id, text: l.text, x0, y0, x1, y1 }];
}
