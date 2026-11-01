import {
  W, H, clamp, lerp, seg, ss, eio, eo, back, hash, mulberry, makeCanvas,
  poly, hatch, text, measure, rgba, lerpColor, paperTexture, F
} from './common.js';
import { B, ERA, ENTRY, INTRO, OUTRO, DUR, ERA_START, entryAt } from './buildings.js';

let paper, grain;
const OX = 1390, OY = 792, S = 300;

function init() {
  if (paper) return;
  paper = paperTexture(2880, 1620, 61, '#efe6d3', '#e2d2b4');
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = hash(i * .73) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 15; }
  g.putImageData(im, 0, 0);
}
init();

const P = (x, y, z = 0) => [OX + (x - z) * S * .78, OY - y * S + (x + z) * S * .30];

const COL = {
  gold: '#d4a441', lapis: '#1d4f9e', ruby: '#8e1622', green: '#2f6b4f', white: '#e8dcc2',
  terra: '#b46b4a', blue: '#8fb0c9', olive: '#8f8a5a', red: '#e30613', grey: '#c9c8c2',
  pink: '#f4a6b8', mint: '#8fd3c7', yellow: '#f6d365', cobalt: '#3d5afe', cyan: '#7fe7e0',
};

function eraOf(b) { return ERA[b.era]; }

function paperFace(ctx, pts, shade) {
  const p = pts.map(q => P(...q));
  poly(ctx, p);
  const g = ctx.createLinearGradient(p[0][0], p[0][1], p[2][0], p[2][1]);
  const v = Math.round(246 - shade * 20);
  g.addColorStop(0, `rgb(${v},${v - 6},${v - 28})`); g.addColorStop(1, `rgb(${v - 18},${v - 26},${v - 48})`);
  ctx.fillStyle = g; ctx.fill();
  return p;
}

function face(ctx, pts, shade, col, b) {
  const st = b.era;
  const p = paperFace(ctx, pts, shade);
  const mode = ERA[st].mode;
  if (mode === 'engraving') {
    if (shade < .95) hatch(ctx, p, { angle: shade < .7 ? 1.28 : .62, spacing: 4.2 + shade * 3, width: 1.1, color: '#241a12', progress: 1, jitter: .08 });
    poly(ctx, p); ctx.strokeStyle = '#241a12'; ctx.lineWidth = 1.8; ctx.stroke();
  } else if (mode === 'lapis') {
    let c = COL.gold;
    if (col === 'lapis') c = COL.lapis; else if (col === 'ruby') c = COL.ruby; else if (col === 'green') c = COL.green; else if (col === 'white') c = COL.white;
    const cc = lerpColor('#120d09', c, .55 + .45 * shade);
    ctx.fillStyle = cc; ctx.fill();
    ctx.strokeStyle = 'rgba(232,211,162,.75)'; ctx.lineWidth = 1.4; poly(ctx, p); ctx.stroke();
    ctx.strokeStyle = 'rgba(212,164,65,.35)'; ctx.lineWidth = 1; poly(ctx, p); ctx.stroke();
  } else if (mode === 'wash') {
    let c = COL.terra; if (col === 'blue') c = COL.blue; else if (col === 'olive') c = COL.olive; else if (col === 'white') c = COL.white;
    ctx.fillStyle = rgba(c, .25 + .25 * shade); ctx.fill();
    ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 1.5; poly(ctx, p); ctx.stroke();
    if (shade < .7) hatch(ctx, p, { angle: 1.2, spacing: 7, width: .65, color: '#3b2a1a', progress: 1, jitter: .15 });
  } else if (mode === 'blueprint') {
    ctx.fillStyle = lerpColor('#1b3b78', '#2a58a6', shade * .7); ctx.fill();
    ctx.strokeStyle = '#e9f2fb'; ctx.lineWidth = 1.5; poly(ctx, p); ctx.stroke();
    if (shade < .8) hatch(ctx, p, { angle: 1.25, spacing: 6, width: .7, color: 'rgba(233,242,251,.55)', progress: 1, jitter: .1 });
  } else if (mode === 'swiss') {
    let c = shade > .95 ? '#ffffff' : shade > .7 ? '#e9e9e4' : '#d2d2cc';
    if (col === 'red') c = COL.red; else if (col === 'dark') c = '#1a1a1a'; else if (col === 'grey') c = COL.grey;
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; poly(ctx, p); ctx.stroke();
  } else if (mode === 'memphis') {
    const map = { gold: COL.yellow, lapis: COL.cobalt, ruby: COL.pink, green: COL.mint, white: '#fffdf4' };
    ctx.fillStyle = map[col] || COL.pink; ctx.fill();
    ctx.strokeStyle = '#17131f'; ctx.lineWidth = 4.5; poly(ctx, p); ctx.stroke();
  } else if (mode === 'points') {
    ctx.fillStyle = 'rgba(8,16,22,.85)'; ctx.fill();
    ctx.strokeStyle = 'rgba(127,231,224,.75)'; ctx.lineWidth = 1.2; poly(ctx, p); ctx.stroke();
    const R = mulberry(Math.round(p[0][0] * 7 + p[0][1] * 3));
    for (let i = 0; i < 18; i++) {
      const u = R(), v = R();
      const x = lerp(p[0][0], p[1][0], u) * (1 - v) + lerp(p[3][0], p[2][0], u) * v;
      const y = lerp(p[0][1], p[1][1], u) * (1 - v) + lerp(p[3][1], p[2][1], u) * v;
      ctx.fillStyle = `rgba(127,231,224,${.15 + R() * .35})`;
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }
}

function box(ctx, x0, x1, y0, y1, z0, z1, col, b) {
  const top = [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]];
  const side = [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]];
  const front = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  face(ctx, side, .62, col, b); face(ctx, top, 1.1, col, b); face(ctx, front, .92, col, b);
}
function prism(ctx, x0, x1, y0, y1, z0, z1, peak, col, b) {
  const front = [[x0, y0, z1], [x1, y0, z1], [(x0 + x1) / 2, peak, z1]];
  const side = [[x1, y0, z1], [x1, y0, z0], [(x0 + x1) / 2, peak, z0], [(x0 + x1) / 2, peak, z1]];
  const back = [[x0, y0, z0], [x1, y0, z0], [(x0 + x1) / 2, peak, z0]];
  face(ctx, side, .6, col, b); face(ctx, back, .8, col, b); face(ctx, front, 1, col, b);
}
function cyl(ctx, x, z, y0, y1, r, col, b, seg = 14) {
  const top = [], front = [], side = [];
  for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2;
    const xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r;
    top.push([xx, y1, zz]);
    front.push([xx, y0, zz]);
    side.push([xx, y1, zz]);
  }
  const sp = side.map(q => P(...q));
  const fp = front.map(q => P(...q));
  poly(ctx, [...sp, ...fp.reverse()]); ctx.fillStyle = b.era === 3 ? '#20427f' : '#d8c9ac'; ctx.fill();
  face(ctx, top, 1.1, col, b);
  // side drawn as a face for style
  const sideQuad = [[x - r, y0, z + r], [x + r, y0, z + r], [x + r, y1, z + r], [x - r, y1, z + r]];
  face(ctx, sideQuad, .72, col, b);
}
function dome(ctx, cx, cy, rx, ry, col, b) {
  const p = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI * (i / 20); p.push([cx + Math.cos(a) * rx, cy - Math.sin(a) * ry]); }
  poly(ctx, p);
  const mode = ERA[b.era].mode;
  const c = mode === 'lapis' ? COL.gold : mode === 'points' ? '#0a1118' : '#e7dbc2';
  ctx.fillStyle = mode === 'blueprint' ? '#1b3b78' : c; ctx.fill();
  ctx.strokeStyle = mode === 'blueprint' ? '#e9f2fb' : mode === 'lapis' ? '#e8d3a2' : '#241a12'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 1; i < 8; i++) {
    const a = Math.PI * (i / 8);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rx, cy - Math.sin(a) * ry); ctx.stroke();
  }
}
function ellipse(ctx, cx, cy, rx, ry, fill, stroke, w = 2) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
}
function gable(ctx, cx, baseY, w, h, col, b) {
  const p = [[cx - w / 2, baseY], [cx + w / 2, baseY], [cx, baseY - h]];
  poly(ctx, p); ctx.fillStyle = ERA[b.era].mode === 'lapis' ? COL.ruby : '#efe5cf'; ctx.fill();
  ctx.strokeStyle = ERA[b.era].mode === 'blueprint' ? '#e9f2fb' : ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
}

// ——— building types ———
function pyramid(ctx, b, q) {
  const w = 1.15, h = 1.55;
  const front = [[-w, 0, w], [w, 0, w], [0, h, w]];
  const side = [[w, 0, w], [w, 0, -w], [0, h, -w], [0, h, w]];
  face(ctx, side, .62, 'gold', b); face(ctx, front, .95, 'gold', b);
  // courses
  for (let i = 1; i < 7; i++) {
    const y = i / 7 * h, ww = w * (1 - i / 7);
    const p = [P(-ww, y, w), P(ww, y, w)];
    ctx.beginPath(); ctx.moveTo(...p[0]); ctx.lineTo(...p[1]); ctx.strokeStyle = ERA[b.era].mode === 'blueprint' ? 'rgba(233,242,251,.6)' : 'rgba(36,26,18,.45)'; ctx.lineWidth = 1; ctx.stroke();
  }
}
function temple(ctx, b, q) {
  box(ctx, -1.2, 1.2, 0, .18, -.6, .6, 'white', b);
  box(ctx, -1.1, 1.1, .18, .3, -.5, .5, 'white', b);
  for (let i = 0; i < 6; i++) {
    const x = -1 + i * .4;
    box(ctx, x - .07, x + .07, .3, 1.25, .42, .56, 'white', b);
    if (b.type === 'temple') box(ctx, x - .07, x + .07, .3, 1.25, -.56, -.42, 'white', b);
  }
  box(ctx, -1.15, 1.15, 1.25, 1.5, -.58, .58, 'white', b);
  gable(ctx, OX, OY - 1.5 * S, 2.3 * S * .78, .55 * S, 'white', b);
  // pediment depth
  const p = P(0, 1.5, .58);
  ctx.beginPath(); ctx.moveTo(...P(-1.15, 1.5, .58)); ctx.lineTo(...P(1.15, 1.5, .58)); ctx.lineTo(...P(0, 1.5, -.58)); ctx.closePath();
  ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 1; ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1;
}
function stupa(ctx, b, q) {
  cyl(ctx, 0, 0, 0, .35, 1.2, 'white', b);
  cyl(ctx, 0, 0, .35, .55, .95, 'white', b);
  dome(ctx, OX, OY - .55 * S, .95 * S * .78, .75 * S, 'white', b);
  box(ctx, -.12, .12, 1.15, 1.9, -.12, .12, 'gold', b);
}
function amphitheater(ctx, b, q) {
  const cx = OX, cy = OY - .1 * S;
  for (let i = 0; i < 4; i++) {
    ellipse(ctx, cx, cy - i * 26, (1.25 - i * .12) * S * .78, (0.55 - i * .05) * S, null, ERA[b.era].mode === 'blueprint' ? '#e9f2fb' : '#241a12', 2);
  }
  for (let i = 0; i < 18; i++) {
    const a = Math.PI + i / 17 * Math.PI;
    const x = cx + Math.cos(a) * 1.1 * S * .78, y = cy + Math.sin(a) * .5 * S;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 55); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 1.2; ctx.stroke();
  }
}
function domeType(ctx, b, q) {
  const p = b.p || {};
  if (p.wings) box(ctx, -1.5, 1.5, 0, .55, -.6, .6, 'white', b);
  box(ctx, -.85, .85, 0, .55, -.65, .65, 'white', b);
  cyl(ctx, 0, 0, .55, 1.0, .62, 'white', b);
  dome(ctx, OX, OY - 1.0 * S, .62 * S * .78, .72 * S, 'gold', b);
  box(ctx, -.1, .1, 1.7, 1.95, -.1, .1, 'white', b);
  if (p.portico) {
    for (let i = 0; i < 6; i++) { const x = -.55 + i * .22; box(ctx, x - .035, x + .035, 0, .95, .85, .95, 'white', b); }
    box(ctx, -.7, .7, .95, 1.12, .82, .98, 'white', b);
    gable(ctx, OX, OY - 1.12 * S, 1.5 * S * .78, .3 * S, 'white', b);
  }
}
function basilica(ctx, b, q) {
  const p = b.p || {};
  if (p.hypostyle) {
    box(ctx, -1.3, 1.3, 0, .25, -.8, .8, 'white', b);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      const x = -1.1 + i * .275, z = -.6 + j * .4;
      cyl(ctx, x, z, .25, 1.15, .05, 'white', b, 8);
    }
    box(ctx, -1.3, 1.3, 1.15, 1.3, -.8, .8, 'white', b);
    return;
  }
  box(ctx, -1.1, 1.1, 0, .55, -.7, .7, 'white', b);
  cyl(ctx, 0, 0, .55, .85, .75, 'white', b);
  dome(ctx, OX, OY - .85 * S, .78 * S * .78, .72 * S, 'gold', b);
  if (p.minarets) {
    for (const sx of [-1.25, 1.25]) for (const sz of [-.7, .7]) {
      cyl(ctx, sx, sz, 0, 1.35, .055, 'white', b, 8);
      dome(ctx, P(sx, 1.35, sz)[0], P(sx, 1.35, sz)[1], .07 * S * .78, .08 * S, 'gold', b);
    }
  }
  if (p.octagon) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      box(ctx, Math.cos(a) * 1.05 - .05, Math.cos(a) * 1.05 + .05, 0, .7, Math.sin(a) * .7 - .05, Math.sin(a) * .7 + .05, 'white', b);
    }
  }
}
function pagoda(ctx, b, q) {
  const tiers = (b.p && b.p.tiers) || 5;
  box(ctx, -1.0, 1.0, 0, .18, -.7, .7, 'white', b);
  for (let i = 0; i < tiers; i++) {
    const w = .8 - i * .1, y0 = .18 + i * .34;
    box(ctx, -w, w, y0, y0 + .22, -.55, .55, 'ruby', b);
    // hip roof
    const y1 = y0 + .3;
    const front = [[-w - .18, y1, .65], [w + .18, y1, .65], [w + .1, y1 + .12, .45], [-w - .1, y1 + .12, .45]];
    face(ctx, front, .95, 'gold', b);
    const side = [[w + .18, y1, .65], [w + .18, y1, -.65], [w + .1, y1 + .12, -.45], [w + .1, y1 + .12, .45]];
    face(ctx, side, .7, 'gold', b);
  }
  box(ctx, -.06, .06, 1.85, 2.15, -.06, .06, 'gold', b);
}
function angkor(ctx, b, q) {
  box(ctx, -1.3, 1.3, 0, .22, -.8, .8, 'white', b);
  const towers = [[0, 0, 1.0], [-.85, .2, .7], [.85, .2, .7], [-.5, -.55, .6], [.5, -.55, .6]];
  for (const [x, z, h] of towers) {
    box(ctx, x - .22, x + .22, .22, .22 + h * .55, z - .22, z + .22, 'white', b);
    for (let k = 0; k < 3; k++) {
      const y = .22 + h * .55 + k * .12;
      const ww = .22 - k * .05;
      box(ctx, x - ww, x + ww, y, y + .1, z - ww, z + ww, 'gold', b);
    }
  }
}
function gothic(ctx, b, q) {
  // facade: two towers, nave, rose, three portals, steep roofs
  box(ctx, -1.5, 1.5, 0, .22, -.55, .55, 'white', b);
  for (const x of [-1.05, 1.05]) {
    box(ctx, x - .32, x + .32, .22, 1.9, -.4, .4, 'lapis', b);
    prism(ctx, x - .34, x + .34, 1.9, 1.95, -.42, .42, 2.35, 'gold', b);
    for (let k = 1; k < 7; k++) {
      const y = .45 + k * .19;
      ctx.beginPath(); ctx.moveTo(...P(x - .18, y, .41)); ctx.lineTo(...P(x + .18, y, .41));
      ctx.strokeStyle = 'rgba(232,211,162,.35)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  box(ctx, -.65, .65, .22, 1.45, -.45, .45, 'white', b);
  prism(ctx, -.7, .7, 1.45, 1.5, -.5, .5, 2.05, 'lapis', b);
  // rose
  const rx = OX, ry = OY - 1.55 * S;
  ellipse(ctx, rx, ry, .3 * S * .78, .3 * S, COL.ruby, COL.gold, 3);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(rx + Math.cos(a) * .08 * S, ry + Math.sin(a) * .08 * S); ctx.lineTo(rx + Math.cos(a) * .28 * S, ry + Math.sin(a) * .28 * S); ctx.strokeStyle = COL.gold; ctx.lineWidth = 1.2; ctx.stroke(); }
  // portals
  for (const x of [-.45, 0, .45]) {
    const p0 = P(x, .22, .46);
    ctx.beginPath(); ctx.moveTo(p0[0] - 22, p0[1]); ctx.lineTo(p0[0] - 22, p0[1] - 70); ctx.quadraticCurveTo(p0[0], p0[1] - 108, p0[0] + 22, p0[1] - 70); ctx.lineTo(p0[0] + 22, p0[1]);
    ctx.fillStyle = COL.ruby; ctx.fill(); ctx.strokeStyle = COL.gold; ctx.lineWidth = 2; ctx.stroke();
  }
  // buttresses
  for (let i = 0; i < 4; i++) {
    const y = OY - (.4 + i * .25) * S;
    ctx.beginPath(); ctx.moveTo(OX - 1.45 * S * .78, y); ctx.lineTo(OX - 1.75 * S * .78, y + 30); ctx.strokeStyle = 'rgba(232,211,162,.55)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(OX + 1.45 * S * .78, y); ctx.lineTo(OX + 1.75 * S * .78, y + 30); ctx.stroke();
  }
}
function palace(ctx, b, q) {
  const rococo = b.p && b.p.rococo;
  box(ctx, -1.5, 1.5, 0, .2, -.7, .7, 'white', b);
  box(ctx, -1.35, 1.35, .2, .45, -.6, .6, rococo ? 'white' : 'ruby', b);
  for (const [x, w, h] of [[0, .55, .95], [-1.0, .3, .65], [1.0, .3, .65]]) {
    box(ctx, x - w, x + w, .45, .45 + h, -.5, .5, rococo ? 'white' : 'ruby', b);
    // hip roof
    const y = .45 + h;
    const front = [[x - w - .16, y, .6], [x + w + .16, y, .6], [x + w + .05, y + .18, .45], [x - w - .05, y + .18, .45]];
    face(ctx, front, .95, 'gold', b);
    const side = [[x + w + .16, y, .6], [x + w + .16, y, -.6], [x + w + .05, y + .18, -.45], [x + w + .05, y + .18, .45]];
    face(ctx, side, .68, 'gold', b);
  }
}
function villa(ctx, b, q) {
  const p = b.p || {};
  if (p.rotonda) {
    box(ctx, -1.1, 1.1, 0, .9, -.9, .9, 'white', b);
    dome(ctx, OX, OY - .9 * S, .55 * S * .78, .6 * S, 'gold', b);
    for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      box(ctx, dx * .9 - .3, dx * .9 + .3, 0, .55, dz * .9 - .3, dz * .9 + .3, 'white', b);
    }
    return;
  }
  if (p.cantilever) {
    // rock + stacked slabs
    face(ctx, [[-1, 0, .5], [1, 0, .5], [.7, .45, .2], [-.8, .35, .3]], .5, 'olive', b);
    box(ctx, -.9, .9, .45, .65, -.6, .6, 'white', b);
    box(ctx, -.5, 1.1, .65, .85, -.4, .5, 'white', b);
    box(ctx, -.9, .6, .85, 1.05, -.5, .4, 'white', b);
    return;
  }
  if (p.glassBox) {
    box(ctx, -1, 1, .35, .45, -.6, .6, 'white', b);
    box(ctx, -.9, .9, .45, 1.25, -.5, .5, 'blue', b);
    box(ctx, -1.05, 1.05, 1.25, 1.35, -.65, .65, 'white', b);
    return;
  }
  if (p.prairie) {
    box(ctx, -1.3, 1.3, .2, .38, -.6, .6, 'white', b);
    box(ctx, -.9, .8, .38, .8, -.5, .5, 'white', b);
    box(ctx, -1.4, 1.4, .8, .95, -.7, .7, 'white', b);
    box(ctx, -1.0, 1.0, .95, 1.02, -.6, .6, 'gold', b);
    return;
  }
  if (p.bauhaus) {
    box(ctx, -1.2, .1, 0, 1.1, -.5, .5, 'white', b);
    box(ctx, .1, 1.2, 0, .8, -.4, .55, 'white', b);
    box(ctx, -.7, .7, 1.1, 1.25, -.5, .5, 'white', b);
    return;
  }
  // Savoye / Tugendhat default: floating box on pilotis
  const y0 = p.pilotis ? .32 : .12;
  for (let i = 0; i < 5; i++) box(ctx, -.75 + i * .37 - .03, -.75 + i * .37 + .03, 0, y0, -.3, -.2, 'white', b);
  box(ctx, -1.05, 1.05, y0, y0 + .62, -.6, .6, 'white', b);
  box(ctx, -.8, .9, y0 + .62, y0 + 1.0, -.5, .5, 'white', b);
  box(ctx, -1.1, 1.1, y0 + 1.0, y0 + 1.1, -.65, .65, 'white', b);
  // ribbon windows
  ctx.strokeStyle = ERA[b.era].mode === 'blueprint' ? '#e9f2fb' : '#241a12'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { const x = -1 + i * .4; ctx.strokeRect(OX + x * S * .78, OY - (y0 + .5) * S, .3 * S * .78, 12); }
}
function colonnade(ctx, b, q) {
  box(ctx, -1.4, 1.4, 0, .2, -.4, .4, 'white', b);
  for (let i = 0; i < 10; i++) { const x = -1.25 + i * .28; box(ctx, x - .05, x + .05, .2, 1.2, .3, .4, 'white', b); }
  box(ctx, -1.4, 1.4, 1.2, 1.42, -.3, .45, 'white', b);
  box(ctx, -1.4, 1.4, 1.42, 1.5, -.35, .5, 'gold', b);
}
function tower(ctx, b, q) {
  const p = b.p || {};
  if (p.lattice) {
    for (let i = 0; i < 2; i++) {
      const sx = i ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(OX + sx * .75 * S * .78, OY); ctx.quadraticCurveTo(OX + sx * .18 * S * .78, OY - .9 * S, OX + sx * .06 * S * .78, OY - 1.7 * S);
      ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(OX + sx * .75 * S * .78, OY); ctx.lineTo(OX + sx * .06 * S * .78, OY - 1.7 * S);
      ctx.lineWidth = 1.4; ctx.stroke();
      for (let k = 1; k < 10; k++) {
        const u = k / 10;
        const xa = lerp(OX + sx * .75 * S * .78, OX + sx * .06 * S * .78, u);
        const ya = lerp(OY, OY - 1.7 * S, u);
        const xb = lerp(OX + sx * .75 * S * .78, OX + sx * .06 * S * .78, 1 - u);
        const yb = lerp(OY, OY - 1.7 * S, 1 - u);
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.strokeStyle = 'rgba(233,242,251,.4)'; ctx.lineWidth = .8; ctx.stroke();
      }
    }
    for (const yy of [.25, .55, .85]) box(ctx, -.45, .45, yy * 1.7, yy * 1.7 + .08, -.25, .25, 'white', b);
    box(ctx, -.03, .03, 1.7, 2.0, -.03, .03, 'white', b);
    return;
  }
  const floors = p.floors || 12;
  const w = p.twist ? .55 : .5, d = p.twist ? .4 : .35;
  for (let i = 0; i < floors; i++) {
    const y0 = i / floors * 1.85, y1 = (i + 1) / floors * 1.85;
    const t = p.twist ? i * .02 : 0;
    box(ctx, -w + t, w + t, y0, y1, -d - (p.twist ? t : 0), d + (p.twist ? t : 0), i === floors - 1 && p.deco ? 'gold' : 'white', b);
  }
  if (p.spire) {
    const top = p.deco ? 1.3 : 1.85;
    ctx.beginPath(); ctx.moveTo(OX - .12 * S * .78, OY - top * S); ctx.lineTo(OX, OY - (top + .55) * S); ctx.lineTo(OX + .12 * S * .78, OY - top * S); ctx.fillStyle = ERA[b.era].accent; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.stroke();
  }
  if (p.broken) {
    const y = 1.85;
    ctx.beginPath(); ctx.moveTo(OX - .5 * S * .78, OY - y * S); ctx.lineTo(OX, OY - (y + .28) * S); ctx.lineTo(OX + .5 * S * .78, OY - y * S); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 4; ctx.stroke();
  }
  if (p.plaza) { ellipse(ctx, OX, OY + 6, 1.3 * S * .78, .16 * S, null, 'rgba(17,17,17,.35)', 1); }
}
function bridge(ctx, b, q) {
  box(ctx, -1.4, 1.4, .72, .82, -.18, .18, 'white', b);
  for (const x of [-.6, .6]) {
    box(ctx, x - .1, x + .1, 0, 1.35, -.2, .2, 'white', b);
    for (let i = 0; i < 4; i++) box(ctx, x - .15, x + .15, .85 + i * .12, .93 + i * .12, -.22, .22, 'white', b);
  }
  ctx.strokeStyle = ERA[b.era].mode === 'blueprint' ? '#e9f2fb' : '#241a12'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const x = lerp(-.6, .6, u), y = .82 + Math.sin(u * Math.PI) * .3;
    ctx.beginPath(); ctx.moveTo(OX + x * S * .78, OY - y * S); ctx.lineTo(OX + x * S * .78, OY - .82 * S); ctx.stroke();
  }
}
function glasshouse(ctx, b, q) {
  // front elevation: a long iron-and-glass shed under a barrel roof
  const x0 = -1.45, x1 = 1.45, base = 0, eave = 1.05;
  box(ctx, x0, x1, 0, .22, -.6, .6, 'white', b);
  // glass walls
  box(ctx, x0, x1, .22, eave, .5, .6, 'blue', b);
  box(ctx, x0, x1, .22, eave, -.6, -.5, 'blue', b);
  // roof arch (screen-space)
  const n = 24, pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u), y = eave + Math.sin(u * Math.PI) * .85;
    pts.push(P(x, y, .55));
  }
  ctx.beginPath(); ctx.moveTo(...pts[0]); pts.forEach(p => ctx.lineTo(...p));
  for (let i = n; i >= 0; i--) { const u = i / n, x = lerp(x0, x1, u), y = eave + Math.sin(u * Math.PI) * .85; ctx.lineTo(...P(x, y, -.55)); }
  ctx.closePath(); ctx.fillStyle = ERA[b.era].mode === 'blueprint' ? 'rgba(40,88,166,.55)' : 'rgba(223,232,234,.8)'; ctx.fill();
  ctx.strokeStyle = ERA[b.era].mode === 'blueprint' ? '#e9f2fb' : '#241a12'; ctx.lineWidth = 2; ctx.stroke();
  // mullions
  for (let i = 0; i <= 12; i++) {
    const x = lerp(x0, x1, i / 12);
    ctx.beginPath(); ctx.moveTo(...P(x, .22, .56)); ctx.lineTo(...P(x, eave + Math.sin(i / 12 * Math.PI) * .85, .56)); ctx.strokeStyle = 'rgba(233,242,251,.45)'; ctx.lineWidth = 1; ctx.stroke();
  }
  for (const yy of [.45, .75, eave]) {
    ctx.beginPath(); ctx.moveTo(...P(x0, yy, .56)); ctx.lineTo(...P(x1, yy, .56)); ctx.stroke();
  }
}
function shell(ctx, b, q) {
  const form = (b.p && b.p.form) || 'sails';
  if (form === 'sails') {
    box(ctx, -1.2, 1.2, 0, .3, -.5, .5, 'white', b);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const x = OX + (i - 1) * .55 * S * .78;
      ctx.moveTo(x, OY - .3 * S);
      ctx.quadraticCurveTo(x + .5 * S * .78, OY - 1.2 * S, x + .25 * S * .78, OY - 1.55 * S);
      ctx.quadraticCurveTo(x + .05 * S * .78, OY - .95 * S, x, OY - .3 * S);
      ctx.fillStyle = ERA[b.era].mode === 'blueprint' ? '#20427f' : '#efe5cf'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (form === 'crown') {
    box(ctx, -1.1, 1.1, 0, .35, -.5, .5, 'white', b);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (i / 8);
      const p0 = P(Math.cos(a) * 1.0, .35, Math.sin(a) * .5);
      const p1 = P(Math.cos(a) * .35, 1.65, 0);
      ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 5; ctx.stroke();
    }
  } else if (form === 'wings') {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(OX, OY - .1 * S);
      ctx.quadraticCurveTo(OX + s * .9 * S * .78, OY - 1.4 * S, OX + s * 1.25 * S * .78, OY - .25 * S);
      ctx.quadraticCurveTo(OX + s * .7 * S * .78, OY - .55 * S, OX, OY - .1 * S);
      ctx.fillStyle = ERA[b.era].mode === 'blueprint' ? '#20427f' : '#e7dbc2'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
    }
  } else {
    // wave
    box(ctx, -1.2, 1.2, 0, .25, -.5, .5, 'white', b);
    ctx.beginPath(); ctx.moveTo(OX - 1.2 * S * .78, OY - .25 * S);
    ctx.bezierCurveTo(OX - .4 * S * .78, OY - 1.5 * S, OX + .5 * S * .78, OY - 1.5 * S, OX + 1.25 * S * .78, OY - .45 * S);
    ctx.lineTo(OX + 1.1 * S * .78, OY - .25 * S); ctx.closePath();
    ctx.fillStyle = ERA[b.era].mode === 'blueprint' ? '#20427f' : '#e7dbc2'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
  }
}
function hightech(ctx, b, q) {
  box(ctx, -1.1, 1.1, 0, 1.55, -.55, .55, 'white', b);
  for (let i = 0; i < 6; i++) {
    const y = .1 + i * .26;
    ctx.beginPath(); ctx.moveTo(OX - 1.1 * S * .78, OY - y * S); ctx.lineTo(OX - 1.1 * S * .78, OY - (y + .13) * S); ctx.strokeStyle = ERA[b.era].red; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(OX - 1.1 * S * .78, OY - y * S); ctx.lineTo(OX + 1.1 * S * .78, OY - (y + .2) * S); ctx.strokeStyle = 'rgba(17,17,17,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(OX - .5 * S * .78, OY); ctx.lineTo(OX + .5 * S * .78, OY - 1.2 * S); ctx.strokeStyle = ERA[b.era].red; ctx.lineWidth = 7; ctx.stroke();
}
function spiral(ctx, b, q) {
  for (let i = 0; i < 7; i++) {
    const yy = OY - (.15 + i * .2) * S, rx = (.65 + i * .06) * S * .78;
    ellipse(ctx, OX, yy, rx, .14 * S, null, ERA[b.era].ink, 2.4);
  }
  box(ctx, -.2, .2, 0, 1.6, -.2, .2, 'white', b);
}
function museum(ctx, b, q) {
  const f = (b.p && b.p.form) || 'white';
  if (f === 'titanium') {
    face(ctx, [[-1.3, 0, .5], [-.3, 0, .7], [-.5, .9, .2], [-1.2, .6, .1]], .9, 'gold', b);
    face(ctx, [[-.3, 0, .7], [.7, 0, .5], [.5, 1.2, .2], [-.4, .8, .3]], 1, 'gold', b);
    face(ctx, [[.6, 0, .4], [1.3, 0, .2], [1.1, .7, .1], [.5, .9, .2]], .8, 'gold', b);
    box(ctx, -.8, .8, 0, .3, -.4, .4, 'white', b);
  } else if (f === 'kimbell') {
    for (const x of [-.8, .8]) {
      ctx.beginPath(); ctx.moveTo(OX + x * S * .78 - .5 * S * .78, OY); ctx.quadraticCurveTo(OX + x * S * .78, OY - .95 * S, OX + x * S * .78 + .5 * S * .78, OY); ctx.closePath();
      ctx.fillStyle = ERA[b.era].mode === 'blueprint' ? '#20427f' : '#e7dbc2'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
    }
    box(ctx, -1.3, 1.3, 0, .3, -.4, .4, 'white', b);
  } else if (f === 'color') {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(OX + (i - 1.5) * .4 * S * .78, OY - (.3 + (i % 2) * .3) * S, .45 * S * .78, .35 * S, 0, 0, 7);
      ctx.fillStyle = [COL.pink, COL.mint, COL.yellow, COL.cobalt][i]; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (f === 'brick') {
    box(ctx, -1.2, 1.2, 0, 1.0, -.5, .5, 'ruby', b);
    box(ctx, .3, .8, 1.0, 1.7, -.3, .3, 'ruby', b);
  } else if (f === 'ningbo') {
    box(ctx, -1.2, 1.2, 0, .9, -.5, .5, 'white', b);
    ctx.strokeStyle = 'rgba(36,26,18,.45)'; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const x = -1.1 + i * .2; ctx.beginPath(); ctx.moveTo(...P(x, 0, .5)); ctx.lineTo(...P(x, .9, .5)); ctx.stroke(); }
  } else if (f === 'flow') {
    ctx.beginPath(); ctx.moveTo(OX - 1.2 * S * .78, OY);
    ctx.bezierCurveTo(OX - .4 * S * .78, OY - 1.3 * S, OX + .6 * S * .78, OY - 1.4 * S, OX + 1.2 * S * .78, OY - .3 * S);
    ctx.lineTo(OX + 1.1 * S * .78, OY); ctx.closePath();
    ctx.fillStyle = ERA[b.era].mode === 'points' ? '#0a1118' : '#efe5cf'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(OX - 1.2 * S * .78, OY - i * .09 * S);
      ctx.bezierCurveTo(OX - .4 * S * .78, OY - (1.3 - i * .1) * S, OX + .6 * S * .78, OY - (1.4 - i * .12) * S, OX + 1.2 * S * .78, OY - (.3 + i * .04) * S);
      ctx.strokeStyle = ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.35)' : 'rgba(59,42,26,.35)'; ctx.lineWidth = 1; ctx.stroke();
    }
  } else if (f === 'petals') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      ellipse(ctx, OX + Math.cos(a) * .5 * S * .78, OY - .5 * S + Math.sin(a) * .2 * S, .55 * S * .78, .3 * S, null, ERA[b.era].ink, 2);
    }
  } else if (f === 'spherebox') {
    box(ctx, -1.0, 1.0, 0, .9, -.5, .5, 'white', b);
    ellipse(ctx, OX, OY - 1.0 * S, .5 * S * .78, .5 * S, null, ERA[b.era].ink, 3);
  } else if (f === 'chamfer') {
    face(ctx, [[-1.3, 0, .6], [-.2, 0, .6], [-.5, 1.0, .2], [-1.3, .6, .2]], .95, 'white', b);
    face(ctx, [[-.2, 0, .6], [1.2, 0, .6], [1.2, .5, .2], [-.5, 1.0, .2]], 1, 'white', b);
  } else if (f === 'angular') {
    box(ctx, -1.2, .2, 0, 1.2, -.4, .4, 'white', b);
    box(ctx, .2, 1.2, 0, .8, -.4, .4, 'white', b);
  } else if (f === 'pebble') {
    ellipse(ctx, OX - .35 * S * .78, OY - .45 * S, .55 * S * .78, .42 * S, null, ERA[b.era].ink, 3);
    ellipse(ctx, OX + .45 * S * .78, OY - .35 * S, .45 * S * .78, .35 * S, null, ERA[b.era].ink, 3);
  } else {
    // white / default: stacked white boxes
    box(ctx, -1.2, .4, 0, .6, -.5, .5, 'white', b);
    box(ctx, -.2, 1.2, 0, 1.0, -.4, .4, 'white', b);
    box(ctx, -.8, .8, 1.0, 1.1, -.5, .5, 'white', b);
  }
}
function cctv(ctx, b, q) {
  box(ctx, -1.1, -.35, 0, 1.5, -.35, .35, 'white', b);
  box(ctx, .35, 1.1, 0, 1.5, -.35, .35, 'white', b);
  box(ctx, -1.1, 1.1, 1.2, 1.55, -.35, .35, 'white', b);
  // diagrid
  ctx.strokeStyle = ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.55)' : 'rgba(17,17,17,.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) { const x = -1.1 + i * .22; ctx.beginPath(); ctx.moveTo(...P(x, 1.2, .35)); ctx.lineTo(...P(x + .2, 1.55, .35)); ctx.stroke(); }
}
function nest(ctx, b, q) {
  const cx = OX, cy = OY - .45 * S;
  ellipse(ctx, cx, cy, 1.3 * S * .78, .75 * S, null, ERA[b.era].ink, 3);
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 1.3 * S * .78, cy + Math.sin(a) * .75 * S);
    ctx.quadraticCurveTo(cx + Math.cos(a + .4) * .3 * S * .78, cy - .2 * S, cx - Math.cos(a) * 1.3 * S * .78, cy - Math.sin(a) * .75 * S);
    ctx.strokeStyle = ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.5)' : 'rgba(17,17,17,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
}
function expo(ctx, b, q) {
  for (let i = 0; i < 6; i++) box(ctx, -1.0 + i * .32, -.95 + i * .32, 0, 1.0, -.15, .15, 'white', b);
  const top = [[-1.4, 1.0, .6], [1.4, 1.0, .6], [.9, 1.6, .3], [-.9, 1.6, .3]];
  face(ctx, top, 1, 'red', b);
  face(ctx, [[1.4, 1.0, .6], [1.4, 1.0, -.6], [.9, 1.6, -.3], [.9, 1.6, .3]], .7, 'red', b);
}
function green(ctx, b, q) {
  box(ctx, -.9, -.1, 0, 1.7, -.35, .35, 'white', b);
  box(ctx, .1, .9, 0, 1.5, -.35, .35, 'white', b);
  const R = mulberry(12);
  for (let i = 0; i < 60; i++) {
    const x = (R() < .5 ? -.5 : .5) * S * .78 + (R() - .5) * .5 * S * .78;
    const y = OY - (.2 + R() * 1.4) * S;
    ctx.fillStyle = R() < .5 ? COL.green : '#5bd68a';
    ctx.beginPath(); ctx.arc(OX + x, y, 2 + R() * 7, 0, 7); ctx.fill();
  }
}
function airport(ctx, b, q) {
  const cx = OX, cy = OY - .45 * S;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a + .4) * .7 * S * .78, cy + Math.sin(a + .4) * .35 * S, cx + Math.cos(a) * 1.3 * S * .78, cy + Math.sin(a) * .6 * S);
    ctx.strokeStyle = ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.65)' : ERA[b.era].ink; ctx.lineWidth = 3; ctx.stroke();
  }
  ellipse(ctx, cx, cy, .55 * S * .78, .25 * S, null, ERA[b.era].ink, 2);
}
function sphereType(ctx, b, q) {
  ellipse(ctx, OX, OY - .95 * S, .95 * S * .78, .95 * S, null, ERA[b.era].ink, 3);
  for (let i = 1; i < 8; i++) { ellipse(ctx, OX, OY - .95 * S, .95 * S * .78 * Math.abs(Math.cos(i / 8 * Math.PI)), .95 * S, null, ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.35)' : 'rgba(36,26,18,.3)', 1); }
  for (let i = 1; i < 6; i++) { ellipse(ctx, OX, OY - .95 * S + (i - 3) * .22 * S, .95 * S * .78, .06 * S, null, ERA[b.era].mode === 'points' ? 'rgba(127,231,224,.35)' : 'rgba(36,26,18,.3)', 1); }
}
function dancing(ctx, b, q) {
  box(ctx, -.95, -.15, 0, 1.6, -.3, .3, 'white', b);
  // curved companion
  ctx.beginPath(); ctx.moveTo(OX + .15 * S * .78, OY); ctx.bezierCurveTo(OX + .05 * S * .78, OY - .6 * S, OX + .55 * S * .78, OY - 1.2 * S, OX + .75 * S * .78, OY - 1.55 * S);
  ctx.lineTo(OX + 1.05 * S * .78, OY - 1.5 * S); ctx.bezierCurveTo(OX + .9 * S * .78, OY - .9 * S, OX + .55 * S * .78, OY - .2 * S, OX + .6 * S * .78, OY); ctx.closePath();
  ctx.fillStyle = ERA[b.era].mode === 'points' ? '#0a1118' : '#efe5cf'; ctx.fill(); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
}
function piazza(ctx, b, q) {
  ctx.beginPath(); ctx.arc(OX, OY - .2 * S, 1.2 * S * .78, Math.PI, 0); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI + i / 9 * Math.PI;
    const x = OX + Math.cos(a) * 1.2 * S * .78, y = OY - .2 * S + Math.sin(a) * 1.2 * S * .35;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - .55 * S); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 4; ctx.stroke();
  }
  ellipse(ctx, OX, OY - .15 * S, .45 * S * .78, .14 * S, null, ERA[b.era].accent, 3);
}
function concreteChurch(ctx, b, q) {
  box(ctx, -1.2, 1.2, 0, .8, -.5, .5, 'white', b);
  for (let i = 0; i < 5; i++) {
    const x = -1.0 + i * .5;
    ctx.beginPath(); ctx.moveTo(OX + x * S * .78, OY - .8 * S); ctx.lineTo(OX + x * S * .78, OY - 1.5 * S); ctx.strokeStyle = ERA[b.era].ink; ctx.lineWidth = 5; ctx.stroke();
  }
  box(ctx, -1.2, 1.2, .8, 1.6, -.5, .5, 'white', b);
}

const TYPES = {
  pyramid, temple, stupa, amphitheater, dome: domeType, basilica, pagoda, angkor, gothic, palace,
  villa, colonnade, tower, bridge, glasshouse, shell, hightech, spiral, museum, cctv, nest,
  expo, green, airport, sphere: sphereType, dancing, piazza, concreteChurch,
};

function drawBuilding(ctx, b, t, local, i) {
  const prog = ss(seg(local, .3, 2.7));
  if (prog <= 0) return;
  const fn = TYPES[b.type] || museum;
  const z = 1 + .025 * ss(local / 4.5) + (hash(i * 7.3) - .5) * .02;
  const pan = (hash(i * 3.1) - .5) * 26;
  ctx.save();
  // reveal: most rise from the ground, some are uncovered from the left
  const top = OY - 2.15 * S, bottom = OY + .1 * S;
  const left = OX - 1.9 * S * .78, right = OX + 1.9 * S * .78;
  let cut = top;
  if (hash(i * 5.7) > .72) {
    const edge = lerp(left, right, prog);
    ctx.beginPath(); ctx.rect(left, top, edge - left, bottom - top + 20); ctx.clip();
  } else {
    cut = lerp(bottom, top, prog);
    ctx.beginPath(); ctx.rect(left, cut, right - left, bottom - cut + 20); ctx.clip();
  }
  ctx.translate(OX + pan, OY); ctx.scale(z, z); ctx.translate(-OX, -OY);
  fn(ctx, b, t);
  ctx.restore();
  // scan line
  ctx.save(); ctx.globalAlpha = .85 * (1 - ss(seg(local, 2.4, 2.9)));
  ctx.strokeStyle = ERA[b.era].accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(OX - 1.8 * S * .78, cut); ctx.lineTo(OX + 1.8 * S * .78, cut); ctx.stroke();
  ctx.restore();
}

function drawBG(ctx, b, t, local) {
  const e = eraOf(b), mode = e.mode;
  if (mode === 'engraving' || mode === 'wash') {
    ctx.drawImage(paper, 0, 0, W, H);
    ctx.save(); ctx.globalAlpha = mode === 'wash' ? .10 : .06;
    ctx.strokeStyle = e.ink; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.restore();
    if (mode === 'wash') {
      ctx.save(); ctx.globalAlpha = .14;
      ctx.fillStyle = '#8fb0c9'; ctx.fillRect(600, 0, W, 540);
      ctx.fillStyle = '#b46b4a'; ctx.fillRect(600, 540, W, 300);
      ctx.restore();
    }
  } else if (mode === 'lapis') {
    const g = ctx.createRadialGradient(1300, 420, 100, 1300, 420, 1100);
    g.addColorStop(0, '#2b2219'); g.addColorStop(1, '#0d0a08');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .10; ctx.strokeStyle = COL.gold; ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(1300, 600, 120 + i * 35, 0, 7); ctx.stroke(); }
    ctx.restore();
  } else if (mode === 'blueprint') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#122a5c'); g.addColorStop(1, '#2a58a6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .12; ctx.strokeStyle = '#dceafb'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  } else if (mode === 'swiss') {
    ctx.fillStyle = e.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = '#d8d7d1'; ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) { const x = 96 + i * (1728 / 12); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.restore();
  } else if (mode === 'memphis') {
    ctx.fillStyle = e.bg; ctx.fillRect(0, 0, W, H);
    const R = mulberry(7);
    ctx.save(); ctx.globalAlpha = .22;
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = R() * H, r = 8 + R() * 30;
      ctx.fillStyle = [COL.pink, COL.mint, COL.yellow, COL.cobalt][i % 4];
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      else if (i % 3 === 1) ctx.fillRect(x, y, r, r);
      else { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  } else {
    ctx.fillStyle = e.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .10; ctx.strokeStyle = COL.cyan; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }
  // vignette
  const vg = ctx.createRadialGradient(1300, 540, 300, 1300, 540, 1100);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, mode === 'lapis' || mode === 'points' ? 'rgba(0,0,0,.55)' : 'rgba(50,30,10,.12)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function eraFont(b) {
  const m = eraOf(b).mode;
  if (m === 'engraving' || m === 'lapis') return { fam: F.serif, big: F.serif, name: F.song };
  if (m === 'wash') return { fam: F.georgia, big: F.serif, name: F.kai };
  if (m === 'blueprint') return { fam: F.cons, big: F.cons, name: F.hei };
  if (m === 'swiss') return { fam: F.bahn, big: F.bahn, name: F.hei };
  if (m === 'memphis') return { fam: F.bahn, big: F.display, name: F.hei };
  return { fam: F.cons, big: F.cons, name: F.hei };
}

function drawCard(ctx, b, t, local, i) {
  const e = eraOf(b), f = eraFont(b);
  const ink = e.ink, accent = e.accent;
  const pIn = eio(seg(local, 0, .38));
  const pOut = eio(seg(local, 4.05, 4.4));
  ctx.save();
  ctx.translate((1 - pIn) * -60 + pOut * -80, 0);
  ctx.globalAlpha = 1 - pOut * .9;
  // era label
  text(ctx, e.en, 108, 96, { size: 15, font: f.fam, color: accent, spacing: 3 });
  text(ctx, e.cn, 108, 124, { size: 17, font: f.name, color: ink, spacing: 2, alpha: .75 });
  // year
  const big = f.big;
  const yl = b.yl;
  const size = yl.length > 7 ? 116 : yl.length > 5 ? 136 : 164;
  text(ctx, yl, 104, 330, { size, font: big, color: ink, spacing: -2 });
  // year delta
  if (i > 0) {
    const prev = B[i - 1].y, d = b.y - prev;
    const dtxt = (d >= 0 ? '+' : '') + Math.abs(d).toLocaleString('en-US') + ' 年';
    text(ctx, dtxt, 112, 372, { size: 16, font: f.fam, color: accent, spacing: 1.2, alpha: .9 });
  }
  // name
  text(ctx, b.name, 108, 470, { size: 44, font: f.name, color: ink, spacing: 1 });
  text(ctx, b.en, 110, 506, { size: 17, font: f.fam, color: ink, alpha: .68, spacing: .6 });
  // city / tag
  text(ctx, b.city + '  ·  ' + b.tag, 110, 548, { size: 20, font: f.name, color: ink, alpha: .82, spacing: 1.5 });
  // index
  text(ctx, String(i + 1).padStart(2, '0') + ' / ' + B.length, 110, 640, { size: 14, font: F.cons, color: ink, alpha: .5, spacing: 2 });
  // rule
  ctx.strokeStyle = ink; ctx.globalAlpha *= .35; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(110, 410); ctx.lineTo(520, 410); ctx.stroke();
  ctx.restore();
}

function drawRail(ctx, t, i, local, b) {
  const y = H - 64, x0 = 96, x1 = W - 96;
  const n = B.length;
  ctx.save();
  // era bands
  const counts = ERA.map((e, k) => B.filter(x => x.era === k).length);
  let acc = 0;
  ERA.forEach((e, k) => {
    const w = counts[k] / n * (x1 - x0);
    ctx.fillStyle = e.accent; ctx.globalAlpha = .22;
    ctx.fillRect(x0 + acc, y - 3, w, 6);
    ctx.globalAlpha = .85;
    text(ctx, e.cn, x0 + acc + 6, y - 14, { size: 11, font: F.hei, color: b.era === k ? e.accent : e.ink, alpha: b.era === k ? 1 : .55, spacing: 1 });
    acc += w;
  });
  // dots
  ctx.globalAlpha = .8;
  B.forEach((bb, k) => {
    const x = x0 + (k + .5) / n * (x1 - x0);
    ctx.fillStyle = k <= i ? ERA[bb.era].accent : 'rgba(128,128,128,.35)';
    ctx.beginPath(); ctx.arc(x, y, k === i ? 3.6 : 2, 0, 7); ctx.fill();
  });
  // marker
  const mx = x0 + (i + .5) / n * (x1 - x0);
  ctx.strokeStyle = b.era === 2 || b.era === 4 || b.era === 5 ? '#111' : '#f1e8d2';
  ctx.globalAlpha = .5; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, y - 26); ctx.lineTo(mx, y + 14); ctx.stroke();
  ctx.restore();
}

function drawIntro(ctx, t) {
  ctx.fillStyle = '#0b0907'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(960, 540, 50, 960, 540, 900);
  g.addColorStop(0, 'rgba(210,170,110,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // a small rolling year counter above the title
  const k = eio(seg(t, .2, 5.2));
  const yr = Math.round(lerp(2026, -2600, k));
  const yl = yr < 0 ? '前 ' + Math.abs(yr) : String(yr);
  ctx.save(); ctx.globalAlpha = .55;
  text(ctx, yl, 960, 300, { size: 64, font: F.serif, color: '#cdbb99', align: 'center', spacing: 2 });
  ctx.restore();
  // title
  const tp = ss(seg(t, 1.0, 2.2));
  if (tp > 0) {
    ctx.save(); ctx.globalAlpha = tp;
    text(ctx, '建 筑 年 表', 960, 530, { size: 108, font: F.serif, color: '#f1e8d2', align: 'center', spacing: 12 });
    text(ctx, 'A TIMELINE OF BUILDINGS  ·  72 PLATES  ·  4,500 YEARS', 960, 588, { size: 15, font: F.georgia, color: '#cdbb99', align: 'center', spacing: 3 });
    ctx.strokeStyle = 'rgba(212,164,65,.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(650, 618); ctx.lineTo(1270, 618); ctx.stroke();
    ctx.restore();
  }
  // 72 bars cascade
  const bp = ss(seg(t, 1.6, 6.8));
  ctx.save();
  for (let i = 0; i < 72; i++) {
    const x = 96 + i / 72 * (W - 192);
    const h = 10 + hash(i * 3.7) * 60;
    const a = ss(clamp((bp * 72 - i) / 8, 0, 1));
    ctx.fillStyle = i % 7 === 0 ? '#d4a441' : 'rgba(241,232,210,.35)';
    ctx.globalAlpha = a * .7;
    ctx.fillRect(x, 900 - h, 5, h);
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .9;
  ctx.strokeStyle = '#d4a441'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(96, 918); ctx.lineTo(96 + (W - 192) * eio(seg(t, .4, 7.4)), 918); ctx.stroke(); ctx.restore();
}

function drawOutro(ctx, t) {
  const lt = t - (INTRO + B.length * ENTRY);
  ctx.fillStyle = '#0b0907'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(960, 540, 60, 960, 540, 1000);
  g.addColorStop(0, 'rgba(190,150,90,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const build = ss(seg(lt, .2, 6.5));
  const cols = 9, rows = 8;
  const cw = 190, ch = 88, x0 = (W - cols * cw) / 2, y0 = 56;
  for (let i = 0; i < B.length; i++) {
    const a = ss(clamp((build * B.length - i) / 8, 0, 1));
    if (a <= 0) continue;
    const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * ch;
    ctx.save(); ctx.globalAlpha = a;
    text(ctx, B[i].yl, x + 10, y + 34, { size: 24, font: F.georgia, color: '#f1e8d2', spacing: .5 });
    text(ctx, B[i].name, x + 10, y + 60, { size: 15, font: F.song, color: '#cdbb99', spacing: .5 });
    text(ctx, B[i].city, x + 10, y + 80, { size: 11, font: F.song, color: 'rgba(205,187,153,.6)', spacing: .8 });
    ctx.strokeStyle = 'rgba(212,164,65,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 8, y + 88); ctx.lineTo(x + cw - 14, y + 88); ctx.stroke();
    ctx.restore();
  }
  const tp = ss(seg(lt, 7.0, 8.4));
  if (tp > 0) {
    ctx.save(); ctx.globalAlpha = tp;
    text(ctx, '72 座建筑  ·  4,500 年', 960, 820, { size: 54, font: F.serif, color: '#f1e8d2', align: 'center', spacing: 4 });
    text(ctx, '年表还在继续。', 960, 876, { size: 24, font: F.song, color: '#cdbb99', align: 'center', spacing: 3 });
    ctx.restore();
  }
  const fade = ss(seg(lt, OUTRO - 2.2, OUTRO - .2));
  if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

export function draw(ctx, t) {
  init();
  if (t < INTRO) { drawIntro(ctx, t); return; }
  if (t >= INTRO + B.length * ENTRY) { drawOutro(ctx, t); return; }
  const { i, local, entry } = entryAt(t);
  const e = ERA[entry.era];
  drawBG(ctx, entry, t, local);
  drawBuilding(ctx, entry, t, local, i);
  if (!window.__POSTER) { drawCard(ctx, entry, t, local, i); drawRail(ctx, t, i, local, entry); }
  // era transition at the first entry of each era
  const es = ERA_START[entry.era];
  if (i === es && local < .7) {
    const p = eio(seg(local, 0, .7));
    ctx.save(); ctx.globalAlpha = 1 - p;
    ctx.fillStyle = '#0b0907'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .8 * (1 - p); ctx.strokeStyle = e.accent; ctx.lineWidth = 2;
    const x = lerp(0, W, p);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.restore();
  }
  // page edge / film grain
  ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
