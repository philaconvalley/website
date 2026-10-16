import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { links } from '../src/config';

/**
 * Events, Edition 1.2. The page's facts must match the rest of the site:
 * - the live Luma calendar is embedded;
 * - the programs are the same four as Home and About, all white on yellow;
 * - the first-time guide shows the real night (timeline included);
 * - every event recap gets a card that links to its recap page;
 * - every photo loads (no missing 800px copies);
 * - the page ends on its own closing copy.
 */

test('Events embeds the live Luma calendar', async ({ page }) => {
  await page.goto('/events');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hands-on nights. Every one free.',
  );
  await expect(page.locator('#calendar iframe')).toHaveAttribute('src', links.lumaEmbed);
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
  await expect(closing.getByRole('link', { name: /View events on Luma/ })).toHaveAttribute(
    'href',
    links.luma,
  );
  await expect(closing.getByRole('link', { name: 'Join the community' })).toHaveAttribute(
    'href',
    '/join',
  );
});
