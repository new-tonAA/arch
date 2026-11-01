// Shared drawing utilities for 《窗》. Deterministic: no Date, no unseeded random.
export const W = 1920, H = 1080;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const ss = t => t * t * (3 - 2 * t);
export const eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const eo = t => 1 - Math.pow(1 - t, 3);
export const ei = t => t * t * t;
export const back = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const smoothstep = ss;

export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function hash(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
export function vnoise(x, y = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi + yi * 57.0), b = hash(xi + 1 + yi * 57.0);
  const c = hash(xi + (yi + 1) * 57.0), d = hash(xi + 1 + (yi + 1) * 57.0);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export function fbm(x, y, oct = 4) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; }
  return s;
}
export function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
export function hexRgb(h) {
  if (typeof h !== 'string') return h;
  if (h.startsWith('rgb')) {
    const m = h.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function lerpColor(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
export function rgba(hex, a) {
  const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`;
}
export function poly(ctx, pts, close = true) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  if (close) ctx.closePath();
}
export function fillPoly(ctx, pts, style) {
  poly(ctx, pts); ctx.fillStyle = style; ctx.fill();
}
// Tapered burin stroke along a polyline, revealed to `p` of its length.
export function taper(ctx, pts, w0, w1, p = 1, color = '#1c1510', cap = true) {
  if (pts.length < 2 || p <= 0) return;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const lim = total * clamp(p, 0, 1);
  if (lim <= 0.01) return;
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    if (cum[i] > lim) break;
    const q = i < pts.length - 1 ? pts[i + 1] : pts[i - 1];
    let dx = q[0] - pts[i][0], dy = q[1] - pts[i][1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const u = cum[i] / (total || 1);
    // burin swell: fine at entry, full mid-run, lifts to a point
    const swell = 0.20 + 0.80 * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.65);
    const w = lerp(w0, w1, u) * swell * 0.5;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  if (L.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  if (cap) {
    const e = L[L.length - 1], f = R[R.length - 1];
    ctx.beginPath(); ctx.arc((e[0] + f[0]) / 2, (e[1] + f[1]) / 2, Math.max(.4, (w0 + w1) / 4), 0, 7); ctx.fill();
  }
}
// Robust hatch: clip each line against the polygon analytically (no canvas clip state).
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function lineSegments(a, b, pts) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const den0 = dx * dy - dy * dx;
  const ts = [0, 1];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const ex = q[0] - p[0], ey = q[1] - p[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const px = p[0] - a[0], py = p[1] - a[1];
    const t = (px * ey - py * ex) / den;
    const u = (px * dy - py * dx) / den;
    if (t > 0 && t < 1 && u >= -1e-6 && u <= 1 + 1e-6) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const segs = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i], t1 = ts[i + 1];
    if (t1 - t0 < 1e-5) continue;
    const mx = a[0] + dx * (t0 + t1) / 2, my = a[1] + dy * (t0 + t1) / 2;
    if (pointInPoly(mx, my, pts)) segs.push([t0, t1]);
  }
  return segs;
}
// Clip a polygon to a horizontal band, then hatch it: short engraved line fields.
function clipY(pts, y0, y1) {
  const out = [];
  const push = p => { if (!out.length || Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) > 1e-6) out.push(p); };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a[1] >= y0 && a[1] <= y1, bin = b[1] >= y0 && b[1] <= y1;
    if (ain) push(a);
    if (ain !== bin) {
      const ta = (y0 - a[1]) / (b[1] - a[1]);
      const tb = (y1 - a[1]) / (b[1] - a[1]);
      for (const tt of [ta, tb]) if (tt > 0 && tt < 1) push([a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt]);
    }
  }
  return out;
}
export function bandHatch(ctx, pts, o = {}, bands = 7) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const h = (y1 - y0) / bands;
  for (let b = 0; b < bands; b++) {
    const sub = clipY(pts, y0 + b * h + .5, y0 + (b + 1) * h - .5);
    if (sub.length < 3) continue;
    const prog = o.progress === undefined ? 1 : clamp(o.progress * 1.15 - b / bands * .15, 0, 1);
    hatch(ctx, sub, { ...o, progress: prog, phase: (o.phase || 0) + b * 1.7 });
  }
}
export function hatch(ctx, pts, o = {}) {
  const { angle = Math.PI / 4, spacing = 7, width = 1.1, color = '#1c1510',
    progress = 1, wobble = 1.1, jitter = .25, phase = 0, reverse = false } = o;
  if (progress <= 0) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const diag = Math.hypot(x1 - x0, y1 - y0);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const nx = -dy, ny = dx;
  const n = Math.ceil(diag / spacing) + 2;
  for (let i = -n; i <= n; i++) {
    if ((i & 1) === 1 && jitter && hash(i * 3.1 + phase) < jitter * .35) continue;
    const off = i * spacing * (1 + (hash(i * 7.7 + phase) - .5) * .10);
    const px = cx + nx * off, py = cy + ny * off;
    const half = diag * .78;
    const a = [px - dx * half, py - dy * half], b = [px + dx * half, py + dy * half];
    const segs = lineSegments(a, b, pts);
    for (let s = 0; s < segs.length; s++) {
      const [ta, tb] = segs[s];
      const A = [a[0] + (b[0] - a[0]) * ta, a[1] + (b[1] - a[1]) * ta];
      const B = [a[0] + (b[0] - a[0]) * tb, a[1] + (b[1] - a[1]) * tb];
      const q = [];
      for (let k = 0; k <= 3; k++) {
        const u = k / 3;
        const w = Math.sin(u * Math.PI) * wobble * (hash(i * 5.1 + k * 9.3 + phase) - .5);
        q.push([lerp(A[0], B[0], u) + nx * w, lerp(A[1], B[1], u) + ny * w]);
      }
      const midT = (ta + tb) / 2;
      const order = reverse ? 1 - midT : midT;
      const lp = clamp(progress * 1.8 - order * .8, 0, 1);
      if (lp > 0) taper(ctx, q, width * .45, width, lp, color, false);
    }
  }
}
export function line(ctx, pts, w, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  poly(ctx, pts, false); ctx.stroke(); ctx.restore();
}
export function dashed(ctx, a, b, w, color, pattern = [18, 10], alpha = 1, p = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) * p;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(pattern);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + dx / Math.hypot(dx, dy) * len, a[1] + dy / Math.hypot(dx, dy) * len); ctx.stroke(); ctx.restore();
}
export function text(ctx, str, x, y, o = {}) {
  const { size = 40, font = 'Georgia', color = '#1c1510', align = 'left', baseline = 'alphabetic',
    alpha = 1, spacing = 0, weight = '', italic = false, maxW, rot = 0 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.font = `${italic ? 'italic ' : ''}${weight ? weight + ' ' : ''}${size}px ${font}`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (maxW) {
    const words = String(str).split(''); let ln = '', yy = 0;
    for (const ch of words) {
      if (ctx.measureText(ln + ch).width > maxW && ln) { ctx.fillText(ln, 0, yy); ln = ch; yy += size * 1.35; }
      else ln += ch;
    }
    ctx.fillText(ln, 0, yy);
  } else ctx.fillText(str, 0, 0);
  ctx.restore();
}
export function measure(ctx, str, size, font, spacing = 0) {
  ctx.save(); ctx.font = `${size}px ${font}`; if (spacing) ctx.letterSpacing = spacing + 'px';
  const w = ctx.measureText(str).width; ctx.restore(); return w;
}
export function clipReveal(ctx, x, y, w, h, p, fn) {
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * clamp(p, 0, 1), h); ctx.clip(); fn(); ctx.restore();
}
export function paperTexture(w, h, seed = 7, base = '#f1e8d2', dark = '#e4d7ba') {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const img = x.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (hash(i * .00013 + seed) - .5) * 10;
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * .95, 0, 255); d[i + 2] = clamp(d[i + 2] + n * .8, 0, 255);
  }
  x.putImageData(img, 0, 0);
  // laid lines
  x.globalAlpha = .045; x.strokeStyle = '#8a7650'; x.lineWidth = .7;
  for (let y = 0; y < h; y += 4) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  // fibres
  const R = mulberry(seed);
  x.globalAlpha = .09;
  for (let i = 0; i < 2600; i++) {
    const xx = R() * w, yy = R() * h, a = R() * Math.PI * 2, l = 4 + R() * 26;
    x.strokeStyle = R() < .5 ? '#8a7650' : '#fff8e6'; x.lineWidth = .5 + R() * .9;
    x.beginPath(); x.moveTo(xx, yy); x.quadraticCurveTo(xx + Math.cos(a) * l * .5 + R() * 2, yy + Math.sin(a) * l * .5, xx + Math.cos(a) * l, yy + Math.sin(a) * l); x.stroke();
  }
  // foxing
  for (let i = 0; i < 34; i++) {
    const xx = R() * w, yy = R() * h, r = 6 + R() * 60;
    const g = x.createRadialGradient(xx, yy, 0, xx, yy, r);
    g.addColorStop(0, `rgba(150,112,62,${.03 + R() * .05})`); g.addColorStop(1, 'rgba(150,112,62,0)');
    x.fillStyle = g; x.beginPath(); x.arc(xx, yy, r, 0, 7); x.fill();
  }
  x.globalAlpha = 1;
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(90,65,35,.10)`);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  return c;
}
export function grainOverlay(w, h, seed = 3, alpha = .05) {
  const c = makeCanvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = 255 * hash(i * .37 + seed) * alpha;
    d[i] = d[i + 1] = d[i + 2] = n > 127 ? 255 : 0; d[i + 3] = Math.abs(n - 127) > 60 ? 26 : 0;
  }
  x.putImageData(img, 0, 0); return c;
}
// Watercolour region: soft irregular fill plus a darker tide line.
export function washRegion(ctx, region, color, p, seed = 1, blur = 6) {
  if (p <= 0) return;
  const R = mulberry(seed);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .20 * clamp(p, 0, 1);
  ctx.fillStyle = color; ctx.filter = `blur(${blur}px)`;
  poly(ctx, region); ctx.fill();
  ctx.filter = 'none';
  // ragged front: a few translucent blobs at the edge
  const bb = region.reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[0]), Math.max(a[3], q[1])], [1e9, 1e9, -1e9, -1e9]);
  for (let i = 0; i < 14; i++) {
    const xx = lerp(bb[0], bb[2], R()), yy = lerp(bb[1], bb[3], R()), r = 8 + R() * 34;
    const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r);
    g.addColorStop(0, rgba(color, .12)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, r * p, 0, 7); ctx.fill();
  }
  ctx.restore();
  // tide line
  ctx.save(); ctx.globalAlpha = .16 * p; ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.filter = 'blur(1.4px)';
  poly(ctx, region); ctx.stroke(); ctx.restore();
}
export const F = {
  serif: '"Source Han Serif SC", Georgia, "Times New Roman", serif',
  song: '"Source Han Serif SC", SimSun, serif',
  hei: '"Microsoft YaHei", "Source Han Sans SC", sans-serif',
  kai: 'KaiTi, STKaiti, "Source Han Serif SC", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  fell: '"IM Fell English", Georgia, serif',
  ink: '"Ink Free", "Segoe Print", cursive',
  cons: 'Consolas, "Courier New", monospace',
  bahn: 'Bahnschrift, "Arial Narrow", Arial, sans-serif',
  arial: 'Arial, "Microsoft YaHei", sans-serif',
  display: '"Lilita One", "Arial Black", sans-serif',
  fredoka: 'Fredoka, "Microsoft YaHei", sans-serif',
};
