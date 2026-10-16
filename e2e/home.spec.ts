import { test, expect } from '@playwright/test';

/**
 * Home, Edition 1.2. Two behaviors added in the Home PR:
 * - The live numbers count up once on scroll, but the HTML and the screen
 *   reader copy always hold the real values.
 * - The hero shows one hero-eligible gallery photo, picked at random per visit.
 */

test('the live numbers settle on their real values, and screen readers never hear the count', async ({
  page,
}) => {
  await page.goto('/');
  const counters = page.locator('[data-count]');
  await expect(counters).toHaveCount(3);
  await counters.first().scrollIntoViewIfNeeded();

  for (const counter of await counters.all()) {
    const target = await counter.getAttribute('data-count');
    await expect(counter).toHaveText(target!, { timeout: 3000 });
    await expect(counter).toHaveAttribute('aria-hidden', 'true');
    // The sr-only sibling carries the same value from the first paint.
    await expect(counter.locator('xpath=following-sibling::span[1]')).toHaveText(target!);
  }
});

test('under reduced motion the numbers never count', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const counter of await page.locator('[data-count]').all()) {
    await expect(counter).toHaveText((await counter.getAttribute('data-count'))!);
  }
});

test('the hero photo is one of the hero-eligible gallery photos, with its alt text', async ({
  page,
}) => {
  await page.goto('/');
  const figure = page.locator('[data-hero-photos]');
  const photos: { src: string; alt: string }[] = JSON.parse(
    (await figure.getAttribute('data-hero-photos'))!,
  );
  expect(photos.length).toBeGreaterThan(1);

  const img = figure.locator('img');
  const src = await img.getAttribute('src');
  const match = photos.find((photo) => photo.src === src);
  expect(match, `hero src ${src} is not in the eligible set`).toBeTruthy();
  await expect(img).toHaveAttribute('alt', match!.alt);
});

test('a number already on screen at load never jumps back to 0', async ({ page }) => {
  // A window tall enough to show the numbers band at load (a tall monitor or
  // a zoomed-out page). The count may run or not; the value must never drop.
  for (const height of [3300, 3527, 3700]) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto('/');
    const counter = page.locator('[data-count]').first();
    const values: number[] = [];
    for (let i = 0; i < 8; i++) {
      values.push(Number(await counter.textContent()));
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(150);
    }
    const dropped = values.some((value, i) => i > 0 && value < values[i - 1]);
    expect(dropped, `values at ${height}px: ${values.join(' → ')}`).toBe(false);
  }
});

test('Home downloads exactly one hero photo', async ({ page }) => {
  const gallery: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/images/gallery/')) gallery.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(gallery, gallery.join('\n')).toHaveLength(1);
});
