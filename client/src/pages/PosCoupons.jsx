import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { Icon } from '../components/AdminShell';
import Modal from '../components/Modal';

const toPaise = s => { const n = Math.round(parseFloat(String(s || '').replace(/,/g, '')) * 100); return Number.isFinite(n) && n > 0 ? n : 0 };
const dmy = d => d ? String(d).slice(0, 10).split('-').reverse().join('-') : '';
const BLANK = { code: '', type: 'percent', value: '', min: '', expires: '', limit: '', audience: 'everyone', sentOnly: false };
const AUD = [['everyone', 'Everyone', 'Any customer, member or not'], ['non_loyalty', 'Non-loyalty', 'Customers who are not loyalty members'], ['loyalty', 'Loyalty members', 'Active loyalty members only']];
const AUD_LABEL = { everyone: 'Everyone', non_loyalty: 'Non-loyalty', loyalty: 'Loyalty members' };
const generate = () => { const w = ['MAHANA', 'SAREE', 'FESTIVE', 'WELCOME', 'SILK']; const r = Math.random().toString(36).slice(2, 5).toUpperCase(); return `${w[Math.floor(Math.random() * w.length)]}${[5, 10, 15, 20][Math.floor(Math.random() * 4)]}${r}` };
const offer = c => c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${inr(c.discountValue)} OFF`;
const WaIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.3-4.2A8 8 0 1 1 8.2 18.7L4 20Z" /></svg>;
const couponUrl = c => `${location.origin}/coupon/${encodeURIComponent(c.code)}`;
const waNumber = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 8 ? '65' + d : d };

// The WhatsApp message: the offer, its rules and a link that opens the coupon card.
function message(c, shop, name) {
  const lines = [`Hello${name ? ' ' + name : ''},`, '', `🎁 Here is a coupon from *${shop?.name || 'us'}*`, '', `Code: *${c.code}*`, `Offer: *${offer(c)}*`,
    c.minOrder ? `• Valid on purchases of ${inr(c.minOrder)} or more` : '• No minimum purchase', c.expiresOn ? `• Valid till ${dmy(c.expiresOn)}` : null,
    c.sentOnly ? '• Only for the mobile number it was sent to' : null, '• Show this code at billing. Discount applies to the item value only.', '', `Download your coupon: ${couponUrl(c)}`, shop?.phone ? `📞 ${shop.phone}` : null];
  return lines.filter(l => l !== null).join('\n');
}

function SendModal({ c, shop, onClose, onSent }) {
  const [phone, setPhone] = useState(''); const [name, setName] = useState(''); const [only, setOnly] = useState(c.sentOnly); const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  const valid = waNumber(phone).length >= 8;
  const record = () => api(`/admin/pos/coupons/${c.id}/sends`, { method: 'POST', body: { phone, name: name.trim(), onlyThis: only } });
  const go = async how => {
    if (!valid) return; setErr(); setBusy(true);
    const tab = window.open('', '_blank'); // opened inside the click so the browser allows it
    try {
      await record();
      const sent = { ...c, sentOnly: c.sentOnly || only };
      if (tab) tab.location.href = how === 'wa' ? `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message(sent, shop, name.trim()))}` : `${couponUrl(c)}?print=1`;
      onSent(); onClose();
    } catch (x) { tab?.close(); setErr(x.message); setBusy(false) }
  };
  return (
    <Modal title={<>Send coupon · <span className="cp-mono">{c.code}</span></>} onClose={onClose}>
      <div className="cp-send">
        <p className="cp-help">The coupon goes as a download link in the customer’s WhatsApp chat, or as a PDF with “Generate &amp; share PDF”. It is recorded once the chat or share sheet has been used.</p>
        <label className="cp-l">CUSTOMER PHONE <em>*</em><input autoFocus inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter WhatsApp number" /></label>
        <label className="cp-l">CUSTOMER NAME<input value={name} onChange={e => setName(e.target.value)} placeholder="Optional" /></label>
        <div className="cp-sw"><b>ONLY FOR THIS CUSTOMER</b><button type="button" role="switch" aria-checked={only} className={`dpos-switch ${only ? 'on' : ''}`} onClick={() => setOnly(!only)} /></div>
        {only && <p className="cp-warn">This coupon will only work for the phones it was sent to. Walk-in customers can’t use it any more, so use a dedicated coupon for this.</p>}
        {err && <p className="dpos-err" role="alert">{err}</p>}
        <div className="cp-send-act">
          <button type="button" className="cp-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="cp-btn wa" disabled={!valid || busy} onClick={() => go('wa')}><WaIcon /> Send link on WhatsApp</button>
          <button type="button" className="cp-btn pdf" disabled={!valid || busy} onClick={() => go('pdf')}><Icon n="doc" size={15} /> Generate &amp; share PDF</button>
        </div>
      </div>
    </Modal>
  );
}

function Recipients({ c, shop, onClose, onSent }) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(); const [sent, setSent] = useState(0);
  const load = useCallback(() => api(`/admin/pos/coupons/${c.id}/recipients`).then(setRows).catch(e => setErr(e.message)), [c.id]);
  useEffect(() => { load() }, [load]);
  const send = async r => {
    const tab = window.open('', '_blank');
    try {
      await api(`/admin/pos/coupons/${c.id}/sends`, { method: 'POST', body: { phone: r.phone, name: r.name } });
      if (tab) tab.location.href = `https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(message(c, shop, r.name))}`;
      setSent(n => n + 1); load(); onSent();
    } catch (x) { tab?.close(); setErr(x.message) }
  };
  const nonMembers = rows?.some(r => !r.loyalty);
  return (
    <Modal title={<>Send <span className="cp-mono">{c.code}</span> to customers</>} onClose={onClose} wide>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      {nonMembers && <p className="cp-warn">Customers who are not loyalty members haven’t been asked about WhatsApp offers — send only to people who are happy to get them.</p>}
      {!rows ? <p className="dpos-empty">Loading…</p> : !rows.length ? <p className="dpos-empty">No customers with a phone number match this coupon’s audience.</p> : (
        <ul className="cp-rec">{rows.map(r => (
          <li key={r.id}><div><b>{r.name || 'Customer'}</b><small>{r.phone} · {r.loyalty ? 'Loyalty customer' : 'Not a loyalty member'}</small></div>
            <button type="button" className={`cp-send-b ${r.sent ? 'again' : ''}`} onClick={() => send(r)}><WaIcon /> {r.sent ? 'SENT ✓ · AGAIN' : 'SEND'}</button></li>))}</ul>)}
      <div className="cp-rec-foot"><button type="button" className="cp-btn" onClick={onClose}>Done{sent ? ` · ${sent} sent` : ''}</button></div>
    </Modal>
  );
}

function EditModal({ c, onClose, onDone }) {
  const [f, setF] = useState({ type: c.discountType, value: c.discountType === 'percent' ? String(c.discountValue) : String(c.discountValue / 100), min: c.minOrder ? String(c.minOrder / 100) : '', expires: c.expiresOn ? String(c.expiresOn).slice(0, 10) : '', limit: c.usageLimit ? String(c.usageLimit) : '', audience: c.audience, sentOnly: c.sentOnly });
  const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setErr(); setBusy(true);
    try { await api(`/admin/pos/coupons/${c.id}`, { method: 'PATCH', body: { discountType: f.type, discountValue: f.type === 'percent' ? Math.round(+f.value) : toPaise(f.value), minOrder: toPaise(f.min), expiresOn: f.expires || null, usageLimit: f.limit ? Math.round(+f.limit) : null, audience: f.audience, sentOnly: f.sentOnly } }); onDone(); onClose() }
    catch (x) { setErr(x.issues?.[0]?.message || x.message); setBusy(false) }
  };
  return (
    <Modal title={<>Edit <span className="cp-mono">{c.code}</span></>} onClose={onClose}>
      <form className="cp-send" onSubmit={save}>
        <div className="cp-g2">
          <label className="cp-l">DISCOUNT {f.type === 'percent' ? '%' : '(S$)'}<input required inputMode="decimal" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} /></label>
          <label className="cp-l">MIN ORDER (S$)<input inputMode="decimal" value={f.min} onChange={e => setF({ ...f, min: e.target.value })} /></label>
          <label className="cp-l">EXPIRY DATE<input type="date" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} /></label>
          <label className="cp-l">USAGE LIMIT<input inputMode="numeric" value={f.limit} onChange={e => setF({ ...f, limit: e.target.value.replace(/\D/g, '') })} placeholder="Unlimited" /></label>
        </div>
        <Audience value={f.audience} onChange={a => setF({ ...f, audience: a })} />
        <div className="cp-sw"><b>ONLY FOR CUSTOMERS IT’S SENT TO</b><button type="button" role="switch" aria-checked={f.sentOnly} className={`dpos-switch ${f.sentOnly ? 'on' : ''}`} onClick={() => setF({ ...f, sentOnly: !f.sentOnly })} /></div>
        {err && <p className="dpos-err" role="alert">{err}</p>}
        <div className="cp-send-act"><button type="button" className="cp-btn" onClick={onClose}>Cancel</button><button className="cp-btn solid" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </Modal>
  );
}

function Audience({ value, onChange }) {
  return (
    <div><p className="cp-l">WHO CAN USE IT <em>*</em></p>
      <div className="cp-aud" role="radiogroup" aria-label="Who can use it">{AUD.map(([v, l, d]) => <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}><b>{l}</b><small>{d}</small></button>)}</div></div>
  );
}

// Coupon Management: create discount codes, choose who can use them, send them on WhatsApp and see how they are used. Discounts apply to the product subtotal only.
export default function PosCoupons() {
  const [list, setList] = useState(null); const [err, setErr] = useState(); const [f, setF] = useState(BLANK); const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState(''); const [shop, setShop] = useState(null);
  const [sendTo, setSendTo] = useState(null); const [everyone, setEveryone] = useState(null); const [edit, setEdit] = useState(null);
  const load = useCallback(() => api('/admin/pos/coupons').then(l => { setList(l); setErr() }).catch(e => setErr(e.message)), []);
  useEffect(() => { load(); api('/admin/pos/shop').then(setShop).catch(() => {}) }, [load]);
  const create = async e => {
    e.preventDefault(); setErr(); setBusy(true);
    try {
      await api('/admin/pos/coupons', { method: 'POST', body: { code: f.code.trim(), discountType: f.type, discountValue: f.type === 'percent' ? Math.round(+f.value) : toPaise(f.value), minOrder: toPaise(f.min), expiresOn: f.expires || null, usageLimit: f.limit ? Math.round(+f.limit) : null, audience: f.audience, sentOnly: f.sentOnly } });
      setF(BLANK); load();
    } catch (x) { setErr(x.issues?.[0]?.message || (x.message === 'Validation failed' ? 'Check the code (3–40 letters or digits) and the discount.' : x.message)) } finally { setBusy(false) }
  };
  const toggle = async c => { try { await api(`/admin/pos/coupons/${c.id}`, { method: 'PATCH', body: { active: !c.active } }); load() } catch (x) { setErr(x.message) } };
  const del = async c => { if (!confirm(`Delete coupon ${c.code}?`)) return; try { await api(`/admin/pos/coupons/${c.id}`, { method: 'DELETE' }); load() } catch (x) { setErr(x.message) } };
  const today = new Date().toISOString().slice(0, 10);
  const active = (list || []).filter(c => c.active && !(c.expiresOn && String(c.expiresOn).slice(0, 10) < today)).length;
  const uses = (list || []).reduce((s, c) => s + c.usedCount, 0);
  const count = a => (list || []).filter(c => a === 'all' || c.audience === a).length;
  const shown = useMemo(() => (list || []).filter(c => (filter === 'all' || c.audience === filter) && (!q.trim() || c.code.toLowerCase().includes(q.trim().toLowerCase()))), [list, filter, q]);
  return (
    <div className="cp">
      <div className="cp-top"><div><h2>Coupon Management</h2><p className="sub">Create discount codes and send them to customers on WhatsApp. Applies to the product subtotal only.</p></div>
        <div className="cp-top-a"><a className="cp-ref" href="/api/admin/pos/coupons/export" download><Icon n="doc" size={16} /> Download Excel</a><button type="button" className="cp-ref" onClick={load}><Icon n="refresh" size={16} /> Refresh</button></div></div>
      <div className="cp-kpis">
        <div className="cp-k"><div><span>TOTAL COUPONS</span><b>{list ? list.length : '…'}</b><small>Configured promotional codes</small></div><i><Icon n="tag" size={18} /></i></div>
        <div className="cp-k"><div><span>ACTIVE COUPONS</span><b className="g">{list ? active : '…'}</b><small>Live &amp; ready at checkout</small></div><i className="g"><Icon n="check" size={18} /></i></div>
        <div className="cp-k"><div><span>TOTAL REDEMPTIONS</span><b>{list ? uses : '…'}</b><small>Times customers used a coupon</small></div><i className="dark">%</i></div>
      </div>
      <p className="cp-note"><Icon n="info" size={16} /> Coupon discount applies to the product subtotal only — not delivery charges or GST. Staff can apply a coupon in Billing; enter the customer’s phone first for member-only coupons.</p>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      <div className="cp-two">
        <form className="cp-card" onSubmit={create}>
          <h3><span className="cp-plus">+</span> New Coupon</h3>
          <label className="cp-l">COUPON CODE <em>*</em></label>
          <div className="cp-code"><input required value={f.code} maxLength={40} onChange={e => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="E.G. SUMMER20" aria-label="Coupon code" /><button type="button" onClick={() => setF({ ...f, code: generate() })}>Generate</button></div>
          <div className="cp-g2">
            <label className="cp-l">DISCOUNT {f.type === 'percent' ? '%' : '(S$)'} <em>*</em><input required inputMode="decimal" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} placeholder={f.type === 'percent' ? 'e.g. 15' : 'e.g. 10'} /></label>
            <label className="cp-l">MIN ORDER (S$)<input inputMode="decimal" value={f.min} onChange={e => setF({ ...f, min: e.target.value })} placeholder="e.g. 100" /></label>
          </div>
          <div className="cp-type" role="radiogroup" aria-label="Discount type">{[['percent', '% off'], ['fixed', 'S$ off']].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={f.type === v} className={f.type === v ? 'on' : ''} onClick={() => setF({ ...f, type: v })}>{l}</button>)}</div>
          <div className="cp-g2">
            <label className="cp-l">EXPIRY DATE<input type="date" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} /></label>
            <label className="cp-l">USAGE LIMIT<input inputMode="numeric" value={f.limit} onChange={e => setF({ ...f, limit: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 50" /></label>
          </div>
          <Audience value={f.audience} onChange={a => setF({ ...f, audience: a })} />
          <div className="cp-sw"><div><b>Only for customers it’s sent to</b><small>Works only for the mobile numbers you send it to from this page.</small></div><button type="button" role="switch" aria-checked={f.sentOnly} aria-label="Only for customers it is sent to" className={`dpos-switch ${f.sentOnly ? 'on' : ''}`} onClick={() => setF({ ...f, sentOnly: !f.sentOnly })} /></div>
          <button className="cp-go" disabled={busy}>CREATE COUPON</button>
        </form>
        <section className="cp-card">
          <div className="cp-lh"><h3>All Coupons <span className="cp-n">{list ? list.length : 0}</span></h3></div>
          <div className="cp-filters" role="group" aria-label="Filter by audience">{[['all', 'All'], ['everyone', 'Everyone'], ['non_loyalty', 'Non-loyalty'], ['loyalty', 'Loyalty members']].map(([v, l]) => <button key={v} type="button" className={filter === v ? 'on' : ''} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l} <small>{count(v)}</small></button>)}</div>
          <label className="cp-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search coupons by code…" aria-label="Search coupons" /></label>
          {!list ? <p className="dpos-empty">Loading…</p> : !shown.length ? <div className="cp-empty">{list.length ? 'No coupons match.' : 'No coupons yet. Create your first coupon!'}</div> : (
            <ul className="cp-list">{shown.map(c => (
              <li key={c.id} className={c.active ? '' : 'off'}>
                <div className="cp-r1"><b className="cp-mono cp-c">{c.code}</b><span className={`cp-st ${c.active ? 'on' : ''}`}>{c.active ? 'ACTIVE' : 'INACTIVE'}</span>{c.sentOnly && <span className="cp-st only">SENT ONLY</span>}</div>
                <p className="cp-d">{offer(c)} <small>· {c.minOrder ? `min ${inr(c.minOrder)}` : 'no minimum'}</small></p>
                <p className="cp-u">Used {c.usedCount} {c.usedCount === 1 ? 'time' : 'times'}{c.usageLimit ? ` of ${c.usageLimit}` : ''} · {c.expiresOn ? `expires ${dmy(c.expiresOn)}` : 'no expiry'}{c.sentCount ? ` · sent to ${c.sentCount}` : ''}</p>
                <div className="cp-act">
                  <button type="button" className="cp-b outline" onClick={() => setEveryone(c)}><WaIcon /> {AUD_LABEL[c.audience].toUpperCase()}</button>
                  <button type="button" className="cp-b wa" onClick={() => setSendTo(c)}><WaIcon /> SEND</button>
                  <button type="button" className={`cp-b ${c.active ? 'dark' : 'light'}`} onClick={() => toggle(c)}>{c.active ? 'ACTIVE' : 'INACTIVE'}</button>
                  <button type="button" className="cp-i" aria-label={`Edit ${c.code}`} onClick={() => setEdit(c)}><Icon n="edit" size={15} /></button>
                  <button type="button" className="cp-i" aria-label={`Delete ${c.code}`} onClick={() => del(c)}><Icon n="trash" size={16} /></button>
                </div>
              </li>))}</ul>)}
        </section>
      </div>
      {sendTo && <SendModal c={sendTo} shop={shop} onClose={() => setSendTo(null)} onSent={load} />}
      {everyone && <Recipients c={everyone} shop={shop} onClose={() => setEveryone(null)} onSent={load} />}
      {edit && <EditModal c={edit} onClose={() => setEdit(null)} onDone={load} />}
    </div>
  );
}
