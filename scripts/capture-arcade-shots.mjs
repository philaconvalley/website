/**
 * Captures cabinet thumbnails and og:images from the real games.
 *
 * Games animate, so a naive screenshot grabs an arbitrary frame — often the
 * title card, or a blank first tick before anything has been drawn. Each game
 * gets a scripted warm-up (input to start it, then sustained input to keep it
 * in a "playing" state) so the captured frame reliably lands on live,
 * in-progress gameplay instead of a title card or a dead frame. That's a
 * guarantee about *state* (playing, not stopped/blank), not about the exact
 * composition: Flappy's pipe-gap height and Pong's ball launch angle are both
 * unseeded `Math.random()` calls inside the games themselves, so re-running
 * this script will still land on live gameplay every time, but the pipe
 * position, ball angle, and paddle positions in the resulting image will
 * differ run to run.
 *
 * - Flappy Philacon needs the bird kept alive with periodic flaps, or it just
 *   falls and dies before the settle time is up.
 * - Keyboard Pong needs the match explicitly started (a click, not a key),
 *   then both paddles actively driven — one tracking the ball's real position
 *   (read by patching the canvas drawing calls, since the game's script is an
 *   IIFE with no exposed state) so the frame lands mid-rally, not on an idle
 *   court.
 * - Pigeon Post has no start screen and no goal state — it animates on its
 *   own — but its permanent on-canvas title/instructions HUD has to be hidden
 *   for capture (there's no in-game way to dismiss it — it's never toggled by
 *   any script on the page), and its default altitude keeps the planet's
 *   curve too low in frame, so the warm-up dives briefly first.
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

// Exposes the ball's and both paddles' live canvas positions on
// `window.__pong`, by wrapping the 2D context calls keyboard-pong's own
// (IIFE-scoped, unexposed) draw loop already makes every frame: `ctx.arc()`
// for the ball, `ctx.drawImage()` for each paddle sprite. Must be installed
// before the game's script runs, so it's a page.addInitScript, not something
// the warm-up can do after navigation.
function installPongTracker(page) {
  return page.addInitScript(() => {
    window.__pong = { ball: null, paddles: {} };
    const proto = CanvasRenderingContext2D.prototype;
    const origArc = proto.arc;
    proto.arc = function (x, y, r, ...rest) {
      if (r > 5 && r < 15) window.__pong.ball = { x, y };
      return origArc.call(this, x, y, r, ...rest);
    };
    const origDrawImage = proto.drawImage;
    proto.drawImage = function (img, ...args) {
      try {
        const t = this.getTransform();
        window.__pong.paddles[t.e < 400 ? 'left' : 'right'] = { x: t.e, y: t.f };
      } catch {
        /* not a paddle draw call in a state we can read a transform from */
      }
      return origDrawImage.call(this, img, ...args);
    };
  });
}

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
    beforeGoto: installPongTracker,
    warmup: async (page) => {
      // The page is taller than either capture viewport, and the body
      // vertically centers its whole .stage (title, scoreboard, court,
      // controls-row legend, footer-note) as one flex column — so whichever
      // of those blocks falls nearest the top/bottom edge gets sliced in
      // half rather than fully shown or fully excluded. Hiding just the
      // controls-row (the original clipping offender at 1200x630) shrinks
      // the stage enough that re-centering then clips the title instead —
      // confirmed by capturing that exact regression. The stable fix is to
      // remove every text block that isn't the court itself: title,
      // controls-row, and footer-note all get hidden, at both capture
      // sizes, so centering always has only the scoreboard + court to work
      // with and nothing ever lands mid-clip.
      await page.evaluate(() => {
        for (const sel of ['.title', '.controls-row', '.footer-note']) {
          const el = document.querySelector(sel);
          if (el) el.style.display = 'none';
        }
      });

      // The match only starts on a button click, not a keypress.
      await page.click('#startBtn');

      // Sample the ball twice to find out which way it's headed, then drive
      // that side's paddle to track its y position in real time (bang-bang:
      // hold up or down based on which side of the paddle the ball is on)
      // until the ball is close enough to read as "about to be returned" —
      // or, if the timing lines up, until it actually bounces (detected as
      // the ball's x motion reversing direction). The far paddle is just
      // held moving the whole time so both paddles read as driven, not
      // idle. This reacts to the game's real, randomized ball angle instead
      // of guessing a fixed wait that only sometimes lines up.
      await page.waitForTimeout(60);
      const s1 = await page.evaluate(() => window.__pong.ball);
      await page.waitForTimeout(40);
      const s2 = await page.evaluate(() => window.__pong.ball);
      if (!s1 || !s2) return; // ball not drawn yet on an unusually slow start — bail to the flat settle
      const movingRight = s2.x > s1.x;
      const targetSide = movingRight ? 'right' : 'left';
      const otherSide = movingRight ? 'left' : 'right';
      const keysFor = (side) => (side === 'left' ? { up: 'w', down: 's' } : { up: 'ArrowUp', down: 'ArrowDown' });
      const targetKeys = keysFor(targetSide);
      const otherKeys = keysFor(otherSide);

      await page.keyboard.down(otherKeys.down);

      let pressed = null;
      let prevX = s2.x;
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(30);
        const state = await page.evaluate(() => window.__pong);
        if (!state.ball || !state.paddles[targetSide]) continue;
        const approaching = movingRight ? state.ball.x > prevX : state.ball.x < prevX;
        if (!approaching && i > 3) break; // bounced — this is the frame
        prevX = state.ball.x;

        const dy = state.ball.y - state.paddles[targetSide].y;
        const wantKey = dy > 6 ? targetKeys.down : dy < -6 ? targetKeys.up : null;
        if (wantKey !== pressed) {
          if (pressed) await page.keyboard.up(pressed);
          if (wantKey) await page.keyboard.down(wantKey);
          pressed = wantKey;
        }
        if (Math.abs(state.ball.x - state.paddles[targetSide].x) < 90) break; // close enough to read as a return
      }
      if (pressed) await page.keyboard.up(pressed);
      await page.keyboard.up(otherKeys.down);
    },
  },
  {
    slug: 'pigeon-post',
    warmup: async (page) => {
      // No start screen, no goal state — it's already flying. But the
      // title/instructions HUD ("Pigeon Post — steer with WASD/Arrows...")
      // is permanent: grep confirms no script on the page ever hides,
      // fades, or toggles it — it's not a dismissible splash screen, just
      // always-on text, so a capture of any frame includes it unless we
      // remove it ourselves.
      await page.evaluate(() => {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
      });

      // The default altitude (~9 planet-radii) keeps the horizon low in
      // frame — mostly empty sky. Diving (ArrowDown lowers altitude, tested
      // against the in-HUD ALT readout) brings the camera closer to the
      // surface, making the planet's curve a real presence without landing
      // the pigeon.
      await page.waitForTimeout(300);
      await page.keyboard.down('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.up('ArrowDown');
      await page.waitForTimeout(250);
    },
  },
];

const SETTLE_MS = 150;

// Optional slug filter (npm run arcade:shots -- keyboard-pong pigeon-post),
// so one game's warm-up can be re-tuned without re-rolling every other
// game's already-good, randomized capture.
const only = process.argv.slice(2);
const targets = only.length ? GAMES.filter((g) => only.includes(g.slug)) : GAMES;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

// Every path — success, a thrown error from any page.* call, an unexpected
// selector miss — must still close the page and close the browser, or a
// failed run leaks a Chromium process. The inner try/finally guarantees the
// page closes even if its own capture throws; the outer try/catch/finally
// guarantees the browser closes regardless, and aborts the remaining
// captures (rather than silently skipping them) while making the failure
// visible: it logs exactly which capture failed and exits non-zero, so a
// broken run can't be mistaken for a successful one.
try {
  for (const { slug, beforeGoto, warmup } of targets) {
    for (const [suffix, size] of [
      ['', { width: 800, height: 600 }],
      ['-og', { width: 1200, height: 630 }],
    ]) {
      const label = `${slug}${suffix}`;
      const page = await browser.newPage({ viewport: size });
      try {
        if (beforeGoto) await beforeGoto(page);
        await page.goto(`${BASE}/games/${slug}/`, { waitUntil: 'networkidle' });
        await warmup(page);
        await page.waitForTimeout(SETTLE_MS);
        await page.screenshot({ path: `${OUT}/${label}.webp`, type: 'webp' });
        console.log(`captured ${label}`);
      } catch (err) {
        throw new Error(`capture failed for ${label}: ${err.message}`, { cause: err });
      } finally {
        await page.close();
      }
    }
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
