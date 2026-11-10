-- Return invoices (credit notes): items brought back against a completed bill. Stock goes back, the refund is recorded by payment mode.
CREATE TABLE pos_returns (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_no   TEXT NOT NULL UNIQUE,
  sale_id     INT NOT NULL REFERENCES pos_sales(id) ON DELETE RESTRICT,
  reason      TEXT NOT NULL DEFAULT '',
  refund_mode TEXT NOT NULL CHECK (refund_mode IN ('cash','upi','card')),
  subtotal    INT NOT NULL,   -- value of the returned lines, before discount, GST-exclusive
  discount    INT NOT NULL DEFAULT 0,
  tax         INT NOT NULL DEFAULT 0,
  total       INT NOT NULL,   -- what is handed back: subtotal - discount + tax
  share_token TEXT NOT NULL UNIQUE,
  created_by  INT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pos_returns_sale_idx ON pos_returns (sale_id);
CREATE TABLE pos_return_items (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_id    INT NOT NULL REFERENCES pos_returns(id) ON DELETE CASCADE,
  sale_item_id INT NOT NULL REFERENCES pos_sale_items(id) ON DELETE RESTRICT,
  quantity     INT NOT NULL CHECK (quantity > 0),
  line_total   INT NOT NULL,
  discount     INT NOT NULL DEFAULT 0,
  tax          INT NOT NULL DEFAULT 0
);
CREATE INDEX pos_return_items_item_idx ON pos_return_items (sale_item_id);
