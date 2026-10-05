#!/usr/bin/env node
// SEO audit of every story: word counts, FAQ, links, title/description length
// and when it was last touched. Prints a table sorted by how much each story
// would gain from an improvement, and recommends the top one.
//
//   npm run audit            table + recommendation
//   npm run audit -- --json  machine-readable output (used by the daily sync)

const fs = require('fs');
const path = require('path');
const { parseFrontMatter } = require('../src/markdown');

const ROOT = path.join(__dirname, '..');
const postsDir = path.join(ROOT, 'content/posts');
const today = new Date().toISOString().slice(0, 10);
const daysSince = (d) => Math.round((Date.parse(today) - Date.parse(d)) / 864e5);
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function split(body) {
  const i = body.search(/^:::es\s*$/m);
  return i < 0 ? { en: body, es: '' } : { en: body.slice(0, i), es: body.slice(i).replace(/^:::es\s*$/m, '') };
}
const words = (md) => md.replace(/\{\{[^}]*\}\}/g, '').split(/\s+/).filter((w) => /\w/.test(w)).length;
const hasFaq = (md) => /^#\s+(faq|frequently asked questions|preguntas frecuentes)\s*$/im.test(md);
const internalLinks = (md) => [...md.matchAll(/\]\((\/(?:es\/)?posts\/[^)#]+)\)/g)].map((m) => m[1]);

const posts = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md')).map((file) => {
  const { data, body } = parseFrontMatter(fs.readFileSync(path.join(postsDir, file), 'utf8'));
  const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
  const { en, es } = split(body);
  return {
    file: `content/posts/${file}`,
    slug,
    draft: data.draft === true,
    lastTouched: String(data.updated || data.date || '1970-01-01').slice(0, 10),
    improved: Boolean(data.updated),
    words: { en: words(en), es: words(es) },
    faq: { en: hasFaq(en), es: hasFaq(es) },
    linksOut: new Set(internalLinks(en).map((l) => l.replace(/^\/es/, ''))).size,
    titleLen: { en: String(data.title || '').length, es: String(data.title_es || '').length },
    excerptLen: { en: String(data.excerpt || '').length, es: String(data.excerpt_es || '').length },
    allLinks: [...internalLinks(en), ...internalLinks(es)],
  };
}).filter((p) => !p.draft);

for (const p of posts) {
  p.linksIn = posts.filter((o) => o !== p && o.allLinks.some((l) => l.replace(/^\/es/, '') === `/posts/${p.slug}/`)).length;
  const issues = [];
  if (!p.faq.en || !p.faq.es) issues.push('no FAQ');
  if (Math.min(p.words.en, p.words.es || p.words.en) < 600) issues.push(`short (${p.words.en}/${p.words.es} words)`);
  if (!p.words.es) issues.push('no Spanish');
  if (p.linksOut < 2) issues.push(`${p.linksOut} links out`);
  if (p.linksIn < 1) issues.push('no links in');
  for (const l of ['en', 'es']) {
    if (p.titleLen[l] && (p.titleLen[l] < 40 || p.titleLen[l] > 70)) issues.push(`title_${l} ${p.titleLen[l]} chars`);
    if (p.excerptLen[l] && (p.excerptLen[l] < 120 || p.excerptLen[l] > 165)) issues.push(`excerpt_${l} ${p.excerptLen[l]} chars`);
  }
  p.issues = issues;
  // Score: missing FAQ and thin content matter most; recently touched stories wait.
  const age = daysSince(p.lastTouched);
  p.score = (!p.faq.en || !p.faq.es ? 30 : 0)
    + Math.max(0, 600 - Math.min(p.words.en, p.words.es || 0)) / 20
    + (p.linksOut < 2 ? 10 : 0) + (p.linksIn < 1 ? 10 : 0)
    + issues.filter((i) => /title|excerpt/.test(i)).length * 3
    + Math.min(age, 90) / 6
    // Give new stories 3 days, and never improve the same story twice within two weeks.
    - ((p.improved && age < 14) || age < 3 ? 100 : 0);
  p.score = Math.round(p.score);
}
for (const p of posts) delete p.allLinks;

posts.sort((a, b) => b.score - a.score);
const pick = posts.find((p) => p.score > 0) || null;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ today, recommendation: pick && pick.file, posts }, null, 2));
} else {
  console.log('score  words(en/es)  faq  in/out  last touched  story');
  for (const p of posts) {
    console.log(`${String(p.score).padStart(5)}  ${`${p.words.en}/${p.words.es}`.padEnd(12)}  ${p.faq.en && p.faq.es ? 'yes' : 'no '}  ${`${p.linksIn}/${p.linksOut}`.padEnd(6)}  ${p.lastTouched}    ${p.slug}${p.issues.length ? `  [${p.issues.join(', ')}]` : ''}`);
  }
  console.log(pick ? `\nRecommended: ${pick.file}` : '\nNothing needs improving right now.');
}
