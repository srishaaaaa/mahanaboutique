import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_BG = '/images/banner-bg.jpg'; // the scene, until a background is set in the admin
const DEFAULT_MODEL = '/images/banner-model.webp'; // the model (a cut-out), until one is set in the admin

// Homepage opening section, edge to edge. The picture is the one set in Admin -> Storefront images -> "Banner background"
// (the woman is part of it); it breathes slowly and drifts with the pointer, and petals fall through it. Left: label, headline, line, description, two buttons and the promises. Wording: Admin -> Site text.
const Ico = ({ children }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const TRUST = [
  ['PREMIUM QUALITY', <Ico key="s"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z" /></Ico>],
  ['TRUSTED WORLDWIDE', <Ico key="t"><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></Ico>],
  ['TIMELESS DESIGNS', <Ico key="d"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Ico>],
];
const CARDS = [
  ['Sarees', 'Silk, georgette & more', '/shop?category=sarees', <Ico key="a"><path d="M8 3c2 3 2 6 0 9s-2 6 0 9M16 3c-2 3-2 6 0 9s2 6 0 9" /><path d="M5 8h14M5 16h14" /></Ico>],
  ['Lehengas', 'Embroidered for occasions', '/shop?category=lehengas', <Ico key="b"><path d="M9 3h6l1.5 6L21 21H3L7.5 9Z" /><path d="M9 3 12 9l3-6" /></Ico>],
  ['Made to measure', 'Tailored in our studio', '/shop', <Ico key="c"><circle cx="6" cy="7" r="2.4" /><circle cx="6" cy="17" r="2.4" /><path d="M8 8.4 20 18M8 15.6 20 6" /></Ico>],
];
const PETALS = Array.from({ length: 16 }, (_, i) => ({ left: (i * 37 + 11) % 100, size: 6 + (i * 7) % 8, delay: -((i * 1.3) % 14), dur: 11 + (i * 5) % 9, sway: 18 + (i * 11) % 40 }));

export default function WeddingBanner({ hero = false }) {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  const box = useRef(null);
  const model = b.bannerModel || DEFAULT_MODEL;
  const Title = hero ? 'h1' : 'h2'; // as the opening section its title is the page's main heading
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
          <svg className="wb-arch" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true" fill="none" stroke="currentColor">
            <path d="M20 600V230C20 110 100 30 200 30s180 80 180 200v370" strokeWidth="1.6" /><path d="M48 600V236C48 128 118 58 200 58s152 70 152 178v364" strokeWidth="1" opacity=".6" /><path d="M76 600V242c0-96 56-158 124-158s124 62 124 158v358" strokeWidth=".8" opacity=".4" />
            <circle cx="200" cy="30" r="5" fill="currentColor" stroke="none" opacity=".8" />
          </svg>
          <svg className="wb-seal" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="wb-seal-p" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".5" /><circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".35" />
            <text className="wb-seal-t"><textPath href="#wb-seal-p" startOffset="0" textLength="272" lengthAdjust="spacing">HANDCRAFTED • MAHANA • SINGAPORE • </textPath></text>
            <path d="M60 46 69 60 60 74 51 60Z" fill="currentColor" opacity=".7" /></svg>
          <img className="wb-photo" src={model} style={b.bannerModelPos ? { objectPosition: b.bannerModelPos } : undefined} alt={t.bannerAlt} width="796" height="1536" />
          <div className="wb-copy">
            <span className="wb-badge"><i aria-hidden="true" />{t.bannerEyebrow}</span>
            <Title id="wb-h" className="wb-t">{t.bannerTitle}</Title>
            <span className="wb-orn" aria-hidden="true"><i /><svg width="26" height="18" viewBox="0 0 40 24" fill="none" stroke="currentColor"><path d="M20 3 29 12 20 21 11 12Z" /><path d="M20 8 24 12 20 16 16 12Z" fill="currentColor" fillOpacity=".25" /></svg><i /></span>
            <p className="wb-desc">{t.bannerDesc}</p>
            <p className="wb-sub">{t.bannerSub}</p>
            <div className="wb-acts">
              <Link className="wb-btn" to="/shop" data-cursor="EXPLORE">{t.bannerCta}<b aria-hidden="true">→</b></Link>
              <Link className="wb-link" to="/#enquiry" data-cursor="ENQUIRE">{t.bannerCta2}</Link>
            </div>
          </div>
          <div className="wb-cards">{CARDS.map(([h, sub, to, icon], i) => <Link key={h} to={to} className="wb-card" style={{ '--i': i }}><span className="wb-card-i">{icon}</span><span><b>{h}</b><small>{sub}</small></span></Link>)}</div>
          <ul className="wb-trust">{TRUST.map(([label, icon]) => <li key={label}>{icon}<span>{label}</span></li>)}</ul>
        </div>
      </Reveal>
    </section>
  );
}
