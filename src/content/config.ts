import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    techStack: z.array(z.string()),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    contributors: z.array(z.string()),
    status: z.enum(['active', 'completed']),
    date: z.date(),
  }),
});

const resources = defineCollection({
  type: 'content',
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

export const collections = {
  projects,
  resources,
};
