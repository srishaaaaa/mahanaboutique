import jwt from 'jsonwebtoken';
import { one } from '../db/index.js';
import { HttpError } from './http.js';

// EasyParcel courier booking. The shop owner connects the account once (OAuth, authorization_code); the site keeps the tokens on the server
// and renews them itself. Everything below talks to https://api.easyparcel.com/open_api/<version>/... (Bearer token).
// Field names follow EasyParcel's published Open API (version 2026-09). Where the docs do not say, the code reads defensively and
// passes EasyParcel's own error message back to the admin, so a mismatch is visible instead of silent.
export const API_VERSION = '2026-09';
const TOKEN_KEY = 'easyparcel_tokens', SETTINGS_KEY = 'easyparcel_settings';
export const DEFAULT_SETTINGS = { pickup: { name: '', phone: '', address1: '', postcode: '', city: 'Singapore' }, parcel: { length: 30, width: 20, height: 10 } };

const getSetting = async (db, key, fallback) => (await one(db, 'SELECT value FROM pos_settings WHERE key = $1', [key]))?.value ?? fallback;
const putSetting = (db, key, value) => db.query('INSERT INTO pos_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()', [key, JSON.stringify(value)]);

export function makeEasyParcel({ db, cfg, fetchImpl = fetch }) {
  const base = (cfg.EASYPARCEL_BASE || 'https://api.easyparcel.com').replace(/\/$/, '');
  const configured = () => !!(cfg.EASYPARCEL_CLIENT_ID && cfg.EASYPARCEL_CLIENT_SECRET);
  const basic = () => 'Basic ' + Buffer.from(`${cfg.EASYPARCEL_CLIENT_ID}:${cfg.EASYPARCEL_CLIENT_SECRET}`).toString('base64');

  // The address EasyParcel sends the owner back to after approving the app. Must be listed in the app's settings in the Developer Hub.
  const redirectUri = req => {
    // On the live site the connection is always https, but behind Vercel's proxy the server may see plain http: never send http for a real domain.
    const host = req.get('host') || '';
    const proto = /^(localhost|127\.|\[::1\])/.test(host) ? (req.get('x-forwarded-proto') || req.protocol).split(',')[0].trim() : 'https';
    const origin = cfg.SITE_URL ? cfg.SITE_URL.replace(/\/$/, '') : `${proto}://${host}`;
    return `${origin}/api/easyparcel/callback`;
  };
  const stateFor = userId => jwt.sign({ u: userId, p: 'easyparcel' }, cfg.JWT_SECRET, { expiresIn: '10m' });
  const readState = s => { try { const d = jwt.verify(String(s || ''), cfg.JWT_SECRET); return d.p === 'easyparcel' ? d : null } catch { return null } };
  const authUrl = (req, userId) => `${base}/oauth/login?` + new URLSearchParams({ client_id: cfg.EASYPARCEL_CLIENT_ID, redirect_uri: redirectUri(req), response_type: 'code', state: stateFor(userId) });

  async function tokenRequest(params) {
    const r = await fetchImpl(`${base}/oauth/token`, { method: 'POST', headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams(params) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.access_token) throw new HttpError(502, `EasyParcel sign-in failed: ${j?.error_description || j?.message || j?.error || r.status}`, 'easyparcel_auth');
    const t = { access: j.access_token, refresh: j.refresh_token || null, expiresAt: Date.now() + (Number(j.expires_in) || 3600) * 1000, connectedAt: Date.now() };
    return t;
  }
  async function connect(code, req) {
    const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(req) });
    await putSetting(db, TOKEN_KEY, t); return t;
  }
  async function accessToken() {
    let t = await getSetting(db, TOKEN_KEY, null);
    if (!t?.access) throw new HttpError(409, 'EasyParcel is not connected yet. Open Delivery and press “Connect EasyParcel”.', 'easyparcel_not_connected');
    if (t.expiresAt - 60_000 < Date.now()) {
      if (!t.refresh) throw new HttpError(409, 'The EasyParcel connection has expired. Please connect it again in Delivery.', 'easyparcel_expired');
      const n = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh });
      t = { ...n, refresh: n.refresh || t.refresh, connectedAt: t.connectedAt }; await putSetting(db, TOKEN_KEY, t);
    }
    return t.access;
  }
  const status = async () => { const t = await getSetting(db, TOKEN_KEY, null); return { configured: configured(), connected: !!t?.access, connectedAt: t?.connectedAt || null, settings: await settings() } };
  const disconnect = () => db.query('DELETE FROM pos_settings WHERE key = $1', [TOKEN_KEY]);
  const settings = async () => { const s = await getSetting(db, SETTINGS_KEY, {}); return { pickup: { ...DEFAULT_SETTINGS.pickup, ...(s.pickup || {}) }, parcel: { ...DEFAULT_SETTINGS.parcel, ...(s.parcel || {}) } } };
  const saveSettings = async v => { await putSetting(db, SETTINGS_KEY, v); return settings() };

  async function api(path, body) {
    const token = await accessToken();
    const r = await fetchImpl(`${base}/open_api/${API_VERSION}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new HttpError(502, `EasyParcel: ${j?.message || j?.error_description || j?.error || `error ${r.status}`}`, 'easyparcel_error');
    return j;
  }

  // ---- helpers shared by quote and booking ----
  const digits = v => String(v || '').replace(/\D/g, '');
  const localPhone = v => { const d = digits(v); return d.length === 10 && d.startsWith('65') ? d.slice(2) : d };
  const kg = grams => Math.max(0.1, Math.round(grams / 10) / 100);

  async function orderForShipping(number) {
    const o = await one(db, `SELECT o.id, o.order_number, o.email, o.status, o.payment_status, o.total_amount, o.shipping_address_snapshot AS addr, to_jsonb(o) -> 'shipment' AS shipment FROM orders o WHERE o.order_number = $1`, [number]);
    if (!o) throw new HttpError(404, 'Order not found');
    if (o.payment_status !== 'paid') throw new HttpError(409, 'Only paid orders can be shipped', 'not_paid');
    const w = await one(db, `SELECT COALESCE(SUM(oi.quantity * COALESCE(v.weight_grams, p.weight_grams, 500)), 0)::int AS g, COALESCE(SUM(oi.quantity), 0)::int AS n,
        string_agg(oi.product_name_snapshot, ', ') AS names FROM order_items oi LEFT JOIN product_variants v ON v.id = oi.variant_id LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`, [o.id]);
    return { ...o, grams: w?.g || 500, units: w?.n || 1, names: w?.names || 'Boutique clothing' };
  }
  function parties(s, o) {
    const a = o.addr || {};
    if (!s.pickup.postcode || !s.pickup.address1) throw new HttpError(409, 'Add the pickup address and postcode in Delivery → EasyParcel first.', 'no_pickup');
    if (!a.pin) throw new HttpError(409, 'This order has no delivery postcode.', 'no_postcode');
    return {
      sender: { name: s.pickup.name || 'Mahana Boutique & Tailors', phone_number_country_code: 'SG', phone_number: localPhone(s.pickup.phone), address_1: s.pickup.address1, postcode: s.pickup.postcode, city: s.pickup.city || 'Singapore', country_code: 'SG' },
      receiver: { name: a.name || 'Customer', phone_number_country_code: 'SG', phone_number: localPhone(a.phone), address_1: [a.line1, a.line2].filter(Boolean).join(', '), postcode: a.pin, city: a.city || 'Singapore', country_code: 'SG' },
    };
  }

  // Courier prices for an order: EasyParcel prices by postcode pair, weight and parcel size.
  async function quotes(number) {
    const [o, s] = [await orderForShipping(number), await settings()]; const { sender, receiver } = parties(s, o);
    const j = await api('/shipment/quotations', { shipment: [{ sender: { postcode: sender.postcode, country: 'SG' }, receiver: { postcode: receiver.postcode, country: 'SG' }, weight: kg(o.grams), length: s.parcel.length, width: s.parcel.width, height: s.parcel.height, parcel_value: Math.round(o.total_amount) / 100 }] });
    const out = [];
    const walk = x => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (x.courier && (x.pricing || x.price) ) out.push(x); else Object.values(x).forEach(walk) } };
    walk(j?.data ?? j);
    return { weightKg: kg(o.grams), quotes: out.map(q => ({ serviceId: String(q.courier?.service_id ?? q.service_id ?? ''), courier: q.courier?.courier_name ?? q.courier?.name ?? q.courier_name ?? 'Courier', price: Number(q.pricing?.total_amount ?? q.price ?? 0), currency: q.pricing?.currency ?? 'SGD' })).filter(q => q.serviceId).sort((a, b) => a.price - b.price) };
  }

  // Books the shipment (paid from the EasyParcel wallet) and keeps the tracking details on the order.
  async function book(number, { serviceId, collectionDate }) {
    const [o, s] = [await orderForShipping(number), await settings()];
    if (o.shipment?.awb || o.shipment?.orderNumber) throw new HttpError(409, 'This order already has a courier booking.', 'already_booked');
    const { sender, receiver } = parties(s, o);
    const j = await api('/shipment/submit_orders', { shipment: [{ reference: o.order_number, service_id: String(serviceId), collection_date: collectionDate, weight: kg(o.grams), height: s.parcel.height, length: s.parcel.length, width: s.parcel.width,
      item: [{ content: String(o.names).slice(0, 80), weight: kg(o.grams), height: s.parcel.height, length: s.parcel.length, width: s.parcel.width, currency_code: 'SGD', value: Math.round(o.total_amount) / 100, quantity: o.units }], sender, receiver, feature: {} }] });
    const d = Array.isArray(j?.data) ? j.data[0] : j?.data; const sh = d?.shipments?.[0] ?? {};
    const shipment = { provider: 'easyparcel', orderNumber: d?.order_details?.order_number ?? null, shipmentNumber: sh.shipment_number ?? null, awb: sh.awb_number ?? null, label: sh.awb_url ?? sh.awb_urls_by_format?.A6 ?? null,
      tracking: sh.tracking_url ?? null, courier: sh.courier?.courier_name ?? sh.courier ?? null, serviceId: String(serviceId), status: sh.status ?? 'booked', collectionDate, price: d?.pricing_breakdown?.total_order_amount ?? null, bookedAt: new Date().toISOString() };
    await save(o.id, shipment); return shipment;
  }
  async function save(orderId, shipment) { await db.query('UPDATE orders SET shipment = $2, updated_at = now() WHERE id = $1', [orderId, JSON.stringify(shipment)]) }

  // Latest tracking for one order (also fills in a tracking number that was not ready at booking time).
  async function refresh(number) {
    const o = await orderForShipping(number); const cur = o.shipment;
    if (!cur?.awb) throw new HttpError(409, 'The courier has not issued a tracking number yet. Try again in a few minutes.', 'no_awb');
    const j = await api('/shipment/tracking_status', { awb_numbers: [cur.awb] });
    const r = j?.data?.results?.[0]; if (!r || r.status === 'not_found') throw new HttpError(404, 'EasyParcel has no tracking for this parcel yet.', 'no_tracking');
    const next = { ...cur, status: r.latest_tracking_status ?? cur.status, statusCode: r.latest_shipment_status_code ?? cur.statusCode, lastEvent: r.latest_event_date ?? cur.lastEvent, log: (r.status_log || []).slice(-12) };
    await save(o.id, next); await advanceOrder(o.id, next.status); return next;
  }
  // Moves the website order forward as the parcel moves (never backwards).
  async function advanceOrder(orderId, text) {
    const t = String(text || '').toLowerCase();
    const to = /deliver/.test(t) && !/out for|attempt|undeliver|fail/.test(t) ? 'delivered' : /transit|pick|collected|dispatch|out for/.test(t) ? 'shipped' : null;
    if (!to) return;
    const order = to === 'delivered' ? ['confirmed', 'packed', 'shipped'] : ['confirmed', 'packed'];
    await db.query('UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 AND status = ANY($3::text[])', [orderId, to, order]);
  }
  // Pushed by EasyParcel (webhook): matched by tracking number, so an unknown number changes nothing.
  async function webhook(p) {
    const awb = p?.awb_number; if (!awb) return false;
    const o = await one(db, `SELECT id, shipment FROM orders WHERE shipment ->> 'awb' = $1`, [String(awb)])
      ?? (p?.shipment_number ? await one(db, `SELECT id, shipment FROM orders WHERE shipment ->> 'shipmentNumber' = $1`, [String(p.shipment_number)]) : null);
    if (!o) return false;
    const text = p.latest_tracking_status ?? p.shipment_status ?? o.shipment.status;
    const next = { ...o.shipment, awb: o.shipment.awb || awb, status: text, statusCode: p.latest_shipment_status_code ?? p.shipment_status_code ?? o.shipment.statusCode, lastEvent: p.event_date ?? p.timestamp ?? o.shipment.lastEvent, ...(Array.isArray(p.status_log) ? { log: p.status_log.slice(-12) } : {}) };
    await save(o.id, next); await advanceOrder(o.id, text); return true;
  }
  return { configured, authUrl, readState, connect, status, disconnect, settings, saveSettings, quotes, book, refresh, webhook, redirectUri };
}
