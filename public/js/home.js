// Home page: the number count-up. Served as a file, not inlined, because the CSP allows
// scripts from this origin only (script-src 'self'); Astro inlines small
// <script> blocks, which the CSP blocks. Same pattern as event-freshness.js.
// The hero photo pick lives in hero-photo.js, which must run earlier.

// The live numbers count up once, when the band scrolls into view: 1.2s,
//    decelerating. The HTML already holds the real values (no-JS, search) and
//    an sr-only copy is what assistive tech reads. Skipped under reduced motion.
(function countUp() {
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!counters.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var DURATION = 1200;
  // Decelerating ease-out: fast at the start, settles on the real value.
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }
  function run(el) {
    var target = Number(el.getAttribute('data-count'));
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / DURATION);
      el.textContent = String(Math.round(target * easeOut(t)));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // The observer's first report decides, not a measurement at script time
  // (web fonts can still move the layout then). Fully off screen in that first
  // report: reset to 0 and count once the number is 60% visible. Any part
  // visible: keep the real value and never count, so a visible number can
  // never jump back to 0.
  var armed = new WeakSet();
  var seen = new WeakSet();
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (!seen.has(el)) {
          seen.add(el);
          if (entry.intersectionRatio === 0) {
            el.textContent = '0';
            armed.add(el);
          } else {
            io.unobserve(el);
          }
          return;
        }
        if (armed.has(el) && entry.intersectionRatio >= 0.6) {
          io.unobserve(el);
          run(el);
        }
      });
    },
    { threshold: [0, 0.6] },
  );
  counters.forEach(function (el) {
    io.observe(el);
  });
})();
