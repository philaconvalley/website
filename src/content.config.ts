import { defineCollection } from 'astro:content';
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

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/gallery' }),
  schema: z.object({
    image: z.string(),
    alt: z.string(),
    event: z.string(),
    date: z.date(),
    caption: z.string().optional(),
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
    input: z.array(z.enum(['keyboard', 'pointer', 'touch'])).nonempty(),
    fixedSize: z.object({ w: z.number(), h: z.number() }).optional(),
    controls: z.array(z.object({ keys: z.array(z.string()), label: z.string() })),
    date: z.date(),
  }),
});

export const collections = {
  projects,
  resources,
  blog,
  gallery,
  arcade,
};
