import crypto from 'node:crypto';
import { one, rows } from '../db/index.js';
import { invoiceNo } from './pos.js';

// Website orders as bills: every PAID website order gets one bill in pos_sales (source 'online') with its own invoice, items and GST split,
// so Order History, invoices and Analytics treat it like any other bill. Stock is NOT touched again: the website order already took it.
// Prices on the website include GST; the bill stores them GST-exclusive plus the GST, so subtotal + GST + delivery = what the customer paid.

const addressLine = a => [a.line1, a.line2, [a.city, a.pin].filter(Boolean).join(' ')].filter(Boolean).join(', ');

async function mirror(t, o) {
  const items = await rows(t, `SELECT oi.*, COALESCE(p.tax_rate, 0) AS rate FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1 ORDER BY oi.id`, [o.id]);
  let sub = 0, tax = 0;
  const lines = items.map(i => { const tx = Math.round(i.line_total * i.rate / (100 + i.rate)), ex = i.line_total - tx; sub += ex; tax += tx; return { ...i, ex, tx } });
  const total = sub + tax + o.shipping_amount;
  const a = o.shipping_address_snapshot || {};
  const no = await invoiceNo(t, 'retail');
  const sale = await one(t, `INSERT INTO pos_sales (invoice_no, idempotency_key, status, customer_name, customer_phone, is_gst, subtotal, discount_type, discount_value, discount_amount, tax_amount, delivery_fee,
      total_amount, payment_mode, pay_cash, pay_upi, pay_card, cash_tendered, change_given, payment_ref, notes, created_at, channel, bill_date, customer_address, source, share_token, web_order_id)
    VALUES ($1,$2,'completed',$3,$4,true,$5,'fixed',0,0,$6,$7,$8,'card',0,0,$8,0,0,$9,$10,$11,'retail',($11::timestamptz AT TIME ZONE 'Asia/Singapore')::date,$12,'online',$13,$14) RETURNING id`,
    [no, 'web-' + o.id, a.name || '', a.phone || '', sub, tax, o.shipping_amount, total, o.order_number, `Website order ${o.order_number}`, o.created_at, addressLine(a), crypto.randomBytes(16).toString('hex'), o.id]);
  for (const l of lines) {
    await t.query(`INSERT INTO pos_sale_items (sale_id, product_id, variant_id, name_snapshot, sku_snapshot, variant_snapshot, unit_price, quantity, line_total, discount_alloc, tax_rate, tax_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11)`, [sale.id, l.product_id, l.variant_id, l.product_name_snapshot, l.sku_snapshot, JSON.stringify(l.variant_snapshot ?? {}), Math.round(l.ex / l.quantity), l.quantity, l.ex, l.rate, l.tx]);
  }
  return sale.id;
}

let colKnown = false;
const hasCol = async db => colKnown || (colKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'pos_sales' AND column_name = 'web_order_id'`)));

let lastRun = 0;
// Bills for any paid website order that has none yet (also backfills old orders), and voids the bill of an order that was cancelled or refunded.
// Cheap and idempotent; throttled to once every 15 s unless `force`.
export async function syncWebOrders(db, { force = false } = {}) {
  if (!force && Date.now() - lastRun < 15_000) return 0;
  lastRun = Date.now();
  if (!(await hasCol(db))) return 0; // migration 035 not applied yet
  const missing = await rows(db, `SELECT o.* FROM orders o WHERE o.payment_status = 'paid' AND NOT EXISTS (SELECT 1 FROM pos_sales s WHERE s.web_order_id = o.id) ORDER BY o.id LIMIT 300`);
  let made = 0;
  for (const o of missing) { try { await db.tx(t => mirror(t, o)); made++ } catch (e) { console.error('web order bill failed', o.order_number, e.message) } }
  await db.query(`UPDATE pos_sales s SET status = 'voided', voided_at = now(), void_reason = 'Website order cancelled or refunded'
    FROM orders o WHERE s.web_order_id = o.id AND s.status = 'completed' AND (o.status = 'cancelled' OR o.payment_status IN ('refunded', 'cancelled'))`);
  return made;
}
