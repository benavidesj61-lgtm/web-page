// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Keep in sync with SITE.url in src/data/site.ts (config files cannot import TS modules reliably).
const SITE_URL = 'https://lescent.com.sv';

// Pages that must never be indexed: excluded from the sitemap and marked noindex in their layout.
const NOINDEX_PATHS = ['/gracias/', '/404/'];

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Directory output behaves the same on Netlify, Vercel and any static host; URLs end in "/".
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PATHS.some((path) => new URL(page).pathname === path),
    }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      fallbacks: ['Georgia', 'serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: [
              '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2',
            ],
            weight: '400 900',
            style: 'normal',
          },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
