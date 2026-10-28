// Deterministic generative art used while a product has no photography.
export const PALETTES = [
  ['#151426', '#d97a9c', '#e88aab'],
  ['#09090D', '#e88aab', '#f5f5fa'],
  ['#1b1a33', '#8b5a6b', '#e9b9c9'],
  ['#14121a', '#5c5a86', '#e88aab'],
  ['#3a2230', '#d97a9c', '#f5f5fa'],
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
