/**
 * Regenerates src/data/community-snapshot.json — the last-known-good numbers the
 * homepage falls back to when Luma or GitHub don't answer during a build.
 *
 * Run it, review the diff, commit it:
 *
 *   npm run data:refresh
 *
 * Unlike the build-time fetch in src/lib/community.ts, this script is ALLOWED to
 * fail. Its whole job is to record verified numbers, so a half-fetched snapshot
 * is worse than no update at all — if either source is unreachable it exits
 * non-zero and leaves the existing file untouched.
 *
 * The extraction below intentionally mirrors src/lib/community.ts. That module
 * is the authority on how these numbers are derived; if the parsing changes
 * there, change it here too. (It is duplicated rather than imported because this
 * is plain Node with no TypeScript loader, and the shared module reads .ts
 * config and JSON imports that Node cannot resolve on its own.)
 */
import { writeFile, readFile } from 'node:fs/promises';

const ICS_URL = 'https://api.lu.ma/ics/get?entity=calendar&id=cal-KkQjuykLZNrSChl';
const REPOS_URL = 'https://api.github.com/orgs/philaconvalley/repos?per_page=100&type=public';
const OUT = 'src/data/community-snapshot.json';
const LUMA_FALLBACK = 'https://lu.ma/philaconvalley';

async function get(url, label) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'user-agent': 'philaconvalley-website-refresh' },
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.text();
}

const unfold = (ics) => ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

function parseIcsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value.trim());
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

function parseVenue(location) {
  const trimmed = location.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return null;
  return trimmed.split(',')[0].trim() || null;
}

function parseIcs(ics) {
  const events = [];
  for (const block of unfold(ics).split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const field = (name) =>
      new RegExp(`^${name}[^:\\r\\n]*:(.*)$`, 'm').exec(body)?.[1]?.trim() ?? '';

    const start = parseIcsDate(field('DTSTART'));
    const title = field('SUMMARY');
    if (!start || !title) continue;

    const link = /(https:\/\/(?:lu\.ma|luma\.com)\/[^\s\\]+)/;
    const url =
      link.exec(field('DESCRIPTION'))?.[1] ?? link.exec(field('LOCATION'))?.[1] ?? LUMA_FALLBACK;

    events.push({ title, start, venue: parseVenue(field('LOCATION')), url });
  }
  return events.sort((a, b) => a.start - b.start);
}

const now = new Date();

const [ics, reposBody] = await Promise.all([
  get(ICS_URL, 'Luma ICS'),
  get(REPOS_URL, 'GitHub org API'),
]);

const events = parseIcs(ics);
if (events.length === 0) throw new Error('Luma ICS parsed to zero events — refusing to write');

const upcoming = events.find((event) => event.start > now) ?? null;
const repos = JSON.parse(reposBody);
if (!Array.isArray(repos)) throw new Error('GitHub API did not return an array');

const snapshot = {
  _comment:
    'Last-known-good community numbers. Used ONLY when Luma or GitHub fail to answer during a build, so the site never blocks a deploy and never invents a number. Regenerate with `npm run data:refresh` and commit the diff.',
  _generated: now.toISOString().slice(0, 10),
  nextEvent: upcoming
    ? {
        title: upcoming.title,
        start: upcoming.start.toISOString(),
        venue: upcoming.venue,
        url: upcoming.url,
      }
    : null,
  nightsHeld: events.filter((event) => event.start <= now).length,
  thingsShipped: repos.filter(
    (repo) =>
      typeof repo.homepage === 'string' &&
      repo.homepage.trim() !== '' &&
      !repo.archived &&
      !repo.fork,
  ).length,
};

const previous = await readFile(OUT, 'utf8').catch(() => null);
const next = `${JSON.stringify(snapshot, null, 2)}\n`;

/**
 * Never let a count regress to zero. Nights held and things shipped only grow, so
 * a computed 0 against a non-zero snapshot means an upstream change we do not
 * understand yet — the org renamed, repos flipped private, an ICS that stopped
 * emitting past events. Overwriting the last-known-good numbers with that would
 * destroy the very fallback src/lib/community.ts leans on.
 */
const priorCounts = previous ? JSON.parse(previous) : null;
if (priorCounts) {
  for (const key of ['nightsHeld', 'thingsShipped']) {
    if (snapshot[key] === 0 && priorCounts[key] > 0) {
      throw new Error(
        `${key} computed as 0 against a snapshot of ${priorCounts[key]} — refusing to write. ` +
          'Check the upstream source before rerunning.',
      );
    }
  }
}

if (previous === next) {
  console.log('[refresh] snapshot already current — nothing to commit.');
} else {
  await writeFile(OUT, next);
  console.log(`[refresh] wrote ${OUT}:`);
  console.log(`  next event   ${snapshot.nextEvent?.title ?? '(none scheduled)'}`);
  console.log(`  nights held  ${snapshot.nightsHeld}`);
  console.log(`  shipped      ${snapshot.thingsShipped}`);
}
