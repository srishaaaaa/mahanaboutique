import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import Modal from './Modal';
import PayPicker, { blankPay, payParts } from './PayPicker';

const toPaise = s => { const n = Math.round(parseFloat(String(s ?? '').replace(/,/g, '')) * 100); return Number.isFinite(n) && n > 0 ? n : 0 };
const rupees = p => (p / 100).toFixed(2);

// Edit an issued bill (owner/admin): customer details, note, delivery fee, discount and every line's quantity / price / removal.
// Stock follows the quantity change; if the total moves, say how the new total was paid.
export default function EditSaleModal({ invoiceNo, onClose, onSaved }) {
  const [sale, setSale] = useState(null); const [f, setF] = useState(null); const [lines, setLines] = useState([]); const [pay, setPay] = useState(blankPay);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => {
    api('/admin/pos/sales/' + encodeURIComponent(invoiceNo)).then(x => {
      const s = x.sale || x; setSale(s);
      setF({ name: s.customerName || '', phone: s.customerPhone || '', address: s.customerAddress || '', notes: s.notes || '', delivery: rupees(s.deliveryFee || 0), dType: s.discountType || 'fixed', dValue: s.discountType === 'percent' ? String(s.discountValue) : rupees(s.discountValue || 0) });
      setLines(s.items.map(i => ({ id: i.id, name: i.name, variant: i.variant, qty: i.quantity, price: rupees(i.unitPrice), taxRate: i.taxRate, remove: false, goods: !!i.sku })));
      setPay({ ...blankPay(), mode: ['cash', 'upi', 'card'].includes(s.paymentMode) ? s.paymentMode : 'cash' });
    }).catch(e => setErr(e.message));
  }, [invoiceNo]);
  const setL = (i, p) => setLines(ls => ls.map((l, n) => n === i ? { ...l, ...p } : l));
  // live recomputation, the same rules the server applies
  const bill = useMemo(() => {
    if (!sale || !f) return null;
    const live = lines.filter(l => !l.remove);
    const subtotal = live.reduce((s, l) => s + toPaise(l.price) * l.qty, 0);
    const dv = f.dType === 'percent' ? Math.min(100, Math.round(+f.dValue || 0)) : toPaise(f.dValue);
    const discount = sale.couponCode ? sale.discount : Math.min(subtotal, f.dType === 'percent' ? Math.round(subtotal * dv / 100) : dv);
    let tax = 0;
    if (sale.isGst && subtotal) for (const l of live) { const lt = toPaise(l.price) * l.qty; tax += Math.round((lt - Math.floor(discount * lt / subtotal)) * (sale.gstRate ?? l.taxRate) / 100) }
    return { subtotal, discount, tax, total: subtotal - discount + tax + toPaise(f.delivery) };
  }, [sale, f, lines]);
  if (!sale || !f || !bill) return <Modal title="Edit invoice" sub={invoiceNo} onClose={onClose}>{err ? <p className="dpos-err" role="alert">{err}</p> : <p className="muted">Loading…</p>}</Modal>;
  const moved = bill.total !== sale.total, parts = payParts(pay, bill.total);
  const locked = !!sale.advance, couponed = !!sale.couponCode;
  const save = async () => {
    setErr();
    if (reason.trim().length < 3) return setErr('Give a reason for the edit.');
    if (moved && parts.problem) return setErr(parts.problem);
    setBusy(true);
    const items = lines.map(l => { const o = sale.items.find(i => i.id === l.id); return l.remove ? { id: l.id, remove: true } : { id: l.id, ...(l.qty !== o.quantity ? { qty: l.qty } : {}), ...(toPaise(l.price) !== o.unitPrice ? { price: toPaise(l.price) } : {}) } }).filter(i => i.remove || i.qty != null || i.price != null);
    const body = { reason: reason.trim(), customerName: f.name.trim(), customerPhone: f.phone.trim(), customerAddress: f.address.trim(), notes: f.notes.trim() || null,
      ...(items.length ? { items } : {}), ...(toPaise(f.delivery) !== (sale.deliveryFee || 0) ? { deliveryFee: toPaise(f.delivery) } : {}),
      ...(!couponed && (f.dType !== sale.discountType || (f.dType === 'percent' ? Math.round(+f.dValue || 0) : toPaise(f.dValue)) !== sale.discountValue) ? { discountType: f.dType, discountValue: f.dType === 'percent' ? Math.round(+f.dValue || 0) : toPaise(f.dValue) } : {}),
      ...(moved ? { payment: { mode: parts.mode, ...(parts.split ? { split: parts.split } : {}) } } : {}) };
    try { const out = await api(`/admin/pos/sales/${encodeURIComponent(invoiceNo)}`, { method: 'PATCH', body }); onSaved?.(out); onClose() }
    catch (e) { setErr(e.issues?.[0]?.message || e.message); setBusy(false) }
  };
  return (
    <Modal title="Edit invoice" sub={`${invoiceNo} · changes are recorded and stock follows the quantities`} wide onClose={onClose}
      footer={<><button type="button" className="dpos-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="dpos-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></>}>
      <div style={{ display: 'grid', gap: 14 }}>
        {locked && <p className="cp-warn">This bill came from an advance order, so only the customer details and note can be edited.</p>}
        <div className="dpos-grid">
          <label className="f">Customer name<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} maxLength={120} /></label>
          <label className="f">Mobile number<input value={f.phone} inputMode="tel" onChange={e => setF({ ...f, phone: e.target.value })} /></label>
        </div>
        <label className="f">Address<input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} maxLength={300} /></label>
        <label className="f">Note on the bill<input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} maxLength={500} /></label>
        <div className="dpos-tw"><table><thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price (S$)</th><th className="r">Amount</th><th /></tr></thead>
          <tbody>{lines.map((l, i) => (
            <tr key={l.id} style={l.remove ? { opacity: .45, textDecoration: 'line-through' } : null}>
              <td><b>{l.name}</b>{l.variant?.size ? <span className="muted small"> ({l.variant.size}{l.variant.color && l.variant.color !== 'Default' ? `, ${l.variant.color}` : ''})</span> : null}</td>
              <td className="r"><input aria-label={`Quantity of ${l.name}`} type="number" min="1" style={{ width: 80, textAlign: 'right' }} value={l.qty} disabled={locked || l.remove} onChange={e => setL(i, { qty: Math.max(1, Math.floor(+e.target.value) || 1) })} /></td>
              <td className="r"><input aria-label={`Price of ${l.name}`} inputMode="decimal" style={{ width: 110, textAlign: 'right' }} value={l.price} disabled={locked || l.remove} onChange={e => setL(i, { price: e.target.value })} /></td>
              <td className="r">{inr(toPaise(l.price) * l.qty)}</td>
              <td className="r"><button type="button" className="dpos-btn ghost sm" disabled={locked || (!l.remove && lines.filter(x => !x.remove).length < 2)} onClick={() => setL(i, { remove: !l.remove })}>{l.remove ? 'Undo' : 'Remove'}</button></td></tr>))}</tbody></table></div>
        <div className="dpos-grid">
          <label className="f">Discount {couponed ? `(coupon ${sale.couponCode}, fixed)` : ''}<div style={{ display: 'flex', gap: 8 }}>
            <select aria-label="Discount type" value={f.dType} disabled={locked || couponed} onChange={e => setF({ ...f, dType: e.target.value })}><option value="fixed">S$</option><option value="percent">%</option></select>
            <input inputMode="decimal" value={couponed ? rupees(sale.discount) : f.dValue} disabled={locked || couponed} onChange={e => setF({ ...f, dValue: e.target.value })} /></div></label>
          <label className="f">Delivery fee (S$)<input inputMode="decimal" value={f.delivery} disabled={locked} onChange={e => setF({ ...f, delivery: e.target.value })} /></label>
        </div>
        <div className="dpos-gstsplit" aria-label="New totals">
          <div className="gs-h"><span>SUBTOTAL</span><b>{inr(bill.subtotal)}</b></div>
          {bill.discount > 0 && <div className="gs-h"><span>DISCOUNT</span><b>− {inr(bill.discount)}</b></div>}
          {sale.isGst && <div className="gs-h"><span>GST</span><b>{inr(bill.tax)}</b></div>}
          <div className="gs-h"><span>NEW TOTAL</span><b>{inr(bill.total)}</b></div>
          {moved && <div className="gs-s"><span>Was {inr(sale.total)}</span><b>{bill.total > sale.total ? '+' : '−'} {inr(Math.abs(bill.total - sale.total))}</b></div>}
        </div>
        {moved && <div><p className="muted small" style={{ fontWeight: 800, letterSpacing: '.1em', margin: '0 0 8px' }}>THE TOTAL CHANGED — HOW WAS THE NEW TOTAL PAID?</p><PayPicker value={pay} onChange={setPay} amount={bill.total} label="New payment method" /></div>}
        <label className="f">Reason for the edit (required, kept in the audit log)<input value={reason} onChange={e => setReason(e.target.value)} maxLength={200} placeholder="e.g. Customer asked for 2 more pieces" /></label>
        {err && <p className="dpos-err" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}
