import { useMemo } from 'react';
import { useApp } from '../context/App';
import { Reveal } from './Motion';
import { Emblem } from './Wordmark';
import { Eyebrow, Divider } from './NightParts';

const Ico = ({ children, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const PinIco = () => <Ico><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.4" /></Ico>;
const ClockIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico>;
const PhoneIco = () => <Ico><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></Ico>;

function openState(store) {
  const h = store?.hours; if (!h) return null;
  let now;
  try { now = new Date(new Date().toLocaleString('en-US', { timeZone: store.timeZone })) } catch { now = new Date() }
  const mins = now.getHours() * 60 + now.getMinutes();
  const t = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b };
  const fmt = s => { const [a, b] = s.split(':').map(Number); return `${a % 12 || 12}${b ? ':' + String(b).padStart(2, '0') : ''}${a < 12 ? 'AM' : 'PM'}` };
  const today = h.days.includes(now.getDay());
  if (today && mins >= t(h.open) && mins < t(h.close)) return { open: true, text: `Open now · until ${fmt(h.close)}` };
  return { open: false, text: today && mins < t(h.open) ? `Closed · opens ${fmt(h.open)}` : 'Closed today' };
}

// Visit us: a full-width night-toned map with the boutique's card floating over it. Location, hours and contact
// come from the admin-managed store settings; with nothing configured, a placeholder is shown instead of a made-up pin.
export default function StoreLocationMap() {
  const { site, loadSite } = useApp();
  const { store, map } = site;
  const state = useMemo(() => openState(store), [store]);
  if (site.status === 'loading') return null;

  const configured = site.status !== 'error' && !!map;
  const lines = store?.address?.length ? store.address : null;
  const tel = store?.phone && `tel:${store.phone.replace(/[^+\d]/g, '')}`;

  return (
    <section className="nx nx-map" aria-labelledby="st-h">
      <div className="nx-in">
        <div className={`nm-frame ${configured ? '' : 'is-empty'}`}>
          <div className="nm-map">
            {configured
              ? <iframe title={`Map showing ${store.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen src={map.embedUrl} />
              : <div className="nm-placeholder" role="img" aria-label="Boutique location to be announced"><Emblem size={110} /><span>{site.status === 'error' ? 'Map unavailable' : 'Location to be announced'}</span></div>}
            <span className="nm-shade" aria-hidden="true" />
            {configured && (
              <span className="nm-pin" aria-hidden="true">
                <span className="nm-pulse" /><span className="nm-pulse b" />
                <svg width="38" height="50" viewBox="0 0 40 54"><defs><linearGradient id="nm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f8e6bf" /><stop offset=".55" stopColor="#e33944" /><stop offset="1" stopColor="#bf1722" /></linearGradient></defs><path d="M20 0C9 0 0 8.7 0 19.5 0 33 20 54 20 54s20-21 20-34.5C40 8.7 31 0 20 0Z" fill="url(#nm-g)" /><circle cx="20" cy="19.5" r="7" fill="#1c284f" /></svg>
                <b>SHOP IS HERE</b>
              </span>
            )}
            {configured && <a className="nm-open" href={map.placeUrl || map.directionsUrl} target="_blank" rel="noopener noreferrer">OPEN IN MAPS ↗</a>}
          </div>

          <Reveal className="nm-card">
            <Eyebrow>VISIT US</Eyebrow>
            <h2 id="st-h" className="nx-h">OUR<br /><em>BOUTIQUE</em></h2>
            <Divider />
            {site.status === 'error' ? (
              <>
                <p role="alert" className="nx-p">The boutique location could not be loaded right now.</p>
                <div className="nx-cta"><button className="nx-ghost" onClick={loadSite}>TRY AGAIN</button></div>
              </>
            ) : (
              <>
                <p className="nx-p">Experience {store?.name || 'Mahana Boutique & Tailors'} in person. Traditional Indian wear, accessories, custom design and tailoring.</p>
                {configured ? (
                  <>
                    <ul className="nm-rows">
                      {lines && <li><span className="nm-ico"><PinIco /></span><span><strong>{lines[0]}</strong>{lines.length > 1 && <small>{lines.slice(1).join(', ')}</small>}</span></li>}
                      {store.hours && <li><span className="nm-ico"><ClockIco /></span><span><strong>{store.hours.label}</strong>{state && <small className={`nm-state ${state.open ? 'open' : ''}`}><i aria-hidden="true" />{state.text}</small>}</span></li>}
                      {tel && <li><span className="nm-ico"><PhoneIco /></span><span><strong><a href={tel}>{store.phone}</a></strong><small>Call the boutique</small></span></li>}
                    </ul>
                    <div className="nx-cta">
                      <a className="nx-btn" href={map.directionsUrl} target="_blank" rel="noopener noreferrer" data-cursor="GO"><span>GET DIRECTIONS</span><b aria-hidden="true"><i>→</i></b></a>
                      {tel ? <a className="nx-ghost" href={tel}><PhoneIco /> CALL STORE</a>
                        : store.email ? <a className="nx-ghost" href={`mailto:${store.email}`}>EMAIL US</a> : null}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="nx-p muted">Our boutique location and opening hours will be shared here soon.</p>
                    {store?.email && <div className="nx-cta"><a className="nx-ghost" href={`mailto:${store.email}`}>CONTACT US</a></div>}
                  </>
                )}
              </>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
