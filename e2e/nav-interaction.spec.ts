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

  test('corrects itself once the webfont swaps in, even without any hover', async ({ page }) => {
    // Baloo 2 loads remotely with `display=swap`: the browser paints nav
    // links in a fallback font first, then swaps in the real one, which
    // changes every link's rendered width. x-init measures the pill's
    // position before that swap can be guaranteed to have happened. Delay
    // the webfont request to force that race deterministically.
    await page.route('https://fonts.googleapis.com/**', async (route) => {
      await page.waitForTimeout(600);
      await route.continue();
    });

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });

    // Let Alpine's x-init run before the webfont has had a chance to swap in.
    await page.waitForTimeout(50);

    // Let the delayed font finish loading and swapping.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);

    const pill = page.locator('[data-testid="nav-pill"]');
    const contactLink = page.locator('[data-testid="desktop-nav"] a', { hasText: 'Contact' });
    const finalStyle = await pill.getAttribute('style');
    const linkMetrics = await contactLink.evaluate((el) => ({
      left: (el as HTMLElement).offsetLeft,
      width: (el as HTMLElement).offsetWidth,
    }));

    // The pill must reflect the post-swap layout without requiring the user
    // to hover or focus the nav first.
    expect(finalStyle).toContain(`translateX(${linkMetrics.left}px)`);
    expect(finalStyle).toContain(`width: ${linkMetrics.width}px`);
  });

  test('follows keyboard focus, not just mouse hover', async ({ page }) => {
    await page.goto('/');
    const pill = page.locator('[data-testid="nav-pill"]');
    const before = await pill.getAttribute('style');

    // Any non-current nav link exercises this; it used to be Blog, which is no
    // longer in the nav while the blog is hidden.
    const targetLink = page.locator('[data-testid="desktop-nav"] a', { hasText: 'Resources' });
    await targetLink.focus();
    await page.waitForTimeout(50);

    const after = await pill.getAttribute('style');
    expect(after).not.toBe(before);

    // Compare against the focused link's own live offsetLeft/offsetWidth rather than a
    // hardcoded pixel value or the pill's rendered boundingBox — the latter would race
    // the pill's 300ms CSS transition and could be read mid-animation.
    const expectedLeft = await targetLink.evaluate((el) => (el as HTMLElement).offsetLeft);
    const expectedWidth = await targetLink.evaluate((el) => (el as HTMLElement).offsetWidth);
    expect(after).toContain(`translateX(${expectedLeft}px)`);
    expect(after).toContain(`width: ${expectedWidth}px`);
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
