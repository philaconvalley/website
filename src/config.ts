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

export const links = {
  luma: 'https://lu.ma/philaconvalley',
  lumaEmbed: 'https://luma.com/embed/calendar/cal-KkQjuykLZNrSChl/events',
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
