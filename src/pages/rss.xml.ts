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
  //
  // Because those URLs were live and syndicated, the ones already in the wild are
  // redirected rather than left to 404 — see the `redirects` block in vercel.json.
  //
  // Trailing slashes there are load-bearing, and cost us a round of debugging:
  // Astro builds directory-style URLs, so the URL that actually shipped and went
  // out in the feed was `/blog/welcome/`, WITH the slash. A Vercel `source` of
  // `/blog` does not match `/blog/`, and neither does `/blog/:slug*` — verified
  // against a preview deploy, where the slash forms 404'd while the slashless ones
  // redirected fine. Every rule needs both forms, or a `(.*)` pattern that eats the
  // slash. If you add a rule here, test it with AND without the trailing slash on a
  // preview URL; `astro preview` cannot exercise vercel.json at all.
  // The two cross-posts redirect permanently, since Substack has always been their
  // canonical home. /blog and /blog/<slug>/ redirect *temporarily* (307, not 308)
  // precisely because this hiding is temporary: a permanent redirect would sit in
  // browser and proxy caches long after the routes came back.
  //
  // To reinstate, all three of:
  //   1. restore this block,
  //   2. `git mv src/pages/_blog src/pages/blog`,
  //   3. remove the /blog entries from `redirects` in vercel.json — otherwise the
  //      restored routes are shadowed by a redirect and never render.
  // Also re-add '/blog' to PAGES in e2e/csp.spec.ts and unskip
  // e2e/blog-external-links.spec.ts.
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
