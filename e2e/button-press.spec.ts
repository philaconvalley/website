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

// The press pushes the button 2px down-right into its hard shadow, and the
// shadow shrinks by the same 2px, so its outer edge stays put (DESIGN.md,
// motion rule 11). The header RSVP rests on a 3px shadow and presses to 1px.
// Under reduced motion only the shadow changes (rule 12): no movement.
test.describe('Button press feedback', () => {
  test('pushes into its shadow on press with no-preference motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const button = page.locator('[data-testid="hero-cta"]');
    await expect(button).toHaveCSS('transform', 'none');

    const client = await forceActive(page, '[data-testid="hero-cta"]');
    await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, 2)');
    await expect(button).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 1px 1px 0px 0px/);
    await client.detach();
  });

  test('only the shadow changes on press when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const button = page.locator('[data-testid="hero-cta"]');

    const client = await forceActive(page, '[data-testid="hero-cta"]');
    await expect(button).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 1px 1px 0px 0px/);
    await expect(button).toHaveCSS('transform', 'none');
    await client.detach();
  });

  test('the shared Button lifts on hover and pushes into its shadow on press', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/support');
    const selector = '[data-testid="primary-cta"]';
    const button = page.locator(selector);
    await button.hover();
    await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -2, -2)');
    await expect(button).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 6px 6px 0px 0px/);

    await page.mouse.move(0, 0);
    const client = await forceActive(page, selector);
    await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, 2)');
    await expect(button).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 2px 2px 0px 0px/);
    await client.detach();
  });

  test('a link card pushes into its shadow on press', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/resources');
    const selector = 'main a.card';
    const card = page.locator(selector).first();
    await expect(card).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 6px 6px 0px 0px/);

    const client = await forceActive(page, selector);
    await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, 2)');
    await expect(card).toHaveCSS('box-shadow', /rgb\(26, 26, 26\) 4px 4px 0px 0px/);
    await client.detach();
  });
});
