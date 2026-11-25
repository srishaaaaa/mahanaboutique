import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/App';
import { api } from '../lib/api';
import { reloadAccess, useAccess } from '../lib/access';
import AdminShell, { Icon, NAV, ROLE_NAME } from '../components/AdminShell';
import StaffOnly from '../components/StaffOnly';

const STAFF = ['owner', 'admin', 'cashier', 'inventory'];

// Staff dashboard: the landing page for every staff role. It lists exactly the pages that role may open.
export function AdminStaff() {
  const { user, authReady } = useApp();
  const access = useAccess(user);
  if (!authReady) return <div className="page-pad"><p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!STAFF.includes(user.role)) return <StaffOnly />;
  const groups = NAV.filter(g => g.group !== 'Staff').map(g => ({ group: g.group, items: g.items.filter(i => access.allowed ? access.allowed.includes(i[0]) : false) })).filter(g => g.items.length);
  return (
    <AdminShell title="Staff dashboard" sub={`Welcome${user.name ? ', ' + user.name : ''} · signed in as ${ROLE_NAME[user.role] || user.role}`}>
      {!access.loaded ? <p className="muted">Loading your pages…</p> : !groups.length ? (
        <section className="dpos-card"><p className="dpos-empty">No pages have been given to your role yet. Ask the owner to open Settings → Staff permissions.</p></section>
      ) : groups.map(g => (
        <section key={g.group} className="dpos-card sd-group">
          <p className="sd-h">{g.group.toUpperCase()}</p>
          <div className="sd-grid">{g.items.map(([to, label, icon]) => <Link key={to} to={to} className="sd-tile"><span className="sd-ic"><Icon n={icon} size={20} /></span><b>{label}</b></Link>)}</div>
        </section>))}
    </AdminShell>
  );
}

// Settings -> Staff permissions (owner and admins): the pages every Staff member can open, like Dhanya's tick grid.
// Staff are the 'cashier' role; older stock-staff accounts ('inventory') get the same list. Admins always see everything.
// A page can be hidden from staff, never opened beyond what the server allows them.
export function StaffAccessCard() {
  const { toast, user } = useApp();
  const [d, setD] = useState(null); const [pages, setPages] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => { api('/admin/access').then(x => { setD(x); setPages(x.config.cashier || []) }).catch(e => setErr(e.message)) }, []);
  if (!['owner', 'admin'].includes(user?.role)) return null;
  const items = d ? d.sections.flatMap(g => g.items).filter(i => i.max.includes('cashier')) : [];
  const toggle = path => setPages(p => p.includes(path) ? p.filter(x => x !== path) : [...p, path]);
  const save = async () => {
    setBusy(true); setErr();
    try { const r = await api('/admin/access', { method: 'PUT', body: { ...d.config, cashier: pages, inventory: pages } }); setD({ ...d, config: r.config }); setPages(r.config.cashier); await reloadAccess(); toast('Page access saved') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  };
  return (
    <section className="dpos-card sp-card">
      <h2><Icon n="users" size={18} /> Staff permissions</h2>
      <p className="sub">Tick the pages every Staff member can open from the admin sidebar. Admins always see everything.</p>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      {!pages ? <p className="muted">Loading…</p> : (
        <div className="sp-grid">{items.map(i => (
          <label key={i.path} className={`sp-tile ${pages.includes(i.path) ? 'on' : ''}`}><input type="checkbox" checked={pages.includes(i.path)} onChange={() => toggle(i.path)} /> {i.label}</label>))}</div>)}
      <div style={{ marginTop: 16 }}><button type="button" className="dpos-btn" disabled={busy || !pages} onClick={save}>{busy ? 'Saving…' : 'Save page access'}</button></div>
    </section>
  );
}
