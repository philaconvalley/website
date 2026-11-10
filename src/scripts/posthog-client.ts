/**
 * The PostHog client, imported only by src/scripts/analytics.ts, and only
 * through a dynamic import. Its imports are static on purpose: the bundler
 * can then keep only the one extension named below. A dynamic import of
 * `posthog-js/dist/extension-bundles` keeps every extension (211 KB raw).
 * Settings and reasons: src/scripts/analytics.ts.
 */
import posthog, { type CaptureResult } from 'posthog-js/dist/module.slim.no-external';
import { AnalyticsExtensions } from 'posthog-js/dist/extension-bundles';
import { analytics } from '../config';

/**
 * Keeps `utm_*` parameters, which say which campaign sent a visitor, and drops
 * every other query parameter and the fragment. A link like `?email=...` would
 * otherwise reach PostHog in `$current_url` and `$referrer`. Sentry strips the
 * same way (src/scripts/errors.ts). Non-URL strings pass through unchanged.
 */
export function keepOnlyUtm(value: string): string {
  if (!/^https?:\/\//.test(value)) return value;
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (!key.startsWith('utm_')) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

function stripQueries(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event;
  for (const [key, value] of Object.entries(event.properties)) {
    if (typeof value === 'string') event.properties[key] = keepOnlyUtm(value);
  }
  return event;
}

export function startPostHog(): (event: string) => void {
  posthog.init(analytics.posthog.token, {
    api_host: analytics.posthog.apiHost,
    ui_host: analytics.posthog.uiHost,
    cookieless_mode: 'always',
    person_profiles: 'never',
    respect_dnt: true,
    capture_pageview: true,
    capture_pageleave: true,
    // Clicks on links and buttons, so we can see the path to /discord.
    // Autocapture never records what a visitor types into a field.
    autocapture: true,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    capture_exceptions: false,
    capture_performance: false,
    disable_external_dependency_loading: true,
    before_send: stripQueries,
    // The slim build ships no features. This list is the only one it runs.
    __extensionClasses: {
      autocapture: AnalyticsExtensions.autocapture,
    },
  });

  // Event name only: no properties beyond what PostHog adds to every event.
  return (event: string) => {
    posthog.capture(event);
  };
}
