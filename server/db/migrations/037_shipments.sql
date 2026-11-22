-- Courier booking (EasyParcel): the tracking number, label, courier and latest status of an order's shipment.
ALTER TABLE orders ADD COLUMN shipment JSONB;
