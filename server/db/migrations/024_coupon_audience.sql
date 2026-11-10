-- Coupons can be limited to loyalty members / non-members, or to the customers a coupon was sent to on WhatsApp.
ALTER TABLE pos_coupons ADD COLUMN audience  TEXT NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone', 'non_loyalty', 'loyalty'));
ALTER TABLE pos_coupons ADD COLUMN sent_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pos_customers ADD COLUMN loyalty BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE pos_coupon_sends (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coupon_id  INT NOT NULL REFERENCES pos_coupons(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, phone)
);
