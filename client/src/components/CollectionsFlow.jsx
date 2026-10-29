import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useReduced } from '../lib/hooks';
import { ProductMedia } from './ProductCard3D';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';
import { Eyebrow } from './NightParts';

const AUTO_MS = 4500;

// "Choose your world": a 3D coverflow of the real collections that loops endlessly.
// The centre card faces you; the others turn away and sink back on either side.
// Drag or swipe moves the cards with the finger and snaps to the nearest one; arrows, keys and dots work too,
// and it moves on by itself every few seconds (paused while the pointer is over it).
export default function CollectionsFlow() {
  const { catalog, site } = useApp();
  const t = useSiteText();
  // The admin chooses which collections appear and in what order (Admin → Storefront images → Homepage picks).
  const chosen = site.homepage?.collections || [];
  const cols = (chosen.length ? chosen.map(s => catalog.collections.find(c => c.slug === s)).filter(Boolean) : catalog.collections).slice(0, 8);
  const n = cols.length;
  const reduced = useReduced();
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0); // how far the finger has moved, in cards
  const [held, setHeld] = useState(false); // pointer over the stage, or dragging
  const stage = useRef();
  const g = useRef({ on: false, x0: 0, y0: 0, w: 1, moved: false, drag: 0 });

  useEffect(() => { if (n > 1) setActive(1) }, [n]); // start on the 2nd card so there is a card either side
  const go = useCallback(d => setActive(a => (((a + d) % n) + n) % n), [n]);

  // auto-advance while on screen
  useEffect(() => {
    if (reduced || held || n < 2) return;
    const el = stage.current; let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); if (el) io.observe(el);
    const id = setInterval(() => { if (visible && !document.hidden) go(1) }, AUTO_MS);
    return () => { clearInterval(id); io.disconnect() };
  }, [reduced, held, n, go, active]);

  // drag / swipe
  const onDown = e => {
    if (e.button > 0 || n < 2) return;
    const card = stage.current?.querySelector('.cf3-card');
    g.current = { on: true, x0: e.clientX, y0: e.clientY, w: (card?.offsetWidth || 300) * 0.7, moved: false, drag: 0, axis: null };
    setHeld(true);
    const move = ev => {
      const s = g.current; if (!s.on) return;
      const dx = ev.clientX - s.x0, dy = ev.clientY - s.y0;
      if (!s.axis && Math.hypot(dx, dy) > 6) s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis !== 'x') return;
      s.moved = true; s.drag = -dx / s.w; setDrag(s.drag);
    };
    const up = () => {
      const s = g.current; s.on = false;
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const k = Math.round(s.drag + Math.sign(s.drag) * 0.2); // a short flick is enough to move one card
      if (k) go(k);
      setDrag(0); s.drag = 0;
      if (e.pointerType !== 'mouse') setHeld(false);
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };
  // a drag must not also open the card under the finger
  const onClickCapture = e => { if (g.current.moved) { e.preventDefault(); e.stopPropagation(); g.current.moved = false } };
  const onKey = e => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) } else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) } };

  if (!n) return null;
  const dragging = drag !== 0;
  return (
    <section className="nx nx-cf" aria-labelledby="cf-h">
      <Reveal className="nx-head split nx-in">
        <div><Eyebrow>{t.worldEyebrow}</Eyebrow><h2 id="cf-h" className="nx-h">{t.worldTitle}</h2></div>
        <div className="nx-nav">
          <span aria-live="polite"><b>{String(active + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</span>
          <button className="nx-circle" onClick={() => go(-1)} aria-label="Previous collection" disabled={n < 2}>←</button>
          <button className="nx-circle" onClick={() => go(1)} aria-label="Next collection" disabled={n < 2}>→</button>
        </div>
      </Reveal>

      <div ref={stage} className={`cf3-stage ${dragging ? 'is-drag' : ''}`} role="list" aria-label="Collections" tabIndex={0}
        onPointerDown={onDown} onPointerEnter={e => e.pointerType === 'mouse' && setHeld(true)} onPointerLeave={e => e.pointerType === 'mouse' && !g.current.on && setHeld(false)}
        onClickCapture={onClickCapture} onKeyDown={onKey} onDragStart={e => e.preventDefault()}>
        {cols.map((c, i) => {
          let d = i - active;
          if (n > 2) { if (d > n / 2) d -= n; if (d < -n / 2) d += n } // shortest way round, so it loops
          d -= drag;
          const ad = Math.abs(d), far = ad > 2.6, isActive = ad < 0.5;
          const style = reduced
            ? { transform: `translateX(calc(-50% + ${d * 105}%))`, opacity: far ? 0 : 1, zIndex: 100 - Math.round(ad * 10) }
            : {
              transform: `translateX(calc(-50% + ${d * 74}%)) translateZ(${-ad * 150}px) rotateY(${(-Math.max(-1.5, Math.min(1.5, d)) * 28).toFixed(2)}deg) scale(${(1 - Math.min(ad, 3) * 0.05).toFixed(3)})`,
              opacity: far ? 0 : 1, zIndex: 100 - Math.round(ad * 10), '--dim': (Math.min(ad, 2) * 0.3).toFixed(3),
            };
          return (
            <Link key={c.slug} to={`/collections/${c.slug}`} role="listitem" className={`cf3-card ${isActive ? 'is-active' : ''}`} style={style}
              tabIndex={isActive ? 0 : -1} aria-hidden={far || undefined} data-cursor={isActive ? 'EXPLORE' : 'DRAG'} aria-label={`${c.name}, ${c.product_count} pieces`}
              onClick={e => { if (i !== active) { e.preventDefault(); setActive(i) } }}>
              <span className="cf3-img"><ProductMedia p={{ slug: c.cover?.slug || c.slug, name: c.name, image: c.hero_image || c.cover?.image, image_pos: c.hero_pos }} view={i % 4} eager /></span>
              <span className="cf3-shade" aria-hidden="true" />
              <span className="cf3-txt">
                <span className="cf3-meta">{String(i + 1).padStart(2, '0')} · {c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'}</span>
                <strong>{c.name}</strong>
                {c.description && <em>{c.description}</em>}
                <span className="cf3-go">EXPLORE <span aria-hidden="true">→</span></span>
              </span>
            </Link>
          );
        })}
        <span className="cf3-floor" aria-hidden="true" />
      </div>

      {n > 1 && (
        <div className="cf3-dots" role="group" aria-label="Choose a collection">
          {cols.map((c, i) => <button key={c.slug} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show ${c.name}`} aria-pressed={i === active} />)}
        </div>
      )}
    </section>
  );
}
