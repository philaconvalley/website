#!/usr/bin/env node
/**
 * Rebuilds the site when its next event no longer matches Luma.
 *
 * Why this exists: the site is static. src/lib/community.ts reads the Luma feed
 * at build time, so a night posted on Luma after the last deploy does not show
 * until someone deploys again. Without an event, the site says "Get notified"
 * and hides the event sections. So a new night can sit on Luma, invisible on the
 * site, for days.
 *
 * Every few hours this script asks one question: does the event the live site
 * shows match the event Luma says is next?
 *
 * - Luma: the first event in the public feed that starts after now. This is the
 *   same rule as fetchLuma() in src/lib/community.ts.
 * - Live site: the `data-pcv-event-start` marker on the homepage. The build
 *   writes it only for a real event, as `start.toISOString()`.
 *
 * Same value -> do nothing. Different -> call the Vercel deploy hook once.
 *
 * The live site is the record of what was deployed, so the script keeps no
 * state of its own. It rebuilds when a night is posted, moved, or cancelled,
 * and once after a night ends, so the site stops carrying a past event.
 *
 * Usage:
 *   VERCEL_DEPLOY_HOOK=... node .github/scripts/luma-rebuild-check.mjs
 *   DRY_RUN=1 node .github/scripts/luma-rebuild-check.mjs   # never deploys
 */

// Overridable only so the "mismatch" path can be tested against a local build.
const ICS_URL =
  process.env.LUMA_ICS_URL ?? 'https://api.lu.ma/ics/get?entity=calendar&id=cal-KkQjuykLZNrSChl';
const SITE_URL = process.env.SITE_URL ?? 'https://www.philaconvalley.com/';
const HOOK = process.env.VERCEL_DEPLOY_HOOK ?? '';
const DRY_RUN = process.env.DRY_RUN === '1';

/** Folded lines continue with a leading space or tab (RFC 5545). */
const unfold = (ics) => ics.replace(/\r?\n[ \t]/g, '');

/** `20260730T220000Z` -> ms since epoch. Same rule as src/lib/community.ts. */
function parseIcsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value.trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

/** The next event's start as the build writes it, or null. */
function nextEventStart(ics, now) {
  const starts = [];
  for (const block of unfold(ics).split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const field = (name) =>
      new RegExp(`^${name}[^:\\r\\n]*:(.*)$`, 'm').exec(body)?.[1]?.trim() ?? '';
    const start = parseIcsDate(field('DTSTART'));
    // community.ts skips an event with no title, so this does too.
    if (start && field('SUMMARY')) starts.push(start);
  }
  const next = starts.sort((a, b) => a - b).find((start) => start > now);
  return next ? new Date(next).toISOString() : null;
}

async function fetchText(url, label) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    // An outage is not "no event". Fail red in Actions; never deploy on it.
    console.error(`${label} returned HTTP ${response.status}. No deploy.`);
    process.exit(1);
  }
  return response.text();
}

const now = Date.now();
const luma = nextEventStart(await fetchText(ICS_URL, 'Luma feed'), now);

const html = await fetchText(SITE_URL, 'Live site');
const markers = [
  ...new Set([...html.matchAll(/data-pcv-event-start="([^"]+)"/g)].map((m) => m[1])),
];
if (markers.length > 1) {
  // The header, hero, and bar all mark the same event. Two values means the
  // build itself is inconsistent, and a rebuild is the right fix.
  console.log(`Live site carries ${markers.length} different event markers: ${markers.join(', ')}`);
}
const site = markers.length === 1 ? markers[0] : null;

console.log(`Luma next event: ${luma ?? 'none'}`);
console.log(`Live site event: ${site ?? 'none'}`);

if (luma === site && markers.length <= 1) {
  console.log('In sync. No deploy.');
  process.exit(0);
}

console.log('Out of sync. The site needs a rebuild.');

if (DRY_RUN) {
  console.log('[dry run] would call the deploy hook.');
  process.exit(0);
}

if (!HOOK) {
  // The workflow can run before the secret exists. Say so, but do not fail.
  console.warn('VERCEL_DEPLOY_HOOK is not set. Skipping the deploy.');
  process.exit(0);
}

// A wrong paste into the secret must not send a POST to an unknown address.
if (!HOOK.startsWith('https://api.vercel.com/')) {
  console.error('VERCEL_DEPLOY_HOOK is not a Vercel deploy hook URL. No deploy.');
  process.exit(1);
}

// The hook URL is a credential. Never print it.
const response = await fetch(HOOK, { method: 'POST', signal: AbortSignal.timeout(15000) });
if (!response.ok) {
  console.error(`Deploy hook returned HTTP ${response.status}.`);
  process.exit(1);
}
const job = (await response.json().catch(() => ({})))?.job;
console.log(`Deploy started${job?.id ? ` (job ${job.id}, ${job.state ?? 'pending'})` : ''}.`);
