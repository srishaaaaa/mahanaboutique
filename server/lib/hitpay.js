import crypto from 'node:crypto';
import { HttpError } from './http.js';

const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y) };
const UUID = /^[0-9a-f-]{8,64}$/i;
const ORDER_NO = /^[A-Za-z0-9_-]{4,40}$/;

// HitPay payment provider (contract: name, configured, testMode, createOrder, confirm, parseWebhook).
// HitPay "payment request": the customer is sent to HitPay's secure page (PayNow, cards...), pays, and returns to
// /checkout?hitpay_order=<order>&reference=<payment request id>&status=... . The browser's word is never trusted:
// confirm() asks HitPay for the payment request and checks it is completed and belongs to that order; the signed webhook is the backup.
export function createHitpayProvider(cfg, fetchImpl = fetch) {
  const key = cfg.HITPAY_API_KEY, salt = cfg.HITPAY_SALT;
  const live = String(cfg.HITPAY_ENV || 'sandbox').toLowerCase() === 'live';
  const base = (cfg.HITPAY_BASE || (live ? 'https://api.hit-pay.com' : 'https://api.sandbox.hit-pay.com')).replace(/\/$/, '');
  const configured = !!key;
  // Which methods to offer. Unset = whatever is switched on for the business in HitPay (asking for one that is not
  // switched on, e.g. card on a new account, makes HitPay reject the whole payment).
  const methods = String(cfg.HITPAY_METHODS || '').split(',').map(s => s.trim()).filter(Boolean);

  async function call(method, path, form) {
    if (!configured) throw new HttpError(503, 'Payments are not configured yet', 'payments_unconfigured');
    const r = await fetchImpl(`${base}/v1${path}`, {
      method,
      headers: { 'X-BUSINESS-API-KEY': key, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      body: form ? form.toString() : undefined,
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('HitPay error:', r.status, body?.message); throw new HttpError(502, 'The payment provider could not process this request', 'provider_error') }
    return body;
  }

  return {
    name: 'hitpay',
    configured,
    testMode: !live,
    async createOrder({ amount, currency, receipt, email, returnUrl }) {
      // HitPay takes decimal amounts (dollars), not cents. The link closes with the stock reservation.
      const minutes = Math.min(Math.max(cfg.RESERVATION_MINUTES, 31), 24 * 60);
      const form = new URLSearchParams();
      form.set('amount', (amount / 100).toFixed(2)); form.set('currency', String(currency).toUpperCase());
      form.set('reference_number', receipt); form.set('purpose', `Order ${receipt}`);
      form.set('redirect_url', `${returnUrl}/checkout?hitpay_order=${encodeURIComponent(receipt)}`);
      if (email) form.set('email', email);
      for (const m of methods) form.append('payment_methods[]', m);
      form.set('expires_after', `${minutes} mins`);
      const s = await call('POST', '/payment-requests', form);
      if (!s?.id || !s?.url) throw new HttpError(502, 'The payment provider could not process this request', 'provider_error');
      return { providerOrderId: s.id, redirectUrl: s.url };
    },
    // Returns the paid request's ids, null while payment is still pending (a PayNow transfer clearing).
    async confirm({ hitpay_order: order, reference }) {
      if (typeof order !== 'string' || !ORDER_NO.test(order) || typeof reference !== 'string' || !UUID.test(reference)) throw new HttpError(400, 'Invalid payment reference', 'bad_signature');
      const s = await call('GET', `/payment-requests/${encodeURIComponent(reference)}`);
      if (String(s.reference_number) !== order) throw new HttpError(400, 'Invalid payment reference', 'bad_signature'); // a different order's payment cannot be used for this one
      const paid = (s.payments || []).find(p => ['succeeded', 'succeeded_manually'].includes(p.status));
      return s.status === 'completed' || paid ? { providerOrderId: s.id, providerPaymentId: paid?.id || s.id } : null;
    },
    // HitPay signs the raw JSON body: header "Hitpay-Signature" = HMAC-SHA256 (hex) with the webhook's salt.
    parseWebhook(raw, header) {
      if (!salt) throw new HttpError(503, 'Webhook secret not configured');
      const expected = crypto.createHmac('sha256', salt).update(raw).digest('hex');
      if (!header || !safeEqual(expected, String(header).trim().toLowerCase())) throw new HttpError(400, 'Bad signature');
      const e = JSON.parse(raw.toString('utf8'));
      if (!e?.id || !('status' in e)) return null;
      const ids = { providerOrderId: e.id, providerPaymentId: (e.payments || [])[0]?.id || e.id };
      if (e.status === 'completed') return { type: 'captured', ...ids };
      if (['failed', 'expired', 'canceled'].includes(e.status)) return { type: 'failed', ...ids };
      return null;
    },
  };
}
