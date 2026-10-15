import { test, expect, type Page } from '@playwright/test';

/**
 * The footer logo shipped as a 3296x4374, 453 KB file drawn at 132px wide. It
 * loads on every page, and it was 94% of the homepage's weight. The /join
 * Discord card had the same bug: a 600px, 82 KB mascot drawn at 56px.
 *
 * This guard compares each image's file width with the widest size the page
 * draws it at, on a phone and on a desktop. Responsive images, like the arcade
 * cards, draw small on desktop and near full width on a phone, so only the
 * widest size counts. Three times that width covers a 3x phone screen. Wider
 * files download pixels no screen can show. Files under 20 KB are too small to
 * matter. Fix a failure with a smaller copy of the file, not by deleting the
 * original.
 */

const PAGES = ['/', '/about', '/join', '/support', '/projects', '/resources', '/arcade'];
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
];
const MAX_RATIO = 3;
const MIN_BYTES = 20_000;

type Measured = { src: string; naturalWidth: number; drawnWidth: number };

async function measureImages(page: Page): Promise<Measured[]> {
  // The footer logo is lazy. Scroll it, and every other lazy image, into view.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');

  return page.$$eval('img', (imgs) =>
    imgs
      .filter((img) => img.complete && img.clientWidth > 0)
      .map((img) => ({
        src: img.currentSrc,
        naturalWidth: img.naturalWidth,
        drawnWidth: img.clientWidth,
      })),
  );
}

for (const path of PAGES) {
  test(`${path} serves no image far wider than it is drawn`, async ({ page, request }) => {
    const widest = new Map<string, Measured>();
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      for (const img of await measureImages(page)) {
        const seen = widest.get(img.src);
        if (!seen || img.drawnWidth > seen.drawnWidth) widest.set(img.src, img);
      }
    }

    const oversized: string[] = [];
    for (const img of widest.values()) {
      if (img.naturalWidth <= img.drawnWidth * MAX_RATIO) continue;
      // Ask the server for the size. The browser's own timing data reads 0 for
      // an image it reused from memory on the second viewport.
      const bytes = (await (await request.get(img.src)).body()).byteLength;
      if (bytes < MIN_BYTES) continue;
      oversized.push(
        `${img.src}: ${img.naturalWidth}px file (${Math.round(bytes / 1000)} KB), drawn at ${img.drawnWidth}px at most`,
      );
    }

    expect(oversized).toEqual([]);
  });
}
