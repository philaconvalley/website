import { test, expect } from '@playwright/test';

/**
 * The walkthrough is a rung-1 operable object (DESIGN.md), and its whole claim
 * is that anyone can drive it: keyboard, no pointer, no JavaScript. That claim
 * is the thing worth defending in CI — the styling is not.
 *
 * It is built on a radio group precisely so the keyboard behaviour is native.
 * If someone later "improves" it into divs with click handlers, these fail.
 */

const STEPS = ['fork', 'clone', 'branch', 'change', 'push', 'open'];

const panel = (id: string) => `#pcv-pr-panel-${id}`;

test.describe('first pull request walkthrough', () => {
  test('opens on step one with exactly one panel showing', async ({ page }) => {
    await page.goto('/join');
    await expect(page.locator(panel('fork'))).toBeVisible();

    const visible = await page.locator('.pcv-pr-panel:visible').count();
    expect(visible, 'exactly one panel should be open at a time').toBe(1);
  });

  test('arrow keys move between steps, because it is a real radio group', async ({ page }) => {
    await page.goto('/join');
    await page.locator('#pcv-pr-fork').focus();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator(panel('clone'))).toBeVisible();
    await expect(page.locator(panel('fork'))).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator(panel('branch'))).toBeVisible();
    // Focus must follow the selection, or a keyboard user loses their place.
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('pcv-pr-branch');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator(panel('clone'))).toBeVisible();
  });

  test('every step is reachable by pointer and shows its own content', async ({ page }) => {
    await page.goto('/join');
    for (const step of STEPS) {
      await page.locator(`label[for="pcv-pr-${step}"]`).click();
      await expect(page.locator(panel(step))).toBeVisible();
      expect(await page.locator('.pcv-pr-panel:visible').count()).toBe(1);
    }
  });

  test('works with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/join');

    await page.locator('label[for="pcv-pr-push"]').click();
    await expect(page.locator(panel('push'))).toBeVisible();
    await expect(page.locator(panel('fork'))).toBeHidden();

    await context.close();
  });

  test('the commands shown are the real ones for this repo', async ({ page }) => {
    await page.goto('/join');
    await page.locator('label[for="pcv-pr-branch"]').click();
    await expect(page.locator(`${panel('branch')} code`)).toHaveText(
      'git checkout -b fix/readme-typo',
    );
  });

  test('chips stop moving under reduced motion but still read as selected', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/join');

    const chip = page.locator('label[for="pcv-pr-fork"]');
    await expect(chip).toHaveCSS('transition-duration', '0s');
    // Selection is carried by colour and border, which reduced motion must not remove.
    await expect(chip).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await context.close();
  });
});
