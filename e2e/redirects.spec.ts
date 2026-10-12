import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * Guards every redirect in `vercel.json`. Runs under `playwright.csp.config.ts`,
 * because only `scripts/serve-with-headers.mjs` applies vercel.json locally —
 * `astro preview` ignores it, and these tests would fail there for the wrong
 * reason.
 *
 * Each redirect must answer with Vercel's status code, and its destination must
 * be a real page. A redirect into a 404 is worse than the 404 it replaced.
 */

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const { redirects } = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  redirects: Redirect[];
};

test('vercel.json has redirects to check', () => {
  expect(redirects.length).toBeGreaterThan(0);
});

for (const { source, destination, permanent } of redirects) {
  test(`${source} redirects to ${destination}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(permanent ? 308 : 307);
    expect(response.headers()['location']).toBe(destination);

    const landing = await request.get(destination);
    expect(landing.status(), `${destination} should be a real page`).toBe(200);
  });
}
