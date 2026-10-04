# CLAUDE.md: LE SCENT

Static corporate site and product catalog for LE SCENT (original perfumes and decants, El Salvador).
Audience: companies and individuals in El Salvador, 25–55. Primary conversion: the visitor sends a
quote/information request through the contact form (Netlify Forms). **No WhatsApp, floating chat
buttons or third-party messaging widgets.**

## Stack

- Astro 7 (static output, `trailingSlash: 'always'`, directory build format)
- TypeScript `strictest` (includes `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`)
- Tailwind CSS 4: **tokens live in the `@theme` block of `src/styles/global.css`** (no `tailwind.config.js`)
- Content Collections + Zod (`src/content.config.ts`), images through `astro:assets`
- Fonts: Astro Fonts API with local provider (`@fontsource-variable/*` files), declared in `astro.config.mjs`. Inter is preloaded.
- ESLint 10 (flat config, `typescript-eslint` strict, `eslint-plugin-astro` + `eslint-plugin-jsx-a11y-x` strict) and Prettier
  - `eslint-plugin-jsx-a11y-x` is the ESLint 10 compatible fork; `eslint-plugin-astro` 3 picks it up automatically.
  - TypeScript stays on 6.0.x because `typescript-eslint` and `@astrojs/check` do not support 7 yet.
- Contact form: Netlify Forms (`data-netlify` + honeypot), sent with `fetch` when JS is available.

## Commands

```bash
npm run dev           # http://localhost:4321
npm run build         # astro check + astro build (fails on type or schema errors)
npm run lint          # eslint
npm run format        # prettier --write
npm run validate      # lint + format:check + build: run before every commit
```

## Project map

- `src/data/site.ts`: **single source of truth** for business data (name, phone, email, address, hours, socials, nav, form settings). `SITE.url` must match `site` in `astro.config.mjs`.
- `src/data/categories.ts`: category slugs and copy (plain data, imported by the content schema). `category-images.ts` holds their images (kept apart because the schema cannot import images).
- `src/data/home.ts`: benefits, testimonials, FAQ.
- `src/content/productos/*.md`: one product per file; frontmatter = data, body = long description. Images in `src/assets/productos/`.
- `src/utils/`: `products.ts` (queries, badges, uniqueness check), `contact.ts` (tel/mailto/map links), `price.ts`, `jsonld.ts`, `search.ts`, `url.ts`.
- `src/scripts/`: client islands (menu, reveal, catalog filters, gallery, contact form). Imported from `<script>` tags in the component that needs them, so each page only ships its own JS.
- `src/components/{layout,ui,home,catalogo,contacto}`; `src/layouts/BaseLayout.astro`.

## Conventions

- Code identifiers in English; all visible copy in Spanish (formal "usted"; button labels from the brief, like "Contáctanos", are kept as written), elegant and trustworthy tone. No lorem ipsum, no TODOs.
- Components are small with a typed `Props` interface. No `any`, no inline `style=""`.
- Comments explain _why_, never _what_.
- Spacing scale is 8px: `--spacing: 0.5rem`, so `p-1` = 8px, `p-2` = 16px, `p-0.5` = 4px.
- Colors: black-and-white only. Tokens: `white`, `black`, `noir-50` … `noir-950`, `success`, `danger`. The default Tailwind palette is disabled.
  - On white / `noir-50` / `noir-100`: text `noir-500` or darker. On `noir-800` and darker (and the texture): text `noir-400` or lighter. Form borders use `noir-400` (3:1).
  - Wrap black sections with `.on-dark` (headings and the focus ring switch to white). Textured black sections use `<Texture />` inside a `relative isolate overflow-hidden` parent.
- Motion: only `opacity` and `transform`, 150–300 ms, `ease-out`. Colors change instantly on hover (no color transitions). Max image hover scale 1.03. Card shadow hover is an `::after` opacity fade. Everything is disabled under `prefers-reduced-motion`. No spinners or decorative loaders.
- Reveal-on-scroll: add `data-reveal` to below-the-fold blocks only (never the hero/LCP). Hidden state applies only when `<html>` has `.js`.
- Images: always `<Picture>` from `astro:assets` with `formats={['avif','webp']}`, explicit `widths` + `sizes`, and descriptive `alt`. `loading="lazy"` everywhere except the hero and the main product image (`loading="eager" fetchpriority="high"`). Product cards use `aspect-5/7` (the brand artwork is 993×1404) on a black background; the gallery uses `object-contain`, which letterboxes seamlessly on black.
- `Button` renders `inline-flex` and defaults to `type="button"`; pass `type="submit"` explicitly. Do not pass responsive `hidden`/`block` classes to it. Wrap it instead.
- Accessibility: one `<h1>` per page, no skipped heading levels, native elements first (`<details name>`, `<dialog>`, radios, `<select>`). ARIA only where native HTML falls short. Filter results are announced through `role="status"`. Form errors are linked with `aria-describedby` and focus moves to the first invalid field.
- SEO: every page passes `title` + `description` to `BaseLayout` (`noindex` for /gracias and 404, which are also excluded from the sitemap in `astro.config.mjs`); JSON-LD via the `jsonLd` prop (`utils/jsonld.ts`).
- Products: keyed by file name (`generateId`); `getProducts()` throws if an `id` or `slug` repeats. `precio: null` = "Precio a consultar". "Nuevo" badge = published ≤ 30 days ago (build time), "Oferta" = has `precioAnterior`, "Agotado" = `disponible: false`.

## Before finishing any change

1. `npm run validate` with zero errors and zero warnings.
2. Check the affected pages at 360, 768, 1024 and 1440 px.
