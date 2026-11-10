import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Modal from './Modal';
import { money } from '../lib/invoiceFormat';

const MODES = [['cash', 'Cash'], ['upi', 'QR / PayNow'], ['card', 'Card']];

// Return items against a bill: pick the quantity coming back for each line. Stock goes back and a return invoice (credit note) is made.
export default function ReturnModal({ sale, onClose }) {
  const nav = useNavigate();
  const lines = sale.items.filter(i => i.id != null && i.returnedQty < i.quantity);
  const [qty, setQty] = useState({}); const [reason, setReason] = useState(''); const [mode, setMode] = useState(sale.paymentMode === 'split' || !MODES.some(([m]) => m === sale.paymentMode) ? 'cash' : sale.paymentMode);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  const picked = lines.filter(i => (qty[i.id] || 0) > 0);
  const go = async () => {
    setBusy(true); setErr();
    try {
      const out = await api(`/admin/pos/sales/${encodeURIComponent(sale.invoiceNo)}/returns`, { method: 'POST', body: { items: picked.map(i => ({ itemId: i.id, qty: qty[i.id] })), reason: reason.trim(), refundMode: mode } });
      nav(`/invoice/${out.shareToken}`); onClose(); location.reload();
    } catch (e) { setErr(e.issues?.[0]?.message || e.message); setBusy(false) }
  };
  return (
    <Modal title="Return items" sub={`Against invoice ${sale.invoiceNo}`} wide onClose={onClose}
      footer={<><button type="button" className="dpos-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="dpos-btn" disabled={busy || !picked.length} onClick={go}>{busy ? 'Saving…' : 'Create return invoice'}</button></>}>
      <div style={{ display: 'grid', gap: 14 }}>
        <p className="muted small" style={{ margin: 0 }}>Choose how many of each item came back. The refund is what the customer paid for them (price, less their share of the discount, plus GST). Stock goes back and the original invoice records the return. Delivery fees are not refunded.</p>
        <div className="dpos-tw"><table><thead><tr><th>Item</th><th className="r">Sold</th><th className="r">Already returned</th><th className="r">Return now</th></tr></thead>
          <tbody>{lines.map(i => { const left = i.quantity - i.returnedQty; return (
            <tr key={i.id}><td><b>{i.name}</b>{i.variant?.size ? <span className="muted small"> ({i.variant.size}{i.variant.color && i.variant.color !== 'Default' ? `, ${i.variant.color}` : ''})</span> : null}<div className="muted small">{money(i.unitPrice)} each</div></td>
              <td className="r">{i.quantity}</td><td className="r">{i.returnedQty}</td>
              <td className="r"><input aria-label={`Quantity of ${i.name} to return`} style={{ width: 80, textAlign: 'right' }} type="number" min="0" max={left} value={qty[i.id] ?? ''} placeholder="0" onChange={e => setQty({ ...qty, [i.id]: Math.max(0, Math.min(left, Math.floor(+e.target.value) || 0)) })} /> <button type="button" className="dpos-btn ghost sm" onClick={() => setQty({ ...qty, [i.id]: left })}>All</button></td></tr>) })}</tbody></table></div>
        <label className="f">Reason<input value={reason} maxLength={300} onChange={e => setReason(e.target.value)} placeholder="e.g. Wrong size, defect, changed mind" /></label>
        <div><p className="muted small" style={{ fontWeight: 800, letterSpacing: '.1em', margin: '0 0 8px' }}>REFUND PAID BY</p>
          <div className="adv-modes" role="radiogroup" aria-label="Refund method">{MODES.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={mode === v} className={mode === v ? 'on' : ''} onClick={() => setMode(v)}>{l.toUpperCase()}</button>)}</div></div>
        {err && <p className="dpos-err" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}
