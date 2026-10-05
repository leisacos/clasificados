#!/usr/bin/env node
// Local preview server for dist/ (honours basePath).
// With --watch: rebuilds when content/, static/, src/ or site.config.json change
// and live-reloads open browser tabs.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const root = path.join(ROOT, 'dist');
const watch = process.argv.includes('--watch');
const port = Number(process.env.PORT) || 8080;
const readBase = () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
  return (process.env.BASE_PATH ?? config.basePath ?? '').replace(/\/$/, '');
};
let base = readBase();

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.mp4': 'video/mp4' };

const clients = new Set();
const RELOAD_SNIPPET = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;

function build() {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit', cwd: ROOT });
    return true;
  } catch {
    console.error('Build failed — fix the error above and save again.');
    return false;
  }
}

function send(res, status, file) {
  const type = types[path.extname(file)] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  if (watch && type.startsWith('text/html')) {
    return res.end(fs.readFileSync(file, 'utf8').replace('</body>', `${RELOAD_SNIPPET}</body>`));
  }
  fs.createReadStream(file).pipe(res);
}

if (watch || !fs.existsSync(root)) build();

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    return req.on('close', () => clients.delete(res));
  }
  if (base && (p === '/' || p === '')) { res.writeHead(302, { Location: `${base}/` }); return res.end(); }
  if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return send(res, 404, path.join(root, '404.html'));
  send(res, 200, file);
}).listen(port, () => {
  console.log(`\n  Preview: http://localhost:${port}${base}/`);
  if (watch) console.log('  Watching for changes — the browser reloads automatically. Ctrl+C to stop.\n');
});

if (watch) {
  let timer;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      base = readBase();
      if (build()) for (const c of clients) c.write('data: reload\n\n');
    }, 150);
  };
  for (const target of ['content', 'static', 'src', 'build.js', 'site.config.json']) {
    const full = path.join(ROOT, target);
    if (!fs.existsSync(full)) continue;
    try {
      fs.watch(full, { recursive: fs.statSync(full).isDirectory() }, onChange);
    } catch {
      fs.watch(full, onChange); // recursive watching unsupported on this platform
    }
  }
}
