import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createStripeProvider } from '../lib/stripe.js';

const cfg = { STRIPE_SECRET_KEY: 'sk_test_abc123', STRIPE_WEBHOOK_SECRET: 'whsec_test', RESERVATION_MINUTES: 30 };
const stripe = createStripeProvider(cfg);
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch });

const signed = (payload, secret = 'whsec_test', t = Math.floor(Date.now() / 1000)) => {
  const raw = Buffer.from(JSON.stringify(payload));
  return { raw, header: `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}` };
};
const session = (extra = {}) => ({ data: { object: { object: 'checkout.session', id: 'cs_test_1', payment_intent: 'pi_1', payment_status: 'paid', ...extra } } });

test('stripe: configured only with a real-looking key; test mode from the key', () => {
  assert.equal(stripe.configured, true); assert.equal(stripe.testMode, true);
  assert.equal(createStripeProvider({ ...cfg, STRIPE_SECRET_KEY: undefined }).configured, false);
  assert.equal(createStripeProvider({ ...cfg, STRIPE_SECRET_KEY: 'sk_test_xxx' }).configured, false);
});

test('stripe webhook: only correctly signed, fresh events are accepted', () => {
  const ok = signed({ type: 'checkout.session.completed', ...session() });
  assert.deepEqual(stripe.parseWebhook(ok.raw, ok.header), { type: 'captured', providerOrderId: 'cs_test_1', providerPaymentId: 'pi_1' });
  const forged = signed({ type: 'checkout.session.completed', ...session() }, 'whsec_wrong');
  assert.throws(() => stripe.parseWebhook(forged.raw, forged.header), /Bad signature/);
  const stale = signed({ type: 'checkout.session.completed', ...session() }, 'whsec_test', Math.floor(Date.now() / 1000) - 3600);
  assert.throws(() => stripe.parseWebhook(stale.raw, stale.header), /Stale/);
  assert.throws(() => stripe.parseWebhook(ok.raw, ''), /Bad signature/);
});

test('stripe webhook: PayNow-style async payments, failures and expiry', () => {
  const pending = signed({ type: 'checkout.session.completed', ...session({ payment_status: 'unpaid' }) });
  assert.equal(stripe.parseWebhook(pending.raw, pending.header), null, 'completed but unpaid waits for the async event');
  const later = signed({ type: 'checkout.session.async_payment_succeeded', ...session() });
  assert.equal(stripe.parseWebhook(later.raw, later.header).type, 'captured');
  for (const type of ['checkout.session.async_payment_failed', 'checkout.session.expired']) {
    const e = signed({ type, ...session({ payment_status: 'unpaid' }) });
    assert.equal(stripe.parseWebhook(e.raw, e.header).type, 'failed');
  }
});

test('stripe confirm: asks Stripe, rejects malformed ids, waits on unpaid sessions', async () => {
  await assert.rejects(stripe.confirm({ session_id: '../../charges' }), /Invalid payment reference/);
  let asked;
  globalThis.fetch = async (url, init) => { asked = { url, auth: init.headers.Authorization }; return new Response(JSON.stringify({ id: 'cs_test_1', payment_status: 'paid', payment_intent: 'pi_1' })) };
  assert.deepEqual(await stripe.confirm({ session_id: 'cs_test_1' }), { providerOrderId: 'cs_test_1', providerPaymentId: 'pi_1' });
  assert.equal(asked.url, 'https://api.stripe.com/v1/checkout/sessions/cs_test_1'); assert.equal(asked.auth, 'Bearer sk_test_abc123');
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'cs_test_1', payment_status: 'unpaid' }));
  assert.equal(await stripe.confirm({ session_id: 'cs_test_1' }), null);
});

test('stripe createOrder: SGD session for the server total, returning to the site', async () => {
  let form, headers;
  globalThis.fetch = async (_url, init) => { form = new URLSearchParams(init.body); headers = init.headers; return new Response(JSON.stringify({ id: 'cs_test_9', url: 'https://checkout.stripe.com/c/pay/cs_test_9' })) };
  const r = await stripe.createOrder({ amount: 12345, currency: 'SGD', receipt: 'MH-1', email: 'a@b.sg', returnUrl: 'https://mahana.sg' });
  assert.deepEqual(r, { providerOrderId: 'cs_test_9', redirectUrl: 'https://checkout.stripe.com/c/pay/cs_test_9' });
  assert.equal(form.get('line_items[0][price_data][currency]'), 'sgd');
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '12345');
  assert.equal(form.get('success_url'), 'https://mahana.sg/checkout?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(form.get('client_reference_id'), 'MH-1');
  assert.equal(headers['Idempotency-Key'], 'checkout-MH-1');
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'nope' } }), { status: 400 });
  await assert.rejects(stripe.createOrder({ amount: 1, currency: 'SGD', receipt: 'MH-2', returnUrl: 'https://mahana.sg' }), /could not process/);
});
