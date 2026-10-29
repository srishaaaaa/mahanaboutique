import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useReduced } from '../lib/hooks';
import { ProductMedia } from './ProductCard3D';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';
import { Eyebrow } from './NightParts';

// A 3D coverflow of the real collections. Cards turn toward the centre, sink into depth and cast a soft
// reflection. It is a normal scroll-snap track underneath (swipe, wheel, arrows, keyboard all work); the
// 3D is only a per-card transform computed from each card's distance to the centre.
export default function CollectionsFlow() {
  const { catalog, site } = useApp();
  const t = useSiteText();
  // The admin chooses which collections appear and in what order (Admin → Storefront images → Homepage picks).
  const chosen = site.homepage?.collections || [];
  const cols = (chosen.length ? chosen.map(s => catalog.collections.find(c => c.slug === s)).filter(Boolean) : catalog.collections).slice(0, 8);
  const reduced = useReduced();
  const track = useRef();
  const [active, setActive] = useState(0);

  const apply = useCallback(() => {
    const t = track.current; if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, bd = Infinity;
    [...t.children].forEach((el, i) => {
      // Layout positions (not on-screen boxes), so the card's own transform never feeds back into the maths.
      const w = el.offsetWidth, d = (el.offsetLeft + w / 2 - mid) / w, ad = Math.abs(d);
      if (ad < bd) { bd = ad; best = i }
      el.classList.toggle('is-active', ad < 0.5);
      if (reduced) return;
      const k = Math.min(ad, 3), lift = Math.max(0, 1 - ad) * 18;
      // A fanned hand of cards: every card pivots from a point far below the row, so the cards spread in an arc,
      // overlap toward the centre and sink back; the centre card rises out of the fan.
      // Updated every frame with no CSS transition, so it tracks the scroll exactly.
      el.style.transformOrigin = '50% 185%';
      el.style.transform = `translate3d(${-d * w * 0.36}px, ${k * k * 5 - lift}px, ${-k * 50}px) rotateZ(${(d * 7.5).toFixed(3)}deg) scale(${(1 - Math.min(ad, 2) * 0.07).toFixed(4)})`;
      el.style.setProperty('--dim', (Math.min(ad, 2) * 0.24).toFixed(3));
      el.style.zIndex = String(100 - Math.round(ad * 10));
    });
    setActive(best);
  }, [reduced]);

  useEffect(() => {
    const t = track.current; if (!t || !cols.length) return;
    const first = t.children[Math.min(1, cols.length - 1)];
    if (first) t.scrollLeft = first.offsetLeft - (t.clientWidth - first.clientWidth) / 2; // start centred on the 2nd card
    let raf = 0; const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply) };
    apply(); t.addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); t.removeEventListener('scroll', on); removeEventListener('resize', on) };
  }, [cols.length, apply]);

  const go = dir => {
    const el = track.current?.children[Math.max(0, Math.min(cols.length - 1, active + dir))];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };
  if (!cols.length) return null;
  return (
    <section className="nx nx-cf cf" aria-labelledby="cf-h">
      <Reveal className="nx-head split nx-in">
        <div><Eyebrow>{t.worldEyebrow}</Eyebrow><h2 id="cf-h" className="nx-h">{t.worldTitle}</h2></div>
        <div className="nx-nav">
          <span aria-live="polite"><b>{String(active + 1).padStart(2, '0')}</b> / {String(cols.length).padStart(2, '0')}</span>
          <button className="nx-circle" onClick={() => go(-1)} aria-label="Previous collection" disabled={active === 0}>←</button>
          <button className="nx-circle" onClick={() => go(1)} aria-label="Next collection" disabled={active === cols.length - 1}>→</button>
        </div>
      </Reveal>
      <div className="cf-stage">
        <div className="cf-track" ref={track} role="list" aria-label="Collections">
          {cols.map((c, i) => (
            <Link key={c.slug} to={`/collections/${c.slug}`} role="listitem" className="cf-card" data-cursor="EXPLORE" aria-label={`${c.name}, ${c.product_count} pieces`}>
              <span className="cf-img"><ProductMedia p={{ slug: c.cover?.slug || c.slug, name: c.name, image: c.hero_image || c.cover?.image, image_pos: c.hero_pos }} view={i % 4} eager /></span>
              <span className="cf-shade" aria-hidden="true" />
              <span className="cf-txt">
                <span className="eyebrow">{String(i + 1).padStart(2, '0')} · {c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'}</span>
                <strong>{c.name}</strong>
                {c.description && <em>{c.description}</em>}
                <span className="cf-go">EXPLORE <span aria-hidden="true">→</span></span>
              </span>
            </Link>
          ))}
        </div>
        <div className="cf-floor" aria-hidden="true" />
      </div>
    </section>
  );
}
