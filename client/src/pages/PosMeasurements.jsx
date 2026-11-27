import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PrintSettings from '../components/PrintSettings';
import { InvoicePreview } from './InvoicePage';
import { EyeIcon } from './PosOrders';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { longDate, money } from '../lib/invoiceFormat';
import { PeriodFilter, periodRange, usePeriod } from '../components/PeriodFilter';
import ExportCsv from '../components/ExportCsv';
import { BACK_NECKS, FRONT_NECKS } from '../components/NeckPicker';
import { CM_FIELDS, measureSummary } from '../components/MeasureModal';

const iconOf = (list, v) => list.find(([l]) => l === v)?.[1];
const STATUS = { pending: 'Pending', completed: 'Completed', cancelled: 'Cancelled' };

function Spec({ label, children }) { return <div className="ms-spec"><small>{label}</small><b>{children}</b></div> }

// One measured line: neck styles with their drawings, sleeve, sizes in cm, due date and remarks.
function Line({ it }) {
  const m = it.measure || {};
  const cms = CM_FIELDS.filter(([k]) => m.cm?.[k]);
  return (
    <div className="ms-line">
      <div className="ms-line-h"><b>{it.name}{it.quantity > 1 ? ` × ${it.quantity}` : ''}</b><span>{money(it.lineTotal)}</span></div>
      <div className="ms-specs">
        {m.frontNeck && <Spec label="FRONT NECK"><span className="ms-ic">{iconOf(FRONT_NECKS, m.frontNeck)}</span>{m.frontNeck}</Spec>}
        {m.backNeck && <Spec label="BACK NECK"><span className="ms-ic">{iconOf(BACK_NECKS, m.backNeck)}</span>{m.backNeck}</Spec>}
        {m.sleeveType && <Spec label="SLEEVE TYPE">{m.sleeveType}</Spec>}
        {m.sleeveLength && <Spec label="SLEEVE LENGTH">{m.sleeveLength}</Spec>}
        {m.dueDate && <Spec label="DUE DATE">{longDate(m.dueDate)}</Spec>}
      </div>
      {cms.length > 0 && <div className="ms-cm">{cms.map(([k, l]) => <div key={k}><small>{l.toUpperCase()}</small><b>{m.cm[k]} cm</b></div>)}</div>}
      {m.remarks?.length > 0 && <div className="ms-rem"><small>REMARKS</small><ul>{m.remarks.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
    </div>
  );
}

// Measurements: every bill that has stitching lines, with the measurements taken and where the work stands.
export default function PosMeasurements() {
  const [f, setF] = useState({ q: '', name: '', phone: '', status: 'all' }); const [per, setPer] = usePeriod('all');
  const [data, setData] = useState(null); const [err, setErr] = useState(); const [open, setOpen] = useState({}); const [n, setN] = useState(0);
  const [from, to] = periodRange(per);
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q: f.q, name: f.name, phone: f.phone, status: f.status }); if (from) p.set('from', from); if (to) p.set('to', to);
      api('/admin/pos/measurements?' + p).then(d => { setData(d); setErr() }).catch(e => setErr(e.message));
    }, 220);
    return () => clearTimeout(t);
  }, [f, from, to, n]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const setStatus = async (b, status) => { try { await api(`/admin/pos/sales/${encodeURIComponent(b.invoiceNo)}/tailoring`, { method: 'PATCH', body: { status } }); setN(x => x + 1) } catch (e) { setErr(e.message) } };
  const c = data?.counts;
  const tiles = [['all', 'TOTAL BILLS', c?.all, ''], ['pending', 'PENDING', c?.pending, 'warn'], ['completed', 'COMPLETED', c?.completed, 'ok'], ['cancelled', 'CANCELLED', c?.cancelled, 'bad']];
  const bills = data?.bills || [];
  const [pv, setPv] = useState(null); const [ps, setPs] = useState(null); // invoice preview / print settings for one bill
  return (
    <div className="ms">
      <div className="ms-top">
        <span />
        <div className="ms-top-a"><PeriodFilter value={per} onChange={setPer} />
          <ExportCsv name="measurements" header={['Invoice', 'Date', 'Customer', 'Mobile', 'Status', 'Item', 'Price ($)', 'Measurements']}
            rows={bills.flatMap(b => b.items.map(i => [b.invoiceNo, b.billDate, b.customerName, b.customerPhone, STATUS[b.status], i.name, (i.lineTotal / 100).toFixed(2), measureSummary(i.measure)]))} />
          <Link className="dpos-btn outline" to="/admin/billing/stitching-designs" title="Your own neck designs and sleeve options">Options</Link></div>
      </div>
      <div className="ms-tiles">{tiles.map(([v, l, k, tone]) => <button key={v} type="button" className={`ms-tile ${tone} ${f.status === v ? 'on' : ''}`} aria-pressed={f.status === v} onClick={() => setF({ ...f, status: v })}><small>{l}</small><b>{k ?? '…'}</b></button>)}</div>
      <section className="dpos-card ms-filters">
        <label className="f">Search order ID<input type="search" value={f.q} onChange={set('q')} placeholder="e.g. DP-2026-…" /></label>
        <label className="f">Customer name<input value={f.name} onChange={set('name')} placeholder="Search name…" /></label>
        <label className="f">Customer phone<input value={f.phone} inputMode="tel" onChange={set('phone')} placeholder="Search phone…" /></label>
        <label className="f">Status<select value={f.status} onChange={set('status')}><option value="all">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      </section>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      {!data ? <p className="dpos-empty">Loading…</p> : !bills.length ? <div className="dpos-card"><p className="dpos-empty">No bills with measurements here. Add a service in Billing and take its measurements.</p></div> : (
        <ul className="ms-list">{bills.map(b => (
          <li key={b.invoiceNo} className="ms-card">
            <div className="ms-head">
              <div className="ms-who"><div><b>{b.customerName || 'Guest'}</b><span className="ms-inv">{b.invoiceNo}</span></div>
                <small>{b.customerPhone || '—'} · {longDate(b.billDate)} · {b.items.length} item{b.items.length === 1 ? '' : 's'}</small></div>
              <div className="ms-act">
                {b.status === 'cancelled' ? <span className="ms-st bad">Cancelled</span>
                  : <select className={`ms-st ${b.status === 'completed' ? 'ok' : 'warn'}`} value={b.status} aria-label={`Status of ${b.invoiceNo}`} onChange={e => setStatus(b, e.target.value)}><option value="pending">Pending</option><option value="completed">Completed</option></select>}
                {b.shareToken && <button type="button" className="ms-ib" title="Preview invoice" aria-label={`Preview invoice ${b.invoiceNo}`} onClick={() => setPv(b)}><EyeIcon /></button>}
                {b.shareToken && <button type="button" className="ms-ib print" title="Print" aria-label={`Print ${b.invoiceNo}`} onClick={() => setPs(b)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" rx="1" /></svg></button>}
                <button type="button" className={`ms-chev ${open[b.invoiceNo] ? 'on' : ''}`} aria-expanded={!!open[b.invoiceNo]} aria-label={open[b.invoiceNo] ? 'Hide measurements' : 'Show measurements'} onClick={() => setOpen({ ...open, [b.invoiceNo]: !open[b.invoiceNo] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></button>
              </div>
            </div>
            {open[b.invoiceNo] && <div className="ms-body">{b.customerAddress && <p className="ms-addr">Address: {b.customerAddress}</p>}{b.items.map((it, i) => <Line key={i} it={it} />)}</div>}
          </li>))}</ul>)}
      {pv && <InvoicePreview token={pv.shareToken} invoiceNo={pv.invoiceNo} onClose={() => setPv(null)} />}
      {ps && <PrintSettings onClose={() => setPs(null)} onPrint={({ type, paper }) => { const t = ps.shareToken; setPs(null); window.open(`/invoice/${t}?fmt=${type === 'thermal' ? 'thermal' : 'a4'}&size=${paper}&print=1`, '_blank') }} />}
    </div>
  );
}
