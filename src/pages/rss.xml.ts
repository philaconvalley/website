import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const resources = await getCollection('resources');
  const projects = await getCollection('projects');
  const blog = await getCollection('blog');

  const items = [
    ...blog.map((b) => ({
      title: b.data.title,
      description: b.data.description,
      pubDate: b.data.date,
      link: `/blog/${b.slug}/`,
    })),
    ...resources.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: r.data.date,
      link: `/resources/${r.slug}/`,
    })),
    ...projects.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/projects/${p.slug}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'PhilaCon Valley',
    description: "Philadelphia's tech community by us, for us. Projects, tutorials, and resources.",
    site: context.site!,
    items,
  });
}
