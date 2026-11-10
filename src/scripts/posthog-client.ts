/**
 * The PostHog client, imported only by src/scripts/analytics.ts, and only
 * through a dynamic import. Its imports are static on purpose: the bundler
 * can then keep only the one extension named below. A dynamic import of
 * `posthog-js/dist/extension-bundles` keeps every extension (211 KB raw).
 * Settings and reasons: src/scripts/analytics.ts.
 */
import posthog from 'posthog-js/dist/module.slim.no-external';
import { AnalyticsExtensions } from 'posthog-js/dist/extension-bundles';
import { analytics } from '../config';

export function startPostHog() {
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
    // The slim build ships no features. This list is the only one it runs.
    __extensionClasses: {
      autocapture: AnalyticsExtensions.autocapture,
    },
  });
}
