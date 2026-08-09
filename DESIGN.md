# DESIGN.md — PhilaCon Valley website

The **decision layer** for design work on this site: the visual thesis, the motion contract, and the rules that govern change.

> **Neither this file nor `docs/design-system.md` is the top of the chain.** The canonical design system is **Brand Book Edition 1.0** — `company/brand/brand-books/PhilaCon_Valley_Brand_Book_Edition-1.0_2026-05-23.pdf` in the org repo, a real 14-section system, not a mood board. Extract it with `pdftotext -layout`. **Read it before designing anything.** That instruction exists because on 08/08/2026 a deck was built from a palette copied secondhand out of an old `deck.html` and broke six documented rules; the Book was never opened.
>
> Three layers, and each defers upward:
>
> | Layer                             | Owns                                                                        | Audience                                  |
> | --------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
> | **Brand Book Ed. 1.0** (org repo) | The system itself — palette, type, mascot, the Flock, voice, taglines       | Canonical. Everything else implements it. |
> | `docs/design-system.md`           | _What the values are_ in this codebase — tokens, variants, hero assignments | Someone making a change                   |
> | `DESIGN.md` (this file)           | _Why they are what they are and what must stay true_                        | Someone deciding a change                 |
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

- **"Collab Lab"** — what the site says today in 14+ places (README, Code of Conduct, Join, Events, Support, Projects, Arcade, `docs/writing-guide.md`). **Renames to "Lab".**
- **"Builder Night"** — invented during the homepage redesign and never reconciled with anything. It exists only in `src/pages/index.astro`, `src/components/BuilderNightTrack.astro`, a `global.css` comment, two e2e specs, and these two docs. **Retired.**
- **"Lab"** — the winner, and it matches the taxonomy the team defined on 07/08/2026 in `community/events/patch-series/PATCH_SERIES.md`: _"Lab is for structured, skill-focused sessions with a single objective."_

The rename is mechanical but wide, and it touches e2e selectors and a component name. It ships as **its own commit**, separate from any visual change, so a bisect can tell copy churn from design churn.

### The homepage headline

**"Come as you are. Leave with a flock."** is not one of the Book's four taglines — it is a site invention riffing on the motto. **Decided 08/09/2026: it stays, and it should be promoted to a documented line in the Book** rather than left as undocumented drift. It does a job none of the four cover: the homepage hook.

> **Open action, not a website task.** The Book is a PDF owned by Saige and Diego, who adapted the motto in the first place. Adding a fifth line is their call and their file. Until it lands there, this is a recorded exception, not a precedent for inventing more lines.

**Hard rules, all currently violated or at risk:**

1. **Sentence case. Always. Never title case.** The rule covers headings _and_ buttons. **Swept sitewide 08/09/2026 in its own commit** — 104 replacements across 12 pages, 83 in headings and 21 in button and CTA labels — before the redesign, so the redesign cannot be blamed for copy churn. Program and surface names stay capitalized as proper nouns: PhilaCon Valley, Philly, Slack, Open Collective, The Arcade, Lab, PATCH.
2. **"By us, for us." is never capitalized as "By Us, For Us."** The Book calls this out by name. `src/pages/about.astro:271` does exactly it.
3. **Banned vocabulary:** leverage, elevate, synergy, unlock, 10x, ecosystem. Currently clean — keep it that way. Use build language: ship, make, show up, pair up.
4. **Singular they. "Everyone", "y'all", "folks". Never "guys."**
5. **No emoji in chrome.** The one documented exception is a single Unicode arrow on CTAs: "Join us →".
6. **The sniff test:** if it could appear unchanged on a Fortune 500 DEI press release, it is wrong. BIPOC and LGBTQIA+ folks are never a "niche audience" — they are the audience.

## Visual thesis

**Retro-warm and hand-made, not clean-modern.** The site reads as friendly and slightly analog, and it earns that from four decisions working together — none of which survive alone:

1. **Rounded display type.** Baloo 2 at heavy weights with tight negative tracking (`-0.03em` mobile, `-0.035em` desktop) on a 44px→96px hero. The roundness is the personality; the tightness stops it reading as childish.
2. **Hard offset shadows, not blurred ones.** `4px 4px 0`, `6px 6px 0`, `8px 8px 0` at low-alpha near-black. Zero blur radius. This is the single most identity-bearing token in the system — a blurred shadow anywhere in the UI breaks the world more than a wrong color would.
3. **Generous corner radius.** `20px` (`rounded-retro`) plus pill buttons.
4. **Warm ground, cool never.** Cream body (`brand-cream`), amber/coral/pink/purple accents. There is no neutral gray in the palette and no cool tone anywhere. Introducing slate/zinc/blue-gray is the fastest way to make this site look like every other site.

**Anti-references:** clean SaaS minimalism, glassmorphism, dark-mode-first dashboards, thin light-weight type, blurred drop shadows, gray neutrals.

## The evidence contract

The visual thesis governs how the site looks. This governs what it is allowed to _say_, and it is the harder constraint.

PhilaCon Valley's claim about itself is that it is hands-on: _"No lectures. No passive learning."_ A page that makes that claim in paragraphs refutes it in the same breath. **The site must demonstrate what it says it is.** Prose describing hands-on community is the single most off-brand thing this codebase can ship, and it is currently the most common.

### The ladder

Every claim gets made at the highest rung it can reach. Rungs, strongest first:

| Rung                | Form                                                                                      | What makes it strong                                     |
| ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1 · **Playable**    | The visitor does the thing. Arcade cabinets.                                              | The claim is not asserted, it is experienced.            |
| 2 · **Live**        | Build-time real data — Luma events, GitHub PRs, the three homepage numbers.               | It can be wrong or empty, which is why it reads as true. |
| 3 · **Documentary** | Real photographs of real nights and real faces.                                           | Unfakeable. Requires cleared assets.                     |
| 4 · **Enacted**     | Motion that performs the claim rather than decorating it — the Lab track on the homepage. | The argument happens in time, not in a sentence.         |
| 5 · **Prose**       | Words.                                                                                    | Last resort.                                             |

**One argument, one rung, one place.** If a section's point is already carried above, its prose is _deleted_, not shortened. About currently argues "tech excluded us and this is the room where it doesn't" in three separate sections plus the founder's note. That is one argument, and it gets one home.

### Rules

1. **Every surface carries at least one non-prose element above rung 5.** A page that cannot reach rung 4 has a content problem, not a design problem, and the fix is content — not more copy.
2. **Prose budget, by mode.** Body words inside `<main>`, excluding nav, footer, and headings:

   | Mode     | Budget | Today                                                         |
   | -------- | ------ | ------------------------------------------------------------- |
   | Persuade | ≤ 250  | Home **183** ✓ · Join 307 · Support 321                       |
   | Read     | ≤ 550  | About **776**                                                 |
   | Operate  | ≤ 200  | Events 198 ✓ · Projects 176 ✓ · Resources 150 ✓ · Contact 208 |

   The homepage already lives inside its budget while making the strongest argument on the site. It is the proof the budget is achievable, not an aspiration.

   The Read allowance is 550 rather than 400 for one named reason, decided 08/09/2026: **About states its six values explicitly**, because sponsors, grant reviewers, and prospective members need something they can point at, and demonstration alone does not survive being quoted in a funding application. That is a ceiling bought for a specific purpose, not general headroom. Prose that is not the values statement is still held to 400.

3. **Generic icon cards are banned — the treatment, not the content.** A grid of stock outline icons in rounded squares, each over a heading and a paragraph, is the clean-SaaS anti-reference wearing brand colors: decoration standing exactly where evidence should be. About's six value cards are the reference case and the icons come out. **The six values themselves stay** and get re-set as a typographic statement or paired with real documentary imagery. Stock iconography is never a substitute for evidence anywhere on this site.
4. **Thin is not lean.** Events, Projects, and Resources sit inside budget because they are nearly empty, not because they are disciplined. Under-budget with nothing above rung 5 is the same defect as over-budget, and it fails rule 1.
5. **A surface may not describe a thing the site could show instead.** "What We Do" listing four event types in prose, while an events collection and a live Luma feed exist, is the canonical violation.

### PATCH belongs on the site

**Decided 08/09/2026: yes, and it is the strongest evidence the org has.** PATCH is a defined series with written doctrine, a tagline (_"Learn it. Build it. Take it home."_), physical stickers, and collectible digital artifacts — and it appears nowhere on the website.

Two lines from `PATCH_SERIES.md` are this contract restated in the org's own words, written before it:

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

Beyond the token table in `docs/design-system.md`, one systemic rule: **each page owns a hero color, and sections alternate cream → tinted cream → saturated** to create vertical rhythm. The hero color is a page's identity; changing one is a product decision, not a styling tweak.

Contrast contract: white text on coral/purple/pink heroes, dark text on the yellow homepage hero. Any new hero color must be checked against both.

## Type scale

Defined in `src/styles/global.css` `@layer base`, fluid across three breakpoints:

| Level | Mobile → Desktop                     |
| ----- | ------------------------------------ |
| h1    | `text-4xl` → `text-5xl` → `text-6xl` |
| h2    | `text-3xl` → `text-4xl` → `text-5xl` |
| h3    | `text-2xl` → `text-3xl` → `text-4xl` |
| h4    | `text-xl` → `text-2xl`               |

The homepage hero opts out with explicit pixel sizes because it is a display element, not a heading in the scale. That exception is deliberate and should stay rare — a second opt-out is a signal the scale is wrong.

## Motion contract

The strongest existing part of this system and the least documented outside code comments. Two families, and the distinction is an accessibility boundary, not a naming convention:

| Family         | Behavior              | Purpose                                                                            |
| -------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `.pcv-enter-*` | Runs **once** on load | Entrances — word, rise, stat, bar                                                  |
| `.pcv-loop-*`  | Runs **forever**      | Narrates the Lab story: a dot arrives alone, two more join, you leave with a thing |

**Rules:**

1. **Looping motion is reserved for the Lab narrative on the homepage** (`BuilderNightTrack.astro`, pending rename to `LabTrack.astro`). It is the page's only infinite motion. Do not add a second looping element anywhere without retiring this one — two competing loops destroy the narrative reading.
2. **Every looping element must be legible in its final state**, because `prefers-reduced-motion` freezes it exactly there.
3. **The reduced-motion block is deliberately unlayered** (outside `@layer`) so it wins against Tailwind's cascade order regardless of layer sorting. Do not move it into a layer.
4. **`.pcv-loop-track` needs an explicit `width: 100%` under reduced motion.** It draws itself by animating width from 0; freezing it without restoring width leaves a zero-width line and the timeline dots sit on nothing. This is the one element that is unsafe to freeze naively.
5. **Standard easing is `cubic-bezier(0.22, 1, 0.36, 1)`** for entrances and joins — a decelerating ease-out. Durations cluster at 0.8–1.0s for entrances and 8s for the loop cycle.
6. **New motion goes through the `animate` skill**, per the design-team charter. `impeccable animate` is not used on this repo.

## Known tensions

Real conflicts between the current build and the tooling now installed. Each needs a decision before enforcement is switched on.

1. **`.gradient-text` will trip the detector.** `src/styles/global.css` defines a gradient-text utility (`bg-clip-text text-transparent`, accent-400 → accent-600). Impeccable's detector lists **gradient text** as an immediate-tier mechanical violation. When `$impeccable hooks on` is run this will fire on every edit to files using it.
   **Verified: it is defined and never used.** `grep -rn "gradient-text" src/ docs/` returns exactly one hit — the definition at `src/styles/global.css:61`. No template references it.
   _Recommendation:_ delete the utility. It is dead code that will generate a recurring detector finding and an exception entry for a style the site does not use. Deleting is strictly cheaper than documenting an exception.
2. **Google Fonts are loaded remotely** while Alpine.js was deliberately self-hosted for CSP and supply-chain reasons. That inconsistency is defensible but currently unstated.
3. **`docs/design-system.md` says all pages use the default OG banner.** If per-page OG images are ever added, that doc and this one both need updating — it is the most likely drift point in the design docs.
4. **The gallery collection is empty, so rung 3 has never once rendered.** `src/content/gallery/` contains no entries. The homepage photo section is written, correct, and has been dark since it shipped — the site's only documentary slot, absent-by-default exactly as designed, with nothing to be present. Confirmed 08/09/2026 that a cleared photo archive exists. **The absent-by-default pattern stays**; this is a content-loading task, not a design change, and it is the cheapest single move on the entire ladder.
5. **`src/content/projects/` holds one file, `example-project.md`.** Rung 2 on `/projects` is a placeholder. The Projects surface cannot satisfy rule 1 by design work alone.
6. ~~**Playable proof introduces a gesture layer this system does not have.**~~ **Resolved 08/09/2026: no spring layer.** Operable objects stay inside CSS, per the constraint above. `.pcv-enter-*` remains the only motion vocabulary. Revisit only if a real object needs drag or throw, and revisit through `animate`.
7. **A block comment marked `DRAFT — needs Waskar's review before shipping` is live in production.** `src/pages/about.astro:50-55`, wrapping the founder's note. **Resolved 08/09/2026: Waskar is being interviewed and the note will be rewritten in his own words** — under the evidence contract it becomes the spine of About, so it is the one piece of prose on the site that has to be earned rather than drafted.

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
