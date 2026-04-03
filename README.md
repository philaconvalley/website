# PhilaCon Valley Website

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/philaconvalley/website/actions/workflows/ci.yml/badge.svg)](https://github.com/philaconvalley/website/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

The official website for **PhilaCon Valley** — Philadelphia's tech community by us, for us.

**Live Site**: [philaconvalley.com](https://philaconvalley.com)
| **Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
| **Support**: [Open Collective](https://opencollective.com/philacon-valley)

> This is an open source project! Whether you write code, design, write content, or just have ideas — we welcome contributions from everyone. Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## What is PhilaCon Valley?

PhilaCon Valley is a community-driven tech organization centering Black, Brown, LGBTQIA+, and underrepresented folks in tech. We're building the Philadelphia tech hub we want to see through:

- **Collab Labs** — Build real projects together through pair programming
- **Workshops** — Learn web dev, Git, APIs, and more
- **Career Support** — Resume reviews, interview prep, job connections
- **Open Source** — Contribute to community tools and platforms (like this website!)

---

## How Can I Contribute?

There are many ways to help — you don't need to be a developer!

### No coding required

- **Report a bug** — Something look broken? [Open an issue](https://github.com/philaconvalley/website/issues/new?template=bug_report.md)
- **Suggest a feature** — Have an idea to improve the site? [Tell us](https://github.com/philaconvalley/website/issues/new?template=feature_request.md)
- **Submit content** — Write a tutorial, share a resource, or showcase a project via our [content submission form](https://github.com/philaconvalley/website/issues/new?template=content_submission.md)
- **Fix a typo** — You can edit files directly on GitHub and submit a pull request

### If you write code

1. Fork this repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and test: `npm run build`
4. Commit and push to your fork
5. Open a Pull Request

PRs require CI to pass and one approving review before merge. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## Running the Site Locally

Want to see the site on your own computer? Here's how.

**What you need first**: [Node.js](https://nodejs.org) version 20 or higher (download from the link — it's free)

```bash
# 1. Copy the code to your computer
git clone https://github.com/philaconvalley/website.git
cd website

# 2. Install the project's dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open **http://localhost:4321** in your browser — you should see the site!

### Useful Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts a local server so you can preview changes as you make them |
| `npm run build` | Builds the production version (also checks for errors) |
| `npm run preview` | Preview the production build locally before deploying |

---

## Adding Content

You can add projects and resources by creating simple Markdown files (`.md`) — no code needed, just text with some metadata at the top.

### Add a Project

Create a file at `src/content/projects/my-project.md`:

```markdown
---
title: "My Awesome Project"
description: "Brief description of what this project does"
techStack: ["React", "Node.js", "PostgreSQL"]
githubUrl: "https://github.com/username/project"
liveUrl: "https://project.com"
contributors: ["Your Name"]
status: "active"
date: 2025-10-06
---

Write about your project here — what it does, how it works, what you learned...
```

### Add a Resource

Create a file at `src/content/resources/my-tutorial.md`:

```markdown
---
title: "How to Build a REST API"
description: "Learn to build a RESTful API with Node.js and Express"
category: "Tutorial"
level: "Beginner"
author: "Your Name"
date: 2025-10-06
tags: ["api", "nodejs", "backend"]
---

Write your tutorial here...
```

> **Tip**: The `/projects` page also automatically displays all repos from our [GitHub organization](https://github.com/philaconvalley) — no file needed for those!

---

## How the Site Works

This section is for contributors who want to understand the codebase.

### Tech Stack

| Tool | What it does |
|---|---|
| [Astro](https://astro.build) | Generates the website pages (like a website builder, but for developers) |
| [Tailwind CSS](https://tailwindcss.com) | Handles styling (colors, spacing, layout) |
| [Alpine.js](https://alpinejs.dev) | Adds small interactive features (like the mobile menu) |
| [TypeScript](https://www.typescriptlang.org) | Helps catch bugs by checking code types |
| [Vercel](https://vercel.com) | Hosts the site and auto-deploys when we push to `main` |

### Design System

The site uses the official PhilaCon Valley brand identity:

- **Fonts**: Baloo 2 (headings) + Nunito (body text) — playful and approachable
- **Colors**: Warm yellow, pink, coral, and purple palette from our brand file
- **Cards**: Soft shadows that lift up when you hover
- **Buttons**: Rounded pill shape

Brand colors are defined in `tailwind.config.mjs`. All external URLs (Luma, Formspree, Open Collective, socials) are centralized in `src/config.ts` — change them in one place.

### Project Structure

```
src/
├── config.ts              # All external URLs and settings (one place to update)
├── components/            # Reusable pieces of the site (header, footer, cards, etc.)
├── content/               # Markdown files for projects and resources
├── layouts/               # The HTML wrapper that every page shares
├── pages/                 # Each file = one page on the site (8 pages total)
└── styles/                # Global CSS and Tailwind customizations
```

### Services We Use

| Service | What it does | Where it's configured |
|---|---|---|
| [Luma](https://lu.ma/philaconvalley) | Hosts our event calendar | `src/config.ts` |
| [Formspree](https://formspree.io) | Handles the contact form | `src/config.ts` |
| [Open Collective](https://opencollective.com/philacon-valley) | Manages donations transparently | `src/config.ts` |
| [Vercel](https://vercel.com) | Hosts the website | Vercel dashboard |
| [GitHub Actions](/.github/workflows/ci.yml) | Runs automated checks on every PR | `.github/workflows/ci.yml` |

---

## Accessibility

We're committed to making this site usable by everyone:

- Skip-to-content link for keyboard users
- Proper HTML structure for screen readers
- Mobile menu announces its state to assistive technology
- All interactive elements have visible focus styles
- Icon-only links have text labels for screen readers

Found an accessibility issue? Please [open an issue](https://github.com/philaconvalley/website/issues) — we take this seriously.

---

## Connect With Us

- **Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
- **Slack**: Request an invite via our [contact form](https://philaconvalley.com/contact)
- **Instagram**: [@phlconvalley](https://www.instagram.com/phlconvalley/)
- **LinkedIn**: [PhilaCon Valley](https://www.linkedin.com/company/philaconvalley/)
- **Twitter/X**: [@PhlConValley](https://x.com/PhlConValley)
- **GitHub**: [github.com/philaconvalley](https://github.com/philaconvalley)
- **Email**: waskar@philaconvalley.com

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

---

## Support Us

Help us keep PhilaCon Valley free and accessible for everyone:

- **Donate**: [opencollective.com/philacon-valley](https://opencollective.com/philacon-valley)
- **Sponsor an Event**: [Contact us](mailto:waskar@philaconvalley.com)
- **Lead a Workshop**: Share your expertise with the community
- **Provide Venue Space**: Help us host events around Philly

---

## License

MIT — see [LICENSE](./LICENSE) for details. In short: you can use, modify, and share this code freely.

---

**Built with love in Philadelphia** — Making Philly the tech hub it's meant to be: by us, for us.
