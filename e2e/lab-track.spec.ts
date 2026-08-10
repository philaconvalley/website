import { test, expect } from '@playwright/test';

/**
 * The Lab timeline is absolutely positioned and deliberately stays
 * horizontal at every width — stacked, the left-to-right travel that IS the
 * argument becomes a bulleted list of times. The cost of that choice is that
 * nothing in the layout stops two boxes from occupying the same pixels: the
 * opaque outcome chip is later in DOM order than the captions, so when it
 * overlaps one it silently paints over the text rather than pushing it aside.
 *
 * That shipped once — at every width up to ~430px the chip covered "6:30pm ·
 * you arrive alone", so an iPhone-sized visitor read "6:30PM · YOU ARRI". These
 * widths are the real device sizes it broke on, plus the boundary just past it.
 *
 * Locators are by text, not by position class, so the test states the contract
 * ("these two captions stay readable") rather than the current pixel values.
 *
 * Runs under reduced motion, which the stylesheet honours by freezing every
 * pcv-loop-* transform. That is not a shortcut around a flaky assertion: it is
 * the resting geometry, the state the layout is actually designed at, and the
 * only one a boundingBox mid-keyframe would not read differently on every run.
 * The transient overlap while pcvChip rises in from translateY(12px) is handled
 * structurally instead, by the captions' z-10.
 */

const PHONE_WIDTHS = [320, 360, 375, 390, 414, 430];

const CAPTIONS = ['6:30pm · you arrive alone', '7:00pm · two others pull up a chair'];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlap(a: Box, b: Box) {
  return {
    x: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)),
    y: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)),
  };
}

test.describe('Lab timeline', () => {
  for (const width of PHONE_WIDTHS) {
    test(`outcome chip never covers a caption at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      const chip = page.locator('.pcv-loop-chip');
      await expect(chip).toHaveCount(1);
      const chipBox = await chip.boundingBox();
      expect(chipBox).not.toBeNull();

      for (const caption of CAPTIONS) {
        // Scoped to the decorative track: the sr-only summary narrates the same
        // times in prose, and matching that instead would assert nothing.
        const locator = page.locator('[aria-hidden="true"]').getByText(caption, { exact: true });
        await expect(locator, `caption "${caption}" is missing`).toHaveCount(1);

        const box = await locator.boundingBox();
        expect(box, `caption "${caption}" has no box`).not.toBeNull();

        const { x, y } = overlap(chipBox!, box!);
        expect(
          x > 0 && y > 0,
          `the outcome chip overlaps "${caption}" by ${x}x${y}px at ${width}px and paints over it`,
        ).toBe(false);
      }
    });
  }
});
