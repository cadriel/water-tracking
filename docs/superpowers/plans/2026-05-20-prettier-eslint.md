# Prettier + ESLint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prettier and ESLint to the project with 2-space indentation and React-sensible defaults; reformat existing source in a single sweep.

**Architecture:** Vite-default ESLint flat config (typescript-eslint + react-hooks + react-refresh) with `eslint-config-prettier` to defer formatting to Prettier. Prettier config in `.prettierrc.json`. One-time bulk reformat as its own commit so future `git blame` can ignore the SHA.

**Tech Stack:** Prettier 3, ESLint 9, typescript-eslint 8, eslint-plugin-react-hooks 5, eslint-plugin-react-refresh, eslint-config-prettier.

**Reference spec:** `docs/superpowers/specs/2026-05-20-prettier-eslint-design.md`

---

## File Map

```
water-tracking/
  package.json                  // modify: add devDeps + lint/format scripts
  .prettierrc.json              // new
  .prettierignore               // new
  eslint.config.js              // new
  src/**/*.{ts,tsx}             // touched: bulk reformat in a single commit
  index.html                    // touched: bulk reformat
```

---

### Task 1: Install dev dependencies and add scripts

**Files:**
- Modify: `package.json` (via `npm install --save-dev` + scripts edit)

- [ ] **Step 1: Install the lint + format dev dependencies**

```bash
cd /Users/craig/Development/Personal/water-tracking
npm install --save-dev prettier eslint @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-config-prettier
```

Expected: install succeeds. The lockfile updates with the new packages.

- [ ] **Step 2: Add the three new scripts to `package.json`**

Open `package.json`. The existing `scripts` block looks like:

```json
"scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
}
```

Replace it with:

```json
"scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
}
```

(Indentation stays at the file's current 4-space style for this commit — the bulk reformat to 2 spaces happens in Task 4.)

- [ ] **Step 3: Stage and commit**

```bash
git add package.json package-lock.json
git commit -m "Install Prettier + ESLint dev dependencies and scripts"
```

(In this environment, `git commit` from a subagent is blocked; subagents should stage only and let the controller commit.)

---

### Task 2: Add Prettier configuration

**Files:**
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: Create `.prettierrc.json`**

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

- [ ] **Step 2: Create `.prettierignore`**

```
dist
node_modules
package-lock.json
coverage
```

- [ ] **Step 3: Verify Prettier picks up the config**

```bash
npx prettier --check .
```

Expected: a list of files that *would* be reformatted (the existing 4-space-indented code). Exit code 1 is fine — the sweep happens in Task 4.

- [ ] **Step 4: Stage and commit**

```bash
git add .prettierrc.json .prettierignore
git commit -m "Add Prettier configuration"
```

---

### Task 3: Add ESLint flat config

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Create `eslint.config.js`**

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

(File is in 4-space style for this commit; Task 4 reformats it to 2 spaces.)

- [ ] **Step 2: Verify ESLint loads the config without crashing**

```bash
npx eslint --print-config src/App.tsx > /dev/null
```

Expected: exit 0. (Don't actually run a full lint pass yet — that comes in Task 5 after the sweep.)

- [ ] **Step 3: Stage and commit**

```bash
git add eslint.config.js
git commit -m "Add ESLint flat config"
```

---

### Task 4: One-time Prettier sweep

**Files:**
- Modify: every existing source file under `src/` plus `index.html` and the config files just added (`.prettierrc.json`, `eslint.config.js`, etc.)

This task lands as a single big-diff commit. The commit message identifies it as a bulk formatting change so future `git blame` invocations can `--ignore-rev` it.

- [ ] **Step 1: Run Prettier across the entire repo**

```bash
cd /Users/craig/Development/Personal/water-tracking
npx prettier --write .
```

Expected output: a list of every file Prettier rewrote (or "(unchanged)" for files already conforming). The set should include the entire `src/` tree, `index.html`, `vite.config.ts`, `tsconfig*.json`, the JSON in `.prettierrc.json`, and the new `eslint.config.js`.

- [ ] **Step 2: Verify the build and tests still pass after the reformat**

```bash
npm run build
npm test
```

Expected: build succeeds with no TypeScript errors. Test suite shows 42/42 passing.

- [ ] **Step 3: Verify Prettier is now happy**

```bash
npx prettier --check .
```

Expected: exit 0, "All matched files use Prettier code style!"

- [ ] **Step 4: Stage and commit**

```bash
git add -A
git commit -m "Reformat with Prettier"
```

The commit message intentionally has no body — it's a known-bulk-whitespace commit that can be excluded from blame with `--ignore-rev`.

---

### Task 5: ESLint pass and fix any genuine issues

**Files:**
- Modify: any files that ESLint flags (unknown until step 1)

- [ ] **Step 1: Run ESLint across the project**

```bash
npm run lint
```

Three possible outcomes:

1. **Exit 0, no output.** The codebase is already clean — skip to step 3.
2. **Warnings only (exit 0).** The `react-refresh/only-export-components` rule is the only configured warning. If a file exports both a component and a non-component value (e.g. `store/useWaterTrackingStore.ts` exports both the store and selector hook functions, which is the user's intentional convention), it may warn. Decision: keep the convention; add a per-file disable comment on the affected file(s). Note: a regular module that only exports hooks (no component) does not trigger this rule.
3. **Errors (exit non-zero).** Fix them. Common categories and what to do:
   - `@typescript-eslint/no-unused-vars` — remove the unused variable, or rename with `_` prefix if it's an intentionally-unused destructured value or function parameter.
   - `react-hooks/exhaustive-deps` — add the missing dependency to the dep array. If the rule's suggestion would cause a bug (e.g. a function reference that changes every render), refactor to `useCallback` or wrap with `useMemo`. Only as a last resort, disable the rule on that one line with a comment explaining why.
   - `react-hooks/rules-of-hooks` — restructure so the hook is called unconditionally at the top of the component.
   - Any other rule — fix the issue rather than disabling, unless the rule is wrong for this codebase.

Fix issues in the smallest, most targeted way: edit the offending file(s) only. Re-run `npm run lint` after each fix until it exits cleanly.

- [ ] **Step 2: If `react-refresh/only-export-components` warns on `src/store/useWaterTrackingStore.ts`**

The store file exports the store hook plus several selector hooks. This is the user's intentional convention (the file's purpose is to expose hooks, not components), so the warning isn't actionable. Add this disable comment at the top of the file, immediately under the imports:

```ts
/* eslint-disable react-refresh/only-export-components */
```

Re-run `npm run lint` to confirm the warning is gone.

(If the warning doesn't actually fire — for example because the rule only triggers in files that *also* export a component — skip this step.)

- [ ] **Step 3: Confirm the full verification suite**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all four exit 0. Test count: 42/42.

- [ ] **Step 4: Stage and commit**

If any files were modified to address ESLint findings:

```bash
git add -A
git commit -m "Fix ESLint findings after initial pass"
```

If no files were modified (lint was clean from the start), skip the commit — there's nothing to record.

---

## Self-Review

**Spec coverage:**
- Install all required dev deps → Task 1
- New `lint`, `format`, `format:check` scripts → Task 1
- `.prettierrc.json` with the seven specified options → Task 2
- `.prettierignore` with the four entries → Task 2
- `eslint.config.js` flat config with the Vite-default stack + `eslint-config-prettier` last → Task 3
- One-time bulk reformat as its own commit → Task 4
- ESLint pass and fixes for any genuine issues → Task 5
- Final verification: lint, format:check, build, tests all clean → Task 5

All seven spec areas accounted for.

**Placeholder scan:** no TBDs. The "fix what lint flags" portion of Task 5 is unavoidably open-ended (we genuinely don't know what it'll flag until we run it), but the categories are enumerated with concrete remedies.

**Type consistency:** N/A — no types defined across tasks.

**Commit count:** 5 (one per task, except Task 5 which may be 0 or 1 depending on findings).
