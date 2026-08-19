import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tina from '@tinacms/astro/integration';
import { tinaAdminDevRedirect } from '@tinacms/astro/vite';

export default defineConfig({
  site: 'https://escolaieda.com',
  base: '/v2',
  output: 'static',
  adapter: vercel(),
  integrations: [tina()],
  vite: {
    plugins: [tinaAdminDevRedirect()],
    ssr: {
      noExternal: ['@tinacms/astro', '@tinacms/bridge'],
    },
  },
});
