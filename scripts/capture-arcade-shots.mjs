/**
 * Captures cabinet thumbnails and og:images from the real games.
 *
 * Games animate, so a naive screenshot grabs an arbitrary frame — often the
 * title card, or a blank first tick before anything has been drawn. Each game
 * gets a scripted warm-up (input to start it, then sustained input to keep it
 * in a "playing" state) so the captured frame is deterministic and actually
 * shows gameplay:
 *
 * - Flappy Philacon needs the bird kept alive with periodic flaps, or it just
 *   falls and dies before the settle time is up.
 * - Keyboard Pong needs the match explicitly started (a click, not a key),
 *   then both paddles held in motion so the ball is caught mid-rally.
 * - Pigeon Post has no start screen and no goal state — it animates on its
 *   own — but still gets banked input so the frame isn't dead-level flight.
 *
 * Two crops per game: a 4:3 thumbnail for the cabinet screen, and 1200x630 for
 * og:image, which is what SEO.astro feeds to Open Graph and Twitter cards.
 *
 * Run against a built site: npm run build && npm run arcade:shots
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.ARCADE_BASE ?? 'http://localhost:4322';
const OUT = 'public/images/arcade';

const GAMES = [
  {
    slug: 'flappy-philacon',
    warmup: async (page) => {
      // First Space starts the game AND flaps once. The physics are
      // frame-based (no dt scaling) and assume ~60fps, but headless
      // Chromium's requestAnimationFrame here runs closer to ~140fps with
      // no vsync throttle, so real-time waits need to be much shorter than
      // the in-game constants would suggest — measured empirically, a
      // 260ms gap between flaps keeps the bird oscillating near mid-height
      // instead of climbing into the ceiling or free-falling into the
      // ground. Capture has to land before the first pipe's leading edge
      // reaches the bird's x position (measured ~1.1s in); staying well
      // under that bound guarantees a live frame regardless of the pipe
      // gap's randomized height.
      await page.keyboard.press('Space');
      for (let i = 0; i < 2; i++) {
        await page.waitForTimeout(260);
        await page.keyboard.press('Space');
      }
      await page.waitForTimeout(250);
    },
  },
  {
    slug: 'keyboard-pong',
    warmup: async (page) => {
      // The match only starts on a button click, not a keypress. Once
      // running, hold both paddles in motion (opposite directions so the
      // motion reads clearly) while the ball is in flight. Paddle speed
      // covers the full court in ~220ms at this browser's actual frame
      // rate, so a full-length hold just pins both paddles at opposite
      // corners — a shorter 90ms hold moves them visibly off-center
      // without stranding them at the walls.
      await page.click('#startBtn');
      await page.waitForTimeout(150);
      await page.keyboard.down('w');
      await page.keyboard.down('ArrowDown');
      await page.waitForTimeout(90);
      await page.keyboard.up('w');
      await page.keyboard.up('ArrowDown');
      await page.waitForTimeout(60);
    },
  },
  {
    slug: 'pigeon-post',
    warmup: async (page) => {
      // No start screen, no goal state — it's already flying, and the
      // default forward-flight camera already frames the pigeon well
      // against the planet's curved horizon. A sustained ArrowUp pitch
      // climbs the camera away from the horizon entirely (tried it — ends
      // up as empty sky), so this only taps a brief bank and lets it
      // settle back toward level flight before the shot.
      await page.waitForTimeout(500);
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(120);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(900);
    },
  },
];

const SETTLE_MS = 150;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const { slug, warmup } of GAMES) {
  for (const [suffix, size] of [
    ['', { width: 800, height: 600 }],
    ['-og', { width: 1200, height: 630 }],
  ]) {
    const page = await browser.newPage({ viewport: size });
    await page.goto(`${BASE}/games/${slug}/`, { waitUntil: 'networkidle' });
    await warmup(page);
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: `${OUT}/${slug}${suffix}.webp`, type: 'webp' });
    await page.close();
    console.log(`captured ${slug}${suffix}`);
  }
}

await browser.close();
