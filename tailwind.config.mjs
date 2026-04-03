/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // PhilaCon Valley brand palette — extracted from official brand file
        primary: {
          50:  '#FFF9F0',
          100: '#FFEED0',
          200: '#FDE0A8',
          300: '#FDC873',
          400: '#FCBC68',
          500: '#F5A623',
          600: '#D98E1C',
          700: '#B07316',
          800: '#8A5A11',
          900: '#6B450D',
          950: '#4A2F09',
        },
        accent: {
          50:  '#FFF0F5',
          100: '#FFD6E7',
          200: '#FFB3D1',
          300: '#FF8FB3',
          400: '#FF66A8',
          500: '#F07AAC',
          600: '#EF657F',
          700: '#D94E6A',
          800: '#B33D55',
          900: '#8C2F43',
          950: '#5C1F2D',
        },
        brand: {
          yellow:  '#FDC873',
          cream:   '#FFEED0',
          pink:    '#FF66A8',
          coral:   '#EF657F',
          salmon:  '#F37188',
          purple:  '#B383C3',
          amber:   '#FCBC68',
          dark:    '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'cursive', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'retro': '4px 4px 0 rgba(26,26,26,0.15)',
        'retro-lg': '6px 6px 0 rgba(26,26,26,0.15)',
        'retro-hover': '8px 8px 0 rgba(26,26,26,0.12)',
      },
      borderRadius: {
        'retro': '20px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
