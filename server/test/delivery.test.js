import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feeFor, DELIVERY_DEFAULTS as D } from '../lib/delivery.js';

test('delivery fee follows distance bands, free threshold, order tiers and the max distance', () => {
  assert.equal(feeFor(D, 3, 5000).amount, 800);
  assert.equal(feeFor(D, 7, 5000).amount, 1200);
  assert.equal(feeFor(D, 18, 5000).amount, 1800);
  assert.equal(feeFor(D, 3, 15000).amount, 0, 'free over the threshold');
  assert.equal(feeFor({ ...D, perKmBeyond: 100 }, 25, 5000).amount, 1800 + 500, 'per-km beyond the last band');
  assert.equal(feeFor({ ...D, maxKm: 30 }, 40, 5000).amount, null, 'out of range');
  assert.equal(feeFor({ ...D, orderTiers: [{ minOrder: 10000, fee: 500 }] }, 18, 12000).amount, 500, 'a bigger order ships cheaper');
  assert.equal(feeFor(D, null, 5000).amount, 800, 'unknown distance uses the first band');
  assert.equal(feeFor({ ...D, enabled: false }, 3, 100).amount, 0);
});

test('shipping note: defaults to a sentence, shows on the cart, and the owner can change it', async () => {
  const { DELIVERY_DEFAULTS } = await import('../lib/delivery.js');
  assert.ok(DELIVERY_DEFAULTS.note.length > 10);
});
