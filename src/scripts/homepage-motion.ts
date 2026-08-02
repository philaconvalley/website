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

  /**
   * The photo mosaic, when the gallery collection has entries. Without this the
   * heading above it animates while five photos pop in underneath — the gap is
   * invisible today only because the collection is empty.
   */
  gsap.from('#nights [data-pcv-photo]', {
    y: 28,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.07,
    scrollTrigger: { trigger: '#nights', start: 'top 85%' },
  });

  /**
   * The city grows as you scroll down: the band keeps its height and the
   * artwork scales up inside it, anchored to the bottom, so the buildings rise
   * out of frame as though you were walking toward them.
   *
   * This is the effect that pays for the library. It is bound to scroll
   * position rather than a crossing, so it runs backwards when you scroll back
   * up — IntersectionObserver fires once, in one direction, and has no cheap
   * equivalent.
   *
   * Scaling the background rather than the band is what keeps this cheap.
   * background-size does not affect layout, so nothing below the band moves, no
   * trigger position downstream goes stale, and there is no reflow per frame —
   * the alternative, animating the band's height, cost a full layout pass on
   * every scroll event and shifted the pinned section further down the page.
   *
   * The scale is written through a custom property rather than tweened as a
   * background-size string, because `auto 100%` has a keyword in it and string
   * interpolation across that is not something to rely on.
   */
  const band = document.querySelector<HTMLElement>('[data-pcv-skyline]');

  if (band) {
    /**
     * 140%, not more. Past roughly 150% the rooflines and the sky above them
     * both crop out of the band and the illustration stops reading as a skyline
     * — it becomes a wall of building facade. 140% is a plainly visible zoom
     * that still keeps a horizon in frame at the end of the range.
     */
    const zoom = { scale: 100 };
    gsap.to(zoom, {
      scale: 140,
      ease: 'none',
      scrollTrigger: {
        trigger: '#top',
        start: 'top top',
        end: '+=560',
        scrub: 0.5,
      },
      onUpdate: () => band.style.setProperty('--pcv-sky-scale', `${zoom.scale}%`),
    });
  }

  /**
   * The room holds still while its numbers arrive.
   *
   * The page spends its boldness here and nowhere else. Pinning is the other
   * thing no observer can do: `position: sticky` can hold an element, but it
   * cannot drive a timeline against the distance travelled while it holds.
   *
   * Deliberately desktop-only. On a phone the section already fills the screen,
   * so pinning it reads as a page that has stopped responding rather than as a
   * held moment.
   */
  const room = document.querySelector<HTMLElement>('#nights');
  const counters = document.querySelectorAll<HTMLElement>('#nights [data-count-to]');

  if (room && counters.length && window.innerWidth >= 1024) {
    /**
     * A pinned section has to fill the screen or the pin reads as a page that
     * has stopped responding: the room is 342px tall in a 900px viewport, so
     * without this the next section sits frozen in frame for the whole hold.
     *
     * Applied here rather than in the markup on purpose. It is a consequence of
     * pinning, not of the design, so it should exist in exactly the case that
     * pins — desktop, motion allowed — and nowhere else. Phones and
     * reduced-motion visitors keep the layout they have today.
     */
    room.style.minHeight = `calc(100vh - ${HEADER_OFFSET}px)`;
    room.style.display = 'flex';
    room.style.flexDirection = 'column';
    room.style.justifyContent = 'center';

    ScrollTrigger.create({
      trigger: room,
      start: `top ${HEADER_OFFSET}px`,
      end: '+=420',
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
    });

    /**
     * The counters are deliberately NOT scrubbed, and that is a correctness
     * requirement rather than a matter of taste.
     *
     * A scrubbed counter *owns* the text: whatever progress the scrub is
     * stranded at becomes what the page claims. Jump past this section in a
     * single frame — a restored scroll position, the End key, an anchor link —
     * and the tween renders once at progress 0 and stops, leaving "0 members ·
     * 0 nights held · 0 things shipped" on screen permanently. That is the same
     * defect as #94 and #98: a number on the page that is not true. Measured,
     * not theorised: every instant jump past the room reproduced it.
     *
     * A one-shot tween cannot fail that way. Its only writer always runs to the
     * end, and if it never fires at all the markup's own value — already the
     * real one — is left untouched. It also stops the numbers counting *down*
     * when someone scrolls back up, which reads as members leaving.
     */
    ScrollTrigger.create({
      trigger: room,
      start: `top ${HEADER_OFFSET}px`,
      once: true,
      onEnter: () => {
        counters.forEach((el, i) => {
          const to = Number(el.dataset.countTo ?? el.textContent ?? 0);
          if (!Number.isFinite(to)) return;
          const counter = { value: 0 };
          gsap.to(counter, {
            value: to,
            duration: 0.9,
            ease: 'power2.out',
            delay: i * 0.12,
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
            onComplete: () => {
              el.textContent = String(to);
            },
          });
        });
      },
    });
  }
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
