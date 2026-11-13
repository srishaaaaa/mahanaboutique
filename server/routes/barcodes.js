import { Router } from 'express';
import { z } from 'zod';
import { wrap } from '../lib/http.js';
import { lookupBarcode, generateBarcodeValue, receiveStockWithBarcode, listRegistry, deactivateBarcode, listBarcodeItems, listCustomSizes, saveCustomSize, deleteCustomSize, quickAddScanned } from '../lib/barcodes.js';

const id = z.coerce.number().int().positive();
const text = n => z.string().trim().max(n);
const size = z.object({ id: text(60).min(1), name: text(80).min(1), labelsPerRow: z.number().int().min(1).max(12), widthMm: z.number().positive().max(400), heightMm: z.number().positive().max(400), horizontalGapMm: z.number().min(0).max(50) });

// Barcode API. Cashiers can scan (look up); inventory staff, admins and the owner can generate, receive stock and save sizes; only admin/owner deactivate.
export default function barcodes({ db, auth }) {
  const r = Router();
  const scan = auth.role('owner', 'admin', 'cashier', 'inventory');
  const make = auth.role('owner', 'admin', 'inventory');
  const manager = auth.role('owner', 'admin');
  r.get('/lookup', scan, wrap(async (req, res) => res.json(await lookupBarcode(db, z.object({ code: text(64) }).parse(req.query).code))));
  r.get('/items', make, wrap(async (req, res) => res.json(await listBarcodeItems(db, z.object({ q: text(80).default('') }).parse(req.query).q))));
  r.post('/generate', make, wrap(async (_req, res) => res.json({ value: await generateBarcodeValue(db, 'variant') })));
  r.post('/receive', make, wrap(async (req, res) => {
    const d = z.object({ variantId: id, quantity: z.number().int().min(0).max(1_000_000).default(1), unitCost: z.number().int().min(0).nullable().optional(), customBarcode: text(64).nullable().optional(), note: text(200).default('') }).parse(req.body);
    res.json(await receiveStockWithBarcode(db, req.user, d));
  }));
  r.post('/quick-add', make, wrap(async (req, res) => {
    const d = z.object({ barcode: text(64).min(1), name: text(160).min(1), price: z.number().int().min(1).max(100_000_000), category: text(80).default(''), stock: z.number().int().min(0).max(1_000_000).default(0) }).parse(req.body);
    res.status(201).json(await quickAddScanned(db, req.user, d));
  }));
  r.get('/registry', make, wrap(async (req, res) => res.json(await listRegistry(db, z.object({ search: text(80).default(''), limit: z.coerce.number().default(50), offset: z.coerce.number().default(0) }).parse(req.query)))));
  r.post('/:id/deactivate', manager, wrap(async (req, res) => { await deactivateBarcode(db, req.user, id.parse(req.params.id)); res.json({ ok: true }); }));
  r.get('/sizes', scan, wrap(async (_req, res) => res.json(await listCustomSizes(db))));
  r.put('/sizes', make, wrap(async (req, res) => res.json(await saveCustomSize(db, size.parse(req.body)))));
  r.delete('/sizes/:sid', make, wrap(async (req, res) => { await deleteCustomSize(db, text(60).parse(req.params.sid)); res.json({ ok: true }); }));
  return r;
}
