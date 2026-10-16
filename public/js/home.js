// Home page behavior. Served as a file, not inlined, because the CSP allows
// scripts from this origin only (script-src 'self'); Astro inlines small
// <script> blocks, which the CSP blocks. Same pattern as event-freshness.js.

// 1. Hero photo: one hero-eligible gallery photo at random per visit, so
//    returning visitors see more of the room. Runs once; no fade, no rotation
//    (a timed rotation would be a second loop, DESIGN.md motion rule 1).
(function shuffleHeroPhoto() {
  var figure = document.querySelector('[data-hero-photos]');
  var img = figure && figure.querySelector('img');
  if (!figure || !img) return;
  var photos;
  try {
    photos = JSON.parse(figure.getAttribute('data-hero-photos') || '[]');
  } catch (e) {
    return;
  }
  if (photos.length < 2) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  img.srcset = pick.srcset;
  img.src = pick.src;
  img.alt = pick.alt;
})();

// 2. The live numbers count up once, when the band scrolls into view: 1.2s,
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

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  counters.forEach(function (el) {
    // Start from zero only for numbers not on screen yet, so nothing visible
    // ever jumps backward.
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = '0';
    io.observe(el);
  });
})();
