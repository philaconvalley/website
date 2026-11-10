/**
 * PostHog, set up for the most private mode it has. Full reasoning and the
 * matching project settings: `analytics` in src/config.ts.
 *
 * What each choice buys:
 *   - The slim no-external build: it never fetches a script from PostHog's
 *     CDN, and it holds only core capture. We add back only autocapture.
 *     Everything that runs is bundled and served from our origin, under
 *     `script-src 'self'`, with versions under Dependabot. The full
 *     no-external build was 121 KB gzipped, six times Alpine, for features
 *     this site turns off. Slim plus autocapture is 65 KB; the slim core
 *     alone is 53 KB, so there is little left to cut. PostHog calls the slim
 *     build experimental: after a posthog-js bump, check that events still
 *     reach the project.
 *   - Dynamic import after `load`: the 65 KB never competes with the page's
 *     own CSS, fonts, and images, and hosts other than production never
 *     download it at all.
 *   - `cookieless_mode: 'always'`: no cookie, no localStorage, no
 *     sessionStorage. PostHog counts unique visitors from a server-side hash
 *     with a salt that rotates daily, so a visitor cannot be followed across
 *     days. This is what keeps the privacy page's promise true.
 *   - `person_profiles: 'never'`: PostHog builds no profile of anyone.
 *   - Replay, surveys, feature flags, exception capture, and web vitals are
 *     all off. Sentry owns errors. Each one we turn on later must also be
 *     added to the privacy page.
 */
import { analytics } from '../config';

async function start() {
  const { startPostHog } = await import('./posthog-client');
  startPostHog();
}

if (window.location.hostname === analytics.productionHost) {
  if (document.readyState === 'complete') {
    void start();
  } else {
    window.addEventListener('load', () => void start(), { once: true });
  }
}
