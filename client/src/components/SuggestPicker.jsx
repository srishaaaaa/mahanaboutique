import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const MAX = 4;
// "Suggested Products (n/4)": search the catalogue on the left, the chosen pieces on the right. Shown under "Complete the look" on the product page.
export default function SuggestPicker({ value, onChange, selfId }) {
  const [q, setQ] = useState(''); const [found, setFound] = useState([]);
  useEffect(() => { const t = setTimeout(() => api('/admin/pos/products?q=' + encodeURIComponent(q)).then(r => setFound(r.filter(p => p.status === 'active' && p.id !== selfId).slice(0, 60))).catch(() => {}), 200); return () => clearTimeout(t) }, [q, selfId]);
  const chosen = new Set(value.map(v => v.slug));
  const add = p => value.length < MAX && onChange([...value, { slug: p.slug, name: p.name, image: p.image, category: p.category }]);
  const row = (p, act) => <li key={p.slug} className="sg-row">{p.image ? <img src={p.image} alt="" width="44" height="52" /> : <i className="sg-ph" />}<span><b>{p.name}</b><small>{p.category || 'Product'}</small></span>{act}</li>;
  return (
    <section className="sg" aria-label="Suggested products">
      <h3 className="pe-h">Suggested Products ({value.length}/{MAX})</h3>
      <p className="muted small" style={{ margin: '0 0 8px' }}>SHOWN UNDER “COMPLETE THE LOOK” ON THIS PRODUCT’S PAGE</p>
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products to suggest…" aria-label="Search products to suggest" />
      <div className="sg-cols">
        <div><p className="sg-h">AVAILABLE</p><ul className="sg-list">{found.filter(p => !chosen.has(p.slug)).map(p => row(p, <button type="button" aria-label={`Suggest ${p.name}`} disabled={value.length >= MAX} onClick={() => add(p)}>＋</button>))}</ul></div>
        <div><p className="sg-h">SELECTED</p>{!value.length ? <p className="muted sg-none">No suggestions selected yet.</p> : <ul className="sg-list">{value.map((p, i) => row(p, <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>))}</ul>}</div>
      </div>
    </section>
  );
}
