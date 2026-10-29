import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { Reveal } from './Motion';
import BlankFrame from './BlankFrame';
import { Eyebrow, Divider } from './NightParts';

// Editorial band: a photograph in a tall arch with a glowing pink ring, beside the text block.
export default function EditorialSection() {
  const { site } = useApp();
  const b = site.branding || {};
  return (
    <section className="nx nx-ed" aria-labelledby="ed-h">
      <span className="nx-backdrop" aria-hidden="true" style={b.editorialImage ? { backgroundImage: `url("${b.editorialImage}")` } : undefined} />
      <div className="nx-in ne-in">
        <Reveal className="ne-photo">
          <span className="ne-halo" aria-hidden="true" />
          <div className="ne-arch">
            {b.editorialImage ? <img src={b.editorialImage} style={b.editorialPos ? { objectPosition: b.editorialPos } : undefined} alt={b.editorialAlt || 'A saree draped in warm light'} loading="lazy" /> : <BlankFrame label="Editorial photo" className="tall" />}
          </div>
          <span className="ne-ring" aria-hidden="true" />
          <span className="ne-spark a" aria-hidden="true" /><span className="ne-spark b" aria-hidden="true" />
        </Reveal>
        <Reveal className="ne-copy" delay={0.1}>
          <Eyebrow>MAHANA BOUTIQUE & TAILORS</Eyebrow>
          <h2 id="ed-h" className="nx-h">TRADITION,<br />WOVEN INTO<br /><em>EVERY THREAD.</em></h2>
          <Divider />
          <p className="nx-p">Discover traditional Indian wear at Mahana Boutique & Tailors, with accessories, custom design and tailoring for every occasion.</p>
          <ul className="ne-facts"><li><strong>ALL KINDS</strong><span>of sarees</span></li><li><strong>EVERY</strong><span>occasion</span></li></ul>
          <div className="nx-cta"><Link className="nx-btn" to="/shop?category=sarees" data-cursor="SHOP"><span>BROWSE SAREES</span><b aria-hidden="true"><i>→</i></b></Link><Link className="nx-link" to="/#enquiry" data-cursor="ENQUIRE">ENQUIRE NOW</Link></div>
        </Reveal>
      </div>
    </section>
  );
}
