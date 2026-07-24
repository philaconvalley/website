import { test, expect } from '@playwright/test';

test.describe('desktop nav sliding pill indicator', () => {
  test('sits under the current page on load', async ({ page }) => {
    await page.goto('/about');
    const pill = page.locator('[data-testid="nav-pill"]');
    const aboutLink = page.locator('[data-testid="desktop-nav"] a', { hasText: 'About' });
    const pillBox = await pill.boundingBox();
    const linkBox = await aboutLink.boundingBox();
    expect(pillBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    // pill should overlap the About link horizontally (same left edge, within a few px)
    expect(Math.abs(pillBox!.x - linkBox!.x)).toBeLessThan(5);
  });

  test('follows keyboard focus, not just mouse hover', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('[data-testid="nav-pill"]').getAttribute('style');

    await page.locator('[data-testid="desktop-nav"] a', { hasText: 'Blog' }).focus();
    await page.waitForTimeout(100);

    const after = await page.locator('[data-testid="nav-pill"]').getAttribute('style');
    expect(after).not.toBe(before);
    expect(after).toContain('width: 52px');
  });
});

test.describe('mobile menu sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens and closes via the hamburger button', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('[data-testid="mobile-menu"]');
    await expect(menu).toBeHidden();

    await page.click('button[aria-expanded]');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'About' })).toBeVisible();

    await page.click('button[aria-expanded]');
    await expect(menu).toBeHidden();
  });

  test('closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-expanded]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
  });
});
