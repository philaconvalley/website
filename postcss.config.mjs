/**
 * Tailwind is wired through PostCSS directly rather than through
 * @astrojs/tailwind. That integration is capped at `astro@^5` (6.0.2 is its last
 * release) and Astro deprecated it in favour of @tailwindcss/vite, which requires
 * Tailwind 4 — a separate migration of the whole theme. Vite reads this config on
 * its own, so Tailwind 3 keeps working with no integration in between.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
