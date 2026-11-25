// Sizzle & Serve — configuration: canvas, timings, ingredients and recipes.
// Every value the rules use lives here, so tuning the game means editing one file.

export const CANVAS = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 45; // seconds before a ticket expires
export const FIRST_ORDER_DELAY = 4;
export const ORDER_SPAWN_EVERY = 14; // seconds; shrinks as the shift goes on
export const ORDER_SPAWN_MIN = 8;

// How long each prep step takes, in seconds.
export const GRILL_TIME = { beef: 6, chicken: 5 };
export const BURN_AFTER = 6; // seconds past cooked before the item burns
export const CHOP_TIME = 2.5;

// Money.
export const TIP_MAX = 8; // extra dollars for a fast serve
export const COMBO_WINDOW = 10; // seconds between good serves to keep the combo
export const COMBO_BONUS = 5; // dollars per combo level
export const WRONG_SERVE_PENALTY = 3;
export const STAR_TARGETS = { one: 50, two: 100, three: 150 };

// Ingredients. `prep` is null for ready-to-plate items, 'grill' or 'chop' otherwise.
// `key` is the keyboard shortcut (1-8) shown under each counter bin.
export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',     emoji: '🍞', prep: null,    key: '1', color: '#e8b25a' },
  beef:    { id: 'beef',    name: 'Beef',    emoji: '🥩', prep: 'grill', key: '2', color: '#b8452e' },
  chicken: { id: 'chicken', name: 'Chicken', emoji: '🍗', prep: 'grill', key: '3', color: '#e08a4c' },
  cheese:  { id: 'cheese',  name: 'Cheese',  emoji: '🧀', prep: null,    key: '4', color: '#f7c948' },
  lettuce: { id: 'lettuce', name: 'Lettuce', emoji: '🥬', prep: 'chop',  key: '5', color: '#5da244' },
  tomato:  { id: 'tomato',  name: 'Tomato',  emoji: '🍅', prep: 'chop',  key: '6', color: '#e0492f' },
  onion:   { id: 'onion',   name: 'Onion',   emoji: '🧅', prep: 'chop',  key: '7', color: '#d9b8e6' },
  sauce:   { id: 'sauce',   name: 'Sauce',   emoji: '🥫', prep: null,    key: '8', color: '#c0392b' },
};
export const INGREDIENT_ORDER = ['bun', 'beef', 'chicken', 'cheese', 'lettuce', 'tomato', 'onion', 'sauce'];

// Dishes: each order asks for one dish, i.e. a multiset of ingredients.
export const DISHES = {
  classic: {
    id: 'classic', name: 'Classic Burger', emoji: '🍔', price: 14,
    items: ['bun', 'beef', 'lettuce', 'tomato'],
  },
  cheese: {
    id: 'cheese', name: 'Cheese Burger', emoji: '🍔', price: 16,
    items: ['bun', 'beef', 'cheese', 'onion'],
  },
  chicken: {
    id: 'chicken', name: 'Chicken Sandwich', emoji: '🥪', price: 15,
    items: ['bun', 'chicken', 'lettuce', 'sauce'],
  },
  salad: {
    id: 'salad', name: 'Garden Salad', emoji: '🥗', price: 11,
    items: ['lettuce', 'tomato', 'onion', 'sauce'],
  },
  double: {
    id: 'double', name: 'Double Stack', emoji: '🍔', price: 21,
    items: ['bun', 'beef', 'beef', 'cheese', 'tomato'],
  },
};
export const DISH_ORDER = ['classic', 'cheese', 'chicken', 'salad', 'double'];

// Layout rectangles (canvas coordinates). render.js and input.js both read these.
export const LAYOUT = {
  board: { x: 24, y: 16, w: 560, h: 118 }, // order board, top-left
  timer: { x: 1020, y: 16, w: 236, h: 56 }, // shift timer, top-right
  money: { x: 1020, y: 80, w: 236, h: 54 }, // earnings + combo
  grill: { x: 24, y: 330, w: 300, h: 150 }, // grill station
  chop: { x: 348, y: 330, w: 300, h: 150 }, // chopping board station
  plate: { x: 672, y: 300, w: 300, h: 180 }, // assembly plate
  trash: { x: 996, y: 330, w: 120, h: 64 }, // trash bin
  serve: { x: 996, y: 410, w: 120, h: 70 }, // big SERVE button
  counter: { x: 24, y: 520, w: 1232, h: 180 }, // ingredient bins along the bottom
  toast: { x: 340, y: 150, w: 600, h: 44 }, // floating message line
};

// Deterministic random numbers (mulberry32) so ?shot= scenes are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
