import { useEffect, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import { FRONT_NECKS, BACK_NECKS } from '../components/NeckPicker';
import { SLEEVE_TYPES, SLEEVE_LENGTHS } from '../components/MeasureModal';
import { Icon } from '../components/AdminShell';
import { PencilIcon, TrashIcon } from './PosOrders';

// Stitching -> Designs: add your own front and back neck designs (a name and, if you like, a picture). They show up with the built-in ones when measurements are taken.
export function StitchingDesigns() {
  const [d, setD] = useState(null); const [err, setErr] = useState(); const [ok, setOk] = useState(); const [busy, setBusy] = useState(false);
  const [nw, setNw] = useState({ front: { name: '', image: null }, back: { name: '', image: null } }); const [opt, setOpt] = useState({ sleeveTypes: '', sleeveLengths: '' });
  useEffect(() => { api('/admin/pos/stitch-designs').then(x => setD({ sleeveTypes: [], sleeveLengths: [], ...x })).catch(e => setErr(e.message)) }, []);
  const save = async next => { setBusy(true); setErr(); setOk(); try { setD(await api('/admin/pos/stitch-designs', { method: 'PUT', body: next })); setOk('Saved.') } catch (e) { setErr(e.message) } finally { setBusy(false) } };
  const add = kind => { const v = nw[kind]; if (!v.name.trim()) return setErr('Give the design a name.'); save({ ...d, [kind]: [...d[kind], { id: Math.random().toString(36).slice(2, 10), name: v.name.trim(), image: v.image }] }).then(() => setNw(x => ({ ...x, [kind]: { name: '', image: null } }))) };
  const addOpt = (kind, builtin) => { const v = opt[kind].trim(); if (!v) return setErr('Type the option first.'); if ([...builtin, ...d[kind]].some(x => x.toLowerCase() === v.toLowerCase())) return setErr('That option already exists.'); save({ ...d, [kind]: [...d[kind], v] }).then(() => setOpt(x => ({ ...x, [kind]: '' }))) };
  const removeOpt = (kind, v) => { if (confirm(`Remove “${v}”? Bills that already use it keep the wording.`)) save({ ...d, [kind]: d[kind].filter(x => x !== v) }) };
  const remove = (kind, id) => { if (confirm('Remove this design? Bills that already use it keep the name.')) save({ ...d, [kind]: d[kind].filter(x => x.id !== id) }) };
  const rename = (kind, id) => { const cur = d[kind].find(x => x.id === id); const name = prompt('Design name', cur.name); if (name && name.trim()) save({ ...d, [kind]: d[kind].map(x => x.id === id ? { ...x, name: name.trim() } : x) }) };
  const pick = async (kind, file, id) => { if (!file) return; try { const up = await uploadImage(file); if (id) save({ ...d, [kind]: d[kind].map(x => x.id === id ? { ...x, image: up.url } : x) }); else setNw(x => ({ ...x, [kind]: { ...x[kind], image: up.url } })) } catch (e) { setErr(e.message) } };
  if (!d) return <p className="dpos-empty">{err || 'Loading…'}</p>;
  const block = (kind, title, builtin) => (
    <section className="dpos-card sdz">
      <h2>{title} <small className="sdz-count">({builtin.length} built in · {d[kind].length} yours)</small></h2>
      <p className="muted small">Built in: {builtin.map(([l]) => l).join(' · ')}</p>
      <ul className="sdz-list">{d[kind].map(x => (
        <li key={x.id}><span className="sdz-ph">{x.image ? <img src={x.image} alt="" /> : <b>{x.name.slice(0, 2).toUpperCase()}</b>}</span><b className="sdz-n">{x.name}</b>
          <label className="ra eye" title="Change the picture" aria-label="Change picture"><input type="file" accept="image/*" hidden onChange={e => pick(kind, e.target.files?.[0], x.id)} /><Icon n="image" size={18} /></label>
          <button type="button" className="ra edit" title="Rename" aria-label="Rename" onClick={() => rename(kind, x.id)}><PencilIcon /></button>
          <button type="button" className="ra del" title="Remove" aria-label="Remove" onClick={() => remove(kind, x.id)}><TrashIcon /></button></li>))}
        {!d[kind].length && <li className="muted small">No designs of your own yet.</li>}</ul>
      <div className="sdz-add">
        <label className="sdz-f"><span>DESIGN NAME</span><input value={nw[kind].name} maxLength={40} onChange={e => setNw(x => ({ ...x, [kind]: { ...x[kind], name: e.target.value } }))} placeholder="e.g. Princess cut" aria-label="Design name" /></label>
        <label className="sdz-f"><span>PICTURE (OPTIONAL)</span><span className="sdz-file">{nw[kind].image ? 'Picture added ✓' : 'No picture yet'}<span className="dpos-btn outline sm">Choose file</span><input type="file" accept="image/*" hidden onChange={e => pick(kind, e.target.files?.[0])} /></span></label>
        <button type="button" className="dpos-btn" disabled={busy} onClick={() => add(kind)}>+ Add design</button></div>
    </section>);
  return (<div className="sdz-wrap">{err && <p className="dpos-err" role="alert">{err}</p>}{ok && <p className="dpos-ok" role="status">{ok}</p>}
    {block('front', 'Front neck designs', FRONT_NECKS)}{block('back', 'Back neck designs', BACK_NECKS)}
    {[['sleeveTypes', 'Sleeve types', SLEEVE_TYPES], ['sleeveLengths', 'Sleeve lengths', SLEEVE_LENGTHS]].map(([kind, title, builtin]) => (
      <section key={kind} className="dpos-card sdz">
        <h2>{title} <small className="sdz-count">({builtin.length} built in · {d[kind].length} yours)</small></h2>
        <p className="muted small">Built in: {builtin.join(', ')}</p>
        {d[kind].length > 0 && <ul className="sdz-chips">{d[kind].map(v => <li key={v}>{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => removeOpt(kind, v)}>×</button></li>)}</ul>}
        <form className="sdz-add" onSubmit={e => { e.preventDefault(); addOpt(kind, builtin) }}>
          <label className="sdz-f"><span>ADD AN OPTION</span><input value={opt[kind]} maxLength={30} onChange={e => setOpt(x => ({ ...x, [kind]: e.target.value }))} placeholder="e.g. Cap sleeve" /></label>
          <button className="dpos-btn" disabled={busy || !opt[kind].trim()}>+ Add</button></form>
      </section>))}</div>);
}
