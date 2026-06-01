import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  site: 'https://villasolana.example',
  output: 'hybrid',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  integrations: [tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th', 'ru', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: { th: 'en', ru: 'en', zh: 'en' },
  },
  image: {
    domains: ['images.unsplash.com'],
  },
  prefetch: { prefetchAll: true },
});
