// Sizzle & Serve — all canvas drawing: the kitchen, order board, stations,
// plate, counter bins and the title / results screens. No images, no network:
// every visual is drawn with canvas shapes and emoji.

import {
  CANVAS, INGREDIENTS, INGREDIENT_ORDER, LAYOUT, GRILL_TIME, CHOP_TIME,
} from './config.js';
import { matchingOrder } from './logic.js';
import { starsFor } from './state.js';

const WALL = '#f6e3c5';
const WALL_DARK = '#e9cfa4';
const FLOOR = '#8a5a33';
const WOOD = '#a9713f';
const WOOD_DARK = '#7d4f27';
const STEEL = '#c9ced6';
const STEEL_DARK = '#9aa1ad';
const INK = '#2b2118';
const CREAM = '#fff8ea';
const RED = '#c0392b';
const GREEN = '#2e7d32';
const GOLD = '#f7c948';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, fill, stroke) {
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke || 'rgba(43,33,24,0.35)';
  ctx.stroke();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.font = `${weight || 700} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.fillStyle = color || INK;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function patienceColor(frac) {
  if (frac > 0.5) return GREEN;
  if (frac > 0.25) return '#e67e22';
  return RED;
}

function drawKitchen(ctx) {
  // Wall with tiles and a warm floor.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, CANVAS.width, 500);
  ctx.fillStyle = WALL_DARK;
  for (let x = 0; x < CANVAS.width; x += 80) ctx.fillRect(x, 140, 2, 360);
  for (let y = 150; y < 500; y += 60) ctx.fillRect(0, y, CANVAS.width, 2);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 500, CANVAS.width, 220);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -40; x < CANVAS.width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 500); ctx.lineTo(x + 60, 720); ctx.lineTo(x + 100, 720); ctx.lineTo(x + 40, 500);
    ctx.closePath(); ctx.fill();
  }
  // Window with a sunny street.
  panel(ctx, 640, 150, 200, 120, '#bfe3f0', '#7fb3c8');
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(700, 190, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(650, 245, 180, 15);
  text(ctx, '🍃', 790, 235, 26, INK, 'center');
  // Hanging pans and a clock.
  text(ctx, '🍳', 900, 190, 44, INK, 'center');
  text(ctx, '🥘', 950, 190, 44, INK, 'center');
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.arc(880, 300, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(880, 300); ctx.lineTo(880, 282); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(880, 300); ctx.lineTo(894, 306); ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 880, 340, 15, '#6b4a2a', 'center');
}

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.board;
  panel(ctx, b.x, b.y, b.w, b.h, '#5b3a1e', '#3d2712');
  text(ctx, '📋 ORDER BOARD', b.x + 16, b.y + 20, 17, '#ffd98a');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — get ready!', b.x + 16, b.y + 66, 18, '#e8d5b5');
    return;
  }
  state.orders.forEach((order, i) => {
    const x = b.x + 14 + i * 182;
    const y = b.y + 34;
    const w = 170;
    const h = 72;
    const frac = Math.max(0, order.patience / order.maxPatience);
    panel(ctx, x, y, w, h, CREAM, frac < 0.25 ? RED : '#d9c39a');
    // Dish name, truncated so it never runs into the price.
    ctx.font = '700 14px "Trebuchet MS", "Segoe UI", sans-serif';
    let label = `${order.emoji} ${order.name}`;
    while (ctx.measureText(label).width > w - 52 && label.length > 4) label = label.slice(0, -2);
    if (label !== `${order.emoji} ${order.name}`) label = `${label.trim()}…`;
    text(ctx, label, x + 10, y + 16, 14, INK);
    // Recipe icons.
    let ix = x + 10;
    for (const item of order.items) {
      text(ctx, INGREDIENTS[item].emoji, ix, y + 42, 20, INK, 'left');
      ix += 26;
    }
    text(ctx, `$${order.price}`, x + w - 10, y + 16, 15, GREEN, 'right');
    // Patience bar.
    ctx.fillStyle = '#e0d3b8';
    ctx.fillRect(x + 10, y + 58, w - 20, 7);
    ctx.fillStyle = patienceColor(frac);
    ctx.fillRect(x + 10, y + 58, (w - 20) * frac, 7);
  });
}

function drawTimer(ctx, state) {
  const t = LAYOUT.timer;
  const urgent = state.timeLeft <= 30;
  panel(ctx, t.x, t.y, t.w, t.h, urgent ? '#fde8e8' : CREAM, urgent ? RED : '#d9c39a');
  const m = Math.floor(state.timeLeft / 60);
  const s = Math.floor(state.timeLeft % 60);
  text(ctx, `⏱ ${m}:${String(s).padStart(2, '0')}`, t.x + 14, t.y + 29, 26, urgent ? RED : INK);
  const mny = LAYOUT.money;
  panel(ctx, mny.x, mny.y, mny.w, mny.h, CREAM, '#d9c39a');
  text(ctx, `💰 $${state.money}`, mny.x + 14, mny.y + 20, 22, GREEN);
  text(ctx, `served ${state.served}  ${state.combo > 1 ? `🔥 combo x${state.combo}` : 'no combo yet'}`, mny.x + 14, mny.y + 42, 13, '#6b4a2a');
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  panel(ctx, g.x, g.y, g.w, g.h, '#3a3a3a', '#222');
  text(ctx, '🔥 GRILL — click when ready', g.x + 14, g.y + 20, 13, '#ffd98a');
  state.grill.forEach((slot, i) => {
    const x = g.x + 20 + i * 140;
    const y = g.y + 42;
    rr(ctx, x, y, 120, 86, 10);
    ctx.fillStyle = '#555';
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Grill bars.
    ctx.strokeStyle = '#333';
    for (let b = 0; b < 4; b += 1) {
      ctx.beginPath(); ctx.moveTo(x + 10, y + 18 + b * 20); ctx.lineTo(x + 110, y + 18 + b * 20); ctx.stroke();
    }
    if (!slot) {
      text(ctx, 'empty', x + 60, y + 44, 14, '#aaa', 'center');
      return;
    }
    const ing = INGREDIENTS[slot.item];
    if (slot.state === 'cooking') {
      text(ctx, '🔥', x + 60, y + 30, 26, INK, 'center');
      text(ctx, ing.emoji, x + 60, y + 58, 30, INK, 'center');
      const frac = Math.min(1, slot.progress / GRILL_TIME[slot.item]);
      ctx.fillStyle = '#222'; ctx.fillRect(x + 14, y + 76, 92, 6);
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(x + 14, y + 76, 92 * frac, 6);
    } else if (slot.state === 'cooked') {
      ctx.fillStyle = 'rgba(247,201,72,0.25)';
      ctx.fillRect(x, y, 120, 86);
      text(ctx, ing.emoji, x + 60, y + 40, 34, INK, 'center');
      text(ctx, 'READY ✓', x + 60, y + 70, 13, GOLD, 'center');
    } else {
      text(ctx, '💨', x + 60, y + 34, 28, INK, 'center');
      text(ctx, 'BURNT — click to toss', x + 60, y + 66, 11, '#ff9a8a', 'center');
    }
  });
}

function drawChop(ctx, state) {
  const c = LAYOUT.chop;
  panel(ctx, c.x, c.y, c.w, c.h, WOOD, WOOD_DARK);
  text(ctx, '🔪 CHOPPING BOARD — click when ready', c.x + 14, c.y + 20, 13, '#ffe9c4');
  state.chop.forEach((slot, i) => {
    const x = c.x + 20 + i * 140;
    const y = c.y + 42;
    rr(ctx, x, y, 120, 86, 10);
    ctx.fillStyle = '#e8c98f';
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!slot) { text(ctx, 'empty', x + 60, y + 44, 14, '#8a6a3a', 'center'); return; }
    const ing = INGREDIENTS[slot.item];
    if (slot.state === 'chopping') {
      text(ctx, '🔪', x + 60, y + 30, 24, INK, 'center');
      text(ctx, ing.emoji, x + 60, y + 58, 30, INK, 'center');
      const frac = Math.min(1, slot.progress / CHOP_TIME);
      ctx.fillStyle = '#c9a86a'; ctx.fillRect(x + 14, y + 76, 92, 6);
      ctx.fillStyle = GREEN; ctx.fillRect(x + 14, y + 76, 92 * frac, 6);
    } else {
      ctx.fillStyle = 'rgba(46,125,50,0.18)';
      ctx.fillRect(x, y, 120, 86);
      text(ctx, ing.emoji, x + 60, y + 40, 34, INK, 'center');
      text(ctx, 'CHOPPED ✓', x + 60, y + 70, 13, GREEN, 'center');
    }
  });
}

function drawPlate(ctx, state) {
  const p = LAYOUT.plate;
  const shaking = state.shakeUntil > state.elapsed;
  const dx = shaking ? (Math.random() - 0.5) * 8 : 0;
  panel(ctx, p.x + dx, p.y, p.w, p.h, CREAM, state.flashServe ? GOLD : '#d9c39a');
  text(ctx, '🍽 ASSEMBLY PLATE', p.x + 14, p.y + 20, 15, '#6b4a2a');
  // The plate itself: an ellipse with the stacked ingredients.
  const cx = p.x + p.w / 2;
  const cy = p.y + 128;
  ctx.fillStyle = '#eef1f5';
  ctx.beginPath(); ctx.ellipse(cx, cy, 110, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = STEEL_DARK; ctx.lineWidth = 2; ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Click ingredients below to build a dish', cx, cy - 44, 14, '#8a7a5f', 'center');
  } else {
    let ix = cx - (state.plate.length * 30) / 2 + 15;
    for (const item of state.plate) {
      text(ctx, INGREDIENTS[item].emoji, ix, cy - 12, 30, INK, 'center');
      ix += 30;
    }
    const match = matchingOrder(state);
    if (match) {
      text(ctx, `✓ ${match.name} ready — hit SERVE!`, cx, p.y + 48, 13, GREEN, 'center');
    } else {
      text(ctx, `${state.plate.length} item${state.plate.length > 1 ? 's' : ''} on the plate`, cx, p.y + 48, 14, '#6b4a2a', 'center');
    }
  }
}

function drawTrashAndServe(ctx, state) {
  const t = LAYOUT.trash;
  panel(ctx, t.x, t.y, t.w, t.h, '#e8e2d6', '#b8ab8d');
  text(ctx, '🗑 TRASH', t.x + t.w / 2, t.y + 22, 15, INK, 'center');
  text(ctx, 'clear plate', t.x + t.w / 2, t.y + 46, 12, '#6b4a2a', 'center');
  const s = LAYOUT.serve;
  const match = matchingOrder(state);
  panel(ctx, s.x, s.y, s.w, s.h, match ? GREEN : '#9aa1ad', match ? '#1b5e20' : '#6b7280');
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 28, 22, '#fff', 'center');
  text(ctx, match ? match.name : 'no match yet', s.x + s.w / 2, s.y + 54, 11, '#fff', 'center');
}

function drawCounter(ctx, state) {
  const c = LAYOUT.counter;
  panel(ctx, c.x, c.y, c.w, c.h, WOOD, WOOD_DARK);
  text(ctx, '🥕 INGREDIENTS — click a bin (or press 1–8). Raw meat goes to the grill, veg to the board.', c.x + 16, c.y + 22, 16, '#ffe9c4');
  const binW = 146;
  INGREDIENT_ORDER.forEach((id, i) => {
    const ing = INGREDIENTS[id];
    const x = c.x + 12 + i * (binW + 6);
    const y = c.y + 44;
    const busy = (ing.prep === 'grill' && state.grill.every((s) => s !== null))
      || (ing.prep === 'chop' && state.chop.every((s) => s !== null));
    rr(ctx, x, y, binW, 118, 10);
    ctx.fillStyle = busy ? '#d8cbb2' : CREAM;
    ctx.fill();
    ctx.strokeStyle = '#b98d4f'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, ing.emoji, x + binW / 2, y + 34, 38, INK, 'center');
    text(ctx, ing.name, x + binW / 2, y + 74, 15, INK, 'center');
    const prep = ing.prep === 'grill' ? '→ grill' : ing.prep === 'chop' ? '→ chop' : 'ready';
    text(ctx, `${prep}  [${ing.key}]`, x + binW / 2, y + 98, 12, '#6b4a2a', 'center');
  });
}

function drawToast(ctx, state) {
  if (!state.toast || state.elapsed > state.toastUntil) return;
  const t = LAYOUT.toast;
  rr(ctx, t.x, t.y, t.w, t.h, 22);
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  ctx.fill();
  text(ctx, state.toast, t.x + t.w / 2, t.y + 23, 16, '#fff', 'center');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.45)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  panel(ctx, 290, 120, 700, 400, CREAM, '#d9c39a');
  text(ctx, '🍳 SIZZLE & SERVE', 640, 180, 52, INK, 'center');
  text(ctx, 'The lunch rush is on! Build every order before its patience runs out.', 640, 235, 19, '#6b4a2a', 'center');
  text(ctx, '1 · Click ingredients on the counter', 640, 290, 18, INK, 'center');
  text(ctx, '2 · Meat grills, veg gets chopped — click when ready', 640, 320, 18, INK, 'center');
  text(ctx, '3 · Stack the dish on the plate, then SERVE it', 640, 350, 18, INK, 'center');
  text(ctx, 'Fast serves earn tips. Combos pay extra. Burnt food goes in the bin.', 640, 380, 16, '#6b4a2a', 'center');
  rr(ctx, 490, 420, 300, 64, 32);
  ctx.fillStyle = GREEN; ctx.fill();
  text(ctx, '▶  START SHIFT  (180s)', 640, 453, 22, '#fff', 'center');
  text(ctx, 'Mouse + keyboard 1–8 · Enter serves · T trashes the plate', 640, 500, 14, '#6b4a2a', 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.45)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  panel(ctx, 340, 110, 600, 470, CREAM, '#d9c39a');
  text(ctx, '⏰ SHIFT OVER!', 640, 165, 44, INK, 'center');
  const stars = starsFor(state.money);
  text(ctx, stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆', 640, 225, 40, GOLD, 'center');
  text(ctx, `You earned $${state.money}  ·  served ${state.served} dish${state.served === 1 ? '' : 'es'}`, 640, 275, 20, INK, 'center');
  text(ctx, `Tips banked $${state.stats.tips}  ·  best combo x${state.bestCombo}  ·  ${state.failed} order${state.failed === 1 ? '' : 's'} walked out`, 640, 310, 16, '#6b4a2a', 'center');
  const verdict = stars === 3 ? 'Head-chef material! The lunch rush fears you.'
    : stars === 2 ? 'Solid shift — the regulars are happy.'
      : stars === 1 ? 'A shaky shift, but the kitchen survived.'
        : 'The rush won this time. Fire up the grill and try again!';
  text(ctx, verdict, 640, 345, 17, INK, 'center');
  rr(ctx, 490, 390, 300, 64, 32);
  ctx.fillStyle = GREEN; ctx.fill();
  text(ctx, '↻  PLAY AGAIN  (R)', 640, 423, 22, '#fff', 'center');
  text(ctx, '3 stars needs $150 · 2 stars $100 · 1 star $50', 640, 500, 14, '#6b4a2a', 'center');
}

/** Draw the whole frame for the current screen. */
export function render(ctx, state) {
  drawKitchen(ctx);
  drawOrderBoard(ctx, state);
  drawTimer(ctx, state);
  drawGrill(ctx, state);
  drawChop(ctx, state);
  drawPlate(ctx, state);
  drawTrashAndServe(ctx, state);
  drawCounter(ctx, state);
  drawToast(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawOver(ctx, state);
}
