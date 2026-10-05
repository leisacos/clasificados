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
