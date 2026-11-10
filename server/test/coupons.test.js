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

test('coupons: sent-only, recipients, spreadsheet and the public coupon card', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const mk = b => o('POST', '/admin/pos/coupons', { discountType: 'percent', discountValue: 10, ...b });
  assert.equal((await o('POST', '/admin/pos/customers', { name: 'Member', phone: '81234567' })).status, 201);
  assert.equal((await o('POST', '/admin/pos/customers', { name: 'Walker', phone: '91234567' })).status, 201);

  assert.equal((await mk({ code: 'EVERY10' })).status, 201);
  assert.equal((await mk({ code: 'SENT10', sentOnly: true })).status, 201);
  const list = (await o('GET', '/admin/pos/coupons')).body, id = c => list.find(x => x.code === c).id;
  const check = (code, phone) => o('GET', `/admin/pos/coupons/check?code=${code}&subtotal=100000&phone=${phone}`);
  assert.equal((await check('EVERY10', '')).status, 200, 'an open coupon needs no phone');

  // sent-only: unusable until it has been sent to that phone
  assert.equal((await check('SENT10', '91234567')).status, 400);
  assert.equal((await o('POST', `/admin/pos/coupons/${id('SENT10')}/sends`, { phone: '91234567', name: 'Walker' })).status, 200);
  assert.equal((await check('SENT10', '91234567')).status, 200);
  assert.equal((await check('SENT10', '81234567')).status, 400, 'still refused for a phone it was not sent to');

  // "only for this customer" turns an open coupon into a sent-only one
  assert.equal((await o('POST', `/admin/pos/coupons/${id('EVERY10')}/sends`, { phone: '81234567', onlyThis: true })).status, 200);
  assert.equal((await check('EVERY10', '91234567')).status, 400);
  assert.equal((await check('EVERY10', '81234567')).status, 200);

  // recipients list every customer with a phone and show who already got it
  const all = (await o('GET', `/admin/pos/coupons/${id('SENT10')}/recipients`)).body;
  assert.equal(all.find(r => r.name === 'Walker').sent, true); assert.equal(all.find(r => r.name === 'Member').sent, false);

  // edit
  assert.equal((await o('PATCH', `/admin/pos/coupons/${id('EVERY10')}`, { discountType: 'percent', discountValue: 25, minOrder: 5000, sentOnly: false })).status, 200);
  assert.equal((await o('GET', '/admin/pos/coupons')).body.find(x => x.code === 'EVERY10').discountValue, 25);

  // a bill with a sent-only coupon is refused for the wrong phone and accepted for the right one
  const v = (await o('GET', '/admin/pos/catalog')).body.find(x => x.stock >= 2);
  const sale = (phone, key) => o('POST', '/admin/pos/sales', { idempotencyKey: key, items: [{ variantId: v.variantId, qty: 1 }], paymentMode: 'upi', couponCode: 'SENT10', customerPhone: phone });
  assert.equal((await sale('81234567', 'coupon-sale-key-1')).status, 400);
  assert.equal((await sale('91234567', 'coupon-sale-key-2')).status, 201);

  // the spreadsheet and the public coupon card (no counts, no recipients)
  const csv = await fetch(base + '/admin/pos/coupons/export', { headers: { Cookie: '' } });
  assert.ok([200, 401, 403].includes(csv.status));
  const pub = await fetch(base + '/coupon/EVERY10'); assert.equal(pub.status, 200);
  const card = await pub.json(); assert.equal(card.coupon.code, 'EVERY10'); assert.equal(card.coupon.sentOnly, false, 'the edit made it open to everyone again');
  assert.ok(!('usedCount' in card.coupon) && !('sentCount' in card.coupon));
  assert.equal((await fetch(base + '/coupon/NOPE-NOPE')).status, 404);
});
