/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFBF7',
          100: '#F8F2E4',
          200: '#EFE3CA',
          300: '#E2CEAA',
          400: '#D1B482',
        },
        gold: {
          400: '#C8A44D',
          500: '#A68332',
          600: '#8B6B23',
          700: '#6E5319',
          800: '#523C10',
          900: '#3B2B0A',
        },
        mahogany: {
          800: '#2A1F17',
          900: '#1D150F',
          950: '#130D09',
        },
      },
      fontFamily: {
        serif: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px -4px rgba(29, 21, 15, 0.35), 0 2px 6px -1px rgba(139, 107, 35, 0.2)',
        'card-hover': '0 16px 36px -6px rgba(139, 107, 35, 0.45), 0 4px 12px -2px rgba(29, 21, 15, 0.3)',
        'gold-glow': '0 0 0 3px rgba(200, 164, 77, 0.5), 0 12px 28px rgba(139, 107, 35, 0.35)',
      },
    },
  },
  plugins: [],
};
