# Architecture

This doc explains how the site is built and how the pieces fit together. It's for contributors who want to understand the codebase before making changes.

## Tech Stack

| Tool                                             | What it does                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Astro 5.x](https://astro.build)                 | Generates all the HTML pages at build time (no server needed at runtime)           |
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
├── content/               # Markdown content (projects & resources)
│   ├── config.ts          # Schemas that validate content fields (uses Zod)
│   ├── projects/          # One .md file per project write-up
│   └── resources/         # One .md file per resource/tutorial
│
├── layouts/
│   └── BaseLayout.astro   # The HTML shell every page shares
│                          # Includes: <head>, fonts, SEO, analytics, skip nav
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

Astro's [content collections](https://docs.astro.build/en/guides/content-collections/) turn Markdown files into typed, validated data. The schemas in `src/content/config.ts` define what fields each content type requires. Astro validates them at build time — if a required field is missing, the build fails with a clear error.

### Component-Based Layout

Every page follows the same pattern:

```astro
<BaseLayout title="Page Title">
  <Header />
  <!-- page content -->
  <Footer />
</BaseLayout>
```

`BaseLayout` provides the `<html>`, `<head>` (with SEO, fonts, analytics), and the `<main>` wrapper.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) runs `npm ci` + `npm run build` on every push/PR to `main`
- **Vercel** auto-deploys on push to `main` independently
- **Branch protection** requires CI to pass + 1 approving review before merge

## Next Steps

- [Design System](design-system.md) — Brand colors, fonts, and component styles
- [Contributing Guide](contributing.md) — How to submit changes
- [Adding Content](adding-content.md) — Add projects and resources
