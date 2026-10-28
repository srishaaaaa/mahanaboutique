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
  STRIPE_SECRET_KEY: z.string().optional().transform(v => v || undefined), // sk_test_… / sk_live_… (Stripe Dashboard → Developers → API keys)
  STRIPE_WEBHOOK_SECRET: z.string().optional().transform(v => v || undefined), // whsec_… for https://<domain>/api/payments/webhook
  SITE_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)), // public site address Stripe returns customers to
  GOOGLE_MAPS_API_KEY: z.string().optional().transform(v => v || undefined), // browser Embed API key (restrict by referrer)
  GOOGLE_CLIENT_ID: z.string().optional().transform(v => v || undefined), // OAuth 2.0 Web client ID for "Sign in with Google"; the button is hidden until set
  RESERVATION_MINUTES: z.coerce.number().default(35), // stock hold during payment; Stripe needs at least 30
});

export function loadConfig(env = process.env) {
  const cfg = schema.parse(env);
  if (cfg.NODE_ENV === 'production') {
    if (cfg.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
    if (!cfg.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  }
  return cfg;
}
