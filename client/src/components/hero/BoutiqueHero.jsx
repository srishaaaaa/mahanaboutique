import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/App';
import { useReduced } from '../../lib/hooks';
import { usePointerVars } from '../../lib/usePointerVars';
import { inr } from '../../lib/format';
import { campaign } from '../../config/content';
import { Magnetic } from '../Motion';
import { ProductMedia } from '../ProductCard3D';
import BlankFrame from '../BlankFrame';
import EditorialTypography from './EditorialTypography';
import HeroSlides from './HeroSlides';

const rise = d => ({ initial: { opacity: 0, y: 24 }, transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] } });
const CHIPS = [['ALL', '/shop?category=sarees'], ['SILK', '/search?q=silk'], ['COTTON', '/search?q=cotton'], ['FESTIVE', '/collections/festive-edit'], ['BRIDAL', '/collections/bridal-silk-sarees']];

// A zari-style diamond motif; used as a small ornament (divider, caption).
const Motif = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
    <path d="M100 18 140 60 100 102 60 60Z" fill="currentColor" fillOpacity=".1" />
    <path d="M100 40 120 60 100 80 80 60Z" fill="currentColor" fillOpacity=".35" />
    <path d="M44 60 56 48 68 60 56 72ZM132 60 144 48 156 60 144 72Z" fill="currentColor" fillOpacity=".2" />
  </svg>
);

// Editorial hero: a large ivory panel with an oversized serif headline, a model photograph that overlaps the panel,
// a textile inset, and a "For you" discovery panel layered behind. Photographs are managed in
// Admin → Storefront images; until they are added the frames stay blank. Discovery items are real products.
export default function BoutiqueHero() {
  const { entered, catalog, site, user } = useApp();
  const staff = ['owner', 'admin'].includes(user?.role);
  const reduced = useReduced();
  const ref = useRef();
  usePointerVars(ref, !reduced);
  const show = entered; // entrance waits for the intro to finish
  const b = site.branding || {};
  // Arch photos: the Hero model photo first, then the slideshow photos, all from Admin → Storefront images.
  const slides = [...(b.heroModel ? [{ image: b.heroModel, alt: b.heroAlt || 'A model draped in a saree', pos: b.heroModelPos || '50% 18%' }] : []), ...(b.showcase || [])];
  const picks = catalog.featured.slice(0, 6);
  const anim = d => ({ ...rise(d), animate: show ? { opacity: 1, y: 0 } : undefined });


  return (
    <section ref={ref} className="bh" data-hero aria-label="MAHANA BOUTIQUE & TAILORS">
      <span className="bh-petals" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>
      <span className="bh-side-l" aria-hidden="true">SAREES · ANARKALIS · LEHENGAS · KURTAS</span>
      <span className="bh-side-r" aria-hidden="true"><Motif className="bh-mini" />TIMELESS<br />SAREES<br />FOR MODERN<br />WOMEN</span>
      <p className="bh-brand" aria-hidden="true"><b>{(site.store?.name || 'Mahana Boutique & Tailors').split(' ')[0]}</b><i>{(site.store?.name || 'Mahana Boutique & Tailors').split(' ').slice(1).join(' ') || 'BOUTIQUE'}</i></p>
      <div className="bh-wrap">
        <aside className="bh-discover" aria-labelledby="bh-for">
          <h2 id="bh-for" className="bh-for">FOR YOU</h2>
          <ul className="bh-chips">{CHIPS.map(([l, to]) => <li key={l}><Link to={to}>{l}</Link></li>)}</ul>
          <ul className="bh-tiles">
            {picks.length === 0 && [0, 1, 2, 3, 4, 5].map(i => <li key={i} className="bh-tile"><div className={`bh-tile-img ${catalog.status === 'loading' ? 'skel' : ''}`}>{catalog.status !== 'loading' && <BlankFrame label="Product" />}</div></li>)}
            {picks.map(p => (
              <li key={p.id} className="bh-tile">
                <Link to={`/product/${p.slug}`} data-cursor="VIEW" aria-label={`${p.name}, ${inr(p.price)}`}>
                  <span className="bh-tile-img"><ProductMedia p={p} priority /></span>
                  <strong>{p.name}</strong><em>{inr(p.price)}</em>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="bh-panel">
          <div className="bh-frame">
          <motion.p className="bh-pill" {...anim(0.1)}><i aria-hidden="true" />{campaign.label}</motion.p>
          <div className="bh-headline">
            <EditorialTypography lines={['Elegance,', 'woven for you.']} show={show} className="bh-h" label="Elegance, woven for you." />
            <i className="bh-spark s1" aria-hidden="true" /><i className="bh-spark s2" aria-hidden="true" />
          </div>
          <div className="bh-orn" aria-hidden="true"><Motif /></div>
          <div className="bh-row">
          <div className="bh-col">
          <motion.p className="bh-desc" {...anim(0.7)}>Sarees, lehengas and custom tailoring, crafted for every celebration of your life.</motion.p>
          <motion.ul className="bh-facts" {...anim(0.8)}><li>ALL KINDS OF SAREES</li><li>FOR EVERY OCCASION</li></motion.ul>
          <motion.div className="bh-cta" {...anim(0.9)}>
            <Magnetic strength={0.2}><Link className="bh-btn" to="/shop?category=sarees" data-cursor="EXPLORE"><span>EXPLORE COLLECTION</span><b aria-hidden="true"><i>→</i></b></Link></Magnetic>
            <Link className="bh-link" to="/#enquiry" data-cursor="ENQUIRE">ENQUIRE NOW</Link>
          </motion.div>
          </div>

          <motion.figure className="bh-inset" {...anim(1)}>
            <div className={`bh-inset-img ${site.status === 'loading' ? 'skel' : ''}`}>{b.textileImage ? <img src={b.textileImage} alt={b.textileAlt || 'Close-up of saree fabric and zari work'} loading="lazy" decoding="async" style={b.textilePos ? { objectPosition: b.textilePos } : undefined} /> : site.status !== 'loading' && <BlankFrame label="Textile close-up" />}</div>
            <figcaption>CRAFTED ELEGANCE</figcaption>
          </motion.figure>
          </div>
          <ul className="bh-feats">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3l-5.2 2.8 1-5.8L3.5 9.2l5.9-.9z" /></svg>Premium Quality</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4.2l3 3.2v2.8h-7.2" /><circle cx="7" cy="17" r="1.8" /><circle cx="17" cy="17" r="1.8" /></svg>Trusted Worldwide</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>Timeless Designs</li>
          </ul>
          </div>
          <div className="bh-tint" aria-hidden="true" />
        </div>

        <motion.figure className={`bh-model has-photo ${slides.length ? "is-photo" : "is-empty"}`} initial={{ opacity: 0, y: 40 }} animate={show ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <span className={`bh-arch ${site.status === 'loading' ? 'skel' : ''}`}>
            {site.status !== 'loading' && slides.length > 0 && <HeroSlides photos={slides} reduced={reduced} />}
            {site.status !== 'loading' && !slides.length && staff && <Link className="bh-addphoto" to="/admin/storefront">+ ADD HERO PHOTOS</Link>}
          </span>
        </motion.figure>
      </div>
    </section>
  );
}
