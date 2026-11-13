# Prompt: delivery charges by product WEIGHT in Dhanya — stored, calculated and shown exactly as in Mahana

You are an AI coding agent working in the **Dhanya** codebase (React + Vite client in `client/`, Express + PGlite/Postgres server in `server/`, migrations in `server/db/migrations/`, tests in `server/test/`, run with `node --test --test-concurrency=1 test/*.test.js`). Implement the **online-store delivery charge, priced by weight**, below. Every piece of source code is included verbatim at the end: copy it and adapt only names/imports. The model comes from the Shalistone store (delivery regions with weight tiers); Mahana implements it on its own stack. Keep Dhanya's existing behaviour for everything not listed. Money is **integer minor units** (cents).

## 1. What it does
The delivery charge depends on **how heavy the bag is**, not on a flat fee or a distance:
1. Every **product has a weight in grams**; a **size (variant) may override** it.
2. The bag's **total weight** = sum over lines of (size weight, else product weight, else the default 500 g) × quantity.
3. The owner defines **delivery regions** (e.g. Singapore, Islands). Each region has **weight tiers**: *from grams*, *up to grams* (blank = no limit), *charge*.
4. The customer picks a region at checkout (only shown when there is more than one active region); the tier whose range holds the bag's weight sets the charge.
5. **Free delivery** when the order value reaches the owner's threshold (0 = never); a master switch can turn delivery charges off.
6. The owner also writes the delivery copy customers read: a **shipping note** (bag and checkout), a **landing-page line** and **product-page lines**.
All of it is edited in the admin (POS Settings → "Delivery charge (by weight)"); nothing is hard-coded except first-run defaults.

## 2. Where it is kept
- **Weights**: `products.weight_grams INT NOT NULL DEFAULT 500`, `product_variants.weight_grams INT NULL` (null = use the product's). Migration `034_product_weights.sql` also gives existing products starting weights by category (Sarees 700, Lehengas 1500, Salwar Suits 600, Kurtas 350, Dresses 450, Co-ords 500, Couple Combos 900, Festive 800, Blouses 150, Dupattas 250; uncategorised 500) so every product has a sensible weight on day one.
- **Rules**: one JSON document in the settings table under `delivery_rules` (Mahana: `pos_settings`). Shape (money in cents):
```json
{ "enabled": true, "note": "Delivered within 3 to 5 working days.", "landingText": "Fast delivery across Singapore.", "productLines": ["Standard delivery: 3 to 5 working days"],
  "freeOver": 15000, "defaultWeightGrams": 500,
  "regions": [ { "id": "singapore", "name": "Singapore", "active": true,
    "tiers": [ { "minGrams": 0, "maxGrams": 1000, "fee": 500 }, { "minGrams": 1000, "maxGrams": 3000, "fee": 800 }, { "minGrams": 3000, "maxGrams": 5000, "fee": 1200 }, { "minGrams": 5000, "maxGrams": null, "fee": 1800 } ] } ] }
```
First-run defaults are in `DELIVERY_DEFAULTS`. Rules saved before weight pricing existed (no `regions`) fall back to the default region. The old `shipping_methods` table only supplies `orders.shipping_method_id`; its amounts are no longer used. Each order stores the charge actually applied in `orders.shipping_amount` and the chosen `regionId` in its address snapshot, so changing the rules never alters old orders.

## 3. The calculation (exact)
- **Tier rule (Shalistone's `computeDeliveryFee`)**: sort tiers by `minGrams`; the first tier with `grams >= minGrams` **and** (`maxGrams` is null **or** `grams < maxGrams`) wins (max is exclusive); if none matches, the **last tier's** fee applies; a region with no tiers charges 0.
- **Whole fee** (`feeFor`): delivery switched off → 0; `freeOver > 0` and order value ≥ `freeOver` → 0 ("Free delivery on this order", checked first); region = the one chosen if it is active, else the **first active** region; no active region → 0; otherwise the tier fee.
- Worked example with the defaults: a 700 g saree → S$5; two sarees (1400 g) → S$8; a lehenga + saree (2200 g) → S$8; 4 kg → S$12; 6 kg → S$18; any bag of S$150 or more → free.

## 4. Server wiring
- `lib/delivery.js` (below): `loadRules`, `tierFee`, `bagWeight`, `feeFor`, `deliveryFor`.
- `cartLines` returns each line's `weight` = `COALESCE(variant.weight_grams, product.weight_grams)` (guarded so the code still runs before migration 034).
- `shippingFor(db, subtotal, lines, regionId)` prices the bag; `cartView(db, cart, regionId)` returns `shipping: { amount, grams, region, regions, note, policy, freeOver }`; `GET /cart?region=<id>` prices for that region.
- `createPendingOrder` re-prices from the server cart with `address.regionId` (the browser never sends a price). The checkout address schema accepts an optional `regionId`.
- `GET /api/delivery-info` (public, cached 60 s): `{ landingText, productLines, note, freeOver, regions }`.
- Admin (owner/admin only): `GET/PUT /api/admin/pos/delivery-rules` (zod-validated: ≤ 20 regions, ≤ 12 tiers each, a tier's "up to" must exceed its "from", region ids unique, audit-logged). Product create accepts `weight_grams` and `variants[].weight`; product PATCH accepts `weightGrams`; size PATCH accepts `weight` (null = use the product's). The admin product list returns `weightGrams` and each size's `weight` / `weightOverride`; the public product detail returns `weightGrams`.
- Tests: `test/delivery.test.js` (below).

## 5. Client wiring
- **Admin → POS Settings → "Delivery charge (by weight)"** (`DeliveryRulesCard`, below): "Charge for delivery" switch; *Free delivery when the order is at least*; *Weight counted for a product with none*; a box per **region** (name, Active, Remove region) with tier rows `From [g] g, up to [g] g (blank = no limit) → S$ [charge]` and "+ Add tier"; "+ Add region"; then *Shipping note*, *Landing page delivery line*, *Product page delivery lines (one per line)*.
- **Admin → Inventory**: Add and Edit Product have **WEIGHT (GRAMS)** next to the prices (default 500); the Edit variants table has a **Weight g** column per size (blank = the product's weight).
- **Checkout**: a "Delivery region" select (shown only with 2+ active regions); `loadCart(regionId)` re-prices the bag; the chosen region is sent as `address.regionId`.
- **Bag totals**: row `Delivery (1.4 kg · Region)` showing `Free` or the charge, the distance-free note and the shipping note underneath, and "Delivery is charged by the weight of your bag. Free over S$150."
- **Product page**: the "Delivery & Returns" list shows the owner's product lines (from `/delivery-info`) and "Weight of this piece: 700 g". **Landing page**: the delivery highlight uses the owner's landing line.

## 6. Acceptance checklist
1. Changing a product's weight (or one size's) changes the delivery row for bags containing it.
2. Two regions with different tiers: switching the region at checkout re-prices instantly; an inactive region is not offered.
3. Tier boundaries behave exactly as in section 3 (max exclusive, open-ended last tier).
4. Free-delivery threshold and the master switch work; the owner's lines/notes appear in the bag, product page and landing page.
5. Old orders keep their stored `shipping_amount`.
6. `node --test --test-concurrency=1 test/*.test.js` passes including `delivery.test.js`.

---

# Source code (verbatim from Mahana: copy, then adapt names/imports)

### server/db/migrations/034_product_weights.sql  (new)
```sql
-- Delivery is priced by weight (as in Shalistone): every product has a weight in grams, a size may override it, and the bag's total weight picks the delivery tier.
ALTER TABLE products ADD COLUMN weight_grams INT NOT NULL DEFAULT 500 CHECK (weight_grams >= 0);
ALTER TABLE product_variants ADD COLUMN weight_grams INT CHECK (weight_grams IS NULL OR weight_grams >= 0);

-- Sensible starting weights by category (grams); the owner can edit any product afterwards. Anything uncategorised keeps 500 g.
UPDATE products p SET weight_grams = w.g
FROM categories c, (VALUES ('sarees', 700), ('lehengas', 1500), ('salwar suits', 600), ('kurtas', 350), ('dresses', 450), ('co-ords', 500),
                          ('couple combos', 900), ('festive', 800), ('blouses', 150), ('dupattas', 250)) AS w(name, g)
WHERE c.id = p.category_id AND lower(c.name) = w.name;
```

### server/lib/delivery.js  (replace the file)
```js
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
```

### server/test/delivery.test.js  (replace)
```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.js';
import { createDb, migrate } from '../db/index.js';
import { seed } from '../db/seed.js';
import { createApp } from '../app.js';
import { tierFee, feeFor, bagWeight, DELIVERY_DEFAULTS as D } from '../lib/delivery.js';

const cfg = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'test-secret-test-secret-123456', PGLITE_DIR: 'memory', ADMIN_EMAIL: 'owner@test.dev', ADMIN_PASSWORD: 'OwnerPass123!' });
let db, server, base;
function client() {
  const jar = new Map();
  return async (method, path, body) => {
    const r = await fetch(base + path, { method, body: body && JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'dhanya', Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); v ? jar.set(k, v) : jar.delete(k) }
    return { status: r.status, body: await r.json().catch(() => null) };
  };
}
before(async () => { db = await createDb(cfg); await migrate(db, () => {}); await seed(db, cfg, () => {}); server = createApp({ db, cfg, payments: {} }).listen(0); base = `http://localhost:${server.address().port}/api` });
after(async () => { server.close(); await db.close() });

const region = { id: 'r', name: 'R', active: true, tiers: [{ minGrams: 0, maxGrams: 500, fee: 300 }, { minGrams: 500, maxGrams: 2000, fee: 600 }, { minGrams: 2000, maxGrams: null, fee: 1000 }] };

test('weight tiers: max is exclusive, no max is open-ended, a gap falls back to the last tier, no tiers means no charge', () => {
  assert.equal(tierFee(region, 0), 300); assert.equal(tierFee(region, 499), 300);
  assert.equal(tierFee(region, 500), 600, 'a tier starts at its minimum'); assert.equal(tierFee(region, 1999), 600);
  assert.equal(tierFee(region, 2000), 1000); assert.equal(tierFee(region, 90000), 1000);
  assert.equal(tierFee({ tiers: [{ minGrams: 0, maxGrams: 100, fee: 200 }, { minGrams: 300, maxGrams: 400, fee: 900 }] }, 200), 900, 'in a gap the last tier applies');
  assert.equal(tierFee({ tiers: [] }, 800), 0); assert.equal(tierFee(null, 800), 0);
  assert.equal(tierFee({ tiers: [{ minGrams: 500, maxGrams: null, fee: 700 }, { minGrams: 0, maxGrams: 500, fee: 100 }] }, 100), 100, 'tiers are sorted by their start weight');
});

test('delivery fee: switched off, free over the order value, region choice, inactive regions skipped', () => {
  const rules = { ...D, freeOver: 10000, regions: [region, { ...region, id: 'q', name: 'Q', tiers: [{ minGrams: 0, maxGrams: null, fee: 2500 }] }, { ...region, id: 'off', name: 'Off', active: false }] };
  assert.equal(feeFor(rules, 'r', 800, 5000).amount, 600);
  assert.equal(feeFor(rules, 'q', 800, 5000).amount, 2500, 'the chosen region');
  assert.equal(feeFor(rules, 'nope', 800, 5000).regionId, 'r', 'an unknown region falls back to the first active one');
  assert.equal(feeFor(rules, 'off', 800, 5000).regionId, 'r', 'an inactive region cannot be chosen');
  assert.equal(feeFor(rules, 'r', 800, 10000).amount, 0, 'free at the threshold'); assert.equal(feeFor(rules, 'r', 800, 10000).free, true);
  assert.equal(feeFor({ ...rules, freeOver: 0 }, 'r', 800, 99999999).amount, 600, '0 means never free');
  assert.equal(feeFor({ ...rules, enabled: false }, 'r', 800, 100).amount, 0);
  assert.equal(feeFor({ ...rules, regions: [] }, 'r', 800, 100).amount, 0);
});

test('bag weight: size weight, else product weight, else the default; times quantity', () => {
  assert.equal(bagWeight([{ weight: 300, qty: 2 }, { weight: null, qty: 1 }, { weight: 800, qty: 1 }], { defaultWeightGrams: 500 }), 300 * 2 + 500 + 800);
  assert.equal(bagWeight([]), 0);
});

test('the bag is priced by its weight, per region, and the owner edits regions and tiers in the admin', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  // a product of 800 g whose S size is lighter (300 g); the M size uses the product weight
  assert.equal((await o('POST', '/admin/products', { slug: 'wt-prod', name: 'wt-prod', price: 3000, weight_grams: 800, gst_rate: 9, status: 'active', variants: [{ sku: 'WT-S', size: 'S', color: 'Red', stock: 9, weight: 300 }, { sku: 'WT-M', size: 'M', color: 'Red', stock: 9 }] })).status, 201);
  const list = (await o('GET', '/admin/pos/products?q=wt-prod')).body[0];
  assert.equal(list.weightGrams, 800); assert.equal(list.variants.find(v => v.size === 'S').weight, 300); assert.equal(list.variants.find(v => v.size === 'M').weight, 800);
  const S = list.variants.find(v => v.size === 'S').id, M = list.variants.find(v => v.size === 'M').id;
  const shop = client();
  assert.equal((await shop('POST', '/cart/items', { variantId: S, quantity: 2 })).status, 200); assert.equal((await shop('POST', '/cart/items', { variantId: M, quantity: 1 })).status, 200);
  const cart = (await shop('GET', '/cart')).body;
  assert.equal(cart.shipping.grams, 300 * 2 + 800, 'weights add up'); assert.equal(cart.shipping.amount, 800, 'defaults: 1000 g to under 3000 g');
  assert.equal(cart.total, cart.subtotal + 800);
  // owner defines two regions and new tiers
  const rules = { enabled: true, note: 'Ships in 2 days', landingText: 'Fast', productLines: ['Line one'], freeOver: 0, defaultWeightGrams: 500, regions: [
    { id: 'central', name: 'Central', active: true, tiers: [{ minGrams: 0, maxGrams: 1000, fee: 400 }, { minGrams: 1000, maxGrams: null, fee: 900 }] },
    { id: 'islands', name: 'Islands', active: true, tiers: [{ minGrams: 0, maxGrams: null, fee: 3000 }] }] };
  assert.equal((await o('PUT', '/admin/pos/delivery-rules', rules)).status, 200);
  const c1 = (await shop('GET', '/cart')).body.shipping; assert.equal(c1.region.id, 'central'); assert.equal(c1.amount, 900); assert.equal(c1.regions.length, 2); assert.equal(c1.policy, 'Ships in 2 days');
  assert.equal((await shop('GET', '/cart?region=islands')).body.shipping.amount, 3000);
  // a bad tier is refused
  const bad = await o('PUT', '/admin/pos/delivery-rules', { ...rules, regions: [{ ...rules.regions[0], tiers: [{ minGrams: 500, maxGrams: 200, fee: 100 }] }] }); assert.equal(bad.status, 400);
  // the public copy
  const info = (await fetch(base + '/delivery-info').then(r => r.json())); assert.deepEqual(info.productLines, ['Line one']); assert.equal(info.landingText, 'Fast'); assert.deepEqual(info.regions.map(r => r.id), ['central', 'islands']);
  // weights can be edited on a product and on a size
  assert.equal((await o('PATCH', `/admin/pos/products/${list.id}`, { name: 'wt-prod', price: 3000, taxRate: 9, status: 'active', weightGrams: 1200 })).status, 200);
  assert.equal((await o('PATCH', `/admin/pos/products/${list.id}/variants/${S}`, { weight: null })).status, 200);
  const after2 = (await o('GET', '/admin/pos/products?q=wt-prod')).body[0]; assert.equal(after2.weightGrams, 1200); assert.equal(after2.variants.find(v => v.size === 'S').weight, 1200);
  // only an admin can change the rules
  assert.ok([401, 403].includes((await shop('PUT', '/admin/pos/delivery-rules', rules)).status));
});
```

### server/lib/cart.js  (cartLines, shippingFor, cartView; imports: deliveryFor/bagWeight/loadRules from ./delivery.js, hasWeightColumns from ./cost.js)
```js
export async function cartLines(q, cartId) {
  const weight = (await hasWeightColumns(q)) ? 'COALESCE(v.weight_grams, p.weight_grams)' : 'NULL';
  return rows(q, `
    SELECT v.id AS "variantId", p.id AS "productId", p.slug, p.name, v.sku, v.size, v.color, ci.quantity AS qty, ${weight} AS weight,
           v.stock_quantity AS stock, COALESCE(v.price_override, p.base_price) AS price, p.tax_rate AS "taxRate",
           (v.active AND p.status = 'active') AS available,
           (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order, i.id LIMIT 1) AS image
    FROM cart_items ci
    JOIN product_variants v ON v.id = ci.variant_id
    JOIN products p ON p.id = v.product_id
    WHERE ci.cart_id = $1 ORDER BY ci.id`, [cartId]);
}

// The delivery charge for a bag: priced by its total weight in the chosen region (rules are set in the admin).
export async function shippingFor(q, subtotal, lines, regionId) {
  const m = await one(q, `SELECT id, code, name FROM shipping_methods WHERE active ORDER BY id LIMIT 1`);
  const rules = await loadRules(q);
  const d = await deliveryFor(q, subtotal, { regionId, grams: bagWeight(lines, rules) });
  return { id: m?.id ?? null, name: m?.name ?? 'Delivery', amount: d.amount, freeOver: d.freeOver, grams: d.grams, region: d.regionId ? { id: d.regionId, name: d.regionName } : null, regions: d.regions, note: d.reason, policy: d.policy };
}


export async function cartView(db, cart, regionId) {
  const lines = cart ? await cartLines(db, cart.id) : [];
  const items = lines.map(l => ({ variantId: l.variantId, slug: l.slug, name: l.name, size: l.size, color: l.color, price: l.price, taxRate: l.taxRate, qty: l.qty, stock: l.stock, image: l.image, issue: issueFor(l) }));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ship = await shippingFor(db, subtotal, lines, regionId).catch(e => ({ amount: 0, freeOver: null, grams: 0, region: null, regions: [], note: e.message, policy: '' }));
  const shipping = { amount: items.length ? ship.amount : 0, freeOver: ship.freeOver ?? null, grams: items.length ? ship.grams : 0, region: ship.region ?? null, regions: ship.regions ?? [], note: ship.note ?? null, policy: ship.policy ?? '' }, gst = gstSplit(items);
  return { items, count: items.reduce((s, i) => s + i.qty, 0), subtotal, shipping, gst, total: subtotal + shipping.amount, hasIssues: items.some(i => i.issue) };
}
```

### server/lib/cost.js  (add)
```js
// products.weight_grams / product_variants.weight_grams arrive with migration 034; until then every bag weighs the default per piece.
let wtKnown = false, wtAt = 0;
export async function hasWeightColumns(db) {
  if (wtKnown) return true;
  if (Date.now() - wtAt < 60_000) return false;
  wtAt = Date.now();
  wtKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams'`));
  return wtKnown;
}
```

### server/routes/shopper.js  (cart GET takes ?region=)
```js

```

### server/routes/commerce.js  (public delivery copy; also add `regionId: z.string().trim().max(40).optional()` to the checkout address schema)
```js
  // Delivery copy the owner writes in the admin (landing page line, product-page lines, the shipping note) and the regions customers can pick.
  r.get('/delivery-info', wrap(async (_req, res) => {
    const rules = await loadRules(db);
    res.set('Cache-Control', 'public, max-age=60').json({ landingText: rules.landingText || '', productLines: rules.productLines || [], note: rules.note || '', freeOver: rules.freeOver || null, regions: activeRegions(rules).map(x => ({ id: x.id, name: x.name })) });
  }));
```

### server/routes/pos.js  (admin rules; plus `weightGrams` in the product patch schema, `weight` in the size patch schema and their UPDATEs)
```js
  r.get('/pos/delivery-rules', manager, wrap(async (_req, res) => res.json(await loadRules(db))));
  r.put('/pos/delivery-rules', manager, wrap(async (req, res) => {
    const tier = z.object({ minGrams: z.number().int().min(0).max(1_000_000), maxGrams: z.number().int().min(1).max(1_000_000).nullable(), fee: paise });
    const region = z.object({ id: text(40).min(1), name: text(60).min(1), active: z.boolean().default(true), tiers: z.array(tier).min(1).max(12) });
    const v = z.object({ enabled: z.boolean(), note: text(300).default(''), landingText: text(500).default(''), productLines: z.array(text(300).min(1)).max(20).default([]),
      freeOver: paise, defaultWeightGrams: z.number().int().min(0).max(100_000).default(500), regions: z.array(region).min(1).max(20) }).parse(req.body);
    for (const r of v.regions) for (const t of r.tiers) if (t.maxGrams != null && t.maxGrams <= t.minGrams) throw new HttpError(400, `${r.name}: a tier's "up to" weight must be above its "from" weight`);
    if (new Set(v.regions.map(r => r.id)).size !== v.regions.length) throw new HttpError(400, 'Each delivery region needs its own id');
    await putSetting(db, 'delivery_rules', v); await audit(db, req.user.id, 'pos.delivery_rules', 'pos_settings', 'delivery_rules'); res.json(v);
  }));
```

### server/lib/orders.js  (createPendingOrder prices from the server cart and the chosen region)
```js
ntained in it.
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0), tax = gstSplit(lines).included;
    const ship = await shippingFor(t, subtotal, lines, address?.regionId);
    const total = subtotal + ship.amount;
    const number = orderNumber();
    const order = await one(t, `INSERT INTO orders (user_id, order_number, email, subtotal, s
```

### client: context `loadCart` (takes an optional region id)
```js
const loadCart = useCallback(region => api('/cart' + (typeof region === 'string' && region ? '?region=' + encodeURIComponent(region) : '')).then(setCart).catch(() => {}), []);
```

### client: checkout page (region state, re-price effect, region select, regionId sent with the address)
```jsx
const [region, setRegion] = useState('');
useEffect(() => { loadCart(region) }, [region, cartInfo.subtotal]); // eslint-disable-line

// in the form, above the address fields:
{(cartInfo.shipping?.regions?.length || 0) > 1 && <label className="field"><span>Delivery region</span><select value={region || cartInfo.shipping.region?.id || ''} onChange={e => setRegion(e.target.value)}>{cartInfo.shipping.regions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}

// when paying:
const o = await api('/checkout', { method: 'POST', body: { email, address: { ...address, regionId: region || cartInfo.shipping?.region?.id || undefined } } });
```

### client: BagTotals rows
```jsx
<div><dt>Delivery{shipping.grams ? <small> ({shipping.grams >= 1000 ? `${(shipping.grams / 1000).toFixed(shipping.grams % 1000 ? 1 : 0)} kg` : `${shipping.grams} g`}{shipping.region && shipping.regions?.length > 1 ? ` · ${shipping.region.name}` : ''})</small> : null}</dt><dd>{shipping.amount === 0 ? 'Free' : inr(shipping.amount)}</dd></div>
      {shipping.note && <p className="muted small" role="status" style={{ margin: '0 0 6px' }}>{shipping.note}</p>}
      {shipping.policy && <p className="muted small" style={{ margin: '0 0 6px' }}>{shipping.policy}</p>}
      {shipping.freeOver && shipping.amount > 0 ? <p className="muted small" style={{ margin: '0 0 6px' }}>Delivery is charged by the weight of your bag. Free over {inr(shipping.freeOver)}.</p> : null}
```

### client: admin card DeliveryRulesCard (POS Settings)
```jsx
// Delivery charge rules for the online store, priced by WEIGHT (same model as Shalistone): delivery regions, each with weight tiers
// (from grams, up to grams or no limit, charge). The bag's total weight picks the tier. Also the free-delivery threshold and the delivery copy
// shown to customers (shipping note, landing-page line, product-page lines).
function DeliveryRulesCard() {
  const { toast } = useApp();
  const [r, setR] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => {
    api('/admin/pos/delivery-rules').then(x => setR({
      ...x, freeOver: rupees(x.freeOver || 0), defaultWeightGrams: String(x.defaultWeightGrams ?? 500), productLines: (x.productLines || []).join('\n'),
      regions: x.regions.map(g => ({ ...g, tiers: g.tiers.map(t => ({ minGrams: String(t.minGrams), maxGrams: t.maxGrams == null ? '' : String(t.maxGrams), fee: rupees(t.fee) })) })),
    })).catch(e => setErr(e.message));
  }, []);
  if (!r) return err ? <p className="dpos-err" role="alert">{err}</p> : null;
  const region = (i, p) => setR({ ...r, regions: r.regions.map((g, n) => n === i ? { ...g, ...p } : g) });
  const tier = (i, j, p) => region(i, { tiers: r.regions[i].tiers.map((t, n) => n === j ? { ...t, ...p } : t) });
  const addRegion = () => setR({ ...r, regions: [...r.regions, { id: 'region-' + Math.random().toString(36).slice(2, 7), name: '', active: true, tiers: [{ minGrams: '0', maxGrams: '', fee: '' }] }] });
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr();
    try {
      const body = {
        enabled: r.enabled, note: (r.note || '').trim(), landingText: (r.landingText || '').trim(), freeOver: toPaise(r.freeOver), defaultWeightGrams: Math.max(0, parseInt(r.defaultWeightGrams, 10) || 0),
        productLines: r.productLines.split('\n').map(l => l.trim()).filter(Boolean),
        regions: r.regions.map(g => ({ id: g.id, name: g.name.trim(), active: g.active, tiers: g.tiers.map(t => ({ minGrams: Math.max(0, parseInt(t.minGrams, 10) || 0), maxGrams: t.maxGrams.trim() === '' ? null : parseInt(t.maxGrams, 10) || 0, fee: toPaise(t.fee) })) })),
      };
      await api('/admin/pos/delivery-rules', { method: 'PUT', body }); toast('Delivery rules saved.');
    } catch (x) { setErr(x.issues?.[0]?.message || x.message) } finally { setBusy(false) }
  };
  return (
    <form className="dpos-card" onSubmit={save} style={{ marginTop: 16 }}>
      <h2><Icon n="truck" />Delivery charge (by weight)</h2>
      <p className="sub" style={{ marginBottom: 12 }}>The delivery charge is picked from the bag's total weight (each size's weight × quantity). Set each product's weight in Inventory → Edit product; a product with no weight counts as the default below.</p>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '4px 0 12px' }}><input type="checkbox" checked={r.enabled} onChange={e => setR({ ...r, enabled: e.target.checked })} /><span>Charge for delivery</span></label>
      <div className="dpos-grid">
        <label className="f">Free delivery when the order is at least (S$, 0 = never)<input inputMode="decimal" value={r.freeOver} onChange={e => setR({ ...r, freeOver: e.target.value })} /></label>
        <label className="f">Weight counted for a product with none (grams)<input inputMode="numeric" value={r.defaultWeightGrams} onChange={e => setR({ ...r, defaultWeightGrams: e.target.value.replace(/\D/g, '') })} /></label>
      </div>
      <p className="dpos-flabel">DELIVERY REGIONS &amp; WEIGHT TIERS</p>
      {r.regions.map((g, i) => (
        <div key={g.id} className="dpos-box" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <input aria-label="Region name" placeholder="Region name, e.g. Singapore" style={{ maxWidth: 280 }} value={g.name} onChange={e => region(i, { name: e.target.value })} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={g.active} onChange={e => region(i, { active: e.target.checked })} /><span className="small">Active</span></label>
            <button type="button" className="dpos-btn ghost sm" style={{ marginLeft: 'auto' }} disabled={r.regions.length < 2} onClick={() => setR({ ...r, regions: r.regions.filter((_, n) => n !== i) })}>Remove region</button>
          </div>
          {g.tiers.map((t, j) => (
            <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted small">From</span><input aria-label="From grams" style={{ maxWidth: 110 }} inputMode="numeric" value={t.minGrams} onChange={e => tier(i, j, { minGrams: e.target.value.replace(/\D/g, '') })} />
              <span className="muted small">g, up to</span><input aria-label="Up to grams (blank = no limit)" style={{ maxWidth: 120 }} inputMode="numeric" placeholder="no limit" value={t.maxGrams} onChange={e => tier(i, j, { maxGrams: e.target.value.replace(/\D/g, '') })} />
              <span className="muted small">g → S$</span><input aria-label="Charge" style={{ maxWidth: 110 }} inputMode="decimal" value={t.fee} onChange={e => tier(i, j, { fee: e.target.value })} />
              <button type="button" className="dpos-btn ghost sm" aria-label="Remove tier" disabled={g.tiers.length < 2} onClick={() => region(i, { tiers: g.tiers.filter((_, n) => n !== j) })}>✕</button>
            </div>))}
          <button type="button" className="dpos-btn ghost sm" onClick={() => region(i, { tiers: [...g.tiers, { minGrams: g.tiers.length ? (g.tiers[g.tiers.length - 1].maxGrams || '') : '0', maxGrams: '', fee: '' }] })}>+ Add tier</button>
        </div>))}
      <button type="button" className="dpos-btn ghost sm" onClick={addRegion}>+ Add region</button>
      <p className="dpos-flabel">WHAT CUSTOMERS SEE</p>
      <label className="f">Shipping note (bag and checkout)<textarea rows={2} maxLength={300} value={r.note || ''} onChange={e => setR({ ...r, note: e.target.value })} placeholder="e.g. Delivered within 3 to 5 working days across Singapore." /></label>
      <label className="f" style={{ marginTop: 10 }}>Landing page delivery line<textarea rows={2} maxLength={500} value={r.landingText || ''} onChange={e => setR({ ...r, landingText: e.target.value })} placeholder="e.g. Fast delivery: get your order within 3 to 5 days." /></label>
      <label className="f" style={{ marginTop: 10 }}>Product page delivery lines (one per line)<textarea rows={3} value={r.productLines} onChange={e => setR({ ...r, productLines: e.target.value })} placeholder={'Standard delivery: 3 to 5 working days\nFree delivery over S$150'} /></label>
      <Err>{err}</Err>
      <div style={{ marginTop: 12 }}><button className="dpos-btn" disabled={busy}>{busy ? 'Saving…' : 'Save delivery rules'}</button></div>
    </form>
  );
}
```
