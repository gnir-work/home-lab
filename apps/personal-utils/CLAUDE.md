# personal-utils — Claude Instructions

## Project Overview

React + Vite + TypeScript SPA with shadcn/ui and Tailwind CSS, hosted on GitHub Pages at
`https://gnir-work.github.io/home-lab/`.

## Package Manager & Runtime

- **Package manager**: yarn (not npm or pnpm)
- **Node version**: 20 (managed via mise, see `.mise.toml`)

## Developer Commands

All commands are defined in the `justfile`:

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `just dev`         | Start Vite dev server                    |
| `just build`       | Type-check + production build            |
| `just lint`        | Run Biome lint + format check            |
| `just lint-fix`    | Run Biome lint + format with auto-fix    |
| `just typecheck`   | Run tsc --noEmit                         |
| `just test`        | Run Playwright E2E tests (headless)      |
| `just test-ui`     | Run Playwright E2E tests with UI         |
| `just pre-commit`  | lint + typecheck + build + test          |

## Key Config Notes

- **Vite base**: `/home-lab/` — required for GitHub Pages asset paths; do not change.
- **tsconfig.node.json**: must have `"composite": true, "noEmit": false` when referenced from `tsconfig.json`.
- **Biome**: line width 100, double quotes, 2-space indent; runs on `src/` and `e2e/`; imports auto-organized; trailing commas ES5.
- Use `<p>` (not `<label>`) for output-only text labels — Biome enforces `noLabelWithoutControl`.
- No non-null assertions (`!`) — use null-checks; Biome enforces `noNonNullAssertion`.

## Feature Structure

Features live in `src/features/<name>/` with:
- A React component file (e.g., `HebrewMapper.tsx`)
- A logic/utility file (e.g., `hebrewMapping.ts`)

Features are integrated directly in `App.tsx`.

## Testing

- Playwright E2E tests in `e2e/`
- Chromium only (in CI: `npx playwright install --with-deps chromium`)
- Use `data-testid` attributes for element selection
- Dev server is auto-started by Playwright config

## Current Features

### Hebrew Keyboard Mapper (`src/features/hebrew-mapper/`)

Maps Hebrew keyboard input to the equivalent English characters (as if typed on a US layout).

- `HEBREW_TO_ENGLISH`: record mapping each Hebrew character to its English key equivalent
- `hebrewToEnglish(input)`: converts a full string; non-Hebrew characters pass through unchanged
- **`^` prefix convention**: typing `^` immediately before a mapped Hebrew letter produces the
  uppercase English output (e.g., `^ש` → `A`). `^` before a non-Hebrew character passes through
  literally (no silent data loss).
