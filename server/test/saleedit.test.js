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
before(async () => { db = await createDb(cfg); await migrate(db, () => {}); await seed(db, cfg, () => {}); server = createApp({ db, cfg }).listen(0); base = `http://localhost:${server.address().port}/api` });
after(async () => { server.close(); await db.close() });
const stockOf = async id => (await db.query('SELECT stock_quantity AS s FROM product_variants WHERE id = $1', [id])).rows[0].s;

test('editing an issued bill: details, quantity (stock follows), price, discount, delivery, re-recorded payment, guards', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const v = (await o('GET', '/admin/pos/catalog')).body.find(x => x.stock >= 6);
  const sale = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'edit-sale-key-01', items: [{ variantId: v.variantId, qty: 2 }, { name: 'Alteration', price: 10000, qty: 1, taxRate: 9 }], isGst: true, paymentMode: 'upi', customerName: 'Old Name', customerPhone: '81234567' })).body;
  const base0 = await stockOf(v.variantId);
  const goods = sale.items.find(i => i.sku), svc = sale.items.find(i => !i.sku);
  const patch = b => o('PATCH', `/admin/pos/sales/${sale.invoiceNo}`, { reason: 'Customer asked to change', ...b });

  // details only: totals and payment untouched
  const d1 = await patch({ customerName: 'New Name', notes: 'Corrected', customerAddress: '1 Orchard Rd' });
  assert.equal(d1.status, 200); assert.equal(d1.body.customerName, 'New Name'); assert.equal(d1.body.total, sale.total); assert.ok(d1.body.editedAt);

  // quantity up by 2: stock drops by 2; total moves; the single payment mode now covers the new total
  const d2 = (await patch({ items: [{ id: goods.id, qty: 4 }] })).body;
  assert.equal(await stockOf(v.variantId), base0 - 2);
  assert.ok(d2.total > sale.total); assert.equal(d2.payUpi, d2.total); assert.equal(d2.paymentMode, 'upi');
  // price and discount on a service line, plus delivery
  const d3 = (await patch({ items: [{ id: svc.id, price: 20000 }], discountType: 'fixed', discountValue: 1000, deliveryFee: 500 })).body;
  assert.equal(d3.subtotal, goods.unitPrice * 4 + 20000); assert.equal(d3.discount, 1000); assert.equal(d3.deliveryFee, 500);
  assert.equal(d3.total, d3.subtotal - d3.discount + d3.tax + d3.deliveryFee);
  // remove the goods line: stock all comes back; a split needs amounts that add up
  assert.equal((await patch({ items: [{ id: goods.id, remove: true }], payment: { mode: 'split', split: { cash: 1, upi: 1 } } })).status, 400);
  const d4 = (await patch({ items: [{ id: goods.id, remove: true }], payment: { mode: 'split', split: { cash: 10000, upi: 0, card: 0 } } }));
  assert.equal(d4.status, 400, 'the split must equal the new total');
  const d5 = (await patch({ items: [{ id: goods.id, remove: true }], payment: { mode: 'cash' } })).body;
  assert.equal(await stockOf(v.variantId), base0 + 2, 'removed line returns its stock'); assert.equal(d5.items.length, 1); assert.equal(d5.payCash, d5.total);
  // can't remove the last line, too much stock, short reason, cashiers
  assert.equal((await patch({ items: [{ id: svc.id, remove: true }] })).status, 400);
  assert.equal((await o('PATCH', `/admin/pos/sales/${sale.invoiceNo}`, { reason: 'x' })).status, 400);
  // a bill with a return can no longer be edited
  const r = await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: svc.id, qty: 1 }], refundMode: 'cash', approval: { self: true } }); assert.equal(r.status, 201);
  assert.equal((await patch({ notes: 'late' })).status, 409);
});
