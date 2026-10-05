const { escapeHtml: e } = require('./markdown');

function createTemplates(config, aff) {
  const base = config.basePath || '';
  const url = (p) => `${base}${p}`;
  const ig = config.instagram && config.instagram.handle;
  const igUrl = ig ? `https://www.instagram.com/${ig}/` : '';

  const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  function cover(post, cls = '') {
    if (post.cover) return `<img class="${cls}" src="${e(url(post.cover))}" alt="${e(post.coverAlt || post.title)}" loading="lazy">`;
    // Gradient placeholder until a real photo is added.
    const hue = [...post.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `<div class="${cls} placeholder" style="--h:${hue}"><span>${e(post.city || post.country || post.title)}</span></div>`;
  }

  function card(post) {
    return `<article class="card">
  <a href="${url(`/posts/${post.slug}/`)}" class="card-link">
    <div class="card-media">${cover(post, 'card-img')}</div>
    <div class="card-body">
      ${post.country ? `<span class="kicker">${e([post.city, post.country].filter(Boolean).join(', '))}</span>` : ''}
      <h3>${e(post.title)}</h3>
      <p>${e(post.excerpt || '')}</p>
      <time datetime="${post.date}">${fmtDate(post.date)}</time>
    </div>
  </a>
</article>`;
  }

  function layout({ title, description, path, body, image, type = 'website', jsonLd }) {
    const fullTitle = title ? `${title} · ${config.title}` : `${config.title} · ${config.tagline}`;
    const desc = description || config.description;
    const canonical = `${config.url}${path}`;
    const ogImage = image ? `${config.url}${image}` : '';
    const tp = config.travelpayouts || {};
    return `<!doctype html>
<html lang="${config.language || 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(desc)}">
<link rel="canonical" href="${e(canonical)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${e(title || config.title)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:url" content="${e(canonical)}">
${ogImage ? `<meta property="og:image" content="${e(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="alternate" type="application/rss+xml" title="${e(config.title)}" href="${url('/feed.xml')}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${url('/css/style.css')}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${tp.driveScript || ''}
</head>
<body data-tp-marker="${e(tp.marker || '')}" data-tp-trs="${e(tp.trs || '')}" data-tp-flights="${e((tp.programs && tp.programs.flights) || '')}" data-origin="${e(tp.defaultOrigin || '')}">
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${url('/')}">🧭 ${e(config.title)}</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu">☰</button>
    <nav id="nav" class="nav">
      <a href="${url('/')}">Home</a>
      <a href="${url('/destinations/')}">Destinations</a>
      <a href="${url('/travel-resources/')}">Travel resources</a>
      <a href="${url('/about/')}">About</a>
      ${igUrl ? `<a class="nav-ig" href="${igUrl}" target="_blank" rel="noopener">@${e(ig)}</a>` : ''}
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <div>
      <p class="logo">🧭 ${e(config.title)}</p>
      <p>${e(config.tagline)}</p>
      ${igUrl ? `<p><a href="${igUrl}" target="_blank" rel="noopener">Follow @${e(ig)} on Instagram</a></p>` : ''}
    </div>
    <div class="footer-links">
      <a href="${url('/destinations/')}">Destinations</a>
      <a href="${url('/travel-resources/')}">Travel resources</a>
      <a href="${url('/disclosure/')}">Affiliate disclosure</a>
      <a href="${url('/privacy/')}">Privacy</a>
      <a href="${url('/feed.xml')}">RSS</a>
    </div>
  </div>
  <p class="wrap fine">Some links on this site are affiliate links. If you book through them I may earn a commission at no extra cost to you. © ${new Date().getFullYear()} ${e(config.author.name)}</p>
</footer>
<script src="${url('/js/main.js')}" defer></script>
</body>
</html>`;
  }

  function home(posts, destinations) {
    const [featured, ...rest] = posts;
    const flightsWidget = aff.widget('flights');
    const body = `
<section class="hero">
  <div class="wrap hero-inner">
    <p class="kicker">Travel stories by @${e(ig || config.author.name)}</p>
    <h1>${e(config.tagline)}</h1>
    <p class="lead">${e(config.description)}</p>
    <div class="hero-actions">
      <a class="btn" href="${url('/destinations/')}">Explore destinations</a>
      ${igUrl ? `<a class="btn btn-ghost" href="${igUrl}" target="_blank" rel="noopener">See it on Instagram</a>` : ''}
    </div>
  </div>
</section>
${featured ? `
<section class="wrap featured">
  <a href="${url(`/posts/${featured.slug}/`)}" class="featured-link">
    <div class="featured-media">${cover(featured, 'featured-img')}</div>
    <div class="featured-body">
      <span class="kicker">Latest story · ${e([featured.city, featured.country].filter(Boolean).join(', '))}</span>
      <h2>${e(featured.title)}</h2>
      <p>${e(featured.excerpt || '')}</p>
      <span class="read-more">Read the story →</span>
    </div>
  </a>
</section>` : ''}
<section class="wrap"><div class="search-panel">
  <h2>Where to next?</h2>
  ${flightsWidget || `<p>Compare cheap flights, hotels and things to do — the same tools I use to plan every trip.</p>
  <div class="cta-grid">${['flights', 'hotels', 'tours'].map((k) => aff.button(k)).join('')}</div>`}
</div></section>
${rest.length ? `
<section class="wrap">
  <h2 class="section-title">More stories</h2>
  <div class="grid">${rest.map(card).join('')}</div>
</section>` : ''}
${destinations.length ? `
<section class="wrap">
  <h2 class="section-title">Destinations</h2>
  <div class="chips">${destinations.map((d) => `<a class="chip" href="${url(`/destinations/${d.slug}/`)}">${e(d.name)} <small>${d.posts.length}</small></a>`).join('')}</div>
</section>` : ''}
<section class="wrap">
  ${aff.planBox()}
</section>`;
    return layout({
      path: '/',
      body,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Blog', name: config.title, url: config.url, description: config.description },
    });
  }

  function post(p, html, related) {
    const ctx = { city: p.city, country: p.country, iata: p.iata };
    const hotelsWidget = aff.widget('hotels');
    const body = `
<article class="post">
  <header class="post-hero">
    ${cover(p, 'post-cover')}
    <div class="wrap post-head">
      ${p.country ? `<a class="kicker" href="${url(`/destinations/${p.countrySlug}/`)}">${e([p.city, p.country].filter(Boolean).join(', '))}</a>` : ''}
      <h1>${e(p.title)}</h1>
      <p class="meta">By ${e(config.author.name)} · <time datetime="${p.date}">${fmtDate(p.date)}</time>${p.readingTime ? ` · ${p.readingTime} min read` : ''}</p>
    </div>
  </header>
  <div class="wrap post-layout">
    <div class="prose">
      <p class="disclosure-note">This post contains affiliate links. <a href="${url('/disclosure/')}">Learn more</a>.</p>
      ${html}
      ${p.tags && p.tags.length ? `<p class="tags">${p.tags.map((t) => `<span>#${e(t)}</span>`).join(' ')}</p>` : ''}
    </div>
    <aside class="sidebar">
      <div class="sticky">
        <div class="side-box">
          <h3>Plan this trip</h3>
          ${['flights', 'hotels', 'tours'].map((k) => aff.button(k, ctx)).join('')}
        </div>
        ${hotelsWidget ? `<div class="side-box">${hotelsWidget}</div>` : ''}
        <div class="side-box small">
          <h3>Don't travel without</h3>
          ${['insurance', 'esim'].map((k) => aff.button(k, ctx)).join('')}
        </div>
      </div>
    </aside>
  </div>
  ${related.length ? `<section class="wrap"><h2 class="section-title">You might also like</h2><div class="grid">${related.map(card).join('')}</div></section>` : ''}
</article>`;
    return layout({
      title: p.title,
      description: p.excerpt,
      path: `/posts/${p.slug}/`,
      image: p.cover || '',
      type: 'article',
      body,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: p.title,
        datePublished: p.date,
        author: { '@type': 'Person', name: config.author.name },
        description: p.excerpt,
        ...(p.cover ? { image: `${config.url}${p.cover}` } : {}),
        ...(p.city || p.country ? { contentLocation: { '@type': 'Place', name: [p.city, p.country].filter(Boolean).join(', ') } } : {}),
      },
    });
  }

  function destinationsIndex(destinations) {
    const body = `
<section class="page-head wrap">
  <h1>Destinations</h1>
  <p class="lead">Every country I've written about, with guides and booking tips for each.</p>
</section>
<section class="wrap dest-grid">
  ${destinations.map((d) => `<a class="dest-card" href="${url(`/destinations/${d.slug}/`)}">
    ${cover(d.posts[0], 'dest-img')}
    <span class="dest-name">${e(d.name)}<small>${d.posts.length} ${d.posts.length === 1 ? 'story' : 'stories'}</small></span>
  </a>`).join('')}
</section>`;
    return layout({ title: 'Destinations', path: '/destinations/', body });
  }

  function destination(d) {
    const body = `
<section class="page-head wrap">
  <p class="kicker"><a href="${url('/destinations/')}">Destinations</a></p>
  <h1>${e(d.name)} travel guide</h1>
  <p class="lead">Stories and tips from my trips to ${e(d.name)}.</p>
</section>
<section class="wrap"><div class="grid">${d.posts.map(card).join('')}</div></section>
<section class="wrap">${aff.planBox({ country: d.name, iata: d.posts.find((p) => p.iata)?.iata })}</section>`;
    return layout({ title: `${d.name} travel guide`, description: `Travel stories, itineraries and booking tips for ${d.name}.`, path: `/destinations/${d.slug}/`, body });
  }

  function page(p, html, extra = '') {
    const body = `
<section class="page-head wrap"><h1>${e(p.title)}</h1></section>
<section class="wrap narrow prose">${html}</section>
${extra}`;
    return layout({ title: p.title, description: p.description, path: `/${p.slug}/`, body });
  }

  function resourcesExtra() {
    const fw = aff.widget('flights');
    const hw = aff.widget('hotels');
    return `<section class="wrap narrow">
  ${fw ? `<div class="side-box">${fw}</div>` : ''}
  ${hw ? `<div class="side-box">${hw}</div>` : ''}
</section>`;
  }

  function notFound() {
    return layout({
      title: 'Page not found',
      path: '/404.html',
      body: `<section class="page-head wrap"><h1>Lost? Happens to the best travellers.</h1><p class="lead"><a href="${url('/')}">Head back home →</a></p></section>`,
    });
  }

  return { layout, home, post, destinationsIndex, destination, page, resourcesExtra, notFound, url };
}

module.exports = { createTemplates };
