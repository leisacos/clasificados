#!/usr/bin/env node
// Turn an official Instagram data export into blog post drafts.
//
// 1. Instagram app > Settings > Accounts Center > Your information and permissions
//    > Download your information > Some of your information > Content (Posts)
//    Format: JSON, Media quality: High.
// 2. Unzip it into ./instagram-export (or pass the folder path as an argument).
// 3. npm run import            (add --draft to import everything as drafts,
//                               --force to overwrite existing post files)
//
// Each Instagram post becomes content/posts/YYYY-MM-DD-slug.md with its photos
// copied into content/images/instagram/. Review the generated front matter:
// fill in city / country / iata so the booking buttons point at the right place.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const exportDir = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(ROOT, 'instagram-export'));
const postsDir = path.join(ROOT, 'content/posts');
const imagesDir = path.join(ROOT, 'content/images/instagram');

if (!fs.existsSync(exportDir)) {
  console.error(`Export folder not found: ${exportDir}\nUnzip your Instagram download there, or pass its path: npm run import -- /path/to/export`);
  process.exit(1);
}

// Instagram exports UTF-8 text double-encoded as Latin-1 ("Ã©" instead of "é").
const fixText = (s) => {
  if (!s) return '';
  try {
    const fixed = Buffer.from(s, 'latin1').toString('utf8');
    return fixed.includes('�') ? s : fixed;
  } catch { return s; }
};

function findFiles(dir, test, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(p, test, found);
    else if (test(entry.name)) found.push(p);
  }
  return found;
}

const COUNTRIES = ['Albania', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Bolivia', 'Bosnia', 'Brazil', 'Bulgaria', 'Cambodia', 'Canada',
  'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Czech Republic', 'Denmark', 'Dominican Republic',
  'Ecuador', 'Egypt', 'England', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Guatemala', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kenya', 'Laos', 'Latvia', 'Lithuania', 'Malaysia',
  'Maldives', 'Malta', 'Mexico', 'Montenegro', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Norway', 'Panama', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Romania', 'Scotland', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Türkiye', 'UAE', 'Dubai',
  'United Kingdom', 'UK', 'USA', 'United States', 'Uruguay', 'Venezuela', 'Vietnam',
  // Spanish spellings, common in Spanish-language captions
  'España', 'México', 'Perú', 'Panamá', 'Italia', 'Francia', 'Alemania', 'Grecia', 'Marruecos', 'Japón', 'Tailandia', 'Turquía',
  'Estados Unidos', 'Reino Unido', 'Países Bajos', 'Holanda', 'Suiza', 'Croacia', 'Brasil', 'República Dominicana', 'Egipto', 'Noruega'];
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const COUNTRY_BY_KEY = new Map(COUNTRIES.map((c) => [norm(c), c]));

function guessCountry(caption, tags) {
  for (const t of tags) { const c = COUNTRY_BY_KEY.get(norm(t)); if (c) return c; }
  const words = caption.split(/[^\p{L}]+/u);
  for (let i = 0; i < words.length; i++) {
    for (const n of [3, 2, 1]) {
      const c = COUNTRY_BY_KEY.get(norm(words.slice(i, i + n).join(' ')));
      if (c) return c;
    }
  }
  return '';
}

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');
const q = (s) => `"${String(s).replace(/"/g, "'")}"`;

const postFiles = findFiles(exportDir, (n) => /^posts_\d+\.json$/.test(n));
if (!postFiles.length) {
  console.error('No posts_*.json found. Make sure you chose JSON format and included "Posts" in the export.');
  process.exit(1);
}

fs.mkdirSync(postsDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

// Media URIs are relative to the export root, which may be a subfolder of exportDir.
function resolveMedia(uri) {
  const candidates = [path.join(exportDir, uri), ...postFiles.map((f) => {
    let dir = path.dirname(f);
    while (dir.startsWith(exportDir)) {
      const p = path.join(dir, uri);
      if (fs.existsSync(p)) return p;
      dir = path.dirname(dir);
    }
    return '';
  })];
  return candidates.find((p) => p && fs.existsSync(p));
}

let created = 0, skipped = 0;
const usedSlugs = new Set();

for (const file of postFiles) {
  const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const entry of entries) {
    const media = entry.media || [];
    if (!media.length) continue;
    const caption = fixText(entry.title || media[0].title || '').trim();
    const ts = entry.creation_timestamp || media[0].creation_timestamp;
    const date = new Date(ts * 1000).toISOString().slice(0, 10);

    const tags = [...new Set((caption.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1)))];
    const text = caption.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, '').trim(); // drop trailing hashtag block
    const firstLine = (text.split('\n').find((l) => l.trim()) || '').replace(/[#@]\S+/g, '').trim();
    const country = guessCountry(caption, tags);
    const title = firstLine
      ? firstLine.length > 70 ? firstLine.slice(0, 67).replace(/\s+\S*$/, '') + '…' : firstLine
      : `${country || 'Travel'} moments — ${date}`;

    let slug = slugify(title) || `post-${date}`;
    while (usedSlugs.has(slug)) slug += '-2';
    usedSlugs.add(slug);

    const outFile = path.join(postsDir, `${date}-${slug}.md`);
    if (fs.existsSync(outFile) && !flags.has('--force')) { skipped++; continue; }

    const images = [];
    media.forEach((m, i) => {
      const src = resolveMedia(m.uri);
      if (!src || !/\.(jpe?g|png|webp|heic)$/i.test(src)) return; // videos are linked via the Instagram embed instead
      const name = `${date}-${slug}-${i + 1}${path.extname(src).toLowerCase()}`;
      fs.copyFileSync(src, path.join(imagesDir, name));
      images.push(`/images/instagram/${name}`);
    });

    const paragraphs = text.split(/\n{2,}|\n/).map((l) => l.trim()).filter(Boolean);
    const excerpt = (paragraphs.join(' ').replace(/[#@]\S+/g, '').trim().slice(0, 155)) || title;
    const body = [
      ...paragraphs.slice(firstLine && paragraphs[0].includes(firstLine.slice(0, 20)) ? 1 : 0),
      '',
      '<!-- Expand this into a full story: where you stayed, how you got there, what it cost, tips. Longer posts rank better on Google. -->',
      '',
      ...images.slice(1).map((src, i) => `![${country ? `${country} photo ${i + 2}` : `Photo ${i + 2}`}](${src})`),
      '',
      '{{plan}}',
    ].join('\n\n').replace(/\n{3,}/g, '\n\n');

    const fm = [
      '---',
      `title: ${q(title)}`,
      `date: ${date}`,
      `city: ""`,
      `country: ${q(country)}`,
      `iata: ""`,
      `cover: ${q(images[0] || '')}`,
      `excerpt: ${q(excerpt)}`,
      `tags: [${tags.slice(0, 8).join(', ')}]`,
      `instagram: ""`,
      flags.has('--draft') ? 'draft: true' : null,
      '---',
    ].filter((l) => l !== null).join('\n');

    fs.writeFileSync(outFile, `${fm}\n\n${body}\n`);
    created++;
  }
}

console.log(`Imported ${created} posts (${skipped} already existed) into content/posts/.`);
console.log('Next: fill in city / country / iata in each file, delete the sample posts, then run: npm run dev');
