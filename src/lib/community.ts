/**
 * Build-time community data.
 *
 * The redesigned homepage makes four factual claims — the next event, nights
 * held, things shipped, and how many people are in the community. Three of them
 * change without anyone touching this repo, so they are fetched from the systems
 * that actually own them:
 *
 *   - next event + nights held  -> the public Luma ICS feed (no auth, no key)
 *   - things shipped            -> the public GitHub org API (no auth)
 *   - member count              -> NOT publicly available. See config.community.
 *
 * Two rules govern the fetching, and both exist for a reason worth keeping:
 *
 * 1. A slow or unreachable third party must never block a deploy. `astro build`
 *    runs on every push; if this module waited on Luma, then Luma's uptime would
 *    gate our ability to ship a security header fix or a typo correction. Each
 *    request gets a short timeout and nothing retries.
 *
 * 2. When a fetch fails we fall back to the last-known-good snapshot committed
 *    at src/data/community-snapshot.json — real numbers this repo has actually
 *    seen — and warn loudly. The page is never wrong by invention, and it is
 *    never blocked. Refresh the snapshot with `npm run data:refresh`.
 *
 * Because the site is `output: static`, these values are frozen into HTML at
 * build time. They refresh when the site rebuilds, not when Luma changes. A
 * scheduled Vercel deploy hook is what would make that automatic.
 */

import snapshotJson from '../data/community-snapshot.json';
import { links } from '../config';

/** Third parties get this long to answer, once, with no retry. */
const FETCH_TIMEOUT_MS = 5000;

export interface CommunityEvent {
  /** Event title exactly as it reads on Luma. */
  title: string;
  /** ISO 8601 UTC start time. */
  start: string;
  /** Venue name only — the street address is dropped. Null for online events. */
  venue: string | null;
  /** Direct Luma link for this event, falling back to the calendar. */
  url: string;
}

export interface DiscordPreview {
  name: string;
  iconUrl: string | null;
  memberCount: number;
  onlineCount: number;
}

export interface CommunityData {
  nextEvent: CommunityEvent | null;
  /** Events on the calendar whose start time has already passed. */
  nightsHeld: number;
  /** Public org repos with a live deployed URL. */
  thingsShipped: number;
  /**
   * What to show on the join page so a visitor sees a real room, not a blind
   * link. Never null — unlike the other fields there is always a snapshot to
   * fall back to, since `discord` is a required key on `CommunitySnapshot`.
   */
  discord: DiscordPreview;
  /** True when every number came from a live fetch. */
  fresh: boolean;
}

/**
 * The shape `scripts/refresh-community-data.mjs` writes.
 *
 * Annotated rather than inferred on purpose. Inferred from the JSON, `nextEvent`
 * narrows to whichever of object-or-null happens to be committed today, so the
 * moment the script writes `"nextEvent": null` — which it does by design between
 * a calendar's last event and the next one being posted — `astro check` fails on
 * the null branch below and no deploy can ship until someone hand-edits generated
 * data. The annotation states the contract the producer actually honours, and is
 * a real assignability check: if the snapshot's fields ever drift, this errors
 * here instead of somewhere downstream.
 */
interface CommunitySnapshot {
  nextEvent: CommunityEvent | null;
  nightsHeld: number;
  thingsShipped: number;
  discord: DiscordPreview;
}

const snapshot: CommunitySnapshot = snapshotJson;

/**
 * Unfolds RFC 5545 line folding. Long ICS values wrap at 75 octets and continue
 * on the next line prefixed by a single space or tab; a naive line-by-line parse
 * silently truncates every long SUMMARY and LOCATION.
 */
function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/** `20260730T220000Z` -> Date. Returns null for anything else. */
function parseIcsDate(value: string): Date | null {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
}

/**
 * `Pennovation Center, 3401 Grays Ferry Ave, Philadelphia, PA 19146, USA`
 * -> `Pennovation Center`. A URL means the event is online, so there is no venue.
 */
function parseVenue(location: string): string | null {
  const trimmed = location.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return null;
  return trimmed.split(',')[0].trim() || null;
}

function parseIcs(
  ics: string,
): { title: string; start: Date; venue: string | null; url: string }[] {
  const events: { title: string; start: Date; venue: string | null; url: string }[] = [];

  for (const block of unfold(ics).split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const field = (name: string) =>
      new RegExp(`^${name}[^:\\r\\n]*:(.*)$`, 'm').exec(body)?.[1]?.trim() ?? '';

    const start = parseIcsDate(field('DTSTART'));
    const title = field('SUMMARY');
    if (!start || !title) continue;

    // Luma puts the public event page in the DESCRIPTION, and for online events
    // in LOCATION too. Either is a better RSVP target than the calendar root.
    const description = field('DESCRIPTION');
    const url =
      /(https:\/\/(?:lu\.ma|luma\.com)\/[^\s\\]+)/.exec(description)?.[1] ??
      /(https:\/\/(?:lu\.ma|luma\.com)\/[^\s\\]+)/.exec(field('LOCATION'))?.[1] ??
      links.luma;

    events.push({ title, start, venue: parseVenue(field('LOCATION')), url });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

async function fetchText(url: string, label: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'philaconvalley-website-build' },
    });
    if (!response.ok) {
      console.warn(`[community] ${label} returned HTTP ${response.status} — using snapshot.`);
      return null;
    }
    return await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[community] ${label} unreachable (${reason}) — using snapshot.`);
    return null;
  }
}

/** Next event + count of past events, from the public Luma calendar. */
async function fetchLuma(now: Date) {
  const ics = await fetchText(links.lumaIcs, 'Luma ICS');
  if (!ics) return null;

  const events = parseIcs(ics);
  if (events.length === 0) {
    console.warn('[community] Luma ICS parsed to zero events — using snapshot.');
    return null;
  }

  const upcoming = events.find((event) => event.start.getTime() > now.getTime()) ?? null;

  return {
    nightsHeld: events.filter((event) => event.start.getTime() <= now.getTime()).length,
    nextEvent: upcoming
      ? {
          title: upcoming.title,
          start: upcoming.start.toISOString(),
          venue: upcoming.venue,
          url: upcoming.url,
        }
      : null,
  };
}

/**
 * What counts as one of the org's public projects.
 *
 * Exported and shared with src/pages/projects/index.astro deliberately. Both
 * surfaces answer the same question about the same endpoint, and they used to
 * answer it differently: this one additionally required a non-empty `homepage`,
 * so the homepage announced "2 things shipped, so far" while /projects listed six
 * of them. A visitor who read the headline number and then clicked through saw the
 * site contradict itself. One predicate in one place is the only version of this
 * that cannot drift again.
 *
 * Note what this does NOT filter on: a deployed URL. "Shipped" here means the work
 * is public and live in the org, not that it has a hosted front end — a Discord
 * bot and a Chrome extension ship without a homepage field.
 *
 * Takes `unknown` because the GitHub response is untrusted input; narrowing happens
 * here, at the boundary, rather than with a cast at each call site.
 */
export function isPublicOrgProject(repo: unknown): boolean {
  if (typeof repo !== 'object' || repo === null) return false;
  const r = repo as { name?: unknown; archived?: unknown; fork?: unknown };
  return typeof r.name === 'string' && !r.name.startsWith('.') && !r.archived && !r.fork;
}

/**
 * Things shipped = public org repos, counted by the shared predicate above.
 *
 * Sourcing this from the GitHub *org* rather than a hand-kept list is what keeps
 * client work out of a public counter structurally instead of by discipline:
 * paid engagements live in private repos outside this org, so they can never be
 * counted here regardless of who edits the homepage later.
 */
async function fetchShipped(): Promise<number | null> {
  const body = await fetchText(
    'https://api.github.com/orgs/philaconvalley/repos?per_page=100&type=public',
    'GitHub org API',
  );
  if (!body) return null;

  try {
    const repos: unknown = JSON.parse(body);
    if (!Array.isArray(repos)) {
      console.warn('[community] GitHub API returned a non-array — using snapshot.');
      return null;
    }
    return repos.filter(isPublicOrgProject).length;
  } catch {
    console.warn('[community] GitHub API returned unparseable JSON — using snapshot.');
    return null;
  }
}

/**
 * The invite code is the one stable identifier in a Discord invite URL — the
 * server ID and icon hash both come back from the API response itself, so
 * only the code needs to be pulled out of `links.discord` here.
 */
const DISCORD_INVITE_CODE = links.discord.split('/').pop() ?? '';

/**
 * A live member/online count for the join page, pulled from Discord's public
 * invite endpoint — no bot token, no auth, no server-side "widget" toggle
 * required, unlike the guild widget API. Requires only that the invite code
 * in `links.discord` still resolves.
 */
async function fetchDiscord(): Promise<DiscordPreview | null> {
  if (!DISCORD_INVITE_CODE) return null;

  const body = await fetchText(
    `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
    'Discord invite API',
  );
  if (!body) return null;

  try {
    const data: unknown = JSON.parse(body);
    if (typeof data !== 'object' || data === null) return null;
    const d = data as {
      guild?: { id?: unknown; name?: unknown; icon?: unknown };
      approximate_member_count?: unknown;
      approximate_presence_count?: unknown;
    };
    const guildId = d.guild?.id;
    const name = d.guild?.name;
    const icon = d.guild?.icon;
    const memberCount = d.approximate_member_count;
    const onlineCount = d.approximate_presence_count;

    if (
      typeof guildId !== 'string' ||
      typeof name !== 'string' ||
      typeof memberCount !== 'number' ||
      typeof onlineCount !== 'number'
    ) {
      console.warn('[community] Discord invite API returned an unexpected shape — using snapshot.');
      return null;
    }

    return {
      name,
      iconUrl:
        typeof icon === 'string' ? `https://cdn.discordapp.com/icons/${guildId}/${icon}.png` : null,
      memberCount,
      onlineCount,
    };
  } catch {
    console.warn('[community] Discord invite API returned unparseable JSON — using snapshot.');
    return null;
  }
}

/**
 * Memoised for the lifetime of the build. The header renders on all ~13 pages,
 * so without this a single `astro build` would make 26 outbound requests for one
 * set of numbers — enough to matter against GitHub's 60/hour unauthenticated
 * rate limit, and enough to make Luma's latency a per-page tax.
 */
let inflight: Promise<CommunityData> | null = null;

export function getCommunityData(now: Date = new Date()): Promise<CommunityData> {
  inflight ??= resolveCommunityData(now);
  return inflight;
}

/**
 * Floors a live count against the snapshot.
 *
 * Nights held and things shipped only ever grow, so a live zero is far likelier
 * to be upstream breakage — the org renamed, the repos flipped private, an ICS
 * that stopped emitting past events — than the truth. Both `shipped ?? snapshot`
 * and `luma ? luma.nightsHeld : snapshot` publish that zero, since neither `??`
 * nor a non-null check treats 0 as missing. That is the "wrong by invention" the
 * snapshot exists to prevent, so a zero falls back, loudly.
 */
function atLeastSnapshot(live: number | null, fallback: number, label: string): number {
  if (live === null) return fallback;
  if (live === 0 && fallback > 0) {
    console.warn(
      `[community] ${label} came back 0 against a snapshot of ${fallback} — using snapshot.`,
    );
    return fallback;
  }
  return live;
}

/**
 * Resolves every live number, falling back per-source to the committed snapshot.
 * The fallback is deliberately per-source: if GitHub is down but Luma is up,
 * only the shipped count goes stale.
 */
async function resolveCommunityData(now: Date): Promise<CommunityData> {
  const [luma, shipped, discord] = await Promise.all([
    fetchLuma(now),
    fetchShipped(),
    fetchDiscord(),
  ]);

  // A stale next-event date is worse than none: an RSVP bar advertising a night
  // that already happened actively misinforms. Counts age gracefully; a date
  // does not, so the snapshot's event is only trusted while it is still future.
  const snapshotEvent =
    snapshot.nextEvent && new Date(snapshot.nextEvent.start).getTime() > now.getTime()
      ? snapshot.nextEvent
      : null;

  // Same zero-regression guard as nights held and things shipped: a live 0
  // against a snapshot with real members means the invite broke or the API
  // shape changed upstream, not that the server emptied out overnight.
  const discordMemberCount = atLeastSnapshot(
    discord?.memberCount ?? null,
    snapshot.discord.memberCount,
    'Discord member count',
  );
  const resolvedDiscord =
    discord && discordMemberCount === discord.memberCount ? discord : snapshot.discord;

  return {
    nextEvent: luma ? luma.nextEvent : snapshotEvent,
    nightsHeld: atLeastSnapshot(luma ? luma.nightsHeld : null, snapshot.nightsHeld, 'nights held'),
    thingsShipped: atLeastSnapshot(shipped, snapshot.thingsShipped, 'things shipped'),
    discord: resolvedDiscord,
    fresh: luma !== null && shipped !== null && discord !== null,
  };
}

/** `Thu Jul 30 · 6:00pm`, always in Philadelphia's timezone. */
export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  // `en-US` yields "Thu, Jul 30"; the design sets this line without the comma.
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
    .format(date)
    .replace(',', '');
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
    .format(date)
    .replace(' AM', 'am')
    .replace(' PM', 'pm');

  return `${day} · ${time}`;
}
