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

test('measurements page: bills with stitching lines, status counts, status changes, voided = cancelled', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const measure = { frontNeck: 'Square', backNeck: 'Sweetheart', sleeveType: 'Sleeveless', sleeveLength: 'Elbow', cm: { front_neck: 12, back_neck: 23 }, remarks: ['test'] };
  const mk = (key, name) => o('POST', '/admin/pos/sales', { idempotencyKey: key, items: [{ name: 'Blouse stitching', price: 100000, qty: 1, taxRate: 0, measure }], paymentMode: 'cash', customerName: name, customerPhone: '81234567', cashTendered: 100000 });
  const a = (await mk('meas-key-0001', 'Anitha')).body, b = (await mk('meas-key-0002', 'Bala')).body;
  assert.equal((await o('POST', '/admin/pos/sales', { idempotencyKey: 'meas-key-0003', items: [{ name: 'Plain item', price: 5000, qty: 1, taxRate: 0 }], paymentMode: 'upi' })).status, 201);
  const all = (await o('GET', '/admin/pos/measurements')).body;
  assert.equal(all.counts.all, 2, 'a bill with no stitching line is not listed'); assert.equal(all.counts.pending, 2);
  const row = all.bills.find(x => x.invoiceNo === a.invoiceNo);
  assert.equal(row.items[0].measure.frontNeck, 'Square'); assert.equal(row.items[0].measure.cm.front_neck, 12);
  assert.equal((await o('PATCH', `/admin/pos/sales/${a.invoiceNo}/tailoring`, { status: 'completed' })).status, 200);
  assert.equal((await o('POST', `/admin/pos/sales/${b.invoiceNo}/void`, { reason: 'test void' })).status, 200);
  const after = (await o('GET', '/admin/pos/measurements')).body;
  assert.deepEqual([after.counts.pending, after.counts.completed, after.counts.cancelled], [0, 1, 1]);
  assert.equal((await o('GET', '/admin/pos/measurements?status=cancelled')).body.bills[0].invoiceNo, b.invoiceNo);
  assert.equal((await o('GET', '/admin/pos/measurements?name=anit')).body.bills.length, 1);
  assert.equal((await o('PATCH', `/admin/pos/sales/${b.invoiceNo}/tailoring`, { status: 'pending' })).status, 409, 'a voided bill stays cancelled');
});

test('stitching orders and overview: bills plus open advance orders, due dates, revenue by garment', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
  const past = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10), soon = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  const m = due => ({ frontNeck: 'Round', backNeck: 'U Neck', cm: { chest: 86 }, dueDate: due });
  const bill = (key, name, price, due) => o('POST', '/admin/pos/sales', { idempotencyKey: key, items: [{ name, price, qty: 1, taxRate: 0, measure: m(due) }], paymentMode: 'cash', customerName: 'Cust ' + key.slice(-1), cashTendered: price });
  assert.equal((await bill('stitch-key-0001', 'Saree blouse', 80000, past)).status, 201);
  assert.equal((await bill('stitch-key-0002', 'Kurti stitching', 60000, soon)).status, 201);
  // an advance order with a stitching line and a deposit: shows as an open order with its balance
  const adv = await o('POST', '/admin/pos/advances', { items: [{ name: 'Lehenga stitching', price: 300000, qty: 1, taxRate: 0, measure: m(soon) }], deposit: 100000, depositMode: 'cash', customerName: 'Adv Customer', customerPhone: '91234567', isGst: false, deliveryFee: 0, discountType: 'fixed', discountValue: 0 });
  assert.equal(adv.status, 201, JSON.stringify(adv.body));
  const ord = (await o('GET', '/admin/pos/stitching/orders')).body;
  const a = ord.orders.find(x => x.kind === 'advance'); assert.equal(a.balance, 200000); assert.equal(a.status, 'pending');
  assert.ok(ord.counts.pending >= 3);
  const ov = (await o('GET', `/admin/pos/stitching/overview?from=${today}&to=${today}`)).body;
  assert.equal(ov.advanceCount >= 1, true); assert.ok(ov.overdue >= 1, 'the bill due 3 days ago is overdue'); assert.ok(ov.dueSoon.some(x => x.dueDate === soon));
  assert.equal(ov.revenue >= 140000, true); assert.ok(ov.byItem.some(x => x.name === 'Saree blouse' && x.qty >= 1)); assert.ok(ov.advanceBalance >= 200000);
});
