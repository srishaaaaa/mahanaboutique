export const inr = p => 'S$' + (p / 100).toLocaleString('en-SG', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 });
export const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
// Mirrors the server checkout rule (server/index.js). The server stays authoritative.
export const FREE_SHIPPING_AT = 15000; // S$150
export const SHIPPING_FLAT = 800; // S$8
export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const rank = s => { const i = SIZE_ORDER.indexOf(s); return i < 0 ? 99 : i };
export const sortSizes = a => [...a].sort((x, y) => rank(x) - rank(y) || x.localeCompare(y));
