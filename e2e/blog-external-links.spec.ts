import { test, expect } from '@playwright/test';

// Regression coverage for the bug where cross-posted blog entries (externalUrl set)
// rendered a blank internal page and the RSS feed linked to it instead of the real
// external article. See GitHub issue #83.

test.describe('blog external-post routing', () => {
  test('a cross-post slug has no internal page (404s, does not render blank)', async ({ page }) => {
    const response = await page.goto('/blog/waskar-between-commits/');
    expect(response?.status()).toBe(404);
  });

  test('a regular internal post still renders normally', async ({ page }) => {
    const response = await page.goto('/blog/welcome/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Welcome to PhilaCon Valley');
  });

  test('the blog index links cross-posts directly to their external URL', async ({ page }) => {
    await page.goto('/blog/');
    const externalLink = page.locator('a', { hasText: 'Between Commits' });
    await expect(externalLink).toHaveAttribute('href', /raksaw\.substack\.com/);
    await expect(externalLink).toHaveAttribute('target', '_blank');
    await expect(externalLink).toHaveAttribute('rel', /noopener/);
  });

  test('RSS feed links cross-posts to their real external URL, not the internal route', async ({
    request,
  }) => {
    const res = await request.get('/rss.xml');
    const body = await res.text();
    expect(body).toContain('raksaw.substack.com');
    expect(body).not.toContain('/blog/waskar-between-commits/');
    expect(body).not.toContain('/blog/waskar-plot-holes-potholes/');
  });
});
