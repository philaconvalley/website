/**
 * The scanner. This is the only file that decides *what* animates.
 *
 * Pages declare motion in markup — `data-pcv-arrive`, `data-pcv-hold` — and
 * this wires it up. A contributor who has never opened a GSAP doc gets motion
 * that matches the rest of the site exactly, because there is only one
 * implementation of each move.
 *
 * Everything gated on motion preference lives inside a single
 * `gsap.matchMedia()` block. A JS branch plus a parallel CSS block is two
 * sources of truth that drift; matchMedia also reverts its tweens on cleanup,
 * which for a `from()` tween restores the element's real, visible state.
 */
import {
  HEADER_OFFSET,
  ScrollTrigger,
  arrive,
  countUp,
  groups,
  gsap,
  hold,
  smoothAnchors,
} from './primitives';

smoothAnchors(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const media = gsap.matchMedia();

media.add('(prefers-reduced-motion: no-preference)', () => {
  groups('[data-pcv-arrive]').forEach((group) => arrive(group));
});

media.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
  document.querySelectorAll<HTMLElement>('[data-pcv-hold]').forEach((section) => hold(section));
  countUpInHolds();
});

/**
 * Counters fire when their section is reached, once. Scoped to hold sections
 * because that is the only place the page is standing still long enough for a
 * count to be read rather than glimpsed.
 *
 * Which is also why this shares the pin's `min-width: 1024px` gate rather than
 * sitting in the plain no-preference block. Below 1024px nothing pins, so the
 * section slides past at scroll speed and a 0.9s count is not read, it is a
 * flicker of wrong numbers on the way past. Phones show the true values from
 * the markup and never animate them — which is what the site did before the
 * motion system, and it must stay true.
 */
function countUpInHolds(): void {
  document.querySelectorAll<HTMLElement>('[data-pcv-hold]').forEach((section) => {
    const counters = [...section.querySelectorAll<HTMLElement>('[data-count-to]')];
    if (!counters.length) return;
    ScrollTrigger.create({
      trigger: section,
      start: `top ${HEADER_OFFSET}px`,
      once: true,
      onEnter: () => countUp(counters),
    });
  });
}

/**
 * ScrollTrigger caches every trigger's position when it is created. Two things
 * move those positions afterwards:
 *
 *   1. public/js/event-freshness.js removes the entire next-night band once the
 *      event has started, shortening the document above every trigger below it.
 *   2. Webfonts swap in and change the height of every block of text.
 *
 * ScrollTrigger refreshes itself on `load`, which covers the first. Fonts can
 * settle after that, so ask for one more once they have.
 */
document.fonts?.ready.then(() => ScrollTrigger.refresh());
