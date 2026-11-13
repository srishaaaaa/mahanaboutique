import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../context/App';
import PrintSettings, { readPrintPrefs } from '../components/PrintSettings';
import { PrintIcon } from '../components/PrintIcon';
import { CHANNEL, MODE, clock, inWords, longDate, money, num2 } from '../lib/invoiceFormat';
import { measureSummary } from '../components/MeasureModal';
import { billRows, modeName, returnRows } from '../lib/billSummary';
import ReturnModal from '../components/ReturnModal';
import EditSaleModal from '../components/EditSaleModal';
import '../invoice.css';

const phoneShown = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 8 ? `+65 ${d.slice(0, 4)} ${d.slice(4)}` : p || '' };
const amt = v => v < 0 ? `- ${money(-v)}` : money(v);

// The full A4 / A5 invoice.
export function A4Doc({ sale, shop }) {
  const showGst = shop.gstin && shop.showGst?.[sale.channel];
  const terms = String(shop.terms || '').split('\n').map(t => t.trim()).filter(Boolean);
  return (
    <article className="inv-doc">
      {sale.status === 'voided' && <div className="inv-void" aria-hidden="true">VOID</div>}
      {sale.returns?.length > 0 && <p className="inv-retflag" style={{ margin: '0 0 10px', padding: '6px 12px', border: '1px solid #f3b8b8', background: '#fdecec', color: '#b91c1c', fontWeight: 800, letterSpacing: '.06em', fontSize: 12, borderRadius: 6 }}>↩ {sale.items.every(i => i.returnedQty >= i.quantity) ? 'FULLY RETURNED' : 'PARTLY RETURNED'} · {sale.returns.map(r => r.returnNo).join(', ')}</p>}
      <header className="inv-head">
        <div className="inv-brand">
          {shop.logo && <div className="inv-logo"><img src={shop.logo} alt="" /></div>}
          <div>
            <h1>{shop.name}</h1>
            <p className="inv-addr">{(shop.address || []).join(', ')}</p>
            {shop.phone && <p>Phone: {phoneShown(shop.phone)}</p>}
            {shop.email && <p>Email: {shop.email}</p>}
            {showGst && <p>GST Reg. No.: <b>{shop.gstin}</b></p>}
          </div>
        </div>
        <div className="inv-meta">
          <h2>{sale.isGst ? 'TAX INVOICE' : 'INVOICE'}</h2>
          <p className="inv-no">#{sale.invoiceNo}</p>
          {sale.editedAt && <p className="inv-edited">EDITED · {longDate(String(sale.editedAt).slice(0, 10))}</p>}
          <dl>
            <div><dt>Date:</dt><dd>{longDate(sale.billDate)}</dd></div>
            <div><dt>Time:</dt><dd>{clock(sale.createdAt)}</dd></div>
            <div><dt>Payment:</dt><dd>{MODE[sale.paymentMode].toUpperCase()} • {sale.status === 'voided' ? 'VOID' : 'COMPLETED'}</dd></div>
            <div><dt>Channel:</dt><dd>{CHANNEL(sale)}</dd></div>
          </dl>
        </div>
      </header>
      <hr className="inv-rule" />
      <section className="inv-bill">
        <div><p className="inv-l">BILLED TO</p><b className="inv-who">{sale.customerName || 'Walk-in Customer'}</b>{sale.customerPhone && <p className="inv-sm">{phoneShown(sale.customerPhone)}</p>}{sale.customerAddress && <p className="inv-sm">{sale.customerAddress}</p>}</div>
      </section>
      <table className="inv-items">
        <thead><tr><th>#</th><th>ITEM DESCRIPTION</th><th className="c">QTY</th><th className="r">RATE (S$)</th><th className="r">AMOUNT (S$)</th></tr></thead>
        <tbody>{sale.items.map((i, n) => (
          <tr key={n}><td className="n">{n + 1}</td>
            <td><b>{i.name}</b>{i.variant?.size ? <span className="inv-var"> ({i.variant.size}{i.variant.color && i.variant.color !== 'Default' ? `, ${i.variant.color}` : ''})</span> : null}{i.variant?.measure && <span className="inv-msr">{measureSummary(i.variant.measure)}</span>}</td>
            <td className="c mono">{i.quantity}{i.returnedQty > 0 && <small className="inv-ret">returned {i.returnedQty}</small>}</td><td className="r mono muted">{num2(i.unitPrice)}</td><td className="r mono"><b>{num2(i.lineTotal)}</b></td></tr>))}</tbody>
      </table>
      {sale.returns?.length > 0 && (
        <section className="inv-returns"><p className="inv-l">RETURNS AGAINST THIS INVOICE</p>
          {sale.returns.map(r => <div key={r.returnNo} className="inv-ret-row"><span><b>{r.returnNo}</b> · {longDate(String(r.createdAt).slice(0, 10))} · {(r.items || []).map(x => `${x.name} × ${x.qty}`).join(', ')}</span><b className="mono">- {money(r.total)}</b></div>)}
        </section>)}
      <section className="inv-foot">
        <div className="inv-words">
          <p className="inv-l">AMOUNT IN WORDS</p>
          <p className="inv-wd">{inWords(sale.total)}</p>
          <p className="inv-recv">{sale.status === 'voided' ? 'VOID — this bill was cancelled' : <>Paid: <b className="mono">{money(sale.total)}</b><br /><span>{modeName(sale)}</span></>}</p>
          {(terms.length > 0 || sale.notes) && <div className="inv-terms"><b>Terms &amp; Notes:</b>{terms.map((t, i) => <p key={i}>• {t}</p>)}{sale.notes && <p>• {sale.notes}</p>}</div>}
        </div>
        <div className="inv-sum">
          {billRows(sale).map((r, n) => r.kind === 'total'
            ? <div key={n} className="inv-total"><span>TOTAL</span><b>{money(r.value)}</b></div>
            : <div key={n} className={`inv-k-${r.kind}`}><span>{r.label}{r.note && <small> {r.note}</small>}</span>{r.value != null && <b className="mono">{amt(r.value)}</b>}</div>)}
          {sale.discount > 0 && <p className="inv-saved">You saved {money(sale.discount)} on this bill</p>}
        </div>
      </section>
      <hr className="inv-rule thin" />
      <footer className="inv-end">
        <p>Thank you for your visit! • {shop.name}</p>
        <div className="inv-sign"><span>Authorised Signatory</span><small>For {shop.name}</small></div>
      </footer>
    </article>
  );
}

// The thermal roll receipt (58 or 80 mm).
function Thermal({ sale, shop, paper }) {
  const showGst = shop.gstin && shop.showGst?.[sale.channel];
  const row = (l, v, cls = '') => <div className={`inv-tr ${cls}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <article className={`inv-th w${paper}`}>
      {sale.status === 'voided' && <p className="inv-th-void">*** VOID ***</p>}
      <h1>{shop.name}</h1>
      <p className="c">{(shop.address || []).join(', ')}</p>
      {shop.phone && <p className="c">Ph: {phoneShown(shop.phone)}</p>}
      {showGst && <p className="c">GST Reg. No.: {shop.gstin}</p>}
      <hr />
      {row('INVOICE', `#${sale.invoiceNo}`, 'b')}
      {row('Date:', `${longDate(sale.billDate)} ${clock(sale.createdAt)}`)}
      {row('Customer:', sale.customerName || 'Guest', 'cb')}
      <hr />
      <div className="inv-tr b"><span>Item</span><span className="q">Qty</span><span>Amt</span></div>
      <hr className="soft" />
      {sale.items.map((i, n) => (
        <div key={n} className="inv-ti"><div className="inv-tr"><span className="nm">{i.name}</span><span className="q">{i.quantity}</span><span>{num2(i.lineTotal)}</span></div>{i.returnedQty > 0 && <div className="inv-tr sub"><span>  returned {i.returnedQty} of {i.quantity}</span></div>}<hr className="soft" /></div>))}
      {sale.returns?.length > 0 && <div><div className="inv-tr b"><span>RETURNS</span></div>{sale.returns.map(r => <div key={r.returnNo}><div className="inv-tr sub"><span>{r.returnNo}</span><span>- {num2(r.total)}</span></div><div className="inv-tr sub"><span>  {(r.items || []).map(x => `${x.name} x${x.qty}`).join(', ')}</span></div></div>)}<hr className="soft" /></div>}
      {billRows(sale).map((r, n) => r.kind === 'total'
        ? <div key={n}><hr />{row('TOTAL:', money(r.value), 'tot')}<hr /></div>
        : <div key={n}>{row(r.kind === 'paysub' || r.kind === 'tax' ? `  ${r.label}` : r.label, r.value == null ? '' : r.value < 0 ? `- ${num2(-r.value)}` : num2(r.value), r.kind === 'paysub' || r.kind === 'tax' ? 'sub' : r.kind === 'pay' || r.kind === 'strong' ? 'b' : r.kind === 'muted' ? 'sub' : '')}</div>)}
      <hr className="soft" />
      <p className="c words">{inWords(sale.total).toUpperCase()}</p>
      <p className="c thanks">Thank you for your business!</p>
    </article>
  );
}

// ---- Return invoice (credit note): what came back, what was kept, the GST reversed and how it was refunded ----
function ReturnHeader({ ret, shop }) {
  const showGst = shop.gstin && shop.showGst?.[ret.channel];
  return (
    <header className="inv-head">
      <div className="inv-brand">
        {shop.logo && <div className="inv-logo"><img src={shop.logo} alt="" /></div>}
        <div><h1>{shop.name}</h1><p className="inv-addr">{(shop.address || []).join(', ')}</p>{shop.phone && <p>Phone: {phoneShown(shop.phone)}</p>}{shop.email && <p>Email: {shop.email}</p>}{showGst && <p>GST Reg. No.: <b>{shop.gstin}</b></p>}</div>
      </div>
      <div className="inv-meta">
        <h2>RETURN INVOICE</h2><p className="inv-sub-t">CREDIT NOTE</p><p className="inv-no">#{ret.returnNo}</p>
        <dl>
          <div><dt>Date:</dt><dd>{longDate(String(ret.createdAt).slice(0, 10))}</dd></div>
          <div><dt>Time:</dt><dd>{clock(ret.createdAt)}</dd></div>
          <div><dt>Original invoice:</dt><dd><b>#{ret.invoiceNo}</b></dd></div>
          <div><dt>Invoice date:</dt><dd>{longDate(ret.billDate)}</dd></div>
          {ret.approvedBy && <div><dt>Approved by:</dt><dd>{ret.approvedBy}</dd></div>}
        </dl>
      </div>
    </header>
  );
}

function ReturnA4({ ret, shop }) {
  return (
    <article className="inv-doc">
      <ReturnHeader ret={ret} shop={shop} />
      <hr className="inv-rule" />
      <section className="inv-bill"><div><p className="inv-l">CUSTOMER</p><b className="inv-who">{ret.customerName || 'Walk-in Customer'}</b>{ret.customerPhone && <p className="inv-sm">{phoneShown(ret.customerPhone)}</p>}</div>
        <div className="inv-r"><p className="inv-l">AGAINST ORIGINAL INVOICE</p><b>#{ret.invoiceNo}</b><p className="inv-sm">Total {money(ret.saleTotal)}</p></div></section>
      <p className="inv-l inv-sec">ITEMS RETURNED</p>
      <table className="inv-items">
        <thead><tr><th>#</th><th>ITEM DESCRIPTION</th><th className="c">RETURNED</th><th className="r">RATE (S$)</th><th className="r">AMOUNT (S$)</th></tr></thead>
        <tbody>{ret.returned.map((i, n) => <tr key={n}><td className="n">{n + 1}</td><td><b>{i.name}</b>{i.variant?.size ? <span className="inv-var"> ({i.variant.size}{i.variant.color && i.variant.color !== 'Default' ? `, ${i.variant.color}` : ''})</span> : null}<span className="inv-var"> · returned {i.returnQty} of {i.quantity} sold</span></td><td className="c mono">{i.returnQty}</td><td className="r mono muted">{num2(i.unitPrice)}</td><td className="r mono"><b>{num2(i.returnLine)}</b></td></tr>)}</tbody>
      </table>
      <p className="muted small" style={{ margin: '8px 0' }}>Delivery charge is not refunded.</p>
      <p className="inv-l inv-sec">ITEMS NOT RETURNED (KEPT BY THE CUSTOMER)</p>
      {ret.kept.length === 0 ? <p className="inv-none">Nothing — every item on the original invoice has now been returned.</p> : (
        <table className="inv-items kept"><thead><tr><th>#</th><th>ITEM DESCRIPTION</th><th className="c">KEPT</th><th className="r">RATE (S$)</th></tr></thead>
          <tbody>{ret.kept.map((i, n) => <tr key={n}><td className="n">{n + 1}</td><td><b>{i.name}</b>{i.variant?.size ? <span className="inv-var"> ({i.variant.size}{i.variant.color && i.variant.color !== 'Default' ? `, ${i.variant.color}` : ''})</span> : null}</td><td className="c mono">{i.keptQty}</td><td className="r mono muted">{num2(i.unitPrice)}</td></tr>)}</tbody></table>)}
      <section className="inv-foot">
        <div className="inv-words"><p className="inv-l">REFUND IN WORDS</p><p className="inv-wd">{inWords(ret.total)}</p>
          {ret.reason && <p className="inv-recv">Reason: {ret.reason}</p>}
          {ret.otherReturns.length > 0 && <div className="inv-terms"><b>Other returns on this invoice:</b>{ret.otherReturns.map(o => <p key={o.returnNo}>• {o.returnNo} · {money(o.total)}</p>)}</div>}
        </div>
        <div className="inv-sum">{returnRows(ret).map((r, n) => r.kind === 'total' ? <div key={n} className="inv-total"><span>{r.label}</span><b>{money(r.value)}</b></div>
          : <div key={n} className={`inv-k-${r.kind}`}><span>{r.label}{r.note && <small> {r.note}</small>}</span>{r.value != null && <b className="mono">{amt(r.value)}</b>}</div>)}</div>
      </section>
      <hr className="inv-rule thin" />
      <footer className="inv-end"><p>This credit note is issued against invoice #{ret.invoiceNo} • {shop.name}</p><div className="inv-sign"><span>Authorised Signatory</span><small>For {shop.name}</small></div></footer>
    </article>
  );
}

function ReturnThermal({ ret, shop, paper }) {
  const row = (l, v, cls = '') => <div className={`inv-tr ${cls}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <article className={`inv-th w${paper}`}>
      <h1>{shop.name}</h1><p className="c">{(shop.address || []).join(', ')}</p>{shop.phone && <p className="c">Ph: {phoneShown(shop.phone)}</p>}
      <hr />
      <p className="c b">RETURN INVOICE / CREDIT NOTE</p>
      {row('Return:', `#${ret.returnNo}`, 'b')}{row('Date:', `${longDate(String(ret.createdAt).slice(0, 10))} ${clock(ret.createdAt)}`)}
      {row('Orig. invoice:', `#${ret.invoiceNo}`, 'b')}{row('Invoice date:', longDate(ret.billDate))}{row('Customer:', ret.customerName || 'Guest', 'cb')}
      <hr /><p className="b">ITEMS RETURNED</p><hr className="soft" />
      {ret.returned.map((i, n) => <div key={n}><div className="inv-tr"><span className="nm">{i.name}</span><span className="q">{i.returnQty}</span><span>{num2(i.returnLine)}</span></div><div className="inv-tr sub"><span>  {i.returnQty} of {i.quantity} sold</span></div><hr className="soft" /></div>)}
      <p className="b">NOT RETURNED (KEPT)</p><hr className="soft" />
      {ret.kept.length === 0 ? <p className="sub">All items returned</p> : ret.kept.map((i, n) => <div key={n}><div className="inv-tr"><span className="nm">{i.name}</span><span className="q">{i.keptQty}</span><span /></div><hr className="soft" /></div>)}
      {returnRows(ret).map((r, n) => r.kind === 'total' ? <div key={n}><hr />{row('REFUND:', money(r.value), 'tot')}<hr /></div>
        : <div key={n}>{row(r.kind === 'tax' ? `  ${r.label}` : r.label, r.value == null ? '' : r.value < 0 ? `- ${num2(-r.value)}` : num2(r.value), r.kind === 'tax' || r.kind === 'muted' ? 'sub' : r.kind === 'pay' ? 'b' : '')}</div>)}
      {ret.reason && <p>Reason: {ret.reason}</p>}
      <hr className="soft" /><p className="c words">{inWords(ret.total).toUpperCase()}</p><p className="c thanks">Credit note against #{ret.invoiceNo}</p>
    </article>
  );
}

const PAGE = { a4: 'A4; margin: 10mm', a5: 'A5; margin: 8mm', 80: '80mm 297mm; margin: 0', 58: '58mm 297mm; margin: 0' };

export default function InvoicePage() {
  const { token } = useParams(); const [qs] = useSearchParams(); const { user } = useApp();
  const [d, setD] = useState(null); const [err, setErr] = useState(); const [copied, setCopied] = useState(false); const [ps, setPs] = useState(false); const [busy, setBusy] = useState(false);
  const wantsThermal = qs.get('fmt') === 'thermal';
  const [fmt, setFmt] = useState(wantsThermal ? 'thermal' : 'a4');
  const [paper, setPaper] = useState(qs.get('size') || (wantsThermal ? readPrintPrefs().paper : 'a4'));
  const load = () => api('/invoice/' + encodeURIComponent(token)).then(setD).catch(e => setErr(e.message));
  useEffect(() => { load() }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // the paper the browser prints on; a thermal roll is sized to the receipt itself, so nothing is cut off or left blank
    let el = document.getElementById('inv-page-size'); if (!el) { el = document.createElement('style'); el.id = 'inv-page-size'; document.head.appendChild(el) }
    const apply = () => {
      const th = document.querySelector('.inv-th');
      el.textContent = fmt === 'thermal' && th ? `@page { size: ${paper === '58' ? 58 : 80}mm ${Math.ceil(th.getBoundingClientRect().height * 25.4 / 96) + 6}mm; margin: 0 }` : `@page { size: ${PAGE[fmt === 'thermal' ? '80' : paper] || PAGE.a4} }`;
    };
    apply(); const t = setTimeout(apply, 300); window.addEventListener('beforeprint', apply);
    return () => { clearTimeout(t); window.removeEventListener('beforeprint', apply) };
  }, [paper, fmt, d]);
  useEffect(() => { if (d && qs.get('print') === '1') { const t = setTimeout(() => window.print(), 700); return () => clearTimeout(t) } }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.title = d ? (d.kind === 'return' ? `Return ${d.ret.returnNo} · ${d.shop.name}` : `Invoice ${d.sale.invoiceNo} · ${d.shop.name}`) : 'Invoice' }, [d]);
  const [retOpen, setRetOpen] = useState(false); const [editOpen, setEditOpen] = useState(false);

  if (err) return <div className="inv-page"><p className="inv-err">{err}</p></div>;
  if (!d) return <div className="inv-page"><p className="inv-err">Loading invoice…</p></div>;
  const { sale, shop, kind, ret } = d;
  if (kind === 'return') {
    const staffR = !!user && ['owner', 'admin', 'cashier'].includes(user.role);
    const rd = String(ret.customerPhone || '').replace(/\D/g, ''), rlink = `${location.origin}/invoice/${token}`;
    const rwa = `https://wa.me/${rd.length === 8 ? '65' + rd : rd}?text=${encodeURIComponent(`Hello${ret.customerName ? ' ' + ret.customerName : ''}, here is your return invoice ${ret.returnNo} for ${money(ret.total)} against invoice ${ret.invoiceNo}: ${rlink}`)}`;
    return (
      <div className="inv-page">
        <div className="inv-bar">
          {staffR ? <Link className="inv-btn" to="/admin/billing/orders">← Return to POS</Link> : <Link className="inv-btn" to="/">← {shop.name}</Link>}
          <Link className="inv-btn" to={`/invoice/${ret.saleToken}`}>View original bill #{ret.invoiceNo}</Link>
          <span className="inv-grow" />
          <a className="inv-btn" href={rwa} target="_blank" rel="noopener noreferrer">Share WhatsApp</a>
          <button className="inv-btn" onClick={async () => { try { await navigator.clipboard.writeText(rlink); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copy this link', rlink) } }}>{copied ? 'Link copied ✓' : 'Copy Link'}</button>
          <button className="inv-btn dark" onClick={() => setPs(true)}><PrintIcon size={15} /> Print</button>
        </div>
        {fmt === 'thermal' ? <ReturnThermal ret={ret} shop={shop} paper={paper} /> : <ReturnA4 ret={ret} shop={shop} />}
        {ps && <PrintSettings onClose={() => setPs(false)} onPrint={printNow} />}
      </div>);
  }
  const staff = !!user && ['owner', 'admin', 'cashier'].includes(user.role), manager = !!user && ['owner', 'admin'].includes(user.role);
  const link = `${location.origin}/invoice/${token}`;
  const digits = String(sale.customerPhone || '').replace(/\D/g, '');
  const wa = `https://wa.me/${digits.length === 8 ? '65' + digits : digits}?text=${encodeURIComponent(`Hello${sale.customerName ? ' ' + sale.customerName : ''}, here is your invoice ${sale.invoiceNo} from ${shop.name} for ${money(sale.total)}: ${link}`)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copy this link', link) } };
  const printNow = ({ type, paper: p }) => { setFmt(type === 'thermal' ? 'thermal' : 'a4'); setPaper(p); setPs(false); setTimeout(() => window.print(), 350) };
  const voidIt = async () => {
    const reason = window.prompt('Reason for voiding this invoice? Stock will be returned.'); if (!reason) return;
    setBusy(true);
    try { await api(`/admin/pos/sales/${encodeURIComponent(sale.invoiceNo)}/void`, { method: 'POST', body: { reason } }); await load() } catch (e) { window.alert(e.message) } finally { setBusy(false) }
  };
  return (
    <div className="inv-page">
      <div className="inv-bar">
        {staff ? <Link className="inv-btn" to="/admin/billing/orders">← Return to POS</Link> : <Link className="inv-btn" to="/">← {shop.name}</Link>}
        <span className="inv-grow" />
        <a className="inv-btn" href={wa} target="_blank" rel="noopener noreferrer">Share WhatsApp</a>
        <button className="inv-btn" onClick={copy}>{copied ? 'Link copied ✓' : 'Copy Link'}</button>
        {manager && sale.status === 'completed' && !sale.returns?.length && <button className="inv-btn bad" onClick={voidIt} disabled={busy}>Void</button>}
        {manager && sale.status === 'completed' && !sale.returns?.length && sale.items.some(i => i.id != null) && <button className="inv-btn" onClick={() => setEditOpen(true)}>✎ Edit</button>}
        {staff && sale.status === 'completed' && sale.items.some(i => i.id != null && i.returnedQty < i.quantity) && <button className="inv-btn" onClick={() => setRetOpen(true)}>↩ Return items</button>}
        <button className="inv-btn dark" onClick={() => setPs(true)}><PrintIcon size={15} /> Print</button>
      </div>
      {fmt === 'thermal' ? <Thermal sale={sale} shop={shop} paper={paper} /> : <A4Doc sale={sale} shop={shop} />}
      {ps && <PrintSettings onClose={() => setPs(false)} onPrint={printNow} />}
      {retOpen && <ReturnModal sale={sale} onClose={() => setRetOpen(false)} />}
      {editOpen && <EditSaleModal invoiceNo={sale.invoiceNo} onClose={() => setEditOpen(false)} onSaved={() => load()} />}
    </div>
  );
}

// Invoice preview inside the admin page: the invoice as it prints, with "Open Full Page" for the page of its own. No page change, no refresh.
export function InvoicePreview({ token, invoiceNo, onClose }) {
  const nav = useNavigate();
  const [tok, setTok] = useState(token || null); const [d, setD] = useState(null); const [err, setErr] = useState();
  const [orig, setOrig] = useState(null); // the original bill's token and its return invoices, for the tabs
  useEffect(() => { if (!tok && invoiceNo) api('/admin/pos/sales/' + encodeURIComponent(invoiceNo)).then(x => setTok((x.sale || x).shareToken)).catch(e => setErr(e.message)) }, [tok, invoiceNo]);
  useEffect(() => { if (tok) api('/invoice/' + encodeURIComponent(tok)).then(x => { setD(x); if (x.kind === 'return') api('/invoice/' + encodeURIComponent(x.ret.saleToken)).then(y => setOrig({ tok: x.ret.saleToken, returns: y.sale.returns || [] })).catch(() => {}); else setOrig(o => (o && o.tok === tok && o.returns?.length === (x.sale.returns || []).length ? o : { tok, returns: x.sale.returns || [] })) }).catch(e => setErr(e.message)) }, [tok]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', k); document.body.style.overflow = o } }, [onClose]);
  const no = d?.kind === 'return' ? d.ret.returnNo : d?.sale?.invoiceNo || invoiceNo || '';
  return (
    <div className="inv-pv" role="dialog" aria-modal="true" aria-label="Invoice preview" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="inv-pv-box">
        <div className="inv-pv-h"><span><PrintIcon size={16} /> INVOICE PREVIEW • #{no}</span>
          <span className="inv-pv-a">{tok && <button type="button" onClick={() => { onClose(); nav('/invoice/' + tok) }}>Open Full Page ↗</button>}<button type="button" aria-label="Close" onClick={onClose}>✕</button></span></div>
        {orig?.returns?.length > 0 && <div className="inv-tabs" role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 14px', borderBottom: '1px solid #e5e7eb' }}>
          {[{ k: orig.tok, l: 'Original bill', on: tok === orig.tok }, ...orig.returns.map(r => ({ k: r.shareToken, l: r.returnNo, on: tok === r.shareToken }))].map(t => <button key={t.k} type="button" role="tab" aria-selected={t.on} className={`inv-btn ${t.on ? 'dark' : ''}`} onClick={() => { setD(null); setTok(t.k) }}>{t.l}</button>)}
        </div>}
        <div className="inv-page inv-pv-body">{err ? <p className="inv-err">{err}</p> : !d ? <p className="inv-err">Loading invoice…</p> : d.kind === 'return' ? <ReturnA4 ret={d.ret} shop={d.shop} /> : <A4Doc sale={d.sale} shop={d.shop} />}</div>
      </div>
    </div>
  );
}
