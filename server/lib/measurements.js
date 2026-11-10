import { rows, one } from '../db/index.js';
import { HttpError } from './http.js';
import { audit } from './orders.js';

const DAY = "(s.created_at AT TIME ZONE 'Asia/Singapore')::date";
const EFFECTIVE = "CASE WHEN s.status = 'voided' THEN 'cancelled' ELSE s.tailoring_status END";

// Bills that carry stitching service lines with measurements, for the Measurements page. Each bill comes with those lines and their measurements.
export async function listMeasurementBills(db, { q = '', name = '', phone = '', status = 'all', from, to, limit = 300 }) {
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
    FROM pos_sales s WHERE ${w.join(' AND ')} ORDER BY s.id DESC LIMIT ${Math.min(limit, 5000)}`, a);
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

const SG = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10) };
const dueOf = items => items.map(i => i.measure?.dueDate).filter(Boolean).sort()[0] ?? null;

// Stitching orders = bills with stitching lines + advance orders that are still open (deposit taken, work pending), newest first.
export async function listStitchingOrders(db, f = {}) {
  const { status = 'all', q = '', name = '', phone = '', from, to, limit = 300 } = f;
  const base = await listMeasurementBills(db, { q, name, phone, status: 'all', from, to, limit });
  const bills = base.bills.map(b => ({ ...b, kind: 'bill', dueDate: dueOf(b.items), stitchTotal: b.items.reduce((s, i) => s + i.lineTotal, 0), deposit: null, balance: 0 }));
  const like = v => String(v).trim().toLowerCase();
  const adv = (await rows(db, `SELECT a.code, a.status AS adv_status, a.customer_name AS "customerName", a.customer_phone AS "customerPhone", a.customer_address AS "customerAddress", a.total_amount AS total, a.deposit,
      a.delivery_date::text AS "deliveryDate", a.created_at AS "createdAt", (a.created_at AT TIME ZONE 'Asia/Singapore')::date::text AS "billDate", a.items
    FROM pos_advances a WHERE a.status IN ('pending', 'ready') AND EXISTS (SELECT 1 FROM jsonb_array_elements(a.items) e WHERE e ? 'measure') ORDER BY a.id DESC LIMIT 300`))
    .filter(a => (!q.trim() || a.code.toLowerCase().includes(like(q))) && (!name.trim() || (a.customerName || '').toLowerCase().includes(like(name))) && (!phone.trim() || String(a.customerPhone).replace(/\D/g, '').includes(phone.replace(/\D/g, '')))
      && (!from || a.billDate >= from) && (!to || a.billDate <= to))
    .map(a => {
      const items = a.items.filter(i => i.measure).map(i => ({ name: i.name, unitPrice: i.price, quantity: i.qty, lineTotal: i.price * i.qty, measure: i.measure }));
      return { invoiceNo: a.code, kind: 'advance', advanceStatus: a.adv_status, customerName: a.customerName, customerPhone: a.customerPhone, customerAddress: a.customerAddress, billDate: a.billDate, createdAt: a.createdAt,
        status: 'pending', total: a.total, deposit: a.deposit, balance: a.total - a.deposit, shareToken: null, items, dueDate: dueOf(items) ?? a.deliveryDate, stitchTotal: items.reduce((s, i) => s + i.lineTotal, 0) };
    });
  const all = [...bills, ...adv].sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
  const counts = { all: all.length, pending: 0, completed: 0, cancelled: 0 }; for (const o of all) counts[o.status]++;
  return { counts, orders: status === 'all' ? all : all.filter(o => o.status === status) };
}

// Dashboard and reports in one call: counts, due dates, stitching revenue, garments, per-garment and per-day figures.
export async function stitchingOverview(db, { from, to }) {
  const { orders, counts } = await listStitchingOrders(db, { from, to, limit: 3000 });
  const today = SG(), soon = addDays(today, 7);
  const open = orders.filter(o => o.status === 'pending');
  const live = orders.filter(o => o.kind === 'bill' && o.status !== 'cancelled');
  const byItem = new Map(), byDay = new Map();
  let revenue = 0, garments = 0;
  for (const b of live) {
    revenue += b.stitchTotal; const d = byDay.get(b.billDate) ?? { day: b.billDate, bills: 0, revenue: 0 }; d.bills++; d.revenue += b.stitchTotal; byDay.set(b.billDate, d);
    for (const i of b.items) { garments += i.quantity; const g = byItem.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 }; g.qty += i.quantity; g.revenue += i.lineTotal; byItem.set(i.name, g) }
  }
  return {
    from, to, today, counts,
    overdue: open.filter(o => o.dueDate && o.dueDate < today).length, dueToday: open.filter(o => o.dueDate === today).length,
    dueSoon: open.filter(o => o.dueDate && o.dueDate >= today && o.dueDate <= soon).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 12).map(({ items, ...o }) => ({ ...o, itemNames: items.map(i => i.name) })),
    overdueList: open.filter(o => o.dueDate && o.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 12).map(({ items, ...o }) => ({ ...o, itemNames: items.map(i => i.name) })),
    recent: orders.slice(0, 8).map(({ items, ...o }) => ({ ...o, itemNames: items.map(i => i.name) })),
    revenue, garments, bills: live.length, average: garments ? Math.round(revenue / garments) : 0,
    openValue: open.reduce((s, o) => s + o.stitchTotal, 0), advanceBalance: open.filter(o => o.kind === 'advance').reduce((s, o) => s + o.balance, 0), advanceCount: open.filter(o => o.kind === 'advance').length,
    byItem: [...byItem.values()].sort((a, b) => b.revenue - a.revenue), daily: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
  };
}
