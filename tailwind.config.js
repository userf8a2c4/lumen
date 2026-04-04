/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,jsx,js}'],
  theme: {
    extend: {
      colors: {
        lumen: {
          bg: '#0a0a0f',
          surface: '#111118',
          card: '#16161f',
          'card-hover': '#1c1c28',
          border: '#232333',
          'border-light': '#2a2a3d',
          accent: '#7E3FF2',
          'accent-hover': '#9B5BFF',
          'accent-glow': 'rgba(126,63,242,0.15)',
          cyan: '#00D4FF',
          text: '#e8e8ed',
          'text-secondary': '#8b8b9e',
          'text-muted': '#5a5a6e',
        },
      },
    },
  },
  plugins: [],
};
