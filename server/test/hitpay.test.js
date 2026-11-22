import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createHitpayProvider } from '../lib/hitpay.js';

// A stand-in HitPay: records what the provider sends and answers like the real API.
function stub(reply) {
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push({ url, ...opts }); const r = reply(url, opts); return { ok: r.ok !== false, status: r.ok === false ? 422 : 200, json: async () => r.body } };
  return { calls, fetchImpl };
}
const cfg = (over = {}) => ({ HITPAY_API_KEY: 'k-test', HITPAY_SALT: 'salty', HITPAY_ENV: 'sandbox', RESERVATION_MINUTES: 35, ...over });
const ID = '9a1f2c3d-4b5e-6f70-8192-a3b4c5d6e7f8';

test('HitPay: creates a payment request in dollars, confirms only a completed request that belongs to the order', async () => {
  const s = stub((url, o) => o.method === 'POST'
    ? { body: { id: ID, url: 'https://securecheckout.sandbox.hit-pay.com/pay/abc', status: 'pending' } }
    : { body: { id: ID, status: 'completed', reference_number: 'MHM-123', payments: [{ id: 'pay-1', status: 'succeeded' }] } });
  const p = createHitpayProvider(cfg(), s.fetchImpl);
  assert.equal(p.name, 'hitpay'); assert.equal(p.configured, true); assert.equal(p.testMode, true);
  const o = await p.createOrder({ amount: 10550, currency: 'sgd', receipt: 'MHM-123', email: 'a@b.sg', returnUrl: 'https://shop.test' });
  assert.deepEqual(o, { providerOrderId: ID, redirectUrl: 'https://securecheckout.sandbox.hit-pay.com/pay/abc' });
  const c = s.calls[0]; assert.equal(c.url, 'https://api.sandbox.hit-pay.com/v1/payment-requests'); assert.equal(c.headers['X-BUSINESS-API-KEY'], 'k-test');
  const f = new URLSearchParams(c.body); assert.equal(f.get('amount'), '105.50', 'dollars, not cents'); assert.equal(f.get('currency'), 'SGD'); assert.equal(f.get('reference_number'), 'MHM-123');
  assert.equal(f.get('redirect_url'), 'https://shop.test/checkout?hitpay_order=MHM-123'); assert.deepEqual(f.getAll('payment_methods[]'), ['paynow_online', 'card']);
  assert.deepEqual(await p.confirm({ hitpay_order: 'MHM-123', reference: ID }), { providerOrderId: ID, providerPaymentId: 'pay-1' });
  // another order's payment cannot be used, and junk is refused before any call
  await assert.rejects(p.confirm({ hitpay_order: 'MHM-999', reference: ID }), /Invalid payment reference/);
  await assert.rejects(p.confirm({ hitpay_order: 'MHM-123', reference: '../x' }), /Invalid payment reference/);
  const live = createHitpayProvider(cfg({ HITPAY_ENV: 'live' }), s.fetchImpl); assert.equal(live.testMode, false);
  await live.createOrder({ amount: 100, currency: 'SGD', receipt: 'MHM-1', returnUrl: 'https://shop.test' }); assert.match(s.calls.at(-1).url, /^https:\/\/api\.hit-pay\.com\/v1\//);
});

test('HitPay: a pending request is not paid; the webhook signature is checked on the raw body', async () => {
  const s = stub(() => ({ body: { id: ID, status: 'pending', reference_number: 'MHM-123', payments: [] } }));
  const p = createHitpayProvider(cfg(), s.fetchImpl);
  assert.equal(await p.confirm({ hitpay_order: 'MHM-123', reference: ID }), null);
  const raw = Buffer.from(JSON.stringify({ id: ID, status: 'completed', reference_number: 'MHM-123', payments: [{ id: 'pay-9', status: 'succeeded' }] }));
  const sig = crypto.createHmac('sha256', 'salty').update(raw).digest('hex');
  assert.deepEqual(p.parseWebhook(raw, sig), { type: 'captured', providerOrderId: ID, providerPaymentId: 'pay-9' });
  assert.throws(() => p.parseWebhook(raw, 'deadbeef'), /Bad signature/);
  assert.throws(() => p.parseWebhook(raw, undefined), /Bad signature/);
  assert.throws(() => p.parseWebhook(Buffer.from(raw.toString().replace('completed', 'failed')), sig), /Bad signature/, 'a changed body fails the signature');
  const failed = Buffer.from(JSON.stringify({ id: ID, status: 'failed' }));
  assert.deepEqual(p.parseWebhook(failed, crypto.createHmac('sha256', 'salty').update(failed).digest('hex')), { type: 'failed', providerOrderId: ID, providerPaymentId: ID });
  assert.throws(() => createHitpayProvider(cfg({ HITPAY_SALT: undefined }), s.fetchImpl).parseWebhook(raw, sig), /not configured/);
});
