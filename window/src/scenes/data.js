import {
  W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry, makeCanvas,
  text, measure, rgba, F
} from '../common.js';

const BG = '#05080c';
let pts = [], grain;

function init() {
  if (pts.length) return;
  const R = mulberry(404);
  const floors = 60, per = 190;
  for (let f = 0; f < floors; f++) {
    const u = f / (floors - 1);
    const y = -310 + u * 620;
    const r = 200 - 96 * u + 8 * Math.sin(f * .33);
    const twist = f * .052;
    const ring = f % 4 === 0;
    for (let k = 0; k < per; k++) {
      const a = k / per * Math.PI * 2 + twist + (R() - .5) * .03;
      const ca = Math.cos(a), sa = Math.sin(a);
      const rr = r + (ring ? 7 : 0) + (R() - .5) * 3;
      const x = Math.sign(ca) * Math.pow(Math.abs(ca), .74) * rr;
      const z = Math.sign(sa) * Math.pow(Math.abs(sa), .74) * rr;
      if (hash(f * 31 + k * 7) < .16) continue;
      pts.push({ x, y: y + (R() - .5) * 3, z, s: (ring ? 1.25 : .7) + R() * 1.5, ph: R() * 7, green: 0 });
    }
  }
  // eight vertical fins
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    for (let f = 0; f < floors; f += .18) {
      const u = f / (floors - 1), y = -310 + u * 620;
      const r = 200 - 96 * u + 8 * Math.sin(f * .33) + 5;
      const aa = a + f * .052;
      const ca = Math.cos(aa), sa = Math.sin(aa);
      pts.push({ x: Math.sign(ca) * Math.pow(Math.abs(ca), .74) * r, y, z: Math.sign(sa) * Math.pow(Math.abs(sa), .74) * r, s: 1.5, ph: hash(i * 7 + f), green: 0 });
    }
  }
  // green terraces climbing one face
  for (let f = 6; f < floors - 3; f += 2) {
    const u = f / (floors - 1), y = -310 + u * 620;
    const r = 200 - 96 * u + 8 * Math.sin(f * .33) + 14;
    for (let k = 0; k < 46; k++) {
      const a = -.15 + k / 46 * 1.05 + f * .052;
      const ca = Math.cos(a), sa = Math.sin(a);
      pts.push({ x: Math.sign(ca) * Math.pow(Math.abs(ca), .74) * r, y: y + (hash(f + k) - .5) * 10, z: Math.sign(sa) * Math.pow(Math.abs(sa), .74) * r, s: .8 + hash(k) * 1.2, ph: hash(f * k), green: 1 });
    }
  }
  // ground survey points
  for (let i = 0; i < 900; i++) {
    const a = R() * Math.PI * 2, rr = 80 + Math.sqrt(R()) * 320;
    pts.push({ x: Math.cos(a) * rr, y: -316, z: Math.sin(a) * rr, s: .5 + R() * .9, ph: R(), green: 0, ground: 1 });
  }
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = hash(i * .59) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 12; }
  g.putImageData(im, 0, 0);
}
init();

function project(x, y, z, a, f = 980, cx = 960, cy = 540) {
  const c = Math.cos(a), s = Math.sin(a);
  const rx = x * c - z * s, rz = x * s + z * c;
  const d = rz * .55 + 900;
  const k = f / d;
  return [cx + rx * k, cy - y * k, k];
}

function cam(t) {
  const a = -.5 + .55 * ss(seg(t, 89, 101));
  const yawBob = Math.sin((t - 89) * .35) * .035;
  return { a: a + yawBob, lift: lerp(0, 40, ss(seg(t, 94, 101))) };
}

function hud(ctx, t, u) {
  const a = ss(seg(t, 90.0, 91.2)) * (1 - ss(seg(t, 101.5, 102.5)));
  if (!a) return;
  ctx.save(); ctx.globalAlpha = .8 * a;
  ctx.strokeStyle = 'rgba(150,230,220,.55)'; ctx.lineWidth = 1;
  text(ctx, 'PARAMETRIC TOWER', 92, 92, { size: 20, font: F.cons, color: '#dff6f2', spacing: 2.4 });
  text(ctx, 'SCAN 07  /  2026', 92, 118, { size: 13, font: F.cons, color: 'rgba(150,230,220,.7)', spacing: 2 });
  text(ctx, 'POINTS  12,480', W - 320, 92, { size: 13, font: F.cons, color: 'rgba(150,230,220,.75)', spacing: 1.6 });
  text(ctx, 'POROSITY  0.42', W - 320, 116, { size: 13, font: F.cons, color: 'rgba(150,230,220,.75)', spacing: 1.6 });
  // corner ticks
  const m = 40;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + 18 * dy); ctx.lineTo(x, y); ctx.lineTo(x + 18 * dx, y); ctx.stroke();
  }
  // crosshair
  ctx.globalAlpha = .35 * a;
  ctx.beginPath(); ctx.arc(960, 540, 26, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(920, 540); ctx.lineTo(940, 540); ctx.moveTo(980, 540); ctx.lineTo(1000, 540);
  ctx.moveTo(960, 500); ctx.lineTo(960, 520); ctx.moveTo(960, 560); ctx.lineTo(960, 580); ctx.stroke();
  // metrics bottom
  ctx.globalAlpha = .7 * a;
  text(ctx, 'LIVE FACADE  ·  GREENERY  18.4%', 92, H - 64, { size: 14, font: F.cons, color: 'rgba(150,230,220,.75)', spacing: 1.4 });
  text(ctx, 'SCAN PLANE  Y ' + (u * 620 - 310).toFixed(1), 92, H - 40, { size: 14, font: F.cons, color: 'rgba(150,230,220,.6)', spacing: 1.2 });
  ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { a, lift } = cam(t);
  const assemble = ss(seg(t, 88.8, 91.8));
  const scanP = seg(t, 93.0, 97.2);
  const scanY = lerp(-340, 330, eio(scanP));
  const greenP = ss(seg(t, 96.8, 99.4));
  const collapse = ss(seg(t, 100.2, 103.0));
  const fade = 1 - ss(seg(t, 103.0, 103.6));

  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  // faint survey grid
  ctx.save(); ctx.globalAlpha = .05 * fade; ctx.strokeStyle = '#7fe7e0'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  const scanScreenY = 540 - scanY * 1.05;
  if (scanP > 0 && scanP < 1) {
    // scan fan
    const g = ctx.createLinearGradient(0, scanScreenY - 120, 0, scanScreenY + 120);
    g.addColorStop(0, 'rgba(120,240,220,0)'); g.addColorStop(.5, 'rgba(120,240,220,.10)'); g.addColorStop(1, 'rgba(120,240,220,0)');
    ctx.fillStyle = g; ctx.fillRect(0, scanScreenY - 120, W, 240);
    ctx.save(); ctx.globalAlpha = .55;
    ctx.strokeStyle = '#bff9ef'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, scanScreenY); ctx.lineTo(W, scanScreenY); ctx.stroke();
    ctx.restore();
  }

  // points
  const R = mulberry(7);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const [px, py, k] = project(p.x, p.y, p.z, a, 980, 960, 540 - lift);
    // assemble from a scattered cloud
    const sx = 960 + (hash(i * 3.1) - .5) * 2200, sy = 540 + (hash(i * 7.7) - .5) * 1200;
    let x = lerp(sx, px, assemble), y = lerp(sy, py, assemble);
    let alpha = .18 + .55 * assemble;
    // scan highlight
    if (scanP > 0 && scanP < 1) {
      const d = Math.abs(p.y - scanY);
      if (d < 55) { alpha = Math.min(1, alpha + (1 - d / 55) * .9); }
    }
    // green terraces climb
    if (p.green && greenP > 0) {
      const up = clamp((p.y + 310) / 620, 0, 1);
      alpha = Math.max(alpha, greenP * (up < greenP * 1.1 ? .95 : 0));
    }
    // collapse to a stone column
    if (collapse > 0) {
      const tx = 600 + (hash(i * 1.7) - .5) * 34, ty = 540 + (hash(i * 2.3) - .5) * 600;
      x = lerp(x, tx, eio(collapse)); y = lerp(y, ty, eio(collapse));
      alpha *= (1 - collapse * .25);
    }
    if (alpha <= .02) continue;
    if (p.ground) alpha *= .45 * (1 - collapse);
    let col;
    if (p.green && greenP > 0) col = `rgba(110,235,150,${alpha})`;
    else if (hash(i * 5.3) > .93) col = `rgba(255,206,140,${alpha})`;
    else if (hash(i * 9.1) > .5) col = `rgba(160,240,232,${alpha})`;
    else col = `rgba(120,190,235,${alpha})`;
    const s = clamp(p.s * k * .9, .6, 2.6);
    ctx.fillStyle = col;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    if ((p.green && greenP > 0) || (scanP > 0 && scanP < 1 && Math.abs(p.y - scanY) < 18)) {
      ctx.save(); ctx.globalAlpha = .12 * alpha; ctx.fillStyle = p.green ? '#6eeb96' : '#bff9ef';
      ctx.beginPath(); ctx.arc(x, y, s * 3.5, 0, 7); ctx.fill(); ctx.restore();
    }
  }

  // contours: a few floor rings, faint
  ctx.save(); ctx.globalAlpha = .10 * assemble * (1 - collapse); ctx.strokeStyle = '#8fe6de'; ctx.lineWidth = .8;
  for (let f = 4; f < 58; f += 6) {
    const y = -310 + f * (620 / 57);
    const r = 132 + 34 * Math.sin(f * .21) + 12 * Math.cos(f * .07);
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) {
      const ang = k / 60 * Math.PI * 2 + f * .045;
      const [x, yy] = project(Math.cos(ang) * r, y, Math.sin(ang) * r, a, 980, 960, 540 - lift);
      if (k === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();

  hud(ctx, t, scanP);
  // fade to black at the cut
  ctx.save(); ctx.globalAlpha = 1 - fade; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
