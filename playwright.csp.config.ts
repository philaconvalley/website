import { defineConfig, devices } from '@playwright/test';

/**
 * Separate from `playwright.config.ts` on purpose: the security headers in
 * `vercel.json` only exist when the build is served through
 * `scripts/serve-with-headers.mjs`. The main e2e config uses `astro preview`,
 * which ignores vercel.json entirely — running these specs there would pass
 * vacuously against a site with no CSP at all.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'csp.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && node scripts/serve-with-headers.mjs 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
