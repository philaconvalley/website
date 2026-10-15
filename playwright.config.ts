import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // csp.spec.ts needs the vercel.json headers, which `astro preview` does not
  // serve — it runs under playwright.csp.config.ts instead.
  testIgnore: ['csp.spec.ts', 'redirects.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Astro's CLI backgrounds `preview` and exits when it detects an AI coding
    // agent, and Playwright treats that early exit as a crash (#168).
    // --ignore-lock keeps the server in the foreground under every agent the
    // detector knows, now and after upgrades. It also skips the check for a
    // second preview server, which Playwright's own url probe already covers.
    command: 'npm run build && npm run preview -- --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
