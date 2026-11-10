-- A size can have its own cost price; null = use the product's cost price.
ALTER TABLE product_variants ADD COLUMN cost_override INT CHECK (cost_override IS NULL OR cost_override >= 0);
