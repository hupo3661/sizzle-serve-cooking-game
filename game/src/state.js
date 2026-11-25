// Sizzle & Serve — game state: what a shift looks like, and how orders arrive.
// The state is plain data; logic.js mutates it, render.js draws it, shots.js stages it.

import {
  DISHES, DISH_ORDER, GRILL_TIME, ORDER_PATIENCE, SHIFT_SECONDS, makeRng,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** A fresh shift. `seed` drives order generation; play uses a time-based seed. */
export function createState(seed) {
  return {
    screen: SCREEN_TITLE,
    rng: makeRng(seed >>> 0 || 1),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    money: 0,
    served: 0,
    failed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    orders: [], // {id, dishId, patience, maxPatience}
    nextOrderId: 1,
    spawnIn: 4,
    // Grill slots: {item: 'beef'|'chicken', progress, state: 'cooking'|'cooked'|'burnt'} | null
    grill: [null, null],
    // Chop slots: {item, progress, state: 'chopping'|'ready'} | null
    chop: [null, null],
    // The plate being assembled: list of ingredient ids, in the order added.
    plate: [],
    toast: '', // one-line floating message
    toastUntil: 0,
    flashServe: false, // serve button pulses when the plate matches an order
    shakeUntil: 0, // plate shakes after a wrong serve
    stats: { earned: 0, tips: 0, wasted: 0 },
  };
}

/** Pick the next dish, weighted so early orders are the easy ones. */
function pickDish(state) {
  const roll = state.rng();
  const elapsed = state.elapsed;
  const pool = elapsed < 40
    ? ['classic', 'cheese', 'chicken']
    : elapsed < 100
      ? ['classic', 'cheese', 'chicken', 'salad']
      : DISH_ORDER;
  return pool[Math.floor(roll * pool.length)];
}

export function spawnOrder(state) {
  const dishId = pickDish(state);
  const dish = DISHES[dishId];
  state.orders.push({
    id: state.nextOrderId,
    dishId,
    name: dish.name,
    emoji: dish.emoji,
    items: [...dish.items],
    price: dish.price,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  });
  state.nextOrderId += 1;
}

/** Advance timers by dt seconds. Returns 'expired' order ids that timed out. */
export function tickTimers(state, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  const expired = [];
  for (const order of state.orders) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order.id);
  }
  if (expired.length > 0) {
    state.orders = state.orders.filter((o) => !expired.includes(o.id));
    state.failed += expired.length;
    state.combo = 0;
  }
  // Grill progress.
  for (const slot of state.grill) {
    if (!slot) continue;
    slot.progress += dt;
    if (slot.state === 'cooking' && slot.progress >= GRILL_TIME[slot.item]) {
      slot.state = 'cooked';
      slot.progress = 0;
    } else if (slot.state === 'cooked' && slot.progress >= 6) {
      slot.state = 'burnt';
    }
  }
  // Chop progress.
  for (const slot of state.chop) {
    if (!slot) continue;
    slot.progress += dt;
    if (slot.state === 'chopping' && slot.progress >= 2.5) slot.state = 'ready';
  }
  return expired;
}

/** Stars earned from final money (see config STAR_TARGETS). */
export function starsFor(money) {
  if (money >= 150) return 3;
  if (money >= 100) return 2;
  if (money >= 50) return 1;
  return 0;
}
