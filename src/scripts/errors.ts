/**
 * Sentry error tracking. Values and the matching org settings: `errorTracking`
 * in src/config.ts.
 *
 * Unlike PostHog, this loads with the page, not after `load`: an error thrown
 * during startup is the one we most need to see.
 *
 * What each choice buys:
 *   - `dataCollection`, all off: no user info (so no IP address), no cookies,
 *     no headers, no request bodies, no query parameters, and no local
 *     variable values. Sentry 11 collects all of these by default, and it
 *     replaced the old single `sendDefaultPii` switch with this object.
 *   - `thrownByOurScripts`: only errors whose innermost stack frame is one
 *     of our script files. Browser extensions and the console throw on every
 *     site; without this they drown out real problems. `allowUrls` alone is
 *     not enough: it lets an error through when the frame that threw has no
 *     file name (code run by `eval` or typed into the console), and Sentry's
 *     own `setTimeout` wrapper puts one of our files in every async stack.
 *     e2e/observability.spec.ts caught both. This is also why the smoke test
 *     below exists: a console-typed error never reaches Sentry.
 *   - No `BrowserSession` integration: it sends one request per page view to
 *     count sessions. Errors are the only thing this site sends to Sentry.
 *   - No tracing and no replay integrations, so neither is bundled.
 *   - `beforeSend` and `beforeBreadcrumb` also strip query strings, as a
 *     second guard: a visitor's details could sit there (for example a
 *     pre-filled form link).
 */
import { init, type ErrorEvent } from '@sentry/browser';
import { errorTracking } from '../config';

const stripQuery = (url: string) => url.split(/[?#]/)[0];

const hostPattern = errorTracking.productionHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ourScript = new RegExp(`^https?://${hostPattern}(:\\d+)?/`);

/** True when the frame that threw (the last one) is in one of our files. */
function thrownByOurScripts(event: ErrorEvent): boolean {
  const frames = event.exception?.values?.at(-1)?.stacktrace?.frames;
  const filename = frames?.at(-1)?.filename;
  return !!filename && ourScript.test(filename);
}

if (window.location.hostname === errorTracking.productionHost) {
  init({
    dsn: errorTracking.sentry.dsn,
    tunnel: errorTracking.sentry.tunnel,
    environment: 'production',
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    allowUrls: [ourScript],
    integrations: (defaults) => defaults.filter((i) => i.name !== 'BrowserSession'),
    beforeSend(event) {
      if (!thrownByOurScripts(event)) return null;
      if (event.request?.url) event.request.url = stripQuery(event.request.url);
      return event;
    },
    beforeBreadcrumb(crumb) {
      if (typeof crumb.data?.url === 'string') crumb.data.url = stripQuery(crumb.data.url);
      if (typeof crumb.data?.to === 'string') crumb.data.to = stripQuery(crumb.data.to);
      if (typeof crumb.data?.from === 'string') crumb.data.from = stripQuery(crumb.data.from);
      return crumb;
    },
  });
}

/**
 * Smoke test: open /#sentry-smoke-test on the live site, and one error should
 * reach Sentry within a minute. The error is thrown from this bundle, so it
 * passes `allowUrls`, which a console-typed error does not. Anyone can trigger
 * it, but the DSN is public anyway, so this adds no new way to send events.
 * e2e/observability.spec.ts uses it too.
 */
if (
  window.location.hostname === errorTracking.productionHost &&
  window.location.hash === '#sentry-smoke-test'
) {
  setTimeout(() => {
    throw new Error('Sentry smoke test (/#sentry-smoke-test)');
  }, 0);
}
