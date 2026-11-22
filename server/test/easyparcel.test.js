import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig } from '../config.js';
import { createDb, migrate } from '../db/index.js';
import { seed } from '../db/seed.js';
import { createApp } from '../app.js';

// A stand-in for EasyParcel: token endpoint, quotations, submit_orders and tracking. Nothing real is called.
const calls = [];
let stub, stubUrl;
before(async () => {
  stub = http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      calls.push({ url: req.url, auth: req.headers.authorization, body }); res.setHeader('Content-Type', 'application/json');
      if (req.url === '/oauth/token') return res.end(JSON.stringify({ access_token: 'AT-1', refresh_token: 'RT-1', expires_in: 36000 }));
      if (req.url.endsWith('/shipment/quotations')) return res.end(JSON.stringify({ data: [{ quotations: [{ courier: { service_id: 'EP-SV-1', courier_name: 'Ninja Van' }, pricing: { total_amount: 4.5, currency: 'SGD' } }, { courier: { service_id: 'EP-SV-2', courier_name: 'J&T' }, pricing: { total_amount: 3.9, currency: 'SGD' } }] }] }));
      if (req.url.endsWith('/shipment/submit_orders')) return res.end(JSON.stringify({ data: [{ order_details: { order_number: 'EPO-1' }, pricing_breakdown: { total_order_amount: 3.9 }, shipments: [{ shipment_number: 'SH-1', awb_number: 'AWB123', awb_url: 'https://labels.test/AWB123.pdf', tracking_url: 'https://track.test/AWB123', courier: { courier_name: 'J&T' }, status: 'booked' }] }] }));
      if (req.url.endsWith('/shipment/tracking_status')) return res.end(JSON.stringify({ data: { results: [{ status: 'success', awb_number: 'AWB123', latest_tracking_status: 'In transit', latest_event_date: '2026-11-23', status_log: [{ tracking_status: 'In transit' }] }] } }));
      res.statusCode = 404; res.end('{}');
    });
  });
  await new Promise(r => stub.listen(0, r)); stubUrl = `http://localhost:${stub.address().port}`;
});
after(() => stub.close());

const baseEnv = () => ({ NODE_ENV: 'test', JWT_SECRET: 'test-secret-test-secret-123456', PGLITE_DIR: 'memory', ADMIN_EMAIL: 'owner@test.dev', ADMIN_PASSWORD: 'OwnerPass123!', EASYPARCEL_CLIENT_ID: 'cid', EASYPARCEL_CLIENT_SECRET: 'csecret', EASYPARCEL_BASE: stubUrl, SITE_URL: 'https://shop.test' });

test('EasyParcel: connect (OAuth), settings, quotes, booking, webhook and tracking', async () => {
  const cfg = loadConfig(baseEnv()); const db = await createDb(cfg); await migrate(db, () => {}); await seed(db, cfg, () => {});
  const server = createApp({ db, cfg, payments: {} }).listen(0); const base = `http://localhost:${server.address().port}/api`;
  try {
    const jar = new Map();
    const o = async (method, path, body) => {
      const r = await fetch(base + path, { method, redirect: 'manual', body: body && JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'dhanya', Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } });
      for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); v ? jar.set(k, v) : jar.delete(k) }
      return { status: r.status, body: await r.json().catch(() => null), loc: r.headers.get('location') };
    };
    const hook = body => fetch(base + '/easyparcel/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const orderStatus = async n => (await db.query('SELECT status FROM orders WHERE order_number = $1', [n])).rows[0].status;
    await o('POST', '/auth/login', { email: 'owner@test.dev', password: 'OwnerPass123!' });
    const st = (await o('GET', '/admin/easyparcel/status')).body; assert.equal(st.configured, true); assert.equal(st.connected, false);
    // connect: the owner is sent to EasyParcel, which sends them back with a code
    const c = (await o('GET', '/admin/easyparcel/connect')).body;
    assert.match(c.url, /\/oauth\/login\?client_id=cid&redirect_uri=/); assert.equal(c.redirectUri, 'https://shop.test/api/easyparcel/callback');
    const state = new URL(c.url).searchParams.get('state');
    assert.match((await o('GET', '/easyparcel/callback?code=abc&state=forged')).loc, /easyparcel=failed/, 'a forged state is refused');
    assert.match((await o('GET', `/easyparcel/callback?code=abc&state=${state}`)).loc, /easyparcel=connected/);
    assert.equal(calls.find(x => x.url === '/oauth/token').auth, 'Basic ' + Buffer.from('cid:csecret').toString('base64'));
    assert.equal((await o('GET', '/admin/easyparcel/status')).body.connected, true);
    // a paid order
    const v = (await db.query('SELECT v.id, v.product_id, p.name FROM product_variants v JOIN products p ON p.id = v.product_id ORDER BY v.id LIMIT 1')).rows[0];
    const ord = (await db.query(`INSERT INTO orders (order_number, email, status, payment_status, subtotal, shipping_amount, tax_amount, total_amount, currency, shipping_address_snapshot) VALUES ('MHM-EP1','b@test.dev','packed','paid',10000,500,0,10500,'SGD',$1) RETURNING id`, [JSON.stringify({ name: 'Asha', phone: '+65 8123 4567', line1: '5 Orchard Rd', city: 'Singapore', pin: '238888' })])).rows[0];
    await db.query(`INSERT INTO order_items (order_id, product_id, variant_id, product_name_snapshot, sku_snapshot, variant_snapshot, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,'S','{"size":"M"}',10000,2,20000)`, [ord.id, v.product_id, v.id, v.name]);
    // quotes need the pickup address first
    assert.equal((await o('POST', '/admin/orders/MHM-EP1/shipment/quotes')).status, 409);
    assert.equal((await o('PUT', '/admin/easyparcel/settings', { pickup: { name: 'Mahana', phone: '69791072', address1: '1 Tessensohn Rd #01-03', postcode: '217701', city: 'Singapore' }, parcel: { length: 30, width: 20, height: 10 } })).status, 200);
    const q = (await o('POST', '/admin/orders/MHM-EP1/shipment/quotes')).body;
    assert.deepEqual(q.quotes.map(x => x.courier), ['J&T', 'Ninja Van'], 'cheapest first'); assert.ok(q.weightKg > 0);
    const qb = JSON.parse(calls.filter(x => x.url.endsWith('/quotations')).at(-1).body).shipment[0];
    assert.equal(qb.sender.postcode, '217701'); assert.equal(qb.receiver.postcode, '238888'); assert.equal(qb.length, 30);
    // book the cheapest
    const bk = await o('POST', '/admin/orders/MHM-EP1/shipment', { serviceId: 'EP-SV-2', collectionDate: '2026-11-25' });
    assert.equal(bk.status, 201); assert.equal(bk.body.awb, 'AWB123'); assert.equal(bk.body.label, 'https://labels.test/AWB123.pdf');
    const sb = JSON.parse(calls.filter(x => x.url.endsWith('/submit_orders')).at(-1).body).shipment[0];
    assert.equal(sb.reference, 'MHM-EP1'); assert.equal(sb.receiver.phone_number, '81234567', 'the +65 prefix is dropped'); assert.equal(sb.service_id, 'EP-SV-2');
    assert.equal((await o('POST', '/admin/orders/MHM-EP1/shipment', { serviceId: 'EP-SV-2', collectionDate: '2026-11-25' })).status, 409, 'one booking per order');
    assert.equal((await o('GET', '/admin/orders')).body.find(x => x.order_number === 'MHM-EP1').shipment.awb, 'AWB123');
    // tracking pushed by EasyParcel moves the order forward; an unknown number changes nothing
    assert.equal((await hook({ topic: 'shipment.tracking.update', awb_number: 'NOPE', latest_tracking_status: 'Delivered' })).status, 200);
    assert.equal(await orderStatus('MHM-EP1'), 'packed');
    await hook({ topic: 'shipment.tracking.update', awb_number: 'AWB123', latest_tracking_status: 'In transit' }); assert.equal(await orderStatus('MHM-EP1'), 'shipped');
    await hook({ topic: 'shipment.tracking.update', awb_number: 'AWB123', latest_tracking_status: 'Delivered' }); assert.equal(await orderStatus('MHM-EP1'), 'delivered');
    assert.equal((await o('POST', '/admin/orders/MHM-EP1/shipment/refresh')).body.awb, 'AWB123');
    // an unpaid order cannot be shipped; disconnect clears the link
    await db.query(`INSERT INTO orders (order_number, email, status, payment_status, subtotal, shipping_amount, tax_amount, total_amount, currency, shipping_address_snapshot) VALUES ('MHM-EP2','c@test.dev','confirmed','pending',100,0,0,100,'SGD','{}')`);
    assert.equal((await o('POST', '/admin/orders/MHM-EP2/shipment/quotes')).status, 409);
    await o('POST', '/admin/easyparcel/disconnect'); assert.equal((await o('GET', '/admin/easyparcel/status')).body.connected, false);
  } finally { server.close(); await db.close() }
});
