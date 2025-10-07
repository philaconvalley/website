# PhilaCon Valley Website

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Official website for **PhilaCon Valley** - Philadelphia's tech community by us, for us.

**Live Site**: [philaconvalley.com](https://philaconvalley.com)
**Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
**Contact**: waskar@philaconvalley.com
**Support**: [Open Collective](https://opencollective.com/philacon-valley)

> **🌟 This is an open source project!** We welcome contributions from everyone. Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## About PhilaCon Valley

PhilaCon Valley is a community-driven tech organization centering Black, Brown, LGBTQIA+, and underrepresented folks in tech. We're building the Philadelphia tech hub we want to see through:

- **Hands-on Collab Labs**: Build real projects together through pair programming
- **Workshops**: Learn web dev, Git, APIs, and more
- **Career Support**: Resume reviews, interview prep, job connections
- **Open Source Projects**: Contribute to community tools and platforms

**Mission**: To make Philly the tech hub it's meant to be: by us, for us.

---

## Tech Stack

This website is built with modern, performant, and volunteer-friendly technologies:

- **[Astro 4.x](https://astro.build)**: Static site generator for lightning-fast performance
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first CSS framework
- **[Alpine.js 3.x](https://alpinejs.dev)**: Lightweight JavaScript for interactivity
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe development
- **[Vercel](https://vercel.com)**: Deployment and hosting (auto-deploy on push)

### Why This Stack?

- **Fast**: Astro ships minimal JavaScript, making pages load instantly
- **Modern**: Tailwind provides beautiful, responsive design out of the box
- **Volunteer-Friendly**: Easy to learn and contribute, even for beginners
- **Content-First**: Projects and resources are simple Markdown files
- **Zero Config Deployment**: Push to main, auto-deploys to Vercel

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/philaconvalley/website.git
cd website

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit **http://localhost:4321** to see the site running locally!

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Run Astro CLI commands
```

---

## Project Structure

```
website/
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── Header.astro     # Site navigation
│   │   ├── Footer.astro     # Site footer
│   │   ├── Hero.astro       # Homepage hero section
│   │   ├── Button.astro     # Reusable button component
│   │   ├── EventCard.astro  # Event display card
│   │   ├── ProjectCard.astro # Project display card
│   │   ├── ResourceCard.astro # Resource display card
│   │   └── SEO.astro        # SEO meta tags
│   ├── content/             # Content collections (Markdown)
│   │   ├── config.ts        # Content collection schemas
│   │   ├── projects/        # Community project write-ups
│   │   └── resources/       # Learning resources & tutorials
│   ├── layouts/             # Page layouts
│   │   └── BaseLayout.astro # Base HTML structure
│   ├── pages/               # Routes (file-based routing)
│   │   ├── index.astro      # Homepage
│   │   ├── about.astro      # About page
│   │   ├── events.astro     # Events page
│   │   ├── join.astro       # Join/get involved page
│   │   ├── support.astro    # Support/donate page
│   │   ├── contact.astro    # Contact form
│   │   ├── projects/
│   │   │   ├── index.astro  # Projects listing
│   │   │   └── [slug].astro # Individual project pages
│   │   └── resources/
│   │       ├── index.astro  # Resources listing
│   │       └── [slug].astro # Individual resource pages
│   └── styles/
│       └── global.css       # Global styles and Tailwind
├── public/                  # Static assets
│   ├── images/              # Images (add your images here)
│   └── favicon.svg          # Site favicon
├── astro.config.mjs         # Astro configuration
├── tailwind.config.mjs      # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
├── README.md                # This file
├── CONTRIBUTING.md          # Contribution guidelines
└── CODE_OF_CONDUCT.md       # Community code of conduct
```

---

## Contributing

We welcome contributions from everyone! Whether you're fixing a typo, adding a feature, or creating content, your help makes PhilaCon Valley better.

### Ways to Contribute

1. **Fix bugs or improve existing features**
2. **Add new projects** to the showcase
3. **Create learning resources** (tutorials, guides)
4. **Improve documentation**
5. **Enhance accessibility or performance**
6. **Design improvements**

### Quick Start for Contributors

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test locally: `npm run dev`
5. Commit your changes: `git commit -m "Add your feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Adding Content

### Add a New Project

Create a new Markdown file in `src/content/projects/`:

```markdown
---
title: "My Awesome Project"
description: "Brief description of what this project does"
techStack: ["React", "Node.js", "PostgreSQL"]
githubUrl: "https://github.com/username/project"
liveUrl: "https://project.com"
contributors: ["Your Name", "Other Contributors"]
status: "active"  # or "completed"
date: 2025-10-06
---

## About This Project

Write a detailed description of your project here. Include:
- What problem it solves
- How it works
- What you learned
- How others can contribute

## Features

- Feature 1
- Feature 2

## Getting Started

Instructions for running the project locally...
```

### Add a New Resource

Create a new Markdown file in `src/content/resources/`:

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

## Introduction

Your tutorial content here...
```

---

## Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect it's an Astro project
5. Click "Deploy"
6. Done! Your site is live and will auto-deploy on every push to main

### Environment Variables

If you're using Formspree for the contact form, update the form action in `src/pages/contact.astro`:

```astro
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Get your Formspree form ID from [formspree.io](https://formspree.io).

---

## Features

### What's Built

- Fully responsive design (mobile, tablet, desktop)
- SEO optimized with meta tags and Open Graph support
- Accessible (WCAG AA compliant)
- Event calendar integration (Luma)
- Contact form (Formspree)
- Open Collective donation integration
- Project showcase with filtering
- Resource library with search
- Fast performance (Lighthouse 90+ scores)
- Content managed via Markdown files
- Auto-deployment to Vercel

### Design Highlights

- Modern gradient designs
- Philadelphia-inspired color palette
- Clean, readable typography (Inter + Poppins)
- Smooth animations and transitions
- Card-based layouts
- Sticky navigation

---

## Performance

This site is optimized for speed:

- **Static generation**: Pages are pre-rendered at build time
- **Minimal JavaScript**: Only Alpine.js for interactive features
- **Optimized images**: Use WebP format and lazy loading
- **Fast fonts**: Google Fonts loaded asynchronously
- **Tailwind CSS**: Purged unused styles in production

Target metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+ across all categories

---

## Accessibility

We're committed to making this site accessible to everyone:

- Semantic HTML structure
- Proper heading hierarchy
- Alt text for all images
- Keyboard navigation support
- Focus visible states
- ARIA labels where needed
- Color contrast ratios meet WCAG AA standards

If you find an accessibility issue, please [open an issue](https://github.com/philaconvalley/website/issues) or [contact us](mailto:waskar@philaconvalley.com).

---

## Community

### Join Us

- **Events**: [lu.ma/philaconvalley](https://lu.ma/philaconvalley)
- **Slack**: Request an invite via [contact form](https://philaconvalley.com/contact)
- **Instagram**: [@phlconvalley](https://www.instagram.com/phlconvalley/)
- **LinkedIn**: [PhilaCon Valley](https://www.linkedin.com/company/philaconvalley/)
- **Twitter/X**: [@PhlConValley](https://x.com/PhlConValley)
- **GitHub**: [github.com/philaconvalley](https://github.com/philaconvalley)

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

---

## Support

Help us keep PhilaCon Valley free and accessible:

- **Donate**: [opencollective.com/philacon-valley](https://opencollective.com/philacon-valley)
- **Sponsor an Event**: [Contact us](mailto:waskar@philaconvalley.com)
- **Lead a Workshop**: Share your expertise
- **Provide Venue Space**: Help us host events

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Questions?

- **Email**: waskar@philaconvalley.com
- **Website**: [philaconvalley.com/contact](https://philaconvalley.com/contact)
- **Issues**: [GitHub Issues](https://github.com/philaconvalley/website/issues)

---

**Built with love in Philadelphia**

*Making Philly the tech hub it's meant to be: by us, for us.*
