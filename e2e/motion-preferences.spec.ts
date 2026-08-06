import { test, expect, type Page } from '@playwright/test';
import type { CDPSession } from '@playwright/test';

async function setReducedTransparency(page: Page, reduce: boolean) {
  const client: CDPSession = await page.context().newCDPSession(page);
  await client.send('Emulation.setEmulatedMedia', {
    features: reduce ? [{ name: 'prefers-reduced-transparency', value: 'reduce' }] : [],
  });
  return client;
}

test.describe('prefers-reduced-motion', () => {
  test('hero entrance animations run normally with no preference', async ({ page }) => {
    // The hero used to animate in CSS (`animation-name: pcvRise`) on its own
    // 0.9s clock while the rest of the page arrived on GSAP's. It is now on the
    // one motion system, so the proof moved with it: `data-pcv-delay` is
    // written by arrive() and only exists when the system actually wired this
    // element up. Asserting a real value is a stronger check than asserting a
    // keyframe name — a stray CSS class could satisfy the old assertion.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const tagline = page.locator('[data-testid="hero-tagline"]');
    await expect(tagline).toHaveAttribute('data-pcv-delay', /^\d/);
    await expect(tagline).toBeVisible();
  });

  test('scroll-revealed cards are visible when motion is reduced', async ({ page }) => {
    // GSAP reveals these by animating from opacity 0. If the reduced-motion
    // branch ever stops skipping that, the cards stay invisible forever rather
    // than merely un-animated — so assert they are actually painted.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const card = page.locator('#what .pcv-card').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('opacity', '1');
  });

  test('hero entrance animations and scroll-smooth are disabled when reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveCSS('scroll-behavior', 'auto');

    // arrive() lives inside the no-preference matchMedia context, so under
    // `reduce` it never runs and never stamps a delay. Absence of the attribute
    // is therefore proof the entrance was skipped entirely — and the element
    // must still be fully painted, which is the failure mode that actually
    // hurts: an entrance that is skipped by hiding rather than by not running.
    const tagline = page.locator('[data-testid="hero-tagline"]');
    await expect(tagline).not.toHaveAttribute('data-pcv-delay', /.*/);
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveCSS('opacity', '1');
    await expect(tagline).toHaveCSS('transform', 'none');
  });
});

test.describe('prefers-reduced-transparency', () => {
  test('mobile menu backdrop blur is removed and the panel becomes solid', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const client = await setReducedTransparency(page, true);
    await page.reload();

    await page.click('button[aria-expanded]');
    const menu = page.locator('[data-testid="mobile-menu"]');
    await expect(menu).toHaveCSS('backdrop-filter', 'none');
    await expect(menu).toHaveCSS('background-color', 'rgb(26, 26, 26)');

    await client.detach();
  });

  test('mobile menu keeps its translucent blur without the reduced-transparency preference', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.click('button[aria-expanded]');
    const menu = page.locator('[data-testid="mobile-menu"]');
    await expect(menu).toHaveCSS('backdrop-filter', 'blur(16px)');
  });
});
