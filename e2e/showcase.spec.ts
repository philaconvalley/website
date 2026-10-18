import { test, expect } from '@playwright/test';

/**
 * The crew, partner, and client-proof sections show only people and
 * organizations that said yes (src/lib/showcase.ts). These tests run against a
 * build, where drafts must never appear, and they hold whether or not any
 * entry has been approved yet:
 * - no draft badge on any page;
 * - a section either is absent or has at least one card;
 * - every card that does appear has what the schema promises.
 */

for (const route of ['/about', '/support']) {
  test(`${route} shows no draft entries`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('[data-draft]')).toHaveCount(0);
  });
}

test('About shows the team only with real photos and bios', async ({ page }) => {
  await page.goto('/about');
  const team = page.getByTestId('team');
  if ((await team.count()) === 0) return;
  const members = team.locator('li');
  expect(await members.count()).toBeGreaterThan(0);
  for (const member of await members.all()) {
    const photo = member.locator('img');
    await expect(photo).toHaveAttribute('alt', /\S/);
    await photo.scrollIntoViewIfNeeded();
    // Lazy images load after scrolling, so wait for the real size.
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(member.locator('h3')).not.toBeEmpty();
    await expect(member.locator('p')).toHaveCount(2);
  }
});

test('About shows partners only with real logos', async ({ page }) => {
  await page.goto('/about');
  const partners = page.getByTestId('partners');
  if ((await partners.count()) === 0) return;
  const cards = partners.locator('li');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    const logo = card.locator('img');
    await expect(logo).toHaveAttribute('alt', /\S/);
    await logo.scrollIntoViewIfNeeded();
    // Lazy images load after scrolling, so wait for the real size.
    await expect
      .poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test('Studio is a 404 with no approved client story, and links to it match', async ({ page }) => {
  const studioLive = (await page.goto('/studio'))?.status() === 200;
  for (const route of ['/', '/about', '/support']) {
    await page.goto(route);
    const links = page.locator('a[href="/studio"]');
    if (studioLive) await expect(links.first()).toBeAttached();
    else await expect(links).toHaveCount(0);
  }
});

test('Studio asks for one thing, and shows only finished client proof', async ({ page }) => {
  const response = await page.goto('/studio');
  test.skip(response?.status() !== 200, 'Studio waits for its first approved client story');
  await expect(page.locator('[data-draft]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText('Built with you. Run by you.');
  await expect(page.getByTestId('studio-cta')).toHaveAttribute('href', '/contact');
  const proofs = page.getByTestId('studio-proof');
  // "See the work" exists only when there is work to see.
  await expect(page.getByRole('link', { name: 'See the work' })).toHaveCount(
    (await proofs.count()) > 0 ? 1 : 0,
  );
  for (const proof of await proofs.all()) {
    await expect(proof.locator('h3')).not.toBeEmpty();
    // An approved story shows something real: a screenshot or the client's words.
    expect(
      (await proof.locator('img').count()) + (await proof.locator('blockquote').count()),
    ).toBeGreaterThan(0);
    for (const img of await proof.locator('img').all()) {
      await expect(img).toHaveAttribute('alt', /\S/);
    }
  }
});

test('the old case-study pages are gone', async ({ page }) => {
  const response = await page.goto('/work/preview-dsm215');
  expect(response?.status()).toBe(404);
});
