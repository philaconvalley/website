/**
 * Central site configuration.
 * All external integration URLs and identifiers live here so they can be
 * updated in one place instead of scattered across dozens of components.
 */

export const site = {
  name: 'PhilaCon Valley',
  email: 'waskar@philaconvalley.com',
  location: 'Philadelphia, PA',
} as const;

/**
 * Community numbers shown on the homepage.
 *
 * Nights held, the next event, and things shipped are NOT here — they are
 * fetched at build time from Luma and GitHub by src/lib/community.ts, because
 * those systems own the truth and change without anyone touching this repo.
 *
 * The member count is the one number with no public source. Luma exposes only
 * per-event `guest_count` publicly; a calendar-wide total lives behind the
 * `/v1/calendars/contacts-list` endpoint, which requires a paid Luma Plus
 * subscription. Until we are on that plan this is maintained by hand.
 *
 * Update it from the Luma dashboard, and move the date when you do so the
 * staleness is visible in the diff rather than invisible on the page.
 */
export const community = {
  memberCount: 425,
  memberCountUpdated: '2026-07-28',
} as const;

export const links = {
  /** Main community channel. Slack stays up only for international members. */
  discord: 'https://discord.gg/5haHYh5xcx',
  luma: 'https://lu.ma/philaconvalley',
  lumaEmbed: 'https://luma.com/embed/calendar/cal-KkQjuykLZNrSChl/events',
  /** Public, unauthenticated calendar feed — the source for events and nights held. */
  lumaIcs: 'https://api.lu.ma/ics/get?entity=calendar&id=cal-KkQjuykLZNrSChl',
  openCollective: 'https://opencollective.com/philacon-valley',
  formspree: 'https://formspree.io/f/xovklgrn',
  github: {
    org: 'https://github.com/philaconvalley',
    website: 'https://github.com/philaconvalley/website',
  },
  social: {
    instagram: 'https://www.instagram.com/phlconvalley/',
    linkedin: 'https://www.linkedin.com/company/philaconvalley/',
    twitter: 'https://x.com/PhlConValley',
  },
} as const;
