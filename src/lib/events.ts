import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { existsSync } from 'node:fs';

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

/**
 * The srcset for a gallery photo. Wide photos have an 800px copy beside the
 * original; the PATCH 002 photos are small portraits and have none. The copy is
 * offered only when it exists, so a phone never requests a missing file.
 */
export function photoSrcset(src: string): string | undefined {
  const small = src.replace(/\.jpg$/, '-800.jpg');
  return existsSync(`public${small}`) ? `${small} 800w, ${src} 1600w` : undefined;
}

/**
 * A row of photos from the room for Home and Support (site audit, 10/18/2026:
 * "the best proof is hidden"). Newest night first, then one photo from each
 * night in turn, so the row shows more than one night. Within a night, the
 * gallery's own order (newest file date, then filename) holds.
 *
 * `skip` passes over the first photos in that order, so two pages can show
 * different rows (second Steve Jobs review, 10/18/2026: Home and Support
 * showed the same four photos).
 */
export async function getRoomPhotos(
  count: number,
  skip = 0,
): Promise<{ image: string; alt: string; caption: string }[]> {
  const photos = (await getCollection('gallery')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
  const nights = new Map<string, CollectionEntry<'gallery'>[]>();
  for (const photo of photos) {
    const night = nights.get(photo.data.event.id) ?? [];
    night.push(photo);
    nights.set(photo.data.event.id, night);
  }
  const picked: CollectionEntry<'gallery'>[] = [];
  const queues = [...nights.values()];
  while (picked.length < skip + count && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && picked.length < skip + count) picked.push(next);
    }
  }
  return picked
    .slice(skip)
    .map(({ data }) => ({ image: data.image, alt: data.alt, caption: data.caption }));
}
