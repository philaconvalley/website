/**
 * Event freshness, checked against the visitor's clock rather than the build's.
 *
 * `output: static` freezes every date decision in src/lib/community.ts into HTML
 * at build time, so its guard against advertising a night that already happened
 * can only catch events that were already past when we last deployed. An event
 * that expires *after* the build sails through, and with no scheduled rebuild
 * that is the normal case: the day after a Builder Night, every visitor is still
 * offered an RSVP to a closed door. So the elements making a time-bound claim
 * carry their own expiry, and this resolves it at read time.
 *
 * WHY THIS LIVES IN public/ AS PLAIN JS, loaded with `is:inline`:
 *
 * Astro's processed <script> pipeline inlines small import-free scripts into the
 * HTML to save a request, and there is no per-script opt-out (only CSS has
 * `build.inlineStylesheets: 'never'`). An inline script has to be hash-allowlisted
 * in vercel.json, which would mean regenerating that hash in two policies on every
 * edit to this file — friction the CSP drift gate would enforce forever. Served
 * from public/, it is covered by `script-src 'self'` and needs no CSP maintenance.
 *
 * The cost is real and accepted: this file is outside `astro check` and is not
 * bundled or minified. That is a fair trade for fifteen lines of dependency-free
 * DOM code, and a poor one for anything larger — if this grows, move it into src/
 * and pay the hash instead.
 *
 * Degradation is deliberate at both ends: an element without the attribute is
 * untouched, an unparseable date compares false and is left alone, and with no
 * JavaScript at all the page behaves exactly as it does today.
 */
for (const el of document.querySelectorAll('[data-pcv-event-start]')) {
  const start = Date.parse(el.dataset.pcvEventStart ?? '');
  if (!(Date.now() > start)) continue;

  // A link degrades to its fallback destination; everything else is a claim that
  // cannot be made true, so it goes.
  const fallback = el.dataset.pcvEventFallback;
  if (fallback) {
    el.setAttribute('href', fallback);
    el.removeAttribute('target');
    el.removeAttribute('rel');
    // Dropping the marker once handled leaves a checkable invariant: after this
    // loop, a surviving data-pcv-event-start means an unexpired claim.
    el.removeAttribute('data-pcv-event-start');
  } else {
    el.remove();
  }
}
