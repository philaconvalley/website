# DESIGN.md — PhilaCon Valley website

The **decision layer** for design work on this site: the visual thesis, the motion contract, and the rules that govern change.

> **This is not the token reference.** `docs/design-system.md` is, and it is contributor-facing and already good. It owns colors, fonts, button variants, card styles, page hero assignments, and OG image specs. **Do not duplicate any of that here.** If a token value appears in both files, one of them is wrong — and it will be this one.
>
> Split of responsibility:
>
> - `docs/design-system.md` — _what the values are_, for someone making a change.
> - `DESIGN.md` — _why they are what they are, and what must stay true_, for someone deciding a change.

## Visual thesis

**Retro-warm and hand-made, not clean-modern.** The site reads as friendly and slightly analog, and it earns that from four decisions working together — none of which survive alone:

1. **Rounded display type.** Baloo 2 at heavy weights with tight negative tracking (`-0.03em` mobile, `-0.035em` desktop) on a 44px→96px hero. The roundness is the personality; the tightness stops it reading as childish.
2. **Hard offset shadows, not blurred ones.** `4px 4px 0`, `6px 6px 0`, `8px 8px 0` at low-alpha near-black. Zero blur radius. This is the single most identity-bearing token in the system — a blurred shadow anywhere in the UI breaks the world more than a wrong color would.
3. **Generous corner radius.** `20px` (`rounded-retro`) plus pill buttons.
4. **Warm ground, cool never.** Cream body (`brand-cream`), amber/coral/pink/purple accents. There is no neutral gray in the palette and no cool tone anywhere. Introducing slate/zinc/blue-gray is the fastest way to make this site look like every other site.

**Anti-references:** clean SaaS minimalism, glassmorphism, dark-mode-first dashboards, thin light-weight type, blurred drop shadows, gray neutrals.

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

| Family         | Behavior              | Purpose                                                                                      |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `.pcv-enter-*` | Runs **once** on load | Entrances — word, rise, stat, bar                                                            |
| `.pcv-loop-*`  | Runs **forever**      | Narrates the Builder Night story: a dot arrives alone, two more join, you leave with a thing |

**Rules:**

1. **Looping motion is reserved for the Builder Night narrative on the homepage.** It is the page's only infinite motion. Do not add a second looping element anywhere without retiring this one — two competing loops destroy the narrative reading.
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

## How to change this system

| Change              | Route                                                        |
| ------------------- | ------------------------------------------------------------ |
| A token value       | `tailwind.config.mjs`, then update `docs/design-system.md`   |
| The type scale      | `src/styles/global.css` `@layer base`, then update this file |
| Motion              | `animate` skill; obey the two-family rule above              |
| A page's hero color | Product decision — update `docs/design-system.md` hero table |
| The visual thesis   | Not a styling change. Re-run `/design-team doc`.             |

Enforcement: `$impeccable hooks on` wires mechanical checks; `$impeccable doctor` reports drift between these docs and the code. Confirmed-intentional findings become exceptions via `hook-admin.mjs`, never by hand.
