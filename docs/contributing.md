# Contributing Guide

Thank you for wanting to contribute to PhilaCon Valley! This guide covers the workflow for submitting changes.

## Ways to Contribute (No Code Needed)

You don't need to write code to help:

- **Report a bug** — [Open a bug report](https://github.com/philaconvalley/website/issues/new?template=bug_report.md)
- **Request a feature** — [Open a feature request](https://github.com/philaconvalley/website/issues/new?template=feature_request.md)
- **Submit content** — [Submit a project or resource](https://github.com/philaconvalley/website/issues/new?template=content_submission.md)
- **Fix a typo** — Click the pencil icon on any file in GitHub to edit it directly

## Code Contribution Workflow

### 1. Find something to work on

- Browse [open issues](https://github.com/philaconvalley/website/issues)
- Look for issues labeled `good first issue` if you're new
- Comment on an issue to let others know you're working on it

### 2. Set up your environment

See [Getting Started](getting-started.md) for full setup instructions.

### 3. Create a branch

```bash
# Make sure you're on the latest main
git checkout main
git pull origin main

# Create your branch
git checkout -b feature/your-feature-name
```

Use descriptive branch names: `fix/broken-link`, `feature/dark-mode`, `content/new-tutorial`.

### 4. Make your changes

Edit the files you need. Run the dev server to preview:

```bash
npm run dev
```

### 5. Check for errors

Before submitting, make sure the build passes:

```bash
npm run build
```

If this fails, fix the errors before continuing.

### 6. Commit your changes

```bash
git add .
git commit -m "Short description of what you changed"
```

Write commit messages that explain **what** you did, not how. Good: `"Add dark mode toggle to header"`. Bad: `"Updated files"`.

### 7. Push and open a PR

```bash
git push origin feature/your-feature-name
```

Then go to [github.com/philaconvalley/website](https://github.com/philaconvalley/website) — you'll see a prompt to open a pull request. Click it and fill in the template.

### 8. Wait for review

- A maintainer will review your PR
- CI must pass (automated checks run on every PR)
- At least one approving review is required
- We may suggest changes — that's normal and collaborative!

## Guidelines

- **Ask questions** — If you're unsure about something, ask in the issue or PR. We're here to help.
- **Keep changes focused** — One PR should do one thing. Don't mix a bug fix with a new feature.
- **Test your changes** — Run `npm run build` before pushing. Check the site visually.
- **Be kind** — Follow our [Code of Conduct](../CODE_OF_CONDUCT.md).

## Where Things Live

| I want to change...                        | Look in...              |
| ------------------------------------------ | ----------------------- |
| Page content or layout                     | `src/pages/`            |
| Reusable UI pieces (header, footer, cards) | `src/components/`       |
| Colors, fonts, or spacing                  | `tailwind.config.mjs`   |
| External URLs (Luma, Formspree, etc.)      | `src/config.ts`         |
| Global styles                              | `src/styles/global.css` |
| Project or resource write-ups              | `src/content/`          |

For more detail, see [Architecture](architecture.md).

## Next Steps

- [Getting Started](getting-started.md) — Set up the project locally
- [Adding Content](adding-content.md) — Add a project or resource
- [Architecture](architecture.md) — Understand the codebase structure
- [Design System](design-system.md) — Work with brand colors and styles
