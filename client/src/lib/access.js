import { useEffect, useState } from 'react';
import { api } from './api';

// The admin pages the signed-in staff member may open (the owner sets this in Store settings -> Staff access).
// One request per sign-in, shared by every admin page; `reloadAccess()` refreshes it after the owner saves.
let cache = null, inflight = null, forUser = null; const subs = new Set();
const publish = v => { cache = v; subs.forEach(f => f(v)) };
export const reloadAccess = uid => { forUser = uid ?? forUser; inflight = api('/admin/access').then(publish).catch(() => publish({ allowed: null })).finally(() => { inflight = null }); return inflight };

export function useAccess(user) {
  const [v, setV] = useState(cache);
  useEffect(() => {
    subs.add(setV);
    if (user && ['owner', 'admin', 'cashier', 'inventory'].includes(user.role)) {
      if (forUser !== user.id) { cache = null; setV(null); reloadAccess(user.id) } else if (!cache && !inflight) reloadAccess(user.id); else if (cache) setV(cache);
    }
    return () => { subs.delete(setV) };
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps
  return { loaded: !!v, allowed: v?.allowed || null, can: path => !v?.allowed || v.allowed.includes(path) };
}
