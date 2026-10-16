import { test, expect } from '@playwright/test';
import { community, links } from '../src/config';
import { parseValues } from '../src/lib/parse-handbook-values';

/**
 * About, Edition 1.2. The page's facts must match the rest of the site:
 * - the founder photo is the real headshot, with alt text;
 * - the programs are the same four as Home, with Stoop as a line;
 * - "Join N of us" shows the same member count as Home.
 */

test('About shows the real founder photo, with alt text and a caption', async ({ page }) => {
  await page.goto('/about');
  const photo = page.getByRole('img', { name: /Waskar Paulino/ });
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toHaveAttribute('src', /waskar-paulino-560\.webp/);
  expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('figcaption')).toContainText('Founder & Executive Director');
});

test('About shows the same four programs as Home, and Stoop as a line', async ({ page }) => {
  const names = async (route: string) => {
    await page.goto(route);
    return page
      .locator('[data-testid="stoop-line"]')
      .locator('xpath=..')
      .locator('ul h3')
      .allTextContents();
  };
  const about = await names('/about');
  expect(about).toEqual(['PATCH', 'Lab', 'Community projects', 'Career Support']);
  expect(await names('/')).toEqual(about);
  await page.goto('/about');
  await expect(page.getByTestId('stoop-line')).toContainText('Stoop');
});

test('"Join N of us" shows the live member count', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByTestId('join-count')).toHaveText(`Join ${community.memberCount} of us`);
  await expect(page.getByTestId('join-count')).toHaveAttribute('href', '/join');
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

test('About program cards drop the Cost and Experience lines; Home keeps them', async ({
  page,
}) => {
  const cards = (route: string) =>
    page
      .goto(route)
      .then(() => page.getByTestId('stoop-line').locator('xpath=..').locator('ul li'));
  const about = await cards('/about');
  await expect(about).toHaveCount(4);
  await expect(about.filter({ hasText: 'Cost:' })).toHaveCount(0);
  const home = await cards('/');
  await expect(home.filter({ hasText: 'Cost:' })).toHaveCount(4);
});
