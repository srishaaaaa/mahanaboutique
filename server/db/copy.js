// Copies the whole shop from the old database into the one the site uses now: `npm run copy-db` (see DEPLOY.md).
//   OLD_DATABASE_URL  where the data is now (only read: nothing there is changed)
//   DATABASE_URL      the database the site uses. Every migration is run on it first, then every table is copied,
//                     uploaded photos and videos included. EVERYTHING already in its tables is replaced by the old data.
//   COPY_TO_PGLITE=1  practice run: copy into a throw-away in-memory PGlite database instead of DATABASE_URL.
import { loadConfig } from '../config.js';
import { createDb, migrate } from './index.js';

const env = { ...process.env };
const toPglite = !!process.env.COPY_TO_PGLITE;
if (!process.env.OLD_DATABASE_URL) { console.error('Set OLD_DATABASE_URL in .env to the database to copy from.'); process.exit(1) }
if (!toPglite && process.env.OLD_DATABASE_URL === process.env.DATABASE_URL) { console.error('OLD_DATABASE_URL and DATABASE_URL are the same database.'); process.exit(1) }
const src = await createDb(loadConfig({ ...env, DATABASE_URL: process.env.OLD_DATABASE_URL }));
const dst = await createDb(loadConfig(toPglite ? { ...env, DATABASE_URL: '', PGLITE_DIR: 'memory' } : env));
const q = (db, sql, p) => db.query(sql, p).then(r => r.rows);
const id = s => '"' + String(s).replace(/"/g, '""') + '"';

try {
  console.log('1/4  Creating every table in the new database (migrations)...');
  await migrate(dst, m => console.log('     ' + m));

  const tablesOf = db => q(db, `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'`).then(r => r.map(x => x.t));
  const srcTables = new Set(await tablesOf(src));
  const tables = (await tablesOf(dst)).filter(t => srcTables.has(t));

  // Parents before children, so every foreign key finds its row.
  const fks = await q(dst, `SELECT c.conrelid::regclass::text AS child, c.confrelid::regclass::text AS parent FROM pg_constraint c
    WHERE c.contype = 'f' AND c.connamespace = current_schema()::regnamespace`);
  const bare = s => s.replace(/^.*\./, '').replace(/"/g, '');
  const deps = new Map(tables.map(t => [t, new Set()]));
  for (const f of fks) { const c = bare(f.child), p = bare(f.parent); if (c !== p && deps.has(c) && deps.has(p)) deps.get(c).add(p) }
  const order = [], seen = new Set(), visiting = new Set();
  const visit = t => { if (seen.has(t) || visiting.has(t)) return; visiting.add(t); for (const p of deps.get(t)) visit(p); visiting.delete(t); seen.add(t); order.push(t) };
  tables.forEach(visit);

  console.log(`2/4  Clearing the new database's ${order.length} tables (rows the migrations added)...`);
  await dst.exec(`TRUNCATE ${order.map(id).join(', ')} RESTART IDENTITY CASCADE`);

  console.log('3/4  Copying...');
  // each column with its exact type (e.g. "text[]", "jsonb", "timestamp with time zone"), identity and generated flags
  const colsOf = (db, t) => q(db, `SELECT a.attname AS c, format_type(a.atttypid, a.atttypmod) AS ft, a.attidentity AS ident, a.attgenerated AS gen
    FROM pg_attribute a WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`, [id(t)]);
  const report = [];
  for (const t of order) {
    const sc = new Set((await colsOf(src, t)).map(c => c.c));
    const cols = (await colsOf(dst, t)).filter(c => sc.has(c.c) && !c.gen);
    if (!cols.length) continue;
    // Every value travels as text and is cast back to the column's own type, so dates, json and arrays arrive exactly as stored; file bytes travel as bytes.
    const sel = cols.map(c => c.ft === 'bytea' ? id(c.c) : `${id(c.c)}::text AS ${id(c.c)}`).join(', ');
    const page = cols.some(c => c.ft === 'bytea') ? 1 : 300;
    const override = cols.some(c => c.ident === 'a') ? ' OVERRIDING SYSTEM VALUE' : '';
    const pk = (await q(src, `SELECT a.attname AS c FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary`, [id(t)])).map(r => r.c);
    const orderBy = ` ORDER BY ${(pk.length ? pk : [cols[0].c]).map(id).join(', ')}`;
    let copied = 0;
    for (let off = 0; ; off += page) {
      const rows = await q(src, `SELECT ${sel} FROM ${id(t)}${orderBy} LIMIT ${page} OFFSET ${off}`);
      if (!rows.length) break;
      const params = [];
      const tuples = rows.map(r => '(' + cols.map(c => { params.push(r[c.c]); return c.ft === 'bytea' ? `$${params.length}::bytea` : `$${params.length}::text::${c.ft}` }).join(', ') + ')');
      await dst.query(`INSERT INTO ${id(t)} (${cols.map(c => id(c.c)).join(', ')})${override} VALUES ${tuples.join(', ')}`, params);
      copied += rows.length;
      if (rows.length < page) break;
    }
    // identity counters continue after the copied ids
    for (const c of cols.filter(c => c.ident)) await dst.query(`SELECT setval(pg_get_serial_sequence($1, $2), COALESCE((SELECT MAX(${id(c.c)}) FROM ${id(t)}), 0) + 1, false)`, [id(t), c.c]);
    report.push(t);
    console.log(`     ${t.padEnd(32)} ${copied}`);
  }

  console.log('4/4  Checking row counts...');
  let bad = 0;
  for (const t of report) {
    const a = (await q(src, `SELECT COUNT(*)::int AS n FROM ${id(t)}`))[0].n, b = (await q(dst, `SELECT COUNT(*)::int AS n FROM ${id(t)}`))[0].n;
    if (a !== b) { bad++; console.log(`     MISMATCH ${t}: old ${a}, new ${b}`) }
  }
  console.log(bad ? `Done with ${bad} mismatched table(s), see above.` : `Done. ${report.length} tables copied, every row count matches.`);
  if (bad) process.exitCode = 1;
} finally { await src.close(); await dst.close() }
