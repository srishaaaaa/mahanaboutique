import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_PHOTO = '/images/collection-banner.webp'; // used until a photo is set in the admin

// Full-width wedding banner: the photo set under Admin -> Storefront images -> Editorial photo, a centred title and an outlined button.
export default function WeddingBanner() {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  return (
    <section className="wb" aria-labelledby="wb-h">
      <Reveal>
        <div className="wb-in">
          <svg className="wb-deco" viewBox="0 0 1600 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <pattern id="wb-lat" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H72M0 0V72" stroke="#e7c496" strokeOpacity=".08" strokeWidth="1" /></pattern>
              <filter id="wb-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
              <linearGradient id="wb-arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7c496" stopOpacity=".55" /><stop offset="1" stopColor="#e7c496" stopOpacity="0" /></linearGradient>
            </defs>
            <rect width="1600" height="860" fill="url(#wb-lat)" />
            <g fill="none" stroke="url(#wb-arch)" strokeWidth="1.4">
              <path d="M430 860V440C430 250 600 120 800 120S1170 250 1170 440V860" />
              <path d="M490 860V450C490 280 630 170 800 170S1110 280 1110 450V860" opacity=".6" />
            </g>
            <g fill="#efc3b3" filter="url(#wb-blur)">
              <circle cx="210" cy="190" r="22" opacity=".16" /><circle cx="330" cy="470" r="14" opacity=".12" /><circle cx="120" cy="640" r="26" opacity=".1" />
              <circle cx="1390" cy="210" r="24" opacity=".15" /><circle cx="1270" cy="500" r="13" opacity=".12" /><circle cx="1490" cy="690" r="28" opacity=".1" />
              <circle cx="640" cy="90" r="12" opacity=".12" /><circle cx="1010" cy="70" r="16" opacity=".12" /><circle cx="60" cy="380" r="12" opacity=".14" /><circle cx="1545" cy="420" r="14" opacity=".14" />
            </g>
          </svg>
          <img className="wb-glow" src={b.editorialImage || DEFAULT_PHOTO} alt="" aria-hidden="true" />
          <img src={b.editorialImage || DEFAULT_PHOTO} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || t.bannerAlt} loading="lazy" width="1307" height="1200" />
          <span className="wb-tint" aria-hidden="true" />
          <div className="wb-copy">
            <span className="wb-eb">{t.bannerEyebrow}</span>
            <h2 id="wb-h" className="wb-t">{t.bannerTitle}</h2>
            <Link className="wb-btn" to="/shop" data-cursor="EXPLORE">{t.bannerCta}</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
