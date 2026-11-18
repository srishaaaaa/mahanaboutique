import { Component } from 'react';

// Shows the error instead of a blank page when a screen crashes while drawing, or when a lazy-loaded
// page fails to download (usually a tab left open across a new release: a reload fixes it).
export function reloadOnce() {
  // A tab left open across a release asks for files that no longer exist: fetch the new version, up to 3 times in 5 minutes
  // (the new index.html is never cached, so one reload is normally enough).
  try {
    const t = Date.now(), log = JSON.parse(sessionStorage.getItem('stale-reload') || '[]').filter(x => t - x < 300_000);
    if (log.length >= 3) return false;
    sessionStorage.setItem('stale-reload', JSON.stringify([...log, t]));
  } catch { /* storage blocked: still reload once */ }
  window.location.reload(); return true;
}
export default class ErrorBoundary extends Component {
  state = { error: null, gaveUp: false };
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info?.componentStack);
    // A tab left open across a release asks for files that no longer exist: fetch the new version once, automatically.
    if (/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(error?.message))) if (!reloadOnce()) this.setState({ gaveUp: true });
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(error?.message));
    if (stale && !this.state.gaveUp) return <div role="status" aria-live="polite" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', font: '15px system-ui, sans-serif', color: '#1c1b3a' }}>Updating…</div>;
    return (
      <div role="alert" style={{ maxWidth: 520, margin: '14vh auto', padding: '28px 26px', background: '#fff', border: '1px solid #e7dccd', borderRadius: 20, boxShadow: '0 20px 50px rgba(28,40,79,.12)', font: '15px/1.55 Archivo, system-ui, sans-serif', color: '#1c284f', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 600 }}>{stale ? 'A new version is ready' : 'This page could not be shown'}</h1>
        <p style={{ margin: '0 0 18px', color: '#5a4549' }}>{stale ? 'We have just updated the site. Reload to continue.' : 'Something unexpected happened. Reloading usually fixes it. If it keeps happening, please tell us and we will sort it out quickly.'}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '11px 22px', border: 0, borderRadius: 999, background: '#1c284f', color: '#fff', fontWeight: 700, letterSpacing: '.06em', cursor: 'pointer' }}>RELOAD</button>
          <a href="/" style={{ padding: '11px 22px', borderRadius: 999, border: '1px solid #1c284f', color: '#1c284f', fontWeight: 700, letterSpacing: '.06em', textDecoration: 'none' }}>GO TO HOME</a>
        </div>
        {!stale && <details style={{ marginTop: 18, textAlign: 'left' }}><summary style={{ cursor: 'pointer', fontSize: 12, color: '#8a7b7d' }}>Technical details (for support)</summary>
          <pre style={{ margin: '8px 0 0', padding: 10, background: '#f6efe6', borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 11, maxHeight: 140, overflow: 'auto' }}>{String(error?.stack || error?.message || error).slice(0, 600)}</pre></details>}
      </div>);
  }
}
