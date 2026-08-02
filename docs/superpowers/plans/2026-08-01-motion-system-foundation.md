# Motion System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture a performance baseline, then replace `src/scripts/homepage-motion.ts` with a
reusable, markup-declared motion system and a `Section.astro` component — with zero visible change
to the site.

**Architecture:** Motion becomes two modules. `src/scripts/motion/primitives.ts` exports the
individual moves as plain functions. `src/scripts/motion/index.ts` scans the DOM for `data-pcv-*`
attributes and wires those moves up inside a single `gsap.matchMedia()` block, so reduced-motion is
one code path rather than a JS branch plus a parallel CSS block that can drift. Page authors never
import GSAP again — they add an attribute.

**Tech Stack:** Astro 7, TypeScript, GSAP 3 (ScrollTrigger + ScrollToPlugin, bundled from
`node_modules`), Tailwind 3, Playwright.

## Global Constraints

Copied from `docs/superpowers/specs/2026-08-01-website-redesign-design.md`. Every task's
requirements implicitly include this section.

- **This slice is invisible.** When it merges, the site looks and behaves exactly as it does today.
  No new animation, no layout change, no color change. The proof is that the existing e2e suite
  passes unmodified.
- **Only three moves ship here:** `arrive`, `hold`, and the count-up. `depth` and `seam` are visible
  by definition and land in slice 4 (Home), where a test can observe them. Do not write them now.
- **No scrubbed animation may ever own text content** (spec §5.4). Counters stay one-shot tweens over
  markup that already contains the true value.
- **The header never animates.**
- **No animation may delay anything actionable.** CTAs are clickable on frame one.
- **GSAP is imported from `node_modules`, never a CDN.** The CSP is `script-src 'self'` and is not
  being loosened (spec §9).
- **`HEADER_OFFSET` is `62`** — the sticky header height. Anchor scrolling and pinning both clear it.
- **Reduced motion** is handled by a single `gsap.matchMedia()` path.
- **Node ≥ 22.12.0**, npm (not pnpm). Lint/format run automatically on commit via husky + lint-staged.

---

### Task 1: Capture the Lighthouse performance baseline

Spec §5.5 gates the motion system on costing no more than 3 Lighthouse performance points. That
sentence is meaningless without a number recorded before any of this work lands.

**Files:**

- Create: `docs/perf-baseline.md`

**Interfaces:**

- Consumes: nothing.
- Produces: `docs/perf-baseline.md` containing a performance score per URL, referenced by every later
  slice's performance check.

- [ ] **Step 1: Confirm you are on the redesign branch and the tree is clean**

```bash
git branch --show-current   # expect: waskar/site-redesign
git status --short          # expect: no output
```

- [ ] **Step 2: Build the site**

```bash
npm run build
```

Expected: `astro check` reports 0 errors, then `dist/` is written.

- [ ] **Step 3: Run Lighthouse against the built output**

`.lighthouserc.json` already points at `staticDistDir: "dist"` and the four URLs that matter. CI runs
this through `treosh/lighthouse-ci-action`; locally, `@lhci/cli` is not a dependency, so invoke it
with `npx` rather than adding one.

```bash
npx --yes @lhci/cli@0.15.x autorun --config=.lighthouserc.json --collect.numberOfRuns=3
```

Expected: three runs per URL, then an assertion summary. Assertion failures are fine here — you are
recording reality, not enforcing it. Note the **median performance score** for each of the four URLs.

- [ ] **Step 4: Record the numbers**

Create `docs/perf-baseline.md`. Replace every `<…>` with the actual observed value — this file is
worthless if it contains guesses.

```markdown
# Performance baseline

Captured on `waskar/site-redesign` at commit `<short sha of HEAD before this file>`, immediately
before the motion system landed. Spec §5.5 gates the redesign on staying within 3 performance
points of these numbers.

Command: `npx @lhci/cli@0.15.x autorun --config=.lighthouserc.json --collect.numberOfRuns=3`
Machine: local dev (numbers are not comparable to CI — re-baseline there if CI is ever the gate).

| URL          | Performance | Accessibility | Best practices | SEO   |
| ------------ | ----------- | ------------- | -------------- | ----- |
| `/`          | `<n>`       | `<n>`         | `<n>`          | `<n>` |
| `/about/`    | `<n>`       | `<n>`         | `<n>`          | `<n>` |
| `/events/`   | `<n>`       | `<n>`         | `<n>`          | `<n>` |
| `/projects/` | `<n>`       | `<n>`         | `<n>`          | `<n>` |

If any page later drops more than 3 performance points against this table, spec §5.5 applies:
depth drops to two planes site-wide before anything else is cut.
```

- [ ] **Step 5: Commit**

```bash
git add docs/perf-baseline.md
git commit -m "docs(perf): Record the Lighthouse baseline before the motion system"
```

---

### Task 2: Extract the motion primitives and the attribute scanner

Move today's behavior into the new modules unchanged. The existing e2e suite is the test: it was
written against the current behavior and must pass without edits.

**Files:**

- Create: `src/scripts/motion/primitives.ts`
- Create: `src/scripts/motion/index.ts`
- Modify: `src/pages/index.astro` (attributes + import swap)
- Delete: `src/scripts/homepage-motion.ts`
- Test: `e2e/scroll-choreography.spec.ts`, `e2e/motion-preferences.spec.ts` (existing, unmodified)

**Interfaces:**

- Consumes: `HEADER_OFFSET` is defined here for the first time.
- Produces:
  - `HEADER_OFFSET: number`
  - `staggerDelay(index: number, base?: number): number`
  - `groups(selector: string): HTMLElement[][]`
  - `arrive(elements: HTMLElement[], opts?: { y?: number }): void`
  - `hold(section: HTMLElement, distance?: number): void`
  - `countUp(elements: HTMLElement[]): void`
  - `smoothAnchors(reduced: boolean): void`

- [ ] **Step 1: Run the existing suite and confirm it is green before you touch anything**

```bash
npm run test:e2e -- scroll-choreography motion-preferences
```

Expected: PASS. If it is red before you start, stop and fix that first — you cannot prove an
invisible refactor against a broken baseline.

- [ ] **Step 2: Write `src/scripts/motion/primitives.ts`**

```ts
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
 */
export function hold(section: HTMLElement, distance = 420): void {
  section.style.minHeight = `calc(100vh - ${HEADER_OFFSET}px)`;
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.justifyContent = 'center';

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
 */
export function countUp(elements: HTMLElement[]): void {
  elements.forEach((el, i) => {
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
```

- [ ] **Step 3: Write `src/scripts/motion/index.ts`**

```ts
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
  countUpInHolds();
});

media.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
  document.querySelectorAll<HTMLElement>('[data-pcv-hold]').forEach((section) => hold(section));
});

/**
 * Counters fire when their section is reached, once. Scoped to hold sections
 * because that is the only place the page is standing still long enough for a
 * count to be read rather than glimpsed.
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
```

- [ ] **Step 4: Add the attributes to `src/pages/index.astro`**

These reproduce exactly what `homepage-motion.ts` selected by CSS selector today.

- On the `#what` and `#build` section elements, and on `#nights`, add `data-pcv-section`.
- On the `<h2>` inside `#what`, `#build`, and `#nights`, add `data-pcv-arrive`.
- On the `.pcv-card` divs in `#what` and `#build`, add `data-pcv-arrive`.
- On each `[data-pcv-photo]` div in `#nights`, add `data-pcv-arrive`.
- On the `#nights` section element, add `data-pcv-hold`.

Example, on the tracks grid in `#what`:

```astro
{
  tracks.map((track) => (
    <div class="pcv-card" data-pcv-arrive>
      …unchanged…
    </div>
  ))
}
```

- [ ] **Step 5: Swap the import and delete the old module**

In `src/pages/index.astro`, change the bottom script block:

```astro
<script>
  import '../scripts/motion';
</script>
```

Then:

```bash
git rm src/scripts/homepage-motion.ts
```

- [ ] **Step 6: Typecheck and build**

```bash
npm run build
```

Expected: `astro check` reports 0 errors. If it reports an unused export or a missing type, fix it
now — do not proceed with a red typecheck.

- [ ] **Step 7: Run the existing suite unmodified**

```bash
npm run test:e2e -- scroll-choreography motion-preferences
```

Expected: PASS, with no edits to either spec file. This is the whole proof of the task: the pin
still holds, the counters still land on their real values, reduced motion still pins nothing, and
the hero entrance CSS is untouched.

If `scroll-choreography` fails on the pin, the most likely cause is the `min-width: 1024px`
condition — Playwright's default Desktop Chrome viewport is 1280 wide, so it should pass; check that
you used `min-width: 1024px` and not `min-width: 1280px`.

- [ ] **Step 8: Run the whole suite, to catch anything the refactor touched by accident**

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A src/scripts src/pages/index.astro
git commit -m "ref(motion): Move the homepage choreography into a declarative motion system

Pages now declare motion with data-pcv-* attributes instead of the script
reaching in by CSS selector, so a contributor can add motion without opening
a GSAP doc and without inventing a second way to do it.

Behaviour is unchanged. The existing scroll-choreography and motion-preferences
specs pass unmodified, which is the point: an invisible refactor proved by a
suite written before it."
```

---

### Task 3: Prove the humanised stagger

Task 2 introduced `staggerDelay` but nothing asserts it. This adds the test that makes the
irregularity a guaranteed property rather than an accident someone can flatten later.

**Files:**

- Create: `e2e/motion-system.spec.ts`

**Interfaces:**

- Consumes: `data-pcv-delay` written by `arrive()` in Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

/**
 * The stagger is humanised (spec §5.2): evenly-spaced entrances read as a
 * machine, so each element's delay carries a small fixed offset. This asserts
 * the property that makes it human — the gaps between consecutive delays are
 * not all identical — and asserts it is deterministic, because a random
 * version would flicker between renders and could not be tested at all.
 */
test.describe('humanised stagger', () => {
  test('arriving elements in a group get unequal, deterministic delays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // Scoped to the cards, not to every arriving element: the section's <h2>
    // also arrives and is index 0 of the same group, so an unscoped locator
    // matches four elements, not three.
    const cards = page.locator('#what .pcv-card[data-pcv-delay]');
    await expect(cards).toHaveCount(3);

    const delays = await cards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.pcvDelay)),
    );

    // Strictly increasing — later elements never arrive before earlier ones.
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(new Set(delays).size).toBe(delays.length);

    // And the gaps are not uniform, which is the entire point.
    const gaps = delays.slice(1).map((d, i) => Number((d - delays[i]).toFixed(3)));
    expect(new Set(gaps).size).toBeGreaterThan(1);
  });

  test('delays are identical across reloads', async ({ page }) => {
    await page.goto('/');
    const read = () =>
      page
        .locator('#what [data-pcv-arrive][data-pcv-delay]')
        .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.pcvDelay));

    const first = await read();
    await page.reload();
    const second = await read();

    expect(second).toEqual(first);
  });

  test('stagger restarts per section rather than running across the page', async ({ page }) => {
    await page.goto('/');
    const firstOf = (sel: string) =>
      page
        .locator(`${sel} [data-pcv-arrive][data-pcv-delay]`)
        .first()
        .getAttribute('data-pcv-delay');

    expect(await firstOf('#what')).toBe(await firstOf('#build'));
  });
});
```

- [ ] **Step 2: Run it and watch it fail for the right reason**

```bash
npm run test:e2e -- motion-system
```

Expected: if Task 2 is complete this **passes**. If it fails with `toHaveCount(3)` receiving 0, the
`data-pcv-arrive` attributes from Task 2 Step 4 are missing — fix the markup, not the test. If the
uniform-gaps assertion fails, `JITTER` was dropped or flattened to zeros.

- [ ] **Step 3: Commit**

```bash
git add e2e/motion-system.spec.ts
git commit -m "test(motion): Assert the stagger is uneven, deterministic and per-section"
```

---

### Task 4: Introduce `Section.astro`

The colour rhythm in spec §4 is a rule, and a rule written in a doc gets ignored in four months. A
component that only accepts five roles cannot be ignored. This task creates it and adopts it on the
homepage **without changing any colour** — the role is recorded, not yet rendered. Slice 3 is the
single file that turns roles into backgrounds.

**Files:**

- Create: `src/components/Section.astro`
- Modify: `src/pages/index.astro`
- Test: `e2e/motion-system.spec.ts` (extend)

**Interfaces:**

- Consumes: nothing from Task 3.
- Produces: `Section.astro` with props
  `{ role: 'door' | 'air' | 'room' | 'work' | 'invitation'; hold?: boolean; id?: string; class?: string }`,
  rendering `<section data-pcv-section={role}>` plus `data-pcv-hold` when `hold` is true.

- [ ] **Step 1: Write `src/components/Section.astro`**

```astro
---
/**
 * A band of the page.
 *
 * Every page runs the same sequence — open air, the door, inside the room,
 * the invitation — and colour marks position in that story rather than which
 * page you are on. That rule lives here rather than in a doc because a
 * component with five allowed roles cannot be quietly ignored, and a
 * convention can.
 *
 * `role` is a prop, NOT the ARIA `role` attribute, and is deliberately not
 * forwarded to the DOM: "air" is not a valid ARIA role and would be a real
 * accessibility defect if it leaked. It is exposed as `data-pcv-section`,
 * which the motion scanner also uses to scope stagger groups.
 *
 * This component renders no background of its own yet. Adopting it and
 * restyling the site are two different changes, and doing them together would
 * mean a refactor nobody could review. Slice 3 replaces the `class`
 * pass-through with a role-driven background, in this file only.
 */
type Role = 'door' | 'air' | 'room' | 'work' | 'invitation';

interface Props {
  role: Role;
  hold?: boolean;
  id?: string;
  class?: string;
}

const { role, hold = false, id, class: className } = Astro.props;
---

<section id={id} class={className} data-pcv-section={role} data-pcv-hold={hold ? '' : undefined}>
  <slot />
</section>
```

- [ ] **Step 2: Adopt it on the homepage, changing no classes**

In `src/pages/index.astro`, replace the raw `<section>` elements with `<Section>`, moving the
existing class list across verbatim and dropping the `data-pcv-section` / `data-pcv-hold` attributes
you added by hand in Task 2 Step 4 (the component supplies them now).

Add the import at the top of the frontmatter:

```astro
import Section from '../components/Section.astro';
```

The five conversions, with classes copied exactly as they are today:

```astro
<Section role="door" id="top" class="bg-brand-sky px-5 lg:px-8 pt-[74px] pb-[30px] text-center" />
```

```astro
<Section role="air" id="what" class="px-5 lg:px-8 py-14 lg:py-[88px] bg-brand-cream" />
```

```astro
<Section role="room" id="nights" class="bg-brand-dark text-white" hold />
```

```astro
<Section role="work" id="build" class="px-5 lg:px-8 py-14 lg:py-[88px] bg-primary-50" />
```

```astro
<Section
  role="invitation"
  id="join"
  class="bg-brand-pink text-white border-y-2 border-brand-dark px-5 lg:px-8 py-14 lg:py-[88px] text-center"
/>
```

Leave the conditional next-night `<section>` as a raw element. It carries `data-pcv-event-start` and
is removed wholesale by `public/js/event-freshness.js`; wrapping it buys nothing and adds a prop
pass-through for an attribute only it uses.

- [ ] **Step 3: Extend the test**

Append to `e2e/motion-system.spec.ts`:

```ts
test.describe('section roles', () => {
  test('the homepage bands declare their story position', async ({ page }) => {
    await page.goto('/');
    const roles = await page
      .locator('[data-pcv-section]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-pcv-section')));

    expect(roles).toEqual(['door', 'air', 'room', 'work', 'invitation']);
  });

  test('the story position never leaks into ARIA', async ({ page }) => {
    await page.goto('/');
    // "air" and "door" are not valid ARIA roles. If `role` is ever forwarded to
    // the DOM this becomes a genuine accessibility defect, so assert it is not.
    await expect(page.locator('section[role="air"], section[role="door"]')).toHaveCount(0);
  });

  test('exactly one section holds, per spec §5.1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-pcv-hold]')).toHaveCount(1);
  });
});
```

- [ ] **Step 4: Build and run the full suite**

```bash
npm run build && npm run test:e2e
```

Expected: PASS, including `landmarks.spec.ts` — `BaseLayout` already supplies the single `<main>`,
and `Section` renders `<section>`, so the landmark count is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/Section.astro src/pages/index.astro e2e/motion-system.spec.ts
git commit -m "feat(sections): Add Section.astro and adopt it on the homepage

Colour is about to stop meaning which page you are on and start meaning where
you are in the story. Putting that rule in a component rather than a doc is
what stops it decaying: five roles, no others.

No colour changes here. The role is recorded, not yet rendered, so this stays
reviewable and slice 3 is a single-file change."
```

---

### Task 5: Guard the site against its own JavaScript

Direction A means depth is earned by motion — so the day GSAP fails to load, the site must go flat
rather than go blank. Nothing currently asserts that. This is cheap now and expensive to retrofit
after `depth` and `seam` land in slice 4.

**Files:**

- Create: `e2e/no-js.spec.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

/**
 * The redesign earns its depth from motion, which means the site's structure
 * must never *depend* on the motion running. If a bundle fails to load, a CSP
 * change blocks it, or a browser is simply slow, the page has to degrade to a
 * flat, complete, readable document — not a blank one.
 *
 * `arrive()` animates *from* opacity 0, so the elements' resting state is
 * visible and this holds today. It is asserted here so that a later change to
 * a `to()` tween, or a CSS class that pre-hides elements, fails loudly.
 */
test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('every homepage band renders and is readable', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-pcv-section]')).toHaveCount(5);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    for (const el of await page.locator('#what .pcv-card').all()) {
      await expect(el).toBeVisible();
      await expect(el).toHaveCSS('opacity', '1');
    }
  });

  test('the stat numbers are already true before any script runs', async ({ page }) => {
    await page.goto('/');
    const counters = page.locator('#nights [data-count-to]');
    await expect(counters).toHaveCount(3);
    for (const el of await counters.all()) {
      expect((await el.textContent())?.trim()).toBe(await el.getAttribute('data-count-to'));
    }
  });

  test('the primary call to action is present and clickable', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#top a').first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /.+/);
  });
});
```

- [ ] **Step 2: Run it**

```bash
npm run test:e2e -- no-js
```

Expected: PASS. If the card-opacity assertion fails, something is hiding elements in CSS before JS
runs — that is a real bug this test exists to catch, and the fix is in the CSS, not the test.

- [ ] **Step 3: Run everything one final time**

```bash
npm run lint && npm run build && npm run test:e2e && npm run test:csp
```

Expected: all PASS. `test:csp` matters here: GSAP is bundled by Astro under `script-src 'self'`, and
this slice must not have introduced an inline script or a new origin.

- [ ] **Step 4: Re-run Lighthouse and compare against the baseline**

```bash
npx --yes @lhci/cli@0.15.x autorun --config=.lighthouserc.json --collect.numberOfRuns=3
```

Compare each URL's median performance score against `docs/perf-baseline.md`. This slice changed no
markup weight and added no library, so expect it to be within noise. If any page is more than 3
points down, stop and investigate before slice 3 — spec §5.5 applies, and finding it here is far
cheaper than finding it after five pages are rebuilt.

- [ ] **Step 5: Commit**

```bash
git add e2e/no-js.spec.ts
git commit -m "test(no-js): Assert the site degrades flat rather than blank

Depth is earned by motion in this design, so the failure mode of a missing
bundle has to be a flat page, never an empty one. Cheap to assert now, and
expensive to retrofit once depth and seams land."
```

---

## What this slice deliberately does not do

- **No `depth`, no `seam`.** Both are visible by definition, and slice 2 is invisible. They land in
  slice 4 on Home, where a test can observe them. Writing them now would mean shipping untested code
  and calling it done.
- **No colour changes.** `Section` records its role and renders the existing classes. Slice 3 turns
  roles into backgrounds in one file.
- **No page merges, no redirects, no deletions.** Slices 5–9.
- **No contributor pipeline and no photography.** Slice 6 and an external dependency respectively.

## Open question blocking slice 3

Spec §4 states the `door` role is `brand-yellow` (`#FDC873`) on every page. The homepage hero is
currently `bg-brand-sky` (`#54B5FC`), and `docs/design-system.md` — which claims Home is yellow — is
stale relative to the code. Since the homepage is the agreed north star, the spec and the code
disagree about the single most-repeated colour on the site.

This does not block slices 1 or 2, which change no colours. It must be resolved before slice 3.
