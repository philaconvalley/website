import { test, expect } from '@playwright/test';

/**
 * The stat line ("425 members · 13 nights held · 6 things shipped") appears
 * twice on the homepage. It used to be one interpolated string, which made the
 * two copies impossible to disagree — but also made its numbers impossible to
 * animate individually, since there were no elements to animate.
 *
 * These tests hold both properties at once: the copies still cannot drift, and
 * each number is now separately addressable.
 */
test.describe('stat line', () => {
  test('both copies render the same numbers', async ({ page }) => {
    await page.goto('/');
    const lines = page.locator('[data-testid="stat-line"]');
    await expect(lines).toHaveCount(2);

    const [first, second] = await lines.allTextContents();
    expect(first.replace(/\s+/g, ' ').trim()).toBe(second.replace(/\s+/g, ' ').trim());
  });

  test('each number is individually addressable for animation', async ({ page }) => {
    await page.goto('/');
    const counts = page.locator('[data-testid="stat-line"]').first().locator('[data-count-to]');
    await expect(counts).toHaveCount(3);

    for (const el of await counts.all()) {
      const target = Number(await el.getAttribute('data-count-to'));
      expect(Number.isFinite(target)).toBe(true);
      expect(target).toBeGreaterThanOrEqual(0);
      // The rendered text must already be the final value: with no JavaScript,
      // or before any counter runs, the claim on the page has to be true.
      expect((await el.textContent())?.trim()).toBe(String(target));
    }
  });

  test('the line still reads as a sentence, not a list of bare numbers', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('[data-testid="stat-line"]').first().textContent()) ?? '';
    expect(text.replace(/\s+/g, ' ').trim()).toMatch(
      /^\d+ members · \d+ nights? held · \d+ things? shipped$/,
    );
  });
});
