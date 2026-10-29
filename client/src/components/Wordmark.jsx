import { Link } from 'react-router-dom';
import { useApp } from '../context/App';

// No built-in logo image: the script "Mahana" wordmark is shown until a logo is uploaded (Admin → Settings → Logo).
export const DEFAULT_LOGO = null;

// Emblem: nested zari-style diamonds, the Mahana ornament (used in empty frames, loaders and badges).
export function Emblem({ size = 28, className = '', glow = false }) {
  return (
    <svg className={`emblem ${glow ? 'glow' : ''} ${className}`} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M32 4 60 32 32 60 4 32Z" />
      <path d="M32 15 49 32 32 49 15 32Z" opacity=".7" />
      <path d="M32 25 39 32 32 39 25 32Z" fill="currentColor" fillOpacity=".35" />
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
      <span className="wm-text" aria-hidden="true"><span className="wm-a">Mahana</span><span className="wm-b">BOUTIQUE &amp; TAILORS</span></span>
    </Link>
  );
  return (
    <Link to={to} onClick={onClick} className={`wordmark ${className}`} aria-label="MAHANA BOUTIQUE & TAILORS — home" data-cursor="HOME">
      <span className="wm-a">Mahana</span><span className="wm-b">BOUTIQUE &amp; TAILORS</span>
    </Link>
  );
}
