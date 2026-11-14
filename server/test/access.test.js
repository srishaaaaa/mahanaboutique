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
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
  const rep = `/admin/pos/reports?from=${today}&to=${today}`;
  assert.equal((await cash('GET', rep)).status, 403, 'analytics is not a cashier page by default');
  // the owner gives cashiers Analytics (the server follows), and tries Users, which can never be handed out
  const put = await o('PUT', '/admin/access', { cashier: ['/admin/billing', '/admin/billing/analytics', '/admin/users'], inventory: ['/admin/billing/inventory', '/admin/billing'], admin: ['/admin/orders'] });
  assert.equal(put.status, 200); assert.deepEqual(put.body.config.cashier, ['/admin/billing', '/admin/billing/analytics'], 'Users cannot be granted');
  assert.deepEqual((await cash('GET', '/admin/access')).body.allowed, ['/admin/billing', '/admin/billing/analytics']);
  assert.equal((await cash('GET', rep)).status, 200, 'the granted page opens its data');
  assert.equal((await cash('GET', '/admin/users')).status, 403, 'an ungranted page stays closed');
  assert.equal((await cash('PATCH', '/admin/users/1/role', { role: 'owner' })).status, 403);
  assert.equal((await inv('GET', '/admin/pos/shop')).status, 200, 'stock staff given Billing can use the billing routes');
  assert.equal((await inv('GET', rep)).status, 403);
  // taking it back closes it again
  await o('PUT', '/admin/access', { cashier: ['/admin/billing'], inventory: ['/admin/billing/inventory'], admin: ['/admin/orders'] });
  assert.equal((await cash('GET', rep)).status, 403);
  assert.ok((await o('GET', '/admin/access')).body.allowed.length > 10, 'the owner always sees everything');
  // an admin sets all three columns, just like the owner
  await o('POST', '/admin/users', { email: 'adm@test.dev', password: 'AdminPass12345!', name: 'Adm', role: 'admin' });
  const adm = client(); await adm('POST', '/auth/login', { email: 'adm@test.dev', password: 'AdminPass12345!' });
  const a = await adm('PUT', '/admin/access', { admin: [], cashier: ['/admin/billing', '/admin/billing/orders'], inventory: [] });
  assert.equal(a.status, 200); assert.deepEqual(a.body.config.cashier, ['/admin/billing', '/admin/billing/orders']); assert.deepEqual(a.body.config.admin, [], 'an admin can change the Admin column too');
  assert.equal((await cash('PUT', '/admin/access', { cashier: [] })).status, 403);
});
