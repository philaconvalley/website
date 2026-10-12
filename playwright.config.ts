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
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Astro/Vite backgrounds `preview` when it detects an AI coding agent
    // and Playwright treats the early exit as a crash. Empty strings count
    // as "not set", so this switches the detection off for the test server
    // only (see #168). Covers Vite's agent list plus am-i-vibing's
    // (which Astro's CLI uses), verified against both detectors.
    env: {
      AGENT: '',
      AIDER_API_KEY: '',
      AI_AGENT: '',
      AMP_CURRENT_THREAD_ID: '',
      ANTIGRAVITY_AGENT: '',
      ANTIGRAVITY_PROJECT_ID: '',
      AUGMENT_AGENT: '',
      CLAUDECODE: '',
      CLAUDE_CODE: '',
      CLAUDE_CODE_IS_COWORK: '',
      CODEIUM_EDITOR_APP_ROOT: '',
      CODEX_CI: '',
      CODEX_SANDBOX: '',
      CODEX_THREAD_ID: '',
      COPILOT_ALLOW_ALL: '',
      COPILOT_GITHUB_TOKEN: '',
      COPILOT_MODEL: '',
      CRUSH: '',
      CURSOR_AGENT: '',
      CURSOR_EXTENSION_HOST_ROLE: '',
      CURSOR_TRACE_ID: '',
      GEMINI_CLI: '',
      OPENCODE: '',
      OPENCODE_APP_INFO: '',
      OPENCODE_BIN_PATH: '',
      OPENCODE_CLIENT: '',
      OPENCODE_MODES: '',
      OPENCODE_SERVER: '',
      PI_CODING_AGENT: '',
      QWEN_CODE: '',
      REPL_ID: '',
      REPLIT_MODE: '',
    },
  },
});
