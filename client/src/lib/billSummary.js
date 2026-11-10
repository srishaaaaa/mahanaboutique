// The complete split-up of a bill or advance order, used on invoices (A4, A5 and thermal), receipts, Order History and Advance Orders:
// Products / stitching → Subtotal → Manual discount or Coupon → Delivery → Taxable value → GST by rate with CGST and SGST → TOTAL →
// how it was paid (split by mode) → advance deposit / balance due → returns.
// Each row: { label, value, kind } where kind is 'row' | 'muted' | 'total' | 'pay' | 'paysub' | 'strong'; value is in paise (negative = deduction).
export const PAY_L = [['cash', 'Cash'], ['upi', 'QR / PayNow'], ['card', 'Card']];
const MODE_L = { cash: 'Cash', upi: 'QR / PayNow', card: 'Card', split: 'Split' };
const modeRows = s => PAY_L.map(([k, l]) => ({ label: l, value: s?.[k] || 0, kind: 'paysub' })); // every method, always in the same order: Cash, QR / PayNow, Card
const pct = n => `${Number.isInteger(n) ? n : Number(n.toFixed(2))}%`;

const lineAmt = i => i.lineTotal ?? (i.price != null ? i.price * (i.qty ?? 1) : 0);
export const isStitching = i => !!(i.variant?.measure || i.measure);

// GST grouped by rate: [{ rate, base, tax }]. The base is the taxable value (line total less its share of the discount).
export function gstGroups(b) {
  if (!b.isGst || !(b.tax > 0)) return [];
  const by = new Map();
  for (const i of b.items || []) {
    const rate = Number(b.gstRate ?? i.taxRate) || 0;
    if (rate > 0) { const g = by.get(rate) ?? { rate, base: 0, tax: 0 }; g.base += lineAmt(i) - (i.discount || 0); g.tax += i.tax ?? 0; by.set(rate, g) }
  }
  let groups = [...by.values()].sort((x, y) => x.rate - y.rate);
  if (groups.length === 1) groups = [{ ...groups[0], tax: b.tax, base: b.subtotal - (b.discount || 0) }]; // one rate: the bill's own figures
  else if (!groups.length || groups.reduce((s, g) => s + g.tax, 0) !== b.tax) groups = [{ rate: Number(b.gstRate) || 0, base: b.subtotal - (b.discount || 0), tax: b.tax }];
  return groups;
}

function gstRows(b) {
  const groups = gstGroups(b), out = [];
  for (const g of groups) {
    const cg = Math.floor(g.tax / 2), sg = g.tax - cg; // an odd cent goes to SGST
    if (g.rate > 0) out.push({ label: `GST ${pct(g.rate)}`, note: `on ${(g.base / 100).toFixed(2)}`, value: g.tax, kind: 'row' });
    else out.push({ label: 'GST', value: g.tax, kind: 'row' });
    out.push({ label: `CGST ${pct(g.rate / 2)}`, value: cg, kind: 'tax' }, { label: `SGST ${pct(g.rate / 2)}`, value: sg, kind: 'tax' });
  }
  if (groups.length > 1) out.push({ label: 'Total GST', value: b.tax, kind: 'row' });
  return out;
}

// sale = a bill from the API (may carry .advance); adv = an advance order (not yet billed, or billed with its sale passed as `sale`).
export function billRows(b, { sale } = {}) {
  const items = b.items || [];
  const stitch = items.filter(isStitching).reduce((s, i) => s + lineAmt(i), 0), goods = b.subtotal - stitch;
  const rows = [];
  if (stitch > 0 && goods > 0) rows.push({ label: 'Products', value: goods, kind: 'row' }, { label: 'Stitching charges', value: stitch, kind: 'row' });
  else if (stitch > 0) rows.push({ label: 'Stitching charges', value: stitch, kind: 'row' });
  rows.push({ label: stitch > 0 || b.discount > 0 || b.deliveryFee > 0 ? 'Subtotal' : 'Subtotal', note: b.isGst ? 'EXCL. GST' : '', value: b.subtotal, kind: stitch > 0 && goods > 0 ? 'muted' : 'row' });
  if (b.discount > 0) {
    const how = b.discountType === 'percent' && b.discountValue ? ` (${b.discountValue}%)` : '';
    rows.push({ label: b.couponCode ? `Coupon discount (${b.couponCode})` : `Manual discount${how}`, value: -b.discount, kind: 'row' });
  }
  if (b.deliveryFee > 0) rows.push({ label: 'Delivery fee', value: b.deliveryFee, kind: 'row' });
  if (b.isGst && b.tax > 0) rows.push({ label: 'TAXABLE VALUE', value: b.subtotal - (b.discount || 0), kind: 'muted' }, ...gstRows(b));
  rows.push({ label: 'TOTAL', value: b.total, kind: 'total' });
  rows.push(...payRows(b, { sale }));
  // returns made against this bill (credit notes)
  const rets = b.returns ?? sale?.returns ?? [];
  if (rets.length) {
    for (const r of rets) rows.push({ label: `Less: returned (${r.returnNo})`, value: -r.total, kind: 'row' });
    rows.push({ label: 'NET AFTER RETURNS', value: b.total - rets.reduce((s, r) => s + r.total, 0), kind: 'strong' });
  }
  return rows;
}

export function payRows(b, { sale } = {}) {
  if (b.status === 'voided') return [{ label: 'VOID — bill cancelled, nothing collected', value: null, kind: 'strong' }];
  if (b.status === 'cancelled') return [{ label: 'Advance order cancelled', value: null, kind: 'strong' }, { label: 'Deposit to hand back', value: b.deposit, kind: 'pay' }];
  // a bill made from an advance order
  const a = b.advance ?? (sale?.advance) ?? null;
  if (a) return [
    { label: 'Deposit Paid', value: a.deposit, kind: 'pay' }, ...modeRows(a.depositSplit),
    { label: 'Final Balance Paid', value: a.balance, kind: 'pay' }, ...modeRows(a.balanceSplit),
    { label: 'Total Received', value: b.total, kind: 'pay' },
    { label: 'Balance Due', value: 0, kind: 'strong' },
  ];
  // an advance order still waiting for collection
  if ('deposit' in b && !('paymentMode' in b)) {
    const dep = b.depositSplit || { [b.depositMode]: b.deposit };
    return [{ label: 'Advance Paid', value: b.deposit, kind: 'pay' }, ...modeRows(dep), { label: 'Balance Due', value: b.total - b.deposit, kind: 'strong' }];
  }
  // a normal bill
  if (b.paymentMode === 'split') return [{ label: 'Paid by Split', value: null, kind: 'pay' }, ...modeRows({ cash: b.payCash, upi: b.payUpi, card: b.payCard }), { label: 'Total Received', value: b.total, kind: 'pay' }, { label: 'Balance Due', value: 0, kind: 'strong' }];
  const out = [{ label: `Paid by ${MODE_L[b.paymentMode] || b.paymentMode}`, value: b.total, kind: 'pay' }];
  if (b.paymentMode === 'cash' && b.cashTendered > b.total) out.push({ label: 'Cash received', value: b.cashTendered, kind: 'paysub' }, { label: 'Change returned', value: b.change || b.cashTendered - b.total, kind: 'paysub' });
  out.push({ label: 'Balance Due', value: 0, kind: 'strong' });
  return out;
}

// The rows of a return invoice (credit note): returned value → discount reversed → taxable → GST reversed (CGST / SGST) → refund → refunded by.
export function returnRows(r) {
  const rows = [{ label: 'Returned items value', note: r.isGst ? 'EXCL. GST' : '', value: r.subtotal, kind: 'row' }];
  if (r.discount > 0) rows.push({ label: r.couponCode ? `Coupon discount reversed (${r.couponCode})` : 'Discount reversed', value: -r.discount, kind: 'row' });
  if (r.isGst && r.tax > 0) {
    const rate = Number(r.gstRate) || Math.max(0, ...r.returned.map(i => i.taxRate || 0)), cg = Math.floor(r.tax / 2), sg = r.tax - cg;
    rows.push({ label: 'TAXABLE VALUE', value: r.subtotal - r.discount, kind: 'muted' }, { label: rate ? `GST ${pct(rate)} reversed` : 'GST reversed', value: r.tax, kind: 'row' },
      { label: `CGST ${pct(rate / 2)}`, value: cg, kind: 'tax' }, { label: `SGST ${pct(rate / 2)}`, value: sg, kind: 'tax' });
  }
  rows.push({ label: 'REFUND TOTAL', value: r.total, kind: 'total' }, { label: `Refunded by ${MODE_L[r.refundMode] || r.refundMode}`, value: r.total, kind: 'pay' });
  if (r.deliveryFee > 0) rows.push({ label: 'Delivery fee is not refunded', value: null, kind: 'muted' });
  return rows;
}

export const modeName = s => s.advance ? 'Advance order · deposit + balance' : s.paymentMode === 'split'
  ? `Split · ${PAY_L.filter(([k]) => ({ cash: s.payCash, upi: s.payUpi, card: s.payCard })[k] > 0).map(([, l]) => l).join(' + ')}` : MODE_L[s.paymentMode];
