/**
 * The four programs, shared by Home and About so the two pages never disagree
 * (Waskar, 10/16/2026). Lab and PATCH keep the Home mockup's copy; Community
 * projects and Career Support take the About mockup's copy. Career Support
 * runs today. Stoop is a social mixer, not a program, so each page shows it as
 * one line under the cards (`stoopLine`), not as a card.
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
    kind: 'Next step',
    body: "Résumé reviews, interview prep and introductions to companies, for when you're ready for the next step.",
    href: '/events',
    fill: 'bg-white',
    tag: 'bg-brand-coral',
  },
];
