import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// On Vercel, the build injects this project's analytics endpoints into the
// script that `@vercel/analytics/astro` emits. Setting the same value here
// keeps the build that local runs and CI test identical to the one Vercel
// ships. (That script used to be inline, so a mismatch also changed its CSP
// hash and blocked analytics in production. Scripts are no longer inlined;
// see `assetsInlineLimit` below.) The value is public: it appears in every
// page Vercel serves. `??=` keeps Vercel's value authoritative if it is ever set.
process.env.PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG ??=
  '{"analytics":{"scriptSrc":"8caa79cd117a051d/script.js","viewEndpoint":"8caa79cd117a051d/view","eventEndpoint":"8caa79cd117a051d/event","sessionEndpoint":"8caa79cd117a051d/session"},"speedInsights":{"scriptSrc":"1f2058c732f64b32/script.js","endpoint":"1f2058c732f64b32/vitals"}}';

// https://astro.build/config
export default defineConfig({
  integrations: [sitemap()],
  // The www host is the one Vercel serves; the bare domain redirects to it.
  // Canonical URLs, the sitemap, and og:url all come from this value, so it
  // must name the host that answers 200, not the one that redirects.
  site: 'https://www.philaconvalley.com',
  vite: {
    plugins: [
      // Source maps for Sentry, so a production error points at the real file,
      // line, and function name instead of minified code.
      //   - Every build adds a debug ID to each bundle. That keeps the JS that
      //     CI tests the same as the JS Vercel ships. Only the upload depends
      //     on the token.
      //   - With SENTRY_AUTH_TOKEN (set in Vercel, Production only), the build
      //     uploads the maps to the Sentry project `website`. Without it (local
      //     dev, CI, previews), the upload is skipped and the build still passes.
      //   - The plugin makes hidden source maps itself and, with Vite, never
      //     writes them to dist/. Visitors cannot download them.
      //   - telemetry: false stops the plugin reporting build data to Sentry.
      // The token is a secret: never commit it or print it. It needs only the
      // org:ci scope (Sentry > Settings > Auth Tokens > Organization Tokens).
      sentryVitePlugin({
        org: 'philacon-valley',
        project: 'website',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          disable: process.env.SENTRY_AUTH_TOKEN ? false : 'disable-upload',
          // Only the browser bundles. Astro's prerender build never ships.
          assets: ['./dist/_astro/**'],
        },
        release: {
          // The deploy's commit, so Sentry can say which deploy an error first
          // appeared in. Vercel sets this at build time.
          name: process.env.VERCEL_GIT_COMMIT_SHA,
          create: Boolean(process.env.SENTRY_AUTH_TOKEN),
        },
      }),
    ],
    build: {
      // Vite inlines any asset under 4 KB as a data: URI. A few @fontsource
      // subsets are that small, and page CSP is `font-src 'self'`, so an
      // inlined font is blocked. Keep fonts as files rather than loosen the
      // policy to allow data:. `undefined` leaves every other asset on the
      // default rule. Guarded by e2e/csp.spec.ts ("blocks nothing on …").
      //
      // Scripts are never inlined either. Astro inlines any script under 4 KB
      // (it reads this same option), and an inline script needs its sha256
      // hand-kept in both CSP policies in vercel.json. When the hash drifted
      // in October, the CSP silently blocked Vercel Analytics for weeks. The
      // Sentry plugin above also adds a debug ID and the commit SHA to every
      // script, which would change an inline script's hash on every deploy.
      // As files, all scripts fall under `script-src 'self'` and need no hash.
      assetsInlineLimit: (filePath) => (/\.(woff2?|m?js)$/.test(filePath) ? false : undefined),
    },
  },
});
