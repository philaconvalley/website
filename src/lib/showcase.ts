import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * The live entries of the team, partners, and case-study collections.
 *
 * A build shows only entries someone said yes to (`published` or `approved`).
 * `astro dev` also shows drafts, each marked with a "Draft" badge, so a
 * section can be reviewed before any approval arrives. `import.meta.env.DEV`
 * is false in every `astro build`, including Vercel previews, so a draft can
 * never reach a deployed page through this path.
 */

type ShowcaseCollection = 'team' | 'partners' | 'caseStudies';

export const showDrafts = import.meta.env.DEV;

export function isLive(entry: { data: { status: string } }): boolean {
  return entry.data.status !== 'draft';
}

export async function getShowcase<C extends ShowcaseCollection>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return entries
    .filter((entry) => showDrafts || isLive(entry))
    .sort((a, b) => sortKey(a) - sortKey(b) || a.id.localeCompare(b.id));
}

/**
 * Whether /studio exists. The page is the proof a buyer needs, so it goes live
 * only with at least one approved client story; a page of claims with no
 * proof is the brochure it is meant to replace (Waskar, 10/18/2026). Until
 * then the nav hides it and "hire us" buttons go to /contact. In `astro dev`
 * a draft story is enough, so the page can be reviewed.
 */
export async function isStudioLive(): Promise<boolean> {
  return (await getShowcase('caseStudies')).length > 0;
}

/** Where a "hire us" button goes: /studio once it is live, /contact before. */
export async function getHireLink(): Promise<{ href: string; label: string }> {
  return (await isStudioLive())
    ? { href: '/studio', label: 'See the studio' }
    : { href: '/contact', label: 'Start a project' };
}

function sortKey(entry: CollectionEntry<ShowcaseCollection>): number {
  // Case studies sort newest first; team and partners by their `order` field.
  if ('order' in entry.data) return entry.data.order;
  return -entry.data.date.getTime();
}

/**
 * A crew member's public title: "Crew · " and their plain job title, the
 * format agreed in the Team Structure Design (Waskar, 10/23/2026). The YAML
 * holds the plain title only, so the format lives in this one place.
 */
export function crewTitle(title: string): string {
  return `Crew · ${title}`;
}
