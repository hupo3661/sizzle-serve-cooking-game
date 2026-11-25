// Sizzle & Serve — entry point: wire the canvas, input and the game loop together.
// ?shot=start|play|serve|end&seed=N renders one frozen scene for screenshots;
// otherwise the game runs live with requestAnimationFrame.

import { CANVAS } from './config.js';
import { createState, SCREEN_PLAY } from './state.js';
import { update } from './logic.js';
import { render } from './render.js';
import { canvasPoint, handleClick, handleKey } from './input.js';
import { shotFromUrl, shotState } from './shots.js';
import { chopSound, ding, errorSound, sizzle, tickSound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const { shot, seed } = shotFromUrl();
let state;
let frozen = false;
if (shot) {
  state = shotState(shot, seed);
  frozen = true;
} else {
  state = createState((Date.now() % 100000) + 7);
}

let lastMoney = state.money;
let lastServed = state.served;

function frame(now) {
  if (!frozen) {
    const dt = Math.min(0.1, (now - (frame.last || now)) / 1000);
    frame.last = now;
    if (state.screen === SCREEN_PLAY) {
      update(state, dt);
      // Little sounds for things that changed.
      if (state.money > lastMoney) ding();
      if (state.served > lastServed) sizzle();
      lastMoney = state.money;
      lastServed = state.served;
      if (state.timeLeft <= 10 && Math.floor(now / 1000) !== Math.floor((now - dt * 1000) / 1000)) tickSound();
    }
  }
  render(ctx, state);
  if (!frozen) requestAnimationFrame(frame);
}

canvas.addEventListener('click', (event) => {
  const p = canvasPoint(canvas, event);
  const before = state.plate.length;
  if (handleClick(state, p.x, p.y)) {
    if (state.plate.length > before) {
      const added = state.plate[state.plate.length - 1];
      if (added === 'beef' || added === 'chicken') sizzle();
      else if (added === 'lettuce' || added === 'tomato' || added === 'onion') chopSound();
    }
    if (!frozen) render(ctx, state);
  }
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  if (handleKey(state, event.key)) {
    if (state.screen === SCREEN_PLAY && state.money < lastMoney) errorSound();
    if (!frozen) render(ctx, state);
  }
});

// Expose the live state for play-testing and debugging (window.__game).
window.__game = { get state() { return state; } };

render(ctx, state);
if (!frozen) requestAnimationFrame(frame);
