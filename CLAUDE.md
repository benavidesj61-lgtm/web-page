# CLAUDE.md: LE SCENT

Static corporate site and product catalog for LE SCENT (original perfumes and decants, El Salvador).
Audience: companies and individuals in El Salvador, 25–55. Primary conversion: the visitor sends a
quote/information request through the contact form. **No WhatsApp, floating chat buttons,
third-party messaging widgets or testimonials/reviews (no Review or AggregateRating data).**

## Stack

- Astro 7, **fully static** (`output: 'static'`, `trailingSlash: 'always'`, no adapter). Hosting: Netlify.
- One server endpoint: the Netlify Function `netlify/functions/contacto.ts` (route `/api/contacto/`).
  It reuses `src/lib/server/*` and `src/lib/schemas/*`. No database and no auth: do not add a backend the site does not need.
- TypeScript `strictest`. Stays on 6.0.x because `typescript-eslint` and `@astrojs/check` do not support 7 yet.
- Tailwind CSS 4: tokens in the `@theme` block of `src/styles/global.css`.
- Content Collections + Zod (`src/content.config.ts`); images through `astro:assets`.
- Fonts: `@fontsource-variable/*` CSS imported in `BaseLayout` plus a manual preload of Inter latin. Do not use Astro's `<Font>` (it inlines `<style>`, which the CSP blocks).
- Validation: `zod/mini` in `src/lib/schemas/contact.ts`, shared by the browser (UX) and the function (authoritative).
- ESLint 10 (`typescript-eslint` strict, `eslint-plugin-astro` + `eslint-plugin-jsx-a11y-x`, `eslint-plugin-security`), Prettier, Vitest.

## Commands

```bash
npm run dev           # http://localhost:4321 (the function does not run here; use `netlify dev`)
npm run build         # astro check + astro build (fails on type/schema errors or missing PUBLIC_ env)
npm test              # vitest: schema, escaping, rate limiting and every endpoint rejection path
npm run check:dist    # fails if a secret value or credential pattern appears in dist/
npm run validate      # lint + format:check + test + build + check:dist: run before every commit
```

A gitleaks pre-commit hook (`.githooks/`, enabled by `npm install`) blocks commits with secrets. CI (`.github/workflows/ci.yml`) runs npm audit, gitleaks over the full history, lint, format, tests, build and the dist check.

## Project map

- `src/data/site.ts`: single source of truth for public business data. `SITE.url` must match `site` in `astro.config.mjs`.
- `src/data/categories.ts`, `category-images.ts`, `home.ts` (benefits, FAQ).
- `src/content/productos/*.md`: one product per file.
- `src/lib/schemas/contact.ts`: form contract (fields, limits, error codes, Turnstile action, honeypot name, endpoint).
- `src/lib/server/`: **server-only** (env, Turnstile, rate limit, email, catalog lookup, handler, HTTP headers). ESLint forbids importing it from anything under `src/` that can reach the browser.
- `src/pages/catalogo/indice.json.ts`: public product index the function uses to validate `producto` and name it in emails.
- `src/scripts/`: client islands, always emitted as external files.
- `scripts/check-dist-secrets.mjs`, `tests/`, `netlify.toml` (headers + CSP), `.env.example`.

## Conventions

- Code identifiers in English; visible copy in Spanish (formal "usted"; brief labels such as "Contáctanos" stay as written). No lorem ipsum, no TODOs.
- Small components with typed `Props`. No `any`, no inline `style=""`. Comments explain _why_.
- 8px spacing scale (`--spacing: 0.5rem`). Black-and-white tokens only (`white`, `black`, `noir-50…950`, `success`, `danger`).
  - Text on white/`noir-50`/`noir-100`: `noir-500` or darker. On `noir-800`+ (and the texture): `noir-400` or lighter. Form borders `noir-400`.
  - Black sections use `.on-dark`; textured ones `<Texture />` inside `relative isolate overflow-hidden`.
- Motion: only `opacity`/`transform`, 150–300 ms, `ease-out`; hover colors switch instantly; image hover ≤ 1.03; disabled under reduced motion. No spinners.
- Reveal: `data-reveal` on below-the-fold blocks only. Hidden state lives in `@media (scripting: enabled)` (no JS-set class).
- Images: `<Picture>` with `formats={['avif','webp']}`, `widths`, `sizes`, descriptive `alt`; lazy except hero and main product image (`eager` + `fetchpriority="high"`). Cards `aspect-5/7`.
- `Button` defaults to `type="button"`; pass `type="submit"` explicitly.
- Accessibility: one `<h1>`, no skipped levels, native elements first, `role="status"` for filter results, errors linked with `aria-describedby`, focus to the first invalid field.
- SEO: `title` + `description` on every page; `noindex` on /gracias and 404 (also excluded from the sitemap); JSON-LD via `jsonLd` (`utils/jsonld.ts`), never reviews or ratings.
- Products: keyed by file name; `getProducts()` throws on repeated `id`/`slug`. `precio: null` = "Precio a consultar".

## Security rules (mandatory)

Reference: OWASP Top 10 and ASVS. Details and the pre-deploy checklist live in `SECURITY.md`.

**Implemented (static site + one function):**

1. **No inline code.** No inline `<script>`, `<style>`, `style=""` or `on*=` attributes: the CSP in `netlify.toml` has no `'unsafe-inline'`/`'unsafe-eval'`. `vite.build.assetsInlineLimit: 0` and `build.inlineStylesheets: 'never'` keep Astro from inlining. A new third party means editing the CSP explicitly and testing it.
2. **Secrets.** Only environment variables; never in code, never with the `PUBLIC_` prefix. Public values used by pages are declared in `env.schema` (`astro.config.mjs`); server secrets are read only by the function (`readServerEnv`). Never log or print secret values, only variable names.
3. **Validate everything on the server** with Zod whitelists (`strictObject`): types, formats, min/max lengths, allowed values. Reject, never "fix". Client validation is UX only. Query params (`categoria`, `orden`, `q`, `producto`) are checked against allowlists or length caps before use.
4. **Never trust business data from the client.** Product names come from the catalog index; the client sends only the slug. Hidden fields are untrusted.
5. **Anti-bot** on the form: Turnstile verified server-side (action + hostname), honeypot (silent success), minimum 3 s using Cloudflare's `challenge_ts`, 5 requests/IP/15 min (Netlify Blobs, hashed IPs).
6. **Endpoint hygiene:** POST only (405 + `Allow` otherwise), same-origin `Origin` check (CSRF), JSON only, 16 KB cap, no CORS headers, generic error codes, `Cache-Control: no-store` and hardening headers (`lib/server/http.ts`). Logs carry reasons, never personal data.
7. **Escaping.** Keep Astro's auto-escaping. `set:html` only for internal constants (icons, JSON-LD with `<` escaped), never user content; if user HTML is ever needed, sanitize with DOMPurify. Emails escape every value and keep subjects single-line.
8. **Supply chain:** `npm ci` in deploys, lockfile committed, Dependabot, `npm audit --audit-level=high` in CI; avoid adding dependencies (the Netlify adapter was rejected because it pulls unpatched high-severity packages).

**Deferred — apply as soon as a database, auth or uploads are added (do not build them preemptively):**

- **Supabase/DB:** only the anon/publishable key in the browser; `service_role` only in `src/lib/server/`. RLS enabled on **every** table, deny by default, explicit policies per operation (products: public SELECT of published rows only, writes for admins; contact requests: public INSERT, SELECT for admins only). Revoke unneeded grants from `anon`/`authenticated`. Policies as versioned SQL migrations. No `select('*')` in public responses; column lists, max page size, mandatory pagination. Parameterized queries / query builder only; RPCs typed and `SECURITY INVOKER` unless documented. Disable unused features (e.g. GraphQL). UUIDs, not sequential IDs.
- **Auth/admin:** protect `/admin` and private endpoints in `src/middleware.ts` on every request (401/redirect, no info leak); roles checked on the server and in RLS; per-record authorization (no IDOR). Cookies `HttpOnly; Secure; SameSite=Lax` (`Strict` for admin), short expiry, ID rotation on login, real invalidation on logout, never tokens in `localStorage`, CSRF protection on mutations. Passwords via Supabase Auth or Argon2id (bcrypt ≥ 12), minimum 12 chars, common-password blocklist, never logged. Login and password reset: Turnstile + rate limiting per IP and per account (5/15 min, progressive delay), generic "Credenciales inválidas".
- **Uploads:** admins only; JPG/PNG/WebP validated by magic bytes, no SVG; max 5 MB; UUID file names, EXIF stripped, private bucket with policies; never served as HTML.
- **Encryption:** TLS 1.2+ everywhere; provider encryption at rest; AES-256-GCM at application level for especially sensitive fields, key in env.

## Before finishing any change

1. `npm run validate` with zero errors and zero warnings.
2. Check affected pages at 360, 768, 1024 and 1440 px, and that the browser console shows no CSP violations.
