// Deterministic generative art used while a product has no photography.
export const PALETTES = [ // Mahana indigo + pink
  ['#1c284f', '#e33944', '#f8ecd5'],
  ['#131c3b', '#7d74d8', '#edc677'],
  ['#2d3e76', '#bf1722', '#edc677'],
  ['#192343', '#596eb1', '#e33944'],
  ['#253466', '#e33944', '#fbe4e1'],
];

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0;
}

export function rng(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const palette = seed => PALETTES[hash(String(seed)) % PALETTES.length];
