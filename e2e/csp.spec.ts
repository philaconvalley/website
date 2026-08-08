import { test, expect, type Page } from '@playwright/test';

/**
 * Guards the security headers in `vercel.json` against the real production
 * build. Runs under `playwright.csp.config.ts`, which serves `dist/` through
 * `scripts/serve-with-headers.mjs` so the headers actually apply — `astro
 * preview` ignores vercel.json, and `vercel dev` applies it to dev-server HTML
 * that carries Vite HMR and a differently-hashed inline analytics script.
 */

interface Violation {
  directive: string;
  blockedURI: string;
  disposition: 'enforce' | 'report';
}

declare global {
  interface Window {
    __cspViolations: Violation[];
  }
}

/** Must run before `goto` — violations fire during initial parse. */
async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push({
        directive: e.effectiveDirective,
        blockedURI: e.blockedURI,
        disposition: e.disposition as 'enforce' | 'report',
      });
    });
  });
}

const read = (page: Page) => page.evaluate(() => window.__cspViolations);

// `/blog` is absent because the blog no longer routes (src/pages/_blog/). Add it
// back when the routes return — see src/pages/rss.xml.ts for the full checklist.
const PAGES = ['/', '/about', '/contact', '/resources', '/projects'];

test.describe('Content-Security-Policy (enforcing)', () => {
  for (const path of PAGES) {
    test(`blocks nothing on ${path}`, async ({ page }) => {
      await recordViolations(page);
      const response = await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Anti-vacuity tripwire: serve-with-headers.mjs substitutes 404.html for a
      // missing route, so without this a page that stopped existing would keep
      // reporting a clean policy — against the 404 page, not the page named here.
      expect(response?.status(), `${path} should exist to be a meaningful CSP case`).toBe(200);

      const enforced = (await read(page)).filter((v) => v.disposition === 'enforce');
      expect(enforced, `enforced CSP violations on ${path}`).toEqual([]);
    });
  }

  test('survives Alpine interaction (mobile menu open/close)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await recordViolations(page);
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Open main menu' });
    await toggle.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await toggle.click();

    const enforced = (await read(page)).filter((v) => v.disposition === 'enforce');
    expect(enforced, 'enforced CSP violations during Alpine interaction').toEqual([]);
  });

  test('serves every security header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response!.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy-report-only']).toBeTruthy();
  });
});

test.describe('Content-Security-Policy-Report-Only (the strict experiment)', () => {
  /**
   * The report-only header drops 'unsafe-eval'. Alpine evaluates its directive
   * expressions via `new Function()`, so this is expected to report — that
   * report IS the data point for whether swapping to `@alpinejs/csp` is worth
   * doing. If this ever stops reporting, the strict policy has become viable
   * and the enforcing header should be tightened.
   */
  test('reports exactly the known Alpine eval gap, and nothing new', async ({ page }) => {
    await recordViolations(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const reported = (await read(page)).filter((v) => v.disposition === 'report');

    // Nothing beyond eval should be reported — fonts, styles, images, connect
    // and form all already satisfy the strict policy. A new category here means
    // a dependency started reaching somewhere the allowlist does not cover.
    const unexpected = reported.filter((v) => !v.directive.startsWith('script-src'));
    expect(unexpected, 'unexpected report-only violations beyond the Alpine eval gap').toEqual([]);

    // Deliberate tripwire: this asserts the gap still EXISTS, so the test cannot
    // pass vacuously. If it fails because no eval violations were reported, Alpine
    // no longer needs eval — drop 'unsafe-eval' from the enforcing header and
    // delete this assertion.
    const evalViolations = reported.filter((v) => v.blockedURI === 'eval');
    expect(
      evalViolations.length,
      "no eval violations reported — if Alpine no longer needs eval, remove 'unsafe-eval' from the enforcing CSP",
    ).toBeGreaterThan(0);
  });
});

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
    // The frame host lives outside /games/ on purpose — see
    // public/arcade-probe-host.html for why.
    await page.goto('/arcade-probe-host.html');
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

  test('records whether a sibling script file loads in the sandbox', async ({ page }) => {
    await page.goto('/arcade-probe-host.html');
    const loaded = await page
      .frameLocator('#probe')
      .locator('body')
      .evaluate(
        () =>
          'external script marker' in window ||
          Boolean((window as unknown as { __probeExternal?: boolean }).__probeExternal),
      );
    // Not an assertion of either outcome — this records the answer that decides
    // whether games may ship sibling .js files. See the plan's Task 1.
    console.log(`[arcade probe] external sibling script loaded: ${loaded}`);
    expect(typeof loaded).toBe('boolean');
  });
});
