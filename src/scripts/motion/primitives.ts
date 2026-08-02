/**
 * The motion vocabulary. Every animation on this site is one of these moves.
 *
 * GSAP is imported from node_modules rather than a CDN — the CSP allows
 * `script-src 'self'` only, and re-adding a CDN origin would undo #109.
 *
 * These functions are deliberately dumb: they take elements and animate them.
 * All DOM querying, all media-query gating, and all decisions about *what*
 * animates live in ./index.ts. That split is what lets a page author declare
 * motion with an attribute and never import this file.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/** Height of the sticky header. Anchor scrolling and pinning both clear it. */
export const HEADER_OFFSET = 62;

/**
 * Humanised stagger (spec §5.2).
 *
 * A perfectly even stagger is the sound of a machine. People entering a room
 * do not arrive on a metronome — one walks in, pauses, two arrive together,
 * someone hangs back. These offsets add that irregularity.
 *
 * The table is fixed rather than random on purpose. Random would be
 * untestable, and it would also differ between two renders of the same page,
 * which is a flicker nobody asked for. Eight values is enough that no group on
 * this site repeats the pattern visibly.
 */
const JITTER = [0, 0.074, 0.038, 0.102, 0.016, 0.086, 0.052, 0.122];

/**
 * Ceiling on the *cumulative* part of the delay, in steps.
 *
 * Without it the delay grows linearly forever: a twelve-item mosaic would make
 * its last photo wait over a second after entering view, which stops reading as
 * "people arriving" and starts reading as "the page is broken".
 *
 * A `Math.min` ceiling rather than a modulo. A modulo (the old code's
 * `(i % 3) * 0.09`, correct only for the three-column grid it was written for)
 * makes the delay *drop all the way back to zero* every third element, so
 * element four arrives a full step before element three — visibly wrong in any
 * group that is not exactly three wide. `Math.min` keeps the sequence ordered up
 * to the cap and then simply stops the wait growing: everything past the fourth
 * item lands together, within jitter, at ~0.27s.
 *
 * The jitter is applied after the clamp and is deliberately kept. The
 * irregularity is a design property (see above); the cap is not, it is a bound.
 */
const STAGGER_CAP = 3;

/**
 * Base step and travel time, calibrated by side-by-side comparison rather than
 * argued from theory.
 *
 * The first version ran a 0.09s step under a 0.7s travel. The irregularity was
 * real but illegible: the whole group resolved in 321ms, which is too fast to
 * perceive as a sequence, so the uneven gaps read as a stutter rather than as
 * people arriving. Shown three candidate timings side by side, the character
 * only started reading at half speed — so both the step and the travel are
 * doubled here, not just the delays, because halving the global time scale is
 * what was actually judged.
 *
 * The cost is stated plainly: the cards now finish arriving a little over two
 * seconds after the group is triggered. That is long, it was chosen with those
 * numbers on screen, and it is the first thing to revisit if the homepage reads
 * as sluggish in ordinary use rather than under deliberate replay.
 */
const STAGGER_STEP = 0.18;
const ARRIVE_TRAVEL = 1.4;

export function staggerDelay(index: number, base = STAGGER_STEP): number {
  const steps = Math.min(index, STAGGER_CAP);
  return Number((steps * base + JITTER[index % JITTER.length]).toFixed(3));
}

/**
 * Collect matching elements, grouped by the section they live in.
 *
 * Grouping matters: stagger restarts at zero in every section, so the fourth
 * card on the page does not wait for the first three in a section it is not
 * part of. Elements outside any section are one group.
 */
export function groups(selector: string): HTMLElement[][] {
  const bySection = new Map<Element, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const key = el.closest('[data-pcv-section]') ?? document.body;
    const list = bySection.get(key) ?? [];
    list.push(el);
    bySection.set(key, list);
  });
  return [...bySection.values()];
}

/**
 * ARRIVE — entrances.
 *
 * Nothing on this site fades in; things travel in from off-stage with weight.
 * The computed delay is written back to the element as `data-pcv-delay` so the
 * stagger is observable from a test and legible in devtools. It is written
 * before the tween is created, so it is present even if the trigger never fires.
 *
 * `shared` picks which of the two honest readings of "stagger" applies:
 *
 *   - Per-element triggers (the default) suit a column of blocks that cross the
 *     fold one at a time. Each one animates as *it* arrives, and the stagger
 *     only shows when several happen to enter together.
 *   - A shared trigger suits a grid — a photo mosaic, a row of cards — where the
 *     whole group enters the viewport at once. One trigger on the first element
 *     fires them all, so the stagger is the sequence the visitor actually sees
 *     rather than an accident of where each item's own top edge sits.
 *
 * Default stays per-element so existing pages are unchanged.
 */
export function arrive(elements: HTMLElement[], opts: { y?: number; shared?: boolean } = {}): void {
  const sharedTrigger = opts.shared ? elements[0] : undefined;
  elements.forEach((el, i) => {
    const delay = staggerDelay(i);
    el.dataset.pcvDelay = String(delay);
    gsap.from(el, {
      y: opts.y ?? 34,
      opacity: 0,
      duration: ARRIVE_TRAVEL,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: sharedTrigger ?? el, start: 'top 88%' },
    });
  });
}

/**
 * HOLD — the page stops and makes you look. At most one per page (spec §5.1).
 *
 * Pinning is the thing no IntersectionObserver can do: an observer fires when
 * an element crosses a threshold, once, and cannot hold a section in place
 * against distance scrolled. If every call to this function is ever deleted,
 * delete GSAP with it.
 *
 * The layout properties are applied here rather than in markup on purpose.
 * A pinned section must fill the screen or the pin reads as a page that has
 * stopped responding — but that is a consequence of pinning, not of the
 * design, so it must exist in exactly the case that pins and nowhere else.
 *
 * They go through `gsap.set()` rather than `element.style`. This function is
 * only ever called from inside a `gsap.matchMedia()` callback, and a context
 * can only revert what it created — hand-written inline styles are invisible to
 * it. Set by hand, a desktop visitor who narrows the window past 1024px loses
 * the pin but keeps `min-height: calc(100vh - 62px)` and the flex centring
 * forever, leaving a phone-width band stretched to a full viewport with its
 * content floating in the middle. `gsap.set` is a zero-duration tween, so the
 * context records these four properties and puts them back on teardown.
 */
export function hold(section: HTMLElement, distance = 420): void {
  gsap.set(section, {
    minHeight: `calc(100vh - ${HEADER_OFFSET}px)`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  });

  ScrollTrigger.create({
    trigger: section,
    start: `top ${HEADER_OFFSET}px`,
    end: `+=${distance}`,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
  });
}

/**
 * Count-up. Deliberately NOT a primitive — it is a text behaviour governed by
 * the hard rule in spec §5.4, and it is listed separately so nobody mistakes
 * it for a fourth move they may reach for freely.
 *
 * These are one-shot tweens, and that is a correctness requirement rather than
 * taste. A scrubbed counter *owns* the text: whatever progress the scrub is
 * stranded at becomes what the page claims. Jump past the section in a single
 * frame — restored scroll position, the End key, an anchor link — and a scrub
 * renders once at progress 0 and stops, leaving "0 members · 0 nights held"
 * on screen permanently. That is a number on the page that is not true.
 *
 * A one-shot cannot fail that way: its only writer always runs to the end, and
 * if it never fires at all the markup's own value — already the real one — is
 * left untouched. It also stops the numbers counting *down* on scroll-up,
 * which reads as members leaving.
 *
 * `onInterrupt` closes the one remaining route to a false number. A tween that
 * is killed mid-flight — the visitor flips the OS motion preference while it is
 * running, and the matchMedia context reverts — never reaches `onComplete`, so
 * whatever half-counted value `onUpdate` wrote last would stay on the page for
 * good. Both exits therefore write the true value.
 */
export function countUp(elements: HTMLElement[]): void {
  elements.forEach((el, i) => {
    const to = Number(el.dataset.countTo ?? el.textContent ?? 0);
    if (!Number.isFinite(to)) return;
    const counter = { value: 0 };
    const settle = () => {
      el.textContent = String(to);
    };
    gsap.to(counter, {
      value: to,
      duration: 0.9,
      ease: 'power2.out',
      delay: i * 0.12,
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
      onComplete: settle,
      onInterrupt: settle,
    });
  });
}

/**
 * Eased scroll for in-page links. Not one of the four moves — it is navigation,
 * and it must work whether or not motion is allowed, so it is wired outside the
 * matchMedia block and takes the preference as an argument.
 */
export function smoothAnchors(reduced: boolean): void {
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
}

export { gsap, ScrollTrigger };
