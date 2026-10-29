import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/App';
import { useReduced } from '../lib/hooks';
import { Reveal } from './Motion';
import { useSiteText } from '../lib/siteText';
import BlankFrame from './BlankFrame';
import { Divider } from './NightParts';

const IgIcon = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" /></svg>;
const Speaker = ({ off }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />{off ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12" />}</svg>;
const Play = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>;

// A vertical reel: muted autoplay while on screen, paused otherwise; the viewer can unmute (never autoplays with sound).
// With reduced motion it does not autoplay and shows the native controls. If the file cannot load, it links to Instagram.
function Reel({ post, label, fallbackUrl }) {
  const v = useRef(); const reduced = useReduced();
  const [muted, setMuted] = useState(true); const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = v.current; if (!el || reduced || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause() }, { threshold: 0.55 });
    io.observe(el); return () => io.disconnect();
  }, [reduced]);
  if (failed) {
    if (post.image) return <img src={post.image} alt={label} loading="lazy" />;
    const url = post.href || fallbackUrl;
    return <div className="ni-fail"><p>This video could not be loaded.</p>{url && <a className="nx-ghost" href={url} target="_blank" rel="noopener noreferrer">WATCH ON INSTAGRAM ↗</a>}</div>;
  }
  return (
    <>
      <video ref={v} src={post.video} poster={post.image || undefined} muted={muted} loop playsInline preload="metadata" controls={reduced} aria-label={label} onError={() => setFailed(true)} />
      {!reduced && <button className="ni-mute" onClick={() => { const next = !muted; setMuted(next); if (v.current) { v.current.muted = next; v.current.play().catch(() => {}) } }} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Mute'}><Speaker off={muted} /></button>}
    </>
  );
}

const count = (n, one, many) => (n ? `${n} ${n === 1 ? one : many}` : 'COMING SOON');

// "Inside MAHANA BOUTIQUE & TAILORS": a filmstrip of reels (up to 6) and a mosaic photo gallery (up to 6).
// Both are managed in Admin → Reels & Gallery. Until anything is added, blank frames keep the layout in place.
export default function InstagramStrip() {
  const { site } = useApp();
  const t = useSiteText();
  const ig = site.social?.instagram;
  const all = (ig?.posts || []).filter(p => p.video || p.image);
  const videos = all.filter(p => p.video).slice(0, 6);
  const photos = all.filter(p => !p.video).slice(0, 6);
  const strip = useRef();
  const slide = d => strip.current?.scrollBy({ left: d * strip.current.clientWidth * 0.6, behavior: 'smooth' });
  return (
    <section className="nx nx-ig" id="reels" aria-labelledby="ig-h">
      <span className="ni-glow" aria-hidden="true" />
      <div className="nx-in">
        <Reveal className="ni-head">
          <div className="ni-title">
            <p className="ni-handle"><span className="ni-ring"><IgIcon size={16} /></span>{ig?.handle ? `@${ig.handle}` : 'INSTAGRAM'}</p>
            <h2 id="ig-h" className="nx-h">{t.instaTitle}</h2>
          </div>
          <div className="ni-side">
            <p className="nx-p">{t.instaSub}</p>
            {ig?.url && <a className="nx-btn" href={ig.url} target="_blank" rel="noopener noreferrer" data-cursor="FOLLOW"><span>FOLLOW ON INSTAGRAM</span><b aria-hidden="true"><i>↗</i></b></a>}
          </div>
        </Reveal>

        {/* Reels: tall frames in a filmstrip, gently staggered; swipe or use the arrows on smaller screens. */}
        <div className="ni-block">
          <div className="ni-bh">
            <h3><Play /> Reel Gallery</h3>
            <span className="ni-count">{count(videos.length, 'REEL', 'REELS')}</span>
            <span className="ni-line" aria-hidden="true" />
            <span className="ni-arrows"><button className="nx-circle sm" onClick={() => slide(-1)} aria-label="Previous reels">←</button><button className="nx-circle sm" onClick={() => slide(1)} aria-label="Next reels">→</button></span>
          </div>
          <ul className="ni-reels" ref={strip}>
            {Array.from({ length: 6 }, (_, i) => {
              const r = videos[i];
              return (
                <Reveal as="li" key={(r?.video || 'empty') + i} delay={(i % 6) * 0.06} className="ni-reel">
                  <div className={`ni-tile ${r ? '' : 'is-empty'}`}>
                    {r ? <Reel post={r} label={r.alt || 'Boutique video'} fallbackUrl={ig?.url} /> : <BlankFrame label={`Reel ${i + 1}`} kind="video" to="/admin/reels" where="Reels & Gallery" />}
                    <span className="ni-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    {r?.href && <a className="ni-open" href={r.href} target="_blank" rel="noopener noreferrer" aria-label="Open this post on Instagram">↗</a>}
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>

        {/* Photos: a mosaic with one large feature frame. */}
        <div className="ni-block">
          <div className="ni-bh">
            <h3><IgIcon size={14} /> Photo Gallery</h3>
            <span className="ni-count">{count(photos.length, 'PHOTO', 'PHOTOS')}</span>
            <span className="ni-line" aria-hidden="true" />
          </div>
          <ul className="ni-mosaic">
            {Array.from({ length: 6 }, (_, i) => {
              const p = photos[i];
              return (
                <Reveal as="li" key={(p?.image || 'empty') + i} delay={(i % 3) * 0.08} className={`ni-m m${i + 1}`}>
                  <div className={`ni-tile ${p ? '' : 'is-empty'}`}>
                    {p ? <img src={p.image} alt={p.alt || 'Boutique photo'} loading="lazy" /> : <BlankFrame label={`Photo ${i + 1}`} to="/admin/reels" where="Reels & Gallery" />}
                    {p?.href && <a className="ni-open" href={p.href} target="_blank" rel="noopener noreferrer" aria-label="Open this post on Instagram">↗</a>}
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
        <Divider className="wide" />
      </div>
    </section>
  );
}
