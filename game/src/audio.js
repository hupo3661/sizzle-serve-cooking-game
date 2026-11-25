// Sizzle & Serve — tiny WebAudio sound effects, all synthesized, no files.
// Every sound is guarded: no AudioContext exists until the first user gesture,
// and a failure to make one never breaks the game.

let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function blip(freq, dur, type, gainValue, when) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue || 0.08, ac.currentTime + (when || 0));
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (when || 0) + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + (when || 0));
    osc.stop(ac.currentTime + (when || 0) + dur + 0.02);
  } catch {
    // Sound is garnish; the game plays on without it.
  }
}

/** A short sizzle burst for the grill (filtered noise is overkill; a low buzz works). */
export function sizzle() {
  blip(180, 0.25, 'sawtooth', 0.03);
  blip(240, 0.2, 'sawtooth', 0.02, 0.05);
}

export function chopSound() {
  blip(900, 0.06, 'square', 0.05);
  blip(700, 0.06, 'square', 0.05, 0.09);
}

export function ding() {
  blip(880, 0.18, 'sine', 0.09);
  blip(1318, 0.3, 'sine', 0.07, 0.12);
}

export function errorSound() {
  blip(160, 0.25, 'square', 0.06);
}

export function tickSound() {
  blip(1200, 0.04, 'sine', 0.03);
}
