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
  // The heights come from the band's real position, so new sections above it
  // do not move it out of the test's windows.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const band = await page
    .locator('[data-count]')
    .first()
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      return { top: Math.round(box.top + scrollY), height: Math.round(box.height) };
    });
  // Just the top edge visible, about half visible, and fully visible.
  const heights = [
    band.top + 10,
    band.top + Math.round(band.height / 2),
    band.top + band.height + 50,
  ];
  for (const height of heights) {
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

test('the hero stat line shows the same live numbers as the band, and no wrapped line starts with a slash', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  const items = page.getByTestId('hero-stats').locator('li');
  await expect(items).toHaveCount(3);
  const values = await page
    .locator('[data-count]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-count')));
  for (const [i, item] of (await items.all()).entries()) {
    await expect(item).toContainText(values[i]!);
  }
  // A slash is visible only when its item does not start a line: it must sit
  // inside the clipping wrapper, to the right of the wrapper's left edge.
  const wrapperLeft = await page
    .getByTestId('hero-stats')
    .evaluate((ul) => ul.parentElement!.getBoundingClientRect().left);
  for (const item of await items.all()) {
    const itemLeft = await item.evaluate((li) => li.getBoundingClientRect().left + 40);
    const slashLeft = await item
      .locator('[aria-hidden="true"]')
      .evaluate((s) => s.getBoundingClientRect().left);
    if (Math.abs(itemLeft - wrapperLeft) < 2) expect(slashLeft).toBeLessThan(wrapperLeft);
    else expect(slashLeft).toBeGreaterThanOrEqual(wrapperLeft);
  }
});
