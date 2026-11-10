import { defineConfig, devices } from '@playwright/test';

/**
 * PostHog and Sentry run only on the production host, so no other suite ever
 * sees them. This config makes one extra build with the host set to
 * `localhost` (see `analytics` in src/config.ts), into its own folder so it
 * never overwrites the `dist/` other suites test. It serves that build with
 * the vercel.json headers, so the real CSP applies while both tools run.
 *
 * The /relay/* rewrites do not exist locally. The spec stubs those paths and
 * inspects what the browser would have sent through them.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['observability.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4323',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      'PUBLIC_OBSERVABILITY_HOST=localhost npx astro build --outDir dist-observability && node scripts/serve-with-headers.mjs 4323 dist-observability',
    url: 'http://localhost:4323',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
