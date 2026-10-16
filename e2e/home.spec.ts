import { test, expect } from '@playwright/test';

/**
 * Home, Edition 1.2. Two behaviors added in the Home PR:
 * - The live numbers roll in like an odometer on every load, but the HTML and
 *   the screen reader copy always hold the real values.
 * - The hero shows one hero-eligible gallery photo, picked at random per visit.
 */

test('the live numbers settle on their real values, and screen readers never hear the count', async ({
  page,
}) => {
  await page.goto('/');
  const counters = page.locator('section[aria-label="PhilaCon Valley in numbers"] [data-count]');
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

test('under reduced motion the numbers never roll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Band and hero stat line both settle; the hero number sits inside its label.
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

test('a load with the numbers band in view plays the roll, with no real number shown first', async ({
  page,
}) => {
  // A window tall enough to show the band at load (a refresh that restores
  // the scroll position behaves the same). Hold home.js back for a moment to
  // look at the page before the roll starts.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const bandTop = await page
    .locator('section[aria-label="PhilaCon Valley in numbers"] [data-count]')
    .first()
    .evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
  await page.setViewportSize({ width: 1440, height: bandTop + 400 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/js/home.js', async (route) => {
    await held;
    await route.continue();
  });
  const loading = page.goto('/');
  await page.waitForSelector('[data-count]', { state: 'attached' });
  // Before the roll: every number is hidden (transparent), never shown real.
  for (const color of await page
    .locator('[data-count]')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).color))) {
    expect(color).toBe('rgba(0, 0, 0, 0)');
  }
  release();
  await loading;
  const items = page.locator('[data-odo-item]');
  await expect(items.first()).toHaveAttribute('data-odo', 'play');
  for (const item of await items.all()) {
    await expect(item).toHaveAttribute('data-odo', 'done', { timeout: 4000 });
  }
  // Band and hero stat line both settle; the hero number sits inside its label.
  for (const counter of await page.locator('[data-count]').all()) {
    await expect(counter).toHaveText((await counter.getAttribute('data-count'))!);
  }
});

test('if home.js never loads, the numbers still show after the safety timer', async ({ page }) => {
  await page.route('**/js/home.js', (route) => route.abort());
  await page.goto('/');
  const counter = page.locator('[data-count]').first();
  await expect
    .poll(() => counter.evaluate((el) => getComputedStyle(el).color), { timeout: 5000 })
    .toBe('rgb(26, 26, 26)');
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
    .locator('section[aria-label="PhilaCon Valley in numbers"] [data-count]')
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
      .locator(':scope > [aria-hidden="true"]')
      .evaluate((s) => s.getBoundingClientRect().left);
    if (Math.abs(itemLeft - wrapperLeft) < 2) expect(slashLeft).toBeLessThan(wrapperLeft);
    else expect(slashLeft).toBeGreaterThanOrEqual(wrapperLeft);
  }
});
