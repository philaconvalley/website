import { test, expect } from '@playwright/test';

/**
 * The stagger is humanised (spec §5.2): evenly-spaced entrances read as a
 * machine, so each element's delay carries a small fixed offset. This asserts
 * the property that makes it human — the gaps between consecutive delays are
 * not all identical — and asserts it is deterministic, because a random
 * version would flicker between renders and could not be tested at all.
 */
test.describe('humanised stagger', () => {
  test('arriving elements in a group get unequal, deterministic delays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // Scoped to the cards, not to every arriving element: the section's <h2>
    // also arrives and is index 0 of the same group, so an unscoped locator
    // matches four elements, not three.
    const cards = page.locator('#what .pcv-card[data-pcv-delay]');
    await expect(cards).toHaveCount(3);

    const delays = await cards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.pcvDelay)),
    );

    // Strictly increasing — later elements never arrive before earlier ones.
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(new Set(delays).size).toBe(delays.length);

    // And the gaps are not uniform, which is the entire point.
    const gaps = delays.slice(1).map((d, i) => Number((d - delays[i]).toFixed(3)));
    expect(new Set(gaps).size).toBeGreaterThan(1);
  });

  test('delays are identical across reloads', async ({ page }) => {
    await page.goto('/');
    const read = () =>
      page
        .locator('#what [data-pcv-arrive][data-pcv-delay]')
        .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.pcvDelay));

    const first = await read();
    await page.reload();
    const second = await read();

    expect(second).toEqual(first);
  });

  test('stagger restarts per section rather than running across the page', async ({ page }) => {
    await page.goto('/');
    const firstOf = (sel: string) =>
      page
        .locator(`${sel} [data-pcv-arrive][data-pcv-delay]`)
        .first()
        .getAttribute('data-pcv-delay');

    expect(await firstOf('#what')).toBe(await firstOf('#build'));
  });
});

test.describe('section roles', () => {
  test('the homepage bands declare their story position', async ({ page }) => {
    await page.goto('/');
    const roles = await page
      .locator('[data-pcv-section]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-pcv-section')));

    expect(roles).toEqual(['door', 'air', 'room', 'work', 'invitation']);
  });

  test('the story position never leaks into ARIA', async ({ page }) => {
    await page.goto('/');
    // "air" and "door" are not valid ARIA roles. If `role` is ever forwarded to
    // the DOM this becomes a genuine accessibility defect, so assert it is not.
    await expect(page.locator('section[role="air"], section[role="door"]')).toHaveCount(0);
  });

  test('exactly one section holds, per spec §5.1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-pcv-hold]')).toHaveCount(1);
  });
});
