import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://devoke.app',
  output: 'hybrid',   // static pages by default; API routes are SSR
  adapter: vercel(),
});
