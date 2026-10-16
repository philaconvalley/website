// Home page: the numbers band odometer. Served as a file, not inlined, because the CSP allows
// scripts from this origin only (script-src 'self'); Astro inlines small
// <script> blocks, which the CSP blocks. Same pattern as event-freshness.js.
// The hero photo pick lives in hero-photo.js, which must run earlier.

// The live numbers roll in like an odometer on every load, when a stat is
//    half in view (styles: global.css, "numbers band odometer"). odo-arm.js
//    already hid the stats before paint. The HTML holds the real values (no-JS,
//    search) and an sr-only copy is what assistive tech reads. Under reduced
//    motion nothing moves: the stat fades in instead.
(function odometer() {
  window.pcvOdoReady = true;
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!counters.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 80; // ms between stats that arrive together
  var ROLL_AT = 150; // ms after the rule starts drawing
  var COLUMN_STEP = 60; // ms between digit columns, left to right
  var ROLL = 1100; // ms, matches .odo-strip in global.css
  var REDUCED = 300; // ms, matches the reduced-motion fade

  function itemOf(el) {
    return el.closest('[data-odo-item]');
  }

  function finish(el) {
    var layer = el.querySelector('.odo-layer');
    if (layer) layer.remove();
    var item = itemOf(el);
    item.setAttribute('data-odo', 'done');
    item.style.removeProperty('--odo-delay');
  }

  // No observer: show everything as it is.
  if (!('IntersectionObserver' in window)) {
    counters.forEach(finish);
    return;
  }

  // One column per digit: a strip of 0-9 that starts at 0. The ones digit gets
  // a second 0-9 and lands in it, so it spins one extra lap.
  function build(el) {
    var digits = el.getAttribute('data-count').split('');
    var layer = document.createElement('span');
    layer.className = 'odo-layer';
    layer.setAttribute('aria-hidden', 'true');
    digits.forEach(function (digit, k) {
      var laps = k === digits.length - 1 ? 2 : 1;
      var col = document.createElement('span');
      col.className = 'odo-col';
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (var n = 0; n < 10 * laps; n++) {
        var cell = document.createElement('span');
        cell.textContent = String(n % 10);
        strip.appendChild(cell);
      }
      strip.setAttribute('data-target', String(Number(digit) + 10 * (laps - 1)));
      strip.setAttribute('data-cells', String(10 * laps));
      col.appendChild(strip);
      layer.appendChild(col);
    });
    el.appendChild(layer);
  }

  function play(el, delay) {
    var item = itemOf(el);
    item.style.setProperty('--odo-delay', delay + 'ms');
    var strips = el.querySelectorAll('.odo-strip');
    // Read layout once so the hidden state is committed before it changes.
    void item.offsetWidth;
    item.setAttribute('data-odo', 'play');
    Array.prototype.forEach.call(strips, function (strip, k) {
      var share =
        Number(strip.getAttribute('data-target')) / Number(strip.getAttribute('data-cells'));
      strip.style.transitionDelay = delay + ROLL_AT + COLUMN_STEP * k + 'ms';
      strip.style.transform = 'translateY(' + -share * 100 + '%)';
    });
    var end = reduce ? delay + REDUCED : delay + ROLL_AT + COLUMN_STEP * (strips.length - 1) + ROLL;
    window.setTimeout(function () {
      finish(el);
    }, end + 50);
  }

  if (!reduce) counters.forEach(build);

  var io = new IntersectionObserver(
    function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (entry.intersectionRatio < 0.5) return;
        io.unobserve(entry.target);
        play(entry.target, STAGGER * batch++);
      });
    },
    { threshold: [0, 0.5] },
  );
  counters.forEach(function (el) {
    io.observe(el);
  });
})();
