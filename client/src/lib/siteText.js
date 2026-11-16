import { useApp } from '../context/App';
import { brand } from '../config/content';

// Built-in website wording. Anything filled in under Admin → Site text replaces the matching line.
export const TEXT_DEFAULTS = {
  storyTitle: 'Shop Story', story: brand.story,
  trendingEyebrow: 'TRENDING NOW', trendingTitle: 'TRENDING COLLECTIONS', trendingSub: 'Handpicked pieces everyone is loving right now.',
  bestEyebrow: 'BEST SELLERS', bestTitle: 'BEST SELLERS', bestSub: 'The pieces our customers keep coming back for.',
  bannerTitle: 'ETHNIC\nWEAR', bannerSub: 'EMBROIDERED SAREES, LEHENGAS & SUITS\nFOR EVERY OCCASION', bannerCta: 'SHOP NOW', bannerAlt: 'A model seated on a wooden chair in a black and gold striped silk saree',
  worldEyebrow: 'COLLECTIONS', worldTitle: 'CHOOSE YOUR WORLD.',
  instaTitle: 'INSIDE MAHANA BOUTIQUE & TAILORS', instaSub: 'Discover our boutique, explore our collections, and experience the beauty of traditional Indian wear.',
  contactEyebrow: 'GET IN TOUCH', contactTitle: 'ENQUIRE WITH\nMAHANA BOUTIQUE & TAILORS.', contactSub: 'Looking for something special, or a custom design? Tell us what you need and we will get back to you.',
  aboutTitle: 'AN INDIAN SOUL.\nA MODERN WARDROBE.', aboutLead: brand.positioning, aboutSub: brand.promise,
};

export function useSiteText() {
  const { site } = useApp();
  const c = site.content || {};
  const out = { ...TEXT_DEFAULTS };
  for (const k of Object.keys(TEXT_DEFAULTS)) {
    const v = c[k];
    if (Array.isArray(v) ? v.some(x => x && x.trim()) : v && String(v).trim()) out[k] = Array.isArray(v) ? v.filter(x => x && x.trim()) : v;
  }
  return out;
}
