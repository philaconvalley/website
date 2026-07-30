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
  }),
});

export const collections = {
  projects,
  resources,
  blog,
  gallery,
};
