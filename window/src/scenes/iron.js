import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry, makeCanvas,
  poly, taper, hatch, text, measure, rgba, lerpColor, F, fbm
} from '../common.js';

let sheet, grain;
const WHITE = '#e9f2fb';

function init() {
  if (sheet) return;
  sheet = makeCanvas(W, H);
  const x = sheet.getContext('2d');
  x.fillStyle = '#1b3b78'; x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) % W, py = Math.floor((i / 4) / W);
    const n = fbm(px * .006, py * .006, 5);
    const n2 = fbm(px * .02 + 40, py * .02, 4);
    const b = 22 + n * 34 + n2 * 12;
    d[i] = clamp(18 + b * .45, 0, 255); d[i + 1] = clamp(48 + b * .8, 0, 255); d[i + 2] = clamp(110 + b * 1.2, 0, 255);
  }
  x.putImageData(img, 0, 0);
  // coating streaks
  const R = mulberry(19);
  x.globalAlpha = .05;
  for (let i = 0; i < 90; i++) {
    const yy = R() * H, w = 30 + R() * 160;
    x.fillStyle = R() < .5 ? '#8fc0f0' : '#0d2050';
    x.fillRect(R() * W, yy, w, 2 + R() * 8);
  }
  // folds
  x.globalAlpha = .35;
  for (const [x0, y0, x1, y1] of [[0, 360, W, 300], [620, 0, 700, H], [1300, 0, 1260, H]]) {
    x.strokeStyle = '#a9d0f5'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.strokeStyle = '#081a42'; x.lineWidth = 6; x.globalAlpha = .18; x.stroke();
    x.globalAlpha = .35;
  }
  // bleached edges + specks
  const g = x.createRadialGradient(960, 540, 460, 960, 540, 1150);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(220,235,250,.28)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .5;
  for (let i = 0; i < 500; i++) { x.fillStyle = R() < .5 ? '#d7e9fa' : '#0a1d44'; x.fillRect(R() * W, R() * H, 1.5, 1.5); }
  x.globalAlpha = 1;
  grain = makeCanvas(480, 270);
  const gg = grain.getContext('2d'), im = gg.createImageData(480, 270), dd = im.data;
  for (let i = 0; i < dd.length; i += 4) { const n = hash(i * .77) * 255; dd[i] = dd[i + 1] = dd[i + 2] = n; dd[i + 3] = 14; }
  gg.putImageData(im, 0, 0);
}
init();

function cam(t) {
  let s = 1.0;
  let ox = 0, oy = 0;
  if (t > 59) { const u = ss(seg(t, 59, 62)); ox = lerp(0, -130, u); s = lerp(1, 1.16, u); }
  if (t > 62) { const u = eio(seg(t, 62, 64)); ox = lerp(-130, -250, u); oy = lerp(0, 30, u); s = lerp(1.16, 1.85, u); }
  return { s, ox, oy };
}

// axonometric projection
function Q(x, y, z) {
  return [490 + (x - z) * 82, 700 + (x + z) * 34 - y * 82];
}

const strokes = [];
function S(pts, t0, dur = .5, w = 1.6, alpha = 1) { strokes.push({ pts, t0, dur, w, alpha }); }

function build() {
  if (strokes.length) return;
  const T = 51.0;
  // foundation / ground
  S([Q(0, 0, -2.2), Q(8.6, 0, -2.2), Q(8.6, 0, 2.2), Q(0, 0, 2.2), Q(0, 0, -2.2)], T, 1.0, 2.0);
  // bays
  for (let i = 0; i <= 8; i++) {
    const x = i;
    for (const z of [-2.05, 2.05]) {
      // column
      S([Q(x, 0, z), Q(x, 3.1, z)], T + .3 + i * .12, .45, 2.2);
      // capital
      S([Q(x, 3.1, z), Q(x, 3.25, z)], T + .5 + i * .12, .2, 2.6);
      // base
      S([Q(x, 0, z), Q(x, .18, z)], T + .5 + i * .12, .2, 2.6);
      // glass mullions between columns
      for (let k = 1; k < 4; k++) {
        const xx = x + k / 4;
        S([Q(xx, 0, z), Q(xx, 2.9, z)], T + 1.0 + i * .1, .4, .9, .65);
      }
      // horizontal glazing bars
      for (let h = 1; h <= 4; h++) {
        S([Q(x, h * .7, z), Q(x + 1, h * .7, z)], T + 1.4 + i * .08, .35, .8, .6);
      }
    }
    // roof arch across the hall at bay i
    const arch = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (k / 12);
      arch.push(Q(x, 3.1 + Math.sin(a) * 1.15, -Math.cos(a) * 2.05));
    }
    S(arch, T + .8 + i * .16, .6, 2.1);
    // roof glazing ribs
    for (let k = 1; k < 12; k++) {
      const a = Math.PI * (k / 12);
      S([Q(x, 3.1 + Math.sin(a) * 1.15, -Math.cos(a) * 2.05), Q(x + 1, 3.1 + Math.sin(a) * 1.15, -Math.cos(a) * 2.05)], T + 2.0 + i * .1, .4, .7, .55);
    }
    // ridge
    S([Q(x, 4.25, 0), Q(x + 1, 4.25, 0)], T + 1.2 + i * .1, .4, 1.2, .8);
  }
  // longitudinal lines
  for (const z of [-2.05, 2.05]) {
    S([Q(0, 3.1, z), Q(8, 3.1, z)], T + 1.7, 1.5, 1.8);
    S([Q(0, 0, z), Q(8, 0, z)], T + 1.9, 1.5, 2.0);
  }
  S([Q(0, 4.25, 0), Q(8, 4.25, 0)], T + 2.1, 1.2, 1.5);
  // end facade: arched entrance
  const end = [];
  for (let k = 0; k <= 20; k++) {
    const a = Math.PI * (k / 20);
    end.push(Q(0, 3.1 + Math.sin(a) * 1.15, -Math.cos(a) * 2.05));
  }
  S(end, T + 1.0, .8, 2.4);
  for (let k = 1; k < 10; k++) {
    const a = Math.PI * (k / 10);
    S([Q(0, Math.sin(a) * 1.1, -Math.cos(a) * 1.7), Q(0, 0, -Math.cos(a) * 1.7)], T + 1.6 + k * .06, .5, 1.1, .8);
  }
  // end wall grid
  for (let h = 1; h < 5; h++) S([Q(0, h * .62, -2.0), Q(0, h * .62, 2.0)], T + 1.8, .7, .9, .6);
  // hatching: shadows under the roof on the right side
  // (drawn as short strokes in buildAnimation)
  // dimensions
  S([Q(0, -.45, -2.05), Q(8, -.45, -2.05)], T + 3.2, 1.0, .9, .8);
  S([Q(0, -.45, -2.05), Q(0, -.2, -2.05)], T + 3.2, .2, .9, .8);
  S([Q(8, -.45, -2.05), Q(8, -.2, -2.05)], T + 3.3, .2, .9, .8);
  S([Q(0, 0, 2.9), Q(0, 3.2, 2.9)], T + 3.4, .9, .9, .8);
}

build();

function drawStroke(ctx, s, t, color, k) {
  const p = ss(seg(t, s.t0, s.t0 + s.dur));
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = s.alpha * (1 - 0); ctx.strokeStyle = color; ctx.lineWidth = s.w * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // draw-on by length
  let total = 0; const cum = [0];
  for (let i = 1; i < s.pts.length; i++) { total += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); cum.push(total); }
  const lim = total * p;
  ctx.beginPath(); ctx.moveTo(s.pts[0][0], s.pts[0][1]);
  for (let i = 1; i < s.pts.length; i++) {
    if (cum[i] <= lim) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
    else {
      const u = (lim - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      ctx.lineTo(lerp(s.pts[i - 1][0], s.pts[i][0], u), lerp(s.pts[i - 1][1], s.pts[i][1], u));
      break;
    }
  }
  ctx.stroke();
  // nib glow at the head
  if (p < .98) {
    const head = s.pts[Math.min(s.pts.length - 1, cum.findIndex(c => c >= lim))] || s.pts[s.pts.length - 1];
    ctx.globalAlpha = .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(head[0], head[1], 2.4 * k, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function annotations(ctx, t, k) {
  const a = ss(seg(t, 56.0, 57.5));
  if (!a) return;
  ctx.save(); ctx.globalAlpha = a;
  text(ctx, 'IRON & GLASS  ·  EXHIBITION HALL', 150, 120, { size: 26, font: F.cons, color: WHITE, spacing: 2 });
  text(ctx, 'AXONOMETRIC  /  SHEET 01', 150, 150, { size: 15, font: F.cons, color: WHITE, alpha: .75, spacing: 1.5 });
  // notes column
  const notes = ['1. CAST-IRON COLUMN, 8 FT BAY', '2. GLASS PANE, 49 IN', '3. PREFABRICATED TRUSS', '4. RIDGE VENT'];
  notes.forEach((n, i) => text(ctx, n, 1370, 420 + i * 30, { size: 14, font: F.cons, color: WHITE, alpha: .8, spacing: .5 }));
  // dimension text
  text(ctx, "8 × 8'-0\" BAYS", 560, 950, { size: 15, font: F.cons, color: WHITE, alpha: .9, spacing: 1 });
  text(ctx, "SPAN 64'-0\"", 1230, 560, { size: 15, font: F.cons, color: WHITE, alpha: .9, spacing: 1, rot: -1.1 });
  // balloons
  const balloons = [[Q(1, 2.2, 2.05), '3'], [Q(4, 3.6, -1.2), '4'], [Q(6, 1.2, 2.05), '2']];
  balloons.forEach(([p, n]) => {
    ctx.strokeStyle = WHITE; ctx.lineWidth = 1.1 * k;
    ctx.beginPath(); ctx.arc(p[0], p[1] - 46, 15, 0, 7); ctx.stroke();
    text(ctx, n, p[0], p[1] - 41, { size: 14, font: F.cons, color: WHITE, align: 'center' });
    ctx.beginPath(); ctx.moveTo(p[0], p[1] - 31); ctx.lineTo(p[0], p[1] - 6); ctx.stroke();
  });
  // title block
  ctx.strokeStyle = WHITE; ctx.lineWidth = 1.4 * k;
  ctx.strokeRect(1330, 820, 470, 190);
  ctx.beginPath(); ctx.moveTo(1330, 860); ctx.lineTo(1800, 860); ctx.moveTo(1330, 930); ctx.lineTo(1800, 930); ctx.moveTo(1560, 930); ctx.lineTo(1560, 1010); ctx.stroke();
  text(ctx, 'THE GLASS HOUSE', 1348, 848, { size: 20, font: F.cons, color: WHITE, spacing: 1.5 });
  text(ctx, 'LONDON  ·  1851', 1348, 912, { size: 15, font: F.cons, color: WHITE, alpha: .8 });
  text(ctx, 'SCALE 1:200', 1348, 968, { size: 13, font: F.cons, color: WHITE, alpha: .7 });
  text(ctx, 'DRAWN  /  REV. A', 1580, 968, { size: 13, font: F.cons, color: WHITE, alpha: .7 });
  ctx.restore();
}

function stamp(ctx, t) {
  const p = back(seg(t, 58.4, 58.9));
  if (p <= 0) return;
  ctx.save(); ctx.translate(1180, 300); ctx.rotate(-.16); ctx.scale(p, p);
  ctx.strokeStyle = 'rgba(200,50,50,.85)'; ctx.lineWidth = 4.5;
  ctx.strokeRect(-110, -54, 220, 108);
  ctx.fillStyle = 'rgba(200,50,50,.9)';
  text(ctx, '1851', 0, 18, { size: 56, font: F.cons, color: 'rgba(200,50,50,.92)', align: 'center', spacing: 6 });
  text(ctx, 'IRON & GLASS', 0, -18, { size: 13, font: F.cons, color: 'rgba(200,50,50,.85)', align: 'center', spacing: 4 });
  ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { s, ox, oy } = cam(t);
  const k = 1 / Math.pow(s, .55);
  ctx.save();
  // drafting cloth surround
  ctx.fillStyle = '#0d1116'; ctx.fillRect(0, 0, W, H);
  const sh = 18;
  ctx.save(); ctx.translate(0, 0); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(60 + sh, 40 + sh, W - 120, H - 80); ctx.restore();
  ctx.drawImage(sheet, 60, 40, W - 120, H - 80);
  ctx.save(); ctx.beginPath(); ctx.rect(60, 40, W - 120, H - 80); ctx.clip();
  ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2 + ox, -H / 2 + oy);
  const color = WHITE;
  for (const st of strokes) drawStroke(ctx, st, t, color, k);
  annotations(ctx, t, k);
  stamp(ctx, t);
  // bleached transition
  const bleach = ss(seg(t, 63.1, 64.1));
  if (bleach > 0) {
    ctx.save(); ctx.globalAlpha = bleach * .92; ctx.fillStyle = '#f2f1ea'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  ctx.restore();
  ctx.restore();
  // vignette on the sheet edge
  ctx.save(); ctx.globalAlpha = .5;
  const vg = ctx.createLinearGradient(0, 40, 0, 120);
  vg.addColorStop(0, 'rgba(0,0,0,.35)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vg; ctx.fillRect(60, 40, W - 120, 80); ctx.restore();
  ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
