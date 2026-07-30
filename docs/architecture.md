# Architecture

This doc explains how the site is built and how the pieces fit together. It's for contributors who want to understand the codebase before making changes.

## Tech Stack

| Tool                                             | What it does                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Astro 7.x](https://astro.build)                 | Generates all the HTML pages at build time (no server needed at runtime)           |
| [Tailwind CSS 3](https://tailwindcss.com)        | Utility-first CSS framework — styles are written as class names directly in HTML   |
| [Alpine.js 3.15](https://alpinejs.dev)           | Tiny JavaScript library for interactive bits (mobile menu, form handling, filters) |
| [TypeScript](https://www.typescriptlang.org)     | Adds type checking to catch bugs before they ship                                  |
| [Vercel](https://vercel.com)                     | Hosts the site and auto-deploys when code is pushed to `main`                      |
| [Vercel Analytics](https://vercel.com/analytics) | Privacy-friendly usage analytics                                                   |

### Why Astro?

Astro builds static HTML at build time — no JavaScript is sent to the browser unless explicitly needed (like Alpine.js for the mobile menu). This makes the site very fast and cheap to host. Pages are `.astro` files that look like HTML with some extra features.

## Project Structure

```
src/
├── config.ts              # All external URLs (Luma, Formspree, GitHub, etc.)
│                          # Change an integration URL? Do it here.
│
├── components/            # Reusable UI pieces
│   ├── Header.astro       # Top navigation bar (dark bg, pill-shaped links)
│   ├── Footer.astro       # Bottom footer with link columns
│   ├── Hero.astro         # Homepage hero (only used on index)
│   ├── SEO.astro          # Meta tags, Open Graph, Twitter cards
│   ├── Button.astro       # Reusable button/link (3 variants: primary, secondary, outline)
│   ├── EventCard.astro    # Event card component
│   ├── ProjectCard.astro  # Project card component
│   └── ResourceCard.astro # Resource card component
│
├── content.config.ts      # Collection schemas + glob loaders (uses Zod)
│                          # Lives here, not in content/, since Astro 6
│
├── content/               # Markdown content (projects & resources)
│   ├── projects/          # One .md file per project write-up
│   └── resources/         # One .md file per resource/tutorial
│
├── layouts/
│   └── BaseLayout.astro   # The HTML shell every page shares
│                          # Includes: <head>, fonts, SEO, analytics, skip nav,
│                          # Header, <main> wrapper, Footer
│
├── pages/                 # Each file = one URL on the site
│   ├── index.astro        # / (homepage)
│   ├── about.astro        # /about
│   ├── events.astro       # /events (embeds Luma calendar)
│   ├── join.astro         # /join
│   ├── support.astro      # /support (links to Open Collective)
│   ├── contact.astro      # /contact (Formspree form)
│   ├── projects/
│   │   ├── index.astro    # /projects (fetches GitHub repos at build time)
│   │   └── [slug].astro   # /projects/my-project (renders Markdown content)
│   └── resources/
│       ├── index.astro    # /resources
│       └── [slug].astro   # /resources/my-tutorial (renders Markdown content)
│
└── styles/
    └── global.css         # Tailwind base/component/utility layers, custom classes
```

## Key Patterns

### Centralized Config (`src/config.ts`)

All external URLs and integration IDs are in one file. Components import from it instead of hardcoding URLs. If a Luma slug or Formspree ID changes, update one file.

### GitHub Repos at Build Time (`src/pages/projects/index.astro`)

The Projects page fetches repos from the `philaconvalley` GitHub organization using the public API during the Astro build. This means:

- Repo data is baked into the HTML at deploy time — it's fast, no client-side loading
- New repos appear after the next Vercel deploy (push to `main`)
- If the GitHub API is unreachable during build, it falls back to a "Coming Soon" message

### Content Collections (`src/content/`)

Astro's [content collections](https://docs.astro.build/en/guides/content-collections/) turn Markdown files into typed, validated data. The schemas in `src/content.config.ts` define what fields each content type requires, and each collection names a `glob()` loader saying which files it reads. Astro validates them at build time — if a required field is missing, the build fails with a clear error.

Entries expose `entry.id` (derived from the filename, so it is what the `[slug]` routes use) and are rendered with `render(entry)` imported from `astro:content`. The older `entry.slug` and `entry.render()` were removed in Astro 6 along with `type: 'content'`.

### Tailwind via PostCSS, not the Astro integration

Tailwind is wired up in `postcss.config.mjs` rather than through `@astrojs/tailwind`. That integration is capped at `astro@^5` — `6.0.2` is its final release — and Astro deprecated it in favour of `@tailwindcss/vite`, which requires Tailwind 4. Vite reads a PostCSS config on its own, so Tailwind 3 and the whole `tailwind.config.mjs` theme keep working with no integration in between, and the Tailwind 4 migration stays a separate decision.

### Component-Based Layout

Every page follows the same pattern:

```astro
<BaseLayout title="Page Title">
  <!-- page content only — no <Header />, <Footer />, or <main> -->
</BaseLayout>
```

`BaseLayout` provides the `<html>`, `<head>` (with SEO, fonts, analytics), the skip link, `<Header />`, the `<main>` wrapper around the slot, and `<Footer />`.

Pages used to import and render `<Header />` / `<Footer />` themselves. They no longer do, and shouldn't — that put both components _inside_ `<main>`, which demotes `<header>` from the `banner` landmark and `<footer>` from `contentinfo`, and made the "Skip to main content" link land above the nav instead of past it. Owning the chrome in the layout makes the landmark order correct by construction on every page rather than by convention on each one. There is deliberately no opt-out prop: if a page ever genuinely needs bare chrome, add a separate layout rather than a flag that can silently strip landmarks from the other pages.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) runs `npm ci` + `npm run build` on every push/PR to `main`
- **Dependency rollup** (`.github/workflows/dependency-rollup.yml`) rewrites a single "Dependency security rollup" issue every Monday from the open Dependabot alerts. Dependabot cannot open issues itself, and its alerts live in the Security tab, which needs push access to read — so without this, dependency risk is invisible to contributors. Dependabot security updates are enabled, so the fix path is its PRs; that issue is a dashboard, not a work queue.
- **Vercel** auto-deploys on push to `main` independently
- **Branch protection** requires CI to pass + 1 approving review before merge

## Next Steps

- [Design System](design-system.md) — Brand colors, fonts, and component styles
- [Contributing Guide](contributing.md) — How to submit changes
- [Adding Content](adding-content.md) — Add projects and resources
