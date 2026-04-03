# Design System

This doc covers the visual identity of the PhilaCon Valley website — colors, fonts, component styles, and how to use them.

## Brand Colors

All colors are defined in `tailwind.config.mjs`. You use them with Tailwind classes like `bg-accent-400` or `text-brand-dark`.

### Primary (Warm Yellow/Amber)

The warm, welcoming base of the palette.

| Token | Hex | Usage |
|---|---|---|
| `primary-100` | `#FFEED0` | Cream backgrounds, input fields |
| `primary-300` | `#FDC873` | Secondary buttons |
| `primary-400` | `#FCBC68` | Hover states |

### Accent (Pink/Coral)

The energetic pop color for CTAs and highlights.

| Token | Hex | Usage |
|---|---|---|
| `accent-400` | `#FF66A8` | Primary buttons, CTA sections, active nav |
| `accent-500` | `#F07AAC` | Button hover |
| `accent-600` | `#EF657F` | Links, "View on GitHub" labels |

### Brand Tokens

Named colors for specific uses:

| Token | Hex | Usage |
|---|---|---|
| `brand-yellow` | `#FDC873` | Homepage hero background |
| `brand-cream` | `#FFEED0` | Page body background |
| `brand-pink` | `#FF66A8` | CTA sections |
| `brand-coral` | `#EF657F` | Page heroes (About, Resources, Contact) |
| `brand-purple` | `#B383C3` | Page heroes (Events, Projects, Support) |
| `brand-dark` | `#1A1A1A` | Header, footer, text |

### Page Hero Colors

Each page has a distinct hero background:

| Page | Color | Class |
|---|---|---|
| Home | Yellow | `bg-brand-yellow` |
| About | Coral | `bg-brand-coral` |
| Events | Purple | `bg-brand-purple` |
| Projects | Purple | `bg-brand-purple` |
| Resources | Coral | `bg-brand-coral` |
| Join | Pink | `bg-accent-400` |
| Support | Purple | `bg-brand-purple` |
| Contact | Coral | `bg-brand-coral` |

## Fonts

| Font | Tailwind class | Usage |
|---|---|---|
| [Baloo 2](https://fonts.google.com/specimen/Baloo+2) | `font-display` | Headings, buttons, nav links, tags |
| [Nunito](https://fonts.google.com/specimen/Nunito) | `font-sans` | Body text, descriptions, form labels |

Baloo 2 is playful and bold — it gives the site its personality. Nunito is clean and rounded — easy to read for longer text.

Fonts are loaded via Google Fonts in `src/layouts/BaseLayout.astro` with `preconnect` hints for performance.

## Components

### Buttons (`src/components/Button.astro`)

Three variants, all pill-shaped:

| Variant | Look | Usage |
|---|---|---|
| `primary` | Pink background, white text | Main CTAs ("Join", "Donate") |
| `secondary` | Yellow background, dark text | Secondary actions |
| `outline` | Transparent with border | Tertiary actions, dark backgrounds |

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

## Making Changes

- **Colors**: Edit the `colors` object in `tailwind.config.mjs`
- **Fonts**: Update the `fontFamily` in `tailwind.config.mjs` and the Google Fonts `<link>` in `src/layouts/BaseLayout.astro`
- **Card style**: Edit the `.card` class in `src/styles/global.css`
- **Button variants**: Edit `src/components/Button.astro`

## Next Steps

- [Architecture](architecture.md) — How the full codebase is organized
- [Contributing Guide](contributing.md) — How to submit your changes
