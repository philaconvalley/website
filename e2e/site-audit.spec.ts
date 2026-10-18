import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

/**
 * The site audit's cross-page rules (10/18/2026). Each page gets one job, so
 * the same block of copy does not repeat from page to page:
 * - the motto closes Home and no other page;
 * - the program cards live on Events only;
 * - the night timeline lives on Home only;
 * - the first-PR walkthrough lives on Projects only;
 * - every recap photo has its own caption, not the event title.
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
