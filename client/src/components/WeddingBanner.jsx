import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_PHOTO = '/images/collection-banner.webp'; // used until a photo is set in the admin

// Homepage banner (the opening section): a warm palace backdrop (sandstone arches and pillars, marigold garlands),
// the photo set under Admin -> Storefront images -> Editorial photo, a centred title and an outlined button.

// Palace backdrop, painted once and softly blurred like a photograph with depth of field.
const arch = (cx, w, top, bottom) => `M${cx - w / 2} ${bottom}V${top + w / 2}A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${top + w / 2}V${bottom}`;
const FAR = [190, 590, 1010, 1410]; // distant arches
const MARIGOLD = ['#f08a1c', '#f6b21b', '#e56b12', '#f9c53a'];
// a hanging garland: marigold flowers threaded along a slightly swaying string
const garland = (x, len, phase) => Array.from({ length: Math.floor(len / 15) }, (_, i) => ({ x: x + Math.sin(i * 0.35 + phase) * 4, y: 8 + i * 15, c: MARIGOLD[(i + phase) % 4] }));
const GARLANDS = [[34, 860, 0], [74, 780, 1], [1526, 860, 2], [1566, 780, 3], [118, 520, 2], [1482, 520, 1]];
const LIGHTS = [[300, 120, 26], [700, 70, 20], [1180, 90, 24], [1330, 300, 30], [210, 340, 22], [880, 40, 16], [520, 60, 18]];

export default function WeddingBanner({ hero = false }) {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  const Title = hero ? 'h1' : 'h2'; // as the opening section its title is the page's main heading
  return (
    <section className={`wb ${hero ? 'wb-hero' : ''}`} aria-labelledby="wb-h">
      <Reveal>
        <div className="wb-in">
          <svg className="wb-deco" viewBox="0 0 1600 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="wb-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8b992" /><stop offset=".6" stopColor="#b38b68" /><stop offset="1" stopColor="#7a5640" /></linearGradient>
              <linearGradient id="wb-open" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3d2b" /><stop offset=".55" stopColor="#8a6446" /><stop offset="1" stopColor="#c9a47c" /></linearGradient>
              <linearGradient id="wb-pillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6648" /><stop offset=".5" stopColor="#d6b78f" /><stop offset="1" stopColor="#85613f" /></linearGradient>
              <radialGradient id="wb-lightpool" cx=".5" cy=".38" r=".62"><stop offset="0" stopColor="#ffe6bd" stopOpacity=".75" /><stop offset="1" stopColor="#ffe6bd" stopOpacity="0" /></radialGradient>
              <filter id="wb-b6" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6" /></filter>
              <filter id="wb-b3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>
              <filter id="wb-b1" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="1" /></filter>
              <filter id="wb-bokeh" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" /></filter>
            </defs>
            <rect width="1600" height="860" fill="url(#wb-wall)" />
            <g filter="url(#wb-b6)">
              {FAR.map(cx => <g key={cx}><path d={arch(cx, 340, 150, 860) + 'Z'} fill="#9c7552" /><path d={arch(cx, 270, 190, 860) + 'Z'} fill="url(#wb-open)" /></g>)}
              {[390, 800, 1210].map(x => <rect key={x} x={x - 26} y="170" width="52" height="700" fill="url(#wb-pillar)" />)}
            </g>
            <g filter="url(#wb-b3)">
              <path d={arch(800, 640, 90, 860) + 'Z'} fill="#a98260" />
              <path d={arch(800, 540, 130, 860) + 'Z'} fill="url(#wb-open)" />
              <rect x="436" y="200" width="64" height="680" fill="url(#wb-pillar)" /><rect x="1100" y="200" width="64" height="680" fill="url(#wb-pillar)" />
            </g>
            <rect width="1600" height="860" fill="url(#wb-lightpool)" />
            <g fill="#ffd9a0" filter="url(#wb-bokeh)">{LIGHTS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity={0.3 + (i % 3) * 0.12} />)}</g>
            <g filter="url(#wb-b1)">
              {GARLANDS.map(([x, len, ph]) => (
                <g key={x}>
                  <path d={`M${x} 0V${len}`} stroke="#6b4a2a" strokeWidth="1.5" opacity=".6" />
                  {garland(x, len, ph).map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={i % 5 === 0 ? 9 : 7.5} fill={f.c} opacity=".95" />)}
                </g>
              ))}
            </g>
          </svg>
          <img className="wb-glow" src={b.editorialImage || DEFAULT_PHOTO} alt="" aria-hidden="true" />
          <img src={b.editorialImage || DEFAULT_PHOTO} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || t.bannerAlt} loading="lazy" width="1307" height="1200" />
          <span className="wb-tint" aria-hidden="true" />
          <div className="wb-copy">
            <span className="wb-eb">{t.bannerEyebrow}</span>
            <Title id="wb-h" className="wb-t">{t.bannerTitle}</Title>
            <Link className="wb-btn" to="/shop" data-cursor="EXPLORE">{t.bannerCta}</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
