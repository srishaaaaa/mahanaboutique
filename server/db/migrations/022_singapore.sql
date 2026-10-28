-- The boutique moved to Singapore (Mahana Boutique & Tailors): Singapore dollars, Singapore time, single-rate GST.
-- Money columns keep the same integer minor units (cents instead of paise), so no amounts are converted.

ALTER TABLE products ALTER COLUMN currency SET DEFAULT 'SGD';
ALTER TABLE orders   ALTER COLUMN currency SET DEFAULT 'SGD';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'SGD';
UPDATE products SET currency = 'SGD' WHERE currency = 'INR';

-- New products are not taxed unless GST is set on them (Singapore GST is 9% once the shop is GST-registered).
ALTER TABLE products ALTER COLUMN tax_rate SET DEFAULT 0;

-- "Today" for bills, expenses and stitching orders is the Singapore calendar day.
ALTER TABLE pos_sales     ALTER COLUMN bill_date    SET DEFAULT ((now() AT TIME ZONE 'Asia/Singapore')::date);
ALTER TABLE pos_expenses  ALTER COLUMN expense_date SET DEFAULT ((now() AT TIME ZONE 'Asia/Singapore')::date);
ALTER TABLE stitch_orders ALTER COLUMN order_date   SET DEFAULT ((now() AT TIME ZONE 'Asia/Singapore')::date);

-- Shipping fees still on the original rupee values become Singapore placeholders: S$8, free above S$150.
UPDATE shipping_methods SET name = 'Standard delivery', base_amount = 800, free_over = 15000
 WHERE code = 'standard' AND base_amount = 9900 AND free_over = 500000;
