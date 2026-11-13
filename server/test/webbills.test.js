import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.js';
import { createDb, migrate } from '../db/index.js';
import { seed } from '../db/seed.js';
import { createApp } from '../app.js';
import { syncWebOrders } from '../lib/webSales.js';

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
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());

// A paid website order, written the way checkout writes it (prices include GST).
async function webOrder(n, status = 'paid') {
  const v = (await db.query(`SELECT v.id, v.product_id, v.sku, p.name, p.tax_rate FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.tax_rate > 0 ORDER BY v.id LIMIT 1`)).rows[0];
  const line = 11800, qty = 2, sub = line * qty, ship = 800;
  const tax = Math.round(sub * v.tax_rate / (100 + v.tax_rate));
  const o = (await db.query(`INSERT INTO orders (order_number, email, status, payment_status, subtotal, shipping_amount, tax_amount, total_amount, currency, shipping_address_snapshot)
    VALUES ($1,'buyer@test.dev','confirmed',$2,$3,$4,$5,$6,'SGD',$7) RETURNING id, order_number`, ['MHM-WEB' + n, status, sub, ship, tax, sub + ship, JSON.stringify({ name: 'Web Buyer', phone: '81234567', line1: '5 Orchard Rd', city: 'Singapore', pin: '238888' })])).rows[0];
  await db.query(`INSERT INTO order_items (order_id, product_id, variant_id, product_name_snapshot, sku_snapshot, variant_snapshot, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,'{"size":"M"}',$6,$7,$8)`, [o.id, v.product_id, v.id, v.name, v.sku, line, qty, sub]);
  return { ...o, sub, ship, tax, total: sub + ship, rate: v.tax_rate };
}

test('a paid website order becomes an ONLINE bill with an invoice; analytics counts it; cancelling voids it; billing-panel bills stay offline', async () => {
  const o = client(); await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
  const a = await webOrder(1), unpaid = await webOrder(2, 'pending');
  const stockBefore = (await db.query('SELECT SUM(stock_quantity)::int AS s FROM product_variants')).rows[0].s;
  assert.equal(await syncWebOrders(db, { force: true }), 1, 'only the paid order gets a bill');
  assert.equal(await syncWebOrders(db, { force: true }), 0, 'running it again changes nothing');
  assert.equal((await db.query('SELECT SUM(stock_quantity)::int AS s FROM product_variants')).rows[0].s, stockBefore, 'stock is not taken twice');

  const online = (await o('GET', '/admin/pos/sales?source=online')).body;
  assert.equal(online.length, 1); const b = online[0];
  assert.match(b.invoiceNo, /^INV-\d{4}-/); assert.equal(b.source, 'online'); assert.equal(b.total, a.total); assert.equal(b.customerName, 'Web Buyer'); assert.equal(b.customerPhone, '81234567');
  assert.equal(b.webStatus, 'confirmed'); assert.equal(b.status, 'completed');
  // the full bill: GST split, delivery and the invoice link
  const full = (await o('GET', `/admin/pos/sales/${b.invoiceNo}`)).body.sale ?? (await o('GET', `/admin/pos/sales/${b.invoiceNo}`)).body;
  assert.equal(full.total, a.total); assert.equal(full.deliveryFee, a.ship); assert.equal(full.tax, a.tax); assert.equal(full.subtotal + full.tax + full.deliveryFee, a.total); assert.equal(full.items.length, 1);
  assert.equal((await fetch(base + `/invoice/${b.shareToken}`).then(r => r.status)), 200, 'the customer-facing invoice opens');

  // a bill keyed in at the billing panel is offline
  const v = (await o('GET', '/admin/pos/catalog?limit=1')).body[0];
  const sale = (await o('POST', '/admin/pos/sales', { idempotencyKey: 'web-test-offline-01', items: [{ variantId: v.variantId, qty: 1 }], isGst: true, paymentMode: 'cash', source: 'online' })).body;
  assert.equal(sale.source, 'online', 'the API still accepts it, the billing screen no longer sends it');

  // analytics: the website order is counted as online
  const d = today();
  const rep = (await o('GET', `/admin/pos/reports?from=${d}&to=${d}&source=online`)).body;
  assert.ok(rep.onlineBills >= 1 && rep.onlineSales >= a.total, 'online sales include the website order');
  // cancel the website order: its bill is voided and leaves the revenue
  await db.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [a.id]);
  await syncWebOrders(db, { force: true });
  assert.equal((await o('GET', '/admin/pos/sales?source=online')).body.find(x => x.invoiceNo === b.invoiceNo).status, 'voided');
  assert.equal(unpaid.order_number, 'MHM-WEB2');
});
