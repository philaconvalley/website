import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// On Vercel, the build injects this project's analytics endpoints into the
// inline script that `@vercel/analytics/astro` emits. That changes the script's
// bytes, and so its CSP hash. Without the same value locally and in CI, the
// build that `npm run csp:hash` checks is not the build Vercel ships, and the
// CSP blocks analytics in production with no error anyone sees. The value is
// public: it appears in every page Vercel serves. `??=` keeps Vercel's value
// authoritative if it is ever set.
process.env.PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG ??=
  '{"analytics":{"scriptSrc":"8caa79cd117a051d/script.js","viewEndpoint":"8caa79cd117a051d/view","eventEndpoint":"8caa79cd117a051d/event","sessionEndpoint":"8caa79cd117a051d/session"},"speedInsights":{"scriptSrc":"1f2058c732f64b32/script.js","endpoint":"1f2058c732f64b32/vitals"}}';

// https://astro.build/config
export default defineConfig({
  integrations: [sitemap()],
  // The www host is the one Vercel serves; the bare domain redirects to it.
  // Canonical URLs, the sitemap, and og:url all come from this value, so it
  // must name the host that answers 200, not the one that redirects.
  site: 'https://www.philaconvalley.com',
});
