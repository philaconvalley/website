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

/**
 * Custom events. Page code fires `pcv-track` with `{ event: name }` (Alpine:
 * `$dispatch('pcv-track', { event: 'contact_form_sent' })`), so no page has
 * to import PostHog. Only names in this list are sent, with no properties,
 * so a form field can never reach PostHog by mistake. Each name added here
 * must also fit the PostHog row on the privacy page.
 *   - contact_form_sent: Formspree accepted a contact message (src/pages/contact.astro).
 */
const allowedEvents = new Set(['contact_form_sent']);

let capture: ((event: string) => void) | null = null;
// Events fired before PostHog loads (it waits for `load`) wait here.
const queued: string[] = [];

function track(e: Event) {
  const name = (e as CustomEvent<{ event?: unknown }>).detail?.event;
  if (typeof name !== 'string' || !allowedEvents.has(name)) return;
  if (capture) capture(name);
  else queued.push(name);
}

async function start() {
  const { startPostHog } = await import('./posthog-client');
  capture = startPostHog();
  for (const name of queued.splice(0)) capture(name);
}

/**
 * Crew opt-out, so our own visits do not count as traffic. Cookieless mode
 * cannot tell a crew member from a visitor, and PostHog discards IPs, so the
 * filter has to live in the browser. A crew member opens any page with
 * `?pcv-analytics=off` once per browser; `?pcv-analytics=on` undoes it.
 * localStorage is per browser, so each laptop and phone needs its own visit.
 *
 * The privacy page says PostHog "stores nothing in your browser". That stays
 * true for visitors: this only reads the key, and only someone who opens the
 * opt-out link gets one. PostHog never loads for them, so it stores nothing.
 */
const OPT_OUT_KEY = 'pcv-no-analytics';

function crewOptedOut(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('pcv-analytics')) {
      if (params.get('pcv-analytics') === 'off') localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
    }
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    // Storage blocked: count the visit, as before this opt-out existed.
    return false;
  }
}

if (window.location.hostname === analytics.productionHost && !crewOptedOut()) {
  window.addEventListener('pcv-track', track);
  if (document.readyState === 'complete') {
    void start();
  } else {
    window.addEventListener('load', () => void start(), { once: true });
  }
}
