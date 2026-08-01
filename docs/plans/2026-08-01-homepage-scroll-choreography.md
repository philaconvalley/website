# Homepage Scroll Choreography Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make GSAP earn the 44 KB it already costs, by giving it work only a scroll runtime can do — a scrubbed skyline parallax and one pinned, orchestrated moment — instead of nine interchangeable fade-ups.

**Architecture:** The homepage motion moves out of an inline `<script>` in `index.astro` and into a single module, `src/scripts/homepage-motion.ts`. That module owns every GSAP call, reads one `prefers-reduced-motion` check, and exposes nothing. Two effects are added that have no native equivalent — a scrubbed parallax on the skyline band (tied to scroll _position_, reversible) and a pinned "the room" section whose stat counters run during the pin. The existing entry reveals stay as they are. The horizontal card track is explicitly not built.

**Tech Stack:** Astro 7, Tailwind 3.4, GSAP 3 + ScrollTrigger (already in `package.json`), Playwright for verification.

---

## Why this shape

The decision was to keep GSAP rather than replace it with `scroll-behavior: smooth` + `IntersectionObserver`. That choice only pays off if the library does something the native path cannot. Today it does not: both current effects are entry-triggered, which is exactly what `IntersectionObserver` is for.

The two effects below are the justification, and they are deliberately the _only_ two:

- **Scrubbed parallax** binds progress to scroll position and reverses when you scroll back. `IntersectionObserver` fires on crossing, not position — there is no cheap native equivalent.
- **Pinning** holds a section while its contents advance. `position: sticky` can hold an element, but not drive a timeline against the distance travelled.

**Explicit non-goal: the horizontal card track.** Measured during mock-up: with three cards at their real width the track travels **296px**, and **656px** after widening the cards specifically to make it legible. The page does not have enough content for the effect to read. Building it would be motion for its own sake, which is the thing this plan exists to avoid.

**Blocked on:** design sign-off from Diego and Saige. These are now designed effects, not switches. Do not merge the choreography tasks (4–6) without it. Tasks 1–3 and 7 are cleanup and structure; they are safe to land first.

---

## Task 1: Delete the dead animation utilities

Three animation utilities survive in `global.css` that no component references. They were left behind when `BuilderNightTrack` was removed and the redesign replaced the old hero.

**Files:**

- Modify: `src/styles/global.css`

**Step 1: Confirm they are actually unused**

```bash
for c in pcv-enter-word pcv-enter-stat animate-slide-up; do
  printf "%-18s " "$c"; grep -rl "$c" src --include="*.astro" | tr '\n' ' '; echo
done
```

Expected: three names, each with no file listed after it.

**Step 2: Delete the utilities and their keyframes**

Remove `.pcv-enter-word`, `.pcv-enter-stat`, `.animate-slide-up` and the `@keyframes pcvWord`, `@keyframes pcvStat`, `@keyframes slideUp` blocks they reference. Leave `.pcv-enter-rise`, `.pcv-enter-bar`, `.pcv-loop-bob` and `.animate-fade-in` — those are used by `index.astro`, `EventBar.astro`, `Footer.astro` and `Header.astro` respectively.

Also remove the now-stale sentence in the block comment that describes `.pcv-enter-*` as a family of three.

**Step 3: Verify nothing regressed**

```bash
npm run build && npm run test:e2e
```

Expected: build completes, 15 passed / 9 skipped.

**Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "ref(styles): Drop three animation utilities no component uses"
```

---

## Task 2: Extract the stat line into a component

Counter animation needs individual numbers to animate. Today the stats exist only inside `memberLine`, a single interpolated string rendered twice (`index.astro:247` and `index.astro:334`). Splitting it inline in two places would reintroduce exactly the drift the original commit removed, so it becomes one component with one source.

**Files:**

- Create: `src/components/StatLine.astro`
- Modify: `src/pages/index.astro` (remove `memberLine`, use the component in both places)

**Step 1: Write the failing test**

Create `e2e/stat-line.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('stat line', () => {
  test('both copies render the same numbers', async ({ page }) => {
    await page.goto('/');
    const lines = page.locator('[data-testid="stat-line"]');
    await expect(lines).toHaveCount(2);
    const [a, b] = await lines.allTextContents();
    expect(a.replace(/\s+/g, ' ')).toBe(b.replace(/\s+/g, ' '));
  });

  test('each number is individually addressable for animation', async ({ page }) => {
    await page.goto('/');
    const counts = page.locator('[data-testid="stat-line"]').first().locator('[data-count-to]');
    await expect(counts).toHaveCount(3);
    for (const el of await counts.all()) {
      expect(Number(await el.getAttribute('data-count-to'))).toBeGreaterThanOrEqual(0);
    }
  });
});
```

**Step 2: Run it and watch it fail**

```bash
npx playwright test e2e/stat-line.spec.ts
```

Expected: FAIL — `toHaveCount(2)` receives 0.

**Step 3: Write the component**

`src/components/StatLine.astro` takes the three counts as props, renders `<span data-count-to="N">N</span>` per number joined by `·`, and carries `data-testid="stat-line"`. The rendered text must be byte-identical to today's `memberLine` output so nothing visually shifts. Singular/plural stays where it is now — in the label, not the number.

**Step 4: Use it in both places**

Replace the `memberLine` interpolation at `index.astro:247` and `:334`, and delete the `memberLine` const and its comment from the frontmatter. Keep the `font-mono` classes on the call sites, since the two contexts style it differently (`text-brand-dark/60` vs `text-white/80`).

**Step 5: Verify**

```bash
npx playwright test e2e/stat-line.spec.ts && npm run build
```

Expected: 2 passed; build clean.

**Step 6: Commit**

```bash
git add src/components/StatLine.astro src/pages/index.astro e2e/stat-line.spec.ts
git commit -m "ref(home): Make the stat line a component so its numbers can animate"
```

---

## Task 3: Move the motion into a module

**Files:**

- Create: `src/scripts/homepage-motion.ts`
- Modify: `src/pages/index.astro:351-406` (the `<script>` block becomes a single import)

**Step 1: Move the code verbatim first**

Cut the existing body of the `<script>` into `src/scripts/homepage-motion.ts` with no behavioural change, and reduce the page to:

```astro
<script>
  import '../scripts/homepage-motion';
</script>
```

Astro bundles the import, so this stays covered by `script-src 'self'` and adds no inline hash.

**Step 2: Add the two refresh hooks**

ScrollTrigger caches element positions at creation. Two things move them afterwards on this page:

```ts
// public/js/event-freshness.js removes the whole next-night band once the event
// has started, which shortens the document under every trigger below it.
// ScrollTrigger's own refresh on `load` covers that, but webfonts settle later
// and change every text block's height, so ask for one more.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
```

**Step 3: Verify nothing changed**

```bash
npm run build && npm run csp:hash && npm run test:e2e
```

Expected: build clean; **CSP hashes in sync** (unchanged count); 15 passed / 9 skipped.

**Step 4: Commit**

```bash
git add src/scripts/homepage-motion.ts src/pages/index.astro
git commit -m "ref(home): Move homepage motion into a module and refresh after fonts settle"
```

---

## Task 4: Scrub the skyline parallax

The signature effect. The band's background is a mirror-seamless repeating tile, so shifting `background-position-x` moves the city sideways against the hero with no edge to expose — the seam is what makes this cheap.

**Files:**

- Modify: `src/components/SkylineBand.astro` (add a hook attribute)
- Modify: `src/scripts/homepage-motion.ts`

**Step 1: Write the failing test**

Add to `e2e/motion-preferences.spec.ts`:

```ts
test('the skyline parallax is scrubbed by scroll position, and reverses', async ({ page }) => {
  await page.goto('/');
  const posAt = async (y: number) => {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(400);
    return page.$eval('[data-pcv-parallax]', (el) => getComputedStyle(el).backgroundPositionX);
  };
  const top = await posAt(0);
  const mid = await posAt(600);
  expect(mid).not.toBe(top);
  expect(await posAt(0)).toBe(top); // reversible — the half IntersectionObserver cannot do
});
```

**Step 2: Run it and watch it fail**

Expected: FAIL — no element matches `[data-pcv-parallax]`.

**Step 3: Implement**

Add `data-pcv-parallax` to the band wrapper in `SkylineBand.astro`. In the motion module:

```ts
gsap.to('[data-pcv-parallax]', {
  backgroundPositionX: '-260px',
  ease: 'none',
  scrollTrigger: {
    trigger: '[data-pcv-parallax]',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.6,
  },
});
```

Guard the whole thing behind the existing `reduced` check.

**Step 4: Verify, including reduced motion**

```bash
npx playwright test e2e/motion-preferences.spec.ts
```

Expected: all pass, including the existing reduced-motion cases.

**Step 5: Commit**

```bash
git add src/components/SkylineBand.astro src/scripts/homepage-motion.ts e2e/motion-preferences.spec.ts
git commit -m "feat(home): Scrub the skyline sideways against the hero on scroll"
```

---

## Task 5: Pin the room, run the counters during the pin

The orchestrated moment. `#nights` holds still while the stat card assembles and its three numbers count up. This is the one place the page spends its boldness.

**Files:**

- Modify: `src/pages/index.astro` (`#nights` needs a min-height under the pin)
- Modify: `src/scripts/homepage-motion.ts`

**Step 1: Write the failing test**

Create `e2e/pinned-room.spec.ts` asserting the section's `top` stays fixed across three scroll positions inside the pin range, and that the counters end on the real values from `data-count-to`.

**Step 2: Run it and watch it fail**

Expected: FAIL — the section top moves with the scroll.

**Step 3: Implement**

Pin `#nights` with `start: 'top 62px'` — matching the sticky header offset the anchor scroll already uses, so the section's own heading is never cropped. Give it `min-height` under the pin only, or the section below stays in frame and the pin reads as a stuck page. Drive the counters from a timeline bound to the same trigger, writing through `Math.round`.

**Step 4: Check the pin against the real layout**

Pinning breaks if an ancestor has `overflow: hidden` or a `transform`. Verify:

```bash
grep -n "overflow\|transform" src/layouts/BaseLayout.astro
```

Expected: nothing on the `<main>` wrapper. If there is, the pin needs `pinType: 'transform'`.

**Step 5: Verify**

```bash
npx playwright test e2e/pinned-room.spec.ts && npm run test:e2e
```

**Step 6: Commit**

```bash
git add src/pages/index.astro src/scripts/homepage-motion.ts e2e/pinned-room.spec.ts
git commit -m "feat(home): Pin the room section while its numbers count up"
```

---

## Task 6: Close the reveal gap

`#nights` gets a reveal on its `<h2>` but nothing on the photo mosaic beneath it (`index.astro:211`). Once the gallery collection has entries, the heading will animate while five photos pop in under it. Invisible today only because the collection is empty.

**Files:**

- Modify: `src/scripts/homepage-motion.ts`

Add the mosaic's children to the reveal selector with the same stagger the cards use. Verify by adding a temporary entry to `src/content/gallery/`, checking the reveal, then removing it.

**Commit:** `fix(home): Reveal the photo mosaic instead of popping it in under an animated heading`

---

## Task 7: Full verification pass

**Step 1: Everything green**

```bash
npm run lint
npm run build
npm run csp:hash
npx prettier --check .
npm run test:e2e
```

**Step 2: Confirm the payload did not grow**

```bash
ls -l dist/_astro/*.js | awk '{printf "%-46s %6d KB\n", $9, $5/1024}'
```

Expected: the homepage bundle stays at ~114 KB raw / 44 KB gzip. If it grew, a plugin was added — ScrollToPlugin and ScrollTrigger are the only two this page should import.

**Step 3: Reduced motion, by hand**

macOS System Settings → Accessibility → Display → Reduce motion. Reload. Expected: no parallax, no pin, no counter tick — numbers render at their final values, and every section is legible without scrolling past it.

---

## Out of scope, tracked elsewhere

- `JetBrains Mono` loads on all 12 pages for one page's use — follow-up issue.
- `src/content/gallery` is empty, so the build prints a collection warning twice — issue #6.
- Whether the redesign covers about/events/join/contact — open question for Diego and Saige.
