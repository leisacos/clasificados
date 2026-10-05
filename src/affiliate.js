// Travelpayouts link helpers. Every affiliate link goes through here so that
// adding your marker / program IDs to site.config.json tracks everything at once.
const { escapeHtml } = require('./markdown');

const ICONS = {
  flights: '✈️',
  hotels: '🏨',
  tours: '🎟️',
  insurance: '🛡️',
  esim: '📶',
};

function createAffiliate(config) {
  const tp = config.travelpayouts || {};
  const partners = config.partners || {};

  // Wrap a partner URL in a Travelpayouts tracked link when the program is configured.
  function track(kind, url) {
    const programId = tp.programs && tp.programs[kind];
    if (!tp.marker || !programId) return url;
    const params = new URLSearchParams({ marker: tp.marker, p: programId, u: url });
    if (tp.trs) params.set('trs', tp.trs);
    return `https://tp.media/r?${params.toString()}`;
  }

  function partnerUrl(kind, ctx = {}) {
    const p = partners[kind];
    if (!p) return '#';
    const city = ctx.city || ctx.country || '';
    return p.url.replace('{city}', encodeURIComponent(city));
  }

  // A call-to-action button. Flight links carry data attributes so main.js can
  // build a dated Aviasales search to the post's airport at click time.
  function button(kind, ctx = {}, opts = {}) {
    const p = partners[kind];
    if (!p) return '';
    const where = ctx.city || ctx.country;
    const label = opts.label || (where && kind !== 'esim' && kind !== 'insurance' ? `${p.label} in ${where}` : p.label);
    const flightLabel = kind === 'flights' && where ? `Find flights to ${where}` : label;
    const attrs = kind === 'flights' && ctx.iata
      ? ` data-flight-to="${escapeHtml(ctx.iata)}"` : '';
    return `<a class="cta cta-${kind}" href="${escapeHtml(track(kind, partnerUrl(kind, ctx)))}"${attrs} target="_blank" rel="sponsored nofollow noopener">` +
      `<span class="cta-icon" aria-hidden="true">${ICONS[kind] || '→'}</span>` +
      `<span class="cta-text"><strong>${escapeHtml(flightLabel)}</strong><small>via ${escapeHtml(p.brand)}</small></span></a>`;
  }

  function planBox(ctx = {}) {
    const where = ctx.city || ctx.country;
    const kinds = ['flights', 'hotels', 'tours', 'insurance', 'esim'];
    return `<aside class="plan-box" aria-label="Plan your trip">
  <h3>Plan your trip${where ? ` to ${escapeHtml(where)}` : ''}</h3>
  <p class="plan-intro">These are the booking sites I use. If you book through them I may earn a small commission, at no extra cost to you.</p>
  <div class="cta-grid">${kinds.map((k) => button(k, ctx)).join('')}</div>
</aside>`;
  }

  function widget(kind) {
    return (tp.widgets && tp.widgets[kind]) || '';
  }

  return { track, partnerUrl, button, planBox, widget, ICONS };
}

module.exports = { createAffiliate };
