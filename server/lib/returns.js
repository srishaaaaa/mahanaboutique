import crypto from 'node:crypto';
import { rows, one } from '../db/index.js';
import { HttpError } from './http.js';
import { audit } from './orders.js';

// Return invoices (credit notes). A return is made against one completed bill: choose the items and quantities that came back, and the
// refund is worked out from what the customer actually paid for them (price, less their share of the discount, plus their GST).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rand = n => Array.from(crypto.randomBytes(n), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
const year = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date()).slice(0, 4);

// What has already been returned per bill line: { itemId: { qty, line, discount, tax } }.
export async function returnedByItem(q, saleId) {
  const r = await rows(q, `SELECT ri.sale_item_id AS id, SUM(ri.quantity)::int AS qty, SUM(ri.line_total)::int AS line, SUM(ri.discount)::int AS discount, SUM(ri.tax)::int AS tax
    FROM pos_return_items ri JOIN pos_returns r ON r.id = ri.return_id WHERE r.sale_id = $1 GROUP BY ri.sale_item_id`, [saleId]);
  return Object.fromEntries(r.map(x => [x.id, x]));
}

export async function createReturn(db, user, invoice, { items, reason, refundMode }) {
  const returnNo = await db.tx(async t => {
    const s = await one(t, 'SELECT id, status, is_gst, payment_mode FROM pos_sales WHERE invoice_no = $1 FOR UPDATE', [invoice]);
    if (!s) throw new HttpError(404, 'Invoice not found');
    if (s.status === 'voided') throw new HttpError(409, 'A voided invoice cannot have returns', 'voided');
    const lines = await rows(t, 'SELECT id, variant_id, quantity, line_total, discount_alloc, tax_amount FROM pos_sale_items WHERE sale_id = $1', [s.id]);
    const done = await returnedByItem(t, s.id);
    const picked = [];
    for (const it of items) {
      const l = lines.find(x => x.id === it.itemId);
      if (!l) throw new HttpError(400, 'One of the items is not on this invoice', 'bad_item');
      const prev = done[l.id] ?? { qty: 0, line: 0, discount: 0, tax: 0 };
      const left = l.quantity - prev.qty;
      if (it.qty < 1 || it.qty > left) throw new HttpError(400, left < 1 ? 'That item has already been fully returned' : `Only ${left} left to return on that item`, 'too_many');
      const last = it.qty === left; // the last unit takes the remainder, so the parts always add up to the original line exactly
      const part = (full, got) => last ? full - got : Math.round(full * it.qty / l.quantity);
      picked.push({ l, qty: it.qty, line: part(l.line_total, prev.line), discount: part(l.discount_alloc, prev.discount), tax: part(l.tax_amount, prev.tax) });
    }
    if (!picked.length) throw new HttpError(400, 'Choose at least one item to return', 'empty');
    const subtotal = picked.reduce((a, p) => a + p.line, 0), discount = picked.reduce((a, p) => a + p.discount, 0), tax = picked.reduce((a, p) => a + p.tax, 0);
    const total = subtotal - discount + tax;
    const no = `RET-${year()}-${rand(5)}`;
    const ret = await one(t, `INSERT INTO pos_returns (return_no, sale_id, reason, refund_mode, subtotal, discount, tax, total, share_token, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [no, s.id, reason ?? '', refundMode, subtotal, discount, tax, total, crypto.randomBytes(16).toString('hex'), user.id]);
    for (const p of picked) {
      await t.query('INSERT INTO pos_return_items (return_id, sale_item_id, quantity, line_total, discount, tax) VALUES ($1,$2,$3,$4,$5,$6)', [ret.id, p.l.id, p.qty, p.line, p.discount, p.tax]);
      if (p.l.variant_id) {
        await t.query('UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2', [p.qty, p.l.variant_id]);
        await t.query('INSERT INTO inventory_movements (variant_id, quantity_change, reason, reference_id) VALUES ($1,$2,$3,$4)', [p.l.variant_id, p.qty, 'pos_return', no]);
      }
    }
    await audit(t, user.id, 'pos.return', 'pos_return', no, { invoice, total });
    return no;
  });
  return getReturn(db, returnNo);
}

// The return invoice with the original bill's lines: what was returned, and what the customer kept.
export async function getReturn(q, returnNo) {
  const r = await one(q, `SELECT r.id, r.return_no AS "returnNo", r.reason, r.refund_mode AS "refundMode", r.subtotal, r.discount, r.tax, r.total, r.share_token AS "shareToken", r.created_at AS "createdAt",
      s.id AS "saleId", s.invoice_no AS "invoiceNo", s.bill_date::text AS "billDate", s.created_at AS "saleCreatedAt", s.customer_name AS "customerName", s.customer_phone AS "customerPhone",
      s.customer_address AS "customerAddress", s.is_gst AS "isGst", s.gst_rate AS "gstRate", s.channel, s.source, s.total_amount AS "saleTotal", s.payment_mode AS "salePaymentMode",
      s.pay_cash AS "payCash", s.pay_upi AS "payUpi", s.pay_card AS "payCard", s.delivery_fee AS "deliveryFee", s.coupon_code AS "couponCode"
    FROM pos_returns r JOIN pos_sales s ON s.id = r.sale_id WHERE r.return_no = $1`, [returnNo]);
  if (!r) return null;
  const items = await rows(q, `SELECT i.id, i.name_snapshot AS name, i.variant_snapshot AS variant, i.unit_price AS "unitPrice", i.quantity, i.line_total AS "lineTotal", i.discount_alloc AS discount, i.tax_rate AS "taxRate", i.tax_amount AS tax
    FROM pos_sale_items i WHERE i.sale_id = $1 ORDER BY i.id`, [r.saleId]);
  const mine = Object.fromEntries((await rows(q, 'SELECT sale_item_id AS id, quantity, line_total AS line, discount, tax FROM pos_return_items WHERE return_id = $1', [r.id])).map(x => [x.id, x]));
  const all = await returnedByItem(q, r.saleId);
  r.returned = items.filter(i => mine[i.id]).map(i => ({ ...i, returnQty: mine[i.id].quantity, returnLine: mine[i.id].line, returnDiscount: mine[i.id].discount, returnTax: mine[i.id].tax }));
  // not returned by this return: the lines (or the rest of a line) still with the customer, counting every return on the bill
  r.kept = items.map(i => ({ ...i, keptQty: i.quantity - (all[i.id]?.qty ?? 0) })).filter(i => i.keptQty > 0);
  r.otherReturns = await rows(q, 'SELECT return_no AS "returnNo", total, created_at AS "createdAt" FROM pos_returns WHERE sale_id = $1 AND id <> $2 ORDER BY id', [r.saleId, r.id]);
  return r;
}

export async function getReturnByToken(q, token) {
  const r = await one(q, 'SELECT return_no FROM pos_returns WHERE share_token = $1', [String(token).slice(0, 64)]);
  return r ? getReturn(q, r.return_no) : null;
}

// Returns made against a bill, newest last, for the original invoice.
export const returnsForSale = (q, saleId) => rows(q, `SELECT r.return_no AS "returnNo", r.total, r.refund_mode AS "refundMode", r.created_at AS "createdAt", r.share_token AS "shareToken",
  (SELECT json_agg(json_build_object('name', i.name_snapshot, 'qty', ri.quantity) ORDER BY ri.id) FROM pos_return_items ri JOIN pos_sale_items i ON i.id = ri.sale_item_id WHERE ri.return_id = r.id) AS items
  FROM pos_returns r WHERE r.sale_id = $1 ORDER BY r.id`, [saleId]);
