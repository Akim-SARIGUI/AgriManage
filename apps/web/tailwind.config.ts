/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          forest: '#1b4332',
          green: '#2d6a4f',
          leaf: '#40916c',
          moss: '#52796f',
          soil: '#7f5539',
          earth: '#b08968',
          wheat: '#d4a373',
          sky: '#e9f5ee',
          mist: '#f4faf6',
          ink: '#1b4332',
          muted: '#52796f',
          page: '#f3f7f4',
          accent: '#95d5b2',
          danger: '#bc4749',
          info: '#3a7ca5',
          warning: '#c9a227',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Poppins', 'Roboto', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        agri: '0 10px 30px -12px rgba(27, 67, 50, 0.28)',
        'agri-lg': '0 18px 40px -14px rgba(27, 67, 50, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'soft-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'fade-in': 'fade-in 0.35s ease-out both',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
        'slide-right': 'slide-right 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
