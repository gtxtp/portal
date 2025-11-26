import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        orion: {
          bg: '#020408',
          'neon-cyan': '#00F0FF',
          'neon-green': '#00FF94',
          'neon-red': '#FF0055',
        },
      },
    },
  },
  plugins: [],
};

export default config;
