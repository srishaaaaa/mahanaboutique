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

test('returns: restock tick, manual lines never touch stock, delivery not refunded, admin approval', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const v = (await o('GET', '/admin/pos/catalog?limit=1')).body[0];
  const stock = async () => (await db.query('SELECT stock_quantity AS s FROM product_variants WHERE id = $1', [v.variantId])).rows[0].s;
  const s0 = await stock();
  const sale = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'ret2-key-0001', items: [{ variantId: v.variantId, qty: 2 }, { name: 'Alteration', price: 1000, qty: 1 }], paymentMode: 'cash', deliveryFee: 500 })).body;
  assert.equal(await stock(), s0 - 2);
  const full = (await o('GET', `/admin/pos/sales/${sale.invoiceNo}`)).body; const sale_ = full.sale || full;
  const goods = sale_.items.find(i => i.stocked), manual = sale_.items.find(i => !i.stocked);
  // admin must approve
  assert.equal((await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 1 }], refundMode: 'cash' })).status, 400);
  // unticked goods do not go back; ticked do; manual never
  const a = await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 1, restock: false }, { itemId: manual.id, qty: 1, restock: true }], refundMode: 'cash', approval: { self: true } });
  assert.equal(a.status, 201); assert.match(a.body.returnNo, /^RTN-\d{8}$/); assert.ok(a.body.approvedBy !== undefined);
  assert.equal(await stock(), s0 - 2, 'nothing went back');
  assert.ok(a.body.total < sale_.total && a.body.total <= goods.lineTotal + manual.lineTotal + goods.tax + manual.tax, 'delivery fee is not in the refund');
  const b = await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 1 }], refundMode: 'cash', approval: { self: true } });
  assert.equal(b.status, 201); assert.equal(await stock(), s0 - 1, 'ticked item went back');
  // staff need an admin password
  await o('POST', '/admin/users', { email: 'cash@test.dev', password: 'CashPass12345!', name: 'Cash', role: 'cashier' });
  const c = client(); await c('POST', '/auth/login', { email: 'cash@test.dev', password: 'CashPass12345!' });
  const sale2 = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'ret2-key-0002', items: [{ variantId: v.variantId, qty: 1 }], paymentMode: 'cash' })).body;
  const g2 = ((await o('GET', `/admin/pos/sales/${sale2.invoiceNo}`)).body); const it = (g2.sale || g2).items[0];
  assert.equal((await c('POST', `/admin/pos/sales/${sale2.invoiceNo}/returns`, { items: [{ itemId: it.id, qty: 1 }], refundMode: 'cash', approval: { email: 'owner@test.dev', password: 'wrong' } })).status, 403);
  assert.equal((await c('POST', `/admin/pos/sales/${sale2.invoiceNo}/returns`, { items: [{ itemId: it.id, qty: 1 }], refundMode: 'cash', approval: { email: 'owner@test.dev', password: 'OwnerPass123!' } })).status, 201);
});
