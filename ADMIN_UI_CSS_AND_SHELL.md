# Attachment for ADMIN_UI_PROMPT_FOR_DHANYA.md: shell source and the complete admin CSS (copy verbatim)

# PART 3 — Shell and shared components (source, verbatim)
Keep the class names exactly; they are what the CSS in Part 4 targets.

### `components/AdminShell.jsx`
```jsx
import { useLayoutEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/App';
import '../pos.css';
import '../pos2.css';
import '../pos3.css';
import '../invoice.css';

// The admin layout (sidebar + "Dashboard" top bar + cards) shared by every admin page. Admin only: it is imported solely by
// code-split admin pages, so public visitors never download this or pos.css.

const ICONS = {
  billing: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  orders: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.5 12h11L21 7H6" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5Z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8Z" /><circle cx="7.5" cy="8.5" r="1.2" /></>,
  cake: <><path d="M4 21h16v-7H4zM4 17c2 2 4-2 8 0s6 0 8 0M12 14V9M12 6V5" /></>,
  truck: <><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>,
  trend: <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />,
  shop: <><path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16" /><path d="M9 20v-6h6v6" /></>,
  star: <path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4-5.7-3.1-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.3a3 3 0 0 1 0 5.4M18 14.5c2 .7 3 2.6 3 5.5" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  wallet: <><path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7V6a2 2 0 0 1 2-2h11" /><circle cx="16.5" cy="14" r="1.2" /></>,
  user: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M10 3h4M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  swap: <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" /></>,
  scissors: <><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M8 7.6 20 18M8 16.4 20 6" /></>,
  ruler: <><path d="m3 17 14-14 4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-4M4 5v3h3M4 13a8 8 0 0 0 14 4M20 19v-3h-3" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.5" /></>,
  spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" /></>,
  download: <><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></>,
  send: <><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></>,
  save: <><path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" /></>,
};
export const Icon = ({ n, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>;

// [path, label, icon, managerOnly]
export const NAV = [
  { group: 'Retail billing', items: [
    ['/admin/billing', 'Billing', 'billing'], ['/admin/billing/analytics', 'POS Analytics', 'chart', true], ['/admin/billing/advance', 'Advance Orders', 'clock'], ['/admin/billing/orders', 'Order History', 'orders'],
    ['/admin/billing/inventory', 'Inventory', 'box', true], ['/admin/billing/customers', 'Customers', 'user'], ['/admin/billing/coupons', 'Coupons', 'tag', true],
    ['/admin/billing/birthdays', 'Date of Birth', 'cake', true], ['/admin/billing/expenses', 'Expenses', 'wallet', true]] },
  { group: 'Stitching', items: [['/admin/billing/stitching', 'Stitching Dashboard', 'scissors'], ['/admin/billing/stitching-orders', 'Stitching Orders', 'orders'], ['/admin/billing/measurements', 'Measurements', 'ruler'], ['/admin/billing/stitching-reports', 'Stitching Reports', 'chart', true]] },
  { group: 'Online store', items: [
    ['/admin/orders', 'Online orders', 'orders', true], ['/admin/reviews', 'Reviews', 'star', true], ['/admin/categories', 'Categories', 'tag', true], ['/admin/trending', 'Trending', 'star', true], ['/admin/site-text', 'Site text', 'edit', true],
    ['/admin/storefront', 'Storefront images', 'image', true], ['/admin/reels', 'Reels & Gallery', 'film', true], ['/admin/enquiries', 'Enquiries', 'mail', true],
    ['/admin/users', 'Users', 'users', true], ['/admin/sample', 'Sample data', 'flask', true]] },
  { group: 'Settings', items: [['/admin/billing/settings', 'POS Settings', 'gear', true], ['/admin/settings', 'Store Settings', 'gear', true]] },
];

// Every admin page draws its own sidebar, so its scroll position is kept here: opening a panel near the bottom
// no longer jumps the sidebar back to the top.
const sideScroll = { top: 0, left: 0 };

export default function AdminShell({ title, sub, actions, children }) {
  const side = useRef();
  useLayoutEffect(() => {
    const el = side.current; if (!el) return;
    el.scrollTop = sideScroll.top; el.scrollLeft = sideScroll.left;
    const on = el.querySelector('.dpos-nav.on');
    if (on) { // keep the open panel's button visible inside the sidebar (only the sidebar scrolls, never the page)
      const a = on.getBoundingClientRect(), b = el.getBoundingClientRect();
      if (a.top < b.top) el.scrollTop -= b.top - a.top + 12; else if (a.bottom > b.bottom) el.scrollTop += a.bottom - b.bottom + 12;
      if (a.left < b.left) el.scrollLeft -= b.left - a.left + 12; else if (a.right > b.right) el.scrollLeft += a.right - b.right + 12;
    }
  }, []);
  const { user } = useApp();
  const manager = !!user && ['owner', 'admin'].includes(user.role);
  const initial = (user?.name || user?.email || 'A').trim()[0].toUpperCase();
  return (
    <div className="dpos">
      <nav className="dpos-side" aria-label="Admin sections" ref={side} onScroll={e => { sideScroll.top = e.currentTarget.scrollTop; sideScroll.left = e.currentTarget.scrollLeft }}>
        <div className="dpos-brand"><img src="/logo.png" alt="Mahana Boutique & Tailors" /><i>{manager ? 'ADMIN' : 'CASHIER'}</i></div>
        {NAV.map(g => {
          const items = g.roles && !g.roles.includes(user?.role) ? [] : g.items.filter(i => !i[3] || manager);
          return items.length ? (
            <div key={g.group} style={{ display: 'contents' }}>
              <p className="dpos-grp">{g.group.toUpperCase()}</p>
              {items.map(([to, label, icon]) => <NavLink key={to} to={to} end className={({ isActive }) => `dpos-nav ${isActive ? 'on' : ''}`}><Icon n={icon} />{label}</NavLink>)}
            </div>) : null;
        })}
      </nav>
      <main className="dpos-main" id="main">
        <div className="dpos-head"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
          <div className="dpos-head-r">{actions}<Link to="/" className="dpos-view">← View Store</Link><span className="dpos-av" title={user?.email} aria-label={`Signed in as ${user?.email || ''}`}>{initial}</span></div></div>
        {children}
        <footer className="dpos-foot">
          <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED. MAHANA BOUTIQUE &amp; TAILORS.</span>
          <span>POWERED BY <b>CENEXA SYSTEMS</b> ©{new Date().getFullYear()}</span>
          <em>• Boutique &amp; Tailoring</em>
        </footer>
      </main>
    </div>
  );
}

```

### `components/Modal.jsx`
```jsx
import { useEffect } from 'react';

// Admin dialog with the dark header used across the POS. Closes on Escape or a click on the backdrop.
export default function Modal({ title, sub, onClose, wide, className = '', children, footer }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="dpos-modal" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`dpos-sheet ${wide ? 'wide' : ''} ${className}`}>
        <div className="dpos-mhead"><div><b style={{ fontSize: 17 }}>{title}</b>{sub && <small>{sub}</small>}</div><button type="button" aria-label="Close" onClick={onClose}>✕</button></div>
        {children}
        {footer && <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}

```

### `components/PeriodFilter.jsx`
```jsx
import { useState } from 'react';

// The "PERIOD: All time / Today / This week / This month / This year  +  FROM / TO" filter used by every admin list with dates.
// A value is { p, from, to }; the effective range is periodRange(value). Dates are IST calendar days (YYYY-MM-DD).
export const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
export const istDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date(iso));

const PERIODS = [['all', 'All time'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['year', 'This year']];

function chipRange(p) {
  const t = todayStr(), d = new Date(t + 'T00:00:00Z'), iso = x => x.toISOString().slice(0, 10);
  if (p === 'today') return [t, t];
  if (p === 'week') { const m = new Date(d); m.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return [iso(m), t] }
  if (p === 'month') return [t.slice(0, 8) + '01', t];
  if (p === 'year') return [t.slice(0, 4) + '-01-01', t];
  return ['', ''];
}
export const chipValue = p => { const [from, to] = chipRange(p); return { p, from, to } };
export const periodRange = v => [v.from || '2000-01-01', v.to || todayStr()];
export const inPeriod = (iso, v) => { if (!iso) return false; const d = String(iso).length > 10 ? istDay(iso) : String(iso); const [a, b] = periodRange(v); return d >= a && d <= b };
export const usePeriod = (initial = 'all') => useState(() => chipValue(initial));

export function PeriodFilter({ value, onChange }) {
  const custom = value.p === 'custom';
  return (
    <div className="dpos-pf">
      <div className="dpos-pg" role="radiogroup" aria-label="Period"><span className="lab">Period:</span>
        {PERIODS.map(([p, l]) => <button key={p} role="radio" aria-checked={value.p === p} className={value.p === p ? 'on' : ''} onClick={() => onChange(chipValue(p))}>{l}</button>)}
        <button role="radio" aria-checked={custom} className={custom ? 'on' : ''} onClick={() => onChange({ p: 'custom', from: value.from || todayStr(), to: value.to || todayStr() })}>Custom</button>
        {custom && <span className="dates"><label><span className="lab">From:</span><input type="date" max={todayStr()} value={value.from} onChange={e => onChange({ ...value, p: 'custom', from: e.target.value })} aria-label="From date" /></label>
          <label><span className="lab">To:</span><input type="date" max={todayStr()} value={value.to} onChange={e => onChange({ ...value, p: 'custom', to: e.target.value })} aria-label="To date" /></label></span>}
      </div>
    </div>
  );
}

// A labelled pill group for any other filter ("STATUS:", "STOCK:", "BILLS:" …), styled like the period filter.
export function Chips({ label, options, value, onChange }) {
  return (
    <div className="dpos-pg" role="radiogroup" aria-label={label}>{label && <span className="lab">{label}:</span>}
      {options.map(([v, l]) => <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
  );
}

```

### `components/ExportCsv.jsx`
```jsx
import { downloadCsv } from './StockMovements';

// "Export Excel" button for any admin list: a CSV file Excel opens. `rows` is an array of arrays in the same order as `header`.
export default function ExportCsv({ name, header, rows, label = 'Export Excel', className = 'dpos-btn outline' }) {
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <button type="button" className={className} disabled={!rows?.length} onClick={() => downloadCsv(`${name}-${stamp}.csv`, header, rows)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, verticalAlign: '-2px' }}><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /></svg>{label}
    </button>
  );
}

```

# PART 4 — The complete admin CSS (verbatim). Load order matters.
Load in this order after the public stylesheets: (a) the admin blocks of `home.css`, (b) the admin blocks of `nav.css`, (c) `pos.css`, (d) `pos2.css`, (e) `pos3.css` (this last file holds the final sizes and wins every conflict). `AdminShell` imports pos.css, pos2.css and pos3.css; put (a) and (b) in a file imported just before them. If a selector depends on a public variable (`--ob`, `--sans`), define it on `.dpos` as pos.css does.

### (a) `home.css` — admin blocks
```css
/* ---- policy pages + admin settings ---- */
.policy { --ink: #090a0c; --paper: #f5f5fa; background: var(--cream); color: var(--ob); padding: 150px var(--pad) 90px; min-height: 70vh }
.policy h1 { font-size: clamp(40px, 5vw, 76px); margin: 8px 0 24px }
.policy p { max-width: 68ch; margin-bottom: 1.2em }
.settings-form { max-width: 720px; display: grid; gap: 2px }
.settings-form .two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px }
.field textarea { width: 100%; padding: 14px 16px; background: transparent; border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent); font: inherit; color: inherit }
.days { border: 0; padding: 0; display: flex; gap: 14px; flex-wrap: wrap; margin: 10px 0 }


/* ============ admin: products & images, storefront images ============ */
.adm-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 22px; padding: 5px; background: #fff; border-radius: 999px; width: fit-content; max-width: 100%; box-shadow: 0 2px 14px rgba(9, 10, 12, .06) }
.adm-tabs a { padding: 10px 20px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(9, 10, 12, .65) }
.adm-tabs a.active { background: var(--ob); color: var(--ivory) }
.adm-help { max-width: 78ch; margin-bottom: 18px }
.adm-split { display: grid; grid-template-columns: minmax(280px, 380px) 1fr; gap: 28px; align-items: start }
.adm-list input { width: 100%; padding: 12px 18px; border-radius: 999px; border: 1px solid rgba(9, 10, 12, .2); background: #fff; margin-bottom: 12px }
.adm-list ul { display: grid; gap: 6px; max-height: 72vh; overflow: auto; padding-right: 4px }
.adm-list button { width: 100%; display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: center; text-align: left; padding: 8px 12px 8px 8px; border-radius: 18px; background: #fff; border: 1px solid transparent; transition: border-color .3s, box-shadow .3s }
.adm-list button:hover { box-shadow: 0 6px 20px rgba(9, 10, 12, .08) } .adm-list button.on { border-color: var(--ob) }
.adm-th { width: 52px; height: 64px; border-radius: 12px; overflow: hidden; background: #dfdeed; display: grid; place-items: center } .adm-th img { width: 100%; height: 100%; object-fit: cover } .adm-th i { font-size: 9px; opacity: .55; font-style: normal; text-align: center }
.adm-nm { display: grid; line-height: 1.3; min-width: 0 } .adm-nm b { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .adm-nm em { font-style: normal; font-size: 12px; opacity: .6 }
.adm-badge { min-width: 28px; text-align: center; padding: 4px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #e7f2e9; color: #1d6b3a } .adm-badge.warn { background: #fbe8e4; color: #8f4f40 }
.adm-panel, .adm-card, .adm-block { background: #fff; border-radius: 26px; padding: clamp(18px, 2.4vw, 32px); box-shadow: 0 14px 40px rgba(9, 10, 12, .05) }
.adm-block { margin-top: 26px } .adm-h2 { font-size: 26px; text-transform: none; letter-spacing: -.01em; margin-bottom: 8px }
.adm-drop { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 18px; margin: 12px 0 18px; border: 1.5px dashed rgba(9, 10, 12, .22); border-radius: 22px; background: rgba(243, 243, 249, .6); transition: background .3s, border-color .3s }
.adm-drop.over { background: #dfdeed; border-color: var(--ob) }
.adm-gal, .adm-covers { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px }
.adm-gal li, .adm-covers li { display: grid; gap: 8px; align-content: start }
.adm-img, .adm-cover { position: relative; aspect-ratio: 3 / 4; border-radius: 20px; overflow: hidden; background: #dfdeed; display: grid; place-items: center } .adm-img img, .adm-cover img { width: 100%; height: 100%; object-fit: cover } .adm-cover i { font-style: normal; font-size: 12px; opacity: .55; padding: 12px; text-align: center }
.adm-pos { position: absolute; left: 10px; top: 10px; width: 26px; height: 26px; border-radius: 50%; background: rgba(9, 10, 12, .7); color: #fff; font-size: 12px; font-weight: 700; display: grid; place-items: center }
.adm-gal input { padding: 9px 12px; border-radius: 12px; border: 1px solid rgba(9, 10, 12, .18); font-size: 13px; width: 100% }
.adm-act { display: flex; gap: 6px; flex-wrap: wrap; align-items: center } .adm-act button { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(9, 10, 12, .2); font-size: 12px; font-weight: 600; transition: background .3s, color .3s } .adm-act button:hover:not(:disabled) { background: var(--ob); color: var(--ivory) } .adm-act button:disabled { opacity: .35 } .adm-act .danger { margin-left: auto; color: #8f4f40; border-color: rgba(158, 16, 25, .35) } .adm-act .danger:hover:not(:disabled) { background: #8f4f40; color: #fff }
.adm-file { cursor: pointer; padding: 10px 18px; font-size: 11px }
.adm-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start } .adm-slots > .btn { grid-column: 1 / -1; justify-self: start }
.adm-prev { aspect-ratio: 4 / 3; border-radius: 20px; background: linear-gradient(135deg, #eaeaf3, #efd8d0); display: grid; place-items: center; overflow: hidden; margin: 12px 0 } .adm-prev img { max-width: 100%; max-height: 100%; object-fit: contain }
@media (max-width: 859px) { .adm-split { grid-template-columns: 1fr } .adm-list ul { max-height: 280px } }


```

### (b) `nav.css` — admin blocks
```css
/* ---- admin: homepage picks, and the gallery / videos headings on the homepage ---- */
.adm-h3 { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; margin: 22px 0 4px }
.adm-picks { list-style: none; padding: 0; margin: 8px 0 12px; display: grid; gap: 6px }
.adm-pick { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border: 1px solid rgba(20, 28, 56, .14); border-radius: 12px; background: #fff }
.adm-pick-act { display: flex; gap: 8px } .adm-pick-act button { padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(20, 28, 56, .25); font-size: 12px } .adm-pick-act button:disabled { opacity: .3 }
.insta-h3 { max-width: 1500px; margin: clamp(28px, 4vw, 52px) auto 14px; padding-inline: var(--pad, 24px); font-size: 12px; font-weight: 700; letter-spacing: .3em; opacity: .65 }


/* ---- POS billing: browse by category, then product, then size ---- */
.dpos-browse { margin-top: 12px }
.dpos-crumb { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; font-size: 13px }
.dpos-crumb button:not(.dpos-btn), .dpos-crumb span { padding: 4px 10px; border-radius: 999px; opacity: .65 } .dpos-crumb .on { opacity: 1; font-weight: 700; background: rgba(45, 62, 118, .08) }
.dpos-crumb i { font-style: normal; opacity: .4 }
.dpos-cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.dpos-cats button { display: grid; gap: 2px; text-align: left; padding: 14px 16px; border: 1px solid rgba(20, 28, 56, .14); border-radius: 14px; background: #fff; transition: border-color .2s, transform .2s, box-shadow .2s }
.dpos-cats button:hover, .dpos-cats button:focus-visible { border-color: var(--red, #2d3e76); transform: translateY(-2px); box-shadow: 0 8px 18px -10px rgba(28, 40, 79, .4) }
.dpos-cats b { font-size: 14px } .dpos-cats em { font-style: normal; font-size: 12px; opacity: .6 }
.dpos-sizes { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px }
.dpos-sizes button { display: grid; gap: 3px; justify-items: start; text-align: left; padding: 12px 14px; border: 1px solid rgba(20, 28, 56, .16); border-radius: 14px; background: #fff; transition: border-color .2s, background .2s }
.dpos-sizes button:hover:not(:disabled), .dpos-sizes button:focus-visible { border-color: var(--red, #2d3e76); background: rgba(45, 62, 118, .05) }
.dpos-sizes button:disabled { opacity: .45; cursor: not-allowed }
.dpos-sizes b { font-size: 15px } .dpos-sizes span { font-weight: 700; font-size: 13px } .dpos-sizes em { font-style: normal; font-size: 11px; opacity: .6 }

/* ---- POS bill: payment options, grand total and the split card ---- */
.dpos { --d-bill: #b91c1c }
.dpos-pills button { border-radius: 12px; padding: 14px 8px }
.dpos-pills button.on { background: var(--d-bill); border-color: var(--d-bill); color: #fff }
.dpos-grand b { color: var(--d-bill); font-size: 26px }
.dpos-paybox { border-radius: 20px; padding: 18px 20px; background: #fff }
.dpos-splitpick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px }
.dpos-splitpick button { padding: 11px 6px; border: 1px solid rgba(20, 28, 56, .16); border-radius: 12px; background: #fff; font-size: 12px; font-weight: 800; letter-spacing: .06em; color: #858490; transition: background .2s, border-color .2s, color .2s }
.dpos-splitpick button.on { background: #fde8e8; border-color: var(--d-bill); color: var(--d-bill) }
.dpos-paybox .dpos-grid { gap: 12px; margin-bottom: 4px }
.dpos-paybox input.bigin { border-radius: 14px }
.dpos-recv { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0 0; font-size: 13px; font-weight: 800; letter-spacing: .04em }
.dpos-recv:first-of-type { border-top: 1px solid rgba(20, 28, 56, .1); margin-top: 12px }
.dpos-recv b { font-size: 17px } .dpos-recv b.short { color: var(--d-bill) } .dpos-recv b.ok { color: #0a8a4a }
.dpos-cta:not(.amber) { background: var(--d-bill); border-color: var(--d-bill); box-shadow: 0 10px 24px -10px rgba(185, 28, 28, .6) }

/* ---- Advance order popup and saved receipt ---- */
.dpos-sheet.adv { max-width: 480px; padding: 0; border-radius: 24px; overflow: hidden }
.dpos-sheet.adv .dpos-mhead { background: #fff; color: #0f0f10; padding: 24px 28px 14px; border-bottom: 1px solid #ececec; align-items: flex-start }
.dpos-sheet.adv .dpos-mhead b { font-size: 22px !important; font-weight: 800 } .dpos-sheet.adv .dpos-mhead small { display: block; margin-top: 4px; color: #b45309; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: 1 }
.dpos-sheet.adv .dpos-mhead button { color: #0f0f10; background: none; border: 0; font-size: 18px }
.adv-form { display: grid; gap: 14px; padding: 18px 28px 28px }
.adv-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 12px; background: #fef3c7; border: 1px solid #fcd34d; color: #7c2d12; font-size: 12px; font-weight: 800; letter-spacing: .08em } .adv-total b { font-size: 14px }
.adv-l { display: grid; gap: 8px; margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #1c1917; text-transform: uppercase }
.adv-form input, .adv-form textarea { width: 100%; padding: 14px 16px; border: 1px solid #e5e2dd; border-radius: 12px; font: inherit; font-size: 15px; text-transform: none; letter-spacing: 0; background: #fff }
.adv-form input:focus, .adv-form textarea:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, .18) }
.adv-form input:first-of-type { font-weight: 800 }
.adv-due { margin: -6px 0 0; color: #991b1b; font-size: 12px; font-weight: 800 }
.adv-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px }
.adv-modes button { padding: 12px 6px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font-size: 12px; font-weight: 800; letter-spacing: .05em; color: #1c1917 }
.adv-modes button.on { background: #b91c1c; border-color: #b91c1c; color: #fff }
.adv-go { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border-radius: 14px; background: #f59e0b; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .1em; box-shadow: 0 10px 22px -12px rgba(245, 158, 11, .9) } .adv-go:disabled { opacity: .5 }
.adv-done .dpos-done-head h2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.adv-tag { padding: 4px 9px; border-radius: 8px; background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 800; letter-spacing: .1em }
.adv-done .oid { color: #b91c1c; font-family: ui-monospace, Menlo, monospace; font-weight: 700 }
.adv-paid { color: #0a7a3d }
.adv-bal { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding: 18px 20px; border-radius: 14px; background: #fef2da; border: 1px solid #c9897a; color: #991b1b; font-weight: 800 } .adv-bal b { font-size: 24px }
.adv-view { margin: 12px 0 0; text-align: center; font-size: 13px }

/* ---- POS analytics: today's panels and the product leaderboard ---- */
.an-today { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 18px; align-items: start } .an-side { display: grid; gap: 18px }
@media (max-width: 1000px) { .an-today { grid-template-columns: 1fr } }
.an-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px } .an-head h2 { margin: 0 }
.an-search { position: relative; display: flex; align-items: center; min-width: 240px; max-width: 100%; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; color: #6b6670 }
.an-search svg { position: absolute; left: 12px } .an-search input { width: 100%; padding: 11px 14px 11px 36px; border: 0; background: transparent; font: inherit; font-size: 13px; color: #1c1917 } .an-search input:focus { outline: none } .an-search:focus-within { border-color: #b91c1c }
.an-red { color: #b91c1c; font-weight: 800 }
.an-src { display: inline-block; padding: 3px 9px; border: 1px solid #b9b4bd; border-radius: 6px; background: #f1eff3; font-size: 10px; font-weight: 800; letter-spacing: .12em }
.an-bar { display: grid; grid-template-columns: 70px 1fr auto; align-items: center; gap: 12px; margin-top: 14px; font-size: 11px; font-weight: 800; letter-spacing: .08em } .an-bar b { font-size: 12px; letter-spacing: 0 }
.an-bar i, .an-top i, .an-share i { display: block; height: 9px; border-radius: 999px; background: #eceaee; overflow: hidden } .an-bar u, .an-top u, .an-share u { display: block; height: 100%; border-radius: 999px; background: #b91c1c; text-decoration: none; min-width: 3px }
.an-top { display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 12px; margin-top: 14px; font-size: 13px } .an-top .an-toprow { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; font-weight: 700 } .an-top em { font-style: normal; color: #b91c1c; font-weight: 800 } .an-top > span { font-size: 11px; opacity: .65 }
.an-share { display: flex; align-items: center; gap: 12px; min-width: 150px } .an-share i { flex: 1 } .an-share span { font-size: 12px; font-weight: 800; min-width: 48px; text-align: right }

/* ---- POS settings page ---- */
.dpos { --d-acc: var(--pos-accent, #1c284f); --d-bill: var(--pos-accent, #2d3e76) }
.pset { display: grid; gap: 18px } .pset-top { display: flex; align-items: center; gap: 16px } .pset-top .sub { margin: 4px 0 0 }
.pset-ico { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: var(--d-acc); color: #fff }
.pset-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 18px; align-items: start } .pset-col, .pset-wide { display: grid; gap: 18px } .pset-wide { grid-column: 1 / -1 }
@media (max-width: 1000px) { .pset-grid { grid-template-columns: 1fr } }
.pset-l { margin: 14px 0 8px; font-size: 10px; font-weight: 800; letter-spacing: .16em; color: #6b6670 }
.pset-sws { display: flex; flex-wrap: wrap; gap: 10px }
.pset-sw { width: 38px; height: 38px; border-radius: 12px; border: 2px solid transparent; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .15); transition: transform .15s } .pset-sw:hover { transform: scale(1.08) }
.pset-sw.on { outline: 2px solid #fff; outline-offset: -5px; box-shadow: 0 0 0 2px #1c1917 }
.pset-hex { display: flex; align-items: center; gap: 12px; margin-top: 16px } .pset-hex i { width: 46px; height: 46px; border-radius: 12px } .pset-hex input { width: 150px; padding: 12px 14px; border: 1px solid #e5e2dd; border-radius: 12px; font-weight: 800 }
.pset-prev { margin-top: 16px; border: 1px solid #e5e2dd; border-radius: 16px; overflow: hidden }
.pset-prev-h { padding: 14px 16px; background: var(--c); color: #fff; text-align: center; display: grid; gap: 2px } .pset-prev-h span { font-size: 12px; opacity: .85 }
.pset-prev-b { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff } .pset-prev-btn { padding: 8px 14px; border-radius: 10px; background: var(--c); color: #fff; font-size: 11px; font-weight: 800 } .pset-prev-b em { margin-left: auto; font-style: normal; font-weight: 800; padding: 6px 10px; background: #eceaee; border-radius: 8px }
.pset-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; margin-bottom: 10px; border: 1px solid #e5e2dd; border-radius: 14px } .pset-row .sub { margin: 2px 0 0 } .pset-row.off { opacity: .55 }
.pset-show { margin-left: auto; font-size: 11px } .pset-low { list-style: none; padding: 0; display: grid; gap: 8px; max-height: 50vh; overflow: auto } .pset-low li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid #ece8e1; border-radius: 12px } .pset-low em { font-style: normal; opacity: .6; font-size: 12px } .pset-low .out { color: #b91c1c }
.pset-staff { list-style: none; padding: 0; display: grid; gap: 8px } .pset-staff li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border: 1px solid #ece8e1; border-radius: 12px } .pset-staff em { display: block; font-style: normal; font-size: 12px; opacity: .6 }
.pset-add { margin-top: 16px; display: grid; gap: 10px } .pset-add input, .pset-add select, .pset-staff select { padding: 11px 14px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font: inherit }
.dpos-card .f input, .dpos-card .f textarea, .dpos-card .f select { border-radius: 12px }
.pset .dpos-card .dpos-card { margin-top: 16px; box-shadow: none; border-radius: 14px }

/* ---- Advance Orders: summary boxes, search and status chips ---- */
.adv-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px } @media (max-width: 760px) { .adv-kpis { grid-template-columns: 1fr } }
.adv-k { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 20px; border: 1px solid #e8e4dd; border-radius: 16px; background: #fff }
.adv-k span { display: block; font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #991b1b } .adv-k b { display: block; margin-top: 6px; font-size: 28px; font-weight: 800; color: #0f0f10 }
.adv-k i { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; font-style: normal } .adv-k i.rose { background: #fef2da; color: #b91c1c } .adv-k i.blue { background: #dbeafe; color: #2563eb } .adv-k i.green { background: #dcfce7; color: #16a34a }
.adv-bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 16px; margin-bottom: 14px; border: 1px solid #e8e4dd; border-radius: 16px; background: #fff }
.adv-search { flex: 1 1 280px; position: relative; display: flex; align-items: center; color: #991b1b } .adv-search svg { position: absolute; left: 14px } .adv-search input { width: 100%; padding: 13px 16px 13px 42px; border: 1px solid #e5e2dd; border-radius: 12px; font: inherit; font-size: 14px; color: #1c1917 } .adv-search input:focus { outline: none; border-color: #b91c1c }
.adv-chips { display: flex; gap: 8px; flex-wrap: wrap } .adv-chips button { padding: 11px 16px; border-radius: 12px; background: #f3f3f4; font-size: 11px; font-weight: 800; letter-spacing: .06em; color: #0f0f10; transition: background .2s } .adv-chips button.on { background: #b91c1c; color: #fff }

/* ---- neck design picker (picture cards) ---- */
.neck-field { display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.neck-btn { display: flex; align-items: center; gap: 10px; flex: 1 1 220px; min-height: 48px; padding: 8px 14px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; text-align: left }
.neck-btn:hover { border-color: var(--d-acc, #2d3e76) } .neck-ic { width: 38px; color: #111 } .neck-ic svg { width: 38px; height: 28px } .neck-tx { flex: 1; font-size: 14px; font-weight: 600 } .neck-btn em { font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: var(--d-acc, #2d3e76) }
.pick-ov { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(15, 15, 16, .55) }
.pick-sheet { width: min(640px, 100%); max-height: min(92vh, 860px); display: flex; flex-direction: column; border-radius: 22px; background: #fff; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, .35) }
.pick-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 12px } .pick-head h3 { margin: 0; font-size: 20px; font-weight: 800; color: #0f0f10 } .pick-head button { font-size: 18px; padding: 6px 10px }
.pick-grid { flex: 1; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 6px 22px 18px; align-content: start }
.pick-card { display: grid; justify-items: center; align-content: center; gap: 8px; min-height: 104px; padding: 14px 10px; border: 2px solid #e8e6e3; border-radius: 16px; background: #fff; color: #0f0f10; transition: border-color .15s, background .15s }
.pick-card b { font-size: 14px; font-weight: 800 } .pick-card:hover { border-color: #efc3b3 } .pick-card.on { border-color: #efc3b3; background: #eef0f9 }
.pick-card.custom { border-style: dashed; cursor: text } .pick-card.custom b { font-size: 12px; letter-spacing: .06em } .pick-card.custom input { width: 100%; padding: 10px 12px; border: 1px solid #e5e2dd; border-radius: 10px; font: inherit; font-size: 13px } .pick-card.custom input:focus { outline: none; border-color: var(--d-acc, #2d3e76) }
.pick-foot { display: flex; gap: 12px; padding: 14px 22px 20px; border-top: 1px solid #eee }
.pick-cancel { padding: 0 22px; border: 1px solid #e5e2dd; border-radius: 14px; font-weight: 800; background: #fff } .pick-go { flex: 1; padding: 17px; border-radius: 14px; background: var(--d-acc, #2d3e76); color: #fff; font-weight: 800; letter-spacing: .06em }
@media (max-width: 480px) { .pick-grid { gap: 10px; padding-inline: 14px } .pick-card { min-height: 92px } }

/* ---- Inventory tabs and the stock movements ledger ---- */
.inv-tabs { display: inline-flex; gap: 6px; padding: 6px; margin-bottom: 18px; border: 1px solid #e8e4dd; border-radius: 16px; background: #fff }
.inv-tabs button { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #1c1917 } .inv-tabs button.on { background: var(--d-bill, #b91c1c); color: #fff }
.sm-h { margin: 0; font-size: 30px; font-weight: 800 } .sm-sub { margin: 4px 0 18px }
.sm-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 14px 16px; margin-bottom: 18px; border: 1px solid #e8e4dd; border-radius: 16px; background: #fff } .sm-sp { flex: 1 }
.sm-ic { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff }
.sm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; font-size: 11px; font-weight: 800; letter-spacing: .06em } .sm-btn.green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0 } .sm-btn.red { background: var(--d-bill, #b91c1c); color: #fff } .sm-btn:disabled { opacity: .5 }
.sm-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px } @media (max-width: 1100px) { .sm-kpis { grid-template-columns: 1fr 1fr } } @media (max-width: 560px) { .sm-kpis { grid-template-columns: 1fr } }
.sm-k { display: flex; align-items: center; gap: 14px; padding: 18px; border: 1px solid #e8e4dd; border-radius: 16px; background: #fff } .sm-k span { display: block; font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #44403c } .sm-k b { display: block; margin-top: 4px; font-size: 26px; font-weight: 800 } .sm-k small { font-size: 16px; font-weight: 800 }
.sm-k i { width: 52px; height: 52px; flex: none; border-radius: 14px; display: grid; place-items: center } .sm-k i.g { background: #dcfce7; color: #15803d } .sm-k i.r { background: #fef2da; color: #b91c1c } .sm-k i.a { background: #e4e4f0; color: #c2410c } .sm-k i.solid { background: var(--d-bill, #b91c1c); color: #fff } .sm-k b.g { color: #15803d }
.sm-ledger { border: 1px solid #e8e4dd; border-radius: 16px; background: #fff; overflow: hidden }
.sm-lh { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 20px; background: #faf8f5; border-bottom: 1px solid #ece8e1 } .sm-lh b { flex: 1 1 200px; font-size: 13px; letter-spacing: .08em }
.sm-search { position: relative; display: flex; align-items: center; color: #6b6670 } .sm-search svg { position: absolute; left: 12px; width: 18px; height: 18px } .sm-search input, .sm-lh select { padding: 11px 14px 11px 38px; min-width: 260px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font: inherit; font-size: 13px } .sm-lh select { padding-left: 14px; min-width: 150px; font-weight: 700 }
.sm-ledger table { width: 100% } .sm-ledger th, .sm-ledger td { padding: 14px 20px } .sm-ch { font-weight: 800 } .sm-ch.g { color: #15803d } .sm-ch.r { color: #b91c1c }
.sm-tag { display: inline-block; padding: 5px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; letter-spacing: .1em; background: #f1eff3 } .sm-tag.in { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0 } .sm-tag.out { background: #fef2da; color: #991b1b; border: 1px solid #efc3b3 } .sm-tag.warn { background: #e4e4f0; color: #9a3412; border: 1px solid #fed7aa }

.neck-card { flex: 1 1 150px; display: grid; justify-items: center; gap: 4px; padding: 10px 12px; border: 2px dashed #e5e2dd; border-radius: 14px; background: #fff; color: #0f0f10; text-align: center }
.neck-card.set { border-style: solid; border-color: #efc3b3; background: #eef0f9 } .neck-card:hover { border-color: var(--d-acc, #2d3e76) }
.neck-k { font-size: 10px; font-weight: 800; letter-spacing: .12em; color: #6b6670 } .neck-card b { font-size: 13px } .neck-card em { font-style: normal; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: var(--d-acc, #2d3e76) }
.stc-grid > *:has(> .neck-field), .stc-grid > *:has(.neck-field) { grid-column: 1 / -1 }
.neck-card { max-width: 230px }

/* ---- Expense Tracker ---- */
.ex { --ex: var(--pos-accent, #2d3e76); --ex-soft: #e9e8f4; display: grid; gap: 18px } .ex-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap } .ex-title { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 30px; font-weight: 800; color: #0f0f10 } .ex-title svg { color: var(--ex) }
.ex-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px } @media (max-width: 800px) { .ex-kpis { grid-template-columns: 1fr } }
.ex-k { display: grid; gap: 6px; padding: 20px 22px; border: 1px solid #e8e4dd; border-radius: 20px; background: #fff } .ex-k span { font-size: 11px; font-weight: 800; letter-spacing: .1em } .ex-k b { font-size: 30px; font-weight: 800; margin-top: 18px } .ex-k small { font-size: 11px; opacity: .7 }
.ex-k.big { background: linear-gradient(135deg, var(--ex), #0a1024); color: #fff; border: 0; box-shadow: 0 16px 34px -18px rgba(45, 62, 118, .7) }
.ex-two { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 18px; align-items: start } @media (max-width: 1000px) { .ex-two { grid-template-columns: 1fr } }
.ex-card { padding: 22px; border: 1px solid #e8e4dd; border-radius: 22px; background: #fff; display: grid; gap: 10px; align-content: start }
.ex-h { margin: 0 0 4px; padding-left: 12px; border-left: 4px solid var(--ex); font-size: 14px; font-weight: 800; letter-spacing: .08em; line-height: 1.1 }
.ex-ch { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap }
.ex-l { display: grid; gap: 6px; margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #1c1917 }
.ex-card input, .ex-card select { width: 100%; padding: 13px 14px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fafafa; font: inherit; font-size: 14px; letter-spacing: 0; color: #1c1917 } .ex-card input:focus, .ex-card select:focus { outline: none; border-color: var(--ex); background: #fff }
.ex-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.ex-link { justify-self: start; font-size: 12px; font-weight: 700; color: var(--ex); text-decoration: underline }
.ex-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px } .ex-modes button { padding: 12px 6px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font-size: 11px; font-weight: 800; letter-spacing: .06em } .ex-modes button.on { background: var(--ex); border-color: var(--ex); color: #fff }
.ex-add { padding: 15px; border-radius: 12px; background: var(--ex); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .1em; box-shadow: 0 10px 22px -12px rgba(45, 62, 118, .8) } .ex-add:disabled { opacity: .5 }
.ex-man { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #e5e2dd; border-radius: 12px; font-size: 11px; font-weight: 800; letter-spacing: .08em }
.ex-empty { display: grid; justify-items: center; gap: 6px; padding: 34px 10px; text-align: center } .ex-empty p { margin: 0; font-size: 13px; opacity: .65 } .ex-pig { width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; background: #f1eff3; color: #6b6670 }
.ex-bars { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px } .ex-bars li { display: grid; grid-template-columns: 150px 1fr auto; align-items: center; gap: 12px; font-size: 13px } .ex-bars i { height: 10px; border-radius: 999px; background: #eceaee; overflow: hidden } .ex-bars u { display: block; height: 100%; background: var(--ex); border-radius: 999px; min-width: 4px } .ex-bars b { font-size: 13px }
.ex-mgr { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1fr); gap: 14px } @media (max-width: 700px) { .ex-mgr { grid-template-columns: 1fr } }
.ex-add-cat { display: grid; gap: 10px; align-content: start; padding: 16px; border: 1px solid #e8e4dd; border-radius: 16px } .ex-add-cat b { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid #eee }
.ex-cats { border: 1px solid #e8e4dd; border-radius: 16px; overflow: hidden } .ex-cats-h { padding: 14px 16px; background: #faf8f5; font-weight: 800; font-size: 13px } .ex-cats ul { list-style: none; padding: 0; margin: 0; max-height: 330px; overflow: auto }
.ex-cats li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 14px 16px; border-top: 1px solid #f0ece6 } .ex-on { padding: 4px 12px; border-radius: 999px; background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; font-size: 11px; font-weight: 800 } .ex-cats li button { color: #9a9a9a } .ex-cats li button:hover { color: var(--ex) }
.ex-fl { display: flex; gap: 10px; flex-wrap: wrap } .ex-fl select, .ex-fl input { width: auto; min-width: 170px }
.ex-chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #f1eff3; font-size: 12px; font-weight: 700 } .ex-amt { color: var(--ex); font-weight: 800 }

/* ---- analytics boxes that open ---- */
.dpos-card2.openable { cursor: pointer; transition: transform .2s, box-shadow .2s } .dpos-card2.openable:hover, .dpos-card2.openable:focus-visible { transform: translateY(-2px); box-shadow: 0 14px 28px -16px rgba(0, 0, 0, .35); outline: none }
.dpos-card2 .s.more { margin-top: 8px; font-size: 11px; font-weight: 800; letter-spacing: .06em; color: #b91c1c } .dpos-card2.net .s.more { color: #fff; opacity: .9 }
.money-sum { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid #e8e4dd; border-radius: 14px; background: #faf8f5 } .money-sum > div { display: flex; justify-content: space-between; font-size: 14px } .money-sum .tot { padding-top: 10px; border-top: 1px solid #e5e2dd; font-weight: 800; font-size: 16px } .money-sum .neg { color: #b91c1c } .money-sum .pos { color: #0a7a3d }
.money-h { margin: 18px 0 8px; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase }

/* the shopping bag uses the same light panel as Refine */
.drawer.refine.glass { right: 0 } .drawer.refine .bag-thumb { background: #dfdeed } .drawer.refine .bag-lines li { border-color: rgba(20, 28, 56, .12) }
.drawer.refine .muted, .drawer.refine .small { color: rgba(20, 28, 56, .65) } .drawer.refine .btn.solid { background: var(--red, #2d3e76); color: #fff; border-color: var(--red, #2d3e76) }
.drawer.refine .link-u { color: #141c38 } .drawer.refine .icon-btn, .drawer.refine .qty button { color: #141c38 }

/* ---- Coupon Management ---- */
.cp, .bd { --p: var(--pos-accent, #1c284f); display: grid; gap: 16px } .cp-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px } .cp-top h2 { margin: 0; font-size: 28px; font-weight: 800 } .cp-top .sub { margin: 4px 0 0 }
.cp-ref { display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font-size: 13px; font-weight: 700 }
.cp-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px } @media (max-width: 820px) { .cp-kpis { grid-template-columns: 1fr } }
.cp-k { display: flex; justify-content: space-between; gap: 12px; padding: 20px 22px; border: 1px solid #e8e4dd; border-radius: 20px; background: #fff } .cp-k span { display: block; font-size: 11px; font-weight: 800; letter-spacing: .08em } .cp-k b { display: block; margin: 16px 0 4px; font-size: 32px; font-weight: 800 } .cp-k b.g { color: #0f9d6b } .cp-k small { font-size: 13px; opacity: .65 }
.cp-k i { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: #f1eff3; color: #44403c; font-style: normal; font-weight: 800 } .cp-k i.g { background: #dcfce7; color: #0f9d6b } .cp-k i.dark { background: var(--d-acc, #1c284f); color: #fff; border-radius: 50% }
.cp-note { display: flex; align-items: center; gap: 10px; margin: 0; padding: 14px 18px; border-radius: 14px; background: #f1efec; font-size: 14px }
.cp-two { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 18px; align-items: start } @media (max-width: 1000px) { .cp-two { grid-template-columns: 1fr } }
.cp-card { display: grid; gap: 12px; padding: 24px; border: 1px solid #e8e4dd; border-radius: 22px; background: #fff; align-content: start } .cp-card h3 { margin: 0; font-size: 20px; font-weight: 800 }
.cp-badge { justify-self: start; padding: 5px 12px; border-radius: 999px; background: var(--p); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .08em }
.cp-l { display: block; margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #1c1917 } .cp-l em { color: #b91c1c; font-style: normal }
.cp-card input, .cp-card select { width: 100%; padding: 14px 16px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fafafa; font: inherit; font-size: 14px; letter-spacing: 0 } .cp-card input:focus { outline: none; border-color: var(--p); background: #fff }
.cp-code { display: grid; grid-template-columns: 1fr auto; gap: 10px } .cp-code input { font-family: ui-monospace, Menlo, monospace; font-weight: 700 } .cp-code button { display: inline-flex; align-items: center; gap: 8px; padding: 0 18px; border-radius: 12px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .06em }
.cp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px } .cp-type { display: grid; grid-template-columns: 1fr 1fr; gap: 8px } .cp-type button { padding: 11px; border: 1px solid #e5e2dd; border-radius: 12px; font-size: 12px; font-weight: 800; background: #fff } .cp-type button.on { background: var(--p); border-color: var(--p); color: #fff }
.cp-go { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border-radius: 14px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .08em } .cp-go:disabled { opacity: .5 }
.cp-lh { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid #eee } .cp-n { display: inline-block; margin-left: 8px; padding: 2px 10px; border-radius: 999px; background: var(--d-acc, #1c284f); color: #fff; font-size: 12px } .cp-adm { padding: 5px 12px; border-radius: 999px; background: #f1eff3; font-size: 10px; font-weight: 800; letter-spacing: .08em }
.cp-empty { padding: 44px 16px; border-radius: 16px; background: #faf8f5; text-align: center; font-weight: 700; color: #3a3438 }
.cp-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px } .cp-list li { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 14px 16px; border: 1px solid #ece8e1; border-radius: 14px } .cp-list li.off { opacity: .55 } .cp-list p { grid-column: 1; margin: 0; font-size: 12px; opacity: .7 } .cp-act { grid-column: 2; grid-row: 1 / 3; display: flex; align-items: center; gap: 12px }
.cp-c { font-family: ui-monospace, Menlo, monospace; font-size: 15px } .cp-d { margin-left: 10px; padding: 3px 10px; border-radius: 999px; background: #e9e8f4; color: var(--p); font-size: 12px; font-weight: 800 } .cp-del { color: #9a9a9a } .cp-del:hover { color: #b91c1c }

/* ---- Date of Birth ---- */
.bd-top { display: flex; align-items: center; gap: 14px } .bd-top h2 { margin: 0; font-size: 26px; font-weight: 800 } .bd-top .sub { margin: 2px 0 0 } .bd-ic { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: #f1eff3 } .bd-ic.sm { width: 40px; height: 40px }
.bd-add { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; padding: 14px 20px; border-radius: 14px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .06em }
.bd-tabs { display: flex; gap: 24px; border-bottom: 1px solid #e5e2dd } .bd-tabs button { padding: 12px 2px; font-size: 14px; font-weight: 800; color: #6b6670; border-bottom: 2px solid transparent; margin-bottom: -1px } .bd-tabs button.on { color: #111; border-bottom-color: var(--p) }
.bd-two { display: grid; grid-template-columns: minmax(300px, .62fr) minmax(0, 1.4fr); gap: 18px; align-items: start } @media (max-width: 960px) { .bd-two { grid-template-columns: 1fr } } .bd-col { display: grid; gap: 16px }
.bd-card { display: grid; gap: 10px; padding: 20px; border: 1px solid #e8e4dd; border-radius: 20px; background: #fff; align-content: start } .bd-h { margin: 0 0 4px; font-size: 16px; font-weight: 800 }
.bd-cal-h { display: flex; align-items: center; gap: 8px } .bd-cal-h select { padding: 10px 12px; border: 1px solid #e5e2dd; border-radius: 12px; font-weight: 700; background: #fff } .bd-sp { flex: 1 } .bd-cal-h button { padding: 9px 12px; border: 1px solid #e5e2dd; border-radius: 10px; background: #fff; font-weight: 700 }
.bd-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 8px } .bd-days i { display: block } .bd-days button { position: relative; aspect-ratio: 1 / .85; border: 1px solid #e5e2dd; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 800 } .bd-days button.now { border-color: var(--d-acc, #1c284f) } .bd-days button.sel { background: var(--p); border-color: var(--p); color: #fff }
.bd-days u { position: absolute; right: 5px; top: 5px; width: 6px; height: 6px; border-radius: 50%; background: #e11d48 } .bd-leg { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 12px; opacity: .7 } .bd-leg u { width: 7px; height: 7px; border-radius: 50%; background: #e11d48 }
.bd-chips { display: flex; flex-wrap: wrap; gap: 8px } .bd-chips button { padding: 9px 14px; border-radius: 10px; background: #f1efec; font-size: 12px; font-weight: 800 } .bd-chips button.on { background: var(--d-acc, #1c284f); color: #fff }
.bd-l { margin: 8px 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #44403c } .bd-sel { display: grid; grid-template-columns: 1.3fr 1fr; gap: 10px } .bd-sel select, .bd-offer select { width: 100%; padding: 13px 14px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font: inherit; font-weight: 700 }
.bd-none { margin: 0; padding: 18px 4px; color: #6b6670; font-size: 14px } .bd-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px }
.bd-list li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid #ece8e1; border-radius: 14px } .bd-list b { display: block } .bd-list span { font-size: 12px; opacity: .65 } .bd-list em { font-style: normal; font-size: 12px; font-weight: 800; color: #b45309 }
.bd-send { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: #16a34a; color: #fff; font-size: 12px; font-weight: 800 }
.bd-oh { display: flex; align-items: center; gap: 12px } .bd-oh .sub { margin: 0 } .bd-save { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 12px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800 } .bd-save:disabled { background: #e5e2dd; color: #858490 }
.bd-offer { display: grid; grid-template-columns: 1fr auto auto; gap: 8px } .bd-offer button { width: 46px; border: 1px solid #e5e2dd; border-radius: 12px; display: grid; place-items: center } .bd-offer button.del { color: #b91c1c; background: #fef2f2 } .bd-offer button:disabled { opacity: .4 }
.bd-addoffer { padding: 13px; border: 1px dashed #c9c4bd; border-radius: 12px; font-weight: 800; font-size: 13px }
.bd-card textarea { width: 100%; padding: 14px; border: 1px solid #e5e2dd; border-radius: 12px; font: inherit; font-size: 14px; resize: vertical } .bd-hint { margin: 0; font-size: 12px; opacity: .7 }
.bd-prev { padding: 16px; border: 1px solid #bbf7d0; border-radius: 14px; background: #f0fdf4 } .bd-prev p { margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #44403c } .bd-prev pre { margin: 0; white-space: pre-wrap; font: inherit; font-size: 14px }
.bd-fh { display: flex; align-items: center; justify-content: space-between; gap: 10px } .bd-csv { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #a7f3d0; border-radius: 12px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800 } .bd-csv:disabled { opacity: .5 }

.cp-l input, .cp-l select { margin-top: 8px }


/* Reels & Photo Gallery admin page: six slots per section */
.dpos-reels.six { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px } @media (max-width: 900px) { .dpos-reels.six { grid-template-columns: repeat(2, minmax(0, 1fr)) } } @media (max-width: 520px) { .dpos-reels.six { grid-template-columns: 1fr } }
.dpos-reels.six .media { max-height: 340px; overflow: hidden } .dpos-reels.six .media img, .dpos-reels.six .media video { width: 100%; height: 100%; object-fit: cover }


/* =====================================================================
   POS theme pass: decorative red becomes the theme purple (or the accent chosen in Settings).
   Red is kept only where it carries meaning: errors, delete, negative amounts, shortfalls, balance due and out-of-stock.
   ===================================================================== */
.dpos { --d-bill: var(--pos-accent, #2d3e76); --d-tint: color-mix(in srgb, var(--d-bill) 10%, #fff); --d-tint2: color-mix(in srgb, var(--d-bill) 18%, #fff) }
.dpos-cta:not(.amber) { box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--d-bill) 70%, transparent) }
.dpos-splitpick button.on { background: var(--d-tint); border-color: var(--d-bill); color: var(--d-bill) }
.dpos-recv b.short { color: #b91c1c }

/* advance orders */
.adv-k span { color: var(--d-bill) } .adv-k i.rose { background: var(--d-tint2); color: var(--d-bill) }
.adv-search { color: var(--d-bill) } .adv-search input:focus { border-color: var(--d-bill) }
.adv-chips button.on, .adv-modes button.on { background: var(--d-bill); border-color: var(--d-bill) }
.adv-done .oid { color: var(--d-bill) } .adv-tag { background: var(--d-tint); color: var(--d-bill) }

/* inventory, movements, analytics */
.sm-btn.red { background: var(--d-bill) } .sm-k i.r { background: var(--d-tint2); color: var(--d-bill) } .sm-tag.out { background: var(--d-tint); color: var(--d-bill); border-color: var(--d-tint2) }
.an-red, .an-top em { color: var(--d-bill) } .an-bar u, .an-top u, .an-share u { background: var(--d-bill) } .adm-act .danger:not(:hover) { }
.dpos-card2 .s.more { color: var(--d-bill) } .dpos-card2.net .s.more { color: #fff }

/* birthdays, coupons, expenses already follow the theme; their small accents too */
.bd-days u, .bd-leg u { background: var(--d-bill, #2d3e76) }
.cp-d { background: var(--d-tint); color: var(--d-bill) }
.ex { --ex: var(--d-bill, #2d3e76) }
.ex-title svg { color: var(--d-bill, #2d3e76) }
.money-sum .neg { color: #b91c1c }

.ra.doc { background: var(--d-tint, #e9e8f4); color: var(--d-bill, #2d3e76) }
/* cost price boxes in analytics */
.cost-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px } @media (max-width: 760px) { .cost-row { grid-template-columns: 1fr } }
.cost-card { display: grid; gap: 14px; padding: 22px 24px; border: 1px solid; border-radius: 22px; background: #fff } .cost-card.teal { border-color: #b8d8d2; background: linear-gradient(180deg, #f3fbf9, #fff) } .cost-card.amber { border-color: #f7ebd4; background: linear-gradient(180deg, #f5f5fa, #fff) }
.cc-t { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px } .cc-t span { font-size: 12px; font-weight: 800; letter-spacing: .1em } .cc-t i { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center } .teal .cc-t i { background: #dcefec; color: #0f766e } .amber .cc-t i { background: #e1e0ee; color: #c2410c }
.cost-card b { font-size: 36px; font-weight: 800; letter-spacing: -.01em } .teal b { color: #0f766e } .amber b { color: #b45309 } .cost-card small { font-size: 12px; font-weight: 600 } .cost-card small em { font-style: normal; font-weight: 800; color: #0a8a5c } .cost-card small em.neg { color: #b91c1c }
/* search boxes: keep the icon clear of the text (the global POS input padding was winning) */
.dpos .adv-search input, .dpos .sm-search input, .dpos .an-search input { padding-left: 44px !important }
.dpos .adv-search svg, .dpos .sm-search svg, .dpos .an-search svg { pointer-events: none }


/* Photos inside the product Edit window */
.pphotos .adm-gal { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) }

/* Billing: service line Measurements */
.msr { display: grid; gap: 16px }
.msr-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px }
.msr-f { display: grid; gap: 6px; min-width: 0 }
.msr-l { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase }
.msr-h { margin: 6px 0 0; font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--d-bill, #2d3e76) }
.msr-neck { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px; padding: 6px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 12px; background: #fff; text-align: left }
.msr-neck svg { width: 34px; height: 26px; flex: none }
.msr-neck > span:last-child { margin-left: auto; opacity: .5 }
.msr-chips { display: flex; flex-wrap: wrap; gap: 8px }
.msr-chips button { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--d-line, #dfdfec); background: #fff; font-weight: 700; font-size: 13px }
.msr-chips button.on { background: var(--d-bill, #2d3e76); border-color: var(--d-bill, #2d3e76); color: #fff }
.msr-cm { position: relative; display: block }
.msr-cm input { width: 100%; padding-right: 40px }
.msr-cm em { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-style: normal; font-size: 12px; opacity: .55; pointer-events: none }
.msr-rh { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.msr-rem { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px }
.msr-rem li { display: flex; justify-content: space-between; gap: 10px; padding: 8px 12px; border-radius: 10px; background: var(--d-tint, #f6eef6); font-size: 14px }
.msr-rem button { opacity: .6 }
.msr-add { display: flex; gap: 8px; flex-wrap: wrap }
.msr-add input { flex: 1 1 220px }
.dpos-modal .pick-ov { z-index: 500 }
.msr-line { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.msr-sum { font-size: 12px; color: var(--d-mut, #6f6b66); line-height: 1.5 }
@media (max-width: 560px) { .msr-two { grid-template-columns: 1fr } }

.inv-msr { display: block; margin-top: 4px; font-size: 11px; line-height: 1.5; color: #6f6b66 }

/* Product card buttons: soft pill edges */
.pcard-actions .pcard-quick, .pcard-quick, .pcard-add { border-radius: 999px }

/* Admin: Site text */
.st-fields { display: grid; gap: 14px; max-width: 760px }
.st-para { display: grid; gap: 4px; margin-bottom: 8px; justify-items: start } .st-para textarea { width: 100% }
.st-policy { display: grid; gap: 12px; max-width: 760px }
/* Admin: product editor tabs */
.pe-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--d-line, #dfdfec) }
.pe-tabs button { padding: 10px 14px; font-weight: 700; font-size: 13px; border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--d-mut, #6f6b66) }
.pe-tabs button.on { color: var(--d-ink, #121214); border-bottom-color: var(--d-bill, #2d3e76) }
.pe-check { display: flex; align-items: center; gap: 10px; font-weight: 600 }
.pe-cols { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px }
.pe-col { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 999px; background: #fff; font-weight: 600; font-size: 13px; cursor: pointer }
.pe-col.on { border-color: var(--d-bill, #2d3e76); background: var(--d-tint, #f6eef6) }
.pe-vars input { width: 100%; min-width: 70px; padding: 8px 10px }
.pe-acts { display: flex; gap: 6px; justify-content: flex-end; white-space: nowrap }
.pe-add { display: grid; grid-template-columns: repeat(4, minmax(80px, 1fr)) auto; gap: 8px }
@media (max-width: 640px) { .pe-add { grid-template-columns: 1fr 1fr } }
.adv-k small { display: block; margin-top: 4px; font-size: 12px; color: var(--d-mut, #6f6b66) }

.adm-note { margin: 8px 0 12px; padding: 12px 14px; border-radius: 12px; background: #eeeef6; border: 1px solid #f7ebd4; font-size: 14px }
.adm-pick-n { display: flex; align-items: center; gap: 10px; font-weight: 700 } .adm-pick-n img { object-fit: cover; border-radius: 8px; flex: none }
.dpos-warn { display: block; margin-top: 6px; color: #9a5b00; font-size: 12px; font-weight: 600 }

/* Payment split picker (advance deposit / balance) */
.payp { display: grid; gap: 10px }
.payp-split { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px }
.payp-split label { display: grid; gap: 4px; font-size: 12px; font-weight: 700 }
.payp-split p { grid-column: 1 / -1; margin: 0; font-size: 12px; font-weight: 700 }
.payp-ok { color: #1c7a4b } .payp-bad { color: #b3261e }
.adv-split { display: block; font-size: 11px; font-weight: 600; opacity: .7 }

/* Complete bill split-up (admin) */
.bsum { display: grid; gap: 2px; font-size: 14px }
.bsum > div { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0 }
.bsum small { font-size: 10px; letter-spacing: .08em; opacity: .55 }
.bsum-muted { font-size: 11px; letter-spacing: .08em; color: var(--d-mut, #6f6b66); border-top: 1px dashed var(--d-line, #dfdfec); margin-top: 4px }
.bsum-total { border-top: 2px solid var(--d-ink, #121214); border-bottom: 1px solid var(--d-line, #dfdfec); margin: 6px 0 4px; padding: 12px 0 !important; font-weight: 800; font-size: 17px }
.bsum-pay { font-weight: 700; margin-top: 4px }
.bsum-paysub { padding: 2px 0 2px 14px !important; font-size: 13px; color: var(--d-mut, #6f6b66) } .bsum-paysub b { font-weight: 600 }
.bsum-strong { font-weight: 800; color: var(--d-bill, #2d3e76); margin-top: 4px }
.dpos-xrow > td { background: var(--d-bg, #f6f4ef) !important; cursor: default }
.dpos-xsum { max-width: 460px; margin-left: auto; padding: 6px 4px }

.adv-kpis.five { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) }
.adv-kpis.five .adv-k b { font-size: 24px }

/* Smooth scrolling (Lenis) on the website */
html.lenis, html.lenis body { height: auto }
.lenis.lenis-smooth { scroll-behavior: auto !important }
.lenis.lenis-smooth [data-lenis-prevent], .lenis.lenis-smooth [role="dialog"] { overscroll-behavior: contain }
.lenis.lenis-stopped { overflow: clip }

/* Admin page header: title on the left, actions + View Store + profile on the right (no separate Dashboard bar) */
.dpos-head-r { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-left: auto }
.dpos-head-r .dpos-view { white-space: nowrap; padding: 8px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 999px; background: var(--d-card, #fff) }


```

### `pos.css`
```css
/* Dhanya POS (admin only). Every selector is scoped to .dpos; this file is imported only by the lazily loaded POS page,
   so public pages never load it. Print rules apply only while body.dpos-printing is set (during an invoice print). */
.dpos { --ink: #121214; --paper: #f3f1ec; --d-ink: #121214; --d-mut: #6f6b66; --d-line: #dfdfec; --d-bg: #f3f1ec; --d-card: #fff; --d-ok: #1c7a4b; --d-bad: #b3261e;
  min-height: 100vh; padding: 24px clamp(12px, 2.5vw, 32px) 60px; background: var(--d-bg); color: var(--d-ink); font-family: var(--sans); display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 24px; align-items: start }
.dpos *, .dpos *::before, .dpos *::after { box-sizing: border-box }
.dpos h1, .dpos h2, .dpos h3 { font-family: var(--sans); font-weight: 800; letter-spacing: -.01em; margin: 0 }
.dpos h1, .dpos h2, .dpos h3 { text-transform: none }
.dpos h1 { font-size: clamp(26px, 3vw, 34px) } .dpos h2 { font-size: 17px } .dpos h3 { font-size: 15px }
.dpos .sub { color: var(--d-mut); font-size: 14px; margin-top: 2px }
.dpos .muted { color: var(--d-mut) } .dpos .small { font-size: 12px }

/* sidebar */
.dpos-side { position: sticky; top: 24px; background: var(--d-card); border-radius: 22px; padding: 14px; display: grid; gap: 4px; max-height: calc(100vh - 48px); overflow: auto }
.dpos-brand { display: flex; align-items: center; gap: 10px; padding: 8px 10px 14px; border-bottom: 1px solid var(--d-line); margin-bottom: 6px }
.dpos-brand b { font-size: 15px; letter-spacing: .16em; text-transform: uppercase } .dpos-brand i { font-style: normal; font-size: 10px; letter-spacing: .2em; color: var(--d-mut) }
.dpos-grp { font-size: 10px; letter-spacing: .24em; color: #aaa59d; font-weight: 800; padding: 14px 12px 4px }
.dpos-nav { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; font-size: 14px; font-weight: 700; color: #55524d; text-align: left; width: 100%; transition: background .15s }
.dpos-nav:hover { background: #f4f2ee } .dpos-nav.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-nav svg { flex: none }

/* top bar */
.dpos-top { display: flex; align-items: center; gap: 16px; background: var(--d-card); border-radius: 18px; padding: 10px 14px; border: 1px solid var(--d-line) }
.dpos-top-t { font-weight: 800; font-size: 17px; margin-right: auto; padding-left: 6px }
.dpos-view { font-size: 14px; font-weight: 600; color: #55524d } .dpos-view:hover { color: var(--d-ink) }
.dpos-av { width: 38px; height: 38px; border-radius: 50%; background: var(--d-acc, #1c284f); color: #fff; display: grid; place-items: center; font-weight: 800 }

/* existing admin content (products, storefront images, enquiries, sample data, settings) inherits the same look */
.dpos .adm, .dpos .settings-form { display: grid; gap: 16px }
.dpos .adm-help { max-width: none; margin: 0; color: var(--d-mut); font-size: 14px }
.dpos .adm-split > aside, .dpos .adm-split > div, .dpos .adm-slots > *, .dpos .adm-enq li, .dpos .adm-counts li { border-radius: 20px }
.dpos .adm-enq li { background: #fff; border: 1px solid var(--d-line) }
.dpos .adm-counts li { background: #fff; border: 1px solid var(--d-line) } .dpos .adm-counts strong { color: var(--d-ink); font-family: var(--sans); font-weight: 800 }
.dpos .btn { border-radius: 999px; padding: 12px 20px; font-size: 12px; font-weight: 800; letter-spacing: .12em; border: 1px solid var(--d-ink); color: var(--d-ink); background: #fff }
.dpos .btn:hover:not(:disabled) { background: var(--d-acc, #1c284f); color: #fff }
.dpos .btn.solid, .dpos .btn.dark.solid { background: var(--d-acc, #1c284f); color: #fff }
.dpos .field span { font-size: 11px; letter-spacing: .14em; font-weight: 800; color: var(--d-mut); opacity: 1 }
.dpos .field input, .dpos .field textarea, .dpos .field select { border-radius: 14px; border: 1px solid var(--d-line) }
.dpos .tbl { margin: 0 } .dpos .tbl th { font-size: 10px; letter-spacing: .16em; font-weight: 800; color: var(--d-mut); opacity: 1 } .dpos .tbl th, .dpos .tbl td { border-bottom: 1px solid #e5e4f0 }
.dpos .err { background: #fdecea; color: var(--d-bad); padding: 10px 14px; border-radius: 12px }
.dpos .link-u { text-decoration: underline }
.dpos .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px }
.dpos .muted { opacity: 1 }

/* cards, forms */
.dpos-main { display: grid; gap: 18px; min-width: 0 }
.dpos-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap }
.dpos-card { background: var(--d-card); border-radius: 22px; padding: 20px 22px; border: 1px solid var(--d-line) }
.dpos-card > h2 { display: flex; align-items: center; gap: 10px; margin-bottom: 14px }
.dpos label.f { display: grid; gap: 6px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; color: var(--d-mut) }
.dpos input, .dpos select, .dpos textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--d-line); border-radius: 14px; background: #fff; color: var(--d-ink); font: inherit; font-size: 14px; letter-spacing: 0; text-transform: none; font-weight: 500 }
.dpos input:focus, .dpos select:focus { outline: 2px solid var(--d-ink); outline-offset: 1px }
.dpos input[type=checkbox], .dpos input[type=radio] { width: auto }
.dpos-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }
.dpos-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 999px; background: var(--d-acc, #1c284f); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; border: 1px solid var(--d-ink); transition: opacity .15s }
.dpos-btn:hover:not(:disabled) { opacity: .85 } .dpos-btn:disabled { opacity: .4; cursor: not-allowed }
.dpos-btn.ghost { background: #fff; color: var(--d-ink); border-color: var(--d-line) } .dpos-btn.ghost:hover:not(:disabled) { border-color: var(--d-ink); opacity: 1 }
.dpos-btn.danger { background: #fff; color: var(--d-bad); border-color: rgba(179, 38, 30, .4) }
.dpos-btn.big { width: 100%; padding: 17px; font-size: 14px }
.dpos-btn.sm { padding: 7px 13px; font-size: 11px }
.dpos-err { background: #fdecea; color: var(--d-bad); padding: 10px 14px; border-radius: 12px; font-size: 14px }
.dpos-ok { background: #e6f4ec; color: var(--d-ok); padding: 10px 14px; border-radius: 12px; font-size: 14px }
.dpos-empty { padding: 34px 10px; text-align: center; color: var(--d-mut) }
.dpos-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; background: #eee; color: #555 }
.dpos-pill.ok { background: #e6f4ec; color: var(--d-ok) } .dpos-pill.bad { background: #fdecea; color: var(--d-bad) } .dpos-pill.warn { background: #e5e4f1; color: #8a5a00 }

/* tables */
.dpos-tw { overflow-x: auto }
.dpos table { width: 100%; border-collapse: collapse; font-size: 14px }
.dpos th { text-align: left; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--d-mut); font-weight: 800; padding: 12px 10px; border-bottom: 1px solid var(--d-line); white-space: nowrap }
.dpos td { padding: 12px 10px; border-bottom: 1px solid #e5e4f0; vertical-align: middle }
.dpos td.r, .dpos th.r { text-align: right } .dpos tr.click { cursor: pointer } .dpos tr.click:hover td { background: #faf8f4 }
.dpos tr.voided td { opacity: .5; text-decoration: line-through }
.dpos td input, .dpos td select { padding: 8px 10px; border-radius: 10px }

/* billing layout */
.dpos-bill { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); gap: 18px; align-items: start }
.dpos-col { display: grid; gap: 18px; min-width: 0 }
.dpos-sticky { position: sticky; top: 96px }
.dpos-results { display: grid; gap: 8px; margin-top: 12px; max-height: 340px; overflow: auto }
.dpos-res { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--d-line); border-radius: 14px; text-align: left; width: 100%; background: #fff }
.dpos-res:hover:not(:disabled) { border-color: var(--d-ink) } .dpos-res:disabled { opacity: .45; cursor: not-allowed }
.dpos-res img { width: 42px; height: 42px; object-fit: cover; border-radius: 10px; background: #eee; flex: none }
.dpos-res span { display: grid; flex: 1; min-width: 0 } .dpos-res b { font-size: 14px } .dpos-res em { font-style: normal; font-size: 12px; color: var(--d-mut) }
.dpos-line { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; padding: 12px 0; border-bottom: 1px solid #e5e4f0 }
.dpos-line:last-child { border-bottom: 0 }
.dpos-qty { display: inline-flex; align-items: center; border: 1px solid var(--d-line); border-radius: 999px; overflow: hidden }
.dpos-qty button { width: 32px; height: 32px; font-size: 18px; line-height: 1 } .dpos-qty button:hover { background: #f4f2ee }
.dpos-qty input { width: 54px; text-align: center; border: 0; border-radius: 0; padding: 6px 0 }
.dpos-sum { display: grid; gap: 8px; font-size: 14px } .dpos-sum div { display: flex; justify-content: space-between; gap: 12px }
.dpos-sum .tot { font-size: 22px; font-weight: 800; padding-top: 10px; border-top: 1px solid var(--d-line) }
.dpos-seg { display: flex; gap: 6px; flex-wrap: wrap }
.dpos-seg button { padding: 10px 16px; border-radius: 999px; border: 1px solid var(--d-line); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; background: #fff }
.dpos-seg button.on { background: var(--d-acc, #1c284f); color: #fff; border-color: var(--d-ink) }

/* analytics */
.dpos-kpis { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }
.dpos-kpi { background: #fff; border-radius: 20px; padding: 18px 20px; border: 1px solid var(--d-line); display: grid; gap: 8px }
.dpos-kpi span { font-size: 10px; letter-spacing: .2em; font-weight: 800; color: var(--d-mut); text-transform: uppercase } .dpos-kpi b { font-size: 30px; line-height: 1 }
.dpos-bars { display: flex; align-items: flex-end; gap: 6px; height: 150px; padding-top: 8px; overflow-x: auto }
.dpos-bar { flex: 1 0 22px; max-width: 54px; display: grid; align-items: end; height: 100%; text-align: center; font-size: 10px; color: var(--d-mut) }
.dpos-bar i { display: block; background: var(--d-acc, #1c284f); border-radius: 6px 6px 0 0; min-height: 3px }

/* invoice modal */
.dpos-modal { position: fixed; inset: 0; z-index: 400; background: rgba(10, 10, 12, .55); display: grid; place-items: start center; padding: 24px 12px; overflow: auto }
.dpos-sheet { background: #fff; border-radius: 20px; width: min(560px, 100%); padding: 22px }
.dpos-invoice { font-size: 13px; color: #111; display: grid; gap: 10px }
.dpos-invoice h2 { font-size: 20px; text-align: center; letter-spacing: .12em; text-transform: uppercase }
.dpos-invoice .c { text-align: center; color: #555; font-size: 12px }
.dpos-invoice table th, .dpos-invoice table td { padding: 6px 4px; font-size: 12px }
.dpos-invoice hr { border: 0; border-top: 1px dashed #bbb; width: 100% }
.dpos-void-stamp { text-align: center; font-weight: 800; color: var(--d-bad); letter-spacing: .3em; border: 2px solid var(--d-bad); padding: 6px; border-radius: 8px }

@media (max-width: 1099px) { .dpos-bill { grid-template-columns: 1fr } .dpos-sticky { position: static } }
@media (max-width: 899px) {
  .dpos { grid-template-columns: 1fr; padding-top: 14px }
  .dpos-side { position: static; max-height: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px } .dpos-brand, .dpos-grp { width: 100%; padding: 6px 8px }
  .dpos-nav { width: auto; padding: 9px 12px; font-size: 13px }
}

@media print {
  body.dpos-printing * { visibility: hidden !important }
  body.dpos-printing .dpos-invoice, body.dpos-printing .dpos-invoice * { visibility: visible !important }
  body.dpos-printing .dpos-invoice { position: absolute; left: 0; top: 0; width: 80mm; max-width: 100%; padding: 4mm; margin: 0 }
}

```

### `pos2.css`
```css
/* Dhanya POS / admin extras (filters, analytics cards, inventory, taxonomy, reels). Admin only, scoped to .dpos, loaded with the admin shell. */

/* ---- period / chip filters ---- */
.dpos-pf { display: flex; gap: 10px; flex-wrap: wrap; align-items: center }
.dpos-pg { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 5px 6px; box-shadow: 0 2px 10px rgba(0, 0, 0, .04) }
.dpos-pg .lab { font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 0 8px 0 10px; color: var(--d-ink) }
.dpos-pg button { padding: 8px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--d-ink) }
.dpos-pg button:hover { background: #f4f2ee } .dpos-pg button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-pg.dates { padding: 5px 12px; gap: 12px } .dpos-pg.dates label { display: inline-flex; align-items: center; gap: 4px }
.dpos-pg.dates input { border: 0; padding: 6px 2px; width: auto; font-weight: 700; background: transparent; border-radius: 0 }
.dpos-bar-tools { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between }

/* ---- switches, toggles ---- */
.dpos-switch { position: relative; width: 50px; height: 28px; border-radius: 999px; background: #d9d6d0; flex: none; transition: background .15s }
.dpos-switch::after { content: ''; position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .3); transition: transform .15s }
.dpos-switch.on { background: #12a36b } .dpos-switch.on::after { transform: translateX(22px) }
.dpos-two { display: grid; grid-template-columns: 1fr 1fr; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 4px; gap: 4px }
.dpos-two button { padding: 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase } .dpos-two button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-src { display: inline-flex; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 4px; gap: 2px; justify-self: end }
.dpos-src button { padding: 8px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 8px } .dpos-src button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-src i { width: 8px; height: 8px; border-radius: 50%; background: #12a36b; display: inline-block }

/* ---- analytics cards / charts ---- */
.dpos-tabs { display: flex; gap: 22px; border-bottom: 1px solid var(--d-line); flex-wrap: wrap }
.dpos-tabs button { padding: 12px 2px; font-size: 14px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #77736d; border-bottom: 3px solid transparent; margin-bottom: -1px } .dpos-tabs button.on { color: var(--d-ink); border-color: var(--d-ink) }
.dpos-k4 { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)) }
.dpos-card2 { background: #fff; border: 1px solid var(--d-line); border-radius: 22px; padding: 18px 20px; display: grid; gap: 14px; align-content: space-between; min-height: 130px }
.dpos-card2 .t { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase }
.dpos-card2 .ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #efecf3; flex: none }
.dpos-card2 .v { font-size: 30px; font-weight: 800; line-height: 1.1; letter-spacing: -.01em; overflow-wrap: anywhere } .dpos-card2 .v.txt { font-size: 20px }
.dpos-card2 .s { font-size: 12px; color: var(--d-mut) }
.dpos-card2.net { background: linear-gradient(135deg, #0a9a68, #0d1f1a); color: #fff; border: 0 } .dpos-card2.net .ic { background: rgba(255, 255, 255, .18) } .dpos-card2.net .s { color: rgba(255, 255, 255, .85) }
.dpos-card2.gstc { border-color: #d9d4e8 } .dpos-card2.nong { border-color: #bfe8d8 } .dpos-card2.nong .v { color: #0a8a5c } .dpos-card2.exp { border-color: #efc3b3 } .dpos-card2.exp .v { color: #b3261e }
.dpos-formula { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: space-between; background: #fff; border: 1px solid var(--d-line); border-radius: 16px; padding: 12px 16px; font-size: 14px }
.dpos-formula b.tag { background: #e8e6fb; color: #3453b8; border-radius: 8px; padding: 4px 10px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase }
.dpos-formula .np { color: #0a8a5c; font-weight: 800; font-family: ui-monospace, monospace }
.dpos-split { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(280px, 1fr); gap: 18px; align-items: start } @media (max-width: 1099px) { .dpos-split { grid-template-columns: 1fr } }
.dpos-ch { display: flex; align-items: flex-end; gap: 6px; height: 190px; padding-top: 22px }
.dpos-ch .c { flex: 1; min-width: 0; display: grid; grid-template-rows: 1fr auto; height: 100%; text-align: center; font-size: 11px; font-weight: 800; color: #444; gap: 8px; position: relative }
.dpos-ch .c .col { display: flex; align-items: flex-end; justify-content: center; position: relative }
.dpos-ch .c .col i { display: block; width: min(30px, 70%); border-radius: 8px 8px 3px 3px; background: var(--d-acc, #1c284f); min-height: 4px }
.dpos-ch .c .col em { position: absolute; top: -18px; font-style: normal; font-size: 10px; white-space: nowrap }
.dpos-ch.cap .c .col { background: #f3f3f5; border-radius: 999px; width: 26px; margin: 0 auto } .dpos-ch.cap .c .col i { width: 100%; border-radius: 999px }
.dpos-bars2 { display: grid; gap: 14px }
.dpos-b2 { display: grid; grid-template-columns: 74px 1fr 40px; gap: 12px; align-items: center; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase } .dpos-b2 .tr { height: 12px; border-radius: 99px; background: #eef0f3; overflow: hidden } .dpos-b2 .tr i { display: block; height: 100%; border-radius: 99px; background: var(--d-acc, #1c284f) } .dpos-b2 .n { text-align: right }
.dpos-rank { display: grid; gap: 16px } .dpos-rk { display: grid; grid-template-columns: 22px 1fr auto; gap: 12px; align-items: center } .dpos-rk .tr { height: 8px; border-radius: 99px; background: #eef0f3; margin-top: 6px; overflow: hidden } .dpos-rk .tr i { display: block; height: 100%; background: var(--d-acc, #1c284f); border-radius: 99px }

/* ---- modal extras ---- */
.dpos-sheet.wide { width: min(640px, 100%) } .dpos-sheet h2.mh { margin-bottom: 14px }
.dpos-mhead { background: var(--d-acc, #1c284f); color: #fff; margin: -22px -22px 18px; padding: 18px 22px; border-radius: 20px 20px 0 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px } .dpos-mhead small { opacity: .7; display: block; font-size: 12px; margin-top: 2px }
.dpos-mhead button { color: #fff; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 255, 255, .15); font-size: 16px }
.dpos-box { background: #f6f4f0; border: 1px solid var(--d-line); border-radius: 16px; padding: 14px 16px }
.dpos-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px }
.dpos-types button { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border-radius: 16px; border: 1px solid var(--d-line); background: #fff; font-size: 13px; font-weight: 800 } .dpos-types button small { font-size: 10px; font-weight: 800; letter-spacing: .06em } .dpos-types button.on { background: #f1efe9; border-color: var(--d-ink); box-shadow: inset 0 0 0 1px var(--d-ink) }
.dpos-stepper { display: grid; grid-template-columns: 48px 1fr 48px; gap: 8px } .dpos-stepper button { border: 1px solid var(--d-line); border-radius: 14px; background: #fff; font-size: 20px; font-weight: 800 } .dpos-stepper input { text-align: center; font-size: 20px; font-weight: 800 }
.dpos-quick { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 10px; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: var(--d-mut) } .dpos-quick button { background: #fff; border: 1px solid var(--d-line); border-radius: 10px; padding: 6px 12px; color: var(--d-ink); font-size: 12px }

/* ---- inventory rows ---- */
.dpos-prod { border-bottom: 1px solid #e5e4f0 } .dpos-prod:last-child { border-bottom: 0 }
.dpos-prow { display: grid; grid-template-columns: 36px minmax(160px, 2.2fr) 110px 90px 110px auto; gap: 10px; align-items: center; padding: 12px 6px }
.dpos-prow .chev { width: 32px; height: 32px; border-radius: 10px; background: #f1efe9; display: grid; place-items: center; transition: transform .15s } .dpos-prow .chev.open { transform: rotate(180deg); background: var(--d-acc, #1c284f); color: #fff }
.dpos-prow .nm b { display: block } .dpos-prow .nm small { color: var(--d-mut); font-size: 11px; font-weight: 700 }
.dpos-acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end }
.dpos-detail { margin: 0 6px 14px 48px; background: #fff; border: 1px solid var(--d-line); border-radius: 18px; padding: 16px; box-shadow: 0 4px 18px rgba(0, 0, 0, .05); display: grid; gap: 12px }
.dpos-ph { display: grid; grid-template-columns: 36px minmax(160px, 2.2fr) 110px 90px 110px auto; gap: 10px; padding: 8px 6px; font-size: 10px; letter-spacing: .16em; font-weight: 800; text-transform: uppercase; color: var(--d-mut) }
@media (max-width: 899px) { .dpos-prow { grid-template-columns: 36px 1fr auto } .dpos-prow > :nth-child(3), .dpos-prow > :nth-child(4) { display: none } .dpos-prow .dpos-acts { grid-column: 1 / -1 } .dpos-detail { margin-left: 6px } .dpos-ph { display: none } }

/* ---- taxonomy / reels / logo ---- */
.dpos-tx { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start } @media (max-width: 999px) { .dpos-tx { grid-template-columns: 1fr } }
.dpos-tx h2 { display: flex; align-items: center; gap: 10px; margin-bottom: 14px }
.dpos-txc { display: flex; align-items: center; gap: 14px; justify-content: space-between; background: #fff; border-radius: 22px; padding: 18px 22px; margin-bottom: 14px; border: 1px solid var(--d-line) } .dpos-txc b { font-size: 18px; display: block } .dpos-txc small { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--d-mut) }
.dpos-trash { color: #d4351c; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px } .dpos-trash:hover { background: #fdecea }
.dpos-reels { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px }
.dpos-reel { background: #fff; border-radius: 22px; overflow: hidden; border: 1px solid var(--d-line); display: grid }
.dpos-reel header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 11px; font-weight: 800; letter-spacing: .14em; color: var(--d-mut) }
.dpos-reel .media { aspect-ratio: 9 / 16; background: #ecebe7; display: grid; place-items: center; color: var(--d-mut); font-size: 13px; text-align: center; padding: 10px; overflow: hidden } .dpos-reel .media video, .dpos-reel .media img { width: 100%; height: 100%; object-fit: cover; margin: -10px }
.dpos-reel footer { display: flex; gap: 8px; justify-content: flex-end; align-items: center; padding: 12px 16px; flex-wrap: wrap }
.dpos-live { color: #0a8a5c; background: #e6f4ec; border-radius: 99px; padding: 3px 10px; letter-spacing: .08em }
.dpos-logo-prev { width: 110px; height: 110px; border-radius: 50%; background: #f1efe9; border: 1px solid var(--d-line); display: grid; place-items: center; color: var(--d-mut); font-size: 11px; text-align: center; overflow: hidden } .dpos-logo-prev img { width: 100%; height: 100%; object-fit: cover }
.dpos-inv-logo { display: block; margin: 0 auto 6px; width: 56px; height: 56px; border-radius: 50%; object-fit: cover }

/* the "sample" pill sits under the product name instead of being squeezed into the 52px photo column */
.dpos .adm-list button .adm-sample { grid-column: 2 / -1; justify-self: start; white-space: nowrap }

```

### `pos3.css`
```css
/* Dhanya POS — billing panel layout, order history, advance orders, "bill generated", coupons panel, and the phone layouts for all of them.
   Admin only; scoped to .dpos. Loaded with the admin shell after pos.css / pos2.css. */
.dpos { --d-acc: #1c284f }

/* brand accent (the logo's deep plum) for primary actions and active states */
.dpos-btn { background: var(--d-acc); border-color: var(--d-acc) }
.dpos-btn.ghost { background: #fff; color: var(--d-ink); border-color: var(--d-line) } .dpos-btn.danger { background: #fff; color: var(--d-bad); border-color: rgba(179, 38, 30, .4) }
.dpos-btn.outline { background: #fff; color: var(--d-acc); border: 1.5px solid #bab9cd } .dpos-btn.outline:hover:not(:disabled) { border-color: var(--d-acc); opacity: 1 }
.dpos-btn.wa { background: #12a66a; border-color: #12a66a; color: #fff; text-decoration: none }
.dpos-nav.on, .dpos-two button.on, .dpos-seg button.on, .dpos-pg button.on, .dpos-types button.on { background: var(--d-acc); border-color: var(--d-acc); color: #fff }
.dpos-types button.on { background: #f6edf6; color: var(--d-ink); box-shadow: inset 0 0 0 1px var(--d-acc) }
.dpos-tabs button.on { border-color: var(--d-acc); color: var(--d-acc) }
.dpos .acc { color: var(--d-acc) }

/* ---- billing: the order summary column ---- */
.dpos-ledger { display: grid; gap: 4px; margin-bottom: 14px; font-size: 15px }
.dpos-lrow { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 7px 0 }
.dpos-lrow input, .dpos-lrow select { width: 120px; text-align: right; padding: 9px 12px } .dpos-lrow select { width: 190px; text-align: left }
.dpos-excl { font-size: 10px; font-weight: 800; letter-spacing: .06em; color: var(--d-acc); margin-left: 4px }
.dpos-gstrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 14px 2px 4px }
.dpos-gstrow small { font-size: 10px; font-weight: 800; color: var(--d-acc); letter-spacing: .06em }
.dpos-pct { display: inline-flex; align-items: center; gap: 8px; font-weight: 700 } .dpos-pct input { width: 74px; text-align: center; padding: 9px 8px }
.dpos-flabel { margin: 18px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: .12em }
.dpos-pills { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 8px }
.dpos-pills button { padding: 12px 8px; border-radius: 12px; border: 1px solid var(--d-line); background: #fff; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; transition: background .15s }
.dpos-pills button.on { background: var(--d-acc); border-color: var(--d-acc); color: #fff } .dpos-pills button:hover:not(.on) { border-color: #b7b6c2 }
.dpos-hr { border: 0; border-top: 1px solid var(--d-line); margin: 18px 0 }
.dpos-grand { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px } .dpos-grand span { font-size: 17px; font-weight: 800; letter-spacing: .02em } .dpos-grand b { font-size: 34px; font-weight: 800; color: var(--d-acc); line-height: 1 }
.dpos-paybox { border: 1px solid var(--d-line); border-radius: 18px; padding: 16px 18px }
.dpos-pl { margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: .12em }
.dpos-paybox label.f { text-transform: none; letter-spacing: 0; font-size: 13px; color: var(--d-ink); font-weight: 700 }
.dpos input.bigin { font-size: 20px; font-weight: 800; padding: 16px }
.dpos-cta { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 17px; border-radius: 14px; background: var(--d-acc); color: #fff; border: 2px solid var(--d-acc); font-size: 14px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; box-shadow: 0 14px 26px -12px rgba(28, 40, 79, .7); margin-top: 12px; transition: transform .15s, opacity .15s }
.dpos-cta:hover:not(:disabled) { transform: translateY(-1px) } .dpos-cta:disabled { opacity: .45; cursor: not-allowed; box-shadow: none }
.dpos-cta.amber { background: #fff; color: #b45309; border-color: #f59e0b; box-shadow: none }
.dpos-mbar { display: none }

/* ---- order history ---- */
.dpos-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px }
.dpos-ordcard { padding-top: 6px }
.dpos-ord th { font-size: 11px; padding: 16px 10px } .dpos-ord td { padding: 18px 10px }
.dpos-ord .oid, .oid { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; font-weight: 600 }
.dpos-ord .due, .due { font-weight: 800; color: var(--d-acc); font-size: 16px; white-space: nowrap }
.dpos-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; border: 1px solid #c9c4cf; background: #fff; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; margin: 1px 0 }
.dpos-tag.solid { background: #efedf1; border-color: #d9d5de }
.dpos-rowact { display: inline-flex; align-items: center; gap: 8px; justify-content: flex-end; flex-wrap: wrap }
.dpos-rowact .ra { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; border: 0; cursor: pointer; transition: transform .12s; text-decoration: none }
.dpos-rowact .ra:hover:not(:disabled) { transform: translateY(-1px) } .dpos-rowact .ra:disabled { opacity: .35; cursor: not-allowed }
.ra.wa { background: #e3f6ec; color: #138a4d } .ra.doc { background: #fbe9e9; color: #b3261e } .ra.eye { background: #efedf1; color: #26212a } .ra.del { background: #fbe9e9; color: #b3261e }
.dpos-ord tr.voided td { opacity: .55; text-decoration: none }

/* ---- bill generated ---- */
.dpos-done { width: min(720px, 100%); padding: 24px }
.dpos-done-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--d-line); margin-bottom: 18px }
.dpos-done-head h2 { font-size: 26px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap } .dpos-done-head .oid { margin: 6px 0 0; color: var(--d-acc); font-size: 12px }
.dpos-done-card { border: 1px solid var(--d-line); border-radius: 18px; padding: 18px 20px; margin-bottom: 16px }
.dpos-done-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #e5e4f0; margin-bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: .14em; color: var(--d-mut) }
.dpos-done-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 15px } .dpos-done-row .big { font-size: 26px }
.dpos-done-bal { display: flex; justify-content: space-between; align-items: center; background: #f4f2f6; border: 1px solid var(--d-line); border-radius: 14px; padding: 18px 20px; margin-top: 6px; font-weight: 800; color: var(--d-acc) } .dpos-done-bal b { font-size: 24px }
.dpos-done-act { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px } .dpos-done-act .dpos-btn { border-radius: 12px; padding: 15px 10px; font-size: 11.5px }
.dpos-done-act .dpos-btn:last-child { grid-column: 1; }
.dpos-done-card.items { margin-bottom: 0 } .dpos-done-l { margin: 0 0 10px; font-size: 11px; font-weight: 800; letter-spacing: .14em; color: var(--d-mut); padding-bottom: 10px; border-bottom: 1px solid #e5e4f0 }
.dpos-done-item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; font-size: 14px }

/* ---- analytics -> coupons ---- */
.dpos-cp { display: grid; grid-template-columns: minmax(280px, 1fr) 2fr; gap: 18px; align-items: start }
.dpos-cp-stats { display: grid; gap: 14px } .dpos-cp-s { border: 1px solid var(--d-line); border-radius: 16px; padding: 16px 18px; display: grid; gap: 8px }
.dpos-cp-s span { font-size: 11px; font-weight: 800; letter-spacing: .08em; display: flex; justify-content: space-between; align-items: center } .dpos-cp-s span i { font-style: normal; color: var(--d-acc); font-size: 16px }
.dpos-cp-s b { font-size: 28px; line-height: 1 }
.dpos-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--d-line); border-radius: 12px; padding: 0 12px; min-width: 240px; max-width: 100%; flex: 1 1 240px; background: #fff } .dpos-search input { border: 0; padding: 11px 4px; outline: none }
.dpos-search:focus-within { border-color: var(--d-acc) } .dpos-empty.dark { color: var(--d-ink); padding: 60px 10px; font-size: 15px }

/* ---- phones and small tablets ---- */
@media (max-width: 1099px) { .dpos-cp { grid-template-columns: 1fr } }
@media (max-width: 899px) {
  /* the section menu becomes one scrollable row instead of a tall wrapped block */
  .dpos-side { flex-wrap: nowrap !important; overflow-x: auto; overflow-y: hidden; padding: 8px !important; gap: 6px !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; border-radius: 16px }
  .dpos-side::-webkit-scrollbar { display: none }
  .dpos-brand, .dpos-grp { display: none !important }
  .dpos-side > div { display: contents }
  .dpos-nav { flex: none; white-space: nowrap; padding: 10px 14px !important }
  .dpos { padding-bottom: 96px; gap: 14px }
  .dpos h1 { font-size: 24px }
  .dpos-top { padding: 8px 10px } .dpos-top-t { font-size: 15px }
  .dpos-card { padding: 16px }
  .dpos-grid { grid-template-columns: 1fr !important }
  .dpos-bar-tools { align-items: stretch } .dpos-bar-tools > * { max-width: 100% }
  .dpos-pf { width: 100% } .dpos-pg { border-radius: 16px; width: 100% } .dpos-pg button { padding: 8px 11px; font-size: 11px }
  .dpos-pg.dates { flex-wrap: wrap; gap: 6px 14px }
  .dpos-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) } .dpos-kpi b { font-size: 22px }
  .dpos-k4 { grid-template-columns: repeat(2, minmax(0, 1fr)) } .dpos-card2 .v { font-size: 22px } .dpos-card2 .v.txt { font-size: 16px }
  .dpos-line { grid-template-columns: 1fr } .dpos-line > div:last-child { justify-self: start }
  .dpos-grand b { font-size: 30px }
  .dpos-lrow select { width: 150px }
  /* order history rows become cards */
  .dpos-ord, .dpos-ord tbody { display: block } .dpos-ord thead { display: none }
  .dpos-ord tr { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "oid due" "name due" "date src" "phone src" "act act"; gap: 3px 12px; padding: 14px 2px; border-bottom: 1px solid #e3e2ef }
  .dpos-ord td { border: 0 !important; padding: 0 !important; background: none !important }
  .dpos-ord td:nth-child(1) { grid-area: oid } .dpos-ord td:nth-child(2) { grid-area: date } .dpos-ord td:nth-child(3) { grid-area: name } .dpos-ord td:nth-child(4) { grid-area: phone }
  .dpos-ord td:nth-child(5) { grid-area: src; text-align: right } .dpos-ord td:nth-child(6) { grid-area: due; text-align: right; font-size: 20px } .dpos-ord td:nth-child(7) { grid-area: act; text-align: left }
  .dpos-rowact { justify-content: flex-start; margin-top: 8px }
  /* windows fit the screen */
  .dpos-modal { padding: 10px; place-items: start center } .dpos-sheet, .dpos-sheet.wide, .dpos-done { width: 100% !important; padding: 18px; border-radius: 18px }
  .dpos-mhead { margin: -18px -18px 16px; padding: 16px 18px }
  .dpos-done-act { grid-template-columns: 1fr 1fr } .dpos-done-act .dpos-btn:last-child { grid-column: 1 / -1 }
  .dpos-done-head h2 { font-size: 22px } .dpos-done-row .big { font-size: 22px }
  .dpos-types { grid-template-columns: repeat(2, 1fr) }
  /* a bar that stays on screen while billing: total + jump to payment */
  .dpos-mbar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid var(--d-line); box-shadow: 0 -10px 30px rgba(0, 0, 0, .08) }
  .dpos-mbar span { font-size: 12px; color: var(--d-mut); line-height: 1.2 } .dpos-mbar b { display: block; font-size: 20px; color: var(--d-acc); line-height: 1.1 }
  .dpos-mbar .dpos-cta { width: auto; margin: 0; padding: 13px 20px; font-size: 12px; box-shadow: none }
}
@media (max-width: 480px) {
  .dpos-sheet.wide table, .dpos-card table { font-size: 13px }
  .dpos-pills { grid-template-columns: repeat(2, 1fr) }
  .inv-ps-row { grid-template-columns: 1fr 1fr } .inv-ps-foot { gap: 14px }
}
.adm-alt { width: 100%; padding: 7px 10px; border: 1px solid #e3e1e6; border-radius: 10px; font: inherit; font-size: 12px }

/* ---- Coupon management ---- */
.cp { max-width: 1280px; margin: 0 auto }
.cp-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap } .cp-top h2 { margin: 0; font-size: clamp(28px, 3vw, 40px); font-weight: 800 }
.cp-top-a { display: flex; gap: 10px; flex-wrap: wrap } .cp-ref { text-decoration: none; color: inherit }
.cp-note { display: flex; gap: 10px; align-items: center; padding: 14px 18px; border-radius: 14px; background: #eaf4fd; border: 1px solid #cfe4f7; color: #0d5a99; font-weight: 600; font-size: 14px }
.cp-two { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 22px; align-items: start } @media (max-width: 1000px) { .cp-two { grid-template-columns: 1fr } }
.cp-card { padding: clamp(20px, 2.4vw, 32px); border-radius: 26px; background: #fff; border: 1px solid rgba(0, 0, 0, .08); display: grid; gap: 14px; align-content: start }
.cp-card h3 { margin: 0; font-size: 22px; display: flex; align-items: center; gap: 10px } .cp-plus { font-size: 26px; font-weight: 400 }
.cp-l { display: grid; gap: 8px; font: 800 12px var(--d-sans, inherit); letter-spacing: .14em; color: #2a2723 } .cp-l em { color: var(--d-acc, #1c284f); font-style: normal }
.cp-l input, .cp-code input { padding: 15px 18px; border-radius: 14px; border: 0; background: color-mix(in srgb, var(--d-acc, #1c284f) 7%, #fff); font: 500 16px inherit; width: 100% }
.cp-code { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 14px; background: color-mix(in srgb, var(--d-acc, #1c284f) 7%, #fff) } .cp-code input { background: transparent; padding: 10px 12px }
.cp-code button { padding: 11px 20px; border-radius: 10px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 }
.cp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px } @media (max-width: 560px) { .cp-g2 { grid-template-columns: 1fr } }
.cp-type { display: inline-flex; gap: 6px; padding: 4px; border-radius: 12px; background: color-mix(in srgb, var(--d-acc, #1c284f) 7%, #fff); justify-self: start } .cp-type button { padding: 8px 16px; border-radius: 9px; font-weight: 800; font-size: 13px } .cp-type button.on { background: var(--d-acc, #1c284f); color: #fff }
.cp-aud { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 8px } @media (max-width: 700px) { .cp-aud { grid-template-columns: 1fr } }
.cp-aud button { text-align: left; padding: 16px 16px; border-radius: 14px; background: #fff; border: 1px solid rgba(0, 0, 0, .12); display: grid; gap: 4px; align-content: start } .cp-aud b { font-size: 16px } .cp-aud small { color: #6d6a64; font-size: 13px; line-height: 1.35 }
.cp-aud button.on { background: color-mix(in srgb, var(--d-acc, #1c284f) 8%, #fff); border-color: var(--d-acc, #1c284f); box-shadow: 0 0 0 2px rgba(28, 40, 79, .25) }
.cp-sw { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 14px; background: color-mix(in srgb, var(--d-acc, #1c284f) 6%, #fff) } .cp-sw b { display: block } .cp-sw small { display: block; color: #6d6a64; margin-top: 3px }
.cp-go { padding: 18px; border-radius: 14px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800; font-size: 16px; box-shadow: 0 14px 26px -14px rgba(28, 40, 79, .45) } .cp-go:disabled { opacity: .6 }
.cp-lh { display: flex; align-items: center; justify-content: space-between } .cp-n { display: inline-grid; place-items: center; min-width: 28px; height: 28px; border-radius: 999px; background: var(--d-acc, #1c284f); color: #fff; font-size: 14px; padding: 0 8px }
.cp-filters { display: flex; flex-wrap: wrap; gap: 8px } .cp-filters button { padding: 9px 16px; border-radius: 999px; background: #fff; border: 1px solid rgba(0, 0, 0, .12); font-weight: 700; font-size: 14px } .cp-filters small { opacity: .6; margin-left: 2px } .cp-filters button.on { background: var(--d-acc, #1c284f); color: #fff; border-color: var(--d-acc, #1c284f) }
.cp-search { display: flex; align-items: center; gap: 10px; padding: 0 16px; border-radius: 14px; background: color-mix(in srgb, var(--d-acc, #1c284f) 7%, #fff) } .cp-search input { flex: 1; border: 0; background: transparent; padding: 15px 0; font: 500 16px inherit; outline: 0 }
.cp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px } .cp-list li { padding: 20px; border-radius: 18px; background: #fff; border: 1px solid rgba(0, 0, 0, .08); display: grid; gap: 6px } .cp-list li.off { opacity: .7 }
.cp-r1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap } .cp-mono { font-family: ui-monospace, 'SF Mono', Consolas, monospace; letter-spacing: .04em } .cp-c { font-size: 20px }
.cp-st { padding: 4px 10px; border-radius: 6px; background: #eee; color: #666; font: 800 11px var(--d-sans, inherit); letter-spacing: .08em } .cp-st.on { background: #e3f4e8; color: #1f7a45 } .cp-st.only { background: #fdf0d8; color: #8a5a0a }
.cp-d { margin: 0; font-size: 22px; font-weight: 800; color: var(--d-acc, #1c284f) } .cp-d small { font-size: 15px; font-weight: 600; color: #4a4742 } .cp-u { margin: 0; color: #6d6a64; font-size: 14px }
.cp-act { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; align-items: center }
.cp-b { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font: 800 14px var(--d-sans, inherit); letter-spacing: .03em } .cp-b.outline { border: 1px solid #1fa463; color: #12834c; background: #fff } .cp-b.wa { background: #22c55e; color: #fff } .cp-b.dark { background: var(--d-acc, #1c284f); color: #fff } .cp-b.light { background: #eee; color: #444 }
.cp-i { width: 44px; height: 44px; border-radius: 10px; border: 1px solid rgba(0, 0, 0, .14); background: #fff; display: grid; place-items: center }
.cp-send { display: grid; gap: 14px } .cp-help { margin: 0; color: #5d5a54; line-height: 1.5 }
.cp-warn { margin: 0; padding: 14px 16px; border-radius: 12px; background: color-mix(in srgb, var(--d-acc, #1c284f) 8%, #fff); border: 1px solid #f1dd9c; color: #8a4a10; font-size: 14px; line-height: 1.45 }
.cp-send-act { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr; gap: 10px } @media (max-width: 560px) { .cp-send-act { grid-template-columns: 1fr } }
.cp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 12px; border: 1px solid rgba(0, 0, 0, .15); background: #fff; font-weight: 800; text-align: center } .cp-btn.wa { background: #22c55e; color: #fff; border-color: #22c55e } .cp-btn.pdf { color: #12834c; border-color: #1fa463 } .cp-btn.solid { background: var(--d-acc, #1c284f); color: #fff } .cp-btn:disabled { opacity: .5 }
.cp-rec { list-style: none; margin: 0; padding: 0; border: 1px solid rgba(0, 0, 0, .1); border-radius: 14px; overflow: hidden } .cp-rec li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid rgba(0, 0, 0, .08) } .cp-rec li:last-child { border: 0 } .cp-rec b { display: block; font-size: 17px } .cp-rec small { color: #6d6a64 }
.cp-send-b { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; background: #22c55e; color: #fff; font-weight: 800 } .cp-send-b.again { background: #e3f4e8; color: #1f7a45; border: 1px solid #b6e1c3 }
.cp-rec-foot { display: flex; justify-content: flex-end; margin-top: 14px }


/* Billing: indicator when a piece is added */
.dpos-flash { animation: dposFlash 1.6s ease-out } @keyframes dposFlash { 0% { background: #d9f7e4; box-shadow: 0 0 0 3px rgba(34, 197, 94, .55) } 100% { background: transparent; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0) } }
.dpos-count { display: inline-grid; place-items: center; min-width: 26px; height: 26px; margin-left: 10px; padding: 0 8px; border-radius: 999px; background: #22c55e; color: #fff; font: 800 13px var(--d-sans, inherit) } .dpos-count.pop { animation: dposPop .5s ease }
@keyframes dposPop { 0% { transform: scale(1) } 40% { transform: scale(1.35) } 100% { transform: scale(1) } }
@media (prefers-reduced-motion: reduce) { .dpos-flash, .dpos-count.pop { animation: none } }

/* ---- Inventory: header, banner, filters, card grid, stock alert, edit product ---- */
.inv-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap } .inv-head h2 { margin: 0; font-size: clamp(28px, 3vw, 40px); font-weight: 800 } .inv-head p { margin: 4px 0 0; color: #6d6a64; font-size: 16px }
.inv-head-a { display: flex; gap: 12px; align-items: center }
.inv-alerts { position: relative; padding: 14px 22px; border-radius: 14px; background: #fffaf0; border: 1px solid #f1dd9c; color: #b4530a; font-weight: 800 } .inv-alerts b { position: absolute; top: -10px; right: -8px; min-width: 26px; height: 26px; padding: 0 6px; border-radius: 999px; background: #ef4444; color: #fff; display: grid; place-items: center; font-size: 13px }
.inv-add { display: inline-flex; align-items: center; gap: 8px; padding: 15px 24px; border-radius: 14px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 }
.inv-banner { padding: 16px 22px; border-radius: 14px; background: #fff8e0; border: 1px solid #f1e0a0; color: #8a5a0a; font-size: 17px }
.inv-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 18px 20px; border-radius: 22px; background: #fff; border: 1px solid rgba(0, 0, 0, .06) }
.inv-chips { display: flex; flex-wrap: wrap; gap: 8px } .inv-chips button { padding: 11px 18px; border-radius: 999px; background: #f1efe9; font-weight: 800; font-size: 14px } .inv-chips button.hl { background: #fff4e6; color: #b4530a; border: 1px solid #f5c98c } .inv-chips button.on { background: var(--d-acc, #1c284f); color: #fff; border-color: var(--d-acc, #1c284f) }
.inv-filters select { padding: 11px 14px; border-radius: 12px; border: 1px solid rgba(0, 0, 0, .14); background: #fff; font-weight: 600 }
.inv-search { margin-left: auto; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-radius: 14px; border: 1px solid rgba(0, 0, 0, .1); background: #faf9f6; min-width: 260px } .inv-search input { border: 0; background: transparent; padding: 14px 0; flex: 1; outline: 0; font: inherit }
.inv-view { display: inline-flex; padding: 3px; border-radius: 10px; background: #f1efe9 } .inv-view button { padding: 8px 14px; border-radius: 8px; font-weight: 800; font-size: 13px } .inv-view button.on { background: var(--d-acc, #1c284f); color: #fff }
.inv-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px }
.inv-card { border-radius: 22px; overflow: hidden; background: #fff; border: 1px solid rgba(0, 0, 0, .06); display: grid; grid-template-rows: auto 1fr } .inv-card.low { background: #fffbec; border-color: #f4c95d } .inv-card.out { background: #fff6f6; border-color: #f3b8b8 }
.inv-photo { position: relative; aspect-ratio: 3 / 4.2; background: #e8e6e0; overflow: hidden } .inv-photo img { width: 100%; height: 100%; object-fit: cover; display: block } .inv-photo > span:first-child { display: grid; place-items: center; height: 100%; color: #8a867f }
.inv-badge { position: absolute; top: 12px; left: 12px; padding: 5px 10px; border-radius: 8px; font: 800 11px var(--d-sans, inherit); letter-spacing: .04em; color: #fff } .inv-badge.in { background: #10b981 } .inv-badge.low { background: #f59e0b } .inv-badge.out { background: #ef4444 }
.inv-ic { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px } .inv-ic button { width: 40px; height: 40px; border-radius: 12px; background: rgba(255, 255, 255, .92); display: grid; place-items: center } .inv-ic .del { color: #dc2626 }
.inv-body { padding: 16px 18px 18px; display: grid; gap: 4px; align-content: start } .inv-nm { display: flex; justify-content: space-between; gap: 10px } .inv-nm b { font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .inv-nm strong { font-size: 17px } .inv-body > small { color: #6d6a64; font-size: 15px }
.inv-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; color: #6d6a64; font-size: 13px } .inv-units { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(0, 0, 0, .1); background: #fff; font-size: 16px; font-weight: 800; text-align: left; line-height: 1.25 } .inv-units b { display: inline }
.inv-alert { width: min(640px, calc(100% - 24px)); padding: 30px 34px; border-radius: 30px; background: #fff; display: grid; gap: 18px }
.inv-alert-h { display: flex; align-items: center; gap: 16px } .inv-alert-h h2 { margin: 0; font-size: 26px } .inv-alert-h p { margin: 2px 0 0; color: #6d6a64 } .inv-alert-i { width: 56px; height: 56px; border-radius: 50%; background: #fff2cc; color: #d97706; display: grid; place-items: center; font-size: 26px }
.inv-alert-l { display: grid; gap: 12px; max-height: 52vh; overflow: auto; padding-right: 6px }
.inv-alert-p { padding: 16px 18px; border-radius: 18px; background: #fffbe6; border: 1px solid #f4dc7d } .inv-alert-p.out { background: #fdeef0; border-color: #f6c6cc }
.inv-alert-t { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-bottom: 10px } .inv-alert-t b { display: block; font-size: 18px } .inv-alert-t small { color: #6d6a64; font-size: 14px } .inv-alert-t em { font-style: normal; font-weight: 800; color: #d97706 } .inv-alert-p.out em { color: #dc2626 }
.inv-alert-e { padding: 10px 20px; border-radius: 10px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 }
.inv-alert-v { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(0, 0, 0, .08); font-size: 15px } .inv-alert-q { display: flex; gap: 6px } .inv-alert-q button { padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(0, 0, 0, .14); background: #fff; font-weight: 800 }
.inv-alert-d { padding: 16px; border-radius: 14px; border: 1px solid rgba(0, 0, 0, .14); background: #fff; font-weight: 800; font-size: 16px }
/* Edit Product */
.pe-wide .dpos-mbox, .dpos-modal .pe-wide { max-width: 1120px }
.pe-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0; border-top: 1px solid rgba(0, 0, 0, .08); margin: 0 -22px } @media (max-width: 860px) { .pe-two { grid-template-columns: 1fr } }
.pe-col1, .pe-col2 { padding: 28px 30px; display: grid; gap: 16px; align-content: start } .pe-col2 { background: #fafaf8; border-left: 1px solid rgba(0, 0, 0, .06) }
.pe-h { margin: 0; font-size: 18px; font-weight: 800 } .pe-h2 { margin-top: 14px }
.pe-l { display: grid; gap: 8px; font: 800 12px var(--d-sans, inherit); letter-spacing: .12em; color: #77736d } .pe-l input, .pe-l select, .pe-l textarea { padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(0, 0, 0, .1); background: #fff; font: 500 16px inherit; color: #111; letter-spacing: 0 }
.pe-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px } .pe-narrow { max-width: 240px }
.pe-ck { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 17px } .pe-ck input { width: 20px; height: 20px }
.pe-hint { margin: 0; font: 800 11px var(--d-sans, inherit); letter-spacing: .1em; color: #a29e97 }
.pe-vars-sec { margin: 0 -22px; padding: 26px 30px 30px; background: #f4f3f1; border-top: 1px solid rgba(0, 0, 0, .06); display: grid; gap: 14px }
.pe-add { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: 10px } @media (max-width: 700px) { .pe-add { grid-template-columns: 1fr 1fr } }
.pe-add input { padding: 13px 14px; border-radius: 12px; border: 1px solid rgba(0, 0, 0, .1); background: #fff }
.pe-addrow { padding: 13px 22px; border-radius: 12px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 }
.pe-save { display: flex; justify-content: flex-end; gap: 12px; margin-top: 6px } .pe-cancel { padding: 16px 26px; border-radius: 16px; background: #fff; border: 1px solid rgba(0, 0, 0, .14); font-weight: 800 }
.pe-savebtn { padding: 18px 34px; border-radius: 16px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800; font-size: 17px; box-shadow: 0 16px 30px -14px rgba(0, 0, 0, .6) } .pe-savebtn:disabled { opacity: .6 }

/* ======== Admin at 100%: normal size, compact tiles ======== */
.dpos { zoom: 1; min-height: 100vh }
.dpos-side { max-height: calc(100vh - 48px) }
.dpos-k4 { gap: 10px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }
.dpos .dpos-card2 { padding: 12px 15px; gap: 6px; min-height: 0; border-radius: 16px }
.dpos .dpos-card2 .t { font-size: 11px } .dpos .dpos-card2 .ic { width: 28px; height: 28px }
.dpos .dpos-card2 .v { font-size: 22px } .dpos .dpos-card2 .v.txt { font-size: 16px } .dpos .dpos-card2 .s { font-size: 11px } .dpos .dpos-card2 .s.more { margin-top: 2px }
.dpos .cost-card { padding: 14px 18px; gap: 6px; border-radius: 16px } .dpos .cost-card b { font-size: 24px } .dpos .cc-t i { width: 30px; height: 30px }
.dpos .dpos-formula { padding: 8px 14px; border-radius: 12px; font-size: 13px }
.dpos .cp-k, .dpos .cp-kpis > div { padding: 12px 16px }
.dpos .dpos-card { padding: 16px 18px }
@media (max-width: 859px) { .dpos { zoom: 1; min-height: 100vh } .dpos-side { max-height: none } }

/* ======== Order History: quick details (eye) and invoice preview ======== */
.oq { width: min(640px, calc(100% - 24px)); padding: 26px 28px 22px; border-radius: 26px; background: #fff; display: grid; gap: 16px }
.oq-h { display: flex; align-items: center; gap: 12px } .oq-h b { font-size: 22px; flex: 1 } .oq-h button { width: 34px; height: 34px; border-radius: 50%; font-size: 17px; color: #777 }
.oq-tag { padding: 5px 12px; border-radius: 999px; border: 1px solid #f4a8b3; background: #fff1f3; color: #d6244a; font: 800 12px var(--d-sans, inherit); letter-spacing: .06em }
.oq-g { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; padding-top: 14px; border-top: 1px solid #eee } .oq-g small { display: block; font: 800 11px var(--d-sans, inherit); letter-spacing: .14em; color: #9a968f; margin-bottom: 3px } .oq-g b { font-size: 17px }
.oq-box { border: 1px solid #e7e4de; border-radius: 16px; padding: 6px 16px; max-height: 44vh; overflow: auto } .oq-it { display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; border-bottom: 1px solid #eee } .oq-it small { color: #9a968f }
.oq-f { display: flex; justify-content: flex-end; gap: 10px }
.inv-pv { position: fixed; inset: 0; z-index: 300; background: rgba(0, 0, 0, .55); display: grid; place-items: center; padding: 22px }
.inv-pv-box { width: min(1000px, 100%); max-height: 100%; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: #f6f6f7; box-shadow: 0 40px 90px -20px rgba(0, 0, 0, .6) }
.inv-pv-h { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 20px; background: var(--d-acc, #1c284f); color: #fff; font: 800 13px Arial, sans-serif; letter-spacing: .06em } .inv-pv-h > span:first-child { display: inline-flex; align-items: center; gap: 10px }
.inv-pv-a { display: flex; gap: 8px } .inv-pv-a button { padding: 9px 14px; border-radius: 9px; background: rgba(255, 255, 255, .14); color: #fff; font: 700 13px Arial, sans-serif; cursor: pointer; border: 0 }
.inv-pv-body { flex: 1; overflow: auto; min-height: 0; padding: 22px 22px 30px !important }

/* ======== Admin typeface and spacing: Poppins everywhere, one rhythm ======== */
.dpos, .dpos-modal { font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 15px; letter-spacing: 0 }
.dpos :is(h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, select, textarea, label, td, th, li, small, b, strong, em, dt, dd, summary, legend, option),
.dpos-modal :is(h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, select, textarea, label, td, th, li, small, b, strong, em, dt, dd) { font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif }
.dpos .mono, .dpos .cp-mono, .dpos code, .dpos pre, .dpos .oid { font-family: ui-monospace, 'SF Mono', Consolas, monospace }
.dpos h1, .dpos h2, .dpos h3 { letter-spacing: -.015em; font-weight: 700 }
.dpos-top-t { font-size: 19px; font-weight: 700 }
/* sidebar: roomy rows, 16px text */
.dpos-side { padding: 16px; gap: 6px }
.dpos-nav { gap: 14px; padding: 15px 16px; border-radius: 16px; font-size: 16px; font-weight: 600 }
/* page rhythm: 24px between blocks, 24px inside cards */
.dpos-main { gap: 24px }
.dpos .dpos-card { padding: 22px 24px; border-radius: 22px }
.dpos-head { gap: 16px; margin-bottom: 4px }
.dpos .dpos-head h2, .dpos-main > .dpos-card > h2 { font-size: 22px; margin: 0 0 14px }
/* tables: 16px type, tall rows, small uppercase column heads */
.dpos table { font-size: 15px }
.dpos th { font-size: 11px; letter-spacing: .14em; font-weight: 700; padding: 16px 20px }
.dpos td { padding: 18px 20px }
.dpos td input, .dpos td select { padding: 10px 12px }
/* tabs and pills */
.dpos-tabs { gap: 28px } .dpos-tabs button { font-size: 14px; font-weight: 700; padding: 14px 4px }
.dpos input:not([type=checkbox]):not([type=radio]), .dpos select, .dpos textarea { font-size: 15px }
.dpos .f, .dpos .field { gap: 8px }
.dpos label.f, .dpos .cp-l, .dpos .pe-l { font-size: 12px; letter-spacing: .1em }
.dpos-btn { font-weight: 600; font-size: 14px; padding: 12px 20px }

/* Order History: GST and payment filters */
.oh-chips { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center } .oh-chips > div { display: flex; flex-wrap: wrap; gap: 8px; align-items: center }
.oh-chips b { font-size: 11px; letter-spacing: .14em; color: #b4730a; margin-right: 4px }
.oh-chips button { padding: 9px 16px; border-radius: 999px; background: #fff; border: 1px solid var(--d-line, #e5e4e0); font-weight: 700; font-size: 13px } .oh-chips button.on { background: var(--d-acc, #1c284f); color: #fff; border-color: var(--d-acc, #1c284f) }

/* Admin footer on every admin page */
.dpos-foot { margin: 20px -8px -4px; padding: 16px 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px 24px; flex-wrap: wrap; border-top: 1px solid var(--d-line, #e5e4e0); background: #f1efea; color: #8d8a84; font: 600 12.5px 'Poppins', system-ui, sans-serif; letter-spacing: .06em }
.dpos-foot b { color: #3c3a37; font-weight: 700 } .dpos-foot em { font-style: italic; font-weight: 700; color: #6d6a64; letter-spacing: 0; font-size: 13.5px }
@media (max-width: 700px) { .dpos-foot { justify-content: center; text-align: center } }

/* Billing: GST split-up under the GST row */
.dpos-gstsplit { display: grid; gap: 8px; margin: 8px 0; padding: 12px 14px; border-radius: 14px; background: #f6f4ee; border: 1px dashed #d9d4c6 }
.dpos-gstsplit .gs-h, .dpos-gstsplit .gs-r, .dpos-gstsplit .gs-s { display: flex; justify-content: space-between; gap: 10px; font-size: 13px }
.dpos-gstsplit .gs-h { font-weight: 800; letter-spacing: .06em; font-size: 11.5px; color: #6d6a64 } .dpos-gstsplit .gs-r { font-weight: 700 } .dpos-gstsplit .gs-r small { font-weight: 400; color: #8d8a84 }
.dpos-gstsplit .gs-s { padding-left: 14px; color: #55524d } .dpos-gstsplit b { font-variant-numeric: tabular-nums }

/* Sidebar logo: the Mahana Boutique & Tailors mark at the top */
.dpos-brand { flex-direction: column; align-items: flex-start; gap: 4px; padding: 6px 10px 12px }
.dpos-brand img { width: 100%; max-width: 190px; height: auto; display: block }
.dpos-brand i { margin-left: 4px }

/* Footer stays at the bottom of the screen on every admin page */
.dpos-main { display: flex; flex-direction: column; min-height: calc(100vh - 48px) }
.dpos-foot { position: sticky; bottom: 0; z-index: 20; margin: auto -8px 0; padding-top: 14px; padding-bottom: 14px; box-shadow: 0 -10px 18px -14px rgba(0, 0, 0, .25) }
.dpos-main > .dpos-foot { flex: none }
@media (max-width: 859px) { .dpos-main { min-height: 0 } }

/* Catalog picker: products as cards with + Add, then OK adds them all to the bill */
.cpk-ov { position: fixed; inset: 0; z-index: 300; background: rgba(15, 15, 20, .5); display: grid; place-items: center; padding: 22px }
.cpk { width: min(980px, 100%); max-height: 100%; display: flex; flex-direction: column; border-radius: 26px; background: #fbfbf4; overflow: hidden; box-shadow: 0 40px 90px -20px rgba(0, 0, 0, .55); font-family: 'Poppins', system-ui, sans-serif }
.cpk-h { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 20px 26px; border-bottom: 1px solid #e8e8dc } .cpk-h b { font-size: 19px } .cpk-h button { width: 36px; height: 36px; border-radius: 50%; font-size: 18px; color: #666 }
.cpk-body { padding: 18px 24px 8px; overflow: auto; display: grid; gap: 14px; min-height: 0; align-content: start }
.cpk-search { display: flex; align-items: center; gap: 10px; padding: 0 20px; border-radius: 999px; background: #fff; box-shadow: 0 6px 18px -10px rgba(0, 0, 0, .3); color: #6d6a64 } .cpk-search input { flex: 1; border: 0; background: transparent; padding: 17px 0; font: 500 16px inherit; outline: 0 }
.cpk-cats { display: flex; flex-wrap: wrap; gap: 8px } .cpk-cats button { padding: 10px 20px; border-radius: 999px; background: #ecedde; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: .02em } .cpk-cats button.on { background: var(--d-acc, #1c284f); color: #fff }
.cpk-grid { list-style: none; margin: 0; padding: 0 0 10px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px } @media (max-width: 760px) { .cpk-grid { grid-template-columns: 1fr } }
.cpk-grid li { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 18px; background: #fff; border: 1px solid #e8e8dc } .cpk-grid li.on { border-color: var(--d-acc, #1c284f); box-shadow: 0 0 0 2px rgba(28, 40, 79, .12) } .cpk-grid li.out { opacity: .55 }
.cpk-grid img, .cpk-ph { width: 60px; height: 60px; border-radius: 14px; object-fit: cover; flex: none; background: #e4e4d8 }
.cpk-t { flex: 1; min-width: 0; display: grid; gap: 3px } .cpk-t b { font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .cpk-t small { color: #77746d; font-size: 13px } .cpk-t strong { color: #111 }
.cpk-add { padding: 11px 20px; border-radius: 12px; background: #ecedde; font-weight: 700; font-size: 15px; flex: none } .cpk-add:hover:not(:disabled) { background: #dfe1cc } .cpk-add:disabled { opacity: .5 }
.cpk-step { display: inline-flex; align-items: center; gap: 4px; padding: 4px; border-radius: 12px; background: var(--d-acc, #1c284f); color: #fff; flex: none } .cpk-step button { width: 34px; height: 34px; border-radius: 9px; color: #fff; font-size: 18px } .cpk-step button:hover:not(:disabled) { background: rgba(255, 255, 255, .18) } .cpk-step button:disabled { opacity: .4 } .cpk-step b { min-width: 24px; text-align: center }
.cpk-empty { text-align: center; color: #77746d; padding: 40px 0 }
.cpk-f { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 26px; border-top: 1px solid #e8e8dc; background: #fbfbf4 } .cpk-f > span:first-child { color: #55524d; font-size: 16px } .cpk-f b { color: #111 }
.cpk-f > span:last-child { display: inline-flex; gap: 10px }
.cpk-cancel { padding: 13px 26px; border-radius: 14px; border: 1px solid #d9d9cc; background: #fff; font-weight: 700 } .cpk-ok { padding: 13px 40px; border-radius: 14px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 } .cpk-ok:disabled { opacity: .35 }

/* Measurements page */
.ms { display: grid; gap: 16px; max-width: 1280px; margin: 0 auto } .ms-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap } .ms-top h2 { margin: 0; font-size: 28px } .ms-top-a { display: flex; gap: 12px; flex-wrap: wrap; align-items: center }
.ms-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px } @media (max-width: 800px) { .ms-tiles { grid-template-columns: repeat(2, 1fr) } }
.ms-tile { text-align: left; padding: 16px 20px; border-radius: 18px; background: #fff; border: 2px solid transparent; box-shadow: 0 6px 20px -14px rgba(0, 0, 0, .35); display: grid; gap: 6px } .ms-tile small { font: 800 11px 'Poppins', sans-serif; letter-spacing: .14em; color: #55524d } .ms-tile b { font-size: 30px } .ms-tile.warn b { color: #d97706 } .ms-tile.ok b { color: #16a34a } .ms-tile.bad b { color: #dc2626 } .ms-tile.on { border-color: var(--d-acc, #1c284f) }
.ms-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px } @media (max-width: 800px) { .ms-filters { grid-template-columns: 1fr 1fr } }
.ms-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px } .ms-card { border-radius: 22px; background: #fff; border: 1px solid #e7e4de; overflow: hidden }
.ms-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px 24px; flex-wrap: wrap } .ms-who b { font-size: 18px; margin-right: 10px } .ms-who small { display: block; color: #77746d; margin-top: 4px }
.ms-inv { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #eef0f9; color: var(--d-acc, #1c284f); font: 800 12px 'Poppins', sans-serif; letter-spacing: .03em }
.ms-act { display: flex; align-items: center; gap: 10px } .ms-st { padding: 9px 16px; border-radius: 999px; font: 800 12px 'Poppins', sans-serif; letter-spacing: .06em; text-transform: uppercase; border: 1px solid } .ms-st.warn { background: #fff7e0; color: #b45309; border-color: #f4d58b } .ms-st.ok { background: #e3f4e8; color: #15803d; border-color: #b6e1c3 } .ms-st.bad { background: #fde8e8; color: #b91c1c; border-color: #f3b8b8 }
.ms-chev { width: 38px; height: 38px; border-radius: 10px; font-size: 20px; color: #55524d }
.ms-body { padding: 0 24px 22px; display: grid; gap: 14px; background: #faf8f6; border-top: 1px solid #eee } .ms-addr { margin: 14px 0 0; color: #6d6a64; font-size: 14px }
.ms-line { padding: 18px 20px; border-radius: 16px; background: #fff; border: 1px solid #e7e4de; display: grid; gap: 14px } .ms-line-h { display: flex; justify-content: space-between; font-size: 18px }
.ms-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px } .ms-spec small { display: block; font: 700 11px 'Poppins', sans-serif; letter-spacing: .1em; color: #8a867f } .ms-spec b { display: flex; align-items: center; gap: 8px; font-size: 16px } .ms-ic svg { width: 30px; height: 22px; color: var(--d-acc, #1c284f) }
.ms-cm { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px } .ms-cm > div { padding: 12px 16px; border-radius: 14px; background: #eef0f9; border: 1px solid #d6dbee } .ms-cm small { display: block; font: 700 11px 'Poppins', sans-serif; letter-spacing: .1em; color: #6b7390 } .ms-cm b { font-size: 22px }
.ms-rem small { font: 800 12px 'Poppins', sans-serif; letter-spacing: .1em } .ms-rem ul { margin: 6px 0 0; padding-left: 18px; line-height: 1.7 }

/* ======== Admin scale and proportions (final): the exact type sizes of the reference admin, roomy padding ======== */
.dpos { --z: 1; zoom: var(--z); min-height: calc(100vh / var(--z)); width: 100%; max-width: 1760px; margin-left: auto; margin-right: auto; gap: 22px; padding: 18px clamp(10px, 1.4vw, 26px) 16px; font-size: 14.5px; line-height: 1.4 }
@media (min-width: 900px) { .dpos { grid-template-columns: 262px minmax(0, 1fr) } }
.dpos-side { max-height: calc((100vh - 36px) / var(--z)); padding: 12px; gap: 3px; top: 18px }
.dpos-main { gap: 18px; min-height: calc(100vh / var(--z) - 36px) }
.dpos-brand img { max-width: 150px } .dpos-brand { padding: 4px 8px 10px }
.dpos-nav { padding: 13px 16px; gap: 14px; border-radius: 14px; font-size: 15px; font-weight: 500; line-height: 1.25 }
.dpos-nav.on { font-weight: 600 }
.dpos-grp, .dpos-side [class*="grp"] { font-size: 10.5px }
.dpos-top-t { font-size: 17px }
.dpos-head h1 { font-size: 27px; line-height: 1.1; margin: 0 } .dpos-head .sub { font-size: 14px; margin-top: 3px }
.dpos .dpos-head h2, .dpos-main > .dpos-card > h2 { font-size: 17px; margin: 0 0 12px }
.dpos .dpos-card { padding: 20px 24px; border-radius: 22px }
.dpos table { font-size: 14px }
.dpos th { font-size: 10.5px; padding: 13px 16px }
.dpos td { padding: 15px 16px }
.dpos input:not([type=checkbox]):not([type=radio]), .dpos select, .dpos textarea { font-size: 14.5px; padding: 12px 15px; border-radius: 12px }
.dpos td input, .dpos td select { padding: 8px 11px }
.dpos label.f, .dpos .cp-l, .dpos .pe-l { font-size: 11.5px; letter-spacing: .1em }
.dpos label.f { gap: 7px }
.dpos-btn { font-size: 13.5px; padding: 10px 17px }
.dpos-tabs { gap: 26px } .dpos-tabs button { font-size: 13px; padding: 13px 3px }
.dpos .dpos-card2 { padding: 18px 22px; gap: 8px; border-radius: 20px } .dpos .dpos-card2 .t { font-size: 11px } .dpos .dpos-card2 .v { font-size: 27px } .dpos .dpos-card2 .v.txt { font-size: 18px } .dpos .dpos-card2 .s { font-size: 12px }
.dpos .cost-card { padding: 20px 24px } .dpos .cost-card b { font-size: 30px }
.dpos-k4 { gap: 14px }
.dpos-foot { font-size: 11.5px; padding-top: 14px; padding-bottom: 14px }
.dpos-pills button, .dpos-two button, .adv-modes button { font-size: 12px }
.dpos-ledger, .dpos-lrow { font-size: 14.5px }
.dpos-cta { font-size: 14.5px; padding: 15px }
@media (max-width: 899px) { .dpos { zoom: 1; min-height: 100vh; grid-template-columns: 1fr; font-size: 14px; gap: 12px; padding: 12px 12px 96px } .dpos-side { max-height: none; position: static } .dpos-main { min-height: 0; gap: 14px } .dpos-head h1 { font-size: 22px } .dpos-foot { justify-content: center; text-align: center; margin: 14px 0 0 } }
.cp, .ms { max-width: none; margin: 0 }
.cp-l { display: block } .cp-l > input, .cp-l > select { display: block; width: 100%; margin-top: 6px } .cp-l em { margin-left: 4px }
.inv-filters select { width: auto; min-width: 210px }
.an-head { margin-bottom: 0 } .an-period { padding: 4px 6px 4px 8px }
.an-bar { margin: 0 }
.dpos-pills button, .adv-modes button { white-space: nowrap; padding-left: 6px; padding-right: 6px; font-size: 12px; letter-spacing: .06em }

/* Add Product: media gallery, variant rows */
.pe-mg { display: flex; justify-content: space-between; align-items: center; margin-top: 10px } .pe-up { font-weight: 800; font-size: 16px; padding: 4px 6px }
.pe-gal { display: flex; flex-wrap: wrap; gap: 12px }
.pe-tile { position: relative; width: 104px; height: 104px; border-radius: 14px; overflow: hidden; background: #f3f1ec; border: 1px solid #e4e1db; display: grid; place-items: center } .pe-tile img { width: 100%; height: 100%; object-fit: cover; display: block }
.pe-tile.add { border: 1.5px dashed #cfcac2; background: #fafafa; font-size: 28px; color: #8a867f; cursor: pointer }
.pe-primary { position: absolute; top: 0; left: 0; right: 0; padding: 3px 0; background: rgba(20, 20, 20, .82); color: #fff; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em; text-align: center }
.pe-tile > button:not(.add) { position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 255, 255, .92); font-size: 13px }
.pe-vh { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px }
.pe-vhead, .pe-vrow { display: grid; grid-template-columns: 1.2fr 1.2fr .9fr .9fr .8fr 40px; gap: 10px; align-items: center }
.pe-vhead { padding: 0 14px; font: 800 12px 'Poppins', sans-serif; letter-spacing: .1em; color: #8a867f }
.pe-vrow { padding: 10px 14px; border-radius: 16px; background: #fff; box-shadow: 0 6px 18px -12px rgba(0, 0, 0, .3) } .pe-vrow input { width: 100% }
.pe-vdel { width: 36px; height: 36px; border-radius: 10px; color: #8a867f; font-size: 17px } .pe-vdel:disabled { opacity: .3 }
@media (max-width: 700px) { .pe-vhead { display: none } .pe-vrow { grid-template-columns: 1fr 1fr } }

/* Online orders as cards */
.oo-count { margin: 4px 2px; color: #6d6a64; font-size: 16px }
.oo-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px }
.oo-card { background: #fff; border-radius: 18px; padding: 16px 20px 14px; border: 1px solid rgba(0, 0, 0, .05); box-shadow: 0 8px 22px -18px rgba(0, 0, 0, .35) }
.oo-top { display: flex; justify-content: space-between; align-items: center; gap: 12px } .oo-id { display: flex; align-items: center; gap: 10px; flex-wrap: wrap } .oo-id b { font-size: 19px }
.oo-tag { padding: 3px 12px; border-radius: 999px; border: 1px solid #9fe3c4; background: #effcf6; color: #0c8a5a; font: 800 12px 'Poppins', sans-serif; letter-spacing: .04em }
.oo-amt { display: flex; align-items: center; gap: 10px } .oo-amt b { font-size: 19px }
.oo-name { margin: 6px 0 0; font-size: 19px; font-weight: 700 } .oo-meta { margin: 2px 0 0; color: #8a867f; font-size: 15.5px }
.oo-foot { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee }
.oo-st { padding: 7px 14px; border-radius: 10px; border: 1px solid #cfd6e6; background: #f3f5fb; color: #2d3e76; font: 800 13px 'Poppins', sans-serif; letter-spacing: .05em; text-transform: uppercase; width: auto }
.oo-st.st-shipped, .oo-st.st-delivered { background: #e9fbf2; border-color: #a6e6c7; color: #0c8a5a } .oo-st.st-cancelled { background: #fdecec; border-color: #f3b8b8; color: #b91c1c } .oo-st.st-packed { background: #fff7e0; border-color: #f4d58b; color: #a16207 }
.inv-edited { margin: -6px 0 8px; font: 700 10.5px Arial, sans-serif; letter-spacing: .12em; color: #b45309 }
/* wide admin windows (Edit / Add product, Edit invoice, Return items) */
.dpos-sheet.wide { width: min(1000px, 96vw); max-width: none }
.dpos-sheet.pe-wide { width: min(1160px, 96vw); max-width: none }
.dpos-head h1 { font-size: 24px }
.dpos-btn.sm, .dpos-head .dpos-btn { font-size: 11.5px; padding: 8px 13px; letter-spacing: .05em; white-space: nowrap }

/* Stitching pages */
.sd { display: grid; gap: 14px; max-width: none }
.sd-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px } @media (max-width: 899px) { .sd-two { grid-template-columns: 1fr } }
.sd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px } .sd-list li button { width: 100%; display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; gap: 12px; align-items: center; text-align: left; padding: 11px 14px; border-radius: 14px; background: #faf8f6; border: 1px solid #eee } .sd-list li.late button { background: #fff6f6; border-color: #f3c9c9 }
.sd-list li button:hover { border-color: var(--d-acc, #1c284f) } .sd-w { display: grid; min-width: 0 } .sd-w b, .sd-w small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .sd-w small { color: #8a867f } .sd-n { font: 700 12px ui-monospace, Consolas, monospace; color: #55524d; text-align: right } .sd-n i { display: block; font-style: normal; color: #b45309; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em }
@media (max-width: 640px) { .sd-list li button { grid-template-columns: 1fr; gap: 4px } .sd-n { text-align: left } }
.sd-due { font-weight: 700 } .sd-due.late { color: #b91c1c } .sd-due.now { color: #b45309 } .sd-adv { margin-left: 8px; padding: 2px 8px; border-radius: 6px; background: #fff3d6; color: #b45309; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em } .sd-bal { color: #b45309 }
.sr-rank { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px } .sr-rank li { display: grid; gap: 6px } .sr-rank li > div { display: flex; justify-content: space-between; gap: 10px } .sr-rank li span { color: #6d6a64 }
.sr-rank li > i { display: block; height: 8px; border-radius: 999px; background: var(--d-acc, #1c284f); opacity: .85 } .sr-rank.st li.warn > i { background: #f59e0b } .sr-rank.st li.ok > i { background: #16a34a } .sr-rank.st li.bad > i { background: #dc2626 }
.sr-days { display: flex; align-items: flex-end; gap: 6px; height: 190px; overflow-x: auto; padding-bottom: 4px } .sr-days > div { flex: 1 0 34px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px } .sr-days i { display: block; width: 100%; max-width: 38px; border-radius: 8px 8px 0 0; background: var(--d-acc, #1c284f) } .sr-days span { font-size: 10.5px; color: #8a867f }
@media (max-width: 899px) {
  .dpos-foot { position: static; box-shadow: none; margin: 14px 0 0 }
  .an-head { display: block } .an-period { border-radius: 18px; width: 100%; padding: 4px } .an-period .dpos-pf, .an-period > * { max-width: 100% }
  .ms-top, .ms-top-a { width: 100% } .ms-top-a { justify-content: flex-start }
  .oh-chips, .oh-chips > div { width: 100% }
}

/* Compact filters: tabs + period on one row; channel and payment bars side by side; dates only behind "Custom" */
.an-top { display: flex; justify-content: space-between; align-items: center; gap: 10px 18px; flex-wrap: wrap; border-bottom: 1px solid var(--d-line, #e5e4e0) } .an-top .dpos-tabs { border-bottom: 0 }
.an-bars { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch } .an-bars .an-chan { flex: 1 1 520px } .an-bars .an-pay { flex: 1 1 460px }
.dpos-pg .dates { display: inline-flex; align-items: center; gap: 12px; padding: 0 8px 0 10px; margin-left: 4px; border-left: 1px solid var(--d-line, #e5e4e0) } .dpos-pg .dates label { display: inline-flex; align-items: center } .dpos-pg .dates input { border: 0; padding: 4px 2px; width: auto; font-weight: 700; background: transparent; font-size: 13.5px }
.an-top .dpos-pg { box-shadow: none }
.an-bar { gap: 2px; padding: 5px } .an-bar button { padding: 8px 13px } .an-bar > b { padding: 0 10px 0 8px } .an-gst { margin-left: auto }
.an-bars .an-chan { flex: 1.1 1 560px; flex-wrap: nowrap } .an-bars .an-pay { flex: 1 1 470px; flex-wrap: nowrap }
.an-gst .dpos-pg { padding: 3px } .an-gst .dpos-pg button { padding: 7px 11px }
.an-all { display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px } .an-all .an-grp { display:flex; flex-wrap:wrap; align-items:center; gap:2px } .an-all .an-gst { margin-left:0 } .an-all .an-pay { margin-left:auto } .an-all .an-pay > b { padding:0 10px 0 8px }
@media (max-width:899px){ .an-all .an-pay { margin-left:0 } }
@media (min-width:900px){ .an-all { gap:4px 12px; flex-wrap:nowrap } .an-all button { padding:8px 9px } .an-all .an-gst .dpos-pg button { padding:7px 9px } .an-all .an-pay > b { padding:0 6px } }
@media (min-width:900px) and (max-width:1500px){ .an-all { flex-wrap:wrap } }

/* ---- admin content pages: fill the width, shorter inputs, no tall empty boxes ---- */
.adm { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 14px 16px; align-items: start }
.adm > p, .adm > .dpos-bar-tools, .adm > .adm-enq, .adm > .err { grid-column: 1 / -1 }
.adm .adm-block, .adm .adm-card, .adm .adm-panel { margin-top: 0; padding: 18px 22px; border-radius: 18px }
.adm .adm-block .f, .adm .adm-block .field { display: grid; gap: 6px; margin-top: 10px } .adm .adm-block input, .adm .adm-block textarea { width: 100%; max-width: none; padding: 9px 14px; border-radius: 12px }
.adm .adm-block textarea { min-height: 84px }
.adm-picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); gap: 8px }
.adm-picks .adm-pick { margin: 0 }
.adm-enq { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(min(100%, 430px), 1fr)); gap: 12px; list-style: none; padding: 0; margin: 0 }
.adm-enq > li { padding: 14px 18px; border-radius: 16px; display: grid; gap: 4px; align-content: start } .adm-enq > li p { margin: 0 }
.adm-enq select { width: auto; max-width: 170px; padding: 7px 12px; margin-top: 6px } .adm-enq .adm-del { justify-self: start }
.dpos-bar-tools input[type=search] { min-width: 220px }

/* inventory cards: every photo the same size, nothing clipped */
.inv-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); align-items: stretch }
.inv-card { min-width: 0; height: 100% } .inv-body { min-width: 0 }
.inv-photo { aspect-ratio: 3 / 4; height: auto } .inv-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover }
.inv-photo > span:first-child { position: absolute; inset: 0 }
.inv-badge, .inv-ic { z-index: 2 } .inv-ic button { width: 36px; height: 36px }
.inv-pr { display: flex; gap: 16px; margin-top: 6px; font-size: 13px; color: #6d6a64 } .inv-pr span { display: grid } .inv-pr b { color: #1a1a1a; font-size: 15px }
.inv-nm strong { white-space: nowrap }
.sg { margin-top: 18px; border-top: 1px solid rgba(0,0,0,.08); padding-top: 14px } .sg > input { width: 100%; max-width: 420px; margin-bottom: 12px }
.sg-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px } @media (max-width: 700px) { .sg-cols { grid-template-columns: 1fr } }
.sg-cols > div { border: 1px solid rgba(0,0,0,.1); border-radius: 14px; background: #faf9f6; overflow: hidden } .sg-h { margin: 0; padding: 10px 14px; font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #6d6a64; border-bottom: 1px solid rgba(0,0,0,.08) }
.sg-list { list-style: none; margin: 0; padding: 0; max-height: 300px; overflow: auto } .sg-none { padding: 40px 14px; text-align: center }
.sg-row { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-bottom: 1px solid rgba(0,0,0,.06) } .sg-row img, .sg-ph { width: 44px; height: 52px; object-fit: cover; border-radius: 8px; background: #e8e6e0; flex: none }
.sg-row > span { flex: 1; min-width: 0; display: grid } .sg-row b { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .sg-row small { color: #6d6a64 } .sg-row button { width: 32px; height: 32px; border-radius: 8px; font-size: 18px; color: #6d6a64 } .sg-row button:disabled { opacity: .3 }

/* inventory cards: nothing clipped, calmer type */
.inv-body { padding: 14px 16px 16px; gap: 3px }
.inv-nm { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 8px } .inv-nm b { min-width: 0; font-size: 15.5px } .inv-nm strong { font-size: 15.5px; white-space: nowrap }
.inv-body > small { font-size: 13.5px }
.inv-pr { gap: 22px; margin-top: 4px; font-size: 12px } .inv-pr b { font-size: 14px }
.inv-foot { flex-wrap: wrap; gap: 8px 12px; margin-top: 10px; font-size: 12.5px }
.inv-units { padding: 9px 14px; font-size: 14px; white-space: nowrap } .inv-foot > span { flex: 1 1 90px; min-width: 0 }
.inv-badge { font-size: 10.5px; padding: 5px 9px }

/* full names, no "…" */
.inv-nm b, .sg-row b { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere }
.inv-nm { align-items: start }
.pe-sug { padding: 0 clamp(14px, 2vw, 28px) 24px }

```
