import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Resources, Edition 1.2. The page's facts must match the guide files:
 * - one card per guide in src/content/resources, with the file's own copy;
 * - a filter appears only when it has two or more choices;
 * - a tag that repeats the level is not shown;
 * - each card is one link with a short name, and card titles are h2;
 * - "Contribute a resource" goes to the contribution guide on GitHub.
 */

const guides = readdirSync('src/content/resources').filter(
  (f) => f.endsWith('.md') && !f.startsWith('_'),
);
const field = (file: string, name: string) =>
  new RegExp(`^${name}: '([^']+)'`, 'm').exec(
    readFileSync(`src/content/resources/${file}`, 'utf8'),
  )?.[1];
const distinct = (name: string) => new Set(guides.map((f) => field(f, name))).size;

test('one card per guide, with the guide file’s own copy', async ({ page }) => {
  await page.goto('/resources');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Free guides, written by the flock.',
  );
  const cards = page.locator('[data-resource]');
  await expect(cards).toHaveCount(guides.length);
  // The count shows only with the filters (site audit, 10/18/2026).
  const filtered = distinct('category') > 1 || distinct('level') > 1;
  if (filtered) {
    await expect(page.getByTestId('resource-count')).toHaveText(
      `${guides.length} ${guides.length === 1 ? 'resource' : 'resources'}`,
    );
  } else {
    await expect(page.getByTestId('resource-count')).toHaveCount(0);
  }
  for (const file of guides) {
    const card = cards.filter({ hasText: field(file, 'title')! });
    await expect(card.getByRole('heading', { level: 2 })).toHaveText(field(file, 'title')!);
    await expect(card).toContainText(field(file, 'description')!);
  }
});

test('a filter shows only when it has two or more choices', async ({ page }) => {
  await page.goto('/resources');
  const selects = page.locator('main select');
  const expected = (distinct('category') > 1 ? 1 : 0) + (distinct('level') > 1 ? 1 : 0);
  await expect(selects).toHaveCount(expected);
});

test('each card is one link with a short name and no repeated level tag', async ({ page }) => {
  await page.goto('/resources');
  const card = page.locator('main a.card').first();
  await expect(card).toHaveAccessibleName(
    /^Read the guide: .+ \((Workshop|Tutorial|Career|Tool), (Beginner|Intermediate|Advanced)\)$/,
  );
  const level = (await card.locator('.pill').nth(1).textContent())!.trim().toLowerCase();
  const tags = await card.locator('ul[aria-label="Tags"] li').allTextContents();
  expect(tags.map((t) => t.trim().toLowerCase())).not.toContain(level);
});

test('"Contribute a resource" goes to the contribution guide', async ({ page }) => {
  await page.goto('/resources');
  const guide = /docs\/adding-content\.md#adding-a-resource$/;
  const card = page.getByTestId('your-guide-here');
  await expect(card).toContainText('after a quick review');
  await expect(card.getByRole('link', { name: 'Contribute a resource' })).toHaveAttribute(
    'href',
    guide,
  );
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText('Share what you know.');
  await expect(closing.getByRole('link', { name: /Contribute a resource/ })).toHaveAttribute(
    'href',
    guide,
  );
});
