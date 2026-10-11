#!/usr/bin/env node
/**
 * Keeps one GitHub issue open while the Luma calendar has nothing scheduled.
 *
 * Why this exists: the site reads events from Luma, so an empty Luma calendar
 * means an empty /events page and no RSVP button anywhere. On 2026-10-11 the last
 * event had been 2026-09-30 and nobody noticed for 11 days, with a conference
 * (Founders Alley, 2026-10-20) about to send new visitors to the site.
 *
 * A smoke detector, not an assistant: it reads the public ICS feed (no login, so
 * it cannot break when a token expires) and asks one yes/no question. Is any
 * event starting within WINDOW_DAYS?
 *
 * - No  -> open the warning issue, or leave it open if it already is.
 * - Yes -> close the warning issue with a comment, if one is open.
 *
 * ONE issue, never a new one per week, so the tracker does not fill with
 * duplicates.
 *
 * Usage:
 *   GITHUB_REPOSITORY=owner/repo node .github/scripts/luma-upcoming-check.mjs
 *   DRY_RUN=1 ... node .github/scripts/luma-upcoming-check.mjs   # touch nothing
 */
import { execFileSync } from 'node:child_process';

// Overridable only so the 'events found' path can be tested against a fixture.
const ICS_URL =
  process.env.LUMA_ICS_URL ?? 'https://api.lu.ma/ics/get?entity=calendar&id=cal-KkQjuykLZNrSChl';
const CALENDAR_URL = 'https://lu.ma/philaconvalley';
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS ?? 21);
const TITLE = `No Luma events scheduled in the next ${WINDOW_DAYS} days`;
const LABEL = 'content';
const REPO = process.env.GITHUB_REPOSITORY;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!REPO) {
  console.error('GITHUB_REPOSITORY must be set (owner/repo).');
  process.exit(1);
}

/** Folded lines continue with a leading space or tab (RFC 5545). */
const unfold = (ics) => ics.replace(/\r?\n[ \t]/g, '');

/** `20260730T220000Z` -> ms since epoch. Same rule as src/lib/community.ts. */
function parseIcsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value.trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

function parseEvents(ics) {
  const events = [];
  for (const block of unfold(ics).split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const field = (name) => new RegExp(`^${name}[^:\\r\\n]*:(.*)$`, 'm').exec(body)?.[1]?.trim();
    const start = parseIcsDate(field('DTSTART') ?? '');
    if (start) events.push({ title: field('SUMMARY') ?? '(untitled)', start });
  }
  return events.sort((a, b) => a.start - b.start);
}

const day = (ms) => new Date(ms).toISOString().slice(0, 10);

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

const response = await fetch(ICS_URL);
if (!response.ok) {
  // A feed outage is not "the calendar is empty". Fail the run so it shows red
  // in Actions, rather than opening a false alarm.
  console.error(`Luma ICS feed returned HTTP ${response.status}.`);
  process.exit(1);
}

const events = parseEvents(await response.text());
const now = Date.now();
const upcoming = events.filter((e) => e.start > now && e.start <= now + WINDOW_DAYS * 864e5);
const last = events.filter((e) => e.start <= now).at(-1);
const next = events.find((e) => e.start > now);

const openIssue = gh(
  'issue',
  'list',
  '--repo',
  REPO,
  '--state',
  'open',
  '--search',
  `"${TITLE}" in:title`,
  '--json',
  'number,title',
  '--jq',
  `map(select(.title == "${TITLE}")) | .[0].number // empty`,
);

if (upcoming.length > 0) {
  const list = upcoming.map((e) => `- ${day(e.start)}: ${e.title}`).join('\n');
  console.log(`OK: ${upcoming.length} event(s) in the next ${WINDOW_DAYS} days.\n${list}`);
  if (openIssue) {
    const comment = `Events are scheduled again, so this warning is resolved.\n\n${list}`;
    if (DRY_RUN) console.log(`[dry run] would close #${openIssue}`);
    else gh('issue', 'close', openIssue, '--repo', REPO, '--comment', comment);
  }
  process.exit(0);
}

const body = `The Luma calendar has no event starting in the next ${WINDOW_DAYS} days (checked ${day(now)}).

- **Last event:** ${last ? `${day(last.start)}: ${last.title}` : 'none in the feed'}
- **Next event:** ${next ? `${day(next.start)}: ${next.title}` : 'none scheduled'}

## Why this matters

The site reads its events from Luma. While the calendar is empty, the /events calendar shows "No Upcoming Events", the homepage has no next-event card, and the header RSVP button has nowhere to send people.

## To resolve

Publish the next event on the [PhilaCon Valley Luma calendar](${CALENDAR_URL}). This check runs every Monday and closes this issue by itself once an event is scheduled. To re-check sooner, run the "Luma upcoming events check" workflow by hand from the Actions tab.

_Opened by \`.github/workflows/luma-upcoming-check.yml\`._`;

console.log(
  `EMPTY: no events in the next ${WINDOW_DAYS} days. Last: ${last ? day(last.start) : 'none'}.`,
);

if (openIssue) {
  console.log(`Warning issue #${openIssue} is already open. Updating its body.`);
  if (!DRY_RUN) gh('issue', 'edit', openIssue, '--repo', REPO, '--body', body);
} else if (DRY_RUN) {
  console.log(`[dry run] would open "${TITLE}":\n\n${body}`);
} else {
  console.log(
    gh('issue', 'create', '--repo', REPO, '--title', TITLE, '--label', LABEL, '--body', body),
  );
}
