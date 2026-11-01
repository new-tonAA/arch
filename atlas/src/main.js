import { W, H, F } from './common.js';
import { DUR } from './buildings.js';
import * as atlas from './atlas.js';

const Q = new URLSearchParams(location.search);
const POSTER = Q.has('poster');
window.__POSTER = POSTER;
const c = document.querySelector('#c');
c.width = W; c.height = H;
const ctx = c.getContext('2d', { alpha: false });

function poster(ctx) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 500, 0, 1080);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
  ctx.fillStyle = g; ctx.fillRect(0, 400, 1000, 680);
  ctx.restore();
  // the poster is drawn by the page at t=226 (postmodern) with a title overlay
  ctx.save();
  ctx.fillStyle = '#f1e8d2'; ctx.font = '190px "Source Han Serif SC", Georgia, serif';
  ctx.fillText('年表', 104, 760);
  ctx.strokeStyle = 'rgba(241,232,210,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(110, 800); ctx.lineTo(620, 800); ctx.stroke();
  ctx.fillStyle = '#efe6d3'; ctx.font = '24px Georgia, serif'; ctx.letterSpacing = '5px';
  ctx.fillText('A TIMELINE OF BUILDINGS', 112, 844);
  ctx.fillStyle = '#d9c9ab'; ctx.font = '17px "Source Han Serif SC", serif';
  ctx.fillText('72 座建筑  ·  4,500 年  ·  A FILM DRAWN IN CODE', 112, 880);
  ctx.restore();
}

function draw(t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  atlas.draw(ctx, t);
  if (POSTER) poster(ctx);
}

window.DUR = DUR;
window.render = draw;

async function boot() {
  const s = '建筑年表窗ABC0123456789';
  await Promise.all([
    document.fonts.load('64px "Source Han Serif SC"', s),
    document.fonts.load('64px "Microsoft YaHei"', s),
    document.fonts.load('64px KaiTi', s),
    document.fonts.load('64px Georgia', 'A TIMELINE 0123456789'),
    document.fonts.load('64px "IM Fell English"', 'A TIMELINE 0123456789'),
    document.fonts.load('64px Fredoka', 'A TIMELINE 0123456789'),
    document.fonts.load('64px "Lilita One"', 'A TIMELINE 0123456789'),
    document.fonts.load('64px Consolas', 'A TIMELINE 0123456789'),
    document.fonts.load('64px Bahnschrift', 'A TIMELINE 0123456789'),
  ]);
  await document.fonts.ready;
  window.READY = true;
  draw(0);
}
boot();
