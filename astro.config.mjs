// @ts-check
import { defineConfig, envField } from 'astro/config';
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
  env: {
    schema: {
      // Public by design (Turnstile site keys are visible in every page). The build fails if it is
      // missing. Secrets are NOT declared here: only the Netlify Function reads them at runtime.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
    },
  },
  build: {
    // External stylesheets only: inline <style> blocks would need 'unsafe-inline' in the CSP.
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Emit every client script as a file so script-src can stay 'self' (no inline scripts).
      assetsInlineLimit: 0,
    },
  },
});
