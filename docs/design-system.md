# Design System

This doc covers the visual identity of the PhilaCon Valley website — colors, fonts, component styles, and how to use them.

## Brand Colors

All colors are defined in `tailwind.config.mjs`. You use them with Tailwind classes like `bg-accent-400` or `text-brand-dark`.

### Primary (Warm Yellow/Amber)

The warm, welcoming base of the palette.

| Token         | Hex       | Usage                           |
| ------------- | --------- | ------------------------------- |
| `primary-100` | `#FFEED0` | Cream backgrounds, input fields |
| `primary-300` | `#FDC873` | Secondary buttons               |
| `primary-400` | `#FCBC68` | Hover states                    |

### Accent (Pink/Coral)

The energetic pop color for CTAs and highlights.

| Token        | Hex       | Usage                                     |
| ------------ | --------- | ----------------------------------------- |
| `accent-400` | `#FF66A8` | Primary buttons, CTA sections, active nav |
| `accent-500` | `#F07AAC` | Button hover                              |
| `accent-600` | `#EF657F` | Links, "View on GitHub" labels            |

### Brand Tokens

Named colors for specific uses:

| Token          | Hex       | Usage                                   |
| -------------- | --------- | --------------------------------------- |
| `brand-yellow` | `#FDC873` | Homepage hero background                |
| `brand-cream`  | `#FFEED0` | Page body background                    |
| `brand-pink`   | `#FF66A8` | CTA sections                            |
| `brand-coral`  | `#EF657F` | Page heroes (About, Resources, Contact) |
| `brand-purple` | `#B383C3` | Page heroes (Events, Projects, Support) |
| `brand-dark`   | `#1A1A1A` | Header, footer, text                    |

### Page Hero Colors

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

## Fonts

| Font                                                 | Tailwind class | Usage                                |
| ---------------------------------------------------- | -------------- | ------------------------------------ |
| [Baloo 2](https://fonts.google.com/specimen/Baloo+2) | `font-display` | Headings, buttons, nav links, tags   |
| [Nunito](https://fonts.google.com/specimen/Nunito)   | `font-sans`    | Body text, descriptions, form labels |

Baloo 2 is playful and bold — it gives the site its personality. Nunito is clean and rounded — easy to read for longer text.

Fonts are loaded via Google Fonts in `src/layouts/BaseLayout.astro` with `preconnect` hints for performance.

## Components

### Buttons (`src/components/Button.astro`)

Three variants, all pill-shaped:

| Variant     | Look                         | Usage                              |
| ----------- | ---------------------------- | ---------------------------------- |
| `primary`   | Pink background, white text  | Main CTAs ("Join", "Donate")       |
| `secondary` | Yellow background, dark text | Secondary actions                  |
| `outline`   | Transparent with border      | Tertiary actions, dark backgrounds |

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

- All interactive elements have visible focus styles using `accent-400`
- Buttons maintain contrast ratios against their backgrounds
- Hero text uses white on dark backgrounds (coral, purple, pink) for readability
- The homepage hero uses dark text on yellow

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

### Page Hero Colors

| Page   | Color | Class            |
| ------ | ----- | ---------------- |
| Arcade | Coral | `bg-brand-coral` |

## Making Changes

- **Colors**: Edit the `colors` object in `tailwind.config.mjs`
- **Fonts**: Update the `fontFamily` in `tailwind.config.mjs` and the Google Fonts `<link>` in `src/layouts/BaseLayout.astro`
- **Card style**: Edit the `.card` class in `src/styles/global.css`
- **Button variants**: Edit `src/components/Button.astro`

## Next Steps

- [Architecture](architecture.md) — How the full codebase is organized
- [Contributing Guide](contributing.md) — How to submit your changes
