import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { links } from '../src/config';

/**
 * Join, Edition 1.2. The page's facts must hold:
 * - the hero shows the real Discord server with its live count, and no Slack
 *   fallback (none is confirmed);
 * - the role ladder shows only roles with a written meaning (no Crew, which is
 *   the admin role, and no Connector, which has no definition);
 * - all six first-PR steps show at once, and every command on them is in the
 *   longer guide, so the two cannot drift apart;
 * - "Come to a Lab" never offers an RSVP without a real event;
 * - the values are the three backed by the code of conduct.
 */

test('the hero welcomes people to the real Discord server', async ({ page }) => {
  await page.goto('/join');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You already belong here.');
  await expect(page.getByRole('link', { name: /Join the Discord/ })).toHaveAttribute(
    'href',
    links.discord,
  );
  await expect(page.getByTestId('discord-count')).toHaveText(/\d+ members · \d+ online now/);
  await expect(page.locator('main')).not.toContainText('Slack');
});

test('the role ladder shows only roles with a written meaning', async ({ page }) => {
  await page.goto('/join');
  const roles = page.getByTestId('discord-roles').getByRole('heading', { level: 3 });
  await expect(roles).toHaveText(['Neighbor', 'Builder', 'Voice']);
  await expect(page.getByTestId('discord-roles')).not.toContainText(/Crew|Connector/);
});

test('all six first-PR steps show at once, with commands from the longer guide', async ({
  page,
}) => {
  await page.goto('/join');
  const steps = page.getByTestId('first-pr-steps').locator(':scope > li');
  await expect(steps).toHaveCount(6);
  for (let i = 0; i < 6; i++) await expect(steps.nth(i)).toBeVisible();

  const guide = readFileSync('src/content/resources/first-pull-request.md', 'utf8');
  const blocks = await page.getByTestId('first-pr-steps').locator('code').allTextContents();
  const lines = blocks
    .flatMap((b) => b.split('\n'))
    .map((l) => l.trim())
    .filter((l) => l && !l.includes('→')); // the Fork line is a GitHub button, not a command
  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) expect(guide, `"${line}" is not in the longer guide`).toContain(line);
});

test('"Make your first PR" lands on the steps', async ({ page }) => {
  await page.goto('/join');
  await page.getByRole('link', { name: 'Make your first PR' }).click();
  await expect(page).toHaveURL(/#first-pr$/);
  await expect(page.getByTestId('first-pr-steps')).toBeInViewport();
});

test('"Come to a Lab" never offers an RSVP without a real event', async ({ page }) => {
  await page.goto('/join');
  const hasEvent = (await page.locator('[data-pcv-event-start]').count()) > 0;
  test.skip(hasEvent, 'this build has an upcoming event');
  const lab = page.locator('li', { has: page.getByRole('heading', { name: 'Come to a Lab' }) });
  await expect(lab.getByRole('link', { name: 'Get notified' })).toHaveAttribute('href', links.luma);
  await expect(lab).not.toContainText('RSVP');
});

test('the values are the three backed by the code of conduct', async ({ page }) => {
  await page.goto('/join');
  await expect(page.getByTestId('join-values').locator('li')).toHaveText([
    'Respect, every time',
    'Center marginalized voices',
    'Zero tolerance for harassment',
  ]);
  await expect(page.getByRole('link', { name: 'Read the code of conduct' })).toHaveAttribute(
    'href',
    /CODE_OF_CONDUCT\.md$/,
  );
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText('Ready to get started?');
  await expect(closing.getByRole('link', { name: 'Come to a Lab' })).toHaveAttribute(
    'href',
    '/events',
  );
});
