-- Products can be flagged "New arrival" and "Best seller" (shown as shelves on the home page, not as categories).
ALTER TABLE products ADD COLUMN new_arrival BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN best_seller BOOLEAN NOT NULL DEFAULT false;
UPDATE products SET new_arrival = true WHERE id IN (SELECT cp.product_id FROM collection_products cp JOIN collections c ON c.id = cp.collection_id WHERE c.slug = 'new-arrivals');
-- A bill that was corrected after it was issued is marked with the time of the last edit.
ALTER TABLE pos_sales ADD COLUMN edited_at TIMESTAMPTZ;
