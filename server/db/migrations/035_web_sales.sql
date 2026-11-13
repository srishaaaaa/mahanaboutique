-- Website orders appear in Order History / Analytics as ONLINE bills: every paid website order gets one bill (with an invoice) in pos_sales.
ALTER TABLE pos_sales ADD COLUMN web_order_id INT UNIQUE REFERENCES orders(id) ON DELETE SET NULL;

-- "Online" now means only what comes from the website. Bills keyed in at the billing panel are offline billing.
UPDATE pos_sales SET source = 'offline' WHERE source = 'online' AND web_order_id IS NULL;
