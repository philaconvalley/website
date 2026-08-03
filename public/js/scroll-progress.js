/**
 * The rule under the header, reporting how far down the document you are.
 *
 * It is a position indicator, not decoration, so it is deliberately NOT gated on
 * `prefers-reduced-motion`: it reports the scroll the visitor is already
 * performing rather than animating on a clock of its own. The fill carries no
 * CSS transition for the same reason — a transition would make it lag the thing
 * it is reporting.
 *
 * WHY THIS LIVES IN public/ AS PLAIN JS, loaded with `is:inline`:
 *
 * The same reason as event-freshness.js, and it was learned here the hard way.
 * As `src/scripts/scroll-progress.ts` imported from a component <script>, Astro's
 * pipeline inlined it — small and import-free — and e2e/csp.spec.ts went red on
 * all five pages, because an inline script needs its sha256 allowlisted in both
 * policies in vercel.json and regenerated on every edit. Served from public/ it
 * is covered by `script-src 'self'` and needs no CSP maintenance.
 *
 * Not GSAP, either: the header is on every page and GSAP is only loaded on the
 * homepage. Pulling 44 KB onto /contact to draw a 3px rule would be the wrong
 * trade by an order of magnitude. This is the one thing outside
 * src/scripts/motion that moves, and it earns that by not being motion.
 *
 * The cost is the same one that file accepts: outside `astro check`, unbundled,
 * unminified. Fair for twenty lines of dependency-free DOM code.
 */
(function () {
  var fill = document.querySelector('[data-pcv-progress]');
  if (!fill) return;

  var queued = false;

  function sync() {
    queued = false;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    /*
     * A page shorter than the viewport has no journey to report. Report zero,
     * not one: a full rule on a page the visitor has not moved through claims
     * they reached the end of something they never travelled. Guarding the
     * divisor also keeps NaN out of the transform.
     */
    var progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    fill.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
  }

  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  sync();
})();
