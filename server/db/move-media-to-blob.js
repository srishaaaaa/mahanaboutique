// One-time move of uploaded files from Postgres (media_files) to Vercel Blob.
// For each stored file: upload it to Blob, then rewrite every "/api/media/<id>" link in the database
// (any text or JSON column, in any table) to the file's new https link. The media_files rows are kept,
// so nothing is lost if a step fails; delete them later with --delete-copied once the site looks right.
//
//   npm run media:to-blob -- --dry-run         list what would move, change nothing
//   npm run media:to-blob                      move every file and rewrite the links
//   npm run media:to-blob -- --delete-copied   also remove files from Postgres whose links were all rewritten
//
// Needs DATABASE_URL and BLOB_READ_WRITE_TOKEN (in ../.env). Safe to run again: files already moved are skipped
// because nothing links to their /api/media/<id> address any more.
import pg from 'pg';
import { put } from '@vercel/blob';

const dry = process.argv.includes('--dry-run');
const del = process.argv.includes('--delete-copied');
const { DATABASE_URL, BLOB_READ_WRITE_TOKEN } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!BLOB_READ_WRITE_TOKEN && !dry) throw new Error('BLOB_READ_WRITE_TOKEN is not set (create a Blob store in Vercel and copy its token into .env)');

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
const db = new pg.Client({ connectionString: DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : { rejectUnauthorized: false } });
await db.connect();

// every text / varchar / json / jsonb column in the public schema (except the file bytes themselves)
const cols = (await db.query(`SELECT table_name, column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND data_type IN ('text', 'character varying', 'json', 'jsonb') AND table_name <> 'media_files'`)).rows;
const q = s => '"' + s.replace(/"/g, '""') + '"';

// "/api/media/12" must not also match "/api/media/123"
const pattern = id => `/api/media/${id}(?![0-9])`;
async function linksTo(id) {
  let n = 0;
  for (const c of cols) n += Number((await db.query(`SELECT COUNT(*) AS n FROM ${q(c.table_name)} WHERE ${q(c.column_name)}::text ~ $1`, [pattern(id)])).rows[0].n);
  return n;
}
async function rewrite(id, url) {
  let n = 0;
  for (const c of cols) {
    const cast = c.data_type === 'json' || c.data_type === 'jsonb' ? `::${c.data_type}` : '';
    const r = await db.query(`UPDATE ${q(c.table_name)} SET ${q(c.column_name)} = regexp_replace(${q(c.column_name)}::text, $1, $2, 'g')${cast} WHERE ${q(c.column_name)}::text ~ $1`, [pattern(id), url]);
    if (r.rowCount) { n += r.rowCount; console.log(`    ${c.table_name}.${c.column_name}: ${r.rowCount} row(s)`) }
  }
  return n;
}

const files = (await db.query('SELECT id, mime, bytes, original_name FROM media_files ORDER BY id')).rows;
console.log(`${files.length} file(s) stored in Postgres${dry ? ' (dry run: nothing will change)' : ''}`);
let moved = 0, skipped = 0, deleted = 0;
for (const f of files) {
  const used = await linksTo(f.id);
  if (!used) {
    skipped++;
    if (del && !dry) { await db.query('DELETE FROM media_files WHERE id = $1', [f.id]); deleted++ }
    continue;
  }
  console.log(`#${f.id} ${f.mime} ${(f.bytes / 1024 / 1024).toFixed(2)} MB, linked ${used} time(s)`);
  if (dry) continue;
  const { data } = (await db.query('SELECT data FROM media_files WHERE id = $1', [f.id])).rows[0];
  const kind = f.mime.startsWith('video/') ? 'videos' : 'images';
  const blob = await put(`media/${kind}/legacy-${f.id}.${EXT[f.mime] || 'bin'}`, data, {
    access: 'public', contentType: f.mime, token: BLOB_READ_WRITE_TOKEN, addRandomSuffix: true, cacheControlMaxAge: 365 * 24 * 60 * 60,
  });
  console.log(`    -> ${blob.url}`);
  await db.query('BEGIN');
  try { await rewrite(f.id, blob.url); await db.query('COMMIT') } catch (e) { await db.query('ROLLBACK'); throw e }
  moved++;
}
console.log(`done: ${moved} moved to Blob, ${skipped} not linked anywhere${del ? `, ${deleted} removed from Postgres` : ''}`);
await db.end();
