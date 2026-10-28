import crypto from 'node:crypto';
import { HttpError } from './http.js';

const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y) };
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

// Payment provider contract: name, configured, testMode, createOrder(), confirm(), parseWebhook().
// Stripe Checkout: the customer pays on Stripe's hosted page (PayNow, cards, GrabPay, Apple/Google Pay, whichever
// are switched on in the Stripe Dashboard), then returns to /checkout?session_id=… . The browser's word is never
// trusted: confirm() asks Stripe directly, and the signed webhook is the backup.
export function createStripeProvider(cfg) {
  const key = cfg.STRIPE_SECRET_KEY;
  const configured = !!(key && /^(sk|rk)_(test|live)_/.test(key) && !key.endsWith('_xxx'));

  async function stripe(method, path, form, idempotencyKey) {
    if (!configured) throw new HttpError(503, 'Payments are not configured yet', 'payments_unconfigured');
    const r = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
      body: form ? new URLSearchParams(form).toString() : undefined,
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Stripe error:', r.status, body?.error?.message);
      throw new HttpError(502, 'The payment provider could not process this request', 'provider_error');
    }
    return body;
  }

  return {
    name: 'stripe',
    configured,
    testMode: !!key?.includes('_test_'),
    async createOrder({ amount, currency, receipt, email, returnUrl }) {
      // Stripe keeps a Checkout Session open for at least 30 minutes; it closes with the stock reservation (RESERVATION_MINUTES).
      const minutes = Math.min(Math.max(cfg.RESERVATION_MINUTES, 31), 24 * 60);
      const s = await stripe('POST', '/checkout/sessions', {
        mode: 'payment',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': String(currency).toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(amount),
        'line_items[0][price_data][product_data][name]': `Order ${receipt}`,
        client_reference_id: receipt,
        'metadata[order_number]': receipt,
        'payment_intent_data[metadata][order_number]': receipt,
        ...(email ? { customer_email: email } : {}),
        success_url: `${returnUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/checkout?cancelled=${encodeURIComponent(receipt)}`,
        expires_at: String(Math.floor(Date.now() / 1000) + minutes * 60),
      }, `checkout-${receipt}`);
      return { providerOrderId: s.id, redirectUrl: s.url };
    },
    // Returns the paid session's ids, null while payment is still pending (e.g. a PayNow transfer clearing).
    async confirm({ session_id: id }) {
      if (typeof id !== 'string' || !SESSION_ID.test(id)) throw new HttpError(400, 'Invalid payment reference', 'bad_signature');
      const s = await stripe('GET', `/checkout/sessions/${id}`);
      return s.payment_status === 'paid' ? { providerOrderId: s.id, providerPaymentId: s.payment_intent || s.id } : null;
    },
    parseWebhook(raw, header) {
      const secret = cfg.STRIPE_WEBHOOK_SECRET;
      if (!secret) throw new HttpError(503, 'Webhook secret not configured');
      const parts = String(header || '').split(',').map(p => p.split('='));
      const t = parts.find(([k]) => k === 't')?.[1];
      const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
      if (!t || !sigs.length) throw new HttpError(400, 'Bad signature');
      if (Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new HttpError(400, 'Stale webhook');
      const expected = hmac(secret, `${t}.${raw.toString('utf8')}`);
      if (!sigs.some(s => safeEqual(expected, s))) throw new HttpError(400, 'Bad signature');
      const e = JSON.parse(raw.toString('utf8')); const s = e.data?.object;
      if (!s || s.object !== 'checkout.session') return null;
      const ids = { providerOrderId: s.id, providerPaymentId: s.payment_intent || s.id };
      if (e.type === 'checkout.session.completed' && s.payment_status === 'paid') return { type: 'captured', ...ids };
      if (e.type === 'checkout.session.async_payment_succeeded') return { type: 'captured', ...ids };
      if (e.type === 'checkout.session.async_payment_failed' || e.type === 'checkout.session.expired') return { type: 'failed', ...ids };
      return null;
    },
  };
}
