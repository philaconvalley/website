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
    // Baloo 2 loads with `font-display: swap` (Fontsource's default): the
    // browser paints nav links in a fallback font first, then swaps in the
    // real one, which changes every link's rendered width. x-init measures
    // the pill's position before that swap can be guaranteed to have
    // happened. Delay the self-hosted font files to force that race
    // deterministically.
    await page.route('**/*.woff2', async (route) => {
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

  test('snaps to the corrected width after the font swap, never slides', async ({ page }) => {
    // The correction above used to animate: the pill shrank over 200ms on
    // load, which read as the header "breathing" on every first visit
    // (Waskar, 10/16/2026). A correction the visitor did not ask for gets no
    // motion; only pointer moves slide. So every painted width must be either
    // the first measurement or the final one, with no frames in between.
    await page.route('**/*.woff2', async (route) => {
      await page.waitForTimeout(400);
      await route.continue();
    });
    await page.addInitScript(() => {
      const widths: number[] = [];
      (window as unknown as { __pillWidths: number[] }).__pillWidths = widths;
      const start = performance.now();
      const tick = () => {
        const pill = document.querySelector('[data-testid="nav-pill"]');
        const w = pill ? Math.round(pill.getBoundingClientRect().width) : 0;
        if (w && widths[widths.length - 1] !== w) widths.push(w);
        if (performance.now() - start < 1500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page.goto('/arcade');
    await page.mouse.move(10, 800); // keep the pointer off the nav
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);

    const widths = await page.evaluate(
      () => (window as unknown as { __pillWidths: number[] }).__pillWidths,
    );
    const link = page.locator('[data-testid="desktop-nav"] [aria-current="page"]');
    const final = await link.evaluate((el) => (el as HTMLElement).offsetWidth);
    expect(widths.at(-1)).toBe(final);
    expect(widths.length, `pill widths painted: ${widths.join(' → ')}`).toBeLessThanOrEqual(2);
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

test('a reload partway down the page shows the tucked logo at once, without shrinking', async ({
  page,
}) => {
  // The logo hangs over the bar at the top of a page and tucks in once the
  // visitor scrolls. A reload partway down used to draw the hanging logo and
  // then shrink it over 240ms (Waskar, 10/16/2026). The first state must snap;
  // only a real scroll animates.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/arcade');
  await page.evaluate(() => window.scrollTo(0, 1100));
  await page.waitForTimeout(400);
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __logo: string[] }).__logo = seen;
    const start = performance.now();
    const tick = () => {
      const img = document.querySelector('header a[href="/"] img');
      const t = img ? getComputedStyle(img).transform : '';
      if (t && seen[seen.length - 1] !== t) seen.push(t);
      if (performance.now() - start < 1200) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.reload();
  await page.waitForTimeout(1400);
  const seen = await page.evaluate(() => (window as unknown as { __logo: string[] }).__logo);
  expect(seen.at(-1), 'the logo ends tucked').toBe('none');
  expect(seen.length, `logo transforms painted: ${seen.length}`).toBeLessThanOrEqual(2);
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
