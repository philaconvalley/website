import { test, expect } from '@playwright/test';

/**
 * The effect that justifies carrying GSAP at all.
 *
 * Pinning is the thing IntersectionObserver cannot do: an observer fires when
 * an element *crosses* a threshold, once, and cannot hold a section in place
 * against the distance scrolled. If this file is deleted, the library should be
 * deleted with it.
 */

async function scrollTo(page: import('@playwright/test').Page, y: number, settle = 120) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(settle);
}

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
