#!/usr/bin/env node
// Create tall Pinterest images (1000×1500) for every story, one per language:
// the cover photo, the place and the title, and the site's domain.
// Output: content/images/pins/<slug>-<lang>.jpg
//
//   npm run pins            create missing pins
//   npm run pins -- --force recreate all pins
//
// Needs Playwright with Chromium: npm i --no-save playwright && npx playwright install chromium

const fs = require('fs');
const path = require('path');
const { parseFrontMatter } = require('../src/markdown');
const { loc } = require('../src/i18n');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i --no-save playwright && npx playwright install chromium');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const LANGS = Object.keys(config.languages);
const outDir = path.join(ROOT, 'content/images/pins');
const force = process.argv.includes('--force');
fs.mkdirSync(outDir, { recursive: true });

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Fonts are bundled (SIL Open Font License) so pins look the same offline and in CI.
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64')}`;
const FONTS = { fraunces: font('fraunces-latin-700-normal.woff2'), inter: font('inter-latin-600-normal.woff2') };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function coverFile(cover) {
  if (!cover) return '';
  const rel = cover.startsWith('ig:') ? `images/instagram/${cover.slice(3)}.jpg` : cover.replace(/^\//, '');
  const file = path.join(ROOT, 'content', rel);
  return fs.existsSync(file) ? file : '';
}

function pinHtml({ photo, place, title, domain }) {
  const img = `data:image/jpeg;base64,${fs.readFileSync(photo).toString('base64')}`;
  // Long titles get a smaller font so they always fit.
  const size = title.length > 70 ? 66 : title.length > 50 ? 76 : 88;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family: Fraunces; font-weight: 700; src: url(${FONTS.fraunces}) format('woff2'); }
  @font-face { font-family: Inter; font-weight: 600; src: url(${FONTS.inter}) format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1000px; height: 1500px; position: relative; overflow: hidden; background: #1e2a2f; }
  .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 35%, rgba(0,0,0,.55) 62%, rgba(0,0,0,.85) 100%); }
  .text { position: absolute; left: 70px; right: 70px; bottom: 120px; color: #fff; }
  .place { font: 600 30px Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #ffb38f; margin-bottom: 26px; }
  h1 { font: 700 ${size}px/1.08 Fraunces, Georgia, serif; letter-spacing: -.01em; text-shadow: 0 2px 18px rgba(0,0,0,.35); }
  .domain { position: absolute; left: 70px; bottom: 54px; font: 600 28px Inter, system-ui, sans-serif; color: rgba(255,255,255,.88); }
  .domain span { display: inline-block; width: 38px; height: 4px; background: #e2673b; vertical-align: middle; margin-right: 14px; border-radius: 2px; }
</style></head><body>
<img class="photo" src="${img}"><div class="shade"></div>
<div class="text">${place ? `<div class="place">${esc(place)}</div>` : ''}<h1>${esc(title)}</h1></div>
<div class="domain"><span></span>${esc(domain)}</div>
</body></html>`;
}

(async () => {
  const domain = new URL(config.url).host;
  const postsDir = path.join(ROOT, 'content/posts');
  const jobs = [];
  for (const file of fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))) {
    const { data } = parseFrontMatter(fs.readFileSync(path.join(postsDir, file), 'utf8'));
    if (data.draft === true) continue;
    const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
    const photo = coverFile(data.cover);
    if (!photo) { console.log(`skip ${slug}: cover photo not downloaded yet`); continue; }
    for (const lang of LANGS) {
      const out = path.join(outDir, `${slug}-${lang}.jpg`);
      if (!force && fs.existsSync(out)) continue;
      const place = [loc(data, 'city', lang), loc(data, 'country', lang)].filter(Boolean).join(' · ');
      jobs.push({ out, html: pinHtml({ photo, place, title: loc(data, 'title', lang), domain }) });
    }
  }
  if (!jobs.length) { console.log('All pins are up to date.'); return; }

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  for (const job of jobs) {
    await page.setContent(job.html, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await page.screenshot({ path: job.out, type: 'jpeg', quality: 82 });
    console.log('pin', path.relative(ROOT, job.out));
  }
  await browser.close();
  console.log(`Created ${jobs.length} pins.`);
})();
