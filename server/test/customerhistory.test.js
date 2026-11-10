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

test('customer lookup returns details + address; history lists their bills', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  for (const k of ['hist-key-0001', 'hist-key-0002'])
    assert.equal((await o('POST', '/admin/pos/sales', { idempotencyKey: k, items: [{ name: 'Blouse', price: 10000, qty: 1, taxRate: 0 }], paymentMode: 'cash', customerName: 'Meena', customerPhone: '81234567', customerAddress: '12 Orchard Rd' })).status, 201);
  await o('POST', '/admin/pos/sales', { idempotencyKey: 'hist-key-0003', items: [{ name: 'Other', price: 500, qty: 1, taxRate: 0 }], paymentMode: 'cash', customerName: 'Someone', customerPhone: '90000000' });
  const c = (await o('GET', '/admin/pos/customers/lookup?phone=81234567')).body;
  assert.equal(c.name, 'Meena'); assert.equal(c.address, '12 Orchard Rd');
  const hr = await o('GET', `/admin/pos/customers/${c.id}/history`); const h = hr.body; assert.equal(hr.status, 200, JSON.stringify(hr.body));
  assert.equal(h.sales.length, 2); assert.equal(h.totals.bills, 2); assert.equal(h.totals.spent, 20000); assert.equal(h.address, '12 Orchard Rd');
  assert.equal((await o('GET', '/admin/pos/customers/99999/history')).status, 404);
});
