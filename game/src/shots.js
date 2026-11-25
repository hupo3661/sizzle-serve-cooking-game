// Sizzle & Serve — deterministic screenshot scenes behind ?shot=start|play|serve|end.
// Each scene builds the real game state (orders, grill, plate, timer) and lets the
// normal renderer draw it, so a screenshot is exactly what a player would see.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createState, spawnOrder } from './state.js';

/** A mid-shift state: two tickets up, money banked, combo running. */
function midShift(seed, elapsed, money, served) {
  const state = createState(seed);
  state.screen = SCREEN_PLAY;
  state.elapsed = elapsed;
  state.timeLeft = 180 - elapsed;
  state.money = money;
  state.served = served;
  state.combo = 2;
  state.comboTimer = 6;
  spawnOrder(state);
  spawnOrder(state);
  return state;
}

/** The four scenes, by name. Unknown names fall back to the title. */
export function shotState(name, seed) {
  const s = seed || 1;
  if (name === 'play') {
    const state = midShift(s, 45, 42, 3);
    // One dish mid-assembly on the plate, a patty on the grill, veg on the board.
    state.plate = ['bun', 'beef', 'lettuce'];
    state.grill = [
      { item: 'beef', progress: 3, state: 'cooking' },
      { item: 'chicken', progress: 0, state: 'cooked' },
    ];
    state.chop = [
      { item: 'tomato', progress: 0, state: 'ready' },
      { item: 'onion', progress: 1.2, state: 'chopping' },
    ];
    state.toast = 'Build the Classic Burger — one tomato to go!';
    state.toastUntil = 999;
    return state;
  }
  if (name === 'serve') {
    const state = midShift(s, 84, 71, 5);
    // Plate finished and matching the first ticket: ready to serve.
    const first = state.orders[0];
    state.plate = [...first.items];
    state.flashServe = true;
    state.grill = [{ item: 'beef', progress: 0, state: 'cooked' }, null];
    state.chop = [null, null];
    state.toast = `✓ ${first.name} is ready — hit SERVE!`;
    state.toastUntil = 999;
    return state;
  }
  if (name === 'end') {
    const state = createState(s);
    state.screen = SCREEN_OVER;
    state.elapsed = 180;
    state.timeLeft = 0;
    state.money = 163;
    state.served = 11;
    state.failed = 1;
    state.combo = 3;
    state.comboTimer = 6;
    state.bestCombo = 3;
    state.stats = { earned: 138, tips: 25, wasted: 2 };
    spawnOrder(state);
    return state;
  }
  // 'start' and anything else: the title screen over a live-looking kitchen.
  const state = midShift(s, 0, 0, 0);
  state.screen = SCREEN_TITLE;
  state.timeLeft = 180;
  state.combo = 0;
  state.comboTimer = 0;
  return state;
}

/** Read ?shot= and ?seed= from the page URL. */
export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return { shot: params.get('shot') || '', seed: Number(params.get('seed') || '1') || 1 };
}
