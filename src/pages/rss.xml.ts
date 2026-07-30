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
  // The `redirects` block in vercel.json covers the URLs that were genuinely
  // published — `/blog` and `/blog/welcome/` — so anyone holding one lands on
  // /resources instead of a 404. It covers those and nothing else, deliberately.
  // The two cross-post slugs (`/blog/waskar-*`) never rendered an internal page:
  // posts with an `externalUrl` are linked straight to the external article, and
  // their internal route 404s on purpose (issue #83, still asserted in the skipped
  // e2e/blog-external-links.spec.ts). A URL that was never live has nobody to
  // redirect, and pointing philaconvalley.com at a personal Substack would also
  // blur two different publications together. So there is no catch-all rule here:
  // unpublished /blog/* paths 404, which is what a URL that never existed should do.
  //
  // These redirect *temporarily* (307, not 308) because the hiding is temporary —
  // a permanent redirect would sit in browser and proxy caches long after the
  // routes came back.
  //
  // Trailing slashes are load-bearing, and cost a round of debugging: Astro builds
  // directory-style URLs, so the URL that actually shipped and went out in the feed
  // was `/blog/welcome/`, WITH the slash. A Vercel `source` of `/blog` does not
  // match `/blog/`, and neither does `/blog/:slug*` — verified against a preview
  // deploy, where the slash forms 404'd while the slashless ones redirected fine.
  // Every rule needs both forms spelled out. If you add one, test it with AND
  // without the trailing slash on a preview URL; `astro preview` cannot exercise
  // vercel.json at all.
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
    //   link: b.data.externalUrl ?? `/blog/${b.id}/`,
    // })),
    ...resources.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: r.data.date,
      link: `/resources/${r.id}/`,
    })),
    ...projects.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/projects/${p.id}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'PhilaCon Valley',
    description: "Philadelphia's tech community by us, for us. Projects, tutorials, and resources.",
    site: context.site!,
    items,
  });
}
