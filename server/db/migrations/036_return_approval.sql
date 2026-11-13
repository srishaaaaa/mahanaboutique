-- Returns: each returned line says whether it went back to stock, and who approved the return (staff need an admin's password).
ALTER TABLE pos_return_items ADD COLUMN restocked BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pos_returns ADD COLUMN approved_by INT REFERENCES profiles(id) ON DELETE SET NULL;
