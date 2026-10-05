// Minimal, dependency-free front matter + Markdown renderer.
// Supports: headings, paragraphs, lists, blockquotes, images, links,
// bold/italic, inline code, horizontal rules, and {{shortcode}} lines.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((x) => unquote(x.trim())).filter(Boolean);
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  return unquote(v);
}

function unquote(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) data[kv[1]] = parseValue(kv[2]);
  }
  return { data, body: m[2] };
}

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}

// shortcode(name, arg) returns HTML for lines like {{hotels}} or {{tours Lisbon}}
function renderMarkdown(md, shortcode = () => '') {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // { type: 'ul'|'ol', items: [] }
  let quote = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if (/^\s*<!--.*-->\s*$/.test(line)) continue; // author notes, not rendered
    if ((m = line.match(/^\{\{\s*([a-z]+)\s*(.*?)\s*\}\}$/))) {
      flushAll();
      out.push(shortcode(m[1], m[2]));
    } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushAll();
      const level = Math.min(m[1].length + 1, 4); // # in posts renders as h2 (page h1 is the title)
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      out.push('<hr>');
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList();
      quote.push(m[1]);
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flushAll();
      const cap = m[1] ? `<figcaption>${escapeHtml(m[1])}</figcaption>` : '';
      out.push(`<figure><img src="${m[2]}" alt="${escapeHtml(m[1])}" loading="lazy">${cap}</figure>`);
    } else {
      flushList(); flushQuote();
      para.push(line.trim());
    }
  }
  flushAll();
  return out.join('\n');
}

module.exports = { parseFrontMatter, renderMarkdown, escapeHtml, inline };
