import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry, makeCanvas,
  poly, text, measure, rgba, lerpColor, F, fbm
} from '../common.js';

const PAPER = '#efe6d3';
let wallTex, bloomC, grain;

const C = {
  cobalt: '#123a86', cobalt2: '#1c4fa8', ruby: '#8e1622', ruby2: '#b32430',
  gold: '#c9922e', green: '#245c43', white: '#c9cbbd', violet: '#432a5e',
};

const WIN = { cx: 960, top: 70, bot: 860, halfW: 320 };
const ROSE = { x: 960, y: 250, r: 120 };
const LANCETS = [
  { x0: 796, x1: 950, top: 438, bot: 840 },
  { x0: 970, x1: 1124, top: 438, bot: 840 },
];
const SIDES = [{ x0: 686, x1: 766, top: 500 }, { x0: 1154, x1: 1234, top: 500 }];

function pointedPath(ctx, cx, halfW, bot, top, spring, apex) {
  ctx.beginPath();
  ctx.moveTo(cx - halfW, bot);
  ctx.lineTo(cx - halfW, spring);
  ctx.quadraticCurveTo(cx - halfW, apex + 60, cx, top);
  ctx.quadraticCurveTo(cx + halfW, apex + 60, cx + halfW, spring);
  ctx.lineTo(cx + halfW, bot);
  ctx.closePath();
}
function lancetPath(ctx, l) {
  const mid = (l.x0 + l.x1) / 2;
  ctx.beginPath();
  ctx.moveTo(l.x0, l.bot);
  ctx.lineTo(l.x0, l.top + 66);
  ctx.quadraticCurveTo(l.x0, l.top + 8, mid, l.top);
  ctx.quadraticCurveTo(l.x1, l.top + 8, l.x1, l.top + 66);
  ctx.lineTo(l.x1, l.bot);
  ctx.closePath();
}
function stonePath(ctx, d = 0) {
  const cx = WIN.cx, hw = WIN.halfW + d, bot = WIN.bot, top = WIN.top - d * .9, spring = 430;
  ctx.beginPath();
  ctx.moveTo(cx - hw, bot);
  ctx.lineTo(cx - hw, spring);
  ctx.quadraticCurveTo(cx - hw, top, cx, top);
  ctx.quadraticCurveTo(cx + hw, top, cx + hw, spring);
  ctx.lineTo(cx + hw, bot);
  ctx.closePath();
}

function init() {
  if (wallTex) return;
  wallTex = makeCanvas(960, 540);
  const x = wallTex.getContext('2d');
  x.fillStyle = '#1b1714'; x.fillRect(0, 0, 960, 540);
  const img = x.getImageData(0, 0, 960, 540), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) % 960, py = Math.floor((i / 4) / 960);
    const n = (fbm(px * .035, py * .035, 4) - .5) * 26 + (hash(i * .003) - .5) * 10;
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * .92, 0, 255); d[i + 2] = clamp(d[i + 2] + n * .82, 0, 255);
  }
  x.putImageData(img, 0, 0);
  // very low-contrast ashlar
  x.strokeStyle = 'rgba(6,5,4,.28)'; x.lineWidth = 1;
  for (let y = 0; y < 540; y += 44) {
    x.beginPath(); x.moveTo(0, y); x.lineTo(960, y); x.stroke();
    const off = (Math.floor(y / 44) % 2) * 52;
    for (let xx = -120 + off; xx < 960; xx += 104) {
      x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 44); x.stroke();
    }
  }
  x.fillStyle = 'rgba(220,190,150,.028)';
  for (let y = 0; y < 540; y += 44) for (let xx = 0; xx < 960; xx += 104) x.fillRect(xx + 2, y + 2, 100, 3);
  bloomC = makeCanvas(W, H);
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), dd = im.data;
  for (let i = 0; i < dd.length; i += 4) {
    const n = hash(i * .91) * 255;
    dd[i] = dd[i + 1] = dd[i + 2] = n; dd[i + 3] = 18;
  }
  g.putImageData(im, 0, 0);
}
init();

function cam(t) {
  let s = 1.0 + .1 * ss(seg(t, 25, 33));
  if (t > 33) s = lerp(s, 1.8, eio(seg(t, 33, 36.6)));
  const tx = lerp(-40, 42, ss(seg(t, 22.4, 33)));
  const fy = lerp(540, 440, ss(seg(t, 33, 36.6)));
  return { s, fx: 960, fy, tx };
}
function sunState(t) {
  const p = seg(t, 23.0, 31.4);
  const bandX = lerp(620, 1360, eio(p));
  const overall = .15 + .85 * ss(seg(t, 23.0, 25.4));
  return { bandX, overall, p };
}

function drawWall(ctx, t, drain) {
  ctx.save();
  ctx.globalAlpha = 1 - drain * .92;
  ctx.drawImage(wallTex, -100, -100, W + 200, H + 200);
  // deep vault shadow top, warm bounce bottom
  let g = ctx.createLinearGradient(0, 0, 0, 500);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
  g = ctx.createRadialGradient(960, 500, 100, 960, 540, 1050);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,.76)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // piers framing the window
  ctx.save(); ctx.globalAlpha = 1 - drain * .92;
  const pier = ctx.createLinearGradient(620, 0, 700, 0);
  pier.addColorStop(0, 'rgba(20,16,13,0)'); pier.addColorStop(.5, 'rgba(48,40,33,.55)'); pier.addColorStop(1, 'rgba(15,12,10,0)');
  ctx.fillStyle = pier; ctx.fillRect(620, 0, 80, H);
  ctx.save(); ctx.translate(1920, 0); ctx.scale(-1, 1); ctx.fillStyle = pier; ctx.fillRect(620, 0, 80, H); ctx.restore();
  ctx.restore();
}

function drawFrame(ctx, t, drain) {
  ctx.save();
  // the opening: a pointed arch cut into the wall, filled near-black
  stonePath(ctx, 0);
  ctx.fillStyle = '#070606'; ctx.fill();
  // stone rim: a wide stroke with a lit inner edge
  ctx.lineJoin = 'round';
  for (const [w, col] of [[34, '#3a3128'], [22, '#5b4c3b'], [8, '#8a7656']]) {
    stonePath(ctx, 0);
    ctx.lineWidth = w; ctx.strokeStyle = lerpColor(col, '#cdbb9c', drain * .5); ctx.stroke();
  }
  // voussoirs
  ctx.save(); ctx.globalAlpha = .45 * (1 - drain); ctx.strokeStyle = 'rgba(15,11,8,.8)'; ctx.lineWidth = 1.4;
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * (i / 24);
    const x0 = 960 - Math.cos(a) * 300, y0 = 84 + Math.sin(a) * 300;
    const x1 = 960 - Math.cos(a) * 336, y1 = 84 + Math.sin(a) * 336;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.restore();
  // inner reveal shadow
  stonePath(ctx, 10); ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
  // sill
  ctx.fillStyle = lerpColor('#2b241d', '#b7a586', drain * .6);
  ctx.fillRect(960 - 372, 860, 744, 30);
  ctx.strokeStyle = 'rgba(5,4,3,.8)'; ctx.lineWidth = 2; ctx.strokeRect(960 - 372, 860, 744, 30);
  ctx.strokeStyle = 'rgba(240,220,180,.22)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(960 - 370, 862); ctx.lineTo(960 + 370, 862); ctx.stroke();
  ctx.restore();
}

function drawMullions(ctx, t, drain) {
  const stone = lerpColor('#4a3f32', '#c6b598', drain * .5);
  const hi = 'rgba(235,215,180,.16)', lo = 'rgba(8,6,5,.55)';
  // central mullion and side mullions
  const bars = [[948, 972, 430, 872], [760, 790, 470, 872], [1130, 1160, 470, 872]];
  for (const [x0, x1, y0, y1] of bars) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, hi); g.addColorStop(.35, stone); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = 'rgba(10,8,6,.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }
  // stone ring around the rose
  ctx.save();
  ctx.strokeStyle = stone; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(ROSE.x, ROSE.y, ROSE.r + 12, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(235,215,180,.2)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ROSE.x - 2, ROSE.y - 2, ROSE.r + 19, Math.PI, Math.PI * 1.7); ctx.stroke();
  ctx.strokeStyle = 'rgba(8,6,5,.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(ROSE.x + 2, ROSE.y + 2, ROSE.r + 5, 0, 7); ctx.stroke();
  ctx.restore();
  // tracery between rose and lancets: trefoil piercings
  ctx.save(); ctx.fillStyle = 'rgba(18,14,11,.75)';
  for (const tx of [820, 1100]) {
    ctx.beginPath(); ctx.arc(tx, 400, 22, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.arc(tx, 400, 26, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = stone; ctx.stroke();
    ctx.fillStyle = 'rgba(18,14,11,.75)';
  }
  ctx.restore();
}

// shared hand-cut quarry grid
function quarryPoints(x0, x1, top, bot, cell, seed) {
  const R = mulberry(seed), pts = [];
  const cols = Math.ceil((x1 - x0) / cell) + 3, rows = Math.ceil((bot - top) / cell) + 3;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const jx = (R() - .5) * cell * .28, jy = (R() - .5) * cell * .28;
      row.push([x0 - cell + c * cell + (r % 2) * cell * .5 + jx, top - cell + r * cell + jy]);
    }
    pts.push(row);
  }
  return pts;
}

function paneFill(ctx, glow, p, color, inten, drain, sun, cx, cy, cell, idx) {
  const col = lerpColor('#100d0a', color, .10 + .90 * inten);
  const hi = lerpColor(col, '#ffedc0', Math.max(0, inten - .78) * .5);
  const g = ctx.createLinearGradient(cx - cell / 2, cy - cell / 2, cx + cell / 2, cy + cell / 2);
  g.addColorStop(0, hi); g.addColorStop(.5, col); g.addColorStop(1, lerpColor(col, '#000', .35));
  ctx.fillStyle = g; poly(ctx, p); ctx.fill();
  // weathering streaks and bubbles
  ctx.save(); poly(ctx, p); ctx.clip();
  ctx.globalAlpha = .10; ctx.strokeStyle = '#ffeccb'; ctx.lineWidth = 1.1;
  for (let k = 0; k < 2; k++) {
    const a = hash(idx * 3.3 + k) * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * cell, cy - Math.sin(a) * cell); ctx.lineTo(cx + Math.cos(a) * cell, cy + Math.sin(a) * cell); ctx.stroke();
  }
  ctx.globalAlpha = .16; ctx.fillStyle = '#120c08';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.arc(cx + (hash(idx + k * 7) - .5) * cell, cy + (hash(idx + k * 11) - .5) * cell, .8 + hash(idx + k) * 1.6, 0, 7); ctx.fill();
  }
  ctx.restore();
  // lead
  ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain * .8); ctx.lineWidth = 3.6; ctx.lineJoin = 'round';
  poly(ctx, p); ctx.stroke();
  if (inten > .55) {
    glow.fillStyle = color; glow.globalAlpha = .22 * (inten - .5) * (1 - drain);
    glow.beginPath(); glow.arc(cx, cy, cell * .55, 0, 7); glow.fill();
  }
}

function drawLancetPanes(ctx, l, t, sun, drain, glow) {
  const cell = 38, mid = (l.x0 + l.x1) / 2;
  ctx.save(); lancetPath(ctx, l); ctx.clip();
  // dark backlight behind the glass; the glass itself carries the colour
  ctx.fillStyle = `rgb(${Math.round(12 + 78 * sun.overall)},${Math.round(10 + 55 * sun.overall)},${Math.round(8 + 30 * sun.overall)})`;
  ctx.fillRect(l.x0, l.top, l.x1 - l.x0, l.bot - l.top);
  const rows = quarryPoints(l.x0, l.x1, l.top, l.bot, cell, 31 + Math.round(l.x0));
  let idx = 0;
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < rows[r].length - 1; c++) {
      const p = [rows[r][c], rows[r][c + 1], rows[r + 1][c + 1], rows[r + 1][c]];
      let cx = 0, cy = 0; for (const q of p) { cx += q[0] / 4; cy += q[1] / 4; }
      if (cx < l.x0 - cell || cx > l.x1 + cell || cy < l.top - cell || cy > l.bot + cell) continue;
      const ring = Math.hypot(cx - mid, (cy - 648) * .8);
      let color;
      if (ring < 96) color = [C.ruby2, C.cobalt2, C.ruby2, C.cobalt2][idx % 4];
      else if (ring < 122) color = C.ruby;
      else if (cy > 810) color = idx % 3 ? C.ruby2 : C.green;
      else color = idx % 37 === 0 ? C.gold : idx % 29 === 0 ? C.ruby2 : idx % 53 === 0 ? C.green : idx % 41 === 0 ? C.violet : [C.cobalt, C.cobalt2, C.cobalt, C.cobalt][idx % 4];
      const lit = ss(clamp((sun.bandX - cx) / 130 + .5, 0, 1));
      const inten = clamp(.05 + 1.0 * lit * (.22 + .78 * sun.overall), 0, 1.15);
      paneFill(ctx, glow, p, color, inten, drain, sun, cx, cy, cell, idx);
      idx++;
    }
  }
  // ruby border band
  lancetPath(ctx, l); ctx.lineWidth = 22; ctx.strokeStyle = lerpColor(lerpColor('#140b0a', C.ruby, .15 + .85 * ss(clamp((sun.bandX - mid) / 220 + .5, 0, 1)) * sun.overall), '#c9b79a', drain); ctx.stroke();
  lancetPath(ctx, l); ctx.lineWidth = 4; ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.stroke();
  ctx.restore();

  // medallion with grisaille rosette
  const mx = mid, my = 648, r = 88;
  const lit = ss(clamp((sun.bandX - mx) / 180 + .45, 0, 1));
  const inten = clamp(.05 + 1.0 * lit * (.22 + .78 * sun.overall), 0, 1.15);
  ctx.save();
  for (let k = 0; k < 12; k++) {
    const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2;
    const base = [C.gold, C.ruby2, C.cobalt2, C.ruby2][k % 4];
    const col = lerpColor('#100d0a', base, .10 + .90 * inten);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, r, a0, a1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.lineWidth = 4; ctx.stroke();
  }
  // grisaille: concentric rings and dots
  ctx.strokeStyle = 'rgba(30,18,8,.7)'; ctx.lineWidth = 1.6;
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(mx, my, r * i / 4, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,238,200,.55)';
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2;
    ctx.beginPath(); ctx.arc(mx + Math.cos(a) * r * .82, my + Math.sin(a) * r * .82, 1.6, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(mx, my, r * .28, 0, 7); ctx.stroke();
  if (inten > .5) {
    glow.fillStyle = C.gold; glow.globalAlpha = .25 * (inten - .4) * (1 - drain);
    glow.beginPath(); glow.arc(mx, my, r * .9, 0, 7); glow.fill();
  }
  ctx.restore();
}

function drawRose(ctx, t, sun, drain, glow) {
  const { x, y, r } = ROSE;
  const lit = ss(clamp((sun.bandX - x) / 220 + .75, 0, 1));
  const inten = clamp(.05 + 1.0 * lit * (.22 + .78 * sun.overall), 0, 1.15);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.fillStyle = `rgb(${Math.round(10 + 80 * sun.overall)},${Math.round(8 + 55 * sun.overall)},${Math.round(6 + 26 * sun.overall)})`;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const n = 12;
  for (let ring = 0; ring < 3; ring++) {
    const r0 = ring === 0 ? 0 : [r * .32, r * .63][ring - 1], r1 = [r * .32, r * .63, r][ring];
    const segn = ring === 0 ? 6 : n;
    for (let k = 0; k < segn; k++) {
      const a0 = k / segn * Math.PI * 2 + ring * .26, a1 = (k + 1) / segn * Math.PI * 2 + ring * .26;
      const palette = ring === 0 ? [C.gold, C.ruby2, C.gold, C.ruby2] : ring === 1 ? [C.ruby2, C.cobalt2, C.ruby2, C.cobalt2] : [C.cobalt2, C.cobalt2, C.cobalt, C.cobalt2];
      const base = palette[k % 4];
      const col = lerpColor('#100d0a', base, .10 + .90 * inten);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r1, a0, a1); if (r0 > 0) ctx.arc(x, y, r0, a1, a0, true); else ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.lineWidth = ring === 2 ? 4.5 : 3.4; ctx.stroke();
      if (inten > .55) {
        glow.fillStyle = base; glow.globalAlpha = .18 * (inten - .4) * (1 - drain);
        glow.beginPath(); glow.arc(x + Math.cos((a0 + a1) / 2) * (r0 + r1) / 2, y + Math.sin((a0 + a1) / 2) * (r0 + r1) / 2, (r1 - r0) * .38, 0, 7); glow.fill();
      }
    }
  }
  // grisaille petals
  ctx.strokeStyle = 'rgba(25,15,7,.65)'; ctx.lineWidth = 1.4;
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .18, y + Math.sin(a) * r * .18); ctx.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
}

function sideLancets(ctx, t, sun, drain) {
  SIDES.forEach((l, idx) => {
    const bot = 842, mid = (l.x0 + l.x1) / 2;
    const path = c => { c.beginPath(); c.moveTo(l.x0, bot); c.lineTo(l.x0, l.top + 46); c.quadraticCurveTo(l.x0, l.top + 2, mid, l.top); c.quadraticCurveTo(l.x1, l.top + 2, l.x1, l.top + 46); c.lineTo(l.x1, bot); c.closePath(); };
    ctx.save(); path(ctx); ctx.clip();
    ctx.fillStyle = '#0a0d12'; ctx.fillRect(l.x0, l.top, l.x1 - l.x0, bot - l.top);
    const lit = ss(clamp((sun.bandX - mid) / 200 + .3, 0, 1));
    for (let y = l.top; y < bot; y += 46) for (let x = l.x0; x < l.x1; x += 46) {
      const col = lerpColor('#0a0d12', idx ? C.cobalt : C.ruby, .15 + .6 * lit * sun.overall);
      ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, 44, 44);
      ctx.strokeStyle = lerpColor('#0f0c09', '#4e3a27', drain); ctx.lineWidth = 2.6; ctx.strokeRect(x + 1, y + 1, 44, 44);
    }
    ctx.restore();
    ctx.strokeStyle = lerpColor('#3d3227', '#b8a688', drain); ctx.lineWidth = 10; path(ctx); ctx.stroke();
  });
}

function shafts(ctx, t, sun, drain) {
  if (drain > .2) return;
  const a = 1 - drain;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const x0 = 780 + i * 70;
    const g = ctx.createLinearGradient(x0, 380, x0 - 110, 1080);
    g.addColorStop(0, 'rgba(255,228,170,0)');
    g.addColorStop(.22, `rgba(255,222,160,${.13 * a * (.35 + sun.overall)})`);
    g.addColorStop(.75, `rgba(255,210,140,${.05 * a})`);
    g.addColorStop(1, 'rgba(255,205,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 30, 380); ctx.lineTo(x0 + 30, 380); ctx.lineTo(x0 - 40, 1080); ctx.lineTo(x0 - 210, 1080); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  const R = mulberry(88);
  ctx.save(); ctx.globalAlpha = .4 * a;
  for (let i = 0; i < 70; i++) {
    const x = 760 + R() * 460, y = 300 + ((R() * 760 + t * (4 + R() * 9)) % 780);
    ctx.fillStyle = 'rgba(255,232,190,' + (.18 + R() * .5) + ')';
    ctx.beginPath(); ctx.arc(x, y, .5 + R() * 2.1, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawFloor(ctx, t, sun, drain) {
  const top = 892;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, lerpColor('#1d1712', '#d8c8ab', drain));
  g.addColorStop(1, lerpColor('#0c0907', '#c6b28e', drain));
  ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
  ctx.save(); ctx.globalAlpha = .85 * (1 - drain);
  for (let i = 0; i < 6; i++) {
    const y = top + i * 30, step = 150 + i * 34;
    for (let x = -140 + (i % 2) * 70; x < W + 140; x += step) {
      ctx.fillStyle = `rgba(${66 + i * 5},${54 + i * 5},${42 + i * 4},.5)`;
      ctx.fillRect(x, y, step - 7, 28);
      ctx.strokeStyle = 'rgba(8,6,5,.6)'; ctx.lineWidth = 1.6; ctx.strokeRect(x, y, step - 7, 28);
    }
  }
  ctx.restore();
  // projected colour patch, mirrored and blurred
  ctx.save();
  ctx.globalAlpha = (.45 + .25 * sun.overall) * (1 - drain);
  ctx.filter = 'blur(16px)';
  const pg = ctx.createLinearGradient(0, top, 0, H);
  pg.addColorStop(0, 'rgba(170,90,80,.55)');
  pg.addColorStop(.45, 'rgba(150,90,50,.3)');
  pg.addColorStop(1, 'rgba(100,80,60,0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.moveTo(800, top); ctx.lineTo(1120, top); ctx.lineTo(1360, H); ctx.lineTo(560, H); ctx.closePath(); ctx.fill();
  const cols = ['#b32430', '#1c4fa8', '#c9922e', '#245c43'];
  for (let i = 0; i < 10; i++) {
    ctx.globalAlpha = .12 * (1 - drain); ctx.fillStyle = cols[i % 4];
    ctx.fillRect(720 + (i * 67) % 420, top + 8 + (i * 41) % 120, 80 + (i % 3) * 30, 42);
  }
  ctx.restore();
}

function perspectiveLines(ctx, t, drain) {
  if (drain <= .02) return;
  const p = ss(seg(t, 36.0, 37.4));
  ctx.save(); ctx.globalAlpha = .7 * p; ctx.strokeStyle = '#4a3524'; ctx.lineWidth = 1.2;
  const vy = 560;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * 100, 420 + Math.sin(a) * 60);
    ctx.lineTo(960 + Math.cos(a) * 1500, vy + Math.sin(a) * 900); ctx.stroke();
  }
  ctx.strokeRect(360, 160, 1200, 760);
  ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2.6; ctx.strokeRect(360, 160, 1200, 760);
  ctx.beginPath(); ctx.arc(960, vy, 5, 0, 7); ctx.fillStyle = '#3b2a1a'; ctx.fill();
  ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { s, fx, fy, tx } = cam(t);
  const sun = sunState(t);
  const drain = ss(seg(t, 35.6, 37.2));
  ctx.save();
  ctx.translate(W / 2 + tx, H / 2); ctx.scale(s, s); ctx.translate(-fx, -fy);
  drawWall(ctx, t, drain);
  drawFloor(ctx, t, sun, drain);
  drawFrame(ctx, t, drain);

  const g = bloomC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
  drawLancetPanes(ctx, LANCETS[0], t, sun, drain, g);
  drawLancetPanes(ctx, LANCETS[1], t, sun, drain, g);
  drawRose(ctx, t, sun, drain, g);
  sideLancets(ctx, t, sun, drain);
  drawMullions(ctx, t, drain);

  if (drain < .92) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5 * (1 - drain);
    ctx.filter = 'blur(24px)'; ctx.drawImage(bloomC, 0, 0); ctx.filter = 'none'; ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .32 * (1 - drain);
    ctx.filter = 'blur(64px)'; ctx.drawImage(bloomC, 0, 0); ctx.filter = 'none'; ctx.restore();
  }
  shafts(ctx, t, sun, drain);
  if (drain > 0) {
    ctx.save(); ctx.globalAlpha = drain * .9;
    const pg = ctx.createLinearGradient(0, 0, W, H);
    pg.addColorStop(0, '#f1e8d2'); pg.addColorStop(1, '#e9dcc0');
    ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  perspectiveLines(ctx, t, drain);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
