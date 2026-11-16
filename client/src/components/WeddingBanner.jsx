import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_PHOTO = '/images/collection-banner.webp'; // used until a photo is set in the admin

// Homepage banner (the opening section): a dark, moody courtyard backdrop. The photo set under
// Admin -> Storefront images -> Editorial photo fills the right side and fades into it; the headline,
// a spaced-capitals line and an outlined button sit on the left.
export default function WeddingBanner({ hero = false }) {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  const Title = hero ? 'h1' : 'h2'; // as the opening section its title is the page's main heading
  return (
    <section className={`wb ${hero ? 'wb-hero' : ''}`} aria-labelledby="wb-h">
      <Reveal>
        <div className="wb-in">
          <img className="wb-photo" src={b.editorialImage || DEFAULT_PHOTO} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || t.bannerAlt} loading="lazy" width="1307" height="1200" />
          <div className="wb-copy">
            <Title id="wb-h" className="wb-t">{t.bannerTitle}</Title>
            <p className="wb-sub">{t.bannerSub}</p>
            <Link className="wb-btn" to="/shop" data-cursor="EXPLORE">{t.bannerCta}</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
