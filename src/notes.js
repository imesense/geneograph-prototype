function renderNotes()
{
    destroyNotesRichTextEditor();

    const validNotesViews =
        new Set([
            'all',
            'favorites',
            'archived',
            'collection'
        ]);

    if (
        !validNotesViews.has(
            state.notesView
        )
    )
    {
        state.notesView =
            'all';

        state.notesActiveCollectionId =
            null;
    }

    if (
        state.notesView === 'collection'
        && !getNoteCollection(
            state.notesActiveCollectionId
        )
    )
    {
        state.notesView =
            'all';

        state.notesActiveCollectionId =
            null;
    }

    workspace.classList.remove(
        'no-sidebar'
    );

    renderNotesSidebar();

    const list =
        filteredNotes();

    ensureNotesSelection(list);

    const selected =
        selectedNote();

    const editorOpen =
        Boolean(
            selected
          && !state.notesRightCollapsed
        );

    const shellClasses = [
        'notes-shell',

        editorOpen
            ? 'editor-open'
            : '',

        state.notesRightCollapsed
        && selected
            ? 'right-collapsed'
            : '',

        `notes-mobile-${
            state.notesMobilePane
            === 'editor'
                ? 'editor'
                : 'browser'
        }`
    ]
        .filter(Boolean)
        .join(' ');

    const width =
        Math.max(
            360,
            Math.min(
                600,
                Number(
                    state.notesBrowserWidth
                ) || 440
            )
        );

    main.innerHTML = `
        <div
          class="${shellClasses}"
          style="
            --notes-browser-width:
              ${width}px;
          ">

          ${renderNotesBrowserPane(
                list
            )}

          ${renderNotesRightPanel(
                selected
            )}
        </div>
      `;

    bindNotesControls();

    if (editorOpen)
    {
        initializeNotesRichTextEditor(
            selected
        );
    }
}

function renderNotesSidebar()
{
    const item = (
        view,
        label,
        svg
    ) => `
        <button
          class="side-link ${
                state.notesView === view
                    ? 'active'
                    : ''
            }"
          type="button"
          data-notes-view="${view}">

          ${svg}

          <span>${label}</span>
        </button>
      `;

    const collectionRows =
        getProjectNoteCollections()
            .map(collection =>
            {
                const active =
                    state.notesView
                === 'collection'
              && state
                  .notesActiveCollectionId
                === collection.id;

                return `
              <div
                class="
                  sidebar-entity-row
                  ${active ? 'active' : ''}
                ">

                <button
                  class="sidebar-entity-main"
                  type="button"
                  data-notes-collection="${escapeHtml(
                        collection.id
                    )}"
                  title="${escapeHtml(
                        collection.name
                    )}">

                  ${icon.folder}

                  <span class="sidebar-entity-name">
                    ${escapeHtml(
                        collection.name
                    )}
                  </span>
                </button>

                <button
                  class="
                    more-button
                    sidebar-entity-more
                  "
                  type="button"
                  data-notes-collection-menu="${escapeHtml(
                        collection.id
                    )}"
                  aria-label="Actions for ${escapeHtml(
                        collection.name
                    )}"
                  aria-haspopup="menu">

                  ${icon.more}
                </button>
              </div>
            `;
            })
            .join('');

    sidebar.innerHTML = `
        <nav
          class="notes-sidebar"
          aria-label="Notes navigation">

          <div>
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav">
              ${item(
                    'all',
                    'All notes',
                    icon.note
                )}

              ${item(
                    'favorites',
                    'Favourites',
                    icon.star
                )}

              ${item(
                    'archived',
                    'Archived',
                    icon.archive
                )}
            </div>
          </div>

          <div>
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Collections</span>

              <button
                class="side-add-button"
                type="button"
                id="notesAddCollection"
                aria-label="Create collection"
                title="Create collection">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${collectionRows}
            </div>
          </div>

          <div class="notes-sidebar-tip">
            <div class="tip-card">
              <div class="tip-title">
                ${icon.tip}
                <span>Tip of the day</span>
              </div>

              <p>
                Link notes to people, places,
                sources and files to keep your
                research connected.
              </p>

              <button
                class="link tip-link"
                type="button"
                data-notes-tip>
                <span class="tip-link-text">
                  Learn more
                </span>
                <span
                  class="tip-link-icon"
                  aria-hidden="true">
                  ${icon.openlink}
                </span>
              </button>
            </div>
          </div>
        </nav>
      `;

    bindNotesSidebarControls(
        sidebar
    );
}

function renderNotesContextFilterBar()
{
    const context =
        activeNotesContext();

    if (!context)
    {
        return '';
    }

    const copy =
        `${context.label}: ${context.name}`;

    return `
        <div
          class="resource-person-filterbar"
          aria-label="Active Notes filter">

          <span
            class="
              filter-chip
              active-filter-chip
            ">

            <span
              class="
                active-filter-chip-copy
              ">
              <strong>
                ${escapeHtml(
                    context.label
                )}:
              </strong>

              ${escapeHtml(
                    context.name
                )}
            </span>

            <button
              class="
                active-filter-chip-remove
              "
              type="button"
              data-clear-notes-context-filter
              aria-label="${escapeHtml(
                    `Remove ${copy} filter`
                )}"
              title="Remove filter">

              ${icon.close}
            </button>
          </span>
        </div>
      `;
}

function renderNotesBrowserPane(
    list
)
{
    const browserSubtitle =
        notesBrowserSubtitle();
    const filterCount =
        notesFilterCount();

    return `
        <section
          class="notes-browser-pane"
          aria-label="Notes browser">

          <header class="notes-browser-header">
            <div class="notes-browser-top">
              <div class="notes-browser-title">
                <h1 class="app-page-title">
                  ${escapeHtml(
                        notesTitle()
                    )}
                </h1>

                <p class="notes-browser-subtitle">
                  ${escapeHtml(
                        browserSubtitle
                    )}
                </p>
              </div>

              <div class="notes-browser-actions">
                <button
                  class="button primary"
                  type="button"
                  id="notesNewNoteButton">
                  ${icon.plus}
                  Add note
                </button>
              </div>

            ${renderNotesContextFilterBar()}

            <div class="notes-toolbar-line">
              <div class="notes-toolbar-search">
                <label
                  class="app-search-field"
                  aria-label="Search notes">

                  ${icon.search}

                  <input
                    id="notesSearch"
                    type="search"
                    placeholder="Search notes..."
                    value="${escapeHtml(
                        state.notesSearch
                    )}">
                </label>
              </div>

              <div class="notes-toolbar-actions">
              <button
                class="
                  module-filter-button
                  notes-filter-button
                  ${
                        filterCount
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                id="notesFilterButton"
                aria-haspopup="menu"
                aria-expanded="false"
                aria-label="${
                    filterCount
                        ? `Filter notes, ${filterCount} active`
                        : 'Filter notes'
                }"
                title="Filter notes">

                <span
                  class="module-filter-icon"
                  aria-hidden="true">

                  ${
                        filterCount
                            ? icon.filterclear
                            : icon.filter
                    }
                </span>

                <span class="notes-control-label">
                  Filter
                </span>

                ${
                    filterCount
                        ? `
                      <span class="module-filter-count">
                        ${filterCount}
                      </span>
                    `
                        : ''
                }
              </button>
              ${renderAppSortControl({
                    id: 'notesSort',
                    field: state.notesSort,
                    direction: state.notesSortDirection,
                    ariaLabel: 'Sort notes',
                    options: APP_SORT_OPTIONS.notes
                })}
              </div>
            </div>

            ${renderNotesActiveFilters()}
          </header>

          <div class="notes-browser-scroll">
            ${
                list.length
                    ? renderNotesListView(
                        list
                    )
                    : renderNotesBrowserEmpty()
            }
          </div>
        </section>
      `;
}

function notesBrowserSubtitle()
{
    return 'Capture, organize and connect research notes across your family history.';
}

function formatNoteCollectionSummary(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    if (!collections.length)
    {
        return 'No collections';
    }

    const visibleNames =
        collections
            .slice(0, 2)
            .map(
                collection =>
                    collection.name
            );

    const hiddenCount =
        collections.length
        - visibleNames.length;

    return [
        visibleNames.join(' · '),

        hiddenCount > 0
            ? `+${hiddenCount}`
            : ''
    ]
        .filter(Boolean)
        .join(' · ');
}

function formatNoteRelativeUpdatedAt(
    note
)
{
    const timestamp =
        Date.parse(
            note?.updatedAt || ''
        );

    if (
        !Number.isFinite(
            timestamp
        )
    )
    {
        return 'Updated date unknown';
    }

    const date =
        new Date(timestamp);

    const now =
        new Date();

    const noteDay =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const today =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const dayDifference =
        Math.round(
            (
                today.getTime()
            - noteDay.getTime()
            )
          / 86400000
        );

    if (dayDifference === 0)
    {
        return 'Updated today';
    }

    if (dayDifference === 1)
    {
        return 'Updated yesterday';
    }

    return `Updated ${
        formatNoteUpdatedAt(
            note
        )
    }`;
}

function noteEntityCountItems(
    note
)
{
    return Object.entries(
        NOTE_ENTITY_TYPES
    )
        .map(([
            type,
            config
        ]) => ({
            type,
            config,

            count:
            new Set(
                noteEntityLinkedIds(
                    note,
                    type
                )
            ).size
        }))
        .filter(
            item =>
                item.count > 0
        );
}

function noteBrowserEntitySummary(
    note
)
{
    const entityItems =
        noteEntityCountItems(
            note
        );

    const relatedCount =
        new Set(
            note?.relatedNoteIds
          || []
        ).size;

    const items = [
        ...entityItems.map(item => ({
            count:
            item.count,

            label:
            item.count === 1
                ? item.config.singular
                : item.config.plural
        })),

        ...(relatedCount
            ? [{
                count:
                relatedCount,

                label:
                relatedCount === 1
                    ? 'note'
                    : 'notes'
            }]
            : [])
    ];

    if (!items.length)
    {
        return '';
    }

    if (items.length <= 2)
    {
        return items
            .map(item =>
                `${item.count} ${
                    item.label
                }`
            )
            .join(' · ');
    }

    const total =
        items.reduce(
            (
                sum,
                item
            ) =>
                sum + item.count,
            0
        );

    return `${total} linked records`;
}

function renderNoteBrowserCollectionChips(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-board-collections
            ">

            <span
              class="
                geneo-board-collection-chip
                no-collection
              "
              title="No collection assigned">

              No collection
            </span>
          </div>
        `;
    }

    const visible =
        collections.slice(0, 2);

    const hiddenCount =
        collections.length
        - visible.length;

    return [
        ...visible.map(collection => `
          <span
            class="notes-row-collection-chip"
            title="${escapeHtml(
                collection.name
            )}">
            ${escapeHtml(
                collection.name
            )}
          </span>
        `),

        hiddenCount > 0
            ? `
            <span
              class="notes-row-collection-chip"
              title="${escapeHtml(
                    collections
                        .slice(2)
                        .map(collection =>
                            collection.name
                        )
                        .join(', ')
                )}">
              +${hiddenCount}
            </span>
          `
            : ''
    ]
        .filter(Boolean)
        .join('');
}

function noteBrowserMetadata(
    note
)
{
    return [
        noteBrowserEntitySummary(
            note
        ),

        formatNoteRelativeUpdatedAt(
            note
        )
    ]
        .filter(Boolean)
        .join(' · ');
}

function notesFilterCount()
{
    return Object
        .values(
            state.notesFilters
          || {}
        )
        .filter(
            value =>
                value
            && value !== 'any'
        )
        .length;
}

function notesActiveFilterDescriptors()
{
    const filters =
        state.notesFilters || {};

    const labels = {
        linkedRecords: {
            with:
            'Has linked records',

            without:
            'No linked records'
        },

        relatedNotes: {
            with:
            'Has related notes',

            without:
            'No related notes'
        },

        collections: {
            with:
            'In a collection',

            without:
            'No collection'
        }
    };

    return Object
        .entries(filters)
        .filter(([
            ,
            value
        ]) =>
            value
          && value !== 'any'
        )
        .map(([
            key,
            value
        ]) => ({
            key,
            label:
            labels[key]?.[value]
            || value
        }));
}

function renderNotesActiveFilters()
{
    const filters =
        notesActiveFilterDescriptors();

    if (!filters.length)
    {
        return '';
    }

    return `
        <div
          class="notes-active-filters"
          aria-label="Active note filters">

          ${filters
                .map(filter => `
              <button
                class="notes-active-filter-chip"
                type="button"
                data-clear-notes-filter="${escapeHtml(
                    filter.key
                )}"
                aria-label="Remove ${escapeHtml(
                    filter.label
                )} filter">
                ${escapeHtml(
                    filter.label
                )}
                ${icon.close}
              </button>
            `)
                .join('')}
        </div>
      `;
}

function openNotesFilterMenu(
    anchor
)
{
    closeMenu();

    const rect =
        anchor.getBoundingClientRect();

    const filters = {
        linkedRecords:
          state.notesFilters
              ?.linkedRecords
          || 'any',

        relatedNotes:
          state.notesFilters
              ?.relatedNotes
          || 'any',

        collections:
          state.notesFilters
              ?.collections
          || 'any'
    };

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'notes-filter-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    window.innerWidth
              - 342,
                    rect.right - 330
                )
            )
        }px`;

    menu.innerHTML = `
        <div class="notes-filter-popover-head">
          <strong>Filter notes</strong>
          <span>
            Narrow the current Notes view.
          </span>
        </div>

        <div class="notes-filter-popover-body">
          <label class="notes-filter-field">
            Linked records
            <select
              data-notes-filter-input="linkedRecords">
              <option
                value="any"
                ${
                    filters.linkedRecords
                    === 'any'
                        ? 'selected'
                        : ''
                }>
                Any
              </option>
              <option
                value="with"
                ${
                    filters.linkedRecords
                    === 'with'
                        ? 'selected'
                        : ''
                }>
                Has linked records
              </option>
              <option
                value="without"
                ${
                    filters.linkedRecords
                    === 'without'
                        ? 'selected'
                        : ''
                }>
                No linked records
              </option>
            </select>
          </label>

          <label class="notes-filter-field">
            Related notes
            <select
              data-notes-filter-input="relatedNotes">
              <option
                value="any"
                ${
                    filters.relatedNotes
                    === 'any'
                        ? 'selected'
                        : ''
                }>
                Any
              </option>
              <option
                value="with"
                ${
                    filters.relatedNotes
                    === 'with'
                        ? 'selected'
                        : ''
                }>
                Has related notes
              </option>
              <option
                value="without"
                ${
                    filters.relatedNotes
                    === 'without'
                        ? 'selected'
                        : ''
                }>
                No related notes
              </option>
            </select>
          </label>

          <label class="notes-filter-field">
            Collections
            <select
              data-notes-filter-input="collections">
              <option
                value="any"
                ${
                    filters.collections
                    === 'any'
                        ? 'selected'
                        : ''
                }>
                Any
              </option>
              <option
                value="with"
                ${
                    filters.collections
                    === 'with'
                        ? 'selected'
                        : ''
                }>
                In a collection
              </option>
              <option
                value="without"
                ${
                    filters.collections
                    === 'without'
                        ? 'selected'
                        : ''
                }>
                No collection
              </option>
            </select>
          </label>
        </div>

        <div class="notes-filter-popover-footer">
          <button
            class="button secondary"
            type="button"
            data-notes-filter-reset>
            Reset
          </button>

          <button
            class="button primary"
            type="button"
            data-notes-filter-apply>
            Apply filters
          </button>
        </div>
      `;

    document.body.appendChild(
        menu
    );

    const menuRect =
        menu.getBoundingClientRect();

    menu.style.top =
        `${
            Math.max(
                12,
                Math.min(
                    rect.bottom + 6,
                    window.innerHeight
              - menuRect.height
              - 12
                )
            )
        }px`;

    menu
        .querySelector(
            '[data-notes-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesFilters = {
                    linkedRecords:
                'any',

                    relatedNotes:
                'any',

                    collections:
                'any'
                };

                closeMenu();
                renderNotes();
            }
        );

    menu
        .querySelector(
            '[data-notes-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesFilters = {
                    linkedRecords:
                menu
                    .querySelector(
                        '[data-notes-filter-input="linkedRecords"]'
                    )
                    ?.value
                || 'any',

                    relatedNotes:
                menu
                    .querySelector(
                        '[data-notes-filter-input="relatedNotes"]'
                    )
                    ?.value
                || 'any',

                    collections:
                menu
                    .querySelector(
                        '[data-notes-filter-input="collections"]'
                    )
                    ?.value
                || 'any'
                };

                closeMenu();
                renderNotes();
            }
        );

    bindMenuLifecycle(
        anchor
    );
}

function formatConnectedNoteMetadata(
    note
)
{
    return [
        formatNoteCollectionSummary(
            note
        ),

        formatNoteRelativeUpdatedAt(
            note
        )
    ]
        .filter(Boolean)
        .join(' · ');
}

function renderConnectedNoteList({
    notes = [],

    contextType = '',

    contextId = '',

    limit = CONNECTED_NOTES_PREVIEW_LIMIT,

    emptyText =
        'No connected notes.',

    allowUnlink =
        true
})
{
    const visible = notes.slice(
        0,
        Math.min(limit, CONNECTED_NOTES_PREVIEW_LIMIT)
    );

    if (!visible.length)
    {
        return `
          <div class="connected-note-empty">
            ${escapeHtml(
                emptyText
            )}
          </div>
        `;
    }

    const contextConfig =
        getNoteEntityConfig(
            contextType
        );

    const unlinkSupported =
        Boolean(
            allowUnlink
          && contextId
          && contextConfig
        );

    const contextNoun =
        contextConfig?.singular
        || String(
            contextConfig
                ?.contextLabel
          || 'item'
        ).toLowerCase();

    return `
        <div class="connected-note-list">

          ${visible
                .map(note =>
                {
                    const noteTitle =
                        note.title
                || 'Untitled note';

                    const metadata =
                        formatConnectedNoteMetadata(
                            note
                        );

                    return `
                <div
                  class="
                    connected-note-item
                    ${
                        unlinkSupported
                            ? 'can-unlink'
                            : ''
                    }
                  ">

                  <button
                    class="connected-note-card"
                    type="button"
                    data-connected-note-id="${escapeHtml(
                        note.id
                    )}"
                    data-connected-note-context-type="${escapeHtml(
                        contextType
                    )}"
                    data-connected-note-context-id="${escapeHtml(
                        contextId
                    )}"
                    aria-label="Open ${escapeHtml(
                        noteTitle
                    )}">

                    <strong
                      class="
                        connected-note-title
                      "
                      title="${escapeHtml(
                            noteTitle
                        )}">

                      ${escapeHtml(
                            noteTitle
                        )}
                    </strong>

                    <span
                      class="
                        connected-note-excerpt
                      ">

                      ${escapeHtml(
                            noteExcerpt(
                                note,
                                120
                            )
                        || 'No note content'
                        )}
                    </span>

                    <span
                      class="
                        connected-note-meta
                      "
                      title="${escapeHtml(
                            metadata
                        )}">

                      ${escapeHtml(
                            metadata
                        )}
                    </span>
                  </button>

                  ${
                        unlinkSupported
                            ? `
                        <button
                          class="
                            connected-note-unlink
                          "
                          type="button"
                          data-connected-note-unlink="${escapeHtml(
                                note.id
                            )}"
                          data-connected-note-context-type="${escapeHtml(
                                contextType
                            )}"
                          data-connected-note-context-id="${escapeHtml(
                                contextId
                            )}"
                          aria-label="Unlink ${escapeHtml(
                                noteTitle
                            )} from this ${escapeHtml(
                                contextNoun
                            )}"
                          title="Unlink note">

                          ${icon.unlink}
                        </button>
                      `
                            : ''
                    }
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function connectedNoteContextRecord(
    contextType,
    contextId,
    projectId
)
{
    return noteEntityById(
        contextType,
        contextId,
        projectId
    );
}

function connectedNoteContextName(
    contextType,
    record
)
{
    return (
        noteEntityLabel(
            contextType,
            record
        )
        || 'this item'
    );
}

function connectedNoteContextNoun(
    contextType
)
{
    const config =
        getNoteEntityConfig(
            contextType
        );

    return (
        config?.singular
        || String(
            config?.contextLabel
          || 'item'
        ).toLowerCase()
    );
}

function unlinkConnectedNote({
    noteId,
    contextType,
    contextId
})
{
    const note =
        getNote(
            noteId,
            {
                projectId:
              currentProjectId(),

                includeArchived:
              true
            }
        );

    const config =
        getNoteEntityConfig(
            contextType
        );

    if (
        !note
        || !config
        || !contextId
    )
    {
        return false;
    }

    const currentIds =
        Array.isArray(
            note[
                config.field
            ]
        )
            ? note[
                config.field
            ]
            : [];

    if (
        !currentIds.includes(
            contextId
        )
    )
    {
        return false;
    }

    const updatedNote =
        setNoteEntityLinks(
            note.id,
            contextType,
            currentIds.filter(
                id =>
                    id !== contextId
            ),
            {
                projectId:
              note.projectId
            }
        );

    return Boolean(
        updatedNote
    );
}

function openConnectedNoteUnlinkConfirm({
    noteId,
    contextType,
    contextId,
    onUnlinked =
        null
})
{
    const contextConfig =
        getNoteEntityConfig(
            contextType
        );

    if (
        !contextConfig
        || !contextId
    )
    {
        return;
    }
    const note =
        getNote(
            noteId,
            {
                projectId:
              currentProjectId(),

                includeArchived:
              true
            }
        );

    if (!note)
    {
        showToast(
            'Note not found.'
        );

        return;
    }

    const config =
        getNoteEntityConfig(
            contextType
        );

    const linkedIds =
        config
            ? note[
                config.field
            ] || []
            : [];

    if (
        !config
        || !linkedIds.includes(
            contextId
        )
    )
    {
        showToast(
            'This note is no longer linked.'
        );

        return;
    }

    const contextRecord =
        connectedNoteContextRecord(
            contextType,
            contextId,
            note.projectId
        );

    if (!contextRecord)
    {
        showToast(
            'Linked record not found.'
        );

        return;
    }

    const noteTitle =
        note.title
        || 'Untitled note';

    const contextName =
        connectedNoteContextName(
            contextType,
            contextRecord
        );

    const contextNoun =
        connectedNoteContextNoun(
            contextType
        );

    openModal(`
        <div
          class="
            modal
            connected-note-unlink-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedNoteUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="connectedNoteUnlinkTitle">
                Unlink note from ${escapeHtml(
                    contextNoun
                )}?
              </h2>

              <p>
                ${escapeHtml(
                    noteTitle
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close unlink confirmation">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              unlink-relationship-body
            ">

            <div
              class="
                unlink-relationship-warning
                connected-note-unlink-warning
              ">

              <strong>
                The note will not be deleted.
              </strong>

              <span>
                Only the connection between
                “${escapeHtml(
                    noteTitle
                )}” and
                “${escapeHtml(
                    contextName
                )}” will be removed.
                The note will remain available in
                Notes and keep all its other links.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-connected-note-unlink>
              Unlink note
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-connected-note-unlink]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const unlinked =
                    unlinkConnectedNote({
                        noteId:
                  note.id,

                        contextType,

                        contextId
                    });

                /*
              Close first so the modal can return
              focus before the sidebar is rerendered.
              The module callback then establishes
              the final stable focus target.
            */
                closeModal();

                if (!unlinked)
                {
                    showToast(
                        'The note could not be unlinked.'
                    );

                    return;
                }

                onUnlinked?.({
                    noteId:
                note.id,

                    contextType,

                    contextId
                });

                showToast(
                    `Note unlinked from ${contextNoun}.`
                );
            }
        );
}

function bindConnectedNoteLinks(
    root,
    {
        onUnlinked =
            null
    } = {}
)
{
    root
        .querySelectorAll(
            '[data-connected-note-id]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openCentralNoteFromContext(
                        button.dataset
                            .connectedNoteId,

                        {
                            type:
                    button.dataset
                        .connectedNoteContextType
                    || '',

                            id:
                    button.dataset
                        .connectedNoteContextId
                    || ''
                        }
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-connected-note-unlink]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openConnectedNoteUnlinkConfirm({
                        noteId:
                  button.dataset
                      .connectedNoteUnlink,

                        contextType:
                  button.dataset
                      .connectedNoteContextType
                  || '',

                        contextId:
                  button.dataset
                      .connectedNoteContextId
                  || '',

                        onUnlinked:
                  payload =>
                  {
                      if (
                          typeof onUnlinked
                      === 'function'
                      )
                      {
                          onUnlinked(
                              payload
                          );

                          return;
                      }

                      /*
                      Shared fallback for modules that use
                      connected Note rows but do not yet have
                      a viewport-preserving local renderer.
                    */
                      render();
                  }
                    });
                }
            );
        });
}

function renderNotesListView(
    list
)
{
    return `
        <div
          class="notes-list"
          role="list">

          ${list
                .map(
                    renderNoteListRow
                )
                .join('')}
        </div>
      `;
}

function renderNoteListRow(
    note
)
{
    const selected =
        note.id
          === state.selectedNoteId;

    const metadata =
        noteBrowserMetadata(
            note
        );

    return `
        <article
          class="notes-row ${
                selected ? 'active' : ''
            }"
          role="listitem"
          data-note-id="${escapeHtml(
                note.id
            )}">

          <button
            class="notes-row-favorite ${
                note.favorite ? 'active' : ''
            }"
            type="button"
            data-note-favorite="${escapeHtml(
                note.id
            )}"
            aria-pressed="${note.favorite}"
            aria-label="${escapeHtml(
                note.favorite
                    ? `Remove ${note.title} from favourites`
                    : `Add ${note.title} to favourites`
            )}"
            title="${
                note.favorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'
            }">
            ${icon.star}
          </button>

          <button
            class="notes-row-open"
            type="button"
            data-note-row="${escapeHtml(
                note.id
            )}"
            ${
                selected
                    ? 'aria-current="true"'
                    : ''
            }>
            <span
              class="notes-row-title"
              title="${escapeHtml(
                    note.title
                )}">
              ${escapeHtml(
                    note.title
                )}
            </span>

            <span class="notes-row-excerpt">
              ${escapeHtml(
                    noteExcerpt(
                        note,
                        180
                    )
                || 'No note content'
                )}
            </span>

            <span class="notes-row-footer">
              <span class="notes-row-collections">
                ${renderNoteBrowserCollectionChips(
                    note
                )}
              </span>

              <span
                class="notes-row-metadata"
                title="${escapeHtml(
                    metadata
                )}">
                ${escapeHtml(
                    metadata
                )}
              </span>
            </span>
          </button>

          <button
            class="notes-row-menu"
            type="button"
            aria-haspopup="menu"
            data-note-menu="${escapeHtml(
                note.id
            )}"
            aria-label="${escapeHtml(
                `More actions for ${note.title}`
            )}">
            ${icon.more}
          </button>
        </article>
      `;
}

function renderNotesBrowserEmpty()
{
    if (
        state.notesSearch.trim()
    )
    {
        return `
          <div class="notes-empty">
            <div class="notes-empty-card">
              <h2>No results</h2>

              <p>
                Try a different search
                term or clear the search.
              </p>

              <button
                class="button secondary"
                type="button"
                id="notesClearSearch">
                Clear search
              </button>
            </div>
          </div>
        `;
    }

    const copy =
        state.notesView === 'archived'
            ? [
                'No archived notes',
                'Archived notes will appear here.'
            ]
            : [
                'No notes here',
                'Create a note to start collecting research thoughts.'
            ];

    return `
        <div class="notes-empty">
          <div class="notes-empty-card">
            <h2>${copy[0]}</h2>
            <p>${copy[1]}</p>
          </div>
        </div>
      `;
}

function renderNotesRightPanel(
    note
)
{
    if (!note)
    {
        return '';
    }

    if (
        state.notesRightCollapsed
    )
    {
        return `
          <aside
            class="notes-right-rail"
            aria-label="Collapsed note editor">
            <button
              class="notes-editor-restore"
              type="button"
              id="notesToggleRight"
              aria-expanded="false"
              aria-controls="notesRightPane"
              aria-label="Show note editor"
              title="Show note editor">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    return `
        <div
          class="notes-resizer"
          id="notesResizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize notes browser"
          aria-valuemin="360"
          aria-valuemax="600"
          aria-valuenow="${Math.round(
                state.notesBrowserWidth
            || 440
            )}"
          tabindex="0">
        </div>

        <aside
          class="notes-right-pane"
          id="notesRightPane"
          aria-label="Note editor">
          ${renderNoteEditorContent(
                note
            )}
        </aside>
      `;
}


function noteEditorSectionIsOpen(
    id
)
{
    return (
        state.notesEditorSections?.[
            id
        ] !== false
    );
}

function renderNoteEditorSection({
    id,
    title,
    meta = '',
    action = '',
    body
})
{
    return `
        <div
          class="notes-panel-section"
          data-note-editor-section="${escapeHtml(
                id
            )}">
          ${renderInspectorSection(
                id,
                title,
                meta,
                body,
                action,
                {
                    open:
                noteEditorSectionIsOpen(
                    id
                ),

                    toggleAttribute:
                'data-note-editor-section-toggle',

                    sectionId:
                `noteEditorSection-${
                    id
                }`,

                    inlineAction:
                Boolean(action),

                    alwaysShowAction:
                Boolean(action)
                }
            )}
        </div>
      `;
}

function renderNoteSummaryChips(
    note
)
{
    const NOTE_SUMMARY_CHIP_ORDER =
        Object.freeze([
            'people',
            'events',
            'photos',
            'files',
            'related',
            'places',
            'sources'
        ]);
    const items =
        noteEntityCountItems(
            note
        )
            .map(item => ({
                sectionKey:
              item.config.sectionKey,

                tone:
              item.config.chipTone,

                count:
              item.count,

                label:
              item.count === 1
                  ? item.config.singular
                  : item.config.plural
            }));

    const relatedCount =
        new Set(
            note.relatedNoteIds || []
        ).size;

    if (relatedCount)
    {
        items.push({
            sectionKey:
            'related',

            tone:
            'notes',

            count:
            relatedCount,

            label:
            relatedCount === 1
                ? 'note'
                : 'notes'
        });
    }

    items.sort(
        (
            first,
            second
        ) =>
        {
            const firstIndex =
                NOTE_SUMMARY_CHIP_ORDER
                    .indexOf(
                        first.sectionKey
                    );

            const secondIndex =
                NOTE_SUMMARY_CHIP_ORDER
                    .indexOf(
                        second.sectionKey
                    );

            return (
                (
                    firstIndex === -1
                        ? NOTE_SUMMARY_CHIP_ORDER
                            .length
                        : firstIndex
                )
            -
            (
                secondIndex === -1
                    ? NOTE_SUMMARY_CHIP_ORDER
                        .length
                    : secondIndex
            )
            );
        }
    );

    if (!items.length)
    {
        return '';
    }

    return `
        <div
          class="notes-summary-chips app-chip-row"
          aria-label="Note connections">
          ${items
                .map(item => `
              <button
                class="
                  app-chip
                  app-chip--${escapeHtml(
                        item.tone
                    )}
                "
                type="button"
                data-note-summary-section="${escapeHtml(
                    item.sectionKey
                )}"
                aria-label="Show ${item.count} ${escapeHtml(
                    item.label
                )}">
                ${item.count}
                ${escapeHtml(
                    item.label
                )}
              </button>
            `)
                .join('')}
        </div>
      `;
}

function noteBodyWordCount(
    note
)
{
    const body =
        String(
            note?.body || ''
        )
            .trim();

    return body
        ? body
            .split(/\s+/)
            .length
        : 0;
}

function formatNoteInfoDate(
    value
)
{
    const timestamp =
        Date.parse(
            value || ''
        );

    if (
        !Number.isFinite(
            timestamp
        )
    )
    {
        return 'Unknown';
    }

    return new Intl
        .DateTimeFormat(
            undefined,
            {
                dateStyle:
              'medium',

                timeStyle:
              'short'
            }
        )
        .format(
            new Date(
                timestamp
            )
        );
}

function renderNoteEditorContent(
    note
)
{
    /*
        Do not derive visual order from the property
        order of NOTE_ENTITY_TYPES. The data registry
        and the editor layout serve different purposes.
      */
    const primaryLinkedSections =
        [
            'person',
            'event',
            'photo',
            'archiveFile'
        ]
            .map(type =>
                renderNoteLinkedEntitySection(
                    note,
                    type
                )
            )
            .join('');

    const secondaryLinkedSections =
        [
            'place',
            'source'
        ]
            .map(type =>
                renderNoteLinkedEntitySection(
                    note,
                    type
                )
            )
            .join('');

    return `
        <article class="notes-editor-card">
          <header class="notes-editor-header">
            <div class="notes-editor-topline">
              <div class="notes-editor-navigation">
                <button
                  class="notes-editor-back"
                  type="button"
                  id="notesBackToBrowser"
                  aria-label="Back to notes"
                  title="Back to notes">
                  ${icon.arrow}
                </button>

                <button
                  class="notes-editor-collapse"
                  type="button"
                  id="notesToggleRight"
                  aria-expanded="true"
                  aria-controls="notesRightPane"
                  aria-label="Collapse note editor"
                  title="Collapse note editor">
                  ${icon.doublechevronSidebar}
                </button>
              </div>

              <div class="notes-editor-actions">
                <span
                  class="notes-save-status ${
                        state.notesSaveStatus
                            .toLowerCase()
                    }"
                  id="notesSaveStatus"
                  role="status"
                  aria-live="polite">
                  ${escapeHtml(
                        state.notesSaveStatus
                    )}
                </span>

                <button
                  class="notes-icon-button ${
                        note.favorite
                            ? 'active'
                            : ''
                    }"
                  type="button"
                  id="notesFavoriteButton"
                  aria-pressed="${note.favorite}"
                  aria-label="${
                        note.favorite
                            ? 'Remove from favourites'
                            : 'Add to favourites'
                    }"
                  title="${
                        note.favorite
                            ? 'Remove from favourites'
                            : 'Add to favourites'
                    }">
                  ${icon.star}
                </button>

                <button
                  class="notes-icon-button"
                  type="button"
                  id="notesEditorMenuButton"
                  aria-haspopup="menu"
                  aria-label="More note actions"
                  title="More note actions">
                  ${icon.more}
                </button>
              </div>
            </div>

            <input
              class="notes-title-input"
              id="notesTitleInput"
              data-source-value="${escapeHtml(note.title)}"
              value="${escapeHtml(
                    localizedDataFieldValue(note.title)
                )}"
              placeholder="Untitled note"
              aria-label="Note title">

            ${renderNoteSummaryChips(
                note
            )}
          </header>

          <div class="notes-editor-body">
            <div class="notes-editor-writing">
              <div class="notes-rich-editor-shell">
                <span
                  class="notes-rich-editor-label"
                  id="notesBodyLabel">
                  Note body
                </span>

                ${renderRichTextToolbar({
                    id:
                    'notesRichTextToolbar',

                    ariaLabel:
                    'Note formatting'
                })}

                <div
                  id="notesRichTextEditor"
                  aria-labelledby="notesBodyLabel">
                </div>

                <textarea
                  class="notes-body-input"
                  id="notesBodyInput"
                  data-source-value="${escapeHtml(note.body)}"
                  aria-label="Note body"
                  placeholder="Start writing…"
                  hidden>${escapeHtml(
                        localizedDataFieldValue(note.body)
                    )}</textarea>
              </div>
            </div>

            <div class="notes-editor-sections">
              ${renderNoteCollectionsSection(
                    note
                )}

              ${renderNoteChecklistSection(
                    note
                )}

              ${primaryLinkedSections}

              ${renderNoteRelatedSection(
                    note
                )}

              ${secondaryLinkedSections}

              ${renderNoteInfoSection(
                    note
                )}
            </div>
          </div>
        </article>
      `;
}

function renderNoteCollectionsSection(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    const rows =
        collections.length
            ? `
            <div class="notes-collection-assignment-list">
              ${collections
                    .map(collection => `
                  <div class="notes-collection-assignment">
                    ${icon.folder}

                    <span
                      class="notes-collection-assignment-name"
                      title="${escapeHtml(
                            collection.name
                        )}">
                      ${escapeHtml(
                            collection.name
                        )}
                    </span>

                    <button
                      class="notes-collection-remove"
                      type="button"
                      data-note-remove-collection="${escapeHtml(
                            collection.id
                        )}"
                      aria-label="Remove ${escapeHtml(
                            collection.name
                        )} from this note"
                      title="Remove from this note">
                      ${icon.close}
                    </button>
                  </div>
                `)
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              This note is not in a collection.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'collections',

        title:
          'Collections',

        meta:
          `${collections.length} ${
              collections.length === 1
                  ? 'collection'
                  : 'collections'
          }`,

        action: `
          <button
            class="link"
            type="button"
            id="notesManageCollections">
            ${renderPanelButtonLabel(
                icon.plus,
                'Add to collection'
            )}
          </button>
        `,

        body:
          rows
    });
}


function renderNoteChecklistSection(
    note
)
{
    const items =
        note.checklist || [];

    const completed =
        items.filter(
            item => item.done
        ).length;

    const rows =
        items.length
            ? `
            <div class="notes-checklist-list">
              ${items
                    .map(item => `
                  <div
                    class="notes-checklist-row ${
                        item.done
                            ? 'done'
                            : ''
                    }">
                    <input
                      type="checkbox"
                      data-note-checklist-toggle="${escapeHtml(
                            item.id
                        )}"
                      aria-label="Complete ${escapeHtml(
                            item.text
                        )}"
                      ${
                            item.done
                                ? 'checked'
                                : ''
                        }>

                    <input
                      class="notes-checklist-text"
                      type="text"
                      maxlength="240"
                      data-note-checklist-text="${escapeHtml(
                            item.id
                        )}"
                      data-source-value="${escapeHtml(item.text)}"
                      value="${escapeHtml(
                            localizedDataFieldValue(item.text)
                        )}"
                      aria-label="Checklist item">

                    <button
                      class="notes-checklist-delete"
                      type="button"
                      data-note-checklist-delete="${escapeHtml(
                            item.id
                        )}"
                      aria-label="Delete checklist item"
                      title="Delete checklist item">
                      ${icon.trash}
                    </button>
                  </div>
                `)
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              No checklist items.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'checklist',

        title:
          'Checklist',

        meta:
          items.length
              ? `${completed} of ${
                  items.length
              } complete`
              : 'No items',

        action: `
          <button
            class="link"
            type="button"
            id="notesAddChecklistItem">
            ${renderPanelButtonLabel(
                icon.plus,
                'Add item'
            )}
          </button>
        `,

        body:
          rows
    });
}

function eventRelationItemModel(
    event
)
{
    if (!event)
    {
        return null;
    }

    const owner =
        placeInspectorEventOwnerIds(
            event
        )
            .map(personId =>
                getPerson(
                    personId
                )
            )
            .find(person =>
                person
            && !person.deleted
            && (
                !event.projectId
              || person.projectId
                === event.projectId
            )
            );

    /*
        Events without a valid owner cannot use
        the Notes event-row presentation.
      */
    if (!owner)
    {
        return null;
    }

    const ownerName =
        personResourceDisplayName(
            owner
        )
        || owner.names?.display
        || 'Unnamed person';

    const presentation =
        placeInspectorEventPresentation(
            event,
            owner.id
        );

    const eventTitle =
        presentation.title
        || placeInspectorEventLabel(
            event
        )
        || 'Event';

    const eventDate =
        presentation.date
        || 'Date unknown';

    const eventPlace =
        timelinePlaceLabel(
            event
        );

    const datePlaceLabel =
        [
            eventDate,
            eventPlace
        ]
            .filter(Boolean)
            .join(' · ');

    const relatedPeople =
        placeInspectorEventRelatedPeople(
            event,
            owner.id
        );

    let relationshipLabel =
        '';

    if (
        event.type
          === 'childBirth'
    )
    {
        relationshipLabel =
            presentation.relationship
          || '';
    }
    else if (
        relatedPeople.length === 1
    )
    {
        relationshipLabel =
            `With ${
                personResourceDisplayName(
                    relatedPeople[0]
                )
            || relatedPeople[0]
                .names?.display
            || 'another person'
            }`;
    }
    else if (
        relatedPeople.length > 1
    )
    {
        const firstName =
            personResourceDisplayName(
                relatedPeople[0]
            )
          || relatedPeople[0]
              .names?.display
          || 'another person';

        relationshipLabel =
            `With ${firstName} + ${
                relatedPeople.length - 1
            } ${
                relatedPeople.length === 2
                    ? 'person'
                    : 'people'
            }`;
    }
    else
    {
        relationshipLabel =
            presentation.relationship
          || '';
    }

    return {
        owner,
        ownerName,
        eventTitle,
        datePlaceLabel,
        relationshipLabel
    };
}

function renderEventRelationItem({
    event,
    openAttributes =
        '',
    removeAttributes =
        '',
    removeContextLabel =
        'item',
    readOnly =
        false
} = {})
{
    const model =
        eventRelationItemModel(
            event
        );

    if (!model)
    {
        return '';
    }

    const {
        owner,
        ownerName,
        eventTitle,
        datePlaceLabel,
        relationshipLabel
    } = model;

    const content = `
        <span
          class="
            notes-event-avatar
          "
          aria-hidden="true">

          ${renderPersonAvatar(
                owner,
                'small-avatar notes-event-owner-avatar',
                {
                    element:
                'span',

                    attrs:
                'aria-hidden="true"'
                }
            )}

          <span
            class="
              notes-event-avatar-badge
            ">

            ${timelineEventIcon(
                event
            )}
          </span>
        </span>

        <span
          class="
            notes-event-copy
          ">

          <span
            class="
              notes-event-owner
            ">

            ${escapeHtml(
                ownerName
            )}
          </span>

          <strong
            class="
              notes-event-title
            ">

            ${escapeHtml(
                eventTitle
            )}
          </strong>

          <span
            class="
              notes-event-date-place
            ">

            ${escapeHtml(
                datePlaceLabel
            )}
          </span>

          ${
                relationshipLabel
                    ? `
                <span
                  class="
                    notes-event-relationship
                  ">

                  ${escapeHtml(
                        relationshipLabel
                    )}
                </span>
              `
                    : ''
            }
        </span>
      `;

    return `
        <div
          class="
            relation-row
            notes-event-item
          ">

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                    notes-event-main
                  ">

                  ${content}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                    notes-event-main
                  "
                  type="button"
                  ${openAttributes}
                  aria-label="Open ${escapeHtml(
                        eventTitle
                    )} for ${escapeHtml(
                        ownerName
                    )}">

                  ${content}
                </button>
              `
            }

          ${
                !readOnly
            && removeAttributes
                    ? `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                      danger
                    "
                    type="button"
                    ${removeAttributes}
                    aria-label="Remove ${escapeHtml(
                        eventTitle
                    )} from ${escapeHtml(
                        removeContextLabel
                    )}"
                    title="Remove link">

                    ${icon.close}
                  </button>
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderNoteLinkedRecordRows(
    type,
    config,
    records,
    noteId =
        ''
)
{
    if (type === 'person')
    {
        return `
          <div
            class="
              relationship-list
              notes-people-list
            ">
            ${records
                .map(person =>
                {
                    const name =
                        person.names?.display
                  || 'Unnamed person';

                    return `
                  <div class="relation-row">
                    <button
                      class="relation-row-main"
                      type="button"
                      data-note-linked-open
                      data-note-linked-type="person"
                      data-note-linked-id="${escapeHtml(
                            person.id
                        )}"
                      aria-label="Open profile for ${escapeHtml(
                            name
                        )}">

                      ${renderPersonAvatar(
                            person,
                            'small-avatar',
                            {
                                element: 'span'
                            }
                        )}

                      <span class="relation-row-copy">
                        <strong>
                          ${escapeHtml(
                                name
                            )}
                        </strong>

                        <span>
                          ${escapeHtml(
                                albumPhotoPersonDates(
                                    person
                                )
                            )}
                        </span>
                      </span>
                    </button>

                    <div class="relation-actions">
                      <button
                        class="
                          relation-action-button
                          danger
                        "
                        type="button"
                        data-note-linked-remove
                        data-note-linked-type="person"
                        data-note-linked-id="${escapeHtml(
                            person.id
                        )}"
                        aria-label="Remove ${escapeHtml(
                            name
                        )} from note"
                        title="Remove link">

                        ${icon.close}
                      </button>
                    </div>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    if (type === 'place')
    {
        return `
          <div
            class="
              relationship-list
              notes-place-list
            ">

            ${records
                .map(place =>
                {
                    const primaryName =
                        placePrimaryName(
                            place
                        )
                  || place.name
                  || 'Unnamed place';

                    const secondaryName =
                        placeSecondaryName(
                            place
                        )
                  || 'No broader place recorded';

                    const connectionCounts =
                        getPlaceConnectionCounts(
                            place.id,
                            {
                                projectId:
                        place.projectId
                        || currentProjectId()
                            }
                        );

                    const connectionTotal =
                        Object.values(
                            connectionCounts
                        ).reduce(
                            (
                                total,
                                count
                            ) =>
                                total
                      + Number(
                          count || 0
                      ),
                            0
                        );

                    const connectionLabel =
                        `${connectionTotal} ${
                            connectionTotal === 1
                                ? 'connected record'
                                : 'connected records'
                        }`;

                    const metadata =
                        placeHasCoordinates(
                            place
                        )
                            ? connectionLabel
                            : `${connectionLabel} · No map position`;

                    return `
                  <div
                    class="
                      relation-row
                      notes-place-item
                    ">

                    <button
                      class="
                        relation-row-main
                        notes-place-main
                      "
                      type="button"
                      data-note-linked-open
                      data-note-linked-type="place"
                      data-note-linked-id="${escapeHtml(
                            place.id
                        )}"
                      aria-label="Open ${escapeHtml(
                            primaryName
                        )} in Places">

                      <span
                        class="notes-place-icon"
                        aria-hidden="true">

                        ${icon.mapPin}
                      </span>

                      <span class="notes-place-copy">

                        <strong>
                          ${escapeHtml(
                                primaryName
                            )}
                        </strong>

                        <span class="notes-place-secondary">
                          ${escapeHtml(
                                secondaryName
                            )}
                        </span>

                        <span class="notes-place-meta">
                          ${escapeHtml(
                                metadata
                            )}
                        </span>
                      </span>
                    </button>

                    <div class="relation-actions">
                      <button
                        class="
                          relation-action-button
                          danger
                        "
                        type="button"
                        data-note-linked-remove
                        data-note-linked-type="place"
                        data-note-linked-id="${escapeHtml(
                            place.id
                        )}"
                        aria-label="Remove ${escapeHtml(
                            primaryName
                        )} from note"
                        title="Remove link">

                        ${icon.close}
                      </button>
                    </div>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    if (
        type === 'event'
    )
    {
        return `
          <div
            class="
              relationship-list
              notes-event-list
            ">

            ${records
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                    `
                      data-note-linked-open
                      data-note-linked-type="event"
                      data-note-linked-id="${escapeHtml(
                            event.id
                        )}"
                    `,

                        removeAttributes:
                    `
                      data-note-linked-remove
                      data-note-linked-type="event"
                      data-note-linked-id="${escapeHtml(
                            event.id
                        )}"
                    `,

                        removeContextLabel:
                    'note'
                    })
                )
                .join('')}
          </div>
        `;
    }

    if (
        type === 'archiveFile'
    )
    {
        return renderConnectedFileList({
            files:
            records,

            contextType:
            'note',

            contextId:
            noteId,

            emptyText:
            'No files linked to this note.'
        });
    }

    if (
        type === 'source'
    )
    {
        const note =
            getNote(
                noteId,
                {
                    includeArchived:
                true
                }
            );

        return renderConnectedSourceList({
            targetType:
            'note',

            targetId:
            noteId,

            projectId:
            note?.projectId
            || records[0]?.projectId
            || currentProjectId(),

            sources:
            records,

            /*
            Notes should display every connected
            source, not a shortened preview.
          */
            limit:
            Number.POSITIVE_INFINITY,

            emptyText:
            'No sources linked to this note.'
        });
    }

    return `
        <div class="notes-linked-list">
          ${records
                .map(record => `
              <div class="notes-linked-row">
                <button
                  class="notes-linked-main"
                  type="button"
                  data-note-linked-open
                  data-note-linked-type="${escapeHtml(
                        type
                    )}"
                  data-note-linked-id="${escapeHtml(
                        record.id
                    )}">

                  <strong>
                    ${escapeHtml(
                        noteEntityLabel(
                            type,
                            record
                        )
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                        noteEntityMeta(
                            type,
                            record
                        )
                    )}
                  </span>
                </button>

                <div class="notes-linked-actions">
                  <button
                    class="
                      notes-linked-action
                      danger
                    "
                    type="button"
                    data-note-linked-remove
                    data-note-linked-type="${escapeHtml(
                        type
                    )}"
                    data-note-linked-id="${escapeHtml(
                        record.id
                    )}"
                    aria-label="Remove ${escapeHtml(
                        config.singular
                    )} link"
                    title="Remove link">

                    ${icon.close}
                  </button>
                </div>
              </div>
            `)
                .join('')}
        </div>
      `;
}

function renderNoteLinkedPhotoGrid(
    records
)
{
    return `
        <div
          class="
            connected-photo-grid
            notes-linked-photo-grid
          ">

          ${records
                .map(photo =>
                {
                    const label =
                        noteEntityLabel(
                            'photo',
                            photo
                        );

                    return `
                <div class="notes-linked-photo-item">
                  <button
                    class="connected-photo-button"
                    type="button"
                    data-note-linked-open
                    data-note-linked-type="photo"
                    data-note-linked-id="${escapeHtml(
                        photo.id
                    )}"
                    title="${escapeHtml(
                        label
                    )}"
                    aria-label="Open ${escapeHtml(
                        label
                    )} in Albums">

                    ${renderPhotoThumbnail(
                        photo,
                        {
                            label
                        }
                    )}
                  </button>

                  <button
                    class="notes-linked-photo-remove"
                    type="button"
                    data-note-linked-remove
                    data-note-linked-type="photo"
                    data-note-linked-id="${escapeHtml(
                        photo.id
                    )}"
                    aria-label="Remove photo link"
                    title="Remove link">

                    ${icon.close}
                  </button>
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderNoteLinkedEntitySection(
    note,
    type
)
{
    const config =
        getNoteEntityConfig(
            type
        );

    if (!config)
    {
        return '';
    }

    const records =
        noteEntityRecordsForNote(
            note,
            type
        );

    const countLabel =
        `${records.length} ${
            records.length === 1
                ? config.singular
                : config.plural
        }`;

    const rows =
        type === 'source'
            ? renderConnectedSourceList({
                targetType:
                'note',

                targetId:
                note.id,

                projectId:
                note.projectId,

                sources:
                records,

                emptyText:
                'No sources linked to this note.'
            })
            : records.length
                ? (
                    type === 'photo'
                        ? renderNoteLinkedPhotoGrid(
                            records
                        )
                        : renderNoteLinkedRecordRows(
                            type,
                            config,
                            records,
                            note.id
                        )
                )
                : `
              <span class="notes-section-empty">
                No ${escapeHtml(
                    config.plural
                )} linked to this note.
              </span>
            `;

    return renderNoteEditorSection({
        id:
          config.sectionKey,

        title:
          config.title,

        meta:
          countLabel,

        action: `
          <button
            class="link"
            type="button"
            data-note-manage-links="${escapeHtml(
                type
            )}">

            ${renderPanelButtonLabel(
                icon.plus,
                `Add ${
                    config.singular
                }`
            )}
          </button>
        `,

        body:
          rows
    });
}

function renderRelatedNoteIcon(
    className = ''
)
{
    return `
        <span
          class="notes-related-icon ${escapeHtml(
                className
            )}"
          aria-hidden="true">

          <span class="notes-related-icon-document">
            ${icon.note}
          </span>

          <span class="notes-related-icon-link">
            ${icon.link}
          </span>
        </span>
      `;
}

function renderRelatedNoteRelationItem({
    note,
    openAttributes =
        '',
    removeAttributes =
        '',
    removeContextLabel =
        'item',
    readOnly =
        false
} = {})
{
    if (!note)
    {
        return '';
    }

    const title =
        note.title
        || 'Untitled note';

    const excerpt =
        noteExcerpt(
            note,
            120
        )
        || 'No note content';

    const metadata =
        relatedNotePermanentMetadata(
            note
        );

    const content = `
        ${renderRelatedNoteIcon()}

        <span
          class="
            notes-related-copy
          ">

          <span
            class="
              notes-related-title-line
            ">

            <strong
              class="
                notes-related-title
              ">

              ${escapeHtml(
                    title
                )}
            </strong>

            ${
                note.archived
                    ? `
                  <span
                    class="
                      notes-related-archived-badge
                    ">

                    Archived
                  </span>
                `
                    : ''
            }
          </span>

          <span
            class="
              notes-related-excerpt
            ">

            ${escapeHtml(
                excerpt
            )}
          </span>

          <span
            class="
              notes-related-meta
            ">

            ${escapeHtml(
                metadata
            )}
          </span>
        </span>
      `;

    return `
        <div
          class="
            relation-row
            notes-related-item
          ">

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                    notes-related-main
                  ">

                  ${content}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                    notes-related-main
                  "
                  type="button"
                  ${openAttributes}
                  aria-label="Open ${escapeHtml(
                        title
                    )}">

                  ${content}
                </button>
              `
            }

          ${
                !readOnly
            && removeAttributes
                    ? `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                      danger
                    "
                    type="button"
                    ${removeAttributes}
                    aria-label="Remove ${escapeHtml(
                        title
                    )} from ${escapeHtml(
                        removeContextLabel
                    )}"
                    title="Remove link">

                    ${icon.close}
                  </button>
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderRelatedNoteCollectionChips(
    note,
    limit = 2
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    if (!collections.length)
    {
        return '';
    }

    const visible =
        collections.slice(
            0,
            limit
        );

    const hiddenCount =
        collections.length
        - visible.length;

    return `
        <span class="notes-related-collection-chips">
          ${visible
                .map(collection => `
              <span class="notes-related-collection-chip">
                ${escapeHtml(
                    collection.name
                )}
              </span>
            `)
                .join('')}

          ${
                hiddenCount > 0
                    ? `
                <span class="notes-related-collection-chip">
                  +${hiddenCount}
                </span>
              `
                    : ''
            }
        </span>
      `;
}

function relatedNotePermanentMetadata(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    const collectionLabel =
        collections.length
            ? [
                collections[0].name,

                collections.length > 1
                    ? `+${collections.length - 1}`
                    : ''
            ]
                .filter(Boolean)
                .join(' ')
            : '';

    const linkedCount =
        noteExternalEntityCount(
            note
        );

    return [
        collectionLabel,

        `${linkedCount} ${
            linkedCount === 1
                ? 'linked record'
                : 'linked records'
        }`,

        formatNoteRelativeUpdatedAt(
            note
        )
    ]
        .filter(Boolean)
        .join(' · ');
}

function renderNoteRelatedSection(
    note
)
{
    const related =
        getRelatedNotes(
            note.id,
            {
                projectId:
              note.projectId,

                includeArchived:
              true
            }
        )
            .slice()
            .sort((first, second) =>
                Number(Boolean(first.archived))
            - Number(Boolean(second.archived))
            || String(first.title || '')
                .localeCompare(
                    String(second.title || '')
                )
            );

    const rows =
        related.length
            ? `
            <div
              class="
                relationship-list
                notes-related-list
              ">
              ${related
                    .slice(0, CONNECTED_NOTES_PREVIEW_LIMIT)
                    .map(item =>
                        renderRelatedNoteRelationItem({
                            note:
                      item,

                            openAttributes:
                      `
                        data-note-related-open="${escapeHtml(
                            item.id
                        )}"
                      `,

                            removeAttributes:
                      `
                        data-note-related-remove="${escapeHtml(
                            item.id
                        )}"
                      `,

                            removeContextLabel:
                      'note'
                        })
                    )
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              No related notes.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'related',

        title:
          'Related notes',

        meta:
          `${related.length} ${
              related.length === 1
                  ? 'note'
                  : 'notes'
          }`,

        action: `
          <button
            class="link"
            type="button"
            id="notesManageRelated">

            ${renderPanelButtonLabel(
                icon.plus,
                'Add note'
            )}
          </button>
        `,

        body:
          rows
    });
}

function renderNoteInfoSection(
    note
)
{
    const body =
        String(
            note.body || ''
        );

    return renderNoteEditorSection({
        id:
          'info',

        title:
          'Note info',

        body: `
          <div class="notes-info-grid">
            <div class="notes-info-row">
              <span>Created</span>
              <strong>
                ${escapeHtml(
                    formatNoteInfoDate(
                        note.createdAt
                    )
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Updated</span>
              <strong>
                ${escapeHtml(
                    formatNoteInfoDate(
                        note.updatedAt
                    )
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Words</span>
              <strong>
                ${noteBodyWordCount(
                    note
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Characters</span>
              <strong>
                ${body.length}
              </strong>
            </div>
          </div>
        `
    });
}

function openNoteCollectionsModal(
    noteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived: true
            }
        );

    if (!note)
    {
        return;
    }

    const projectId =
        note.projectId;

    let query = '';
    let createMode = false;

    const assignedCollectionIds =
        new Set(
            note.collectionIds || []
        );

    /*
        Only newly selected collections
        are stored here. Existing memberships
        remain visible but disabled.
      */
    const selectedCollectionIds =
        new Set();

    const createDraft = {
        name: '',
        description: ''
    };

    const allCollections = () =>
        getProjectNoteCollections(
            projectId
        );

    const collectionSearchText =
        collection =>
            `
            ${collection.name || ''}
            ${collection.description || ''}
          `
                .trim()
                .toLowerCase();

    const visibleCollections = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        if (!normalizedQuery)
        {
            return allCollections();
        }

        return allCollections()
            .filter(collection =>
                collectionSearchText(
                    collection
                ).includes(
                    normalizedQuery
                )
            );
    };

    const collectionNoteCount =
        collection =>
            getNotesForCollection(
                collection.id,
                {
                    projectId,
                    includeArchived: true
                }
            ).length;

    const selectionLabel = () =>
    {
        const count =
            selectedCollectionIds.size;

        return `1 note selected · ${count} ${
            count === 1
                ? 'collection'
                : 'collections'
        } chosen`;
    };

    const saveLabel = () =>
    {
        const count =
            selectedCollectionIds.size;

        if (!count)
        {
            return 'Add to collections';
        }

        return `Add to ${count} ${
            count === 1
                ? 'collection'
                : 'collections'
        }`;
    };

    const renderCollectionRow =
        collection =>
        {
            const alreadyAssigned =
                assignedCollectionIds.has(
                    collection.id
                );

            const selected =
                selectedCollectionIds.has(
                    collection.id
                );

            const noteCount =
                collectionNoteCount(
                    collection
                );

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
                ${
                    alreadyAssigned
                        ? 'is-complete'
                        : ''
                }
              "
              data-note-collection-picker-row="${escapeHtml(
                    collection.id
                )}">

              <span class="album-picker-cover">
                ${icon.folder}
              </span>

              <span class="album-picker-copy">
                <strong>
                  ${escapeHtml(
                        collection.name
                    || 'Untitled collection'
                    )}
                </strong>

                <span class="album-picker-description">
                  ${escapeHtml(
                        collection.description
                    || 'No description'
                    )}
                </span>

                <span class="album-picker-meta">
                  <span>
                    ${noteCount}
                    ${
                        noteCount === 1
                            ? 'note'
                            : 'notes'
                    }
                  </span>

                  ${
                        alreadyAssigned
                            ? `
                        <span
                          aria-hidden="true">
                          ·
                        </span>

                        <span
                          class="
                            album-picker-membership
                            complete
                          ">
                          Already added
                        </span>
                      `
                            : ''
                    }
                </span>
              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    collection.id
                )}"
                data-note-collection-picker-choice
                ${
                    selected
                  || alreadyAssigned
                        ? 'checked'
                        : ''
                }
                ${
                    alreadyAssigned
                        ? 'disabled'
                        : ''
                }
                aria-label="${escapeHtml(
                    alreadyAssigned
                        ? `${
                            collection.name
                        } is already assigned`
                        : `${
                            selected
                                ? 'Remove'
                                : 'Add'
                        } ${
                            collection.name
                        }`
                )}">
            </label>
          `;
        };

    const renderResults = () =>
    {
        const collections =
            visibleCollections();

        if (collections.length)
        {
            return collections
                .map(
                    renderCollectionRow
                )
                .join('');
        }

        if (query.trim())
        {
            return `
            <div class="album-picker-empty">
              <div class="album-picker-empty-card">
                <strong>
                  No collections match this search
                </strong>

                <p>
                  Try another collection name
                  or description.
                </p>

                <div class="album-picker-empty-actions">
                  <button
                    class="button secondary"
                    type="button"
                    data-note-collection-picker-clear-search>
                    Clear search
                  </button>

                  <button
                    class="button primary"
                    type="button"
                    data-note-collection-picker-create>
                    Create collection
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="album-picker-empty">
            <div class="album-picker-empty-card">
              <strong>
                No collections yet
              </strong>

              <p>
                Create a collection to organize
                this note.
              </p>

              <button
                class="button primary"
                type="button"
                data-note-collection-picker-create>
                Create collection
              </button>
            </div>
          </div>
        `;
    };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            album-picker-modal
            note-collection-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="noteCollectionPickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="noteCollectionPickerTitle">
                Add to collection
              </h2>

              <p>
                ${escapeHtml(
                    note.title
                  || 'Untitled note'
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add to collection dialog">
              ${icon.close}
            </button>
          </div>

          <div class="album-picker-body">

            <div
              class="album-picker-browse"
              data-note-collection-picker-browse>

              <div
                class="
                  field
                  photo-people-search-field
                  album-picker-search
                ">

                <label for="noteCollectionPickerSearch">
                  Find collections
                </label>

                <div class="search-input">
                  ${icon.search}

                  <input
                    id="noteCollectionPickerSearch"
                    type="search"
                    data-note-collection-picker-search
                    placeholder="Search collections"
                    autocomplete="off">
                </div>
              </div>

              <section class="album-picker-results-panel">

                <div class="album-picker-results-head">

                  <div class="album-picker-results-heading">
                    <strong
                      data-note-collection-picker-results-title>
                      All collections
                    </strong>

                    <span
                      data-note-collection-picker-results-meta>
                    </span>
                  </div>

                  <button
                    class="
                      button
                      secondary
                      compact
                      album-picker-new-button
                    "
                    type="button"
                    data-note-collection-picker-create>

                    ${icon.plus}
                    New collection
                  </button>
                </div>

                <div
                  class="
                    photo-people-results
                    album-picker-results
                  "
                  data-note-collection-picker-results>
                </div>
              </section>
            </div>

            <form
              id="noteCollectionPickerCreateForm"
              class="album-picker-create"
              data-note-collection-picker-create-form
              hidden>

              <div class="album-picker-create-copy">
                <strong>
                  Create a new collection
                </strong>

                <span>
                  The new collection will be
                  selected automatically.
                </span>
              </div>

              <div class="album-picker-create-fields">

                <div class="field">
                  <label for="noteCollectionPickerName">
                    Collection name
                  </label>

                  <input
                    id="noteCollectionPickerName"
                    type="text"
                    maxlength="120"
                    data-note-collection-picker-name
                    required
                    autocomplete="off">
                </div>

                <div class="field">
                  <label
                    for="noteCollectionPickerDescription">
                    Description
                  </label>

                  <textarea
                    id="noteCollectionPickerDescription"
                    maxlength="500"
                    data-note-collection-picker-description
                    placeholder="Optional description"></textarea>
                </div>
              </div>
            </form>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
              album-picker-footer
            ">

            <span
              class="photo-people-selection-count"
              data-note-collection-picker-count>
            </span>

            <div
              class="album-picker-footer-actions"
              data-note-collection-picker-footer-actions>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.note-collection-picker-modal'
        );

    if (!modal)
    {
        return;
    }

    const browsePanel =
        modal.querySelector(
            '[data-note-collection-picker-browse]'
        );

    const createPanel =
        modal.querySelector(
            '[data-note-collection-picker-create-form]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-note-collection-picker-results]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-note-collection-picker-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-note-collection-picker-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-note-collection-picker-count]'
        );

    const footerActions =
        modal.querySelector(
            '[data-note-collection-picker-footer-actions]'
        );

    const searchInput =
        modal.querySelector(
            '[data-note-collection-picker-search]'
        );

    const nameInput =
        modal.querySelector(
            '[data-note-collection-picker-name]'
        );

    const descriptionInput =
        modal.querySelector(
            '[data-note-collection-picker-description]'
        );

    const refreshFooter = () =>
    {
        if (
            !countElement
          || !footerActions
        )
        {
            return;
        }

        if (createMode)
        {
            countElement.textContent =
                'Create a new collection';

            footerActions.innerHTML = `
            <button
              class="button secondary"
              type="button"
              data-note-collection-picker-back>
              ${escapeHtml(t('Back'))}
            </button>

            <button
              class="
                button
                primary
                album-picker-save
              "
              type="submit"
              form="noteCollectionPickerCreateForm"
              ${
                    createDraft.name.trim()
                        ? ''
                        : 'disabled'
                }>
              ${escapeHtml(
                    t('Create and select')
                )}
            </button>
          `;

            return;
        }

        countElement.textContent =
            translateText(
                selectionLabel()
            );

        footerActions.innerHTML = `
          <button
            class="button secondary"
            type="button"
            data-note-collection-picker-cancel>
            ${escapeHtml(t('Cancel'))}
          </button>

          <button
            class="
              button
              primary
              album-picker-save
            "
            type="button"
            data-note-collection-picker-save
            ${
                selectedCollectionIds.size
                    ? ''
                    : 'disabled'
            }>
            ${escapeHtml(
                saveLabel()
            )}
          </button>
        `;
    };

    const refreshResults = () =>
    {
        const collections =
            visibleCollections();

        const total =
            allCollections().length;

        const hasQuery =
            Boolean(
                query.trim()
            );

        if (resultsTitle)
        {
            resultsTitle.textContent =
                t(
                    hasQuery
                        ? 'Search results'
                        : 'All collections'
                );
        }

        if (resultsMeta)
        {
            const source =
                hasQuery
                    ? `${collections.length} of ${total} collections`
                    : `${total} ${
                        total === 1
                            ? 'collection'
                            : 'collections'
                    }`;

            resultsMeta.textContent =
                translateText(source);
        }

        if (resultsHost)
        {
            resultsHost.innerHTML =
                renderResults();

            localizeUI(
                resultsHost
            );
        }

        refreshFooter();
    };

    const showBrowse = () =>
    {
        createMode = false;

        browsePanel.hidden =
            false;

        createPanel.hidden =
            true;

        refreshResults();

        requestAnimationFrame(
            () =>
            {
                searchInput?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const showCreate = () =>
    {
        createMode = true;

        browsePanel.hidden =
            true;

        createPanel.hidden =
            false;

        if (nameInput)
        {
            nameInput.value =
                createDraft.name;
        }

        if (descriptionInput)
        {
            descriptionInput.value =
                createDraft.description;
        }

        refreshFooter();

        requestAnimationFrame(
            () =>
            {
                nameInput?.focus({
                    preventScroll: true
                });
            }
        );
    };

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget.value;

            refreshResults();
        }
    );

    nameInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.name =
                event.currentTarget.value;

            refreshFooter();
        }
    );

    descriptionInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.description =
                event.currentTarget.value;
        }
    );

    createPanel?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                createDraft.name.trim();

            if (!name)
            {
                nameInput?.focus();
                return;
            }

            const duplicate =
                allCollections()
                    .some(collection =>
                        String(
                            collection.name || ''
                        )
                            .trim()
                            .toLowerCase()
                === name.toLowerCase()
                    );

            if (duplicate)
            {
                showToast(
                    'A collection with this name already exists.'
                );

                nameInput?.focus();
                return;
            }

            const collection = {
                id:
              createRuntimeId(
                  'note-col'
              ),

                projectId,

                name,

                description:
              createDraft.description
                  .trim()
            };

            sampleData.noteCollections.push(
                collection
            );

            selectedCollectionIds.add(
                collection.id
            );

            createDraft.name = '';
            createDraft.description = '';
            query = '';

            if (searchInput)
            {
                searchInput.value = '';
            }

            showBrowse();

            requestAnimationFrame(
                () =>
                {
                    modal
                        .querySelector(
                            `[data-note-collection-picker-row="${
                                CSS.escape(
                                    collection.id
                                )
                            }"]`
                        )
                        ?.scrollIntoView({
                            block: 'nearest'
                        });
                }
            );
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-note-collection-picker-choice]'
                );

            if (!checkbox)
            {
                return;
            }

            const collectionId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedCollectionIds.add(
                    collectionId
                );
            }
            else
            {
                selectedCollectionIds.delete(
                    collectionId
                );
            }

            refreshResults();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-note-collection-picker-cancel]'
                )
            )
            {
                closeModal();
                return;
            }
            if (
                event.target.closest(
                    '[data-note-collection-picker-create]'
                )
            )
            {
                showCreate();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-back]'
                )
            )
            {
                showBrowse();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-save]'
                )
            )
            {
                if (
                    !selectedCollectionIds.size
                )
                {
                    return;
                }

                const addedCount =
                    selectedCollectionIds.size;

                setNoteCollections(
                    note.id,
                    [
                        ...assignedCollectionIds,
                        ...selectedCollectionIds
                    ],
                    {
                        projectId
                    }
                );

                closeModal();

                renderNotesPreservingInteraction();

                showToast(
                    `${addedCount} ${
                        addedCount === 1
                            ? 'collection'
                            : 'collections'
                    } added.`
                );
            }
        }
    );

    refreshResults();
}

function addNotesPlaceIdsFromRecord(
    record,
    target
)
{
    if (
        !record
        || !target
    )
    {
        return;
    }

    [
        record.placeId,
        record.birthPlaceId,
        record.deathPlaceId,
        record.burialPlaceId
    ]
        .filter(Boolean)
        .forEach(placeId =>
            target.add(placeId)
        );

    if (
        Array.isArray(
            record.placeIds
        )
    )
    {
        record.placeIds
            .filter(Boolean)
            .forEach(placeId =>
                target.add(placeId)
            );
    }
}

function notesSuggestedPlaceIds(
    note
)
{
    const placeIds =
        new Set();

    if (!note)
    {
        return placeIds;
    }

    (
        note.linkedPersonIds || []
    )
        .map(personId =>
            noteEntityById(
                'person',
                personId,
                note.projectId
            )
        )
        .filter(Boolean)
        .forEach(person =>
        {
            addNotesPlaceIdsFromRecord(
                person,
                placeIds
            );

            addNotesPlaceIdsFromRecord(
                person.birth,
                placeIds
            );

            addNotesPlaceIdsFromRecord(
                person.death,
                placeIds
            );

            (
                person.events || []
            ).forEach(event =>
                addNotesPlaceIdsFromRecord(
                    event,
                    placeIds
                )
            );

            (
                person.attributes || []
            ).forEach(attribute =>
                addNotesPlaceIdsFromRecord(
                    attribute,
                    placeIds
                )
            );
        });

    (
        note.linkedEventIds || []
    )
        .map(eventId =>
            noteEntityById(
                'event',
                eventId,
                note.projectId
            )
        )
        .filter(Boolean)
        .forEach(event =>
            addNotesPlaceIdsFromRecord(
                event,
                placeIds
            )
        );

    getPhotosForNote(
        note.id,
        {
            projectId:
            note.projectId
        }
    ).forEach(photo =>
        addNotesPlaceIdsFromRecord(
            photo,
            placeIds
        )
    );

    [
        [
            'source',
            noteEntityLinkedIds(
                note,
                'source'
            )
        ],
        [
            'archiveFile',
            note.linkedArchiveFileIds
        ]
    ].forEach(
        (
            [
                type,
                recordIds
            ]
        ) =>
        {
            (
                recordIds || []
            )
                .map(recordId =>
                    noteEntityById(
                        type,
                        recordId,
                        note.projectId
                    )
                )
                .filter(Boolean)
                .forEach(record =>
                    addNotesPlaceIdsFromRecord(
                        record,
                        placeIds
                    )
                );
        }
    );

    return placeIds;
}

function setArchiveFileConnectionIds(
    fileId,
    entityType,
    nextIds
)
{
    const file =
        archiveFileById(
            fileId
        );

    if (!file)
    {
        return false;
    }

    if (
        ![
            'person',
            'event',
            'note',
            'source',
            'place'
        ].includes(entityType)
    )
    {
        return false;
    }

    const currentIds =
        new Set(
            archiveConnectionIds(
                'file',
                file.id,
                entityType
            )
        );

    const normalizedNextIdList =
        archiveUniqueIds(
            nextIds
        );

    const nextRecords =
        normalizedNextIdList.map(id =>
            archiveConnectionRecord(
                entityType,
                id
            )
        );

    if (
        nextRecords.some(record =>
            !record
          || (
              file.projectId
            && record.projectId
            && file.projectId
              !== record.projectId
          )
        )
    )
    {
        return false;
    }

    const normalizedNextIds =
        new Set(
            normalizedNextIdList
        );

    if (
        entityType === 'place'
        && normalizedNextIds.size > 1
    )
    {
        return false;
    }

    const writes = [
        ...[...currentIds]
            .filter(recordId =>
                !normalizedNextIds.has(
                    recordId
                )
            )
            .map(recordId => ({
                ownerType: 'file',
                ownerId: file.id,
                entityType,
                entityId: recordId,
                shouldLink: false
            })),

        ...[...normalizedNextIds]
            .filter(recordId =>
                !currentIds.has(
                    recordId
                )
            )
            .map(recordId => ({
                ownerType: 'file',
                ownerId: file.id,
                entityType,
                entityId: recordId,
                shouldLink: true
            }))
    ];

    const committed =
        archiveSetConnectionsAtomically(
            writes
        );

    if (!committed.ok)
    {
        return false;
    }

    const savedIds =
        new Set(
            archiveConnectionIds(
                'file',
                file.id,
                entityType
            )
        );

    const saved =
        savedIds.size === normalizedNextIds.size
        && [...normalizedNextIds].every(id => savedIds.has(id));

    return saved;
}

function archiveFileSuggestedPersonIds(
    file
)
{
    if (!file)
    {
        return [];
    }

    const eventPersonIds =
        (
            file.linkedEventIds
          || []
        ).flatMap(eventId =>
        {
            const event =
                archiveConnectionRecord(
                    'event',
                    eventId
                );

            return placeInspectorEventOwnerIds(
                event
            );
        });

    const sourcePersonIds =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).flatMap(sourceId =>
            sourceTargetIds(
                sourceId,
                'person',
                file.projectId
            )
        );

    return archiveUniqueIds([
        ...eventPersonIds,
        ...sourcePersonIds
    ]);
}

function openPeopleLinkModal({
    projectId,
    title =
        'Add people',
    subtitle =
        '',
    initialPersonIds =
        [],
    /*
        Used by additive workflows such as Archive
        bulk linking. These People are linked to
        every selected owner and cannot be removed
        from this modal.
      */
    existingPersonIds =
        [],

    suggestedPersonIds =
        [],

    selectedHeading =
        'Linked people',

    saveLabel =
        'Save people',

    onSave,
    afterSave =
        () =>
        {},
    successMessage =
        'People links updated.'
} = {})
{
    if (
        !projectId
        || typeof onSave
          !== 'function'
    )
    {
        return;
    }

    const initialSelectedIds =
        new Set(
            (
                initialPersonIds
            || []
            ).filter(personId =>
            {
                const person =
                    getPerson(
                        personId
                    );

                return (
                    person
              && !person.deleted
              && person.projectId
                === projectId
                );
            })
        );

    const existingPersonIdSet =
        new Set(
            (
                existingPersonIds
          || []
            ).filter(personId =>
            {
                const person =
                    getPerson(
                        personId
                    );

                return (
                    person
            && !person.deleted
            && person.projectId
              === projectId
                );
            })
        );

    const selectedIds =
        new Set(
            initialSelectedIds
        );

    let query = '';

    const personName =
        person =>
            personResourceDisplayName(
                person
            )
          || 'Unnamed person';

    const personContext =
        person =>
            getPlaceEventDisplay(
                person?.birth
            )
          || getPlaceEventDisplay(
              person?.death
          )
          || '';

    const personSearchText =
        person =>
            [
                personName(person),
                person?.names?.first,
                person?.names?.middle,
                person?.names?.last,
                person?.names?.maiden,
                albumPhotoPersonDates(
                    person
                ),
                getPlaceEventDisplay(
                    person?.birth
                ),
                getPlaceEventDisplay(
                    person?.death
                )
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

    const selectionChanged =
        () =>
            initialSelectedIds.size
            !== selectedIds.size
          || [
              ...initialSelectedIds
          ].some(personId =>
              !selectedIds.has(
                  personId
              )
          );

    /*
        People appearing in photos already
        linked to this Note are suggested first.
      */
    const suggestedPersonIdSet =
        new Set(
            suggestedPersonIds
          || []
        );

    const getCandidates = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        const ranked =
            getPeople(
                projectId
            )
                .filter(person =>
                    person?.id
              && !person.deleted
                )
                .filter(person =>
                    !selectedIds.has(
                        person.id
                    )
                )
            /*
              Existing links stay out of the default
              suggestions, but remain discoverable through
              an explicit search.
            */
                .filter(person =>
                    !existingPersonIdSet.has(
                        person.id
                    )
              || Boolean(
                  normalizedQuery
              )
                )

                .filter(person =>
                    !normalizedQuery
              || personSearchText(
                  person
              ).includes(
                  normalizedQuery
              )
                )
                .map(person =>
                {
                    const displayName =
                        personName(
                            person
                        ).toLowerCase();

                    const nameParts = [
                        person?.names?.first,
                        person?.names?.middle,
                        person?.names?.last,
                        person?.names?.maiden
                    ]
                        .filter(Boolean)
                        .map(value =>
                            String(
                                value
                            ).toLowerCase()
                        );

                    let score = 0;

                    if (normalizedQuery)
                    {
                        if (
                            displayName
                    === normalizedQuery
                        )
                        {
                            score = 500;
                        }
                        else if (
                            displayName.startsWith(
                                normalizedQuery
                            )
                        )
                        {
                            score = 400;
                        }
                        else if (
                            nameParts.some(value =>
                                value.startsWith(
                                    normalizedQuery
                                )
                            )
                        )
                        {
                            score = 300;
                        }
                        else if (
                            displayName.includes(
                                normalizedQuery
                            )
                        )
                        {
                            score = 200;
                        }
                        else
                        {
                            score = 100;
                        }
                    }
                    else if (
                        suggestedPersonIdSet.has(
                            person.id
                        )
                    )
                    {
                        score += 1000;
                    }

                    score += Math.min(
                        getPersonPhotoCount(
                            person.id
                        ),
                        50
                    );

                    return {
                        person,
                        score
                    };
                })
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.score
                  - first.score
                || personName(
                    first.person
                ).localeCompare(
                    personName(
                        second.person
                    )
                )
                );

        return {
            total:
            ranked.length,

            people:
            ranked
                .slice(0, 5)
                .map(item =>
                    item.person
                )
        };
    };

    const renderSelected = () =>
    {
        const people = [
            ...selectedIds
        ]
            .map(getPerson)
            .filter(person =>
                person
            && !person.deleted
            && person.projectId
              === projectId
            );

        if (!people.length)
        {
            return '';
        }

        return `
          <div class="photo-people-selected-head">
            <strong>
              ${escapeHtml(
                    selectedHeading
                )}
            </strong>

            <span>
              ${people.length}
            </span>
          </div>

          <div class="photo-people-selected-list">
            ${people
                .map(person =>
                {
                    const name =
                        personName(person);

                    return `
                  <button
                    class="photo-people-selected-chip"
                    type="button"
                    data-notes-people-remove="${escapeHtml(
                        person.id
                    )}"
                    aria-label="${escapeHtml(
                        `Remove ${name}`
                    )}">

                    ${renderPersonAvatar(
                        person,
                        'photo-people-chip-avatar',
                        {
                            element:
                          'span'
                        }
                    )}

                    <span class="photo-people-selected-name">
                      ${escapeHtml(
                            name
                        )}
                    </span>

                    <span
                      class="photo-people-selected-remove"
                      aria-hidden="true">

                      ${icon.close}
                    </span>
                  </button>
                `;
                })
                .join('')}
          </div>
        `;
    };

    const renderResults =
        candidates =>
        {
            if (
                !candidates.people.length
            )
            {
                return `
              <div class="photo-people-empty">
                ${
                    query.trim()
                        ? `
                      No matching people
                      found. Try another
                      name, date, place.
                    `
                        : `
                      No additional people
                      to suggest.
                    `
                }
              </div>
            `;
            }

            return candidates.people
                .map(person =>
                {
                    const name =
                        personName(
                            person
                        );

                    const alreadyLinked =
                        existingPersonIdSet.has(
                            person.id
                        );

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                || 'Dates unknown';

                    const context =
                        personContext(
                            person
                        );

                    return `
                <label
                  class="
                    photo-people-result

                    ${
                        alreadyLinked
                            ? 'is-already-linked'
                            : ''
                    }
                  "
                  ${
                        alreadyLinked
                            ? `
                        title="
                          Already linked to all
                          selected files
                        "
                      `
                            : ''
                    }>

                  ${renderPersonAvatar(
                        person,
                        'photo-people-result-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span
                    class="
                      photo-people-result-copy
                    ">

                    <strong>
                      ${escapeHtml(
                            name
                        )}
                    </strong>

                    <span>
                      ${escapeHtml(
                            dates
                        )}
                    </span>

                    ${
                        context
                            ? `
                          <span>
                            ${escapeHtml(
                                context
                            )}
                          </span>
                        `
                            : ''
                    }
                  </span>

                  <input
                    type="checkbox"
                    value="${escapeHtml(
                        person.id
                    )}"
                    data-notes-people-choice
                    ${
                        alreadyLinked
                            ? 'checked disabled'
                            : ''
                    }
                    aria-label="${escapeHtml(
                        alreadyLinked
                            ? `${name} is already linked`
                            : `Add ${name}`
                    )}">
                </label>
              `;
                })
                .join('');
        };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            notes-people-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="notesPeopleTitle">

          <div class="modal-header">
            <div>
              <h2 id="notesPeopleTitle">
                ${escapeHtml(
                    title
                )}
              </h2>

              ${
                    subtitle
                        ? `
                    <p>
                      ${escapeHtml(
                            subtitle
                        )}
                    </p>
                  `
                        : ''
                }
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add people dialog">

              ${icon.close}
            </button>
          </div>

          <div class="photo-people-body">

            <div
              class="
                field
                photo-people-search-field
              ">

              <label for="notesPeopleSearch">
                Find people
              </label>

              <div class="search-input">
                ${icon.search}

                <input
                  id="notesPeopleSearch"
                  type="search"
                  data-notes-people-search
                  placeholder="Search by name, dates, place, or branch"
                  autocomplete="off">
              </div>
            </div>

            <section
              class="photo-people-selected-panel"
              data-notes-people-selected-panel
              hidden>
            </section>

            <section class="photo-people-results-panel">

              <div class="notes-related-results-head">
                <div>
                  <strong
                    data-notes-people-results-title>
                  </strong>

                  <span
                    data-notes-people-results-meta
                    aria-live="polite">
                  </span>
                </div>
              </div>

              <div
                class="photo-people-results"
                data-notes-people-choices>
              </div>
            </section>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
            ">

            <span
              class="photo-people-selection-count"
              data-notes-people-selection-count
              aria-live="polite">
            </span>

            <div class="photo-people-footer-actions">

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="
                  button
                  primary
                  photo-people-save
                "
                type="button"
                data-notes-people-save
                disabled>
                  ${escapeHtml(
                        saveLabel
                    )}
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.notes-people-modal'
        );

    if (!modal)
    {
        return;
    }

    const refresh = () =>
    {
        const selectedHtml =
            renderSelected();

        const selectedPanel =
            modal.querySelector(
                '[data-notes-people-selected-panel]'
            );

        const candidates =
            getCandidates();

        const queryActive =
            Boolean(
                query.trim()
            );

        selectedPanel.hidden =
            !selectedHtml;

        selectedPanel.innerHTML =
            selectedHtml;

        modal
            .querySelector(
                '[data-notes-people-results-title]'
            )
            .textContent =
                queryActive
                    ? 'Search results'
                    : 'Suggested people';

        modal
            .querySelector(
                '[data-notes-people-results-meta]'
            )
            .textContent =
                candidates.total
              > candidates.people.length
                    ? `Showing ${
                        candidates.people.length
                    } of ${
                        candidates.total
                    }`
                    : candidates.total
                        ? `${candidates.total} ${
                            queryActive
                                ? 'match'
                                : 'suggestion'
                        }${
                            candidates.total === 1
                                ? ''
                                : 's'
                        }`
                        : '';

        modal
            .querySelector(
                '[data-notes-people-choices]'
            )
            .innerHTML =
                renderResults(
                    candidates
                );

        modal
            .querySelector(
                '[data-notes-people-selection-count]'
            )
            .textContent =
                `${selectedIds.size} ${
                    selectedIds.size === 1
                        ? 'person'
                        : 'people'
                } selected`;

        modal
            .querySelector(
                '[data-notes-people-save]'
            )
            .disabled =
                !selectionChanged();

        localizeUI(
            modal
        );
    };

    modal
        .querySelector(
            '[data-notes-people-search]'
        )
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget.value;

                refresh();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-notes-people-choice]'
                );

            if (
                !input
            || input.disabled
            )
            {
                return;
            }

            const choiceIndex = [
                ...modal.querySelectorAll(
                    '[data-notes-people-choice]'
                )
            ].indexOf(input);

            selectedIds.add(
                input.value
            );

            refresh();

            restoreModalChoiceFocus({
                modal,
                selector:
              '[data-notes-people-choice]',
                value:
              input.value,
                index:
              choiceIndex,
                fallbackSelector:
              '[data-notes-people-search]'
            });
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const remove =
                event.target.closest(
                    '[data-notes-people-remove]'
                );

            if (remove)
            {
                selectedIds.delete(
                    remove.dataset
                        .notesPeopleRemove
                );

                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-notes-people-save]'
                )
            )
            {
                if (
                    !selectionChanged()
                )
                {
                    return;
                }

                const nextIds =
                    [
                        ...selectedIds
                    ];

                const saved =
                    onSave(
                        nextIds
                    );

                if (
                    saved === false
                )
                {
                    return;
                }

                closeModal();

                afterSave();

                const savedCount =
                    Number.isFinite(
                        saved?.addedLinkCount
                    )
                        ? saved.addedLinkCount
                        : nextIds.length;

                showToast(
                    typeof successMessage
                === 'function'
                        ? successMessage(
                            savedCount
                        )
                        : successMessage
                );
            }
        }
    );

    refresh();

    modal
        .querySelector(
            '[data-notes-people-search]'
        )
        ?.focus({
            preventScroll: true
        });
}

function openNotesPeopleModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const suggestedPersonIds =
        getPhotosForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        ).flatMap(photo =>
            photo.personIds
          || []
        );

    openPeopleLinkModal({
        projectId:
          note.projectId,

        title:
          'Add people',

        subtitle:
          note.title
          || 'Untitled note',

        initialPersonIds:
          note.linkedPersonIds
          || [],

        suggestedPersonIds,

        onSave:
          nextPersonIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  showToast(
                      'The note is no longer available.'
                  );

                  return false;
              }

              setNoteEntityLinks(
                  currentNote.id,
                  'person',
                  nextPersonIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,

        successMessage:
          'People links updated.'
    });
}

function openArchiveFilesPeopleModal(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    const ids =
        files.map(file =>
            file.id
        );

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    const projectId =
        files[0].projectId
        || currentProjectId();

    const suggestedPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                archiveFileSuggestedPersonIds(
                    file
                )
            )
        );

    const commonPersonIds =
        singleFile
            ? []
            : archiveCommonFileConnectionIds(
                files,
                'person'
            );

    openPeopleLinkModal({
        projectId,

        title:
          'Add people',

        subtitle:
          archiveBulkLinkSubtitle(
              files
          ),

        /*
          Preserve the right-panel single-file
          behavior. Bulk mode is additive only.
        */
        initialPersonIds:
          singleFile
              ? singleFile.linkedPersonIds
              || []
              : [],

        existingPersonIds:
          commonPersonIds,

        suggestedPersonIds,

        selectedHeading:
          singleFile
              ? 'Linked people'
              : 'People to add',

        saveLabel:
          singleFile
              ? 'Save people'
              : 'Add people',

        onSave:
          nextPersonIds =>
          {
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      showToast(
                          'The file is no longer available.'
                      );

                      return false;
                  }

                  return setArchiveFileConnectionIds(
                      currentFile.id,
                      'person',
                      nextPersonIds
                  );
              }

              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'person',

                      recordIds:
                  nextPersonIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No people were linked.'
                  );

                  return false;
              }

              return result;
          },

        afterSave:
          singleFile
              ? renderArchive
              : () =>
              {
                  finishArchiveBulkLinkAction(
                      ids
                  );
              },

        successMessage:
          singleFile
              ? 'People links updated.'
              : count =>
                  `${count} ${
                      count === 1
                          ? 'link was'
                          : 'links were'
                  } added to ${files.length} files.`
    });
}

function openArchiveFilePeopleModal(
    fileId
)
{
    openArchiveFilesPeopleModal(
        [
            fileId
        ]
    );
}

function openPhotoLinkModal({
    projectId =
        currentProjectId(),

    title =
        'Add photos',

    description =
        '',

    ownerLabel =
        'this item',

    initiallyLinkedPhotoIds =
        [],

    uploadDraftIdPrefix =
        'linked-photo-upload-draft',

    uploadedPhotoIdPrefix =
        'photo-link',

    onSave =
        null,

    afterSave =
        () =>
        {},

    successMessage =
        count =>
            `${count} ${
                count === 1
                    ? 'photo'
                    : 'photos'
            } added.`
} = {})
{
    if (
        !projectId
        || typeof onSave !== 'function'
    )
    {
        return;
    }

    const initiallyLinkedIds =
        new Set(
            archiveUniqueIds(
                initiallyLinkedPhotoIds
            ).filter(photoId =>
                Boolean(
                    getPhoto(
                        photoId,
                        {
                            projectId
                        }
                    )
                )
            )
        );

    const picker = {
        sourceTab:
          getProjectPhotos(
              projectId
          ).length
              ? 'project'
              : 'upload',

        search:
          '',

        selectedProjectIds:
          new Set(),

        uploadDrafts:
          [],

        uploadErrors:
          []
    };

    const pendingCount = () =>
        picker.selectedProjectIds.size
        + picker.uploadDrafts.length;

    const countLabel = () =>
    {
        const count =
            pendingCount();

        return `${count} ${
            count === 1
                ? 'photo'
                : 'photos'
        } selected`;
    };

    const actionLabel = () =>
    {
        const count =
            pendingCount();

        if (!count)
        {
            return 'Add photos';
        }

        return `Add ${count} ${
            count === 1
                ? 'photo'
                : 'photos'
        }`;
    };

    const uploadDraftAsPhoto =
        draft => ({
            id:
            draft.id,

            projectId,

            kind:
            'photo',

            title:
            draft.filename
            || 'Uploaded photo',

            filename:
            draft.filename
            || 'Uploaded photo',

            src:
            draft.src,

            mimeType:
            draft.mimeType,

            width:
            draft.width,

            height:
            draft.height,

            sizeBytes:
            draft.sizeBytes,

            placeholder: {
                pattern:
              'orbit',

                palette:
              'moss',

                seed:
              draft.seed
              || 97
            },

            personIds:
            [],

            albumIds:
            [],

            date:
            emptyGenealogyDate(
                'Exact date'
            ),

            placeId:
            null,

            placeText:
            '',

            caption:
            '',

            favorite:
            false,

            createdAt:
            '',

            updatedAt:
            ''
        });

    const projectPhotos = () =>
    {
        const query =
            picker.search
                .trim()
                .toLowerCase();

        return getProjectPhotos(
            projectId
        )

            .filter(photo =>
                !query
            || photoSearchText(
                photo
            ).includes(
                query
            )
            )
            .map(
                (
                    photo,
                    index
                ) => ({
                    photo,
                    index,

                    alreadyLinked:
                initiallyLinkedIds.has(
                    photo.id
                )
                })
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    Number(
                        first.alreadyLinked
                    )
              - Number(
                  second.alreadyLinked
              )
              || first.index
              - second.index
            )
            .map(item =>
                item.photo
            );
    };

    const renderCandidate =
        photo =>
        {
            const alreadyLinked =
                initiallyLinkedIds.has(
                    photo.id
                );

            const selected =
                !alreadyLinked
            && picker
                .selectedProjectIds
                .has(
                    photo.id
                );

            const title =
                photo.title
            || photo.filename
            || 'Untitled photo';

            const date =
                formatPhotoDate(
                    photo
                )
            || 'Unknown date';

            return `
            <button
              class="
                person-photo-candidate
                person-photos-adder-candidate
              "
              type="button"
              data-notes-photos-adder-candidate="${escapeHtml(
                    photo.id
                )}"
              aria-pressed="${selected}"
              aria-label="${escapeHtml(
                    alreadyLinked
                        ? `${title} is already linked to ${ownerLabel}`
                        : `${
                            selected
                                ? 'Deselect'
                                : 'Select'
                        } ${title}`
                )}"
              ${
                    alreadyLinked
                        ? 'disabled aria-disabled="true"'
                        : ''
                }>

              <span class="person-photo-candidate-preview">
                ${renderPhotoThumbnail(
                    photo,
                    {
                        label:
                      title
                    }
                )}

                ${
                    alreadyLinked
                        ? `
                      <span class="person-photos-adder-status-badge">
                        Already added
                      </span>
                    `
                        : ''
                }

                <span
                  class="person-photos-adder-check"
                  data-notes-photos-adder-check
                  ${selected
                        ? ''
                        : 'hidden'}
                  aria-hidden="true">

                  ${icon.check}
                </span>
              </span>

              <span class="person-photo-candidate-copy">
                <strong>
                  ${escapeHtml(
                        title
                    )}
                </strong>

                <span>
                  ${escapeHtml(
                        date
                    )}
                </span>
              </span>
            </button>
          `;
        };

    const renderProjectResults =
        () =>
        {
            const allPhotos =
                getProjectPhotos(
                    projectId
                );

            const photos =
                projectPhotos();

            if (!allPhotos.length)
            {
                return `
              <div class="person-photo-empty">
                <div>
                  <strong>
                    This project has no photos yet.
                  </strong>

                  <button
                    class="button primary"
                    type="button"
                    data-notes-photos-adder-show-upload>
                    Upload new photos
                  </button>
                </div>
              </div>
            `;
            }

            if (!photos.length)
            {
                return `
              <div class="person-photo-empty">
                <div>
                  <strong>
                    No photos match this search.
                  </strong>

                  <div class="person-photo-empty-actions">
                    <button
                      class="button secondary"
                      type="button"
                      data-notes-photos-adder-clear-search>
                      Clear search
                    </button>

                    <button
                      class="button primary"
                      type="button"
                      data-notes-photos-adder-show-upload>
                      Upload new photos
                    </button>
                  </div>
                </div>
              </div>
            `;
            }

            return `
            <div
              class="
                person-photo-candidate-grid
                person-photos-adder-grid
              ">

              ${photos
                    .map(
                        renderCandidate
                    )
                    .join('')}
            </div>
          `;
        };

    const renderProjectPanel =
        () => `
          <div
            class="
              person-photo-project-panel
              person-photos-adder-project-panel
            ">

            <div
              class="
                person-photo-project-controls
                person-photos-adder-project-controls
              ">

              <label
                class="search-input"
                aria-label="Search project photos">

                ${icon.search}

                <input
                  data-notes-photos-adder-search
                  type="search"
                  value="${escapeHtml(
                        picker.search
                    )}"
                  placeholder="Search project photos"
                  autocomplete="off">
              </label>
            </div>

            <div
              class="person-photo-project-results"
              data-notes-photos-adder-project-results>

              ${renderProjectResults()}
            </div>
          </div>
        `;

    const renderUploadDraft =
        draft =>
        {
            const photo =
                uploadDraftAsPhoto(
                    draft
                );

            const title =
                draft.filename
            || 'Uploaded photo';

            return `
            <article
              class="
                person-photo-candidate
                person-photos-adder-upload-card
              ">

              <span class="person-photo-candidate-preview">
                ${renderPhotoThumbnail(
                    photo,
                    {
                        label:
                      title
                    }
                )}

                <button
                  class="person-photos-adder-upload-remove"
                  type="button"
                  data-notes-photos-adder-remove-upload="${escapeHtml(
                        draft.id
                    )}"
                  aria-label="${escapeHtml(
                        `Remove ${title}`
                    )}"
                  title="Remove upload">

                  ${icon.close}
                </button>
              </span>

              <span class="person-photo-candidate-copy">
                <strong>
                  ${escapeHtml(
                        title
                    )}
                </strong>

                <span>
                  ${escapeHtml(
                        `${
                            draft.width
                        } × ${
                            draft.height
                        } · ${
                            formatMediaBytes(
                                draft.sizeBytes
                            )
                        }`
                    )}
                </span>
              </span>
            </article>
          `;
        };

    const renderUploadErrors =
        () =>
        {
            if (
                !picker.uploadErrors
                    .length
            )
            {
                return '';
            }

            return `
            <div
              class="person-photos-adder-upload-errors"
              role="alert">

              <strong>
                ${
                    picker.uploadErrors.length
                    === 1
                        ? 'One file could not be added:'
                        : `${picker.uploadErrors.length} files could not be added:`
                }
              </strong>

              <ul>
                ${picker.uploadErrors
                    .map(error => `
                    <li>
                      ${escapeHtml(
                            error
                        )}
                    </li>
                  `)
                    .join('')}
              </ul>
            </div>
          `;
        };

    const renderUploadPanel =
        () =>
        {
            const maxMegabytes =
                Math.round(
                    PHOTO_UPLOAD_MAX_BYTES
              / (1024 * 1024)
                );

            return `
            <div class="person-photos-adder-upload-panel">

              <div
                class="
                  person-photo-upload-dropzone
                  person-photos-adder-upload-dropzone
                  ${
                        picker.uploadDrafts
                            .length
                            ? 'has-drafts'
                            : ''
                    }
                "
                data-notes-photos-adder-dropzone>

                <input
                  type="file"
                  accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}"
                  multiple
                  data-notes-photos-adder-file
                  hidden>

                <div class="person-photo-upload-prompt">
                  ${icon.import}

                  <strong>
                    ${
                        picker.uploadDrafts
                            .length
                            ? 'Add more photos'
                            : 'Drop photos here'
                    }
                  </strong>

                  <p>
                    JPEG, PNG, or WebP up to
                    ${maxMegabytes} MB each.
                  </p>

                  <button
                    class="button primary"
                    type="button"
                    data-notes-photos-adder-choose-files>
                    Choose photos
                  </button>
                </div>
              </div>

              ${renderUploadErrors()}

              ${
                    picker.uploadDrafts.length
                        ? `
                    <div
                      class="
                        person-photo-candidate-grid
                        person-photos-adder-upload-grid
                      ">

                      ${picker.uploadDrafts
                            .map(
                                renderUploadDraft
                            )
                            .join('')}
                    </div>
                  `
                        : ''
                }
            </div>
          `;
        };

    const renderFooter =
        () =>
        {
            const count =
                pendingCount();

            return `
            <div
              class="
                modal-footer
                person-photos-adder-footer
              ">

              <span
                class="person-photos-adder-count"
                data-notes-photos-adder-count>

                ${escapeHtml(
                    countLabel()
                )}
              </span>

              <div class="modal-footer-actions">
                <button
                  class="button secondary"
                  type="button"
                  data-close>
                  Cancel
                </button>

                <button
                  class="button primary"
                  type="button"
                  data-notes-photos-adder-save
                  ${
                        count
                            ? ''
                            : 'disabled'
                    }>

                  ${escapeHtml(
                        actionLabel()
                    )}
                </button>
              </div>
            </div>
          `;
        };

    const refreshProjectResults =
        () =>
        {
            const host =
                modalBackdrop.querySelector(
                    '[data-notes-photos-adder-project-results]'
                );

            if (!host)
            {
                return;
            }

            host.innerHTML =
                renderProjectResults();

            localizeUI(
                host
            );
        };

    const refreshSelectionUi =
        () =>
        {
            const modal =
                modalBackdrop.querySelector(
                    '[data-notes-photos-adder]'
                );

            if (!modal)
            {
                return;
            }

            modal
                .querySelectorAll(
                    '[data-notes-photos-adder-candidate]'
                )
                .forEach(card =>
                {
                    const photoId =
                        card.dataset
                            .notesPhotosAdderCandidate;

                    const selected =
                        picker.selectedProjectIds
                            .has(photoId);

                    card.setAttribute(
                        'aria-pressed',
                        String(selected)
                    );

                    const check =
                        card.querySelector(
                            '[data-notes-photos-adder-check]'
                        );

                    if (check)
                    {
                        check.hidden =
                            !selected;
                    }
                });

            const count =
                pendingCount();

            const countElement =
                modal.querySelector(
                    '[data-notes-photos-adder-count]'
                );

            if (countElement)
            {
                countElement.textContent =
                    countLabel();
            }

            const saveButton =
                modal.querySelector(
                    '[data-notes-photos-adder-save]'
                );

            if (saveButton)
            {
                saveButton.disabled =
                    count === 0;

                saveButton.textContent =
                    actionLabel();
            }
        };

    const processFiles =
        async fileList =>
        {
            const knownSignatures =
                new Set(
                    picker.uploadDrafts
                        .map(draft =>
                            draft.signature
                        )
                );

            const files =
                Array.from(
                    fileList || []
                ).filter(file =>
                {
                    const signature =
                        photoUploadFileSignature(
                            file
                        );

                    if (
                        knownSignatures.has(
                            signature
                        )
                    )
                    {
                        return false;
                    }

                    knownSignatures.add(
                        signature
                    );

                    return true;
                });

            if (!files.length)
            {
                return;
            }

            const results =
                await Promise.all(
                    files.map(
                        async file =>
                        {
                            try
                            {
                                return {
                                    draft:
                        await createPhotoUploadDraft(
                            file,
                            {
                                idPrefix:
                              uploadDraftIdPrefix
                            }
                        ),

                                    error:
                        ''
                                };
                            }
                            catch (error)
                            {
                                return {
                                    draft:
                        null,

                                    error:
                        error?.message
                        || `${
                            file.name
                          || 'File'
                        } — could not be read`
                                };
                            }
                        }
                    )
                );

            if (
                !modalBackdrop
                    .querySelector(
                        '[data-notes-photos-adder]'
                    )
            )
            {
                return;
            }

            picker.uploadDrafts.push(
                ...results
                    .map(result =>
                        result.draft
                    )
                    .filter(Boolean)
            );

            picker.uploadErrors =
                results
                    .map(result =>
                        result.error
                    )
                    .filter(Boolean);

            renderModal();
        };

    const commit = () =>
    {
        if (
            picker.uploadDrafts.some(
                draft =>
                    !photoUploadDraftIsValid(
                        draft
                    )
            )
        )
        {
            picker.uploadErrors = [
                'One or more uploaded photos are no longer valid. Remove them and choose the files again.'
            ];

            picker.sourceTab =
                'upload';

            renderModal();
            return;
        }

        const projectPhotoIds = [
            ...picker.selectedProjectIds
        ].filter(photoId =>
            Boolean(
                getPhoto(
                    photoId,
                    {
                        projectId
                    }
                )
            )
          && !initiallyLinkedIds.has(
              photoId
          )
        );

        const uploadedPhotos =
            picker.uploadDrafts
                .map(draft =>
                    createMediaFromPhotoUpload({
                        projectId,

                        draft,

                        personIds:
                  [],

                        idPrefix:
                  uploadedPhotoIdPrefix
                    })
                )
                .filter(Boolean);

        const addedIds =
            archiveUniqueIds([
                ...projectPhotoIds,

                ...uploadedPhotos.map(
                    photo =>
                        photo.id
                )
            ]);

        if (!addedIds.length)
        {
            return;
        }

        const saved =
            onSave(
                addedIds
            );

        const saveFailed =
            saved === false
          || saved == null
          || (
              typeof saved === 'object'
            && saved.ok === false
          );

        if (saveFailed)
        {
            /*
            Uploaded photos were created before the
            connection write. Remove them if that write
            fails, preventing orphaned media records.
          */
            const uploadedIds =
                new Set(
                    uploadedPhotos.map(
                        photo =>
                            photo.id
                    )
                );

            sampleData.media =
                sampleData.media.filter(
                    photo =>
                        !uploadedIds.has(
                            photo.id
                        )
                );

            showToast(
                'Photos could not be linked.'
            );

            return;
        }

        closeModal({
            force:
            true
        });

        afterSave();

        const message =
            typeof successMessage
            === 'function'
                ? successMessage(
                    addedIds.length
                )
                : successMessage;

        if (message)
        {
            showToast(
                message
            );
        }
    };

    const bindModal = () =>
    {
        const modal =
            modalBackdrop.querySelector(
                '[data-notes-photos-adder]'
            );

        if (!modal)
        {
            return;
        }

        const tabs = [
            ...modal.querySelectorAll(
                '[data-notes-photos-adder-tab]'
            )
        ];

        tabs.forEach(
            (
                tab,
                index
            ) =>
            {
                tab.addEventListener(
                    'click',
                    () =>
                    {
                        const nextTab =
                            tab.dataset
                                .notesPhotosAdderTab;

                        if (
                            ![
                                'project',
                                'upload'
                            ].includes(
                                nextTab
                            )
                  || nextTab
                    === picker.sourceTab
                        )
                        {
                            return;
                        }

                        picker.sourceTab =
                            nextTab;

                        renderModal();
                    }
                );

                tab.addEventListener(
                    'keydown',
                    event =>
                    {
                        if (
                            ![
                                'ArrowLeft',
                                'ArrowRight'
                            ].includes(
                                event.key
                            )
                        )
                        {
                            return;
                        }

                        event.preventDefault();

                        const direction =
                            event.key
                    === 'ArrowRight'
                                ? 1
                                : -1;

                        const nextIndex =
                            (
                                index
                    + direction
                    + tabs.length
                            )
                  % tabs.length;

                        picker.sourceTab =
                            tabs[nextIndex]
                                .dataset
                                .notesPhotosAdderTab;

                        renderModal();

                        requestAnimationFrame(
                            () =>
                            {
                                modalBackdrop
                                    .querySelector(
                                        `[data-notes-photos-adder-tab="${
                                            CSS.escape(
                                                picker.sourceTab
                                            )
                                        }"]`
                                    )
                                    ?.focus();
                            }
                        );
                    }
                );
            }
        );

        modal
            .querySelector(
                '[data-notes-photos-adder-search]'
            )
            ?.addEventListener(
                'input',
                event =>
                {
                    picker.search =
                        event.currentTarget
                            .value;

                    refreshProjectResults();
                }
            );

        const fileInput =
            modal.querySelector(
                '[data-notes-photos-adder-file]'
            );

        modal
            .querySelectorAll(
                '[data-notes-photos-adder-choose-files]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                        fileInput?.click()
                );
            });

        fileInput?.addEventListener(
            'change',
            () =>
                processFiles(
                    fileInput.files
                )
        );

        const dropzone =
            modal.querySelector(
                '[data-notes-photos-adder-dropzone]'
            );

        if (dropzone)
        {
            [
                'dragenter',
                'dragover'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.add(
                            'is-dragging'
                        );
                    }
                );
            });

            [
                'dragleave',
                'drop'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.remove(
                            'is-dragging'
                        );
                    }
                );
            });

            dropzone.addEventListener(
                'drop',
                event =>
                    processFiles(
                        event.dataTransfer
                            ?.files
                    )
            );
        }

        modal.addEventListener(
            'click',
            event =>
            {
                const candidate =
                    event.target.closest(
                        '[data-notes-photos-adder-candidate]'
                    );

                if (candidate)
                {
                    const photoId =
                        candidate.dataset
                            .notesPhotosAdderCandidate;

                    if (
                        initiallyLinkedIds.has(
                            photoId
                        )
                    )
                    {
                        return;
                    }

                    if (
                        picker.selectedProjectIds
                            .has(photoId)
                    )
                    {
                        picker.selectedProjectIds
                            .delete(photoId);
                    }
                    else
                    {
                        picker.selectedProjectIds
                            .add(photoId);
                    }

                    refreshSelectionUi();
                    return;
                }

                const removeUpload =
                    event.target.closest(
                        '[data-notes-photos-adder-remove-upload]'
                    );

                if (removeUpload)
                {
                    picker.uploadDrafts =
                        picker.uploadDrafts
                            .filter(draft =>
                                draft.id
                    !== removeUpload
                        .dataset
                        .notesPhotosAdderRemoveUpload
                            );

                    picker.uploadErrors =
                        [];

                    renderModal();
                    return;
                }

                if (
                    event.target.closest(
                        '[data-notes-photos-adder-clear-search]'
                    )
                )
                {
                    picker.search = '';

                    const searchInput =
                        modal.querySelector(
                            '[data-notes-photos-adder-search]'
                        );

                    if (searchInput)
                    {
                        searchInput.value =
                            '';
                    }

                    refreshProjectResults();

                    searchInput?.focus({
                        preventScroll:
                  true
                    });

                    return;
                }

                if (
                    event.target.closest(
                        '[data-notes-photos-adder-show-upload]'
                    )
                )
                {
                    picker.sourceTab =
                        'upload';

                    renderModal();
                    return;
                }

                if (
                    event.target.closest(
                        '[data-notes-photos-adder-save]'
                    )
                )
                {
                    commit();
                }
            }
        );
    };

    function renderModal()
    {
        openModal(`
          <div
            class="
              modal
              person-photo-picker-modal
              person-photos-adder-modal
              notes-photos-adder-modal
            "
            data-notes-photos-adder
            role="dialog"
            aria-modal="true"
            aria-labelledby="notesPhotosAdderTitle">

            <div class="modal-header">
              <div>
                <h2 id="notesPhotosAdderTitle">
                  ${escapeHtml(
                        title
                    )}
                </h2>

                <p>
                  ${escapeHtml(
                        description
                    )}
                </p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="Close add photos dialog">

                ${icon.close}
              </button>
            </div>

            <div
              class="
                modal-body
                person-photo-picker-body
                person-photos-adder-body
              ">

              <div
                class="person-photo-picker-tabs"
                role="tablist"
                aria-label="Photo source">

                <button
                  class="person-photo-picker-tab"
                  type="button"
                  role="tab"
                  data-notes-photos-adder-tab="project"
                  aria-selected="${
                        picker.sourceTab
                      === 'project'
                    }">

                  Project photos
                </button>

                <button
                  class="person-photo-picker-tab"
                  type="button"
                  role="tab"
                  data-notes-photos-adder-tab="upload"
                  aria-selected="${
                        picker.sourceTab
                      === 'upload'
                    }">

                  Upload new
                </button>
              </div>

              <div
                role="tabpanel"
                aria-label="${
                    picker.sourceTab
                    === 'project'
                        ? 'Project photos'
                        : 'Upload new photos'
                }">

                ${
                    picker.sourceTab
                    === 'project'
                        ? renderProjectPanel()
                        : renderUploadPanel()
                }
              </div>
            </div>
           ${renderFooter()}
          </div>
        `);

        bindModal();
    }

    renderModal();
}

function openNotesPhotosModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    openPhotoLinkModal({
        projectId:
          note.projectId,

        title:
          'Add photos to note',

        description:
          `Selected and uploaded photos will be linked to ${
              note.title
            || 'Untitled note'
          }.`,

        ownerLabel:
          'this note',

        initiallyLinkedPhotoIds:
          getPhotosForNote(
              note.id,
              {
                  projectId:
                note.projectId
              }
          ).map(photo =>
              photo.id
          ),

        uploadDraftIdPrefix:
          'note-photo-upload-draft',

        uploadedPhotoIdPrefix:
          `photo-note-${note.id}`,

        onSave:
          addedIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return false;
              }

              const nextIds =
                  archiveUniqueIds([
                      ...(
                          currentNote
                              .linkedPhotoIds
                  || []
                      ),

                      ...addedIds
                  ]);

              const savedNote =
                  setNotePhotoLinks(
                      currentNote.id,
                      nextIds,
                      {
                          projectId:
                    currentNote.projectId
                      }
                  );

              return Boolean(
                  savedNote
              )
            && addedIds.every(
                photoId =>
                    (
                        savedNote.linkedPhotoIds
                  || []
                    ).includes(
                        photoId
                    )
            );
          },

        afterSave:
          renderNotesPreservingInteraction,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'photo'
                      : 'photos'
              } added to note.`
    });
}

function openNotesPlacesModal(
    {
        noteId =
            state.selectedNoteId,

        /*
          When absent, this remains the normal
          Notes → Places workflow.

          Source → Places supplies a linkContext
          so the same modal can read and save
          Source connections.
        */
        linkContext =
            null,

        selectedIds:
          resumedSelectedIds =
              null,

        query:
          resumedQuery =
              ''
    } = {}
)
{
    const note =
        linkContext
            ? null
            : getNote(
                noteId,
                {
                    includeArchived:
                  true
                }
            );

    const projectId =
        linkContext?.projectId
        || note?.projectId
        || currentProjectId();

    if (
        !projectId
        || (
            !linkContext
          && !note
        )
    )
    {
        return;
    }

    const initialLinkedPlaceIds =
        linkContext
            ? linkContext.initialPlaceIds
            || []
            : note.linkedPlaceIds
            || [];

    const modalTitle =
        linkContext?.title
        || 'Add places';

    const modalSubtitle =
        linkContext?.subtitle
        || note?.title
        || 'Untitled note';

    const validPlace =
        placeId =>
        {
            const place =
                getPlace(
                    placeId
                );

            return (
                place
            && !place.deleted
            && place.projectId
              === projectId
            );
        };

    const initialSelectedIds =
        new Set(
            initialLinkedPlaceIds.filter(
                validPlace
            )
        );

    const selectedIds =
        new Set(
            (
                resumedSelectedIds
            ?? [
                ...initialSelectedIds
            ]
            ).filter(
                validPlace
            )
        );

    const suggestedIds =
        linkContext
            ? new Set(
                linkContext
                    .suggestedPlaceIds
              || []
            )
            : notesSuggestedPlaceIds(
                note
            );

    let query =
        String(
            resumedQuery || ''
        );

    const allPlaces = () =>
        projectPlaces(
            projectId
        );

    const placeNames =
        place => [
            place.name,
            placePrimaryName(
                place
            ),
            placeSecondaryName(
                place
            ),
            ...placeAlternativeNames(
                place
            )
        ]
            .filter(Boolean)
            .map(
                normalizePlaceLookupText
            );

    const placeSearchRank =
        place =>
        {
            const normalizedQuery =
                normalizePlaceLookupText(
                    query
                );

            if (!normalizedQuery)
            {
                return 0;
            }

            const names =
                placeNames(
                    place
                );

            if (
                names.some(
                    name =>
                        name
                  === normalizedQuery
                )
            )
            {
                return 0;
            }

            if (
                names.some(
                    name =>
                        name.startsWith(
                            normalizedQuery
                        )
                )
            )
            {
                return 1;
            }

            if (
                names.some(
                    name =>
                        name.includes(
                            normalizedQuery
                        )
                )
            )
            {
                return 2;
            }

            return Number.POSITIVE_INFINITY;
        };

    const matchedAlternativeName =
        place =>
        {
            const normalizedQuery =
                normalizePlaceLookupText(
                    query
                );

            if (!normalizedQuery)
            {
                return '';
            }

            return (
                placeAlternativeNames(
                    place
                ).find(
                    name =>
                        normalizePlaceLookupText(
                            name
                        ).includes(
                            normalizedQuery
                        )
                )
            || ''
            );
        };

    const visiblePlaces =
        () =>
        {
            const hasQuery =
                Boolean(
                    normalizePlaceLookupText(
                        query
                    )
                );

            return allPlaces()
                .filter(
                    place =>
                        !selectedIds.has(
                            place.id
                        )
                )
                .map(place => ({
                    place,

                    rank:
                hasQuery
                    ? placeSearchRank(
                        place
                    )
                    : suggestedIds.has(
                        place.id
                    )
                        ? 0
                        : 1
                }))
                .filter(
                    item =>
                        Number.isFinite(
                            item.rank
                        )
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.rank
                  - second.rank
                || placePrimaryName(
                    first.place
                ).localeCompare(
                    placePrimaryName(
                        second.place
                    )
                )
                )
                .map(
                    item =>
                        item.place
                );
        };

    const placeConnectionTotal =
        place =>
            Object.values(
                getPlaceConnectionCounts(
                    place.id,
                    {
                        projectId
                    }
                )
            ).reduce(
                (
                    total,
                    count
                ) =>
                    total
              + Number(
                  count || 0
              ),
                0
            );

    const selectionChanged =
        () =>
            initialSelectedIds.size
            !== selectedIds.size
          || [
              ...initialSelectedIds
          ].some(
              placeId =>
                  !selectedIds.has(
                      placeId
                  )
          );

    const renderPlaceIcon =
        () => `
          <span
            class="
              notes-place-result-icon
            "
            aria-hidden="true">

            ${icon.mapPin}
          </span>
        `;

    const renderSelectedPlaces =
        () =>
        {
            const places = [
                ...selectedIds
            ]
                .map(getPlace)
                .filter(place =>
                    place
              && !place.deleted
                );

            if (!places.length)
            {
                return '';
            }

            return `
            <div
              class="
                notes-related-selected-list
                notes-place-selected-chip-list
              ">

              ${places
                    .map(place =>
                    {
                        const primaryName =
                            placePrimaryName(
                                place
                            )
                    || place.name
                    || 'Unnamed place';

                        return `
                    <div
                      class="
                        notes-related-selected-row
                        notes-place-selected-chip
                      ">

                      <span
                        title="${escapeHtml(
                            primaryName
                        )}">

                        ${escapeHtml(
                            primaryName
                        )}
                      </span>

                      <button
                        class="relation-action-button"
                        type="button"
                        data-notes-place-remove="${escapeHtml(
                            place.id
                        )}"
                        aria-label="Remove ${escapeHtml(
                            primaryName
                        )} from selection"
                        title="Remove from selection">

                        ${icon.close}
                      </button>
                    </div>
                  `;
                    })
                    .join('')}
            </div>
          `;
        };

    const renderPlaceResult =
        place =>
        {
            const primaryName =
                placePrimaryName(
                    place
                );

            const secondaryName =
                placeSecondaryName(
                    place
                )
            || 'No broader place recorded';

            const connected =
                placeConnectionTotal(
                    place
                );

            const matchedAlternative =
                matchedAlternativeName(
                    place
                );

            const metaParts = [
                `${connected} ${
                    connected === 1
                        ? 'connected record'
                        : 'connected records'
                }`,

                placeHasCoordinates(
                    place
                )
                    ? 'Mapped'
                    : 'No map position',

                matchedAlternative
                    ? `Matched “${matchedAlternative}”`
                    : ''
            ].filter(Boolean);

            return `
            <label
              class="
                photo-people-result
                notes-place-result
              ">

              ${renderPlaceIcon()}

              <span
                class="
                  photo-people-result-copy
                ">

                <strong>
                  ${escapeHtml(
                        primaryName
                    )}
                </strong>

                <span>
                  ${escapeHtml(
                        secondaryName
                    )}
                </span>

                <span
                  class="
                    notes-place-result-meta
                  ">

                  ${escapeHtml(
                        metaParts.join(
                            ' · '
                        )
                    )}
                </span>
              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    place.id
                )}"
                data-notes-place-choice
                aria-label="Select ${escapeHtml(
                    primaryName
                )}">
            </label>
          `;
        };

    const renderResults =
        places =>
        {
            const projectPlacesList =
                allPlaces();

            if (
                !projectPlacesList.length
            )
            {
                return `
              <div
                class="
                  photo-people-empty
                ">

                <div>
                  <strong>
                    No places yet
                  </strong>

                  <p>
                    Create a place before
                    linking it.
                  </p>
                </div>
              </div>
            `;
            }

            if (places.length)
            {
                return places
                    .map(
                        renderPlaceResult
                    )
                    .join('');
            }

            if (
                normalizePlaceLookupText(
                    query
                )
            )
            {
                return `
              <div
                class="
                  photo-people-empty
                ">

                <div>
                  <strong>
                    No places match
                    this search
                  </strong>

                  <p>
                    Try another place name
                    or historical name.
                  </p>
                  <div
                    class="
                      notes-place-empty-actions
                    ">

                    <button
                      class="
                        button
                        secondary
                      "
                      type="button"
                      data-notes-place-clear-search>
                      Clear search
                    </button>
                  </div>
                </div>
              </div>
            `;
            }

            return `
            <div
              class="
                photo-people-empty
              ">

              <div>
                <strong>
                  All available places
                  are already selected
                </strong>
              </div>
            </div>
          `;
        };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            notes-places-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="notesPlacesTitle">

          <div class="modal-header">
            <div>
              <h2 id="notesPlacesTitle">
                ${escapeHtml(
                    modalTitle
                )}
              </h2>

              <p>
                ${escapeHtml(
                    modalSubtitle
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add places dialog">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              photo-people-body
              notes-places-body
            ">

            <div
              class="
                field
                photo-people-search-field
              ">

              <label
                for="notesPlacesSearch">
                Find places
              </label>

              <div
                class="notes-place-search-toolbar">

                <div class="search-input">
                  ${icon.search}

                  <input
                    id="notesPlacesSearch"
                    type="search"
                    value="${escapeHtml(
                        query
                    )}"
                    data-notes-place-search
                    placeholder="Search by name, broader place, or historical name"
                    autocomplete="off">
                </div>

                <button
                  class="
                    button
                    secondary
                    compact
                  "
                  type="button"
                  data-notes-place-create>

                  ${icon.plus}
                  New place
                </button>
              </div>
            </div>

            <section
              class="
                photo-people-selected-panel
              "
              data-notes-place-selected
              hidden>
            </section>

            <section
              class="
                photo-people-results-panel
              ">

              <div
                class="
                  photo-people-results-head
                ">

                <div
                  class="
                    notes-place-results-heading
                  ">

                  <strong
                    data-notes-place-results-title>
                  </strong>

                  <span
                    data-notes-place-results-meta>
                  </span>
                </div>
              </div>

              <div
                class="
                  photo-people-results
                "
                data-notes-place-results>
              </div>
            </section>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
            ">

            <span
              class="
                photo-people-selection-count
              "
              data-notes-place-count>
            </span>

            <div
              class="
                photo-people-footer-actions
              ">

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="
                  button
                  primary
                  photo-people-save
                "
                type="button"
                data-notes-place-save>
                Save places
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.notes-places-modal'
        );

    if (!modal)
    {
        return;
    }

    const searchInput =
        modal.querySelector(
            '[data-notes-place-search]'
        );

    const selectedPanel =
        modal.querySelector(
            '[data-notes-place-selected]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-notes-place-results]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-notes-place-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-notes-place-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-notes-place-count]'
        );

    const saveButton =
        modal.querySelector(
            '[data-notes-place-save]'
        );

    const refreshSelected =
        () =>
        {
            const html =
                renderSelectedPlaces();

            selectedPanel.hidden =
                !html;

            selectedPanel.innerHTML =
                html;

            localizeUI(
                selectedPanel
            );
        };

    const refreshResults = () =>
    {
        const places =
            visiblePlaces();

        const queryActive =
            Boolean(
                normalizePlaceLookupText(query)
            );

        // Saved connections, independent of draft selections.
        const connectedCount =
            [...initialSelectedIds]
                .filter(validPlace)
                .length;

        const availableLabel =
            queryActive
                ? (
                    places.length === 1
                        ? '{count} match'
                        : '{count} matches'
                )
                : (
                    places.length === 1
                        ? '{count} place available'
                        : '{count} places available'
                );

        resultsTitle.textContent =
            t(
                queryActive
                    ? 'Search results'
                    : 'Suggested places'
            );

        const numberFormatter =
            new Intl.NumberFormat(
                state.language === 'ru'
                    ? 'ru-RU'
                    : 'en-US'
            );

        const availableText =
            t(availableLabel).replace(
                '{count}',
                numberFormatter.format(
                    places.length
                )
            );

        const connectedText =
            t('{count} already connected').replace(
                '{count}',
                numberFormatter.format(
                    connectedCount
                )
            );

        resultsMeta.textContent =
            `${availableText} · ${connectedText}`;

        resultsHost.innerHTML =
            renderResults(places);

        localizeUI(resultsHost);
    };

    const refreshFooter =
        () =>
        {
            const count =
                selectedIds.size;

            countElement.textContent =
                `${count} ${
                    count === 1
                        ? 'place'
                        : 'places'
                } selected`;

            saveButton.disabled =
                !selectionChanged();
        };

    const refresh =
        () =>
        {
            refreshSelected();
            refreshResults();
            refreshFooter();
        };

    const reopenAfterPlaceEditor =
        (
            place = null
        ) =>
        {
            const nextSelectedIds =
                new Set(
                    selectedIds
                );

            if (
                place
            && validPlace(
                place.id
            )
            )
            {
                nextSelectedIds.add(
                    place.id
                );
            }

            const nextQuery =
                query;

            if (linkContext)
            {
                linkContext
                    .renderContext?.();
            }
            else
            {
                renderNotesPreservingInteraction();
            }

            requestAnimationFrame(
                () =>
                {
                    openNotesPlacesModal({
                        noteId:
                  note?.id
                  || noteId,

                        linkContext,

                        selectedIds: [
                            ...nextSelectedIds
                        ],

                        query:
                  nextQuery
                    });
                }
            );
        };

    const openNewPlace =
        () =>
        {
            openPlaceModal(
                null,
                {
                    completion: {
                        onComplete:
                  place =>
                      reopenAfterPlaceEditor(
                          place
                      ),

                        onCancel:
                  () =>
                      reopenAfterPlaceEditor()
                    }
                }
            );
        };

    searchInput
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget
                        .value;

                refreshResults();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-notes-place-choice]'
                );

            if (
                !input
            || !input.checked
            )
            {
                return;
            }

            selectedIds.add(
                input.value
            );

            refresh();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const removeButton =
                event.target.closest(
                    '[data-notes-place-remove]'
                );

            if (removeButton)
            {
                selectedIds.delete(
                    removeButton.dataset
                        .notesPlaceRemove
                );

                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-notes-place-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-place-create]'
                )
            )
            {
                openNewPlace();
                return;
            }

            if (
                event.target.closest(
                    '[data-notes-place-save]'
                )
            )
            {
                if (
                    !selectionChanged()
                )
                {
                    return;
                }

                const nextPlaceIds =
                    [
                        ...selectedIds
                    ];

                let saved;

                if (linkContext)
                {
                    saved =
                        linkContext.onSave?.(
                            nextPlaceIds
                        );
                }
                else
                {
                    setNoteEntityLinks(
                        note.id,
                        'place',
                        nextPlaceIds,
                        {
                            projectId
                        }
                    );

                    saved = true;
                }

                if (saved === false)
                {
                    return;
                }

                closeModal();

                if (linkContext)
                {
                    linkContext.afterSave?.();
                }
                else
                {
                    renderNotesPreservingInteraction();
                }

                showToast(
                    linkContext?.successMessage
            || 'Place links updated.'
                );
            }
        }
    );

    refresh();

    requestAnimationFrame(
        () =>
        {
            searchInput?.focus({
                preventScroll: true
            });
        }
    );
}

function openEventLinkModal({
    projectId,
    title =
        'Add events',
    subtitle =
        '',
    initiallyLinkedEventIds =
        [],
    primaryPersonIds =
        [],
    secondaryPersonIds =
        [],
    alreadyLinkedTarget =
        'this item',
    onSave,
    afterSave =
        () =>
        {},
    successMessage =
        count =>
            `${count} ${
                count === 1
                    ? 'event'
                    : 'events'
            } added.`
} = {})
{
    if (
        !projectId
        || typeof onSave
          !== 'function'
    )
    {
        return;
    }

    const personName =
        person =>
            personResourceDisplayName(
                person
            )
          || person?.names?.display
          || 'Unnamed person';

    const normalizeSearch =
        value =>
            String(
                value || ''
            )
                .trim()
                .toLowerCase();

    const people =
        getPeople(
            projectId
        )
            .filter(person =>
                person?.id
            && !person.deleted
            && person.projectId
              === projectId
            )
            .slice();

    const peopleById =
        new Map(
            people.map(person => [
                person.id,
                person
            ])
        );

    /*
        Events without at least one valid
        Person owner are intentionally excluded.
      */
    const eventsById =
        new Map();

    const eventsByPersonId =
        new Map();

    noteEntityRecords(
        'event',
        projectId
    ).forEach(event =>
    {
        if (!event?.id)
        {
            return;
        }

        const ownerIds =
            placeInspectorEventOwnerIds(
                event
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            );

        if (!ownerIds.length)
        {
            return;
        }

        eventsById.set(
            event.id,
            event
        );

        ownerIds.forEach(personId =>
        {
            if (
                !eventsByPersonId.has(
                    personId
                )
            )
            {
                eventsByPersonId.set(
                    personId,
                    []
                );
            }

            eventsByPersonId
                .get(personId)
                .push(event);
        });
    });

    eventsByPersonId.forEach(
        personEvents =>
        {
            personEvents.sort(
                (
                    first,
                    second
                ) =>
                    placeInspectorEventSortValue(
                        first
                    )
              - placeInspectorEventSortValue(
                  second
              )
              || placeInspectorEventLabel(
                  first
              ).localeCompare(
                  placeInspectorEventLabel(
                      second
                  )
              )
            );
        }
    );

    const initiallyLinkedIds =
        new Set(
            (
                initiallyLinkedEventIds
            || []
            ).filter(eventId =>
                eventsById.has(
                    eventId
                )
            )
        );

    /*
        Only newly selected Events are stored
        here. Existing links stay disabled.
      */
    const selectedIds =
        new Set();

    let query = '';
    let activePersonId = '';
    let mobilePane = 'people';

    const personEvents =
        personId =>
            eventsByPersonId.get(
                personId
            )
          || [];

    const personSearchText =
        person =>
            normalizeSearch(
                [
                    personName(person),
                    person?.names?.first,
                    person?.names?.middle,
                    person?.names?.last,
                    person?.names?.maiden,
                    albumPhotoPersonDates(
                        person
                    ),
                    getPlaceEventDisplay(
                        person?.birth
                    ),
                    getPlaceEventDisplay(
                        person?.death
                    )
                ]
                    .filter(Boolean)
                    .join(' ')
            );

    const eventSearchText =
        (
            event,
            person
        ) =>
        {
            const presentation =
                placeInspectorEventPresentation(
                    event,
                    person.id
                );

            const relatedNames =
                placeInspectorEventRelatedPeople(
                    event,
                    person.id
                )
                    .map(
                        personName
                    )
                    .join(' ');

            return normalizeSearch([
                presentation.title,
                presentation.date,
                presentation.relationship,
                timelinePlaceLabel(
                    event
                ),
                event?.title,
                event?.type,
                event?.typeLabel,
                event?.eventType,
                event?.description,
                event?.notes,
                event?.address,
                relatedNames
            ]
                .filter(Boolean)
                .join(' '));
        };

    const primaryPersonIdSet =
        new Set(
            (
                primaryPersonIds
            || []
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            )
        );

    const secondaryPersonIdSet =
        new Set(
            (
                secondaryPersonIds
            || []
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            )
        );

    const linkedEventOwnerIds =
        new Set();

    initiallyLinkedIds.forEach(
        eventId =>
        {
            const event =
                eventsById.get(
                    eventId
                );

            placeInspectorEventOwnerIds(
                event
            ).forEach(personId =>
            {
                if (
                    peopleById.has(
                        personId
                    )
                )
                {
                    linkedEventOwnerIds.add(
                        personId
                    );
                }
            });
        }
    );

    const personPriority =
        personId =>
        {
            if (
                primaryPersonIdSet.has(
                    personId
                )
            )
            {
                return 0;
            }

            if (
                secondaryPersonIdSet.has(
                    personId
                )
            )
            {
                return 1;
            }

            if (
                linkedEventOwnerIds.has(
                    personId
                )
            )
            {
                return 2;
            }

            return 3;
        };

    const candidatePeople =
        () =>
        {
            const normalizedQuery =
                normalizeSearch(
                    query
                );

            return people
                .map(person =>
                {
                    const allEvents =
                        personEvents(
                            person.id
                        );

                    const personText =
                        personSearchText(
                            person
                        );

                    const personMatched =
                        Boolean(
                            normalizedQuery
                  && personText.includes(
                      normalizedQuery
                  )
                        );

                    const matchingEvents =
                        normalizedQuery
                            ? allEvents.filter(
                                event =>
                                    eventSearchText(
                                        event,
                                        person
                                    ).includes(
                                        normalizedQuery
                                    )
                            )
                            : allEvents;

                    if (
                        normalizedQuery
                && !personMatched
                && !matchingEvents.length
                    )
                    {
                        return null;
                    }

                    const normalizedName =
                        normalizeSearch(
                            personName(person)
                        );

                    let matchRank = 0;

                    if (normalizedQuery)
                    {
                        if (
                            normalizedName
                    === normalizedQuery
                        )
                        {
                            matchRank = 0;
                        }
                        else if (
                            normalizedName.startsWith(
                                normalizedQuery
                            )
                        )
                        {
                            matchRank = 1;
                        }
                        else if (
                            personMatched
                        )
                        {
                            matchRank = 2;
                        }
                        else
                        {
                            /*
                    The query matched one or more
                    Events rather than the Person.
                  */
                            matchRank = 3;
                        }
                    }

                    return {
                        person,
                        allEvents,
                        matchingEvents,
                        personMatched,
                        matchRank,
                        priority:
                  personPriority(
                      person.id
                  )
                    };
                })
                .filter(Boolean)
                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.matchRank
                  - second.matchRank
                || first.priority
                  - second.priority
                || personName(
                    first.person
                ).localeCompare(
                    personName(
                        second.person
                    )
                )
                );
        };

    const visibleEventsForPerson =
        person =>
        {
            const allEvents =
                personEvents(
                    person.id
                );

            const normalizedQuery =
                normalizeSearch(
                    query
                );

            if (
                !normalizedQuery
            || personSearchText(
                person
            ).includes(
                normalizedQuery
            )
            )
            {
                return allEvents;
            }

            return allEvents.filter(
                event =>
                    eventSearchText(
                        event,
                        person
                    ).includes(
                        normalizedQuery
                    )
            );
        };

    /*
        Automatically select a contextual Person,
        but do not select an arbitrary alphabetical
        Person when the Note has no context.
      */
    const preferredPersonIds = [
        ...primaryPersonIdSet,
        ...secondaryPersonIdSet,
        ...linkedEventOwnerIds
    ];

    activePersonId =
        preferredPersonIds.find(
            personId =>
                peopleById.has(
                    personId
                )
        )
        || '';

    if (activePersonId)
    {
        mobilePane =
            'events';
    }

    const renderPersonResults =
        candidates =>
        {
            if (!candidates.length)
            {
                return `
              <div class="notes-event-empty">
                <strong>
                  No people match this search
                </strong>

                <span>
                  Try another name, date,
                  family branch, Event, or place.
                </span>

                <button
                  class="button secondary"
                  type="button"
                  data-notes-event-clear-search>
                  Clear search
                </button>
              </div>
            `;
            }

            return candidates
                .map(candidate =>
                {
                    const person =
                        candidate.person;

                    const name =
                        personName(
                            person
                        );

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                || 'Dates unknown';

                    const eventCount =
                        candidate.personMatched
                || !normalizeSearch(
                    query
                )
                            ? candidate
                                .allEvents
                                .length
                            : candidate
                                .matchingEvents
                                .length;

                    const eventCountLabel =
                        normalizeSearch(
                            query
                        )
                && !candidate
                    .personMatched
                            ? `${eventCount} matching ${
                                eventCount === 1
                                    ? 'event'
                                    : 'events'
                            }`
                            : `${eventCount} ${
                                eventCount === 1
                                    ? 'event'
                                    : 'events'
                            }`;

                    const active =
                        person.id
                  === activePersonId;

                    return `
                <button
                  class="
                    notes-event-person-result
                    ${
                        active
                            ? 'active'
                            : ''
                    }
                  "
                  type="button"
                  data-notes-event-person="${escapeHtml(
                        person.id
                    )}"
                  aria-pressed="${active}"
                  aria-label="View events for ${escapeHtml(
                        name
                    )}">

                  ${renderPersonAvatar(
                        person,
                        'notes-event-person-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span class="notes-event-person-copy">
                    <strong>
                      ${escapeHtml(
                            name
                        )}
                    </strong>

                    <span>
                      ${escapeHtml(
                            dates
                        )}
                    </span>

                    <span class="notes-event-person-count">
                      ${escapeHtml(
                            eventCountLabel
                        )}
                    </span>
                  </span>

                  <span
                    class="notes-event-person-chevron"
                    aria-hidden="true">
                    ${icon.chevron}
                  </span>
                </button>
              `;
                })
                .join('');
        };

    const renderEventRow =
        (
            event,
            person
        ) =>
        {
            const presentation =
                placeInspectorEventPresentation(
                    event,
                    person.id
                );

            const place =
                timelinePlaceLabel(
                    event
                );

            const alreadyLinked =
                initiallyLinkedIds.has(
                    event.id
                );

            const selected =
                selectedIds.has(
                    event.id
                );

            const ariaLabel =
                alreadyLinked
                    ? `${
                        presentation.title
                    } is already linked to ${
                        alreadyLinkedTarget
                    }`
                    : `${
                        selected
                            ? 'Remove'
                            : 'Add'
                    } ${
                        presentation.title
                    }`;

            return `
            <label
              class="
                notes-event-result
                ${
                    alreadyLinked
                        ? 'is-complete'
                        : ''
                }
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
              ">

              <span
                class="notes-event-result-icon"
                aria-hidden="true">
                ${timelineEventIcon(
                    event
                )}
              </span>

              <span class="notes-event-result-copy">
                <strong>
                  ${escapeHtml(
                        presentation.title
                    )}
                </strong>

                <span class="notes-event-result-date">
                  ${escapeHtml(
                        presentation.date
                    || 'Date unknown'
                    )}
                </span>

                ${
                    place
                        ? `
                      <span>
                        ${escapeHtml(
                            place
                        )}
                      </span>
                    `
                        : ''
                }

                ${
                    presentation
                        .relationship
                        ? `
                      <span class="notes-event-result-relationship">
                        ${escapeHtml(
                            presentation
                                .relationship
                        )}
                      </span>
                    `
                        : ''
                }
              </span>

              <span class="notes-event-result-end">
                ${
                    alreadyLinked
                        ? `
                      <span class="notes-event-already-added">
                        Already added
                      </span>
                    `
                        : ''
                }

                <input
                  type="checkbox"
                  value="${escapeHtml(
                        event.id
                    )}"
                  data-notes-event-choice
                  aria-label="${escapeHtml(
                        ariaLabel
                    )}"
                  ${
                        alreadyLinked
                    || selected
                            ? 'checked'
                            : ''
                    }
                  ${
                        alreadyLinked
                            ? 'disabled'
                            : ''
                    }>
              </span>
            </label>
          `;
        };

    const renderTimeline =
        person =>
        {
            if (!person)
            {
                return `
              <div class="notes-event-timeline-empty">
                <span
                  class="notes-event-timeline-empty-icon"
                  aria-hidden="true">
                  ${icon.calendar}
                </span>

                <strong>
                  Select a person
                </strong>

                <span>
                  Choose a Person to view
                  Events that belong to or
                  involve them.
                </span>
              </div>
            `;
            }

            const name =
                personName(
                    person
                );

            const allEvents =
                personEvents(
                    person.id
                );

            const visibleEvents =
                visibleEventsForPerson(
                    person
                );

            const dates =
                albumPhotoPersonDates(
                    person
                )
            || 'Dates unknown';

            const eventMeta =
                visibleEvents.length
              === allEvents.length
                    ? `${allEvents.length} recorded ${
                        allEvents.length === 1
                            ? 'event'
                            : 'events'
                    }`
                    : `${visibleEvents.length} matching of ${
                        allEvents.length
                    } events`;

            return `
            <div class="notes-event-person-header">

              <button
                class="
                  button
                  secondary
                  compact
                  notes-event-back
                "
                type="button"
                data-notes-event-back>
                ${icon.chevron}
                People
              </button>

              ${renderPersonAvatar(
                    person,
                    'notes-event-active-avatar',
                    {
                        element:
                    'span'
                    }
                )}

              <span class="notes-event-active-copy">
                <strong>
                  ${escapeHtml(
                        name
                    )}
                </strong>

                <span>
                  ${escapeHtml(
                        dates
                    )}
                </span>

                <span>
                  ${escapeHtml(
                        eventMeta
                    )}
                </span>
              </span>
            </div>

            <div class="notes-event-results">
              ${
                    visibleEvents.length
                        ? visibleEvents
                            .map(event =>
                                renderEventRow(
                                    event,
                                    person
                                )
                            )
                            .join('')
                        : `
                    <div class="notes-event-empty">
                      <strong>
                        No events recorded for
                        ${escapeHtml(
                            name
                        )}
                      </strong>

                      <span>
                        Events must be created
                        from this Person’s
                        profile before they can
                        be linked to the Note.
                      </span>
                    </div>
                  `
                }
            </div>
          `;
        };

    openModal(`
        <div
          class="
            modal
            notes-events-modal
            ${
                mobilePane
                === 'events'
                    ? 'is-showing-events'
                    : 'is-showing-people'
            }
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="notesEventsTitle">

          <div class="modal-header">
            <div>
              <h2 id="notesEventsTitle">
                ${escapeHtml(
                    title
                )}
              </h2>

              ${
                    subtitle
                        ? `
                    <p>
                      ${escapeHtml(
                            subtitle
                        )}
                    </p>
                  `
                        : ''
                }
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add events dialog">
              ${icon.close}
            </button>
          </div>

          <div class="notes-event-picker-body">

            <div class="notes-event-picker-grid">

              <section
                class="notes-event-person-pane"
                aria-label="People">

                <div
                  class="
                    field
                    notes-event-search-field
                  ">

                  <label for="notesEventPersonSearch">
                    Find a person
                  </label>

                  <div class="search-input">
                    ${icon.search}

                    <input
                      id="notesEventPersonSearch"
                      type="search"
                      data-notes-event-search
                      placeholder="Search by person, event, date, or place"
                      autocomplete="off">
                  </div>
                </div>

                <div class="notes-event-person-results-head">
                  <strong
                    data-notes-event-person-title>
                    Suggested people
                  </strong>

                  <span
                    data-notes-event-person-meta>
                  </span>
                </div>

                <div
                  class="notes-event-person-results"
                  data-notes-event-person-results>
                </div>
              </section>

              <section
                class="notes-event-timeline-pane"
                data-notes-event-timeline
                aria-label="Person events">
              </section>
            </div>
          </div>

          <div
            class="
              modal-footer
              notes-event-picker-footer
            ">

            <span
              class="notes-event-selection-count"
              data-notes-event-count
              aria-live="polite">
              0 events selected
            </span>

            <div class="notes-event-footer-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-notes-event-save
                disabled>
                Add events
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.notes-events-modal'
        );

    if (!modal)
    {
        return;
    }

    const searchInput =
        modal.querySelector(
            '[data-notes-event-search]'
        );

    const peopleTitle =
        modal.querySelector(
            '[data-notes-event-person-title]'
        );

    const peopleMeta =
        modal.querySelector(
            '[data-notes-event-person-meta]'
        );

    const peopleHost =
        modal.querySelector(
            '[data-notes-event-person-results]'
        );

    const timelineHost =
        modal.querySelector(
            '[data-notes-event-timeline]'
        );

    const countElement =
        modal.querySelector(
            '[data-notes-event-count]'
        );

    const saveButton =
        modal.querySelector(
            '[data-notes-event-save]'
        );

    const refreshPeople =
        candidates =>
        {
            peopleTitle.textContent =
                normalizeSearch(
                    query
                )
                    ? 'Search results'
                    : 'Suggested people';

            peopleMeta.textContent =
                `${candidates.length} ${
                    candidates.length === 1
                        ? 'person'
                        : 'people'
                }`;

            peopleHost.innerHTML =
                renderPersonResults(
                    candidates
                );
        };

    const refreshTimeline =
        () =>
        {
            const person =
                peopleById.get(
                    activePersonId
                )
            || null;

            timelineHost.innerHTML =
                renderTimeline(
                    person
                );
        };

    const refreshFooter =
        () =>
        {
            const count =
                selectedIds.size;

            countElement.textContent =
                `${count} ${
                    count === 1
                        ? 'event'
                        : 'events'
                } selected`;

            saveButton.disabled =
                count === 0;

            saveButton.textContent =
                count
                    ? `Add ${count} ${
                        count === 1
                            ? 'event'
                            : 'events'
                    }`
                    : 'Add events';
        };

    const refresh = () =>
    {
        const candidates =
            candidatePeople();

        const candidateIds =
            new Set(
                candidates.map(
                    candidate =>
                        candidate.person.id
                )
            );

        if (
            activePersonId
          && !candidateIds.has(
              activePersonId
          )
        )
        {
            activePersonId =
                '';

            mobilePane =
                'people';
        }

        modal.classList.toggle(
            'is-showing-events',
            mobilePane
            === 'events'
        );

        modal.classList.toggle(
            'is-showing-people',
            mobilePane
            === 'people'
        );

        refreshPeople(
            candidates
        );

        refreshTimeline();
        refreshFooter();

        localizeUI(
            modal
        );
    };

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget
                    .value;

            mobilePane =
                'people';

            refresh();
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-notes-event-choice]'
                );

            if (
                !input
            || input.disabled
            )
            {
                return;
            }

            const eventId =
                input.value;

            const choiceIndex = [
                ...modal.querySelectorAll(
                    '[data-notes-event-choice]'
                )
            ].indexOf(input);

            if (input.checked)
            {
                selectedIds.add(eventId);
            }
            else
            {
                selectedIds.delete(eventId);
            }

            refresh();

            restoreModalChoiceFocus({
                modal,
                selector:
              '[data-notes-event-choice]',
                value:
              eventId,
                index:
              choiceIndex,
                fallbackSelector:
              '[data-notes-event-search]'
            });
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const personButton =
                event.target.closest(
                    '[data-notes-event-person]'
                );

            if (personButton)
            {
                activePersonId =
                    personButton.dataset
                        .notesEventPerson;

                mobilePane =
                    'events';

                refresh();

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-back]'
                )
            )
            {
                mobilePane =
                    'people';

                refresh();

                requestAnimationFrame(
                    () =>
                    {
                        searchInput?.focus({
                            preventScroll:
                    true
                        });
                    }
                );

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                refresh();

                searchInput?.focus({
                    preventScroll:
                true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-save]'
                )
            )
            {
                if (!selectedIds.size)
                {
                    return;
                }
                const nextIds =
                    [
                        ...selectedIds
                    ];

                const saved =
                    onSave(
                        nextIds
                    );

                if (
                    saved === false
                )
                {
                    return;
                }

                const addedCount =
                    Number.isFinite(
                        saved?.addedLinkCount
                    )
                        ? saved.addedLinkCount
                        : nextIds.length;

                closeModal();

                afterSave();

                showToast(
                    typeof successMessage
                === 'function'
                        ? successMessage(
                            addedCount
                        )
                        : successMessage
                );
            }
        }
    );

    refresh();

    requestAnimationFrame(
        () =>
        {
            if (
                window.innerWidth > 720
            || mobilePane
              === 'people'
            )
            {
                searchInput?.focus({
                    preventScroll: true
                });
            }
        }
    );
}

function openNotesEventsModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const secondaryPersonIds =
        getPhotosForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        )
            .flatMap(photo =>
                photo.personIds
            || []
            );

    openEventLinkModal({
        projectId:
          note.projectId,

        title:
          'Add events',

        subtitle:
          note.title
          || 'Untitled note',

        initiallyLinkedEventIds:
          note.linkedEventIds
          || [],

        primaryPersonIds:
          note.linkedPersonIds
          || [],

        secondaryPersonIds,

        alreadyLinkedTarget:
          'this note',

        onSave:
          selectedEventIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  showToast(
                      'The note is no longer available.'
                  );

                  return false;
              }

              const nextEventIds =
                  archiveUniqueIds([
                      ...(
                          currentNote.linkedEventIds
                  || []
                      ),

                      ...selectedEventIds
                  ]);

              setNoteEntityLinks(
                  currentNote.id,
                  'event',
                  nextEventIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'event'
                      : 'events'
              } added to note.`
    });
}

function openArchiveFilesEventsModal(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    const ids =
        files.map(file =>
            file.id
        );

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    const primaryPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    const secondaryPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                sourceIdsForTarget(
                    'file',
                    file.id,
                    file.projectId
                ).flatMap(sourceId =>
                    sourceTargetIds(
                        sourceId,
                        'person',
                        file.projectId
                    )
                )
            )
        );

    const initiallyLinkedEventIds =
        singleFile
            ? singleFile.linkedEventIds
            || []
            : archiveCommonFileConnectionIds(
                files,
                'event'
            );

    openEventLinkModal({
        projectId:
          files[0].projectId
          || currentProjectId(),

        title:
          'Add events',

        subtitle:
          archiveBulkLinkSubtitle(
              files
          ),

        /*
          Events linked to all selected files are
          displayed as already linked. Events linked
          to only some files remain selectable.
        */
        initiallyLinkedEventIds,

        primaryPersonIds,

        secondaryPersonIds,

        alreadyLinkedTarget:
          singleFile
              ? 'this file'
              : 'all selected files',

        onSave:
          selectedEventIds =>
          {
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      showToast(
                          'The file is no longer available.'
                      );

                      return false;
                  }

                  return setArchiveFileConnectionIds(
                      currentFile.id,
                      'event',
                      [
                          ...(
                              currentFile.linkedEventIds
                    || []
                          ),

                          ...selectedEventIds
                      ]
                  );
              }
              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'event',

                      recordIds:
                  selectedEventIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No events were linked.'
                  );

                  return false;
              }

              return result;
          },

        afterSave:
          singleFile
              ? renderArchive
              : () =>
              {
                  finishArchiveBulkLinkAction(
                      ids
                  );
              },

        successMessage:
          singleFile
              ? count =>
                  `${count} ${
                      count === 1
                          ? 'event'
                          : 'events'
                  } added to file.`
              : count =>
                  `${count} ${
                      count === 1
                          ? 'link was'
                          : 'links were'
                  } added to ${files.length} files.`
    });
}

function openArchiveFileEventsModal(
    fileId
)
{
    openArchiveFilesEventsModal(
        [
            fileId
        ]
    );
}

function openNoteFilesModal(
    noteId =
        state.selectedNoteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return;
    }

    const title =
        note.title
        || 'Untitled note';

    openConnectedFilesModal({
        projectId:
          note.projectId
          || currentProjectId(),

        title:
          'Add files',

        subtitle:
          `Connect Archive files to “${title}”.`,

        existingFileIds:
          note.linkedArchiveFileIds
          || [],

        onSave:
          fileIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return {
                      ok:
                  false
                  };
              }

              const nextIds =
                  archiveUniqueIds([
                      ...(
                          currentNote
                              .linkedArchiveFileIds
                  || []
                      ),

                      ...fileIds
                  ]);

              setNoteEntityLinks(
                  currentNote.id,
                  'archiveFile',
                  nextIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              const saved =
                  fileIds.every(fileId =>
                      (
                          currentNote
                              .linkedArchiveFileIds
                  || []
                      ).includes(
                          fileId
                      )
                  );

              return {
                  ok:
                saved,

                  changedCount:
                saved
                    ? fileIds.length
                    : 0
              };
          },

        afterSave:
          () =>
          {
              renderNotesPreservingInteraction();
          },

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'file'
                      : 'files'
              } added to note.`
    });
}
function openNotesLinkEntityModal(
    type
)
{
    if (
        type === 'archiveFile'
    )
    {
        openNoteFilesModal();
        return;
    }

    if (
        type === 'photo'
    )
    {
        openNotesPhotosModal();
        return;
    }

    if (
        type === 'person'
    )
    {
        openNotesPeopleModal();
        return;
    }

    if (
        type === 'event'
    )
    {
        openNotesEventsModal();
        return;
    }

    if (
        type === 'place'
    )
    {
        openNotesPlacesModal();
        return;
    }

    if (
        type === 'source'
    )
    {
        const note =
            selectedNote();

        if (!note)
        {
            return;
        }

        openSourcesForTargetModal({
            targetType:
            'note',

            targetId:
            note.id,

            projectId:
            note.projectId,

            title:
            'Add sources',

            subtitle:
            `Connect existing sources to ${
                note.title
              || 'this note'
            }.`,

            afterSave:
            renderNotesPreservingInteraction
        });
    }
}

/*
      Shared note picker

      Used by:
      - Notes → Add related note
      - Albums inspector → Add note
      - Family Tree inspector → Add note later

      The picker only stages and adds new links.
      Existing links are displayed as disabled rows
      when they appear in search results.

      Removing an existing link remains a contextual
      action in the sidebar/editor where that link is shown.
    */

function notePickerSharedIds(
    firstValues = [],
    secondValues = []
)
{
    const secondIds =
        new Set(
            secondValues || []
        );

    return [
        ...new Set(
            firstValues || []
        )
    ].filter(id =>
        secondIds.has(id)
    );
}

function relatedNotePickerSuggestionScore(
    sourceNote,
    candidate
)
{
    if (
        !sourceNote
        || !candidate
    )
    {
        return 0;
    }

    let score = 0;

    const entityWeights = {
        person: 9,
        event: 8,
        source: 7,
        archiveFile: 7,
        place: 5,
        photo: 4
    };

    Object.entries(
        entityWeights
    ).forEach(([
        type,
        weight
    ]) =>
    {
        const config =
            getNoteEntityConfig(
                type
            );

        if (!config)
        {
            return;
        }

        score +=
            notePickerSharedIds(
                noteEntityLinkedIds(
                    sourceNote,
                    type
                ),
                noteEntityLinkedIds(
                    candidate,
                    type
                )
            ).length
          * weight;
    });

    score +=
        notePickerSharedIds(
            sourceNote.collectionIds,
            candidate.collectionIds
        ).length
        * 2;

    score +=
        notePickerSharedIds(
            sourceNote.tags,
            candidate.tags
        ).length
        * 2;

    return score;
}

function openNoteLinkPickerModal({
    projectId =
        currentProjectId(),

    title =
        'Add notes',

    description =
        'Link existing notes.',

    helperText =
        '',

    searchPlaceholder =
        'Search by title, content, person, place, or source',

    existingNoteIds =
        [],

    excludeNoteIds =
        [],

    /*
        Notes relationships can include archived Notes.
        Albums should pass false to preserve its current
        active-Notes-only linking rule.
      */
    includeArchived =
        false,

    existingStatus =
        'Already linked',

    existingMetaLabel =
        'already linked',

    createLabel =
        'Create note',

    onCreate =
        null,

    getSuggestionScore =
        () => 0,

    onSave,

    afterSave =
        null,

    successMessage =
        null,

    modalOpener =
        openModal
} = {})
{
    if (
        !projectId
        || typeof onSave
          !== 'function'
    )
    {
        return;
    }

    const existingIds =
        new Set(
            (
                existingNoteIds
            || []
            ).filter(Boolean)
        );

    const excludedIds =
        new Set(
            (
                excludeNoteIds
            || []
            ).filter(Boolean)
        );

    /*
        selectedIds contains only new links.
        Existing links are never removed by
        this modal.
      */
    const selectedIds =
        new Set();

    let query = '';
    let showArchived = false;

    const normalizeQuery =
        value =>
            String(
                value || ''
            )
                .trim()
                .toLowerCase();

    const allCandidates =
        () =>
            getProjectNotes(
                projectId,
                {
                    includeArchived
                }
            ).filter(note =>
                !excludedIds.has(
                    note.id
                )
            );

    const visibleCandidates =
        () =>
        {
            const normalized =
                normalizeQuery(
                    query
                );

            return allCandidates()
            /*
              Selected Notes move into the
              selected review panel.
            */
                .filter(note =>
                    !selectedIds.has(
                        note.id
                    )
                )
                .filter(note =>
                {
                    const alreadyLinked =
                        existingIds.has(
                            note.id
                        );

                    /*
                Preserve the Notes modal behavior:
                an archived existing link can still
                appear in a direct search.
              */
                    if (
                        note.archived
                && !showArchived
                && !alreadyLinked
                    )
                    {
                        return false;
                    }

                    if (normalized)
                    {
                        return noteSearchText(
                            note
                        ).includes(
                            normalized
                        );
                    }

                    /*
                Existing links do not occupy the
                default suggestion list.
              */
                    return !alreadyLinked;
                })
                .map(note => ({
                    note,

                    score:
                Number(
                    getSuggestionScore(
                        note
                    )
                )
                || 0
                }))
                .sort(
                    (
                        first,
                        second
                    ) =>
                    /*
                  Active Notes appear before archived
                  Notes even when the archived Note
                  has a higher relevance score.
                */
                        Number(
                            Boolean(
                                first.note.archived
                            )
                        )
                - Number(
                    Boolean(
                        second.note.archived
                    )
                )
                || second.score
                  - first.score
                || (
                    Date.parse(
                        second.note.updatedAt
                      || ''
                    )
                    || 0
                )
                  - (
                      Date.parse(
                          first.note.updatedAt
                        || ''
                      )
                      || 0
                  )
                || String(
                    first.note.title
                    || ''
                ).localeCompare(
                    String(
                        second.note.title
                      || ''
                    )
                )
                );
        };

    const renderResult =
        ({
            note
        }) =>
        {
            const noteTitle =
                note.title
            || 'Untitled note';

            const alreadyLinked =
                existingIds.has(
                    note.id
                );

            return `
            <label
              class="
                notes-related-choice
                ${
                    alreadyLinked
                        ? 'already-related'
                        : ''
                }
                ${
                    note.archived
                        ? 'archived'
                        : ''
                }
              ">

              ${renderRelatedNoteIcon(
                    'notes-related-choice-icon'
                )}

              <span
                class="
                  notes-related-choice-copy
                ">

                <span
                  class="
                    notes-related-choice-title-line
                  ">

                  <strong>
                    ${escapeHtml(
                        noteTitle
                    )}
                  </strong>

                  ${
                        note.archived
                            ? `
                        <span
                          class="
                            notes-related-archived-badge
                          ">
                          Archived
                        </span>
                      `
                            : ''
                    }
                </span>

                <span
                  class="
                    notes-related-choice-excerpt
                  ">
                  ${escapeHtml(
                        noteExcerpt(
                            note,
                            150
                        )
                    || 'No note content'
                    )}
                </span>

                ${renderRelatedNoteCollectionChips(
                    note
                )}
              </span>

              ${
                    alreadyLinked
                        ? `
                    <span
                      class="
                        notes-related-choice-status
                      ">
                      ${escapeHtml(
                            existingStatus
                        )}
                    </span>
                  `
                        : ''
                }

              <input
                type="checkbox"
                value="${escapeHtml(
                    note.id
                )}"
                data-note-picker-choice
                ${
                    alreadyLinked
                        ? 'checked disabled'
                        : ''
                }
                aria-label="${
                    alreadyLinked
                        ? `${escapeHtml(
                            existingStatus
                        )}: ${escapeHtml(
                            noteTitle
                        )}`
                        : `Select ${escapeHtml(
                            noteTitle
                        )}`
                }">
            </label>
          `;
        };

    const renderEmptyState =
        () =>
        {
            const normalized =
                normalizeQuery(
                    query
                );

            const candidates =
                allCandidates();

            if (!candidates.length)
            {
                return `
              <div
                class="
                  notes-related-empty
                ">

                <strong>
                  No notes available
                </strong>

                <span>
                  Create a Note first, then return
                  here to link it.
                </span>
              </div>
            `;
            }

            if (normalized)
            {
                return `
              <div
                class="
                  notes-related-empty
                ">

                <strong>
                  No notes match this search
                </strong>

                <span>
                  Try another title, person, place,
                  collection, or source.
                </span>

                <button
                  class="button secondary"
                  type="button"
                  data-note-picker-clear-search>
                  Clear search
                </button>
              </div>
            `;
            }

            const unlinkedCandidates =
                candidates.filter(note =>
                    !existingIds.has(
                        note.id
                    )
                );

            if (
                !unlinkedCandidates.length
            )
            {
                return `
              <div
                class="
                  notes-related-empty
                ">

                <strong>
                  All available notes are linked
                </strong>

                <span>
                  No additional Notes are available
                  for this item.
                </span>
              </div>
            `;
            }

            if (
                includeArchived
            && !showArchived
            && unlinkedCandidates.every(
                note =>
                    note.archived
            )
            )
            {
                return `
              <div
                class="
                  notes-related-empty
                ">

                <strong>
                  No active notes available
                </strong>

                <span>
                  Enable “Show archived” to review
                  archived Notes.
                </span>
              </div>
            `;
            }

            return `
            <div
              class="
                notes-related-empty
              ">

              <strong>
                No notes available
              </strong>
            </div>
          `;
        };

    const renderSelectedNotes =
        () =>
        {
            const notes =
                [...selectedIds]
                    .map(noteId =>
                        getNote(
                            noteId,
                            {
                                projectId,
                                includeArchived:
                      true
                            }
                        )
                    )
                    .filter(Boolean)
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            String(
                                first.title
                    || ''
                            ).localeCompare(
                                String(
                                    second.title
                      || ''
                                )
                            )
                    );

            if (!notes.length)
            {
                return '';
            }

            return `
            <div
              class="
                notes-related-selected-list
              ">

              ${notes
                    .map(note =>
                    {
                        const noteTitle =
                            note.title
                    || 'Untitled note';

                        return `
                    <div
                      class="
                        notes-related-selected-row
                      ">

                      <span>
                        ${escapeHtml(
                            noteTitle
                        )}
                      </span>

                      <button
                        class="
                          relation-action-button
                        "
                        type="button"
                        data-note-picker-remove="${escapeHtml(
                            note.id
                        )}"
                        aria-label="Remove ${escapeHtml(
                            noteTitle
                        )} from selection"
                        title="Remove from selection">

                        ${icon.close}
                      </button>
                    </div>
                  `;
                    })
                    .join('')}
            </div>
          `;
        };

    modalOpener(`
        <div
          class="
            modal
            notes-related-modal
            note-link-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="noteLinkPickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="noteLinkPickerTitle">
                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    description
                )}
              </p>

              ${
                    helperText
                        ? `
                    <p
                      class="
                        notes-related-reciprocal-note
                      ">
                      ${escapeHtml(
                            helperText
                        )}
                    </p>
                  `
                        : ''
                }
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close note picker">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              notes-related-modal-body
            ">

            <section
              class="
                notes-related-picker-view
              ">

              <div
                class="
                  notes-related-toolbar
                ">

                <label
                  class="app-search-field"
                  aria-label="Search notes">

                  ${icon.search}

                  <input
                    type="search"
                    autocomplete="off"
                    data-note-picker-search
                    placeholder="${escapeHtml(
                        searchPlaceholder
                    )}">
                </label>

                ${
                    includeArchived
                  || typeof onCreate
                    === 'function'
                        ? `
                      <div
                        class="
                          note-link-picker-toolbar-actions
                        ">

                        ${
                            includeArchived
                                ? `
                              <label
                                class="
                                  notes-related-archived-toggle
                                ">

                                <input
                                  type="checkbox"
                                  data-note-picker-show-archived>

                                <span>
                                  Show archived
                                </span>
                              </label>
                            `
                                : ''
                        }

                        ${
                            typeof onCreate
                            === 'function'
                                ? `
                              <button
                                class="button secondary"
                                type="button"
                                data-note-picker-create>

                                ${icon.plus}

                                ${escapeHtml(
                                    createLabel
                                )}
                              </button>
                            `
                                : ''
                        }
                      </div>
                    `
                        : ''
                }
              </div>

              <section
                class="
                  notes-related-selected-panel
                "
                data-note-picker-selected
                hidden>
              </section>

              <section
                class="
                  notes-related-results-panel
                ">

                <div
                  class="
                    notes-related-results-head
                  ">

                  <div>
                    <strong
                      data-note-picker-results-title>
                      Suggested notes
                    </strong>

                    <span
                      data-note-picker-results-meta>
                    </span>
                  </div>
                </div>

                <div
                  class="
                    notes-related-results
                  "
                  data-note-picker-results>
                </div>
              </section>
            </section>
          </div>

          <div
            class="
              modal-footer
              notes-related-footer
            ">

            <span
              class="
                notes-related-selection-count
              "
              data-note-picker-count
              aria-live="polite">
              0 notes selected
            </span>

            <div
              class="
                notes-related-footer-actions
              ">

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-note-picker-save
                disabled>
                Add notes
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.note-link-picker-modal'
        );

    if (!modal)
    {
        return;
    }

    const searchInput =
        modal.querySelector(
            '[data-note-picker-search]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-note-picker-results]'
        );

    const selectedHost =
        modal.querySelector(
            '[data-note-picker-selected]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-note-picker-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-note-picker-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-note-picker-count]'
        );

    const saveButton =
        modal.querySelector(
            '[data-note-picker-save]'
        );

    const refresh =
        () =>
        {
            const visible =
                visibleCandidates();

            const normalized =
                normalizeQuery(
                    query
                );

            resultsTitle.textContent = translateText(
                normalized ? 'Search results' : 'Suggested notes'
            );

            if (state.language === 'ru')
            {
                const availability = normalized
                    ? `Найдено заметок: ${visible.length}`
                    : `Доступно заметок: ${visible.length}`;

                const connectionStatus =
                    existingMetaLabel === 'already related'
                        ? 'Уже связанных'
                        : 'Уже добавленных';

                resultsMeta.textContent =
                    `${availability} · ${connectionStatus}: ${existingIds.size}`;
            }
            else
            {
                const availability = normalized
                    ? `${visible.length} ${
                        visible.length === 1 ? 'match' : 'matches'
                    }`
                    : `${visible.length} ${
                        visible.length === 1 ? 'note' : 'notes'
                    } available`;

                resultsMeta.textContent =
                    `${availability} · ${existingIds.size} ${existingMetaLabel}`;
            }

            resultsHost.innerHTML =
                visible.length
                    ? visible
                        .map(renderResult)
                        .join('')
                    : renderEmptyState();

            const selectedHtml =
                renderSelectedNotes();

            selectedHost.hidden =
                !selectedHtml;

            selectedHost.innerHTML =
                selectedHtml;

            const count =
                selectedIds.size;

            countElement.textContent =
                `${count} ${
                    count === 1
                        ? 'note'
                        : 'notes'
                } selected`;

            saveButton.disabled =
                count === 0;

            saveButton.textContent =
                count === 1
                    ? 'Add note'
                    : count > 1
                        ? `Add ${count} notes`
                        : 'Add notes';

            localizeUI(
                modal
            );
        };

    searchInput
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget
                        .value;

                refresh();
            }
        );

    modal
        .querySelector(
            '[data-note-picker-show-archived]'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                showArchived =
                    event.currentTarget
                        .checked;

                refresh();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-note-picker-choice]'
                );

            if (
                !input
            || input.disabled
            )
            {
                return;
            }

            const choiceIndex = [
                ...modal.querySelectorAll(
                    '[data-note-picker-choice]'
                )
            ].indexOf(input);

            if (input.checked)
            {
                selectedIds.add(
                    input.value
                );
            }
            else
            {
                selectedIds.delete(
                    input.value
                );
            }

            refresh();

            restoreModalChoiceFocus({
                modal,
                selector:
              '[data-note-picker-choice]',
                value:
              input.value,
                index:
              choiceIndex,
                fallbackSelector:
              '[data-note-picker-search]'
            });
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const removeButton =
                event.target.closest(
                    '[data-note-picker-remove]'
                );

            if (removeButton)
            {
                selectedIds.delete(
                    removeButton.dataset
                        .notePickerRemove
                );

                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-picker-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                    searchInput.focus();
                }

                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-picker-create]'
                )
            )
            {
                closeModal();
                onCreate?.();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-picker-save]'
                )
            )
            {
                if (!selectedIds.size)
                {
                    return;
                }

                const noteIds =
                    [...selectedIds];

                const saved =
                    onSave(
                        noteIds
                    );

                /*
              A wrapper may return false when its
              context was removed while the modal
              was open.
            */
                if (saved === false)
                {
                    closeModal();
                    return;
                }

                closeModal();

                afterSave?.();

                const message =
                    typeof successMessage
                === 'function'
                        ? successMessage(
                            Number.isFinite(
                                saved?.addedLinkCount
                            )
                                ? saved.addedLinkCount
                                : noteIds.length
                        )
                        : successMessage;

                if (message)
                {
                    showToast(
                        message
                    );
                }
            }
        }
    );

    refresh();

    requestAnimationFrame(
        () =>
        {
            searchInput?.focus({
                preventScroll:
              true
            });
        }
    );
}

function openNotesRelatedModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const existingNoteIds =
        (
            note.relatedNoteIds
          || []
        ).filter(noteId =>
            Boolean(
                getNote(
                    noteId,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                )
            )
        );

    openNoteLinkPickerModal({
        projectId:
          note.projectId,

        title:
          'Add related notes',

        description:
          state.language === 'ru'
              ? `Добавьте связанные заметки к «${
                  localizedDataFieldValue(note.title)
                || 'Заметка без названия'
              }».`
              : `Link notes to “${
                  note.title || 'Untitled note'
              }”.`,

        helperText:
          'The relationship will appear in both notes.',

        existingNoteIds,

        /*
          Prevent the current Note from
          relating to itself.
        */
        excludeNoteIds: [
            note.id
        ],

        includeArchived:
          true,

        existingStatus:
          'Already related',

        existingMetaLabel:
          'already related',

        getSuggestionScore:
          candidate =>
              relatedNotePickerSuggestionScore(
                  note,
                  candidate
              ),

        onSave:
          selectedNoteIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return false;
              }

              updateRelatedNoteLinks(
                  currentNote.id,
                  normalizeCentralNoteIdArray([
                      ...(
                          currentNote
                              .relatedNoteIds
                  || []
                      ),

                      ...selectedNoteIds
                  ])
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'note was'
                      : 'notes were'
              } related in both notes.`
    });
}

function openCentralNoteInEditor(
    noteId
)
{
    openCentralNoteFromContext(
        noteId
    );
}

function openNoteLinkedEntity(
    type,
    id
)
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const record =
        noteEntityById(
            type,
            id,
            note.projectId
        );

    if (!record)
    {
        return;
    }

    openNoteEntity(
        type,
        record
    );
}

function bindNotesSidebarControls(
    root
)
{
    root
        .querySelector(
            '#notesAddCollection'
        )
        ?.addEventListener(
            'click',
            openNewCollectionModal
        );

    root
        .querySelectorAll(
            '[data-notes-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    clearNotesContext();

                    state.notesView =
                        button.dataset.notesView;

                    state.notesActiveCollectionId =
                        null;

                    state.selectedNoteId =
                        null;

                    state.notesRightCollapsed =
                        true;

                    state.notesMobilePane =
                        'browser';

                    renderNotes();
                }
            );
        });

    root
        .querySelectorAll(
            '[data-notes-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    clearNotesContext();

                    state.notesView =
                        'collection';

                    state.notesActiveCollectionId =
                        button.dataset
                            .notesCollection;

                    state.selectedNoteId =
                        null;

                    state.notesRightCollapsed =
                        true;

                    state.notesMobilePane =
                        'browser';

                    renderNotes();
                }
            );
        });

    root
        .querySelectorAll(
            '[data-notes-collection-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openNotesCollectionMenu(
                        button.dataset
                            .notesCollectionMenu,
                        button
                    );
                }
            );
        });

    root
        .querySelector(
            '[data-notes-tip]'
        )
        ?.addEventListener(
            'click',
            () =>
                showToast(
                    'Notes can link directly to people, places, events, photos, sources and files.'
                )
        );
}

function touchNote(
    note,
    {
        refreshPreview = true
    } = {}
)
{
    if (!note)
    {
        return null;
    }

    note.updatedAt =
        new Date().toISOString();

    setNotesSaveStatus(
        'Saving'
    );

    if (refreshPreview)
    {
        refreshNoteBrowserRow(
            note
        );
    }

    clearTimeout(
        touchNote.savedTimer
    );

    touchNote.savedTimer =
        setTimeout(
            () =>
                setNotesSaveStatus(
                    'Saved'
                ),
            450
        );

    return note;
}


function setNotesSaveStatus(
    status
)
{
    state.notesSaveStatus =
        status;

    const element =
        main.querySelector(
            '#notesSaveStatus'
        );

    if (!element)
    {
        return;
    }

    element.textContent =
        status;

    element.classList.toggle(
        'saving',
        status === 'Saving'
    );

    element.classList.toggle(
        'error',
        status === 'Error'
    );
}

function autoSizeNoteBody(
    textarea
)
{
    if (!textarea)
    {
        return;
    }

    textarea.style.height =
        'auto';

    const minimumHeight =
        Number.parseFloat(
            getComputedStyle(
                textarea
            ).minHeight
        ) || 160;

    textarea.style.height =
        `${Math.max(
            minimumHeight,
            textarea.scrollHeight
        )}px`;
}

function refreshNoteBrowserRow(
    note
)
{
    const row =
        main.querySelector(
            `[data-note-id="${
                CSS.escape(note.id)
            }"]`
        );

    if (!row)
    {
        return;
    }

    const title =
        row.querySelector(
            '.notes-row-title'
        );

    const excerpt =
        row.querySelector(
            '.notes-row-excerpt'
        );

    const collections =
        row.querySelector(
            '.notes-row-collections'
        );

    const metadata =
        row.querySelector(
            '.notes-row-metadata'
        );

    const favorite =
        row.querySelector(
            '[data-note-favorite]'
        );

    const menu =
        row.querySelector(
            '[data-note-menu]'
        );

    if (title)
    {
        title.textContent =
            note.title;

        title.title =
            note.title;
    }

    if (excerpt)
    {
        excerpt.textContent =
            noteExcerpt(
                note,
                180
            )
          || 'No note content';
    }

    if (collections)
    {
        collections.innerHTML =
            renderNoteBrowserCollectionChips(
                note
            );
    }

    if (metadata)
    {
        const value =
            noteBrowserMetadata(
                note
            );

        metadata.textContent =
            value;

        metadata.title =
            value;
    }

    if (favorite)
    {
        favorite.classList.toggle(
            'active',
            note.favorite
        );

        favorite.setAttribute(
            'aria-pressed',
            String(note.favorite)
        );

        favorite.setAttribute(
            'aria-label',
            note.favorite
                ? `Remove ${note.title} from favourites`
                : `Add ${note.title} to favourites`
        );
    }

    if (menu)
    {
        menu.setAttribute(
            'aria-label',
            `More actions for ${note.title}`
        );
    }
}

function captureNotesInteractionState()
{
    const editor =
        main.querySelector(
            '.notes-right-pane'
        );

    const browser =
        main.querySelector(
            '.notes-browser-scroll'
        );

    const richTextInstance =
        notesRichTextRuntime
            .instance;

    const richTextRange =
        richTextInstance
        && notesRichTextRuntime
            .noteId
        && richTextInstance.hasFocus()
            ? richTextInstance
                .getSelection()
            : null;

    const richText =
        richTextRange
            ? {
                noteId:
                notesRichTextRuntime
                    .noteId,

                index:
                richTextRange.index,

                length:
                richTextRange.length,

                hadFocus:
                true
            }
            : null;

    const active =
        document.activeElement;

    const activeIsRichText =
        Boolean(
            richTextInstance
          && active
          && (
              active
              === richTextInstance.root
            || richTextInstance.root
                .contains(active)
          )
        );

    const focus =
        !activeIsRichText
        && active
        && main.contains(active)
            ? {
                id:
                active.id || '',

                checklistText:
                active.dataset
                    ?.noteChecklistText
                || '',

                selectionStart:
                typeof active.selectionStart
                  === 'number'
                    ? active.selectionStart
                    : null,

                selectionEnd:
                typeof active.selectionEnd
                  === 'number'
                    ? active.selectionEnd
                    : null
            }
            : null;

    return {
        editorScrollTop:
          editor?.scrollTop || 0,

        browserScrollTop:
          browser?.scrollTop || 0,

        richText,
        focus
    };
}

function restoreNotesInteractionState(
    snapshot,
    {
        focusSelector = '',
        select = false
    } = {}
)
{
    const editor =
        main.querySelector(
            '.notes-right-pane'
        );

    const browser =
        main.querySelector(
            '.notes-browser-scroll'
        );

    const editorScrollTop =
        snapshot?.editorScrollTop
        || 0;

    if (editor)
    {
        editor.scrollTop =
            editorScrollTop;
    }

    if (browser)
    {
        browser.scrollTop =
            snapshot?.browserScrollTop
          || 0;
    }

    const explicitTarget =
        focusSelector
            ? main.querySelector(
                focusSelector
            )
            : null;

    if (explicitTarget)
    {
        explicitTarget.focus({
            preventScroll: true
        });

        if (
            select
          && typeof explicitTarget.select
            === 'function'
        )
        {
            explicitTarget.select();
        }

        if (editor)
        {
            editor.scrollTop =
                editorScrollTop;
        }

        return;
    }

    const richText =
        snapshot?.richText;

    const richTextInstance =
        notesRichTextRuntime
            .instance;

    if (
        richText?.hadFocus
        && richTextInstance
        && richText.noteId
          === notesRichTextRuntime
              .noteId
    )
    {
        const documentLength =
            Math.max(
                1,
                richTextInstance
                    .getLength()
            );

        const maximumIndex =
            Math.max(
                0,
                documentLength - 1
            );

        const index =
            Math.max(
                0,
                Math.min(
                    Number(
                        richText.index
                    ) || 0,
                    maximumIndex
                )
            );

        const length =
            Math.max(
                0,
                Math.min(
                    Number(
                        richText.length
                    ) || 0,
                    maximumIndex - index
                )
            );

        richTextInstance.focus({
            preventScroll: true
        });

        richTextInstance.setSelection(
            index,
            length,
            'silent'
        );

        if (editor)
        {
            editor.scrollTop =
                editorScrollTop;
        }

        return;
    }

    let target =
        null;

    if (snapshot?.focus)
    {
        if (snapshot.focus.id)
        {
            target =
                main.querySelector(
                    `#${CSS.escape(
                        snapshot.focus.id
                    )}`
                );
        }
        else if (
            snapshot.focus
                .checklistText
        )
        {
            target =
                main.querySelector(
                    `[data-note-checklist-text="${
                        CSS.escape(
                            snapshot.focus
                                .checklistText
                        )
                    }"]`
                );
        }
    }

    if (!target)
    {
        return;
    }

    target.focus({
        preventScroll: true
    });

    if (
        select
        && typeof target.select
          === 'function'
    )
    {
        target.select();
    }
    else if (
        snapshot?.focus
        && typeof target.setSelectionRange
          === 'function'
        && snapshot.focus
            .selectionStart !== null
    )
    {
        target.setSelectionRange(
            snapshot.focus.selectionStart,
            snapshot.focus.selectionEnd
        );
    }

    if (editor)
    {
        editor.scrollTop =
            editorScrollTop;
    }
}

function renderNotesPreservingInteraction(
    options = {}
)
{
    const snapshot =
        captureNotesInteractionState();

    renderNotes();

    requestAnimationFrame(
        () =>
            restoreNotesInteractionState(
                snapshot,
                options
            )
    );
}

function updateRelatedNoteLinks(
    noteId,
    relatedIds
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return null;
    }

    const validIds =
        normalizeCentralNoteIdArray(
            relatedIds
        ).filter(id =>
        {
            const related =
                getNote(
                    id,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                );

            return Boolean(
                related
            && related.id !== note.id
            );
        });

    const previous =
        new Set(
            note.relatedNoteIds || []
        );

    const next =
        new Set(validIds);

    previous.forEach(id =>
    {
        if (next.has(id))
        {
            return;
        }

        const related =
            getNote(
                id,
                {
                    projectId:
                note.projectId,

                    includeArchived:
                true
                }
            );

        if (related)
        {
            related.relatedNoteIds =
                related.relatedNoteIds
                    .filter(
                        itemId =>
                            itemId !== note.id
                    );

            touchNote(
                related,
                {
                    refreshPreview: false
                }
            );
        }
    });

    next.forEach(id =>
    {
        const related =
            getNote(
                id,
                {
                    projectId:
                note.projectId,

                    includeArchived:
                true
                }
            );

        if (
            related
          && !related.relatedNoteIds
              .includes(note.id)
        )
        {
            related.relatedNoteIds.push(
                note.id
            );

            related.relatedNoteIds =
                normalizeCentralNoteIdArray(
                    related.relatedNoteIds
                );

            touchNote(
                related,
                {
                    refreshPreview: false
                }
            );
        }
    });

    note.relatedNoteIds =
        validIds;

    touchNote(note);

    return note;
}

function duplicateCentralNote(
    noteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return null;
    }

    const now =
        new Date().toISOString();

    const copiedSourceIds =
        noteEntityLinkedIds(
            note,
            'source'
        );

    const copy =
        normalizeCentralNoteRecord({
            ...note,

            id:
            createRuntimeId(
                'note'
            ),

            title:
            `${note.title} copy`,

            bodyDelta:
            cloneRichTextDelta(
                note.bodyDelta
            ),

            bodyFormat:
            note.bodyDelta
                ? 'quill-delta-v1'
                : '',

            collectionIds: [
                ...note.collectionIds
            ],

            favorite:
            false,

            archived:
            false,

            checklist:
            note.checklist.map(
                item => ({
                    ...item,

                    id:
                  createRuntimeId(
                      'note-check'
                  )
                })
            ),

            linkedPersonIds: [
                ...note.linkedPersonIds
            ],

            linkedPlaceIds: [
                ...note.linkedPlaceIds
            ],

            linkedEventIds: [
                ...note.linkedEventIds
            ],

            linkedPhotoIds: [
                ...note.linkedPhotoIds
            ],

            linkedArchiveFileIds: [
                ...note.linkedArchiveFileIds
            ],

            relatedNoteIds:
            [],

            createdAt:
            now,

            updatedAt:
            now
        });

    sampleData.notes.unshift(
        copy
    );

    setNoteEntityLinks(
        copy.id,
        'source',
        copiedSourceIds,
        {
            projectId:
            copy.projectId,

            touchUpdatedAt:
            false
        }
    );

    state.notesView =
        'all';

    state.notesActiveCollectionId =
        null;

    state.selectedNoteId =
        copy.id;

    state.notesRightCollapsed =
        false;

    state.notesMobilePane =
        'editor';

    state.notesSaveStatus =
        'Saved';

    return copy;
}

function bindNotesBrowserControls()
{
    bindSearchInput(
        main,
        '#notesSearch',
        'notesSearch',
        renderNotes
    );

    main
        .querySelector(
            '[data-clear-notes-context-filter]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                clearNotesContext();
                state.selectedNoteId =
                    null;
                state.notesRightCollapsed =
                    true;
                state.notesMobilePane =
                    'browser';
                renderNotes();
            }
        );

    main
        .querySelector(
            '#notesFilterButton'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();
                openNotesFilterMenu(
                    event.currentTarget
                );
            }
        );
    bindAppSortControl(main, {
        id: 'notesSort',
        options: APP_SORT_OPTIONS.notes,
        getField: () => state.notesSort,
        getDirection: () =>
            state.notesSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.notesSort = field;
            state.notesSortDirection =
                direction;

            renderNotes();
        }
    });
    main
        .querySelectorAll(
            '[data-clear-notes-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const key =
                        button.dataset
                            .clearNotesFilter;

                    if (
                        !state.notesFilters
                || !(key in state.notesFilters)
                    )
                    {
                        return;
                    }

                    state.notesFilters[key] =
                        'any';

                    renderNotes();
                }
            );
        });

    main
        .querySelector(
            '#notesClearSearch'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesSearch =
                    '';
                renderNotes();
            }
        );

    main
        .querySelector(
            '#notesNewNoteButton'
        )
        ?.addEventListener(
            'click',
            () =>
                createCentralNote()
        );

    main
        .querySelectorAll(
            '[data-note-row]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.selectedNoteId =
                        button.dataset.noteRow;

                    state.notesRightCollapsed =
                        false;

                    state.notesMobilePane =
                        'editor';

                    state.notesSaveStatus =
                        'Saved';

                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-favorite]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const note =
                        getNote(
                            button.dataset
                                .noteFavorite,
                            {
                                includeArchived:
                      true
                            }
                        );

                    if (!note)
                    {
                        return;
                    }

                    note.favorite =
                        !note.favorite;
                    touchNote(note);
                    renderNotesPreservingInteraction();

                    showToast(
                        note.favorite
                            ? 'Added to favourites.'
                            : 'Removed from favourites.'
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();
                    openNotesMenu(
                        button.dataset.noteMenu,
                        button
                    );
                }
            );
        });
}

function bindNotesSplitPaneControls()
{
    main
        .querySelector(
            '#notesBackToBrowser'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesMobilePane =
                    'browser';

                renderNotesPreservingInteraction();
            }
        );

    main
        .querySelector(
            '#notesToggleRight'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesRightCollapsed =
                    !state.notesRightCollapsed;

                if (
                    !state.notesRightCollapsed
                )
                {
                    state.notesMobilePane =
                        'editor';
                }

                renderNotesPreservingInteraction();
            }
        );

    const resizer =
        main.querySelector(
            '#notesResizer'
        );

    if (!resizer)
    {
        return;
    }

    let startX = 0;
    let startWidth = 0;

    const setBrowserWidth =
        value =>
        {
            const next =
                Math.max(
                    360,
                    Math.min(
                        600,
                        value
                    )
                );

            state.notesBrowserWidth =
                next;

            main
                .querySelector(
                    '.notes-shell'
                )
                ?.style.setProperty(
                    '--notes-browser-width',
                    `${next}px`
                );

            resizer.setAttribute(
                'aria-valuenow',
                String(
                    Math.round(next)
                )
            );
        };

    const move = event =>
    {
        setBrowserWidth(
            startWidth
          + event.clientX
          - startX
        );
    };

    const stop = event =>
    {
        resizer.classList.remove(
            'dragging'
        );
        resizer
            .releasePointerCapture
            ?.(
                event.pointerId
            );
        resizer.removeEventListener(
            'pointermove',
            move
        );
        resizer.removeEventListener(
            'pointerup',
            stop
        );
        resizer.removeEventListener(
            'pointercancel',
            stop
        );
    };

    resizer.addEventListener(
        'pointerdown',
        event =>
        {
            event.preventDefault();
            startX = event.clientX;
            startWidth =
                Math.max(
                    320,
                    Math.min(
                        520,
                        Number(
                            state.notesBrowserWidth
                        ) || 360
                    )
                );
            resizer.classList.add(
                'dragging'
            );
            resizer
                .setPointerCapture
                ?.(
                    event.pointerId
                );
            resizer.addEventListener(
                'pointermove',
                move
            );
            resizer.addEventListener(
                'pointerup',
                stop
            );
            resizer.addEventListener(
                'pointercancel',
                stop
            );
        }
    );

    resizer.addEventListener(
        'keydown',
        event =>
        {
            if (
                ![
                    'ArrowLeft',
                    'ArrowRight'
                ].includes(event.key)
            )
            {
                return;
            }

            event.preventDefault();

            setBrowserWidth(
                (
                    Number(
                        state.notesBrowserWidth
                    ) || 440
                )
            + (
                event.key
                  === 'ArrowRight'
                    ? 24
                    : -24
            )
            );
        }
    );
}


function bindNoteEditorControls()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    bindConnectedFileLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'note'
                )
                {
                    return;
                }

                renderNotesPreservingInteraction();
            }
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType,
                targetId
            }) =>
            {
                if (
                    targetType !== 'note'
                || targetId !== note.id
                )
                {
                    return;
                }

                renderNotesPreservingInteraction();
            }
        }
    );
    const titleInput =
        main.querySelector(
            '#notesTitleInput'
        );

    titleInput
        ?.addEventListener(
            'input',
            event =>
            {
                note.title =
                    event.target.value;
                touchNote(note);
            }
        );

    titleInput
        ?.addEventListener(
            'blur',
            event =>
            {
                const title =
                    collectLocalizedDataFieldValue(
                        event.target,
                        event.target.dataset.sourceValue
                  || ''
                    ).trim()
              || 'Untitled note';

                note.title = title;
                event.target.value =
                    localizedDataFieldValue(
                        title
                    );
                event.target.dataset.sourceValue =
                    title;
                touchNote(note);
            }
        );

    main
        .querySelector(
            '#notesFavoriteButton'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                note.favorite =
                    !note.favorite;
                touchNote(note);
                renderNotesPreservingInteraction();
                showToast(
                    note.favorite
                        ? 'Added to favourites.'
                        : 'Removed from favourites.'
                );
            }
        );

    main
        .querySelector(
            '#notesEditorMenuButton'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();
                openNotesMenu(
                    note.id,
                    event.currentTarget
                );
            }
        );

    main
        .querySelector(
            '#notesManageCollections'
        )
        ?.addEventListener(
            'click',
            () =>
                openNoteCollectionsModal(
                    note.id
                )
        );

    main
        .querySelectorAll(
            '[data-note-remove-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    removeNoteFromCollection(
                        note.id,
                        button.dataset
                            .noteRemoveCollection,
                        {
                            projectId:
                    note.projectId
                        }
                    );
                    renderNotesPreservingInteraction();
                    showToast(
                        'Removed from collection.'
                    );
                }
            );
        });

    main
        .querySelector(
            '#notesAddChecklistItem'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const itemId =
                    createRuntimeId(
                        'note-check'
                    );

                note.checklist.push({
                    id:
                itemId,
                    text:
                'New checklist item',
                    done:
                false
                });

                touchNote(note);
                renderNotesPreservingInteraction({
                    focusSelector:
                `[data-note-checklist-text="${
                    CSS.escape(itemId)
                }"]`,
                    select:
                true
                });
            }
        );

    main
        .querySelectorAll(
            '[data-note-checklist-toggle]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const item =
                        note.checklist.find(
                            checklistItem =>
                                checklistItem.id
                    === input.dataset
                        .noteChecklistToggle
                        );

                    if (!item)
                    {
                        return;
                    }

                    item.done =
                        input.checked;
                    touchNote(note);
                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-checklist-text]'
        )
        .forEach(input =>
        {
            const originalText =
                input.value;

            input.addEventListener(
                'change',
                () =>
                {
                    const item =
                        note.checklist.find(
                            checklistItem =>
                                checklistItem.id
                    === input.dataset
                        .noteChecklistText
                        );

                    if (!item)
                    {
                        return;
                    }

                    const text =
                        collectLocalizedDataFieldValue(
                            input,
                            input.dataset.sourceValue
                    || ''
                        ).trim();

                    if (!text)
                    {
                        input.value =
                            item.text
                  || originalText;
                        return;
                    }

                    item.text = text;
                    input.value =
                        localizedDataFieldValue(
                            text
                        );
                    input.dataset.sourceValue =
                        text;
                    touchNote(note);
                }
            );

            input.addEventListener(
                'keydown',
                event =>
                {
                    if (event.key === 'Enter')
                    {
                        event.preventDefault();
                        input.blur();
                    }

                    if (event.key === 'Escape')
                    {
                        input.value =
                            originalText;
                        input.blur();
                    }
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-checklist-delete]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    note.checklist =
                        note.checklist.filter(
                            item =>
                                item.id
                    !== button.dataset
                        .noteChecklistDelete
                        );
                    touchNote(note);
                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-editor-section-toggle]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionKey =
                        button.dataset
                            .noteEditorSectionToggle;

                    state.notesEditorSections[
                        sectionKey
                    ] =
                        !noteEditorSectionIsOpen(
                            sectionKey
                        );

                    renderNotesPreservingInteraction({
                        focusSelector:
                  `[data-note-editor-section-toggle="${
                      CSS.escape(
                          sectionKey
                      )
                  }"]`
                    });
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-summary-section]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionKey =
                        button.dataset
                            .noteSummarySection;

                    if (!sectionKey)
                    {
                        return;
                    }

                    state.notesEditorSections[
                        sectionKey
                    ] =
                        true;

                    const escapedSectionKey =
                        CSS.escape(
                            sectionKey
                        );

                    renderNotesPreservingInteraction({
                        focusSelector:
                    `[data-note-editor-section-toggle="${escapedSectionKey}"]`
                    });

                    /*
                  renderNotesPreservingInteraction()
                  registers its restoration callback
                  first. This callback is registered
                  afterward, so it runs after the
                  previous scroll position and focus
                  have been restored.
                */
                    requestAnimationFrame(
                        () =>
                        {
                            const editorPane =
                                main.querySelector(
                                    '.notes-right-pane'
                                );

                            const section =
                                editorPane
                                    ?.querySelector(
                                        `[data-note-editor-section="${escapedSectionKey}"]`
                                    );

                            if (
                                !editorPane
                      || !section
                            )
                            {
                                return;
                            }

                            const stickyHeader =
                                editorPane.querySelector(
                                    '.notes-editor-header'
                                );

                            const headerHeight =
                                stickyHeader
                                    ?.getBoundingClientRect()
                                    .height
                      || 0;

                            /*
                      Leave a small visible gap below
                      the sticky Note header.
                    */
                            const scrollOffset =
                                Math.ceil(
                                    headerHeight
                                )
                      + 12;

                            section.style
                                .scrollMarginTop =
                                    `${scrollOffset}px`;

                            section.scrollIntoView({
                                block:
                        'start',

                                inline:
                        'nearest',

                                behavior:
                        'smooth'
                            });
                        }
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-manage-links]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openNotesLinkEntityModal(
                        button.dataset
                            .noteManageLinks
                    )
            );
        });

    main
        .querySelectorAll(
            '[data-note-linked-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openNoteLinkedEntity(
                        button.dataset
                            .noteLinkedType,
                        button.dataset
                            .noteLinkedId
                    )
            );
        });

    main
        .querySelectorAll('[data-note-linked-remove]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.preventDefault();
                event.stopPropagation();

                const type = button.dataset.noteLinkedType;
                const id = button.dataset.noteLinkedId;
                const config = getNoteEntityConfig(type);

                if (!config) return;

                const unlink = () =>
                {
                    setNoteEntityLinks(
                        note.id,
                        type,
                        noteEntityLinkedIds(note, type).filter(
                            linkedId => linkedId !== id
                        ),
                        { projectId: note.projectId }
                    );

                    renderNotesPreservingInteraction();
                    showToast('Link removed.');
                };

                if (type === 'photo')
                {
                    const photo = getPhoto(id);
                    if (!photo) return;

                    openPhotoUnlinkConfirm({
                        photo,
                        contextLabel:
                  note.title
                  || (state.language === 'ru'
                      ? 'Заметка без названия'
                      : 'Untitled note'),
                        onConfirm: unlink
                    });

                    return;
                }

                unlink();
            });
        });

    main
        .querySelector(
            '#notesManageRelated'
        )
        ?.addEventListener(
            'click',
            openNotesRelatedModal
        );

    main
        .querySelectorAll(
            '[data-note-related-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openCentralNoteInEditor(
                        button.dataset
                            .noteRelatedOpen
                    )
            );
        });

    main
        .querySelectorAll(
            '[data-note-related-remove]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    updateRelatedNoteLinks(
                        note.id,
                        note.relatedNoteIds
                            .filter(
                                relatedId =>
                                    relatedId
                      !== button.dataset
                          .noteRelatedRemove
                            )
                    );

                    renderNotesPreservingInteraction();

                    showToast(
                        'Relationship removed from both notes.'
                    );
                }
            );
        });
}

function bindNotesControls()
{
    bindToasts(main);
    bindNotesBrowserControls();
    bindNotesSplitPaneControls();
    bindNoteEditorControls();
}


function noteSearchText(
    note
)
{
    const collectionText =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        )
            .map(
                collection =>
                    collection.name
            )
            .join(' ');

    const checklistText =
        (note.checklist || [])
            .map(item => item.text)
            .join(' ');

    const tagText =
        (note.tags || [])
            .join(' ');

    const linkedText =
        Object.keys(
            NOTE_ENTITY_TYPES
        )
            .flatMap(type =>
                noteEntityRecordsForNote(
                    note,
                    type
                ).flatMap(record => [
                    noteEntityLabel(
                        type,
                        record
                    ),

                    noteEntityMeta(
                        type,
                        record
                    )
                ])
            )
            .filter(Boolean)
            .join(' ');

    const relatedText =
        getRelatedNotes(
            note.id,
            {
                projectId:
              note.projectId,

                includeArchived:
              true
            }
        )
            .map(related =>
                related.title
            )
            .join(' ');

    return [
        note.title,
        note.body,
        tagText,
        collectionText,
        checklistText,
        linkedText,
        relatedText
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function filteredNotes()
{
    const projectId =
        currentProjectId();

    let list;

    if (
        state.notesView === 'archived'
    )
    {
        list =
            getProjectNotes(
                projectId,
                {
                    includeArchived: true
                }
            ).filter(
                note => note.archived
            );
    }
    else if (
        state.notesView === 'collection'
    )
    {
        list =
            getNotesForCollection(
                state.notesActiveCollectionId,
                {
                    projectId,
                    includeArchived: false
                }
            );
    }
    else
    {
        list =
            getProjectNotes(
                projectId
            );

        if (
            state.notesView === 'favorites'
        )
        {
            list =
                list.filter(
                    note => note.favorite
                );
        }
    }

    const context =
        activeNotesContext();

    if (context)
    {
        const linkedNoteIds =
            new Set(
                getNotesForContext(
                    context.type,
                    context.id,
                    {
                        projectId,

                        includeArchived:
                  state.notesView
                    === 'archived'
                    }
                ).map(
                    note => note.id
                )
            );

        list =
            list.filter(note =>
                linkedNoteIds.has(
                    note.id
                )
            );
    }

    const filters =
        state.notesFilters || {};

    if (
        filters.linkedRecords
        && filters.linkedRecords
          !== 'any'
    )
    {
        list =
            list.filter(note =>
            {
                const hasLinks =
                    noteExternalEntityCount(
                        note
                    ) > 0;

                return filters
                    .linkedRecords
              === 'with'
                    ? hasLinks
                    : !hasLinks;
            });
    }

    if (
        filters.relatedNotes
        && filters.relatedNotes
          !== 'any'
    )
    {
        list =
            list.filter(note =>
            {
                const hasRelated =
                    (
                        note.relatedNoteIds || []
                    ).length > 0;

                return filters
                    .relatedNotes
              === 'with'
                    ? hasRelated
                    : !hasRelated;
            });
    }

    if (
        filters.collections
        && filters.collections
          !== 'any'
    )
    {
        list =
            list.filter(note =>
            {
                const hasCollections =
                    (
                        note.collectionIds || []
                    ).length > 0;

                return filters
                    .collections
              === 'with'
                    ? hasCollections
                    : !hasCollections;
            });
    }

    const query =
        String(
            state.notesSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        list =
            list.filter(note =>
                noteSearchText(note)
                    .includes(query)
            );
    }
    list =
        appSortRecords(list, {
            field:
            state.notesSort,

            direction:
            state.notesSortDirection,

            extractors: {
                name: {
                    type: 'text',
                    get: note =>
                        note.title
                },

                updated: {
                    type: 'number',
                    get: note =>
                        appSortTimestamp(
                            note.updatedAt
                        )
                },

                created: {
                    type: 'number',
                    get: note =>
                        appSortTimestamp(
                            note.createdAt
                        )
                }
            },

            getFallback:
            note => note.title
        });

    return list;
}

function ensureNotesSelection(list)
{
    if (!list.some(n => n.id === state.selectedNoteId))
    {
        state.selectedNoteId = null;
        state.notesRightCollapsed = true;
    }
}
function selectedNote()
{
    return getNote(
        state.selectedNoteId,
        {
            includeArchived: true
        }
    );
}

function notesTitle()
{
    if (
        state.notesView === 'collection'
    )
    {
        return collectionName(
            state.notesActiveCollectionId
        );
    }

    return {
        all:
          'All notes',

        favorites:
          'Favourites',

        archived:
          'Archived notes'
    }[state.notesView]
      || 'Notes';
}

function collectionName(
    collectionId
)
{
    return (
        getNoteCollection(
            collectionId
        )?.name
        || 'No collection'
    );
}

function removeBoardObjectsForEntity(
    entityType,
    entityId
)
{
    const affectedNodeIds =
        new Set();

    (sampleData.boards || [])
        .forEach(board =>
        {
            const diagram =
                board.diagram;

            if (!diagram)
            {
                return;
            }

            if (entityType === 'person')
            {
                diagram.people
                    .filter(person =>
                        person.treePersonId
                  === entityId
                    )
                    .forEach(person =>
                    {
                        person.treePersonId = null;
                        person.syncState = 'local';
                    });
            }

            if (
                entityType === 'media'
            || entityType === 'photo'
            )
            {
                diagram.people
                    .filter(person =>
                        person.photoId
                  === entityId
                    )
                    .forEach(person =>
                    {
                        person.photoId = null;
                    });

                diagram.nodes
                    .filter(node =>
                        node.type === 'image'
                && node.imageRef?.scope === 'project'
                && node.imageRef.id === entityId
                    )
                    .forEach(node =>
                    {
                        node.imageRef = null;
                        affectedNodeIds.add(node.id);
                    });
            }
        });

    return affectedNodeIds;
}

function deleteNotePermanently(
    noteId
)
{
    const index =
        sampleData.notes.findIndex(
            note =>
                note.id === noteId
        );

    if (index < 0)
    {
        return;
    }

    removeSourceLinksForTarget(
        'note',
        noteId
    );
    sampleData.notes.splice(
        index,
        1
    );

    sampleData.notes.forEach(
        note =>
        {
            note.relatedNoteIds =
                (
                    note.relatedNoteIds || []
                ).filter(
                    relatedId =>
                        relatedId !== noteId
                );
        }
    );

    sampleData.links =
        (
            sampleData.links || []
        ).filter(link =>
        {
            const noteIsSource =
                (
                    link.sourceType === 'note'
              && link.sourceId === noteId
                )
            || (
                link.fromType === 'note'
              && link.fromId === noteId
            );

            const noteIsTarget =
                (
                    link.targetType === 'note'
              && link.targetId === noteId
                )
            || (
                link.toType === 'note'
              && link.toId === noteId
            );

            return (
                !noteIsSource
            && !noteIsTarget
            );
        });

    if (
        state.selectedNoteId === noteId
    )
    {
        state.selectedNoteId =
            null;

        state.notesRightCollapsed =
            true;

        state.notesMobilePane =
            'browser';
    }

    removeBoardObjectsForEntity(
        'note',
        noteId
    );

    closeModal();
    renderNotes();

    showToast(
        'Note deleted.'
    );
}

function openDeleteNoteModal(
    noteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived: true
            }
        );

    if (!note)
    {
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteNoteTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteNoteTitle">
                Delete note?
              </h2>

              <p>
                This permanently removes
                the note and cannot be
                undone.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="notes-confirmation-card">

              <strong>
                ${escapeHtml(
                    note.title
                )}
              </strong>

              <span>
                Links to this note will
                also be removed.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close
              data-modal-initial-focus>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              id="notesConfirmDelete">
              Delete permanently
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#notesConfirmDelete'
        )
        ?.addEventListener(
            'click',
            () =>
                deleteNotePermanently(
                    noteId
                )
        );
}

function openNotesMenu(
    noteId,
    anchor
)
{
    closeMenu();

    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return;
    }

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${Math.max(
            12,
            rect.right - 200
        )}px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="favorite">
          ${
                note.favorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'
            }
        </button>

        <button
          type="button"
          data-action="duplicate">
          Duplicate
        </button>

        <button
          type="button"
          data-action="add-to-collection">
          Add to collection
        </button>

        <button
          type="button"
          data-action="archive">
          ${
                note.archived
                    ? 'Unarchive'
                    : 'Archive'
            }
        </button>

        <button
          type="button"
          class="danger"
          data-action="delete">
          Delete
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            if (
                action === 'add-to-collection'
            )
            {
                closeMenu();

                /*
            * Restore focus to the persistent menu trigger
            * before opening the modal. openModal() can then
            * preserve the correct focus-return target instead
            * of capturing a menu item that has been removed.
            */
                anchor?.focus({
                    preventScroll: true
                });

                openNoteCollectionsModal(
                    note.id
                );

                return;
            }

            if (action === 'delete')
            {
                openDeleteNoteModal(
                    note.id
                );
                return;
            }

            if (action === 'favorite')
            {
                note.favorite =
                    !note.favorite;

                touchNote(note);

                showToast(
                    note.favorite
                        ? 'Added to favourites.'
                        : 'Removed from favourites.'
                );
            }

            if (action === 'archive')
            {
                note.archived =
                    !note.archived;

                touchNote(note);

                state.notesView =
                    note.archived
                        ? 'archived'
                        : 'all';

                state.notesActiveCollectionId =
                    null;

                showToast(
                    note.archived
                        ? 'Archived.'
                        : 'Unarchived.'
                );
            }

            if (action === 'duplicate')
            {
                duplicateCentralNote(
                    note.id
                );

                showToast(
                    'Note duplicated.'
                );
            }

            closeMenu();
            renderNotesPreservingInteraction();
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function openNotesCollectionMenu(
    collectionId,
    anchor
)
{
    closeMenu();

    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 200
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">
          Edit collection
        </button>

        <button
          type="button"
          data-action="delete"
          class="danger">
          Delete collection
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            if (action === 'edit')
            {
                openEditCollectionModal(
                    collectionId
                );

                return;
            }

            if (action === 'delete')
            {
                openDeleteCollectionModal(
                    collectionId
                );
            }
        }
    );

    bindMenuLifecycle(anchor);
}

function renderNotesCollectionModal({
    titleId,
    title,
    intro,
    formId,
    nameId,
    descriptionId,
    name = '',
    description = '',
    submitLabel
})
{
    return `
        <div
          class="modal notes-collection-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="${titleId}">

          <div class="modal-header">
            <div>
              <h2 id="${titleId}">
                ${title}
              </h2>

              <p>
                ${intro}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <form
            class="notes-collection-form"
            id="${formId}">

            <div class="modal-body form-grid">
              <div class="field">
                <label for="${nameId}">
                  Collection name
                </label>

                <input
                  id="${nameId}"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="off"
                  value="${escapeHtml(name)}"
                  placeholder="e.g. Pawford archive questions">
              </div>

              <div class="field">
                <label for="${descriptionId}">
                  Description
                </label>

                <textarea
                  id="${descriptionId}"
                  rows="4"
                  maxlength="500"
                  placeholder="Optional description">${escapeHtml(
                        description
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                ${submitLabel}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openEditCollectionModal(
    collectionId
)
{
    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    openModal(
        renderNotesCollectionModal({
            titleId:
            'editCollectionTitle',

            title:
            'Edit collection',

            intro:
            'Update the collection name and description. Notes inside stay in this collection.',

            formId:
            'notesEditCollectionForm',

            nameId:
            'notesEditCollectionName',

            descriptionId:
            'notesEditCollectionDescription',

            name:
            collection.name || '',

            description:
            collection.description || '',

            submitLabel:
            'Save changes'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#notesEditCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#notesEditCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#notesEditCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput?.value.trim()
            || '';

            const description =
                descriptionInput?.value.trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            collection.name = name;
            collection.description =
                description;

            closeModal();
            renderNotes();

            showToast(
                'Collection updated.'
            );
        }
    );

    requestAnimationFrame(() =>
    {
        nameInput?.focus();
        nameInput?.select();
    });
}

function openDeleteCollectionModal(
    collectionId
)
{
    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const affectedNotes =
        getNotesForCollection(
            collection.id,
            {
                projectId:
              collection.projectId,

                includeArchived:
              true
            }
        );

    const noteLabel =
        affectedNotes.length === 1
            ? 'note'
            : 'notes';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteCollectionTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteCollectionTitle">
                Delete collection?
              </h2>

              <p>
                The collection will be removed.
                Notes and their other collection
                memberships will remain.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="notes-evidence-card">
              <strong>
                ${escapeHtml(
                    collection.name
                )}
              </strong>

              <span>
                ${affectedNotes.length}
                ${noteLabel} will keep
                their remaining collections.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              id="notesConfirmDeleteCollection">
              Delete collection
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#notesConfirmDeleteCollection'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                affectedNotes.forEach(note =>
                {
                    removeNoteFromCollection(
                        note.id,
                        collection.id,
                        {
                            projectId:
                    collection.projectId,

                            touchUpdatedAt:
                    false
                        }
                    );
                });

                const index =
                    sampleData.noteCollections
                        .findIndex(
                            item =>
                                item.id
                      === collection.id
                        );

                if (index >= 0)
                {
                    sampleData.noteCollections
                        .splice(index, 1);
                }

                if (
                    state.notesActiveCollectionId
                === collection.id
                )
                {
                    state.notesView =
                        'all';

                    state.notesActiveCollectionId =
                        null;
                }

                closeModal();
                renderNotes();

                showToast(
                    'Collection deleted. Notes kept.'
                );
            }
        );
}

function resolveNoteCreationContext(
    {
        contextType = '',
        contextId = '',
        allowActiveContext = true,
        projectId = currentProjectId()
    } = {}
)
{
    const explicit =
        contextType && contextId
            ? {
                type: contextType,
                id: contextId
            }
            : null;

    const requested =
        explicit
        || (
            allowActiveContext
                ? activeNotesContext()
                : null
        );

    if (!requested)
    {
        return null;
    }

    const record =
        noteEntityById(
            requested.type,
            requested.id,
            projectId
        );

    return record
        ? {
            type: requested.type,
            id: record.id
        }
        : null;
}

function createCentralNote(
    {
        contextType = '',
        contextId = '',
        collectionIds = null,
        title = 'Untitled note',
        projectId = currentProjectId(),
        inheritActiveContext = true,
        inheritActiveCollection = true,
        activate = true,
        renderAfterCreate = true,
        focusTitleAfterCreate = true,
        showCreatedToast = true
    } = {}
)
{
    const ownerProjectId = validProjectById(projectId)?.id || '';
    if (!ownerProjectId)
    {
        showToast('Open a project before creating records.');
        return null;
    }
    const previousActiveModule =
        state.activeModule;
    const creationContext =
        resolveNoteCreationContext({
            contextType,
            contextId,
            allowActiveContext:
            inheritActiveContext,
            projectId: ownerProjectId
        });

    const inheritedCollectionId =
        inheritActiveCollection
        && !Array.isArray(collectionIds)
        && !contextType
        && state.activeModule === 'Notes'
        && state.notesView === 'collection'
        && Boolean(
            getNoteCollection(
                state.notesActiveCollectionId
            )
        )
            ? state.notesActiveCollectionId
            : null;

    const initialCollectionIds =
        Array.isArray(collectionIds)
            ? collectionIds
            : (
                inheritedCollectionId
                    ? [inheritedCollectionId]
                    : []
            );

    const now =
        new Date().toISOString();

    const record = {
        id:
          createRuntimeId('note'),

        projectId: ownerProjectId,

        title:
          String(title || '').trim()
          || 'Untitled note',

        body:
          '',

        bodyDelta:
          null,

        bodyFormat:
          '',

        collectionIds:
          initialCollectionIds,

        favorite:
          false,

        archived:
          false,

        tags:
          [],

        checklist:
          [],

        linkedPersonIds:
          [],

        linkedPlaceIds:
          [],

        linkedEventIds:
          [],

        linkedPhotoIds:
          [],

        linkedArchiveFileIds:
          [],

        relatedNoteIds:
          [],

        createdAt:
          now,

        updatedAt:
          now
    };

    const newNote =
        normalizeCentralNoteRecord(
            record
        );

    sampleData.notes.unshift(
        newNote
    );

    if (creationContext)
    {
        setNoteEntityLinks(
            newNote.id,
            creationContext.type,
            [
                creationContext.id
            ],
            {
                projectId:
              newNote.projectId,

                touchUpdatedAt:
              false
            }
        );
    }

    if (activate)
    {
        state.activeModule =
            'Notes';

        clearNotesContext();

        if (creationContext)
        {
            setNotesContext(
                creationContext.type,
                creationContext.id,
                {
                    projectId:
                newNote.projectId
                }
            );
        }

        state.notesView =
            inheritedCollectionId
                ? 'collection'
                : 'all';

        state.notesActiveCollectionId =
            inheritedCollectionId;

        state.selectedNoteId =
            newNote.id;

        state.notesRightCollapsed =
            false;

        state.notesMobilePane =
            'editor';

        state.notesSaveStatus =
            'Saved';

        state.notesFilters = {
            linkedRecords:
            'any',

            relatedNotes:
            'any',

            collections:
            'any'
        };
    }

    if (renderAfterCreate)
    {
        /*
          Entering Notes from another module requires
          a full render so the global module navigation
          receives the correct active state.

          Creating a Note while already inside Notes can
          use the smaller module-only render.
        */
        if (
            activate
          && previousActiveModule
            !== 'Notes'
        )
        {
            render();
        }
        else if (
            state.activeModule
            === 'Notes'
        )
        {
            renderNotes();
        }

        if (
            activate
          && focusTitleAfterCreate
        )
        {
            requestAnimationFrame(() =>
            {
                const titleInput =
                    main.querySelector(
                        '#notesTitleInput'
                    );

                titleInput?.focus();
                titleInput?.select();
            });
        }

        if (
            activate
          && showCreatedToast
        )
        {
            showToast(
                'Note created.'
            );
        }
    }

    return newNote;
}

function openNewCollectionModal()
{
    openModal(
        renderNotesCollectionModal({
            titleId:
            'newCollectionTitle',

            title:
            'Create collection',

            intro:
            'Collections keep related notes together.',

            formId:
            'notesCollectionForm',

            nameId:
            'notesCollectionName',

            descriptionId:
            'notesCollectionDescription',

            submitLabel:
            'Create collection'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#notesCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#notesCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#notesCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput?.value.trim()
            || '';

            const description =
                descriptionInput?.value.trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const id =
                createRuntimeId('note-col');

            sampleData.noteCollections.push({
                id,

                projectId:
              currentProjectId(),

                name,
                description
            });

            state.notesView =
                'collection';

            state.notesActiveCollectionId =
                id;

            closeModal();
            renderNotes();

            showToast(
                'Collection created.'
            );
        }
    );

    requestAnimationFrame(() =>
    {
        nameInput?.focus();
    });
}


function placesMaptilerKey()
{
    return window.GENEOGRAPH_CONFIG?.maptilerKey || PLACES_MAP_CONFIG.maptilerKey || '';
}

function placesMapDataKey(places)
{
    return (places || []).map(place =>
    {
        const coordinates = normalizePlaceCoordinates(place);
        return [place.id, coordinates?.lat ?? '', coordinates?.lng ?? '', place.deleted].join(':');
    }).join('|');
}

function selectedPlaceFromList(list)
{
    return (list || []).find(place => place.id === state.selectedPlaceId)
        || (list || [])[0]
        || null;
}

function setPlacesMapStatus(title = '', message = '', { retry = false } = {})
{
    const status = document.querySelector('[data-places-map-status]');
    if (!status) return;
    if (!title && !message)
    {
        status.hidden = true;
        status.innerHTML = '';
        return;
    }
    status.hidden = false;
    status.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>${retry ? `<button class="button secondary" type="button" data-places-map-retry>${escapeHtml(t('Retry'))}</button>` : ''}`;
    status.querySelector('[data-places-map-retry]')?.addEventListener('click', () =>
    {
        const places = [...(placesMapRuntime.currentPlaces || [])];
        destroyPlacesMap();
        requestAnimationFrame(() => mountPlacesMap(places));
    });
}

function createPlacesTileLayer()
{
    const key = placesMaptilerKey();
    if (!placesMapRuntime.map || !key || !window.L)
    {
        placesMapRuntime.tilesAvailable = false;
        return null;
    }
    const layer = L.tileLayer(PLACES_MAP_CONFIG.tileUrl, {
        key,
        minZoom: PLACES_MAP_CONFIG.minZoom,
        maxZoom: PLACES_MAP_CONFIG.maxZoom,
        attribution: PLACES_MAP_CONFIG.attribution,
        crossOrigin: true
    });
    layer.on('tileerror', handlePlacesTileError);
    layer.on('tileload', handlePlacesTileLoad);
    layer.on('loading', () =>
    {
        if (placesMapRuntime.tileErrorCount >= PLACES_MAP_CONFIG.tileErrorThreshold)
        {
            setPlacesMapStatus('Loading map tiles', 'Retrying the hosted map connection.');
        }
    });
    layer.on('load', handlePlacesTileLoad);
    return layer;
}

function handlePlacesTileError()
{
    placesMapRuntime.tileErrorCount += 1;
    if (placesMapRuntime.tileErrorCount < PLACES_MAP_CONFIG.tileErrorThreshold) return;
    placesMapRuntime.tilesAvailable = false;
    updatePlacesMapToolControls();
    setPlacesMapStatus('Map tiles could not be loaded', 'Markers and routes remain available. Check the MapTiler key or network connection.', { retry: true });
}

function handlePlacesTileLoad()
{
    const hadErrors = placesMapRuntime.tileErrorCount >= PLACES_MAP_CONFIG.tileErrorThreshold;
    placesMapRuntime.tileErrorCount = 0;
    placesMapRuntime.tilesAvailable = true;
    updatePlacesMapToolControls();
    if (hadErrors) showToast('Map connection restored');
    setPlacesMapStatus();
}

function createPlaceMarkerIcon(
    place,
    selected = false
)
{
    const size =
        selected
            ? 30
            : 24;

    return L.divIcon({
        className:
          'places-leaflet-marker-icon',

        html: `
          <span
            class="
              leaflet-place-marker
              ${selected ? 'selected' : ''}
            "
            aria-hidden="true">
          </span>
        `,

        iconSize: [
            size,
            size
        ],

        iconAnchor: [
            size / 2,
            size
        ],

        tooltipAnchor: [
            0,
            -size + 3
        ]
    });
}

function createPlaceDraftMarkerIcon()
{
    const size = 30;

    return L.divIcon({
        className:
          'places-leaflet-marker-icon draft',

        html: `
          <span
            class="leaflet-place-marker draft"
            aria-hidden="true">
          </span>
        `,

        iconSize: [
            size,
            size
        ],

        iconAnchor: [
            size / 2,
            size
        ],

        tooltipAnchor: [
            0,
            -size + 3
        ]
    });
}

function formatMapCoordinatePair(latLng)
{
    return latLng && validLatitude(latLng.lat) && validLongitude(latLng.lng)
        ? `${Number(latLng.lat).toFixed(5)}, ${Number(latLng.lng).toFixed(5)}`
        : 'No point selected';
}

function removePlacesDraftMarker()
{
    if (placesMapRuntime.draftMarker) placesMapRuntime.draftMarker.remove();
    placesMapRuntime.draftMarker = null;
    placesMapRuntime.pendingLatLng = null;
}

function createPlacesDraftMarker(latLng)
{
    if (!placesMapRuntime.map || !window.L || !latLng) return null;
    removePlacesDraftMarker();
    const marker = L.marker(latLng, {
        draggable: true,
        autoPan: true,
        keyboard: true,
        icon: createPlaceDraftMarkerIcon(),
        title: 'Draft place position'
    }).addTo(placesMapRuntime.map);
    marker.on('drag', event => updatePlacesDraftCoordinates(event.target.getLatLng(), { moveMarker: false }));
    marker.on('dragend', event => updatePlacesDraftCoordinates(event.target.getLatLng(), { moveMarker: false }));
    placesMapRuntime.draftMarker = marker;
    placesMapRuntime.pendingLatLng = marker.getLatLng();
    return marker;
}

function updatePlacesDraftCoordinates(latLng, { moveMarker = true } = {})
{
    if (!latLng || !validLatitude(latLng.lat) || !validLongitude(latLng.lng)) return;
    const normalized = L.latLng(Number(latLng.lat), Number(latLng.lng));
    if (!placesMapRuntime.draftMarker) createPlacesDraftMarker(normalized);
    else if (moveMarker) placesMapRuntime.draftMarker.setLatLng(normalized);
    placesMapRuntime.pendingLatLng = normalized;
    const output = document.querySelector('[data-places-coordinate-output]');
    if (output) output.textContent = formatMapCoordinatePair(normalized);
    updatePlacesMapToolControls();
}

function placesPendingCoordinatesValid()
{
    const pending = placesMapRuntime.pendingLatLng;
    return Boolean(pending && validLatitude(pending.lat) && validLongitude(pending.lng));
}

function updatePlacesMapModeUi()
{
    const mode = placesMapRuntime.mode;
    const editing = mode !== 'browse';
    const shell = main.querySelector('.places-map');
    const content = main.querySelector('.places-content');
    shell?.classList.toggle('is-browsing', !editing);
    shell?.classList.toggle('is-editing', editing);
    shell?.classList.toggle('is-adding-position', mode === 'add');
    shell?.classList.toggle('is-moving-position', mode === 'move');
    content?.classList.toggle('is-editing', editing);
    if (editing)
    {
        state.placesMapInfoExpanded =
            false;

        const infoPanel =
            main.querySelector(
                '#placesMapInfoPanel'
            );

        if (infoPanel)
        {
            infoPanel.hidden = true;
        }

        const infoButton =
            main.querySelector(
                '#placesMapInfoToggle'
            );

        infoButton
            ?.setAttribute(
                'aria-expanded',
                'false'
            );

        infoButton
            ?.classList
            .remove('active');

        closeMenu();
    }
}

function setPlacesMapPickingState(active)
{
    const panel =
        placesMapRuntime
            .host
            ?.closest(
                '.places-map-panel'
            );

    panel
        ?.classList
        .toggle(
            'is-picking',
            active
        );
}

function updatePlacesMapInstruction(message = '')
{
    const instruction = document.querySelector(
        '[data-places-map-instruction]'
    );

    if (!instruction) return;

    instruction.hidden = !message;
    instruction.textContent = translateText(message);
}

function updatePlacesMapToolControls()
{
    const pendingValid =
        placesPendingCoordinatesValid();

    const copyButton =
        main.querySelector(
            '#placesCopyCoordinates'
        );

    if (copyButton)
    {
        copyButton.disabled =
            !pendingValid;
    }

    const confirmButton =
        main.querySelector(
            '#placesConfirmMapEdit'
        );

    if (confirmButton)
    {
        confirmButton.disabled =
            !pendingValid;

        confirmButton.textContent = 'Use position';
    }

    updatePlacesMapModeUi();
}

function showPlacesCoordinateBar(show)
{
    const bar = document.querySelector('[data-places-coordinate-bar]');
    if (bar) bar.hidden = !show;
}

function resetPlacesMapEditingUi()
{
    removePlacesDraftMarker();
    placesMapRuntime.mode = 'browse';
    placesMapRuntime.editingPlaceId = null;
    setPlacesMapPickingState(false);
    showPlacesCoordinateBar(false);
    updatePlacesMapInstruction();
    const output = document.querySelector('[data-places-coordinate-output]');
    if (output) output.textContent = 'No point selected';
    updatePlacesMapToolControls();
}

function cancelPlacesMapEditing({ reopenEditor = true } = {})
{
    const draft = placeEditorDraft;
    const session = draft?.mapSession;
    resetPlacesMapEditingUi();
    if (!draft) return;
    if (session)
    {
        draft.coordinates = clonePlaceEditorCoordinates(session.coordinates);
        draft.coordinateText = { ...session.coordinateText };
        draft.mapSession = null;
    }
    if (session?.returnToModal && reopenEditor)
    {
        requestAnimationFrame(() => openPlaceModal(draft.placeId, { draft }));
    }
    else if (!session?.returnToModal)
    {
        resetPlaceEditorDraft();
    }
}

function enterPlacesMapAddMode()
{
    if (!placesMapRuntime.map)
    {
        showToast(
            'The map is not ready yet.'
        );

        return;
    }

    if (!placeEditorDraft || placeEditorDraft.mode !== 'add')
    {
        resetPlaceEditorDraft();
        placeEditorDraft = createPlaceEditorDraft();
        placeEditorDraft.mapSession = {
            returnToModal: false,
            coordinates: null,
            coordinateText: placeEditorCoordinateText(null)
        };
    }
    resetPlacesMapEditingUi();

    placesMapRuntime.mode =
        'add';

    state.placesMapInfoExpanded =
        false;

    setPlacesMapPickingState(true);
    showPlacesCoordinateBar(true);

    updatePlacesMapInstruction(
        'Click the map to place a new location, or use the map centre.'
    );

    if (placeEditorDraft.coordinates)
    {
        updatePlacesDraftCoordinates(placeEditorDraft.coordinates);
    }

    updatePlacesMapToolControls();
}

function enterPlacesMapMoveMode(
    placeId =
        state.selectedPlaceId
)
{
    const place =
        getPlace(placeId);

    if (
        !placesMapRuntime.map
        || !place
    )
    {
        showToast(
            'The map is not ready yet.'
        );

        return;
    }

    if (!placeEditorDraft || placeEditorDraft.mode !== 'edit' || placeEditorDraft.placeId !== place.id)
    {
        resetPlaceEditorDraft();
        placeEditorDraft = createPlaceEditorDraft(place.id);
        placeEditorDraft.mapSession = {
            returnToModal: false,
            coordinates: clonePlaceEditorCoordinates(placeEditorDraft.coordinates),
            coordinateText: { ...placeEditorDraft.coordinateText }
        };
    }
    resetPlacesMapEditingUi();

    placesMapRuntime.mode =
        'move';

    state.placesMapInfoExpanded =
        false;

    placesMapRuntime.editingPlaceId =
        place.id;

    setPlacesMapPickingState(true);
    showPlacesCoordinateBar(true);

    updatePlacesMapInstruction(
        placeEditorDraft.coordinates
            ? `Drag the draft marker or click the map to reposition ${place.name}.`
            : `Click the map to position ${place.name}, or use the map centre.`
    );

    if (placeEditorDraft.coordinates)
    {
        updatePlacesDraftCoordinates(
            placeEditorDraft.coordinates
        );
    }

    updatePlacesMapToolControls();
}

function completePlaceEditorMapSelection()
{
    const latLng = placesMapRuntime.pendingLatLng;
    if (!placesPendingCoordinatesValid()) return;
    let draft = placeEditorDraft;
    if (!draft)
    {
        draft = placesMapRuntime.mode === 'move'
            ? createPlaceEditorDraft(placesMapRuntime.editingPlaceId)
            : createPlaceEditorDraft();
        placeEditorDraft = draft;
    }
    draft.coordinates = { lat: Number(latLng.lat), lng: Number(latLng.lng) };
    draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
    draft.mapSession = null;
    draft.duplicateOverride = false;
    draft.dismissedDuplicateId = null;
    draft.disclosures.coordinates = true;
    updatePlaceEditorDraftDirty(draft);
    resetPlacesMapEditingUi();
    openPlaceModal(draft.placeId, { draft });
}

function handlePlacesMapClick(event)
{
    if (!['add', 'move'].includes(placesMapRuntime.mode)) return;
    updatePlacesDraftCoordinates(event.latlng);
}

