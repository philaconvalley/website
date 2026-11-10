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
 *   - `allowUrls`: only errors thrown by our own scripts. Browser extensions
 *     throw on every site; without this they drown out real problems.
 *   - No `BrowserSession` integration: it sends one request per page view to
 *     count sessions. Errors are the only thing this site sends to Sentry.
 *   - No tracing and no replay integrations, so neither is bundled.
 *   - `beforeSend` and `beforeBreadcrumb` also strip query strings, as a
 *     second guard: a visitor's details could sit there (for example a
 *     pre-filled form link).
 */
import { init } from '@sentry/browser';
import { errorTracking } from '../config';

const stripQuery = (url: string) => url.split(/[?#]/)[0];

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
    allowUrls: [/^https:\/\/www\.philaconvalley\.com\//],
    integrations: (defaults) => defaults.filter((i) => i.name !== 'BrowserSession'),
    beforeSend(event) {
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
