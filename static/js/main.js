// Mobile nav
(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

// Flight buttons: build a dated Aviasales search (origin -> post airport,
// departing in ~30 days for 7 nights) and wrap it in the Travelpayouts link.
(function () {
  var body = document.body;
  var origin = body.getAttribute('data-origin');
  var marker = body.getAttribute('data-tp-marker');
  var trs = body.getAttribute('data-tp-trs');
  var program = body.getAttribute('data-tp-flights');
  function ddmm(d) {
    return ('0' + d.getDate()).slice(-2) + ('0' + (d.getMonth() + 1)).slice(-2);
  }
  document.querySelectorAll('a[data-flight-to]').forEach(function (a) {
    var to = a.getAttribute('data-flight-to');
    if (!origin || !to || origin === to) return;
    var out = new Date(Date.now() + 30 * 864e5);
    var back = new Date(out.getTime() + 7 * 864e5);
    var url = 'https://www.aviasales.com/search/' + origin + ddmm(out) + to + ddmm(back) + '1';
    if (marker && program) {
      var q = new URLSearchParams({ marker: marker, p: program, u: url });
      if (trs) q.set('trs', trs);
      url = 'https://tp.media/r?' + q.toString();
    } else if (marker) {
      url += '?marker=' + encodeURIComponent(marker);
    }
    a.href = url;
  });
})();

// Language: remember the reader's choice, and offer the other language once
// when the browser's language doesn't match the page.
(function () {
  var KEY = 'lang-pref';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var pageLang = document.body.getAttribute('data-lang');

  document.querySelectorAll('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () { set(a.getAttribute('data-lang')); });
  });

  if (get()) return;
  var browser = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  browser = browser.slice(0, 2).toLowerCase();
  if (!browser || browser === pageLang) return;
  var banner = document.querySelector('.lang-banner[data-banner-lang="' + browser + '"]');
  if (!banner) return;
  banner.hidden = false;
  banner.querySelector('.lang-banner-close').addEventListener('click', function () {
    banner.hidden = true;
    set(pageLang);
  });
})();

// Google Ads: count a click on any booking (sponsored) link as one
// "Booking click" conversion per page view.
(function () {
  var sendTo = document.body.getAttribute('data-ads-booking');
  if (!sendTo) return;
  var sent = false;
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[rel~="sponsored"]');
    if (!a || sent || typeof window.gtag !== 'function') return;
    sent = true;
    window.gtag('event', 'conversion', { send_to: sendTo });
  }, true);
})();
