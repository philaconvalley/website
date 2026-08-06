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

## Adding Event Photos

The homepage's "The room" section renders a five-photo mosaic under the headline
"Every photo is a real Thursday." Until there are photos, the section renders no
mosaic at all and the headline reads "Come see the room." instead — the claim and
the evidence ship together or not at all.

Two steps. Put the image file in `public/images/gallery/`:

```
public/images/gallery/patch-002-pairing.webp
```

Then add one JSON file per photo in `src/content/gallery/`:

```json
// src/content/gallery/patch-002-pairing.json
{
  "image": "/images/gallery/patch-002-pairing.webp",
  "alt": "Two people pairing on a laptop at a long table",
  "event": "PATCH 002: Tap In NFC Lab",
  "date": "2026-07-30"
}
```

### Field reference

| Field     | Required | Notes                                                                           |
| --------- | -------- | ------------------------------------------------------------------------------- |
| `image`   | Yes      | Site-absolute path into `public/`, starting with `/images/`. Not a file import. |
| `alt`     | Yes      | What is happening in the photo, for screen readers. Not "event photo".          |
| `event`   | Yes      | Which night it was taken at.                                                    |
| `date`    | Yes      | `YYYY-MM-DD`. The five most recent photos are the ones the homepage shows.      |
| `caption` | No       | Optional visible caption.                                                       |

The homepage takes the five newest by `date`, so adding a sixth retires the
oldest rather than growing the grid. YAML (`.yaml` / `.yml`) works too if you
prefer it — the collection accepts both.

**The first photo gets a double-height cell.** The mosaic's leftmost tile spans
two rows, so whichever entry sorts first should be a **portrait** photo. A
landscape shot there gets cropped to a tall slot, which cuts people off at both
edges — a wide group photo is the worst thing to put in it. Give the group shot
one of the four wide cells instead.

Sorting is newest `date` first; entries sharing a date fall back to filename
order. So among photos from the same night, `patch-001-pairing.json` comes
before `patch-001-together.json`.

**Before you add a photo:** make sure the people in it are okay with being on a
public homepage. There is no way to un-publish a face someone finds later.

## What About GitHub Repos?

The `/projects` page automatically displays all repositories from the [philaconvalley GitHub organization](https://github.com/philaconvalley). If your project is in the org, it shows up with no file needed.

The Markdown content files above are for detailed write-ups that go beyond what GitHub shows — tutorials, case studies, or project stories.

## Next Steps

- [Getting Started](getting-started.md) — Set up the site locally to preview your content
- [Contributing Guide](contributing.md) — How to submit your changes
