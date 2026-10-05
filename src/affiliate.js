// Travelpayouts link helpers. Every affiliate link goes through here so that
// adding your marker / program IDs to site.config.json tracks everything at once.
const { escapeHtml } = require('./markdown');
const { strings, fill } = require('./i18n');

const ICONS = {
  flights: '✈️',
  hotels: '🏨',
  tours: '🎟️',
  insurance: '🛡️',
  esim: '📶',
};
const KINDS = ['flights', 'hotels', 'tours', 'insurance', 'esim'];

function createAffiliate(config) {
  const tp = config.travelpayouts || {};
  const partners = config.partners || {};

  // Wrap a partner URL in a Travelpayouts tracked link when the program is configured.
  function track(kind, url) {
    const programId = tp.programs && tp.programs[kind];
    // Aviasales tracks the marker straight from its own URLs, no program ID needed.
    if (tp.marker && !programId && /(^|\.)aviasales\.[a-z]+\//.test(url)) {
      const u = new URL(url);
      u.searchParams.set('marker', tp.marker);
      return u.toString();
    }
    if (!tp.marker || !programId) return url;
    const params = new URLSearchParams({ marker: tp.marker, p: programId, u: url });
    if (tp.trs) params.set('trs', tp.trs);
    return `https://tp.media/r?${params.toString()}`;
  }

  // ctx: { city, country, place, iata } — city/country (English) feed the partner
  // search URL, place is the name shown to the reader in their language.
  function partnerUrl(kind, ctx = {}, lang = 'en') {
    const p = partners[kind];
    if (!p) return '#';
    const template = p[`url_${lang}`] || p.url;
    return template.replace('{city}', encodeURIComponent(ctx.city || ctx.country || ''));
  }

  function button(kind, ctx = {}, lang = 'en') {
    const p = partners[kind];
    if (!p) return '';
    const s = strings(lang);
    const where = ctx.place || ctx.city || ctx.country;
    const [generic, specific] = s.cta[kind];
    const label = where ? fill(specific, { where }) : generic;
    const attrs = kind === 'flights' && ctx.iata ? ` data-flight-to="${escapeHtml(ctx.iata)}"` : '';
    return `<a class="cta cta-${kind}" href="${escapeHtml(track(kind, partnerUrl(kind, ctx, lang)))}"${attrs} target="_blank" rel="sponsored nofollow noopener">` +
      `<span class="cta-icon" aria-hidden="true">${ICONS[kind] || '→'}</span>` +
      `<span class="cta-text"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(fill(s.viaBrand, { brand: p.brand }))}</small></span></a>`;
  }

  function planBox(ctx = {}, lang = 'en') {
    const s = strings(lang);
    const where = ctx.place || ctx.city || ctx.country;
    return `<aside class="plan-box" aria-label="${escapeHtml(s.planYourTrip)}">
  <h3>${escapeHtml(where ? fill(s.planYourTripTo, { where }) : s.planYourTrip)}</h3>
  <p class="plan-intro">${escapeHtml(s.planIntro)}</p>
  <div class="cta-grid">${KINDS.map((k) => button(k, ctx, lang)).join('')}</div>
</aside>`;
  }

  function widget(kind, lang = 'en') {
    const w = tp.widgets || {};
    return w[`${kind}_${lang}`] || w[kind] || '';
  }

  return { track, partnerUrl, button, planBox, widget, KINDS };
}

module.exports = { createAffiliate };
