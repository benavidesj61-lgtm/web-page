# CLAUDE.md: LE SCENT

Static corporate site and product catalog for LE SCENT (original perfumes and decants, El Salvador).
Primary conversion: the visitor asks about a product via WhatsApp (+503 7529-2926).

## Stack

- Astro 7 (static output, `trailingSlash: 'always'`, directory build format)
- TypeScript `strictest` (includes `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`)
- Tailwind CSS 4: **tokens live in the `@theme` block of `src/styles/global.css`** (no `tailwind.config.js`)
- Content Collections + Zod (`src/content.config.ts`), images through `astro:assets`
- Fonts: Astro Fonts API with local provider (`@fontsource-variable/*` files), declared in `astro.config.mjs`
- ESLint 9 (flat config, `typescript-eslint` strict, `eslint-plugin-astro` + jsx-a11y strict) and Prettier
  - ESLint stays on v9 because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet.

## Commands

```bash
npm run dev           # http://localhost:4321
npm run build         # astro check + astro build (fails on type or schema errors)
npm run lint          # eslint
npm run format        # prettier --write
npm run validate      # lint + format:check + build: run before every commit
```

## Project map

- `src/config/site.ts`: business data (name, WhatsApp, address, hours, socials, nav). `SITE.url` must match `site` in `astro.config.mjs`.
- `src/data/`: categories (plain data, imported by the content schema), home content (benefits, testimonials, FAQ).
- `src/content/productos/*.md`: one product per file; frontmatter = data, body = long description.
- `src/utils/`: `products.ts` (queries, badges, uniqueness check), `whatsapp.ts`, `price.ts`, `jsonld.ts`, `search.ts`, `url.ts`.
- `src/scripts/`: client islands (menu, reveal, catalog filters, gallery, contact form). Imported from `<script>` tags in the component that needs them, so each page only ships its own JS.
- `src/components/{layout,ui,home,catalogo,contacto}`.

## Conventions

- Code identifiers in English; all visible copy in Spanish (formal "usted"), elegant and trustworthy tone. No lorem ipsum, no TODOs.
- Components are small with a typed `Props` interface. No `any`, no inline `style=""`.
- Comments explain _why_, never _what_.
- Spacing scale is 8px: `--spacing: 0.5rem`, so `p-1` = 8px, `p-2` = 16px, `p-0.5` = 4px.
- Colors: only theme tokens (`navy-*`, `gold-*`, `ivory`, `sand`, `stone`, `taupe`, `ink`, `mist`, `success`, `danger`). The default Tailwind palette is disabled.
  - `gold-500` fails AA on light backgrounds: use it as a fill (with `navy-950` text) or on navy. For gold text on light backgrounds use `gold-700`.
  - Wrap navy sections with `.on-dark` so the focus ring switches to gold.
- Motion: only `opacity` and `transform`, 150–300 ms, `ease-out`. Max image hover scale 1.03. Card shadow hover is an `::after` opacity fade. Everything is disabled under `prefers-reduced-motion`.
- Reveal-on-scroll: add `data-reveal` to below-the-fold blocks only (never the hero/LCP). Hidden state applies only when `<html>` has `.js`.
- Images: always `<Picture>`/`<Image>` from `astro:assets` with `formats={['avif','webp']}`, explicit `widths` + `sizes`, `width`/`height`, and descriptive `alt`. `loading="lazy"` everywhere except the hero and the main product image (`loading="eager" fetchpriority="high"`). Cards use `aspect-4/5` + `fit="cover"`.
- `Button` renders `inline-flex`; do not pass responsive `hidden`/`block` classes to it. Wrap it instead.
- Accessibility: one `<h1>` per page, no skipped heading levels, native elements first (`<details>`, `<dialog>`, radios). ARIA only where native HTML falls short. Filter results are announced through `role="status"`.
- SEO: every page passes `title` + `description` to `BaseLayout`; JSON-LD via the `jsonLd` prop (`utils/jsonld.ts`).
- Products: keyed by file name (`generateId`); `getProducts()` throws if an `id` or `slug` repeats. "Nuevo" badge = published ≤ 30 days ago (build time), "Oferta" = has `precioAnterior`, "Agotado" = `disponible: false`.

## Before finishing any change

1. `npm run validate` with zero errors and zero warnings.
2. Check the affected pages at 360, 768, 1024 and 1440 px.
