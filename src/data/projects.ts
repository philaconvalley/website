/**
 * Display copy for the repo cards on /projects (Waskar, 10/16/2026).
 *
 * The list of repos is NOT kept here. It comes live from the GitHub org at build
 * time (src/lib/projects.ts), so a new public repo appears on its own, with its
 * GitHub description and language, until someone adds it below. This file only
 * makes the cards read well: a display name, one line, and one or two tags.
 *
 * Copy follows Diego's mockup, with the repo names corrected to the real ones
 * (`community-handbook`, `shoppingDebateChromeExtension`). Every line must stay
 * true to the repo it describes.
 */
export interface ProjectCopy {
  title: string;
  blurb: string;
  tags: string[];
}

export const projectCopy: Record<string, ProjectCopy> = {
  website: {
    title: 'Website',
    blurb: "The site you're on. Philadelphia's tech community home, open for anyone to improve.",
    tags: ['Astro', 'Tailwind', 'Alpine.js'],
  },
  projectionMapper: {
    title: 'projectionMapper',
    blurb: 'A projection mapping starter template, built for PATCH 003: Projection Mapping Lab.',
    tags: ['p5.js', 'PATCH 003'],
  },
  'community-handbook': {
    title: 'Community Handbook',
    blurb: 'Where our philosophy, values, principles and governance live, written in the open.',
    tags: ['Docs', 'Governance'],
  },
  djVisualizer: {
    title: 'djVisualizer',
    blurb: 'A real-time audio visualizer and effects processor for DJs.',
    tags: ['Web Audio API'],
  },
  'owlhacks-timer': {
    title: 'owlhacks-timer',
    blurb: "A countdown timer for hackathon demos, built live at OwlHacks '26.",
    tags: ['Built live'],
  },
  'locked-groove': {
    title: 'locked-groove',
    blurb:
      'An open-source engine for continuous visual internet radio, where every listener stays synced to the same second.',
    tags: ['Streaming'],
  },
  'door-checkin': {
    title: 'door-checkin',
    blurb: 'Tap an NFC tag at the door, post a Discord notification, and land on a welcome page.',
    tags: ['NFC', 'Webhook'],
  },
  'discord-task-bot': {
    title: 'discord-task-bot',
    blurb:
      'Task assignments, due-date reminders and Scheduled Event creation, right inside Discord.',
    tags: ['Discord bot'],
  },
  shoppingDebateChromeExtension: {
    title: 'Shopping Debate',
    blurb:
      'A Chrome extension where three AI personalities argue about your purchase before you check out.',
    tags: ['Chrome extension', 'AI'],
  },
};
