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

test('return invoices: partial and final returns, refund maths, stock, public credit note, void guard', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const v = (await o('GET', '/admin/pos/catalog')).body.find(x => x.stock >= 5);
  const sale = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'ret-sale-key-001', items: [{ variantId: v.variantId, qty: 3 }, { name: 'Blouse stitching', price: 50000, qty: 1, taxRate: 9 }],
    isGst: true, discountType: 'percent', discountValue: 10, paymentMode: 'upi', customerName: 'Ret Customer', customerPhone: '81234567' })).body;
  assert.equal(sale.status, 'completed');
  const before = await stockOf(v.variantId);
  const goods = sale.items.find(i => i.variant?.size || i.sku), svc = sale.items.find(i => i !== goods);

  // return one of the three pieces
  const r1 = await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 1 }], reason: 'Wrong size', refundMode: 'upi', approval: { self: true } });
  assert.equal(r1.status, 201, JSON.stringify(r1.body));
  assert.equal(await stockOf(v.variantId), before + 1, 'stock goes back');
  const g = r1.body;
  assert.equal(g.total, g.subtotal - g.discount + g.tax);
  assert.equal(g.returned.length, 1); assert.equal(g.kept.find(i => i.id === goods.id).keptQty, 2); assert.ok(g.kept.find(i => i.id === svc.id), 'the stitching line was not returned');

  // can't return more than is left; the last units take the remainder so the parts add up exactly
  assert.equal((await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 3 }], refundMode: 'upi', approval: { self: true } })).status, 400);
  const r2 = (await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 2 }, { itemId: svc.id, qty: 1 }], refundMode: 'cash', approval: { self: true } })).body;
  assert.equal(g.subtotal + r2.subtotal, sale.subtotal, 'returns add up to the original subtotal');
  assert.equal(g.tax + r2.tax, sale.tax); assert.equal(g.discount + r2.discount, sale.discount);
  assert.equal(r2.kept.length, 0);
  assert.equal((await o('POST', `/admin/pos/sales/${sale.invoiceNo}/returns`, { items: [{ itemId: goods.id, qty: 1 }], refundMode: 'cash', approval: { self: true } })).status, 400, 'already fully returned');

  // the original lists its returns; it cannot be voided any more
  const again = (await o('GET', `/admin/pos/sales/${encodeURIComponent(sale.invoiceNo)}`)).body; const s2 = again.sale || again;
  assert.equal(s2.returns.length, 2); assert.equal(s2.items.find(i => i.id === goods.id).returnedQty, 3);
  assert.equal((await o('POST', `/admin/pos/sales/${sale.invoiceNo}/void`, { reason: 'test void' })).status, 409);

  // the public credit note: no internal ids, names the original invoice
  const pub = await (await fetch(base + '/invoice/' + g.shareToken)).json();
  assert.equal(pub.kind, 'return'); assert.equal(pub.ret.invoiceNo, sale.invoiceNo); assert.ok(!('id' in pub.ret) && !('id' in pub.ret.returned[0]));
});
