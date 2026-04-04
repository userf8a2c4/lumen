/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,jsx,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lumen: {
          accent: '#7E3FF2',
          'accent-hover': '#9B5BFF',
          'accent-glow': 'rgba(126,63,242,0.15)',
          cyan: '#00D4FF',
        },
      },
    },
  },
  plugins: [],
};
