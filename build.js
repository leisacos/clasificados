#!/usr/bin/env node
// Static site generator: content/ + static/ -> dist/
// Every page is generated once per language in site.config.json "languages"
// (the first language lives at the site root, the others under /<prefix>/).
const fs = require('fs');
const path = require('path');
const { parseFrontMatter, renderMarkdown, escapeHtml } = require('./src/markdown');
const { createAffiliate } = require('./src/affiliate');
const { createTemplates } = require('./src/templates');
const { loc } = require('./src/i18n');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
if (process.env.BASE_PATH !== undefined) config.basePath = process.env.BASE_PATH;
if (process.env.SITE_URL) config.url = process.env.SITE_URL;
config.basePath = (config.basePath || '').replace(/\/$/, '');
config.url = config.url.replace(/\/$/, '');

const LANGS = Object.keys(config.languages);
const DEFAULT = LANGS[0];
const aff = createAffiliate(config);
const t = createTemplates(config, aff);

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
const writeLang = (lang, rel, content) => write(path.join(config.languages[lang].prefix.replace(/^\//, ''), rel), content);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// An image path like /images/x.jpg only counts if the file exists in content/images.
const imageExists = (p) => typeof p === 'string' && p.startsWith('/images/') && fs.existsSync(path.join(ROOT, 'content', p));

// Root-relative src/href in Markdown ("/images/x.jpg") need the base path prefix.
const withBase = (html) => html.replace(/(src|href)="\/(?!\/)/g, `$1="${config.basePath}/`);

// Split a Markdown body into languages. Text before the first ":::xx" line is the
// default language; ":::es" starts the Spanish version, and so on.
function splitBodies(body) {
  const bodies = {};
  let current = DEFAULT;
  let buf = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^:::([a-z]{2})\s*$/);
    if (m) { bodies[current] = buf.join('\n').trim(); current = m[1]; buf = []; } else buf.push(line);
  }
  bodies[current] = buf.join('\n').trim();
  for (const k of Object.keys(bodies)) if (!bodies[k]) delete bodies[k];
  return bodies;
}

// ---------- Instagram media (from content/instagram/media.json) ----------
const mediaFile = path.join(ROOT, 'content/instagram/media.json');
const igMedia = (fs.existsSync(mediaFile) ? JSON.parse(fs.readFileSync(mediaFile, 'utf8')) : [])
  .map((m) => {
    const local = `/images/instagram/${m.shortcode}.jpg`;
    return { ...m, image: imageExists(local) ? local : '' };
  })
  .sort((a, b) => b.date.localeCompare(a.date));
const igByCode = new Map(igMedia.map((m) => [m.shortcode, m]));
const permalinkFor = (ref) => (/^https?:/.test(ref) ? ref : igByCode.get(ref)?.permalink || `https://www.instagram.com/p/${ref}/`);

function instagramEmbeds(refs) {
  if (!refs.length || !config.instagram.embedPosts) return '';
  const quotes = refs.map((r) => {
    const link = escapeHtml(permalinkFor(r));
    return `<blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14"><a href="${link}" target="_blank" rel="noopener">View on Instagram</a></blockquote>`;
  }).join('');
  return `<div class="ig-embeds">${quotes}</div><script async src="https://www.instagram.com/embed.js"></script>`;
}

function shortcodesFor(post, lang) {
  const ctx = { city: post.city, country: post.country, iata: post.iata, place: loc(post, 'city', lang) || loc(post, 'country', lang) };
  return (name, arg) => {
    const local = arg && name !== 'instagram' ? { ...ctx, city: arg, place: arg } : ctx;
    if (name === 'plan') return aff.planBox(local, lang);
    if (name === 'instagram') return instagramEmbeds(arg ? arg.split(/[\s,]+/).filter(Boolean) : post.instagram);
    if (aff.KINDS.includes(name)) return `<div class="inline-cta">${aff.button(name, local, lang)}</div>`;
    if (name === 'widget') return aff.widget(arg || 'flights', lang);
    return '';
  };
}

// ---------- Load posts ----------
const postsDir = path.join(ROOT, 'content/posts');
const posts = fs.readdirSync(postsDir)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const { data, body } = parseFrontMatter(fs.readFileSync(path.join(postsDir, file), 'utf8'));
    const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
    const bodies = splitBodies(body);
    const readingTime = {};
    for (const [l, b] of Object.entries(bodies)) readingTime[l] = Math.max(1, Math.round(b.split(/\s+/).length / 220));
    const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    // cover: a local image path, or "ig:<shortcode>" to use that Instagram post's downloaded photo
    let cover = data.cover || '';
    if (cover.startsWith('ig:')) cover = igByCode.get(cover.slice(3))?.image || '';
    else if (!imageExists(cover)) cover = '';
    return {
      ...data,
      slug,
      bodies,
      cover,
      readingTime,
      date: String(data.date || '1970-01-01').slice(0, 10),
      tags: toList(data.tags),
      instagram: toList(data.instagram).filter(Boolean),
      countrySlug: data.country ? slugify(data.country) : '',
      // Tall Pinterest images made by scripts/make-pins.js, one per language.
      pins: Object.fromEntries(LANGS.map((l) => [l, imageExists(`/images/pins/${slug}-${l}.jpg`) ? `/images/pins/${slug}-${l}.jpg` : ''])),
    };
  })
  .filter((p) => p.draft !== true)
  .sort((a, b) => b.date.localeCompare(a.date));

const destMap = new Map();
for (const p of posts) {
  if (!p.country) continue;
  if (!destMap.has(p.countrySlug)) destMap.set(p.countrySlug, { name: p.country, slug: p.countrySlug, posts: [] });
  const d = destMap.get(p.countrySlug);
  for (const l of LANGS) if (p[`country_${l}`] && !d[`name_${l}`]) d[`name_${l}`] = p[`country_${l}`];
  d.posts.push(p);
}
const destinations = [...destMap.values()].sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));

// ---------- Load pages ----------
const pagesDir = path.join(ROOT, 'content/pages');
const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md')).map((file) => {
  const { data, body } = parseFrontMatter(fs.readFileSync(path.join(pagesDir, file), 'utf8'));
  return { ...data, slug: data.slug || slugify(file.replace(/\.md$/, '')), bodies: splitBodies(body), instagram: [] };
});

// ---------- Build ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'static'), OUT);
copyDir(path.join(ROOT, 'content/images'), path.join(OUT, 'images'));

for (const lang of LANGS) {
  writeLang(lang, 'index.html', t.home(lang, posts, destinations, igMedia));

  for (const p of posts) {
    const md = p.bodies[lang] || p.bodies[DEFAULT] || '';
    let html = withBase(renderMarkdown(md, shortcodesFor(p, lang)));
    // Every post ends with the full trip-planning box unless the author placed one already.
    if (!/\{\{\s*plan/.test(md)) html += shortcodesFor(p, lang)('plan', '');
    if (p.instagram.length && !/\{\{\s*instagram/.test(md)) html += instagramEmbeds(p.instagram);
    const related = posts.filter((o) => o !== p && (o.country === p.country || o.tags.some((tg) => p.tags.includes(tg)))).slice(0, 3);
    writeLang(lang, `posts/${p.slug}/index.html`, t.post(lang, p, html, related));
  }

  writeLang(lang, 'destinations/index.html', t.destinationsIndex(lang, destinations));
  for (const d of destinations) writeLang(lang, `destinations/${d.slug}/index.html`, t.destination(lang, d));

  for (const pg of pages) {
    const html = withBase(renderMarkdown(pg.bodies[lang] || pg.bodies[DEFAULT] || '', shortcodesFor(pg, lang)));
    const extra = pg.slug === 'travel-resources' ? t.resourcesExtra(lang) : '';
    writeLang(lang, `${pg.slug}/index.html`, t.page(lang, pg, html, extra));
  }

  writeLang(lang, '404.html', t.notFound(lang));

  const feedPosts = posts.slice(0, 20);
  writeLang(lang, 'feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${escapeHtml(loc(config, 'title', lang))}</title><link>${t.abs(lang, '/')}</link><description>${escapeHtml(loc(config, 'description', lang))}</description><language>${lang}</language>
${feedPosts.map((p) => `<item><title>${escapeHtml(loc(p, 'title', lang))}</title><link>${t.abs(lang, `/posts/${p.slug}/`)}</link><guid>${t.abs(lang, `/posts/${p.slug}/`)}</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${escapeHtml(loc(p, 'excerpt', lang))}</description></item>`).join('\n')}
</channel></rss>
`);

  // Pinterest feed: Pinterest can auto-publish a pin for every item here
  // (Business account → Settings → Bulk create Pins → Auto-publish).
  const pinPosts = posts.filter((p) => p.pins[lang]);
  writeLang(lang, 'pins.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>
<title>${escapeHtml(loc(config, 'title', lang))}</title><link>${t.abs(lang, '/')}</link><description>${escapeHtml(loc(config, 'description', lang))}</description><language>${lang}</language>
${pinPosts.map((p) => {
    const img = `${config.url}${p.pins[lang]}`;
    const bytes = fs.statSync(path.join(ROOT, 'content', p.pins[lang])).size;
    const desc = `${loc(p, 'excerpt', lang)} ${p.tags.map((tg) => `#${tg}`).join(' ')}`.trim();
    return `<item><title>${escapeHtml(loc(p, 'title', lang))}</title><link>${t.abs(lang, `/posts/${p.slug}/`)}</link><guid>${t.abs(lang, `/posts/${p.slug}/`)}#pin</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${escapeHtml(desc)}</description><enclosure url="${img}" length="${bytes}" type="image/jpeg"/><media:content url="${img}" medium="image" type="image/jpeg" width="1000" height="1500"/></item>`;
  }).join('\n')}
</channel></rss>
`);
}

// Sitemap with hreflang alternates, robots
const paths = ['/', '/destinations/', ...posts.map((p) => `/posts/${p.slug}/`), ...destinations.map((d) => `/destinations/${d.slug}/`), ...pages.map((pg) => `/${pg.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.flatMap((p) => LANGS.map((lang) => `  <url><loc>${t.abs(lang, p)}</loc>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${t.abs(l, p)}"/>`).join('')}</url>`)).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
write('.nojekyll', '');

const missing = igMedia.filter((m) => !m.image).length;
console.log(`Built ${posts.length} posts × ${LANGS.length} languages, ${destinations.length} destinations -> dist/` +
  (missing ? `\n  ${missing} Instagram photos not downloaded yet — run: npm run photos` : ''));
