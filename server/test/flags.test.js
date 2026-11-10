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

test('New Arrival and Best Seller flags: set when adding, shown as home shelves (newest first), editable, low-stock level and variant price saved', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const pub = flag => fetch(base + `/products?flag=${flag}&sort=newest&limit=4`).then(r => r.json());
  const before = { n: (await pub('new')).total, b: (await pub('best')).total };
  const mk = (slug, extra) => o('POST', '/admin/products', { slug, name: slug, price: 12000, gst_rate: 9, status: 'active', variants: [{ sku: slug.toUpperCase(), size: 'M', color: 'Red', stock: 3, price: 15000 }], ...extra });
  const a = await mk('flag-one', { new_arrival: true, best_seller: true, low_stock_alert: 7, material: 'Cotton' }); assert.equal(a.status, 201);
  const b = await mk('flag-two', { new_arrival: true }); assert.equal(b.status, 201);
  const n = await pub('new'); assert.equal(n.total, before.n + 2); assert.equal(n.items[0].slug, 'flag-two', 'newest first');
  assert.equal((await pub('best')).total, before.b + 1);
  const list = (await o('GET', '/admin/pos/products?q=flag-one')).body.find(p => p.slug === 'flag-one');
  assert.equal(list.lowAlert, 7); assert.equal(list.newArrival, true); assert.equal(list.bestSeller, true); assert.equal(list.variants[0].price, 15000, 'own price saved on the size');
  assert.equal((await o('PATCH', `/admin/pos/products/${list.id}`, { name: 'flag-one', price: 12000, taxRate: 9, status: 'active', newArrival: false })).status, 200);
  assert.equal((await pub('new')).total, before.n + 1);
});
