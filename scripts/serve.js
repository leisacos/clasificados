#!/usr/bin/env node
// Tiny static server for previewing dist/ locally (honours basePath).
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('../site.config.json');
const base = (process.env.BASE_PATH ?? config.basePath ?? '').replace(/\/$/, '');
const root = path.join(__dirname, '..', 'dist');
const port = process.env.PORT || 8080;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(fs.readFileSync(path.join(root, '404.html'))); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Preview: http://localhost:${port}${base}/`));
