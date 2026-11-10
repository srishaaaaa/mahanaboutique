-- Stitching work on a bill moves through pending -> completed (a voided bill shows as cancelled).
ALTER TABLE pos_sales ADD COLUMN tailoring_status TEXT NOT NULL DEFAULT 'pending' CHECK (tailoring_status IN ('pending', 'completed'));
