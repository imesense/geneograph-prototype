# GeneoGraph Current Prototype Design and Engineering Document

**Revision:** 2026-08-31  
**Supersedes:** `GeneoGraph_Current_Prototype_Design_Document(8).md`  
**Prototype reviewed:** `index(20260830-152032).html`  
**Document status:** Current prototype specification and implementation guide

## 1. Purpose and review scope

This document describes the current GeneoGraph prototype, its product design, implemented interaction model, in-memory domain architecture, shared UI systems, module capabilities, known limitations, and recommended path toward a production application.

The revision was produced by comparing:

- the previous design document;
- the latest supplied single-file prototype;
- the implemented design decisions and corrections recorded in the project conversation through 2026-08-31.

The prototype is an unusually complete interactive specification, but it remains a prototype. It runs as one large HTML file containing CSS, markup templates, sample data, state, renderers, selectors, and event handlers. Most changes operate on centralized in-memory records and reset on reload. Durable persistence, authentication, real GEDCOM processing, production file storage, production mapping, and publication generation are not implemented.

Where a final design instruction is newer than the supplied HTML snapshot, this document records the final approved behavior as the design requirement and calls out any verification still required.

---

## 2. Executive product summary

GeneoGraph is a project-based genealogy and family-history research workspace. It combines a structured family graph with profiles, photos, archival material, notes, places, visual research boards, and publication concepts.

The application is built around one important product idea: the same person, family, place, media, note, and source records appear in multiple connected views rather than being recreated separately in each module.

### Primary modules

| Module | Product purpose | Current prototype maturity |
|---|---|---|
| Projects | Create and organize family-history workspaces. | Mixed: navigation and several card actions work in memory; creation and GEDCOM import remain simulated. |
| Family Tree | Navigate and edit a visual family graph. | Advanced functional prototype with fixed geometry, generated layout, connectors, relative actions, pan, and zoom. |
| People | Search, filter, sort, inspect, select, and manage people. | Advanced functional prototype. |
| Profile | Review and edit a complete person record. | Advanced functional prototype. |
| Geneograph | Build free-form visual research boards. | Advanced functional prototype with canvas editing and in-memory undo/redo. |
| Albums | Manage photos, albums, metadata, associations, and primary portraits. | Advanced functional prototype with in-memory media metadata and browser-local upload drafts. |
| Archive | Organize research files, folders, sources, and connections. | Advanced functional prototype; file binaries and OCR remain simulated. |
| Notes | Create research notes and connect them to other records. | Advanced functional prototype with editor, collections, and typed links. |
| Places | Review places in list/map/split contexts and inspect connected records. | Functional prototype; map and geocoding infrastructure remain non-production. |
| Publish | Configure reports, charts, books, maps, indexes, and exports. | Interaction concept only; no real output files are generated. |

---

## 3. Product design principles

| Principle | Current expression |
|---|---|
| One record, many views | People, Profile, Family Tree, Notes, Albums, Archive, and Places resolve shared records by stable ID. |
| Inspection before navigation | Right-side panels expose useful detail without forcing the user to leave the current module. |
| Deep editing in context | Full Profile and module-specific detail modes provide richer editing when quick inspection is insufficient. |
| Actions near their object | Cards, rows, section headers, toolbars, and inspector blocks expose relevant actions close to the affected record. |
| Stable geometry for visual systems | Family Tree cards use fixed dimensions so content length cannot distort the graph. |
| Progressive complexity | Simple defaults are shown first; optional addresses, facts, advanced dates, filters, and board controls expand when needed. |
| Shared interaction patterns | Sorting, filtering, modals, menus, date fields, place inputs, avatars, empty states, and connected-record lists are reused. |
| Explicit destructive actions | Delete and unlink workflows use confirmation and visible danger styling. |
| Preserve user context | Module state, selection, scroll, tab, editor, zoom, and inspector context are preserved where practical during rerendering. |
| Separate data from localized display | Canonical values remain language-neutral; translated text is produced for display and safely recovered when unchanged. |
| Honest prototype boundaries | Simulated file, import, persistence, map, and export behavior must not be described as production capability. |

---

## 4. Application shell and navigation

The application uses a desktop research-workspace layout:

- a global top bar;
- project and module navigation;
- a module-specific left sidebar where required;
- a central work area;
- an optional right inspector;
- shared modal, popover, menu, and toast layers.

### Global state

The central `state` object owns transient interaction state, including:

- current project and active module;
- selected person, photo, place, board, file, source, and note;
- list/grid/map/split modes;
- filters, sorting, pagination, and saved-view choices;
- bulk selections;
- Profile and inspector sections;
- Geneograph tools, selection, viewport, inspector, and image-picker state;
- Family Tree focus, navigation, generation settings, pan, and zoom;
- modal and popover context;
- language preference.

UI state is not a domain database. A selected row or open panel may disappear without deleting its underlying record.

### Global services and overlays

The prototype includes shared behavior for:

- modal opening, focus capture, focus trapping, Escape handling, and focus return;
- outside-click and Escape dismissal for menus and popovers;
- toast feedback;
- semantic ID normalization and reference validation;
- English/Russian switching through `localStorage`;
- localized rendering of controlled UI text.

Global search, authentication, notifications, and account behavior remain prototype-level rather than production services.

---

## 5. Centralized in-memory data architecture

### 5.1 Source of truth

`sampleData` is the current in-memory domain store. The supplied prototype contains project-scoped collections for:

```text
sampleData
├── projects
├── projectContinuation
├── people
├── relationshipSeed / normalized family records
├── educationSeed
├── places
├── placeSavedFilters
├── placeIssues
├── events
├── media
├── albums
├── archiveFiles
├── sources
├── notes
├── boards
└── links
```

Some module records are normalized or rebuilt at runtime, but display adapters must never become an independent source of truth.

### 5.2 Core record responsibilities

| Record | Owns |
|---|---|
| Project | Workspace identity, name, description, cover, timestamps, and default person. |
| Person | Structured names, gender, living status, birth/death data, metadata, portrait reference, and project ownership. |
| Family/relationship | Partner membership, child membership, relationship type, events, and parent roles. |
| Event/fact | Event type, GEDCOM-oriented tag where applicable, date, place, confidence, and linked entities. |
| Place | Canonical name, alternate/historical names, hierarchy, coordinates, review status, and project ownership. |
| Media | Photo metadata, people, albums, date, place, caption, favourite state, and timestamps. |
| Album | Album identity, description, membership via media records, and timestamps. |
| Archive file/folder | File metadata, hierarchy, state, and linked records. |
| Source | Source identity, metadata, and typed links. |
| Note | Content, note type, status, collection membership, tags, links, and timestamps. |
| Board | Board metadata and a diagram containing nodes and connections. |
| Generic link | Typed cross-module connection where no owning record field is appropriate. |

### 5.3 Derived data

Selectors and adapters create view records for tables, cards, and inspectors. Examples include:

- People table records derived from `Person`;
- Family Tree nodes derived from people and normalized family records;
- photo, file, note, and place connection counts derived from IDs;
- dynamic relationship labels derived from graph paths;
- sorted and filtered arrays derived from records and current UI state.

Derived values must be rebuilt after mutations. They must not be edited directly.

### 5.4 Removed legacy data

Two obsolete fields have been intentionally removed from the active design:

- Person `role` is not stored. Labels such as Self, spouse, parent, child, sibling, in-law, aunt/uncle, niece/nephew, cousin, and relative are calculated from the family graph relative to the project’s default person.
- Media `origin` is not stored or shown in Albums metadata. Upload and board presentation use the appropriate current fields and UI labels instead of a legacy origin object.

The word `role` may still appear in internal connector or placeholder descriptors; those are rendering responsibilities, not person-domain data.

### 5.5 Mutation contract

Every functional edit should follow this path:

```text
render → bind → collect → validate → mutate canonical record
       → update timestamps/derived structures → rerender affected views
```

Cross-record deletion must clean references, update selection fallbacks, and rebuild derived events or relationship views as required.

---

## 6. Shared interaction systems

### 6.1 Shared sorting

The prototype now uses a common sort-control model instead of unrelated native selects. The trigger displays the active field and a direction icon; the popover contains the field choices and ascending/descending choices. The direction word is not repeated beside the trigger chevron.

The trigger should:

- align text to the left;
- size to its content without oversized horizontal margins;
- preserve a clear direction icon and accessible name;
- use the same interaction model in every migrated module.

Current sort fields are:

| Module | Fields |
|---|---|
| Projects | Name, Last updated, Date created, People count |
| People | First name, Last name, Birth date, Last updated, Date created |
| Geneograph | Name, Last updated, Date created |
| Albums | Photo name, Last updated, Date added |
| Archive files | File name, Last updated, Date added, Type |
| Archive sources | Name, Last updated, Date created |
| Notes | Name, Last updated, Date created |
| Places | Name, Last updated, Date created |

Sorting uses locale-aware string comparison, stable source-order fallback, and consistent missing-value placement. In Places, the sort control is visible only in List view.

### 6.2 Shared filter model

A reusable filter schema/renderer/binder has been introduced and is currently adopted by People. Other modules still use their existing filters and should migrate separately after the People implementation is stable.

The shared filter model supports:

- searchable single- or multi-value comboboxes;
- selected-value tokens;
- native select fields for small controlled sets;
- year-range modes;
- clear/apply actions;
- active-filter summaries;
- validation and result counts;
- listboxes positioned outside the clipping panel so long option sets remain usable.

Combobox interaction requirements:

- values must be selected without closing the entire filter;
- outside-click logic must use the complete event path so portaled/fixed listboxes count as part of the filter;
- opening the filter must not automatically open a combobox unless the user explicitly focuses or expands it;
- keyboard navigation, active option, selection state, and Escape behavior must be preserved.

### 6.3 Shared genealogy dates

Genealogy dates support:

- exact dates;
- month and year;
- year only;
- Before;
- After;
- Between;
- About/approximate forms where supported;
- unknown values.

Canonical date labels remain language-neutral. Localized editable fields use a source-value pattern so unchanged Russian display text can save the original value. The parser accepts supported Russian month forms when the localized field is edited.

Switching between date modes must sanitize qualifiers. For example, changing `Before 1900` to Between must place `1900` in the first boundary rather than carrying the word `Before` into a field and causing a validation error. Between accepts year-only boundaries in Albums as well as more precise supported genealogy dates.

### 6.4 Shared place and address inputs

Place selection uses a searchable combobox with a canonical place ID and editable text fallback. Optional address details use an explicit disclosure action:

- `+ Add address` reveals and focuses the field;
- `− Remove address` is red, clears the address, and hides the field;
- existing addresses reopen in the expanded state;
- address labels and placeholders use the same text size as other form fields.

### 6.5 Shared inspector empty state

Places establishes the canonical inspector empty state: flat tertiary text with modest vertical padding and no bordered card, background, artificial minimum height, or nested container. Albums and Archive right-side panel empty states use the same pattern. Shared connected-list empty cards used in other contexts are not globally restyled.

### 6.6 Shared modals and sticky action areas

Long modals use a scrollable body and a stable header/footer. Action buttons must remain visible while the content list or form scrolls. This is especially important for photo selection and upload flows opened from Profile or Family Tree.

---

## 7. Projects

### Implemented behavior

- project card navigation;
- project selection and continuation state;
- sorting through the shared sort control;
- rename in memory;
- duplicate in memory;
- update cover in memory;
- delete with project-owned collection cleanup and selection fallback;
- contextual project menu;
- creation and import modal designs.

### Simulated or incomplete behavior

- Create Project currently confirms a simulated result rather than creating a complete canonical project;
- GEDCOM file picking and import are simulated;
- project counts are prototype data and are not backed by a persistent query layer;
- no collaboration, permissions, syncing, or durable storage exists.

### Design requirement

Project deletion must remain project-scoped. It must remove owned records from every canonical collection, clear continuation state, select a valid remaining project/person/photo/place, and rerender without leaving dangling UI references.

---

## 8. People

### 8.1 Directory behavior

People provides:

- search;
- shared sorting;
- list/table presentation;
- configurable columns;
- pagination;
- row preview in the right inspector;
- multi-select and visible-selection controls;
- bulk toolbar actions;
- saved filters/views in prototype state;
- create, edit, delete, and open Profile actions.

Preview selection and bulk selection are separate concepts and must remain separate in state and visual treatment.

### 8.2 People filters

The People filter is the first consumer of the shared filter system.

| Filter | Control |
|---|---|
| Surname | Searchable multi-value combobox |
| Birth place | Searchable multi-value combobox |
| Birth year | Mode control with conditional year fields |
| Living status | Small controlled select |
| Review status | Small controlled select |

Birth-year layout requirements:

- `Birth year` is a normal field label above its controls, never inline beside them;
- Any year displays no year input;
- Before displays one `Year` input;
- After displays one `Year` input;
- Between displays `From` and `To` inputs;
- impossible or reversed ranges show a clear validation message;
- the filter summary reflects the active mode and values.

The supplied prototype snapshot predates the final repeated instruction about keeping the Birth year label above the controls. That placement is the approved design and should be reverified in the next implementation snapshot.

### 8.3 Dynamic family role

People rows do not read a stored person role. Relationship labels are calculated relative to the project’s default person by traversing normalized family edges. This keeps People consistent with relationship edits and avoids a non-GEDCOM legacy field becoming stale.

### 8.4 Bulk actions

In-memory deletion is functional and cleans owned references. Other bulk actions must be described according to their actual behavior; export or board actions that only show a toast are still placeholders.

---

## 9. Profile and Add/Edit Person

### 9.1 Profile structure

The full Profile combines:

- a hero with portrait, identity, life status, dates, and actions;
- main person information;
- Family relationships;
- timeline and facts;
- Education, Work, and Other sections;
- connected notes, files, sources, photos, and places;
- per-section inspection and editing.

Panels use stable layout behavior so switching tabs or entering edit mode does not create avoidable jumps. Right-side information cards use the same general inspector language as other modules.

### 9.2 Profile hero

Regular and compact widths use the same information hierarchy. Compact mode does not replace the hero with a different layout; it stacks the action buttons vertically while preserving the main portrait and identity composition.

Unknown-date rules are explicit:

| Person state | Hero date lines |
|---|---|
| Living, birth unknown | `Birth: Unknown` |
| Deceased, dates unknown | `Birth: Unknown` and `Death: Unknown` |
| Living status unknown, dates unknown | `Birth: Unknown` and `Death: Unknown` |

The hero must not render `Dates: Dates unknown` and must not use `Death: Deceased`; deceased status is already communicated by the living-status tag.

### 9.3 Person name model

Person names contain structured prefix, first, middle, current surname, maiden surname, suffix, display name, and initials. Display name and initials are rebuilt from the structured fields after edits.

Tree-specific female surname presentation is described in the Family Tree section and must not overwrite the canonical Person record.

### 9.4 Facts and occupations

Additional facts are canonical person facts, not presentation-only cards. Their summary uses a shared localized formatter for `Optional` and dynamic `N added` states both on initial render and after add/remove operations.

Occupation fields and sample values are localized for display in the editor, including location, occupation, and description values, while canonical source values remain recoverable.

### 9.5 Education

Education uses distinct Start date and End date labels. Both fields use the shared genealogy-date system. Duplicate Start date labels are not permitted.

### 9.6 Photos and addresses

Person portraits resolve a primary photo when available and fall back to initials. Photo-add modals launched from Profile or Family Tree keep their footer actions visible while content scrolls.

Place-linked address fields use the shared Add/Remove address interaction described earlier.

---

## 10. Family Tree

### 10.1 Purpose and interaction model

Family Tree visualizes people and family units, supports focus navigation, exposes relative actions, and opens person inspection/editing without creating another genealogy database.

Current interaction includes:

- focus person and focus controls;
- back/forward and recent-person navigation;
- generation and cousin visibility settings;
- pan and zoom;
- person cards with portrait/initial fallback;
- partner, parent, child, and placeholder structures;
- edit and add-relative actions;
- generated SVG connectors;
- right-side inspection.

### 10.2 Fixed card geometry

Cards must have fixed dimensions. Text length, translation length, and the presence of a second name line must never increase the card’s width or height.

The current geometry contract is centralized in `TREE_GEOMETRY` and includes:

| Geometry | Current value |
|---|---:|
| Person card | 300 × 124 px |
| Card padding | 10 px |
| Content gap | 10 px |
| Avatar | 68 px |
| Partner gap | 40 px |
| Sibling gap | 48 px |
| Subtree gap | 96 px |
| Parent placeholder height | 110 px |
| Parent placeholder gap | 48 px |
| Connector rail | 56 px |
| Connector lane | 16 px |
| Focus control | 84 × 32 px |

CSS width, min-width, max-width, height, min-height, and max-height all enforce the same card size. Layout mathematics must use the same geometry constants as CSS.

### 10.3 Card content layout

- the avatar and identity block are vertically centered;
- the name is clamped to two lines with an ellipsis;
- a one-line name uses only one line and does not reserve a blank second line;
- the date block sits immediately below the name with a small 4 px separation;
- the focus tag aligns vertically with the edit/add action row;
- controls remain inside the fixed card bounds.

### 10.4 Female display-name policy

This policy affects only Family Tree display text:

1. If a maiden surname exists and differs from the effective current surname, show it after the name in parentheses: `First Middle Surname (Maiden)`.
2. If a female person has no current surname and has an active married partner with a surname, use that spouse surname as a display fallback.
3. If current surname and maiden surname match after normalization, do not repeat the maiden surname.
4. Never persist a spouse surname into the person’s canonical name record merely to satisfy the tree display.

### 10.5 Horizontal layout system

Only horizontal placement is solved dynamically; generation levels determine vertical placement.

The current system combines a tidy-tree/family-unit approach with explicit constraints:

1. Build normalized people, partner pairs, children, and missing-parent placeholders.
2. Treat each partner pair as a constant-width family unit with a fixed internal partner gap.
3. Calculate descendant and ancestor extents from the leaves upward.
4. Place parent units over the distributed span of their children.
5. Enforce non-overlap constraints between neighboring cards, couples, placeholders, and subtrees.
6. Shift whole parent/subtree blocks when local spacing is insufficient rather than changing the partner gap.
7. Route connectors through reserved horizontal rails and lanes.
8. Reduce crossings where sibling or family ordering permits it.

The result is deterministic geometry: longer names are clamped, partners remain together, siblings distribute across available space, and whole ancestral blocks move as the tree expands.

### 10.6 Connector requirements

Connectors must be generated from exact card and placeholder anchors. Parent placeholder pairs use the real combined width and midpoint of the two blocks. Their shared vertical connector must be one straight segment; separate rounded or offset path fragments must not create a visible kink.

Connector paths should:

- avoid intersecting cards;
- share trunks where semantically appropriate;
- occupy deterministic lanes;
- remain centered on family units after horizontal shifts;
- avoid overlapping unrelated connector segments where the layout has room to separate them.

`validateTreeLayout()` provides prototype diagnostics for node overlap, edge-node intersection, segment overlap, and edge crossing. These warnings are a development aid, not a substitute for automated layout tests.

### 10.7 Deferred features

Semantic zoom and true fit-to-content modes are deliberately deferred. Current zoom scales the existing detailed tree rather than changing card content by zoom tier.

---

## 11. Geneograph

### 11.1 Board organization

Geneograph provides:

- board and collection browsing;
- favourites;
- create, rename/edit, duplicate, and delete flows in memory;
- board statistics;
- sort and view controls;
- a full board editor.

### 11.2 Board editor

The editor supports a free-form diagram with:

- person nodes;
- text and sticky-note nodes;
- images and board-local uploaded image assets;
- panels and shapes;
- place nodes;
- pencil drawings;
- connections, ports, patterns, and waypoints;
- move, resize, multi-select, and layer operations;
- appearance, fill, stroke, text, and geometry controls;
- inspector sections;
- minimap, viewport, pan, and zoom;
- in-memory undo and redo based on diagram snapshots.

Person and place nodes reference central entity IDs. Board-local images use their current source label and asset data; they do not recreate the removed Albums `origin` field.

### 11.3 Top toolbar design

The toolbar is density-sensitive and must remain usable on smaller widths:

- Undo and Redo are icon-only buttons with accessible labels and tooltips.
- Select, Pan, and Pencil form one compact tool switcher. Inactive tools show icons only; the active tool shows icon and name.
- Text and Sticky note are grouped as related content tools.
- Shapes always uses `Shapes` as its visible button name regardless of the last chosen shape.
- toolbar padding and inter-control gaps are compact; a tool switcher must not reserve the width of three full-text buttons.
- icons come from the centralized icon definitions used by the toolbar render function rather than one-off inline replacements.

### 11.4 Limitations

- board changes are not durable across reloads;
- undo/redo history is runtime-only;
- there is no collaborative editing, server conflict handling, or version history;
- large-board performance and accessibility require production testing.

---

## 12. Albums

### 12.1 Library and selection

Albums provides:

- All Photos, album, favourite, and related browsing contexts;
- grid/list views;
- search, filters, shared sorting, and pagination;
- single and bulk selection;
- localized Select all and Clear actions;
- a detail inspector and metadata edit mode;
- album create/edit/delete;
- photo-album membership editing;
- person-photo association and primary portrait selection.

### 12.2 Add to album modal

The Add to album modal is a shared multi-photo assignment workflow. It includes search, album counts, album membership state, create-new-album mode, and a sticky footer.

Current design requirements:

- no selected-photo subtitle under the modal title;
- no `N photo selected` phrase in the footer;
- the footer keeps only the number of albums selected;
- Cancel closes without changing album membership;
- the save action applies selected album memberships;
- all labels, counts, buttons, membership messages, and plural forms are localized;
- Create new album includes localized placeholders for Album name and Description.

Album names and descriptions are user data. In edit mode they use the localized-data-field source-value pattern so unchanged localized sample text can resolve to its canonical value without translating arbitrary user input.

### 12.3 Dates

Photo date editing uses the shared genealogy-date system. Switching Before/After to Between strips the old qualifier from the editable boundary. Between accepts year-only dates, as well as the other precise date forms supported by the parser.

### 12.4 Metadata and data model

Photo metadata includes file name, format, dimensions, size, added timestamp, and last-modified timestamp. The obsolete Origin row and `origin` record property have been removed.

### 12.5 Upload boundary

The prototype can create browser-local upload drafts, crop/select portraits, and create placeholder media records in memory. It does not provide durable binary storage, server upload, transcoding, or a persistent thumbnail service.

---

## 13. Archive

Archive is a file-and-source research workspace rather than a static mock screen.

### Implemented prototype behavior

- file/folder and source modes;
- folder hierarchy and breadcrumbs;
- back/forward navigation;
- search, filters, sorting, and list presentation;
- row and bulk selection;
- create folder and create source flows;
- rename, move, favourite, delete, and recently deleted concepts;
- file and folder inspectors;
- source inspector;
- metadata editing;
- typed connections to people, events, notes, places, files, and sources;
- link and unlink modals;
- drag/drop and upload presentation;
- inspector empty states aligned with Places.

### Prototype boundaries

- file binaries are not stored durably;
- OCR, indexing, previews, checksums, and virus scanning are not production services;
- source/citation formatting is not a complete evidence model;
- destructive changes are in memory only;
- large folder and file-volume performance is untested.

The Archive right panel must use the flat shared inspector empty state. Picker, search, and modal empty states may use their own purposeful components.

---

## 14. Notes

Notes provides a connected research-writing environment with:

- browser/list and editor panes;
- split-pane interaction;
- note, case, and collection concepts;
- create, edit, autosave-status presentation, duplicate, favourite, archive, restore, and delete actions;
- tags and checklists;
- linked people, places, events, photos, sources, files, and related notes;
- contextual note creation;
- collection create/edit/delete and membership management;
- search, filters, sorting, and state preservation during rerender.

Both note-row and editor-header More actions menus use the same menu function. `Add to collection` opens the same `openNoteCollectionsModal(note.id)` workflow used by the right-side Collections panel. It must not duplicate collection state or open a competing modal implementation.

Notes content is still in-memory prototype data. A production editor needs durable storage, revisions, conflict handling, sanitization, attachment storage, and a formal citation model.

---

## 15. Places

Places supports:

- place hierarchy and navigation;
- list, map, and split views;
- route views for a person or surname;
- map markers, route lines, and map viewport state;
- search and module filters;
- saved filters/views in prototype data;
- create/edit place workflows;
- coordinates and review status;
- alternate and historical names;
- linked people, events, photos, files, and notes;
- place inspectors and review queues.

### Layout requirements

- the sort control appears only in List view;
- localized alternate/historical-name counters remain on one line;
- the title may wrap while the count and chevron reserve their compact width;
- empty Notes and Files inspector sections use the same flat tertiary empty-state style;
- map and split views prioritize map-specific controls rather than list sorting.

### Limitations

The map is a prototype visualization. There is no production tile provider, geocoder, reverse geocoder, historical boundary service, or formal place-authority system. Coordinate editing and issue review demonstrate the intended workflow but are not backed by external validation.

---

## 16. Publish

Publish demonstrates:

- output-type cards;
- draft outputs;
- a multi-step configuration wizard;
- report, chart, book, map, archive-index, and export concepts;
- scope selection;
- privacy, source, and media settings;
- preview and status concepts.

No PDF, DOCX, HTML site, chart package, GEDCOM export, or archive package is currently generated. Privacy settings are presentation-level controls rather than an enforced export policy. Publish remains the least implemented product module.

---

## 17. Localization

### 17.1 Current system

The prototype supports English and Russian through:

- language preference in `localStorage`;
- `<html lang>` updates;
- a large controlled translation map;
- dynamic phrase translation and plural rules;
- localized placeholders, labels, button copy, counts, and selected metadata values;
- protection of names and other user-authored content;
- localized genealogy-date display with canonical source preservation.

Recent coverage includes:

- Album bulk actions and Add to album modal copy;
- Archive, Albums, and Places inspector empty states;
- Additional facts counts;
- occupation sample values in Person editing;
- Notes Add to collection;
- Russian month names in editable genealogy dates;
- album name/description sample-data display in edit fields.

### 17.2 Data/display boundary

Inputs are intentionally not translated through a blanket DOM attribute pass. Editable controlled data uses `data-source-value`, a localized visible value, and a collector that restores the canonical source when the user has not changed the text.

Do not:

- add all input `value` attributes to generic DOM localization;
- store Russian month names in canonical genealogy-date labels;
- translate arbitrary user-entered names, notes, captions, or descriptions;
- introduce language-specific conditionals inside individual modules when a shared formatter can express the rule.

### 17.3 Production direction

Rendered-text translation remains fragile. A production version should use keyed namespaces, typed interpolation, full plural rules, locale-aware date formatting, missing-key audits, and automated coverage for every dynamic state.

---

## 18. Responsive behavior and accessibility

### 18.1 Responsive priorities

The prototype remains desktop-first, but narrow-width behavior is increasingly deliberate:

- Profile hero keeps its main layout and stacks only its buttons in compact mode;
- Geneograph compacts high-frequency tools rather than letting text buttons overflow;
- modal bodies scroll independently from visible action footers;
- sort triggers size to content;
- long tree names clamp instead of changing graph geometry;
- inspectors and lists use intrinsic sizing and controlled overflow.

Full responsive QA is still required across laptop, tablet, zoomed browser, and translated layouts.

### 18.2 Accessibility baseline

Current and future changes must preserve:

- native buttons, inputs, checkboxes, and selects where appropriate;
- visible focus;
- accessible names for icon-only controls;
- modal roles, focus trap, Escape dismissal, and focus return;
- tab and panel semantics;
- combobox/listbox roles and keyboard navigation;
- non-color status cues;
- decorative-icon hiding;
- valid IDs and `aria-*` references;
- no nested interactive controls.

The single-file prototype includes useful semantic validation helpers, but formal screen-reader and keyboard testing remains outstanding.

---

## 19. Current capability matrix

| Capability | Status |
|---|---|
| Project/module navigation | Functional in memory |
| Project rename/duplicate/cover/delete | Functional in memory |
| Project creation | Simulated |
| GEDCOM import/export | Not implemented |
| People search/sort/filter/columns/pagination | Functional prototype |
| People multi-select and delete | Functional in memory |
| Dynamic relationship labels | Functional from family graph |
| Person create/edit/delete | Functional in memory |
| Relationship create/edit/unlink | Functional in memory |
| Profile multi-section editing | Functional in memory |
| Shared genealogy-date parsing/editing | Functional prototype |
| Family Tree fixed geometry/layout/connectors | Functional prototype with diagnostic validation |
| Family Tree semantic zoom | Deliberately deferred |
| Geneograph board editing | Functional in memory |
| Geneograph undo/redo | Functional for current runtime session |
| Albums and album membership | Functional in memory |
| Browser-local photo draft/portrait flows | Functional prototype |
| Durable photo/file storage | Not implemented |
| Archive hierarchy/source/linking flows | Functional in memory |
| OCR and production file processing | Not implemented |
| Notes editor/collections/typed links | Functional in memory |
| Places list/map/split/route/inspect flows | Functional prototype |
| Production map/geocoding | Not implemented |
| English/Russian prototype localization | Substantial, with ongoing audit required |
| Publish configuration | Interactive concept |
| Publish file generation | Not implemented |
| Authentication/authorization | Not implemented |
| Durable domain persistence | Not implemented |

---

## 20. Known gaps and verification priorities

### Critical architecture gaps

1. All central mutations are lost on reload.
2. The application is concentrated in one very large HTML file.
3. There is no typed schema or transaction boundary.
4. Media and file binaries have no durable storage service.
5. GEDCOM parsing and export do not exist.
6. Publish does not generate output.
7. Production map, geocoding, and place-authority services do not exist.
8. Authentication, authorization, collaboration, sync, and audit history do not exist.

### High-priority QA

1. **Family Tree scale:** test wide and deep families, multiple partners, missing parents, step/adoptive structures, repeated descendants, Russian names, and connector crossings.
2. **Relationship integrity:** verify all entry points pass an explicit anchor person and that unlink/delete cleanup does not remove shared children incorrectly.
3. **People filters:** reverify the final Birth year label and conditional-field layout in the next supplied prototype.
4. **Date modes:** test qualifier switching and Russian input across Profile, relationships, Albums, and other date consumers.
5. **Localization:** audit every dynamic counter, menu action, modal footer, empty state, placeholder, and sample controlled value.
6. **Modal behavior:** test sticky footers, Cancel, Escape, close buttons, focus return, long content, and nested create flows.
7. **Sort consistency:** confirm every module uses its approved field set, direction state, missing-value policy, and timestamp updates.
8. **Cross-module timestamps:** every meaningful person/media/note/place/source/board mutation must update the timestamp used by Last updated sorting.
9. **Deletion:** exercise projects, people, albums, files, notes, sources, places, boards, and relationship records with active selections and links.
10. **Responsive layouts:** test 200% zoom, Russian copy, small laptop widths, and all right-panel combinations.

### Prototype cleanup still required

- finish normalizing family-record aliases into one production schema;
- remove obsolete selectors and helpers whenever a canonical replacement is introduced;
- replace toast-only actions with real commands or label them clearly as simulated;
- consolidate remaining module-specific filters only after the shared People filter is stable;
- move domain logic out of render/bind functions before a framework migration.

---

## 21. Engineering and maintenance rules

### 21.1 Review before editing

1. Use the latest prototype file as the implementation source of truth.
2. Search for all renderers, binders, collectors, validators, state fields, data writers, translations, and CSS selectors involved in a change.
3. Trace every entry point that reuses a shared component.
4. Verify real search anchors and function boundaries before describing implementation steps.
5. Check the full interaction path, not only initial markup.

### 21.2 Keep one canonical implementation

- modify the existing shared helper or component;
- do not append late CSS overrides when the base rule is wrong;
- do not create competing menus, modals, date parsers, avatars, empty states, filters, or sort controls;
- express contextual differences through explicit options;
- remove the replaced implementation in the same change.

### 21.3 Keep responsibilities focused

| Responsibility | Expected behavior |
|---|---|
| Renderer | Produces markup from data and state. |
| Binder | Attaches interaction behavior to rendered controls. |
| Collector | Reads and validates user input. |
| Normalizer | Converts input or legacy shapes into a canonical form. |
| Selector | Derives display data without mutation. |
| Command/mutation helper | Changes canonical records and timestamps. |
| Layout solver | Computes geometry without DOM-content side effects. |
| Modal helper | Owns one complete create/edit/connect/confirm workflow. |

### 21.4 Safe data rules

- use stable IDs for links;
- escape user-controlled strings inserted into HTML;
- never persist display-only fallbacks;
- do not store derived relationship labels;
- keep canonical data language-neutral;
- update timestamps through the canonical mutation path;
- clean cross-record references during delete/unlink;
- avoid runtime migration code for fields intentionally removed from current sample data.

### 21.5 Validation before handoff

- run JavaScript syntax validation;
- check template-literal and CSS boundaries;
- search for obsolete identifiers and require expected zero matches;
- test empty, populated, selected, editing, error, translated, and compact states;
- test every entry point that calls a shared modal/component;
- validate generated IDs and ARIA references;
- distinguish static inspection from browser-tested behavior in the handoff.

---

## 22. Recommended production architecture

The prototype should be migrated incrementally while preserving the central-record and shared-component principles.

| Layer | Recommended direction |
|---|---|
| Language | TypeScript |
| Frontend | Component-based application architecture; React is suitable but not mandatory |
| State | Feature-scoped UI state plus typed domain commands/selectors |
| Validation | Runtime schemas such as Zod or equivalent |
| Persistence | PostgreSQL/Supabase for cloud collaboration or SQLite for a local-first product direction |
| Files/media | Object storage or local managed file store, with thumbnail/preview processing |
| Genealogy interchange | Dedicated GEDCOM import/export service with validation and migration reports |
| i18n | Keyed namespace-based localization with plural/date support |
| Canvas | A maintained graph/canvas foundation or extracted custom engine with tests |
| Mapping | Production tile/geocoding provider plus internal place-authority model |
| Testing | Unit, integration, accessibility, visual-regression, and graph-layout tests |

### Recommended domain packages

```text
domain/
├── projects
├── people
├── families
├── events-and-facts
├── genealogy-dates
├── places
├── media-and-albums
├── archive-and-sources
├── notes
├── boards
├── links
└── publications
```

UI modules should consume typed queries and commands rather than mutating arrays directly.

---

## 23. Migration plan

### Phase 1 — Lock behavior and schemas

- document canonical record shapes;
- inventory remaining aliases and simulated actions;
- add syntax and smoke-test automation;
- add deterministic fixtures for families, dates, filters, sorting, and localization;
- preserve the current UI as a visual-regression reference.

### Phase 2 — Extract and test pure domain logic

Extract:

- person name normalization;
- relationship graph and labels;
- family mutations and deletion cleanup;
- genealogy-date parsing/formatting;
- filtering and sorting;
- media/album membership;
- typed links;
- Family Tree layout and validation.

### Phase 3 — Add typed persistence

- define schemas and migrations;
- add repositories and transaction-safe commands;
- persist projects, people, families, events, places, notes, media metadata, sources, and boards;
- preserve stable IDs and timestamps;
- introduce autosave/error/retry states.

### Phase 4 — Migrate Projects, People, Profile, and Family Tree

These modules define the core genealogy experience and should establish the production component, data, and test patterns.

### Phase 5 — Add real media and Archive infrastructure

- binary upload/storage;
- thumbnail and preview jobs;
- file metadata and checksums;
- OCR/indexing where required;
- delete/restore lifecycle;
- source/citation model.

### Phase 6 — Persist Notes and Places

- durable editor and revisions;
- typed entity links;
- place authorities, aliases, hierarchy, and issue resolution;
- production map/geocoding integration.

### Phase 7 — Persist and optimize Geneograph

- diagram persistence;
- autosave and version history;
- durable undo/redo boundaries;
- large-board performance;
- keyboard and screen-reader strategy;
- optional collaboration.

### Phase 8 — Implement Publish and interchange

- GEDCOM import/export;
- privacy policy engine;
- source formatting;
- PDF/DOCX/HTML/chart rendering;
- archive packages and validation reports.

### Phase 9 — Harden localization, accessibility, and responsiveness

- replace rendered-text translation;
- complete localization coverage;
- run keyboard and screen-reader audits;
- test high zoom and compact widths;
- establish performance budgets and browser support.

---

## 24. Readiness checklist

### Substantially demonstrated in the prototype

- [x] Central project-scoped record model.
- [x] Shared Person and family records across People, Profile, and Family Tree.
- [x] Dynamic relationship-label calculation without a stored person role.
- [x] In-memory person and relationship CRUD.
- [x] Shared genealogy-date editing and localization pattern.
- [x] Fixed Family Tree card geometry and generated horizontal layout.
- [x] Shared cross-module sorting.
- [x] Reusable filter foundation adopted by People.
- [x] Functional Geneograph board editor with runtime undo/redo.
- [x] Functional Albums metadata and membership workflows.
- [x] Functional Archive hierarchy/source/linking workflows.
- [x] Functional Notes editor, collections, and typed-link workflows.
- [x] Functional Places list/map/split/route prototype.
- [x] English/Russian prototype direction.

### Required before MVP

- [ ] Canonical typed schema and migration policy.
- [ ] Durable project/entity persistence.
- [ ] Authentication and authorization.
- [ ] Real file and photo storage.
- [ ] GEDCOM import/export.
- [ ] Production map/geocoding and place authority.
- [ ] Key-based localization.
- [ ] Automated graph-layout and cross-module interaction tests.
- [ ] Reliable undo/restore for destructive actions.
- [ ] Durable board persistence and version history.
- [ ] Publication and export generation.
- [ ] Privacy enforcement.
- [ ] Accessibility, responsive, security, and performance sign-off.

---

## 25. Material changes from revision 8

The previous document is outdated in the following important ways:

| Area | Revision 8 description | Current design |
|---|---|---|
| Family Tree | General generated positioning with limited detail | Fixed 300 × 124 card geometry, two-line clamp, female-name rules, family-unit horizontal solver, connector lanes, and layout diagnostics |
| Person role | Implied remaining legacy person role/aliases | Stored person role removed; relationship labels are graph-derived |
| Sorting | Module-level functional state without a unified contract | Shared sort popover and approved field sets across Projects, People, Geneograph, Albums, Archive, Notes, and Places |
| Filters | Traditional module-specific filters | Shared schema-driven filter foundation introduced in People with search comboboxes and birth-year modes |
| Geneograph | Mostly visual/session board concept | Rich in-memory board editor with nodes, shapes, drawing, connections, inspector, layers, minimap, and undo/redo |
| Albums | Limited media concept | Functional selection, albums, metadata editing, portrait flows, add-to-album workflow, localized bulk actions, and shared dates |
| Media origin | Origin metadata described/displayed | Obsolete Origin row and data field removed |
| Archive | Mostly simulated | Functional in-memory hierarchy, sources, inspectors, movement, metadata, and typed connections; binary storage still absent |
| Notes | Partial note interactions | Full browser/editor structure, collections, More actions reuse, and broad typed linking |
| Places | Basic visual list/map | List/map/split/route states, saved filters, richer inspector, place editing, and shared empty-state rules |
| Profile hero | Generic unknown-date handling | Explicit Birth/Death Unknown rules and shared compact layout with vertically stacked actions |
| Responsive UI | Broad desktop-first statement | Targeted compact behavior for Profile, Geneograph toolbar, sticky modal footers, sorting, and fixed tree cards |
| Empty states | Module-specific cards | Shared flat inspector empty state for Places, Albums, and Archive right panels |
| Localization | General English/Russian support | Expanded dynamic counts, modal copy, editable canonical/display separation, and Russian genealogy-date parsing |

---

## 26. Final assessment

GeneoGraph has evolved from a mostly visual prototype into a broad in-memory application specification. Its strongest areas are now the connected Person/family model, Profile editing, the fixed-geometry Family Tree, the Geneograph canvas, shared sorting, People filtering, Albums membership, Notes linking, Archive organization, and Places inspection.

The next major challenge is no longer proving that these workflows can be designed. It is extracting them from the single-file implementation into typed, testable domain and UI layers without losing the shared-record behavior and the interaction details already established.

Future work should therefore prioritize:

1. schema stabilization and automated tests;
2. durable persistence and file services;
3. migration of the core genealogy modules;
4. durable board, Notes, Archive, Albums, and Places infrastructure;
5. production localization, accessibility, privacy, and publishing.

This document should be updated whenever a change alters a canonical record shape, shared interaction system, module capability boundary, or production-readiness assumption.
