# Design System

This doc covers the visual identity of the PhilaCon Valley website — colors, fonts, component styles, and how to use them.

## Where these values come from

Three layers, in order of authority. When they disagree, the one above wins.

| Layer                                                     | Holds                                         | Where                                       |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| **PhilaCon Valley Brand Identity Guidebook, Edition 1.2** | What the brand _is_. Canonical.               | Private, held by the org — not in this repo |
| `tailwind.config.mjs`                                     | The Book's values as code. The implementation | This repo                                   |
| This doc                                                  | What the values are for, and how to use them  | This repo                                   |

Edition 1.2 (08/21/2026) replaced Edition 1.0. The site moved to its values on 10/15/2026. **The Edition 1.3 draft is not canonical** — do not take values from it, even where it looks newer. **Do not invent a token here.** If the site needs a value the Book does not have, that is a conversation with the brand team, not a config edit.

## Brand Colors

All colors are defined in `tailwind.config.mjs`. You use them with Tailwind classes like `bg-brand-yellow` or `text-brand-dark`.

### The eight Book colors

The Book: _"Seven colors. One system. Sampled from the official mascot and logo artwork."_ (Seven accents plus White.)

| Token          | Hex       | Also reachable as | Role (per the Book)                                       |
| -------------- | --------- | ----------------- | --------------------------------------------------------- |
| `brand-yellow` | `#FCD66A` | `primary-300`     | Golden Yellow. Carries most surfaces. The header bar.     |
| `brand-amber`  | `#FDBD69` | `primary-400`     | Accent field. Footer column labels.                       |
| `brand-pink`   | `#EA71AC` | `accent-400`      | Hot Pink. Primary CTA, the focus ring, the nav pill.      |
| `brand-coral`  | `#EE657E` | `accent-600`      | Coral Pink. Accent field.                                 |
| `brand-purple` | `#9B7CAF` | —                 | Belongs to the keyboard. **Not a hero or section color.** |
| `brand-sky`    | `#028DFF` | —                 | A deliberate exception. **Never a background.**           |
| `brand-dark`   | `#1A1A1A` | —                 | Ink. Text, the 2px outline, shadows, dark sections.       |
| `white`        | `#FFFFFF` | —                 | The light neutral. The page body.                         |

Prefer the `brand-*` name when you mean the role ("this is the CTA"), and the scale step when you mean a position in a ramp ("one step darker on hover").

**Two tokens are on their way out.** `brand-cream` (`#FFEED0`) was the 1.0 page body; Edition 1.2 replaced it with White. `brand-salmon` (`#F37188`) is not in Edition 1.2; only `LabTrack` uses it. Both stay defined until the pages that use them are rebuilt. **Do not use either in new work.**

### The scales

`primary-*` (yellow to burnt amber) and `accent-*` (blush to wine) have eleven steps each. The Book defines colors, not ramps, so only four steps carry Book values: `primary-300`, `primary-400`, `accent-400`, and `accent-600`. The other steps are the older 1.0 ramp, kept so existing hover and tint classes still resolve. Full values in `tailwind.config.mjs`.

### Out of system

The Book is explicit: **cold blues, flat greys, gradients, blurred shadows, and frosted glass are out of system.** That rules out the default blue focus ring, grey text and placeholder fills, `backdrop-blur`, and most third-party component defaults — expect to restyle them rather than accept them. **Secondary text is never grey.** Use full ink on light fields and full white on ink. Do not lower the text opacity to make it "quieter".

### The Dial

The brand runs louder for community work and quieter for agency work. Same palette, different setting (Book section 07).

| Dial    | Community             | Agency / services                       |
| ------- | --------------------- | --------------------------------------- |
| Ground  | Golden Yellow + White | Same palette                            |
| Outline | Full 2–3px ink        | 1.5px ink                               |
| Shadows | Hard ink offset       | Softer: a smaller offset, still no blur |
| Mascot  | Front and center      | Smaller — header / footer only          |
| Type    | As specified          | Steps down one notch                    |

**This site is the community end of the dial.** Wrap a page or section in `[data-surface="agency"]` to switch (see `src/styles/global.css`).

### Page hero colors

Each page owns one hero color (_"Hero color rotates by page"_). Decided 10/15/2026, applied as each page is rebuilt for Edition 1.2:

| Page      | Hero          | Class             |
| --------- | ------------- | ----------------- |
| Home      | Golden Yellow | `bg-brand-yellow` |
| About     | Golden Yellow | `bg-brand-yellow` |
| Join      | Golden Yellow | `bg-brand-yellow` |
| Events    | Hot Pink      | `bg-brand-pink`   |
| Projects  | Amber         | `bg-brand-amber`  |
| Contact   | Amber         | `bg-brand-amber`  |
| Support   | Coral Pink    | `bg-brand-coral`  |
| Arcade    | Ink           | `bg-brand-dark`   |
| Resources | White         | `bg-white`        |

Every hero takes **ink text**, except the Arcade's ink hero, which takes white. Until a page is rebuilt it still shows its 1.0 hero.

## Fonts

| Font                                                 | Tailwind class | Usage                                   | Weights in use              |
| ---------------------------------------------------- | -------------- | --------------------------------------- | --------------------------- |
| [Baloo 2](https://fonts.google.com/specimen/Baloo+2) | `font-display` | Headings, buttons, nav links            | **800**, 700, 600           |
| [Nunito](https://fonts.google.com/specimen/Nunito)   | `font-sans`    | Body, labels, pills, form fields        | 400, 600, 700, 800, **900** |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | `font-mono`    | Code samples, metadata rows, event date | 400, 500                    |

The `font-display` stack falls back to `system-ui`, never to `cursive`: on macOS, `cursive` is a script face (Apple Chancery) that makes a failed font load look broken.

All three are **self-hosted** from `@fontsource` packages, imported in `src/layouts/BaseLayout.astro`. Nothing loads from Google Fonts, so a page view sends nothing to Google. To add a weight, add its `@fontsource/<font>/<weight>.css` import there.

### Headings

`h1`, `h2`, and `h3` render **uppercase** in Baloo 2 at 800. Do not add `font-bold` to a heading: it drops the weight to 700. Do not add a size class either: the scale in `DESIGN.md` ("Type scale") sets the size. The capitals come from CSS — **type the source in sentence case**, never in capitals. The sizes are fluid `clamp()` values in `rem`, set in `src/styles/global.css`, with tighter tracking as type grows. Headings inside `.prose` (resource guides) keep sentence case on screen, because they are reading aids, not display type.

## Components

### Buttons (`src/components/Button.astro`)

Pill-shaped, a 2px ink outline, a hard ink shadow, ink text on every warm fill. Baloo 2 at 800, as Book §05 sets for buttons. Decided 10/15/2026: the Book wins over the mockup on font (the mockup used Nunito 900) and on the main fill (the mockup used ink; the Book says "Hot Pink or Golden Yellow fill").

| Size | Height | Side padding | Text |
| ---- | ------ | ------------ | ---- |
| `sm` | 44px   | 22px         | 15px |
| `md` | 50px   | 24px         | 16px |
| `lg` | 55px   | 28px         | 17px |

The heights match the mockup, and every size clears the 44px touch target. A raw `<button>` that cannot use the component (the Contact form's submit, which Alpine disables while sending) copies the `lg` primary classes.

| Variant     | Fill          | Use it for                                                                        |
| ----------- | ------------- | --------------------------------------------------------------------------------- |
| `primary`   | Hot Pink      | The main call to action                                                           |
| `secondary` | Golden Yellow | A second action on a white or ink section                                         |
| `light`     | White         | A second action on a yellow or saturated section                                  |
| `ink`       | Ink           | The strongest action on a yellow or saturated section                             |
| `outline`   | None          | Tertiary actions. Takes the text color it sits on, so it works on dark fields too |

```astro
<Button href="/join" variant="primary" size="lg">
  Join us →
</Button>
<Button href="/events" variant="light">
  See events
</Button>
```

### Header (`src/components/Header.astro`)

Chosen in the 10/15/2026 header prototype.

- **Bar:** opaque Golden Yellow with a 2px ink bottom edge. 64px tall on phones, 74px from `lg`.
- **Mark + wordmark:** the Book's primary lockup, "Mascot + wordmark". The wordmark is the official file `public/images/philacon-wordmark-horizontal.svg`, copied unchanged from the brand logo library. Its built-in ink outline meets the Book's rule for pink on yellow. The pigeon head (`public/images/pigeon-head-mark-160.webp`) hangs over the ink edge at the top of the page and tucks inside the bar once the visitor scrolls or opens the phone menu. See `DESIGN.md`, motion rule 13 and known tension 12.
- **Nav links:** Baloo 2 at 800, 15px at `lg` and 16px from `xl`, full ink. The header row keeps at least 25px between the wordmark, the links, and the date or RSVP at every width from 1024px. The Hot Pink pill marks the current page and follows the pointer.
- **RSVP:** Book p14 button — Hot Pink fill, ink text, 2px ink outline, ink offset shadow. Hover lifts it and grows the shadow from 3px to 6px. The old ink fill hid its own ink shadow, so its hover was invisible.
- **Phone menu:** a solid ink panel, edge to edge, with links aligned to the mark.

### Cards (`.card` in `global.css`)

White fill, 20px corners, a 2px ink outline, and a hard 6px ink shadow that grows on hover (Book section 10).

```html
<div class="card p-6">Card content here</div>
```

### Pills (`.pill`) and stickers (`.sticker`)

- `.pill` — a small flat label: stadium radius, 2px ink outline, uppercase Nunito 900. Set the fill with a color utility: `<span class="pill bg-brand-yellow">Free</span>`.
- `.sticker` — one highlighted word inside a display heading: white fill, 3px ink outline, hard shadow, a slight tilt. One per heading at most.

### Shadows

All shadows are solid ink with zero blur. `shadow-retro-sm` (3px), `shadow-retro` (4px), `shadow-retro-lg` (6px), `shadow-retro-hover` (9px), `shadow-retro-xl` (10px). **A blurred shadow anywhere breaks the system** — never use Tailwind's `shadow-md` or `shadow-lg`.

### Footer (`src/components/Footer.astro`)

Chosen in the 10/15/2026 footer review, after the mockup.

- **Left block:** the official wordmark (`public/images/philacon-wordmark-horizontal.svg`, the same file as the header) and one line: "Come as you are. Leave with a flock. A free, in-person tech community in Philadelphia, PA." The wordmark is the footer's only link home. Book §07 puts the wordmark, not the mascot, in footers, and says the mark is pulled from the library, never rebuilt. Diego's mockup typed the name in Baloo 2 instead.
- **Columns:** Explore, Get involved, Find us, with amber labels and white links. The mockup's "Start a project" link waits until a real page exists.
- **Bottom row:** location and email on the left; "This site is open source", Privacy, and the copyright on the right. All text is full white, because the Book has no greys.
- **The motto** is not in the footer. It lives in `ClosingFlock`, the section above it.

### Closing section (`src/components/ClosingFlock.astro`)

The section every page ends on: the motto on Golden Yellow, the pigeon, and an ink skyline that runs into the footer. Place it as the last element inside `<main>`, and remove the page's own closing call to action. Pass `lede` to change the line under the motto.

### Section backgrounds

Sections alternate **White → Ink → one saturated field** (Golden Yellow, Amber, Hot Pink, or Coral Pink). Every section edge is a 2px ink line.

## Accessibility

The Book's framing, worth keeping: _"Accessibility is not a checklist run at the end. It's a default designed from."_

### Contrast

Ratios computed from the Edition 1.2 values (WCAG 2.x). AA needs **4.5** for normal text and **3.0** for large text (24px and up, or 18.66px bold).

| Text on…      | Ink      | White                         |
| ------------- | -------- | ----------------------------- |
| White         | **17.4** | —                             |
| Golden Yellow | **12.4** | 1.4 — never                   |
| Amber         | **10.5** | 1.7 — never                   |
| Hot Pink      | **6.2**  | 2.8 — never                   |
| Coral Pink    | **5.6**  | 3.1 — large display text only |
| Purple        | **4.9**  | 3.6 — large display text only |
| Ink           | —        | **17.4**                      |

**Ink text is the default on every color.** White text goes on Ink. The 1.0 version of this table listed white on coral at 4.9:1; the real figure is 3.1:1, which is why the 1.0 heroes are moving to ink text. Hot Pink as text on white is 2.8:1, so pink is a fill, never a text color.

### Focus states

The Book specifies: **Hot Pink ring, 2px outline, 2px offset — identical across buttons, inputs, and links. Always visible, never hover-only.** `global.css` applies exactly that through one `*:focus-visible` rule. Do not add `focus:ring-*` utilities to components; they draw a second ring.

### Beyond contrast

- **Alt text on every image**, the mascot included. A pigeon with no description is invisible to a screen reader.
- **Never set body below 14px**; keep line-height 1.5+ on long copy.
- **Plain language.** No jargon a beginner can't follow, no idioms that exclude non-native speakers. Spell out acronyms on first use.
- **Captions on every video** — burned in for social, separate file for archive.

## OG Images (Social Sharing)

Each page can specify a unique Open Graph image for social sharing previews. Pass the `image` prop to `BaseLayout`:

```astro
<BaseLayout
  title="Events - PhilaCon Valley"
  description="Join us for hands-on workshops..."
  image="/images/og-events.png"
/>
```

**Image specs**: 1200x675px, PNG or JPG. Place files in `public/images/`.

Currently all pages use the default banner (`/images/1200x675 banner.png`). To add unique images per page, create them and add the `image` prop — the SEO component handles the rest.

### Arcade Cabinet (`src/components/ArcadeCabinet.astro`)

Used only on `/arcade`. The whole cabinet — marquee, screen and control deck —
is a single `<a>`, so the obvious click target (the artwork) actually works
and a screen reader's link list gets one entry per cabinet instead of several
pointing at the same place.

| Part         | Token                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Cabinet body | `bg-brand-dark`                                                                |
| Marquee      | one of `bg-brand-pink`, `bg-brand-purple`, `bg-brand-yellow`, `bg-brand-coral` |
| Screen bezel | `border-black`                                                                 |
| Control deck | `bg-primary-950`, with an offset joystick and two round buttons                |
| Placard text | `text-brand-dark`                                                              |
| Focus ring   | `group-focus-visible:ring-accent-500` on the cabinet housing                   |

The marquee crowns the housing flush to the top edge — no margin, sharing the
housing's corner radius — so it reads as the machine's lit header rather than
a label pinned inside a box.

The empty "YOUR GAME HERE" submission cabinet uses `bg-primary-200` for its
marquee, not a faded/opacity version of the live marquee colors. Fading the
whole marquee (background and text together) drags the text below WCAG AA
against its own background; swapping to a genuinely muted token keeps
full-strength text contrast while still reading as "powered off" next to the
saturated, lit marquees around it.

Two rules worth keeping:

**No pixel font.** The cabinet silhouette is what says "arcade" — the typeface
is not asked to do that job. Baloo 2 at `font-extrabold` on the marquee is the
whole treatment. A third typeface would cost contrast at small sizes and buy
nothing.

**Dark as an object, not a theme.** The cabinet is dark the way `Header` and
`Footer` are dark. The page stays white. The site has no dark mode, and the
arcade does not introduce one.

### Arcade Player (`src/components/CabinetFrame.astro`)

Used on each cabinet's own page (`/arcade/<slug>/`) to embed the actual game.
The game runs in a sandboxed `<iframe sandbox="allow-scripts">` behind a
"Click to play" overlay — nothing animates or takes focus until a visitor
opts in.

Once a game has focus, it owns the keyboard: **the documented way out is Tab
(or Shift+Tab), or clicking outside the frame — not Esc.** This isn't a
design choice; it's a browser constraint. Once the sandboxed iframe holds
keyboard focus, its keydown events never reach the parent window, so an
`Esc` handler on the page cannot fire while the game has focus. Tab still
works because the browser itself moves focus out of the iframe, not the
page's own JavaScript. If you're documenting or reviewing the cabinet page's
behavior, say "press Tab," not "press Esc."

## Making Changes

- **Colors**: the palette is the Book's, not this repo's. Adding or changing a token is a brand-team conversation first; `tailwind.config.mjs` is where the agreed value lands, not where it gets decided.
- **Fonts**: update the `fontFamily` in `tailwind.config.mjs` and the `@fontsource` imports in `src/layouts/BaseLayout.astro`. Same rule — the Book names the faces.
- **Card style**: Edit the `.card` class in `src/styles/global.css`
- **Button variants**: Edit `src/components/Button.astro`

## Next Steps

- [Architecture](architecture.md) — How the full codebase is organized
- [Contributing Guide](contributing.md) — How to submit your changes
