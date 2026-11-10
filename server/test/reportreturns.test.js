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
const day = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());

test('reports subtract returns; each size can carry its own cost price', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const d = day(), rep = async () => (await o('GET', `/admin/pos/reports?from=${d}&to=${d}`)).body;
  // a product whose cost is 20.00, with one size at its own cost of 30.00
  assert.equal((await o('POST', '/admin/products', { slug: 'sz-cost', name: 'sz-cost', price: 10000, cost_price: 2000, gst_rate: 9, status: 'active', variants: [{ sku: 'SZ-S', size: 'S', color: 'Red', stock: 5 }, { sku: 'SZ-L', size: 'L', color: 'Red', stock: 5, cost: 3000 }] })).status, 201);
  const p = (await o('GET', '/admin/pos/products?q=sz-cost')).body[0];
  assert.equal(p.variants.find(v => v.size === 'L').cost, 3000); assert.equal(p.variants.find(v => v.size === 'S').cost, 2000);
  assert.equal((await o('PATCH', `/admin/pos/products/${p.id}/variants/${p.variants.find(v => v.size === 'S').id}`, { cost: 2500 })).status, 200);
  const cat = (await o('GET', '/admin/pos/catalog?q=sz-cost')).body, L = cat.find(x => x.size === 'L');
  const before = await rep();
  const sale = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'rr-sale-key-001', items: [{ variantId: L.variantId, qty: 2 }], isGst: false, paymentMode: 'cash' })).body;
  const sold = await rep();
  assert.equal(sold.costs.soldCost - before.costs.soldCost, 6000, 'cost uses the size’s own cost');
  assert.equal(sold.revenue - before.revenue, 20000);
  const item = sale.items[0];
  const ret = (await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: item.id, qty: 1 }], refundMode: 'cash' })).body;
  const after = await rep();
  assert.equal(after.returned.count - before.returned.count, 1);
  assert.equal(after.revenue - before.revenue, 20000 - ret.total, 'revenue is net of the refund');
  assert.equal(after.grossRevenue - before.grossRevenue, 20000, 'gross sales are kept');
  assert.equal(after.cash - before.cash, 20000 - ret.total, 'the refund comes out of cash');
  assert.equal(after.costs.soldCost - before.costs.soldCost, 3000, 'returned piece goes back out of cost of goods');
  assert.equal(after.units - before.units, 1);
});
