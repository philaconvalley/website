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

test.describe('cabinet page', () => {
  test('embeds the game in a sandbox without allow-same-origin', async ({ page }) => {
    await page.goto('/arcade/flappy-philacon');
    const frame = page.locator('iframe[data-game-frame]');
    await expect(frame).toHaveAttribute('src', '/games/flappy-philacon/');
    const sandbox = await frame.getAttribute('sandbox');
    expect(sandbox).toContain('allow-scripts');
    // allow-same-origin alongside allow-scripts would let the framed document
    // remove its own sandbox. Its absence is the whole isolation guarantee.
    expect(sandbox).not.toContain('allow-same-origin');
  });

  test('does not start the game until the visitor asks', async ({ page }) => {
    await page.goto('/arcade/flappy-philacon');
    await expect(page.getByRole('button', { name: /click to play/i })).toBeVisible();
  });

  test('tells keyboard users how to get out, and Tab actually gets them out', async ({ page }) => {
    await page.goto('/arcade/keyboard-pong');
    const startButton = page.getByRole('button', { name: /click to play/i });
    await startButton.click();

    // The copy promises Tab (and a click outside) as the way back — not Esc.
    // Esc is swallowed the instant the iframe takes focus (keydown fired
    // inside a focused frame never reaches this page — verified by hand
    // with a raw capture-phase window listener that never fired), so a
    // test that only checks a "Press Esc" string would pass even if the
    // exit mechanism were deleted. This test drives the mechanism the page
    // actually documents and asserts the visible result: the overlay comes
    // back and the game's own "leave" hint disappears.
    const leaveHint = page.getByText(/press tab or click outside/i);
    await expect(leaveHint).toBeVisible();

    // Tabbing out of the iframe takes a variable number of presses (it
    // first cycles through whatever's focusable inside the framed game),
    // so press until the overlay reappears rather than assuming a fixed
    // count.
    for (let i = 0; i < 8 && !(await startButton.isVisible()); i++) {
      await page.keyboard.press('Tab');
    }

    await expect(startButton).toBeVisible();
    await expect(leaveHint).toBeHidden();
  });

  test('describes the game in text for people who cannot play it', async ({ page }) => {
    await page.goto('/arcade/pigeon-post');
    await expect(page.getByRole('heading', { name: /about this/i })).toBeVisible();
    await expect(page.getByText(/no score, no objective/i)).toBeVisible();
  });

  test('a keyboard-only game offers an alternative on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/arcade/keyboard-pong');
    await expect(page.getByText(/needs a keyboard/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /flappy/i })).toBeVisible();
    // The frame is hidden by CSS rather than absent — Astro builds statically and
    // cannot know the viewport. `display: none` also stops a lazy iframe from
    // loading, so the phone visitor pays nothing for a game they cannot play.
    await expect(page.locator('iframe[data-game-frame]')).toBeHidden();
  });
});
