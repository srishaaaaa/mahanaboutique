-- "Complete the look": up to 4 hand-picked products shown under a product on the storefront.
CREATE TABLE product_suggestions (
  product_id   INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, suggested_id),
  CHECK (product_id <> suggested_id)
);
