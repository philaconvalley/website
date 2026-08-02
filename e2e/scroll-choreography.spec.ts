import { test, expect } from '@playwright/test';

/**
 * The two effects that justify carrying GSAP at all.
 *
 * Both are things IntersectionObserver cannot do: it fires when an element
 * *crosses* a threshold, once, in one direction. These are bound to scroll
 * *position*, and they run backwards when you scroll back up. If either of
 * these tests is deleted, the library should be deleted with it.
 */

const bandHeight = (page: import('@playwright/test').Page) =>
  page.$eval('[data-pcv-skyline]', (el) => Math.round(el.getBoundingClientRect().height));

/**
 * `settle` is the wait after scrolling. A pin takes effect on the same frame,
 * so position checks need almost nothing; a 0.6s scrub has inertia and needs
 * time to catch up before its value means anything.
 */
async function scrollTo(page: import('@playwright/test').Page, y: number, settle = 900) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(settle);
}

test.describe('skyline band', () => {
  test('grows taller as you scroll down, and shrinks back when you scroll up', async ({ page }) => {
    await page.goto('/');
    await scrollTo(page, 0);
    const atRest = await bandHeight(page);

    await scrollTo(page, 560);
    expect(await bandHeight(page), 'the city should rise as you scroll').toBeGreaterThan(atRest);

    // Reversibility is the whole argument for a scrub over an observer.
    await scrollTo(page, 0);
    expect(await bandHeight(page)).toBe(atRest);
  });

  test('pushes the page down as it grows rather than covering it', async ({ page }) => {
    await page.goto('/');
    await scrollTo(page, 0);
    const before = await page.$eval(
      '#what',
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );

    await scrollTo(page, 560);
    const after = await page.$eval(
      '#what',
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );

    expect(after, 'the section below should be displaced downward').toBeGreaterThan(before);
  });

  test('does not grow when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const atRest = await bandHeight(page);
    await scrollTo(page, 560);
    expect(await bandHeight(page)).toBe(atRest);
  });
});

/**
 * Sample the section's viewport position across a scroll sweep. Pinning is
 * asserted from what the visitor can see — the section stops moving while the
 * page keeps scrolling — rather than by reaching into ScrollTrigger's internals,
 * which an ES module does not expose on window anyway.
 */
async function sweep(page: import('@playwright/test').Page) {
  const from = await page.$eval('#nights', (el) => el.getBoundingClientRect().top + window.scrollY);
  const samples: { y: number; top: number }[] = [];
  for (let y = from - 200; y <= from + 1200; y += 100) {
    await scrollTo(page, y, 120);
    samples.push({
      y,
      top: await page.$eval('#nights', (el) => Math.round(el.getBoundingClientRect().top)),
    });
  }
  return samples;
}

/** Longest run of consecutive samples whose top stayed within 2px. */
function longestHold(samples: { top: number }[]) {
  let best = 0;
  let run = 1;
  for (let i = 1; i < samples.length; i++) {
    run = Math.abs(samples[i].top - samples[i - 1].top) <= 2 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

test.describe('pinned room section', () => {
  test('holds still while the page keeps scrolling, then releases', async ({ page }) => {
    await page.goto('/');
    const samples = await sweep(page);

    expect(
      longestHold(samples),
      'section should stay put across several scroll steps',
    ).toBeGreaterThanOrEqual(4);

    // And it is a pin, not a permanently stuck element: it moves again after.
    const first = samples[0].top;
    const last = samples[samples.length - 1].top;
    expect(last).toBeLessThan(first);
  });

  test('counters land on the real values, not wherever the tween stopped', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1600);

    const counters = page.locator('#nights [data-count-to]');
    await expect(counters).toHaveCount(3);
    for (const el of await counters.all()) {
      expect((await el.textContent())?.trim()).toBe(await el.getAttribute('data-count-to'));
    }
  });

  test('nothing is pinned and numbers are final when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const samples = await sweep(page);
    expect(longestHold(samples), 'nothing should hold the section in place').toBeLessThan(4);

    for (const el of await page.locator('#nights [data-count-to]').all()) {
      expect((await el.textContent())?.trim()).toBe(await el.getAttribute('data-count-to'));
    }
  });
});
