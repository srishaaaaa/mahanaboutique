import { one } from '../db/index.js';

// The cost-price columns arrive with migration 019. Until it has been run on a database, everything that touches them is skipped,
// so the rest of the POS keeps working. A "yes" answer is remembered; a "no" is rechecked at most once a minute.
let known = false, checkedAt = 0;
export async function hasCostColumns(db) {
  if (known) return true;
  if (Date.now() - checkedAt < 60_000) return false;
  checkedAt = Date.now();
  const r = await one(db, `SELECT COUNT(*)::int AS n FROM information_schema.columns
    WHERE (table_name = 'products' AND column_name = 'cost_price') OR (table_name = 'pos_sale_items' AND column_name = 'cost_snapshot')`);
  known = r.n >= 2; return known;
}
export const resetCostCheck = () => { known = false; checkedAt = 0 };

// pos_advances.deposit_split arrives with migration 021; until then a deposit can only be paid one way.
let splitKnown = false, splitAt = 0;
export async function hasDepositSplit(db) {
  if (splitKnown) return true;
  if (Date.now() - splitAt < 60_000) return false;
  splitAt = Date.now();
  splitKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'pos_advances' AND column_name = 'deposit_split'`));
  return splitKnown;
}

// product_variants.cost_override arrives with migration 030; until then every size uses the product's cost.
let vcKnown = false, vcAt = 0;
export async function hasVariantCost(db) {
  if (vcKnown) return true;
  if (Date.now() - vcAt < 60_000) return false;
  vcAt = Date.now();
  vcKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'cost_override'`));
  return vcKnown;
}

// product_variants.barcode arrives with migration 033; until then nothing shows a barcode.
let bcKnown = false, bcAt = 0;
export async function hasVariantBarcode(db) {
  if (bcKnown) return true;
  if (Date.now() - bcAt < 60_000) return false;
  bcAt = Date.now();
  bcKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'barcode'`));
  return bcKnown;
}

// products.weight_grams / product_variants.weight_grams arrive with migration 034; until then every bag weighs the default per piece.
let wtKnown = false, wtAt = 0;
export async function hasWeightColumns(db) {
  if (wtKnown) return true;
  if (Date.now() - wtAt < 60_000) return false;
  wtAt = Date.now();
  wtKnown = !!(await one(db, `SELECT 1 AS x FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams'`));
  return wtKnown;
}
