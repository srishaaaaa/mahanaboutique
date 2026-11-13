-- Delivery is priced by weight (as in Shalistone): every product has a weight in grams, a size may override it, and the bag's total weight picks the delivery tier.
ALTER TABLE products ADD COLUMN weight_grams INT NOT NULL DEFAULT 500 CHECK (weight_grams >= 0);
ALTER TABLE product_variants ADD COLUMN weight_grams INT CHECK (weight_grams IS NULL OR weight_grams >= 0);

-- Sensible starting weights by category (grams); the owner can edit any product afterwards. Anything uncategorised keeps 500 g.
UPDATE products p SET weight_grams = w.g
FROM categories c, (VALUES ('sarees', 700), ('lehengas', 1500), ('salwar suits', 600), ('kurtas', 350), ('dresses', 450), ('co-ords', 500),
                          ('couple combos', 900), ('festive', 800), ('blouses', 150), ('dupattas', 250)) AS w(name, g)
WHERE c.id = p.category_id AND lower(c.name) = w.name;
