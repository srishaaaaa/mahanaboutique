// Small pieces shared by the homepage sections so they all match the indigo hero:
// the pill label with a pink dot, and the thin line-and-diamond divider.
export const Eyebrow = ({ children, className = '' }) => (
  <p className={`nx-eyebrow ${className}`}><i aria-hidden="true" />{children}</p>
);

export const Divider = ({ className = '' }) => (
  <span className={`nx-div ${className}`} aria-hidden="true">
    <i />
    <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 2 30 12 20 22 10 12Z" fill="currentColor" fillOpacity=".18" /><path d="M20 8 24 12 20 16 16 12Z" fill="currentColor" /><path d="M4 12h3M33 12h3" /></svg>
    <i />
  </span>
);

export const Arrow = () => <span className="nx-arrow" aria-hidden="true">→</span>;
