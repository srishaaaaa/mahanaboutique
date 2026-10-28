import { useEffect, useState } from 'react';

// The hero arch's photos: the Hero model photo and the Hero slideshow photos (Admin → Storefront images), shown one
// at a time. Each photo fades in with a slow zoom; dots let visitors jump between them. One photo simply stays.
const EVERY = 5500;

export default function HeroSlides({ photos, reduced }) {
  const [cur, setCur] = useState(0);
  const n = photos.length;
  useEffect(() => { if (cur >= n) setCur(0) }, [n, cur]);
  useEffect(() => {
    if (n < 2 || reduced) return;
    const t = setInterval(() => { if (!document.hidden) setCur(c => (c + 1) % n) }, EVERY);
    return () => clearInterval(t);
  }, [n, reduced, cur]); // restarting on `cur` gives a full interval after a dot is clicked

  return (
    <div className="hs">
      {photos.map((p, i) => (
        <img key={p.image + i} src={p.image} alt={i === cur ? p.alt || 'Mahana Boutique & Tailors' : ''} aria-hidden={i !== cur}
          className={i === cur ? 'on' : ''} style={p.pos ? { objectPosition: p.pos } : undefined}
          fetchpriority={i === 0 ? 'high' : 'low'} decoding="async" />
      ))}
      {n > 1 && (
        <div className="hs-dots" role="tablist" aria-label="Hero photos">
          {photos.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === cur} aria-label={`Photo ${i + 1} of ${n}`} className={i === cur ? 'on' : ''} onClick={() => setCur(i)} />)}
        </div>
      )}
    </div>
  );
}
