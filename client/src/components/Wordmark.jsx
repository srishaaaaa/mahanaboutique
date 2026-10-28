import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App';

// The Mahana logo (client/public/images/mahana-logo.png) is the default; an uploaded logo (Admin → Settings → Logo)
// replaces it. If no image can be loaded, the script "Mahana" wordmark is shown instead.
export const DEFAULT_LOGO = '/images/mahana-logo.png';

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
  const src = custom || DEFAULT_LOGO;
  const [, bump] = useState(0);
  const onError = () => { broken.add(src); bump(n => n + 1) };
  return { src: broken.has(src) ? null : src, isDefault: !custom, onError };
}

// Logo badge (the "M" monogram of the Mahana logo) beside the script "Mahana" over BOUTIQUE & TAILORS.
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

// The full logo artwork for large placements (footer). Falls back to the script wordmark.
export function FullLogo() {
  const { src, isDefault, onError } = useLogo();
  if (src && isDefault) return <div className="full-logo"><img src={src} alt="Mahana Boutique & Tailors, where fashion finds you" loading="lazy" decoding="async" onError={onError} /></div>;
  return <div className="foot-mark" aria-hidden="true"><span>Mahana</span><small>BOUTIQUE &amp; TAILORS</small></div>;
}
