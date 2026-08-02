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
