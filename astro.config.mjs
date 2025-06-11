// @ts-check
import { defineConfig } from 'astro/config';
import Netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    envDir: './'
  },
  adapter: Netlify(),
  output: 'server'
});