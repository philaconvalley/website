#!/usr/bin/env node
/**
 * Keeps one GitHub issue open while the hand-typed member count is too old.
 *
 * Why this exists: the member count in src/config.ts has no free source. Luma
 * exposes a calendar-wide total only through `contacts-list`, which needs a paid
 * Luma Plus API key, and we chose not to pay for one number (2026-10-29). So a
 * person types it in. On 2026-10-29 the site said 493 and Luma had 508: 19 people
 * had joined and about 4 had left in 18 days, and nothing told anyone.
 *
 * This does not fetch the count. It cannot, for the same reason. It asks one
 * yes/no question: is `memberCountUpdated` older than MAX_AGE_DAYS?
 *
 * - Yes -> open the reminder issue, or update it if it is already open.
 * - No  -> close the reminder issue with a comment, if one is open.
 *
 * ONE issue, never a new one per week, same as luma-upcoming-check.mjs.
 *
 * Usage:
 *   GITHUB_REPOSITORY=owner/repo node .github/scripts/member-count-age-check.mjs
 *   DRY_RUN=1 ... node .github/scripts/member-count-age-check.mjs   # touch nothing
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CONFIG_PATH = 'src/config.ts';
const CALENDAR_URL = 'https://luma.com/philaconvalley';
const MAX_AGE_DAYS = Number(process.env.MAX_AGE_DAYS ?? 30);
const TITLE = 'Member count on the site is out of date';
const LABEL = 'content';
const REPO = process.env.GITHUB_REPOSITORY;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!REPO) {
  console.error('GITHUB_REPOSITORY must be set (owner/repo).');
  process.exit(1);
}

// config.ts is TypeScript, so read the two values as text instead of importing it.
const config = readFileSync(CONFIG_PATH, 'utf8');
const count = /memberCount:\s*(\d+)/.exec(config)?.[1];
const updated = /memberCountUpdated:\s*'(\d{4}-\d{2}-\d{2})'/.exec(config)?.[1];

if (!count || !updated) {
  // A renamed field must fail red, not pass quietly forever.
  console.error(`Could not read memberCount and memberCountUpdated from ${CONFIG_PATH}.`);
  process.exit(1);
}

const now = Date.now();
const ageDays = Math.floor((now - Date.parse(`${updated}T00:00:00Z`)) / 864e5);
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

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

if (ageDays <= MAX_AGE_DAYS) {
  console.log(`OK: member count ${count} was updated ${updated} (${ageDays} days ago).`);
  if (openIssue) {
    const comment = `The member count was updated to ${count} on ${updated}, so this reminder is resolved.`;
    if (DRY_RUN) console.log(`[dry run] would close #${openIssue}`);
    else gh('issue', 'close', openIssue, '--repo', REPO, '--comment', comment);
  }
  process.exit(0);
}

const body = `The site says **${count} people on our calendar**. That number was last updated on ${updated}, ${ageDays} days ago (checked ${day(now)}).

## Why this matters

The homepage, /about, and /support all show this number. Luma does not publish it for free, so a person types it in, and it drifts every time someone joins or leaves the Luma calendar.

## To resolve

1. Open the [PhilaCon Valley Luma calendar](${CALENDAR_URL}) as an admin. Select **Manage**, then **People**, and read the total.
2. In \`src/config.ts\`, set \`memberCount\` to that total.
3. Set \`memberCountUpdated\` to today's date.
4. Merge the change. This check runs every Monday and closes this issue by itself after the date moves.

_Opened by \`.github/workflows/luma-upcoming-check.yml\`._`;

console.log(`STALE: member count ${count} is ${ageDays} days old (limit ${MAX_AGE_DAYS}).`);

if (openIssue) {
  console.log(`Reminder issue #${openIssue} is already open. Updating its body.`);
  if (!DRY_RUN) gh('issue', 'edit', openIssue, '--repo', REPO, '--body', body);
} else if (DRY_RUN) {
  console.log(`[dry run] would open "${TITLE}":\n\n${body}`);
} else {
  console.log(
    gh('issue', 'create', '--repo', REPO, '--title', TITLE, '--label', LABEL, '--body', body),
  );
}
