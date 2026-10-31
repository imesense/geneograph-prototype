# AGENTS.md

Guidelines for AI agents working on the GeneoGraph prototype repository.

The canonical local checkout is `E:\Geneograph\Concept\geneograph-prototype`. Open that folder as the workspace before changing code; `C:\Users\Nick-PC\Documents\Geneograph` may be a separate Codex workspace and is not this repository.

## Project Overview

GeneoGraph prototype is a static single-page interactive concept of the GeneoGraph genealogy research workspace. It is the target of the landing site's "Try Demo" CTA. It has no build tooling, no package manager and no framework: plain HTML, CSS and vanilla JavaScript served as static files. Third-party libraries load from CDNs: Leaflet 1.9.4 (maps) and Quill 2.0.3 (rich text), with SRI `integrity` hashes where provided.

The original monolithic `index.html` has been split: the application now lives in `src/` as `index.html` plus external stylesheets and classic deferred scripts (see Current Architecture below).

## Current Architecture

- `src/index.html` (small, ~70 lines): CDN `<link>`/`<script>` tags for Leaflet and Quill, nine stylesheets listed in source order, the application shell markup (topbar, sidebar, main, modal backdrop, toast), a tiny inline `<script>` that sets `window.GENEOGRAPH_CONFIG` (MapTiler key), and 21 classic deferred `<script src="..." defer>` tags listed in source order. **The order of stylesheets and scripts is load-order significant — preserve it when editing `src/index.html`.**
- All scripts are classic (non-module) scripts sharing one global scope: top-level `const`/`let`/`function` declarations in one file are visible to all later files, so top-level identifiers must be unique across files.
- Extracted JS files retain the original 4-space indentation of the former inline script block (code starts at column 4); match it when editing those files.
- Key modules:
  - `icons.js` — the `icon` dictionary of inline SVG strings.
  - `runtime-config.js` — the `modules` list (Publish is temporarily disabled via a comment there), Places/MapTiler map config and places map runtime.
  - `localization.js` — language support (`en`, `ru`), translations, storage keys.
  - `sample-data.js` — the central `sampleData` object (Whiskerfield sample project).
  - `seed-genealogy.js`, `seed-boards.js` — load-time mutations of `sampleData`; the Geneograph seed payload lives in `src/assets/boards/whiskerfield-tree-research.js`.
  - `validation.js` — `validateSampleData()` sanity checks.
  - `state-tree-core.js` — the central `state` object.
  - `app-shell.js` — `render()`, the central module dispatcher.
  - `projects-tree-layout.js`, `family-and-shared.js`, `people.js`, `albums.js`, `geneograph.js`, `archive.js`, `notes.js`, `places.js`, `publish.js` — per-module rendering and behavior.
  - `shared-media.js`, `shared-actions.js` — shared media access and cross-module actions.
  - `bootstrap.js` — global keyboard handling (Escape) and the initial `render()` call.
- Stylesheets: `foundation.css` (design tokens in `:root`, base styles), then feature groups `family-people.css`, `people-shared.css`, `geneograph.css`, `albums.css`, `archive.css`, `notes-places.css`, `publish.css`, with `final-overrides.css` loaded last.
- Sample photos, project covers, and other static media live in `src/assets/`.

## OpenSpec Handoff

OpenSpec is initialized in this repository with Codex integration. Keep `openspec/config.yaml` concise: project-wide facts and workflow rules only. Keep verified current behavior in `openspec/specs/` and one change's proposal, design, tasks, and delta specs in `openspec/changes/`. Do not copy this document or the full design guide into every change.

For substantive changes, inspect current behavior, create and validate one focused OpenSpec change, review its proposal before implementation, complete and test its tasks, then archive it after verification. Small, unambiguous fixes need not generate a large specification. Existing working-tree changes belong to the user; never discard them during setup.

`Prototype_Design_Document.md` is the current product and engineering guide, not a backlog or an OpenSpec change. Verify its claims against code before promoting them to durable specs. For Geneograph sample-board work, `src/seed-boards.js` validates and installs the data-only asset in `src/assets/boards/`. Convert a `.ggboard` export with `node tools/ggboard-to-seed.js <input.ggboard> <output.js> <title> [board-id] [project-id]`; the resulting script loads under `file://`.

## Critical File-Handling Rule

Several extracted files are still very large. **Never read them end-to-end.**

- Largest JS files: `archive.js` (~25,800 lines), `geneograph.js` (~25,800), `notes.js` (~15,800), `albums.js` (~12,500), `family-and-shared.js` (~11,900), `people.js` (~9,600), `places.js` (~9,400), `localization.js` (~8,300), `shared-media.js` (~5,000), `projects-tree-layout.js` (~4,200), `shared-actions.js` (~3,800), `state-tree-core.js` (~1,800).
- Largest CSS files: `notes-places.css`, `family-people.css`, `geneograph.css`, `archive.css`, `albums.css`, `foundation.css`.
- Use targeted `grep` searches (selectors, ids, class names, function names, `aria-` attributes) to locate the section you need.
- Read only specific ranges with `offset`/`limit`.
- When editing, prefer narrow, surgical `edit_file` replacements anchored on unique strings.

## Token-Efficient Workflow

- Inspect only files relevant to the requested change. Avoid repository-wide scans unless targeted searches fail or cross-cutting behavior requires one.
- Prefer targeted `rg` searches and bounded file ranges. Do not reread or repeat file contents already inspected.
- Make surgical patches at the responsible layer; avoid unrelated refactors.
- Keep tests proportional to risk. Run focused tests first; use broader suites only when the change warrants them. Do not add tests for every minor change.
- Stop when the acceptance criteria are met. Keep explanations concise and omit large diffs from final responses.

## Repository Structure

- `src/` — the entire application (see Current Architecture).
- `.github/` — issue and pull request templates.
- `.markdownlint.yaml`, `.markdownlint-cli2.yaml` — Markdown lint settings.
- `LICENSE.txt` — GNU GPL 3.
- `README.md` — brief static-site description.

## Coding Conventions

- No build step, no dependencies beyond the pinned CDN libraries (Leaflet, Quill). Do not add new runtime dependencies without asking.
- JavaScript: Allman-style braces (opening brace on its own line), single quotes for strings, semicolons never omitted. Icons are inline SVG strings in the `icon` dictionary (`src/icons.js`) — reuse them rather than duplicating markup.
- CSS: design tokens are custom properties in `:root` (surface ramps `--surface-*`, brand greens `--brand-green-*`, text `--text-*`, borders, spacing `--space-*`, radii, `--shadow-soft`, `--ease`, scrollbar colors). Reuse tokens instead of hard-coded values. Dark theme via `color-scheme: dark`.
- HTML: semantic elements (`section`, `figure`, `article`, `nav`), `aria-*` attributes, `role="status"`/`aria-live` for the toast. Explicit `width`/`height` on images, `loading="lazy"`/`decoding="async"` for non-critical images.

## Content and Design Rules

- Capitalization: the product is **GeneoGraph**; the visual board/workspace is **Geneograph**.
- This is an interactive prototype/concept. Never present planned capabilities as shipped; distinguish prototype behavior from product direction.
- Use the Whiskerfield sample project (Silver Whiskerfield, Luna Purrington, the Meowbridge marriage record) consistently. This is sample data, not historical records.
- Keep the dark identity: near-black surfaces (`#0B0F0E` app background), brand green (`#62D99A` primary accent). Amber (`#D4AA6B`) is reserved for possible/uncertain relationships only; red/purple/blue are status/semantic accents as already used.
- No glass/glow effects, floating decorative cards, or generic startup motifs.

## Accessibility Requirements

Maintain on every change:

- Keyboard focus styles and operable controls.
- Semantic heading hierarchy and landmarks (topbar/sidebar/main).
- `aria-live` regions for dynamic feedback (toast).
- Legible contrast; secondary text must stay readable.
- Reduced-motion support where present.

## File Format Rules (from `.gitattributes` / `.editorconfig`)

- Encoding is UTF-8 for all text files; always end files with a final newline.
- Line endings and indentation by file type:
  - CRLF: `.txt`, `.md` (2-space indent), `.editorconfig`.
  - LF: `.html` (4-space per `.editorconfig`; the existing `src/index.html` currently uses 2-space indentation), `.css` (4-space indent), `.js` (4-space indent), `.json` (4-space indent), `.gitattributes`/`.gitignore` (tab indent), `.yml` (2-space, as in `.github/` templates).
- `.png`, `.webp`, `.jpg`, `.jpeg`, `.ico`, `.svg` are binary — never normalize them as text.

## Deployment

- The site is static: open `src/index.html` directly or serve `src/` as static files; no build step is required.
- The current root-based GitHub Pages configuration does **not** publish the application from `src/` — do not assume the deployed Pages site reflects `src/` until the Pages configuration is updated.
- Verify locally by opening `src/index.html` in a browser before pushing; after structural changes also re-check the console for errors.

## License

Repository contents are licensed under GNU GPL 3 (see `LICENSE.txt`). Do not add code with incompatible licenses.
