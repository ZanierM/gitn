// Turns raw RSS feeds into a day's set of tagged, located geography stories.
// No AI: everything here is keyword rules and a place-name gazetteer.
import crypto from 'crypto';
import * as C from './config.mjs';

// ---------------- RSS parsing ----------------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', pound: '£', euro: '€' };
export function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
function stripHtml(s) {
  // Guardian descriptions are HTML: keep the first paragraph only
  const first = s.match(/<p>([\s\S]*?)<\/p>/i);
  const t = (first ? first[1] : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.replace(/\s*Continue reading\.*\s*$/i, '');
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1].trim() : '';
}
export function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const b = m[0];
    const title = decode(tag(b, 'title')).replace(/\s+/g, ' ').trim();
    const link = decode(tag(b, 'link')).trim();
    const desc = stripHtml(decode(tag(b, 'description')));
    const pub = tag(b, 'pubDate') || tag(b, 'dc:date');
    if (title && link) items.push({ title, link, summary: desc, published: pub ? new Date(pub).toISOString() : null });
  }
  return items;
}

// ---------------- Helpers ----------------
const rx = (src, flags = 'i') => new RegExp(`\\b(?:${src})`, flags);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function tidySummary(s, title) {
  if (!s || s.toLowerCase() === title.toLowerCase()) return '';
  if (s.length <= 320) return s;
  const cut = s.slice(0, 320);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '));
  return (end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…');
}

// ---------------- Location ----------------
export function makeLocator(gaz) {
  const entries = gaz.names.map(([text, a2, lat, lon, kind, w]) => ({
    text, a2, lat, lon, kind, w,
    re: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(text)}(?![\\p{L}\\p{N}])`, 'gu'),
  }));
  const falseRe = new RegExp(C.FALSE_PLACES.map(escapeRe).join('|'), 'g');

  return function locate(title, summary, hint = {}) {
    const scores = {}; // key -> { score, point }
    const scan = (text, weight) => {
      let t = text.replace(falseRe, (m) => ' '.repeat(m.length));
      for (const e of entries) {
        if (!t.includes(e.text)) continue;
        e.re.lastIndex = 0;
        let found = false;
        t = t.replace(e.re, (m) => { found = true; return ' '.repeat(m.length); });
        if (!found) continue;
        const key = e.a2 || 'R:' + e.text;
        const s = (scores[key] ||= { score: 0, point: null, a2: e.a2 });
        s.score += weight * e.w;
        const precise = e.kind === 'city' || e.kind === 'region';
        if (precise && (!s.point || s.point.kind === 'country')) s.point = e;
        if (!s.point) s.point = e;
      }
    };
    scan(title, 3);
    scan(summary, 1);
    const keys = Object.keys(scores);
    if (!keys.length) return null;
    // Feeds are UK-based, so Britain and the US are often mentioned as commentators
    if (keys.length > 1) for (const k of ['GB', 'US']) if (scores[k]) scores[k].score *= 0.5;
    if (hint.cont) for (const k of keys) {
      const c = gaz.countries[scores[k].a2];
      if (c && !hint.cont.includes(c.cont)) scores[k].score *= 0.3;
    }
    const ranked = keys.sort((a, b) => scores[b].score - scores[a].score);
    const best = scores[ranked[0]];
    if (best.score < 0.6) return null;
    const country = gaz.countries[best.a2];
    const p = best.point;
    const precise = p.kind === 'city' || p.kind === 'region';
    const name = precise ? (country && p.text !== country.name && p.kind === 'city' ? `${p.text}, ${country.name}` : p.text) : country?.name || p.text;
    const also = ranked.slice(1).filter((k) => scores[k].score >= best.score * 0.5 && gaz.countries[scores[k].a2])
      .map((k) => gaz.countries[scores[k].a2].name).filter((n) => n !== (country && country.name)).slice(0, 3);
    return {
      name, country: country?.name || null, iso: best.a2 || null,
      lat: precise ? p.lat : country?.lat ?? p.lat, lon: precise ? p.lon : country?.lon ?? p.lon,
      precision: precise ? 'place' : 'country', confidence: Math.min(1, best.score / 4), also,
    };
  };
}

// ---------------- SEEP, topics, key terms ----------------
const SEEP_RX = Object.fromEntries(Object.entries(C.SEEP).map(([k, v]) => [k, v.words.map(([src, w]) => [rx(src, 'gi'), w])]));
const TOPIC_RX = C.TOPICS.map((t) => ({ ...t, re: rx(t.words, 'gi') }));
const BLOCK_RX = rx(C.BLOCK), CONFLICT_RX = rx(C.CONFLICT), NOTGEO_RX = rx(C.NOT_GEOGRAPHY), SOFT_RX = rx(C.SOFT_PENALTY, 'gi');

export function classify(item, feed, locate, glossary) {
  const title = item.title, summary = item.summary || '';
  const both = `${title}. ${summary}`;
  if (BLOCK_RX.test(both)) return { rejected: 'safety' };
  if (NOTGEO_RX.test(title)) return { rejected: 'not geography' };
  if (/\bLIVE\b/.test(title)) return { rejected: 'live blog' };

  // SEEP scores: title words count more than summary words
  const seep = {}, why = {};
  for (const [k, pats] of Object.entries(SEEP_RX)) {
    let s = 0; const words = new Set();
    for (const [re, w] of pats) {
      re.lastIndex = 0;
      const inTitle = title.match(re), inSum = summary.match(re);
      if (inTitle || inSum) {
        s += w * (inTitle ? 1.5 : 1);
        for (const m of [...(inTitle || []), ...(inSum || [])].slice(0, 2)) words.add(m.toLowerCase());
      }
    }
    if (feed.hint?.seep === k) s += 2;
    seep[k] = s; why[k] = [...words].slice(0, 3);
  }
  seep.P *= 0.7; // politics-only stories are common, so need more support
  const themes = C.SEEP_ORDER.filter((k) => seep[k] >= 2.5).sort((a, b) => seep[b] - seep[a]);
  if (!themes.length) return { rejected: 'no SEEP match' };

  const topics = TOPIC_RX.map((t) => { t.re.lastIndex = 0; return { t, n: (both.match(t.re) || []).length }; })
    .filter((x) => x.n).sort((a, b) => b.n - a.n).map((x) => x.t);

  let score = Object.values(seep).reduce((a, b) => a + b, 0) / 2 + topics.length;
  const soft = both.match(SOFT_RX);
  if (soft) score -= 3 * Math.min(2, soft.length);
  if (score < C.MIN_SCORE) return { rejected: 'low score', score };

  const place = locate(title, summary, feed.hint || {});
  const conflict = CONFLICT_RX.test(both);
  const lower = both.toLowerCase();
  const terms = glossary.filter(([, pat]) => new RegExp(`\\b(?:${pat})`, 'i').test(lower)).map(([name]) => name).slice(0, 4);
  const where = place ? (place.country || (/^(Arctic|Antarctic$|Caribbean|Amazon|Sahel|Sahara|Alps|Andes|Himalayas|Mediterranean)/.test(place.name) ? 'the ' + place.name : place.name)) : 'the places involved';
  const qs = [];
  if (topics[0]) qs.push(topics[0].q[0]);
  if (topics[1]) qs.push(topics[1].q[0]); else if (topics[0]) qs.push(topics[0].q[1]);
  if (qs.length < 2) qs.push(...C.DEFAULT_Q.slice(0, 2 - qs.length));

  return {
    story: {
      id: crypto.createHash('sha1').update(item.link.split('?')[0]).digest('hex').slice(0, 12),
      title, summary: tidySummary(summary, title), link: item.link.split('?traffic_source')[0],
      source: feed.source, published: item.published,
      place, global: !place,
      seep: { primary: themes[0], themes, why: Object.fromEntries(themes.map((k) => [k, why[k]])) },
      topics: topics.slice(0, 3).map((t) => t.id), terms,
      questions: qs.map((q) => q.replace(/\{place\}/g, where)),
      conflict, score: Math.round(score * 10) / 10,
    },
  };
}

// ---------------- De-duplication and selection ----------------
const STOP = new Set('with from that this have after over into about their they will more than says said amid could would what when where which while been were also just year years people after before first last calls call'.split(' '));
const words = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)));
const jaccard = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (a.size + b.size - n || 1); };

export function selectStories(stories) {
  // Merge near-identical stories from different feeds
  const kept = [];
  for (const s of [...stories].sort((a, b) => b.score - a.score)) {
    const w = words(s.title);
    const dup = kept.find((k) => k.id === s.id || jaccard(k._w, w) >= 0.45 ||
      (k.place && s.place && k.place.name === s.place.name && k.topics[0] === s.topics[0] && [...w].filter((x) => k._w.has(x)).length >= 2));
    if (dup) { if (!dup.alsoIn.includes(s.source) && dup.source !== s.source) dup.alsoIn.push(s.source); continue; }
    kept.push({ ...s, _w: w, alsoIn: [] });
  }
  // Pick a balanced set: the best few from each SEEP theme first, then the rest by score
  const chosen = [], perCountry = {};
  const ok = (s) => (s.place?.iso ? (perCountry[s.place.iso] || 0) < C.MAX_PER_COUNTRY : true);
  const take = (s) => { chosen.push(s); if (s.place?.iso) perCountry[s.place.iso] = (perCountry[s.place.iso] || 0) + 1; };
  for (const k of C.SEEP_ORDER) {
    let n = 0;
    for (const s of kept) {
      if (n >= 4) break;
      if (s.seep.primary === k && !chosen.includes(s) && ok(s)) { take(s); n++; }
    }
  }
  for (const s of kept) {
    if (chosen.length >= C.MAX_STORIES) break;
    if (!chosen.includes(s) && ok(s)) take(s);
  }
  // Global stories (no place found) are capped so the globe stays useful
  let globals = 0;
  const final = chosen.filter((s) => !s.global || ++globals <= 4).sort((a, b) => b.score - a.score);
  final.forEach((s) => delete s._w);
  const pick = final.find((s) => !s.conflict && !s.global && s.topics.length >= 2) || final.find((s) => !s.conflict && !s.global) || final[0];
  if (pick) pick.featured = true;
  return final;
}
