import { waLink } from '../lib/contact';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';
import { api } from '../lib/api';
import { brand } from '../config/content';
import { scrollToEl } from './SmoothScroll';

const Ig = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" /></svg>;
const Fb = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.5-3.2h-3.2V7.9c0-.9.4-1.6 1.7-1.6h1.6V3.5c-.3 0-1.3-.2-2.4-.2-2.5 0-4 1.5-4 4.2v2.3H7.7V13h2.7v8h3.1Z" /></svg>;
const Yt = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>;
const iconFor = label => (/insta/i.test(label) ? <Ig /> : /face/i.test(label) ? <Fb /> : /you/i.test(label) ? <Yt /> : <span className="nf-soc-t">{label.slice(0, 2).toUpperCase()}</span>);
const Ico = ({ children }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;

function Newsletter() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ s: 'idle', msg: '' });
  async function submit(e) {
    e.preventDefault();
    if (!consent) return setState({ s: 'error', msg: 'Please confirm your consent to receive emails.' });
    setState({ s: 'busy', msg: '' });
    try {
      const r = await api('/newsletter', { method: 'POST', body: { email, consent: true } });
      setState({ s: 'ok', msg: r.status === 'duplicate' ? 'You are already on the list.' : 'Welcome to MAHANA. You are subscribed.' });
      if (r.status !== 'duplicate') setEmail('');
    } catch (err) { setState({ s: 'error', msg: err.message === 'Validation failed' ? 'Please enter a valid email address.' : err.message }) }
  }
  return (
    <form onSubmit={submit} className="nf-news" noValidate>
      <label htmlFor="nl-email" className="nf-news-h">Letters from <em>Mahana</em></label>
      <p className="nf-news-p">New arrivals, festive edits and boutique moments, straight to your inbox.</p>
      <div className="nf-news-row">
        <input id="nl-email" type="email" placeholder="Your email address" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required aria-describedby="nl-msg" />
        <button disabled={state.s === 'busy'}>{state.s === 'busy' ? '…' : <>SUBSCRIBE <span aria-hidden="true">→</span></>}</button>
      </div>
      <label className="nf-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I agree to receive marketing emails from MAHANA and can unsubscribe at any time.</label>
      <p id="nl-msg" className={`nf-msg ${state.s}`} role={state.s === 'error' ? 'alert' : 'status'}>{state.msg}</p>
    </form>
  );
}

// Night-indigo footer: a brand + newsletter band, then Shop / Visit / Information columns, then the credits line.
// Contact details and social links come from the admin-managed store settings.
export default function LuxuryFooter() {
  const { catalog, site } = useApp();
  const { store, social } = site;
  const ig = social?.instagram;
  const socials = [ig?.url && { label: 'Instagram', url: ig.url }, ...(social?.links ?? [])].filter(Boolean);
  const tel = store?.phone && `tel:${store.phone.replace(/[^+\d]/g, '')}`;
  const year = new Date().getFullYear();
  return (
    <footer className="nf">
      <span className="nf-sky" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 7) % 100}%`, top: `${(i * 53 + 11) % 100}%`, animationDelay: `${-(i * 0.7).toFixed(1)}s` }} />)}</span>
      <div className="nf-in">
        <div className="nf-top">
          <div className="nf-brand">
            <Link to="/" className="nf-mark" aria-label="Mahana Boutique & Tailors, home"><b>Mahana</b><small>BOUTIQUE &amp; TAILORS</small></Link>
            <p className="nf-tag">Elegance <i aria-hidden="true">✦</i> Beyond <i aria-hidden="true">✦</i> Ordinary</p>
            <p className="nf-follow">See our latest drops and store moments across our channels.</p>
            {socials.length > 0
              ? <ul className="nf-soc">{socials.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>{iconFor(s.label)}</a></li>)}</ul>
              : <p className="nf-soon">Social channels coming soon.</p>}
          </div>
          <Newsletter />
        </div>

        <div className="nf-cols">
          <nav aria-label="Shop"><h2 className="nf-h">Shop</h2><ul>
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to={catalog.collections.some(c => c.slug === 'new-arrivals') ? '/collections/new-arrivals' : '/shop?sort=newest'}>New Arrivals</Link></li>
            <li><Link to="/collections">Collections</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/account">My Account</Link></li>
          </ul></nav>
          <div className="nf-visit"><h2 className="nf-h">Visit Us</h2>
            {store?.address?.length
              ? <address><span className="nf-ico"><Ico><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.4" /></Ico></span><span>{store.address.join(', ')}</span></address>
              : <p className="nf-soon">Boutique location coming soon.</p>}
            {store?.hours && <p className="nf-line"><span className="nf-ico"><Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico></span><span>{store.hours.label}</span></p>}
            <ul className="nf-contact">
              {store?.owner && <li>{store.owner}</li>}
              {tel && <li><a href={tel}>{store.phone}</a></li>}
              {store?.whatsapp && <li><a href={waLink(store.whatsapp)} target="_blank" rel="noopener noreferrer">{store.whatsapp} (WhatsApp)</a></li>}
              {store?.email && <li><a href={`mailto:${store.email}`}>{store.email}</a></li>}
            </ul>
          </div>
          <nav aria-label="Information"><h2 className="nf-h">Information</h2><ul>
            <li><Link to="/about">Our story</Link></li>
            <li><Link to="/shipping-returns">Shipping &amp; returns</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul></nav>
        </div>

        <div className="nf-base">
          <span>© {year} MAHANA BOUTIQUE & TAILORS. All Rights Reserved</span>
          <span>Powered by <strong>{brand.credit}</strong> © {year}</span>
          <button className="nf-up" onClick={() => scrollToEl(document.documentElement)} aria-label="Back to top">↑</button>
        </div>
      </div>
    </footer>
  );
}
