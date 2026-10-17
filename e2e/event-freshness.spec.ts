import { test, expect } from '@playwright/test';

/**
 * The site is `output: static`, so every date decision in src/lib/community.ts is
 * frozen into HTML at build time. Its guard against advertising a night that
 * already happened therefore cannot fire for an event that expires *after* the
 * build — and with no scheduled rebuild, that is the normal case: the day after
 * an event, every visitor is still offered an RSVP to a closed door.
 *
 * BaseLayout.astro closes that gap by deciding against the visitor's clock. These
 * tests fake that clock rather than hardcoding a date, so they stay honest as the
 * real calendar moves: they read the expiry the build actually emitted, then set
 * time either side of it.
 */

const BAR = '[data-testid="event-bar-cta"]';
const CTA = '[data-testid="hero-cta"]';

/**
 * The build emits these elements only when an event is scheduled. If none is,
 * there is nothing to assert about staleness — skip loudly rather than pass
 * silently, because a vacuous green here is exactly how the bug shipped.
 */
async function eventStart(page: import('@playwright/test').Page): Promise<number> {
  await page.goto('/');
  const marked = page.locator('[data-pcv-event-start]').first();
  const count = await page.locator('[data-pcv-event-start]').count();
  test.skip(count === 0, 'no upcoming event in this build — nothing to expire');

  const iso = await marked.getAttribute('data-pcv-event-start');
  const parsed = Date.parse(iso ?? '');
  expect(Number.isNaN(parsed), `unparseable expiry "${iso}"`).toBe(false);
  return parsed;
}

test.describe('event freshness against the visitor clock', () => {
  test('the RSVP bar disappears once the event has started', async ({ page }) => {
    const start = await eventStart(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date(start + 60 * 60 * 1000) });
    await page.goto('/');

    await expect(page.locator(BAR)).toHaveCount(0);
    // The clearance spacer carries the same expiry; left behind it would strand
    // 88px of dead space under the footer.
    await expect(page.locator('[data-pcv-event-start]')).toHaveCount(0);
  });

  test('the RSVP bar is still there before the event', async ({ page }) => {
    const start = await eventStart(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date(start - 60 * 60 * 1000) });
    await page.goto('/');

    await expect(page.locator(BAR)).toBeVisible();
  });

  test('the header CTA falls back to the Luma calendar instead of a closed event page', async ({
    page,
  }) => {
    const start = await eventStart(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.clock.install({ time: new Date(start + 60 * 60 * 1000) });
    await page.goto('/');

    const cta = page.locator(CTA);
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText('Get notified');
    await expect(cta).toHaveAttribute('href', 'https://lu.ma/philaconvalley');
    // The calendar is another site, so the link keeps its new tab.
    await expect(cta).toHaveAttribute('target', '_blank');
  });

  test('the header CTA still deep-links to Luma before the event', async ({ page }) => {
    const start = await eventStart(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.clock.install({ time: new Date(start - 60 * 60 * 1000) });
    await page.goto('/');

    const cta = page.locator(CTA);
    // innerText, not textContent: the hidden "Get notified" label waits in the
    // same link until the event starts.
    await expect(cta).toHaveText('RSVP', { useInnerText: true });
    await expect(cta).toHaveAttribute('href', /lu(ma)?\.(ma|com)/);
    await expect(cta).toHaveAttribute('target', '_blank');
  });
});

/**
 * With no accurate event, the header, the Home hero, and the Home closing
 * never offer an RSVP. They ask people to follow the Luma calendar, which lets
 * them know when the next night is posted. Which tests run depends on the live
 * calendar at build time; the others skip.
 */
test.describe('Get notified when no event is known', () => {
  const HERO = '[data-testid="home-rsvp"]';
  const LUMA = 'https://lu.ma/philaconvalley';

  test('with no event in the build, the header and hero say Get notified', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const hasEvent = (await page.locator('[data-pcv-event-start]').count()) > 0;
    test.skip(hasEvent, 'this build has an upcoming event');

    for (const selector of [HERO, CTA]) {
      const link = page.locator(selector);
      await expect(link).toHaveText('Get notified');
      await expect(link).toHaveAttribute('href', LUMA);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    const closing = page.getByTestId('closing-flock');
    await expect(closing.getByRole('link', { name: 'Get notified' })).toHaveAttribute('href', LUMA);
    await expect(closing).not.toContainText('RSVP');
  });

  test('after a built event starts, the hero falls back to Get notified', async ({ page }) => {
    const start = await eventStart(page);

    await page.clock.install({ time: new Date(start + 60 * 60 * 1000) });
    await page.goto('/');

    const hero = page.locator(HERO);
    await expect(hero).toHaveText('Get notified');
    await expect(hero).toHaveAttribute('href', LUMA);
    await expect(hero).toHaveAttribute('target', '_blank');
  });
});
