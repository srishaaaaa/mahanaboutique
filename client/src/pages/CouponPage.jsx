import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { inr } from '../lib/format';

const dmy = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// Draws the coupon card on a canvas so the customer can save it as a picture.
function drawCoupon(shop, c) {
  const W = 900, H = 1040, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#f6f1ec'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(70, 90, W - 140, H - 180, 48); g.fill();
  g.setLineDash([14, 10]); g.lineWidth = 4; g.strokeStyle = '#1a123c'; g.stroke(); g.setLineDash([]);
  g.textAlign = 'center'; g.fillStyle = '#1a123c';
  g.font = '800 54px Georgia, serif'; g.fillText(String(shop.name).toUpperCase().slice(0, 28), W / 2, 220);
  g.font = '700 26px system-ui, sans-serif'; g.fillStyle = '#7a6a86'; g.fillText('G I F T   C O U P O N', W / 2, 270);
  g.fillStyle = '#1a123c'; g.font = '900 150px system-ui, sans-serif';
  g.fillText(c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${inr(c.discountValue)} OFF`, W / 2, 470);
  g.fillStyle = '#0b0b0e'; g.beginPath(); g.roundRect(W / 2 - 190, 530, 380, 110, 30); g.fill();
  g.fillStyle = '#fff'; g.font = '800 54px system-ui, sans-serif'; g.fillText(c.code.split('').join(' '), W / 2, 604);
  g.fillStyle = '#2a2433'; g.font = '500 30px system-ui, sans-serif';
  const lines = [c.minOrder ? `Valid on purchases of ${inr(c.minOrder)} or more` : 'No minimum purchase', c.expiresOn ? `Valid till ${dmy(c.expiresOn)}` : null, 'Show this code at billing.', 'Discount applies to the item value only.'].filter(Boolean);
  lines.forEach((l, i) => g.fillText(l, W / 2, 720 + i * 48));
  return cv;
}

// The coupon card customers open from WhatsApp: the offer, the code and a Download button.
export default function CouponPage() {
  const { code } = useParams(); const [qs] = useSearchParams();
  const [d, setD] = useState(null); const [err, setErr] = useState(); const done = useRef(false);
  useEffect(() => { api('/coupon/' + encodeURIComponent(code)).then(setD).catch(e => setErr(e.message)) }, [code]);
  useEffect(() => { document.title = d ? `Coupon ${d.coupon.code} · ${d.shop.name}` : 'Coupon' }, [d]);
  useEffect(() => { if (d && qs.get('print') === '1' && !done.current) { done.current = true; const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t) } }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <div className="cpn-page"><p className="cpn-err">{err}</p></div>;
  if (!d) return <div className="cpn-page"><p className="cpn-err">Loading coupon…</p></div>;
  const { coupon: c, shop } = d;
  const download = () => { const a = document.createElement('a'); a.href = drawCoupon(shop, c).toDataURL('image/png'); a.download = `coupon-${c.code}.png`; a.click() };
  return (
    <div className="cpn-page">
      <article className="cpn-card">
        <h1>{shop.name.toUpperCase()}</h1>
        <p className="cpn-sub">GIFT COUPON</p>
        <p className="cpn-off">{c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${inr(c.discountValue)} OFF`}</p>
        <p className="cpn-code">{c.code.split('').join(' ')}</p>
        {!c.active && <p className="cpn-bad">This coupon is no longer active.</p>}
        <p>{c.minOrder ? `Valid on purchases of ${inr(c.minOrder)} or more` : 'No minimum purchase'}</p>
        {c.expiresOn && <p>Valid till {dmy(c.expiresOn)}</p>}
        {c.sentOnly && <p>Only for the mobile number it was sent to</p>}
        <p>Show this code at billing. Discount applies to the item value only.</p>
        <button type="button" className="cpn-dl" onClick={download}>⬇ Download coupon</button>
      </article>
    </div>
  );
}
