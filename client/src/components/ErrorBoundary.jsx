import { Component } from 'react';

// Shows the error instead of a blank page when a screen crashes while drawing, or when a lazy-loaded
// page fails to download (usually a tab left open across a new release: a reload fixes it).
export function reloadOnce() {
  try {
    const last = +sessionStorage.getItem('stale-reload') || 0;
    if (Date.now() - last < 60_000) return false; // already tried a moment ago: show the button instead of looping
    sessionStorage.setItem('stale-reload', String(Date.now()));
  } catch { /* storage blocked: fall through to one reload */ }
  window.location.reload(); return true;
}
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info?.componentStack);
    // A tab left open across a release asks for files that no longer exist: fetch the new version once, automatically.
    if (/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(error?.message))) reloadOnce();
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(error?.message));
    return (
      <div role="alert" style={{ maxWidth: 560, margin: '12vh auto', padding: 24, background: '#fff', borderRadius: 16, font: '15px/1.5 system-ui, sans-serif', color: '#1c1b3a' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20 }}>{stale ? 'This page is out of date' : 'Something went wrong on this screen'}</h1>
        <p style={{ margin: '0 0 12px' }}>{stale ? 'A newer version of the site was released. Reload to get it.' : 'Reload to try again. If it keeps happening, send the message below.'}</p>
        {!stale && <pre style={{ margin: '0 0 16px', padding: 12, background: '#f4f2ee', borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.stack || error?.message || error).slice(0, 800)}</pre>}
        <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', border: 0, borderRadius: 999, background: '#2d0a3a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reload</button>
      </div>);
  }
}
