import { test, expect } from '@playwright/test';

/**
 * The rule under the header reports scroll position on every page.
 *
 * It is asserted on the *computed transform* rather than an inline style string,
 * so it still passes if the implementation moves to a scroll-driven CSS
 * animation or anything else that ends up as a real scaleX on the element.
 *
 * Deliberately not gated on prefers-reduced-motion: the rule reports where the
 * visitor already is rather than animating on its own clock, so it must keep
 * working when motion is off. motion-preferences.spec.ts covers what does stop.
 */
function scaleX(transform: string): number {
  if (transform === 'none') return 1;
  const parts = transform.match(/matrix\(([^)]+)\)/);
  if (!parts) throw new Error(`unexpected transform "${transform}"`);
  return Number(parts[1].split(',')[0]);
}

async function ruleScale(page: import('@playwright/test').Page): Promise<number> {
  const transform = await page
    .locator('[data-pcv-progress]')
    .evaluate((el) => getComputedStyle(el).transform);
  return scaleX(transform);
}

test.describe('header scroll progress rule', () => {
  test('starts empty and fills as the homepage is scrolled', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-pcv-progress]')).toBeAttached();

    expect(await ruleScale(page), 'rule should start empty at the top of the page').toBeLessThan(
      0.02,
    );

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    // The rule updates in a rAF callback, so wait for the value rather than a timeout.
    await expect
      .poll(() => ruleScale(page), { message: 'rule should be full at the bottom' })
      .toBeGreaterThan(0.98);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() => ruleScale(page), { message: 'rule should reverse back to empty' })
      .toBeLessThan(0.02);
  });

  test('reports zero, not full, on a page too short to scroll', async ({ page }) => {
    /*
     * The viewport is made taller than the document rather than trusting some
     * page to be short: every route scrolls at a normal desktop height, so
     * picking one and skipping when it does not left this case uncovered.
     */
    await page.setViewportSize({ width: 1280, height: 4000 });
    await page.goto('/contact');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight), {
        message: 'viewport should be taller than the document for this assertion to mean anything',
      })
      .toBeLessThanOrEqual(0);

    /*
     * The failure this pins: `scrollY / 0` is NaN and `Math.min(1, NaN)` is NaN,
     * which lands in the transform as an invalid value. An earlier shape of this
     * guard read `scrollable > 0 ? … : 1` and drew a full rule on a page the
     * visitor had not moved through at all.
     */
    expect(await ruleScale(page)).toBeLessThan(0.02);
  });

  test('is present on a page that is not the homepage', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('[data-pcv-progress]')).toBeAttached();
  });
});
