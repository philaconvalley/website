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
  // Career Support is coming soon: a card without the Cost lines.
  await expect(home.filter({ hasText: 'Cost:' })).toHaveCount(3);
});

test('About shows the five steps of a night, the same as Home', async ({ page }) => {
  await page.goto('/about');
  const steps = page.getByTestId('night-strip').locator('li');
  await expect(steps).toHaveCount(5);
  await expect(steps.first()).toContainText('6:00 PM');
  await expect(steps.last()).toContainText('9:00 PM');
  const about = await steps.allTextContents();
  await page.goto('/');
  const home = page
    .locator('section', { has: page.getByText('How a Lab night works') })
    .locator('ol > li h3');
  const homeTitles = await home.allTextContents();
  homeTitles.forEach((title, i) => expect(about[i]).toContain(title.trim()));
});

// The night timeline (public/js/night-arm.js, night.js).
const settled = (page: import('@playwright/test').Page) =>
  page.locator('[data-night-strip]').evaluate((strip) =>
    [...strip.querySelectorAll('[data-night-dot], [data-night-rise], [data-night-seg]')].every(
      (el) => {
        const style = getComputedStyle(el);
        return style.opacity === '1' && style.transform === 'none';
      },
    ),
  );

test('the night timeline draws in when scrolled into view and settles fully shown', async ({
  page,
}) => {
  await page.goto('/about');
  const strip = page.locator('[data-night-strip]');
  // Hidden before it plays: the first dot starts transparent.
  expect(
    await strip
      .locator('[data-night-dot]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('0');
  await strip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(strip).toHaveAttribute('data-night', 'play');
  await expect.poll(() => settled(page), { timeout: 4000 }).toBe(true);
});

test('the night timeline replays after scrolling fully away and back', async ({ page }) => {
  await page.goto('/about');
  const strip = page.locator('[data-night-strip]');
  await strip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => settled(page), { timeout: 4000 }).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(strip).not.toHaveAttribute('data-night', 'play');
  await expect(strip).toHaveAttribute('data-night-replay', '');
  await strip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(strip).toHaveAttribute('data-night', 'play');
  await expect.poll(() => settled(page), { timeout: 3000 }).toBe(true);
});

test('under reduced motion the night timeline never moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about');
  const strip = page.locator('[data-night-strip]');
  const transforms = await strip.evaluate((el) =>
    [...el.querySelectorAll('[data-night-dot], [data-night-rise], [data-night-seg]')].map(
      (node) => getComputedStyle(node).transform,
    ),
  );
  expect(transforms.every((t) => t === 'none')).toBe(true);
  await strip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => settled(page), { timeout: 3000 }).toBe(true);
});

test('if night.js never loads, the night steps still show after the safety timer', async ({
  page,
}) => {
  await page.route('**/js/night.js', (route) => route.abort());
  await page.goto('/about');
  await expect.poll(() => settled(page), { timeout: 5000 }).toBe(true);
});

test('About ends on its own closing copy; Home keeps the motto', async ({ page }) => {
  await page.goto('/about');
  const about = page.getByTestId('closing-flock');
  await expect(about.getByRole('heading', { level: 2 })).toHaveText(
    'Show up before you feel ready.',
  );
  await expect(about).toContainText('A pigeon flies alone. A flock goes much further.');
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
