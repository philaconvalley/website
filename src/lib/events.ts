import { getEntry, type CollectionEntry } from 'astro:content';

export interface PhotoWithEvent {
  photo: CollectionEntry<'gallery'>;
  event: CollectionEntry<'events'>;
}

/**
 * Pairs every gallery photo with its event file, and fails the build when the
 * file is missing.
 *
 * This check exists because Astro does not enforce it. In Astro 7, a reference
 * to a missing entry is noticed during content sync, but Astro only logs
 * "[ERROR] [content] Invalid content reference" and the build still exits 0.
 * getEntry() then answers `undefined`. Tested 2026-10-12 on astro 7.3.6: with
 * this check off and no page reading the event, `event: patch-02` deployed.
 *
 * /events renders every photo on every build, so calling this there checks the
 * whole gallery each time. It proves the event exists, not that it is the right
 * one: a photo tagged with a real but wrong event still passes, and only review
 * catches that.
 */
export async function resolvePhotoEvents(
  photos: CollectionEntry<'gallery'>[],
): Promise<PhotoWithEvent[]> {
  return Promise.all(
    photos.map(async (photo) => {
      const event = await getEntry(photo.data.event);
      if (!event) {
        throw new Error(
          `Gallery photo "${photo.id}" points at event "${photo.data.event.id}", ` +
            `but src/content/events/${photo.data.event.id}.md does not exist.`,
        );
      }
      return { photo, event };
    }),
  );
}

export function formatRecapDate(date: Date): string {
  // Frontmatter dates parse as UTC midnight. Format in UTC too, or a build machine
  // west of Greenwich prints the day before the event into the static HTML.
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
