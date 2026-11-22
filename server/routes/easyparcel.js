import { Router } from 'express';
import { z } from 'zod';
import { HttpError, wrap } from '../lib/http.js';
import { audit } from '../lib/orders.js';
import { makeEasyParcel } from '../lib/easyparcel.js';

const text = n => z.string().trim().max(n);

// Public pieces EasyParcel calls: the OAuth return address and the tracking webhook. Mounted before the CSRF check (neither can send our header).
export function easyparcelPublic({ db, cfg }) {
  const r = Router(); const ep = makeEasyParcel({ db, cfg });
  r.get('/easyparcel/callback', wrap(async (req, res) => {
    const back = cfg.SITE_URL ? cfg.SITE_URL.replace(/\/$/, '') : '';
    const done = ok => res.redirect(`${back}/admin/billing/delivery?easyparcel=${ok}`);
    if (!ep.readState(req.query.state) || !req.query.code) return done('failed');
    try { await ep.connect(String(req.query.code), req); return done('connected') } catch { return done('failed') }
  }));
  // Always answers 200 quickly: EasyParcel retries on anything else. Only a known tracking number changes anything.
  r.post('/easyparcel/webhook', wrap(async (req, res) => { try { await ep.webhook(req.body || {}) } catch { /* never fail the webhook */ } res.json({ ok: true }) }));
  return r;
}

// Admin side: connect, pickup / parcel settings, courier prices, booking, tracking.
export default function easyparcelAdmin({ db, cfg, auth }) {
  const r = Router(); const ep = makeEasyParcel({ db, cfg });
  const staff = auth.role('owner', 'admin');

  r.get('/easyparcel/status', staff, wrap(async (_req, res) => res.json(await ep.status())));
  r.get('/easyparcel/connect', staff, wrap(async (req, res) => {
    if (!ep.configured()) throw new HttpError(409, 'EasyParcel keys are not set on the server yet (EASYPARCEL_CLIENT_ID and EASYPARCEL_CLIENT_SECRET).', 'not_configured');
    res.json({ url: ep.authUrl(req, req.user.id), redirectUri: ep.redirectUri(req) });
  }));
  r.post('/easyparcel/disconnect', staff, wrap(async (req, res) => { await ep.disconnect(); await audit(db, req.user.id, 'easyparcel.disconnect', 'settings', 'easyparcel', {}); res.json({ ok: true }) }));
  r.put('/easyparcel/settings', staff, wrap(async (req, res) => {
    const dim = z.number().min(1).max(300);
    const v = z.object({ pickup: z.object({ name: text(80), phone: text(20), address1: text(200), postcode: text(10), city: text(60).default('Singapore') }), parcel: z.object({ length: dim, width: dim, height: dim }) }).parse(req.body);
    res.json(await ep.saveSettings(v));
  }));

  r.post('/orders/:number/shipment/quotes', staff, wrap(async (req, res) => res.json(await ep.quotes(String(req.params.number)))));
  r.post('/orders/:number/shipment', staff, wrap(async (req, res) => {
    const b = z.object({ serviceId: text(20).min(1), collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.body);
    const s = await ep.book(String(req.params.number), b);
    await audit(db, req.user.id, 'easyparcel.book', 'order', req.params.number, { serviceId: b.serviceId }); res.status(201).json(s);
  }));
  r.post('/orders/:number/shipment/refresh', staff, wrap(async (req, res) => res.json(await ep.refresh(String(req.params.number)))));
  return r;
}
