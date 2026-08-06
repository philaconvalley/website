import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // csp.spec.ts needs the vercel.json headers, which `astro preview` does not
  // serve — it runs under playwright.csp.config.ts instead. Repeated on every
  // project below, not stated once here: a project's own testIgnore *replaces*
  // this one rather than adding to it, so a project that sets it must carry the
  // exclusion too or csp.spec.ts silently rejoins the run and fails.
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
      // mobile-*.spec.ts asserts what must NOT happen below 1024px. At this
      // project's 1280px it would assert the opposite of the truth.
      testIgnore: ['csp.spec.ts', 'mobile-*.spec.ts'],
    },
    {
      // Everything else runs only at Desktop Chrome's 1280px, which is how a
      // count-up leaking onto phones went unnoticed. The pin and the counters
      // are gated at min-width 1024px, so that gate needs a viewport under it.
      //
      // Scoped rather than a second run of the whole suite: several specs
      // (scroll-choreography above all) encode desktop-only intent and assert
      // the pin holds, which below 1024px is correctly false. Widening them to
      // pass at both sizes would delete the assertion that matters.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: 'mobile-*.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
