// Pemeriksaan ringan tanpa dependensi, dijalankan oleh CI sebelum deploy.
// 1) sintaks semua file .js  2) vercel.json valid  3) semua file yang dirujuk HTML/JS benar-benar ada
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
let failed = 0;
const fail = (msg) => { failed++; console.error('  GAGAL  ' + msg); };
const ok = (msg) => console.log('  OK     ' + msg);

const js = readdirSync(root).filter((f) => f.endsWith('.js'));
for (const f of js) {
  try { execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' }); ok('sintaks ' + f); }
  catch (e) { fail('sintaks ' + f + '\n' + e.stderr.toString()); }
}

try { JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')); ok('vercel.json valid'); }
catch (e) { fail('vercel.json: ' + e.message); }

const files = ['index.html', '404.html', ...js];
const seen = new Set();
for (const f of files) {
  const src = readFileSync(join(root, f), 'utf8');
  for (const m of src.matchAll(/(?:src|href)=["'](\/?(?:assets\/[^"'#?]+|[\w.-]+\.(?:js|css)))["']/g)) {
    const ref = m[1].replace(/^\//, '');
    if (seen.has(ref)) continue; seen.add(ref);
    existsSync(join(root, ref)) ? ok('ada ' + ref) : fail(`${f} merujuk ${ref}, file tidak ada`);
  }
}

if (failed) { console.error(`\n${failed} pemeriksaan gagal.`); process.exit(1); }
console.log('\nSemua pemeriksaan lolos.');
