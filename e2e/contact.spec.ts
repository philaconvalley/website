import { test, expect } from '@playwright/test';
import { links, site } from '../src/config';

/**
 * Contact, Edition 1.2. The page's facts must hold (the form's own behavior is
 * covered in launch-readiness.spec.ts, and its focus in focus-ring.spec.ts):
 * - the connect card has the real email, location, events link and socials;
 * - the reply-time promise sits beside the form;
 * - the FAQ is native <details>: the first answer open, the rest closed, and
 *   each opens from the keyboard;
 * - the Slack answer uses the workspace invite link, like /join;
 * - the closing never offers an RSVP without a real event.
 */

test('the connect card has the real contact details', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Say hi. We'll say it back.");
  // Scoped to main: the footer carries the same email link.
  await expect(
    page.locator('main').getByRole('link', { name: site.email }).first(),
  ).toHaveAttribute('href', `mailto:${site.email}`);
  await expect(page.locator('main')).toContainText(site.location);
  const social = page.getByTestId('contact-social').getByRole('link');
  await expect(social).toHaveText(['Discord', 'Instagram', 'LinkedIn', 'X', 'GitHub']);
  await expect(social.first()).toHaveAttribute('href', links.discord);
  await expect(page.locator('main')).toContainText('We usually reply within 24 to 48 hours.');
});

test('the FAQ opens the first answer and the rest from the keyboard', async ({ page }) => {
  await page.goto('/contact');
  const items = page.getByTestId('faq').locator('details');
  await expect(items).toHaveCount(5);
  await expect(items.first()).toHaveAttribute('open', '');
  for (let i = 1; i < 5; i++) await expect(items.nth(i)).not.toHaveAttribute('open', '');

  const beginner = items.nth(1);
  await beginner.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(beginner).toHaveAttribute('open', '');
  await expect(beginner).toContainText('No experience is needed');
});

test('the Slack answer uses the workspace invite link', async ({ page }) => {
  await page.goto('/contact');
  const slack = page.getByTestId('faq').locator('details', { hasText: 'Is there a Slack?' });
  await slack.locator('summary').click();
  await expect(slack.getByRole('link', { name: 'Join our Slack' })).toHaveAttribute(
    'href',
    links.slack,
  );
  await expect(slack).not.toContainText('international');
});

test('the closing never offers an RSVP without a real event', async ({ page }) => {
  await page.goto('/contact');
  const closing = page.getByTestId('closing-flock');
  await expect(closing.getByRole('heading', { level: 2 })).toHaveText(
    'Or just come say it in person.',
  );
  const hasEvent = (await page.locator('[data-pcv-event-start]').count()) > 0;
  test.skip(hasEvent, 'this build has an upcoming event');
  await expect(closing.getByRole('link', { name: /Get notified/ })).toHaveAttribute(
    'href',
    links.luma,
  );
  await expect(closing).not.toContainText('RSVP');
});
