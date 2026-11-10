import { rows, one } from '../db/index.js';
import { HttpError } from './http.js';
import { audit } from './orders.js';

const DAY = "(s.created_at AT TIME ZONE 'Asia/Singapore')::date";
const EFFECTIVE = "CASE WHEN s.status = 'voided' THEN 'cancelled' ELSE s.tailoring_status END";

// Bills that carry stitching service lines with measurements, for the Measurements page. Each bill comes with those lines and their measurements.
export async function listMeasurementBills(db, { q = '', name = '', phone = '', status = 'all', from, to }) {
  const w = [`s.channel = 'retail'`, `EXISTS (SELECT 1 FROM pos_sale_items i WHERE i.sale_id = s.id AND i.variant_snapshot ? 'measure')`], a = [];
  const add = v => { a.push(v); return '$' + a.length };
  const like = v => `%${String(v).trim().replace(/[\\%_]/g, m => '\\' + m)}%`;
  if (q.trim()) w.push(`s.invoice_no ILIKE ${add(like(q))}`);
  if (name.trim()) w.push(`s.customer_name ILIKE ${add(like(name))}`);
  if (phone.trim()) w.push(`regexp_replace(s.customer_phone, '\\D', '', 'g') LIKE ${add(`%${phone.replace(/\D/g, '')}%`)}`);
  if (from) w.push(`${DAY} >= ${add(from)}::date`);
  if (to) w.push(`${DAY} <= ${add(to)}::date`);
  const bills = await rows(db, `SELECT s.id, s.invoice_no AS "invoiceNo", s.customer_name AS "customerName", s.customer_phone AS "customerPhone", s.customer_address AS "customerAddress",
      s.bill_date::text AS "billDate", s.created_at AS "createdAt", ${EFFECTIVE} AS status, s.total_amount AS total, s.share_token AS "shareToken"
    FROM pos_sales s WHERE ${w.join(' AND ')} ORDER BY s.id DESC LIMIT 300`, a);
  const counts = { all: bills.length, pending: 0, completed: 0, cancelled: 0 };
  for (const b of bills) counts[b.status]++;
  const shown = status === 'all' ? bills : bills.filter(b => b.status === status);
  if (shown.length) {
    const items = await rows(db, `SELECT i.sale_id AS "saleId", i.name_snapshot AS name, i.unit_price AS "unitPrice", i.quantity, i.line_total AS "lineTotal", i.variant_snapshot -> 'measure' AS measure
      FROM pos_sale_items i WHERE i.sale_id = ANY($1::int[]) AND i.variant_snapshot ? 'measure' ORDER BY i.id`, [shown.map(b => b.id)]);
    for (const b of shown) b.items = items.filter(i => i.saleId === b.id).map(({ saleId, ...i }) => i);
  }
  return { counts, bills: shown.map(({ id, ...b }) => b) };
}

export async function setTailoringStatus(db, user, invoice, status) {
  const s = await one(db, 'SELECT id, status FROM pos_sales WHERE invoice_no = $1', [invoice]);
  if (!s) throw new HttpError(404, 'Invoice not found');
  if (s.status === 'voided') throw new HttpError(409, 'This bill was voided, so its stitching is cancelled', 'voided');
  await db.query('UPDATE pos_sales SET tailoring_status = $2 WHERE id = $1', [s.id, status]);
  await audit(db, user.id, 'pos.tailoring', 'pos_sale', invoice, { status });
  return { ok: true, status };
}
