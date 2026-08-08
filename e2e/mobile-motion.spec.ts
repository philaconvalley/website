import { test, expect } from '@playwright/test';

/**
 * What the motion system must NOT do on a phone.
 *
 * Two moves are gated at `min-width: 1024px` — the pin, and the count-up that
 * only makes sense while the pin is holding the section still. Every other spec
 * runs at Desktop Chrome's 1280px, which is above that gate, so nothing there
 * can tell whether the gate exists at all. This file runs under the
 * `mobile-chrome` project (see playwright.config.ts) for exactly that reason.
 *
 * The failure this guards against is not cosmetic: a count-up on a band that
 * slides past at scroll speed is not read, it is a flicker of numbers that are
 * briefly false, and if the tween is interrupted on the way past they stay
 * false.
 */

const NIGHTS = '#nights';

/**
 * Scroll the room band past the top of the viewport, in steps.
 *
 * `scrollIntoViewIfNeeded` is not enough: it stops as soon as the section is
 * merely visible, which can leave its top edge below the counter trigger's
 * `top 62px` start and so never fire the count-up at all — making an assertion
 * that "no count-up ran" pass for the wrong reason. Stepping right through the
 * band, and then on to the bottom of the document, gives the trigger every
 * chance to fire. If a count-up still never writes text, it is because the
 * media gate stopped it.
 */
async function scrollPastNights(page: import('@playwright/test').Page) {
  const top = await page.$eval(NIGHTS, (el) => el.getBoundingClientRect().top + window.scrollY);
  for (let y = Math.max(0, top - 400); y <= top + 600; y += 100) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1600);
}

test.describe('below the 1024px gate', () => {
  test('the viewport really is under the gate', async ({ page }) => {
    await page.goto('/');
    // Guards the guard: if the project's device ever changes to a wide one,
    // every assertion below would pass vacuously.
    expect(await page.evaluate(() => window.innerWidth)).toBeLessThan(1024);
  });

  test('the stat numbers are their true values and never counted up', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Sample the counters continuously from first paint. A count-up that ran
    // and finished would leave the final value in place, so reading only at the
    // end cannot distinguish "never animated" from "animated and landed" — the
    // exact reason this regression was invisible. Any value other than the true
    // one, at any point, means a tween wrote text.
    await page.addInitScript(() => {
      const seen: Record<string, Set<string>> = {};
      (window as unknown as { __pcvSeen: typeof seen }).__pcvSeen = seen;
      const sample = () => {
        document.querySelectorAll<HTMLElement>('#nights [data-count-to]').forEach((el) => {
          const key = el.dataset.countTo ?? '';
          (seen[key] ??= new Set()).add((el.textContent ?? '').trim());
        });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await page.goto('/');
    await scrollPastNights(page);

    const counters = page.locator('#nights [data-count-to]');
    await expect(counters).toHaveCount(3);

    // Sets do not survive serialisation, so flatten them in page context.
    const observed = await page.evaluate(() => {
      const raw = (window as unknown as { __pcvSeen: Record<string, Set<string>> }).__pcvSeen;
      return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, [...v]]));
    });
    expect(Object.keys(observed)).toHaveLength(3);

    for (const [countTo, values] of Object.entries(observed)) {
      expect(values, `#nights counter ${countTo} showed values other than its true one`).toEqual([
        countTo,
      ]);
    }
  });

  test('nothing pins — the room band scrolls away like any other', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const from = await page.$eval(NIGHTS, (el) => el.getBoundingClientRect().top + window.scrollY);
    const tops: number[] = [];
    for (let y = from - 200; y <= from + 900; y += 100) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(120);
      tops.push(await page.$eval(NIGHTS, (el) => Math.round(el.getBoundingClientRect().top)));
    }

    // Longest run of samples that barely moved. A pin would hold it for many.
    let best = 0;
    let run = 1;
    for (let i = 1; i < tops.length; i++) {
      run = Math.abs(tops[i] - tops[i - 1]) <= 2 ? run + 1 : 1;
      best = Math.max(best, run);
    }
    expect(best, 'nothing should hold the room band in place on a phone').toBeLessThan(4);

    // And the pin's layout styling must not be applied either: the band is as
    // tall as its content needs, not stretched to the viewport.
    const stretched = await page.$eval(NIGHTS, (el) => {
      const s = getComputedStyle(el);
      return { display: s.display, minHeight: s.minHeight };
    });
    expect(stretched.display).not.toBe('flex');
  });
});
