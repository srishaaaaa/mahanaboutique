import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/App';
import { api } from '../lib/api';
import { reloadAccess, useAccess } from '../lib/access';
import AdminShell, { Icon, NAV, ROLE_NAME } from '../components/AdminShell';
import StaffOnly from '../components/StaffOnly';

const STAFF = ['owner', 'admin', 'cashier', 'inventory'];
const ROLE_LABEL = { admin: 'Admin', cashier: 'Cashier', inventory: 'Inventory' };

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
        <section className="dpos-card"><p className="dpos-empty">No pages have been given to your role yet. Ask the owner to open Store settings → Staff access.</p></section>
      ) : groups.map(g => (
        <section key={g.group} className="dpos-card sd-group">
          <p className="sd-h">{g.group.toUpperCase()}</p>
          <div className="sd-grid">{g.items.map(([to, label, icon]) => <Link key={to} to={to} className="sd-tile"><span className="sd-ic"><Icon n={icon} size={20} /></span><b>{label}</b></Link>)}</div>
        </section>))}
    </AdminShell>
  );
}

// Store settings -> Staff access (owner only): which pages each role sees. A page can be hidden from a role, never opened beyond what the server allows that role.
export function StaffAccessCard() {
  const { toast, user } = useApp();
  const [d, setD] = useState(null); const [cfg, setCfg] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState();
  useEffect(() => { api('/admin/access').then(x => { setD(x); setCfg(x.config) }).catch(e => setErr(e.message)) }, []);
  if (user?.role !== 'owner') return null;
  const toggle = (role, path) => setCfg(c => ({ ...c, [role]: c[role].includes(path) ? c[role].filter(p => p !== path) : [...c[role], path] }));
  const save = async () => {
    setBusy(true); setErr();
    try { const r = await api('/admin/access', { method: 'PUT', body: cfg }); setCfg(r.config); await reloadAccess(); toast('Staff access saved') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  };
  return (
    <section className="dpos-card sd-access">
      <h2>Staff access</h2>
      <p className="muted small">Choose which pages each role sees on its staff dashboard and sidebar. The owner always sees everything. A tick is only possible where that role is allowed to use the page at all.</p>
      {err && <p className="dpos-err" role="alert">{err}</p>}
      {!cfg ? <p className="muted">Loading…</p> : (
        <div className="dpos-tw"><table className="sd-table"><thead><tr><th>Page</th>{d.roles.map(r => <th key={r} className="c">{ROLE_LABEL[r]}</th>)}</tr></thead>
          <tbody>{d.sections.map(g => [
            <tr key={g.group} className="sd-gr"><td colSpan={d.roles.length + 1}>{g.group.toUpperCase()}</td></tr>,
            ...g.items.map(i => <tr key={i.path}><td>{i.label}</td>{d.roles.map(r => <td key={r} className="c">{i.max.includes(r)
              ? <input type="checkbox" aria-label={`${ROLE_LABEL[r]} can open ${i.label}`} checked={cfg[r].includes(i.path)} onChange={() => toggle(r, i.path)} />
              : <span className="muted" title="This role cannot use this page">—</span>}</td>)}</tr>)])}</tbody></table></div>)}
      <div style={{ marginTop: 14 }}><button type="button" className="dpos-btn" disabled={busy || !cfg} onClick={save}>{busy ? 'Saving…' : 'Save staff access'}</button></div>
    </section>
  );
}
