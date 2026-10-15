import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The focus ring is a two-tone ring (DESIGN.md, docs/design-system.md "Focus
 * states"): a 2px Hot Pink outline inside a 6px ink edge. The Book asks for a
 * "visible Hot Pink focus outline" and "WCAG AA contrast". Pink alone fails 3:1
 * on Golden Yellow (1.9:1) and White (2.8:1), so the ink edge carries the
 * contrast on light backgrounds and the pink carries it on ink.
 *
 * Three ways this broke, or nearly broke, before these tests existed:
 * - Form fields added `focus:ring-*` classes, which replaced the ink edge.
 * - The logo link's wordmark shifted outside the link box, so the ring cut it.
 * - The skip link floated over the logo while it had focus.
 * - Tabbing scrolled a field under the sticky header (WCAG 2.4.11), first
 *   because nothing reserved room for the header, then because smooth
 *   scrolling made Chrome ignore scroll-padding-top on keyboard focus.
 *
 * Like contrast.spec.ts, these read computed styles, not class names.
 */

const PINK = 'rgb(234, 113, 172)';
const INK_EDGE = 'rgb(26, 26, 26) 0px 0px 0px 6px';

/** Focus an element the way a keyboard does, so :focus-visible applies. */
async function keyboardFocus(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await target.focus();
  // A programmatic focus after a mouse event can skip :focus-visible. One
  // Shift+Tab / Tab round trip puts the browser in keyboard mode.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  // Buttons transition box-shadow over 150ms; read the settled value.
  await page.waitForTimeout(300);
}

async function ringStyle(target: Locator) {
  return target.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      focusVisible: el.matches(':focus-visible'),
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      boxShadow: s.boxShadow,
    };
  });
}

test.describe('two-tone focus ring', () => {
  const cases = [
    {
      name: 'a header link on Golden Yellow',
      route: '/',
      selector: '[data-testid="desktop-nav"] a[href="/about"]',
    },
    { name: 'a form field on White', route: '/contact', selector: '#name' },
    { name: 'a footer link on ink', route: '/', selector: 'footer a[href="/about"]' },
  ];

  for (const { name, route, selector } of cases) {
    test(`${name} gets the pink outline and the ink edge`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      const target = page.locator(selector).first();
      await keyboardFocus(page, target);

      const ring = await ringStyle(target);
      expect(ring.focusVisible, `${selector} should be :focus-visible`).toBe(true);
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineColor).toBe(PINK);
      expect(
        ring.boxShadow,
        'the ink edge is missing — a focus:ring-* class may be replacing it',
      ).toContain(INK_EDGE);
    });
  }

  test('a button keeps its offset shadow while focused', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const rsvp = page.locator('[data-testid="hero-cta"]');
    await keyboardFocus(page, rsvp);

    const { boxShadow } = await ringStyle(rsvp);
    expect(boxShadow).toContain(INK_EDGE);
    // The RSVP's own 3px ink offset shadow survives next to the ring.
    expect(boxShadow).toContain('rgb(26, 26, 26) 3px 3px 0px 0px');
  });

  test('the logo link ring wraps the whole wordmark', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const logo = page.locator('header a[href="/"]').first();
    await keyboardFocus(page, logo);
    // Wait for the wordmark's hang transform to settle.
    await page.waitForTimeout(400);

    const overflow = await logo.evaluate((link) => {
      const box = link.getBoundingClientRect();
      const wordmark = link.querySelector('img[src*="wordmark"]')!.getBoundingClientRect();
      return { right: wordmark.right - box.right, left: box.left - wordmark.left };
    });
    expect(
      overflow.right,
      'the wordmark runs past the right edge of the focus ring',
    ).toBeLessThanOrEqual(0);
    expect(overflow.left).toBeLessThanOrEqual(0);
  });
});

test('the skip link covers nothing while it has focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();

  const overlap = await skip.evaluate((link) => {
    const a = link.getBoundingClientRect();
    return [...document.querySelectorAll('header a, header button')]
      .filter((el) => (el as HTMLElement).offsetParent)
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      })
      .map((el) => el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName);
  });
  expect(overlap, 'the skip link sits on top of header controls').toEqual([]);

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
});

test.describe('focus is never hidden under the sticky header', () => {
  for (const width of [1440, 390]) {
    test(`tabbing through the Contact form at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/contact');

      for (const id of ['name', 'email', 'subject', 'message']) {
        const field = page.locator(`#${id}`);
        // Tab until this field has focus; the page scrolls itself, as for a visitor.
        for (
          let i = 0;
          i < 80 && !(await field.evaluate((el) => el === document.activeElement));
          i++
        ) {
          await page.keyboard.press('Tab');
        }
        await expect(field).toBeFocused();
        // Let any focus scroll finish before measuring.
        await page.waitForTimeout(300);

        const covered = await field.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const header = document.querySelector('header')!.getBoundingClientRect();
          return r.top < header.bottom;
        });
        expect(covered, `#${id} is under the sticky header after tabbing to it`).toBe(false);
      }
    });
  }
});

test('no component adds its own focus ring or focus border', () => {
  // A `focus:ring-*` or `focus:border-*` class replaces the shared ink edge.
  // The one sanctioned exception draws the same two-tone pattern itself.
  const allowed = new Set(['src/components/ArcadeCabinet.astro']);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith('.astro') && !allowed.has(path)) {
        const source = readFileSync(path, 'utf8');
        const hits = source.match(/\bfocus(?:-visible)?:(?:ring|border)-[\w[\]#-]+/g);
        if (hits) offenders.push(`${path}: ${[...new Set(hits)].join(', ')}`);
      }
    }
  };
  walk('src');
  expect(offenders, 'remove these; the global *:focus-visible rule draws the ring').toEqual([]);
});
