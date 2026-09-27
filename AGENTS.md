# AGENTS.md

Guidelines for AI agents working on the GeneoGraph prototype repository.

## Project Overview

GeneoGraph prototype is a static single-page interactive concept of the GeneoGraph genealogy research workspace. It is the target of the landing site's "Try Demo" CTA and is served at `https://imesense.github.io/geneograph-prototype/`. Like the landing, it has no build tooling, no package manager and no framework: plain HTML, CSS and vanilla JavaScript deployed as-is to GitHub Pages.

Key difference from the landing: the entire application currently lives in **one monolithic `index.html`** (~170,000 lines):

- All styles sit in a single inline `<style>` block (design tokens in `:root`, then every component rule).
- The application shell markup (topbar, sidebar, main, modal backdrop, toast) is a small fragment near the end of `<body>`.
- `window.GENEOGRAPH_CONFIG` (MapTiler key) is set in a tiny dedicated `<script>` block.
- All behavior lives in one huge inline `<script>` block that starts with an `icon` dictionary of inline SVG strings.
- Third-party libraries load from CDNs: Leaflet 1.9.4 (maps) and Quill 2.0.3 (rich text), with SRI `integrity` hashes where provided.

## Critical File-Handling Rule

`index.html` is very large and monolithic. **Never read it end-to-end.**

- Use targeted `grep` searches (selectors, ids, class names, function names, `aria-` attributes) to locate the section you need.
- Read only specific ranges with `offset`/`limit`.
- Approximate landmarks (line numbers drift as the file changes): inline `<style>` ≈ lines 21–32619; shell markup ≈ 32620–32631; config script ≈ 32632–32636; main application script ≈ 32638–170579.
- When editing, prefer narrow, surgical `edit_file` replacements anchored on unique strings.

## Repository Structure

- `index.html` — the entire prototype (see decomposition goal below).
- `assets/sample-photos/` — binary sample photo assets; do not edit as text.
- `.github/` — issue and pull request templates.
- `LICENSE.txt` — GNU GPL 3.

## Target Architecture: Decomposition Goal

The main anticipated task is decomposing the monolith into a static multi-file site **without introducing any build tooling**:

- Move the inline CSS into external `.css` stylesheet(s) and the inline JavaScript into external `.js` script(s), linked via `<link rel="stylesheet">` and `<script src="..." defer>`.
- Keep only the minimal runtime bootstrap inline (or in a tiny `config.js`): the `window.GENEOGRAPH_CONFIG` assignment.
- The deployed output must remain exactly the static files in the repository root — no bundler, transpiler, package manager, client-side framework or server runtime may be introduced.
- Decomposition is a refactor, not a redesign: preserve existing behavior, markup semantics and visuals exactly. Verify by opening `index.html` in a browser after each extraction step.
- Extract in small, verifiable increments (e.g. tokens/base styles first, then component groups; icons dictionary, then feature modules), keeping the page working after every step.

## Coding Conventions

- No build step, no dependencies beyond the pinned CDN libraries (Leaflet, Quill). Do not add new runtime dependencies without asking.
- JavaScript: Allman-style braces (opening brace on its own line), single quotes for strings, no semicolons omitted inconsistently (follow the existing style of the main application script). Icons are inline SVG strings in the `icon` dictionary — reuse them rather than duplicating markup.
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
  - CRLF: `.txt`, `.md` (2-space indent), `.editorconfig` (4-space indent).
  - LF: `.html` (2-space indent), `.css` (4-space indent), `.js` (4-space indent), `.json` (2-space indent), `.yml` (2-space indent), `.gitattributes` (tab indent).
- `.png`, `.webp`, `.jpg`, `.ico`, `.svg` are binary — never normalize them as text.

## Deployment

- The site is served from the repository root on GitHub Pages. Pushing to the default branch publishes changes.
- Verify locally by opening `index.html` in a browser before pushing; after decomposition steps also re-check console for errors.

## License

Repository contents are licensed under GNU GPL 3 (see `LICENSE.txt`). Do not add code with incompatible licenses.
