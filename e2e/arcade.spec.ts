import { test, expect } from '@playwright/test';

test.describe('arcade wall', () => {
  test('shows one cabinet per game plus the submission cabinet', async ({ page }) => {
    await page.goto('/arcade');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Arcade');
    // 3 games + the "your game here" cabinet.
    await expect(page.locator('[data-cabinet]')).toHaveCount(4);
  });

  test('each game cabinet links to its cabinet page and credits its builder', async ({ page }) => {
    await page.goto('/arcade');
    const flappy = page.locator('[data-cabinet="flappy-philacon"]');
    await expect(flappy).toContainText('Diego Mendoza');
    // The whole cabinet — marquee, artwork and controls — is one link, so the
    // cabinet element itself is the anchor: exactly one role=link per game,
    // not a second one nested inside it.
    await expect(flappy).toHaveRole('link');
    await expect(flappy).toHaveAttribute('href', '/arcade/flappy-philacon');
    await expect(flappy.getByRole('link')).toHaveCount(0);
  });

  test('a keyboard-only game is labelled as desktop-only on the wall', async ({ page }) => {
    await page.goto('/arcade');
    await expect(page.locator('[data-cabinet="keyboard-pong"]')).toContainText('Desktop only');
  });

  test('the arcade is reachable from the header nav', async ({ page }) => {
    await page.goto('/');
    // Header renders navItems twice — desktop nav and the Alpine mobile menu —
    // so this must not be a strict single-element locator.
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Arcade' }).first(),
    ).toBeVisible();
  });
});
