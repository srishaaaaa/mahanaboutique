-- Barcodes (ported from Mahalashmi): a registry of barcode values per size/variant, custom label sizes, and richer stock movements.
ALTER TABLE product_variants ADD COLUMN barcode TEXT;
CREATE UNIQUE INDEX product_variants_barcode_key ON product_variants (upper(barcode)) WHERE barcode IS NOT NULL AND barcode <> '';

CREATE SEQUENCE barcode_variant_seq START WITH 10000001;
CREATE SEQUENCE barcode_product_seq START WITH 10000001;

CREATE TABLE barcode_registry (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barcode_value   TEXT NOT NULL UNIQUE,
  entity_type     TEXT NOT NULL DEFAULT 'variant' CHECK (entity_type IN ('product', 'variant')),
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      INT REFERENCES product_variants(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX barcode_registry_product_idx ON barcode_registry (product_id);
CREATE INDEX barcode_registry_variant_idx ON barcode_registry (variant_id) WHERE variant_id IS NOT NULL;

CREATE TABLE barcode_custom_sizes (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  labels_per_row    INT NOT NULL DEFAULT 1 CHECK (labels_per_row >= 1),
  width_mm          NUMERIC(8, 2) NOT NULL CHECK (width_mm > 0),
  height_mm         NUMERIC(8, 2) NOT NULL CHECK (height_mm > 0),
  horizontal_gap_mm NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (horizontal_gap_mm >= 0),
  is_custom         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- a barcode receipt records what the stock was, what came in, at what cost and who did it
ALTER TABLE inventory_movements ADD COLUMN barcode_id INT REFERENCES barcode_registry(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN quantity_before INT;
ALTER TABLE inventory_movements ADD COLUMN quantity_after INT;
ALTER TABLE inventory_movements ADD COLUMN unit_cost INT;
ALTER TABLE inventory_movements ADD COLUMN note TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_movements ADD COLUMN created_by_name TEXT NOT NULL DEFAULT '';
