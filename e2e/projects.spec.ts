import { test, expect } from '@playwright/test';
import { links } from '../src/config';

/**
 * Projects, Edition 1.2. The page's facts must hold whatever GitHub returns:
 * - the hero claims open source for community projects only (client work is
 *   private, so "everything we make" would be false);
 * - the heading's count is the number of cards on the page;
 * - every card links to its own repo in the org;
 * - repos with good first issues come first, filled, with a working count link;
 * - the page never says "coming soon" (a saved repo list covers a GitHub outage);
 * - "Make your first PR" lands on the walkthrough on /join.
 */

const WORDS = [
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

test('the hero claims open source for community projects only', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Built by the flock. For the flock.',
  );
  await expect(page.locator('main')).toContainText('Every community project is open source.');
  await expect(page.locator('main')).not.toContainText('Everything we make');
  await expect(page.locator('main')).not.toContainText(/coming soon/i);
});

test('the count in the heading matches the cards on the page', async ({ page }) => {
  await page.goto('/projects');
  const cards = page.getByTestId('project-card');
  const n = await cards.count();
  expect(n, 'the org has public projects, so the page must show some').toBeGreaterThan(0);
  const word = WORDS[n] ?? String(n);
  await expect(page.getByTestId('projects-count')).toHaveText(
    `${word} ${n === 1 ? 'thing' : 'things'} shipped. So far.`,
  );
});

test('every card links to its own repo in the org', async ({ page }) => {
  await page.goto('/projects');
  const cards = page.getByTestId('project-card');
  for (let i = 0; i < (await cards.count()); i++) {
    const card = cards.nth(i);
    const path = ((await card.locator('p.font-mono').textContent()) ?? '').replace(/\s+/g, '');
    expect(path).toMatch(/^philaconvalley\/[\w.-]+$/);
    const repo = card.getByRole('heading', { level: 3 }).getByRole('link');
    await expect(repo).toHaveAttribute('href', `https://github.com/${path}`);
    await expect(repo).toHaveAttribute('target', '_blank');
  }
});

test('newcomer-ready repos come first, filled, with a good first issue link', async ({ page }) => {
  await page.goto('/projects');
  const ready = await page
    .getByTestId('project-card')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-ready') === 'true'));
  // All true values before any false value.
  expect(ready.indexOf(false) === -1 || !ready.slice(ready.indexOf(false)).includes(true)).toBe(
    true,
  );

  const readyCards = page.locator('[data-testid="project-card"][data-ready="true"]');
  for (let i = 0; i < (await readyCards.count()); i++) {
    const card = readyCards.nth(i);
    await expect(card).not.toHaveClass(/\bbg-white\b/);
    const link = card.getByTestId('good-first-issues');
    await expect(link).toHaveText(/^\d+ good first issues?$/);
    await expect(link).toHaveAttribute('href', /\/issues\?q=.*good%20first%20issue/);
  }
  await expect(
    page.locator(
      '[data-testid="project-card"][data-ready="false"] [data-testid="good-first-issues"]',
    ),
  ).toHaveCount(0);
});

test('"Make your first PR" lands on the walkthrough on /join', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('link', { name: 'Make your first PR' })).toHaveAttribute(
    'href',
    '/join#first-pr',
  );
  await expect(page.getByRole('link', { name: 'Follow the walkthrough' })).toHaveAttribute(
    'href',
    '/join#first-pr',
  );
  // github.com/issues needs a login; the public search page works for everyone.
  await expect(page.getByRole('link', { name: /Browse open issues/ })).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/search\?type=issues&q=.*good%20first%20issue/,
  );
  await page.goto('/join#first-pr');
  await expect(page.locator('#first-pr [data-testid="first-pr-steps"]')).toBeVisible();
});

test('Projects ends on its own closing copy', async ({ page }) => {
  await page.goto('/projects');
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText('Built something cool?');
  await expect(closing.getByRole('link', { name: 'Submit your project' })).toHaveAttribute(
    'href',
    '/contact',
  );
  await expect(closing.getByRole('link', { name: /View on GitHub/ })).toHaveAttribute(
    'href',
    links.github.org,
  );
});
