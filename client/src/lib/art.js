// Deterministic generative art used while a product has no photography.
export const PALETTES = [ // fallback: Mahana navy + saree crimson + gold
  ['#131c3b', '#2d3e76', '#edc677'],
  ['#3d0c18', '#bf1722', '#f6d9a0'],
  ['#1c284f', '#bf1722', '#f8ecd5'],
  ['#0f1a45', '#3a4d8c', '#e8c27a'],
  ['#5a0a14', '#a50f20', '#edc677'],
];

// The colour named in the product (slug or name) decides the plate, so "Saffron" looks saffron and "Burgundy" looks burgundy.
// Each entry is [shadow, body, highlight].
const NAMED = [
  [/saffron|mustard|marigold|turmeric|yellow|orange|amber/, ['#8a3d0f', '#e08a1e', '#f6d38a']],
  [/burgundy|maroon|wine|oxblood|merlot|claret/, ['#3d0c18', '#7a1328', '#c0485a']],
  [/dusty-?rose|rose|blush|pink|peach|coral|salmon|mauve/, ['#6b2a3c', '#c4707f', '#f2c9c4']],
  [/red|crimson|scarlet|vermilion|ruby/, ['#5a0a14', '#bf1722', '#e9806f']],
  [/navy|midnight|indigo|royal|blue|sapphire/, ['#0f1a45', '#2d3e76', '#8da0d6']],
  [/emerald|green|teal|olive|sage|mint|bottle|turquoise|peacock/, ['#0f3b2e', '#1f7a58', '#a9d8b8']],
  [/purple|violet|lavender|plum|lilac|aubergine|magenta/, ['#2f1b4d', '#6b4aa3', '#c9b6e6']],
  [/ivory|cream|white|champagne|beige|nude|pearl|off-?white/, ['#8c7a5b', '#d9c39a', '#f6ecd9']],
  [/gold|golden|bronze|copper|tan|brown|camel/, ['#5b3a12', '#c99a45', '#f3dca0']],
  [/black|charcoal|ebony|onyx/, ['#0d0d12', '#2c2c3a', '#8a8aa0']],
  [/grey|gray|silver|steel|ash/, ['#3a3d4a', '#8a90a3', '#d9dce6']],
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

export const palette = seed => {
  const s = String(seed).toLowerCase();
  for (const [re, p] of NAMED) if (new RegExp(`(^|[^a-z])(${re.source})([^a-z]|$)`).test(s)) return p;
  return PALETTES[hash(s) % PALETTES.length];
};
