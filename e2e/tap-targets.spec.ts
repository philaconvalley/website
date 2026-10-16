import { test, expect, type Page } from '@playwright/test';

/**
 * On a phone, every link and button in the shared chrome (header, phone menu,
 * footer) is at least 44px tall: the touch size Apple and Google recommend,
 * and the WCAG 2.5.5 target size. The footer links were 24px and the bottom
 * row 19-20px before the 10/15/2026 phone pass; the menu links were 40px.
 * Desktop keeps its tighter spacing, so this runs at phone widths only.
 */

const MIN = 44;

async function shortTargets(page: Page, scope: string) {
  return page.evaluate(
    ({ scope, min }) =>
      [...document.querySelectorAll(`${scope} a, ${scope} button`)]
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        // The skip link is visually hidden until it has focus.
        .filter((el) => !el.classList.contains('sr-only'))
        .map((el) => ({
          name: (
            el.getAttribute('aria-label') ||
            el.textContent?.trim() ||
            el.querySelector('img')?.alt ||
            el.tagName
          )
            .trim()
            .slice(0, 30),
          height: Math.round(el.getBoundingClientRect().height),
        }))
        .filter(({ height }) => height < min),
    { scope, min: MIN },
  );
}

for (const width of [390, 360]) {
  test.describe(`shared chrome tap targets at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/about');
    });

    test('header and footer links are at least 44px tall', async ({ page }) => {
      expect(await shortTargets(page, 'header'), 'header targets under 44px').toEqual([]);
      expect(await shortTargets(page, 'footer'), 'footer targets under 44px').toEqual([]);
    });

    test('phone menu links are at least 44px tall', async ({ page }) => {
      await page.locator('header button[aria-expanded]').click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      expect(
        await shortTargets(page, '[data-testid="mobile-menu"]'),
        'menu targets under 44px',
      ).toEqual([]);
    });
  });
}
