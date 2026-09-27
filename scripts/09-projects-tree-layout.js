    function renderStartup() {
      const projects = filteredProjects();
      const totalProjects = sampleData.projects.length;
      const searchQuery = state.search.trim();
      const continuation = resolveProjectContinuation();
      sidebar.innerHTML = `
        <div class="logo-lockup">
          <div class="large-logo">${icon.logo}</div>
          <div class="logo-text">
            <strong data-i18n-skip>GeneoGraph</strong>
            <span>Family history workspace</span>
          </div>
        </div>
        <div class="button-stack">
          <button class="button primary full" type="button" id="createProject">${icon.plus} Create family tree</button>
          <button class="button secondary full" type="button" id="importGedcom">${icon.import} Import GEDCOM</button>
          <button class="button secondary full" type="button" data-toast="File picker would open here.">${icon.folder} Open project</button>
        </div>
        <div class="sidebar-spacer"></div>
        <div class="tip-card">
          <div class="tip-title">${icon.tip} Tip of the day</div>
          <p>You can drag and drop a GEDCOM file anywhere to import it.</p>
          <button class="link tip-link" type="button" data-toast="Learning center is outside this prototype.">
            <span class="tip-link-text">Learn more</span>
            <span class="tip-link-icon" aria-hidden="true">${icon.openlink}</span>
          </button>
        </div>
      `;
      sidebar.querySelector('#createProject').addEventListener('click', openCreateModal);
      sidebar.querySelector('#importGedcom').addEventListener('click', openImportModal);
      bindToasts(sidebar);

      main.innerHTML = `
        <div class="page-grid startup-page">
          <section class="main-column">
            <div class="header-row">
              <div class="title"><h1 class="app-page-title">${escapeHtml(t('Welcome back!'))}</h1><p>${escapeHtml(t('Here you can create, open, and manage your family-history projects.'))}</p></div>
            </div>
            <div class="toolbar">
              <div class="toolbar-left">
                <label class="app-search-field" aria-label="Search projects">${icon.search}<input id="projectSearch" type="search" placeholder="Search projects..." value="${escapeHtml(state.search)}"></label>
              </div>
              <div class="toolbar-right">
                ${renderAppSortControl({
                  id: 'sortProjects',
                  field: state.sort,
                  direction: state.sortDirection,
                  ariaLabel: 'Sort projects',
                  options: APP_SORT_OPTIONS.projects,
                  className: 'projects-sort-field'
                })}
                <button class="toolbar-button ${state.viewMode === 'grid' ? 'active' : ''}" type="button" data-view="grid" aria-label="Grid view" aria-pressed="${state.viewMode === 'grid'}">${icon.grid}</button>
                <button class="toolbar-button ${state.viewMode === 'list' ? 'active' : ''}" type="button" data-view="list" aria-label="List view" aria-pressed="${state.viewMode === 'list'}">${icon.list}</button>
              </div>
            </div>
            ${renderStartupProjectsHeading(
              projects.length,
              totalProjects,
              Boolean(searchQuery)
            )}

            ${projects.length
              ? renderProjectCollection(
                  projects
                )
              : renderStartupProjectEmpty(
                  searchQuery,
                  totalProjects
                )}
          </section>
          <aside class="right-column">
            ${continuation ? renderStartupContinuation(continuation) : ''}
            ${renderStartupRecentActivityCard()}
            ${renderOfflineProjectsCard()}
          </aside>
        </div>
      `;
      bindProjectControls();
      bindStartupRightColumn();
      localizeUI(
        sidebar,
        {
          suppressObserverReplay: true
        }
      );

      localizeUI(
        main,
        {
          suppressObserverReplay: true
        }
      );
    }

    function renderStartupContinuation(context) {
      return `<section class="startup-continue" aria-label="Continue where you left off">
        <span class="startup-continue-icon" aria-hidden="true">${context.icon}</span>
        <div class="startup-continue-copy">
          <span class="startup-continue-eyebrow">${escapeHtml(t('Continue where you left off'))}</span>
          <strong>${escapeHtml(context.project.name)}</strong>
          <span class="startup-continue-context">${escapeHtml(t(context.module))} · ${escapeHtml(formatContinuationOpenedAt(context.openedAt))}</span>
        </div>
        <button class="startup-continue-action" type="button" data-continue-project="${escapeHtml(context.project.id)}" data-continue-module="${escapeHtml(context.module)}">
          <span>${escapeHtml(t('Continue'))}</span>${icon.chevron}
        </button>
      </section>`;
    }

    function renderStartupProjectsHeading(visibleCount, totalCount, searchActive) {
      const title = searchActive ? t('Search results') : t('All projects');
      const count = searchActive
        ? `${visibleCount} of ${formatProjectCount(totalCount)}`
        : formatProjectCount(totalCount);
      return `<div class="startup-projects-heading">
        <h2>${escapeHtml(title)}</h2>
        <span class="startup-projects-count">${escapeHtml(count)}</span>
      </div>`;
    }

    function renderStartupProjectEmpty(searchQuery, totalProjects) {
      if (!totalProjects) {
        return `
          <section
            class="
              startup-project-empty
              is-library-empty">

            <div class="startup-project-empty-copy">

              <div class="startup-project-empty-title">

                <span class="startup-project-empty-title-icon"
                  aria-hidden="true">
                  ${icon.folder}
                </span>

                <h3>
                  ${escapeHtml(
                    t('No projects yet')
                  )}
                </h3>
              </div>

              <p>
                ${escapeHtml(
                  t(
                    'Create a family tree or import a GEDCOM file'
                  )
                )}
                <br>
                ${escapeHtml(
                  t(
                    'to begin your family-history workspace.'
                  )
                )}
              </p>

              <div class="startup-project-empty-actions">

                <button
                  class="button primary"
                  type="button"
                  data-startup-empty-create>
                  ${icon.plus}
                  ${escapeHtml(
                    t('Create family tree')
                  )}
                </button>

                <button
                  class="button secondary"
                  type="button"
                  data-startup-empty-import>
                  ${icon.import}
                  ${escapeHtml(
                    t('Import GEDCOM')
                  )}
                </button>
              </div>
            </div>
          </section>
        `;
      }
      return `<section class="startup-project-empty">
        <div class="startup-project-empty-copy">
          <span class="startup-project-empty-icon" aria-hidden="true">${icon.search}</span>
          <h3>${escapeHtml(t('No projects match'))} “${escapeHtml(searchQuery)}”</h3>
          <p>${escapeHtml(t('Try another project name or clear the search.'))}</p>
          <div class="startup-project-empty-actions">
            <button class="button secondary" type="button" data-clear-project-search>Clear search</button>
          </div>
        </div>
      </section>`;
    }

    function openProjectNameOverlay(
      anchor,
      project
    ) {
      closeProjectNameOverlay();

      const sourceProjectName =
        project.name.replace(
          'Tree',
          'History'
        );

      const rect =
        anchor.getBoundingClientRect();

      const popover =
        document.createElement(
          'div'
        );

      popover.className =
        'project-name-popover';

      popover.id =
        'projectNamePopover';

      popover.style.top =
        `${
          Math.min(
            window.innerHeight
              - 230,
            rect.bottom + 8
          )
        }px`;

      popover.style.left =
        `${
          Math.min(
            window.innerWidth
              - 356,
            Math.max(
              16,
              rect.left - 12
            )
          )
        }px`;

      popover.innerHTML = `
        <h3>Edit project name</h3>

        <label>
          Project name

          <input
            id="projectNameInput"
            value="${escapeHtml(
              localizedDataFieldValue(
                sourceProjectName
              )
            )}"
            autocomplete="off">
        </label>

        <div
          class="
            project-name-popover-actions
          ">
          <button
            class="button secondary"
            type="button"
            data-project-name-cancel>
            Cancel
          </button>

          <button
            class="button primary"
            type="button"
            data-project-name-save>
            Save
          </button>
        </div>
      `;

      document.body.appendChild(
        popover
      );

      /*
      * Localize synchronously rather than waiting for
      * MutationObserver.
      */
      localizeUI(popover);

      const input =
        popover.querySelector(
          '#projectNameInput'
        );

      input.focus();
      input.select();

      const save = () => {
        const value =
          collectLocalizedDataFieldValue(
            input,
            sourceProjectName
          ).trim();

        if (!value) {
          showToast(
            'Project name cannot be empty.'
          );

          return;
        }

        updateProjectName(
          project.id,
          value
        );

        closeProjectNameOverlay();
        renderOpenProject();

        showToast(
          'Project name updated.'
        );
      };

      popover
        .querySelector(
          '[data-project-name-save]'
        )
        .addEventListener(
          'click',
          save
        );

      popover
        .querySelector(
          '[data-project-name-cancel]'
        )
        .addEventListener(
          'click',
          closeProjectNameOverlay
        );

      input.addEventListener(
        'keydown',
        event => {
          if (
            event.key === 'Enter'
          ) {
            event.preventDefault();
            save();
          }

          if (
            event.key === 'Escape'
          ) {
            event.preventDefault();
            closeProjectNameOverlay();
          }
        }
      );

      setTimeout(
        () =>
          document.addEventListener(
            'click',
            closeProjectNameOverlayOnOutside
          ),
        0
      );
    }

    function closeProjectNameOverlayOnOutside(event) {
      if (!event.target.closest('#projectNamePopover') && !event.target.closest('#editProjectTitle')) closeProjectNameOverlay();
    }

    function closeProjectNameOverlay() {
      document.getElementById('projectNamePopover')?.remove();
      document.removeEventListener('click', closeProjectNameOverlayOnOutside);
    }

    function renderOpenProject() {
      const project = currentProject();
      if (!project) {
        state.projectOpen = false;
        state.currentProjectId = null;
        renderStartup();
        return;
      }
      const projectTitle = project.name;

      const projectPhotoCount =
        getProjectPhotos(
          project.id
        ).length;

      const projectFileCount =
        connectedFilesForProject(
          project.id
        ).length;

      const projectNoteCount =
        getProjectNotes(
          project.id
        ).length;
      sidebar.innerHTML = `
        <div class="logo-lockup">
          <div class="large-logo">${icon.logo}</div>
          <div class="logo-text">
            <strong data-i18n-skip>GeneoGraph</strong>
            <span>Family history workspace</span>
          </div>
        </div>
        <div>
          <div class="side-section-title">Project</div>
          <div class="side-nav">
            <button class="side-link ${state.openSide === 'overview' ? 'active' : ''}" type="button" data-open-side="overview">${icon.home}<span>Project overview</span></button>
            <button class="side-link ${state.openSide === 'activity' ? 'active' : ''}" type="button" data-open-side="activity">${icon.clock}<span>Recent activity</span></button>
            <button class="side-link ${state.openSide === 'settings' ? 'active' : ''}" type="button" data-open-side="settings">${icon.settings}<span>Project settings</span></button>
          </div>
        </div>
        <div class="sidebar-spacer"></div>
        <button class="side-link" type="button" id="backToProjects">${icon.arrow}<span>Back to all projects</span></button>
      `;
      sidebar.querySelector('#backToProjects').addEventListener('click', () => { state.projectOpen = false; state.currentProjectId = null; state.activeModule = 'Projects'; render(); });
      sidebar.querySelectorAll('[data-open-side]').forEach(button => button.addEventListener('click', () => {
        state.openSide = button.dataset.openSide;
        persistProjectContinuation({ projectId: project.id, module: 'Projects', openedAt: new Date().toISOString() });
        renderOpenProject();
      }));

      if (state.openSide === 'settings') {
        main.innerHTML = `<div class="project-settings-view">${renderProjectSettings(project)}</div>`;
        bindProjectSettingsControls();
        bindToasts(main);
        return;
      }

      main.innerHTML = state.openSide === 'settings' ? `
        <div class="page-grid open-project-page project-settings-page-grid">
          <section class="main-column project-settings-main">
            ${renderOpenProjectBody()}
          </section>
        </div>
      ` : `
        <div class="page-grid open-project-page">
          <section class="main-column">
            <div class="project-hero">
              <div class="project-hero-layout">
                <div class="hero-content">
                  <div class="project-title-row-open">
                    <h1>${escapeHtml(projectTitle)}</h1>
                    <button class="project-title-edit" type="button" id="editProjectTitle" aria-label="Edit project name">${icon.edit}</button>
                  </div>
                  <div class="meta-row project-hero-meta">
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(project.status)}</span>
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(formatProjectCreated(project))}</span>
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(formatProjectModified(project, 'Last modified'))}</span>
                  </div>
                  <div class="project-desc">${escapeHtml(project.desc)}</div>
                  <div
                    class="
                      stat-chips
                      app-chip-row
                      app-chip-row--on-accent
                    ">
                    <span class="app-chip app-chip--people">
                      ${escapeHtml(
                        formatProjectPeopleCount(
                          project.id
                        )
                      )}
                    </span>

                    <span class="app-chip app-chip--photos">
                      ${projectPhotoCount}
                      ${projectPhotoCount === 1 ? 'photo' : 'photos'}
                    </span>

                    <span class="app-chip app-chip--files">
                      ${projectFileCount}
                      ${projectFileCount === 1 ? 'file' : 'files'}
                    </span>

                    <span class="app-chip app-chip--notes">
                      ${projectNoteCount}
                      ${projectNoteCount === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                </div>
                <div class="project-hero-actions" aria-label="Project actions">
                  <button class="project-hero-action-button" type="button" id="heroImportGedcom">${icon.import}<span>Import GEDCOM</span></button>
                  <button class="project-hero-action-button" type="button" data-toast="Export project options will be defined in the Publish module.">${icon.export}<span>Export project</span></button>
                  <button class="project-hero-action-button danger" type="button" id="deleteProject">${icon.trash}<span>Delete project</span></button>
                </div>
              </div>
            </div>
            ${renderOpenProjectBody()}
            ${state.openSide === 'overview' ? renderProjectGedcomDropzone() : ''}
          </section>
          <aside class="right-column">
            ${renderOpenProjectInsightsCard(project)}
            ${renderOpenProjectOfflineCard(project)}
          </aside>
        </div>
      `;
      document.getElementById('heroImportGedcom')?.addEventListener('click', openImportModal);
      document.getElementById('openDropzone')?.addEventListener('click', openImportModal);
      document.getElementById('deleteProject')?.addEventListener('click', () => openDeleteProjectConfirm(project.id));
      document.getElementById('editProjectTitle')?.addEventListener('click', event => openProjectNameOverlay(event.currentTarget, project));
      bindOpenProjectRightColumn();
      bindToasts(main);
    }

    function renderOpenProjectBody() {
      const project = currentProject();
      if (state.openSide === 'settings') {
        return renderProjectSettings(project);
      }
      if (state.openSide === 'activity') {
        return `<div class="panel activity-panel"><h2>Recent activity</h2><div class="panel-body">${renderActivityRows(8)}</div></div>`;
      }
      return `
        <div class="overview-grid">
          <div class="panel activity-panel"><h2>Recent activity</h2><div class="panel-body">${renderActivityRows(4)}
            <div class="project-activity-footer">
              <button class="link project-overview-link" type="button" data-open-side-main="activity">
                <span class="project-overview-link-text">View all</span>
                <span class="project-overview-link-icon" aria-hidden="true">${icon.openlink}</span>
              </button>
            </div>
            </div>
            </div>
          <div class="module-shortcuts">
            ${[
              ['Family Tree', icon.tree, 'Structured relationship canvas'],
              ['People', icon.people, 'Browse and clean records'],
              ['Albums', icon.image, 'Photos and albums'],
              ['Archive', icon.file, 'Files and sources']
            ].map(([label, svg, text]) => `<button class="shortcut-card" type="button" data-shortcut="${label}">${svg}<strong>${label}</strong><span>${text}</span></button>`).join('')}
          </div>
        </div>
      `;
    }

    function renderProjectGedcomDropzone() {
      return `<div class="dropzone" id="openDropzone">${icon.import}<div><strong>Drop a GEDCOM file here to import</strong><span>Supports .ged files</span></div></div>`;
    }

    function renderProjectSettings(project) {
      const title = project.name;

      const localizedTitle =
        localizedDataFieldValue(
          title
        );

      const localizedDescription =
        localizedDataFieldValue(
          project.desc
        );
      const coverStyle =
        normalizeProjectCoverStyle(
          project.cover
        );

      const safeFileTitle =
        title
          .replace(
            /[^a-zA-Z0-9\s-]/g,
            ''
          )
          .trim()
          .replace(
            /\s+/g,
            ' '
          );

      const projectPath =
        project.projectPath
        || `C:\\Users\\Username\\Documents\\GeneoGraph\\${
          safeFileTitle || 'Family History'
        }.ggproj`;

      const lastBackup =
        project.lastBackupAt
          ? formatProjectDate(
              project.lastBackupAt
            )
          : t('Not created yet');

      const coverStyleAttr =
        projectCoverStyleAttribute(
          coverStyle
        );
      return `<div class="project-settings-page">
        <div class="project-settings-section-one">
          <section class="project-settings-section project-settings-card project-settings-identity-card">
            <h3>Project identity</h3>
            <div class="project-settings-section-body project-settings-identity-body">
              <div class="project-settings-form project-settings-identity-form">
                <div class="project-settings-field"><label for="settingsProjectName">Project name</label>
                <input
                  id="settingsProjectName"
                  value="${escapeHtml(
                    localizedTitle
                  )}">
                  </div>
                <div class="project-settings-field project-settings-description-field"><label for="settingsProjectDescription">Project description</label>
                <textarea
                  id="settingsProjectDescription">${escapeHtml(
                    localizedDescription
                  )}</textarea>
                  </div>
              </div>
            </div>
          </section>
          <section class="project-settings-section project-settings-card project-settings-cover-card">
            <h3>Cover image</h3>
            <div class="project-settings-section-body">
              <div class="project-cover-preview ${coverStyle === 'tree' ? 'tree' : ''}" id="projectCoverPreview" style="${coverStyleAttr}"></div>
              <div class="project-cover-options" role="group" aria-label="Cover style">
                <button class="project-cover-option ${coverStyle === 'paper' ? 'active' : ''}" type="button" data-cover-style="paper">Archival paper</button>
                <button class="project-cover-option ${coverStyle === 'tree' ? 'active' : ''}" type="button" data-cover-style="tree">Family tree</button>
                <button class="project-cover-option ${coverStyle === 'photo' ? 'active' : ''}" type="button" data-cover-style="photo">Family photo</button>
                <button class="project-cover-option" type="button" data-toast="Custom cover upload is a placeholder.">Custom image</button>
              </div>
            </div>
          </section>
        </div>
        <section class="project-settings-section project-settings-full-card">
          <h3>Project location</h3>
          <div class="project-settings-section-body project-location-body">
            <div class="project-location-summary">
              <span class="project-location-status">Local project</span>
              <span class="project-location-muted">Cloud backup disabled</span>
            </div>
            <div
              class="project-location-path"
              data-i18n-skip
              title="${escapeHtml(
                projectPath
              )}">
              ${escapeHtml(
                projectPath
              )}
            </div>
            <div class="project-location-meta">
              <div class="project-settings-kv"><span>Last local backup</span><span>${escapeHtml(lastBackup)}</span></div>
              <div class="project-settings-kv"><span>Cloud backup</span><span>Disabled</span></div>
            </div>
            <div class="project-location-actions">
              <button class="button secondary" type="button" id="viewProjectFolder">${icon.folder} View in folder</button>
              <button class="button secondary" type="button" id="moveProjectLocation">${icon.movefolder} Move project</button>
              <button class="button secondary" type="button" id="createProjectBackup">${icon.file} Create local backup</button>
              <button class="button primary" type="button" id="enableProjectSync">${icon.sync} Sync now</button>
            </div>
          </div>
        </section>
        <section class="project-settings-section project-settings-full-card">
          <h3>Data and privacy</h3>
          <div class="project-settings-section-body">
            <div class="project-privacy-grid">
              <div class="project-settings-field project-settings-select-field">
                <label for="settingsLivingProtection">Living-person protection</label>
                <select id="settingsLivingProtection">
                  <option selected>On</option>
                  <option>Off</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsPublishLiving">Publish living people</label>
                <select id="settingsPublishLiving">
                  <option selected>Hide by default</option>
                  <option>Anonymize names</option>
                  <option>Include with warning</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsPrivateNotes">Private notes in exports</label>
                <select id="settingsPrivateNotes">
                  <option selected>Exclude by default</option>
                  <option>Include with warning</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsDateFormat">Date format</label>
                <select id="settingsDateFormat">
                  <option selected>
                    DD MMM YYYY
                  </option>
                  <option>
                    DD.MM.YYYY
                  </option>
                  <option>
                    YYYY-MM-DD
                  </option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>
            </div>
          </div>
        </section>
        <div class="project-settings-actions project-settings-page-actions"><button class="button secondary" type="button" id="resetProjectSettings">Reset changes</button><button class="button primary" type="button" id="saveProjectSettings">Save changes</button></div>
      </div>`;
    }


    function bindProjectSettingsControls() {
      if (state.openSide !== 'settings') return;
      main.querySelector('#saveProjectSettings')?.addEventListener('click', saveProjectSettings);
      main.querySelector('#resetProjectSettings')?.addEventListener('click', () => renderOpenProject());
      main.querySelector('#viewProjectFolder')?.addEventListener('click', () => showToast('This would open the project folder on your computer.'));
      main.querySelector('#moveProjectLocation')?.addEventListener('click', openMoveProjectModal);
      main.querySelector('#createProjectBackup')?.addEventListener('click', () => {
        const project = currentProject();
        project.lastBackupAt =
          new Date().toISOString();

        delete project.lastBackup;
        touchProjectModified(project);
        renderOpenProject();
        showToast('Local backup created.');
      });
      main.querySelector('#enableProjectSync')?.addEventListener('click', () => showToast('Cloud sync is optional. This project is currently stored locally.'));
      main.querySelectorAll('[data-cover-style]').forEach(button => button.addEventListener('click', () => {
        const project = currentProject();
        setProjectCover(project.id, button.dataset.coverStyle);
        showToast('Cover style updated. Save settings to keep other changes.');
        renderOpenProject();
      }));
    }


    function saveProjectSettings() {
      const project =
        currentProject();

      const sourceName =
        project.name.replace(
          'Tree',
          'History'
        );

      const nameControl =
        main.querySelector(
          '#settingsProjectName'
        );

      const descriptionControl =
        main.querySelector(
          '#settingsProjectDescription'
        );

      const name =
        cleanEditFieldValue(
          collectLocalizedDataFieldValue(
            nameControl,
            sourceName
          )
        );

      const description =
        cleanEditFieldValue(
          collectLocalizedDataFieldValue(
            descriptionControl,
            project.desc
          )
        );

      if (!name) {
        showToast(
          'Project name cannot be empty.'
        );

        return;
      }

      updateProjectName(
        project.id,
        name
      );

      project.desc =
        description
        || project.desc;

      renderOpenProject();

      showToast(
        'Project settings saved.'
      );
    }

    function openMoveProjectModal() {
      const project = currentProject();
      if (!project) return;
      const title = project.name;
      const currentPath = project.projectPath || `C:\\Users\\Silver\\Documents\\GeneoGraph\\${title}.ggproj`;
      openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="moveProjectTitle">
        <div class="modal-header"><div><h2 id="moveProjectTitle">Move project</h2><p>Choose a new local folder for this project. This is simulated in the prototype.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
        <div class="modal-body form-grid">
          <div class="field"><label>Current location</label><input value="${escapeHtml(currentPath)}" disabled></div>
          <div class="field"><label for="newProjectLocation">New location</label><input id="newProjectLocation" value="C:\\Users\\Silver\\Documents\\GeneoGraph\\Moved projects\\${escapeHtml(title)}.geneograph"></div>
          <div class="project-location-note">Moving a project would relocate the local project package and keep existing people, sources, photos, archive files, notes, boards, and settings together.</div>
        </div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" id="confirmMoveProject">Move project</button></div>
      </div>`);
      modalBackdrop.querySelector('#confirmMoveProject')?.addEventListener('click', () => {
        const nextPath = modalBackdrop.querySelector('#newProjectLocation')?.value.trim();
        if (!nextPath) { showToast('Choose a project location.'); return; }
        project.projectPath = nextPath;
        touchProjectModified(project);
        closeModal();
        renderOpenProject();
        showToast('Project location updated.');
      });
    }


    function renderStartupImportTile() {
      return `
        <button
          class="startup-import-tile"
          id="startupDropzone"
          type="button"
          data-startup-import-tile
          aria-label="
            Open or import a GeneoGraph
            or GEDCOM file
          ">

          <span
            class="startup-import-tile-icon"
            aria-hidden="true">
            ${icon.import}
          </span>

          <span
            class="startup-import-tile-copy">

            <strong>
              Open or import a file
            </strong>

            <span>
              Drop a .ggproj or .ged
              file here
            </span>
          </span>

          <span
            class="startup-import-tile-action"
            aria-hidden="true">
            Choose file
          </span>
        </button>
      `;
    }

    function renderProjectCollection(
      list
    ) {
      const cls =
        state.viewMode === 'grid'
          ? 'project-grid'
          : 'project-list';

      return `
        <div class="${cls}">
          ${list
            .map(renderProjectCard)
            .join('')}

          ${renderStartupImportTile()}
        </div>
      `;
    }

    function renderProjectCard(project) {
      const coverStyle =
        normalizeProjectCoverStyle(
          project.cover
        );

      const coverClass =
        coverStyle === 'tree'
          ? 'tree'
          : '';

      const coverStyleAttr =
        projectCoverStyleAttribute(
          coverStyle
        );
      const peopleCountLabel =
        formatProjectPeopleCount(
          project.id
        );
      return `
        <article class="project-card ${state.viewMode === 'list' ? 'list-card' : ''}" data-project-id="${escapeHtml(project.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(project.name)}">
          <div
            class="project-cover ${coverClass}"
            style="${coverStyleAttr}">
          </div>
          <div class="project-body">
            <div class="project-title-row">
              <h3>
                ${escapeHtml(project.name)}
              </h3>
            </div>
            <div class="project-meta">
              <span>
                ${icon.peoplegroup}
                ${escapeHtml(
                  peopleCountLabel
                )}
              </span>
              <span class="project-status-meta"><span class="project-status-dot" aria-hidden="true"></span>${escapeHtml(project.status)}</span>
            </div>
            <div class="modified">${escapeHtml(formatProjectModified(project))}</div>
          </div>
          <div class="project-footer"><button class="small-open" type="button" data-open="${project.id}">Open</button><button class="project-more" type="button" data-menu="${project.id}" aria-label="More actions">${icon.more}</button></div>
        </article>
      `;
    }

    function renderStartupRecentActivityCard() {
      const items = [
        {
          projectId: 'p1',
          project: 'Whiskerfield Family Tree',
          module: 'Albums',
          context: 'Albums',
          icon: icon.image,
          tone: 'red',
          title: '4 photos added',
          detail:
            'Whiskerfield family album photos are ready to organize',
          occurredAt:
            '2026-05-24T10:42:00Z'
        },
        {
          projectId: 'p1',
          project: 'Whiskerfield Family Tree',
          module: 'People',
          context: 'People',
          icon: icon.people,
          tone: 'purple',
          title: 'Profile updated',
          detail:
            'Luna Purrington now has a verified birth place',
          occurredAt:
            '2026-05-23T18:20:00Z'
        },
        {
          projectId: 'p1',
          project: 'Whiskerfield Family Tree',
          module: 'Family Tree',
          context: 'Family Tree',
          icon: icon.import,
          tone: 'amber',
          title: 'GEDCOM import reviewed',
          detail:
            '17 people were added to the project',
          occurredAt:
            '2026-05-22T10:42:00Z'
        }
      ].filter(item =>
        sampleData.projects.some(
          project =>
            project.id ===
            item.projectId
        )
      );

      if (!items.length) {
        return '';
      }

      return `
        <div class="right-card">
          <h2>
            ${escapeHtml(
              translateText(
                'Recent activity'
              )
            )}
          </h2>

          <div
            class="
              startup-action-list
            ">

            ${items
              .map(item => {
                const title =
                  translateText(
                    item.title
                  );

                const projectName =
                  translateText(
                    item.project
                  );

                const context =
                  translateText(
                    item.context
                  );

                const detail =
                  translateText(
                    item.detail
                  );

                const date =
                  formatProjectDate(
                    item.occurredAt
                  );

                const ariaLabel =
                  translateAttributeValue(
                    `Open ${item.project} ${item.context} activity`
                  );

                return `
                  <button
                    class="
                      startup-action-row
                      startup-activity-row
                    "
                    type="button"
                    data-startup-open-module="${
                      escapeHtml(
                        item.module
                      )
                    }"
                    data-startup-project="${
                      escapeHtml(
                        item.projectId
                      )
                    }"
                    aria-label="${
                      escapeHtml(
                        ariaLabel
                      )
                    }">

                    <span
                      class="
                        startup-action-icon
                        ${item.tone}
                      ">
                      ${item.icon}
                    </span>

                    <span
                      class="
                        startup-action-copy
                      ">

                      <strong>
                        ${escapeHtml(
                          title
                        )}
                      </strong>

                      <span
                        class="
                          startup-action-project
                        ">
                        ${escapeHtml(
                          projectName
                        )}
                        ·
                        ${escapeHtml(
                          context
                        )}
                      </span>

                      <span>
                        ${escapeHtml(
                          detail
                        )}
                        ·
                        ${escapeHtml(
                          date
                        )}
                      </span>
                    </span>

                    <span
                      class="
                        startup-activity-chevron
                      "
                      aria-hidden="true">
                      ›
                    </span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>
      `;
    }

    function renderOfflineProjectsCard() {
      return `<div class="right-card offline-project-card"><div class="offline-card-titlebar"><h2>Sync status</h2><button class="link" type="button" data-toast="Cloud sync is optional. Your current projects are stored locally.">Sync now</button></div><div class="offline-card-body">
        <div class="offline-card-main"><div class="sync-icon offline-icon">${icon.syncoffline}</div><div><strong>All files are stored locally</strong><span>Your projects, photos, archive files, notes, and boards stay on this device.</span></div></div>
        <div class="offline-card-footer"><span>Enable cloud sync to protect your files.</span></div>
      </div></div>`;
    }

    function bindStartupRightColumn() {
      main.querySelectorAll('[data-startup-open-module]').forEach(row => {
        row.addEventListener('click', event => {
          event.stopPropagation();
          openStartupProjectModule(row.dataset.startupProject || '', row.dataset.startupOpenModule || 'Projects');
        });
        row.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            openStartupProjectModule(row.dataset.startupProject || '', row.dataset.startupOpenModule || 'Projects');
          }
        });
      });
      bindToasts(main);
    }

    function openStartupProjectModule(projectId, moduleName) {
      navigateToProjectModule(projectId, moduleName);
    }

    function renderOpenProjectInsightsCard(project) {
      const projectPeople = getPeople(project.id);
      const projectFiles = (sampleData.archiveFiles || []).filter(file => file.projectId === project.id);
      const projectPhotos = getProjectPhotos(project.id);
      const projectPlaceRecords = projectPlaces(project.id);
      const missingFacts = projectPeople.filter(person =>
        !formatGenealogyDateLabel(person.birth)
        || (!person.birth?.placeId && !person.birth?.placeText)
      ).length;
      const missingSourceData = projectFiles.filter(file =>
        !sourceIdsForTarget(
          'file',
          file.id,
          file.projectId
        ).length
      ).length;
      const unsortedPhotos = projectPhotos.filter(photo => !(photo.albumIds || []).length).length;
      const placeCleanup = projectPlaceRecords.filter(place =>
        getActivePlaceReviewIssues(place).length
      ).length;
      const items = [
        missingFacts ? { module: 'People', icon: icon.people, tone: 'purple', title: 'Missing facts', detail: `${missingFacts} ${missingFacts === 1 ? 'person is' : 'people are'} missing birth details.` } : null,
        missingSourceData ? { module: 'Archive', icon: icon.file, tone: 'amber', title: 'Missing source data', detail: `${missingSourceData} archive ${missingSourceData === 1 ? 'file is' : 'files are'} missing source information.` } : null,
        unsortedPhotos ? { module: 'Albums', icon: icon.image, tone: 'red', title: 'Unsorted photos', detail: `${unsortedPhotos} ${unsortedPhotos === 1 ? 'photo is' : 'photos are'} not assigned to an album.` } : null,
        placeCleanup ? { module: 'Places', icon: icon.mapPin, tone: 'blue', title: 'Place cleanup', detail: `${placeCleanup} ${placeCleanup === 1 ? 'place needs' : 'places need'} review.` } : null
      ].filter(Boolean);
      return `<div class="right-card"><h2>Project insights</h2><div class="startup-action-list">
        ${items.length ? items.map(item => `<button class="startup-action-row project-insight-row" type="button" data-open-project-module="${item.module}" aria-label="Open ${escapeHtml(item.module)} for ${escapeHtml(item.title)}">
          <div class="startup-action-icon ${item.tone}">${item.icon}</div>
          <div class="startup-action-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(project.name)} · ${escapeHtml(item.detail)}</span></div>
          <span class="project-insight-chevron" aria-hidden="true">${icon.chevron}</span>
        </button>`).join('') : `<div class="panel-muted" style="padding:16px">${escapeHtml(t('Start by adding a person or opening a project module.'))}</div>`}
      </div></div>`;
    }

    function renderOpenProjectOfflineCard(project) {
      return `<div class="right-card offline-project-card">
        <div class="offline-card-titlebar"><h2>Sync status</h2><button class="link" type="button" data-toast="Cloud sync is optional. This project is currently stored locally.">Sync now</button></div>
        <div class="offline-card-body">
          <div class="offline-card-main"><div class="sync-icon offline-icon">${icon.syncoffline}</div><div><strong>Offline project</strong><span>Cloud backup is disabled. Project files, photos, archive files, notes, and boards stay on this device.</span></div></div>
        <button class="offline-card-learn link project-overview-link" type="button" data-toast="Cloud backup help is a placeholder for a later flow.">
          <span class="project-overview-link-text">Learn more about cloud backup</span>
          <span class="project-overview-link-icon" aria-hidden="true">${icon.openlink}</span>
        </button>
        </div>
      </div>`;
    }

    function bindOpenProjectRightColumn() {
      const openModule = element => {
        const moduleName = element.dataset.openProjectModule;
        if (!moduleName) return;
        navigateToProjectModule(currentProjectId(), moduleName);
      };
      main.querySelectorAll('[data-open-project-module]').forEach(element => {
        element.addEventListener('click', event => {
          event.stopPropagation();
          openModule(element);
        });
        element.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            openModule(element);
          }
        });
      });
      main.querySelectorAll('[data-shortcut]').forEach(button => {
        button.addEventListener('click', () => {
          navigateToProjectModule(currentProjectId(), button.dataset.shortcut);
        });
      });
      main.querySelectorAll('[data-open-side-main]').forEach(button => {
        button.addEventListener('click', () => {
          state.openSide = button.dataset.openSideMain;
          persistProjectContinuation({ projectId: currentProjectId(), module: 'Projects', openedAt: new Date().toISOString() });
          renderOpenProject();
        });
      });
    }




    function renderActivityRows(count) {
      const activityIcons = {
        Albums: icon.image,
        People: icon.people,
        'Family Tree': icon.tree,
        Notes: icon.note,
        Archive: icon.file,
        Places: icon.mapPin,
        Geneograph: icon.geneograph
      };
      const rows = (sampleData.activity || [])
        .filter(row => row.projectId === currentProjectId())
        .slice()
        .sort((first, second) => Date.parse(second.occurredAt || '') - Date.parse(first.occurredAt || ''));
      if (!rows.length) {
        return `<div class="panel-muted" style="padding:20px"><strong>${escapeHtml(t('No project activity yet'))}</strong><span style="display:block;margin-top:4px">${escapeHtml(t('Activity will appear as you add and edit project records.'))}</span></div>`;
      }
      return `<div class="project-activity-list">${rows.slice(0,count).map(row => `<button class="project-activity-row" type="button" data-open-project-module="${row.module}">
        <span class="project-activity-icon ${row.tone || ''}">${activityIcons[row.module] || icon.clock}</span>
        <span class="project-activity-copy"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.detail)}</span></span>
        <span class="project-activity-time">${escapeHtml(formatProjectDate(row.occurredAt))}</span>
      </button>`).join('')}</div>`;
    }

    /*
    * Canonical Family Tree geometry.
    *
    * Layout calculations and CSS variables must derive
    * from this object. Do not repeat these dimensions
    * elsewhere as numeric literals.
    */
    const TREE_GEOMETRY = Object.freeze({
      cardWidth: 300,
      cardHeight: 124,
      cardPadding: 10,
      cardContentGap: 10,
      avatarSize: 68,

      get generationPitch() { return this.cardHeight + this.connectorRailOffset * 2; },
      spouseGap: 40,
      siblingGap: 48,
      subtreeGap: 96,

      paddingX: 900,
      paddingY: 500,
      minimumStageWidth: 4040,
      minimumStageHeight: 1800,

      parentPlaceholderHeight: 110,
      parentPlaceholderGap: 48,
      parentPlaceholderVerticalGap: 112,

      connectorRailOffset: 56,
      connectorLaneGap: 16,

      focusControlWidth: 84,
      focusControlHeight: 32,
      focusControlGap: 8
    });

    /*
    * Compatibility aliases keep the existing layout
    * implementation readable while all values still
    * come from one canonical source.
    */
    const {
      cardWidth:
        TREE_CARD_W,

      cardHeight:
        TREE_CARD_H,

      generationPitch:
        TREE_GENERATION_GAP,

      spouseGap:
        TREE_SPOUSE_GAP,

      siblingGap:
        TREE_SIBLING_GAP,

      subtreeGap:
        TREE_SUBTREE_GAP,

      paddingX:
        TREE_PADDING_X,

      paddingY:
        TREE_PADDING_Y,

      minimumStageWidth:
        TREE_MIN_STAGE_W,

      minimumStageHeight:
        TREE_MIN_STAGE_H,

      parentPlaceholderHeight:
        PLACEHOLDER_H,

      parentPlaceholderGap:
        TREE_PARENT_PLACEHOLDER_GAP,

      parentPlaceholderVerticalGap:
        TREE_PARENT_PLACEHOLDER_VERTICAL_GAP,

      connectorRailOffset:
        TREE_CONNECTOR_RAIL_OFFSET,

      focusControlWidth:
        TREE_FOCUS_CONTROL_W,

      focusControlHeight:
        TREE_FOCUS_CONTROL_H,

      focusControlGap:
        TREE_FOCUS_CONTROL_GAP
    } = TREE_GEOMETRY;

    function treeParentPlaceholderWidth(roleCount) {
      const count = Math.max(1, Math.min(2, Number(roleCount) || 1));
      return (TREE_CARD_W - (count - 1) * TREE_PARENT_PLACEHOLDER_GAP) / count;
    }

    function personById(id) {
      const centralPerson = getPerson(id);
      if (centralPerson) return toTreePerson(centralPerson);
      return currentTreePeople()[0] || null;
    }

    function layoutFamilyTreeHorizontally({
      positionedPeople,
      parentPlaceholders = [],
      families = [],
      focalPersonId = '',
      focusActionPersonIds = new Set()
    } = {}) {
      if (!positionedPeople?.length) {
        return;
      }

      const peopleById = new Map(
        positionedPeople.map(person => [
          person.id,
          person
        ])
      );

      const sourceOrderById = new Map(
        positionedPeople.map((person, index) => [
          person.id,
          Number.isFinite(person.sourceIndex)
            ? person.sourceIndex
            : index
        ])
      );

      const familyOrderById = new Map(
        families.map((family, index) => [
          family.id,
          index
        ])
      );

      const parentFamilyByChild = new Map();

      families.forEach(family => {
        (family.children || []).forEach(childId => {
          if (!parentFamilyByChild.has(childId)) {
            parentFamilyByChild.set(
              childId,
              family
            );
          }
        });
      });

      /*
      * Partner-connected people form rigid blocks. Partner
      * distance is resolved inside the block; the layered
      * layout moves the complete block.
      */
      const disjointParent = new Map(
        positionedPeople.map(person => [
          person.id,
          person.id
        ])
      );

      function findRoot(personId) {
        const parentId =
          disjointParent.get(personId);

        if (
          !parentId
          || parentId === personId
        ) {
          return parentId || personId;
        }

        const rootId =
          findRoot(parentId);

        disjointParent.set(
          personId,
          rootId
        );

        return rootId;
      }

      function unionPeople(leftId, rightId) {
        const leftRoot =
          findRoot(leftId);

        const rightRoot =
          findRoot(rightId);

        if (
          leftRoot
          && rightRoot
          && leftRoot !== rightRoot
        ) {
          disjointParent.set(
            rightRoot,
            leftRoot
          );
        }
      }

      families.forEach(family => {
        const left =
          peopleById.get(family.left);

        const right =
          peopleById.get(family.right);

        if (
          left
          && right
          && left.generation
            === right.generation
        ) {
          unionPeople(
            left.id,
            right.id
          );
        }
      });

      const blocks = [];
      const blockById = new Map();
      const blockByPersonId = new Map();

      positionedPeople.forEach(person => {
        const rootId =
          findRoot(person.id);

        const blockId =
          `people:${rootId}`;

        let block =
          blockById.get(blockId);

        if (!block) {
          block = {
            id: blockId,
            generation: person.generation,
            members: [],
            currentCenter: 0,
            width: 0,
            sourceOrder:
              Number.POSITIVE_INFINITY,
            incomingModels: [],
            outgoingModels: [],
            primaryIncomingId: ''
          };

          blockById.set(blockId, block);
          blocks.push(block);
        }

        const member = {
          id: person.id,
          kind: 'person',
          ref: person,
          width: TREE_CARD_W,
          localCenter: 0,
          block
        };

        block.members.push(member);

        block.sourceOrder = Math.min(
          block.sourceOrder,
          sourceOrderById.get(person.id)
            ?? Number.POSITIVE_INFINITY
        );

        blockByPersonId.set(
          person.id,
          block
        );
      });

      /*
      * Attach missing-parent placeholders to the block of
      * their known partner. If neither parent exists, create
      * one placeholder-only parent block.
      */
      const placeholderBlockByChild = new Map();
      const placeholderMembersByChild = new Map();

      parentPlaceholders.forEach(placeholder => {
        const child =
          peopleById.get(placeholder.personId);

        if (!child) return;

        const parentFamily =
          parentFamilyByChild.get(child.id);

        const knownPartnerId =
          placeholder.rel === 'father'
            ? parentFamily?.right
            : parentFamily?.left;

        const knownPartner =
          knownPartnerId
            ? peopleById.get(knownPartnerId)
            : null;

        let block =
          knownPartner
            ? blockByPersonId.get(
                knownPartner.id
              )
            : placeholderBlockByChild.get(
                child.id
              );

        if (!block) {
          const blockId =
            `missing-parents:${child.id}`;

          block = {
            id: blockId,
            generation: child.generation - 1,
            members: [],
            currentCenter: 0,
            width: 0,
            sourceOrder:
              sourceOrderById.get(child.id)
              ?? Number.POSITIVE_INFINITY,
            incomingModels: [],
            outgoingModels: [],
            primaryIncomingId: ''
          };

          blockById.set(blockId, block);
          blocks.push(block);

          placeholderBlockByChild.set(
            child.id,
            block
          );
        }

        const member = {
          id: placeholder.id,
          kind: 'placeholder',
          role: placeholder.rel,
          childId: child.id,
          ref: placeholder,
          width:
            placeholder.width
            || treeParentPlaceholderWidth(1),
          localCenter: 0,
          block
        };

        block.members.push(member);

        placeholderBlockByChild.set(
          child.id,
          block
        );

        if (
          !placeholderMembersByChild.has(
            child.id
          )
        ) {
          placeholderMembersByChild.set(
            child.id,
            []
          );
        }

        placeholderMembersByChild
          .get(child.id)
          .push(member);
      });

      const partnershipKey =
        (leftId, rightId) =>
          [leftId, rightId]
            .sort()
            .join('|');

      const partnershipKeys = new Set(
        families
          .filter(family =>
            peopleById.has(family.left)
            && peopleById.has(family.right)
          )
          .map(family =>
            partnershipKey(
              family.left,
              family.right
            )
          )
      );

      function gapBetweenMembers(
        leftMember,
        rightMember
      ) {
        if (
          leftMember.kind === 'person'
          && rightMember.kind === 'person'
          && partnershipKeys.has(
            partnershipKey(
              leftMember.id,
              rightMember.id
            )
          )
        ) {
          return TREE_SPOUSE_GAP;
        }

        if (
          leftMember.kind === 'placeholder'
          || rightMember.kind === 'placeholder'
        ) {
          return TREE_PARENT_PLACEHOLDER_GAP;
        }

        return TREE_SIBLING_GAP;
      }

      function orderPartnerPath(personMembers) {
        if (personMembers.length < 2) {
          return personMembers;
        }

        const memberById = new Map(
          personMembers.map(member => [
            member.id,
            member
          ])
        );

        const neighboursById = new Map(
          personMembers.map(member => [
            member.id,
            []
          ])
        );

        families.forEach(family => {
          if (
            memberById.has(family.left)
            && memberById.has(family.right)
          ) {
            neighboursById
              .get(family.left)
              .push(family.right);

            neighboursById
              .get(family.right)
              .push(family.left);
          }
        });

        const isPath =
          [...neighboursById.values()]
            .every(neighbours =>
              neighbours.length <= 2
            );

        if (!isPath) {
          return personMembers;
        }

        const endpoints =
          personMembers
            .filter(member =>
              (
                neighboursById.get(member.id)
                || []
              ).length <= 1
            )
            .sort((left, right) =>
              Number(left.ref.x || 0)
              - Number(right.ref.x || 0)
            );

        if (!endpoints.length) {
          return personMembers;
        }

        const ordered = [];
        const visited = new Set();

        let previousId = null;
        let currentId = endpoints[0].id;

        while (
          currentId
          && !visited.has(currentId)
        ) {
          visited.add(currentId);
          ordered.push(memberById.get(currentId));

          const nextId =
            (
              neighboursById.get(currentId)
              || []
            ).find(neighbourId =>
              neighbourId !== previousId
              && !visited.has(neighbourId)
            );

          previousId = currentId;
          currentId = nextId || null;
        }

        return ordered.length
          === personMembers.length
            ? ordered
            : personMembers;
      }

      function orderFamilyBlockMembers(people, fathers, mothers) {
        const preferred = [
          ...fathers,
          ...orderPartnerPath(people),
          ...mothers
        ];

        if (!people.length || !(fathers.length + mothers.length)) {
          return preferred;
        }

        const personMembers = new Map(
          people.map(member => [member.id, member])
        );
        const neighbours = new Map(
          preferred.map(member => [member, new Set()])
        );

        const connect = (left, right) => {
          if (!left || !right || left === right) return;

          neighbours.get(left).add(right);
          neighbours.get(right).add(left);
        };

        families.forEach(family => {
          connect(
            personMembers.get(family.left),
            personMembers.get(family.right)
          );
        });

        [...fathers, ...mothers].forEach(member => {
          const family = parentFamilyByChild.get(member.childId);
          const knownParentId = member.role === 'father'
            ? family?.right
            : family?.left;

          connect(member, personMembers.get(knownParentId));
        });

        // Retain the existing handling for more complex partner networks.
        if ([...neighbours.values()].some(ids => ids.size > 2)) {
          return preferred;
        }

        const start = preferred.find(member =>
          neighbours.get(member).size === 1
        );

        if (!start) return preferred;

        const ordered = [];
        const visited = new Set();
        let current = start;

        while (current && !visited.has(current)) {
          visited.add(current);
          ordered.push(current);

          current = [...neighbours.get(current)].find(member =>
            !visited.has(member)
          );
        }

        return ordered.length === preferred.length
          ? ordered
          : preferred;
      }

      /*
      * Establish fixed coordinates inside each rigid block.
      */
      blocks.forEach(block => {
        const people =
          block.members
            .filter(member =>
              member.kind === 'person'
            )
            .sort((left, right) =>
              Number(left.ref.x || 0)
              - Number(right.ref.x || 0)
            );

        const fathers =
          block.members
            .filter(member =>
              member.kind === 'placeholder'
              && member.role === 'father'
            )
            .sort((left, right) =>
              String(left.id)
                .localeCompare(String(right.id))
            );

        const mothers =
          block.members
            .filter(member =>
              member.kind === 'placeholder'
              && member.role === 'mother'
            )
            .sort((left, right) =>
              String(left.id)
                .localeCompare(String(right.id))
            );

        block.members = orderFamilyBlockMembers(
          people,
          fathers,
          mothers
        );

        const currentLeft = Math.min(
          ...block.members.map(member =>
            Number(member.ref.x || 0)
          )
        );

        const currentRight = Math.max(
          ...block.members.map(member =>
            Number(member.ref.x || 0)
            + member.width
          )
        );

        block.currentCenter =
          (currentLeft + currentRight) / 2;

        let cursor = 0;

        block.members.forEach(
          (member, index) => {
            if (index) {
              cursor += gapBetweenMembers(
                block.members[index - 1],
                member
              );
            }

            member.localCenter =
              cursor + member.width / 2;

            cursor += member.width;
          }
        );

        block.width = cursor;

        block.members.forEach(member => {
          member.localCenter -=
            block.width / 2;
        });
      });

      function personMember(personId) {
        const block =
          blockByPersonId.get(personId);

        return block?.members.find(member =>
          member.kind === 'person'
          && member.id === personId
        ) || null;
      }

      function uniqueEntries(entries) {
        const seen = new Set();

        return entries.filter(entry => {
          const key =
            `${entry.block.id}:${entry.member.id}`;

          if (seen.has(key)) return false;

          seen.add(key);
          return true;
        });
      }

      /*
      * Convert family records into explicit virtual family
      * models. A family model is positioned between its
      * parents and its children during ordering.
      */
      const familyModels = [];
      const placeholderChildrenWithModel =
        new Set();

      families.forEach(family => {
        const visibleChildren =
          (family.children || [])
            .map(childId =>
              peopleById.get(childId)
            )
            .filter(Boolean);

        const childrenByGeneration = new Map();

        visibleChildren.forEach(child => {
          if (
            !childrenByGeneration.has(
              child.generation
            )
          ) {
            childrenByGeneration.set(
              child.generation,
              []
            );
          }

          childrenByGeneration
            .get(child.generation)
            .push(child);
        });

        childrenByGeneration.forEach(
          (children, childGeneration) => {
            const parentEntries = [];

            [family.left, family.right]
              .filter(Boolean)
              .forEach(parentId => {
                const member =
                  personMember(parentId);

                if (!member) return;

                parentEntries.push({
                  block: member.block,
                  member
                });
              });

            children.forEach(child => {
              const placeholderMembers =
                placeholderMembersByChild.get(
                  child.id
                )
                || [];

              placeholderMembers.forEach(member => {
                parentEntries.push({
                  block: member.block,
                  member
                });

                placeholderChildrenWithModel.add(
                  child.id
                );
              });
            });

            const childEntries =
              children
                .map(child => {
                  const member =
                    personMember(child.id);

                  return member
                    ? {
                        block: member.block,
                        member,
                        childId: child.id
                      }
                    : null;
                })
                .filter(Boolean);

            const normalizedParents =
              uniqueEntries(parentEntries);

            const normalizedChildren =
              uniqueEntries(childEntries);

            if (
              !normalizedParents.length
              || !normalizedChildren.length
            ) {
              return;
            }

            const model = {
              id:
                `family:${family.id}:`
                + `${childGeneration}`,
              familyId: family.id,
              order:
                familyOrderById.get(family.id)
                ?? 0,
              parentGeneration:
                Math.min(
                  ...normalizedParents.map(
                    entry =>
                      entry.block.generation
                  )
                ),
              childGeneration,
              parents: normalizedParents,
              children: normalizedChildren
            };

            familyModels.push(model);
          }
        );
      });

      /*
      * Missing parents may exist before a persistent family
      * record exists. Represent them with a synthetic family.
      */
      placeholderMembersByChild.forEach(
        (placeholderMembers, childId) => {
          if (
            placeholderChildrenWithModel.has(
              childId
            )
          ) {
            return;
          }

          const childMember =
            personMember(childId);

          if (!childMember) return;

          const parents =
            uniqueEntries(
              placeholderMembers.map(member => ({
                block: member.block,
                member
              }))
            );

          if (!parents.length) return;

          familyModels.push({
            id: `missing-family:${childId}`,
            familyId:
              `missing-parents:${childId}`,
            order: -1,
            parentGeneration:
              childMember.block.generation - 1,
            childGeneration:
              childMember.block.generation,
            parents,
            children: [
              {
                block: childMember.block,
                member: childMember,
                childId
              }
            ]
          });
        }
      );

      familyModels.forEach(model => {
        const parentBlocks =
          new Set(
            model.parents.map(entry =>
              entry.block
            )
          );

        const childBlocks =
          new Set(
            model.children.map(entry =>
              entry.block
            )
          );

        parentBlocks.forEach(block => {
          block.outgoingModels.push(model);
        });

        childBlocks.forEach(block => {
          block.incomingModels.push(model);
        });
      });

      /*
      * Every block chooses a primary incoming family for
      * sibling-contiguity constraints. The focal person’s
      * parent family receives priority for its block.
      */
      blocks.forEach(block => {
        const focalCandidate =
          block.incomingModels.find(model =>
            model.children.some(entry =>
              entry.childId === focalPersonId
            )
          );

        const primary =
          focalCandidate
          || [...block.incomingModels]
            .sort((left, right) =>
              left.order - right.order
              || String(left.id)
                .localeCompare(String(right.id))
            )[0];

        block.primaryIncomingId =
          primary?.id || '';
      });

      const rows = new Map();

      blocks.forEach(block => {
        if (!rows.has(block.generation)) {
          rows.set(block.generation, []);
        }

        rows.get(block.generation).push(block);
      });

      const generations =
        [...rows.keys()]
          .sort((left, right) =>
            left - right
          );

      rows.forEach(row => {
        row.sort((left, right) =>
          left.currentCenter - right.currentCenter
          || left.sourceOrder - right.sourceOrder
          || String(left.id)
            .localeCompare(String(right.id))
        );
      });

      function median(values) {
        const numeric =
          values
            .filter(Number.isFinite)
            .sort((left, right) =>
              left - right
            );

        if (!numeric.length) return null;

        const middle =
          Math.floor(numeric.length / 2);

        return numeric.length % 2
          ? numeric[middle]
          : (
              numeric[middle - 1]
              + numeric[middle]
            ) / 2;
      }

      function rowOrderIndex() {
        const result = new Map();

        rows.forEach(row => {
          row.forEach((block, index) => {
            result.set(block.id, index);
          });
        });

        return result;
      }

      function entryOrderIndex(entry, orderIndex) {
        const blockIndex = orderIndex.get(entry.block.id);
        return Number.isFinite(blockIndex)
          ? blockIndex + entry.member.localCenter / entry.block.width
          : null;
      }

      function neighbouringIndexes(
        block,
        direction,
        orderIndex
      ) {
        const models =
          direction === 'down'
            ? block.incomingModels
            : block.outgoingModels;

        const entries = [];

        models.forEach(model => {
          const neighbours =
            direction === 'down'
              ? model.parents
              : model.children;

          neighbours.forEach(entry => {
            const index = entryOrderIndex(entry, orderIndex);

            if (Number.isFinite(index)) {
              entries.push(index);
            }
          });
        });

        return entries;
      }

      /*
      * Reorder one generation. Blocks belonging to the same
      * primary sibling group are sorted as one unit and can
      * never be interleaved by an unrelated family.
      */
      function reorderGeneration(
        generation,
        direction
      ) {
        const row = rows.get(generation);

        if (!row?.length) return;

        const orderIndex =
          rowOrderIndex();

        const previousIndex = new Map(
          row.map((block, index) => [
            block.id,
            index
          ])
        );

        const unitsById = new Map();

        row.forEach(block => {
          const unitId =
            block.primaryIncomingId
              ? `siblings:${block.primaryIncomingId}`
              : `single:${block.id}`;

          if (!unitsById.has(unitId)) {
            unitsById.set(unitId, {
              id: unitId,
              blocks: [],
              target: null,
              previousIndex:
                previousIndex.get(block.id)
            });
          }

          unitsById
            .get(unitId)
            .blocks
            .push(block);
        });

        const units =
          [...unitsById.values()];

        units.forEach(unit => {
          unit.blocks.sort((left, right) => {
            if (left.primaryIncomingId && left.primaryIncomingId === right.primaryIncomingId) {
              const model = familyModels.find(item => item.id === left.primaryIncomingId);
              const childOrder = block => model.children.findIndex(entry => entry.block === block);
              return childOrder(left) - childOrder(right);
            }
            const leftTarget =
              median(
                neighbouringIndexes(
                  left,
                  direction,
                  orderIndex
                )
              );

            const rightTarget =
              median(
                neighbouringIndexes(
                  right,
                  direction,
                  orderIndex
                )
              );

            if (
              leftTarget !== null
              && rightTarget !== null
              && leftTarget !== rightTarget
            ) {
              return leftTarget - rightTarget;
            }

            return previousIndex.get(left.id)
              - previousIndex.get(right.id);
          });

          unit.target =
            median(
              unit.blocks.flatMap(block =>
                neighbouringIndexes(
                  block,
                  direction,
                  orderIndex
                )
              )
            );
        });

        units.sort((left, right) => {
          if (
            left.target !== null
            && right.target !== null
            && left.target !== right.target
          ) {
            return left.target
              - right.target;
          }

          if (left.target !== null) return -1;
          if (right.target !== null) return 1;

          return left.previousIndex
            - right.previousIndex;
        });

        rows.set(
          generation,
          units.flatMap(unit =>
            unit.blocks
          )
        );
      }

      function crossingScore() {
        const orderIndex =
          rowOrderIndex();

        const modelsByBand = new Map();

        familyModels.forEach(model => {
          const key =
            `${model.parentGeneration}:`
            + `${model.childGeneration}`;

          if (!modelsByBand.has(key)) {
            modelsByBand.set(key, []);
          }

          modelsByBand.get(key).push(model);
        });

        let crossings = 0;
        let span = 0;

        modelsByBand.forEach(models => {
          const virtualFamilies =
            models
              .map(model => {
                const parentIndexes =
                  model.parents
                    .map(entry =>
                      entryOrderIndex(entry, orderIndex)
                    )
                    .filter(Number.isFinite);

                const childIndexes =
                  model.children
                    .map(entry =>
                      entryOrderIndex(entry, orderIndex)
                    )
                    .filter(Number.isFinite);

                const target =
                  median([
                    ...parentIndexes,
                    ...childIndexes
                  ]);

                if (childIndexes.length) {
                  span +=
                    Math.max(...childIndexes)
                    - Math.min(...childIndexes);
                }

                return {
                  model,
                  parentIndexes,
                  childIndexes,
                  target:
                    target
                    ?? Number.POSITIVE_INFINITY
                };
              })
              .sort((left, right) =>
                left.target - right.target
                || left.model.order
                  - right.model.order
                || String(left.model.id)
                  .localeCompare(
                    String(right.model.id)
                  )
              );

          const parentEdges = [];
          const childEdges = [];

          virtualFamilies.forEach(
            (family, familyIndex) => {
              family.parentIndexes.forEach(
                parentIndex => {
                  parentEdges.push({
                    source: parentIndex,
                    target: familyIndex,
                    familyId:
                      family.model.id
                  });
                }
              );

              family.childIndexes.forEach(
                childIndex => {
                  childEdges.push({
                    source: familyIndex,
                    target: childIndex,
                    familyId:
                      family.model.id
                  });
                }
              );
            }
          );

          function countEdgeCrossings(edges) {
            let count = 0;

            for (
              let leftIndex = 0;
              leftIndex < edges.length;
              leftIndex += 1
            ) {
              for (
                let rightIndex =
                  leftIndex + 1;
                rightIndex < edges.length;
                rightIndex += 1
              ) {
                const left =
                  edges[leftIndex];

                const right =
                  edges[rightIndex];

                if (
                  left.familyId
                  === right.familyId
                  || left.source
                    === right.source
                  || left.target
                    === right.target
                ) {
                  continue;
                }

                if (
                  (
                    left.source
                    - right.source
                  )
                  * (
                    left.target
                    - right.target
                  )
                  < 0
                ) {
                  count += 1;
                }
              }
            }

            return count;
          }

          crossings +=
            countEdgeCrossings(parentEdges)
            + countEdgeCrossings(childEdges);
        });

        return {
          crossings,
          span
        };
      }

      let bestScore =
        crossingScore();

      let bestOrder = new Map(
        generations.map(generation => [
          generation,
          rows
            .get(generation)
            .map(block =>
              block.id
            )
        ])
      );

      const candidateOrders = new Map();
      function rememberOrder() {
        const order = new Map(generations.map(generation => [generation, rows.get(generation).map(block => block.id)]));
        candidateOrders.set(JSON.stringify([...order]), order);
      }
      rememberOrder();

      for (
        let sweep = 0;
        sweep < 12;
        sweep += 1
      ) {
        generations
          .slice(1)
          .forEach(generation => {
            reorderGeneration(
              generation,
              'down'
            );
          });

        // Also validate the ordering produced by the downward sweep.
        rememberOrder();

        generations
          .slice(0, -1)
          .reverse()
          .forEach(generation => {
            reorderGeneration(
              generation,
              'up'
            );
          });
          
        const score =
          crossingScore();
        rememberOrder();

        const isBetter =
          score.crossings
            < bestScore.crossings
          || (
            score.crossings
              === bestScore.crossings
            && score.span
              < bestScore.span
          );

        if (isBetter) {
          bestScore = score;

          bestOrder = new Map(
            generations.map(generation => [
              generation,
              rows
                .get(generation)
                .map(block =>
                  block.id
                )
            ])
          );
        }
      }

      function gapBetweenBlocks(
        leftBlock,
        rightBlock
      ) {
        const sameSiblingGroup =
          leftBlock.primaryIncomingId
          && leftBlock.primaryIncomingId
            === rightBlock.primaryIncomingId;

        return sameSiblingGroup
          ? TREE_SIBLING_GAP
          : TREE_SUBTREE_GAP
            + 16;
      }

      /*
      * Weighted isotonic compaction. This solves the row’s
      * hard separation constraints without pushing blocks
      * through one another.
      */
      function solveOrderedRow(
        row,
        targetById,
        weightById = new Map()
      ) {
        if (!row.length) {
          return new Map();
        }

        const separation = [0];

        for (
          let index = 1;
          index < row.length;
          index += 1
        ) {
          separation[index] =
            separation[index - 1]
            + row[index - 1].width / 2
            + gapBetweenBlocks(
                row[index - 1],
                row[index]
              )
            + row[index].width / 2;
        }

        const pools = [];

        row.forEach((block, index) => {
          const targetValue =
            Number(targetById.get(block.id));

          const target =
            (
              Number.isFinite(targetValue)
                ? targetValue
                : block.currentCenter
            )
            - separation[index];

          const weight = Math.max(
            1,
            Number(weightById.get(block.id))
            || 1
          );

          pools.push({
            start: index,
            end: index,
            weight,
            weightedTotal:
              target * weight,
            mean: target
          });

          while (
            pools.length > 1
            && pools[pools.length - 2].mean
              > pools[pools.length - 1].mean
          ) {
            const right = pools.pop();
            const left = pools.pop();

            const weight =
              left.weight + right.weight;

            const weightedTotal =
              left.weightedTotal
              + right.weightedTotal;

            pools.push({
              start: left.start,
              end: right.end,
              weight,
              weightedTotal,
              mean:
                weightedTotal / weight
            });
          }
        });

        const result = new Map();

        pools.forEach(pool => {
          for (
            let index = pool.start;
            index <= pool.end;
            index += 1
          ) {
            result.set(
              row[index].id,
              pool.mean
                + separation[index]
            );
          }
        });

        return result;
      }

      const positionByBlockId = new Map();

      function initializePositions() {
        positionByBlockId.clear();
        rows.forEach(row => {
          const targets = new Map(row.map(block => [block.id, block.currentCenter]));
          solveOrderedRow(row, targets).forEach((position, blockId) => {
            positionByBlockId.set(blockId, position);
          });
        });
      }

      function entryX(entry) {
        const blockCenter =
          positionByBlockId.get(
            entry.block.id
          );

        if (!Number.isFinite(blockCenter)) {
          return null;
        }

        return blockCenter
          + entry.member.localCenter;
      }

      function familyJunctionX(model) {
        const parentXs =
          model.parents
            .map(entryX)
            .filter(Number.isFinite);

        const childXs =
          model.children
            .map(entryX)
            .filter(Number.isFinite);

        const parentCenter =
          median(parentXs);

        const childCenter =
          childXs.length
            ? (
                Math.min(...childXs)
                + Math.max(...childXs)
              ) / 2
            : null;

        if (
          parentCenter !== null
          && childCenter !== null
        ) {
          return (
            parentCenter
            + childCenter
          ) / 2;
        }

        return parentCenter
          ?? childCenter;
      }

    /*
    * A family with one child should use a straight vertical
    * connector whenever its parent members belong to one
    * rigid block.
    *
    * Process generations from youngest to oldest. If a child
    * block is moved to align with its own descendants, its
    * parent block will subsequently follow that new position.
    */
    function enforceDirectSingleChildAlignments() {
      const eligibleModels =
        familyModels
          .map(model => {
            if (model.children.length !== 1) {
              return null;
            }

            const parentBlocks =
              [
                ...new Set(
                  model.parents.map(entry =>
                    entry.block
                  )
                )
              ];

            if (parentBlocks.length !== 1) {
              return null;
            }

            const parentBlock =
              parentBlocks[0];

            const childEntry =
              model.children[0];

            if (
              !childEntry
              || parentBlock.id
                === childEntry.block.id
            ) {
              return null;
            }

            const parentEntries =
              model.parents
                .filter(entry =>
                  entry.block.id
                    === parentBlock.id
                )
                .sort((left, right) => {
                  const leftEdge =
                    left.member.localCenter
                    - left.member.width / 2;

                  const rightEdge =
                    right.member.localCenter
                    - right.member.width / 2;

                  return leftEdge - rightEdge;
                });

            if (!parentEntries.length) {
              return null;
            }

            const first =
              parentEntries[0].member;

            const last =
              parentEntries[
                parentEntries.length - 1
              ].member;

            /*
            * Match the connector router:
            * - one parent: use its center;
            * - two parents: use the center of the gap
            *   between their inner edges.
            */
            const sourceOffset =
              parentEntries.length > 1
                ? (
                    (
                      first.localCenter
                      + first.width / 2
                    )
                    + (
                      last.localCenter
                      - last.width / 2
                    )
                  ) / 2
                : first.localCenter;

            return {
              model,
              parentBlock,
              childEntry,
              sourceOffset
            };
          })
          .filter(Boolean);

      const parentGenerations =
        [
          ...new Set(
            eligibleModels.map(item =>
              item.parentBlock.generation
            )
          )
        ]
          .sort((left, right) =>
            right - left
          );

      parentGenerations.forEach(generation => {
        const row =
          rows.get(generation);

        if (!row?.length) return;

        const requestsByBlockId =
          new Map();

        eligibleModels
          .filter(item =>
            item.parentBlock.generation
              === generation
          )
          .forEach(item => {
            const childBlockCenter =
              positionByBlockId.get(
                item.childEntry.block.id
              );

            if (
              !Number.isFinite(
                childBlockCenter
              )
            ) {
              return;
            }

            const childConnectionX =
              childBlockCenter
              + item.childEntry.member
                .localCenter;

            const requestedParentCenter =
              childConnectionX
              - item.sourceOffset;

            if (
              !requestsByBlockId.has(
                item.parentBlock.id
              )
            ) {
              requestsByBlockId.set(
                item.parentBlock.id,
                []
              );
            }

            requestsByBlockId
              .get(item.parentBlock.id)
              .push(requestedParentCenter);
          });

        if (!requestsByBlockId.size) {
          return;
        }

        const targets = new Map(
          row.map(block => [
            block.id,
            positionByBlockId.get(block.id)
            ?? block.currentCenter
          ])
        );

        const weights = new Map(
          row.map(block => [
            block.id,
            1
          ])
        );

        requestsByBlockId.forEach(
          (requestedCenters, blockId) => {
            targets.set(
              blockId,
              median(requestedCenters)
            );

            /*
            * This makes direct alignment effectively hard.
            * The row solver moves adjacent blocks when space
            * is required instead of leaving a visible jog.
            */
            weights.set(
              blockId,
              1000000
                * requestedCenters.length
            );
          }
        );

        solveOrderedRow(
          row,
          targets,
          weights
        ).forEach((position, blockId) => {
          positionByBlockId.set(
            blockId,
            position
          );
        });
      });
    }

      /*
      * Alternate top-down and bottom-up passes. Virtual family
      * junctions pull parent and child groups toward a common
      * center, while row separation remains a hard constraint.
      */
      function relaxGeneration(
        generation,
        direction
      ) {
        const row =
          rows.get(generation);

        if (!row?.length) return;

        const targets = new Map();
        const weights = new Map();

        row.forEach(block => {
          const models =
            direction === 'down'
              ? block.incomingModels
              : block.outgoingModels;

          const desiredCenters = [];

          models.forEach(model => {
            const junctionX =
              familyJunctionX(model);

            if (!Number.isFinite(junctionX)) {
              return;
            }

            const entries =
              direction === 'down'
                ? model.children
                : model.parents;

            entries
              .filter(entry =>
                entry.block.id === block.id
              )
              .forEach(entry => {
                desiredCenters.push(
                  junctionX
                  - entry.member.localCenter
                );
              });
          });

          const current =
            positionByBlockId.get(block.id)
            ?? block.currentCenter;

          const desired =
            median(desiredCenters);

          targets.set(
            block.id,
            desired === null
              ? current
              : current * 0.25
                + desired * 0.75
          );

          weights.set(
            block.id,
            1 + desiredCenters.length
          );
        });

        solveOrderedRow(
          row,
          targets,
          weights
        ).forEach((position, blockId) => {
          positionByBlockId.set(
            blockId,
            position
          );
        });
      }

      function solveCandidate(order) {
        order.forEach(
          (ids, generation) => {
            rows.set(
              generation,
              ids
                .map(id =>
                  blockById.get(id)
                )
                .filter(Boolean)
            );
          }
        );

        initializePositions();

        for (
          let iteration = 0;
          iteration < 16;
          iteration += 1
        ) {
          generations
            .slice(1)
            .forEach(generation => {
              relaxGeneration(
                generation,
                'down'
              );
            });

          generations
            .slice(0, -1)
            .reverse()
            .forEach(generation => {
              relaxGeneration(
                generation,
                'up'
              );
            });
        }

        enforceDirectSingleChildAlignments();
      }

      // Validate the actual routed geometry, including each partner's attachment,
      // before accepting an ordering produced by the inexpensive crossing heuristic.
      function routedCandidateIssues() {
        const clones = new Map();
        blocks.forEach(block => block.members.forEach(member => {
          const x = Math.round(positionByBlockId.get(block.id) + member.localCenter - member.width / 2);
          const height = member.ref.height || member.ref.h;
          clones.set(member.ref, {
            ...member.ref, x, width: member.width, height,
            leftX: x, rightX: x + member.width, centerX: x + member.width / 2,
            topY: member.ref.y, bottomY: member.ref.y + height, centerY: member.ref.y + height / 2
          });
        }));
        const candidatePeople = positionedPeople.map(person => clones.get(person));
        const candidatePlaceholders = parentPlaceholders.map(placeholder => clones.get(placeholder));
        const parentPlaceholdersByPerson = {};
        candidatePlaceholders.forEach(placeholder => (parentPlaceholdersByPerson[placeholder.personId] ||= []).push(placeholder));
        const candidate = {
          positionedPeople: candidatePeople,
          peopleById: Object.fromEntries(candidatePeople.map(person => [person.id, person])),
          parentPlaceholders: candidatePlaceholders, parentPlaceholdersByPerson, families,
          focusControls: candidatePeople.filter(person => focusActionPersonIds.has(person.id)).map(person => ({
            personId: person.id, x: person.rightX - TREE_FOCUS_CONTROL_W,
            y: person.y - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP,
            width: TREE_FOCUS_CONTROL_W, height: TREE_FOCUS_CONTROL_H
          }))
        };
        candidate.connectorDescriptors = buildTreeConnectorDescriptors(candidate, { arrangeBands: true });
        return validateTreeLayout(candidate).length;
      }
      solveCandidate(bestOrder);
      let routedIssues = routedCandidateIssues();
      let acceptedPositions = new Map(positionByBlockId);
      if (routedIssues) {
        for (const order of candidateOrders.values()) {
          solveCandidate(order);
          const issues = routedCandidateIssues();
          const displacement = positions => blocks.reduce((sum, block) => sum + Math.abs(positions.get(block.id) - block.currentCenter), 0);
          if (issues < routedIssues || (issues === routedIssues && displacement(positionByBlockId) < displacement(acceptedPositions))) {
            routedIssues = issues;
            acceptedPositions = new Map(positionByBlockId);
          }
          if (!routedIssues) break;
        }
      }
      acceptedPositions.forEach((position, id) => positionByBlockId.set(id, position));

      /*
      * Keep the focal person at its original center so adding
      * a relative does not move the complete canvas.
      */
      const focalPerson =
        peopleById.get(focalPersonId);

      const focalBlock =
        blockByPersonId.get(focalPersonId);

      const focalMember =
        personMember(focalPersonId);

      const originalFocalCenter =
        focalPerson
          ? focalPerson.x
            + TREE_CARD_W / 2
          : null;

      const calculatedFocalCenter =
        focalBlock
        && focalMember
          ? positionByBlockId.get(
              focalBlock.id
            )
            + focalMember.localCenter
          : null;

      const globalShift =
        Number.isFinite(originalFocalCenter)
        && Number.isFinite(calculatedFocalCenter)
          ? originalFocalCenter
            - calculatedFocalCenter
          : 0;

      blocks.forEach(block => {
        const blockCenter =
          (
            positionByBlockId.get(block.id)
            ?? block.currentCenter
          )
          + globalShift;

        block.members.forEach(member => {
          member.ref.x = Math.round(
            blockCenter
            + member.localCenter
            - member.width / 2
          );
        });
      });
    }

    function validateTreeLayout(layout) {
      const issues = [];

      const rectangles = [
        ...(layout.positionedPeople || [])
          .map(person => ({
            id: `person:${person.id}`,
            left: person.leftX,
            right: person.rightX,
            top: person.topY,
            bottom: person.bottomY
          })),

        ...(layout.parentPlaceholders || [])
          .map(placeholder => ({
            id:
              `placeholder:${placeholder.id}`,
            left: placeholder.leftX,
            right: placeholder.rightX,
            top: placeholder.topY,
            bottom: placeholder.bottomY
          })),
        ...(layout.focusControls || []).map(control => ({
          id: `focus:${control.personId}`,
          left: control.x,
          right: control.x + control.width,
          top: control.y,
          bottom: control.y + control.height
        }))
      ];

      const placeholderGroups = new Map();
      (layout.parentPlaceholders || []).forEach(placeholder => {
        if (!placeholderGroups.has(placeholder.personId)) placeholderGroups.set(placeholder.personId, []);
        placeholderGroups.get(placeholder.personId).push(placeholder);
      });
      placeholderGroups.forEach((group, personId) => {
        const width = Math.max(...group.map(node => node.rightX)) - Math.min(...group.map(node => node.leftX));
        if (width !== TREE_CARD_W || group.some(node => node.width !== treeParentPlaceholderWidth(group.length))) {
          issues.push({ type: 'placeholder-width', personId, width, expectedWidth: TREE_CARD_W });
        }
      });
      (layout.connectorBands || []).forEach(band => {
        const rails = band.families.map(family => family.railY);
        if (Math.min(...rails) - band.parentBottomY !== TREE_CONNECTOR_RAIL_OFFSET
          || band.childTopY - Math.max(...rails) !== TREE_CONNECTOR_RAIL_OFFSET) {
          issues.push({ type: 'rail-clearance', generation: band.generation, familyIds: band.families.map(family => family.familyId) });
        }
        band.families.forEach(family => {
          if (family.laneConflict || family.railY !== band.parentBottomY + TREE_CONNECTOR_RAIL_OFFSET + family.laneIndex * TREE_GEOMETRY.connectorLaneGap) {
            issues.push({ type: 'routing-lane', familyId: family.familyId, lane: family.laneIndex });
          }
          (layout.focusControls || []).forEach(control => {
            const person = layout.peopleById[control.personId];
            if (person?.generation === band.generation && control.y - family.railY < TREE_GEOMETRY.connectorLaneGap) {
              issues.push({ type: 'focus-clearance', familyId: family.familyId, personId: control.personId });
            }
          });
        });
        band.families.forEach((left, index) => band.families.slice(index + 1).forEach(right => {
          if (left.childXs.some(leftX => right.childXs.some(rightX => (left.sourceX - right.sourceX) * (leftX - rightX) < 0))) {
            issues.push({ type: 'ancestor-order', leftFamilyId: left.familyId, rightFamilyId: right.familyId });
          }
        }));
      });

      function rectanglesOverlap(left, right) {
        return (
          left.left < right.right
          && left.right > right.left
          && left.top < right.bottom
          && left.bottom > right.top
        );
      }

      for (
        let leftIndex = 0;
        leftIndex < rectangles.length;
        leftIndex += 1
      ) {
        for (
          let rightIndex =
            leftIndex + 1;
          rightIndex < rectangles.length;
          rightIndex += 1
        ) {
          const left =
            rectangles[leftIndex];

          const right =
            rectangles[rightIndex];

          if (rectanglesOverlap(left, right)) {
            issues.push({
              type: 'node-node',
              leftId: left.id,
              rightId: right.id
            });
          }
        }
      }

      const segments = [];

      (layout.connectorDescriptors || [])
        .forEach(descriptor => {
          const points =
            descriptor.points || [];

          for (
            let index = 1;
            index < points.length;
            index += 1
          ) {
            const start =
              points[index - 1];

            const end =
              points[index];

            if (
              start.x === end.x
              && start.y === end.y
            ) {
              continue;
            }

            segments.push({
              familyId:
                String(
                  descriptor.familyId
                  || ''
                ),
              role: descriptor.role,
              childId:
                descriptor.childId || '',
              start,
              end,
              horizontal:
                start.y === end.y,
              vertical:
                start.x === end.x
            });
          }
        });

      function segmentIntersectsRectangle(
        segment,
        rectangle
      ) {
        if (segment.horizontal) {
          const minX = Math.min(
            segment.start.x,
            segment.end.x
          );

          const maxX = Math.max(
            segment.start.x,
            segment.end.x
          );

          return (
            segment.start.y > rectangle.top
            && segment.start.y < rectangle.bottom
            && maxX > rectangle.left
            && minX < rectangle.right
          );
        }

        if (segment.vertical) {
          const minY = Math.min(
            segment.start.y,
            segment.end.y
          );

          const maxY = Math.max(
            segment.start.y,
            segment.end.y
          );

          return (
            segment.start.x > rectangle.left
            && segment.start.x < rectangle.right
            && maxY > rectangle.top
            && minY < rectangle.bottom
          );
        }

        return false;
      }

      segments.forEach(segment => {
        rectangles.forEach(rectangle => {
          if (
            segmentIntersectsRectangle(
              segment,
              rectangle
            )
          ) {
            issues.push({
              type: 'edge-node',
              familyId: segment.familyId,
              role: segment.role,
              nodeId: rectangle.id
            });
          }
        });
      });

      function rangeOverlap(
        leftStart,
        leftEnd,
        rightStart,
        rightEnd
      ) {
        return (
          Math.min(leftEnd, rightEnd)
          - Math.max(leftStart, rightStart)
        );
      }

      for (
        let leftIndex = 0;
        leftIndex < segments.length;
        leftIndex += 1
      ) {
        for (
          let rightIndex =
            leftIndex + 1;
          rightIndex < segments.length;
          rightIndex += 1
        ) {
          const left =
            segments[leftIndex];

          const right =
            segments[rightIndex];

          if (
            left.familyId
            === right.familyId
          ) {
            continue;
          }

          if (
            left.horizontal
            && right.horizontal
            && left.start.y
              === right.start.y
          ) {
            const overlap =
              rangeOverlap(
                Math.min(
                  left.start.x,
                  left.end.x
                ),
                Math.max(
                  left.start.x,
                  left.end.x
                ),
                Math.min(
                  right.start.x,
                  right.end.x
                ),
                Math.max(
                  right.start.x,
                  right.end.x
                )
              );

            if (overlap > 1) {
              issues.push({
                type: 'edge-overlap',
                leftFamilyId:
                  left.familyId,
                rightFamilyId:
                  right.familyId,
                orientation: 'horizontal'
              });
            }

            continue;
          }

          if (
            left.vertical
            && right.vertical
            && left.start.x
              === right.start.x
          ) {
            const overlap =
              rangeOverlap(
                Math.min(
                  left.start.y,
                  left.end.y
                ),
                Math.max(
                  left.start.y,
                  left.end.y
                ),
                Math.min(
                  right.start.y,
                  right.end.y
                ),
                Math.max(
                  right.start.y,
                  right.end.y
                )
              );

            if (overlap > 1) {
              issues.push({
                type: 'edge-overlap',
                leftFamilyId:
                  left.familyId,
                rightFamilyId:
                  right.familyId,
                orientation: 'vertical'
              });
            }

            continue;
          }

          const horizontal =
            left.horizontal
              ? left
              : right.horizontal
                ? right
                : null;

          const vertical =
            left.vertical
              ? left
              : right.vertical
                ? right
                : null;

          if (!horizontal || !vertical) {
            continue;
          }

          const horizontalMinX = Math.min(
            horizontal.start.x,
            horizontal.end.x
          );

          const horizontalMaxX = Math.max(
            horizontal.start.x,
            horizontal.end.x
          );

          const verticalMinY = Math.min(
            vertical.start.y,
            vertical.end.y
          );

          const verticalMaxY = Math.max(
            vertical.start.y,
            vertical.end.y
          );

          const crosses =
            vertical.start.x
              > horizontalMinX
            && vertical.start.x
              < horizontalMaxX
            && horizontal.start.y
              > verticalMinY
            && horizontal.start.y
              < verticalMaxY;

          if (crosses) {
            issues.push({
              type: 'edge-crossing',
              leftFamilyId:
                left.familyId,
              rightFamilyId:
                right.familyId
            });
          }
        }
      }

      return issues;
    }

    function calculateTreeLayout(people, families, focusPersonId = '', options = {}) {
      const focalPersonId = people.some(person => person.id === focusPersonId)
        ? focusPersonId
        : people[0]?.id || '';
      const branchRoles = options.branchRoles || {};
      const peopleByRawId = new Map(people.map((person, index) => [person.id, { ...person, sourceIndex: index }]));

      // --- Indexes ---
      const parentFamilyByChild = new Map(); // childId -> family (first parent-child family found)
      const childFamiliesByParent = new Map(); // parentId -> [family]
      families.forEach(family => {
        [family.left, family.right].filter(Boolean).forEach(pid => {
          if (!childFamiliesByParent.has(pid)) childFamiliesByParent.set(pid, []);
          childFamiliesByParent.get(pid).push(family);
        });
        (family.children || []).forEach(cid => {
          if (!parentFamilyByChild.has(cid)) parentFamilyByChild.set(cid, family);
        });
      });

      const layoutFamilyForPerson = personId => {
        const personFamilies = childFamiliesByParent.get(personId) || [];
        return personFamilies.find(family => (family.children || []).length)
          || personFamilies.find(family =>
            [family.left, family.right]
              .some(id => id && id !== personId && peopleByRawId.has(id))
          )
          || null;
      };

      // --- Generation assignment around the active focus person ---
      const generationByPerson = new Map();
      const visitGenQueue = [];
      const seedGen = (id, gen) => {
        if (!peopleByRawId.has(id)) return;
        if (generationByPerson.has(id)) return;
        generationByPerson.set(id, gen);
        visitGenQueue.push(id);
      };
      seedGen(focalPersonId, 0);
      while (visitGenQueue.length) {
        const id = visitGenQueue.shift();
        const gen = generationByPerson.get(id);
        const parentFam = parentFamilyByChild.get(id);
        if (parentFam) {
          if (parentFam.left) seedGen(parentFam.left, gen - 1);
          if (parentFam.right) seedGen(parentFam.right, gen - 1);
        }
        (childFamiliesByParent.get(id) || []).forEach(fam => {
          [fam.left, fam.right].filter(x => x && x !== id).forEach(pid => seedGen(pid, gen));
          (fam.children || []).forEach(cid => seedGen(cid, gen + 1));
        });
      }
      people.forEach(p => { if (!generationByPerson.has(p.id)) generationByPerson.set(p.id, 0); });
      const minGen = Math.min(0, ...generationByPerson.values());
      generationByPerson.forEach((v, k) => generationByPerson.set(k, v - minGen));

      // --- Placeholders ---
      const missingParentRoles = personId => {
        if (!branchRoles.placeholderPersonIds?.has(personId)) return [];
        const canonicalPresence = branchRoles.parentPresenceByPerson?.get(personId);
        if (canonicalPresence) {
          const missing = [];
          if (!canonicalPresence.father) missing.push('father');
          if (!canonicalPresence.mother) missing.push('mother');
          return missing;
        }
        const fam = parentFamilyByChild.get(personId);
        const missing = [];
        if (!fam) return ['father', 'mother'];
        if (!fam.left) missing.push('father');
        if (!fam.right) missing.push('mother');
        return missing;
      };
      const parentPlaceholderWidth = pid => {
        const c = missingParentRoles(pid).length;
        if (!c) return 0;
        return TREE_CARD_W;
      };
      const personSlotWidth = pid => Math.max(TREE_CARD_W, parentPlaceholderWidth(pid));

      // --- Ancestor half-widths (Reingold-Tilford-style): for a person, how far its
      // ancestor block extends to the left and right of the person's card center.
      // This lets us keep left-side ancestors on the left and right-side on the right
      // so branches never cross.
      const ancestorHalvesMemo = new Map();
      function ancestorHalves(personId) {
        if (ancestorHalvesMemo.has(personId)) return ancestorHalvesMemo.get(personId);
        const selfHalf = personSlotWidth(personId) / 2;
        // Cycle guard
        ancestorHalvesMemo.set(personId, { left: selfHalf, right: selfHalf });
        const fam = parentFamilyByChild.get(personId);
        if (!fam) {
          const result = { left: selfHalf, right: selfHalf };
          ancestorHalvesMemo.set(personId, result);
          return result;
        }
        const fatherId = fam.left && peopleByRawId.has(fam.left) ? fam.left : null;
        const motherId = fam.right && peopleByRawId.has(fam.right) ? fam.right : null;
        const placeholderHalf = treeParentPlaceholderWidth(missingParentRoles(personId).length) / 2;
        const fH = fatherId ? ancestorHalves(fatherId) : { left: placeholderHalf, right: placeholderHalf };
        const mH = motherId ? ancestorHalves(motherId) : { left: placeholderHalf, right: placeholderHalf };
        // Distance between father and mother card centers must fit both their inner ancestor extents
        const dist = Math.max(
          TREE_CARD_W + TREE_SPOUSE_GAP,
          fH.right + TREE_SPOUSE_GAP + mH.left
        );
        // person is centered between father and mother
        const left = Math.max(selfHalf, dist / 2 + fH.left);
        const right = Math.max(selfHalf, dist / 2 + mH.right);
        const result = { left, right, dist, fH, mH, fatherId, motherId, fam };
        ancestorHalvesMemo.set(personId, result);
        return result;
      }

      function descendantRowUnit(personId) {
        const childFam = layoutFamilyForPerson(personId);
        const spouseId = childFam
          ? (childFam.left === personId ? childFam.right : childFam.left)
          : null;
        const hasSpouse = Boolean(spouseId && peopleByRawId.has(spouseId));
        if (!hasSpouse) {
          return { width: TREE_CARD_W, personCenterOffset: TREE_CARD_W / 2 };
        }
        const spouseIsLeft = childFam.right === personId;
        return {
          width: TREE_CARD_W * 2 + TREE_SPOUSE_GAP,
          personCenterOffset: spouseIsLeft
            ? TREE_CARD_W + TREE_SPOUSE_GAP + TREE_CARD_W / 2
            : TREE_CARD_W / 2
        };
      }

      // --- Placement ---
      const positionedById = new Map();
      const familyAnchors = {};
      const placedIds = new Set();
      const anyGen0Missing = people.some(p => (generationByPerson.get(p.id) ?? 0) === 0 && missingParentRoles(p.id).length);
      const topOffset = anyGen0Missing ? PLACEHOLDER_H + TREE_PARENT_PLACEHOLDER_VERTICAL_GAP : 0;
      const generationY = gen => TREE_PADDING_Y + topOffset + gen * TREE_GENERATION_GAP;

      function placePerson(personId, centerX, gen) {
        if (placedIds.has(personId)) return;
        const person = peopleByRawId.get(personId);
        if (!person) return;
        placedIds.add(personId);
        const y = generationY(gen);
        const x = Math.round(centerX - TREE_CARD_W / 2);
        positionedById.set(personId, { ...person, x, y, w: TREE_CARD_W, h: TREE_CARD_H, generation: gen });
      }

      // Keep each ancestor couple compact and expand its two branches outward.
      // A column pair lets a parent couple line up with the household directly below.
      function placeAncestors(personId, centerX, gen, branchSide = 'center', columns = null) {
        const h = ancestorHalves(personId);
        if (!h.fam) return;
        const parentGen = gen - 1;
        const compactDistance = TREE_CARD_W + TREE_SPOUSE_GAP;
        let fatherCenter;
        let motherCenter;
        if (columns) {
          fatherCenter = columns.left;
          motherCenter = columns.right;
        } else if (branchSide === 'left') {
          fatherCenter = centerX - compactDistance;
          motherCenter = centerX;
        } else if (branchSide === 'right') {
          fatherCenter = centerX;
          motherCenter = centerX + compactDistance;
        } else {
          fatherCenter = centerX - compactDistance / 2;
          motherCenter = centerX + compactDistance / 2;
        }
        if (h.fatherId && !placedIds.has(h.fatherId)) {
          placePerson(h.fatherId, fatherCenter, parentGen);
          placeAncestors(h.fatherId, fatherCenter, parentGen, 'left');
        }
        if (h.motherId && !placedIds.has(h.motherId)) {
          placePerson(h.motherId, motherCenter, parentGen);
          placeAncestors(h.motherId, motherCenter, parentGen, 'right');
        }
        familyAnchors[h.fam.id] = familyAnchors[h.fam.id] || { family: h.fam, generation: parentGen };
      }

      function placeAncestorsSpread(personId, centerX, gen) {
        const h = ancestorHalves(personId);
        if (!h.fam) return;
        const parentGen = gen - 1;
        const compactDistance = TREE_CARD_W + TREE_SPOUSE_GAP;
        const requiredDistance = Math.max(compactDistance, h.dist || compactDistance);
        const branchOffset = Math.max(0, requiredDistance - compactDistance) / 2;
        const fatherCenter = centerX - compactDistance / 2;
        const motherCenter = centerX + compactDistance / 2;
        if (h.fatherId && !placedIds.has(h.fatherId)) {
          placePerson(h.fatherId, fatherCenter, parentGen);
          placeAncestorsSpread(h.fatherId, fatherCenter - branchOffset, parentGen);
        }
        if (h.motherId && !placedIds.has(h.motherId)) {
          placePerson(h.motherId, motherCenter, parentGen);
          placeAncestorsSpread(h.motherId, motherCenter + branchOffset, parentGen);
        }
        familyAnchors[h.fam.id] = familyAnchors[h.fam.id] || { family: h.fam, generation: parentGen };
      }

      function placeDescendants(personId, centerX, gen, options = {}) {
        const childFam = layoutFamilyForPerson(personId);
        if (!childFam) {
          if (!options.skipAncestors) placeAncestors(personId, centerX, gen);
          return;
        }
        const spouseId = childFam.left === personId ? childFam.right : childFam.left;
        let pairCenter = centerX;
        if (spouseId && peopleByRawId.has(spouseId)) {
          const spouseIsLeft = childFam.right === personId;
          const pairDist = TREE_CARD_W + TREE_SPOUSE_GAP;
          const spouseCenter = spouseIsLeft ? centerX - pairDist : centerX + pairDist;
          if (!placedIds.has(spouseId)) {
            placePerson(spouseId, spouseCenter, gen);
          }
          if (!options.skipAncestors) {
            const leftColumn = Math.min(centerX, spouseCenter);
            const rightColumn = Math.max(centerX, spouseCenter);
            placeAncestors(personId, centerX, gen, 'center', { left: leftColumn, right: rightColumn });
            placeAncestors(spouseId, spouseCenter, gen, spouseIsLeft ? 'left' : 'right');
          }
          pairCenter = (centerX + spouseCenter) / 2;
        } else if (!options.skipAncestors) {
          placeAncestors(personId, centerX, gen);
        }
        familyAnchors[childFam.id] = familyAnchors[childFam.id] || { family: childFam, generation: gen };
        const children = (childFam.children || []).filter(cid => peopleByRawId.has(cid));
        if (!children.length) return;
        const units = children.map(cid => ({ id: cid, ...descendantRowUnit(cid) }));
        const totalW = units.reduce((sum, unit) => sum + unit.width, 0)
          + Math.max(0, children.length - 1) * TREE_SIBLING_GAP;
        let cursor = pairCenter - totalW / 2;
        units.forEach(unit => {
          const childCenter = cursor + unit.personCenterOffset;
          placePerson(unit.id, childCenter, gen + 1);
          placeDescendants(unit.id, childCenter, gen + 1);
          cursor += unit.width + TREE_SIBLING_GAP;
        });
      }

      function placeFocusedSiblingRow(personId, familyCenterX, gen) {
        const parentFamily = parentFamilyByChild.get(personId);
        const siblings = (parentFamily?.children || []).filter(id => peopleByRawId.has(id));
        if (siblings.length < 2) return false;
        const units = siblings.map(id => ({ id, ...descendantRowUnit(id) }));
        const totalW = units.reduce((sum, unit) => sum + unit.width, 0)
          + Math.max(0, units.length - 1) * TREE_SIBLING_GAP;
        let cursor = familyCenterX - totalW / 2;
        units.forEach(unit => {
          const siblingCenter = cursor + unit.personCenterOffset;
          placePerson(unit.id, siblingCenter, gen);
          placeDescendants(unit.id, siblingCenter, gen, { skipAncestors: true });
          cursor += unit.width + TREE_SIBLING_GAP;
        });
        placeAncestorsSpread(personId, familyCenterX, gen);
        return true;
      }

      // Layout starts from the active focus person.
      const focalId = focalPersonId;
      if (focalId) {
        const focalGen = generationByPerson.get(focalId) ?? 0;
        // Enough left padding for focal's ancestor block
        const focalH = ancestorHalves(focalId);
        const focalX = TREE_PADDING_X + Math.max(focalH.left, TREE_CARD_W / 2);
        if (!placeFocusedSiblingRow(focalId, focalX, focalGen)) {
          placePerson(focalId, focalX, focalGen);
          placeDescendants(focalId, focalX, focalGen);
        }
      }

      // Fallback: any unplaced person to the right, grouped by generation
      const unplacedByGen = new Map();
      people.forEach(p => {
        if (placedIds.has(p.id)) return;
        const g = generationByPerson.get(p.id) ?? 0;
        if (!unplacedByGen.has(g)) unplacedByGen.set(g, []);
        unplacedByGen.get(g).push(p.id);
      });
      if (unplacedByGen.size) {
        let mx = TREE_PADDING_X;
        positionedById.forEach(p => { if (p.x + p.w > mx) mx = p.x + p.w; });
        let cursor = mx + TREE_SUBTREE_GAP;
        unplacedByGen.forEach((ids, g) => {
          ids.forEach(id => {
            placePerson(id, cursor + TREE_CARD_W / 2, g);
            cursor += TREE_CARD_W + TREE_SIBLING_GAP;
          });
        });
      }

      const positionedPeople = people.map(p => positionedById.get(p.id)).filter(Boolean);

      // Build parent placeholders (in parent row above each child)
      const parentPlaceholders = [];
      positionedPeople.forEach(person => {
        const roles = missingParentRoles(person.id);
        if (!roles.length) return;
        const placeholderWidth = treeParentPlaceholderWidth(roles.length);
        const blockWidth = roles.length * placeholderWidth + Math.max(0, roles.length - 1) * TREE_PARENT_PLACEHOLDER_GAP;
        const startX = Math.round(person.x + TREE_CARD_W / 2 - blockWidth / 2);
        const py = person.generation > 0 ? generationY(person.generation - 1) : (person.y - TREE_PARENT_PLACEHOLDER_VERTICAL_GAP - PLACEHOLDER_H);
        roles.forEach((role, i) => {
          const x = startX + i * (placeholderWidth + TREE_PARENT_PLACEHOLDER_GAP);
          parentPlaceholders.push({
            id: `${person.id}-${role}-placeholder`, personId: person.id, rel: role,
            label: role === 'father' ? 'Add father' : 'Add mother',
            x, y: py, width: placeholderWidth, height: PLACEHOLDER_H, generation: person.generation - 1,
            leftX: x, rightX: x + placeholderWidth, topY: py, bottomY: py + PLACEHOLDER_H,
            centerX: x + placeholderWidth / 2, centerY: py + PLACEHOLDER_H / 2
          });
        });
      });

      // A known parent and its missing partner are one visual family unit. Position
      // that placeholder beside the known parent before collision resolution so the
      // partner line can never span unrelated cards in the row.
      const initialPeopleById = new Map(positionedPeople.map(person => [person.id, person]));
      parentPlaceholders.forEach(placeholder => {
        const parentFamily = parentFamilyByChild.get(placeholder.personId);
        if (!parentFamily) return;
        const father = parentFamily.left ? initialPeopleById.get(parentFamily.left) : null;
        const mother = parentFamily.right ? initialPeopleById.get(parentFamily.right) : null;
        if (placeholder.rel === 'father' && !father && mother) {
          placeholder.x = mother.x - TREE_PARENT_PLACEHOLDER_GAP - placeholder.width;
        }
        if (placeholder.rel === 'mother' && !mother && father) {
          placeholder.x = father.x + TREE_CARD_W + TREE_PARENT_PLACEHOLDER_GAP;
        }
      });

      /*
      * Reorder family blocks, reduce relationship crossings,
      * and solve horizontal coordinates with hard non-overlap
      * constraints. Vertical positions are unchanged.
      */
      layoutFamilyTreeHorizontally({
        positionedPeople,
        parentPlaceholders,
        families,
        focalPersonId,
        focusActionPersonIds: branchRoles.focusActionPersonIds
      });

      // Recompute geometry
      positionedPeople.forEach(person => {
        person.width = TREE_CARD_W;
        person.height = TREE_CARD_H;
        person.leftX = person.x;
        person.rightX = person.x + TREE_CARD_W;
        person.topY = person.y;
        person.bottomY = person.y + TREE_CARD_H;
        person.centerX = person.x + TREE_CARD_W / 2;
        person.centerY = person.y + TREE_CARD_H / 2;
        person.layoutX = person.x;
        person.layoutY = person.y;
        person.missingParentRoles = missingParentRoles(person.id);
        person.isTopGeneration = person.generation === 0 || Boolean(person.missingParentRoles.length);
      });
      parentPlaceholders.forEach(pl => {
        pl.leftX = pl.x; pl.rightX = pl.x + pl.width;
        pl.topY = pl.y; pl.bottomY = pl.y + pl.height;
        pl.centerX = pl.x + pl.width / 2; pl.centerY = pl.y + pl.height / 2;
      });

      const focusControls = positionedPeople
        .filter(person => branchRoles.focusActionPersonIds?.has(person.id))
        .map(person => ({
          personId: person.id,
          x: Math.round(person.rightX - TREE_FOCUS_CONTROL_W),
          y: Math.round(person.topY - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP),
          width: TREE_FOCUS_CONTROL_W,
          height: TREE_FOCUS_CONTROL_H
        }));

      refreshTreeFamilyAnchors(families, positionedById, familyAnchors);

      const parentPlaceholdersByPerson = {};
      parentPlaceholders.forEach(pl => {
        if (!parentPlaceholdersByPerson[pl.personId]) parentPlaceholdersByPerson[pl.personId] = [];
        parentPlaceholdersByPerson[pl.personId].push(pl);
      });

      const connectorLayout = {
        positionedPeople,
        peopleById: Object.fromEntries(positionedPeople.map(person => [person.id, person])),
        families,
        parentPlaceholders,
        parentPlaceholdersByPerson,
        focusControls
      };
      buildTreeConnectorDescriptors(connectorLayout, { arrangeBands: true });
      refreshTreeFamilyAnchors(families, positionedById, familyAnchors);

      const focusControlLayoutNodes = focusControls.map(control => ({
        control,
        get leftX() { return this.control.x; },
        get rightX() { return this.control.x + this.control.width; },
        get topY() { return this.control.y; },
        get bottomY() { return this.control.y + this.control.height; }
      }));
      const layoutNodes = [...positionedPeople, ...parentPlaceholders, ...focusControlLayoutNodes];
      const leftEdge = Math.min(TREE_PADDING_X, ...layoutNodes.map(n => n.leftX ?? n.x));
      // If any node is negative, shift everything right
      if (leftEdge < TREE_PADDING_X) {
        const shift = TREE_PADDING_X - leftEdge;
        positionedPeople.forEach(p => {
          p.x += shift; p.leftX = p.x; p.rightX = p.x + p.w;
          p.centerX = p.x + p.w / 2; p.layoutX = p.x;
        });
        parentPlaceholders.forEach(pl => {
          pl.x += shift; pl.leftX = pl.x; pl.rightX = pl.x + pl.width; pl.centerX = pl.x + pl.width / 2;
        });
        focusControls.forEach(control => { control.x += shift; });
        refreshTreeFamilyAnchors(families, positionedById, familyAnchors);
      }
      const rightEdge = Math.max(TREE_MIN_STAGE_W - TREE_PADDING_X, ...layoutNodes.map(n => n.rightX ?? n.x + n.width));
      const bottomEdge = Math.max(
        TREE_MIN_STAGE_H - TREE_PADDING_Y,
        ...layoutNodes.map(node => node.bottomY ?? node.y + node.height)
      );
      const stageWidth = Math.ceil(rightEdge + TREE_PADDING_X);
      const stageHeight = Math.ceil(bottomEdge + TREE_PADDING_Y);
      const peopleById = Object.fromEntries(positionedPeople.map(p => [p.id, p]));
      const positionedLayoutById = new Map(positionedPeople.map(p => [p.id, p]));

      const layout = { positionedPeople, positionedById: positionedLayoutById, peopleById, families, familyAnchors, parentPlaceholders, parentPlaceholdersByPerson, focusControls, stageWidth, stageHeight };
      layout.connectorDescriptors =
        buildTreeConnectorDescriptors(layout);

      const treeLayoutIssues =
        validateTreeLayout(layout);

      if (treeLayoutIssues.length) {
        console.warn(
          '[Family Tree layout] Geometry issues detected',
          treeLayoutIssues
        );
      }
      return layout;
    }

    function refreshTreeFamilyAnchors(families, positionedById, familyAnchors) {
      families.forEach(family => {
        const parents = [family.left, family.right].map(id => positionedById.get(id)).filter(Boolean).sort((a, b) => a.x - b.x);
        if (!parents.length) return;
        const first = parents[0];
        const last = parents[parents.length - 1];
        const anchorX = parents.length > 1 ? Math.round(((first.x + first.w) + last.x) / 2) : Math.round(first.x + first.w / 2);
        const anchorY = Math.round(Math.max(...parents.map(parent => parent.y + parent.h)));
        const existing = familyAnchors[family.id] || {};
        familyAnchors[family.id] = { ...existing, x: anchorX, y: anchorY, family };
      });
    }

    function centerTreeOnPerson(personId = treeProjectViewState().focusPersonId) {
      const canvas = main.querySelector('.tree-canvas');
      const card = main.querySelector(`.tree-person-card[data-person-id="${CSS.escape(personId)}"]`);
      if (!canvas || !card) return;
      const zoom = state.treeZoom / 100;
      const cardX = Number.parseFloat(card.style.left) || 0;
      const cardY = Number.parseFloat(card.style.top) || 0;
      const cardCenterX = (cardX + TREE_CARD_W / 2) * zoom;
      const cardCenterY = (cardY + TREE_CARD_H / 2) * zoom;
      canvas.scrollLeft = Math.max(0, cardCenterX - canvas.clientWidth / 2);
      canvas.scrollTop = Math.max(0, cardCenterY - canvas.clientHeight / 2);
    }

    function getTreeCanvasScroll() {
      const canvas = main.querySelector('.tree-canvas');
      if (!canvas) return null;

      return {
        left: canvas.scrollLeft,
        top: canvas.scrollTop
      };
    }

    function captureTreeCanvasScroll(
      projectId =
        currentFamilyTreeProjectId()
    ) {
      if (!projectId) {
        return null;
      }

      const scroll =
        getTreeCanvasScroll();

      if (!scroll) {
        return null;
      }

      const view =
        treeProjectViewState(
          projectId
        );

      view.canvasScroll = {
        left:
          Math.max(
            0,
            Number(scroll.left) || 0
          ),

        top:
          Math.max(
            0,
            Number(scroll.top) || 0
          )
      };

      return view.canvasScroll;
    }

    function restoreTreeCanvasScroll(scroll) {
      if (!scroll) return;

      requestAnimationFrame(() => {
        const canvas = main.querySelector('.tree-canvas');
        if (!canvas) return;

        canvas.scrollLeft = scroll.left;
        canvas.scrollTop = scroll.top;
      });
    }

