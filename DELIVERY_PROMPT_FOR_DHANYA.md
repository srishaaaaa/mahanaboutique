# Prompt: delivery charges in Dhanya — stored, calculated and shown exactly as in Mahana

You are an AI coding agent working in the **Dhanya** codebase (React + Vite client in `client/`, Express + PGlite/Postgres server in `server/`, migrations in `server/db/migrations/`, tests in `server/test/`, run with `node --test --test-concurrency=1 test/*.test.js`). Implement the **online-store delivery charge** below. Source code for every piece is included verbatim at the end — copy it, then adapt only names/imports to Dhanya. Keep Dhanya's existing behaviour for everything not listed. Money is always **integer minor units** (cents); the client prints it with the store currency.

## 1. What it does (plain words)
The delivery charge on the online store is **not a flat fee any more**. It depends on:
1. **Distance** from the shop to the customer's postal code (straight-line km), looked up in **distance bands** the owner sets ("up to 5 km → S$8, up to 10 km → S$12 …").
2. **The order value**: a **free-delivery threshold** ("free when the order is at least S$150"), and optional **order tiers** ("an order of S$100 or more pays at most S$5").
3. **Limits**: an optional **maximum distance** (beyond it we do not deliver) and an optional **extra fee per km** beyond the last band.
All of this is **configured by the owner in the admin** (POS Settings → "Online delivery charge (by distance & order)"). Nothing about it is hard-coded except first-run defaults.

## 1b. Shipping note
Besides the numbers, the owner writes one **shipping note** (up to 300 characters) in the same admin card — e.g. "Delivered within 3 to 5 working days across Singapore. You will get a message when your order ships." It is stored as `note` inside the same `delivery_rules` JSON (default sentence in `DELIVERY_DEFAULTS.note`; empty = show nothing), returned by the cart as `shipping.policy`, and shown as a muted line under the Delivery row in the bag drawer **and** at checkout. It is plain text (render it as text, never as HTML). The distance/fee message (`shipping.note`, e.g. "We do not deliver beyond 30 km" or "Estimated: distance could not be worked out yet") is separate and shows above it.

## 2. Where it is kept
- One JSON document in the settings table under the key **`delivery_rules`** (Mahana: `pos_settings(key, value)`; use Dhanya's equivalent key/value settings table). Shape (all money in cents):
```json
{
  "enabled": true,
  "note": "Delivered within 3 to 5 working days across Singapore.",
  "storePostal": "238858",
  "freeOver": 15000,
  "maxKm": 0,
  "perKmBeyond": 0,
  "bands": [ { "upToKm": 5, "fee": 800 }, { "upToKm": 10, "fee": 1200 }, { "upToKm": 20, "fee": 1800 } ],
  "orderTiers": [ { "minOrder": 10000, "fee": 500 } ]
}
```
- Defaults (`DELIVERY_DEFAULTS` in `lib/delivery.js`) apply until the owner saves: enabled, a default shipping note, free over S$150, bands 5 km S$8 / 10 km S$12 / 20 km S$18, no max distance, no per-km extra, no tiers, **no shop postal code** (so distance cannot be worked out until the owner enters it).
- The old `shipping_methods` table is kept only to give each order a `shipping_method_id`; its `base_amount` / `free_over` are **no longer used**.
- Each order stores the amount actually charged in `orders.shipping_amount` and the customer's address (with postal code `pin`) in the address snapshot — so later rule changes never alter old orders.

## 3. How it is calculated (the exact algorithm)
Inputs: `subtotal` (cents, incl. GST, before delivery), `pin` (customer's 6-digit postal code, optional), the saved rules.
1. If `rules.enabled` is false → **0** ("Delivery charges are switched off").
2. If `rules.freeOver > 0` and `subtotal >= rules.freeOver` → **0** ("Free delivery on this order"). This check comes **before** distance.
3. Work out `km`: geocode the shop's postal code and the customer's `pin` with the public **OneMap** search API (`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=<pin>&returnGeom=Y&getAddrDetails=N&pageNum=1`, no key, 4 s timeout, result cached in memory per postcode), then the **haversine** straight-line distance, rounded to 0.1 km. If either lookup fails, or no `pin`, or no `storePostal` → `km = null`.
4. Fee from bands (sorted by `upToKm`): `km === null` → the **first band's fee** and the note "Estimated: distance could not be worked out yet". Otherwise the first band with `km <= upToKm`. If `km` is beyond every band: if `maxKm > 0` and `km > maxKm` → **refuse** (`amount: null`, message "We do not deliver beyond N km"); else fee = last band's fee + round((km − last band's upToKm) × `perKmBeyond`).
5. Order tiers: take the tier with the **largest `minOrder` that the subtotal reaches**; the fee becomes `min(fee, tier.fee)` (a bigger basket can only make delivery cheaper).
6. Return `{ amount, free: amount === 0, km, reason, freeOver }`.
Worked examples with the defaults: 3 km, S$50 order → S$8; 7 km → S$12; 18 km → S$18; any distance with S$150+ → free; with `perKmBeyond = S$1` and 25 km → S$18 + 5 × S$1 = S$23; `maxKm = 30` and 40 km → not deliverable; tier `{minOrder: S$100, fee: S$5}` and an 18 km, S$120 order → S$5; unknown distance → S$8.

## 4. Server wiring
- `lib/delivery.js` (new, below): `loadRules`, `geocode`, `haversineKm`, pure `feeFor(rules, km, subtotal)` (unit-tested) and `deliveryFor(db, subtotal, pin)`.
- `lib/cart.js`: `shippingFor(db, subtotal, pin)` calls `deliveryFor`; if `amount == null` it throws a 400 (`out_of_range`). `cartView(db, cart, pin)` passes the pin through and **never throws** for an out-of-range pin — it returns `shipping: { amount: 0, blocked: true, note }` so the bag still renders; the total includes `shipping.amount`.
- `GET /api/cart?pin=<6 digits>` prices the bag for that postal code (pin optional; invalid pins are ignored).
- `createPendingOrder` (checkout): `shippingFor(t, subtotal, address.pin)` — the **server recomputes** the fee from the cart and the address; the browser never sends a price. Out-of-range → 400 so payment is never started.
- Admin: `GET /api/admin/pos/delivery-rules` (returns saved rules merged over defaults) and `PUT` (zod-validated incl. `note: string ≤ 300`, audit-logged), **owner/admin only**.
- Tests: `test/delivery.test.js` (below) — keep green.

## 5. Client wiring
- **Admin** — a card "Online delivery charge (by distance & order)" at the bottom of POS Settings (`DeliveryRulesCard`, below): enable checkbox; four fields in a grid (Shop postal code · Free delivery when the order is at least · Do not deliver beyond km · Extra per km beyond the last band); "DISTANCE BANDS" rows (`Up to [km] km → S$ [fee]`, ✕ remove, "+ Add band", at least one band); "ORDER VALUE TIERS" rows (`Order of S$ [min] or more → delivery at most S$ [fee]`, "+ Add tier"); help line; Save button "Save delivery rules". Fields show dollars; convert to cents on save.
- **Checkout** — when the customer has typed a complete 6-digit postal code, call `GET /cart?pin=` (context `loadCart(pin)`; `loadCart` ignores non-string arguments) and replace the cart in state; refetch when the pin or the subtotal changes.
- **Totals** (`BagTotals`): row `Delivery (x km)` showing `Free`, an amount, or `—` when blocked; under it a muted line with `shipping.note` (e.g. the out-of-range message or the "Estimated…" note); if there is no distance yet and a free threshold exists: "Delivery is priced by distance. Enter your postal code at checkout. Free over S$150."
- Pay button: the server message is shown if checkout is refused.

## 6. Acceptance checklist
1. With defaults and no shop postal code, any order under the free threshold shows the first band fee with the "Estimated" note; at/over the threshold it shows Free.
2. After the owner saves a shop postal code, typing a customer postal code at checkout changes the delivery row to the band for the real distance (OneMap reachable) and shows `(x km)`.
3. `maxKm` blocks checkout with a clear message and the pay button does not charge.
4. Editing rules affects new carts immediately and never changes existing orders.
5. `node --test --test-concurrency=1 test/*.test.js` passes including `delivery.test.js`.

---

# Source code (verbatim from Mahana — copy, then adapt names/imports)

### server/lib/delivery.js  (new file)
```js
import { one } from '../db/index.js';
const getSetting = async (db, key, fallback) => (await one(db, 'SELECT value FROM pos_settings WHERE key = $1', [key]))?.value ?? fallback;

// Delivery charge = distance band (km from the shop to the customer's postal code) with a free-delivery threshold on the order value.
// The rules live in Admin → POS Settings → Delivery rules; nothing here is hard-coded except the first-run defaults.
export const DELIVERY_DEFAULTS = {
  enabled: true, note: 'Delivered within 3 to 5 working days across Singapore. You will get a message when your order ships.', storePostal: '', freeOver: 15000, maxKm: 0, perKmBeyond: 0,
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
  return { ...feeFor(rules, km, subtotal), freeOver: rules.freeOver || null, policy: rules.note || '' };
}
```

### server/test/delivery.test.js  (new file)
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feeFor, DELIVERY_DEFAULTS as D } from '../lib/delivery.js';

test('delivery fee follows distance bands, free threshold, order tiers and the max distance', () => {
  assert.equal(feeFor(D, 3, 5000).amount, 800);
  assert.equal(feeFor(D, 7, 5000).amount, 1200);
  assert.equal(feeFor(D, 18, 5000).amount, 1800);
  assert.equal(feeFor(D, 3, 15000).amount, 0, 'free over the threshold');
  assert.equal(feeFor({ ...D, perKmBeyond: 100 }, 25, 5000).amount, 1800 + 500, 'per-km beyond the last band');
  assert.equal(feeFor({ ...D, maxKm: 30 }, 40, 5000).amount, null, 'out of range');
  assert.equal(feeFor({ ...D, orderTiers: [{ minOrder: 10000, fee: 500 }] }, 18, 12000).amount, 500, 'a bigger order ships cheaper');
  assert.equal(feeFor(D, null, 5000).amount, 800, 'unknown distance uses the first band');
  assert.equal(feeFor({ ...D, enabled: false }, 3, 100).amount, 0);
});

test('shipping note: defaults to a sentence, shows on the cart, and the owner can change it', async () => {
  const { DELIVERY_DEFAULTS } = await import('../lib/delivery.js');
  assert.ok(DELIVERY_DEFAULTS.note.length > 10);
});
```

### server/lib/cart.js  (replace `shippingFor` and `cartView`; add `import { deliveryFor } from './delivery.js';`)
```js
export async function shippingFor(q, subtotal, pin) {
  const m = await one(q, `SELECT id, code, name FROM shipping_methods WHERE active ORDER BY id LIMIT 1`);
  const d = await deliveryFor(q, subtotal, pin);
  if (d.amount == null) throw new HttpError(400, d.reason, 'out_of_range');
  return { id: m?.id ?? null, name: m?.name ?? 'Delivery', amount: d.amount, freeOver: d.freeOver, km: d.km, note: d.reason, policy: d.policy };
}


export async function cartView(db, cart, pin) {
  const lines = cart ? await cartLines(db, cart.id) : [];
  const items = lines.map(l => ({ variantId: l.variantId, slug: l.slug, name: l.name, size: l.size, color: l.color, price: l.price, taxRate: l.taxRate, qty: l.qty, stock: l.stock, image: l.image, issue: issueFor(l) }));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ship = await shippingFor(db, subtotal, pin).catch(e => ({ amount: 0, freeOver: null, note: e.message, blocked: true, policy: '' }));
  const shipping = { amount: items.length ? ship.amount : 0, freeOver: ship.freeOver ?? null, km: ship.km ?? null, note: ship.note ?? null, policy: ship.policy ?? '', blocked: !!ship.blocked }, gst = gstSplit(items);
  return { items, count: items.reduce((s, i) => s + i.qty, 0), subtotal, shipping, gst, total: subtotal + shipping.amount, hasIssues: items.some(i => i.issue) };
}
```

### server/routes/shopper.js  (cart GET accepts ?pin=)
```js

```

### server/routes/pos.js  (admin routes; needs `import { loadRules } from '../lib/delivery.js'`, and your own `manager` role guard, `paise` and `text` zod helpers)
```js
  // Delivery rules: distance bands from the shop's postal code, free-delivery threshold, optional cheaper tiers for bigger orders.
  r.get('/pos/delivery-rules', manager, wrap(async (_req, res) => res.json(await loadRules(db))));
  r.put('/pos/delivery-rules', manager, wrap(async (req, res) => {
    const v = z.object({ enabled: z.boolean(), note: text(300).default(''), storePostal: z.string().regex(/^(\d{6})?$/, 'Shop postal code must be 6 digits'), freeOver: paise, maxKm: z.number().min(0).max(500), perKmBeyond: paise,
      bands: z.array(z.object({ upToKm: z.number().positive().max(500), fee: paise })).min(1).max(12), orderTiers: z.array(z.object({ minOrder: paise, fee: paise })).max(8) }).parse(req.body);
    await putSetting(db, 'delivery_rules', v); await audit(db, req.user.id, 'pos.delivery_rules', 'pos_settings', 'delivery_rules'); res.json(v);
  }));
```

### server/lib/orders.js  (createPendingOrder: the server prices delivery from the address)
```js
the order total is the subtotal plus shipping, and tax_amount records the GST contained in it.
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0), tax = gstSplit(lines).included;
    const ship = await shippingFor(t, subtotal, address?.pin);
    const total = subtotal + ship.amount;
    const number = orderNumber();
    const order = await one(t, `INSERT INTO orders (user_id, order_number, email, subtotal, shipping_amount, tax_amount, tota
```

### client: context `loadCart` (accepts an optional postal code)
```js
const loadCart = useCallback(pin => api('/cart' + (typeof pin === 'string' && /^\d{6}$/.test(pin) ? '?pin=' + pin : '')).then(setCart).catch(() => {}), []);
```

### client: checkout page effect (re-prices when the postal code is complete)
```js
// Delivery is priced by distance: once the postal code is complete, ask the server for the delivery charge.
useEffect(() => { if (/^\d{6}$/.test(f.pin)) loadCart(f.pin) }, [f.pin, cartInfo.subtotal]); // eslint-disable-line
```

### client: BagTotals rows (Delivery, distance/fee note, shipping note)
```jsx
<div><dt>Delivery{shipping.km != null ? <small> ({shipping.km} km)</small> : null}</dt><dd>{shipping.blocked ? '—' : shipping.amount === 0 ? 'Free' : inr(shipping.amount)}</dd></div>
      {shipping.note && <p className="muted small" role="status" style={{ margin: '0 0 6px' }}>{shipping.note}</p>}
      {shipping.policy && <p className="muted small" style={{ margin: '0 0 6px' }}>{shipping.policy}</p>}
      {!shipping.note && shipping.km == null && shipping.freeOver ? <p className="muted small" style={{ margin: '0 0 6px' }}>Delivery is priced by distance. Enter your postal code at checkout. Free over {inr(shipping.freeOver)}.</p> : null}
```

### client: admin card DeliveryRulesCard (POS Settings; needs your api helper, toast, Icon, toPaise/rupees helpers)
```jsx
// Delivery charge rules for the online store: distance bands from the shop, free-delivery threshold, cheaper tiers for bigger orders.
function DeliveryRulesCard() {
  const { toast } = useApp();
  const [r, setR] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => { api('/admin/pos/delivery-rules').then(x => setR({ ...x, bands: x.bands.map(b => ({ upToKm: String(b.upToKm), fee: rupees(b.fee) })), orderTiers: (x.orderTiers || []).map(t => ({ minOrder: rupees(t.minOrder), fee: rupees(t.fee) })), freeOver: rupees(x.freeOver || 0), perKmBeyond: rupees(x.perKmBeyond || 0), maxKm: String(x.maxKm || 0) })).catch(e => setErr(e.message)) }, []);
  if (!r) return err ? <p className="dpos-err" role="alert">{err}</p> : null;
  const band = (i, p) => setR({ ...r, bands: r.bands.map((b, n) => n === i ? { ...b, ...p } : b) });
  const tier = (i, p) => setR({ ...r, orderTiers: r.orderTiers.map((b, n) => n === i ? { ...b, ...p } : b) });
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr();
    try {
      const body = { enabled: r.enabled, note: (r.note || '').trim(), storePostal: r.storePostal.trim(), freeOver: toPaise(r.freeOver), maxKm: Math.max(0, +r.maxKm || 0), perKmBeyond: toPaise(r.perKmBeyond),
        bands: r.bands.filter(b => +b.upToKm > 0).map(b => ({ upToKm: +b.upToKm, fee: toPaise(b.fee) })), orderTiers: r.orderTiers.filter(t => toPaise(t.minOrder) > 0).map(t => ({ minOrder: toPaise(t.minOrder), fee: toPaise(t.fee) })) };
      await api('/admin/pos/delivery-rules', { method: 'PUT', body }); toast('Delivery rules saved.');
    } catch (x) { setErr(x.issues?.[0]?.message || x.message) } finally { setBusy(false) }
  };
  return (
    <form className="dpos-card" onSubmit={save} style={{ marginTop: 16 }}>
      <h2><Icon n="truck" />Online delivery charge (by distance &amp; order)</h2>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '4px 0 12px' }}><input type="checkbox" checked={r.enabled} onChange={e => setR({ ...r, enabled: e.target.checked })} /><span>Charge for delivery</span></label>
      <label className="f" style={{ marginBottom: 12 }}>Shipping note shown to customers (bag, checkout)<textarea rows={2} maxLength={300} value={r.note || ''} onChange={e => setR({ ...r, note: e.target.value })} placeholder="e.g. Delivered within 3 to 5 working days across Singapore." /></label>
      <div className="dpos-grid">
        <label className="f">Shop postal code (distance starts here)<input inputMode="numeric" maxLength={6} value={r.storePostal} onChange={e => setR({ ...r, storePostal: e.target.value.replace(/\D/g, '') })} placeholder="6 digits" /></label>
        <label className="f">Free delivery when the order is at least (S$, 0 = never)<input inputMode="decimal" value={r.freeOver} onChange={e => setR({ ...r, freeOver: e.target.value })} /></label>
        <label className="f">Do not deliver beyond (km, 0 = no limit)<input inputMode="decimal" value={r.maxKm} onChange={e => setR({ ...r, maxKm: e.target.value })} /></label>
        <label className="f">Extra per km beyond the last band (S$)<input inputMode="decimal" value={r.perKmBeyond} onChange={e => setR({ ...r, perKmBeyond: e.target.value })} /></label>
      </div>
      <p className="dpos-flabel">DISTANCE BANDS</p>
      {r.bands.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}><span className="muted small">Up to</span><input aria-label="Up to km" style={{ maxWidth: 110 }} inputMode="decimal" value={b.upToKm} onChange={e => band(i, { upToKm: e.target.value })} /><span className="muted small">km → S$</span><input aria-label="Fee" style={{ maxWidth: 130 }} inputMode="decimal" value={b.fee} onChange={e => band(i, { fee: e.target.value })} />
          <button type="button" className="dpos-btn ghost sm" aria-label="Remove band" disabled={r.bands.length < 2} onClick={() => setR({ ...r, bands: r.bands.filter((_, n) => n !== i) })}>✕</button></div>))}
      <button type="button" className="dpos-btn ghost sm" onClick={() => setR({ ...r, bands: [...r.bands, { upToKm: '', fee: '' }] })}>+ Add band</button>
      <p className="dpos-flabel">ORDER VALUE TIERS (bigger orders pay at most this)</p>
      {r.orderTiers.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}><span className="muted small">Order of S$</span><input aria-label="Minimum order" style={{ maxWidth: 130 }} inputMode="decimal" value={t.minOrder} onChange={e => tier(i, { minOrder: e.target.value })} /><span className="muted small">or more → delivery at most S$</span><input aria-label="Fee" style={{ maxWidth: 130 }} inputMode="decimal" value={t.fee} onChange={e => tier(i, { fee: e.target.value })} />
          <button type="button" className="dpos-btn ghost sm" aria-label="Remove tier" onClick={() => setR({ ...r, orderTiers: r.orderTiers.filter((_, n) => n !== i) })}>✕</button></div>))}
      <button type="button" className="dpos-btn ghost sm" onClick={() => setR({ ...r, orderTiers: [...r.orderTiers, { minOrder: '', fee: '' }] })}>+ Add tier</button>
      <p className="sub" style={{ marginTop: 10 }}>Distance is the straight line between the shop and the customer’s postal code. If it cannot be worked out, the first band applies.</p>
      <Err>{err}</Err>
      <div style={{ marginTop: 12 }}><button className="dpos-btn" disabled={busy}>{busy ? 'Saving…' : 'Save delivery rules'}</button></div>
    </form>
  );
}
```
