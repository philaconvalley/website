import { test, expect } from '@playwright/test';

// Forces the :active pseudo-class via CDP (the same mechanism DevTools' "force state"
// uses) instead of a real held-down mouse click — avoids any risk of the click
// actually completing and navigating away mid-test.
async function forceActive(page: import('@playwright/test').Page, selector: string) {
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
  return client;
}

test.describe('Button press feedback', () => {
  test('scales down on press with no-preference motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const button = page.locator('a.bg-accent-400[href="/join"]');
    await expect(button).toHaveCSS('transform', 'none');

    const client = await forceActive(page, 'a.bg-accent-400[href="/join"]');
    await expect(button).toHaveCSS('transform', 'matrix(0.97, 0, 0, 0.97, 0, 0)');
    await client.detach();
  });

  test('dims via opacity instead of scaling when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const button = page.locator('a.bg-accent-400[href="/join"]');

    const client = await forceActive(page, 'a.bg-accent-400[href="/join"]');
    await expect(button).toHaveCSS('transform', 'none');
    await expect(button).toHaveCSS('opacity', '0.8');
    await client.detach();
  });
});
