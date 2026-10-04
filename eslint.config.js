import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import security from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.netlify/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  // Uses eslint-plugin-jsx-a11y-x, the ESLint 10 compatible fork of eslint-plugin-jsx-a11y.
  ...astro.configs['jsx-a11y-strict'],
  security.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // Everything under src/ can end up in the browser bundle, so it must never reach server code.
    files: ['src/**/*.{ts,astro,js,mjs}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/server', '**/lib/server/**', '@/lib/server', '@/lib/server/**'],
              message:
                'lib/server solo puede importarse desde netlify/functions (código de servidor).',
            },
          ],
        },
      ],
    },
  },
  {
    // The rule cannot see TypeScript types; here every dynamic key is a typed union or an array index.
    files: ['**/*.{ts,astro}'],
    rules: { 'security/detect-object-injection': 'off' },
  },
  {
    // Build tooling walks dist/ itself: paths come from the file system, never from user input.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off', 'security/detect-non-literal-fs-filename': 'off' },
  },
);
