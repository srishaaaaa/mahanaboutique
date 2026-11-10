import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { inr } from '../lib/format';

// Pick products for the bill: search, filter by category, press + Add on as many pieces as you need, then OK adds them all to the bill.
export default function CatalogPicker({ onClose, onOk }) {
  const [q, setQ] = useState(''); const [all, setAll] = useState(null); const [cat, setCat] = useState(''); const [pick, setPick] = useState({}); // variantId -> { v, qty }
  const ref = useRef();
  useEffect(() => {
    const t = setTimeout(() => api('/admin/pos/catalog?q=' + encodeURIComponent(q.trim()) + '&limit=300').then(setAll).catch(() => setAll([])), 160);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', k); document.body.style.overflow = o } }, [onClose]);
  const cats = useMemo(() => [...new Set((all || []).map(v => v.category).filter(Boolean))].sort(), [all]);
  const shown = (all || []).filter(v => !cat || v.category === cat);
  const picked = Object.values(pick), count = picked.reduce((s, x) => s + x.qty, 0), total = picked.reduce((s, x) => s + x.qty * x.v.price, 0);
  const step = (v, d) => setPick(p => { const n = Math.max(0, Math.min(v.stock, (p[v.variantId]?.qty || 0) + d)); const { [v.variantId]: _, ...rest } = p; return n ? { ...rest, [v.variantId]: { v, qty: n } } : rest });
  const onEnter = e => { if (e.key !== 'Enter' || !all) return; const hit = all.find(v => v.sku.toLowerCase() === q.trim().toLowerCase()) || (all.length === 1 ? all[0] : null); if (hit && hit.stock > 0) { step(hit, 1); setQ('') } };
  return (
    <div className="cpk-ov" role="dialog" aria-modal="true" aria-label="Choose products" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="cpk" ref={ref}>
        <div className="cpk-h"><b>Add products to the bill — pick one or more</b><button type="button" aria-label="Close" onClick={onClose}>✕</button></div>
        <div className="cpk-body">
          <label className="cpk-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <input autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onEnter} placeholder="Search products, SKU, size or scan a barcode…" aria-label="Search products" /></label>
          <div className="cpk-cats" role="group" aria-label="Category">{['', ...cats].map(c => <button key={c || 'all'} type="button" className={cat === c ? 'on' : ''} aria-pressed={cat === c} onClick={() => setCat(c)}>{c || 'All'}</button>)}</div>
          {!all ? <p className="cpk-empty">Loading…</p> : !shown.length ? <p className="cpk-empty">No products match.</p> : (
            <ul className="cpk-grid">{shown.map(v => { const n = pick[v.variantId]?.qty || 0, out = v.stock < 1; return (
              <li key={v.variantId} className={`${n ? 'on' : ''} ${out ? 'out' : ''}`}>
                {v.image ? <img src={v.image} alt="" loading="lazy" /> : <span className="cpk-ph" aria-hidden="true" />}
                <div className="cpk-t"><b title={v.name}>{v.name}</b><small><strong>{inr(v.price)}</strong> · {[v.size, v.color !== 'Default' ? v.color : null].filter(Boolean).join(' · ') || 'One size'} · {out ? 'out of stock' : `${v.stock} in stock`}</small></div>
                {n ? <span className="cpk-step"><button type="button" aria-label={`Remove one ${v.name}`} onClick={() => step(v, -1)}>−</button><b>{n}</b><button type="button" aria-label={`Add one ${v.name}`} disabled={n >= v.stock} onClick={() => step(v, 1)}>+</button></span>
                  : <button type="button" className="cpk-add" disabled={out} onClick={() => step(v, 1)}>+ Add</button>}
              </li>) })}</ul>)}
        </div>
        <div className="cpk-f"><span>{count} item{count === 1 ? '' : 's'} · <b>{inr(total)}</b></span>
          <span><button type="button" className="cpk-cancel" onClick={onClose}>Cancel</button><button type="button" className="cpk-ok" disabled={!count} onClick={() => onOk(picked)}>OK</button></span></div>
      </div>
    </div>
  );
}
