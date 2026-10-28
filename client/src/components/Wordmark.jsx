import { Link } from 'react-router-dom';
import { useApp } from '../context/App';

// No built-in logo image: the script "Mahana" wordmark is shown until a logo is uploaded (Admin → Settings → Logo).
export const DEFAULT_LOGO = null;

// Emblem: four hairline petals rotated around a point — a quiet nod to woven textile geometry.
export function Emblem({ size = 28, className = '', glow = false }) {
  return (
    <svg className={`emblem ${glow ? 'glow' : ''} ${className}`} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {[0, 45, 90, 135].map(r => <ellipse key={r} cx="32" cy="32" rx="9" ry="26" transform={`rotate(${r} 32 32)`} />)}
      <circle cx="32" cy="32" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LogoTile({ size = 38 }) {
  return <span className="logo-tile" style={{ width: size, height: size }}><Emblem size={Math.round(size * 0.62)} /></span>;
}

// Script "Mahana" over a small, widely spaced BOUTIQUE & TAILORS, as on the business card.
export default function Wordmark({ to = '/', className = '', onClick }) {
  const { site } = useApp();
  const logo = site.branding?.logo || DEFAULT_LOGO;
  if (logo) return (
    <Link to={to} onClick={onClick} className={`wordmark has-logo ${className}`} aria-label="Home" data-cursor="HOME">
      <img className="wm-logo" src={logo} fetchpriority="high" decoding="async" alt={site.branding?.logoAlt || site.store?.name || 'MAHANA BOUTIQUE & TAILORS'} />
      <span className="wm-text" aria-hidden="true"><b>{(site.store?.name || 'Mahana Boutique & Tailors').split(' ')[0]}</b><i>{(site.store?.name || 'Mahana Boutique & Tailors').split(' ').slice(1).join(' ') || 'BOUTIQUE'}</i></span>
    </Link>
  );
  return (
    <Link to={to} onClick={onClick} className={`wordmark ${className}`} aria-label="MAHANA BOUTIQUE & TAILORS — home" data-cursor="HOME">
      <span className="wm-a">Mahana</span><span className="wm-b">BOUTIQUE &amp; TAILORS</span>
    </Link>
  );
}
