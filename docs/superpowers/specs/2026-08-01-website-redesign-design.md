# Website Redesign — Design Spec

**Date:** 2026-08-01
**Branch:** `waskar/site-redesign`
**Status:** Approved for planning

---

## 1. The problem

The homepage has a clear voice: "You're not the only one in the room." Yellow, loud, a
pigeon, a claim about belonging. The other ten pages have not caught up. They share the
homepage's components but not its argument — each one opens with a different hero color
drawn from a table in `docs/design-system.md`, then repeats the same three-card grid.

That table is the symptom. Color currently encodes _which page you are on_, which is an
admission that the pages would otherwise be indistinguishable. Nothing else about a page
tells a visitor where they are or why they should care.

Underneath the visual problem is a structural one: eleven pages serving one audience with
one job, several of which are duplicates of each other (`/join` and `/contact` both say
"reach us"; `/projects` and `/resources` both say "here is what we build"; `/support` is a
donate button wearing a page).

And underneath that is the honest one. The homepage headline reads "Every photo is a real
Thursday." The `gallery` content collection is empty. The code degrades correctly — it
swaps the headline and hides the grid — but the result is a website selling belonging on
which no human being appears.

## 2. Decisions

These were settled during brainstorming and are not open questions.

| Decision        | Choice                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| Starting point  | The homepage's voice is correct and settled. Everything else moves to it.                  |
| Audience        | One: the person in Philadelphia who might show up but thinks they're not ready.            |
| Page count      | Eleven down to five.                                                                       |
| Design idea     | **The Room** — the site is a space you move through — backed by real data as proof.        |
| Visual language | **Direction A, "Flat but staged."** The material never changes. Depth is earned by motion. |
| Motion          | GSAP everywhere, authored nowhere. Four primitives, declared in markup.                    |
| Human presence  | Real event photography + live GitHub contributors.                                         |

### 2.1 Why direction A and not atmospheric depth

The obvious way to make a site feel like a space is gradients, soft shadows, blur and
translucency. It was rejected. The flat printed look — hard 2px ink borders, solid offset
shadows, no gradients — is the one visual asset PhilaCon Valley has that is recognizable
from across a room, and atmospheric depth is available to everyone. The material stays
exactly as it is. Depth comes from movement and overlap.

The consequence is deliberate: **kill the JavaScript and the site goes flat.** That is the
proof that the motion is structural rather than decorative. One exception is borrowed from
the "layered paper" direction — overlapping section seams — so the page still reads as
layered with JavaScript off or motion disabled.

## 3. Information architecture

Five pages. Existing URLs are preserved wherever possible; breaking inbound links to prove
a point is vanity.

| URL         | Room          | Absorbs      | Its one job                                    |
| ----------- | ------------- | ------------ | ---------------------------------------------- |
| `/`         | Home          | —            | Make a stranger feel they are already inside   |
| `/events`   | The Nights    | —            | Turn "someday" into a specific Thursday        |
| `/projects` | What We Build | `/resources` | Show real work, hand over a first issue        |
| `/about`    | Who We Are    | `/support`   | Earn trust, then ask for money — in that order |
| `/join`     | Come In       | `/contact`   | One door, one form, no maze                    |

**Redirects** (permanent, in `vercel.json`): `/resources → /projects`,
`/support → /about`, `/contact → /join`.

**Detail routes are untouched.** `/projects/[slug]` and `/resources/[slug]` continue to
exist and render their content collections. Only the index pages merge. `/resources/*`
detail URLs must keep working after `/resources` itself redirects — the redirect is exact-
path, not a prefix.

**Blog stays unrouted** in `src/pages/_blog/`. Three posts with no fourth scheduled is
worse than no blog. Its content is still used — see §6.4.

**404** stays, restyled to the new system.

## 4. Color system

The per-page hero color table in `docs/design-system.md` is deleted. Color stops meaning
_which page_ and starts meaning _where you are in the story_. Every page runs the same
sequence: **open air → the door → inside the room → the invitation.**

| Role         | Token          | Hex       | Meaning                                    |
| ------------ | -------------- | --------- | ------------------------------------------ |
| `door`       | `brand-yellow` | `#FDC873` | Every page's hero. Every page.             |
| `air`        | `brand-cream`  | `#FFEED0` | Browsing, no pressure                      |
| `room`       | `brand-dark`   | `#1A1A1A` | The held moment. Proof, photos, numbers.   |
| `work`       | `brand-purple` | `#B383C3` | Making, building, shipping                 |
| `invitation` | `brand-pink`   | `#FF66A8` | Where someone is asked to act              |
| —            | `brand-coral`  | `#EF657F` | Labels and links only. Never a background. |

Someone arriving at `/about` from a search result gets the same front door as someone
arriving at `/`. This is also what makes the choreography legible: a section sliding over
another section means the same thing every time it happens.

## 5. Motion system

### 5.1 The four primitives

Every animation on the site is one of these four. If a proposed animation is not one of
these four, it does not ship.

1. **Arrive** — entrances. Nothing fades in; elements travel 28–40px from off-stage with
   `power3.out` and slight overshoot, staggered within a group.
2. **Depth** — scroll-linked parallax across three planes: far `0.4×`, mid `0.7×`,
   near `1×`. Two planes on viewports below 768px. This is where the space comes from.
3. **Hold** — a pin that stops the page and makes the visitor look. **At most one per
   page.** `/join` deliberately has none.
4. **Seam** — the next section scrubs up over the current one with a rounded top edge.
   Its static end state is the layered layout, so it survives with JavaScript off.

### 5.2 Humanized stagger

Perfect intervals read as a machine. Within an `arrive` group, each element's delay carries
a small offset derived deterministically from its index, so timings are slightly irregular
and no two groups are identical. Deterministic, not random — random would be untestable and
would flicker between renders. The effect is not consciously noticed; it is the difference
between a page that animates and a page that is populated.

### 5.3 Declared in markup, not in scripts

Contributors never write GSAP:

```astro
<Section role="air" data-pcv-seam>
  <h2 data-pcv-arrive>Show up before you feel ready.</h2>
  <div class="pcv-card" data-pcv-arrive data-pcv-depth="near">…</div>
</Section>
```

`role` here is a prop on the `Section.astro` component, not the ARIA `role` attribute. The
component renders a real `<section>` and does not forward this prop to the DOM.

One module scans for `data-pcv-*` attributes and wires the timelines. Someone who has never
opened a GSAP doc gets motion that matches the rest of the site exactly.

### 5.4 Hard rules

- **No scrubbed animation ever owns text content.** This is site law, promoted from the
  existing comment in `homepage-motion.ts`: a scrub stranded at progress 0 leaves whatever
  it was mid-writing on the page permanently. Counters and any other text remain one-shot
  tweens whose only writer always runs to completion, over markup that already contains the
  true value.
- **The header never animates.**
- **Nothing loops forever** except the pigeon's bob.
- **No animation delays anything actionable.** Every CTA is clickable on frame one,
  mid-entrance.
- **Reduced motion** collapses all four primitives to their end state through a single
  `gsap.matchMedia()` path — not a parallel CSS block that can drift out of sync.

### 5.5 Performance gate

If the motion system costs more than 3 Lighthouse performance points on any page relative
to the pre-redesign baseline, depth drops to two planes site-wide before anything else is
cut. Baseline is captured before slice 1 begins.

## 6. Human presence

The design's load-bearing wall. Six mechanisms, in order of how real they are.

### 6.1 Photographs of real nights (external dependency)

Non-negotiable and not buildable in code. Someone shoots the next 2–3 events; target 8–12
usable frames of people in a room. Requires a stated photo-consent practice — a line on the
Luma RSVP and a way to opt out at the door. This is a policy decision owned by the team,
not a component.

`PhotoGrid.astro` is reworked to degrade honestly: renders nothing at 0 photos, a real
layout at 5, the full mosaic at 12+.

### 6.2 Live GitHub contributors

The contributor list _is_ the community, it is already public, and it needs no consent
process. Avatars, handles and merged-PR counts appear on repo cards and in a "built by
these people" block.

### 6.3 Specifics, never testimonials

No quote on this site says a variant of "PhilaCon Valley changed my life." Where member
voice appears, it is a specific: what someone brought and what they left with. Out of scope
for this phase — the team opted not to collect these before launch. The design must not
depend on them.

### 6.4 One person's voice

"We" is nobody. `src/content/blog/waskar-between-commits.md` and
`waskar-plot-holes-potholes.md` already contain first-person writing. One honest paragraph
is pulled from existing content, attributed by name with a link, and placed on `/about`.
No new writing is required from the founder. If it reads badly in review, it is cut — the
page must stand without it.

### 6.5 Never fake a human

Site law. If the real thing does not exist yet, show nothing. No stock photography, no
illustrated teams, no placeholder avatars. This extends the pattern the homepage already
follows for the empty gallery.

### 6.6 Alt text is a description of people

Photo alt text describes who is in the room and what they are doing, not "event photo."
Accessibility and the argument of the site are the same work here.

## 7. Page designs

Every page runs door → air → room → work → invitation. Content differs; the heartbeat does
not.

### 7.1 Home `/`

Door (yellow, headline + two CTAs, depth planes behind) → live next-night band (dark) →
what actually happens, three tracks (cream) → **HOLD: the room** — photos, and the existing
count-up numbers (dark) → we learn by shipping, repos + contributors (purple) → the flock
(pink).

The existing hold is kept as-is in behavior. It is the best thing on the current site and
the seed of the whole design.

### 7.2 The Nights `/events`

Door: "Pick a Thursday." → **HOLD: what a night actually looks like** — a scrubbed 7:00 →
9:30 timeline (dark) → the three kinds of nights (cream) → what got shipped last time
(purple) → RSVP (pink).

Rationale for the hold: the visitor's loudest unspoken fear is not "will this be useful"
but "what will I have to do when I walk in, and will I look stupid." Answering it literally,
minute by minute, removes the actual barrier.

### 7.3 What We Build `/projects`

Door: "Your first pull request is already waiting." → the repos with live good-first-issue
links and contributor faces (purple) → **HOLD: what happens to your PR** — the review path,
shown slowly (dark) → guides and resources, absorbed from `/resources` (cream) → claim an
issue (pink).

Rationale for the hold: a first-time contributor does not fear writing the code. They fear
being judged in public, permanently, with their name attached.

### 7.4 Who We Are `/about`

Door: "A pigeon flies alone." → why this exists, founder paragraph per §6.4 (cream) →
**HOLD: the numbers, and what they cost** (dark) → the people doing it (purple) → keep the
lights on, donate, absorbed from `/support` (pink).

The receipts section is what a funder or board candidate needs. They are not the primary
audience and get no separate wing — one section is made honest enough that they do not need
one.

### 7.5 Come In `/join`

Door: "There is no application." → three ways in (cream) → the form (pink).

Three bands, **no hold.** This is the moment a person is finally about to act; you do not
stop someone walking through your front door to show them a slideshow. It also demonstrates
that the rule is "at most one hold," not "every page gets a toy."

The merged form replaces the current 347-line `/join` and 331-line `/contact` with a single
`StepForm` presenting one question at a time (Alpine.js, already a dependency). Same data
collected; it stops feeling like paperwork.

## 8. Components and files

**New**

- `src/scripts/motion/primitives.ts` — the four moves, humanized stagger, `matchMedia`.
- `src/scripts/motion/index.ts` — attribute scanner; replaces `src/scripts/homepage-motion.ts`.
- `src/components/Section.astro` — owns the color band and the seam. Takes
  `role="door" | "air" | "room" | "work" | "invitation"`. A component cannot be ignored the
  way a documented convention can.
- `src/components/Contributors.astro`
- `src/components/StepForm.astro`

**Modified**

- `src/components/PhotoGrid.astro` — 0/5/12 degradation.
- `src/pages/{index,events,projects/index,about,join}.astro` — rebuilt on `Section`.
- `src/pages/404.astro` — restyled.
- `scripts/refresh-community-data.mjs` — also snapshots contributors and downloads avatars.
- `src/data/community-snapshot.json` — gains a `contributors` array.
- `vercel.json` — three redirects.
- `docs/design-system.md` — the page-color table is replaced by the story-position table.

**Deleted**

- `src/pages/{resources/index,support,contact}.astro`
- `src/scripts/homepage-motion.ts`

**Untouched:** `src/pages/{projects,resources}/[slug].astro`, `src/pages/_blog/*`,
`rss.xml.ts`, `content.config.ts` schemas.

## 9. Data and security

**Contributors are fetched by `scripts/refresh-community-data.mjs`, not at build time.**
Same pattern already used for events. A GitHub rate limit must never be able to fail a
deploy; the committed snapshot is the source of truth at build time.

**Avatars are downloaded into `public/` by that script, not hotlinked.** Hotlinking would
require adding `avatars.githubusercontent.com` to `img-src`. The CSP was deliberately
tightened in #109 and is not being loosened for profile pictures. GSAP is already bundled
from `node_modules` and stays that way — `script-src 'self'` is unchanged.

## 10. Testing

Playwright is already configured. Added coverage:

- **No-JS pass** — seams, layout and all content present and readable with JavaScript
  disabled.
- **Reduced-motion pass** — all four primitives render at their end state; nothing hidden.
- **Text integrity** — jump instantly past every hold (End key, restored scroll, anchor) and
  assert no counter or heading is left mid-animation showing a false value.
- **Redirects** — the three permanent redirects resolve, and `/resources/[slug]` detail
  pages still render.
- **Lighthouse budget** — performance gate per §5.5.

## 11. Build order

Each slice is independently mergeable. If work stops halfway, the result is a working site
rather than a construction site.

1. Baseline Lighthouse capture.
2. Motion system + `Section.astro` as an invisible refactor — homepage behaves exactly as it
   does today.
3. Color system + `docs/design-system.md` rewrite.
4. Home.
5. The Nights.
6. What We Build (+ contributors pipeline).
7. Who We Are.
8. Come In (+ `StepForm`).
9. Redirects, 404, deletions, docs.

## 12. Risks

| Risk                                        | Severity                        | Mitigation                                                                                                                                                                                            |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No photos exist on launch day               | **High** — most likely to occur | The design ships as a choreographed empty room, worse than today. `PhotoGrid` degrades to nothing, but the `/` and `/about` holds lose their subject. Slices 4 and 7 do not merge until photos exist. |
| Motion cost on low-end Android              | Medium                          | Two depth planes below 768px; Lighthouse gate at §5.5.                                                                                                                                                |
| Scope — five pages is not a weekend         | Medium                          | The slice order in §11 is the insurance.                                                                                                                                                              |
| Merged forms lose a field someone relied on | Low                             | Field-by-field diff of `/join` and `/contact` before deleting either.                                                                                                                                 |

## 13. Explicitly out of scope

- Any separate treatment for sponsors, funders, board candidates or agency clients. One
  audience was chosen deliberately.
- Routing or redesigning the blog.
- Member testimonials or collected member specifics (§6.3).
- A new logo, new typefaces, or changes to the color values themselves. Only their _meaning_
  changes.
