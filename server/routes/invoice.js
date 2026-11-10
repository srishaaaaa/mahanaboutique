import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError, wrap } from '../lib/http.js';
import { one } from '../db/index.js';
import { getSaleByToken, shopInfo } from '../lib/pos.js';
import { getReturnByToken } from '../lib/returns.js';

// The shareable invoice link (WhatsApp / copy link). Anyone holding the unguessable token can read that one invoice, nothing else:
// no internal ids, no cashier, no date of birth, no payment reference. Never cached.
export default function invoicePublic({ db }) {
  const r = Router();
  const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again shortly.' } });
  r.get('/invoice/:token', limiter, wrap(async (req, res) => {
    const s = await getSaleByToken(db, req.params.token);
    if (!s) {
      // a return invoice (credit note) link
      const rt = await getReturnByToken(db, req.params.token);
      if (!rt) throw new HttpError(404, 'This invoice link is not valid');
      res.set('Cache-Control', 'no-store');
      const strip = ({ id, ...rest }) => rest; // no internal ids on a shared link
      const { id: _a, saleId: _b, ...pub } = rt;
      return res.json({ kind: 'return', shop: await shopInfo(db), ret: { ...pub, returned: rt.returned.map(strip), kept: rt.kept.map(strip) } });
    }
    res.set('Cache-Control', 'no-store');
    res.json({
      shop: await shopInfo(db),
      sale: { invoiceNo: s.invoiceNo, status: s.status, channel: s.channel, source: s.source, billDate: s.billDate, createdAt: s.createdAt, customerName: s.customerName, customerPhone: s.customerPhone,
        customerAddress: s.customerAddress, isGst: s.isGst, gstRate: s.gstRate, subtotal: s.subtotal, discount: s.discount, discountType: s.discountType, discountValue: s.discountValue,
        couponCode: s.couponCode, tax: s.tax, deliveryFee: s.deliveryFee, total: s.total, paymentMode: s.paymentMode, payCash: s.payCash, payUpi: s.payUpi, payCard: s.payCard,
        cashTendered: s.cashTendered, change: s.change, notes: s.notes, items: s.items.map(({ id: _i, ...it }) => it), returns: (s.returns || []).map(({ items, ...r }) => ({ ...r, items })), ...(s.advance ? { advance: s.advance } : {}) },
    });
  }));
  // The coupon card a customer opens from WhatsApp: only what is printed on the coupon, never usage counts or who it was sent to.
  r.get('/coupon/:code', limiter, wrap(async (req, res) => {
    const c = await one(db, 'SELECT code, discount_type, discount_value, min_order, expires_on::text AS expires_on, active, sent_only FROM pos_coupons WHERE upper(code) = upper($1)', [String(req.params.code).slice(0, 40)]);
    if (!c) throw new HttpError(404, 'This coupon link is not valid');
    res.set('Cache-Control', 'no-store');
    const shop = await shopInfo(db);
    res.json({ shop: { name: shop.name, phone: shop.phone }, coupon: { code: c.code, discountType: c.discount_type, discountValue: c.discount_value, minOrder: c.min_order, expiresOn: c.expires_on, active: c.active && !(c.expires_on && c.expires_on < new Date().toISOString().slice(0, 10)), sentOnly: c.sent_only } });
  }));
  return r;
}
