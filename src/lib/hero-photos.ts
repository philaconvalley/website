import { getCollection } from 'astro:content';

export interface HeroPhoto {
  src: string;
  alt: string;
  srcset: string;
}

/**
 * Every hero-eligible gallery photo, for the Home hero. The first one is the
 * photo the HTML ships (no-JS and search see a real photo). The served script
 * /js/hero-photo.js picks one at random per visit from the same list, so
 * returning visitors see more of the room (decided 10/15/2026).
 *
 * Both Home and the script read this one list. The script gets it at build
 * time, not from the page, so nothing in the DOM reaches an image URL (CodeQL
 * js/xss-through-dom, launch PR #213).
 */
export async function getHeroPhotos(): Promise<HeroPhoto[]> {
  return (
    (await getCollection('gallery'))
      .filter((entry) => entry.data.heroEligible)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((entry) => ({ id: entry.id, src: entry.data.image, alt: entry.data.alt }))
      // DESIGN.md names the projection wall as the hero; it leads the list, so
      // it is the photo no-JS visitors and search engines see.
      .sort(
        (a, b) =>
          Number(b.id === 'patch-003-projection-wall') -
          Number(a.id === 'patch-003-projection-wall'),
      )
      .map(({ src, alt }) => ({
        src,
        alt,
        // 800px copies sit beside each original (src/content/gallery images).
        srcset: `${src.replace(/\.jpg$/, '-800.jpg')} 800w, ${src} 1600w`,
      }))
  );
}
