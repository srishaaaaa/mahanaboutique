import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { useSiteText } from '../lib/siteText';
import { Reveal } from './Motion';

const DEFAULT_PHOTO = '/images/wedding-chapter.jpg'; // used until a photo is set in the admin

// Full-width wedding banner: the photo set under Admin -> Storefront images -> Editorial photo, a centred title and an outlined button.
export default function WeddingBanner() {
  const { site } = useApp();
  const t = useSiteText();
  const b = site.branding || {};
  return (
    <section className="wb" aria-labelledby="wb-h">
      <Reveal>
        <div className="wb-in">
          <img src={b.editorialImage || DEFAULT_PHOTO} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || t.bannerAlt} loading="lazy" width="932" height="656" />
          <div className="wb-copy">
            <span className="wb-eb">{t.bannerEyebrow}</span>
            <h2 id="wb-h" className="wb-t">{t.bannerTitle}</h2>
            <Link className="wb-btn" to="/shop?category=lehengas" data-cursor="EXPLORE">{t.bannerCta}</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
