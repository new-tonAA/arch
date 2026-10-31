import {
  bandHatch, W, H, clamp, lerp, seg, eio, eo, ss, back, hash, mulberry,
  paperTexture, poly, taper, hatch, text, measure, rgba, F, makeCanvas, fbm
} from '../common.js';

const INK = '#160f09';
const PAPER = '#f1e8d2';
const SKY = '#8fb2c9';
const OCHRE = '#c79a62';
const OLIVE = '#a7a06b';

let paper, grain, dust;
const COLX = [400, 624, 848, 1072, 1296, 1520];
const CW = 88;
const ENT = { x0: 320, x1: 1600, y0: 250, y1: 390 };
const PED = [[320, 250], [960, 96], [1600, 250]];
const WALL = { x0: 356, x1: 1564, y0: 390, y1: 826 };
const DOOR = { x0: 902, x1: 1018, y0: 516, y1: 826 };

function init() {
  if (paper) return;
  paper = paperTexture(3072, 1728, 11, PAPER, '#e3d5b6');
  grain = makeCanvas(480, 270);
  const g = grain.getContext('2d'), im = g.createImageData(480, 270), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = hash(i * .71) * 255;
    d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 22;
  }
  g.putImageData(im, 0, 0);
  dust = [];
  const R = mulberry(41);
  for (let i = 0; i < 90; i++) dust.push({ x: R() * W, y: R() * H, r: .6 + R() * 2.4, v: 4 + R() * 16, p: R() * 7 });
}
init();

function cam(t) {
  let s = .92 + .06 * ss(seg(t, 8, 16));
  if (t > 16) s = lerp(s, 2.2, eio(seg(t, 16, 20)));
  if (t > 20) s = lerp(2.2, 7.2, eio(seg(t, 20, 21.5)));
  const fy = lerp(560, 650, ss(seg(t, 16, 20)));
  return { s, fx: 960, fy };
}

function paperFill(ctx, pts) {
  const bb = pts.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
  const g = ctx.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
  g.addColorStop(0, '#f6efdd'); g.addColorStop(.6, PAPER); g.addColorStop(1, '#e9dcc0');
  poly(ctx, pts); ctx.fillStyle = g; ctx.fill();
}

function edge(ctx, a, b, w, p, color = INK) {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    pts.push([lerp(a[0], b[0], u) + Math.sin(u * 9 + a[0]) * .5, lerp(a[1], b[1], u) + Math.cos(u * 7 + a[1]) * .5]);
  }
  taper(ctx, pts, w * 1.18, w * .82, p, color, true);
}

function edges(ctx, pts, t, t0, dur, w, k) {
  for (let i = 0; i < pts.length - 1; i++) {
    const p = ss(seg(t, t0 + i * dur * .12, t0 + i * dur * .12 + dur * .6));
    edge(ctx, pts[i], pts[i + 1], w * k, p);
  }
}

function column(ctx, cx, i, t, k) {
  const top = 452, bot = 800, wTop = 40, wBot = 44;
  const shaft = [[cx - wTop, top], [cx + wTop, top], [cx + wBot, bot], [cx - wBot, bot]];
  const t0 = 8.9 + i * .26;
  // shaft fill and ink
  paperFill(ctx, shaft);
  // flutes: vertical, swelling, light on the left two thirds
  for (let f = 0; f < 7; f++) {
    const u = f / 6;
    const x = lerp(cx - 34, cx + 34, u);
    const p = ss(seg(t, t0 + .45 + f * .03, t0 + 1.5 + f * .03));
    taper(ctx, [[x, top + 6], [x + (u - .5) * 5, bot - 8]], 1.05 * k, 1.45 * k, p, INK);
  }
  // shadow on the right side: first family, then crossing near the base
  const shadow = [[cx + 6, top + 2], [cx + wTop, top + 2], [cx + wBot, bot - 2], [cx + 10, bot - 2]];
  hatch(ctx, shadow, { angle: 1.31, spacing: 4.4, width: 1.7 * k, progress: ss(seg(t, t0 + .7, t0 + 2.5)), phase: i * 2.1 });
  hatch(ctx, shadow, { angle: .62, spacing: 6.6, width: 1.15 * k, progress: ss(seg(t, t0 + 1.8, t0 + 3.2)), phase: i * 3.3 });
  // a dark accent where the shaft meets the base
  hatch(ctx, [[cx - wBot + 4, bot - 44], [cx + wBot - 4, bot - 44], [cx + wBot - 4, bot - 4], [cx - wBot + 4, bot - 4]], {
    angle: 1.31, spacing: 3.2, width: 1.8 * k, progress: ss(seg(t, t0 + 2.2, t0 + 3.1)), phase: 9 + i,
  });
  // capital: abacus + echinus + necking
  const ab = [[cx - 54, 406], [cx + 54, 406], [cx + 54, 426], [cx - 54, 426]];
  const ech = [[cx - 54, 426], [cx + 54, 426], [cx + 42, 452], [cx - 42, 452]];
  paperFill(ctx, ab); paperFill(ctx, ech);
  hatch(ctx, [[cx + 4, 426], [cx + 54, 426], [cx + 42, 452], [cx + 8, 452]], { angle: 1.28, spacing: 3.8, width: 1.7 * k, progress: ss(seg(t, t0 + .2, t0 + 1.2)), phase: i });
  // base: two tori
  const b1 = [[cx - 46, 800], [cx + 46, 800], [cx + 50, 818], [cx - 50, 818]];
  const b2 = [[cx - 54, 818], [cx + 54, 818], [cx + 58, 834], [cx - 58, 834]];
  paperFill(ctx, b1); paperFill(ctx, b2);
  hatch(ctx, [[cx + 6, 800], [cx + 46, 800], [cx + 50, 818], [cx + 8, 818]], { angle: 1.31, spacing: 3.4, width: 1.6 * k, progress: ss(seg(t, t0 + .8, t0 + 1.5)), phase: i + 4 });
  // outlines last so they stay crisp
  edges(ctx, shaft, t, t0, 1.1, 2.15, k);
  edges(ctx, ab, t, t0 + .35, .55, 1.7, k);
  edges(ctx, ech, t, t0 + .5, .55, 1.5, k);
  edges(ctx, b1, t, t0 + .7, .45, 1.5, k);
  edges(ctx, b2, t, t0 + .8, .45, 1.5, k);
}

function entablature(ctx, t, k) {
  const t0 = 8.35;
  const arch = [[ENT.x0, ENT.y0], [ENT.x1, ENT.y0], [ENT.x1, 292], [ENT.x0, 292]];
  const frieze = [[ENT.x0, 292], [ENT.x1, 292], [ENT.x1, 344], [ENT.x0, 344]];
  const corn = [[ENT.x0 - 14, 344], [ENT.x1 + 14, 344], [ENT.x1 + 14, 390], [ENT.x0 - 14, 390]];
  paperFill(ctx, arch); paperFill(ctx, frieze); paperFill(ctx, corn);
  // architrave: three fasciae lines
  for (let i = 0; i < 3; i++) {
    const y = 258 + i * 11;
    edge(ctx, [ENT.x0 + 8, y], [ENT.x1 - 8, y], 1.1 * k, ss(seg(t, t0 + i * .1, t0 + .5 + i * .1)));
  }
  // frieze: triglyphs and metopes
  const n = 18, step = (ENT.x1 - ENT.x0) / n;
  for (let i = 0; i < n; i++) {
    const x = ENT.x0 + i * step;
    const p = ss(seg(t, t0 + .5 + i * .018, t0 + .9 + i * .018));
    if (i % 2 === 0) {
      // triglyph: three dark bars
      for (let j = 0; j < 3; j++) {
        const xx = x + step * .28 + j * step * .14;
        taper(ctx, [[xx, 300], [xx, 338]], 2.2 * k, 2.4 * k, p, INK);
      }
      hatch(ctx, [[x + step * .22, 298], [x + step * .78, 298], [x + step * .78, 340], [x + step * .22, 340]], {
        angle: 1.34, spacing: 3.0, width: 1.7 * k, progress: ss(seg(t, t0 + .8 + i * .02, t0 + 1.4 + i * .02)), phase: i,
      });
    } else {
      hatch(ctx, [[x + step * .18, 298], [x + step * .82, 298], [x + step * .82, 340], [x + step * .18, 340]], {
        angle: .65, spacing: 6.5, width: 1.0 * k, progress: ss(seg(t, t0 + .7 + i * .02, t0 + 1.3 + i * .02)), phase: i + 2,
      });
    }
  }
  // cornice dentils + deep shadow under it
  const dn = 42, ds = (ENT.x1 - ENT.x0) / dn;
  for (let i = 0; i < dn; i++) {
    const x = ENT.x0 + i * ds;
    const p = ss(seg(t, t0 + .9 + i * .006, t0 + 1.2 + i * .006));
    ctx.fillStyle = INK; ctx.globalAlpha = .82 * p;
    ctx.fillRect(x + 2, 352, ds * .45, 10); ctx.globalAlpha = 1;
  }
  hatch(ctx, [[ENT.x0 + 6, 360], [ENT.x1 - 6, 360], [ENT.x1 - 6, 388], [ENT.x0 + 6, 388]], {
    angle: 1.31, spacing: 3.0, width: 1.9 * k, progress: ss(seg(t, t0 + 1, t0 + 2.1)), phase: 5,
  });
  hatch(ctx, [[ENT.x0 + 6, 360], [ENT.x1 - 6, 360], [ENT.x1 - 6, 388], [ENT.x0 + 6, 388]], {
    angle: .62, spacing: 4.2, width: 1.4 * k, progress: ss(seg(t, t0 + 1.7, t0 + 2.6)), phase: 8,
  });
  edges(ctx, arch, t, t0, 1.2, 2.3, k);
  edges(ctx, frieze, t, t0 + .3, 1.1, 1.9, k);
  edges(ctx, corn, t, t0 + .6, 1.1, 2.2, k);
}

function pediment(ctx, t, k) {
  const t0 = 8.15;
  paperFill(ctx, PED);
  const inner = [[352, 246], [960, 116], [1568, 246]];
  paperFill(ctx, inner);
  // raking cornice (three parallel lines)
  for (let i = 0; i < 3; i++) {
    const d = i * 9;
    edge(ctx, [PED[0][0] + d, PED[0][1] - d], [PED[1][0], PED[1][1] + d * 1.9], 2.2 * k, ss(seg(t, t0 + i * .08, t0 + .7 + i * .08)));
    edge(ctx, [PED[1][0], PED[1][1] + d * 1.9], [PED[2][0] - d, PED[2][1] - d], 2.2 * k, ss(seg(t, t0 + i * .08, t0 + .7 + i * .08)));
  }
  // tympanum: light hatch from the left, dark at the right
  bandHatch(ctx, [[420, 240], [900, 140], [900, 240]], { angle: .95, spacing: 9, width: .9 * k, progress: ss(seg(t, t0 + 1, t0 + 2.2)), phase: 1, jitter: .12 }, 3);
  bandHatch(ctx, [[1020, 240], [1500, 240], [1020, 140]], { angle: 1.24, spacing: 6, width: 1.3 * k, progress: ss(seg(t, t0 + 1.2, t0 + 2.6)), phase: 2, jitter: .12 }, 4);
  // rosette at the apex of the tympanum
  if (t > t0 + 2.2) {
    const p = ss(seg(t, t0 + 2.2, t0 + 2.8));
    ctx.save(); ctx.translate(960, 196);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * k; ctx.globalAlpha = p;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  edges(ctx, PED, t, t0, 1.2, 2.5, k);
  edges(ctx, inner, t, t0 + .35, 1, 1.6, k);
}

function wall(ctx, t, k) {
  const t0 = 9.1;
  paperFill(ctx, [[WALL.x0, WALL.y0], [WALL.x1, WALL.y0], [WALL.x1, WALL.y1], [WALL.x0, WALL.y1]]);
  // ashlar joints, only where the columns will not cover: drawn first, then columns occlude
  for (let y = 404; y < WALL.y1; y += 32) {
    const p = ss(seg(t, t0, t0 + 1.2));
    ctx.globalAlpha = .13 * p; ctx.strokeStyle = INK; ctx.lineWidth = .55 * k;
    for (let x = WALL.x0; x < WALL.x1; x += 74) {
      const off = (Math.floor(y / 32) % 2) * 37;
      ctx.strokeRect(x + off, y, 74, 32);
    }
    ctx.globalAlpha = 1;
  }
  // cast shadows on the wall, one band to the right of each column
  const wp = ss(seg(t, t0 + .7, t0 + 2.6));
  COLX.forEach((cx, i) => {
    const b = [[cx + 42, 394], [cx + 96, 394], [cx + 104, 822], [cx + 40, 822]];
    hatch(ctx, b, { angle: 1.31, spacing: 6.4, width: 1.25 * k, progress: wp, phase: i * 2.2, jitter: .12 });
    hatch(ctx, b, { angle: .64, spacing: 9.5, width: .9 * k, progress: ss(seg(t, t0 + 1.4, t0 + 2.8)), phase: i * 3.1, jitter: .12 });
  });
  // doorway: dark, with a warm light sliver at the centre
  const t1 = 10.1;
  const p = ss(seg(t, t1, t1 + 1.4));
  const d = [[DOOR.x0, DOOR.y0], [DOOR.x1, DOOR.y0], [DOOR.x1, DOOR.y1], [DOOR.x0, DOOR.y1]];
  poly(ctx, d); ctx.fillStyle = `rgba(18,13,9,${.92 * p})`; ctx.fill();
  ctx.save(); poly(ctx, d); ctx.clip();
  const g = ctx.createLinearGradient(960, DOOR.y0, 960, DOOR.y1);
  g.addColorStop(0, 'rgba(255,214,150,0)'); g.addColorStop(.55, `rgba(255,206,132,${.10 * p})`); g.addColorStop(1, 'rgba(255,196,120,0)');
  ctx.fillStyle = g; ctx.fillRect(960 - 8, DOOR.y0, 16, DOOR.y1 - DOOR.y0);
  ctx.restore();
  // door architrave
  ctx.globalAlpha = p; ctx.strokeStyle = INK; ctx.lineWidth = 2 * k;
  ctx.strokeRect(DOOR.x0 - 8, DOOR.y0 - 8, DOOR.x1 - DOOR.x0 + 16, DOOR.y1 - DOOR.y0 + 8);
  ctx.globalAlpha = 1;
}

function ground(ctx, t, k) {
  const t0 = 9.3;
  const gpts = [[0, 826], [W, 826], [W, H], [0, H]];
  paperFill(ctx, gpts);
  // steps
  for (let i = 0; i < 4; i++) {
    const y = 834 + i * 22, p = ss(seg(t, t0 + i * .12, t0 + .7 + i * .12));
    edge(ctx, [300 - i * 10, y], [1620 + i * 10, y], 1.8 * k, p);
    edge(ctx, [300 - i * 10, y], [960, y + 8], 1.15 * k, p * .8);
    edge(ctx, [960, y + 8], [1620 + i * 10, y], 1.15 * k, p * .8);
  }
  // paving joints
  hatch(ctx, [[0, 920], [W, 920], [W, H], [0, H]], { angle: .015, spacing: 30, width: 1.0 * k, progress: ss(seg(t, t0 + .5, t0 + 2.2)), phase: 3 });
  // cast shadow to the right of the temple
  const sh = [[1040, 826], [1700, 826], [1880, 990], [1120, 990]];
  bandHatch(ctx, sh, { angle: .7, spacing: 4.4, width: 1.6 * k, progress: ss(seg(t, t0 + 1.2, t0 + 3.2)), phase: 6 }, 8);
  bandHatch(ctx, sh, { angle: 1.34, spacing: 6.4, width: 1.3 * k, progress: ss(seg(t, t0 + 2.1, t0 + 3.6)), phase: 7 }, 8);
  // sparse foreground texture
  hatch(ctx, [[0, 990], [W, 990], [W, H], [0, H]], { angle: .015, spacing: 10, width: .75 * k, progress: ss(seg(t, t0 + 2, t0 + 3.4)), phase: 9 });
}

function washes(ctx, t) {
  // colour arrives as an event, after the print is cut
  const p = ss(seg(t, 12.4, 16));
  if (p <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  // sky
  const sky = [[0, 0], [W, 0], [W, 826], [0, 826]];
  ctx.globalAlpha = .42 * ss(seg(t, 12.5, 15.5)); ctx.fillStyle = SKY; poly(ctx, sky); ctx.fill();
  // pediment + entablature warm stone
  ctx.globalAlpha = .24 * ss(seg(t, 13.0, 16)); ctx.fillStyle = OCHRE;
  poly(ctx, PED); ctx.fill();
  poly(ctx, [[ENT.x0, ENT.y0], [ENT.x1, ENT.y0], [ENT.x1, ENT.y1], [ENT.x0, ENT.y1]]); ctx.fill();
  // columns, staggered
  COLX.forEach((cx, i) => {
    const q = ss(seg(t, 13.2 + i * .18, 15.8 + i * .18));
    ctx.globalAlpha = .22 * q; ctx.fillStyle = i % 2 ? '#b98b57' : '#c9a06a';
    ctx.fillRect(cx - 46, 406, 92, 430);
  });
  // ground olive
  ctx.globalAlpha = .20 * ss(seg(t, 13.6, 16)); ctx.fillStyle = OLIVE;
  ctx.fillRect(0, 826, W, H - 826);
  ctx.restore();
  // soft pigment pooling at the bottom edge
  ctx.save(); ctx.globalAlpha = .10 * p;
  const g = ctx.createLinearGradient(0, 900, 0, 1080);
  g.addColorStop(0, 'rgba(120,110,60,0)'); g.addColorStop(1, 'rgba(120,110,60,.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 900, W, 180); ctx.restore();
}

function labels(ctx, t) {
  const a = ss(seg(t, 12.0, 13.2));
  if (!a) return;
  ctx.save(); ctx.globalAlpha = a;
  text(ctx, 'TEMPLVM DORICVM', 150, 112, { size: 19, font: F.georgia, spacing: 5, color: INK });
  text(ctx, 'c. 450 B.C.  ·  PLATE I', 150, 138, { size: 14, font: F.georgia, spacing: 2.6, color: INK, italic: true, alpha: .7 });
  text(ctx, '石  ·  公元前五世纪', 150, 176, { size: 22, font: F.song, spacing: 3, color: INK, alpha: .78 });
  text(ctx, 'DORIC  ·  POST & LINTEL', 150, 200, { size: 12, font: F.georgia, spacing: 3, color: INK, alpha: .5 });
  ctx.restore();
}

function prologue(ctx, t) {
  if (t >= 8.0) return;
  const open = eio(seg(t, 6.2, 7.9));
  const gap = lerp(9, W + 4, open);
  const left = (W - gap) / 2;
  ctx.save();
  ctx.fillStyle = '#060504';
  ctx.fillRect(0, 0, Math.max(0, left), H);
  ctx.fillRect(Math.min(W, left + gap), 0, W - (left + gap), H);
  // slit light: warm core, soft halo
  if (open < .98) {
    const g = ctx.createLinearGradient(left - 40, 0, left + gap + 40, 0);
    g.addColorStop(0, 'rgba(255,190,110,0)'); g.addColorStop(.5, `rgba(255,206,138,${.22 * (1 - open)})`); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g; ctx.fillRect(left - 40, 0, gap + 80, H);
  }
  // dust in the slit
  const R = mulberry(9);
  for (let i = 0; i < 26; i++) {
    const x = left + gap * (.15 + .7 * hash(i * 3.7 + 1.3));
    const y = (hash(i * 9.1) * H + t * (6 + hash(i) * 18)) % H;
    ctx.globalAlpha = .18 + .25 * hash(i * 4.4);
    ctx.fillStyle = '#ffe0b0'; ctx.beginPath(); ctx.arc(x, y, .6 + hash(i * 2.2) * 1.8, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // title
  const ta = ss(seg(t, 2.0, 3.3)) * (1 - ss(seg(t, 6.6, 7.4)));
  if (ta > 0) {
    ctx.globalAlpha = ta;
    text(ctx, '窗', 232, 690, { size: 230, font: F.serif, color: '#efe3ca', alpha: 1 });
    ctx.strokeStyle = 'rgba(239,227,202,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(236, 742); ctx.lineTo(650, 742); ctx.stroke();
    text(ctx, 'T H E   W I N D O W', 238, 790, { size: 25, font: F.georgia, color: '#e7d9bd', alpha: .9 });
    text(ctx, '一部建筑史  ·  A HISTORY OF THE OPENING', 238, 832, { size: 17, font: F.song, color: '#cdbb99', alpha: .75, spacing: 1.5 });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function draw(ctx, t) {
  init();
  const { s, fx, fy } = cam(t);
  const k = 1 / Math.pow(s / .92, .55);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-fx, -fy);
  ctx.drawImage(paper, 0, 0, W, H);
  // paper darkens slightly at the edges of the plate
  const vg = ctx.createRadialGradient(960, 540, 380, 960, 540, 1120);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(70,48,20,.13)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ground(ctx, t, k);
  wall(ctx, t, k);
  pediment(ctx, t, k);
  entablature(ctx, t, k);
  COLX.forEach((cx, i) => column(ctx, cx, i, t, k));
  washes(ctx, t);
  // plate mark and rule
  const pa = ss(seg(t, 8.0, 9.0));
  ctx.globalAlpha = pa; ctx.strokeStyle = 'rgba(60,42,22,.55)'; ctx.lineWidth = 1.2;
  ctx.strokeRect(94, 62, W - 188, H - 124);
  ctx.strokeStyle = 'rgba(60,42,22,.30)'; ctx.lineWidth = .7; ctx.strokeRect(101, 69, W - 202, H - 138);
  ctx.globalAlpha = 1;
  labels(ctx, t);
  ctx.restore();
  // screen-space grain
  ctx.save(); ctx.globalAlpha = .10; ctx.globalCompositeOperation = 'multiply';
  const pat = ctx.createPattern(grain, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
  prologue(ctx, t);
}
