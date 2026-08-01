/**
 * Homepage scroll choreography.
 *
 * GSAP is imported from node_modules rather than a CDN — the CSP allows
 * `script-src 'self'` only, and re-adding a CDN origin would undo #109.
 *
 * This lives in src/scripts/ rather than inline in index.astro so the page
 * stays readable and this stays reviewable. Astro bundles the import, so it is
 * still covered by `script-src 'self'` and adds no inline hash to maintain.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Height of the sticky header. Anchor scrolling and pinning both clear it. */
const HEADER_OFFSET = 62;

// Eased scroll for every in-page link.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const sel = a.getAttribute('href');
    if (!sel || sel === '#') return;
    const el = document.querySelector(sel);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    if (reduced) {
      window.scrollTo(0, y);
      return;
    }
    gsap.to(window, {
      duration: 1.05,
      ease: 'power3.inOut',
      scrollTo: { y, autoKill: false },
      overwrite: 'auto',
    });
  });
});

if (!reduced) {
  document.querySelectorAll('#what .pcv-card, #build .pcv-card').forEach((el, i) => {
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      delay: (i % 3) * 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  document.querySelectorAll('#what h2, #build h2, #nights h2').forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
}

/**
 * ScrollTrigger caches every trigger's position when it is created. Two things
 * on this page move those positions afterwards:
 *
 *   1. public/js/event-freshness.js removes the entire next-night band once the
 *      event has started, shortening the document above every trigger below it.
 *   2. Webfonts swap in and change the height of every block of text.
 *
 * ScrollTrigger refreshes itself on `load`, which covers the first. Fonts can
 * settle after that, so ask for one more once they have.
 */
document.fonts?.ready.then(() => ScrollTrigger.refresh());
