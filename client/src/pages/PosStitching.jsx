import { useEffect, useRef, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import { FRONT_NECKS, BACK_NECKS } from '../components/NeckPicker';
import { SLEEVE_TYPES, SLEEVE_LENGTHS } from '../components/MeasureModal';
import { Icon } from '../components/AdminShell';
import { inr } from '../lib/format';
import { longDate, money } from '../lib/invoiceFormat';
import { PeriodFilter, periodRange, usePeriod } from '../components/PeriodFilter';
import ExportCsv from '../components/ExportCsv';
import { waLink, invoiceUrl, WaIcon, DocIcon, EyeIcon, ReturnIcon, PencilIcon, TrashIcon } from './PosOrders';
import ReturnModal from '../components/ReturnModal';
import EditSaleModal from '../components/EditSaleModal';
import { useApp } from '../context/App';

const ST = { pending: ['Pending', 'warn'], completed: ['Completed', 'ok'], cancelled: ['Cancelled', 'bad'] };
const dueTag = (d, today, status) => !d ? <span className="muted">—</span> : <span className={`sd-due ${status === 'pending' && d < today ? 'late' : status === 'pending' && d === today ? 'now' : ''}`}>{longDate(d)}{status === 'pending' && d < today ? ' · overdue' : status === 'pending' && d === today ? ' · today' : ''}</span>;
const Tile = ({ label, value, sub, tone = '', onClick }) => <div className={`dpos-card2 ${tone} ${onClick ? 'openable' : ''}`} {...(onClick ? { role: 'button', tabIndex: 0, onClick, onKeyDown: e => e.key === 'Enter' && onClick() } : {})}><div className="t"><span>{label}</span></div><div className="v">{value}</div>{sub && <div className="s">{sub}</div>}</div>;

// Opens one order: a bill shows its invoice preview, an open advance order goes to Advance Orders.
const open = (o, openInvoice, goAdvance) => o.kind === 'advance' ? goAdvance(o.invoiceNo) : openInvoice(o.invoiceNo, o);

// ---------- Stitching dashboard ----------
export function StitchingDashboard({ openInvoice, goAdvance, goBilling, goTab }) {
  const [per, setPer] = usePeriod('month'); const [d, setD] = useState(null); const [err, setErr] = useState(); const [from, to] = periodRange(per);
  useEffect(() => { setD(null); const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to); api('/admin/pos/stitching/overview?' + p).then(setD).catch(e => setErr(e.message)) }, [from, to]);
  const List = ({ title, rows, empty, tone }) => (
    <section className="dpos-card"><h2>{title}</h2>
      {!d ? <p className="dpos-empty">Loading…</p> : !rows.length ? <p className="dpos-empty">{empty}</p> : (
        <ul className="sd-list">{rows.map(o => (
          <li key={o.invoiceNo} className={tone}><button type="button" onClick={() => open(o, openInvoice, goAdvance)}>
            <span className="sd-d">{dueTag(o.dueDate, d.today, o.status)}</span>
            <span className="sd-w"><b>{o.customerName || 'Guest'}</b><small>{o.itemNames.join(', ')}</small></span>
            <span className="sd-n">{o.invoiceNo}{o.kind === 'advance' && <i>ADVANCE</i>}</span></button></li>))}</ul>)}
    </section>);
  return (
    <div className="sd">
      <div className="ms-top"><span /><div className="ms-top-a"><PeriodFilter value={per} onChange={setPer} /><button type="button" className="dpos-btn" onClick={goBilling}>+ New stitching order</button></div></div>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      <div className="dpos-k4">
        <Tile label="ACTIVE ORDERS" value={d ? d.counts.pending : '…'} sub="Pending stitching work" onClick={() => goTab('stitching-orders')} />
        <Tile label="DUE TODAY" value={d ? d.dueToday : '…'} sub="Promised for today" />
        <Tile label="OVERDUE" value={d ? d.overdue : '…'} sub="Past the promised date" tone={d?.overdue ? 'exp' : ''} />
        <Tile label="COMPLETED" value={d ? d.counts.completed : '…'} sub="Finished orders" tone="nong" />
        <Tile label="STITCHING REVENUE" value={d ? inr(d.revenue) : '…'} sub={d ? `${d.bills} bill${d.bills === 1 ? '' : 's'} in this period` : ' '} />
        <Tile label="GARMENTS" value={d ? d.garments : '…'} sub={d ? `${inr(d.average)} average each` : ' '} />
        <Tile label="OPEN ADVANCES" value={d ? d.advanceCount : '…'} sub="Deposit taken, work pending" />
        <Tile label="BALANCE TO COLLECT" value={d ? inr(d.advanceBalance) : '…'} sub="On open advance orders" />
      </div>
      <div className="sd-two">
        <List title="Due in the next 7 days" rows={d?.dueSoon || []} empty="Nothing is due in the next 7 days." />
        <List title="Overdue" rows={d?.overdueList || []} empty="No overdue orders. 🎉" tone="late" />
      </div>
      <section className="dpos-card"><div className="dpos-head" style={{ marginBottom: 6 }}><h2 style={{ marginBottom: 0 }}>Recent stitching orders</h2><button type="button" className="dpos-btn ghost sm" onClick={() => goTab('stitching-orders')}>View all →</button></div>
        {!d ? <p className="dpos-empty">Loading…</p> : !d.recent.length ? <p className="dpos-empty">No stitching orders yet. Add a service in Billing and take its measurements.</p> : (
          <div className="dpos-tw"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Due</th><th className="r">Total</th><th>Status</th></tr></thead>
            <tbody>{d.recent.map(o => (
              <tr key={o.invoiceNo} className="click" onClick={() => open(o, openInvoice, goAdvance)}><td className="oid">{o.invoiceNo}{o.kind === 'advance' && <span className="sd-adv">ADVANCE</span>}</td><td><b>{o.customerName || 'Guest'}</b><div className="muted small">{o.customerPhone}</div></td><td>{o.itemNames.join(', ')}</td><td>{dueTag(o.dueDate, d.today, o.status)}</td><td className="r"><b>{money(o.total)}</b></td><td><span className={`ms-st ${ST[o.status][1]}`}>{ST[o.status][0]}</span></td></tr>))}</tbody></table></div>)}
      </section>
    </div>
  );
}

// ---------- Stitching orders ----------
export function StitchingOrders({ openInvoice, goAdvance }) {
  const { user } = useApp(); const manager = ['owner', 'admin'].includes(user?.role); const [retFor, setRetFor] = useState(null); const [editFor, setEditFor] = useState(null);
  const [f, setF] = useState({ q: '', name: '', phone: '', status: 'all' }); const [per, setPer] = usePeriod('all');
  const [data, setData] = useState(null); const [err, setErr] = useState(); const [n, setN] = useState(0); const [from, to] = periodRange(per);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
  useEffect(() => {
    const t = setTimeout(() => { const p = new URLSearchParams({ q: f.q, name: f.name, phone: f.phone, status: f.status }); if (from) p.set('from', from); if (to) p.set('to', to); api('/admin/pos/stitching/orders?' + p).then(d => { setData(d); setErr() }).catch(e => setErr(e.message)) }, 220);
    return () => clearTimeout(t);
  }, [f, from, to, n]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const setStatus = async (o, status) => { try { await api(`/admin/pos/sales/${encodeURIComponent(o.invoiceNo)}/tailoring`, { method: 'PATCH', body: { status } }); setN(x => x + 1) } catch (e) { setErr(e.message) } };
  const voidBill = async o => { const reason = window.prompt(`Void ${o.invoiceNo}? Its stock goes back. Reason?`); if (!reason) return; try { await api(`/admin/pos/sales/${encodeURIComponent(o.invoiceNo)}/void`, { method: 'POST', body: { reason } }); setN(x => x + 1) } catch (e) { setErr(e.message) } };
  const cancelAdv = async o => { if (!confirm(`Cancel ${o.invoiceNo}? Remember to hand back the advance.`)) return; try { await api(`/admin/pos/advances/${encodeURIComponent(o.invoiceNo)}/status`, { method: 'PATCH', body: { status: 'cancelled' } }); setN(x => x + 1) } catch (e) { setErr(e.message) } };
  const c = data?.counts, orders = data?.orders || [];
  const tiles = [['all', 'ALL ORDERS', c?.all, ''], ['pending', 'PENDING', c?.pending, 'warn'], ['completed', 'COMPLETED', c?.completed, 'ok'], ['cancelled', 'CANCELLED', c?.cancelled, 'bad']];
  return (
    <div className="ms">
      <div className="ms-top"><span /><div className="ms-top-a"><PeriodFilter value={per} onChange={setPer} />
        <ExportCsv name="stitching-orders" header={['Order', 'Type', 'Date', 'Customer', 'Mobile', 'Items', 'Due date', 'Total ($)', 'Advance paid ($)', 'Balance ($)', 'Status']}
          rows={orders.map(o => [o.invoiceNo, o.kind === 'advance' ? 'Advance order' : 'Bill', o.billDate, o.customerName, o.customerPhone, o.items.map(i => `${i.name} x${i.quantity}`).join('; '), o.dueDate || '', (o.total / 100).toFixed(2), o.deposit == null ? '' : (o.deposit / 100).toFixed(2), (o.balance / 100).toFixed(2), ST[o.status][0]])} /></div></div>
      <div className="ms-tiles">{tiles.map(([v, l, k, tone]) => <button key={v} type="button" className={`ms-tile ${tone} ${f.status === v ? 'on' : ''}`} aria-pressed={f.status === v} onClick={() => setF({ ...f, status: v })}><small>{l}</small><b>{k ?? '…'}</b></button>)}</div>
      <section className="dpos-card ms-filters">
        <label className="f">Search order ID<input type="search" value={f.q} onChange={set('q')} placeholder="e.g. DP-2026-…" /></label>
        <label className="f">Customer name<input value={f.name} onChange={set('name')} placeholder="Search name…" /></label>
        <label className="f">Customer phone<input value={f.phone} inputMode="tel" onChange={set('phone')} placeholder="Search phone…" /></label>
        <label className="f">Status<select value={f.status} onChange={set('status')}><option value="all">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      </section>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      <section className="dpos-card">
        {!data ? <p className="dpos-empty">Loading…</p> : !orders.length ? <p className="dpos-empty">No stitching orders here. Add a service in Billing and take its measurements.</p> : (
          <div className="dpos-tw"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Due date</th><th className="r">Total</th><th className="r">Balance</th><th>Status</th><th /></tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o.invoiceNo}>
                <td className="oid">{o.invoiceNo}{o.kind === 'advance' && <span className="sd-adv">ADVANCE</span>}<div className="muted small">{longDate(o.billDate)}</div></td>
                <td><b>{o.customerName || 'Guest'}</b><div className="muted small">{o.customerPhone || '—'}</div></td>
                <td>{o.items.map(i => `${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(', ')}</td>
                <td>{dueTag(o.dueDate, today, o.status)}</td>
                <td className="r"><b>{money(o.total)}</b></td>
                <td className="r">{o.balance > 0 ? <b className="sd-bal">{money(o.balance)}</b> : <span className="muted">Paid</span>}</td>
                <td>{o.kind === 'advance' ? <span className="ms-st warn">Pending</span> : o.status === 'cancelled' ? <span className="ms-st bad">Cancelled</span>
                  : <select className={`ms-st ${ST[o.status][1]}`} value={o.status} aria-label={`Status of ${o.invoiceNo}`} onChange={e => setStatus(o, e.target.value)}><option value="pending">Pending</option><option value="completed">Completed</option></select>}</td>
                <td className="r"><div className="dpos-rowact oo-acts">
                  <a className="ra wa" title={o.shareToken ? 'Send invoice on WhatsApp' : 'Message on WhatsApp'} aria-label="Message on WhatsApp" href={waLink(o.customerPhone, o.shareToken ? `Hello${o.customerName ? ' ' + o.customerName : ''}, here is your invoice ${o.invoiceNo} for ${money(o.total)}: ${invoiceUrl(o.shareToken)}` : `Hello${o.customerName ? ' ' + o.customerName : ''}, your order ${o.invoiceNo}${o.dueDate ? ' is due on ' + longDate(o.dueDate) : ''}${o.balance > 0 ? ', balance ' + money(o.balance) : ''}. Thank you!`)} target="_blank" rel="noopener noreferrer"><WaIcon /></a>
                  <button type="button" className="ra doc" title={o.shareToken ? 'Open the invoice' : 'The invoice is made when the order is billed'} aria-label="Open the invoice" disabled={!o.shareToken} onClick={() => open(o, openInvoice, goAdvance)}><DocIcon /></button>
                  <button type="button" className="ra eye" title={o.kind === 'advance' ? 'Open the advance order' : 'View the bill'} aria-label="View" onClick={() => open(o, openInvoice, goAdvance)}><EyeIcon /></button>
                  <button type="button" className="ra ret" title={o.kind === 'bill' ? 'Return items' : 'Returns are made after the order is billed'} aria-label="Return items" disabled={o.kind !== 'bill' || o.status === 'cancelled'} onClick={() => setRetFor(o.invoiceNo)}><ReturnIcon /></button>
                  <button type="button" className="ra edit" title={o.kind === 'bill' ? 'Edit the invoice' : 'Edit the advance order'} aria-label="Edit" disabled={o.status === 'cancelled' || (o.kind === 'bill' && !manager)} onClick={() => o.kind === 'bill' ? setEditFor(o.invoiceNo) : goAdvance(o.invoiceNo)}><PencilIcon /></button>
                  <button type="button" className="ra del" title={o.kind === 'bill' ? 'Void this bill' : 'Cancel this advance order'} aria-label="Delete" disabled={!manager || o.status === 'cancelled'} onClick={() => o.kind === 'bill' ? voidBill(o) : cancelAdv(o)}><TrashIcon /></button></div></td></tr>))}</tbody></table></div>)}
      {retFor && <ReturnModal invoiceNo={retFor} onClose={() => setRetFor(null)} onDone={() => setN(x => x + 1)} />}
      {editFor && <EditSaleModal invoiceNo={editFor} onClose={() => setEditFor(null)} onSaved={() => setN(x => x + 1)} />}
      </section>
    </div>
  );
}

// ---------- Stitching reports ----------
export function StitchingReports() {
  const [per, setPer] = usePeriod('month'); const [d, setD] = useState(null); const [err, setErr] = useState(); const [from, to] = periodRange(per);
  useEffect(() => { setD(null); const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to); api('/admin/pos/stitching/overview?' + p).then(setD).catch(e => setErr(e.message)) }, [from, to]);
  const top = d?.byItem?.[0]?.revenue || 1, maxDay = Math.max(1, ...(d?.daily || []).map(x => x.revenue));
  return (
    <div className="sd">
      <div className="ms-top"><span /><div className="ms-top-a"><PeriodFilter value={per} onChange={setPer} />
        <ExportCsv name="stitching-report" header={['Garment / service', 'Quantity', 'Revenue ($)', 'Share %']} rows={(d?.byItem || []).map(g => [g.name, g.qty, (g.revenue / 100).toFixed(2), d.revenue ? (g.revenue / d.revenue * 100).toFixed(1) : '0'])} /></div></div>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      <div className="dpos-k4">
        <Tile label="STITCHING REVENUE" value={d ? inr(d.revenue) : '…'} sub="Stitching lines on completed bills" tone="nong" />
        <Tile label="BILLS" value={d ? d.bills : '…'} sub="With stitching" />
        <Tile label="GARMENTS" value={d ? d.garments : '…'} sub={d ? `${inr(d.average)} average each` : ' '} />
        <Tile label="PENDING VALUE" value={d ? inr(d.openValue) : '…'} sub={d ? `${d.counts.pending} pending order${d.counts.pending === 1 ? '' : 's'}` : ' '} />
      </div>
      <div className="sd-two">
        <section className="dpos-card"><h2>Revenue by garment</h2>
          {!d ? <p className="dpos-empty">Loading…</p> : !d.byItem.length ? <p className="dpos-empty">No stitching sales in this period.</p> : (
            <ul className="sr-rank">{d.byItem.map(g => <li key={g.name}><div><b>{g.name}</b><span>{g.qty} pcs · {inr(g.revenue)}</span></div><i style={{ width: `${g.revenue / top * 100}%` }} /></li>)}</ul>)}
        </section>
        <section className="dpos-card"><h2>Orders by status</h2>
          {!d ? <p className="dpos-empty">Loading…</p> : (
            <ul className="sr-rank st">{[['Pending', d.counts.pending, 'warn'], ['Completed', d.counts.completed, 'ok'], ['Cancelled', d.counts.cancelled, 'bad']].map(([l, n, t]) => <li key={l} className={t}><div><b>{l}</b><span>{n}</span></div><i style={{ width: `${d.counts.all ? n / d.counts.all * 100 : 0}%` }} /></li>)}</ul>)}
          {d && <p className="muted small" style={{ margin: '12px 0 0' }}>{d.overdue} overdue · {d.dueToday} due today · {inr(d.advanceBalance)} still to collect on {d.advanceCount} open advance order{d.advanceCount === 1 ? '' : 's'}.</p>}
        </section>
      </div>
      <section className="dpos-card"><h2>Stitching revenue by day</h2>
        {!d ? <p className="dpos-empty">Loading…</p> : !d.daily.length ? <p className="dpos-empty">No stitching sales in this period.</p> : (
          <div className="sr-days" role="img" aria-label="Stitching revenue by day">{d.daily.map(x => <div key={x.day} title={`${longDate(x.day)}: ${money(x.revenue)}`}><i style={{ height: `${Math.max(4, x.revenue / maxDay * 100)}%` }} /><span>{x.day.slice(5).split('-').reverse().join('/')}</span></div>)}</div>)}
      </section>
    </div>
  );
}

// Stitching -> Designs: add your own front and back neck designs (a name and, if you like, a picture). They show up with the built-in ones when measurements are taken.
export function StitchingDesigns() {
  const [d, setD] = useState(null); const [err, setErr] = useState(); const [ok, setOk] = useState(); const [busy, setBusy] = useState(false);
  const [nw, setNw] = useState({ front: { name: '', image: null }, back: { name: '', image: null } }); const [opt, setOpt] = useState({ sleeveTypes: '', sleeveLengths: '' });
  useEffect(() => { api('/admin/pos/stitch-designs').then(x => setD({ sleeveTypes: [], sleeveLengths: [], ...x })).catch(e => setErr(e.message)) }, []);
  const save = async next => { setBusy(true); setErr(); setOk(); try { setD(await api('/admin/pos/stitch-designs', { method: 'PUT', body: next })); setOk('Saved.') } catch (e) { setErr(e.message) } finally { setBusy(false) } };
  const add = kind => { const v = nw[kind]; if (!v.name.trim()) return setErr('Give the design a name.'); save({ ...d, [kind]: [...d[kind], { id: Math.random().toString(36).slice(2, 10), name: v.name.trim(), image: v.image }] }).then(() => setNw(x => ({ ...x, [kind]: { name: '', image: null } }))) };
  const addOpt = (kind, builtin) => { const v = opt[kind].trim(); if (!v) return setErr('Type the option first.'); if ([...builtin, ...d[kind]].some(x => x.toLowerCase() === v.toLowerCase())) return setErr('That option already exists.'); save({ ...d, [kind]: [...d[kind], v] }).then(() => setOpt(x => ({ ...x, [kind]: '' }))) };
  const removeOpt = (kind, v) => { if (confirm(`Remove “${v}”? Bills that already use it keep the wording.`)) save({ ...d, [kind]: d[kind].filter(x => x !== v) }) };
  const remove = (kind, id) => { if (confirm('Remove this design? Bills that already use it keep the name.')) save({ ...d, [kind]: d[kind].filter(x => x.id !== id) }) };
  const rename = (kind, id) => { const cur = d[kind].find(x => x.id === id); const name = prompt('Design name', cur.name); if (name && name.trim()) save({ ...d, [kind]: d[kind].map(x => x.id === id ? { ...x, name: name.trim() } : x) }) };
  const pick = async (kind, file, id) => { if (!file) return; try { const up = await uploadImage(file); if (id) save({ ...d, [kind]: d[kind].map(x => x.id === id ? { ...x, image: up.url } : x) }); else setNw(x => ({ ...x, [kind]: { ...x[kind], image: up.url } })) } catch (e) { setErr(e.message) } };
  if (!d) return <p className="dpos-empty">{err || 'Loading…'}</p>;
  const block = (kind, title, builtin) => (
    <section className="dpos-card sdz">
      <h2>{title} <small className="sdz-count">({builtin.length} built in · {d[kind].length} yours)</small></h2>
      <p className="muted small">Built in: {builtin.map(([l]) => l).join(' · ')}</p>
      <ul className="sdz-list">{d[kind].map(x => (
        <li key={x.id}><span className="sdz-ph">{x.image ? <img src={x.image} alt="" /> : <b>{x.name.slice(0, 2).toUpperCase()}</b>}</span><b className="sdz-n">{x.name}</b>
          <label className="ra eye" title="Change the picture" aria-label="Change picture"><input type="file" accept="image/*" hidden onChange={e => pick(kind, e.target.files?.[0], x.id)} /><Icon n="image" size={18} /></label>
          <button type="button" className="ra edit" title="Rename" aria-label="Rename" onClick={() => rename(kind, x.id)}><PencilIcon /></button>
          <button type="button" className="ra del" title="Remove" aria-label="Remove" onClick={() => remove(kind, x.id)}><TrashIcon /></button></li>))}
        {!d[kind].length && <li className="muted small">No designs of your own yet.</li>}</ul>
      <div className="sdz-add">
        <label className="sdz-f"><span>DESIGN NAME</span><input value={nw[kind].name} maxLength={40} onChange={e => setNw(x => ({ ...x, [kind]: { ...x[kind], name: e.target.value } }))} placeholder="e.g. Princess cut" aria-label="Design name" /></label>
        <label className="sdz-f"><span>PICTURE (OPTIONAL)</span><span className="sdz-file">{nw[kind].image ? 'Picture added ✓' : 'No picture yet'}<span className="dpos-btn outline sm">Choose file</span><input type="file" accept="image/*" hidden onChange={e => pick(kind, e.target.files?.[0])} /></span></label>
        <button type="button" className="dpos-btn" disabled={busy} onClick={() => add(kind)}>+ Add design</button></div>
    </section>);
  return (<div className="sdz-wrap">{err && <p className="dpos-err" role="alert">{err}</p>}{ok && <p className="dpos-ok" role="status">{ok}</p>}
    {block('front', 'Front neck designs', FRONT_NECKS)}{block('back', 'Back neck designs', BACK_NECKS)}
    {[['sleeveTypes', 'Sleeve types', SLEEVE_TYPES], ['sleeveLengths', 'Sleeve lengths', SLEEVE_LENGTHS]].map(([kind, title, builtin]) => (
      <section key={kind} className="dpos-card sdz">
        <h2>{title} <small className="sdz-count">({builtin.length} built in · {d[kind].length} yours)</small></h2>
        <p className="muted small">Built in: {builtin.join(', ')}</p>
        {d[kind].length > 0 && <ul className="sdz-chips">{d[kind].map(v => <li key={v}>{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => removeOpt(kind, v)}>×</button></li>)}</ul>}
        <form className="sdz-add" onSubmit={e => { e.preventDefault(); addOpt(kind, builtin) }}>
          <label className="sdz-f"><span>ADD AN OPTION</span><input value={opt[kind]} maxLength={30} onChange={e => setOpt(x => ({ ...x, [kind]: e.target.value }))} placeholder="e.g. Cap sleeve" /></label>
          <button className="dpos-btn" disabled={busy || !opt[kind].trim()}>+ Add</button></form>
      </section>))}</div>);
}
