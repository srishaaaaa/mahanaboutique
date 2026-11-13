import { one } from '../db/index.js';
const getSetting = async (db, key, fallback) => (await one(db, 'SELECT value FROM pos_settings WHERE key = $1', [key]))?.value ?? fallback;

// Delivery charge by WEIGHT (the model used in Shalistone): the owner defines delivery regions, and each region has weight tiers
// (from grams, up to grams or open-ended, charge). The bag's total weight (each size's weight x quantity) picks the tier.
// Everything is configured in Admin -> POS Settings -> "Delivery charge"; only first-run defaults live here. Money is in cents.
export const DEFAULT_WEIGHT_GRAMS = 500; // a product or size with no weight counts as this (Shalistone does the same)
export const DELIVERY_DEFAULTS = {
  enabled: true,
  note: 'Delivered within 3 to 5 working days across Singapore. You will get a message when your order ships.',
  landingText: 'Fast delivery across Singapore: get your order within 3 to 5 days.',
  productLines: ['Standard delivery: 3 to 5 working days', 'Delivery is charged by the weight of your bag', 'Free delivery on large orders'],
  freeOver: 15000, // order value at or above this ships free (0 = never)
  defaultWeightGrams: DEFAULT_WEIGHT_GRAMS,
  regions: [{ id: 'singapore', name: 'Singapore', active: true, tiers: [
    { minGrams: 0, maxGrams: 1000, fee: 500 }, { minGrams: 1000, maxGrams: 3000, fee: 800 }, { minGrams: 3000, maxGrams: 5000, fee: 1200 }, { minGrams: 5000, maxGrams: null, fee: 1800 }] }],
};
export async function loadRules(db) {
  const saved = (await getSetting(db, 'delivery_rules', {})) || {};
  const rules = { ...DELIVERY_DEFAULTS, ...saved };
  if (!Array.isArray(saved.regions) || !saved.regions.length) rules.regions = DELIVERY_DEFAULTS.regions; // rules saved before weight pricing existed
  return rules;
}

// Shalistone's tier rule: tiers sorted by start weight; the first tier whose range holds the weight wins (max is exclusive, no max = open ended);
// if none matches, the last tier's charge applies. A region with no tiers charges nothing.
export function tierFee(region, grams) {
  const tiers = [...(region?.tiers || [])].sort((a, b) => a.minGrams - b.minGrams);
  if (!tiers.length) return 0;
  for (const t of tiers) if (grams >= t.minGrams && (t.maxGrams == null || grams < t.maxGrams)) return t.fee;
  return tiers.at(-1).fee;
}

// Total weight of a bag: sum of (size weight, else product weight, else the default) x quantity.
export const bagWeight = (lines, rules = DELIVERY_DEFAULTS) => lines.reduce((s, l) => s + (Number(l.weight ?? rules.defaultWeightGrams ?? DEFAULT_WEIGHT_GRAMS) || 0) * l.qty, 0);

export const activeRegions = rules => (rules.regions || []).filter(r => r.active !== false);

// Pure rule maths (unit-tested): the delivery charge for a region, a total weight and an order value.
export function feeFor(rules, regionId, grams, subtotal) {
  const regions = activeRegions(rules), region = regions.find(r => r.id === regionId) ?? regions[0] ?? null;
  const base = { grams, regionId: region?.id ?? null, regionName: region?.name ?? null };
  if (!rules.enabled) return { ...base, amount: 0, free: true, reason: 'Delivery charges are switched off' };
  if (rules.freeOver > 0 && subtotal >= rules.freeOver) return { ...base, amount: 0, free: true, reason: 'Free delivery on this order' };
  if (!region) return { ...base, amount: 0, free: true, reason: 'No delivery region is set up yet' };
  const amount = tierFee(region, grams);
  return { ...base, amount, free: amount === 0, reason: null };
}

export async function deliveryFor(db, subtotal, { regionId, grams } = {}) {
  const rules = await loadRules(db);
  return { ...feeFor(rules, regionId, grams ?? 0, subtotal), freeOver: rules.freeOver || null, policy: rules.note || '', regions: activeRegions(rules).map(r => ({ id: r.id, name: r.name })), rules };
}
