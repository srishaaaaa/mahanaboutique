// Deterministic generative art used while a product has no photography.
export const PALETTES = [ // Mahana indigo + pink
  ['#1c1a52', '#e88aab', '#f8d9e4'],
  ['#14123d', '#7d74d8', '#f0aec4'],
  ['#2e2b7b', '#d97a9c', '#f3bfd1'],
  ['#1a1846', '#5c58b8', '#e88aab'],
  ['#26236a', '#e88aab', '#fbe3ec'],
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
