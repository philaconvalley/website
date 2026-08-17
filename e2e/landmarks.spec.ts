import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * BaseLayout owns <Header />, <main> and <Footer /> so that every page gets the
 * same landmark structure by construction (issue #87). These tests are the part
 * that keeps it true: pages used to render Header/Footer themselves, into the
 * layout's <main> slot, which silently demoted <header> out of the `banner` role
 * and <footer> out of `contentinfo`, and left "Skip to main content" landing
 * above the nav instead of past it. Nothing failed — it just shipped that way on
 * all 13 pages.
 *
 * Routes are enumerated from dist/ rather than hardcoded, so a page added later
 * is covered without anyone remembering to add it here.
 */
function builtRoutes(): string[] {
  const dist = path.resolve(process.cwd(), 'dist');
  return (
    fs
      .readdirSync(dist, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.html'))
      // Games under /games/ are embedded artifacts, not pages of the site: they
      // are bare canvas documents with no Header, <main> or Footer by design, and
      // they are noindex. Including them would fail this suite the moment the
      // arcade lands. See docs/superpowers/specs/2026-08-08-philacon-arcade-design.md.
      .filter((f) => !f.startsWith('games/') && !f.includes('/games/'))
      // arcade-probe-host.html is a permanent test fixture (Task 1), not a site
      // page: it exists solely to frame /games/_probe/ under a real HTTP origin
      // and has no Header/<main>/Footer by design. It lives outside /games/ on
      // purpose (see the file's own header comment), so the filter above doesn't
      // catch it — exclude it explicitly instead.
      .filter((f) => f !== 'arcade-probe-host.html')
      .map((f) => '/' + f.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, ''))
      .sort()
  );
}

test.describe('landmark structure', () => {
  test('every built page exposes exactly one banner, main and contentinfo', async ({ page }) => {
    const routes = builtRoutes();
    // A silently empty route list would make this test pass while checking nothing.
    expect(routes.length).toBeGreaterThan(5);

    for (const route of routes) {
      await page.goto(route);

      // Roles, not tags, on purpose: a <header> nested inside <main> is still a
      // <header> element but is no longer the banner landmark, so counting roles
      // is what actually catches the regression.
      await expect(page.getByRole('banner'), `banner on ${route}`).toHaveCount(1);
      await expect(page.getByRole('main'), `main on ${route}`).toHaveCount(1);
      await expect(page.getByRole('contentinfo'), `contentinfo on ${route}`).toHaveCount(1);

      const main = page.getByRole('main');
      await expect(main.locator('header'), `header nested in main on ${route}`).toHaveCount(0);
      await expect(main.locator('footer'), `footer nested in main on ${route}`).toHaveCount(0);
    }
  });

  test('the skip link skips past the nav rather than into it', async ({ page }) => {
    await page.goto('/about');

    // First tab stop on any page is the skip link itself.
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);

    // The next tab stop must be inside <main>. When <main> wrapped the header,
    // this landed on the first nav link instead and the skip link did nothing.
    await page.keyboard.press('Tab');
    const focusedIsInsideMain = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && el !== document.body && !!el.closest('main');
    });
    expect(focusedIsInsideMain).toBe(true);

    const focusedIsInsideNav = await page.evaluate(
      () => !!document.activeElement?.closest('header'),
    );
    expect(focusedIsInsideNav).toBe(false);
  });
});
