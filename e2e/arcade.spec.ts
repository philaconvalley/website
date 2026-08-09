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
  test('embeds the game in a sandbox without allow-same-origin, and defers loading it', async ({
    page,
  }) => {
    await page.goto('/arcade/flappy-philacon');
    const frame = page.locator('iframe[data-game-frame]');
    // The game must not load before the visitor asks for it — see the next
    // test for the empirical proof. Here: no `src` yet, only `data-src`.
    await expect(frame).not.toHaveAttribute('src', /.+/);
    await expect(frame).toHaveAttribute('data-src', '/games/flappy-philacon/');
    const sandbox = await frame.getAttribute('sandbox');
    expect(sandbox).toContain('allow-scripts');
    // allow-same-origin alongside allow-scripts would let the framed document
    // remove its own sandbox. Its absence is the whole isolation guarantee.
    expect(sandbox).not.toContain('allow-same-origin');

    await page.getByRole('button', { name: /click to play/i }).click();
    await expect(frame).toHaveAttribute('src', '/games/flappy-philacon/');
  });

  test('does not start the game until the visitor asks', async ({ page }) => {
    await page.goto('/arcade/flappy-philacon');
    await expect(page.getByRole('button', { name: /click to play/i })).toBeVisible();
  });

  test('nothing in the frame moves before the visitor clicks', async ({ page }) => {
    // The overlay's copy ("Nothing moves until you do") is a promise about
    // the running game, not just about a static screenshot never having
    // loaded at all. Prove it the way it can be disproved: two screenshots
    // of the frame area a beat apart, with no click, must be byte-identical.
    await page.goto('/arcade/flappy-philacon');
    const stage = page.locator('iframe[data-game-frame]').locator('..');
    const first = await stage.screenshot();
    await page.waitForTimeout(1200);
    const second = await stage.screenshot();
    expect(second.equals(first)).toBe(true);
  });

  test('tells keyboard users how to get out, and Tab actually gets them out', async ({ page }) => {
    await page.goto('/arcade/keyboard-pong');
    // A ref-based locator, not a name-based one: the button's accessible name
    // changes from "Click to play" to "Click to resume" once the game has
    // been started (see the next test), so a locator keyed to "click to
    // play" would stop matching the moment this test's own click succeeds.
    const startButton = page.locator('[x-ref="startBtn"]');
    await expect(startButton).toHaveAccessibleName(/click to play/i);
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

  test('the return overlay says "resume", not "nothing moves" — the game is running behind it', async ({
    page,
  }) => {
    // The game is deliberately left running (not unloaded) when focus is
    // lost, so it must not be re-covered by the first-arrival "Nothing moves
    // until you do" copy — that would be a false claim the second time
    // around. This drives the same return path as the Tab test above and
    // asserts the copy, which that test does not.
    await page.goto('/arcade/keyboard-pong');
    const startButton = page.locator('[x-ref="startBtn"]');
    await expect(startButton).toHaveAccessibleName(/click to play/i);
    await startButton.click();
    await expect(page.getByText(/nothing moves until you do/i)).toBeHidden();

    for (let i = 0; i < 8 && !(await startButton.isVisible()); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(startButton).toBeVisible();

    await expect(startButton.getByText(/click to resume/i)).toBeVisible();
    await expect(startButton.getByText(/click to play/i)).toBeHidden();
    await expect(page.getByText(/nothing moves until you do/i)).toBeHidden();
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
    // cannot know the viewport. Its `src` is never set unless the (hidden,
    // unreachable) "Click to play" button is clicked, so the phone visitor
    // pays nothing for a game they cannot play.
    const frame = page.locator('iframe[data-game-frame]');
    await expect(frame).toBeHidden();
    await expect(frame).not.toHaveAttribute('src', /.+/);
  });
});
