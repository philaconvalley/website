import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { links } from '../src/config';

/**
 * Events, Edition 1.2. The page's facts must match the rest of the site:
 * - with a real event, the Next up card sits beside our own calendar card,
 *   built from the Luma feed (no Luma embed, 10/24/2026);
 *   with none, one "between nights" card asks people to follow the calendar,
 *   and no RSVP shows anywhere (which test runs depends on the live calendar
 *   at build time; the other skips);
 * - the programs (their one home on the site), all white on yellow;
 * - the first-time guide shows four points about the real night, and no
 *   timeline (the mockup has none on Events; Home keeps it);
 * - every event recap gets a card that links to its recap page;
 * - every photo loads (no missing 800px copies);
 * - the page ends on its own closing copy.
 */

const hasEvent = async (page: import('@playwright/test').Page) =>
  (await page.getByTestId('next-up').count()) > 0;

test('with an event, Events shows Next up beside our calendar card', async ({ page }) => {
  await page.goto('/events');
  test.skip(!(await hasEvent(page)), 'no upcoming event in this build');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hands-on nights. Every one free.',
  );
  // Our own card replaced Luma's fixed-height embed.
  await expect(page.locator('#calendar iframe')).toHaveCount(0);
  const card = page.getByTestId('calendar-card');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Add to your calendar' })).toHaveAttribute(
    'href',
    links.lumaIcs.replace(/^https:/, 'webcal:'),
  );
  // Every later night links straight to its own Luma page.
  for (const rsvp of await card.getByRole('link', { name: /^RSVP/ }).all()) {
    await expect(rsvp).toHaveAttribute('href', /^https:\/\/(lu\.ma|luma\.com)\//);
  }
  // The next night shows once, in Next up, not again in the list.
  const nextTitle = (await page.getByTestId('next-up').locator('h3').textContent())!.trim();
  await expect(card.locator('h3').filter({ hasText: nextTitle })).toHaveCount(0);
  await expect(page.getByTestId('between-nights')).toHaveCount(0);
});

test('with no event, Events asks people to follow the calendar, never to RSVP', async ({
  page,
}) => {
  await page.goto('/events');
  test.skip(await hasEvent(page), 'this build has an upcoming event');

  const card = page.getByTestId('between-nights');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Get notified' })).toHaveAttribute(
    'href',
    links.luma,
  );
  // webcal:// subscribes; an https link to the feed only downloads a copy.
  await expect(card.getByRole('link', { name: 'Add to your calendar' })).toHaveAttribute(
    'href',
    links.lumaIcs.replace(/^https:/, 'webcal:'),
  );
  // Luma's embed would only say "No Upcoming Events".
  await expect(page.locator('#calendar iframe')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('RSVP');
});

test('Events shows the shared programs, every card white', async ({ page }) => {
  await page.goto('/events');
  const list = page.getByTestId('stoop-line').locator('xpath=..').locator('ul');
  await expect(list.locator('h3')).toHaveText([
    'PATCH',
    'Lab',
    'Community projects',
    'Career Support',
  ]);
  const fills = await list
    .locator('li > a, li.rounded-retro')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  expect(fills.every((fill) => fill === 'rgb(255, 255, 255)')).toBe(true);
});

test('the first-time guide shows four points and no night timeline', async ({ page }) => {
  await page.goto('/events');
  const section = page.locator('section', { has: page.getByText('First time?') });
  await expect(section.locator('ol > li h3')).toHaveCount(4);
  await expect(section.getByText(/lesson or demo/).first()).toBeVisible();
  await expect(page.getByTestId('night-strip')).toHaveCount(0);
  // LabTrack is retired.
  await expect(page.locator('[data-lab-track]')).toHaveCount(0);
});

// The four points play with the night timeline's system (public/js/night.js):
// hidden before paint, revealed in order when the list scrolls into view.
const pointsSettled = (page: import('@playwright/test').Page) =>
  page.getByTestId('first-time-points').evaluate((list) =>
    [...list.querySelectorAll('[data-night-dot], [data-night-rise]')].every((el) => {
      const style = getComputedStyle(el);
      return style.opacity === '1' && style.transform === 'none';
    }),
  );

test('the first-time points reveal in order when scrolled into view', async ({ page }) => {
  await page.goto('/events');
  const list = page.getByTestId('first-time-points');
  await expect(list.locator('[data-night-dot]')).toHaveCount(4);
  await expect(list.locator('[data-night-rise]')).toHaveCount(4);
  expect(
    await list
      .locator('[data-night-dot]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('0');
  await list.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(list).toHaveAttribute('data-night', 'play');
  await expect.poll(() => pointsSettled(page), { timeout: 4000 }).toBe(true);
});

test('the first-time points replay after scrolling fully away and back', async ({ page }) => {
  await page.goto('/events');
  const list = page.getByTestId('first-time-points');
  await list.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => pointsSettled(page), { timeout: 4000 }).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(list).not.toHaveAttribute('data-night', 'play');
  await list.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(list).toHaveAttribute('data-night', 'play');
  await expect.poll(() => pointsSettled(page), { timeout: 3000 }).toBe(true);
});

test('under reduced motion the first-time points never move', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/events');
  const list = page.getByTestId('first-time-points');
  const transforms = await list.evaluate((el) =>
    [...el.querySelectorAll('[data-night-dot], [data-night-rise]')].map(
      (node) => getComputedStyle(node).transform,
    ),
  );
  expect(transforms.every((t) => t === 'none')).toBe(true);
  await list.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => pointsSettled(page), { timeout: 3000 }).toBe(true);
});

test('if night.js never loads, the first-time points still show', async ({ page }) => {
  await page.route('**/js/night.js', (route) => route.abort());
  await page.goto('/events');
  await expect.poll(() => pointsSettled(page), { timeout: 5000 }).toBe(true);
});

test('every event recap gets a card linking to its recap page', async ({ page }) => {
  const recaps = readdirSync('src/content/events').filter((f) => f.endsWith('.md'));
  await page.goto('/events');
  const links = page.getByRole('link', { name: /Read the recap/ });
  await expect(links).toHaveCount(recaps.length);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  for (const file of recaps) expect(hrefs).toContain(`/events/${file.replace(/\.md$/, '')}`);
});

test('every photo on Events loads at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && /\.(jpe?g|webp|png)$/.test(r.url())) failed.push(r.url());
  });
  await page.goto('/events');
  for (const img of await page.locator('main img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
  }
  expect(failed).toEqual([]);
});

test('Events ends on its own closing copy', async ({ page }) => {
  await page.goto('/events');
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText('Ready to join us?');
  const main = (await hasEvent(page)) ? /View events on Luma/ : /Get notified/;
  await expect(closing.getByRole('link', { name: main })).toHaveAttribute('href', links.luma);
  await expect(closing.getByRole('link', { name: 'Join the community' })).toHaveAttribute(
    'href',
    '/join',
  );
});
