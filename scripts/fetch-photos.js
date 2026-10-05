#!/usr/bin/env node
// Download the photos listed in content/instagram/media.json into
// content/images/instagram/<shortcode>.jpg so the site can show them.
//
//   npm run photos            download any that are missing
//   npm run photos -- --force re-download everything
//
// Instagram's photo links expire after a few days. If downloads fail with 403,
// ask Claude to refresh content/instagram/media.json (it can re-pull fresh
// links from your connected Instagram account), or save the photos manually
// into content/images/instagram/ named <shortcode>.jpg.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/instagram/media.json'), 'utf8'));
const outDir = path.join(ROOT, 'content/images/instagram');
const force = process.argv.includes('--force');
fs.mkdirSync(outDir, { recursive: true });

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`not an image (${type || 'unknown type'})`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

(async () => {
  let ok = 0, skipped = 0;
  const failed = [];
  for (const m of media) {
    const file = path.join(outDir, `${m.shortcode}.jpg`);
    if (!force && fs.existsSync(file)) { skipped++; continue; }
    const sources = [m.src, `https://www.instagram.com/p/${m.shortcode}/media/?size=l`].filter(Boolean);
    let done = false;
    for (const src of sources) {
      try { await download(src, file); done = true; break; } catch (err) { m.error = err.message; }
    }
    if (done) { ok++; process.stdout.write('.'); } else failed.push(m);
  }
  console.log(`\nDownloaded ${ok}, already had ${skipped}, failed ${failed.length}.`);
  if (failed.length) {
    console.log('\nCould not download:');
    for (const m of failed) console.log(`  ${m.shortcode}  ${m.permalink}  (${m.error})`);
    console.log('\nThe links have probably expired. Ask Claude to refresh content/instagram/media.json,');
    console.log('or save these photos manually as content/images/instagram/<shortcode>.jpg');
  }
})();
