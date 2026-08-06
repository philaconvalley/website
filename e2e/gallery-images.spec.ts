import { test, expect } from '@playwright/test';

/**
 * The mosaic's srcset is built by convention: `foo.webp` is the 1200px
 * canonical, and `foo-400.webp` / `foo-800.webp` sit beside it. A convention
 * that nothing checks is a convention that eventually ships 404s — a
 * contributor adds a photo, copies one file instead of three, and the only
 * symptom is a phone silently falling back to the full-size image, or no image
 * at all. So every URL the browser could choose is fetched here.
 *
 * This also pins the reason the ladder exists: the tiles render far smaller
 * than the files, and without responsive sources a phone paid 674KB for them.
 */
test.describe('gallery responsive sources', () => {
  test('every srcset candidate resolves', async ({ page, request }) => {
    await page.goto('/');

    const imgs = page.locator('#nights img');
    const count = await imgs.count();
    test.skip(count === 0, 'no gallery photos in this build — nothing to check');

    const urls = new Set<string>();
    for (let i = 0; i < count; i++) {
      const src = await imgs.nth(i).getAttribute('src');
      const set = await imgs.nth(i).getAttribute('srcset');
      expect(set, `photo ${i} should carry a srcset`).toBeTruthy();
      if (src) urls.add(src);
      for (const candidate of set!.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        expect(url, 'srcset entry should have a URL').toBeTruthy();
        urls.add(url);
      }
    }

    // Three ladder rungs per photo; anything less means the srcset lost one.
    expect(urls.size, 'expected 3 URLs per photo').toBe(count * 3);

    for (const url of urls) {
      const res = await request.get(url);
      expect(res.status(), `${url} should be served, not 404`).toBe(200);
    }
  });

  test('a phone is offered a source far smaller than the canonical file', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const img = page.locator('#nights img').first();
    test.skip((await page.locator('#nights img').count()) === 0, 'no gallery photos in this build');

    await img.scrollIntoViewIfNeeded();
    // currentSrc is the candidate the browser actually chose for this viewport.
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.currentSrc)).not.toBe('');

    const chosen = await img.evaluate((el: HTMLImageElement) => el.currentSrc);
    expect(chosen, `a 390px viewport should not pull the 1200px canonical (got ${chosen})`).toMatch(
      /-(400|800)\.webp$/,
    );
  });
});
