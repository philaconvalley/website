import { test, expect } from '@playwright/test';
import { community } from '../src/config';

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

test('About lists six values, in order', async ({ page }) => {
  await page.goto('/about');
  const values = page.locator('ol > li h3');
  await expect(values).toHaveCount(6);
  await expect(values.first()).toHaveText('Centering the margins');
  await expect(values.last()).toHaveText('Radical welcome');
});
