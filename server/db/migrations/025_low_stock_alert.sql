-- Each product can have its own low-stock alert level, compared against its total stock across all sizes.
ALTER TABLE products ADD COLUMN low_stock_alert INT NOT NULL DEFAULT 3 CHECK (low_stock_alert >= 0);
