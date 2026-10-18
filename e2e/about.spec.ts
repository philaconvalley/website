import { test, expect } from '@playwright/test';
import { community, links } from '../src/config';
import { parseValues } from '../src/lib/parse-handbook-values';

/**
 * About, Edition 1.2. The page's facts must match the rest of the site:
 * - the founder photo is the real headshot, with alt text;
 * - the member count says it is the Luma calendar count;
 * - the values are the handbook's, with their source links.
 * The cross-page rules (no repeated program cards or timeline, the motto on
 * Home only) live in e2e/site-audit.spec.ts.
 */

test('About shows the real founder photo, with alt text and a caption', async ({ page }) => {
  await page.goto('/about');
  const photo = page.getByRole('img', { name: /Waskar Paulino/ });
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toHaveAttribute('src', /waskar-paulino-560\.webp/);
  expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('figcaption')).toContainText('Founder & Executive Director');
});

test('the member count says it is the Luma calendar count', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByTestId('member-count')).toHaveText(
    `${community.memberCount} people on our Luma calendar so far.`,
  );
  await expect(page.getByRole('link', { name: 'Join the flock' })).toHaveAttribute('href', '/join');
});

test('About shows every handbook value, with its source links', async ({ page }) => {
  await page.goto('/about');
  const values = page.getByTestId('values').locator('li');
  const count = await values.count();
  expect(count).toBeGreaterThan(0);
  for (const value of await values.all()) {
    await expect(value.locator('h3')).not.toBeEmpty();
    await expect(value.locator('p')).not.toBeEmpty();
  }
  // The headline count follows the handbook ("Six things" for six values).
  const words = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
  ];
  await expect(page.getByRole('heading', { level: 2, name: /don't bend on/i })).toContainText(
    words[count] ?? String(count),
  );
  const source = page.getByTestId('values-source');
  await expect(source.getByRole('link', { name: 'Read our values' })).toHaveAttribute(
    'href',
    links.handbook.values,
  );
  await expect(source.getByRole('link', { name: 'Read our community guidelines' })).toHaveAttribute(
    'href',
    links.handbook.guidelines,
  );
});

test('the handbook parser reads each heading and its first sentence, and rejects a broken file', () => {
  const markdown = [
    '# Community Values',
    '',
    '> **Status:** Draft',
    '',
    'Intro paragraph that is not a value.',
    '',
    '---',
    '',
    '## Belonging',
    'Everyone belongs here. We make **space** for people.',
    '',
    '## Joy',
    'Tech can be [joyful](https://example.com)! More text.',
  ].join('\n');
  expect(parseValues(markdown)).toEqual([
    { name: 'Belonging', line: 'Everyone belongs here.' },
    { name: 'Joy', line: 'Tech can be joyful!' },
  ]);
  expect(parseValues('# Values\n\nNo headings here.')).toBeNull();
  expect(parseValues('## Empty heading\n')).toBeNull();
});

test('About ends on its own closing copy; Home keeps the motto', async ({ page }) => {
  await page.goto('/about');
  const about = page.getByTestId('closing-flock');
  await expect(about.getByRole('heading', { level: 2 })).toHaveText(
    'Show up before you feel ready.',
  );
  await expect(about.getByRole('link', { name: 'Get involved' })).toHaveAttribute('href', '/join');
  await expect(about.getByRole('link', { name: 'Attend an event' })).toHaveAttribute(
    'href',
    '/events',
  );
  await page.goto('/');
  const home = page.getByTestId('closing-flock');
  await expect(home.getByRole('heading', { level: 2 })).toContainText('A pigeon flies alone.');
  // Home keeps the event-aware default: an RSVP for a real event, else Get notified.
  await expect(
    home.getByRole('link', { name: /RSVP for the next night|Get notified/ }),
  ).toBeVisible();
});
