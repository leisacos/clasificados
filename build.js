#!/usr/bin/env node
// Static site generator: content/ + static/ -> dist/
const fs = require('fs');
const path = require('path');
const { parseFrontMatter, renderMarkdown, escapeHtml } = require('./src/markdown');
const { createAffiliate } = require('./src/affiliate');
const { createTemplates } = require('./src/templates');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
if (process.env.BASE_PATH !== undefined) config.basePath = process.env.BASE_PATH;
if (process.env.SITE_URL) config.url = process.env.SITE_URL;
config.basePath = (config.basePath || '').replace(/\/$/, '');
config.url = config.url.replace(/\/$/, '');

const aff = createAffiliate(config);
const t = createTemplates(config, aff);

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Root-relative src/href in Markdown ("/images/x.jpg") need the base path prefix.
const withBase = (html) => html.replace(/(src|href)="\/(?!\/)/g, `$1="${config.basePath}/`);

function instagramEmbed(link) {
  if (!link || !config.instagram.embedPosts) return '';
  return `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(link)}" data-instgrm-version="14"><a href="${escapeHtml(link)}" target="_blank" rel="noopener">View this post on Instagram</a></blockquote>`;
}

function shortcodesFor(post) {
  const ctx = { city: post.city, country: post.country, iata: post.iata };
  return (name, arg) => {
    const local = arg ? { ...ctx, city: arg } : ctx;
    if (name === 'plan') return aff.planBox(local);
    if (name === 'instagram') {
      const embed = instagramEmbed(arg || post.instagram);
      return embed ? `${embed}<script async src="https://www.instagram.com/embed.js"></script>` : '';
    }
    if (['flights', 'hotels', 'tours', 'insurance', 'esim'].includes(name)) {
      return `<div class="inline-cta">${aff.button(name, local)}</div>`;
    }
    if (name === 'widget') return aff.widget(arg || 'flights');
    return '';
  };
}

// ---------- Load content ----------
const postsDir = path.join(ROOT, 'content/posts');
const posts = fs.readdirSync(postsDir)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const { data, body } = parseFrontMatter(fs.readFileSync(path.join(postsDir, file), 'utf8'));
    const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
    const words = body.split(/\s+/).filter(Boolean).length;
    return {
      ...data,
      slug,
      body,
      date: String(data.date || '1970-01-01').slice(0, 10),
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      countrySlug: data.country ? slugify(data.country) : '',
      readingTime: Math.max(1, Math.round(words / 220)),
    };
  })
  .filter((p) => p.draft !== true)
  .sort((a, b) => b.date.localeCompare(a.date));

const destMap = new Map();
for (const p of posts) {
  if (!p.country) continue;
  if (!destMap.has(p.countrySlug)) destMap.set(p.countrySlug, { name: p.country, slug: p.countrySlug, posts: [] });
  destMap.get(p.countrySlug).posts.push(p);
}
const destinations = [...destMap.values()].sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));

// ---------- Build ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'static'), OUT);
copyDir(path.join(ROOT, 'content/images'), path.join(OUT, 'images'));

write('index.html', t.home(posts, destinations));

for (const p of posts) {
  let html = withBase(renderMarkdown(p.body, shortcodesFor(p)));
  // Every post ends with the full trip-planning box unless the author placed one already.
  if (!/\{\{\s*plan/.test(p.body)) html += aff.planBox({ city: p.city, country: p.country, iata: p.iata });
  if (p.instagram && !/\{\{\s*instagram/.test(p.body) && config.instagram.embedPosts) {
    html += `<h2>See it on Instagram</h2>${instagramEmbed(p.instagram)}<script async src="https://www.instagram.com/embed.js"></script>`;
  }
  const related = posts.filter((o) => o !== p && (o.country === p.country || o.tags.some((tg) => p.tags.includes(tg)))).slice(0, 3);
  write(`posts/${p.slug}/index.html`, t.post(p, html, related));
}

write('destinations/index.html', t.destinationsIndex(destinations));
for (const d of destinations) write(`destinations/${d.slug}/index.html`, t.destination(d));

const pagesDir = path.join(ROOT, 'content/pages');
for (const file of fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md'))) {
  const { data, body } = parseFrontMatter(fs.readFileSync(path.join(pagesDir, file), 'utf8'));
  const slug = data.slug || slugify(file.replace(/\.md$/, ''));
  const html = withBase(renderMarkdown(body, shortcodesFor({})));
  const extra = slug === 'travel-resources' ? t.resourcesExtra() : '';
  write(`${slug}/index.html`, t.page({ ...data, slug }, html, extra));
}

write('404.html', t.notFound());

// Sitemap, robots, RSS
const urls = ['/', '/destinations/', ...posts.map((p) => `/posts/${p.slug}/`), ...destinations.map((d) => `/destinations/${d.slug}/`),
  ...fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md')).map((f) => `/${slugify(f.replace(/\.md$/, ''))}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${config.url}${u}</loc></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${escapeHtml(config.title)}</title><link>${config.url}/</link><description>${escapeHtml(config.description)}</description>
${posts.slice(0, 20).map((p) => `<item><title>${escapeHtml(p.title)}</title><link>${config.url}/posts/${p.slug}/</link><guid>${config.url}/posts/${p.slug}/</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${escapeHtml(p.excerpt || '')}</description></item>`).join('\n')}
</channel></rss>
`);
write('.nojekyll', '');

console.log(`Built ${posts.length} posts, ${destinations.length} destinations -> dist/`);
