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
