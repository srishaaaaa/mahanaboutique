import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReduced } from '../lib/hooks';

const TAG = 'BOUTIQUE & TAILORS';

// Shown each time the website is opened or reloaded (not in the admin panel, not on the first-ever visit,
// which has its own intro): the script "Mahana" writes itself in, the tagline follows letter by letter,
// then the panel lifts away with a curved edge. Tap or press any key to skip.
export default function ReloadSplash() {
  const reduced = useReduced();
  const [phase, setPhase] = useState('in'); // in → out → gone
  useEffect(() => {
    const out = setTimeout(() => setPhase('out'), reduced ? 500 : 2100);
    const gone = setTimeout(() => setPhase('gone'), reduced ? 900 : 3000);
    const skip = () => setPhase(p => (p === 'in' ? 'out' : p));
    addEventListener('keydown', skip); addEventListener('pointerdown', skip);
    return () => { clearTimeout(out); clearTimeout(gone); removeEventListener('keydown', skip); removeEventListener('pointerdown', skip) };
  }, [reduced]);
  useEffect(() => { if (phase === 'out') { const t = setTimeout(() => setPhase('gone'), reduced ? 400 : 900); return () => clearTimeout(t) } }, [phase, reduced]);
  if (phase === 'gone') return null;

  return (
    <motion.div className={`rs ${phase === 'out' ? 'is-out' : ''}`} role="status" aria-label="Loading Mahana Boutique & Tailors"
      initial={false} animate={reduced && phase === 'out' ? { opacity: 0 } : undefined} transition={{ duration: 0.4 }}>
      <span className="rs-sky" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 9) % 100}%`, top: `${(i * 53 + 13) % 100}%`, animationDelay: `${-(i * 0.45).toFixed(2)}s` }} />)}</span>
      <div className="rs-in" aria-hidden="true">
        <svg className="rs-emblem" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1"><path d="M32 4 60 32 32 60 4 32Z" /><path d="M32 15 49 32 32 49 15 32Z" opacity=".7" /><path d="M32 25 39 32 32 39 25 32Z" fill="currentColor" fillOpacity=".35" /></svg>
        <span className="rs-name"><b>Mahana</b><i className="rs-pen" /></span>
        <span className="rs-line"><i /><svg viewBox="0 0 40 24" fill="none" stroke="currentColor"><path d="M20 2 30 12 20 22 10 12Z" fill="currentColor" fillOpacity=".2" /><path d="M20 8 24 12 20 16 16 12Z" fill="currentColor" /></svg><i /></span>
        <span className="rs-tag">{TAG.split('').map((c, i) => <em key={i} style={{ animationDelay: `${1.05 + i * 0.035}s` }}>{c === ' ' ? ' ' : c}</em>)}</span>
      </div>
    </motion.div>
  );
}
