import { W, H, F, eio, seg, lerp, ss, text } from './common.js';
import { DUR, sceneAt } from './timeline.js';
import * as subtitles from './subtitles.js';
import * as stone from './scenes/stone.js';
import * as glass from './scenes/glass.js';
import * as lineScene from './scenes/line.js';
import * as iron from './scenes/iron.js';
import * as grid from './scenes/grid.js';
import * as play from './scenes/play.js';
import * as data from './scenes/data.js';
import * as coda from './scenes/coda.js';

const Q = new URLSearchParams(location.search);
const POSTER = Q.has('poster');
if (Q.has('only')) window.__ONLY = Q.get('only');
const c = document.querySelector('#c');
c.width = W; c.height = H;
const ctx = c.getContext('2d', { alpha: false });

// Scenes are added as they are built. During a transition both are drawn.
const SCENES = { stone, glass, line: lineScene, iron, grid, play, data, coda };

function archPath(cx, cy, hw, hh) {
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy + hh);
  ctx.lineTo(cx - hw, cy - hh * .15);
  ctx.quadraticCurveTo(cx - hw, cy - hh, cx, cy - hh);
  ctx.quadraticCurveTo(cx + hw, cy - hh, cx + hw, cy - hh * .15);
  ctx.lineTo(cx + hw, cy + hh);
  ctx.closePath();
}

function posterOverlay(ctx) {
  const g = ctx.createLinearGradient(0, 500, 0, 1080);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 400, 900, 680); ctx.restore();
  ctx.save();
  text(ctx, '窗', 108, 760, { size: 190, font: F.serif, color: '#f1e8d2' });
  ctx.strokeStyle = 'rgba(241,232,210,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(112, 800); ctx.lineTo(520, 800); ctx.stroke();
  text(ctx, 'T H E   W I N D O W', 112, 842, { size: 24, font: F.georgia, color: '#efe6d3', spacing: 5 });
  text(ctx, '一部建筑史  ·  A HISTORY OF THE OPENING', 112, 878, { size: 16, font: F.song, color: '#d9c9ab', spacing: 1.4 });
  text(ctx, 'A FILM DRAWN IN CODE  ·  2026', 112, 944, { size: 12, font: F.bahn, color: 'rgba(217,201,171,.75)', spacing: 2 });
  ctx.restore();
}

function draw(t) {
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  // stone -> glass: the doorway opens into the chapel
  if (t >= 21.0 && t < 22.0) {
    glass.draw(ctx, t);
    const p = eio(seg(t, 21.0, 22.0));
    const hw = lerp(30, 980, p), hh = hw * 1.45;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H); archPath(960, 540, hw, hh);
    ctx.clip('evenodd');
    stone.draw(ctx, t);
    ctx.restore();
    // stone rim of the opening
    ctx.save(); ctx.strokeStyle = 'rgba(28,21,16,.85)'; ctx.lineWidth = 10 + 20 * p; archPath(960, 540, hw + 6, hh); ctx.stroke();
    ctx.strokeStyle = 'rgba(241,232,210,.35)'; ctx.lineWidth = 2; archPath(960, 540, hw + 16, hh); ctx.stroke();
    ctx.restore();
    if (!POSTER) subtitles.draw(ctx, t);
    ctx.restore();
    return;
  }

  // line -> iron: a blueprint sheet slides over the drawing
  if (t >= 49.5 && t < 50.5) {
    lineScene.draw(ctx, t);
    const p = eio(seg(t, 49.5, 50.5));
    const edge = lerp(W, 0, p);
    ctx.save();
    ctx.beginPath(); ctx.rect(edge, 0, W - edge, H); ctx.clip();
    iron.draw(ctx, t);
    ctx.restore();
    ctx.save();
    const g = ctx.createLinearGradient(edge - 24, 0, edge + 12, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
    ctx.fillStyle = g; ctx.fillRect(edge - 24, 0, 36, H);
    ctx.strokeStyle = 'rgba(240,235,215,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(edge, H); ctx.stroke();
    ctx.restore();
    if (!POSTER) subtitles.draw(ctx, t);
    ctx.restore();
    return;
  }

  // data -> coda: the points become the stone column
  if (t >= 102.6 && t < 103.6) {
    coda.draw(ctx, t);
    ctx.save(); ctx.globalAlpha = 1 - ss(seg(t, 102.6, 103.2));
    data.draw(ctx, t);
    ctx.restore();
    if (!POSTER) subtitles.draw(ctx, t);
    ctx.restore();
    return;
  }

  const s = sceneAt(t);
  const fn = SCENES[s.id];
  if (fn) fn.draw(ctx, t); else stone.draw(ctx, t);
  ctx.restore();
  if (!POSTER) subtitles.draw(ctx, t); else posterOverlay(ctx);
}

window.DUR = DUR;
window.render = draw;
window.TEXTS = t => subtitles.textsAt(t);

async function boot() {
  const samples = '窗建筑史THE WINDOW';
  await Promise.all([
    document.fonts.load('64px "Source Han Serif SC"', samples),
    document.fonts.load('64px "Microsoft YaHei"', samples),
    document.fonts.load('64px "KaiTi"', samples),
    document.fonts.load('64px Georgia', 'THE WINDOW'),
    document.fonts.load('64px "IM Fell English"', 'THE WINDOW'),
    document.fonts.load('64px Fredoka', 'WINDOW'),
    document.fonts.load('64px "Lilita One"', 'WINDOW'),
    document.fonts.load('64px Consolas', 'WINDOW'),
    document.fonts.load('64px Bahnschrift', 'WINDOW'),
  ]);
  await document.fonts.ready;
  window.READY = true;
  draw(0);
}
boot();
