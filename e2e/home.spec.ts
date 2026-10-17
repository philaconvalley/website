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

test('the rolling digits end exactly on the real digits, so nothing jumps when the roll ends', async ({
  page,
}) => {
  // When a number's last strip finishes, the overlay digit and the real digit
  // (transparent under it) must share the same glyph top. An inline number box
  // once made them 6px apart, and the digits dropped when the overlay left.
  // The listener is installed before the page loads, so no roll is missed.
  await page.addInitScript(() => {
    const w = window as unknown as { odoOffsets: number[] };
    w.odoOffsets = [];
    const glyphTop = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].find((r) => r.width > 0)!.top;
    };
    document.addEventListener(
      'transitionend',
      (event) => {
        const strip = event.target as HTMLElement;
        if (!strip.classList?.contains('odo-strip') || event.propertyName !== 'transform') return;
        const layer = strip.closest('.odo-layer')!;
        if (strip !== layer.querySelector('.odo-col:last-child .odo-strip')) return;
        const num = layer.parentElement!;
        const cell = strip.children[Number(strip.getAttribute('data-target'))];
        w.odoOffsets.push(Math.abs(glyphTop(cell) - glyphTop(num.firstChild!)));
      },
      true,
    );
  });
  // A window tall enough to show the hero line and the band at load, so both
  // roll. Measured from the band's real position, not a fixed height.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const bandBottom = await page
    .locator('section[aria-label="PhilaCon Valley in numbers"]')
    .evaluate((el) => Math.round(el.getBoundingClientRect().bottom + scrollY));
  await page.setViewportSize({ width: 1440, height: bandBottom + 50 });
  await page.reload();
  await expect
    .poll(
      () => page.evaluate(() => (window as unknown as { odoOffsets: number[] }).odoOffsets.length),
      {
        timeout: 5000,
      },
    )
    .toBe(6);
  const offsets = await page.evaluate(
    () => (window as unknown as { odoOffsets: number[] }).odoOffsets,
  );
  for (const offset of offsets) expect(offset).toBeLessThan(0.5);
});

// The roll ends on transitionend, or at the latest on a fallback timer about
// 2.6s after it starts. 8s leaves room for a loaded machine; a real hang never
// reaches 'done' at all.
test('a number rolls again after it scrolls fully out of view and back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const band = page.locator('section[aria-label="PhilaCon Valley in numbers"]');
  const item = band.locator('[data-odo-item]').first();
  await band.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(item).toHaveAttribute('data-odo', 'done', { timeout: 8000 });
  // Fully out of view: it resets, unseen, to the hidden start.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(item).not.toHaveAttribute('data-odo', /.+/);
  // The label stays visible while it is reset: replays only roll the digits.
  await expect(item.locator('[data-odo-rise]').first()).toHaveCSS('opacity', '1');
  // Back in view: it plays again, with the shorter replay roll, and settles.
  await band.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(item).toHaveAttribute('data-odo', 'play');
  await expect(item.locator('.odo-strip').first()).toHaveCSS('transition-duration', '0.7s');
  await expect(item).toHaveAttribute('data-odo', 'done', { timeout: 8000 });
  const counter = item.locator('[data-count]');
  await expect(counter).toHaveText((await counter.getAttribute('data-count'))!);
});

test('Home shows the four programs, and Stoop as a line under them', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('section', {
    has: page.getByRole('heading', { name: 'Different nights. Same open door.' }),
  });
  const names = section.getByRole('heading', { level: 3 });
  await expect(names).toHaveText(['PATCH', 'Lab', 'Community projects', 'Career Support']);
  // Running programs are whole-card links. Career Support is coming soon: a
  // card with a "Coming soon" tag and no link.
  await expect(section.getByRole('listitem').getByRole('link')).toHaveCount(3);
  const career = section.getByRole('listitem').filter({ hasText: 'Career Support' });
  await expect(career).toContainText('Coming soon');
  await expect(career.getByRole('link')).toHaveCount(0);
  await expect(page.getByTestId('stoop-line')).toContainText('Stoop');
});

test('a first visit paints the headline in its real font, with no reflow', async ({ page }) => {
  // Fonts use font-display: swap. Without a preload, the first frame painted
  // in the wider fallback face: the headline wrapped to five lines (542px),
  // then reflowed to four when Baloo 2 arrived, on 12 of 12 first visits
  // (Waskar, 10/16/2026). BaseLayout preloads the heading face. Each test
  // runs in a fresh browser context, so this is a cold cache.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const heights: number[] = [];
    (window as unknown as { __h: number[] }).__h = heights;
    const start = performance.now();
    const tick = () => {
      const h1 = document.querySelector('h1');
      if (h1) {
        const v = Math.round(h1.getBoundingClientRect().height);
        if (heights[heights.length - 1] !== v) heights.push(v);
      }
      if (performance.now() - start < 1500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/');
  await page.waitForTimeout(1600);
  const heights = await page.evaluate(() => (window as unknown as { __h: number[] }).__h);
  expect(heights, `headline heights painted: ${heights.join(' → ')}`).toHaveLength(1);
  await expect(page.locator('link[rel="preload"][as="font"]')).toHaveAttribute(
    'href',
    /baloo-2-latin-800-normal\.[\w-]+\.woff2$/,
  );
});

// A number that never scrolled into view is transparent under an overlay at 0.
// Print (and any capture that never scrolls) must show the real value, not "000".
test('print shows the real numbers, even ones that never came into view', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const counts = page.locator('[data-count]');
  const n = await counts.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(counts.nth(i)).toHaveCSS('color', 'rgb(26, 26, 26)');
    await expect(counts.nth(i).locator('.odo-layer')).toBeHidden();
  }
});
