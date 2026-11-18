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

test('stitching designs: the owner adds neck designs and sleeve options; cashiers read them but cannot change them', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  await o('POST', '/admin/users', { email: 'cash@test.dev', password: 'CashPass12345!', name: 'Cash', role: 'cashier' });
  const c = client(); await c('POST', '/auth/login', { email: 'cash@test.dev', password: 'CashPass12345!' });
  assert.deepEqual((await o('GET', '/admin/pos/stitch-designs')).body, { front: [], back: [], sleeveTypes: [], sleeveLengths: [] });
  const put = await o('PUT', '/admin/pos/stitch-designs', { front: [{ id: 'a1', name: 'Princess cut', image: null }], back: [], sleeveTypes: ['Cap sleeve'], sleeveLengths: ['Wrist'] });
  assert.equal(put.status, 200);
  const got = (await c('GET', '/admin/pos/stitch-designs')).body;
  assert.equal(got.front[0].name, 'Princess cut'); assert.deepEqual(got.sleeveTypes, ['Cap sleeve']); assert.deepEqual(got.sleeveLengths, ['Wrist']);
  assert.equal((await c('PUT', '/admin/pos/stitch-designs', { front: [], back: [], sleeveTypes: [], sleeveLengths: [] })).status, 403);
  assert.equal((await o('PUT', '/admin/pos/stitch-designs', { front: [{ id: 'x', name: '', image: null }], back: [] })).status, 400, 'a design needs a name');
});
