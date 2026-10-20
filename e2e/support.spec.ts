import { test, expect } from '@playwright/test';
import { links } from '../src/config';

/**
 * Support, Edition 1.2. The page's facts must hold:
 * - every donate button goes to the live Open Collective page;
 * - the agency card sends buyers to /studio once it is live, /contact before;
 * - "Other ways to help" lands on its section, and each way has a real link;
 * - the venue is named Pennovation Center, the building, not the campus;
 * - the page ends on its own closing copy.
 */

test('every donate button goes to Open Collective', async ({ page }) => {
  await page.goto('/support');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Keep it free for the next person.',
  );
  const donate = page.locator('main').getByRole('link', { name: /^Donate/ });
  await expect(donate).toHaveCount(3);
  for (const link of await donate.all()) {
    await expect(link).toHaveAttribute('href', links.openCollective);
    await expect(link).toHaveAttribute('target', '_blank');
  }
});

test('the agency card goes to the studio page once it is live, or to contact', async ({ page }) => {
  const studioLive = (await page.goto('/studio'))?.status() === 200;
  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'Hire us. Fund the flock.' })).toBeVisible();
  const cta = page.getByTestId('primary-cta');
  await expect(cta).toHaveText(studioLive ? 'See the studio' : 'Start a project');
  await expect(cta).toHaveAttribute('href', studioLive ? '/studio' : '/contact');
});

test('"Other ways to help" lands on four real ways', async ({ page }) => {
  await page.goto('/support');
  await page.getByRole('link', { name: 'Other ways to help' }).click();
  await expect(page).toHaveURL(/#ways$/);
  const ways = page.locator('#ways li');
  await expect(ways).toHaveCount(4);
  await expect(ways.getByRole('heading', { level: 3 })).toHaveText([
    'Sponsor a night',
    'Mentor',
    'Host us',
    'Share opportunities',
  ]);
  for (const link of await ways.getByRole('link').all()) {
    await expect(link).toHaveAttribute('href', /^\/(contact|join)$/);
  }
});

test('the venue is named Pennovation Center', async ({ page }) => {
  await page.goto('/support');
  await expect(page.locator('main')).toContainText('Pennovation Center');
  await expect(page.locator('main')).not.toContainText('Pennovation Works');
});

test('Support ends on its own closing copy', async ({ page }) => {
  await page.goto('/support');
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText('Ready to make an impact?');
  await expect(closing.getByRole('link', { name: 'Talk to us' })).toHaveAttribute(
    'href',
    '/contact',
  );
});
