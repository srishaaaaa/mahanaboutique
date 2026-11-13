import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Modal from './Modal';
import { useApp } from '../context/App';
import { money } from '../lib/invoiceFormat';

const MODES = [['cash', 'Cash'], ['upi', 'QR / PayNow'], ['card', 'Card']];

// Return items against a bill: the quantity coming back for each line and a tick for "put back into stock".
// Manual / service lines never touch stock. The delivery fee is never refunded. An admin must approve: admins tick the box, staff type an admin's password.
export default function ReturnModal({ sale: given, invoiceNo, onClose, onDone }) {
  const nav = useNavigate(); const { user } = useApp(); const isAdmin = ['owner', 'admin'].includes(user?.role);
  const [sale, setSale] = useState(given || null);
  useEffect(() => { if (!given) api('/admin/pos/sales/' + encodeURIComponent(invoiceNo)).then(x => setSale(x.sale || x)).catch(e => setErr(e.message)) }, [given, invoiceNo]);
  const lines = (sale?.items || []).filter(i => i.id != null && i.returnedQty < i.quantity);
  const [qty, setQty] = useState({}); const [stock, setStock] = useState({}); const [reason, setReason] = useState('');
  const [mode, setMode] = useState('cash'); useEffect(() => { if (sale && MODES.some(([m]) => m === sale.paymentMode)) setMode(sale.paymentMode) }, [sale]);
  const [self, setSelf] = useState(false); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  const picked = lines.filter(i => (qty[i.id] || 0) > 0);
  const restock = i => i.stocked && stock[i.id] !== false;
  const go = async () => {
    setBusy(true); setErr();
    try {
      const out = await api(`/admin/pos/sales/${encodeURIComponent(sale.invoiceNo)}/returns`, { method: 'POST', body: { items: picked.map(i => ({ itemId: i.id, qty: qty[i.id], restock: restock(i) })), reason: reason.trim(), refundMode: mode, approval: isAdmin ? { self } : { email: email.trim(), password: pw } } });
      onClose(); onDone ? onDone(out) : (nav(`/invoice/${out.shareToken}`), location.reload());
    } catch (e) { setErr(e.issues?.[0]?.message || e.message); setBusy(false) }
  };
  const ready = picked.length && (isAdmin ? self : email.trim() && pw);
  return (
    <Modal title="Return items" sub={sale ? `Against invoice ${sale.invoiceNo}` : ''} wide onClose={onClose}
      footer={<><button type="button" className="dpos-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="dpos-btn" disabled={busy || !ready} onClick={go}>{busy ? 'Saving…' : 'Create return invoice'}</button></>}>
      {!sale ? <p className="muted">{err || 'Loading…'}</p> : (
      <div style={{ display: 'grid', gap: 14 }}>
        <p className="muted small" style={{ margin: 0 }}>Choose how many of each item came back. The refund is what the customer paid for them (price, less their share of the discount, plus GST). Tick “Back to stock” for items that can be resold; manual items never touch stock. <b>Delivery charge is never refunded.</b></p>
        {!lines.length ? <p className="muted">Everything on this bill has already been returned.</p> :
        <div className="dpos-tw"><table><thead><tr><th>Item</th><th className="r">Sold</th><th className="r">Returned</th><th className="r">Return now</th><th className="r">Back to stock</th></tr></thead>
          <tbody>{lines.map(i => { const left = i.quantity - i.returnedQty; return (
            <tr key={i.id}><td><b>{i.name}</b>{i.variant?.size ? <span className="muted small"> ({i.variant.size}{i.variant.color && i.variant.color !== 'Default' ? `, ${i.variant.color}` : ''})</span> : null}<div className="muted small">{money(i.unitPrice)} each</div></td>
              <td className="r">{i.quantity}</td><td className="r">{i.returnedQty}</td>
              <td className="r"><input aria-label={`Quantity of ${i.name} to return`} style={{ width: 80, textAlign: 'right' }} type="number" min="0" max={left} value={qty[i.id] ?? ''} placeholder="0" onChange={e => setQty({ ...qty, [i.id]: Math.max(0, Math.min(left, Math.floor(+e.target.value) || 0)) })} /> <button type="button" className="dpos-btn ghost sm" onClick={() => setQty({ ...qty, [i.id]: left })}>All</button></td>
              <td className="r">{i.stocked ? <input type="checkbox" aria-label={`Put ${i.name} back into stock`} checked={restock(i)} onChange={e => setStock({ ...stock, [i.id]: e.target.checked })} /> : <span className="muted small">manual · no stock</span>}</td></tr>) })}</tbody></table></div>}
        <label className="f">Reason<input value={reason} maxLength={300} onChange={e => setReason(e.target.value)} placeholder="e.g. Wrong size, defect, changed mind" /></label>
        <div><p className="muted small" style={{ fontWeight: 800, letterSpacing: '.1em', margin: '0 0 8px' }}>REFUND PAID BY</p>
          <div className="adv-modes" role="radiogroup" aria-label="Refund method">{MODES.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={mode === v} className={mode === v ? 'on' : ''} onClick={() => setMode(v)}>{l.toUpperCase()}</button>)}</div></div>
        <div><p className="muted small" style={{ fontWeight: 800, letterSpacing: '.1em', margin: '0 0 8px' }}>ADMIN APPROVAL</p>
          {isAdmin ? <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={self} onChange={e => setSelf(e.target.checked)} /> I approve this refund</label>
            : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label className="f">Admin email<input type="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="f">Admin password<input type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /></label></div>}
          <p className="muted small" style={{ margin: '6px 0 0' }}>The return records who approved it.</p></div>
        {err && <p className="dpos-err" role="alert">{err}</p>}
      </div>)}
    </Modal>
  );
}
