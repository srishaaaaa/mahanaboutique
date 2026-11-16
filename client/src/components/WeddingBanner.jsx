import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_BG = '/images/banner-bg.jpg'; // the scene, until a background is set in the admin
const DEFAULT_PHOTO = '/images/collection-banner.webp'; // the model (a cut-out), until a photo is set in the admin

// Homepage banner (the opening section), edge to edge. Admin -> Storefront images has two slots for it:
// "Banner background" (the scene, filling the whole banner) and "Banner photo (model)" (a cut-out standing on it).
// It is "live" and in 3D: the scene, the model and the text sit at different depths and shift with the pointer,
// the model floats gently and petals drift through the light. The headline and an outlined button sit on the left,
// with the three promises (icons) beneath.
const Ico = ({ children }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const TRUST = [
  ['PREMIUM QUALITY', <Ico key="s"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z" /></Ico>],
  ['TRUSTED WORLDWIDE', <Ico key="t"><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></Ico>],
  ['TIMELESS DESIGNS', <Ico key="d"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Ico>],
];
const PETALS = Array.from({ length: 16 }, (_, i) => ({ left: (i * 37 + 11) % 100, size: 5 + (i * 7) % 7, delay: -((i * 1.3) % 14), dur: 11 + (i * 5) % 9, sway: 18 + (i * 11) % 40 }));

export default function WeddingBanner({ hero = false }) {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  const box = useRef(null);
  const Title = hero ? 'h1' : 'h2'; // as the opening section its title is the page's main heading
  const model = b.editorialImage || (b.bannerBg ? null : DEFAULT_PHOTO); // a background uploaded without a model photo is shown on its own
  // pointer position, -1 .. 1 from the centre, drives the depth shift (CSS reads --mx / --my)
  const move = e => {
    const el = box.current; if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const leave = () => { const el = box.current; if (el) { el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0) } };
  return (
    <section className={`wb ${hero ? 'wb-hero' : ''}`} aria-labelledby="wb-h">
      <Reveal>
        <div className="wb-in" ref={box} onPointerMove={move} onPointerLeave={leave}>
          <img className="wb-bg" src={b.bannerBg || DEFAULT_BG} style={b.bannerBgPos ? { objectPosition: b.bannerBgPos } : undefined} alt="" aria-hidden="true" />
          <span className="wb-petals" aria-hidden="true">{PETALS.map((p, i) => <i key={i} style={{ left: p.left + '%', width: p.size, height: p.size * 0.62, animationDelay: p.delay + 's', animationDuration: p.dur + 's', '--sway': p.sway + 'px' }} />)}</span>
          <span className="wb-bloom" aria-hidden="true" /><span className="wb-shadow" aria-hidden="true" />
          {model && <img className="wb-photo" src={model} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || t.bannerAlt} loading="lazy" width="1038" height="1024" />}
          <span className="wb-grade" aria-hidden="true" />
          <div className="wb-copy">
            <Title id="wb-h" className="wb-t">{t.bannerTitle}</Title>
            <p className="wb-sub">{t.bannerSub}</p>
            <Link className="wb-btn" to="/shop" data-cursor="EXPLORE">{t.bannerCta}</Link>
          </div>
          <ul className="wb-trust">{TRUST.map(([label, icon]) => <li key={label}>{icon}<span>{label}</span></li>)}</ul>
        </div>
      </Reveal>
    </section>
  );
}
