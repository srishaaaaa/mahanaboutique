# Deploying DHANYA as ONE project (Vercel)

The repository holds a Vite client (`client/`) and an Express API (`server/`). They deploy together as a single
project: the client is built to static files and the API runs as one serverless function (`api/index.js`).
`vercel.json` already routes `/api/*` to the function and every other path to the single-page app.

## Import
1. In Vercel choose **Add New → Project** and import the repository.
2. If Vercel says *“Multiple applications detected”*, **do not** import `client` and `server` separately.
   Keep **Root Directory = `./`** and set the **Framework Preset to “Other”**. `vercel.json` then builds both.
3. Add the environment variables below (Production), then deploy.

## Environment variables
| Name | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres URL (Neon/Supabase). Required in production. |
| `DB_SCHEMA` | Optional, e.g. `dhanya` to keep DHANYA in its own schema of a shared database. |
| `JWT_SECRET` | 32+ random characters. |
| `HITPAY_API_KEY`, `HITPAY_SALT`, `HITPAY_ENV` | HitPay keys (HitPay Dashboard → Developers → API Keys; use `sandbox` first, then `live`). Webhook URL: `https://<your-domain>/api/payments/webhook`; the salt checks its signature. Optional `HITPAY_METHODS` to limit the methods (e.g. `paynow_online,card`); leave it unset to offer whatever is switched on in HitPay. |
| `SITE_URL` | Public site address, e.g. `https://mahana.sg`, where HitPay returns customers after paying. |
| `GOOGLE_CLIENT_ID` | Turns on "Continue with Google" on the sign-in and register pages. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Add `https://<your-domain>` and `http://localhost:5173` under **Authorised JavaScript origins**. No client secret is needed. |
| `GOOGLE_MAPS_API_KEY` | Optional Maps Embed key (restrict it by HTTP referrer). |
| `PG_POOL_MAX` | `3` is plenty per serverless instance. |
| `RESERVATION_MINUTES` | Optional, default 30. |

`CLIENT_ORIGIN` is not needed: the site and API share one origin, so cookies work without CORS.

## First-time database setup (run once from your machine)
```
set DATABASE_URL=<production url>    # PowerShell: $env:DATABASE_URL="..."
set DB_SCHEMA=dhanya                 # if you use a schema
npm run migrate --prefix server
npm run seed --prefix server         # optional: sample catalogue + sample reviews
```
Migrations are not run on every cold start in production; run `npm run migrate` after pulling new migrations.

## Notes
* Uploaded images are stored in Postgres (see Admin → Products & images), so there is no disk to persist.
  Vercel limits a request body to ~4.5 MB; the admin uploader shrinks photos before sending.
* The admin owner account is created by the seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (set them only for that step).

## Keeping database usage low (read before changing caching, media or polling)
The database is on Neon's free plan, which has a monthly allowance for compute time and network transfer.
In November 2026 it ran out and the whole site showed "could not be loaded" (Neon error 53000, "exceeded the quota")
until the plan was upgraded or the month reset. These rules keep that from happening again:

- **Public catalogue reads stay edge-cached** (`server/app.js`, `PUBLIC_CACHE`): at least `s-maxage=300` with a long
  `stale-while-revalidate`. A test (`server/test/focus.test.js`) fails if this is shortened.
- **Uploaded photos and videos are read from the database as rarely as possible**: they are cached by Vercel's CDN and in
  server memory (`server/routes/media.js`). Keep videos small (4 MB); every byte read from the database counts against the allowance.
- **`/api/health` does not touch the database** (add `?db=1` for a database check). Point uptime monitors at it, never at a data endpoint.
- **No fast polling.** Admin pages refresh at most every 2 minutes, and only while the tab is visible.
- If the site suddenly can't load data, check the Neon dashboard's usage page first.

## Moving to a new database

1. Create the new Postgres database (e.g. a new Neon project in Singapore) and copy its connection string.
2. In `.env`, put the current database's address in `OLD_DATABASE_URL` and the new one in `DATABASE_URL`.
3. `npm run copy-db --prefix server` creates every table on the new database (all migrations) and copies every table
   from the old one: products, bills, customers, settings and uploaded photos and videos. Anything already in the new
   database is replaced. The old database is only read. It ends by checking that every table has the same number of rows.
4. In Vercel → Settings → Environment Variables, set `DATABASE_URL` to the new address and redeploy.
