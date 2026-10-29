import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRetry } from '../lib/api';
import { inr } from '../lib/format';
import { waLink } from '../lib/contact';
import { useApp } from '../context/App';
import { Reveal } from './Motion';
import { useSiteText } from '../lib/siteText';
import { ProductMedia } from './ProductCard3D';
import { Eyebrow, Divider } from './NightParts';

const LIMIT = 4;

function Item({ p, i }) {
  const { addToBag, setQuick, toast, wish, toggleWish, site } = useApp();
  const [busy, setBusy] = useState(false);
  const out = p.stock < 1, liked = wish.includes(p.slug);
  const enquire = waLink(site.store?.whatsapp || site.store?.phone, `Hello Mahana Boutique & Tailors, I would like to enquire about "${p.name}" (${inr(p.price)}).`);
  // One purchasable variant adds straight to the bag; otherwise the size picker (quick view) opens first.
  const add = async () => {
    if (!p.single_variant) return setQuick(p);
    setBusy(true);
    if (await addToBag({ variantId: p.single_variant })) toast(`${p.name} added to your bag.`);
    setBusy(false);
  };
  return (
    <li className={`nt-item nt-${i}`}>
      <div className="nt-photo">
        <Link to={`/product/${p.slug}`} data-cursor="VIEW" aria-label={`${p.name}, ${inr(p.price)}`}><ProductMedia p={p} priority={i < 3} /></Link>
        <span className="nt-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <button className={`nt-heart ${liked ? 'on' : ''}`} onClick={() => toggleWish(p.slug, p.name)} aria-pressed={liked} aria-label={liked ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z" /></svg>
        </button>
        {out && <span className="nt-out">SOLD OUT</span>}
      </div>
      <div className="nt-meta">
        <Link to={`/product/${p.slug}`} className="nt-name">{p.name}</Link>
        {p.material && <span className="nt-mat">{p.material}</span>}
        <div className="nt-row">
          {!out
            ? <button className="nt-pill" onClick={add} disabled={busy} aria-label={p.single_variant ? `Add ${p.name} to bag for ${inr(p.price)}` : `Choose a size for ${p.name}, ${inr(p.price)}`}><b aria-hidden="true">+</b> {inr(p.price)}</button>
            : <span className="nt-pill off">{inr(p.price)}</span>}
          {enquire && <a className="nt-enq" href={enquire} target="_blank" rel="noopener noreferrer" aria-label={`Enquire about ${p.name} on WhatsApp`}>ENQUIRE</a>}
        </div>
      </div>
    </li>
  );
}

// Trending collections: only the products the admin picked (Admin → Storefront images → Homepage picks → Trending collections), in that order.
// Until something is picked, the products flagged as featured are shown.
export default function FeaturedCollections() {
  const { catalog, loadCatalog, site } = useApp();
  const t = useSiteText();
  const picks = site.homepage?.trending;
  const key = (picks || []).join(',');
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!key) { setPicked(null); return }
    let dead = false;
    apiRetry(`/products?slugs=${encodeURIComponent(key)}&limit=48`).then(d => {
      if (dead) return;
      const by = Object.fromEntries(d.items.map(p => [p.slug, p]));
      setPicked(key.split(',').map(s => by[s]).filter(Boolean));
    }).catch(() => !dead && setPicked(null));
    return () => { dead = true };
  }, [key]);

  const waiting = site.status === 'loading' || (key && picked === null);
  const items = waiting ? [] : (key ? picked : catalog.featured).slice(0, LIMIT);

  return (
    <section className="nx nx-trend" id="collection" aria-labelledby="edit-h">
      <div className="nx-in">
        <Reveal className="nx-head split">
          <div>
            <Eyebrow>{t.trendingEyebrow}</Eyebrow>
            <h2 id="edit-h" className="nx-h">{t.trendingTitle}</h2>
            <p className="nx-sub">{t.trendingSub}</p>
          </div>
          <Link className="nx-more" to="/shop?category=sarees" data-cursor="VIEW">VIEW ALL <span aria-hidden="true">→</span></Link>
        </Reveal>
        <Divider className="wide" />

        {items.length > 0 && (
          <motion.ul key={key || 'featured'} className="nt-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {items.map((p, i) => <Item key={p.id} p={p} i={i} />)}
          </motion.ul>
        )}
        {catalog.status === 'error' && <p className="nx-empty">The collection could not be loaded right now. <button className="nx-ghost" onClick={loadCatalog}>TRY AGAIN</button></p>}
        {!waiting && catalog.status === 'ready' && !items.length && <p className="nx-empty">New arrivals are being prepared. Please return soon.</p>}
      </div>
    </section>
  );
}
