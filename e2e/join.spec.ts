import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { links } from '../src/config';

/**
 * Join, Edition 1.2. The page's facts must hold:
 * - the hero shows the real Discord server with its live count, and the Slack
 *   backup for people who cannot reach Discord, worded as quieter;
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
  const slack = page.getByTestId('slack-fallback');
  await expect(slack).toContainText('Slack');
  await expect(slack).toContainText('quieter');
  await expect(slack.getByRole('link', { name: 'Join our Slack' })).toHaveAttribute(
    'href',
    links.slack,
  );
  // A workspace invite, not a channel link: a channel link shows non-members a sign-in wall.
  expect(links.slack).toMatch(/^https:\/\/join\.slack\.com\/t\/philaconvalley\/shared_invite\//);
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

// The role ladder plays with the night system (public/js/night.js): hidden
// before paint, revealed in order when it scrolls into view.
const ladderSettled = (page: import('@playwright/test').Page) =>
  page.getByTestId('discord-roles').evaluate((list) =>
    [...list.querySelectorAll('[data-night-dot], [data-night-rise]')].every((el) => {
      const style = getComputedStyle(el);
      return style.opacity === '1' && style.transform === 'none';
    }),
  );

test('the role ladder builds up in order when scrolled into view', async ({ page }) => {
  await page.goto('/join');
  const ladder = page.getByTestId('discord-roles');
  await expect(ladder.locator('[data-night-rise]')).toHaveCount(3);
  expect(
    await ladder
      .locator('[data-night-rise]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('0');
  await ladder.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(ladder).toHaveAttribute('data-night', 'play');
  await expect.poll(() => ladderSettled(page), { timeout: 4000 }).toBe(true);
});

test('the role ladder replays after scrolling fully away and back', async ({ page }) => {
  await page.goto('/join');
  const ladder = page.getByTestId('discord-roles');
  await ladder.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => ladderSettled(page), { timeout: 4000 }).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(ladder).not.toHaveAttribute('data-night', 'play');
  await ladder.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(ladder).toHaveAttribute('data-night', 'play');
  await expect.poll(() => ladderSettled(page), { timeout: 3000 }).toBe(true);
});

test('under reduced motion the role ladder never moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/join');
  const ladder = page.getByTestId('discord-roles');
  const transforms = await ladder.evaluate((el) =>
    [...el.querySelectorAll('[data-night-dot], [data-night-rise]')].map(
      (node) => getComputedStyle(node).transform,
    ),
  );
  expect(transforms.every((t) => t === 'none')).toBe(true);
  await ladder.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => ladderSettled(page), { timeout: 3000 }).toBe(true);
});

test('if night.js never loads, the role ladder still shows', async ({ page }) => {
  await page.route('**/js/night.js', (route) => route.abort());
  await page.goto('/join');
  await expect.poll(() => ladderSettled(page), { timeout: 5000 }).toBe(true);
});
