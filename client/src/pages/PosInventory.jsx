import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import { inr } from '../lib/format';
import { useApp } from '../context/App';
import { Icon } from '../components/AdminShell';
import Modal from '../components/Modal';
import { Chips } from '../components/PeriodFilter';
import { ColourModal, colourGroups } from '../components/ColourOptions';
import ProductPhotos from '../components/ProductPhotos';
import SuggestPicker from '../components/SuggestPicker';
import StockMovements, { downloadCsv } from '../components/StockMovements';

const toPaise = s => { const n = Math.round(parseFloat(String(s || '').replace(/,/g, '')) * 100); return Number.isFinite(n) && n > 0 ? n : 0 };
const rupees = p => (p / 100).toFixed(2).replace(/\.00$/, '');
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const LOW = 3;
const lowOf = p => p.lowAlert ?? LOW; // each product can set its own alert level (Edit Product → Inventory Alerts)
const Err = ({ children }) => children ? <p className="dpos-err" role="alert">{children}</p> : null;
const ADJ = [['restock', 'Restock', '+ Add', '#1c7a4b', 'plus'], ['return', 'Return', '+ Add', '#1c7a4b', 'swap'], ['loss', 'Loss / Dmg', '− Deduct', '#b3261e', 'trash'], ['reconcile', 'Reconcile', 'Exact Set', '#c27a00', 'eye']];

// Stock adjustment: Restock / Return add, Loss / Damage deducts, Reconcile sets the exact count. The server applies it atomically and logs it.
function StockModal({ product, variantId, onClose, onDone }) {
  const [vid, setVid] = useState(variantId ?? product.variants[0]?.id);
  const [type, setType] = useState('restock'); const [qty, setQty] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  const v = product.variants.find(x => x.id === vid);
  const n = Math.max(0, parseInt(qty, 10) || 0);
  const next = !v ? 0 : type === 'reconcile' ? n : type === 'loss' ? v.stock - n : v.stock + n;
  const bad = !v || (type !== 'reconcile' && n < 1) || next < 0;
  const submit = async () => {
    setBusy(true); setErr();
    try { const out = await api('/admin/pos/stock', { method: 'POST', body: { variantId: vid, type, qty: n, ...(note.trim() ? { note: note.trim() } : {}) } }); onDone(vid, out.stock); onClose() }
    catch (e) { setErr(e.issues?.[0]?.message || e.message) } finally { setBusy(false) }
  };
  return (
    <Modal title="Adjust Inventory Stock" sub="Restock, return, deduct loss, or reconcile count" onClose={onClose}
      footer={<><button className="dpos-btn ghost" onClick={onClose}>Cancel</button><button className="dpos-btn" disabled={bad || busy} onClick={submit}>{busy ? 'Saving…' : `Update (${type === 'reconcile' ? n : (type === 'loss' ? '−' : '+') + n})`}</button></>}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="dpos-box" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div><span className="muted small" style={{ letterSpacing: '.12em', fontWeight: 800 }}>TARGET ITEM</span><div style={{ fontWeight: 800, fontSize: 17 }}>{product.name}</div>
            {product.variants.length > 1 && <select aria-label="Variant" value={vid} onChange={e => setVid(+e.target.value)} style={{ marginTop: 6 }}>{product.variants.map(x => <option key={x.id} value={x.id}>{x.size}{x.color !== 'Default' ? ` · ${x.color}` : ''} · {x.sku} ({x.stock})</option>)}</select>}</div>
          <div style={{ textAlign: 'right' }}><span className="muted small" style={{ letterSpacing: '.12em', fontWeight: 800 }}>CURRENT STOCK</span><div style={{ fontWeight: 800, fontSize: 30 }}>{v?.stock ?? 0} <span className="muted small">units</span></div></div>
        </div>
        <div><p className="muted small" style={{ letterSpacing: '.1em', fontWeight: 800, margin: '0 0 8px' }}>SELECT ADJUSTMENT TYPE *</p>
          <div className="dpos-types" role="radiogroup" aria-label="Adjustment type">{ADJ.map(([k, l, s, c, ic]) => <button key={k} type="button" role="radio" aria-checked={type === k} className={type === k ? 'on' : ''} onClick={() => setType(k)}><Icon n={ic} size={20} />{l}<small style={{ color: c }}>{s}</small></button>)}</div></div>
        <div className="dpos-box"><p className="muted small" style={{ letterSpacing: '.1em', fontWeight: 800, margin: '0 0 8px' }}>{type === 'reconcile' ? 'COUNTED QUANTITY' : type === 'loss' ? 'QUANTITY TO DEDUCT' : 'QUANTITY TO ADD'} *</p>
          <div className="dpos-stepper"><button type="button" aria-label="Decrease" onClick={() => setQty(String(Math.max(0, n - 1)))}>−</button><input inputMode="numeric" aria-label="Quantity" value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))} placeholder="0" /><button type="button" aria-label="Increase" onClick={() => setQty(String(n + 1))}>+</button></div>
          <div className="dpos-quick"><span>QUICK:</span>{[1, 5, 10, 25, 50, 100].map(q => <button key={q} type="button" onClick={() => setQty(String(n + q))}>+{q}</button>)}</div></div>
        <div className="dpos-box" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Current: <b>{v?.stock ?? 0}</b> → New stock: <b style={{ color: next < 0 ? '#b3261e' : undefined }}>{next} units</b></span><b>{next - (v?.stock ?? 0)}</b></div>
        <label className="f">Adjustment note (optional)<input value={note} maxLength={100} onChange={e => setNote(e.target.value)} placeholder="e.g. Received new stock shipment" /></label>
        <Err>{err}</Err>
      </div>
    </Modal>
  );
}

// Everything about one product in one window: details, website text, collections, sizes & colours, and photos.
function VariantRow({ productId, v, basePrice, onChanged, setErr, onlyOne }) {
  const [r, setR] = useState({ size: v.size, color: v.color, sku: v.sku, price: v.priceOverride != null ? rupees(v.priceOverride) : '', cost: v.costOverride != null ? rupees(v.costOverride) : '' });
  const dirty = r.size !== v.size || r.color !== v.color || r.sku !== v.sku || (r.price ? toPaise(r.price) : null) !== (v.priceOverride ?? null) || (r.cost ? toPaise(r.cost) : null) !== (v.costOverride ?? null);
  const call = async (body, method = 'PATCH') => {
    setErr();
    try { await api(`/admin/pos/products/${productId}/variants/${v.id}`, { method, ...(body ? { body } : {}) }); onChanged() }
    catch (x) { setErr(x.issues?.[0]?.message || x.message) }
  };
  return (
    <tr className={v.active ? '' : 'muted'}>
      <td><input aria-label="Size" value={r.size} maxLength={40} onChange={e => setR({ ...r, size: e.target.value })} /></td>
      <td><input aria-label="Colour" value={r.color} maxLength={40} onChange={e => setR({ ...r, color: e.target.value })} /></td>
      <td><input aria-label="SKU" value={r.sku} maxLength={80} onChange={e => setR({ ...r, sku: e.target.value.toUpperCase() })} /></td>
      <td><input aria-label="Own price in dollars" inputMode="decimal" value={r.price} placeholder={rupees(basePrice)} onChange={e => setR({ ...r, price: e.target.value })} /></td>
      <td><input aria-label="Cost price in dollars" inputMode="decimal" value={r.cost} placeholder={v.cost ? rupees(v.cost) : '0'} onChange={e => setR({ ...r, cost: e.target.value })} /></td>
      <td className="r"><b>{v.stock}</b></td>
      <td className="r pe-acts">
        {dirty && <button type="button" className="dpos-btn sm" onClick={() => call({ size: r.size.trim(), color: r.color.trim() || 'Default', sku: r.sku.trim(), price: r.price ? toPaise(r.price) : null, cost: r.cost ? toPaise(r.cost) : null })}>Save</button>}
        <button type="button" className="dpos-btn ghost sm" title={v.active ? 'Hide this size from the website and billing' : 'Show this size again'} onClick={() => call({ active: !v.active })}>{v.active ? 'Hide' : 'Show'}</button>
        <button type="button" className="dpos-btn ghost sm" disabled={onlyOne} aria-label={`Delete ${v.size} ${v.color}`} onClick={() => confirm(`Delete size ${v.size} (${v.color})? Past bills keep their own copy.`) && call(null, 'DELETE')}>✕</button>
      </td>
    </tr>
  );
}

function EditModal({ product: start, categories, onClose, onDone, onPhotos }) {
  const [product, setProduct] = useState(start);
  const [f, setF] = useState({ name: start.name, price: rupees(start.price), cost: start.costPrice ? rupees(start.costPrice) : '', tax: start.taxRate, cat: start.categorySlug || '', status: start.status,
    description: start.description || '', material: start.material || '', featured: !!start.featured, collections: start.collections || [], lowAlert: String(start.lowAlert ?? LOW), bestSeller: !!start.bestSeller });
  const [cols, setCols] = useState([]); const [sug, setSug] = useState([]); const [sug0, setSug0] = useState('');
  useEffect(() => { api(`/admin/pos/products/${start.id}/suggested`).then(r => { setSug(r); setSug0(r.map(x => x.slug).join()) }).catch(() => {}) }, [start.id]);
  const [nv, setNv] = useState({ size: '', color: '', sku: '', stock: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => { api('/admin/taxonomy').then(d => setCols(d.collections || [])).catch(() => {}) }, []);
  const reload = () => api(`/admin/pos/products/${start.id}`).then(setProduct).then(() => onPhotos?.()).catch(e => setErr(e.message));
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr();
    try {
      await api(`/admin/pos/products/${product.id}`, { method: 'PATCH', body: { name: f.name.trim(), price: toPaise(f.price), costPrice: toPaise(f.cost), taxRate: +f.tax, categorySlug: f.cat || null, status: f.status,
        description: f.description.trim(), material: f.material.trim(), featured: f.featured, collections: f.collections, lowAlert: Math.max(0, parseInt(f.lowAlert, 10) || 0), bestSeller: f.bestSeller } });
      if (sug.map(x => x.slug).join() !== sug0) await api(`/admin/pos/products/${product.id}/suggested`, { method: 'PUT', body: { slugs: sug.map(x => x.slug) } });
      onDone(); onClose();
    } catch (x) { setErr(x.issues?.[0]?.message || x.message) } finally { setBusy(false) }
  };
  const addVariant = async e => {
    e.preventDefault(); setErr();
    try {
      await api(`/admin/pos/products/${product.id}/variants`, { method: 'POST', body: { size: nv.size.trim(), color: nv.color.trim() || 'Default', sku: (nv.sku.trim() || `${product.slug}-${slugify(nv.size)}-${slugify(nv.color) || 'default'}`).toUpperCase(), stock: parseInt(nv.stock, 10) || 0 } });
      setNv({ size: '', color: '', sku: '', stock: '' }); reload();
    } catch (x) { setErr(x.issues?.[0]?.message || x.message) }
  };
  const toggleCol = slug => setF(x => ({ ...x, collections: x.collections.includes(slug) ? x.collections.filter(c => c !== slug) : [...x.collections, slug] }));
  return (
    <Modal title="Edit Product" sub={product.name} wide className="pe-wide" onClose={onClose}>
      <Err>{err}</Err>
      <form id="pe-form" onSubmit={submit} className="pe-two">
        <div className="pe-col1">
          <h3 className="pe-h">Basic Details</h3>
          <label className="pe-l">PRODUCT NAME<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} maxLength={160} /></label>
          <label className="pe-l">DESCRIPTION<textarea rows={6} maxLength={4000} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Fabric, work, fit and care. Shown on the product page." /></label>
          <div className="pe-mg"><h3 className="pe-h">Media Gallery</h3></div>
          <ProductPhotos product={product} onChanged={onPhotos} />
        </div>
        <div className="pe-col2">
          <h3 className="pe-h">Organization &amp; Pricing</h3>
          <div className="pe-g2">
            <label className="pe-l">CATEGORY<select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}><option value="">— None —</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
            <label className="pe-l">STATUS<select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="active">Active (on sale)</option><option value="draft">Draft (hidden)</option><option value="archived">Archived</option></select></label>
            <label className="pe-l">SELLING PRICE (S$)<input required inputMode="decimal" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></label>
            <label className="pe-l">COST PRICE (S$)<input inputMode="decimal" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} placeholder="What you paid" /></label>
            <label className="pe-l">GST %<select value={f.tax} onChange={e => setF({ ...f, tax: e.target.value })}>{[0, 9].map(r => <option key={r} value={r}>{r}%</option>)}</select></label>
            <label className="pe-l">FABRIC / MATERIAL<input value={f.material} maxLength={80} onChange={e => setF({ ...f, material: e.target.value })} placeholder="e.g. Cotton" /></label>
          </div>
          <label className="pe-ck"><input type="checkbox" checked={f.bestSeller} onChange={e => setF({ ...f, bestSeller: e.target.checked })} /> Show in “Best Sellers”</label>
          <p className="pe-hint">HOME PAGE SHOWS THE FIRST 4 TICKED, NEWEST FIRST</p>
          <label className="pe-ck"><input type="checkbox" checked={f.featured} onChange={e => setF({ ...f, featured: e.target.checked })} /> Show in “Trending collections”</label>
          {cols.length > 0 && <div className="pe-cols">{cols.map(c => <label key={c.slug} className={`pe-col ${f.collections.includes(c.slug) ? 'on' : ''}`}><input type="checkbox" checked={f.collections.includes(c.slug)} onChange={() => toggleCol(c.slug)} />{c.name}</label>)}</div>}
          <h3 className="pe-h pe-h2">Inventory Alerts</h3>
          <label className="pe-l pe-narrow">LOW-STOCK ALERT AT<input inputMode="numeric" value={f.lowAlert} onChange={e => setF({ ...f, lowAlert: e.target.value.replace(/\D/g, '') })} /></label>
          <p className="pe-hint">COMPARED AGAINST THE TOTAL ACROSS ALL VARIANTS</p>
        </div>
      </form>
      <section className="pe-vars-sec">
        <div className="pe-vh"><div><h3 className="pe-h">Product Variants</h3><p className="pe-hint">MANAGE SIZES, COLORS, AND SPECIFIC INVENTORY</p></div></div>
        <div className="acc-scroll"><table className="dpos-table pe-vars">
          <thead><tr><th>Size</th><th>Colour</th><th>SKU</th><th>Selling price S$</th><th>Cost price S$</th><th className="r">Stock</th><th /></tr></thead>
          <tbody>{(product.variants || []).map(v => <VariantRow key={`${v.id}-${v.size}-${v.color}-${v.sku}-${v.priceOverride}-${v.active}`} productId={product.id} v={v} basePrice={product.price} onChanged={reload} setErr={setErr} onlyOne={product.variants.length < 2} />)}</tbody>
        </table></div>
        <form onSubmit={addVariant} className="pe-add">
          <input aria-label="New size" required placeholder="Size" value={nv.size} onChange={e => setNv({ ...nv, size: e.target.value })} />
          <input aria-label="New colour" placeholder="Colour" value={nv.color} onChange={e => setNv({ ...nv, color: e.target.value })} />
          <input aria-label="New SKU" placeholder="SKU (auto)" value={nv.sku} onChange={e => setNv({ ...nv, sku: e.target.value })} />
          <input aria-label="Opening stock" inputMode="numeric" placeholder="Stock" value={nv.stock} onChange={e => setNv({ ...nv, stock: e.target.value.replace(/\D/g, '') })} />
          <button className="pe-addrow">+ Add Row</button>
        </form>
        <div className="pe-save"><button type="button" className="pe-cancel" onClick={onClose}>Cancel</button><button form="pe-form" className="pe-savebtn" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button></div>
      </section>
      <div className="pe-sug"><SuggestPicker value={sug} onChange={setSug} selfId={product.id} /></div>
    </Modal>
  );
}

const blankVar = () => ({ size: '', color: '', price: '', cost: '', stock: '' });
function AddModal({ categories, onClose, onDone }) {
  const [f, setF] = useState({ name: '', description: '', price: '', cost: '', tax: 9, cat: '', status: 'active', material: '', featured: false, bestSeller: false, defaultStock: '', lowAlert: String(LOW) });
  const [sug, setSug] = useState([]); const [vars, setVars] = useState([blankVar()]); const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(); const pick = useRef();
  const setV = (i, p) => setVars(v => v.map((x, n) => n === i ? { ...x, ...p } : x));
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(u => URL.revokeObjectURL(u)), [previews]);
  const submit = async e => {
    e.preventDefault(); setErr();
    if (!f.name.trim()) return setErr('Enter the product name.');
    if (!(toPaise(f.price) > 0)) return setErr('Enter the selling price.');
    setBusy(true);
    const base = slugify(f.name) || 'product', dflt = Math.max(0, parseInt(f.defaultStock, 10) || 0);
    const rows = vars.filter(v => v.size.trim() || v.color.trim() || v.stock !== '' || v.price !== '');
    const list = rows.length ? rows : [{ size: '', color: '', price: '', stock: '' }];
    const payload = slug => ({ slug, name: f.name.trim(), description: f.description.trim(), category: f.cat || undefined, price: toPaise(f.price), ...(toPaise(f.cost) ? { cost_price: toPaise(f.cost) } : {}), gst_rate: +f.tax, status: f.status,
      material: f.material.trim() || undefined, featured: f.featured, best_seller: f.bestSeller, low_stock_alert: Math.max(0, parseInt(f.lowAlert, 10) || 0),
      variants: list.map(v => ({ size: v.size.trim() || 'Free Size', color: v.color.trim() || 'Default', sku: `${slug}-${slugify(v.size) || 'free'}-${slugify(v.color) || 'default'}`.toUpperCase(), stock: v.stock === '' ? dflt : Math.max(0, parseInt(v.stock, 10) || 0), ...(toPaise(v.price) ? { price: toPaise(v.price) } : {}), ...(toPaise(v.cost) ? { cost: toPaise(v.cost) } : {}) })) });
    try {
      let made;
      try { made = await api('/admin/products', { method: 'POST', body: payload(base) }) }
      catch (x) { if (x.status !== 409) throw x; made = await api('/admin/products', { method: 'POST', body: payload(`${base}-${Math.random().toString(36).slice(2, 6)}`) }) }
      for (const file of files) { const up = await uploadImage(file); await api(`/admin/products/${made.id}/images`, { method: 'POST', body: { url: up.url, alt: f.name.trim() } }) }
      if (sug.length && made?.id) await api(`/admin/pos/products/${made.id}/suggested`, { method: 'PUT', body: { slugs: sug.map(x => x.slug) } }).catch(() => {});
      onClose(); onDone(made?.id, f.name.trim(), files.length > 0);
    } catch (x) { setErr(x.issues?.[0] ? `${x.issues[0].path}: ${x.issues[0].message}` : x.message) } finally { setBusy(false) }
  };
  return (
    <Modal title="Add Product" sub="New products appear in billing and, when Active, on the website" wide className="pe-wide" onClose={onClose}>
      <Err>{err}</Err>
      <form id="pa-form" onSubmit={submit} className="pe-two">
        <div className="pe-col1">
          <h3 className="pe-h">Basic Details</h3>
          <label className="pe-l">PRODUCT NAME<input required autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} maxLength={160} placeholder="e.g. Kanjivaram Silk Saree · Maroon" /></label>
          <label className="pe-l">DESCRIPTION<textarea rows={5} maxLength={4000} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Tell your customers about this product…" /></label>
          <div className="pe-mg"><h3 className="pe-h">Media Gallery</h3><button type="button" className="pe-up" onClick={() => pick.current?.click()}>Upload</button></div>
          <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => { setFiles(fs => [...fs, ...e.target.files].slice(0, 8)); e.target.value = '' }} />
          <div className="pe-gal">
            {previews.map((u, i) => <div key={u} className="pe-tile"><img src={u} alt="" />{i === 0 && <span className="pe-primary">PRIMARY</span>}<button type="button" aria-label="Remove photo" onClick={() => setFiles(fs => fs.filter((_, n) => n !== i))}>✕</button></div>)}
            {files.length < 8 && <button type="button" className="pe-tile add" aria-label="Add photos" onClick={() => pick.current?.click()}>＋</button>}
          </div>
        </div>
        <div className="pe-col2">
          <h3 className="pe-h">Organization &amp; Pricing</h3>
          <div className="pe-g2">
            <label className="pe-l">CATEGORY<select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
            <label className="pe-l">STATUS<select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="active">Active (on sale)</option><option value="draft">Draft (hidden)</option></select></label>
            <label className="pe-l">SELLING PRICE (S$)<input required inputMode="decimal" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} placeholder="0" /></label>
            <label className="pe-l">COST PRICE (S$)<input inputMode="decimal" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} placeholder="What you paid" /></label>
            <label className="pe-l">GST %<select value={f.tax} onChange={e => setF({ ...f, tax: e.target.value })}>{[0, 9].map(r => <option key={r} value={r}>{r}%</option>)}</select></label>
            <label className="pe-l">FABRIC / MATERIAL<input value={f.material} maxLength={80} onChange={e => setF({ ...f, material: e.target.value })} placeholder="e.g. Cotton" /></label>
          </div>
          <label className="pe-ck"><input type="checkbox" checked={f.featured} onChange={e => setF({ ...f, featured: e.target.checked })} /> Show in “Trending collections”</label>
          <label className="pe-ck"><input type="checkbox" checked={f.bestSeller} onChange={e => setF({ ...f, bestSeller: e.target.checked })} /> Show in “Best Sellers”</label>
          <p className="pe-hint">HOME PAGE SHOWS THE FIRST 4 TICKED, NEWEST FIRST</p>
          <h3 className="pe-h pe-h2">Inventory Alerts</h3>
          <div className="pe-g2">
            <label className="pe-l">DEFAULT STOCK<input inputMode="numeric" value={f.defaultStock} onChange={e => setF({ ...f, defaultStock: e.target.value.replace(/\D/g, '') })} placeholder="0" /></label>
            <label className="pe-l">LOW-STOCK ALERT AT<input inputMode="numeric" value={f.lowAlert} onChange={e => setF({ ...f, lowAlert: e.target.value.replace(/\D/g, '') })} /></label>
          </div>
          <p className="pe-hint">DEFAULT STOCK FILLS ANY SIZE ROW LEFT EMPTY · ALERT IS COMPARED AGAINST THE TOTAL ACROSS ALL VARIANTS</p>
        </div>
      </form>
      <section className="pe-vars-sec">
        <div className="pe-vh"><div><h3 className="pe-h">Product Variants</h3><p className="pe-hint">MANAGE SIZES, COLOURS AND SPECIFIC INVENTORY</p></div><button type="button" className="pe-addrow" onClick={() => setVars(v => [...v, blankVar()])}>＋ Add Row</button></div>
        <div className="pe-vhead"><span>SIZE</span><span>COLOUR</span><span>SELLING (S$)</span><span>COST (S$)</span><span>STOCK</span><span /></div>
        {vars.map((v, i) => (
          <div key={i} className="pe-vrow">
            <input aria-label="Size" placeholder="e.g. M" value={v.size} onChange={e => setV(i, { size: e.target.value })} />
            <input aria-label="Colour" placeholder="e.g. Blue" value={v.color} onChange={e => setV(i, { color: e.target.value })} />
            <input aria-label="Own price" inputMode="decimal" placeholder="Same" value={v.price} onChange={e => setV(i, { price: e.target.value })} />
            <input aria-label="Own cost" inputMode="decimal" placeholder="Same" value={v.cost} onChange={e => setV(i, { cost: e.target.value })} />
            <input aria-label="Stock" inputMode="numeric" placeholder="0" value={v.stock} onChange={e => setV(i, { stock: e.target.value.replace(/\D/g, '') })} />
            <button type="button" className="pe-vdel" aria-label="Remove row" disabled={vars.length === 1} onClick={() => setVars(vs => vs.filter((_, n) => n !== i))}>🗑</button>
          </div>))}
        <div className="pe-save"><button type="button" className="pe-cancel" onClick={onClose}>Cancel</button><button form="pa-form" className="pe-savebtn" disabled={busy}>{busy ? 'Saving…' : 'Add to Catalog'}</button></div>
      </section>
      <div className="pe-sug"><SuggestPicker value={sug} onChange={setSug} /></div>
    </Modal>
  );
}

// Stock Alert: products that are low or sold out, each with +1 / +5 / +10 quick restock buttons for the sizes that need it.
function StockAlert({ list, stocker, manager, onClose, onEdit, onRestock }) {
  const need = list.filter(p => p.stock <= lowOf(p) || p.variants.some(v => v.stock < 1));
  const [busy, setBusy] = useState(null); const [err, setErr] = useState();
  const add = async (v, n) => {
    setBusy(v.id); setErr();
    try { const out = await api('/admin/pos/stock', { method: 'POST', body: { variantId: v.id, type: 'restock', qty: n } }); onRestock(v.id, out.stock) }
    catch (e) { setErr(e.message) } finally { setBusy(null) }
  };
  return (
    <div className="dpos-modal" role="dialog" aria-modal="true" aria-label="Stock alert" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="dpos-mbox inv-alert">
        <div className="inv-alert-h"><span className="inv-alert-i" aria-hidden="true">⚠</span><div><h2>Stock Alert</h2><p>{need.length} product{need.length === 1 ? '' : 's'} need attention</p></div></div>
        {err && <p className="dpos-err" role="alert">{err}</p>}
        <div className="inv-alert-l">
          {need.length === 0 && <p className="dpos-empty">Everything is well stocked.</p>}
          {need.map(p => {
            const out = p.stock < 1, vs = p.variants.filter(v => v.stock <= 1);
            return (
              <div key={p.id} className={`inv-alert-p ${out ? 'out' : ''}`}>
                <div className="inv-alert-t"><div><b>{p.name}</b><small>{p.category || 'Product'} · <em>{p.stock} unit{p.stock === 1 ? '' : 's'} in total</em> · alert at {lowOf(p)} or fewer</small></div>
                  {manager && <button type="button" className="inv-alert-e" onClick={() => onEdit(p)}>Edit</button>}</div>
                {vs.map(v => (
                  <div key={v.id} className="inv-alert-v"><span>{v.size}{v.color && v.color !== 'Default' ? ` / ${v.color}` : ''} · {v.stock < 1 ? 'sold out' : `${v.stock} left`}</span>
                    {stocker && <span className="inv-alert-q">{[1, 5, 10].map(n => <button key={n} type="button" disabled={busy === v.id} onClick={() => add(v, n)}>+{n}</button>)}</span>}</div>))}
              </div>);
          })}
        </div>
        <button type="button" className="inv-alert-d" onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

function ProductsStock({ manager, stocker }) {
  const { toast } = useApp();
  const [q, setQ] = useState(''); const [stock, setStock] = useState('all'); const [list, setList] = useState(null); const [cats, setCats] = useState([]);
  const [view, setView] = useState('grid'); const [alertOpen, setAlertOpen] = useState(false); const [catF, setCatF] = useState(''); const [sort, setSort] = useState('name');
  const [open, setOpen] = useState(null); const [modal, setModal] = useState(null); const [err, setErr] = useState(); const [nv, setNv] = useState({ size: '', color: '', sku: '', stock: '' });
  const load = useCallback(() => api('/admin/pos/products?q=' + encodeURIComponent(q)).then(r => { setList(r); setErr() }).catch(e => setErr(e.message)), [q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load]);
  useEffect(() => { api('/admin/pos/categories').then(setCats).catch(() => {}) }, []);
  const needCount = useMemo(() => (list || []).filter(p => p.stock <= lowOf(p) || p.variants.some(v => v.stock < 1)).length, [list]);
  useEffect(() => { if (list && needCount && !q) { try { if (sessionStorage.getItem('inv-alert-seen')) return; sessionStorage.setItem('inv-alert-seen', '1') } catch { /* private mode */ } setAlertOpen(true) } }, [list]); // eslint-disable-line
  const counts = useMemo(() => { const l = list || []; return { out: l.filter(p => p.stock < 1).length, low: l.filter(p => p.stock >= 1 && p.stock <= lowOf(p)).length, sizes: l.filter(p => p.stock >= 1 && p.variants.some(v => v.stock < 1)).length, na: l.filter(p => p.newArrival).length, best: l.filter(p => p.bestSeller).length } }, [list]);
  const shown = useMemo(() => (list || []).filter(p => (!catF || p.categorySlug === catF) && (stock === 'all' || (stock === 'best' ? p.bestSeller : stock === 'out' ? p.stock < 1 : stock === 'low' ? p.stock >= 1 && p.stock <= lowOf(p) : p.stock > lowOf(p)))).sort((a, b) => sort === 'stock-asc' ? a.stock - b.stock : sort === 'stock-desc' ? b.stock - a.stock : sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : a.name.localeCompare(b.name)), [list, stock, catF, sort]);
  const del = async p => { if (!confirm(`Delete "${p.name}" permanently, with its sizes and photos? Past bills keep their own copy.`)) return; try { await api('/admin/products/' + p.id, { method: 'DELETE' }); toast('Product deleted.'); if (open === p.id) setOpen(null); load() } catch (e) { setErr(e.message) } };
  const addVariant = async (p, e) => {
    e.preventDefault(); setErr();
    try { await api(`/admin/pos/products/${p.id}/variants`, { method: 'POST', body: { size: nv.size.trim(), color: nv.color.trim() || 'Default', sku: (nv.sku.trim() || `${p.slug}-${slugify(nv.size)}-${slugify(nv.color) || 'default'}`).toUpperCase(), stock: parseInt(nv.stock, 10) || 0 } }); setNv({ size: '', color: '', sku: '', stock: '' }); load() }
    catch (x) { setErr(x.issues?.[0]?.message || x.message) }
  };
  const removeColour = async (p, name) => { if (!confirm(`Remove the colour “${name}” and all its sizes from ${p.name}? Past bills keep their own copy.`)) return; try { await api(`/admin/pos/products/${p.id}/colours?color=${encodeURIComponent(name)}`, { method: 'DELETE' }); toast('Colour removed.'); load() } catch (e) { setErr(e.message) } };
  const stockDone = (vid, n) => { setList(l => l.map(p => ({ ...p, variants: p.variants.map(v => v.id === vid ? { ...v, stock: n } : v), stock: p.variants.some(v => v.id === vid) ? p.variants.reduce((s, v) => s + (v.id === vid ? n : v.stock), 0) : p.stock }))); toast(`Stock updated: ${n} left`) };
  const tag = (s, lo = LOW) => s < 1 ? <span className="dpos-pill bad">Out</span> : s <= lo ? <span className="dpos-pill bad">Low</span> : null;

  return (
    <>
      <div className="inv-head"><div><p>{list ? `${list.length} products` : '…'} · same catalog customers see</p></div>
        <div className="inv-head-a">
          <button type="button" className={`inv-alerts ${needCount ? 'warn' : ''}`} onClick={() => setAlertOpen(true)}>🔔 Alerts{needCount > 0 && <b>{needCount}</b>}</button>
          {manager && <button type="button" className="inv-add" onClick={() => setModal({ t: 'add' })}><Icon n="plus" size={16} /> Add Product</button>}
        </div></div>
      {list && (counts.out > 0 || counts.low > 0 || counts.sizes > 0) && <div className="inv-banner" role="status">⚠ {[counts.out ? `${counts.out} out of stock` : null, counts.low ? `${counts.low} running low` : null, counts.sizes ? `${counts.sizes} with a size sold out` : null].filter(Boolean).join(' · ')} — restock soon.</div>}
      <div className="inv-filters">
        <div className="inv-chips" role="group" aria-label="Stock filter">{[['all', 'All'], ['best', `Best Sellers (${counts.best})`], ['low', 'Low Stock'], ['out', 'Out of Stock']].map(([v, l]) => <button key={v} type="button" className={`${stock === v ? 'on' : ''} ${v === 'new' || v === 'best' ? 'hl' : ''}`} aria-pressed={stock === v} onClick={() => setStock(v)}>{l}</button>)}</div>
        <select value={catF} onChange={e => setCatF(e.target.value)} aria-label="Category">{[['', 'All Categories'], ...cats.map(c => [c.slug, c.name])].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">{[['name', 'Name A–Z'], ['stock-asc', 'Stock: low to high'], ['stock-desc', 'Stock: high to low'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <div className="inv-view" role="group" aria-label="View">{[['grid', 'Grid'], ['list', 'List']].map(([v, l]) => <button key={v} type="button" className={view === v ? 'on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{l}</button>)}</div>
        <label className="inv-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" /></label>
      </div>
      <Err>{err}</Err>
      {view === 'grid' && (!list ? <p className="dpos-empty">Loading…</p> : !shown.length ? <p className="dpos-empty">No products found.</p> : (
        <ul className="inv-grid">{shown.map(p => {
          const st = p.stock < 1 ? ['out', 'OUT OF STOCK'] : p.stock <= lowOf(p) ? ['low', 'LOW STOCK'] : ['in', 'IN STOCK'];
          return (
            <li key={p.id} className={`inv-card ${st[0]}`}>
              <div className="inv-photo">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <span aria-hidden="true">No photo</span>}
                <span className={`inv-badge ${st[0]}`}>{st[1]}</span>
                <span className="inv-ic">{manager && <button type="button" aria-label={`Edit ${p.name}`} onClick={() => setModal({ t: 'edit', p })}><Icon n="edit" size={16} /></button>}{manager && <button type="button" className="del" aria-label={`Delete ${p.name}`} onClick={() => del(p)}><Icon n="trash" size={16} /></button>}</span></div>
              <div className="inv-body"><div className="inv-nm"><b title={p.name}>{p.name}</b><strong>{inr(p.price)}</strong></div><small>{p.category || 'Product'}</small>
                {manager && <div className="inv-pr"><span>Cost<b>{p.costPrice ? inr(p.costPrice) : '—'}</b></span><span>Selling<b>{inr(p.price)}</b></span></div>}
                <div className="inv-foot"><button type="button" className="inv-units" onClick={() => stocker && setModal({ t: 'stock', p })} disabled={!stocker}><b>{p.stock}</b> Total Units</button><span>{st[0] === 'in' ? 'In stock' : st[0] === 'low' ? `Low · reorder @ ${lowOf(p)}` : 'Sold out'}</span></div></div>
            </li>);
        })}</ul>))}
      <section className="dpos-card" style={{ padding: '8px 16px', display: view === 'list' ? 'block' : 'none' }}>
        <div className="dpos-ph"><span /><span>Product</span><span>Type</span><span style={{ textAlign: 'right' }}>Stock</span><span style={{ textAlign: 'right' }}>{manager ? 'Cost / Selling' : 'Price'}</span><span style={{ textAlign: 'right' }}>Actions</span></div>
        {!list ? <p className="dpos-empty">Loading…</p> : !shown.length ? <p className="dpos-empty">No products found.</p> : shown.map(p => (
          <div className="dpos-prod" key={p.id}>
            <div className="dpos-prow">
              <button className={`chev ${open === p.id ? 'open' : ''}`} aria-expanded={open === p.id} aria-label={open === p.id ? 'Hide details' : 'Show details'} onClick={() => setOpen(open === p.id ? null : p.id)}><Icon n="chevron" size={16} /></button>
              <div className="nm"><b>{p.name}</b><small>{open === p.id ? '▲ Hide details' : '▼ Open in detail'}{p.variants.length > 1 ? ` · ${p.variants.length} sizes` : ''}{p.status !== 'active' ? ` · ${p.status}` : ''}{p.isSample ? ' · sample' : ''}</small></div>
              <span><span className="dpos-pill">Product</span></span>
              <b style={{ textAlign: 'right' }}>{p.stock} {tag(p.stock, lowOf(p))}</b>
              <b style={{ textAlign: 'right' }}>{manager && <small className="muted" style={{ fontWeight: 600 }}>{p.costPrice ? inr(p.costPrice) : '—'} / </small>}{inr(p.price)}</b>
              <div className="dpos-acts">
                <button className={`dpos-btn sm ${open === p.id ? '' : 'ghost'}`} onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Close' : 'Details'}</button>
                {manager && <button className="dpos-btn ghost sm" onClick={() => setModal({ t: 'edit', p })}><Icon n="edit" size={14} />Edit</button>}
                {stocker && <button className="dpos-btn ghost sm" onClick={() => setModal({ t: 'stock', p })}>Stock</button>}
                {manager && <button className="dpos-btn danger sm" onClick={() => del(p)}><Icon n="trash" size={14} />Delete</button>}
              </div>
            </div>
            {open === p.id && (
              <div className="dpos-detail">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <b style={{ letterSpacing: '.06em', textTransform: 'uppercase' }}>● Product detail — {p.name}</b>
                  <div className="dpos-acts">{manager && <button className="dpos-btn sm" onClick={() => setModal({ t: 'edit', p })}>Edit</button>}{stocker && <button className="dpos-btn ghost sm" onClick={() => setModal({ t: 'stock', p })}>Adjust Stock</button>}<button className="dpos-btn ghost sm" onClick={() => setOpen(null)}>Close</button></div></div>
                <div className="dpos-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  {[['Selling price', inr(p.price)], ['Category', p.category || '—'], ['GST', `${p.taxRate}%`], ['Status', p.status]].map(([l, v]) => <div key={l}><span className="muted small" style={{ letterSpacing: '.1em', fontWeight: 800, textTransform: 'uppercase' }}>{l}</span><div style={{ fontWeight: 800 }}>{v}</div></div>)}
                </div>
                <div>
                  <div className="dpos-head" style={{ marginBottom: 8 }}><b className="muted small" style={{ letterSpacing: '.1em', textTransform: 'uppercase' }}>Colour options</b>{manager && <button className="dpos-btn sm" onClick={() => setModal({ t: 'colour', p })}>+ Add colour</button>}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{colourGroups(p).map(c => (
                    <span key={c.name} className="dpos-pill" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '7px 12px', fontSize: 11 }}>{c.name} · {c.stock} in stock{c.price !== p.price ? ` · ${inr(c.price)}` : ''}
                      {manager && colourGroups(p).length > 1 && <button type="button" aria-label={`Remove colour ${c.name}`} style={{ color: '#b3261e', fontWeight: 800 }} onClick={() => removeColour(p, c.name)}>✕</button>}</span>))}</div>
                </div>
                <div className="dpos-tw"><table><thead><tr><th>Size</th><th>Colour</th><th>SKU</th><th className="r">Stock</th><th /></tr></thead>
                  <tbody>{p.variants.map(v => <tr key={v.id}><td>{v.size}</td><td>{v.color}</td><td className="muted small">{v.sku}</td><td className="r"><b>{v.stock}</b> {tag(v.stock)}</td><td className="r">{stocker && <button className="dpos-btn ghost sm" onClick={() => setModal({ t: 'stock', p, vid: v.id })}>Stock</button>}</td></tr>)}</tbody></table></div>
                {manager && <form onSubmit={e => addVariant(p, e)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr)) auto', gap: 8 }}>
                  <input required aria-label="New size" placeholder="New size" value={nv.size} onChange={e => setNv({ ...nv, size: e.target.value })} /><input aria-label="Colour" placeholder="Colour" value={nv.color} onChange={e => setNv({ ...nv, color: e.target.value })} />
                  <input aria-label="SKU" placeholder="SKU (auto)" value={nv.sku} onChange={e => setNv({ ...nv, sku: e.target.value })} /><input aria-label="Opening stock" inputMode="numeric" placeholder="Stock" value={nv.stock} onChange={e => setNv({ ...nv, stock: e.target.value.replace(/\D/g, '') })} />
                  <button className="dpos-btn sm">+ Add size</button></form>}
              </div>)}
          </div>))}
      </section>
      {alertOpen && list && <StockAlert list={list} stocker={stocker} manager={manager} onClose={() => setAlertOpen(false)} onEdit={p => { setAlertOpen(false); setModal({ t: 'edit', p }) }} onRestock={stockDone} />}
      {modal?.t === 'stock' && <StockModal product={list.find(x => x.id === modal.p.id) || modal.p} variantId={modal.vid} onClose={() => setModal(null)} onDone={stockDone} />}
      {modal?.t === 'edit' && <EditModal product={modal.p} categories={cats} onClose={() => setModal(null)} onDone={() => { toast('Product saved.'); load() }} onPhotos={load} />}
      {modal?.t === 'colour' && <ColourModal product={modal.p} onClose={() => setModal(null)} onDone={() => { toast('Colour added.'); load() }} />}
      {modal?.t === 'add' && <AddModal categories={cats} onClose={() => setModal(null)} onDone={(id, name, hadPhotos) => {
        toast(hadPhotos ? 'Product added to the catalog.' : 'Product added. Now add its photos.'); load();
        // without photos, open the new product's Edit window so they can be added straight away
        if (id && !hadPhotos) api('/admin/pos/products?q=' + encodeURIComponent(name)).then(r => { const p = r.find(x => x.id === id); if (p) setModal({ t: 'edit', p }) }).catch(() => {});
      }} />}
    </>
  );
}

// Inventory: "Products & Stock" and "Stock Movements" tabs.
export default function PosInventory({ manager, stocker }) {
  const [tab, setTab] = useState('products');
  const snapshot = async () => {
    const list = await api('/admin/pos/products?q=');
    downloadCsv('stock-snapshot.csv', ['Product', 'Category', 'Size', 'Colour', 'SKU', 'Stock', 'Price (S$)'], list.flatMap(p => p.variants.map(v => [p.name, p.category || '', v.size, v.color, v.sku, v.stock, (p.price / 100).toFixed(2)])));
  };
  return (
    <>
      <div className="inv-tabs" role="tablist" aria-label="Inventory sections">
        <button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}><Icon n="box" size={16} /> Products &amp; Stock</button>
        <button role="tab" aria-selected={tab === 'moves'} className={tab === 'moves' ? 'on' : ''} onClick={() => setTab('moves')}><Icon n="clock" size={16} /> Stock Movements</button>
      </div>
      {tab === 'products' ? <ProductsStock manager={manager} stocker={stocker} /> : <StockMovements onSnapshot={snapshot} />}
    </>
  );
}
