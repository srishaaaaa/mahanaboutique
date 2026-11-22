import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../context/App';
import Modal from './Modal';
import { Icon } from './AdminShell';

const dmy = d => String(d || '').split('-').reverse().join('-');
const tomorrow = () => { const d = new Date(Date.now() + 86400000 + 8 * 3600000); return d.toISOString().slice(0, 10) };

// Delivery -> EasyParcel: connect the account once, say where parcels are collected and the usual parcel size.
export function EasyParcelCard() {
  const { toast } = useApp(); const loc = useLocation();
  const [st, setSt] = useState(null); const [f, setF] = useState(null); const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  const load = () => api('/admin/easyparcel/status').then(x => { setSt(x); setF(x.settings) }).catch(e => setErr(e.message));
  useEffect(() => { load() }, []);
  useEffect(() => { const r = new URLSearchParams(loc.search).get('easyparcel'); if (r === 'connected') toast('EasyParcel connected.'); else if (r === 'failed') setErr('EasyParcel could not be connected. Check that the redirect address is registered in the Developer Hub, then try again.') }, [loc.search]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!st || !f) return <section className="dpos-card"><p className="muted">{err || 'Loading EasyParcel…'}</p></section>;
  const connect = async () => { setBusy(true); setErr(); try { const r = await api('/admin/easyparcel/connect'); window.location.href = r.url } catch (e) { setErr(e.message); setBusy(false) } };
  const disconnect = async () => { if (!confirm('Disconnect EasyParcel? Existing bookings are kept.')) return; try { await api('/admin/easyparcel/disconnect', { method: 'POST' }); load(); toast('Disconnected.') } catch (e) { setErr(e.message) } };
  const save = async e => { e.preventDefault(); setBusy(true); setErr(); try { const s = await api('/admin/easyparcel/settings', { method: 'PUT', body: { pickup: f.pickup, parcel: { length: +f.parcel.length, width: +f.parcel.width, height: +f.parcel.height } } }); setF(s); toast('Pickup details saved.') } catch (x) { setErr(x.issues?.[0]?.message || x.message) } finally { setBusy(false) } };
  const p = (k, v) => setF(x => ({ ...x, pickup: { ...x.pickup, [k]: v } })), d = (k, v) => setF(x => ({ ...x, parcel: { ...x.parcel, [k]: v } }));
  return (
    <section className="dpos-card ep">
      <div className="ep-h"><h2><Icon n="truck" size={18} /> EasyParcel courier booking</h2>
        <span className={`dpos-pill ${st.connected ? 'ok' : st.configured ? 'warn' : 'bad'}`}>{st.connected ? 'Connected' : st.configured ? 'Not connected' : 'Keys missing'}</span></div>
      <p className="muted small">Book couriers for paid online orders from the Online orders page: prices, label and tracking come from EasyParcel, and the order moves to shipped and delivered by itself. Bookings are paid from your EasyParcel wallet.</p>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      {!st.connected && st.redirectUri && <div className="ep-redir"><span>Register this exact address as the redirect URL of your app in the EasyParcel Developer Hub:</span><code>{st.redirectUri}</code><button type="button" className="dpos-btn ghost sm" onClick={() => { navigator.clipboard?.writeText(st.redirectUri); toast('Copied.') }}>Copy</button></div>}
      {!st.configured && <p className="muted small">Add <b>EASYPARCEL_CLIENT_ID</b> and <b>EASYPARCEL_CLIENT_SECRET</b> to the server settings (Vercel → Environment Variables), then redeploy.</p>}
      <div className="ep-acts">{st.connected
        ? <><span className="muted small">Connected {st.connectedAt ? new Date(st.connectedAt).toLocaleDateString('en-SG') : ''}</span><button type="button" className="dpos-btn ghost sm" onClick={disconnect}>Disconnect</button></>
        : <button type="button" className="dpos-btn" disabled={busy || !st.configured} onClick={connect}>Connect EasyParcel</button>}</div>
      <form onSubmit={save} className="ep-form">
        <h3>Pickup address (where the courier collects)</h3>
        <div className="dpos-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <label className="f">Name<input value={f.pickup.name} maxLength={80} onChange={e => p('name', e.target.value)} placeholder="Mahana Boutique & Tailors" /></label>
          <label className="f">Phone<input value={f.pickup.phone} maxLength={20} inputMode="tel" onChange={e => p('phone', e.target.value)} placeholder="6979 1072" /></label>
          <label className="f">Postal code<input value={f.pickup.postcode} maxLength={10} inputMode="numeric" onChange={e => p('postcode', e.target.value)} placeholder="217701" /></label>
          <label className="f" style={{ gridColumn: '1 / -1' }}>Address<input value={f.pickup.address1} maxLength={200} onChange={e => p('address1', e.target.value)} placeholder="1 Tessensohn Rd, #01-03" /></label>
        </div>
        <h3>Usual parcel size (cm)</h3>
        <div className="dpos-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(90px,140px))' }}>
          {[['length', 'Length'], ['width', 'Width'], ['height', 'Height']].map(([k, l]) => <label className="f" key={k}>{l}<input inputMode="decimal" value={f.parcel[k]} onChange={e => d(k, e.target.value)} /></label>)}
        </div>
        <div style={{ marginTop: 12 }}><button className="dpos-btn" disabled={busy}>{busy ? 'Saving…' : 'Save pickup details'}</button></div>
      </form>
    </section>
  );
}

// Online orders -> Ship: courier prices for this order, pick one, book it; then the label and tracking link.
export function ShipModal({ order, onClose, onDone }) {
  const { toast } = useApp();
  const [q, setQ] = useState(null); const [pick, setPick] = useState(''); const [date, setDate] = useState(tomorrow()); const [err, setErr] = useState(); const [busy, setBusy] = useState(false); const [sh, setSh] = useState(order.shipment || null);
  useEffect(() => { if (sh) return; api(`/admin/orders/${encodeURIComponent(order.order_number)}/shipment/quotes`, { method: 'POST' }).then(r => { setQ(r); setPick(r.quotes[0]?.serviceId || '') }).catch(e => setErr(e.message)) }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const book = async () => { setBusy(true); setErr(); try { const r = await api(`/admin/orders/${encodeURIComponent(order.order_number)}/shipment`, { method: 'POST', body: { serviceId: pick, collectionDate: date } }); setSh(r); toast('Courier booked.'); onDone?.() } catch (e) { setErr(e.message) } finally { setBusy(false) } };
  const refresh = async () => { setBusy(true); setErr(); try { setSh(await api(`/admin/orders/${encodeURIComponent(order.order_number)}/shipment/refresh`, { method: 'POST' })); onDone?.() } catch (e) { setErr(e.message) } finally { setBusy(false) } };
  return (
    <Modal title={sh ? 'Courier booked' : 'Ship with EasyParcel'} sub={`Order ${order.order_number}${q ? ` · ${q.weightKg} kg` : ''}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        {err && <p className="dpos-err" role="alert">{err}</p>}
        {sh ? (
          <div className="ep-done">
            <p><b>{sh.courier || 'Courier'}</b> · {sh.status || 'booked'}</p>
            <p className="muted small">Tracking number: <b>{sh.awb || 'not issued yet — check again in a few minutes'}</b>{sh.collectionDate ? ` · collection ${dmy(sh.collectionDate)}` : ''}</p>
            <div className="ep-acts">{sh.label && <a className="dpos-btn" href={sh.label} target="_blank" rel="noopener noreferrer">Print label</a>}{sh.tracking && <a className="dpos-btn outline" href={sh.tracking} target="_blank" rel="noopener noreferrer">Track parcel</a>}
              <button type="button" className="dpos-btn ghost" disabled={busy} onClick={refresh}>{busy ? 'Checking…' : 'Refresh status'}</button></div>
          </div>
        ) : !q && !err ? <p className="muted">Getting courier prices…</p> : q && (
          <>
            {!q.quotes.length ? <p className="muted">EasyParcel returned no couriers for this parcel.</p> : (
              <div className="ep-quotes" role="radiogroup" aria-label="Courier">{q.quotes.map(x => (
                <label key={x.serviceId} className={`ep-q ${pick === x.serviceId ? 'on' : ''}`}><input type="radio" name="courier" checked={pick === x.serviceId} onChange={() => setPick(x.serviceId)} /><b>{x.courier}</b><span>{x.currency === 'SGD' ? '$' : x.currency + ' '}{x.price.toFixed(2)}</span></label>))}</div>)}
            <label className="f">Collection date<input type="date" min={tomorrow()} value={date} onChange={e => setDate(e.target.value)} /></label>
            <p className="muted small">The price is taken from your EasyParcel wallet when you book.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" className="dpos-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="dpos-btn" disabled={busy || !pick} onClick={book}>{busy ? 'Booking…' : 'Book courier'}</button></div>
          </>)}
      </div>
    </Modal>
  );
}
