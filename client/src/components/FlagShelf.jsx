import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRetry } from '../lib/api';
import { Reveal } from './Motion';
import { Eyebrow, Divider } from './NightParts';
import { Item } from './FeaturedCollections';

// Home shelf for products flagged in Admin → Inventory → Edit product: "New Arrival" or "Best Sellers" (first 4, newest first). Hidden when none are flagged.
export default function FlagShelf({ flag, id, eyebrow, title, sub }) {
  const [items, setItems] = useState(null);
  useEffect(() => { let dead = false; apiRetry(`/products?flag=${flag}&sort=newest&limit=4`).then(d => !dead && setItems(d.items)).catch(() => !dead && setItems([])); return () => { dead = true } }, [flag]);
  if (!items?.length) return null;
  return (
    <section className="nx nx-trend" id={id} aria-labelledby={`${id}-h`}>
      <div className="nx-in">
        <Reveal className="nx-head split">
          <div><Eyebrow>{eyebrow}</Eyebrow><h2 id={`${id}-h`} className="nx-h">{title}</h2><p className="nx-sub">{sub}</p></div>
          <Link className="nx-more" to="/shop?sort=newest" data-cursor="VIEW">VIEW ALL <span aria-hidden="true">→</span></Link>
        </Reveal>
        <Divider className="wide" />
        <ul className="nt-grid">{items.map((p, i) => <Item key={p.id} p={p} i={i} />)}</ul>
      </div>
    </section>
  );
}
