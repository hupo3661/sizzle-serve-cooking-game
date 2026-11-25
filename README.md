# sizzle-serve-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hupo3661/sizzle-serve-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hupo3661/sizzle-serve-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** — a fast-paced cooking game for make.fun's "Make the best cooking game" bounty ($250 in USDC). You run a lunch-rush kitchen for one 180-second shift: orders land on the board with a patience timer, you grill the meat, chop the veg, stack each dish on the assembly plate and serve it before the customer walks out. Fast serves earn tips, back-to-back serves build a combo, burnt food goes in the bin.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests, no dependencies — plain static files under `game/`.

## How to play

- **Click** an ingredient bin on the counter (or press **1–8**). Bun, cheese and sauce go straight on the plate; beef and chicken go to the **grill**; lettuce, tomato and onion go to the **chopping board**.
- **Click** a grill slot or chop slot when its item is ready to move it to the plate. Leave meat on the grill too long and it burns.
- **Click** the big **SERVE** button (or the order ticket, or press **Enter**) when the plate matches an order. A wrong dish costs $3.
- **T** (or the trash bin) clears the plate. **R** restarts after the shift ends.

Five dishes to learn: Classic Burger, Cheese Burger, Chicken Sandwich, Garden Salad, Double Stack. Earn $50 for one star, $100 for two, $150 for three.

## Layout

- `game/index.html` + `game/src/` — the playable game (canvas, ES modules)
  - `config.js` — timings, ingredients, recipes, layout
  - `state.js` — shift state and order spawning
  - `logic.js` — grill / chop / assemble / serve rules and scoring
  - `render.js` — all canvas drawing
  - `input.js` — mouse + keyboard handling
  - `audio.js` — synthesized WebAudio sound effects
  - `shots.js` — deterministic screenshot scenes (`?shot=start|play|serve|end`)
  - `main.js` — game loop and wiring
- `main.ts` — hands `game/` and `screenshots/` in as the entry (Node 22)
- `screenshots/` — 4 screenshots of the game, taken from its own code in a browser
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=7zv3mt0w&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
