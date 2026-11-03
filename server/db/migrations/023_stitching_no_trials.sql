-- Trials and appointments are no longer part of the stitching workflow. Orders sitting at a trial stage go back to "stitching".
UPDATE stitch_orders SET status = 'stitching' WHERE status IN ('trial_scheduled', 'trial_completed');
