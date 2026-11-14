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

test('staff access: defaults per role, the owner configures within each role ceiling', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  await o('POST', '/admin/users', { email: 'inv@test.dev', password: 'InvPass123456!', name: 'Inv', role: 'inventory' });
  await o('POST', '/admin/users', { email: 'cash@test.dev', password: 'CashPass12345!', name: 'Cash', role: 'cashier' });
  const inv = client(); await inv('POST', '/auth/login', { email: 'inv@test.dev', password: 'InvPass123456!' });
  const cash = client(); await cash('POST', '/auth/login', { email: 'cash@test.dev', password: 'CashPass12345!' });
  assert.deepEqual((await inv('GET', '/admin/access')).body.allowed, ['/admin/billing/inventory'], 'inventory staff get a page of their own');
  assert.ok((await cash('GET', '/admin/access')).body.allowed.includes('/admin/billing'));
  assert.equal((await cash('GET', '/admin/access')).body.sections, undefined, 'only the owner sees the configuration');
  assert.equal((await cash('PUT', '/admin/access', { cashier: ['/admin/billing'] })).status, 403);
  // the owner tries to give cashiers Analytics and Inventory, which are above their ceiling
  const put = await o('PUT', '/admin/access', { cashier: ['/admin/billing', '/admin/billing/analytics', '/admin/billing/inventory'], inventory: ['/admin/billing/inventory'], admin: ['/admin/orders'] });
  assert.equal(put.status, 200); assert.deepEqual(put.body.config.cashier, ['/admin/billing'], 'grants beyond a role ceiling are dropped');
  assert.deepEqual((await cash('GET', '/admin/access')).body.allowed, ['/admin/billing']);
  assert.ok((await o('GET', '/admin/access')).body.allowed.length > 10, 'the owner always sees everything');
});
