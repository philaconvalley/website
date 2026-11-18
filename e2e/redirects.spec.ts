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

// A pattern source (`:param`) is not a URL to fetch; its cases are below.
const literal = redirects.filter((r) => !r.source.includes(':'));

test('every pattern redirect has its own test below', () => {
  const patterns = redirects.filter((r) => r.source.includes(':')).map((r) => r.source);
  expect(patterns).toEqual(['/:path((?!games/).+)/']);
});

/**
 * One address per page: `/x/` goes to `/x` (see `trailingSlash` in
 * astro.config.mjs). /games/ keeps its slash, because those pages load files by
 * relative path, and `/` is the home page, not a slash to strip.
 */
for (const [source, destination] of [
  ['/about/', '/about'],
  ['/about/crew/jay-turner/', '/about/crew/jay-turner'],
  ['/events/', '/events'],
]) {
  test(`trailing slash: ${source} redirects to ${destination}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toBe(destination);
    expect((await request.get(destination)).status()).toBe(200);
  });
}

for (const path of ['/', '/games/_probe/', '/about']) {
  test(`trailing slash: ${path} is served, not redirected`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
}

for (const { source, destination, permanent } of literal) {
  test(`${source} redirects to ${destination}`, async ({ request }) => {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(permanent ? 308 : 307);
    expect(response.headers()['location']).toBe(destination);

    const landing = await request.get(destination);
    expect(landing.status(), `${destination} should be a real page`).toBe(200);
  });
}
