import { one } from '../db/index.js';

// Which admin pages each staff role can open, set by the owner or an admin in Store settings -> Staff dashboard: who sees what.
// The setting is real: a page granted to a role also opens the server routes behind that page for that role (see `grants`).
// `max` is the ceiling. Pages that could hand out more power (Users, Sample data, both Settings pages) stay admin-only.
const A = ['admin'], ALLR = ['admin', 'cashier', 'inventory'];
export const SECTIONS = [
  ['Online store', [['/admin/orders', 'Online orders', ALLR], ['/admin/reviews', 'Reviews', ALLR], ['/admin/categories', 'Categories', ALLR], ['/admin/trending', 'Trending', ALLR], ['/admin/site-text', 'Site text', ALLR], ['/admin/storefront', 'Storefront images', ALLR], ['/admin/reels', 'Reels & Gallery', ALLR], ['/admin/enquiries', 'Enquiries', ALLR], ['/admin/users', 'Users', A], ['/admin/sample', 'Sample data', A]]],
  ['Retail billing', [['/admin/billing', 'Billing', ALLR], ['/admin/billing/analytics', 'POS Analytics', ALLR], ['/admin/billing/advance', 'Advance Orders', ALLR], ['/admin/billing/orders', 'Order History', ALLR], ['/admin/billing/inventory', 'Inventory', ALLR], ['/admin/billing/customers', 'Customers', ALLR], ['/admin/billing/coupons', 'Coupons', ALLR], ['/admin/billing/birthdays', 'Date of Birth', ALLR], ['/admin/billing/expenses', 'Expenses', ALLR]]],
  ['Stitching', [['/admin/billing/stitching', 'Stitching Dashboard', ALLR], ['/admin/billing/stitching-orders', 'Stitching Orders', ALLR], ['/admin/billing/measurements', 'Measurements', ALLR], ['/admin/billing/stitching-reports', 'Stitching Reports', ALLR]]],
  ['Settings', [['/admin/billing/settings', 'POS Settings', A], ['/admin/settings', 'Store Settings', A]]],
].map(([group, items]) => ({ group, items: items.map(([path, label, max]) => ({ path, label, max })) }));
const ALL = SECTIONS.flatMap(g => g.items);
export const ROLES = ['admin', 'cashier', 'inventory'];
const DEFAULTS = {
  admin: ALL.map(i => i.path),
  cashier: ['/admin/billing', '/admin/billing/advance', '/admin/billing/orders', '/admin/billing/customers', '/admin/billing/stitching', '/admin/billing/stitching-orders', '/admin/billing/measurements'],
  inventory: ['/admin/billing/inventory'],
};

const clean = (role, list) => [...new Set((Array.isArray(list) ? list : []).filter(p => ALL.some(i => i.path === p && i.max.includes(role))))];

const read = async db => (await one(db, 'SELECT value FROM pos_settings WHERE key = $1', ['role_access']))?.value ?? {};
let memo = null; // short-lived copy so the role check does not query on every request
export async function getAccess(db, fresh = false) {
  if (!fresh && memo && Date.now() - memo.at < 5000) return memo.cfg;
  const saved = await read(db);
  const cfg = Object.fromEntries(ROLES.map(r => [r, Array.isArray(saved[r]) ? clean(r, saved[r]) : DEFAULTS[r]]));
  memo = { at: Date.now(), cfg };
  return cfg;
}
export const allowedFor = (role, cfg) => role === 'owner' ? ALL.map(i => i.path) : (cfg[role] || []);
export async function saveAccess(db, body) {
  const cfg = Object.fromEntries(ROLES.map(r => [r, clean(r, body?.[r])]));
  await db.query('INSERT INTO pos_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()', ['role_access', JSON.stringify(cfg)]);
  memo = null;
  return cfg;
}

// The pages whose data a server route belongs to (path after /api/admin). A role granted any one of them may use the route.
const B = '/admin/billing', BILL = [B, B + '/orders'], STITCH = [B + '/stitching', B + '/stitching-orders', B + '/measurements', B + '/stitching-reports'];
const ROUTES = [
  [/^\/access/, []], // never granted: only owner / admin
  [/^\/users/, []],
  [/^\/pos\/reports/, [B + '/analytics', B + '/stitching-reports']],
  [/^\/pos\/(expenses|expense-categories)/, [B + '/expenses']],
  [/^\/pos\/coupons\/check/, [...BILL, B + '/coupons']],
  [/^\/pos\/coupons/, [B + '/coupons']],
  [/^\/pos\/(birthdays|birthday-offer)/, [B + '/birthdays']],
  [/^\/pos\/customers\/lookup/, [...BILL, B + '/customers']],
  [/^\/pos\/customers/, [B + '/customers', ...BILL]],
  [/^\/pos\/(settings|delivery-rules)/, [B + '/settings']],
  [/^\/pos\/(products|stock|categories|catalog)/, [B + '/inventory', ...BILL, B + '/advance']],
  [/^\/pos\/advances/, [B + '/advance', B]],
  [/^\/pos\/(measurements|stitching)/, STITCH],
  [/^\/stitching/, STITCH],
  [/^\/pos\/sales\/[^/]+\/tailoring/, [...STITCH, ...BILL]],
  [/^\/pos\/(shop|sales|returns|ws)/, [...BILL, B + '/advance', ...STITCH, B + '/customers']],
  [/^\/(orders|stats)/, ['/admin/orders']],
  [/^\/reviews/, ['/admin/reviews']],
  [/^\/(categories|collections|taxonomy)/, ['/admin/categories']],
  [/^\/enquiries/, ['/admin/enquiries']],
  [/^\/sample-data/, ['/admin/sample']],
  [/^\/(products|variants|images)/, [B + '/inventory']],
  [/^\/media/, ['/admin/storefront', '/admin/reels', '/admin/site-text']],
  [/^\/(store|settings|pages)/, ['/admin/settings', '/admin/site-text', '/admin/trending', '/admin/storefront']],
];

// True when the owner / an admin has given this role the page that owns the route being called.
export async function grants(db, role, url) {
  if (!ROLES.includes(role)) return false;
  if (!String(url || '').startsWith('/api/admin')) return false;
  const path = String(url || '').split('?')[0].replace(/^\/api\/admin/, '');
  const hit = ROUTES.find(([re]) => re.test(path));
  if (!hit || !hit[1].length) return false;
  // pages a role already has by default keep their existing, finer route rules (e.g. only a manager deletes customers); the grant covers pages added beyond them
  const allowed = ((await getAccess(db))[role] || []).filter(p => !DEFAULTS[role].includes(p));
  return hit[1].some(p => allowed.includes(p) && ALL.find(i => i.path === p)?.max.includes(role));
}
