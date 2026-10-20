/**
 * The four programs, shown on Events (src/components/ProgramCards.astro; Home
 * and About dropped them in the site audit, 10/18/2026). Lab and PATCH keep
 * the Home mockup's copy; Community projects takes the About mockup's copy.
 * Stoop is a social mixer, not a program, so it shows as one line under the
 * cards. Career Support is
 * coming soon (Waskar, 10/16/2026): its card has a dashed outline and no link.
 */
export interface Program {
  name: string;
  /** The small tag above the name. */
  kind: string;
  body: string;
  href: string;
  /** Card fill and tag fill, as Tailwind classes. */
  fill: string;
  tag: string;
  /** Not running yet: a dashed card with no link. */
  comingSoon?: boolean;
}

export const programs: Program[] = [
  {
    name: 'PATCH',
    kind: 'Workshop lab',
    body: 'Multi-disciplinary nights where design, code and creative tech share a room. Recent PATCHes covered NFC tags and projection mapping.',
    href: '/events',
    fill: 'bg-brand-yellow',
    tag: 'bg-white',
  },
  {
    name: 'Lab',
    kind: 'Single topic',
    body: 'One subject, one night, start to finish. You show up curious and leave having shipped something.',
    href: '/events',
    fill: 'bg-white',
    tag: 'bg-brand-amber',
  },
  {
    name: 'Community projects',
    kind: 'Open source',
    body: 'Tools the community actually uses, built together, and yours to put in your portfolio.',
    href: '/projects',
    fill: 'bg-white',
    tag: 'bg-brand-pink',
  },
  {
    name: 'Career Support',
    kind: 'Coming soon',
    body: "Sessions for the next step after your first project. We'll share more once the first one is on the calendar.",
    href: '',
    fill: 'bg-white',
    tag: 'bg-brand-dark text-white',
    comingSoon: true,
  },
];
