import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const sitemapPlugin = sitemap({
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: 'en',
      es: 'es',
      pt: 'pt',
      de: 'de',
      fr: 'fr',
      ja: 'ja',
      zh: 'zh',
      ru: 'ru'
    }
  }
});

// Ensure compatibility with Astro 4 where astro:routes:resolved may not fire before astro:build:done
const origBuildDone = sitemapPlugin.hooks['astro:build:done'];
if (origBuildDone && sitemapPlugin.hooks['astro:routes:resolved']) {
  sitemapPlugin.hooks['astro:build:done'] = async (params) => {
    sitemapPlugin.hooks['astro:routes:resolved']({ routes: params.routes || [] });
    return origBuildDone(params);
  };
}

export default defineConfig({
  site: 'https://snapgif.github.io',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'de', 'fr', 'ja', 'zh', 'ru'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    sitemapPlugin
  ],
  vite: {
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
    }
  }
});
