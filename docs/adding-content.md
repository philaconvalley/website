# Adding Content

You can add projects and resources to the site by creating simple text files. No coding experience needed — just some text with a few fields at the top.

## Two Ways to Add Content

### Option 1: Through GitHub (easiest)

Use our issue templates — no setup required:

- [Submit a Project](https://github.com/philaconvalley/website/issues/new?template=content_submission.md)
- [Submit a Resource](https://github.com/philaconvalley/website/issues/new?template=content_submission.md)

A maintainer will turn your submission into a page on the site.

### Option 2: Create the file yourself

If you're comfortable with Git and want to do it yourself, follow the instructions below.

## Adding a Project

Create a new file in `src/content/projects/`. The filename becomes the URL (e.g., `my-project.md` becomes `/projects/my-project`).

```markdown
---
title: 'My Awesome Project'
description: 'A short description of what this project does'
techStack: ['React', 'Node.js', 'PostgreSQL']
githubUrl: 'https://github.com/username/project'
liveUrl: 'https://project.com'
contributors: ['Your Name', 'Another Contributor']
status: 'active'
date: 2025-10-06
---

Write about your project here. You can use Markdown formatting:

## What it does

Describe the project...

## What I learned

Share what you learned building it...
```

### Field reference

| Field          | Required? | What it is                     |
| -------------- | --------- | ------------------------------ |
| `title`        | Yes       | The project name               |
| `description`  | Yes       | One-line summary               |
| `techStack`    | Yes       | List of technologies used      |
| `githubUrl`    | No        | Link to the GitHub repo        |
| `liveUrl`      | No        | Link to the live version       |
| `contributors` | Yes       | Who built it                   |
| `status`       | Yes       | `"active"` or `"completed"`    |
| `date`         | Yes       | When it was added (YYYY-MM-DD) |

## Adding a Resource

Create a new file in `src/content/resources/`. Same idea — filename becomes the URL.

```markdown
---
title: 'How to Build a REST API'
description: 'Learn to build a RESTful API with Node.js and Express'
category: 'Tutorial'
level: 'Beginner'
author: 'Your Name'
date: 2025-10-06
tags: ['api', 'nodejs', 'backend']
---

Write your tutorial, guide, or resource here...
```

### Field reference

| Field         | Required? | Options                                             |
| ------------- | --------- | --------------------------------------------------- |
| `title`       | Yes       | —                                                   |
| `description` | Yes       | One-line summary                                    |
| `category`    | Yes       | `"Workshop"`, `"Tutorial"`, `"Career"`, or `"Tool"` |
| `level`       | Yes       | `"Beginner"`, `"Intermediate"`, or `"Advanced"`     |
| `author`      | Yes       | Your name                                           |
| `date`        | Yes       | When it was added (YYYY-MM-DD)                      |
| `tags`        | Yes       | List of relevant keywords                           |

## Adding a Blog Post or Community Spotlight

The `/blog` page (Community Voices) features both PhilaCon-authored posts and external content from community members. If you have a Substack, Medium, YouTube channel, podcast, or any other platform, we can spotlight your work.

### External content (links to your platform)

Create a file at `src/content/blog/your-post.md` with just the frontmatter -- no body content needed:

```markdown
---
title: 'My Article Title'
description: 'A short summary of what the article covers'
author: 'Your Name'
date: 2025-10-15
tags: ['topic1', 'topic2']
externalUrl: 'https://your-substack.substack.com/p/your-article'
platform: 'Substack'
---
```

Supported platforms: `Substack`, `Medium`, `YouTube`, `Dev.to`, `LinkedIn`, `Podcast`, `Other`.

The card on `/blog` will link directly to your content. PhilaCon Valley amplifies your voice without duplicating it.

### PhilaCon-authored posts

Same as above but without `externalUrl` and `platform`. Write the full content in the Markdown body and it will be hosted on the site.

## Adding a Game to the Arcade

Games on `/arcade` run in a sandboxed `<iframe sandbox="allow-scripts">` on
philaconvalley.com, so they live under a stricter policy than a normal web
page. Read this before you start writing a game, not after — the constraints
below shape what you can build, not just how you package it at the end.

### The hard requirement: one self-contained HTML file

A game must be a **single HTML file with everything inlined** — markup,
CSS, JavaScript, and any library you use (Three.js, for example, is inlined
whole into Pigeon Post for this reason). No sibling `.js` or `.css` file, no
CDN `<script src>`, no build step producing multiple output files.

This isn't a style preference — a sibling file genuinely does not load. The
sandboxed iframe has no origin of its own (`sandbox="allow-scripts"` gives it
an opaque origin), and a `fetch` or `<script src>` for a same-directory file
is blocked by the browser as cross-origin. It fails silently in a way that
looks like a bug in your game rather than a policy. Inlining everything is
the only thing that works.

### Other constraints the sandbox imposes

- **No network calls.** The `/games/` Content-Security-Policy sets
  `connect-src 'none'`, so there is no `fetch`, no `XHR`, no `WebSocket`, and
  no analytics of any kind, even same-origin.
- **No CDN links.** Google Fonts (`fonts.googleapis.com` /
  `fonts.gstatic.com`) is the only external origin the policy allows through
  `style-src`/`font-src`. Everything else must be inlined or omitted.
- **No storage you can rely on.** The opaque sandbox origin means
  `localStorage` **throws** rather than silently failing. Wrap any access in
  `try`/`catch` and degrade to something session-only — Flappy Philacon does
  exactly this, falling back to an in-memory high score for the tab's
  lifetime when storage isn't available.
- **Only inline `unsafe-inline` script/style is allowed.** The full policy
  applied under `/games/` is:

  ```
  default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'
  fonts.googleapis.com; font-src fonts.gstatic.com; img-src data: blob:;
  connect-src 'none'; frame-ancestors 'self'
  ```

  Images and fonts you need must be `data:`/`blob:` URIs baked into the
  file, not separate assets.

### Steps

1. Put your file at `public/games/<your-slug>/index.html`. It must be the
   whole game — see the requirement above.
2. Add `src/content/arcade/<your-slug>.md` — copy an existing entry (e.g.
   `src/content/arcade/flappy-philacon.md`) for the field list. `longDescription`
   and `thumbnailAlt` are required and must be written by a person: canvas
   games are opaque to screen readers, so these are how someone who cannot
   see or play your game finds out what it is.
3. Run `npm run build && node scripts/serve-with-headers.mjs 4322`, then
   `npm run arcade:shots` in a second terminal to generate your thumbnail.
   Look at the result — if it captured a title screen rather than gameplay,
   add a warm-up for your game in `scripts/capture-arcade-shots.mjs`.
4. Set `input` to only the input methods your game truly supports. If your
   game needs a keyboard and cannot be played by tapping or dragging, list
   only `keyboard` — the site will then tell phone visitors honestly ("Desktop
   only") instead of showing them something they cannot play.
5. Open a pull request.

### A note on licensing

The repo is MIT-licensed, so committing a game licenses it to the world
irrevocably. If the game wasn't written by you personally for this repo (for
example, work done under a contractor agreement), make sure the agreement
assigns the work to PhilaCon Valley, or attach written sign-off from the
author on the pull request. A maintainer will ask for this before merging.

## What About GitHub Repos?

The `/projects` page automatically displays all repositories from the [philaconvalley GitHub organization](https://github.com/philaconvalley). If your project is in the org, it shows up with no file needed.

The Markdown content files above are for detailed write-ups that go beyond what GitHub shows — tutorials, case studies, or project stories.

## Next Steps

- [Getting Started](getting-started.md) — Set up the site locally to preview your content
- [Contributing Guide](contributing.md) — How to submit your changes
