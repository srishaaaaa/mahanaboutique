import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';

// The header and footer show the script "Mahana" wordmark. An uploaded logo (Admin → Settings → Logo) is shown
// beside it in the header instead; the logo artwork file (images/mahana-logo.png) is kept for future use.
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

// Remembers a logo URL that failed to load, so every logo on the page falls back to the wordmark together.
const broken = new Set();
export function useLogo() {
  const { site } = useApp();
  const custom = site.branding?.logo || null;
  const src = custom;
  const [, bump] = useState(0);
  const onError = () => { broken.add(src); bump(n => n + 1) };
  return { src: broken.has(src) ? null : src, isDefault: !custom, onError };
}

// Script "Mahana" over BOUTIQUE & TAILORS; an uploaded logo (if any) sits beside it as a round badge.
export default function Wordmark({ to = '/', className = '', onClick }) {
  const { site } = useApp();
  const { src, isDefault, onError } = useLogo();
  const name = site.store?.name || 'Mahana Boutique & Tailors';
  if (src) return (
    <Link to={to} onClick={onClick} className={`wordmark has-logo ${className}`} aria-label={`${name}, home`} data-cursor="HOME">
      <span className={`wm-badge ${isDefault ? 'is-monogram' : ''}`}>
        <img className="wm-logo" src={src} fetchpriority="high" decoding="async" alt="" onError={onError} />
      </span>
      <span className="wm-text" aria-hidden="true"><span className="wm-a">Mahana</span><span className="wm-b">BOUTIQUE &amp; TAILORS</span></span>
    </Link>
  );
  return (
    <Link to={to} onClick={onClick} className={`wordmark ${className}`} aria-label={`${name}, home`} data-cursor="HOME">
      <span className="wm-a">Mahana</span><span className="wm-b">BOUTIQUE &amp; TAILORS</span>
    </Link>
  );
}

// The large script wordmark for the footer.
export function FullLogo() {
  return <div className="foot-mark" aria-hidden="true"><span>Mahana</span><small>BOUTIQUE &amp; TAILORS</small></div>;
}
