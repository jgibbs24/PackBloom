/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b12',
        ember: '#f4b860',
        amethyst: '#8b5cf6',
      },
      boxShadow: {
        card: '0 22px 70px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
