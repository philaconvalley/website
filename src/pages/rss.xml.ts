import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const resources = await getCollection('resources');
  const projects = await getCollection('projects');

  // The blog is off the air until we have an actual editorial procedure. Its
  // routes live in src/pages/_blog/ (underscore = excluded from routing), and
  // its posts are pulled out of the feed here so subscribers do not keep
  // receiving entries for a section the site no longer publishes.
  // To reinstate: restore this block and `git mv src/pages/_blog src/pages/blog`.
  // const blog = await getCollection('blog');

  const items = [
    // ...blog.map((b) => ({
    //   title: b.data.title,
    //   description: b.data.description,
    //   pubDate: b.data.date,
    //   link: b.data.externalUrl ?? `/blog/${b.slug}/`,
    // })),
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
