# Design System

This doc covers the visual identity of the PhilaCon Valley website — colors, fonts, component styles, and how to use them.

## Where these values come from

Three layers, in order of authority. When they disagree, the one above wins.

| Layer                                       | Holds                                         | Where                                       |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| **PhilaCon Valley Brand Book, Edition 1.0** | What the brand _is_. Canonical.               | Private, held by the org — not in this repo |
| `tailwind.config.mjs`                       | The Book's values as code. The implementation | This repo                                   |
| This doc                                    | What the values are for, and how to use them  | This repo                                   |

The Book states its eight color tokens "mirror the live `TAILWIND.CONFIG.MJS`," so the config is the implementation of record — but it mirrors the Book, not the other way around. **Do not invent a token here.** If the site needs a value the Book does not have, that is a conversation with the brand team, not a config edit.

This doc previously listed six brand tokens when the Book defines eight, and split single colors across multiple tables under different names. Both are fixed below. If you find another gap, fix it here rather than working around it.

## Brand Colors

All colors are defined in `tailwind.config.mjs`. You use them with Tailwind classes like `bg-accent-400` or `text-brand-dark`.

### The eight canonical tokens

The Book: _"Eight named tokens carry the brand. The palette was voted on by the community, which gives it ownership weight beyond aesthetics."_ That vote is why these are not casually re-picked.

| Token          | Hex       | Also reachable as | Role (per the Book)                               |
| -------------- | --------- | ----------------- | ------------------------------------------------- |
| `brand-yellow` | `#FDC873` | `primary-300`     | Homepage hero. The welcome.                       |
| `brand-cream`  | `#FFEED0` | `primary-100`     | The page body. Not white — cream signals warmth.  |
| `brand-pink`   | `#FF66A8` | `accent-400`      | Primary CTA. Active nav. The pop.                 |
| `brand-coral`  | `#EF657F` | `accent-600`      | Links. About / Resources / Contact heroes.        |
| `brand-salmon` | `#F37188` | —                 | Mascot belly band. **Decorative only.**           |
| `brand-purple` | `#B383C3` | —                 | Events / Projects / Support heroes; the keyboard. |
| `brand-amber`  | `#FCBC68` | `primary-400`     | Hover state for yellow surfaces.                  |
| `brand-dark`   | `#1A1A1A` | —                 | Ink. Header, footer, body text, the 2px outline.  |

**Five of the eight are aliases of scale steps.** `bg-brand-pink` and `bg-accent-400` paint the identical color. Prefer the `brand-*` name when you mean the role ("this is the CTA"), and the scale step when you mean a position in a ramp ("one step darker on hover"). Never document the same hex twice under two names as if they were different decisions — that is how a page ends up with `accent-600` links next to a `brand-coral` hero and nobody noticing they match.

### The scales

Eleven steps each. **Primary** is the welcome — cream climbing to burnt amber. **Accent** is the pop — blush deepening to wine. Step 400 is the workhorse on both. Full values in `tailwind.config.mjs`; the steps in routine use are the aliases above plus `accent-500` (`#F07AAC`, button hover) and `primary-50` (`#FFF9F0`, off-cream — see The Dial).

### Out of system

The Book is explicit: **cold blues, flat greys, and anything that reads corporate are out of system.** This is a real constraint, not a preference. It rules out the default blue focus ring, grey placeholder fills, and most third-party component defaults — expect to restyle them rather than accept them.

### The Dial

The brand runs warmer for community work and calmer for agency work. Same palette, different setting.

| Dial            | Community                                       | Agency / services                           |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| Page background | Cream `#FFEED0` — the welcome                   | Off-cream `#FFF9F0` (`primary-50`) — calmer |
| Hero fills      | Yellow / coral / purple / pink — all four, loud | One signature color — lean coral or ink     |
| Mascot          | Front and center — homepage, social, stickers   | Smaller — header / footer only              |

**This site is the community end of the dial.** Cream body, all four hero colors, mascot present. If a page ever needs the agency setting, it is a deliberate move down the dial, not a one-off palette choice.

### Page hero colors

Each page has a distinct hero background:

| Page      | Color  | Class             |
| --------- | ------ | ----------------- |
| Home      | Yellow | `bg-brand-yellow` |
| About     | Coral  | `bg-brand-coral`  |
| Events    | Purple | `bg-brand-purple` |
| Projects  | Purple | `bg-brand-purple` |
| Resources | Coral  | `bg-brand-coral`  |
| Join      | Pink   | `bg-accent-400`   |
| Support   | Purple | `bg-brand-purple` |
| Contact   | Coral  | `bg-brand-coral`  |
| Arcade    | Coral  | `bg-brand-coral`  |

These follow the Book's role assignments: coral heroes for About / Resources / Contact, purple for Events / Projects / Support.

## Fonts

| Font                                                 | Tailwind class | Usage                                | Weights in use                              |
| ---------------------------------------------------- | -------------- | ------------------------------------ | ------------------------------------------- |
| [Baloo 2](https://fonts.google.com/specimen/Baloo+2) | `font-display` | Headings, buttons, nav links, tags   | **700 Bold, 800 Extra-bold**                |
| [Nunito](https://fonts.google.com/specimen/Nunito)   | `font-sans`    | Body text, descriptions, form labels | **400 Regular, 600 Semibold**, 700 emphasis |

Baloo 2 carries the personality — round, friendly, almost always heavy. Nunito carries the substance, sitting under Baloo without competing.

**Baloo light weights almost never appear.** The Book is direct about this: at display sizes the brand goes heavy. A thin heading is off-brand even when it looks fine in isolation.

### JetBrains Mono — specified, not shipped

The Book names [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) as the sanctioned companion for code samples, metadata rows, and small technical labels. **The repo does not ship it today** — the Book says so itself, and it remains true. Code blocks currently inherit the browser default monospace.

That gap is already visible: `/resources/first-pull-request` renders seven code blocks of real terminal commands in whatever mono the visitor's browser picks. Adding the font is a deliberate change — a third webfont costs load time — so it is called out here rather than quietly done. But if you are wondering whether mono type is on-brand, it is, and this is the one to use.

Fonts are loaded via Google Fonts in `src/layouts/BaseLayout.astro` with `preconnect` hints for performance.

## Components

### Buttons (`src/components/Button.astro`)

Three variants, all pill-shaped:

| Variant     | Look                             | Usage                              |
| ----------- | -------------------------------- | ---------------------------------- |
| Variant     | Look                             | Usage                              |
| ----------- | -------------------------------- | ---------------------------------- |
| `primary`   | Pink background, brand-dark text | Main CTAs ("Join", "Donate")       |
| `secondary` | Yellow background, dark text     | Secondary actions                  |
| `outline`   | Transparent with border          | Tertiary actions, dark backgrounds |

```astro
<Button href="/join" variant="primary" size="lg">Join Us</Button>
<Button href="/events" variant="outline">View Events</Button>
```

### Cards (`.card` class in `global.css`)

Cards use a soft offset shadow that lifts on hover:

```html
<div class="card p-6">Card content here</div>
```

The `.card` class applies: white background, rounded corners, subtle border, offset shadow, and hover animation.

### Section Backgrounds

Alternate between cream and brand colors to create visual rhythm:

- Default page background: `bg-brand-cream`
- Alternate sections: `bg-primary-100` (lighter cream)
- Colored sections: `bg-brand-yellow`, `bg-brand-purple`, `bg-brand-coral`, `bg-accent-400`

## Accessibility

The Book's framing, worth keeping: _"Accessibility is not a checklist run at the end. It's a default designed from."_

### Contrast — the four combinations that come up

Ratios measured in the Book, not estimated here.

| Combination     | Ratio    | Verdict                    |
| --------------- | -------- | -------------------------- |
| Ink on cream    | **17.2** | AAA — body text lives here |
| Ink on pink     | **5.4**  | AA — headline weight works |
| White on coral  | **4.9**  | AA — hero text only        |
| White on yellow | **2.1**  | **FAILS. Never use this.** |

White on yellow is the one that looks acceptable on a bright laptop and is unreadable everywhere else. The homepage hero is yellow, so it uses **dark** text — that is the reason, not a stylistic preference.

Primary pink (`accent-400` / brand pink) CTAs use **brand-dark** text, not white — white-on-pink fails AA for normal text (about 2.7:1). Ink-on-pink clears AA (5.4:1 in the table above). Header RSVP already follows this; the shared `Button` primary variant matches.

### Focus states

The Book specifies: **pink ring (`#FF66A8`), 2px outline, 2px offset — identical across buttons, inputs and links.** Never blue. Never hover-only for navigation. The default browser focus ring is blue, which is out of system, so it gets replaced rather than suppressed.

What `global.css:41` actually applies is:

```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-accent-400 ring-2 ring-accent-400 ring-offset-2;
}
```

That is the Book's outline **plus** a second `ring-2` drawn on top of it — the spec asks for one ring and the site draws two, with a default-white `ring-offset` that sits oddly on cream. The color and geometry are right; the duplication is not. Left as-is here because changing focus styling site-wide is a visual change that deserves its own review, not a rider on a docs pass. Flagged so the next person doesn't read this section and assume the code already matches.

### Beyond contrast

- **Alt text on every image**, the mascot included. A pigeon with no description is invisible to a screen reader.
- **Never set body below 14px**; keep line-height 1.5+ on long copy. Baloo 2 and Nunito are open-lettered by design — don't undo that with sizing.
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
`Footer` are dark. The page stays cream. The site has no dark mode, and the
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
- **Fonts**: update the `fontFamily` in `tailwind.config.mjs` and the Google Fonts `<link>` in `src/layouts/BaseLayout.astro`. Same rule — the Book names the three faces.
- **Card style**: Edit the `.card` class in `src/styles/global.css`
- **Button variants**: Edit `src/components/Button.astro`

## Next Steps

- [Architecture](architecture.md) — How the full codebase is organized
- [Contributing Guide](contributing.md) — How to submit your changes
