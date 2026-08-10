# PRODUCT.md — PhilaCon Valley website

Durable product context for design work. Facts here are derived from the codebase and repo docs, not invented. Numbers that change are named with their source rather than copied.

## What this is

The official website for **PhilaCon Valley** — a community-driven Philadelphia tech org centering Black, Brown, LGBTQIA+, and underrepresented folks in tech. The site is also an **open-source contributor project**: it is deliberately built to be a first-ever pull request for people in the community.

That dual purpose is the single most important design constraint on this repo, and it is easy to forget. Every choice is judged twice — once as "does this serve a visitor?" and once as "can a first-time contributor understand and safely change this?"

Live: `philaconvalley.com` · Repo: `philaconvalley/website` (public, MIT)

## Who it serves

| Audience                         | Arrives wanting               | Leaves having                                    |
| -------------------------------- | ----------------------------- | ------------------------------------------------ |
| **Prospective community member** | to know if this is for them   | RSVP'd to an event, or joined Slack              |
| **Existing member**              | the next Lab, a resource      | the date, the link, the thing                    |
| **First-time OSS contributor**   | a safe place to make a PR     | a merged change and a labelled next issue        |
| **Sponsor / partner / press**    | proof this is real and active | live numbers, past events, a way to reach Waskar |
| **Donor**                        | a reason and a route          | Open Collective                                  |

## Voice

Set by the homepage headline and consistent across surfaces: **"Come as you are. Leave with a flock."**

Warm, plain, human, un-corporate. Stats are labelled _"people, not users"_, _"nights held"_, _"things shipped, so far"_ — the copy actively refuses SaaS metrics language. Preserve this. Do not introduce growth-deck vocabulary (engagement, users, platform, leverage) anywhere on the site.

No emojis in UI copy.

## Surfaces and their modes

Mode is the design contract for a surface — what visitor success looks like there. See DESIGN.md for how mode governs decisions.

| Surface   | Route                             | Mode                                                                            |
| --------- | --------------------------------- | ------------------------------------------------------------------------------- |
| Home      | `/`                               | **Persuade** — decide this is for you                                           |
| Join      | `/join`                           | **Persuade** — convert to member                                                |
| Support   | `/support`                        | **Persuade** — convert to donor                                                 |
| About     | `/about`                          | **Read** — understand who we are                                                |
| Events    | `/events`                         | **Operate** — find the next one, RSVP                                           |
| Projects  | `/projects`, `/projects/[slug]`   | **Read** — browse and understand work                                           |
| Resources | `/resources`, `/resources/[slug]` | **Operate** — locate a specific thing                                           |
| Contact   | `/contact`                        | **Operate** — complete a form                                                   |
| 404       | `/404`                            | **Operate** — recover                                                           |
| Blog      | `/_blog/*`                        | **Read** — _currently unpublished; leading underscore excludes it from routing_ |

## Product truth that constrains design

These are real behaviors of the system. Designing against them produces work that cannot ship.

- **Static build, no server.** Astro output is static on Vercel. There is no request-time personalization, no per-request nonce, no server session. Anything "live" is fetched at build time.
- **Three homepage numbers have three different owners.** Member count is hand-maintained in `src/config.ts` (Luma's calendar-wide total is behind a paid tier). Nights held and things shipped are fetched at build from Luma's public ICS feed and GitHub by `src/lib/community.ts`. A design that displays these must tolerate all three being absent or stale.
- **Luma is the RSVP system of record.** The site links out; it does not own registration.
- **Content is file-based collections** — `blog`, `gallery`, `projects`, `resources`. Non-technical contributors add content by adding files. Any design that requires new content types requires a schema change and a contributor-docs update.
- **The homepage photo section renders only when a real Lab photo exists** in the gallery collection, and is absent rather than filled with brand illustration. This is deliberate; do not add a placeholder.
- **Interactivity is Alpine.js, self-hosted.** Mobile menu, contact form state, resources filter. There is no React.
- **Contact form posts to Formspree.**

## Constraints inherited from the repo

- Accessibility is a stated commitment, not a nice-to-have — the site has a Code of Conduct, an `accessibility` issue label, and existing reduced-motion and reduced-transparency handling. Regressions here are defects, not polish.
- CI runs lint, typecheck, and Playwright e2e including a CSP config. Design changes that break e2e selectors (`data-testid`) break the build.
- Contributor docs in `docs/` are part of the product. A visual change that outdates `docs/design-system.md` is incomplete until that doc is updated.

## Explicitly out of scope for design work

- Blog surface (`src/pages/_blog/`) is intentionally off the air. Do not design it back on without a decision.
- Newsletter: Beehiiv exists but is dormant; Substack is Waskar's personal blog, not the org's. The site should not imply an active newsletter.
