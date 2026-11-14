import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/App';
import { api } from '../lib/api';
import { inr } from '../lib/format';

const when = d => new Date(d).toLocaleDateString('en-SG');
const TABS = [['profile', 'Profile'], ['addresses', 'Addresses'], ['orders', 'Orders'], ['security', 'Security']];
const BLANK_ADDR = { label: 'Home', name: '', phone: '', line1: '', line2: '', city: 'Singapore', state: '', pin: '', isDefault: false };

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }

function ProfileTab({ data, onSaved }) {
  const { signIn, toast } = useApp();
  const p = data.profile;
  const [f, setF] = useState({ name: p.name || '', phone: p.phone || '', birthday: p.birthday || '', gender: p.gender || '' });
  const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setErr(); setBusy(true);
    try {
      const d = await api('/auth/profile', { method: 'PATCH', body: { name: f.name, phone: f.phone, birthday: f.birthday || null, gender: f.gender || null } });
      signIn(d.user); onSaved(d); toast('Profile saved.');
    } catch (x) { setErr(x.message === 'Validation failed' ? 'Please check your name, phone number and birthday.' : x.message) }
    setBusy(false);
  }
  return (
    <form className="acc-form" onSubmit={save} noValidate>
      <div className="acc-card acc-id">
        <span className="acc-avatar" aria-hidden="true">{(p.name || p.email).trim().charAt(0).toUpperCase()}</span>
        <div><strong>{p.name || 'Your name'}</strong><p className="muted small">{p.email}</p><p className="muted small">Member since {when(p.memberSince)}{p.hasGoogle ? ' · Signed in with Google' : ''}</p></div>
      </div>
      <Field label="Full name"><input required autoComplete="name" maxLength={80} value={f.name} onChange={set('name')} /></Field>
      <Field label="Email"><input value={p.email} readOnly aria-readonly="true" className="ro" /></Field>
      <Field label="Phone"><input type="tel" autoComplete="tel" inputMode="tel" placeholder="+65 9123 4567" value={f.phone} onChange={set('phone')} /></Field>
      <div className="acc-two">
        <Field label="Birthday"><input type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={f.birthday} onChange={set('birthday')} /></Field>
        <Field label="Gender"><select value={f.gender} onChange={set('gender')}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></Field>
      </div>
      {err && <p role="alert" className="err">{err}</p>}
      <button className="btn dark" disabled={busy}>{busy ? 'SAVING…' : 'SAVE CHANGES'}</button>
    </form>
  );
}

function AddressForm({ initial, onCancel, onSaved }) {
  const [f, setF] = useState({ ...BLANK_ADDR, ...initial }); const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setErr(); setBusy(true);
    const { id, ...body } = f;
    try { onSaved(await api(id ? `/auth/addresses/${id}` : '/auth/addresses', { method: id ? 'PATCH' : 'POST', body })) }
    catch (x) { setErr(x.message === 'Validation failed' ? 'Please check every field. The postal code must be 6 digits.' : x.message); setBusy(false) }
  }
  return (
    <form className="acc-card acc-form" onSubmit={save} noValidate>
      <h3 className="serif">{f.id ? 'Edit address' : 'New address'}</h3>
      <div className="acc-two">
        <Field label="Label"><input maxLength={30} placeholder="Home, Work…" value={f.label} onChange={set('label')} /></Field>
        <Field label="Full name"><input required autoComplete="name" value={f.name} onChange={set('name')} /></Field>
      </div>
      <Field label="Phone"><input required type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Address"><input required autoComplete="address-line1" value={f.line1} onChange={set('line1')} /></Field>
      <Field label="Apartment, landmark (optional)"><input autoComplete="address-line2" value={f.line2} onChange={set('line2')} /></Field>
      <Field label="Postal code"><input required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={f.pin} onChange={set('pin')} /></Field>
      <label className="acc-check"><input type="checkbox" checked={f.isDefault} onChange={e => setF({ ...f, isDefault: e.target.checked })} /> Use as my default address</label>
      {err && <p role="alert" className="err">{err}</p>}
      <div className="acc-actions"><button className="btn dark" disabled={busy}>{busy ? 'SAVING…' : 'SAVE ADDRESS'}</button><button type="button" className="link-u" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

function AddressesTab({ data, onSaved }) {
  const { toast } = useApp();
  const [editing, setEditing] = useState(null); // null | {} (new) | address
  const [err, setErr] = useState();
  const act = async (fn, msg) => { setErr(); try { onSaved(await fn()); msg && toast(msg) } catch (x) { setErr(x.message) } };
  if (editing) return <AddressForm initial={editing.id ? editing : { name: data.profile.name, phone: data.profile.phone }} onCancel={() => setEditing(null)} onSaved={d => { onSaved(d); setEditing(null); toast('Address saved.') }} />;
  return (
    <div>
      {err && <p role="alert" className="err">{err}</p>}
      {data.addresses.length === 0 && <div className="empty"><p className="serif big">No saved addresses.</p><p className="muted">Save one here and checkout becomes a single tap.</p></div>}
      <ul className="acc-addrs">
        {data.addresses.map(a => (
          <li key={a.id} className="acc-card">
            <p className="eyebrow">{a.label}{a.isDefault && <span className="acc-badge">DEFAULT</span>}</p>
            <p><strong>{a.name}</strong><br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{[a.city || "Singapore", a.pin].filter(Boolean).join(" ")}<br />{a.phone}</p>
            <div className="acc-actions">
              <button className="link-u" onClick={() => setEditing(a)}>Edit</button>
              {!a.isDefault && <button className="link-u" onClick={() => act(() => api(`/auth/addresses/${a.id}/default`, { method: 'POST' }), 'Default address updated.')}>Make default</button>}
              <button className="link-u" onClick={() => window.confirm('Remove this address?') && act(() => api(`/auth/addresses/${a.id}`, { method: 'DELETE' }), 'Address removed.')}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      {data.addresses.length < 10 && <button className="btn dark" onClick={() => setEditing({})}>ADD A NEW ADDRESS</button>}
    </div>
  );
}

const STATUS_TONE = { paid: 'ok', delivered: 'ok', shipped: 'info', processing: 'info', pending: 'warn', cancelled: 'bad', failed: 'bad', refunded: 'bad' };
const pill = v => <span className={`acc-pill ${STATUS_TONE[String(v).toLowerCase()] || ''}`}>{String(v).replace(/_/g, ' ')}</span>;

function OrdersTab({ orders, err }) {
  return (
    <div>
      {err && <p role="alert" className="err">{err}</p>}
      {!orders && !err && <p className="muted">Loading…</p>}
      {orders?.length === 0 && <div className="acc-empty"><p className="serif big">No orders yet.</p><p className="muted">When you place an order it will appear here with its status.</p><Link className="btn dark" to="/shop">START SHOPPING</Link></div>}
      {orders?.length > 0 && (
        <ul className="acc-orders">{orders.map(o => (
          <li key={o.order_number} className="acc-order">
            <div><p className="eyebrow">ORDER</p><strong>{o.order_number}</strong><p className="muted small">Placed {when(o.created_at)}</p></div>
            <div className="acc-order-st">{pill(o.status)}{pill(o.payment_status)}</div>
            <div className="acc-order-tot"><p className="eyebrow">TOTAL</p><strong>{inr(o.total)}</strong><p className="muted small">incl. GST</p></div>
          </li>))}</ul>
      )}
    </div>
  );
}

function SecurityTab({ data, onSaved }) {
  const { toast } = useApp();
  const has = data.profile.hasPassword;
  const [f, setF] = useState({ current: '', password: '', again: '' }); const [err, setErr] = useState(); const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault(); setErr();
    if (f.password.length < 8) return setErr('Use at least 8 characters.');
    if (f.password !== f.again) return setErr('The two new passwords do not match.');
    setBusy(true);
    try { await api('/auth/password', { method: 'POST', body: { current: f.current || undefined, password: f.password } }); setF({ current: '', password: '', again: '' }); onSaved({ ...data, profile: { ...data.profile, hasPassword: true } }); toast(has ? 'Password changed.' : 'Password set.') }
    catch (x) { setErr(x.message === 'Validation failed' ? 'Use at least 8 characters.' : x.message) }
    setBusy(false);
  }
  return (
    <form className="acc-form" onSubmit={save} noValidate>
      <h3 className="serif">{has ? 'Change password' : 'Set a password'}</h3>
      {!has && <p className="muted small">You signed in with Google. A password lets you also sign in with your email.</p>}
      {has && <Field label="Current password"><input type="password" autoComplete="current-password" value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /></Field>}
      <Field label="New password"><input type="password" autoComplete="new-password" minLength={8} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></Field>
      <Field label="Repeat new password"><input type="password" autoComplete="new-password" value={f.again} onChange={e => setF({ ...f, again: e.target.value })} /></Field>
      {err && <p role="alert" className="err">{err}</p>}
      <button className="btn dark" disabled={busy}>{busy ? 'SAVING…' : has ? 'CHANGE PASSWORD' : 'SET PASSWORD'}</button>
    </form>
  );
}

const TAB_ICON = { profile: '◎', addresses: '⌂', orders: '▤', security: '◈' };

export function Account() {
  const { user, authReady, signOut, wish } = useApp();
  const [sp, setSp] = useSearchParams();
  const tab = TABS.some(([k]) => k === sp.get('tab')) ? sp.get('tab') : 'profile';
  const [data, setData] = useState(null); const [err, setErr] = useState();
  const [orders, setOrders] = useState(null); const [oerr, setOerr] = useState();
  useEffect(() => { if (user) { api('/auth/profile').then(setData).catch(e => setErr(e.message)); api('/orders').then(setOrders).catch(e => setOerr(e.message)) } }, [user?.id]); // eslint-disable-line
  if (!authReady) return <div className="page-pad"><p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  const first = user.name ? user.name.split(' ')[0] : 'there';
  const initial = (user.name || user.email || 'M').trim().charAt(0).toUpperCase();
  const spent = (orders || []).filter(o => String(o.payment_status).toLowerCase() === 'paid').reduce((t, o) => t + (o.total || 0), 0);
  const stats = [['Orders', orders ? orders.length : '—'], ['Total spent', orders ? inr(spent) : '—'], ['Saved addresses', data ? data.addresses.length : '—'], ['Wishlist', wish.length]];
  return (
    <div className="account acc-dash">
      <header className="acc-hero">
        <span className="acc-avatar lg" aria-hidden="true">{initial}</span>
        <div className="acc-hero-t">
          <p className="eyebrow">MY ACCOUNT</p>
          <h1 className="serif">Hello, {first}</h1>
          <p className="muted">{user.email}{data?.profile?.memberSince ? ` · Member since ${when(data.profile.memberSince)}` : ''}</p>
        </div>
        <div className="acc-hero-a">
          {user.role !== 'customer' && <Link className="btn" to="/admin/staff">STAFF DASHBOARD</Link>}
          <Link className="btn" to="/wishlist">WISHLIST ({wish.length})</Link>
        </div>
      </header>
      <ul className="acc-stats">{stats.map(([l, v]) => <li key={l}><strong>{v}</strong><span>{l}</span></li>)}</ul>
      <div className="acc-layout">
        <nav className="acc-side" aria-label="Account sections">
          {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setSp(k === 'profile' ? {} : { tab: k })}><i aria-hidden="true">{TAB_ICON[k]}</i>{l}</button>)}
          <button className="acc-signout" onClick={signOut}><i aria-hidden="true">⏻</i>Sign out</button>
        </nav>
        <section className="acc-panel" aria-live="polite">
          <h2 className="serif acc-ph">{TABS.find(([k]) => k === tab)[1]}</h2>
          {err && <p role="alert" className="err">{err}</p>}
          {!data && !err && tab !== 'orders' && <p className="muted">Loading…</p>}
          {data && tab === 'profile' && <ProfileTab data={data} onSaved={setData} />}
          {data && tab === 'addresses' && <AddressesTab data={data} onSaved={setData} />}
          {tab === 'orders' && <OrdersTab orders={orders} err={oerr} />}
          {data && tab === 'security' && <SecurityTab data={data} onSaved={setData} />}
        </section>
      </div>
    </div>
  );
}
