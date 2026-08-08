# PhilaCon Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/arcade` — a wall of arcade cabinets showcasing community-built browser games, with three first-party games from Diego Mendoza as launch content.

**Architecture:** Games are self-contained HTML files served from `public/games/<slug>/`, embedded into Astro-rendered cabinet pages via sandboxed iframes. A scoped `vercel.json` header carve-out lets those files be framed and run their inline scripts, while every real page keeps today's strict headers.

**Tech Stack:** Astro 5 content collections, Tailwind, Alpine.js (existing), Playwright (e2e + screenshot capture), Vercel headers.

**Spec:** `docs/superpowers/specs/2026-08-08-philacon-arcade-design.md`

## Global Constraints

- Branch is `waskar/philacon-arcade`. Never commit to `main`.
- **Games must be single self-contained HTML files.** No external script files, no CDN dependencies, no network calls. See Task 1 for why this is a hard requirement and not a style preference.
- All arcade CSS uses existing design tokens (`brand-dark`, `brand-pink`, `brand-purple`, `brand-yellow`, `brand-coral`, `primary-*`, `accent-*`). Never hardcode hex.
- No new webfonts. Baloo 2 (`font-display`) and Nunito (`font-sans`) only.
- No new npm dependencies.
- Every motion effect must be disabled under `prefers-reduced-motion: reduce`.
- Commit after every task. Do not push.
- `npm run build` runs `astro check` — TypeScript must pass.

---

## File Structure

| File                                              | Responsibility                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `vercel.json`                                     | Two mutually exclusive header rules: strict for pages, scoped carve-out for `/games/`. |
| `public/games/_probe/index.html`                  | Permanent canary fixture proving the carve-out still works.                            |
| `public/games/<slug>/index.html`                  | Self-contained game builds (3).                                                        |
| `e2e/landmarks.spec.ts`                           | Add `/games/` exclusion.                                                               |
| `scripts/check-csp-hashes.mjs`                    | Add `/games/` exclusion.                                                               |
| `e2e/csp.spec.ts`                                 | Add carve-out + `noindex` assertions.                                                  |
| `src/content.config.ts`                           | Add `arcade` collection schema.                                                        |
| `src/content/arcade/*.md`                         | One entry per game (3).                                                                |
| `scripts/capture-arcade-shots.mjs`                | Deterministic thumbnail + og:image capture.                                            |
| `src/components/ArcadeCabinet.astro`              | One cabinet on the wall. Presentational only.                                          |
| `src/components/CabinetFrame.astro`               | The player: iframe, sandbox, focus overlay, scale wrapper, phone fallback.             |
| `src/pages/arcade/index.astro`                    | The wall.                                                                              |
| `src/pages/arcade/[slug].astro`                   | The cabinet page.                                                                      |
| `src/components/Header.astro`                     | Add nav item.                                                                          |
| `.lighthouserc.json`                              | Add `/arcade/` and one cabinet page.                                                   |
| `e2e/arcade.spec.ts`                              | Arcade behavior tests.                                                                 |
| `docs/design-system.md`, `docs/adding-content.md` | Documentation.                                                                         |

---

## Task 1: Prove a game can run in a frame

This is a spike with a permanent artifact. **Nothing else in this plan is safe to build until this task passes.** Three headers in `vercel.json` currently make the feature impossible, and a fourth problem (CSP `'self'` in an opaque origin) only shows up empirically.

**Why the probe has both an inline and an external script:** `sandbox` without `allow-same-origin` puts the game in an opaque origin, and `'self'` in a fetch directive is expected to match nothing there — meaning a game could not load its own sibling `.js` file. The probe determines this empirically. If the external script is blocked, **that is the finding that makes "single self-contained HTML file" a hard requirement**, and Task 2 inlines three.js into Pigeon Post rather than shipping it as a sibling file.

**Files:**

- Create: `public/games/_probe/index.html`
- Create: `public/games/_probe/probe-external.js`
- Modify: `vercel.json`
- Modify: `e2e/landmarks.spec.ts:17-25`
- Modify: `scripts/check-csp-hashes.mjs:24-31`
- Modify: `e2e/csp.spec.ts`
- Create: `e2e/fixtures/frame-host.html`

**Interfaces:**

- Produces: a proven `/games/(.*)` CSP policy string in `vercel.json`, and the answer to whether games may use external script files. Task 2 depends on both.

- [ ] **Step 1: Create the probe fixture**

`public/games/_probe/index.html` — deliberately exercises every capability a real game needs:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Arcade CSP probe</title>
    <!--
      Not a game. This is a permanent canary: it fails loudly if the /games/
      header carve-out in vercel.json ever regresses, which would otherwise
      only show up as three silently blank cabinets in production.
      Guarded by e2e/csp.spec.ts. See docs/superpowers/specs/2026-08-08-philacon-arcade-design.md.
    -->
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap"
    />
    <style>
      body {
        font-family: 'Baloo 2', sans-serif;
        background: #1a1a1a;
        color: #ffeed0;
      }
    </style>
  </head>
  <body>
    <canvas id="c" width="120" height="60"></canvas>
    <p id="status">probe running</p>
    <script>
      // Inline script: every launch game is inline-script driven.
      const ctx = document.getElementById('c').getContext('2d');
      ctx.fillStyle = '#FF66A8';
      ctx.fillRect(0, 0, 120, 60);
      window.__probeInline = true;
      document.getElementById('status').textContent = 'inline ok';
    </script>
    <script src="./probe-external.js"></script>
  </body>
</html>
```

`public/games/_probe/probe-external.js`:

```js
// Sibling script file. If CSP blocks this in the sandboxed opaque origin,
// games must be single self-contained HTML files — see Task 1 of the plan.
window.__probeExternal = true;
```

- [ ] **Step 2: Create the frame host fixture**

`public/games/_probe/host.html` — a page that frames the probe the way a cabinet page will. It lives in `public/` (not `e2e/`) because the CSP suite runs against the built `dist/`, and only `public/` is copied there.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Arcade frame host</title>
  </head>
  <body>
    <iframe
      id="probe"
      src="/games/_probe/"
      sandbox="allow-scripts"
      title="Arcade CSP probe"
      width="400"
      height="300"
    ></iframe>
  </body>
</html>
```

Delete `e2e/fixtures/` if it was created — it is not used.

- [ ] **Step 3: Write the failing CSP test**

Append to `e2e/csp.spec.ts`:

```ts
/**
 * The arcade embeds self-hosted games in sandboxed iframes. That requires a
 * scoped exception to the site-wide headers: pages are X-Frame-Options: DENY
 * and frame-ancestors 'none', which forbid framing even same-origin, and
 * script-src has no 'unsafe-inline', which would stop every game from running.
 *
 * These tests guard the exception's blast radius as much as its function: the
 * looser policy must apply to /games/ and nowhere else.
 */
test.describe('arcade /games/ header carve-out', () => {
  test('a game document is framable and its inline script runs', async ({ page }) => {
    await page.goto('/games/_probe/host.html');
    const frame = page.frameLocator('#probe');
    await expect(frame.locator('#status')).toHaveText('inline ok');
  });

  test('game responses are noindex', async ({ page }) => {
    const response = await page.goto('/games/_probe/');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
  });

  test('real pages keep the strict policy', async ({ page }) => {
    const response = await page.goto('/about');
    const headers = response?.headers() ?? {};
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    // The carve-out must not leak: pages never get 'unsafe-inline' scripts.
    expect(headers['content-security-policy']).not.toContain("script-src 'unsafe-inline'");
  });
});
```

Playwright lowercases response header names, which is why the assertions read `x-frame-options` rather than `X-Frame-Options`.

- [ ] **Step 4: Run the test to verify it fails**

```bash
npm run test:csp
```

Expected: the framing test FAILS — the probe frame does not load, because `X-Frame-Options: DENY` applies to `/games/_probe/`.

- [ ] **Step 5: Add the header carve-out**

In `vercel.json`, change the existing rule's `source` from `"/(.*)"` to `"/((?!games/).*)"`, then add a second rule **after** it:

```json
{
  "source": "/games/(.*)",
  "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src data: blob:; connect-src 'none'; frame-ancestors 'self'"
    }
  ]
}
```

Note what is deliberately absent: no `X-Frame-Options` (its `DENY` is the thing being lifted), and no `'unsafe-eval'` — add it only if Step 6 shows a game needs it.

The two `source` patterns are **mutually exclusive on purpose**. `serve-with-headers.mjs` resolves overlapping rules last-rule-wins, but Vercel's precedence for overlapping rules is not something to bet production security headers on. Non-overlapping patterns cannot disagree.

- [ ] **Step 6: Run the test and record the external-script finding**

```bash
npm run test:csp
```

Expected: the framing and `noindex` tests PASS.

Now determine the external-script answer explicitly:

```bash
npx playwright test --config playwright.csp.config.ts -g "framable" --debug
```

In the frame, evaluate `window.__probeExternal`. Record the result in the commit message:

- `true` → sibling script files work; the single-file rule is a convention, not a constraint.
- `undefined` → **blocked.** Games must be single self-contained HTML files. Task 2 inlines three.js into Pigeon Post.

If `frame-ancestors 'self'` fails locally (the test serves from `localhost:4322`, production is `philaconvalley.com`), do **not** replace it with an explicit host — that would pass in one environment and fail in the other. `'self'` is correct precisely because it resolves per-environment.

- [ ] **Step 7: Exclude `/games/` from landmark discovery**

`e2e/landmarks.spec.ts`, in `builtRoutes()`, add the filter after the `.html` filter:

```ts
    .filter((f) => f.endsWith('.html'))
    // Games under /games/ are embedded artifacts, not pages of the site: they
    // are bare canvas documents with no Header, <main> or Footer by design, and
    // they are noindex. Including them would fail this suite the moment the
    // arcade lands. See docs/superpowers/specs/2026-08-08-philacon-arcade-design.md.
    .filter((f) => !f.startsWith('games/') && !f.includes('/games/'))
```

- [ ] **Step 8: Exclude `/games/` from the CSP hash check**

`scripts/check-csp-hashes.mjs`, in `htmlFiles()`:

```js
async function htmlFiles(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    // Games are served under their own CSP (see the /games/ rule in vercel.json),
    // which allows 'unsafe-inline' precisely because a game is inline-script
    // driven. Hashing them against the *page* policy would fail every build.
    if (entry.isDirectory()) {
      if (entry.name === 'games' && dir === DIST) continue;
      await htmlFiles(path, acc);
    } else if (entry.name.endsWith('.html')) acc.push(path);
  }
  return acc;
}
```

- [ ] **Step 9: Run the full suite**

```bash
npm run build && npm run csp:hash && npm run test:e2e && npm run test:csp
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add vercel.json public/games/_probe e2e/csp.spec.ts e2e/landmarks.spec.ts scripts/check-csp-hashes.mjs
git commit -m "feat(arcade): Scope a header carve-out for embeddable game documents"
```

Record the Step 6 external-script finding in the commit body.

---

## Task 2: Vendor the three games

**Files:**

- Create: `public/games/flappy-philacon/index.html`
- Create: `public/games/keyboard-pong/index.html`
- Create: `public/games/pigeon-post/index.html`

**Interfaces:**

- Consumes: the proven `/games/` policy from Task 1.
- Produces: three URLs — `/games/flappy-philacon/`, `/games/keyboard-pong/`, `/games/pigeon-post/` — consumed by Task 3's content entries.

- [ ] **Step 1: Copy the three source files**

```bash
mkdir -p public/games/flappy-philacon public/games/keyboard-pong public/games/pigeon-post
cp ~/Downloads/flappy_philacon.html public/games/flappy-philacon/index.html
cp ~/Downloads/philacon_keyboard_pong.html public/games/keyboard-pong/index.html
cp ~/Downloads/pigeon_flight_demo.html public/games/pigeon-post/index.html
```

- [ ] **Step 2: Guard Flappy's localStorage**

Flappy stores a high score. In the sandbox's opaque origin, touching `localStorage` throws a `SecurityError` and kills the script. Find each `localStorage` access in `public/games/flappy-philacon/index.html` and wrap it:

```js
// The arcade embeds this in a sandbox without allow-same-origin, which puts the
// document in an opaque origin where localStorage throws rather than returning
// null. High score degrades to session-only rather than breaking the game.
function readHighScore() {
  try {
    return Number(localStorage.getItem('flappyHighScore')) || 0;
  } catch {
    return 0;
  }
}
function writeHighScore(value) {
  try {
    localStorage.setItem('flappyHighScore', String(value));
  } catch {
    /* opaque origin — score is session-only */
  }
}
```

Replace the direct `localStorage.getItem` / `setItem` calls with these two functions.

- [ ] **Step 3: Inline three.js into Pigeon Post**

Pigeon Post loads three.js r128 from cdnjs. That reintroduces exactly what commit `8b59b5e` removed, and `connect-src 'none'` blocks it regardless.

```bash
curl -sL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o /tmp/three.r128.min.js
```

In `public/games/pigeon-post/index.html`, replace:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

with an inline `<script>` containing the file's contents, preceded by:

```html
<!--
  three.js r128, inlined rather than loaded from cdnjs. Two reasons: commit
  8b59b5e removed CDN script loading from this project on purpose, and the
  /games/ CSP sets connect-src 'none' with no external script hosts, so a
  remote <script src> would simply not load. Upgrading off r128 would require
  changing this game's code and is out of scope.
  Source: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
-->
```

If Task 1 Step 6 found sibling script files **do** load, a `vendor/three.min.js` file is acceptable instead — but inlining keeps the single-file contributor rule uniform, so prefer inlining either way.

- [ ] **Step 4: Verify each game runs standalone**

```bash
npm run build && node scripts/serve-with-headers.mjs 4322
```

Visit each of `/games/flappy-philacon/`, `/games/keyboard-pong/`, `/games/pigeon-post/` and confirm each renders and responds to input, with a clean console. If any CSP violation appears, fix the **game** rather than loosening the policy — except `'unsafe-eval'`, which may be added to the `/games/` rule if a game genuinely needs it.

- [ ] **Step 5: Run the full suite**

```bash
npm run build && npm run csp:hash && npm run test:e2e && npm run test:csp
```

Expected: all PASS. If `landmarks.spec.ts` fails here, Task 1 Step 7's exclusion is wrong — fix it before continuing.

- [ ] **Step 6: Commit**

```bash
git add public/games
git commit -m "feat(arcade): Vendor the three launch games as self-contained documents"
```

---

## Task 3: Content collection

**Files:**

- Modify: `src/content.config.ts`
- Create: `src/content/arcade/flappy-philacon.md`
- Create: `src/content/arcade/keyboard-pong.md`
- Create: `src/content/arcade/pigeon-post.md`

**Interfaces:**

- Produces: the `arcade` collection. Tasks 5 and 6 read it with `getCollection('arcade')`. Field names below are exact and are used verbatim in later tasks.

- [ ] **Step 1: Add the schema**

In `src/content.config.ts`, after the `gallery` collection:

```ts
const arcade = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/arcade' }),
  schema: z.object({
    title: z.string(),
    contributors: z.array(z.string()),
    description: z.string(),
    // Required, and required to be real prose: canvas games are opaque to
    // screen readers and no amount of page markup fixes that. This is the
    // description of the game for someone who cannot see or play it.
    longDescription: z.string(),
    slug: z.string(),
    thumbnail: z.string(),
    // Authored, never generated. The capture script can produce the image; it
    // cannot describe it. Mirrors the required `alt` on the gallery collection.
    thumbnailAlt: z.string(),
    ogImage: z.string(),
    marqueeColor: z.enum(['pink', 'purple', 'yellow', 'coral']),
    kind: z.enum(['game', 'demo']),
    input: z.array(z.enum(['keyboard', 'pointer', 'touch'])).nonempty(),
    fixedSize: z.object({ w: z.number(), h: z.number() }).optional(),
    controls: z.array(z.object({ keys: z.array(z.string()), label: z.string() })),
    date: z.date(),
  }),
});
```

Add `arcade` to the `collections` export:

```ts
export const collections = {
  projects,
  resources,
  blog,
  gallery,
  arcade,
};
```

- [ ] **Step 2: Create the three entries**

`src/content/arcade/flappy-philacon.md`:

```markdown
---
title: 'Flappy Philacon'
contributors: ['Diego Mendoza']
description: 'Tap to flap through the pipes. One button, one life, one high score.'
longDescription: >-
  A side-scrolling one-button game. You control a bird that falls constantly;
  tapping the screen or pressing a key gives it a short upward flap. Pipes
  scroll in from the right with gaps at varying heights, and the game ends the
  moment you touch a pipe, the ground, or the ceiling. Your score is the number
  of pipes cleared, and your best score for the session is shown alongside it.
slug: 'flappy-philacon'
thumbnail: '/images/arcade/flappy-philacon.webp'
thumbnailAlt: 'A pink bird mid-flap between two purple pipes on a pale pink sky.'
ogImage: '/images/arcade/flappy-philacon-og.webp'
marqueeColor: 'pink'
kind: 'game'
input: ['pointer', 'keyboard', 'touch']
controls:
  - keys: ['Space']
    label: 'Flap'
  - keys: ['Tap']
    label: 'Flap'
date: 2026-08-01
---

Diego's take on the one-button classic, in PhilaCon colors.
```

`src/content/arcade/keyboard-pong.md`:

```markdown
---
title: 'PhilaCon Keyboard Pong'
contributors: ['Diego Mendoza']
description: 'Two-player Pong on one keyboard. Bring a friend and an elbow.'
longDescription: >-
  A two-player version of Pong played on a single keyboard. Each player controls
  a paddle on one side of the screen, moving it up and down to return a ball
  that speeds up as the rally continues. A point is scored when the ball passes
  a paddle. There is no computer opponent — this game requires two people at the
  same keyboard, and it cannot be played with a touchscreen alone.
slug: 'keyboard-pong'
thumbnail: '/images/arcade/keyboard-pong.webp'
thumbnailAlt: 'A pink paddle and a teal paddle facing each other across a dark purple court with a white ball between them.'
ogImage: '/images/arcade/keyboard-pong-og.webp'
marqueeColor: 'purple'
kind: 'game'
input: ['keyboard']
fixedSize: { w: 860, h: 500 }
controls:
  - keys: ['W', 'S']
    label: 'Left paddle'
  - keys: ['↑', '↓']
    label: 'Right paddle'
date: 2026-08-01
---

Two players, one keyboard. The oldest argument in video games.
```

`src/content/arcade/pigeon-post.md`:

```markdown
---
title: 'Pigeon Post'
contributors: ['Diego Mendoza']
description: 'A flight demo. Steer a pigeon around a tiny planet — no score, no goal, just flying.'
longDescription: >-
  A 3D flight demo rather than a game. You steer a pigeon in continuous flight
  around a small spherical planet rendered in soft daylight colours, banking
  left and right and pitching up and down. There is no score, no objective and
  no way to lose — it exists to be moved through. Expect roughly a minute of
  interest unless you enjoy flying in circles, which is a legitimate position.
slug: 'pigeon-post'
thumbnail: '/images/arcade/pigeon-post.webp'
thumbnailAlt: 'A small dark pigeon gliding above the curved yellow horizon of a tiny planet under a pale blue sky.'
ogImage: '/images/arcade/pigeon-post-og.webp'
marqueeColor: 'yellow'
kind: 'demo'
input: ['keyboard', 'touch']
controls:
  - keys: ['←', '→']
    label: 'Bank'
  - keys: ['↑', '↓']
    label: 'Pitch'
date: 2026-08-01
---

Not a game — a place. Diego built it to try three.js on a tiny planet.
```

- [ ] **Step 3: Verify the schema compiles**

```bash
npm run build
```

Expected: PASS. `astro check` validates all three entries against the schema. A field mismatch fails here.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/arcade
git commit -m "feat(arcade): Add the arcade content collection and three entries"
```

---

## Task 4: Screenshot capture script

**Files:**

- Create: `scripts/capture-arcade-shots.mjs`
- Modify: `package.json` (scripts)
- Creates output: `public/images/arcade/*.webp`

**Interfaces:**

- Consumes: `/games/<slug>/` URLs from Task 2, `thumbnail` and `ogImage` paths from Task 3.
- Produces: `npm run arcade:shots`, and the six image files those paths point at.

- [ ] **Step 1: Write the capture script**

`scripts/capture-arcade-shots.mjs`:

```js
/**
 * Captures cabinet thumbnails and og:images from the real games.
 *
 * Games animate, so a naive screenshot grabs an arbitrary frame — often the
 * title card, or a blank first tick before anything has been drawn. Each game
 * gets a scripted warm-up (input to start it, then a fixed settle time) so the
 * captured frame is deterministic and actually shows gameplay.
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
      await page.keyboard.press('Space');
    },
  },
  {
    slug: 'keyboard-pong',
    warmup: async (page) => {
      await page.keyboard.down('w');
    },
  },
  {
    slug: 'pigeon-post',
    warmup: async (page) => {
      await page.keyboard.down('ArrowUp');
    },
  },
];

const SETTLE_MS = 1500;

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
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, after `icons:generate`:

```json
    "arcade:shots": "node scripts/capture-arcade-shots.mjs"
```

- [ ] **Step 3: Run it**

In one terminal:

```bash
npm run build && node scripts/serve-with-headers.mjs 4322
```

In another:

```bash
npm run arcade:shots
```

Expected: six files in `public/images/arcade/`.

- [ ] **Step 4: Inspect every image by eye**

Open all six. Each must show recognisable gameplay — not a title card, not a blank frame, not a game-over screen. If one is wrong, adjust that game's `warmup` or `SETTLE_MS` and re-run. **Do not proceed with a bad thumbnail**; it is the entire visual content of a cabinet.

Then re-read each `thumbnailAlt` in Task 3's entries against the actual captured image and correct any that no longer describe it.

- [ ] **Step 5: Commit**

```bash
git add scripts/capture-arcade-shots.mjs package.json public/images/arcade
git commit -m "feat(arcade): Add deterministic screenshot capture for cabinets"
```

---

## Task 5: The cabinet wall

**Files:**

- Create: `src/components/ArcadeCabinet.astro`
- Create: `src/pages/arcade/index.astro`
- Modify: `src/components/Header.astro:10-20`

**Interfaces:**

- Consumes: `arcade` collection (Task 3), thumbnails (Task 4).
- Produces: `ArcadeCabinet` with props `{ title, href, thumbnail, thumbnailAlt, contributors, marqueeColor, kind, input, index, empty }`. Task 6 does not use it; nothing else consumes it.

- [ ] **Step 1: Write the failing test**

Create `e2e/arcade.spec.ts`:

```ts
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
    await expect(flappy.getByRole('link')).toHaveAttribute('href', '/arcade/flappy-philacon');
  });

  test('a keyboard-only game is labelled as desktop-only on the wall', async ({ page }) => {
    await page.goto('/arcade');
    await expect(page.locator('[data-cabinet="keyboard-pong"]')).toContainText('Desktop only');
  });

  test('the arcade is reachable from the header nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Arcade' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/arcade.spec.ts
```

Expected: FAIL — `/arcade` does not exist.

- [ ] **Step 3: Write the cabinet component**

`src/components/ArcadeCabinet.astro`:

```astro
---
/**
 * One arcade cabinet on the wall. Presentational — it renders a link, never a
 * game. The wall shows static thumbnails so that visiting /arcade costs three
 * images rather than three running games.
 *
 * The cabinet silhouette is the arcade signal, which is why this ships no
 * pixel font: the shape does the work the typeface would otherwise be asked
 * to do, and the site's two typefaces stay two. See docs/design-system.md.
 */
interface Props {
  title: string;
  href?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  contributors?: string[];
  marqueeColor: 'pink' | 'purple' | 'yellow' | 'coral';
  kind?: 'game' | 'demo';
  input?: ('keyboard' | 'pointer' | 'touch')[];
  index?: number;
  empty?: boolean;
}

const {
  title,
  href,
  thumbnail,
  thumbnailAlt,
  contributors = [],
  marqueeColor,
  kind = 'game',
  input = [],
  index = 0,
  empty = false,
} = Astro.props;

const marqueeClass = {
  pink: 'bg-brand-pink',
  purple: 'bg-brand-purple',
  yellow: 'bg-brand-yellow',
  coral: 'bg-brand-coral',
}[marqueeColor];

// A game that takes no pointer or touch input cannot be played on a phone.
// Saying so on the placard is cheaper than a visitor discovering it after a
// tap, a page load, and a wait.
const desktopOnly = !empty && !input.includes('pointer') && !input.includes('touch');
---

<div
  class="cabinet w-full max-w-[220px]"
  data-cabinet={empty ? 'submit' : href?.split('/').pop()}
  style={`--cabinet-index:${index}`}
>
  <div class="rounded-t-[26px] rounded-b-md bg-brand-dark p-2.5 pb-3 shadow-retro-lg">
    <div
      class={`${marqueeClass} rounded-t-2xl rounded-b px-2 py-2 text-center font-display text-sm font-extrabold leading-tight text-brand-dark ${empty ? 'opacity-40' : ''}`}
    >
      {empty ? 'YOUR GAME HERE' : title}
    </div>

    <div class="my-2 overflow-hidden rounded border-[3px] border-black bg-brand-dark">
      {
        empty ? (
          <div class="flex aspect-[4/3] items-center justify-center">
            <div class="h-1.5 w-12 rounded-full bg-primary-100/70" aria-hidden="true" />
          </div>
        ) : (
          <img
            src={thumbnail}
            alt={thumbnailAlt}
            width="800"
            height="600"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full object-cover"
          />
        )
      }
    </div>

    <div class="flex h-7 items-center justify-center gap-2 rounded bg-brand-dark/60">
      <span class="h-2.5 w-2.5 rounded-full bg-primary-100 ring-[3px] ring-brand-dark/80"></span>
      <span class={`h-2 w-2 rounded-full ${marqueeClass}`}></span>
      <span class="h-2 w-2 rounded-full bg-primary-100/60"></span>
    </div>
  </div>

  <div class="mt-2.5 text-center">
    {
      empty ? (
        <a
          href="https://github.com/philaconvalley/website/blob/main/docs/adding-content.md"
          class="font-display font-bold text-brand-dark underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-600"
        >
          Add yours
        </a>
      ) : (
        <a
          href={href}
          class="font-display text-base font-bold text-brand-dark hover:text-accent-600"
        >
          {title}
        </a>
      )
    }
    <p class="text-xs text-brand-dark/60">
      {empty ? 'Built something? Open a pull request.' : contributors.join(', ')}
      {!empty && kind === 'demo' && <span class="block">Demo — no score</span>}
      {desktopOnly && <span class="block font-semibold">Desktop only</span>}
    </p>
  </div>
</div>

<style>
  /* One entrance, staggered by position. Cabinets arriving in sequence reads as
     a row of machines powering on; all four at once reads as a page load. */
  .cabinet {
    animation: cabinet-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    animation-delay: calc(var(--cabinet-index) * 60ms);
  }

  @keyframes cabinet-rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
  }

  .cabinet:hover {
    transform: translateY(-4px);
    transition: transform 0.2s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .cabinet,
    .cabinet:hover {
      animation: none;
      transform: none;
      transition: none;
    }
  }
</style>
```

- [ ] **Step 4: Write the wall page**

`src/pages/arcade/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArcadeCabinet from '../../components/ArcadeCabinet.astro';

const games = (await getCollection('arcade')).sort(
  (a, b) => a.data.date.valueOf() - b.data.date.valueOf(),
);
---

<BaseLayout
  title="Arcade - PhilaCon Valley"
  description="Play browser games built by the PhilaCon Valley community. Built at Collab Labs, playable right here."
>
  <section class="bg-brand-coral text-white py-20">
    <div class="container-custom">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl md:text-6xl font-bold mb-6">The Arcade</h1>
        <p class="text-2xl text-white/85">Games built by the community. Playable right here.</p>
      </div>
    </div>
  </section>

  <section class="section-padding">
    <div class="container-custom">
      <div class="flex flex-wrap items-start justify-center gap-6 md:gap-8">
        {
          games.map((game, i) => (
            <ArcadeCabinet
              title={game.data.title}
              href={`/arcade/${game.data.slug}`}
              thumbnail={game.data.thumbnail}
              thumbnailAlt={game.data.thumbnailAlt}
              contributors={game.data.contributors}
              marqueeColor={game.data.marqueeColor}
              kind={game.data.kind}
              input={game.data.input}
              index={i}
            />
          ))
        }
        <ArcadeCabinet title="Your game here" marqueeColor="coral" index={games.length} empty />
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Add the nav item**

In `src/components/Header.astro`, add to `navItems` after `Projects`:

```ts
  { name: 'Arcade', href: '/arcade' },
```

- [ ] **Step 6: Run the tests**

```bash
npm run build && npx playwright test e2e/arcade.spec.ts
```

Expected: all four PASS.

- [ ] **Step 7: Run the full suite**

```bash
npm run test:e2e && npm run test:csp
```

Expected: PASS. `landmarks.spec.ts` now covers `/arcade` automatically.

- [ ] **Step 8: Commit**

```bash
git add src/components/ArcadeCabinet.astro src/pages/arcade/index.astro src/components/Header.astro e2e/arcade.spec.ts
git commit -m "feat(arcade): Add the cabinet wall at /arcade"
```

---

## Task 6: The cabinet page

**Files:**

- Create: `src/components/CabinetFrame.astro`
- Create: `src/pages/arcade/[slug].astro`
- Modify: `e2e/arcade.spec.ts`

**Interfaces:**

- Consumes: `arcade` collection (Task 3), game URLs (Task 2).
- Produces: `/arcade/<slug>` pages.

- [ ] **Step 1: Write the failing tests**

Append to `e2e/arcade.spec.ts`:

```ts
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

  test('tells keyboard users how to get out', async ({ page }) => {
    await page.goto('/arcade/keyboard-pong');
    await page.getByRole('button', { name: /click to play/i }).click();
    await expect(page.getByText(/press esc/i)).toBeVisible();
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npx playwright test e2e/arcade.spec.ts -g "cabinet page"
```

Expected: FAIL — the route does not exist.

- [ ] **Step 3: Write the frame component**

`src/components/CabinetFrame.astro`:

```astro
---
/**
 * The player. Wraps a game in cabinet chrome and handles three things the game
 * cannot handle for itself:
 *
 *   1. Focus. Games call preventDefault on their keys, but only once the frame
 *      has focus. Before that, arrows and space scroll the page while the
 *      visitor believes the game is broken. The overlay makes focus explicit.
 *   2. Escape. Having taken the keyboard, we owe a documented way out, or the
 *      cabinet is a keyboard trap and a WCAG failure.
 *   3. Consent to motion. Nothing animates until the overlay is dismissed,
 *      which is the only honest option for motion-sensitive visitors given the
 *      page cannot control animation inside the frame.
 *
 * Fixed-size games (Pong is 860x500 with no resize handling) are scaled to fit
 * rather than clipped.
 */
interface Props {
  slug: string;
  title: string;
  marqueeColor: 'pink' | 'purple' | 'yellow' | 'coral';
  controls: { keys: string[]; label: string }[];
  fixedSize?: { w: number; h: number };
}

const { slug, title, marqueeColor, controls, fixedSize } = Astro.props;

const marqueeClass = {
  pink: 'bg-brand-pink',
  purple: 'bg-brand-purple',
  yellow: 'bg-brand-yellow',
  coral: 'bg-brand-coral',
}[marqueeColor];

const aspect = fixedSize ? `${fixedSize.w} / ${fixedSize.h}` : '4 / 3';
---

<div
  class="mx-auto w-full max-w-3xl"
  x-data="{ playing: false }"
  x-on:keydown.escape.window="if (playing) { playing = false; $refs.startBtn?.focus(); }"
>
  <div class={`${marqueeClass} rounded-t-3xl px-4 py-3 text-center`}>
    <p class="font-display text-xl font-extrabold text-brand-dark">{title}</p>
  </div>

  <div class="bg-brand-dark p-3">
    <div
      class="relative overflow-hidden rounded border-4 border-black bg-black"
      style={`aspect-ratio:${aspect}`}
    >
      <iframe
        data-game-frame
        src={`/games/${slug}/`}
        title={`${title} — playable game`}
        sandbox="allow-scripts"
        allow="fullscreen"
        allowfullscreen
        loading="lazy"
        class="absolute inset-0 h-full w-full border-0"
        x-ref="frame"></iframe>

      <button
        type="button"
        x-ref="startBtn"
        x-show="!playing"
        x-on:click="playing = true; $refs.frame.focus()"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-dark/85 font-display text-xl font-extrabold text-primary-100"
      >
        Click to play
        <span class="text-sm font-normal text-primary-100/70"> Nothing moves until you do </span>
      </button>

      <p
        x-show="playing"
        x-cloak
        class="absolute bottom-0 left-0 right-0 bg-brand-dark/80 py-1 text-center text-xs text-primary-100"
      >
        Press Esc to leave the game and return to the page
      </p>
    </div>

    <dl
      class="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded bg-brand-dark/60 px-4 py-3"
    >
      {
        controls.map((control) => (
          <div class="flex items-center gap-2">
            <dt class="flex gap-1">
              {control.keys.map((key) => (
                <kbd class="rounded bg-primary-100 px-2 py-0.5 font-sans text-xs font-bold text-brand-dark shadow-[0_2px_0_rgba(0,0,0,0.45)]">
                  {key}
                </kbd>
              ))}
            </dt>
            <dd class="text-xs text-primary-100/80">{control.label}</dd>
          </div>
        ))
      }
    </dl>
  </div>
</div>
```

- [ ] **Step 4: Write the cabinet page**

`src/pages/arcade/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import CabinetFrame from '../../components/CabinetFrame.astro';
import Button from '../../components/Button.astro';

export async function getStaticPaths() {
  const games = await getCollection('arcade');
  return games.map((game) => ({
    params: { slug: game.data.slug },
    props: { game, games },
  }));
}

const { game, games } = Astro.props;
const {
  title,
  contributors,
  description,
  longDescription,
  ogImage,
  marqueeColor,
  kind,
  input,
  fixedSize,
  controls,
  slug,
} = game.data;

const playableOnPhone = input.includes('pointer') || input.includes('touch');

// The suggestion offered to phone visitors when this game needs a keyboard.
const phoneAlternative = games.find(
  (g) =>
    g.data.slug !== slug && (g.data.input.includes('pointer') || g.data.input.includes('touch')),
);
---

<BaseLayout title={`${title} - PhilaCon Arcade`} description={description} image={ogImage}>
  <section class="bg-brand-coral text-white py-12">
    <div class="container-custom">
      <div class="max-w-3xl mx-auto">
        <a href="/arcade" class="text-white/90 hover:text-white">← Back to the Arcade</a>
        <h1 class="mt-3 text-4xl md:text-5xl font-bold">{title}</h1>
        <p class="mt-2 text-lg text-white/85">
          Built by {contributors.join(', ')}{kind === 'demo' ? ' · Demo, no score' : ''}
        </p>
      </div>
    </div>
  </section>

  <section class="section-padding">
    <div class="container-custom">
      {
        playableOnPhone ? (
          <CabinetFrame
            slug={slug}
            title={title}
            marqueeColor={marqueeColor}
            controls={controls}
            fixedSize={fixedSize}
          />
        ) : (
          <>
            {/* Keyboard-only games get the cabinet on anything wide enough for a
                keyboard, and an honest explanation on anything that is not.
                Shipping a cabinet a phone visitor can tap but never play is the
                worst outcome available here. */}
            <div class="hidden md:block">
              <CabinetFrame
                slug={slug}
                title={title}
                marqueeColor={marqueeColor}
                controls={controls}
                fixedSize={fixedSize}
              />
            </div>
            <div class="md:hidden mx-auto max-w-md rounded-retro bg-brand-dark p-8 text-center">
              <p class="font-display text-2xl font-extrabold text-primary-100">
                This one needs a keyboard
              </p>
              <p class="mt-3 text-sm text-primary-100/75">
                {title} is played with two sets of keys, so it cannot run on a touchscreen. Come
                back on a laptop.
              </p>
              {phoneAlternative && (
                <div class="mt-6">
                  <Button href={`/arcade/${phoneAlternative.data.slug}`} variant="primary">
                    Play {phoneAlternative.data.title} instead
                  </Button>
                </div>
              )}
            </div>
          </>
        )
      }

      <div class="mx-auto mt-12 max-w-2xl">
        <h2 class="font-display text-2xl font-bold text-brand-dark">About this {kind}</h2>
        {
          /* Required prose, not decoration: a canvas game is invisible to a screen
            reader, so this is the only description of it that some visitors get. */
        }
        <p class="mt-3 text-lg leading-relaxed text-brand-dark/75">{longDescription}</p>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Add the `x-cloak` style if absent**

Check `src/styles/global.css` for `[x-cloak]`. If missing, add:

```css
[x-cloak] {
  display: none !important;
}
```

- [ ] **Step 6: Run the tests**

```bash
npm run build && npx playwright test e2e/arcade.spec.ts
```

Expected: all PASS.

- [ ] **Step 7: Play each game end to end by hand**

```bash
npm run build && node scripts/serve-with-headers.mjs 4322
```

For each of the three cabinet pages: confirm the overlay appears, the game starts on click, keys reach the game and do not scroll the page, `Esc` returns focus, and fullscreen works. Confirm Pong scales to fit rather than overflowing, and that `/arcade/keyboard-pong` on a 390px viewport shows the fallback with no iframe.

- [ ] **Step 8: Commit**

```bash
git add src/components/CabinetFrame.astro 'src/pages/arcade/[slug].astro' src/styles/global.css e2e/arcade.spec.ts
git commit -m "feat(arcade): Add cabinet pages with sandboxed, opt-in game embeds"
```

---

## Task 7: Gates and documentation

**Files:**

- Modify: `.lighthouserc.json`
- Modify: `docs/design-system.md`
- Modify: `docs/adding-content.md`

- [ ] **Step 1: Add arcade pages to the Lighthouse gate**

In `.lighthouserc.json`, extend `ci.collect.url`:

```json
      "url": [
        "http://localhost/",
        "http://localhost/about/",
        "http://localhost/events/",
        "http://localhost/projects/",
        "http://localhost/arcade/",
        "http://localhost/arcade/flappy-philacon/"
      ]
```

The cabinet page is listed deliberately: the wall is static images, so every accessibility risk in this feature — iframe title, control legend markup, contrast on dark chrome — lives on the cabinet page.

- [ ] **Step 2: Run Lighthouse locally**

```bash
npm run build
npx @lhci/cli autorun --config=.lighthouserc.json
```

Expected: `categories:accessibility` ≥ 0.9 on both new URLs. It is asserted at `error`, so a failure here fails CI. Fix findings in markup — do not lower the threshold.

- [ ] **Step 3: Document the cabinet in the design system**

Append to `docs/design-system.md`:

```markdown
### Arcade Cabinet (`src/components/ArcadeCabinet.astro`)

Used only on `/arcade`. A dark cabinet body with a colored marquee, a screenshot
in a bezel, and a control panel.

| Part         | Token                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Cabinet body | `bg-brand-dark`                                                                |
| Marquee      | one of `bg-brand-pink`, `bg-brand-purple`, `bg-brand-yellow`, `bg-brand-coral` |
| Screen bezel | `border-black`                                                                 |
| Placard text | `text-brand-dark`                                                              |

Two rules worth keeping:

**No pixel font.** The cabinet silhouette is what says "arcade" — the typeface is
not asked to do that job. Baloo 2 at `font-extrabold` on the marquee is the whole
treatment. A third typeface would cost contrast at small sizes and buy nothing.

**Dark as an object, not a theme.** The cabinet is dark the way `Header` and
`Footer` are dark. The page stays cream. The site has no dark mode, and the
arcade does not introduce one.

### Page Hero Colors

| Page   | Color | Class            |
| ------ | ----- | ---------------- |
| Arcade | Coral | `bg-brand-coral` |
```

- [ ] **Step 4: Document how to add a game**

Append to `docs/adding-content.md`:

```markdown
## Adding a game to the Arcade

Games are embedded in a sandboxed iframe on philaconvalley.com, so they run
under a stricter policy than a normal web page. A game must be:

- **A single self-contained HTML file.** No separate script files, no CSS
  frameworks, no build step. Inline everything, including any library you use.
- **Free of network calls.** `connect-src` is `'none'`. No fetch, no XHR, no
  WebSockets, no analytics.
- **Free of CDN links.** Google Fonts is the only external origin allowed.
- **Safe without storage.** The sandbox has no same-origin access, so
  `localStorage` throws. Wrap any use in `try`/`catch` and degrade gracefully.

### Steps

1. Put your file at `public/games/<your-slug>/index.html`.
2. Add `src/content/arcade/<your-slug>.md` — copy an existing entry for the
   field list. `longDescription` and `thumbnailAlt` are required and must be
   written by a person: they are how someone who cannot see or play your game
   finds out what it is.
3. Run `npm run build && node scripts/serve-with-headers.mjs 4322`, then
   `npm run arcade:shots` in a second terminal to generate your thumbnail. Look
   at the result — if it captured a title screen rather than gameplay, add a
   warm-up for your game in `scripts/capture-arcade-shots.mjs`.
4. If your game needs a keyboard, list only `keyboard` in `input`. The site will
   then tell phone visitors honestly instead of showing them something they
   cannot play.
5. Open a pull request.
```

- [ ] **Step 5: Run everything**

```bash
npm run lint && npm run format:check && npm run build && npm run csp:hash && npm run test:e2e && npm run test:csp
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add .lighthouserc.json docs/design-system.md docs/adding-content.md
git commit -m "docs(arcade): Document the cabinet and the game submission bar"
```

---

## Before merge

- [ ] **Licensing.** The repo is MIT; committing the games licenses them to the world irrevocably. Confirm Diego's contractor agreement assigns this work to PhilaCon, or get his written sign-off on the PR. **This blocks merge and is not resolvable in code.** See §9 of the spec.
- [ ] Confirm the deployed Vercel preview applies the `/games/` carve-out as the local emulator does — the two `source` patterns are non-overlapping specifically so they cannot diverge, but the first deploy is worth checking by hand.
