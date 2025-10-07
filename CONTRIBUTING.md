# Contributing to PhilaCon Valley Website

Thank you for your interest in contributing to the PhilaCon Valley website! 

This document provides guidelines for contributing to this project. Whether you're fixing a typo, adding a feature, or creating content, we appreciate your help in making this website better for our community.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Adding Content](#adding-content)
- [Style Guidelines](#style-guidelines)
- [Questions?](#questions)

---

## Code of Conduct

This project adheres to the [PhilaCon Valley Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to waskar@philaconvalley.com.

---

## How Can I Contribute?

There are many ways to contribute:

### Report Bugs

Found a bug? [Open an issue](https://github.com/philaconvalley/website/issues) with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots (if applicable)
- Your browser/device info

### Suggest Enhancements

Have an idea? [Open an issue](https://github.com/philaconvalley/website/issues) describing:
- What you want to achieve
- Why it would be useful to the community
- Examples of how it might work

### Add Content

- **Add a Project**: Showcase a project built at our events or independently
- **Add a Resource**: Create tutorials, guides, or learning materials
- **Improve Existing Content**: Fix typos, improve clarity, add examples

### Improve Design

- Enhance accessibility
- Improve responsive design
- Add animations or visual polish
- Fix CSS issues

### Fix Bugs or Add Features

- Check the [issues](https://github.com/philaconvalley/website/issues) for bugs or feature requests
- Look for issues labeled `good first issue` if you're new to contributing

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Git**
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/website.git
cd website
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/philaconvalley/website.git
```

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Visit http://localhost:4321 to see the site!

---

## Making Changes

### Create a Branch

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-you-changed` - Documentation updates
- `content/project-or-resource-name` - Content additions

### Make Your Changes

- **Write clean, readable code**
- **Follow existing patterns** in the codebase
- **Test your changes** locally before submitting
- **Keep commits focused** - one logical change per commit

### Test Your Changes

Before submitting:

1. **Run the development server**:
   ```bash
   npm run dev
   ```

2. **Build the project** to check for errors:
   ```bash
   npm run build
   ```

3. **Preview the build**:
   ```bash
   npm run preview
   ```

4. **Check different screen sizes** (mobile, tablet, desktop)

5. **Test accessibility** (keyboard navigation, screen reader, color contrast)

### Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: brief description"
```

Good commit message examples:
- `Add project: Community Job Board`
- `Fix: Navigation mobile menu not closing`
- `Update: Improve accessibility on Events page`
- `Add resource: Getting Started with TypeScript`

---

## Submitting a Pull Request

### Push Your Branch

```bash
git push origin feature/your-feature-name
```

### Create a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:
   - **Title**: Clear, descriptive title
   - **Description**: What changes you made and why
   - **Related Issues**: Link any related issues
   - **Screenshots**: For UI changes

### PR Review Process

- A maintainer will review your PR
- They may request changes or ask questions
- Make any requested changes and push to the same branch
- Once approved, a maintainer will merge your PR

### After Your PR is Merged

1. Delete your feature branch (optional):
   ```bash
   git branch -d feature/your-feature-name
   ```

2. Update your main branch:
   ```bash
   git checkout main
   git pull upstream main
   ```

---

## Adding Content

### Adding a Project

1. Create a new file in `src/content/projects/` with a descriptive filename (e.g., `my-project.md`)

2. Use this template:

```markdown
---
title: "Project Name"
description: "Brief one-sentence description"
techStack: ["Tech1", "Tech2", "Tech3"]
githubUrl: "https://github.com/username/repo"
liveUrl: "https://example.com"  # Optional
contributors: ["Your Name", "Other Contributors"]
status: "active"  # or "completed"
date: 2025-10-06  # Today's date in YYYY-MM-DD
---

## About This Project

Detailed description of what this project does and why it exists.

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Tech Stack & Implementation

Explain technical decisions, architecture, interesting challenges, etc.

## Impact / What We Learned

Share metrics, learnings, or impact this project had.

## How to Contribute

If it's open source, explain how others can contribute.
```

3. Commit and submit a PR!

### Adding a Resource

1. Create a new file in `src/content/resources/` with a descriptive filename (e.g., `intro-to-react.md`)

2. Use this template:

```markdown
---
title: "Resource Title"
description: "Brief description of what readers will learn"
category: "Tutorial"  # Options: Workshop, Tutorial, Career, Tool
level: "Beginner"  # Options: Beginner, Intermediate, Advanced
author: "Your Name"
date: 2025-10-06  # Today's date
tags: ["tag1", "tag2", "tag3"]
---

## Introduction

Brief intro to the topic and what this resource covers.

## Main Content

Your tutorial/guide content here. Use clear headings, code examples,
and explanations.

### Subsection 1

Content...

### Subsection 2

Content...

## Conclusion / Next Steps

Wrap up and point readers to next resources or actions.
```

3. Commit and submit a PR!

---

## Style Guidelines

### Code Style

- **Use Prettier** for formatting (runs automatically on save if configured)
- **Use TypeScript** for type safety
- **Follow existing patterns** in the codebase
- **Write semantic HTML** (use `<header>`, `<main>`, `<footer>`, `<section>`, etc.)
- **Keep components small** and focused on one thing

### CSS / Tailwind

- **Use Tailwind utility classes** instead of custom CSS when possible
- **Follow mobile-first** approach (start with mobile, use `md:` and `lg:` for larger screens)
- **Use design tokens** from `tailwind.config.mjs` (colors, spacing, etc.)
- **Keep classes organized**: layout → spacing → colors → typography → effects

Example:
```html
<div class="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
```

### Accessibility

- **Use semantic HTML** elements
- **Add alt text** to all images
- **Ensure keyboard navigation** works
- **Use ARIA labels** when needed
- **Test with a screen reader** if possible
- **Maintain color contrast** (WCAG AA minimum)
- **Don't rely on color alone** to convey information

### Content Writing

- **Be concise** and clear
- **Use active voice** ("Click the button" not "The button should be clicked")
- **Write for beginners** - don't assume prior knowledge
- **Include code examples** with syntax highlighting
- **Use headings** to structure content
- **Break up long paragraphs** for readability

---

## Questions?

If you have questions about contributing:

- **Join our Slack** and ask in the #website channel
- **Open a discussion** on GitHub
- **Email** waskar@philaconvalley.com

---

## Recognition

All contributors will be recognized in our community! Your GitHub username will appear in the contributor list once your PR is merged.

Thank you for helping build the PhilaCon Valley community! 

---

**Remember**: Every contribution, no matter how small, makes a difference. Whether you're fixing a typo or building a major feature, you're helping make tech more accessible in Philadelphia. We appreciate you!
