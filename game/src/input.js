// Sizzle & Serve — mouse and keyboard input: every click lands on a station,
// a bin, a ticket or a button, and the keys mirror the same actions.

import { INGREDIENTS, INGREDIENT_ORDER, LAYOUT } from './config.js';
import { createState, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './state.js';
import { collectChop, collectGrill, serveOrder, takeIngredient, trashPlate } from './logic.js';

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

/** Convert a browser mouse event to canvas coordinates. */
export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

/** Handle one click at canvas coordinates (x, y). Returns true if it did something. */
export function handleClick(state, x, y) {
  if (state.screen === SCREEN_TITLE) {
    if (inside(x, y, { x: 490, y: 420, w: 300, h: 64 })) {
      state.screen = SCREEN_PLAY;
      return true;
    }
    return false;
  }
  if (state.screen === SCREEN_OVER) {
    if (inside(x, y, { x: 490, y: 390, w: 300, h: 64 })) {
      const fresh = createState((Date.now() % 100000) + 7);
      Object.assign(state, fresh, { screen: SCREEN_PLAY });
      return true;
    }
    return false;
  }
  // Serve button.
  if (inside(x, y, LAYOUT.serve)) { serveOrder(state); return true; }
  // Trash bin.
  if (inside(x, y, LAYOUT.trash)) { trashPlate(state); return true; }
  // Grill slots.
  for (let i = 0; i < 2; i += 1) {
    const slot = { x: LAYOUT.grill.x + 20 + i * 140, y: LAYOUT.grill.y + 42, w: 120, h: 86 };
    if (inside(x, y, slot)) { collectGrill(state, i); return true; }
  }
  // Chop slots.
  for (let i = 0; i < 2; i += 1) {
    const slot = { x: LAYOUT.chop.x + 20 + i * 140, y: LAYOUT.chop.y + 42, w: 120, h: 86 };
    if (inside(x, y, slot)) { collectChop(state, i); return true; }
  }
  // Order tickets: click a ticket to serve the plate to that order.
  const b = LAYOUT.board;
  for (let i = 0; i < state.orders.length; i += 1) {
    const ticket = { x: b.x + 14 + i * 182, y: b.y + 34, w: 170, h: 72 };
    if (inside(x, y, ticket)) { serveOrder(state, state.orders[i].id); return true; }
  }
  // Ingredient bins along the counter.
  const c = LAYOUT.counter;
  const binW = 146;
  for (let i = 0; i < INGREDIENT_ORDER.length; i += 1) {
    const bin = { x: c.x + 12 + i * (binW + 6), y: c.y + 44, w: binW, h: 118 };
    if (inside(x, y, bin)) { takeIngredient(state, INGREDIENT_ORDER[i]); return true; }
  }
  return false;
}

/** Handle one key press. Returns true if it did something. */
export function handleKey(state, key) {
  const k = key.toLowerCase();
  if (state.screen === SCREEN_TITLE && (k === 'enter' || k === ' ')) {
    state.screen = SCREEN_PLAY;
    return true;
  }
  if (state.screen === SCREEN_OVER && k === 'r') {
    const fresh = createState((Date.now() % 100000) + 7);
    Object.assign(state, fresh, { screen: SCREEN_PLAY });
    return true;
  }
  if (state.screen !== SCREEN_PLAY) return false;
  // Ingredient shortcuts 1-8.
  const byKey = Object.values(INGREDIENTS).find((ing) => ing.key === k);
  if (byKey) { takeIngredient(state, byKey.id); return true; }
  if (k === 'enter' || k === ' ') { serveOrder(state); return true; }
  if (k === 't') { trashPlate(state); return true; }
  if (k === 'g') {
    const i = state.grill.findIndex((s) => s && s.state !== 'cooking');
    if (i !== -1) collectGrill(state, i);
    return true;
  }
  if (k === 'c') {
    const i = state.chop.findIndex((s) => s && s.state === 'ready');
    if (i !== -1) collectChop(state, i);
    return true;
  }
  return false;
}
