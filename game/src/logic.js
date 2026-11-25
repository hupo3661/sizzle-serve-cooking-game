// Sizzle & Serve — the cooking rules: taking ingredients, prepping them,
// assembling the plate and serving orders. Pure functions over the state.

import {
  BURN_AFTER, CHOP_TIME, COMBO_BONUS, COMBO_WINDOW, GRILL_TIME, INGREDIENTS,
  ORDER_SPAWN_EVERY, ORDER_SPAWN_MIN, TIP_MAX, WRONG_SERVE_PENALTY, MAX_ORDERS,
} from './config.js';
import { spawnOrder, tickTimers } from './state.js';

/** Count how many of each ingredient a list holds. */
export function countItems(items) {
  const counts = {};
  for (const item of items) counts[item] = (counts[item] || 0) + 1;
  return counts;
}

/** True when the plate holds exactly the dish's items (order does not matter). */
export function plateMatches(plate, dishItems) {
  if (plate.length !== dishItems.length) return false;
  const a = countItems(plate);
  const b = countItems(dishItems);
  return Object.keys(b).every((k) => a[k] === b[k]);
}

/** The open order the plate currently completes, or null. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(state.plate, order.items)) return order;
  }
  return null;
}

function say(state, text) {
  state.toast = text;
  state.toastUntil = state.elapsed + 2.2;
}

/** Click (or press the key for) a counter bin: start that ingredient's journey. */
export function takeIngredient(state, ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  if (!ing || state.screen !== 'play') return false;
  if (ing.prep === null) {
    if (state.plate.length >= 6) { say(state, 'Plate is full — serve or trash it first!'); return false; }
    state.plate.push(ingredientId);
    state.flashServe = !!matchingOrder(state);
    return true;
  }
  if (ing.prep === 'grill') {
    const slot = state.grill.findIndex((s) => s === null);
    if (slot === -1) { say(state, 'Grill is full! Wait for a patty.'); return false; }
    state.grill[slot] = { item: ingredientId, progress: 0, state: 'cooking' };
    return true;
  }
  const slot = state.chop.findIndex((s) => s === null);
  if (slot === -1) { say(state, 'Chopping board is full!'); return false; }
  state.chop[slot] = { item: ingredientId, progress: 0, state: 'chopping' };
  return true;
}

/** Click a grill slot: collect it when cooked, toss it when burnt. */
export function collectGrill(state, slotIndex) {
  const slot = state.grill[slotIndex];
  if (!slot || state.screen !== 'play') return false;
  if (slot.state === 'cooking') {
    say(state, `${INGREDIENTS[slot.item].name} is still cooking…`);
    return false;
  }
  if (slot.state === 'burnt') {
    state.grill[slotIndex] = null;
    state.stats.wasted += 1;
    say(state, 'Burnt! Tossed in the bin. Watch the grill!');
    return true;
  }
  if (state.plate.length >= 6) { say(state, 'Plate is full — serve or trash it first!'); return false; }
  state.plate.push(slot.item);
  state.grill[slotIndex] = null;
  state.flashServe = !!matchingOrder(state);
  return true;
}

/** Click a chop slot: collect it once chopped. */
export function collectChop(state, slotIndex) {
  const slot = state.chop[slotIndex];
  if (!slot || state.screen !== 'play') return false;
  if (slot.state === 'chopping') {
    say(state, `${INGREDIENTS[slot.item].name} is still being chopped…`);
    return false;
  }
  if (state.plate.length >= 6) { say(state, 'Plate is full — serve or trash it first!'); return false; }
  state.plate.push(slot.item);
  state.chop[slotIndex] = null;
  state.flashServe = !!matchingOrder(state);
  return true;
}

/** Throw the whole plate away (e.g. after a wrong ingredient). */
export function trashPlate(state) {
  if (state.plate.length === 0) return false;
  state.stats.wasted += state.plate.length;
  state.plate = [];
  state.flashServe = false;
  say(state, 'Plate cleared.');
  return true;
}

/** Serve the plate to an order. Returns the dollars earned, or 0 on failure. */
export function serveOrder(state, orderId) {
  if (state.screen !== 'play') return 0;
  const order = state.orders.find((o) => o.id === orderId)
    || (orderId === undefined ? matchingOrder(state) : null);
  if (!order) {
    state.money = Math.max(0, state.money - WRONG_SERVE_PENALTY);
    state.shakeUntil = state.elapsed + 0.4;
    say(state, `That plate matches no order! −$${WRONG_SERVE_PENALTY}`);
    return 0;
  }
  if (!plateMatches(state.plate, order.items)) {
    state.money = Math.max(0, state.money - WRONG_SERVE_PENALTY);
    state.shakeUntil = state.elapsed + 0.4;
    say(state, `Wrong dish for ${order.name}! −$${WRONG_SERVE_PENALTY}`);
    return 0;
  }
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(TIP_MAX * patienceShare);
  const comboNow = state.comboTimer > 0 ? state.combo + 1 : 1;
  const comboBonus = (comboNow - 1) * COMBO_BONUS;
  const earned = order.price + tip + comboBonus;
  state.money += earned;
  state.stats.earned += order.price;
  state.stats.tips += tip + comboBonus;
  state.served += 1;
  state.combo = comboNow;
  state.comboTimer = COMBO_WINDOW;
  state.bestCombo = Math.max(state.bestCombo, comboNow);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  state.flashServe = false;
  say(state, `Served ${order.name}! +$${earned}${comboBonus > 0 ? ` (combo x${comboNow})` : ''}`);
  return earned;
}

/** One frame of the shift: timers, order spawning, end of shift. */
export function update(state, dt) {
  if (state.screen !== 'play') return;
  const expired = tickTimers(state, dt);
  for (const id of expired) say(state, 'An order walked out! Too slow.');
  state.spawnIn -= dt;
  const interval = Math.max(ORDER_SPAWN_MIN, ORDER_SPAWN_EVERY - Math.floor(state.elapsed / 60) * 3);
  if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.spawnIn = interval;
  }
  if (state.timeLeft <= 0) {
    state.screen = 'over';
    state.timeLeft = 0;
  }
}

// Re-exported for render's progress bars.
export { BURN_AFTER, CHOP_TIME, GRILL_TIME };
