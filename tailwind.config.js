/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          void: '#040C16',
          card: '#0A192F',
          elevated: '#0D2034',
          modal: '#071324',
          highlight: '#112240',
        },
        navy: {
          900: 'var(--n900)',
          800: 'var(--n800)',
          700: 'var(--n700)',
          600: 'var(--n600)',
          500: 'var(--n500)',
          400: 'var(--n400)',
          300: 'var(--n300)',
          200: 'var(--n200)',
          100: 'var(--n100)',
        },
        brand: {
          cyan: 'var(--c500)',
          orange: 'var(--o500)',
          gold: 'var(--g500)',
        },
        survsta: {
          navy: 'var(--n800)',
          dark: 'var(--n900)',
          surface: 'var(--n600)',
          card: '#0A192F',
          cyan: 'var(--c500)',
          orange: 'var(--o500)',
          gold: 'var(--g500)',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(40, 199, 216, 0.25)',
        'glow-amber': '0 0 25px -5px rgba(244, 184, 74, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'card-soft': '0 4px 24px -2px rgba(4, 12, 22, 0.65)',
      },
      fontFamily: {
        cairo: ['Cairo', 'var(--font)', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
      },
    },
  },
  plugins: [],
};
