import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 7 deprecates re-exporting `z` from astro:content; import it from astro/zod
// so this does not become an error in the next major.
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    techStack: z.array(z.string()),
    githubUrl: z.url().optional(),
    liveUrl: z.url().optional(),
    contributors: z.array(z.string()),
    status: z.enum(['active', 'completed']),
    date: z.date(),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['Workshop', 'Tutorial', 'Career', 'Tool']),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    author: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    externalUrl: z.url().optional(),
    platform: z
      .enum(['Substack', 'Medium', 'YouTube', 'Dev.to', 'LinkedIn', 'Podcast', 'Other'])
      .optional(),
  }),
});

/**
 * Recaps of events that already happened, one file per event.
 *
 * Title, date, and venue are copied from Luma once, when the recap is written,
 * instead of being looked up from the ICS feed on every build. That is safe only
 * because a past event cannot change: the copy can never drift from Luma, and the
 * old pages keep building when Luma is down. Upcoming events still come live from
 * Luma (src/lib/community.ts) — do not add them here, because a rescheduled date
 * would leave this copy wrong.
 */
const events = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    venue: z.string(),
    lumaUrl: z.url().optional(),
    // One sentence for cards and the meta description. Written by a person:
    // no feed knows what people left the room with.
    summary: z.string(),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/gallery' }),
  schema: z.object({
    image: z.string(),
    alt: z.string(),
    /**
     * The event file this photo belongs to: the filename of an entry in
     * src/content/events/, without `.md`.
     *
     * A missing file does not fail the build on its own. Astro 7 notices it, but
     * only logs "[ERROR] [content] Invalid content reference" and exits 0, so a
     * typo would deploy with the photo's event silently gone. resolvePhotoEvents()
     * in src/lib/events.ts turns it into a real build failure.
     */
    event: reference('events'),
    date: z.date(),
    /**
     * A short line about this one photo, shown under it on the recap page and
     * in the room strips. Required (site audit, 10/18/2026): with no caption,
     * every photo fell back to its event title, so a page of twelve photos
     * said "PATCH 003: Projection Mapping Lab" twelve times.
     */
    caption: z.string().min(1),
    /**
     * Whether this shot can carry the homepage's full-bleed band.
     *
     * That band renders up to ~1400px wide, so it needs a wide, high-resolution
     * frame. The grid on /events only needs ~400px tiles and takes a phone
     * portrait happily. Without this flag the homepage shows whichever photo is
     * newest, which is how a soft 768px portrait becomes the largest image on
     * the site. Opt-in, so the wrong default is "stays in the grid".
     */
    heroEligible: z.boolean().default(false),
  }),
});

const arcade = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/arcade' }),
  schema: z.object({
    title: z.string(),
    contributors: z.array(z.string()),
    description: z.string(),
    // Required, and required to be real prose: canvas games are opaque to
    // screen readers and no amount of page markup fixes that. This is the
    // description of the game for someone who cannot see or play it.
    longDescription: z.string(),
    slug: z.string(),
    thumbnail: z.string(),
    // Authored, never generated. The capture script can produce the image; it
    // cannot describe it. Mirrors the required `alt` on the gallery collection.
    thumbnailAlt: z.string(),
    ogImage: z.string(),
    marqueeColor: z.enum(['pink', 'purple', 'yellow', 'coral']),
    kind: z.enum(['game', 'demo']),
    // An optional chip for the Arcade card, set by the game's author (Waskar,
    // 10/16/2026). "Desktop only" and "Demo · No score" come from `input` and
    // `kind`; anything else, like "High score", must be stated here, never
    // guessed by the page.
    tag: z.string().optional(),
    input: z.array(z.enum(['keyboard', 'pointer', 'touch'])).nonempty(),
    fixedSize: z.object({ w: z.number(), h: z.number() }).optional(),
    controls: z.array(z.object({ keys: z.array(z.string()), label: z.string() })),
    date: z.date(),
  }),
});

/**
 * The three collections below show people and organizations who must say yes
 * before they appear: the team, partners, and client case studies (Diego's
 * site feedback, 10/17/2026). Each entry starts as `draft` and the site hides
 * it until someone flips `status`. The schemas refuse a live entry that is
 * missing what it needs (a photo, a logo, a record of the yes), so a
 * half-filled card fails the build instead of shipping.
 *
 * This repo is public. A draft file is visible on GitHub even though the site
 * hides it, so a partner or client draft that names someone before they agree
 * belongs in a `preview-*` file, which .gitignore keeps on your machine.
 * Copy the `_example` file in each folder to start one.
 */

// Who said yes, when, and how. Kept short on purpose: the full record lives in
// the org's files, not in a public repo. Example: "Email, 2026-10-20".
const approval = z.object({
  date: z.date(),
  source: z.string(),
});

const team = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{yaml,yml}', base: './src/content/team' }),
  schema: z
    .object({
      name: z.string(),
      title: z.string(),
      bio: z.string().optional(),
      photo: z.string().optional(),
      photoAlt: z.string().optional(),
      // The person's own sites, shown on their bio page. Only links the
      // person shared for the site.
      links: z.array(z.object({ label: z.string(), url: z.url() })).optional(),
      // Lower numbers come first.
      order: z.number().default(100),
      status: z.enum(['draft', 'published']).default('draft'),
    })
    .refine((m) => m.status === 'draft' || (m.photo && m.photoAlt && m.bio), {
      message: 'A published team member needs photo, photoAlt, and bio.',
    }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{yaml,yml}', base: './src/content/partners' }),
  schema: z
    .object({
      name: z.string(),
      // What the partner does with us, in a few words: "Venue partner".
      role: z.string(),
      url: z.url().optional(),
      logo: z.string().optional(),
      order: z.number().default(100),
      status: z.enum(['draft', 'approved']).default('draft'),
      approval: approval.optional(),
    })
    .refine((p) => p.status === 'draft' || (p.logo && p.approval), {
      message: 'An approved partner needs a logo and an approval record.',
    }),
});

// One image of a client's site, with its alt text. Alt is required: a
// screenshot is the proof on /studio, and a screen reader user needs it too.
const shot = z.object({ image: z.string(), alt: z.string() });

/**
 * Client work on /studio (Waskar, 10/18/2026). No essay: each entry is the
 * proof a buyer needs at a glance. The client's site, before and after; the
 * client's own words; and what the project paid for. The page that sells is
 * the client's live site, so `liveUrl` links straight to it.
 */
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{yaml,yml}', base: './src/content/case-studies' }),
  schema: z
    .object({
      client: z.string(),
      // Which studio offer this proves: we build (sites, apps, tools), we teach
      // (workshops, trainings, series), or we host (events and activations;
      // added 10/18/2026).
      offer: z.enum(['build', 'teach', 'host']),
      // One sentence about what changed for the client, in plain words.
      line: z.string(),
      date: z.date(),
      liveUrl: z.url().optional(),
      before: shot.optional(),
      after: shot.optional(),
      testimonial: z.object({ quote: z.string(), name: z.string(), role: z.string() }).optional(),
      // Free build nights this project paid for. Only a real, counted number:
      // the page says it to funders, so it must survive a question.
      nightsFunded: z.number().int().positive().optional(),
      status: z.enum(['draft', 'approved']).default('draft'),
      approval: approval.optional(),
    })
    .refine((c) => c.status === 'draft' || c.approval, {
      message: 'An approved case study needs an approval record.',
    })
    .refine((c) => c.status === 'draft' || c.after || c.testimonial, {
      message: 'An approved case study needs an after image or a testimonial to show.',
    }),
});

export const collections = {
  projects,
  resources,
  blog,
  events,
  gallery,
  arcade,
  team,
  partners,
  caseStudies,
};
