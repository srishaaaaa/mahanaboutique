import { getSetting, putSetting } from './pos.js';

// Which admin pages each staff role can open. The owner configures it in Store settings -> Staff access.
// `max` is the ceiling: the roles the server lets near that page's data at all, so a page can be hidden from a role but never opened beyond it.
const A = ['admin'], AC = ['admin', 'cashier'], AI = ['admin', 'inventory'];
export const SECTIONS = [
  ['Online store', [['/admin/orders', 'Online orders', A], ['/admin/reviews', 'Reviews', A], ['/admin/categories', 'Categories', A], ['/admin/trending', 'Trending', A], ['/admin/site-text', 'Site text', A], ['/admin/storefront', 'Storefront images', A], ['/admin/reels', 'Reels & Gallery', A], ['/admin/enquiries', 'Enquiries', A], ['/admin/users', 'Users', A], ['/admin/sample', 'Sample data', A]]],
  ['Retail billing', [['/admin/billing', 'Billing', AC], ['/admin/billing/analytics', 'POS Analytics', A], ['/admin/billing/advance', 'Advance Orders', AC], ['/admin/billing/orders', 'Order History', AC], ['/admin/billing/inventory', 'Inventory', AI], ['/admin/billing/customers', 'Customers', AC], ['/admin/billing/coupons', 'Coupons', A], ['/admin/billing/birthdays', 'Date of Birth', A], ['/admin/billing/expenses', 'Expenses', A]]],
  ['Stitching', [['/admin/billing/stitching', 'Stitching Dashboard', AC], ['/admin/billing/stitching-orders', 'Stitching Orders', AC], ['/admin/billing/measurements', 'Measurements', AC], ['/admin/billing/stitching-reports', 'Stitching Reports', A]]],
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

export async function getAccess(db) {
  const saved = await getSetting(db, 'role_access', {});
  return Object.fromEntries(ROLES.map(r => [r, Array.isArray(saved[r]) ? clean(r, saved[r]) : DEFAULTS[r]]));
}
export const allowedFor = (role, cfg) => role === 'owner' ? ALL.map(i => i.path) : (cfg[role] || []);
export async function saveAccess(db, body) {
  const cfg = Object.fromEntries(ROLES.map(r => [r, clean(r, body?.[r])]));
  await putSetting(db, 'role_access', cfg);
  return cfg;
}
