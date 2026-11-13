import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.js';
import { createDb, migrate } from '../db/index.js';
import { seed } from '../db/seed.js';
import { createApp } from '../app.js';

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
const role = async (email, r) => { const c = client(); await c('POST', '/auth/register', { email, password: 'Password123!' }); await db.query('UPDATE profiles SET role = $2 WHERE email = $1', [email, r]); await c('POST', '/auth/login', { email, password: 'Password123!' }); return c };

test('barcodes: generate, assign, receive stock, reuse, duplicates, lookup fallbacks, sizes, roles', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  assert.equal((await o('POST', '/admin/products', { slug: 'bc-prod', name: 'bc-prod', price: 10000, cost_price: 4000, gst_rate: 9, status: 'active', variants: [{ sku: 'BC-S', size: 'S', color: 'Red', stock: 2 }, { sku: 'BC-L', size: 'L', color: 'Red', stock: 0 }] })).status, 201);
  const items = (await o('GET', '/admin/pos/barcodes/items?q=bc-prod')).body;
  assert.equal(items.length, 2); assert.equal(items[0].cost, 4000);
  const S = items.find(x => x.size === 'S'), L = items.find(x => x.size === 'L');

  // generated value, stock received once, movement written
  const g = (await o('POST', '/admin/pos/barcodes/generate', {})).body.value; assert.match(g, /^PBV\d{8}$/);
  const r1 = (await o('POST', '/admin/pos/barcodes/receive', { variantId: S.variantId, quantity: 5, unitCost: 4000, customBarcode: g.toLowerCase() })).body;
  assert.equal(r1.barcodeValue, g); assert.equal(r1.isNewBarcode, true); assert.equal(r1.movementType, 'INITIAL_BARCODE_STOCK'); assert.equal(r1.quantityBefore, 2); assert.equal(r1.quantityAfter, 7);
  // a second receive reuses the barcode and is a RESTOCK
  const r2 = (await o('POST', '/admin/pos/barcodes/receive', { variantId: S.variantId, quantity: 3 })).body;
  assert.equal(r2.barcodeValue, g); assert.equal(r2.isNewBarcode, false); assert.equal(r2.movementType, 'RESTOCK'); assert.equal(r2.quantityAfter, 10);
  const mv = await db.query('SELECT reason, quantity_change, quantity_before, quantity_after, unit_cost FROM inventory_movements WHERE variant_id = $1 ORDER BY id DESC LIMIT 2', [S.variantId]);
  assert.deepEqual(mv.rows.map(x => x.reason), ['barcode_restock', 'barcode_initial_stock']);
  // quantity 0 only assigns (no movement)
  const r3 = (await o('POST', '/admin/pos/barcodes/receive', { variantId: L.variantId, quantity: 0 })).body;
  assert.equal(r3.movementType, 'NONE'); assert.match(r3.barcodeValue, /^PBV\d{8}$/);
  // a barcode that belongs to another item is refused; a bad format too
  assert.equal((await o('POST', '/admin/pos/barcodes/receive', { variantId: L.variantId, quantity: 1, customBarcode: g })).status, 409);
  assert.equal((await o('POST', '/admin/pos/barcodes/receive', { variantId: L.variantId, quantity: 1, customBarcode: 'x y' })).status, 400);

  // lookup: registry (case-insensitive), the size's own barcode, the SKU, and a miss
  assert.equal((await o('GET', `/admin/pos/barcodes/lookup?code=${g.toLowerCase()}`)).body.variantId, S.variantId);
  assert.equal((await o('GET', '/admin/pos/barcodes/lookup?code=bc-l')).body.via, 'sku');
  assert.equal((await o('GET', '/admin/pos/barcodes/lookup?code=NOPE12345')).body, null);
  await db.query(`UPDATE barcode_registry SET is_active = false WHERE barcode_value = $1`, [g]);
  assert.equal((await o('GET', `/admin/pos/barcodes/lookup?code=${g}`)).body.via, 'variant', 'an inactive registry row falls back to the barcode on the size');

  // custom sizes are saved on the server
  const size = { id: 'custom_40x30', name: '40 × 30 mm (Custom)', labelsPerRow: 1, widthMm: 40, heightMm: 30, horizontalGapMm: 0 };
  assert.equal((await o('PUT', '/admin/pos/barcodes/sizes', size)).status, 200);
  assert.deepEqual((await o('GET', '/admin/pos/barcodes/sizes')).body.map(x => x.id), ['custom_40x30']);
  assert.equal((await o('DELETE', '/admin/pos/barcodes/sizes/custom_40x30')).status, 200);

  // roles: cashiers scan, inventory staff generate/print, only admin/owner deactivate
  const cashier = await role('bc-cashier@test.dev', 'cashier'), stock = await role('bc-stock@test.dev', 'inventory');
  assert.equal((await cashier('GET', '/admin/pos/barcodes/lookup?code=BC-S')).status, 200);
  assert.equal((await cashier('POST', '/admin/pos/barcodes/generate', {})).status, 403);
  assert.equal((await stock('POST', '/admin/pos/barcodes/generate', {})).status, 200);
  const reg = (await o('GET', '/admin/pos/barcodes/registry')).body; assert.ok(reg.total >= 2);
  assert.equal((await stock('POST', `/admin/pos/barcodes/${reg.records[0].id}/deactivate`, {})).status, 403);
  assert.equal((await o('POST', `/admin/pos/barcodes/${reg.records[0].id}/deactivate`, {})).status, 200);
});

test('quick add from a scanned code creates the product, registers the barcode and takes opening stock', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const r = await o('POST', '/admin/pos/barcodes/quick-add', { barcode: 'qa-777001', name: 'Scanned Dupatta', price: 4500, category: 'Dupattas', stock: 6 });
  assert.equal(r.status, 201); assert.equal(r.body.stock, 6); assert.equal(r.body.price, 4500); assert.equal(r.body.sku, 'QA-777001');
  assert.equal((await o('GET', '/admin/pos/barcodes/lookup?code=QA-777001')).body.name, 'Scanned Dupatta');
  assert.equal((await o('POST', '/admin/pos/barcodes/quick-add', { barcode: 'QA-777001', name: 'Again', price: 100 })).status, 409);
  const cashier = await role('bc-cashier2@test.dev', 'cashier');
  assert.equal((await cashier('POST', '/admin/pos/barcodes/quick-add', { barcode: 'QA-777002', name: 'Nope', price: 100 })).status, 403);
});
