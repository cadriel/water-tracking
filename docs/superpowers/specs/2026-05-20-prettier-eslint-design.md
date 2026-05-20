# Prettier + ESLint — Design

**Date:** 2026-05-20
**Status:** Approved design, pending implementation plan
**Builds on:** the existing water-tracking SPA

## Purpose

Add Prettier and ESLint to enforce consistent formatting and catch common
React/TypeScript mistakes. Switch the existing 4-space indentation to
2 spaces. Use the standard Vite + React + TypeScript ESLint stack so the
config matches what new contributors would expect.

## Scope

**In scope**
- Install `prettier`, `eslint`, `@eslint/js`, `globals`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
  `eslint-config-prettier`
- Create `eslint.config.js` (flat config)
- Create `.prettierrc.json` and `.prettierignore`
- Add `lint`, `format`, `format:check` scripts to `package.json`
- One-time reformat of all source files (single commit) to 2-space indents
  and Prettier-normalised quoting / commas
- Fix any genuine issues `npm run lint` reports

**Out of scope**
- Pre-commit hooks (Husky, lint-staged) — not worth the setup until there
  are collaborators or CI; can be added later
- CI integration — no CI exists yet
- `.editorconfig` — Prettier covers the same ground
- Custom ESLint rules beyond the defaults — start with the standard set,
  add per-file overrides only if a concrete need surfaces during the sweep
- Stylelint or CSS-in-JS linting — MUI `sx` props are TypeScript, already
  covered by tsc/typescript-eslint

## Tooling Decisions

### ESLint flat config

`eslint.config.js` rather than the legacy `.eslintrc.*`. Flat config is the
default in ESLint 9+ and the format `npm create vite@latest` generates today.

### Prettier config

```json
{
    "tabWidth": 2,
    "useTabs": false,
    "singleQuote": true,
    "semi": true,
    "trailingComma": "all",
    "arrowParens": "avoid",
    "printWidth": 100
}
```

Rationale:
- `tabWidth: 2`, `useTabs: false` — the explicit user requirement
- `singleQuote: true` — matches existing code (`'react'` etc.)
- `semi: true` — existing code uses semicolons
- `trailingComma: 'all'` — Prettier's default, matches existing multi-line
- `arrowParens: 'avoid'` — matches existing single-arg arrows like
  `e => setNewName(e.target.value)`
- `printWidth: 100` — a touch wider than the default 80; comfortable for
  MUI / React JSX which tends to be wider

### ESLint config shape

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['dist', 'coverage'] },
    {
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    },
    prettier,
);
```

`eslint-config-prettier` is applied as the last entry so it turns off any
formatting-related rules from the earlier presets, leaving Prettier as the
sole authority on style.

### `.prettierignore`

```
dist
node_modules
package-lock.json
coverage
```

Vitest's coverage directory is included pre-emptively (`coverage` doesn't
exist yet, but will if `vitest run --coverage` is ever invoked).

### `package.json` scripts

Add three:

```json
{
    "scripts": {
        "lint": "eslint .",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    }
}
```

The existing `dev`, `build`, `preview`, `test`, `test:watch` are unchanged.

## One-Time Reformat

After installation and config land, run `prettier --write .` once across the
whole repo. This converts every existing source file from 4-space to
2-space indentation and aligns quoting / commas to the config.

The reformat lands as its own commit (`Reformat with Prettier`) so git
history has a single, easily-skippable point of bulk whitespace change.
Subsequent `git blame` invocations can pass `--ignore-rev` against this
SHA if desired.

After reformatting, `npm run lint` is run and any ESLint findings are
addressed:
- Pure formatting issues should be impossible (`eslint-config-prettier`
  silences them).
- Hook dependency issues or unused vars are fixed in a follow-up commit.
- Genuine bugs surfaced by the linter are fixed in their own commits.

The intent is that the post-sweep `lint` run is clean.

## Verification

After all changes:
- `npm run lint` exits 0
- `npm run format:check` exits 0
- `npm run build` succeeds
- `npm test` shows 42/42 passing (no behaviour change)

## Non-goals to be explicit about

- Not switching to a different code style (no Airbnb, no Standard).
- Not adding `eslint-plugin-import` or `eslint-plugin-jsx-a11y`. Both are
  reasonable additions later; out of scope now.
- Not changing `tsconfig.json` strictness — `tsc -b` is already the
  authoritative type check; ESLint sits alongside it.
- Not setting up `tsc --noEmit` or `eslint --max-warnings 0` in
  `npm run build`. Build remains build; lint is a separate command.
