import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './node_modules/@shadcn/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [animate],
};

export default config;
