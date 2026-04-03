# PhilaCon Valley Website

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/philaconvalley/website/actions/workflows/ci.yml/badge.svg)](https://github.com/philaconvalley/website/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Official website for **PhilaCon Valley** — Philadelphia's tech community by us, for us.

**Live Site**: [philaconvalley.com](https://philaconvalley.com)
| **Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
| **Support**: [Open Collective](https://opencollective.com/philacon-valley)

> This is an open source project! We welcome contributions from everyone. Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## About

PhilaCon Valley is a community-driven tech organization centering Black, Brown, LGBTQIA+, and underrepresented folks in tech. We're building the Philadelphia tech hub we want to see through:

- **Collab Labs** — Build real projects together through pair programming
- **Workshops** — Learn web dev, Git, APIs, and more
- **Career Support** — Resume reviews, interview prep, job connections
- **Open Source** — Contribute to community tools and platforms

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Astro 4.x](https://astro.build) | Static site generation |
| [Tailwind CSS 3](https://tailwindcss.com) + [Typography plugin](https://tailwindcss.com/docs/typography-plugin) | Styling & Markdown prose |
| [Alpine.js 3.15](https://alpinejs.dev) | Lightweight interactivity (pinned CDN) |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vercel](https://vercel.com) | Hosting & auto-deploy |
| [Vercel Analytics](https://vercel.com/analytics) | Privacy-friendly analytics |

**Why this stack?** Fast (Astro ships minimal JS), beginner-friendly (Tailwind + Markdown content), zero-config deploys (push to main).

---

## Getting Started

**Prerequisites**: Node.js 20+ and npm

```bash
git clone https://github.com/philaconvalley/website.git
cd website
npm install
npm run dev
```

Visit **http://localhost:4321** to see the site locally.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm run preview` | Preview production build locally |

---

## Project Structure

```
src/
├── config.ts                # Central site config (all external URLs & IDs)
├── components/
│   ├── Header.astro         # Navigation with accessible mobile menu
│   ├── Footer.astro         # Site footer with social links
│   ├── Hero.astro           # Homepage hero section
│   ├── SEO.astro            # Meta tags, Open Graph, Twitter cards
│   ├── Button.astro         # Reusable button/link component
│   ├── EventCard.astro      # Event display card
│   ├── ProjectCard.astro    # Project display card
│   └── ResourceCard.astro   # Resource display card
├── content/                 # Markdown content collections
│   ├── config.ts            # Collection schemas (Zod)
│   ├── projects/            # Community project write-ups
│   └── resources/           # Tutorials, guides, tools
├── layouts/
│   └── BaseLayout.astro     # HTML shell, fonts, SEO, analytics
├── pages/                   # File-based routing (8 pages)
│   ├── index.astro          # Home
│   ├── about.astro          # About
│   ├── events.astro         # Events (Luma embed)
│   ├── join.astro           # Get involved
│   ├── support.astro        # Donate (Open Collective)
│   ├── contact.astro        # Contact form (Formspree)
│   ├── projects/            # Project listing + [slug] detail
│   └── resources/           # Resource listing + [slug] detail
└── styles/
    └── global.css           # Tailwind layers, custom utilities
```

### Site Configuration

All external integration URLs live in **`src/config.ts`** — Luma, Formspree, Open Collective, GitHub, social links, and contact email. Update them in one place.

---

## Adding Content

### Add a Project

Create `src/content/projects/my-project.md`:

```markdown
---
title: "My Awesome Project"
description: "Brief description of what this project does"
techStack: ["React", "Node.js", "PostgreSQL"]
githubUrl: "https://github.com/username/project"
liveUrl: "https://project.com"
contributors: ["Your Name"]
status: "active"  # or "completed"
date: 2025-10-06
---

Your detailed write-up here...
```

### Add a Resource

Create `src/content/resources/my-tutorial.md`:

```markdown
---
title: "How to Build a REST API"
description: "Learn to build a RESTful API with Node.js and Express"
category: "Tutorial"  # Workshop, Tutorial, Career, or Tool
level: "Intermediate"  # Beginner, Intermediate, or Advanced
author: "Your Name"
date: 2025-10-06
tags: ["api", "nodejs", "backend"]
---

Your tutorial content here...
```

---

## Contributing

We welcome contributions from everyone — fixing a typo, adding content, improving accessibility, or building features.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and test: `npm run build`
4. Commit and push to your fork
5. Open a Pull Request

PRs require CI to pass and one approving review before merge. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## Integrations

| Service | Purpose | Config location |
|---|---|---|
| [Luma](https://lu.ma/philaconvalley) | Event calendar embed | `src/config.ts` |
| [Formspree](https://formspree.io) | Contact form | `src/config.ts` |
| [Open Collective](https://opencollective.com/philacon-valley) | Donations | `src/config.ts` |
| [Vercel](https://vercel.com) | Hosting (auto-deploy on push) | Vercel dashboard |
| [GitHub Actions](/.github/workflows/ci.yml) | CI (type check + build) | `.github/workflows/ci.yml` |

---

## Accessibility

- Skip-to-content link for keyboard navigation
- Semantic HTML with `<main>` landmark
- Dynamic `aria-expanded` on mobile menu
- Titled iframes for screen readers
- Focus-visible styles on all interactive elements
- ARIA labels on icon-only links

Found an accessibility issue? Please [open an issue](https://github.com/philaconvalley/website/issues).

---

## Community

- **Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
- **Slack**: Request an invite via [contact form](https://philaconvalley.com/contact)
- **Instagram**: [@phlconvalley](https://www.instagram.com/phlconvalley/)
- **LinkedIn**: [PhilaCon Valley](https://www.linkedin.com/company/philaconvalley/)
- **Twitter/X**: [@PhlConValley](https://x.com/PhlConValley)
- **GitHub**: [github.com/philaconvalley](https://github.com/philaconvalley)
- **Email**: waskar@philaconvalley.com

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

---

## Support

Help us keep PhilaCon Valley free and accessible:

- **Donate**: [opencollective.com/philacon-valley](https://opencollective.com/philacon-valley)
- **Sponsor an Event**: [Contact us](mailto:waskar@philaconvalley.com)
- **Lead a Workshop**: Share your expertise
- **Provide Venue Space**: Help us host events

---

## License

MIT — see [LICENSE](./LICENSE).

---

**Built with love in Philadelphia** — Making Philly the tech hub it's meant to be: by us, for us.
