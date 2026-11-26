import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().transform(v => v || undefined),
  DB_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('dhanya'), // DHANYA lives in its own schema so it never mixes with other apps in a shared database
  PGLITE_DIR: z.string().default('./data/pgdata'), // 'memory' for tests
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  ADMIN_PASSWORD: z.string().min(8).optional().or(z.literal('').transform(() => undefined)),
  SITE_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)), // public site address HitPay returns customers to
  GOOGLE_MAPS_API_KEY: z.string().optional().transform(v => v || undefined), // browser Embed API key (restrict by referrer)
  GOOGLE_CLIENT_ID: z.string().optional().transform(v => v || undefined), // OAuth 2.0 Web client ID for "Sign in with Google"; the button is hidden until set
  HITPAY_API_KEY: z.string().optional().transform(v => v || undefined), // HitPay Dashboard -> Developers -> API Keys
  HITPAY_SALT: z.string().optional().transform(v => v || undefined), // webhook signing salt (Developers -> Webhooks)
  HITPAY_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  HITPAY_METHODS: z.string().optional().transform(v => v || undefined), // e.g. paynow_online,card
  HITPAY_BASE: z.string().url().optional().or(z.literal('').transform(() => undefined)), // only to point tests at a stub
  EASYPARCEL_CLIENT_ID: z.string().optional().transform(v => v || undefined), // Developer Hub -> Apps -> your app (courier booking)
  EASYPARCEL_CLIENT_SECRET: z.string().optional().transform(v => v || undefined),
  EASYPARCEL_BASE: z.string().url().optional().or(z.literal('').transform(() => undefined)), // only to point tests at a stub
  RESERVATION_MINUTES: z.coerce.number().default(35), // stock hold while the customer pays on HitPay
});

export function loadConfig(env = process.env) {
  const cfg = schema.parse(env);
  if (cfg.NODE_ENV === 'production') {
    if (cfg.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
    if (!cfg.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  }
  return cfg;
}
