/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  future: {
    // Compiles every `hover:` utility inside `@media (hover: hover)`. Without
    // it, tapping a card or button on a phone leaves the hover transform stuck
    // until you tap elsewhere. One flag instead of gating ~30 utilities by hand.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // PhilaCon Valley brand palette. Source: Brand Identity Guidebook
        // Edition 1.2 (08/21/2026), section 04. The Book defines eight colors and
        // no ramps, so only the alias steps below carry Book values (marked
        // "Book"). The other steps are the older 1.0 ramp, kept so existing
        // hover and tint classes still resolve. Do not invent new Book values here.
        primary: {
          50: '#FFF9F0',
          100: '#FFEED0',
          200: '#FDE0A8',
          300: '#FCD66A', // Book: Golden Yellow
          400: '#FDBD69', // Book: Amber
          500: '#F5A623',
          600: '#D98E1C',
          700: '#B07316',
          800: '#8A5A11',
          900: '#6B450D',
          950: '#4A2F09',
        },
        accent: {
          50: '#FFF0F5',
          100: '#FFD6E7',
          200: '#FFB3D1',
          300: '#FF8FB3',
          400: '#EA71AC', // Book: Hot Pink
          500: '#F07AAC',
          600: '#EE657E', // Book: Coral Pink
          700: '#D94E6A',
          800: '#B33D55',
          900: '#8C2F43',
          950: '#5C1F2D',
        },
        brand: {
          yellow: '#FCD66A',
          amber: '#FDBD69',
          pink: '#EA71AC',
          coral: '#EE657E',
          // Belongs to the keyboard. Not a hero or section color in this build.
          purple: '#9B7CAF',
          // A deliberate exception, never a background (Book section 04).
          sky: '#028DFF',
          dark: '#1A1A1A',
          // Edition 1.2 drops cream: White is the light neutral. Kept only until
          // each page is rebuilt, then removed. Do not use it in new work.
          cream: '#FFEED0',
          // Not in Edition 1.2. Only LabTrack uses it; it goes when LabTrack is
          // restyled.
          salmon: '#F37188',
        },
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif'],
        // No `cursive` fallback: if Baloo 2 ever fails to load, macOS fills
        // `cursive` with a script face (Apple Chancery) that reads as broken.
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        // Brand Book §04 — the sanctioned companion. Code samples, metadata
        // rows, captions, and the small technical labels. §11 specifies it for
        // the IG handle, flyer event meta, carousel pagination, deck footer
        // meta, and badge pronouns.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // Hard offset shadows in solid ink, zero blur (Book section 06). These
      // replaced the low-alpha 1.0 shadows on 10/15/2026. Names stay so every
      // existing `shadow-retro*` class picks up the new look.
      boxShadow: {
        'retro-sm': '3px 3px 0 #1A1A1A',
        retro: '4px 4px 0 #1A1A1A',
        'retro-lg': '6px 6px 0 #1A1A1A',
        'retro-hover': '9px 9px 0 #1A1A1A',
        'retro-xl': '10px 10px 0 #1A1A1A',
      },
      // The codebase's two curves, promoted from inline values to tokens
      // (DESIGN.md, motion rule 6). `ease-out` was Tailwind's weak default.
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      borderRadius: {
        // Card radius. Book §06: 18-24px; the mockup's standard card is 24px.
        retro: '24px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
