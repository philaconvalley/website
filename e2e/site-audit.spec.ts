import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

/**
 * The site audit's cross-page rules (10/18/2026). Each page gets one job, so
 * the same block of copy does not repeat from page to page:
 * - the motto closes Home and no other page;
 * - the program cards live on Events only;
 * - the night timeline lives on Home only;
 * - the first-PR walkthrough lives on Projects only;
 * - every recap photo has its own caption, not the event title;
 * - each page has at most one loud section heading (audit item 8).
 */

const MOTTO = 'A pigeon flies alone';
const PAGES = [
  '/',
  '/about',
  '/events',
  '/projects',
  '/arcade',
  '/resources',
  '/join',
  '/support',
  '/contact',
];

test('the motto closes Home and no other page', async ({ page }) => {
  for (const route of PAGES) {
    await page.goto(route);
    const count = await page.locator('main').getByText(MOTTO).count();
    expect(count, `${route} shows the motto ${count} times`).toBe(route === '/' ? 1 : 0);
  }
});

test('each block lives on one page only', async ({ page }) => {
  const homes = {
    programs: { selector: '[data-testid="stoop-line"]', home: '/events' },
    timeline: { selector: 'section:has-text("How a Lab night works")', home: '/' },
    walkthrough: { selector: '[data-testid="first-pr-steps"]', home: '/projects' },
  };
  for (const route of PAGES) {
    await page.goto(route);
    for (const [name, { selector, home }] of Object.entries(homes)) {
      const count = await page.locator('main').locator(selector).count();
      expect(count, `${name} on ${route}`).toBe(route === home ? 1 : 0);
    }
  }
});

test('every recap photo has its own caption, not the event title', async ({ page }) => {
  const recaps = readdirSync('src/content/events')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  for (const recap of recaps) {
    await page.goto(`/events/${recap}`);
    const title = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
    const captions = (
      await page.getByTestId('photo-grid').locator('figcaption').allTextContents()
    ).map((t) => t.trim());
    expect(captions.length, recap).toBeGreaterThan(0);
    expect(new Set(captions).size, `${recap} repeats a caption`).toBe(captions.length);
    for (const caption of captions) {
      expect(caption.length).toBeGreaterThan(0);
      expect(caption.toLowerCase()).not.toBe(title.toLowerCase());
    }
  }
});

test('with no night posted, Events opens on recent nights, above the empty state', async ({
  page,
}) => {
  await page.goto('/events');
  test.skip((await page.getByTestId('next-up').count()) > 0, 'this build has an upcoming event');
  const recent = await page.getByTestId('recent-nights').boundingBox();
  const empty = await page.getByTestId('between-nights').boundingBox();
  expect(recent!.y).toBeLessThan(empty!.y);
});

// One loud moment per page (audit item 8). A section h2 at the base size is
// loud; heading-quiet and the sized card headings are not. The closing is
// left out: it has its own scale (ClosingFlock.astro), and on Home it is the
// motto. Measured at 1440px, where the base h2 is 80px and heading-quiet is
// 53px, so 70px separates them with room to spare.
test('each page has at most one loud section heading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of PAGES) {
    await page.goto(route);
    const loud = await page.locator('main h2').evaluateAll((headings) =>
      headings
        .filter((h) => !h.closest('[data-testid="closing-flock"]'))
        .filter((h) => parseFloat(getComputedStyle(h).fontSize) >= 70)
        .map((h) => h.textContent!.replace(/\s+/g, ' ').trim()),
    );
    expect(loud.length, `${route} has loud headings: ${loud.join(' | ')}`).toBeLessThanOrEqual(1);
  }
});

test('a recap shares its own cover photo and links the nights around it', async ({ page }) => {
  const recaps = readdirSync('src/content/events')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  for (const recap of recaps) {
    await page.goto(`/events/${recap}`);
    const share = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(share, recap).toContain(`/images/gallery/${recap}/`);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    if (recaps.length > 1) {
      const links = page.getByTestId('recap-nav').locator('a[rel="prev"], a[rel="next"]');
      expect(await links.count(), recap).toBeGreaterThan(0);
      for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
        expect(href).not.toBe(`/events/${recap}`);
      }
    }
  }
});

// Second Steve Jobs review, 10/18/2026: a photo shows once per page, and
// Home and Support each show their own row.
test('no photo repeats on a recap, or between Home and Support', async ({ page }) => {
  const gridSources = () =>
    page
      .getByTestId('photo-grid')
      .locator('img')
      .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));

  await page.goto('/');
  const home = await gridSources();
  await page.goto('/support');
  const support = await gridSources();
  expect(home.length).toBeGreaterThan(0);
  expect(support.length).toBeGreaterThan(0);
  expect(support.filter((src) => home.includes(src))).toEqual([]);

  const recaps = readdirSync('src/content/events')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  for (const recap of recaps) {
    await page.goto(`/events/${recap}`);
    const all = await page
      .locator('main img[src^="/images/gallery/"]')
      .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    expect(new Set(all).size, `${recap} shows a photo twice`).toBe(all.length);
  }
});
