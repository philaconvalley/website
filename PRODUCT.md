# PRODUCT.md — PhilaCon Valley website

<!-- impeccable:product-schema 1 -->

Durable product context for design work. Facts here are derived from the codebase and repo docs, not invented. Numbers that change are named with their source rather than copied.

## What this is

The official website for **PhilaCon Valley** — a community-driven Philadelphia tech org centering Black, Brown, LGBTQIA+, and underrepresented folks in tech. The site is also an **open-source contributor project**: it is deliberately built to be a first-ever pull request for people in the community.

That dual purpose is the single most important design constraint on this repo, and it is easy to forget. Every choice is judged twice — once as "does this serve a visitor?" and once as "can a first-time contributor understand and safely change this?"

Live: `philaconvalley.com` · Repo: `philaconvalley/website` (public, MIT)

## Platform

web

## Positioning

**Show up free, build something real in one night.** PhilaCon Valley runs free, in-person Labs where a newcomer joins a small team and ships a real thing in a single night, with no application, no fee, and no prerequisite. It centers Black, Brown, LGBTQIA+, and underrepresented people in tech. Paid design and software work for Philly nonprofits and community orgs funds the free side, and the people who do that work came up through it. The website itself is part of the offer: it is built to be a first pull request.

A neighboring meetup can copy "free" or "inclusive". It cannot truthfully copy all of it together: one night, in person, a shipped thing, funded by its own studio, with the site as an on-ramp. (Confirmed by Waskar, 10/15/2026.)

## Who it serves

| Audience                         | Arrives wanting               | Leaves having                                    |
| -------------------------------- | ----------------------------- | ------------------------------------------------ |
| **Prospective community member** | to know if this is for them   | RSVP'd to an event, or joined Discord            |
| **Existing member**              | the next Lab, a resource      | the date, the link, the thing                    |
| **First-time OSS contributor**   | a safe place to make a PR     | a merged change and a labelled next issue        |
| **Sponsor / partner / press**    | proof this is real and active | live numbers, past events, a way to reach Waskar |
| **Donor**                        | a reason and a route          | Open Collective                                  |

**When two audiences conflict, the newcomer wins:** the person who has never been and does not feel ready. Every page must make sense to someone with no context about who PhilaCon Valley is or what it does (Diego's review, 10/15/2026; priority confirmed by Waskar).

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
- **Three homepage numbers have three different owners.** They count up once on scroll, but the HTML always holds the real values. Member count is hand-maintained in `src/config.ts` (Luma's calendar-wide total is behind a paid tier). Nights held and things shipped are fetched at build from Luma's public ICS feed and GitHub by `src/lib/community.ts`. A design that displays these must tolerate all three being absent or stale.
- **Luma is the RSVP system of record.** The site links out; it does not own registration.
- **Content is file-based collections** — `blog`, `gallery`, `projects`, `resources`. Non-technical contributors add content by adding files. Any design that requires new content types requires a schema change and a contributor-docs update.
- **The homepage hero photo comes only from real Lab photos** in the gallery collection (`heroEligible: true`; the 8 PATCH 003 photos as of 10/15/2026), picked at random per visit. With no eligible photo the hero shows none, rather than brand illustration. This is deliberate; do not add a placeholder.
- **Interactivity is Alpine.js, self-hosted.** Mobile menu, contact form state, resources filter. There is no React.
- **Contact form posts to Formspree.**

## Constraints inherited from the repo

- Accessibility is a stated commitment, not a nice-to-have — the site has a Code of Conduct, an `accessibility` issue label, and existing reduced-motion and reduced-transparency handling. Regressions here are defects, not polish.
- CI runs lint, typecheck, and Playwright e2e including a CSP config. Design changes that break e2e selectors (`data-testid`) break the build.
- Contributor docs in `docs/` are part of the product. A visual change that outdates `docs/design-system.md` is incomplete until that doc is updated.

## Operating Context

- **The night is a Lab.** Labs are monthly, free, and in person; PATCH is the multi-disciplinary workshop Lab (PATCH 002: NFC tags; PATCH 003: projection mapping, Pennovation Works, 09/30/2026). Primary venue: Pennovation Center, 3401 Grays Ferry Ave; secondary: The Braid Mill, Germantown. Stoop is not a running format as of 10/15/2026.
- **Where things live:** Luma (RSVP of record), Discord (the community between events), GitHub org `philaconvalley` (all projects open source), Open Collective (donations), Formspree (contact form), Vercel (hosting and branch previews).
- **Two entities.** PhilaCon Valley, LLC is the agency arm (active). PhilaCon Valley, Inc., the nonprofit, is pending. The site says the agency's fees keep every program free; do not describe the nonprofit as formed.
- **Who decides.** Brand Book Edition 1.2 is canonical. Diego Mendoza (Product Design Lead) is Brand Steward and approves brand work; Waskar Paulino (Founder & Executive Director) holds final approval. `DESIGN.md` records open brand questions for Diego.
- **How changes land.** Contributors open pull requests; CI runs lint, typecheck, Playwright e2e, and a CSP suite; Vercel builds a preview per branch.

## Evidence on Hand

What the site may show today, with sources:

- **Live numbers:** member count (`src/config.ts`, hand-maintained), nights held and things shipped (Luma ICS and GitHub, at build, `src/lib/community.ts`).
- **Photos:** 12 cleared PATCH 002 and PATCH 003 photos in `src/content/gallery/`.
- **Projects:** 9 org repos in `src/content/projects/`, each fact taken from its public repo.
- **Events:** past PATCH recaps in `src/content/events/`, and the next event from Luma.
- **Arcade:** community-built games in `src/content/arcade/`.

**Not cited, by decision (10/15/2026):** no press, awards, speaking slots, client names, or testimonials. That includes the Technical.ly RealLIST, the AI Summit NY session, OwlHacks, and CodeTV, even where a project README mentions one. Do not fabricate or add any of these without a new decision.

## Product Principles

1. **The newcomer wins.** When audiences conflict, design for the person who has never been and does not feel ready.
2. **Real or absent.** Every claim, number, photo, and project comes from a real source; a missing source means the element is absent, never a placeholder.
3. **Free stays visibly free.** Nothing may imply a fee, an application, or a skill gate for programs.
4. **The site is a first pull request.** A first-time contributor must be able to understand and safely change any part of it; contributor docs are part of the product.
5. **Accessibility is part of the brand.** The Book says so (p11); a regression is a defect, not polish.

## Explicitly out of scope for design work

- Blog surface (`src/pages/_blog/`) is intentionally off the air. Do not design it back on without a decision.
- Newsletter: Beehiiv exists but is dormant; Substack is Waskar's personal blog, not the org's. The site should not imply an active newsletter.
