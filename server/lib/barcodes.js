import { one, rows } from '../db/index.js';
import { HttpError } from './http.js';
import { audit } from './orders.js';

// Barcodes: every size/colour (variant) can carry one barcode. Values are CODE128, normalised to UPPERCASE and trimmed.
export const normalizeBarcode = c => String(c ?? '').trim().toUpperCase();
export const validBarcode = c => /^[A-Z0-9_-]{4,32}$/i.test(String(c ?? '').trim());

const variantName = v => [v.size, v.color].filter(x => x && x !== 'Default').join(' · ') || 'Default';
const VARIANT_SQL = `SELECT v.id AS "variantId", v.sku, v.size, v.color, v.barcode, v.stock_quantity AS stock, COALESCE(v.price_override, p.base_price) AS price,
    p.id AS "productId", p.name, p.tax_rate AS "taxRate", p.status, c.name AS category,
    (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order, i.id LIMIT 1) AS image`;
const FROM_SQL = `FROM product_variants v JOIN products p ON p.id = v.product_id LEFT JOIN categories c ON c.id = p.category_id`;
const shape = r => r && { ...r, variantName: variantName(r) };

// Scan lookup: 1) active registry row, 2) the barcode copied onto the size, 3) the size's SKU (so older stickers still scan).
export async function lookupBarcode(db, code) {
  const v = normalizeBarcode(code);
  if (!v) return null;
  const reg = await one(db, `${VARIANT_SQL}, g.barcode_value AS "barcodeValue" ${FROM_SQL} JOIN barcode_registry g ON g.variant_id = v.id WHERE upper(g.barcode_value) = $1 AND g.is_active LIMIT 1`, [v]);
  if (reg) return shape({ ...reg, barcode: reg.barcodeValue, via: 'registry' });
  const own = await one(db, `${VARIANT_SQL} ${FROM_SQL} WHERE upper(v.barcode) = $1 LIMIT 1`, [v]);
  if (own) return shape({ ...own, via: 'variant' });
  const sku = await one(db, `${VARIANT_SQL} ${FROM_SQL} WHERE upper(v.sku) = $1 LIMIT 1`, [v]);
  return sku ? shape({ ...sku, via: 'sku' }) : null;
}

// Next generated value: PBV + 8 digits (sizes) / PBP + 8 digits (products).
export async function generateBarcodeValue(db, entity = 'variant') {
  const n = (await one(db, entity === 'variant' ? `SELECT nextval('barcode_variant_seq')::text AS n` : `SELECT nextval('barcode_product_seq')::text AS n`)).n;
  return (entity === 'variant' ? 'PBV' : 'PBP') + String(n).padStart(8, '0');
}

// Assigns a barcode to a size (reusing it if it is already that size's) and optionally receives stock, logging a movement. One transaction.
export async function receiveStockWithBarcode(db, user, { variantId, quantity = 1, unitCost = null, customBarcode = null, note = '' }) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  const by = user?.name || user?.email || 'Admin';
  return db.tx(async t => {
    const v = await one(t, `SELECT v.id, v.product_id, v.stock_quantity, v.barcode, v.size, v.color, p.name FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = $1 FOR UPDATE OF v`, [variantId]);
    if (!v) throw new HttpError(404, 'Size not found', 'not_found');
    let value = normalizeBarcode(customBarcode) || null, row = null, isNew = false;
    if (value) {
      if (!validBarcode(value)) throw new HttpError(400, 'A barcode is 4 to 32 letters, numbers, - or _', 'bad_barcode');
      row = await one(t, 'SELECT * FROM barcode_registry WHERE upper(barcode_value) = $1', [value]);
      if (row && row.variant_id !== v.id) throw new HttpError(409, `Barcode ${value} is already assigned to another item`, 'barcode_taken');
      const onOther = await one(t, `SELECT 1 AS x FROM product_variants WHERE upper(barcode) = $1 AND id <> $2`, [value, v.id]);
      if (onOther) throw new HttpError(409, `Barcode ${value} is already assigned to another item`, 'barcode_taken');
    } else {
      row = await one(t, 'SELECT * FROM barcode_registry WHERE variant_id = $1 AND is_active ORDER BY id LIMIT 1', [v.id]);
      if (!row) value = await generateBarcodeValue(t, 'variant');
    }
    if (!row) {
      row = await one(t, `INSERT INTO barcode_registry (barcode_value, entity_type, product_id, variant_id, created_by_name) VALUES ($1,'variant',$2,$3,$4) RETURNING *`, [value, v.product_id, v.id, by]);
      isNew = true;
    } else if (!row.is_active) await t.query('UPDATE barcode_registry SET is_active = true, updated_at = now() WHERE id = $1', [row.id]);
    // keep the barcode on the size itself so a scan that falls back to it still matches
    await t.query(`UPDATE product_variants SET barcode = $2 WHERE id = $1 AND COALESCE(barcode, '') = ''`, [v.id, row.barcode_value]);
    const before = v.stock_quantity, after = before + qty;
    if (qty > 0) {
      await t.query('UPDATE product_variants SET stock_quantity = $2 WHERE id = $1', [v.id, after]);
      await t.query(`INSERT INTO inventory_movements (variant_id, quantity_change, reason, reference_id, barcode_id, quantity_before, quantity_after, unit_cost, note, created_by_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [v.id, qty, isNew ? 'barcode_initial_stock' : 'barcode_restock', row.barcode_value, row.id, before, after, unitCost == null ? null : Math.max(0, Math.round(unitCost)), String(note || '').slice(0, 200), by]);
    }
    await audit(t, user?.id ?? null, 'barcode.assign', 'variant', v.id, { barcode: row.barcode_value, isNew, qty });
    return { success: true, barcodeId: row.id, barcodeValue: row.barcode_value, isNewBarcode: isNew, movementType: qty === 0 ? 'NONE' : isNew ? 'INITIAL_BARCODE_STOCK' : 'RESTOCK',
      quantityBefore: before, quantityReceived: qty, quantityAfter: after, productId: v.product_id, variantId: v.id, productName: v.name, variantName: variantName(v) };
  });
}

export async function listRegistry(db, { search = '', limit = 50, offset = 0 } = {}) {
  const like = `%${String(search).trim().replace(/[\\%_]/g, m => '\\' + m)}%`, lim = Math.min(Math.max(+limit || 50, 1), 500), off = Math.max(+offset || 0, 0);
  const records = await rows(db, `SELECT g.id, g.barcode_value AS "barcodeValue", g.entity_type AS "entityType", g.product_id AS "productId", g.variant_id AS "variantId", g.is_active AS "isActive",
      g.created_by_name AS "createdByName", g.created_at AS "createdAt", p.name AS "productName", v.size, v.color, v.sku
    FROM barcode_registry g JOIN products p ON p.id = g.product_id LEFT JOIN product_variants v ON v.id = g.variant_id
    WHERE $1 = '%%' OR g.barcode_value ILIKE $1 OR p.name ILIKE $1 ORDER BY g.id DESC LIMIT ${lim} OFFSET ${off}`, [like]);
  const total = (await one(db, `SELECT COUNT(*)::int AS n FROM barcode_registry g JOIN products p ON p.id = g.product_id WHERE $1 = '%%' OR g.barcode_value ILIKE $1 OR p.name ILIKE $1`, [like])).n;
  return { records: records.map(r => ({ ...r, variantName: variantName(r) })), total };
}

export async function deactivateBarcode(db, user, id) {
  const r = await one(db, 'UPDATE barcode_registry SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id, barcode_value', [id]);
  if (!r) throw new HttpError(404, 'Barcode not found', 'not_found');
  await audit(db, user?.id ?? null, 'barcode.deactivate', 'barcode', id, { barcode: r.barcode_value });
}

// Flat list of every size for the Generator's "Item name" select.
export async function listBarcodeItems(db, q = '') {
  const like = `%${String(q).trim().replace(/[\\%_]/g, m => '\\' + m)}%`;
  const costCol = (await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'cost_override'`)) ? 'COALESCE(v.cost_override, p.cost_price)' : 'p.cost_price';
  const list = await rows(db, `${VARIANT_SQL}, ${costCol}::int AS cost ${FROM_SQL} WHERE v.active AND p.status <> 'archived' AND ($1 = '%%' OR p.name ILIKE $1 OR v.sku ILIKE $1 OR v.barcode ILIKE $1) ORDER BY p.name, v.id LIMIT 400`, [like]);
  return list.map(shape);
}

const sizeOut = r => ({ id: r.id, name: r.name, labelsPerRow: r.labels_per_row, widthMm: Number(r.width_mm), heightMm: Number(r.height_mm), horizontalGapMm: Number(r.horizontal_gap_mm), isCustom: true });
export const listCustomSizes = async db => (await rows(db, 'SELECT * FROM barcode_custom_sizes ORDER BY created_at, id')).map(sizeOut);
export async function saveCustomSize(db, s) {
  const r = await one(db, `INSERT INTO barcode_custom_sizes (id, name, labels_per_row, width_mm, height_mm, horizontal_gap_mm) VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (id) DO UPDATE SET name = $2, labels_per_row = $3, width_mm = $4, height_mm = $5, horizontal_gap_mm = $6, updated_at = now() RETURNING *`,
    [s.id, s.name, s.labelsPerRow, s.widthMm, s.heightMm, s.horizontalGapMm]);
  return sizeOut(r);
}
export const deleteCustomSize = (db, id) => db.query('DELETE FROM barcode_custom_sizes WHERE id = $1', [id]);

// A scanned code that is not in the catalogue: create the product (one "Default" size whose SKU is the code), register the barcode and receive the opening stock.
export async function quickAddScanned(db, user, { barcode, name, price, category = '', stock = 0 }) {
  const code = normalizeBarcode(barcode);
  if (!validBarcode(code)) throw new HttpError(400, 'A barcode is 4 to 32 letters, numbers, - or _', 'bad_barcode');
  if (await lookupBarcode(db, code)) throw new HttpError(409, `Barcode ${code} is already in the catalogue`, 'barcode_taken');
  const slugBase = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
  const made = await db.tx(async t => {
    const cat = category ? await one(t, 'SELECT id FROM categories WHERE lower(name) = lower($1)', [category]) : null;
    let slug = slugBase;
    for (let i = 2; await one(t, 'SELECT 1 AS x FROM products WHERE slug = $1', [slug]); i++) slug = `${slugBase}-${i}`;
    const p = await one(t, `INSERT INTO products (slug, name, description, category_id, base_price, tax_rate, status) VALUES ($1,$2,'',$3,$4,9,'active') RETURNING id`, [slug, name, cat?.id ?? null, price]);
    const v = await one(t, `INSERT INTO product_variants (product_id, sku, size, color, stock_quantity) VALUES ($1,$2,'Default','Default',0) RETURNING id`, [p.id, code]);
    return { productId: p.id, variantId: v.id };
  });
  await receiveStockWithBarcode(db, user, { variantId: made.variantId, quantity: stock, customBarcode: code, note: 'Added from a scanned barcode' });
  return lookupBarcode(db, code);
}
