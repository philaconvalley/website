import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { links } from '../src/config';

/**
 * Events, Edition 1.2. The page's facts must match the rest of the site:
 * - with a real event, the Next up card sits beside the live Luma calendar;
 *   with none, one "between nights" card asks people to follow the calendar,
 *   and no RSVP shows anywhere (which test runs depends on the live calendar
 *   at build time; the other skips);
 * - the programs are the same four as Home and About, all white on yellow;
 * - the first-time guide shows the real night (timeline included);
 * - every event recap gets a card that links to its recap page;
 * - every photo loads (no missing 800px copies);
 * - the page ends on its own closing copy.
 */

const hasEvent = async (page: import('@playwright/test').Page) =>
  (await page.getByTestId('next-up').count()) > 0;

test('with an event, Events shows Next up beside the live Luma calendar', async ({ page }) => {
  await page.goto('/events');
  test.skip(!(await hasEvent(page)), 'no upcoming event in this build');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hands-on nights. Every one free.',
  );
  await expect(page.locator('#calendar iframe')).toHaveAttribute('src', links.lumaEmbed);
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

test('the first-time guide shows four points and the night timeline', async ({ page }) => {
  await page.goto('/events');
  const section = page.locator('section', { has: page.getByText('First time?') });
  await expect(section.locator('ol > li h3')).toHaveCount(4);
  await expect(section.getByText(/lesson or demo/).first()).toBeVisible();
  await expect(section.getByTestId('night-strip').locator('li')).toHaveCount(5);
  // LabTrack is retired.
  await expect(page.locator('[data-lab-track]')).toHaveCount(0);
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
