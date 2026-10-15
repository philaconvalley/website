# DESIGN.md — PhilaCon Valley website

The **decision layer** for design work on this site: the visual thesis, the motion contract, and the rules that govern change.

> **Neither this file nor `docs/design-system.md` is the top of the chain.** The canonical design system is **PhilaCon Valley Brand Identity Guidebook Edition 1.2** (08/21/2026), held privately by the org. It replaced Edition 1.0. Maintainers with access should read it before making visual changes; outside contributors should follow `docs/design-system.md` and this file, which implement it.
>
> **Migration in progress (decided 10/15/2026).** `tailwind.config.mjs` and `docs/design-system.md` still hold Edition 1.0 values. The foundation PR of the redesign (see _The 1.2 redesign_ below) moves them to Edition 1.2. Until it merges, a conflict between those files and this one is expected, and the Book wins. The Edition 1.3 draft (09/25/2026) is **not** canonical. Do not take values from it.
>
> **A secondhand palette is not the design system.** Values copied from an older file, a screenshot, or another deck drift silently and have caused real rework. Take token values from `tailwind.config.mjs` and `docs/design-system.md`, never from a sibling artifact that merely looks right.
>
> Three layers, and each defers upward:
>
> | Layer                            | Owns                                                                        | Audience                                  |
> | -------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
> | **Brand Book Ed. 1.2** (private) | The system itself — palette, type, mascot, the Flock, voice, taglines       | Canonical. Everything else implements it. |
> | `docs/design-system.md`          | _What the values are_ in this codebase — tokens, variants, hero assignments | Someone making a change                   |
> | `DESIGN.md` (this file)          | _Why they are what they are and what must stay true_                        | Someone deciding a change                 |
>
> **Do not duplicate token values here.** If a value appears in two layers and they disagree, the higher layer wins and the lower one is a bug. `docs/design-system.md` has not been formally reconciled against the Book — treat any conflict as the Book's win until it has.

## Voice and vocabulary

Owned by the Brand Book's Voice & Tone section. Summarized here only where the site currently breaks it.

**We sound like a neighbor, not a brand.** Direct, credible, warm — a trusted organizer. Never corporate, never startup-hype. Short sentences. The reader is always "you"; we are always "we."

**The four taglines each have one job.** They are not interchangeable, and the surface decides which one applies:

| Line                                                            | Job                      | Where                                                           |
| --------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| "By us, for us."                                                | The signature            | Sparingly, so it stays earned                                   |
| **"You find your people to build with you, not just for you."** | The community promise    | **About copy**, recruitment, welcome emails                     |
| **"Show up before you feel ready."**                            | The welcome              | Event openings, onboarding, first-timer touchpoints — **Join**  |
| "A pigeon flies alone. A flock goes much further."              | The rallying cry / motto | Recruitment, community moments, email sign-offs, closing slides |

### The event is a Lab

**Decided 08/09/2026.** The flagship hands-on event is a **Lab**. This settles a three-way split:

- **"Collab Lab"** — what the site said in 14+ places (README, Code of Conduct, Join, Events, Support, Projects, Arcade, `docs/writing-guide.md`). **Renamed to "Lab".**
- **"Builder Night"** — invented during the homepage redesign and never reconciled with anything. **Retired.**
- **"Lab"** — the winner, and it matches the event-format taxonomy the team defined on 07/08/2026: _"Lab is for structured, skill-focused sessions with a single objective."_

The rename was mechanical but wide, touching a component name and two e2e spec filenames. It shipped as **its own commit**, separate from any visual change, so a bisect can tell copy churn from design churn.

### The homepage headline

**"Come as you are. Leave with a flock."** is not one of the Book's four taglines — it is a site invention riffing on the motto. **Decided 08/09/2026: it stays, and it should be promoted to a documented line in the Book** rather than left as undocumented drift. It does a job none of the four cover: the homepage hook.

**The line under it must say what happens at PhilaCon. Decided 10/15/2026, from Diego's review.** A first-time visitor has no idea what the org does. The current line says who it is for and what it costs ("Free, in person, and open before you feel ready"), but not what you do there. The Home PR rewrites it to name the activity, for example hands-on nights where people build real tech together. Every fact in it must be confirmed by Waskar (evidence contract).

> **Open action, not a website task.** The Book is maintained outside this repo by the brand team. Adding a fifth line is their call and their file. Until it lands there, this is a recorded exception, not a precedent for inventing more lines.

**Hard rules, all currently violated or at risk:**

1. **Sentence case. Always. Never title case.** The rule covers headings _and_ buttons. **Swept sitewide 08/09/2026 in its own commit** — 104 replacements across 12 pages, 83 in headings and 21 in button and CTA labels — before the redesign, so the redesign cannot be blamed for copy churn. Program and surface names stay capitalized as proper nouns: PhilaCon Valley, Philly, Discord, Open Collective, The Arcade, Lab, PATCH.
   **Amended 10/15/2026: display type renders uppercase.** `h1`–`h3`, the hero stickers, and the marquee band use `text-transform: uppercase`, as Edition 1.2 sets its own headlines. **The source text stays in sentence case.** **Exception, 10/15/2026: a heading that holds a project or game name keeps the name's own case** (`normal-case`), as the mockup does on Projects and Arcade. Capitals would turn `projectionMapper` into PROJECTIONMAPPER and erase the word breaks. Event and guide titles stay uppercase, also as the mockup does. The uppercase is a presentation layer only, so the copy still reads correctly in search results, link previews, and when CSS fails. Buttons, body copy, labels, and nav stay in sentence case on screen too. Never type a heading in capitals in the source. Headings inside `.prose` article bodies keep sentence case on screen: they are reading aids on Read surfaces, not display type.
2. **"By us, for us." is never capitalized as "By Us, For Us."** The Book calls this out by name. About violated it until the 08/09/2026 sweep; watch for it returning.
3. **Banned vocabulary:** leverage, elevate, synergy, unlock, 10x, ecosystem. Currently clean — keep it that way. Use build language: ship, make, show up, pair up.
4. **Singular they. "Everyone", "y'all", "folks". Never "guys."**
5. **No emoji in chrome.** The one documented exception is a single Unicode arrow on CTAs: "Join us →".
6. **The sniff test:** if it could appear unchanged on a Fortune 500 DEI press release, it is wrong. BIPOC and LGBTQIA+ folks are never a "niche audience" — they are the audience.

## Visual thesis

**Loud, flat, and hand-made — a sticker sheet, not a SaaS page.** Revised 10/15/2026 for Edition 1.2. The old thesis said "retro-warm"; the new one turns the volume up. The site reads like a printed zine of stickers on a yellow wall, and it earns that from five decisions working together. None of them survive alone:

1. **Heavy, rounded, uppercase display type.** Baloo 2 at 800 for every heading, set uppercase (see voice rule 1), with tight leading near `0.9`. The roundness is the personality, and the capitals give it the poster voice of the Book's own headlines. Tracking is size-specific, per `apple-design` §15: slightly negative on the largest display sizes, near zero on `h3`, and clearly positive (`0.14em` or more) on the small uppercase Nunito labels. One `letter-spacing` value for all sizes is wrong somewhere.
2. **A solid ink outline on everything that is an object.** Cards, buttons, pills, stickers, the hero photo, and section edges carry a 2px ink border (3px on the hero stickers and the highlighted headline word). The Book: _"Keep the ink outline."_ The outline is also the Book's escape hatch for color pairs that do not separate on their own.
3. **Hard offset shadows in solid ink.** Zero blur, full-opacity ink, offset down-right (small on buttons, larger on cards and hero objects). The low-alpha shadows of the 1.0 build are retired. This is still the single most identity-bearing token in the system: a blurred shadow anywhere breaks the world more than a wrong color would.
4. **Generous corners and stadium pills.** The Book specifies 18–24px on cards and full stadium radius on buttons and tags. Sticker objects tilt a few degrees off the grid, which is the one place the layout is allowed to look hand-placed.
5. **Golden Yellow and White ground, warm accents, no greys.** Edition 1.2 drops cream: _"Golden Yellow carries most surfaces. White is the light neutral."_ Hot Pink, Coral Pink, and Amber accent. Ink is the dark field for whole sections, not just header and footer. **There is no grey anywhere**, including body text. Body text is ink, and secondary text on ink is white. Sky Blue is the Book's _"deliberate exception and never a background"_. Purple _"belongs to the keyboard"_, so it is not a hero color in this build.

**Anti-references:** clean SaaS minimalism, glassmorphism and frosted glass, dark-mode-first dashboards, thin light-weight type, blurred drop shadows, grey neutrals, gradients of any kind.

**Declined from `apple-design`:** §12 recommends translucent, blurred chrome (`backdrop-filter`) for nav and toolbars. The Book bans frosted glass, and the brand wins. The sticky header is an opaque Golden Yellow bar with an ink bottom border.

## The evidence contract

The visual thesis governs how the site looks. This governs what it is allowed to _say_, and it is the harder constraint.

PhilaCon Valley's claim about itself is that it is hands-on: _"No lectures. No passive learning."_ A page that makes that claim in paragraphs refutes it in the same breath. **The site must demonstrate what it says it is.** Prose describing hands-on community is the single most off-brand thing this codebase can ship, and it is currently the most common.

### The ladder

Every claim gets made at the highest rung it can reach. Rungs, strongest first:

| Rung                | Form                                                                                         | What makes it strong                                     |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1 · **Playable**    | The visitor does the thing. Arcade cabinets.                                                 | The claim is not asserted, it is experienced.            |
| 2 · **Live**        | Build-time real data — Luma events, GitHub PRs, the three homepage numbers.                  | It can be wrong or empty, which is why it reads as true. |
| 3 · **Documentary** | Real photographs of real nights and real faces.                                              | Unfakeable. Requires cleared assets.                     |
| 4 · **Enacted**     | Motion that performs the claim rather than decorating it — the Lab track on the Events page. | The argument happens in time, not in a sentence.         |
| 5 · **Prose**       | Words.                                                                                       | Last resort.                                             |

**One argument, one rung, one place.** If a section's point is already carried above, its prose is _deleted_, not shortened. About currently argues "tech excluded us and this is the room where it doesn't" in three separate sections plus the founder's note. That is one argument, and it gets one home.

### Rules

1. **Every surface carries at least one non-prose element above rung 5.** A page that cannot reach rung 4 has a content problem, not a design problem, and the fix is content — not more copy.
2. **Prose budget, by mode.** Measured on the **built** page, not the source, because components expand. Count every word inside `<main>` — headings included — then subtract three things, each for a stated reason:

   | Subtract                                 | Because                                                                                                                    |
   | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
   | `<pre>` / `<code>` content               | Commands are artifacts, not sentences. A `git clone` line is evidence.                                                     |
   | The interior of a rung-1 operable object | It is the proof, not a claim about the proof. **Capped separately at 120 words** so it cannot become an essay in disguise. |
   | Anything outside `<main>`                | Nav and footer are chrome, and are shared.                                                                                 |

   _Headings count._ An earlier draft of this rule said they were excluded while every baseline below was measured with them included; the numbers were right and the sentence was wrong. This is the reproducible definition — Join measures 154 page prose plus 117 object interior under it.

   | Mode     | Budget | Today                                                         |
   | -------- | ------ | ------------------------------------------------------------- |
   | Persuade | ≤ 250  | Home **183** ✓ · Join 307 · Support 321                       |
   | Read     | ≤ 550  | About **317** ✓ (rewritten in #131; figure was stale)         |
   | Operate  | ≤ 200  | Events 198 ✓ · Projects 176 ✓ · Resources 150 ✓ · Contact 208 |

   The homepage already lives inside its budget while making the strongest argument on the site. It is the proof the budget is achievable, not an aspiration.

   The Read allowance is 550 rather than 400 for one named reason, decided 08/09/2026: **About states its six values explicitly**, because sponsors, grant reviewers, and prospective members need something they can point at, and demonstration alone does not survive being quoted in a funding application. That is a ceiling bought for a specific purpose, not general headroom. Prose that is not the values statement is still held to 400.

3. **Generic icon cards are banned — the treatment, not the content.** A grid of stock outline icons in rounded squares, each over a heading and a paragraph, is the clean-SaaS anti-reference wearing brand colors: decoration standing exactly where evidence should be. About's six value cards are the reference case and the icons come out. **The six values themselves stay** and get re-set as a typographic statement or paired with real documentary imagery. Stock iconography is never a substitute for evidence anywhere on this site.
4. **Thin is not lean.** Events, Projects, and Resources sit inside budget because they are nearly empty, not because they are disciplined. Under-budget with nothing above rung 5 is the same defect as over-budget, and it fails rule 1.
5. **A surface may not describe a thing the site could show instead.** "What We Do" listing four event types in prose, while an events collection and a live Luma feed exist, is the canonical violation.

### PATCH belongs on the site

**Decided 08/09/2026: yes, and it is the strongest evidence the org has.** PATCH is a defined series with written doctrine, a tagline (_"Learn it. Build it. Take it home."_), physical stickers, and collectible digital artifacts — and it appears nowhere on the website.

Two lines from the series doctrine are this contract restated in the org's own words, written before it:

- **"The takeaway is proof, not a souvenir."** That is rung 1 and rung 3, defined by the people who run the events.
- **"I did not know people could do this."** The north-star feeling of a PATCH room, and a better statement of what a visitor should feel on this site than anything currently written on it.

The series also already runs on the ladder: the hook happens _before_ the room (attendees tap in with the NFC tech the session teaches), and each event carries the previous one inside it. A site that describes this in paragraphs would be repeating the exact mistake the doctrine warns about.

**Scope note:** the doctrine states speaker formats are still unnamed, and _"until all formats have names, marketing will blur them and attendees will not know what they are walking into."_ The site should present **PATCH** and **Lab**, which are defined, and stay silent on the third until it has a name.

### The operable object

What makes the Arcade work is not that it contains games. It is that a cabinet is **an object you operate rather than a card you read** — it has a face, a state, and a response to being touched. That device generalizes past games, and it is the primary vehicle for rung 1 elsewhere on the site.

Constraints on any new operable object, and all of them are hard:

- **Non-negotiably keyboard-operable, and legible without operating it.** Playable proof that a visitor cannot run — no keyboard, no pointer, reduced motion, JS blocked — must fall back to a still frame plus caption that still makes the argument. Proof that fails for some visitors is not proof, it is exclusion, on a site whose entire thesis is the opposite.
- **Never autoplays.** The visitor starts it.
- **Alpine.js or vanilla, self-hosted, CSP-clean.** No React, no CDN. See PRODUCT.md.
- **Does not spend the loop budget.** The motion contract below reserves infinite motion for the Lab narrative; an idle-attracting cabinet is a second loop and is not permitted.
- **CSS only. No spring library, no rAF physics engine — decided 08/09/2026.** Operable objects are limited to what CSS transitions, `:active`, and state classes can express: press feedback, state changes, staged reveals, progress. This keeps one motion vocabulary, no new dependency, a clean CSP story, and a codebase a first-time contributor can still read — which is half this repo's purpose. **The cost is accepted explicitly:** true drag, throw, and velocity handoff are out of reach, so an object that genuinely needs them is a signal to revisit this decision through `animate`, not to quietly add a library.

Foundations for these, per `apple-design` (cited, not restated). The first two are achievable in CSS and are required; the third is the reason springs were declined rather than forgotten:

- **Respond on pointer-down, not on release.** Feedback on `:active`, instantly. Waiting for `click` feels dead.
- **Keep feedback continuous _during_ an interaction**, not only at its end.
- Interruptible, velocity-aware motion wants springs animating from the current presentation value — genuinely better for gesture, and genuinely not what this site is buying. Objects are scoped to stay inside what CSS does well instead of approximating physics badly.

## Color rhythm

Beyond the token table in `docs/design-system.md`, one systemic rule: **each page owns a hero color, and sections alternate White → Ink → one saturated field** to create vertical rhythm. The Book: _"Hero color rotates by page."_ The hero color is a page's identity; changing one is a product decision, not a styling tweak.

**Hero assignments, decided 10/15/2026** (from the redesign mockup; `docs/design-system.md` takes this table in the foundation PR):

| Hero          | Pages               |
| ------------- | ------------------- |
| Golden Yellow | Home · About · Join |
| Hot Pink      | Events              |
| Amber         | Projects · Contact  |
| Coral Pink    | Support             |
| Ink           | Arcade              |
| White         | Resources           |

**Every page closes the same way:** the pigeon section on Golden Yellow, over a solid ink Philadelphia skyline that runs into the ink footer. The mockup drew this section in sky blue. Sky Blue is never a background, so it moved to Golden Yellow (decided 10/15/2026).

**Contrast contract.** Ink text on every warm field: Golden Yellow, Amber, Hot Pink, Coral Pink, and White. White text only on Ink (and on Purple, if Purple ever returns as a field). The Book: _"Ink reads cleanly on warm colors. White reads cleanly on Purple or Ink."_ This replaces the 1.0 rule of white text on coral and pink heroes. That rule rested on a wrong figure: white on coral measures 3.1:1, not 4.9:1, and white on Purple is 3.6:1, so even the Book's "white reads cleanly on Purple" holds only for large display text. Ratios: `docs/design-system.md`, "Contrast". Any new field color gets checked before it ships.

## Type scale

Defined in `src/styles/global.css` `@layer base` as fluid `clamp()` steps in `rem`, so the visitor's text-size setting still scales them (`apple-design` §15). Matched to Diego's mockup at 1440px on 10/15/2026:

| Level | 390px phone | 1440px desktop | Line height | Tracking | Mockup at 1440px   |
| ----- | ----------- | -------------- | ----------- | -------- | ------------------ |
| h1    | 44px        | 115px          | 0.9         | -0.02em  | 115px (Home 121px) |
| h2    | 36px        | 80px           | 0.95        | -0.015em | 80px               |
| h3    | 24px        | 34px           | 1.0         | 0        | 28–34px            |

Every heading is Baloo 2 at 800, uppercase through CSS. On 10/15/2026 the 89 `font-bold` classes on `h1`–`h3` tags were removed sitewide, so no heading renders at 700 any more.

**Pages still override the sizes.** About 80 size classes (`text-3xl`, `text-5xl`, and similar) remain on page headings from the old design. Each page PR removes its own, so the scale above takes over page by page. The rule against opt-outs still holds: a page that needs a size the scale does not give is a signal the scale is wrong, not a reason for a local override. The Arcade `h1` (144px in the mockup) is the one candidate exception; decide it in the Arcade PR.

## Motion contract

The strongest existing part of this system and the least documented outside code comments. Two families, and the distinction is an accessibility boundary, not a naming convention:

| Family         | Behavior              | Purpose                                                                            |
| -------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `.pcv-enter-*` | Runs **once** on load | Entrances — word, rise, stat, bar                                                  |
| `.pcv-loop-*`  | Runs **forever**      | Narrates the Lab story: a dot arrives alone, two more join, you leave with a thing |

**Rules:**

1. **Looping motion is reserved for the Lab narrative on the Events page** (`src/components/LabTrack.astro`). It is the site's only infinite motion. **Moved from Home on 10/15/2026, from Diego's review:** on Home, with no context, "One night. Three hours." made PhilaCon read as a one-night event. On Events the visitor already knows they are reading about one night, so the timeline explains it. Home gets a section that shows everything the org does (Labs, PATCH workshops, open-source projects, the Arcade) in its place. Do not add a second looping element anywhere without retiring this one — two competing loops destroy the narrative reading.
2. **Every looping element must be legible in its final state**, because `prefers-reduced-motion` freezes it exactly there.
3. **The reduced-motion block is deliberately unlayered** (outside `@layer`) so it wins against Tailwind's cascade order regardless of layer sorting. Do not move it into a layer.
4. **Animate `transform` and `opacity`, never layout properties.** `.pcv-loop-track` used to draw itself by animating `width` from 0 — a relayout every frame, forever, and a footgun that needed its own reduced-motion special case to avoid freezing at zero width. It now scales (`transform-origin: left`, `scaleX(0) → scaleX(1)`), which composites and needs no special case. **`scaleX` is only safe on the track because it is a childless 1px line with no border-radius.** It is the wrong fix for the nav pill — see rule 5.
5. **The desktop nav pill is a deliberate, documented exception.** `Header.astro` transitions `width` alongside `transform`. `scaleX` would stretch its `rounded-full` ends into ellipses, so the layout cost is accepted: it is one small element, on a discrete hover, bounded at 200ms — not an infinite loop. Do not "fix" it to `scaleX` without solving the radius distortion.
6. **Standard easing is `cubic-bezier(0.22, 1, 0.36, 1)`** for entrances and joins — a decelerating ease-out. Durations cluster at 0.8–1.0s for entrances and 8s for the loop cycle. Hero entrances exceed the 300ms UI budget on purpose: they are once-per-session display motion on a Persuade surface.
7. **Never `ease-in`, and never `transition: all`.** `ease-in` delays the moment the user is watching; `transition: all` animates whatever happens to differ, off the GPU. Name the properties.
8. **Hover motion is gated to real pointers** by `future.hoverOnlyWhenSupported` in `tailwind.config.mjs`, so every `hover:` utility compiles inside `@media (hover: hover)`. Hand-written CSS `:hover` rules must gate themselves.
9. **New motion goes through the `animate` skill**, per the design-team charter. `impeccable animate` is not used on this repo.
10. **The marquee band is static. Decided 10/15/2026.** The redesign mockup scrolls it forever. That would be a second loop, and rule 1 keeps LabTrack as the only one, because LabTrack acts out the Lab story (evidence rung 4) and the marquee only decorates. The band ships as a still row of words. It stays `aria-hidden`, because its words repeat what the page says elsewhere.
11. **Hover and press on sticker objects.** The Book: cards _"shadow grows on hover"_. A card or button moves up and to the left while its ink shadow grows by the same distance, so it looks lifted off the page. Two rules from `apple-design` §1 bind this: **press feedback fires on `:active`** (pointer-down), not on release, and the press pushes the object back into its shadow. Touch screens get the press, not the hover (rule 8). `animate` sets the duration and curve in Stage 5; the mockup's `.15s ease` and `.2s ease` are placeholders, not decisions.
12. **Reduced motion keeps the meaning.** Per `apple-design` §14, reduced motion swaps movement for a still state, not for nothing. Hover lift and press drop become a shadow-size change with no translate. LabTrack freezes in its final state (rule 2).
13. **The header mark hangs, then tucks. Decided 10/15/2026** in the header prototype. At the top of the page the pigeon head hangs over the bar's ink edge, tilted and larger. Once the visitor scrolls past 8px, or opens the phone menu, it tucks inside the bar so it never covers content. Hang is the server-rendered default, so a page that loads at the top never moves. The move is `transform` only, on an image whose layout box never changes. It uses 240ms and the strong ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`, because the head moves on screen, it does not enter or leave. Reduced motion swaps the two states with no movement. `animate` reviews the timing in Stage 5.

## Known tensions

Real conflicts between the current build and the tooling now installed. Each needs a decision before enforcement is switched on.

1. ~~**`.gradient-text` will trip the detector.**~~ **Resolved 10/15/2026: deleted** in the foundation PR. It was defined and never used.
2. ~~**Google Fonts are loaded remotely.**~~ **Resolved: all three faces are self-hosted** from `@fontsource` (`src/layouts/BaseLayout.astro`), so fonts and Alpine.js now share one supply-chain posture.
3. **`docs/design-system.md` says all pages use the default OG banner.** If per-page OG images are ever added, that doc and this one both need updating — it is the most likely drift point in the design docs.
4. ~~**The gallery collection is empty.**~~ **Resolved: `src/content/gallery/` now holds 12 cleared PATCH 002 and PATCH 003 photos** (checked 10/15/2026). Rung 3 can render. The redesign fills every photo slot from this collection. **The absent-by-default pattern stays:** a `[PHOTO]` slot in the mockup renders only when a real gallery entry backs it, and it disappears otherwise. The Home hero takes `patch-003-projection-wall`.
5. **`src/content/projects/` holds no published projects.** Its one file, `_example-project.md`, is a contributor template; the leading underscore keeps it out of the build (10/11/2026). The redesign mockup lists nine projects (Website, projectionMapper, Community Handbook, djVisualizer, owlhacks-timer, locked-groove, door-checkin, discord-task-bot, Shopping Debate). **Those nine ship as nine collection files in their own content PR**, with each fact checked against its repo. They are never hard-coded into the page, because contributors add projects by adding files.
6. ~~**Playable proof introduces a gesture layer this system does not have.**~~ **Resolved 08/09/2026: no spring layer.** Operable objects stay inside CSS, per the constraint above. `.pcv-enter-*` remains the only motion vocabulary. Revisit only if a real object needs drag or throw, and revisit through `animate`.
7. **LabTrack's 8s cycle is near the frequency `apple-design` §14 warns about.** It names slow looping motion near 0.2 Hz (one cycle per 5s) as a vestibular trigger. LabTrack runs at 0.125 Hz. It is small, not full-viewport, and it freezes under reduced motion, so it stays. `animate` reviews it in Stage 5 and decides if the cycle should change.
8. **The Stoop format card is cut.** The mockup shows Stoop as a running night type. On 10/15/2026 Waskar did not confirm it as running, so the card does not ship. The brand notes of 08/21/2026 describe Stoop as monthly. If it runs again, the card comes back with the date of its last night.
9. **The Resources hero is White.** A white hero on a white page loses the "hero color rotates" signal. Its ink outline and the yellow band below it must carry the edge. Stage 6 critique checks whether this works.
10. **`company/brand/COLOR-TOKENS.md` still cites Edition 1.0.** It sits outside this repo, so it is not a website task. Report it to the brand team.
11. **A block comment marked `DRAFT — needs Waskar's review before shipping` is live in production.** `src/pages/about.astro:50-55`, wrapping the founder's note. **Resolved 08/09/2026: Waskar is being interviewed and the note will be rewritten in his own words** — under the evidence contract it becomes the spine of About, so it is the one piece of prose on the site that has to be earned rather than drafted.
12. **The hanging header mark breaks the Book's clear-space rule, and needs Diego's approval.** §07 asks for clear space equal to the mascot's body height on every side. At the top of the page the head hangs over the bar edge, which breaks that on purpose. Under Addendum 01 this is a Tier 2 request for the Brand Steward. The tucked state is the closest any header can come to the rule. **The head image itself (`public/images/pigeon-head-mark-160.webp`) is not yet in the brand asset library**, and the Addendum says the mark is "pulled from the asset library, never rebuilt or traced". Waskar supplied it on 10/15/2026; its source is still to be confirmed and filed. `ASSET-SPECS.md` lists a "pigeon-head sheet" as still needed.
13. **The header and footer use the official wordmark, not the mockup's typed name.** Decided 10/15/2026. Diego's mockup typed "PhilaCon Valley" in Baloo 2. Book §07 says the mark is "pulled from the asset library, never rebuilt", so both now use `philacon-wordmark-horizontal.svg` unchanged. **The wordmark's pink is `#FF66A8`, which is not an Edition 1.2 color** (Hot Pink is `#EA71AC`). The logo library snapped it to the older brand pink on 08/11/2026. Ask Diego whether the file should move to `#EA71AC`.

## The 1.2 redesign

**Decided 10/15/2026.** The site is rebuilt toward a 9-page redesign mockup (a Claude Design export, kept outside the repo) that follows Edition 1.2. The mockup is a target for layout and composition. It is not a source of token values: values come from the Book, per the note at the top of this file.

**Rollout order.** Each step is its own PR, so a bisect can tell token churn from page churn.

1. **Foundation.** Edition 1.2 tokens in `tailwind.config.mjs`, the re-tuned type scale, `Button`, `.card`, the single focus ring, `Header`, `Footer`, the closing pigeon section, and `docs/design-system.md` updated in the same PR. Delete `.gradient-text` here (tension 1).
2. **Content.** The nine project files (tension 5). No visual change.
3. **Pages, one PR each.** Home first, because it is the proof the system works. The Home PR removes LabTrack and adds the "everything we do" section; the Events PR adds LabTrack (motion rule 1). Then Join, Support, Events, About, Projects, Arcade, Resources, and Contact.

**Rules for every page PR:**

- **Copy is decided per page, at that page's PR.** The mockup copy is a proposal. Waskar picks mockup copy or current copy for each page. The prose budget applies either way.
- **Claims confirmed 10/15/2026, and safe to ship:** the Lab night timeline (doors at 6:30, teams by 7:00, a first pull request merged and live by the end), "Free. Forever.", and agency fees keeping programs free. Any other new factual claim needs a yes before it ships.
- **Placeholders never ship.** Each `[PHOTO]`, `[MASCOT]`, `[SCREENSHOT]`, `[DATE]`, and `[VENUE]` slot maps to a real source: the gallery collection, `public/images/`, `public/images/arcade/`, or build-time Luma data. With no source, the slot is absent.
- **Live numbers stay live.** The mockup hard-codes 493 / 15 / 9. The build reads them from `src/config.ts` and `src/lib/community.ts`, and it tolerates each one being absent.
- **Keep what works.** Routes, `data-testid` selectors, the Alpine.js mobile menu (the mockup's sideways-scrolling nav is not adopted), the Formspree form, and the CSP stay unchanged.

## How to change this system

| Change                                     | Route                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| A token value                              | `tailwind.config.mjs`, then update `docs/design-system.md`                 |
| The type scale                             | `src/styles/global.css` `@layer base`, then update this file               |
| Motion                                     | `animate` skill; obey the two-family rule above                            |
| A page's hero color                        | Product decision — update `docs/design-system.md` hero table               |
| Adding page copy                           | Check the prose budget first. Over budget, something is cut, not appended. |
| A new operable object                      | Obey the four constraints above; motion through `animate`                  |
| The visual thesis or the evidence contract | Not a styling change. Re-run `/design-team doc`.                           |

Enforcement: `$impeccable hooks on` wires mechanical checks; `$impeccable doctor` reports drift between these docs and the code. Confirmed-intentional findings become exceptions via `hook-admin.mjs`, never by hand.
