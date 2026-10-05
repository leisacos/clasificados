const { escapeHtml: e } = require('./markdown');
const fs = require('fs');
const path = require('path');
const { strings, fill, loc } = require('./i18n');

// Logo mark, inlined so it needs no extra request and inherits nothing from CSS.
const LOGO_MARK = fs.readFileSync(path.join(__dirname, '..', 'static/brand/logo-mark.svg'), 'utf8')
  .replace(/<title>[^<]*<\/title>/, '').replace('<svg ', '<svg class="logo-mark" aria-hidden="true" focusable="false" ');

function createTemplates(config, aff) {
  const base = config.basePath || '';
  const langs = Object.keys(config.languages);
  const defaultLang = langs[0];
  const ig = config.instagram && config.instagram.handle;
  const igUrl = ig ? `https://www.instagram.com/${ig}/` : '';

  // Site-relative URL for a language: href('es', '/posts/x/') -> /es/posts/x/
  const href = (lang, p) => `${base}${config.languages[lang].prefix}${p}`;
  const asset = (p) => `${base}${p}`;
  const abs = (lang, p) => `${config.url}${config.languages[lang].prefix}${p}`;
  const site = (key, lang) => loc(config, key, lang, defaultLang);

  const fmtDate = (d, lang) => new Date(d + 'T12:00:00Z')
    .toLocaleDateString(config.languages[lang].locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  const place = (p, lang) => [loc(p, 'city', lang), loc(p, 'country', lang)].filter(Boolean).join(', ');
  const ctxFor = (p, lang) => ({ city: p.city, country: p.country, iata: p.iata, place: loc(p, 'city', lang) || loc(p, 'country', lang) });

  // "Places, Not Faces" -> "Places, <em>Not Faces</em>" (accent colour on the second half)
  function logoText(title) {
    const i = title.indexOf(',');
    return i < 0 ? e(title) : `${e(title.slice(0, i + 1))} <em>${e(title.slice(i + 1).trim())}</em>`;
  }

  function cover(post, cls, lang) {
    if (post.cover) return `<img class="${cls}" src="${e(asset(post.cover))}" alt="${e(loc(post, 'coverAlt', lang) || loc(post, 'title', lang))}" loading="lazy">`;
    // Gradient placeholder until a real photo is added.
    const hue = [...post.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `<div class="${cls} placeholder" style="--h:${hue}"><span>${e(loc(post, 'city', lang) || loc(post, 'country', lang) || loc(post, 'title', lang))}</span></div>`;
  }

  function card(post, lang) {
    return `<article class="card">
  <a href="${href(lang, `/posts/${post.slug}/`)}" class="card-link">
    <div class="card-media">${cover(post, 'card-img', lang)}</div>
    <div class="card-body">
      ${post.country ? `<span class="kicker">${e(place(post, lang))}</span>` : ''}
      <h3>${e(loc(post, 'title', lang))}</h3>
      <p>${e(loc(post, 'excerpt', lang))}</p>
      <time datetime="${post.date}">${fmtDate(post.date, lang)}</time>
    </div>
  </a>
</article>`;
  }

  function layout({ lang, title, description, path, body, image, type = 'website', jsonLd, faqLd, alternates = langs, published, modified }) {
    const s = strings(lang);
    const siteTitle = site('title', lang);
    const fullTitle = title ? `${title} · ${siteTitle}` : `${siteTitle} · ${site('tagline', lang)}`;
    const desc = description || site('description', lang);
    const ogImage = `${config.url}${image || '/brand/og-default.jpg'}`;
    const tp = config.travelpayouts || {};
    const other = alternates.filter((l) => l !== lang);
    const switcher = other.map((l) => `<a class="lang-switch" href="${href(l, path)}" hreflang="${l}" lang="${l}" data-lang="${l}" title="${e(s.switchTo)}">` +
      `<span aria-hidden="true">🌐</span> ${e(config.languages[l].short)}</a>`).join('');
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(desc)}">
<link rel="canonical" href="${e(abs(lang, path))}">
${alternates.map((l) => `<link rel="alternate" hreflang="${l}" href="${e(abs(l, path))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${e(abs(alternates.includes(defaultLang) ? defaultLang : lang, path))}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${e(title || siteTitle)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:url" content="${e(abs(lang, path))}">
<meta property="og:locale" content="${config.languages[lang].locale.replace('-', '_')}">
<meta property="og:site_name" content="${e(siteTitle)}">
${published ? `<meta property="article:published_time" content="${published}">\n${modified ? `<meta property="article:modified_time" content="${modified}">\n` : ''}<meta property="article:author" content="${e(config.author.name)}">` : ''}
${config.pinterest && config.pinterest.verify ? `<meta name="p:domain_verify" content="${e(config.pinterest.verify)}">` : ''}
<meta property="og:image" content="${e(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${e(siteTitle)}" href="${href(lang, '/feed.xml')}">
<link rel="icon" href="${asset('/favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${asset('/brand/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${asset('/brand/apple-touch-icon.png')}">
<meta name="theme-color" content="#1f6f78">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset('/css/style.css')}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd).replace(/</g, '\\u003c')}</script>` : ''}
${tp.driveScript || ''}
</head>
<body data-lang="${lang}" data-tp-marker="${e(tp.marker || '')}" data-tp-trs="${e(tp.trs || '')}" data-tp-flights="${e((tp.programs && tp.programs.flights) || '')}" data-origin="${e(tp.defaultOrigin || '')}">
${other.map((l) => `<div class="lang-banner" data-banner-lang="${l}" lang="${l}" hidden>
  <div class="wrap lang-banner-inner">
    <span>${e(strings(l).langOffer)}</span>
    <a href="${href(l, path)}" data-lang="${l}">${e(strings(l).langOfferCta)}</a>
    <button type="button" class="lang-banner-close" aria-label="Close">×</button>
  </div>
</div>`).join('')}
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${href(lang, '/')}" aria-label="${e(siteTitle)}">${LOGO_MARK}<span>${logoText(siteTitle)}</span></a>
    <div class="header-actions">
      ${switcher}
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="${e(s.menu)}">☰</button>
    </div>
    <nav id="nav" class="nav">
      <a href="${href(lang, '/')}">${e(s.home)}</a>
      <a href="${href(lang, '/destinations/')}">${e(s.destinations)}</a>
      <a href="${href(lang, '/travel-resources/')}">${e(s.resources)}</a>
      <a href="${href(lang, '/about/')}">${e(s.about)}</a>
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
      <p class="logo">${LOGO_MARK}<span>${logoText(siteTitle)}</span></p>
      <p>${e(site('tagline', lang))}</p>
      ${igUrl ? `<p><a href="${igUrl}" target="_blank" rel="noopener">${e(fill(s.followOn, { handle: ig }))}</a></p>` : ''}
    </div>
    <div class="footer-links">
      <a href="${href(lang, '/destinations/')}">${e(s.destinations)}</a>
      <a href="${href(lang, '/travel-resources/')}">${e(s.resources)}</a>
      <a href="${href(lang, '/disclosure/')}">${e(s.disclosure)}</a>
      <a href="${href(lang, '/privacy/')}">${e(s.privacy)}</a>
      <a href="${href(lang, '/feed.xml')}">${e(s.rss)}</a>
      ${other.map((l) => `<a href="${href(l, path)}" hreflang="${l}" data-lang="${l}">🌐 ${e(config.languages[l].label)}</a>`).join('')}
    </div>
  </div>
  <p class="wrap fine">${e(s.fine)} © ${new Date().getFullYear()} ${e(config.author.name)}</p>
</footer>
<script src="${asset('/js/main.js')}" defer></script>
</body>
</html>`;
  }

  function igStrip(media, lang) {
    const withPhotos = media.filter((m) => m.image).slice(0, 8);
    if (!withPhotos.length || !igUrl) return '';
    const s = strings(lang);
    return `<section class="wrap">
  <div class="section-row"><h2 class="section-title">${e(s.followAlong)}</h2><a class="btn btn-ghost" href="${igUrl}" target="_blank" rel="noopener">@${e(ig)}</a></div>
  <div class="ig-grid">${withPhotos.map((m) => `<a href="${e(m.permalink)}" target="_blank" rel="noopener" class="ig-tile${m.type === 'VIDEO' ? ' is-video' : ''}"><img src="${e(asset(m.image))}" alt="${e((m.caption || '').split('\n')[0].replace(/#\S+/g, '').trim().slice(0, 120))}" loading="lazy"></a>`).join('')}</div>
</section>`;
  }

  function home(lang, posts, destinations, media) {
    const s = strings(lang);
    const [featured, ...rest] = posts;
    const flightsWidget = aff.widget('flights', lang);
    const body = `
<section class="hero">
  <div class="wrap hero-inner">
    <p class="kicker">${e(fill(s.heroKicker, { handle: ig || config.author.name }))}</p>
    <h1>${e(site('tagline', lang))}</h1>
    <p class="lead">${e(site('description', lang))}</p>
    <div class="hero-actions">
      <a class="btn" href="${href(lang, '/destinations/')}">${e(s.exploreDestinations)}</a>
      ${igUrl ? `<a class="btn btn-ghost" href="${igUrl}" target="_blank" rel="noopener">${e(s.seeOnInstagram)}</a>` : ''}
    </div>
  </div>
</section>
${featured ? `
<section class="wrap featured">
  <a href="${href(lang, `/posts/${featured.slug}/`)}" class="featured-link">
    <div class="featured-media">${cover(featured, 'featured-img', lang)}</div>
    <div class="featured-body">
      <span class="kicker">${e(s.latestStory)} · ${e(place(featured, lang))}</span>
      <h2>${e(loc(featured, 'title', lang))}</h2>
      <p>${e(loc(featured, 'excerpt', lang))}</p>
      <span class="read-more">${e(s.readStory)}</span>
    </div>
  </a>
</section>` : ''}
<section class="wrap"><div class="search-panel">
  <h2>${e(s.whereNext)}</h2>
  ${flightsWidget || `<p>${e(s.whereNextText)}</p>
  <div class="cta-grid">${['flights', 'hotels', 'tours'].map((k) => aff.button(k, {}, lang)).join('')}</div>`}
</div></section>
${rest.length ? `
<section class="wrap">
  <h2 class="section-title">${e(s.moreStories)}</h2>
  <div class="grid">${rest.map((p) => card(p, lang)).join('')}</div>
</section>` : ''}
${destinations.length ? `
<section class="wrap">
  <h2 class="section-title">${e(s.destinations)}</h2>
  <div class="chips">${destinations.map((d) => `<a class="chip" href="${href(lang, `/destinations/${d.slug}/`)}">${e(loc(d, 'name', lang))} <small>${d.posts.length}</small></a>`).join('')}</div>
</section>` : ''}
${igStrip(media, lang)}
<section class="wrap">
  ${aff.planBox({}, lang)}
</section>`;
    return layout({
      lang,
      path: '/',
      body,
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'Blog', name: site('title', lang), url: abs(lang, '/'), description: site('description', lang), inLanguage: lang,
        publisher: { '@type': 'Organization', name: site('title', lang), logo: { '@type': 'ImageObject', url: `${config.url}/brand/icon-512.png` } },
      },
    });
  }

  // "Save to Pinterest" link — no Pinterest script needed. Uses the tall pin image
  // when one exists (content/images/pins/<slug>-<lang>.jpg), otherwise the cover.
  function pinButton(p, lang) {
    const media = (p.pins && p.pins[lang]) || p.cover;
    if (!media) return '';
    const params = new URLSearchParams({
      url: abs(lang, `/posts/${p.slug}/`),
      media: `${config.url}${media}`,
      description: `${loc(p, 'title', lang)} · ${site('title', lang)}`,
    });
    return `<a class="pin-btn" href="https://www.pinterest.com/pin/create/button/?${params}" target="_blank" rel="noopener" data-pin-do="none">` +
      `<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.4-4.5-4.4-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4l.1.4-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.3 6.7-5.6 6.7-1.1 0-2.1-.6-2.5-1.2l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z"/></svg>` +
      `<span>${e(strings(lang).savePin)}</span></a>`;
  }

  function post(lang, p, html, related, faq = []) {
    const s = strings(lang);
    const ctx = ctxFor(p, lang);
    const hotelsWidget = aff.widget('hotels', lang);
    const title = loc(p, 'title', lang);
    const translated = lang === defaultLang || p.bodies[lang];
    const body = `
<article class="post">
  <header class="post-hero">
    ${cover(p, 'post-cover', lang)}
    <div class="wrap post-head">
      ${p.country ? `<a class="kicker" href="${href(lang, `/destinations/${p.countrySlug}/`)}">${e(place(p, lang))}</a>` : ''}
      <h1>${e(title)}</h1>
      <p class="meta">${e(s.by)} ${e(config.author.name)} · <time datetime="${p.date}">${fmtDate(p.date, lang)}</time>${p.updated && p.updated > p.date ? ` · ${e(s.updatedOn)} <time datetime="${p.updated}">${fmtDate(p.updated, lang)}</time>` : ''} · ${p.readingTime[lang] || p.readingTime[defaultLang]} ${e(s.minRead)}</p>
      ${pinButton(p, lang)}
    </div>
  </header>
  <div class="wrap post-layout">
    <div class="prose">
      <p class="disclosure-note">${e(s.affiliateNote)} <a href="${href(lang, '/disclosure/')}">${e(s.learnMore)}</a>.</p>
      ${translated ? '' : `<p class="notice">${e(s.notTranslated)}</p>`}
      ${html}
      <div class="share-row">${pinButton(p, lang)}</div>
      ${p.tags && p.tags.length ? `<p class="tags">${p.tags.map((t) => `<span>#${e(t)}</span>`).join(' ')}</p>` : ''}
    </div>
    <aside class="sidebar">
      <div class="sticky">
        <div class="side-box">
          <h3>${e(s.planThisTrip)}</h3>
          ${['flights', 'hotels', 'tours'].map((k) => aff.button(k, ctx, lang)).join('')}
        </div>
        ${hotelsWidget ? `<div class="side-box">${hotelsWidget}</div>` : ''}
        <div class="side-box small">
          <h3>${e(s.dontTravelWithout)}</h3>
          ${['insurance', 'esim'].map((k) => aff.button(k, ctx, lang)).join('')}
        </div>
      </div>
    </aside>
  </div>
  ${related.length ? `<section class="wrap"><h2 class="section-title">${e(s.youMightLike)}</h2><div class="grid">${related.map((r) => card(r, lang)).join('')}</div></section>` : ''}
</article>`;
    return layout({
      lang,
      title,
      description: loc(p, 'excerpt', lang),
      path: `/posts/${p.slug}/`,
      image: p.cover || '',
      type: 'article',
      published: p.date,
      modified: p.updated && p.updated > p.date ? p.updated : '',
      body,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        datePublished: p.date,
        dateModified: p.updated && p.updated > p.date ? p.updated : p.date,
        inLanguage: lang,
        author: { '@type': 'Person', name: config.author.name, url: igUrl || undefined },
        description: loc(p, 'excerpt', lang),
        ...(p.cover ? { image: `${config.url}${p.cover}` } : {}),
        ...(p.country ? { contentLocation: { '@type': 'Place', name: place(p, lang) } } : {}),
      },
      faqLd: faq.length ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      } : null,
    });
  }

  function destinationsIndex(lang, destinations) {
    const s = strings(lang);
    const body = `
<section class="page-head wrap">
  <h1>${e(s.destinations)}</h1>
  <p class="lead">${e(s.destinationsLead)}</p>
</section>
<section class="wrap dest-grid">
  ${destinations.map((d) => `<a class="dest-card" href="${href(lang, `/destinations/${d.slug}/`)}">
    ${cover(d.posts.find((p) => p.cover) || d.posts[0], 'dest-img', lang)}
    <span class="dest-name">${e(loc(d, 'name', lang))}<small>${d.posts.length} ${e(d.posts.length === 1 ? s.story : s.stories)}</small></span>
  </a>`).join('')}
</section>`;
    return layout({ lang, title: s.destinations, path: '/destinations/', body });
  }

  function destination(lang, d) {
    const s = strings(lang);
    const name = loc(d, 'name', lang);
    const withIata = d.posts.find((p) => p.iata);
    const body = `
<section class="page-head wrap">
  <p class="kicker"><a href="${href(lang, '/destinations/')}">${e(s.destinations)}</a></p>
  <h1>${e(fill(s.guideTitle, { name }))}</h1>
  <p class="lead">${e(fill(s.guideLead, { name }))}</p>
</section>
<section class="wrap"><div class="grid">${d.posts.map((p) => card(p, lang)).join('')}</div></section>
<section class="wrap">${aff.planBox({ country: d.name, place: name, iata: withIata && withIata.iata }, lang)}</section>`;
    return layout({ lang, title: fill(s.guideTitle, { name }), description: fill(s.guideDescription, { name }), path: `/destinations/${d.slug}/`, body });
  }

  function page(lang, p, html, extra = '') {
    const body = `
<section class="page-head wrap"><h1>${e(loc(p, 'title', lang))}</h1></section>
<section class="wrap narrow prose">${html}</section>
${extra}`;
    return layout({ lang, title: loc(p, 'title', lang), description: loc(p, 'description', lang), path: `/${p.slug}/`, body });
  }

  function resourcesExtra(lang) {
    const fw = aff.widget('flights', lang);
    const hw = aff.widget('hotels', lang);
    if (!fw && !hw) return '';
    return `<section class="wrap narrow">
  ${fw ? `<div class="side-box">${fw}</div>` : ''}
  ${hw ? `<div class="side-box">${hw}</div>` : ''}
</section>`;
  }

  function notFound(lang) {
    const s = strings(lang);
    return layout({
      lang,
      title: '404',
      path: '/404.html',
      alternates: [lang],
      body: `<section class="page-head wrap"><h1>${e(s.notFoundTitle)}</h1><p class="lead"><a href="${href(lang, '/')}">${e(s.backHome)}</a></p></section>`,
    });
  }

  return { home, post, destinationsIndex, destination, page, resourcesExtra, notFound, href, abs };
}

module.exports = { createTemplates };
