# ADMIN UI ATTACHMENT — PART 1 OF 4
(Companion to ADMIN_UI_PROMPT_FOR_DHANYA.md. Do NOT start work until you have received all 4 parts. Parts are in order; a code block that continues in the next part is closed and reopened — join those pieces into one file/section when you copy.)

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
```

(End of part 1 of 4.)
