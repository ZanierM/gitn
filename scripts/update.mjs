// Daily update: fetch feeds -> sort and tag stories -> write data/news/<date>.json
// Run with:  node scripts/update.mjs
// Test offline with saved feeds:  node scripts/update.mjs --fixtures path/to/folder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FEEDS, MAX_AGE_HOURS, NO_REPEAT_DAYS } from './config.mjs';
import { parseRss, makeLocator, classify, selectStories } from './lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const args = process.argv.slice(2);
const fixtures = args.includes('--fixtures') ? args[args.indexOf('--fixtures') + 1] : null;
const verbose = args.includes('--verbose');

const gaz = JSON.parse(fs.readFileSync(path.join(DATA, 'gazetteer.json')));
const glossary = JSON.parse(fs.readFileSync(path.join(DATA, 'glossary.json')));
const locate = makeLocator(gaz);

async function getFeed(feed) {
  if (fixtures) {
    const f = path.join(fixtures, feed.id + '.xml');
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(feed.url, { signal: ctrl.signal, headers: { 'user-agent': 'GeographyInTheNews/1.0 (school project)' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(timer); }
}

const now = Date.now();
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
// Stories already shown on recent days are skipped so each day feels fresh
const recentIds = new Set();
const newsDir = path.join(DATA, 'news');
if (fs.existsSync(newsDir)) {
  const prev = fs.readdirSync(newsDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < today).sort().slice(-NO_REPEAT_DAYS);
  for (const f of prev) for (const s of JSON.parse(fs.readFileSync(path.join(newsDir, f))).stories) recentIds.add(s.id);
}
const all = [], rejected = {};
for (const feed of FEEDS) {
  let xml = '';
  try { xml = await getFeed(feed); } catch (e) { console.warn(`! ${feed.id}: ${e.message}`); continue; }
  const items = parseRss(xml);
  let n = 0;
  for (const item of items) {
    if (item.published && now - Date.parse(item.published) > (feed.maxAgeHours || MAX_AGE_HOURS) * 36e5) continue;
    const r = classify(item, feed, locate, glossary);
    if (r.story && recentIds.has(r.story.id)) { rejected['shown recently'] = (rejected['shown recently'] || 0) + 1; continue; }
    if (r.story) { all.push(r.story); n++; }
    else { rejected[r.rejected] = (rejected[r.rejected] || 0) + 1; if (verbose) console.log(`  - [${r.rejected}] ${item.title}`); }
  }
  console.log(`${feed.id}: ${items.length} items, ${n} kept`);
}

const stories = selectStories(all);
const date = today; // YYYY-MM-DD, UK time
const out = { date, generated: new Date().toISOString(), count: stories.length, stories };
fs.mkdirSync(path.join(DATA, 'news'), { recursive: true });
fs.writeFileSync(path.join(DATA, 'news', `${date}.json`), JSON.stringify(out, null, 1));

// Index of available days (newest first)
const dates = fs.readdirSync(path.join(DATA, 'news')).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort().reverse();
fs.writeFileSync(path.join(DATA, 'news', 'index.json'), JSON.stringify({ latest: dates[0], dates }));

console.log(`\n${date}: ${stories.length} stories selected from ${all.length} candidates. Rejected:`, rejected);
if (verbose) for (const s of stories) console.log(`${s.featured ? '★' : ' '} [${s.seep.themes.join('/')}] ${s.place ? s.place.name : 'GLOBAL'}${s.conflict ? ' (conflict)' : ''} · ${s.score} · ${s.title}`);
