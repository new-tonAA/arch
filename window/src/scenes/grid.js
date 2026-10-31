import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry,
  text, measure, poly, rgba, F, makeCanvas
} from '../common.js';

const PAPER = '#f0efe9';
const INK = '#111111';
const RED = '#e30613';
const GREY = '#c9c8c2';

const G = { x0: 96, cols: 12, gutter: 24, margin: 96, base: 24 };
const FACE = { x: 742, y: 150, w: 1040, h: 700, cols: 10, rows: 6 };

function cell(i, j) {
  const cw = FACE.w / FACE.cols, ch = FACE.h / FACE.rows;
  return { x: FACE.x + i * cw, y: FACE.y + j * ch, w: cw, h: ch };
}

function cam(t) {
  let s = 1 + .02 * ss(seg(t, 64, 76));
  let ox = 0;
  if (t > 69 && t < 71.5) ox = lerp(0, -36, eio(seg(t, 69, 69.8))) * (1 - eio(seg(t, 71, 71.8)));
  return { s, ox };
}

function font(size, weight = '700', fam = F.hei) { return { size, font: fam, weight, color: INK }; }

function gridLines(ctx, t) {
  const p = ss(seg(t, 64.2, 65.0));
  if (!p) return;
  ctx.save();
  const colW = (W - G.margin * 2 - G.gutter * (G.cols - 1)) / G.cols;
  ctx.strokeStyle = GREY; ctx.lineWidth = 1;
  for (let i = 0; i <= G.cols; i++) {
    const x = G.margin + i * (colW + G.gutter);
    const h = H * p;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < H; y += G.base * 2) {
    ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W * p, y); ctx.stroke();
  }
  ctx.restore();
}

function type(ctx, t) {
  // giant 墙
  const p1 = eio(seg(t, 64.8, 65.8));
  if (p1 > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(80, 140, 700, 380 * p1); ctx.clip();
    text(ctx, '墙', 92, 500, { size: 330, font: F.hei, weight: '900', color: INK, alpha: 1 });
    ctx.restore();
  }
  const p2 = eio(seg(t, 65.5, 66.4));
  if (p2 > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(100, 500, 640 * p2, 140); ctx.clip();
    text(ctx, '就是窗', 100, 610, { size: 112, font: F.hei, weight: '500', color: INK });
    ctx.restore();
  }
  // red rule
  const p3 = ss(seg(t, 66.0, 66.8));
  if (p3 > 0) {
    ctx.fillStyle = RED; ctx.fillRect(104, 646, 480 * p3, 9);
    text(ctx, 'CURTAIN WALL  /  1926', 104, 690, { size: 18, font: F.bahn, color: INK, spacing: 2, alpha: ss(seg(t, 66.4, 67.0)) });
  }
  // small notes
  const p4 = ss(seg(t, 66.6, 67.4));
  if (p4) {
    ctx.save(); ctx.globalAlpha = p4;
    text(ctx, 'LOAD-BEARING  →  SKIN', 104, 860, { size: 17, font: F.bahn, color: INK, spacing: 1.4 });
    text(ctx, 'GRID 10 × 6  ·  MULLION 40 mm', 104, 888, { size: 14, font: F.bahn, color: '#666', spacing: 1.2 });
    text(ctx, '01 / WINDOW', 104, 930, { size: 13, font: F.bahn, color: '#777', spacing: 1.6 });
    ctx.restore();
  }
  // giant side numeral
  const p5 = ss(seg(t, 67.0, 68.0));
  if (p5) {
    ctx.save(); ctx.globalAlpha = .12 * p5;
    text(ctx, '1926', 1370, 990, { size: 210, font: F.bahn, weight: '700', color: INK, align: 'right' });
    ctx.restore();
  }
}

function facade(ctx, t) {
  const start = 67.0;
  // outer frame
  const pf = ss(seg(t, start, start + .8));
  if (pf > 0) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.strokeRect(FACE.x - 8, FACE.y - 8, FACE.w + 16, FACE.h + 16);
    ctx.restore();
  }
  const cw = FACE.w / FACE.cols, ch = FACE.h / FACE.rows;
  for (let j = 0; j < FACE.rows; j++) {
    for (let i = 0; i < FACE.cols; i++) {
      const c = cell(i, j);
      const t0 = start + .9 + (i + j * 1.6) * .075;
      let p = eio(seg(t, t0, t0 + .45));
      if (p <= 0) continue;
      const isRed = i === 7 && j === 3;
      const redOn = ss(seg(t, 72.0, 72.5));
      const knife = isRed ? ss(seg(t, 74.0, 74.6)) : 0;
      const collapse = ss(seg(t, 75.2 + i * .035 + j * .06, 75.8 + i * .035 + j * .06));
      const h = c.h * p * (1 - knife) * (1 - collapse);
      const y = c.y + (c.h - h) / 2;
      // panel clip reveal from the top
      const g = ctx.createLinearGradient(c.x, c.y, c.x + c.w, c.y + c.h);
      if (isRed && redOn > 0) {
        g.addColorStop(0, RED); g.addColorStop(1, '#c40511');
      } else {
        g.addColorStop(0, '#f8f9f8'); g.addColorStop(.55, '#e8ebeb'); g.addColorStop(1, '#d8dcdd');
      }
      ctx.fillStyle = g; ctx.fillRect(c.x + 5, y + 5, c.w - 10, Math.max(0, h - 10));
      // glass reflection: one diagonal band
      if (!(isRed && redOn > 0)) {
        ctx.save(); ctx.beginPath(); ctx.rect(c.x + 5, y + 5, c.w - 10, Math.max(0, h - 10)); ctx.clip();
        ctx.globalAlpha = .35 * (1 - collapse);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(c.x + c.w * .1, y); ctx.lineTo(c.x + c.w * .55, y); ctx.lineTo(c.x + c.w * .2, y + h); ctx.lineTo(c.x - c.w * .2, y + h); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // mullions
      ctx.strokeStyle = INK; ctx.lineWidth = 5;
      ctx.strokeRect(c.x + 2, y + 2, c.w - 4, Math.max(0, h - 4));
    }
  }
  // slab lines
  const ps = ss(seg(t, 70.0, 71.0));
  if (ps > 0) {
    ctx.save(); ctx.globalAlpha = ps; ctx.strokeStyle = INK; ctx.lineWidth = 7;
    for (let j = 0; j <= FACE.rows; j += 2) {
      const y = FACE.y + j * ch;
      ctx.beginPath(); ctx.moveTo(FACE.x - 8, y); ctx.lineTo(FACE.x + FACE.w + 8, y); ctx.stroke();
    }
    ctx.restore();
  }
  // the exception: red panel sits 12 px off its grid
  const redOn = ss(seg(t, 72.0, 72.5));
  if (redOn > 0) {
    const c = cell(7, 3);
    ctx.save(); ctx.globalAlpha = redOn;
    ctx.translate(12 * redOn, 0);
    // knife cut
    const kp = eio(seg(t, 74.0, 74.5));
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.x - 60, c.y + c.h / 2); ctx.lineTo(c.x + c.w + 60 * kp, c.y + c.h / 2); ctx.stroke();
    ctx.restore();
    // off-grid readout
    const ro = ss(seg(t, 72.5, 73.2));
    ctx.save(); ctx.globalAlpha = ro;
    ctx.strokeStyle = RED; ctx.lineWidth = 2;
    const lx = c.x + c.w + 24, ly = c.y + c.h + 34;
    ctx.beginPath(); ctx.moveTo(c.x + c.w + 12, c.y + c.h - 8); ctx.lineTo(lx, ly - 12); ctx.stroke();
    ctx.fillStyle = 'rgba(240,239,233,.92)'; ctx.fillRect(lx, ly - 18, 210, 48);
    text(ctx, 'OFF GRID  +12 px', lx + 4, ly, { size: 15, font: F.bahn, color: RED, spacing: 1.4 });
    text(ctx, 'THE EXCEPTION', lx + 4, ly + 22, { size: 12, font: F.bahn, color: '#777', spacing: 1.4 });
    ctx.restore();
  }
  // knife cut across the whole facade
  const kp2 = eio(seg(t, 74.9, 75.3));
  if (kp2 > 0) {
    ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(FACE.x - 40, FACE.y + FACE.h * .55); ctx.lineTo(lerp(FACE.x - 40, FACE.x + FACE.w + 40, kp2), FACE.y + FACE.h * .55); ctx.stroke();
    ctx.restore();
  }
}

export function draw(ctx, t) {
  const { s, ox } = cam(t);
  ctx.save();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2 + ox, -H / 2);
  gridLines(ctx, t);
  type(ctx, t);
  facade(ctx, t);
  // page edge? no
  ctx.restore();
  // a very light paper grain, no film grain (Swiss)
}
