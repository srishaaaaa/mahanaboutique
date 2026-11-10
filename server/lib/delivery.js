import { one } from '../db/index.js';
const getSetting = async (db, key, fallback) => (await one(db, 'SELECT value FROM pos_settings WHERE key = $1', [key]))?.value ?? fallback;

// Delivery charge = distance band (km from the shop to the customer's postal code) with a free-delivery threshold on the order value.
// The rules live in Admin → POS Settings → Delivery rules; nothing here is hard-coded except the first-run defaults.
export const DELIVERY_DEFAULTS = {
  enabled: true, storePostal: '', freeOver: 15000, maxKm: 0, perKmBeyond: 0,
  bands: [{ upToKm: 5, fee: 800 }, { upToKm: 10, fee: 1200 }, { upToKm: 20, fee: 1800 }],
  orderTiers: [], // [{ minOrder, fee }] : an order of at least minOrder pays at most fee (e.g. bigger baskets ship cheaper)
};
export const loadRules = async db => ({ ...DELIVERY_DEFAULTS, ...(await getSetting(db, 'delivery_rules', {})) });

const cache = new Map();
// Singapore postal code -> coordinates through OneMap (public, no key). Cached for the life of the process; null when it cannot be found.
export async function geocode(pin, fetcher = fetch) {
  if (!/^\d{6}$/.test(pin || '')) return null;
  if (cache.has(pin)) return cache.get(pin);
  try {
    const r = await fetcher(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${pin}&returnGeom=Y&getAddrDetails=N&pageNum=1`, { signal: AbortSignal.timeout(4000) });
    const d = await r.json(); const x = d.results?.[0];
    const v = x ? { lat: +x.LATITUDE, lng: +x.LONGITUDE } : null;
    if (v) cache.set(pin, v); return v;
  } catch { return null }
}
export const haversineKm = (a, b) => {
  const R = 6371, rad = d => d * Math.PI / 180, dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Pure rule maths (unit-tested): fee for a known distance (or null distance = unknown) and an order value, all money in cents.
export function feeFor(rules, km, subtotal) {
  if (!rules.enabled) return { amount: 0, free: true, km, reason: 'Delivery charges are switched off' };
  if (rules.freeOver != null && rules.freeOver > 0 && subtotal >= rules.freeOver) return { amount: 0, free: true, km, reason: 'Free delivery on this order' };
  const bands = [...rules.bands].sort((a, b) => a.upToKm - b.upToKm);
  let fee;
  if (km == null) fee = bands[0]?.fee ?? 0;
  else {
    const band = bands.find(b => km <= b.upToKm);
    if (band) fee = band.fee;
    else {
      const last = bands.at(-1);
      if (rules.maxKm > 0 && km > rules.maxKm) return { amount: null, km, reason: `We do not deliver beyond ${rules.maxKm} km` };
      fee = (last?.fee ?? 0) + Math.round((km - (last?.upToKm ?? 0)) * (rules.perKmBeyond || 0));
    }
  }
  const tier = [...(rules.orderTiers || [])].filter(t => subtotal >= t.minOrder).sort((a, b) => b.minOrder - a.minOrder)[0];
  if (tier) fee = Math.min(fee, tier.fee);
  return { amount: fee, free: fee === 0, km, reason: km == null ? 'Estimated: distance could not be worked out yet' : null };
}

export async function deliveryFor(db, subtotal, pin) {
  const rules = await loadRules(db);
  let km = null;
  if (pin && rules.storePostal) { const [a, b] = await Promise.all([geocode(rules.storePostal), geocode(pin)]); if (a && b) km = Math.round(haversineKm(a, b) * 10) / 10 }
  return { ...feeFor(rules, km, subtotal), freeOver: rules.freeOver || null };
}
