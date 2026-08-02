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
const JITTER = [0, 0.037, 0.019, 0.051, 0.008, 0.043, 0.026, 0.061];

export function staggerDelay(index: number, base = 0.09): number {
  return Number((index * base + JITTER[index % JITTER.length]).toFixed(3));
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
 */
export function arrive(elements: HTMLElement[], opts: { y?: number } = {}): void {
  elements.forEach((el, i) => {
    const delay = staggerDelay(i);
    el.dataset.pcvDelay = String(delay);
    gsap.from(el, {
      y: opts.y ?? 34,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 88%' },
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
