import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // csp.spec.ts needs the vercel.json headers, which `astro preview` does not
  // serve — it runs under playwright.csp.config.ts instead.
  testIgnore: 'csp.spec.ts',
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
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
