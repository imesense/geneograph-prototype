function renderFamilyTreePreserveScroll()
{
    const scroll = getTreeCanvasScroll();

    // If another action intentionally wants to center on a person,
    // let that behavior win instead of restoring old scroll.
    const hasPendingCenter = Boolean(state.treeCenterTargetId);

    renderFamilyTree();

    if (!hasPendingCenter)
    {
        restoreTreeCanvasScroll(scroll);
    }
}

const treeZoomRuntime = {
    frame: null,
    delta: 0,
    clientX: 0,
    clientY: 0
};

function treeViewportPointAtClient(clientX, clientY)
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const zoom = state.treeZoom / 100;
    return {
        x: (canvas.scrollLeft + clientX - rect.left) / zoom,
        y: (canvas.scrollTop + clientY - rect.top) / zoom
    };
}

function restoreTreeViewportAnchor(point, clientX, clientY)
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas || !point) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = state.treeZoom / 100;
    canvas.scrollLeft = point.x * zoom - (clientX - rect.left);
    canvas.scrollTop = point.y * zoom - (clientY - rect.top);
}

function applyTreeZoomToDom(options = {})
{
    const canvas = main.querySelector('.tree-canvas');
    const stageSpace = canvas?.querySelector('.tree-stage-space');
    const stage = stageSpace?.querySelector('.tree-stage');
    if (!canvas || !stageSpace || !stage) return false;
    const scale = state.treeZoom / 100;
    const stageWidth = Number.parseFloat(stage.style.width) || stage.offsetWidth;
    const stageHeight = Number.parseFloat(stage.style.height) || stage.offsetHeight;
    stageSpace.style.width = `${stageWidth * scale}px`;
    stageSpace.style.height = `${stageHeight * scale}px`;
    stage.style.transform = `scale(${scale})`;
    const value = canvas.querySelector('.tree-zoom .zoom-value');
    if (value) value.textContent = `${state.treeZoom}%`;
    if (options.anchor)
    {
        restoreTreeViewportAnchor(options.anchor, options.clientX, options.clientY);
    }
    else if (options.center)
    {
        canvas.scrollLeft = options.center.x * scale - canvas.clientWidth / 2;
        canvas.scrollTop = options.center.y * scale - canvas.clientHeight / 2;
    }
    return true;
}

function setTreeZoom(nextZoom, options = {})
{
    const zoom = Math.max(70, Math.min(130, Math.round(nextZoom)));
    if (zoom === state.treeZoom) return false;
    const canvas = main.querySelector('.tree-canvas');
    const center = options.anchor ? null : canvas ? {
        x: (canvas.scrollLeft + canvas.clientWidth / 2) / (state.treeZoom / 100),
        y: (canvas.scrollTop + canvas.clientHeight / 2) / (state.treeZoom / 100)
    } : null;
    state.treeZoom = zoom;
    return applyTreeZoomToDom({ ...options, center });
}

function queueTreeWheelZoom(event)
{
    event.preventDefault();
    treeZoomRuntime.delta += event.deltaY;
    treeZoomRuntime.clientX = event.clientX;
    treeZoomRuntime.clientY = event.clientY;
    if (treeZoomRuntime.frame) return;
    treeZoomRuntime.frame = requestAnimationFrame(() =>
    {
        treeZoomRuntime.frame = null;
        const delta = treeZoomRuntime.delta;
        treeZoomRuntime.delta = 0;
        if (!delta) return;
        const clientX = treeZoomRuntime.clientX;
        const clientY = treeZoomRuntime.clientY;
        const anchor = treeViewportPointAtClient(clientX, clientY);
        setTreeZoom(state.treeZoom + (delta < 0 ? 10 : -10), { anchor, clientX, clientY });
    });
}

function bindTreeCanvasPan()
{
    const canvas = main.querySelector('.tree-canvas');

    if (!canvas) return;

    const DRAG_THRESHOLD = 4;

    /*
      * Person cards are intentionally omitted. Their non-control
      * surfaces can initiate panning, while clicking without
      * moving continues to activate the card.
      */
    const interactiveSelector = [
        '.add-parent-card',
        '.tree-zoom',
        'button',
        'input',
        'select',
        'textarea',
        'a',
        '[contenteditable="true"]'
    ].join(', ');

    let gesture = null;
    let suppressNextClick = false;

    const finishGesture = event =>
    {
        if (!gesture) return;

        if (
            event?.pointerId !== undefined &&
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const pointerId = gesture.pointerId;
        const didPan = gesture.didPan;

        gesture = null;
        canvas.classList.remove('is-panning');

        /*
        * A stationary press must remain a normal browser click.
        */
        if (!didPan)
        {
            suppressNextClick = false;
        }

        if (canvas.hasPointerCapture?.(pointerId))
        {
            try
            {
                canvas.releasePointerCapture(pointerId);
            }
            catch
            {
            /*
            * The browser may already have released capture.
            */
            }
        }
    };

    canvas.addEventListener('pointerdown', event =>
    {
        if (
            event.button !== 0 ||
          event.isPrimary === false ||
          event.pointerType === 'touch'
        )
        {
            return;
        }

        const target =
            event.target instanceof Element
                ? event.target
                : null;

        if (target?.closest(interactiveSelector))
        {
            return;
        }

        suppressNextClick = false;

        gesture = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: canvas.scrollLeft,
            startScrollTop: canvas.scrollTop,
            didPan: false
        };

        /*
        * Do not call setPointerCapture here. Keeping the original
        * pointer target is what allows stationary card clicks.
        */
    });

    canvas.addEventListener('pointermove', event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX = event.clientX - gesture.startX;
        const deltaY = event.clientY - gesture.startY;

        if (!gesture.didPan)
        {
            const distance = Math.hypot(deltaX, deltaY);

            if (distance < DRAG_THRESHOLD)
            {
                return;
            }

            gesture.didPan = true;
            suppressNextClick = true;
            canvas.classList.add('is-panning');

            /*
          * Capture only after this gesture has become a pan.
          */
            canvas.setPointerCapture?.(event.pointerId);

            window.getSelection()?.removeAllRanges();
        }

        event.preventDefault();

        canvas.scrollLeft =
            gesture.startScrollLeft - deltaX;

        canvas.scrollTop =
            gesture.startScrollTop - deltaY;
    });

    /*
      * Dragging from a card can still produce a synthetic click
      * after pointerup. Consume that click only when a real pan
      * crossed the drag threshold.
      */
    canvas.addEventListener(
        'click',
        event =>
        {
            if (!suppressNextClick) return;

            suppressNextClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
        true
    );

    canvas.addEventListener('pointerup', finishGesture);
    canvas.addEventListener('pointercancel', finishGesture);
    canvas.addEventListener('lostpointercapture', finishGesture);
}

const treeSearchRuntime = {
    input: null,
    menu: null,
    controller: null,
    results: [],
    activeIndex: -1
};

function hideTreeSearchResults()
{
    treeSearchRuntime.menu?.remove();
    treeSearchRuntime.menu = null;
    treeSearchRuntime.results = [];
    treeSearchRuntime.activeIndex = -1;
    treeSearchRuntime.input?.setAttribute('aria-expanded', 'false');
    treeSearchRuntime.input?.removeAttribute('aria-controls');
    treeSearchRuntime.input?.removeAttribute('aria-activedescendant');
}

function disposeTreeSearch()
{
    hideTreeSearchResults();
    treeSearchRuntime.controller?.abort();
    treeSearchRuntime.controller = null;
    treeSearchRuntime.input = null;
}

function positionTreeSearchResults()
{
    const { input, menu } = treeSearchRuntime;
    if (!input?.isConnected || !menu) return;

    const rect = input.closest('.app-search-field').getBoundingClientRect();
    const width = Math.min(332, window.innerWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    menu.style.maxHeight = `${Math.max(80, Math.min(360, Math.max(below, above)))}px`;
    menu.style.top = below >= Math.min(menu.scrollHeight, 280) || below >= above
        ? `${rect.bottom + 6}px`
        : `${Math.max(12, rect.top - Math.min(menu.scrollHeight, 360) - 6)}px`;
}

function setTreeSearchActiveIndex(index)
{
    const { input, menu, results } = treeSearchRuntime;
    if (!menu || !results.length) return;
    treeSearchRuntime.activeIndex = (index + results.length) % results.length;
    menu.querySelectorAll('[role="option"]').forEach((option, optionIndex) =>
    {
        const active = optionIndex === treeSearchRuntime.activeIndex;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-selected', String(active));
    });
    const activeOption = menu.querySelectorAll('[role="option"]')[treeSearchRuntime.activeIndex];
    input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({ block: 'nearest' });
}

function updateTreeSearchResults()
{
    const input = treeSearchRuntime.input;
    const query = input?.value.trim().toLocaleLowerCase();
    if (!query)
    {
        hideTreeSearchResults();
        return;
    }

    const projectId = currentFamilyTreeProjectId();
    const results = getPeople(projectId)
        .filter(person => !person.deleted)
        .filter(person =>
        {
            const names = [
                connectPersonName(person),
                person.names?.first,
                person.names?.middle,
                person.names?.last,
                person.names?.maiden
            ].filter(Boolean);
            return [...names, ...names.map(name => translateText(name))]
                .join(' ').toLocaleLowerCase().includes(query);
        })
        .sort((a, b) => connectPersonName(a).localeCompare(connectPersonName(b), state.language))
        .slice(0, 12);
    treeSearchRuntime.results = results;
    treeSearchRuntime.activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    const menu = treeSearchRuntime.menu || document.createElement('div');
    menu.id = 'treeSearchResults';
    menu.className = 'menu-popover tree-search-results';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', t('Search results'));
    menu.innerHTML = results.length
        ? results.map((person, index) => `<button id="treeSearchOption${index}" class="tree-recent-person" type="button" role="option" aria-selected="false" tabindex="-1" data-tree-search-person="${escapeHtml(person.id)}">
              ${renderPersonAvatar(person, 'small-avatar')}
              <span><strong>${escapeHtml(connectPersonName(person))}</strong><small>${escapeHtml(connectPersonLifeLine(person))}</small></span>
            </button>`).join('')
        : `<div class="tree-recent-people-empty" role="status">${escapeHtml(t('No matching people.'))}</div>`;
    if (!menu.isConnected) document.body.appendChild(menu);
    treeSearchRuntime.menu = menu;
    input.setAttribute('aria-controls', menu.id);
    input.setAttribute('aria-expanded', 'true');
    localizeUI(menu, { suppressObserverReplay: true });
    positionTreeSearchResults();
}

function bindTreeSearch()
{
    const input = main.querySelector('#treeSearch');
    if (!input) return;
    const controller = new AbortController();
    const { signal } = controller;
    treeSearchRuntime.input = input;
    treeSearchRuntime.controller = controller;

    input.addEventListener('input', updateTreeSearchResults, { signal });
    input.addEventListener('focus', updateTreeSearchResults, { signal });
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            if (!treeSearchRuntime.menu) return;
            event.preventDefault();
            event.stopPropagation();
            hideTreeSearchResults();
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            if (!treeSearchRuntime.menu) updateTreeSearchResults();
            if (!treeSearchRuntime.results.length) return;
            event.preventDefault();
            setTreeSearchActiveIndex(treeSearchRuntime.activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
        }
        else if (event.key === 'Enter' && treeSearchRuntime.menu)
        {
            const person = treeSearchRuntime.results[treeSearchRuntime.activeIndex < 0
                ? 0 : treeSearchRuntime.activeIndex];
            if (!person) return;
            event.preventDefault();
            hideTreeSearchResults();
            input.value = '';
            navigateFamilyTreeToPerson(person.id);
        }
    }, { signal });
    document.addEventListener('pointerdown', event =>
    {
        if (!input.closest('.app-search-field')?.contains(event.target)
            && !treeSearchRuntime.menu?.contains(event.target)) hideTreeSearchResults();
    }, { signal });
    document.addEventListener('scroll', positionTreeSearchResults, { capture: true, signal });
    window.addEventListener('resize', positionTreeSearchResults, { signal });
    document.addEventListener('pointerdown', event =>
    {
        const option = event.target.closest('[data-tree-search-person]');
        if (option && treeSearchRuntime.menu?.contains(option)) event.preventDefault();
    }, { signal });
    document.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-tree-search-person]');
        if (!option || !treeSearchRuntime.menu?.contains(option)) return;
        const personId = option.dataset.treeSearchPerson;
        hideTreeSearchResults();
        input.value = '';
        navigateFamilyTreeToPerson(personId);
    }, { signal });
}

function renderFamilyTree()
{
    disposeTreeSearch();
    sidebar.innerHTML = '';
    const treeProjectId =
        currentFamilyTreeProjectId();
    const treePeopleSource = currentTreePeople();
    const treeFamiliesSource = currentTreeFamilies();

    if (!treeProjectId || !treePeopleSource.length)
    {
        main.innerHTML = `
          <div class="tree-shell tree-shell-empty">
            <section class="tree-empty-state" aria-labelledby="treeEmptyTitle">
              <div class="tree-empty-state-card">
                <div class="tree-empty-state-icon" aria-hidden="true">${icon.tree}</div>
                <h1 id="treeEmptyTitle">${escapeHtml(t('Start your family tree'))}</h1>
                <p>${escapeHtml(t('Add the first person to begin building this project\'s family tree.'))}</p>
                <button class="button primary" type="button" data-tree-add-first-person>
                  ${icon.plus}
                  ${escapeHtml(t('Add first person'))}
                </button>
              </div>
            </section>
          </div>
        `;
        main.querySelector('[data-tree-add-first-person]')?.addEventListener('click', () =>
        {
            openAddPersonModal('Add person', 'Create a new person in this project');
        });
        return;
    }

    const treeViewState = treeProjectViewState(treeProjectId);
    const focusPersonId = resolveTreeFocusPersonId(treePeopleSource, treeProjectId);
    const projection = buildFamilyTreeProjection(treePeopleSource, treeFamiliesSource, {
        focusPersonId,
        ancestorGenerations: treeViewState.ancestorGenerations,
        descendantGenerations: treeViewState.descendantGenerations,
        showCousins: treeViewState.showCousins
    });
    const familyPeopleCountLabel =
        formatProjectPeopleCount(
            treeProjectId
        );

    if (!projection.people.some(person => person.id === state.selectedPersonId))
    {
        state.selectedPersonId = projection.focusPersonId;
    }
    const selected = projection.people.find(person => person.id === state.selectedPersonId)
        || projection.people.find(person => person.id === projection.focusPersonId)
        || projection.people[0];
    if (selected?.id)
    {
        rememberTreeSelectedPerson(
            selected.id,
            treeProjectId
        );
    }

    const canNavigateTreeBack =
        treeNavigationCanGo('back', treeProjectId);

    const canNavigateTreeForward =
        treeNavigationCanGo('forward', treeProjectId);

    const treeLayout = calculateTreeLayout(
        projection.people,
        projection.families,
        projection.focusPersonId,
        { branchRoles: projection.branchRoles }
    );
    main.innerHTML = `
        <div
          class="tree-shell"
          style="
            --tree-card-width:
              ${TREE_GEOMETRY.cardWidth}px;

            --tree-card-height:
              ${TREE_GEOMETRY.cardHeight}px;

            --tree-card-padding:
              ${TREE_GEOMETRY.cardPadding}px;

            --tree-card-content-gap:
              ${TREE_GEOMETRY.cardContentGap}px;

            --tree-avatar-size:
              ${TREE_GEOMETRY.avatarSize}px;

            --tree-placeholder-width:
              ${treeParentPlaceholderWidth(2)}px;

            --tree-placeholder-height:
              ${TREE_GEOMETRY.parentPlaceholderHeight}px;

            --tree-focus-control-width:
              ${TREE_GEOMETRY.focusControlWidth}px;

            --tree-focus-control-height:
              ${TREE_GEOMETRY.focusControlHeight}px;
          ">
          <div class="tree-toolbar">
            <div class="tree-toolbar-left">
              <button
                class="tree-icon-button tree-arrow-button"
                type="button"
                data-tree-navigation="back"
                aria-label="Back"
                title="Back"
                ${canNavigateTreeBack ? '' : 'disabled'}
              >
                ${icon.arrow}
              </button>

              <button
                class="tree-icon-button tree-arrow-button tree-arrow-button-forward"
                type="button"
                data-tree-navigation="forward"
                aria-label="Forward"
                title="Forward"
                ${canNavigateTreeForward ? '' : 'disabled'}
              >
                ${icon.arrow}
              </button>
              <button class="tree-control tree-control-select" type="button" data-tree-recent-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Recently selected people. Current person: ${escapeHtml(selected?.name || '')}">
                <span class="tree-control-focus-icon" aria-hidden="true">${icon.profile}</span>
                <span class="tree-control-name">${escapeHtml(selected?.name || '')}</span>
                <span class="tree-control-chevron" aria-hidden="true">${icon.chevron}</span>
              </button>
              <div class="view-modes" role="tablist" aria-label="Tree view mode">
                ${['Classic','Pedigree','Fan'].map(view => `<button class="view-mode ${state.treeView === view ? 'active' : ''}" type="button" role="tab" aria-selected="${state.treeView === view ? 'true' : 'false'}" aria-disabled="${view === 'Classic' ? 'false' : 'true'}" data-tree-view="${view}" title="${view === 'Classic' ? 'Classic view' : view + ' view will be added later'}">${view}</button>`).join('')}
              </div>
            <span
              class="people-count"
              role="group"
              aria-label="${
                    escapeHtml(
                        familyPeopleCountLabel
                    )
                }">

              ${icon.peoplegroup}

              <span class="people-count-number" aria-hidden="true">${getProjectPeopleCount(treeProjectId)}</span>
              <span class="people-count-label" aria-hidden="true">
                ${escapeHtml(
                    familyPeopleCountLabel
                )}
              </span>
            </span>
            </div>
            <div class="tree-toolbar-right">
              <label class="app-search-field">${icon.search}<input type="search" placeholder="Search people..." id="treeSearch" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-label="${escapeHtml(t('Search people'))}"></label>
              <button class="tree-action" type="button" data-toast="Export is planned for the Publish iteration." aria-label="Export" title="Export">${icon.export}<span class="tree-action-label">Export</span></button>
              <button class="tree-action" type="button" data-toast="Print preview will be added later." aria-label="Print" title="Print">${icon.print}<span class="tree-action-label">Print</span></button>
              <button class="tree-action" type="button" data-tree-settings aria-label="Tree Settings" title="Tree Settings">${icon.settings}<span class="tree-action-label">Tree Settings</span></button>
            </div>
          </div>
          <div class="tree-workspace ${state.treeInspectorCollapsed ? 'inspector-collapsed' : ''}">
            <button class="inspector-restore sidebar-toggle-icon sidebar-toggle-icon-restore" type="button" id="restoreInspector" aria-label="Show person sidebar">${icon.doublechevronSidebar}</button>
            <section class="tree-canvas" aria-label="Family tree canvas">
              <div class="tree-stage-space" style="width:${treeLayout.stageWidth * state.treeZoom / 100}px;height:${treeLayout.stageHeight * state.treeZoom / 100}px;">
                <div class="tree-stage" style="width:${treeLayout.stageWidth}px;height:${treeLayout.stageHeight}px;transform: scale(${state.treeZoom / 100});">
                  ${renderTreeLines(treeLayout)}
                  ${treeLayout.parentPlaceholders.map(renderTreeParentPlaceholder).join('')}
                  ${treeLayout.positionedPeople.map(renderTreePersonCard).join('')}
                  ${treeLayout.focusControls.map(renderTreeFocusControl).join('')}
                </div>
              </div>
              <div class="tree-zoom">
                <button class="zoom-button" type="button" data-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button>
                <div class="zoom-value">${state.treeZoom}%</div>
                <button class="zoom-button" type="button" data-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button>
                <button class="zoom-button" type="button" data-zoom="fit" aria-label="Fit tree">${icon.home}</button>
              </div>
            </section>
            ${renderPersonSidebar(selected.id, 'tree')}
          </div>
        </div>
      `;
    bindTreeCanvasPan();
    bindTreeSearch();
    main.querySelector('.tree-canvas')?.addEventListener('wheel', queueTreeWheelZoom, { passive: false });
    main
        .querySelectorAll('[data-tree-navigation]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                navigateTreeHistory(
                    button.dataset.treeNavigation
                );
            });
        });
    main
        .querySelectorAll('.tree-person-card[data-person-id]')
        .forEach(card =>
        {
            const selectCard = () =>
            {
                navigateFamilyTreeToPerson(
                    card.dataset.personId,
                    {
                        focusBranch: false,
                        center: false
                    }
                );
            };

            card.addEventListener('click', event =>
            {
                if (event.target.closest('button')) return;
                selectCard();
            });

            card.addEventListener('keydown', event =>
            {
                if (
                    event.target !== card ||
              !['Enter', ' '].includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();
                selectCard();
            });
        });
    main
        .querySelectorAll('[data-card-add]')
        .forEach(button =>
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const card =
                        button.closest(
                            '[data-person-id]'
                        );

                    const anchorPersonId =
                        card?.dataset.personId
                || state.selectedPersonId;

                    if (!anchorPersonId) return;

                    const currentFocusId = treeProjectViewState().focusPersonId;
                    if (currentFocusId !== anchorPersonId)
                    {
                        focusTreeBranchForRelative(anchorPersonId);
                        requestAnimationFrame(() =>
                        {
                            requestAnimationFrame(() =>
                            {
                                const refreshedButton = main.querySelector(
                                    `.tree-person-card[data-person-id="${CSS.escape(anchorPersonId)}"] [data-card-add="relative"]`
                                );
                                openRelativePopover(refreshedButton || button, anchorPersonId);
                            });
                        });
                        return;
                    }

                    state.selectedPersonId = anchorPersonId;

                    openRelativePopover(
                        button,
                        anchorPersonId
                    );
                }
            )
        );
    main.querySelectorAll('[data-card-edit]').forEach(button => button.addEventListener('click', e =>
    {
        e.stopPropagation();
        openEditPersonModal(button.dataset.cardEdit);
    }));
    main.querySelectorAll('[data-tree-card-focus]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const personId = button.dataset.treeCardFocus;
        if (personId) setTreeFocusPerson(personId);
    }));
    main.querySelectorAll('[data-add-relative]').forEach(button => button.addEventListener('click', () =>
    {
        const target = personById(button.dataset.personId || state.selectedPersonId);
        if (target?.id) focusTreeBranchForRelative(target.id);
        openAddPersonModal(`Add ${button.dataset.addRelative}`, `Create a new person and add as ${target.name.split(' ')[0]}'s ${button.dataset.addRelative}`, { relativeType: button.dataset.addRelative, personId: target.id });
    }));
    main.querySelectorAll('[data-tree-view]').forEach(button => button.addEventListener('click', () =>
    {
        if (button.dataset.treeView !== 'Classic')
        {
            showToast(`${button.dataset.treeView} view will be added later.`);
            return;
        }
        state.treeView = 'Classic';
        renderFamilyTree();
    }));
    main.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () =>
    {
        if (button.dataset.zoom === 'fit')
        {
            setTreeZoom(100);
            centerTreeOnPerson(treeProjectViewState().focusPersonId);
            return;
        }
        setTreeZoom(state.treeZoom + (button.dataset.zoom === 'in' ? 10 : -10));
    }));
    main.querySelector('[data-tree-recent-toggle]')?.addEventListener('click', event =>
    {
        event.stopPropagation();
        openTreeRecentPeopleMenu(event.currentTarget);
    });
    main.querySelector('[data-tree-settings]')?.addEventListener('click', openTreeSettingsModal);
    bindPersonSidebar(main, 'tree');
    if (state.treeCenterTargetId)
    {
        const targetId = state.treeCenterTargetId;
        state.treeCenterTargetId = '';
        requestAnimationFrame(() => centerTreeOnPerson(targetId));
    }
    const centerTargetId =
        state.treeCenterTargetId;

    state.treeCenterTargetId = '';

    if (centerTargetId)
    {
        requestAnimationFrame(
            () =>
                centerTreeOnPerson(
                    centerTargetId
                )
        );
    }
    else if (
        treeViewState.canvasScroll
    )
    {
        restoreTreeCanvasScroll(
            treeViewState.canvasScroll
        );
    }
}

function treeLayoutNode(layout, id)
{
    return id ? layout?.peopleById?.[id] || null : null;
}

function treeConnectorPath(points)
{
    const normalized = (points || [])
        .map(point => ({ x: Math.round(Number(point.x)), y: Math.round(Number(point.y)) }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
        .filter((point, index, list) => !index || point.x !== list[index - 1].x || point.y !== list[index - 1].y);
    if (normalized.length < 2) return '';
    return normalized.slice(1).reduce((path, point, index) =>
    {
        const previous = normalized[index];
        if (point.y === previous.y) return `${path} H${point.x}`;
        if (point.x === previous.x) return `${path} V${point.y}`;
        return `${path} L${point.x} ${point.y}`;
    }, `M${normalized[0].x} ${normalized[0].y}`);
}

function buildTreeConnectorDescriptors(
    layout,
    { arrangeBands = false } = {}
)
{
    const descriptors = [];
    const drafts = [];
    const partnerKeys = new Set();
    const partnerGroups = [];

    function normalizePoints(points)
    {
        return (points || [])
            .map(point => ({
                x: Math.round(
                    Number(point.x)
                ),
                y: Math.round(
                    Number(point.y)
                )
            }))
            .filter(point =>
                Number.isFinite(point.x)
            && Number.isFinite(point.y)
            )
            .filter((point, index, list) =>
                !index
            || point.x
              !== list[index - 1].x
            || point.y
              !== list[index - 1].y
            );
    }

    function addDescriptor(descriptor)
    {
        const points =
            normalizePoints(
                descriptor.points
            );

        const d =
            treeConnectorPath(points);

        if (!d) return;

        const key =
            `${descriptor.familyId}|`
          + `${descriptor.role}|`
          + `${descriptor.childId || ''}|`
          + d;

        if (
            descriptors.some(item =>
                item.key === key
            )
        )
        {
            return;
        }

        descriptors.push({
            ...descriptor,
            points,
            d,
            key
        });
    }

    function addPartnerConnector(
        familyId,
        parentNodes
    )
    {
        if (
            parentNodes.length < 2
          || partnerKeys.has(familyId)
        )
        {
            return;
        }

        partnerKeys.add(familyId);
        partnerGroups.push({ familyId, parentNodes });
    }

    function renderPartnerConnector({ familyId, parentNodes })
    {
        const ordered =
            [...parentNodes]
                .sort((left, right) =>
                    left.leftX - right.leftX
                );

        const first = ordered[0];
        const last =
            ordered[ordered.length - 1];

        const partnerY = Math.round(
            (
                first.centerY
            + last.centerY
            ) / 2
        );

        addDescriptor({
            familyId,
            role: 'partner',
            className: 'tree-line partner',
            points: [
                {
                    x: first.rightX,
                    y: first.centerY
                },
                {
                    x: first.rightX,
                    y: partnerY
                },
                {
                    x: last.leftX,
                    y: partnerY
                },
                {
                    x: last.leftX,
                    y: last.centerY
                }
            ]
        });
    }

    function addDraft({
        familyId,
        role,
        parentNodes,
        children
    })
    {
        if (
            !parentNodes.length
          || !children.length
        )
        {
            return;
        }

        const orderedParents =
            [...parentNodes]
                .sort((left, right) =>
                    left.leftX - right.leftX
                );

        const orderedChildren =
            [...children]
                .sort((left, right) =>
                    left.centerX - right.centerX
                );

        addPartnerConnector(
            familyId,
            orderedParents
        );

        const firstParent =
            orderedParents[0];

        const lastParent =
            orderedParents[
                orderedParents.length - 1
            ];

        const sourceX =
            orderedParents.length > 1
                ? Math.round(
                    (
                        firstParent.rightX
                  + lastParent.leftX
                    ) / 2
                )
                : Math.round(
                    firstParent.centerX
                );

        const sourceY =
            orderedParents.length > 1
                ? Math.round(
                    (
                        firstParent.centerY
                  + lastParent.centerY
                    ) / 2
                )
                : Math.round(
                    firstParent.bottomY
                );

        const childCenters =
            orderedChildren.map(child =>
                Math.round(child.centerX)
            );

        drafts.push({
            familyId,
            role,
            parentNodes: orderedParents,
            children: orderedChildren,
            sourceX,
            sourceY,
            parentBottomY:
            Math.max(
                ...orderedParents.map(parent =>
                    parent.bottomY
                )
            ),
            childTopY:
            Math.min(
                ...orderedChildren.map(child =>
                    child.topY
                )
            ),
            childGeneration:
            Math.min(
                ...orderedChildren.map(child =>
                    Number(child.generation)
                )
            ),
            minX:
            Math.min(
                sourceX,
                ...childCenters
            ),
            maxX:
            Math.max(
                sourceX,
                ...childCenters
            ),
            laneIndex: 0,
            railY: 0
        });
    }

    const parentFamilyByChild = new Map();

    (layout.families || []).forEach(family =>
    {
        (family.children || []).forEach(childId =>
        {
            if (!parentFamilyByChild.has(childId))
            {
                parentFamilyByChild.set(childId, family);
            }
        });
    });

    (layout.families || []).forEach(family =>
    {
        const children = (family.children || [])
            .map(id => treeLayoutNode(layout, id))
            .filter(Boolean);

        const knownParents = [family.left, family.right]
            .map(id => treeLayoutNode(layout, id))
            .filter(Boolean);

        const placeholders = (family.children || []).flatMap(childId =>
            parentFamilyByChild.get(childId)?.id === family.id
                ? layout.parentPlaceholdersByPerson?.[childId] || []
                : []
        );

        const parentNodes = [
            ...new Map(
                [...knownParents, ...placeholders].map(node => [
                    node.id,
                    node
                ])
            ).values()
        ];

        if (!parentNodes.length) return;

        // Preserve the partner line even for a childless family.
        addPartnerConnector(family.id, parentNodes);

        if (!children.length) return;

        // Use the same family grouping as the horizontal layout.
        addDraft({
            familyId: family.id,
            role: placeholders.length
                ? 'placeholder-descendant'
                : 'descendant',
            parentNodes,
            children
        });
    });

    // Preserve Add parents controls when no saved parent family exists.
    Object.entries(
        layout.parentPlaceholdersByPerson || {}
    ).forEach(([personId, placeholders]) =>
    {
        if (parentFamilyByChild.has(personId)) return;

        const child = treeLayoutNode(layout, personId);
        if (!child || !placeholders.length) return;

        addDraft({
            familyId: `missing-parents:${personId}`,
            role: 'placeholder-descendant',
            parentNodes: placeholders,
            children: [child]
        });
    });

    /*
      * Allocate lanes per complete generation band. Placeholder
      * and normal families now compete for the same lanes.
      */
    const draftsByBand = new Map();

    drafts.forEach(draft =>
    {
        const bandKey =
            Number.isFinite(
                draft.childGeneration
            )
                ? `generation:${draft.childGeneration}`
                : `coordinates:`
              + `${draft.parentBottomY}:`
              + `${draft.childTopY}`;

        if (!draftsByBand.has(bandKey))
        {
            draftsByBand.set(
                bandKey,
                []
            );
        }

        draftsByBand
            .get(bandKey)
            .push(draft);
    });

    draftsByBand.forEach(group =>
    {
        group.sort((left, right) =>
            left.minX - right.minX
          || left.sourceX - right.sourceX
          || String(left.familyId)
              .localeCompare(
                  String(right.familyId)
              )
        );

        const predecessors = new Map(group.map(draft => [draft, new Set()]));
        const insideRail = (draft, x) => x >= draft.minX && x <= draft.maxX;
        group.forEach(rail => group.forEach(other =>
        {
            if (rail === other) return;
            // A trunk must finish above a rail it would cross; a child drop starts below it.
            if (insideRail(rail, other.sourceX)) predecessors.get(rail).add(other);
            if (other.children.some(child => insideRail(rail, child.centerX))) predecessors.get(other).add(rail);
        }));

        const pending = new Set(group);
        const assigned = new Set();
        const lanes = [];
        while (pending.size)
        {
            const draft = [...pending].find(item => [...predecessors.get(item)].every(parent => assigned.has(parent)))
            || [...pending][0];
            draft.laneConflict = [...predecessors.get(draft)].some(parent => !assigned.has(parent));
            let lane = Math.max(0, ...[...predecessors.get(draft)].filter(parent => assigned.has(parent)).map(parent => parent.laneIndex + 1));
            while ((lanes[lane] || []).some(other => draft.minX <= other.maxX + 8 && draft.maxX + 8 >= other.minX)) lane += 1;
            if (!lanes[lane]) lanes[lane] = [];
            lanes[lane].push(draft);
            draft.laneIndex = lane;
            assigned.add(draft);
            pending.delete(draft);
        }
        group.laneCount = Math.max(1, lanes.length);
    });

    const rows = new Map();
    [...(layout.positionedPeople || []), ...(layout.parentPlaceholders || [])].forEach(node =>
    {
        if (!rows.has(node.generation)) rows.set(node.generation, []);
        rows.get(node.generation).push(node);
    });
    if (arrangeBands && rows.size)
    {
        const generations = [...rows.keys()].sort((left, right) => left - right);
        let nextTop = Math.min(...rows.get(generations[0]).map(node => node.y));
        generations.forEach((generation, index) =>
        {
            const row = rows.get(generation);
            row.forEach(node =>
            {
                node.y = nextTop;
                node.topY = nextTop;
                node.bottomY = nextTop + (node.height || node.h);
                node.centerY = nextTop + (node.height || node.h) / 2;
                if (node.layoutY !== undefined) node.layoutY = nextTop;
            });
            const nextGeneration = generations[index + 1];
            const laneCount = draftsByBand.get(`generation:${nextGeneration}`)?.laneCount || 1;
            nextTop += Math.max(...row.map(node => node.height || node.h))
            + TREE_CONNECTOR_RAIL_OFFSET * 2
            + (laneCount - 1) * TREE_GEOMETRY.connectorLaneGap;
        });
        (layout.focusControls || []).forEach(control =>
        {
            const person = treeLayoutNode(layout, control.personId);
            if (person) control.y = person.topY - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP;
        });
    }

    layout.connectorBands = [];
    draftsByBand.forEach(group =>
    {
        const generation = group[0].childGeneration;
        const parentRow = rows.get(generation - 1) || group.flatMap(draft => draft.parentNodes);
        const childRow = rows.get(generation) || group.flatMap(draft => draft.children);
        const parentBottomY = Math.max(...parentRow.map(node => node.bottomY));
        const childTopY = Math.min(...childRow.map(node => node.topY));
        group.forEach(draft =>
        {
            const first = draft.parentNodes[0];
            const last = draft.parentNodes[draft.parentNodes.length - 1];
            draft.sourceY = draft.parentNodes.length > 1
                ? Math.round((first.centerY + last.centerY) / 2)
                : Math.round(first.bottomY);
            draft.railY = parentBottomY + TREE_CONNECTOR_RAIL_OFFSET
            + draft.laneIndex * TREE_GEOMETRY.connectorLaneGap;
        });
        layout.connectorBands.push({
            generation, parentBottomY, childTopY, laneCount: group.laneCount,
            families: group.map(draft => ({
                familyId: draft.familyId, sourceX: draft.sourceX,
                childXs: draft.children.map(child => child.centerX),
                minX: draft.minX, maxX: draft.maxX,
                laneIndex: draft.laneIndex, railY: draft.railY, laneConflict: draft.laneConflict
            }))
        });
    });
    partnerGroups.forEach(renderPartnerConnector);

    drafts.forEach(draft =>
    {
        const directChild =
            draft.children.length === 1
                ? draft.children[0]
                : null;

        const hasDirectAlignment =
            directChild
          && Math.abs(
              Math.round(draft.sourceX)
            - Math.round(directChild.centerX)
          ) <= 1;

        if (hasDirectAlignment)
        {
            /*
          * Use one uninterrupted path. Do not split a direct
          * connection into trunk, zero-width rail and child drop.
          */
            addDescriptor({
                familyId:
              draft.familyId,

                role:
              `${draft.role}-direct`,

                childId:
              directChild.id,

                className:
              'tree-line descendant',

                points: [
                    {
                        x: draft.sourceX,
                        y: draft.sourceY
                    },
                    {
                        x: draft.sourceX,
                        y: directChild.topY
                    }
                ]
            });

            return;
        }
        addDescriptor({
            familyId: draft.familyId,
            role:
            `${draft.role}-trunk`,
            className:
            'tree-line descendant',
            points: [
                {
                    x: draft.sourceX,
                    y: draft.sourceY
                },
                {
                    x: draft.sourceX,
                    y: draft.railY
                }
            ]
        });

        addDescriptor({
            familyId: draft.familyId,
            role:
            `${draft.role}-rail`,
            className:
            'tree-line descendant',
            points: [
                {
                    x: draft.minX,
                    y: draft.railY
                },
                {
                    x: draft.maxX,
                    y: draft.railY
                }
            ]
        });

        draft.children.forEach(child =>
        {
            addDescriptor({
                familyId: draft.familyId,
                role:
              `${draft.role}-child`,
                childId: child.id,
                className:
              'tree-line descendant',
                points: [
                    {
                        x: child.centerX,
                        y: draft.railY
                    },
                    {
                        x: child.centerX,
                        y: child.topY
                    }
                ]
            });
        });
    });

    return descriptors.map(
        ({ key, ...descriptor }) =>
            descriptor
    );
}

function renderTreeLines(layout)
{
    const descriptors = layout.connectorDescriptors || buildTreeConnectorDescriptors(layout);
    const paths = descriptors.map(descriptor => `<path class="${descriptor.className}" data-tree-family-id="${escapeHtml(String(descriptor.familyId || ''))}" data-tree-connection-role="${escapeHtml(descriptor.role)}" ${descriptor.childId ? `data-tree-child-id="${escapeHtml(descriptor.childId)}"` : ''} d="${descriptor.d}"/>`);
    return `<svg class="tree-lines" viewBox="0 0 ${layout.stageWidth} ${layout.stageHeight}" width="${layout.stageWidth}" height="${layout.stageHeight}" aria-hidden="true">
        ${paths.join('\n        ')}
      </svg>`;
}

function renderTreeParentPlaceholder(placeholder)
{
    const target = personById(placeholder.personId);
    const displayLabel = translateText(placeholder.label);
    return `<button class="add-parent-card" type="button" style="left:${placeholder.x}px;top:${placeholder.y}px;--tree-placeholder-width:${placeholder.width}px" data-person-id="${placeholder.personId}" data-add-relative="${placeholder.rel}" aria-label="${escapeHtml(placeholder.label)} for ${escapeHtml(target.name)}"><span><span class="add-plus">${icon.plus}</span><span class="add-label">${escapeHtml(displayLabel).replace(' ', '<br>')}</span></span></button>`;
}

function renderTreeFocusControl(control)
{
    const person = personById(control.personId);
    if (!person) return '';
    const localizedName = translateText(person.name);
    const accessibleLabel = state.language === 'ru'
        ? `Показать ветвь для ${localizedName}`
        : `Focus branch for ${localizedName}`;
    const visibleLabel = state.language === 'ru' ? 'Фокус' : 'Focus';
    return `<button class="tree-focus-control" type="button" style="left:${control.x}px;top:${control.y}px" data-tree-card-focus="${escapeHtml(person.id)}" data-i18n-skip aria-label="${escapeHtml(accessibleLabel)}">${icon.focus}<span>${visibleLabel}</span></button>`;
}

function renderTreePersonCard(
    person
)
{
    const selected =
        person.id
          === state.selectedPersonId;

    const focused =
        person.id
          === treeProjectViewState()
              .focusPersonId;

    const displayName =
        String(
            person.name
          || 'Unnamed person'
        );

    return `
        <article
          class="
            tree-person-card
            ${treePersonGenderClass(person)}
            ${selected ? 'selected' : ''}
            ${focused ? 'is-focus-person' : ''}
          "
          style="
            left:${person.layoutX}px;
            top:${person.layoutY}px;
          "
          data-person-id="${escapeHtml(person.id)}"
          tabindex="0"
          aria-label="${escapeHtml(displayName)}"
          ${
                focused
                    ? 'aria-current="true"'
                    : ''
            }>

          <div class="tree-card-avatar-stack">
            ${renderPersonAvatar(
                person,
                'tree-avatar'
            )}

            ${
                focused
                    ? `
                  <span class="tree-focus-badge">
                    ${icon.focus}
                    <span>Focus</span>
                  </span>
                `
                    : ''
            }
          </div>

          <div class="tree-card-content">
            <h3
              class="tree-name"
              title="${escapeHtml(displayName)}">

              ${escapeHtml(displayName)}
            </h3>

            ${renderTreeCardDateLines(
                person
            )}
          </div>

          <div class="card-actions">
            <button
              class="card-action"
              type="button"
              data-card-edit="${escapeHtml(person.id)}"
              aria-label="Edit ${escapeHtml(displayName)}">

              ${icon.edit}
            </button>

            <button
              class="card-action"
              type="button"
              data-card-add="relative"
              aria-label="Add relative">

              ${icon.plus}
            </button>
          </div>
        </article>
      `;
}

function treePersonGenderClass(person)
{
    const gender = String(person?.gender || '').toLowerCase();

    if (gender === 'female') return 'female';
    if (gender === 'male') return 'male';

    return 'unknown-gender';
}

function renderTreeCardDateLines(person)
{
    const lines = [];
    const status = normalizeLivingStatus(person.status);
    const birthDate = String(person.birth || '').trim();
    const deathDate = String(person.death || '').trim();

    if (birthDate)
    {
        lines.push(`<span>Born: ${escapeHtml(birthDate)}</span>`);
    }

    if (status === 'Deceased')
    {
        lines.push(
            deathDate
                ? `<span>Died: ${escapeHtml(deathDate)}</span>`
                : '<span>Deceased</span>'
        );
    }
    else if (status === 'Unknown')
    {
        lines.push('<span>Unknown</span>');
    }

    return lines.length
        ? `<div class="tree-dates">${lines.join('')}</div>`
        : '';
}
function sectionIsOpen(id)
{
    return state.inspectorSections[id] !== false;
}

function renderInspectorSection(
    id,
    title,
    meta,
    content,
    actionHtml = '',
    options = {}
)
{
    const open =
        typeof options.open === 'boolean'
            ? options.open
            : sectionIsOpen(id);

    const toggleAttribute =
        options.toggleAttribute
            || 'data-toggle-section';

    const sectionId =
        options.sectionId
            || `section-${id}`;

    const showAction =
        open
            || options.alwaysShowAction;

    const inlineAction =
        showAction
            && actionHtml
            && options.inlineAction
            ? `
                <span class="panel-section-inline-action">
                  ${actionHtml}
                </span>
              `
            : '';

    const bodyAction =
        open
            && actionHtml
            && !options.inlineAction
            ? `
                <div class="panel-section-action">
                  ${actionHtml}
                </div>
              `
            : '';

    const footerHtml =
        open
            && options.footerHtml
            ? `
                <div class="panel-section-footer">
                  ${options.footerHtml}
                </div>
              `
            : '';

    const header = `
            <button
              class="panel-section-header"
              type="button"
              ${toggleAttribute}="${escapeHtml(id)}"
              aria-expanded="${open ? 'true' : 'false'}"
              aria-controls="${escapeHtml(sectionId)}">

              <span class="panel-section-heading">
                <h3>${escapeHtml(title)}</h3>

                ${
                    meta
                        ? `<span>${escapeHtml(meta)}</span>`
                        : ''
                }
              </span>

              ${
                    inlineAction
                        ? ''
                        : `
                    <span class="panel-section-extra">
                      <span
                        class="panel-section-arrow"
                        aria-hidden="true">
                      </span>
                    </span>
                  `
                }
            </button>
          `;

    const headerRow = inlineAction
        ? `
              <div class="panel-section-header-row">
                ${header}

                <span class="panel-section-extra">
                  ${inlineAction}

                  <span
                    class="panel-section-arrow"
                    aria-hidden="true">
                  </span>
                </span>
              </div>
            `
        : header;

    return `
            <section
              class="panel-section ${
                    open ? 'is-open' : ''
                }">

              ${headerRow}

              <div
                class="panel-section-body"
                id="${escapeHtml(sectionId)}"
                ${open ? '' : 'hidden'}>

                ${bodyAction}
                ${content}
                ${footerHtml}
              </div>
            </section>
          `;
}

function renderInspectorSectionEmpty(
    message
)
{
    return `
          <div class="inspector-section-empty">
            ${escapeHtml(
                translateText(message)
            )}
          </div>
        `;
}

function renderPersonPanelViewAll({
    resource,
    count,
    personId
})
{
    if (!count || !personId)
    {
        return '';
    }

    const nouns = {
        photos:
            count === 1
                ? 'photo'
                : 'photos',

        archive:
            count === 1
                ? 'file'
                : 'files',

        notes:
            count === 1
                ? 'note'
                : 'notes'
    };

    const noun =
        nouns[resource]
          || 'items';

    return `
          <button
            class="panel-section-view-all"
            type="button"
            data-person-resource-view="${
                escapeHtml(resource)
            }"
            data-person-resource-person="${
                escapeHtml(personId)
            }">

            <span>
              View all ${count}
              ${escapeHtml(noun)}
            </span>

            <span
              class="
                panel-section-view-all-icon
              "
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        `;
}

function renderPanelButtonLabel(iconHtml, label)
{
    return `<span class="panel-button-label">
        <span class="panel-button-icon" aria-hidden="true">${iconHtml}</span>
        <span class="panel-button-text">${escapeHtml(label)}</span>
      </span>`;
}

const APP_SORT_OPTIONS = Object.freeze({
    projects: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' },
        { value: 'people', label: 'People count' }
    ],

    people: [
        { value: 'first', label: 'First name' },
        { value: 'last', label: 'Last name' },
        { value: 'birth', label: 'Birth date' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    geneograph: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    albums: [
        { value: 'photoName', label: 'Photo name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'added', label: 'Date added' }
    ],

    archiveFiles: [
        { value: 'name', label: 'File name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'added', label: 'Date added' },
        { value: 'type', label: 'Type' }
    ],

    archiveSources: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    notes: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    places: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ]
});

const appSortControlRegistry =
    new Map();

function normalizeAppSortDirection(
    direction
)
{
    return direction === 'ascending'
        ? 'ascending'
        : 'descending';
}

function appSortTimestamp(value)
{
    const timestamp =
        Date.parse(value);

    return Number.isFinite(timestamp)
        ? timestamp
        : Number.NaN;
}

function appSortCollator()
{
    return new Intl.Collator(
        state.language === 'ru'
            ? 'ru'
            : 'en',
        {
            sensitivity: 'base',
            numeric: true
        }
    );
}

function compareAppSortValues(
    first,
    second,
    {
        type = 'text',
        direction = 'ascending'
    } = {}
)
{
    const normalizedDirection =
        normalizeAppSortDirection(
            direction
        );

    const firstMissing =
        type === 'number'
            ? !Number.isFinite(first)
            : !String(first ?? '').trim();

    const secondMissing =
        type === 'number'
            ? !Number.isFinite(second)
            : !String(second ?? '').trim();

    /*
      * Missing values are always last. Do this
      * before applying the direction multiplier.
      */
    if (firstMissing && secondMissing)
    {
        return 0;
    }

    if (firstMissing)
    {
        return 1;
    }

    if (secondMissing)
    {
        return -1;
    }

    let comparison;

    if (type === 'number')
    {
        comparison =
            first - second;
    }
    else
    {
        comparison =
            appSortCollator().compare(
                String(first),
                String(second)
            );
    }

    return normalizedDirection
        === 'descending'
        ? -comparison
        : comparison;
}

function appSortRecords(
    records,
    {
        field,
        direction,
        extractors,
        getFallback = null
    }
)
{
    const extractor =
        extractors[field]
        || Object.values(extractors)[0];

    return records
        .map((record, index) => ({
            record,
            index
        }))
        .sort((firstItem, secondItem) =>
        {
            const first =
                firstItem.record;

            const second =
                secondItem.record;

            const comparison =
                compareAppSortValues(
                    extractor.get(first),
                    extractor.get(second),
                    {
                        type:
                  extractor.type,
                        direction
                    }
                );

            if (comparison)
            {
                return comparison;
            }

            if (getFallback)
            {
                const fallbackComparison =
                    compareAppSortValues(
                        getFallback(first),
                        getFallback(second),
                        {
                            type: 'text',
                            direction
                        }
                    );

                if (fallbackComparison)
                {
                    return fallbackComparison;
                }
            }

            /*
          * Preserve source order for completely
          * equivalent records.
          */
            return (
                firstItem.index
            - secondItem.index
            );
        })
        .map(item => item.record);
}

function renderAppSortControl({
    id,
    field,
    direction,
    ariaLabel,
    options,
    className = ''
})
{
    const normalizedDirection =
        normalizeAppSortDirection(
            direction
        );

    const selectedOption =
        options.find(option =>
            option.value === field
        )
        || options[0];

    const directionLabel =
        normalizedDirection
          === 'ascending'
            ? 'Ascending'
            : 'Descending';

    return `
        <span
          class="
            app-sort-field
            ${escapeHtml(className)}
          "
          data-app-sort-control>

          <button
            class="app-sort-trigger"
            type="button"
            id="${escapeHtml(id)}"
            data-app-sort-trigger
            aria-label="${escapeHtml(
                `${ariaLabel}: ${
                    t(selectedOption.label)
                }, ${t(directionLabel)}`
            )}"
            aria-haspopup="dialog"
            aria-expanded="false">

            <span
              class="
                app-sort-icon
                ${
                    normalizedDirection
                    === 'ascending'
                        ? 'is-ascending'
                        : 'is-descending'
                }
              "
              aria-hidden="true">
              ${icon.sortLines}
            </span>

            <span class="app-sort-current">
              ${escapeHtml(
                    t(selectedOption.label)
                )}
            </span>

            <span
              class="app-sort-chevron"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </span>
      `;
}

function renderAppSortOption({
    value,
    label,
    selected,
    attribute
})
{
    return `
        <button
          class="app-sort-option"
          type="button"
          role="radio"
          aria-checked="${
                selected
                    ? 'true'
                    : 'false'
            }"
          ${attribute}="${escapeHtml(
                value
            )}">

          <span
            class="app-sort-option-check"
            aria-hidden="true">
            ${
                selected
                    ? icon.check
                    : ''
            }
          </span>

          <span>
            ${escapeHtml(t(label))}
          </span>
        </button>
      `;
}

function openAppSortPopover(
    id,
    focusSection = ''
)
{
    const config =
        appSortControlRegistry.get(id);

    const anchor =
        document.getElementById(id);

    if (
        !config
        || !anchor
    )
    {
        return;
    }

    closeMenu();

    const field =
        config.getField();

    const direction =
        normalizeAppSortDirection(
            config.getDirection()
        );

    const menu =
        document.createElement('div');

    menu.id =
        'projectMenu';

    menu.className =
        'menu-popover app-sort-popover';

    menu.dataset.appSortId =
        id;

    menu.setAttribute(
        'role',
        'dialog'
    );

    menu.setAttribute(
        'aria-label',
        t('Sort')
    );

    menu.innerHTML = `
        <section class="app-sort-popover-section">
          <div class="app-sort-popover-title">
            ${escapeHtml(t('Sort by'))}
          </div>

          <div
            class="app-sort-popover-group"
            role="radiogroup"
            aria-label="${escapeHtml(
                t('Sort by')
            )}">

            ${config.options
                .map(option =>
                    renderAppSortOption({
                        value:
                    option.value,

                        label:
                    option.label,

                        selected:
                    option.value
                      === field,

                        attribute:
                    'data-app-sort-field'
                    })
                )
                .join('')}
          </div>
        </section>

        <section class="app-sort-popover-section">
          <div class="app-sort-popover-title">
            ${escapeHtml(t('Direction'))}
          </div>

          <div
            class="app-sort-popover-group"
            role="radiogroup"
            aria-label="${escapeHtml(
                t('Direction')
            )}">

            ${renderAppSortOption({
                value:
                'ascending',

                label:
                'Ascending',

                selected:
                direction
                  === 'ascending',

                attribute:
                'data-app-sort-direction'
            })}

            ${renderAppSortOption({
                value:
                'descending',

                label:
                'Descending',

                selected:
                direction
                  === 'descending',

                attribute:
                'data-app-sort-direction'
            })}
          </div>
        </section>
      `;

    document.body.appendChild(menu);

    const rect =
        anchor.getBoundingClientRect();

    const margin =
        12;

    const left =
        Math.min(
            Math.max(
                margin,
                rect.right
              - menu.offsetWidth
            ),
            Math.max(
                margin,
                window.innerWidth
              - menu.offsetWidth
              - margin
            )
        );

    let top =
        rect.bottom + 6;

    if (
        top + menu.offsetHeight
          > window.innerHeight - margin
    )
    {
        top =
            Math.max(
                margin,
                rect.top
              - menu.offsetHeight
              - 6
            );
    }

    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    function applySelection(
        nextField,
        nextDirection,
        section
    )
    {
        closeMenu();

        config.onChange({
            field:
            nextField,

            direction:
            normalizeAppSortDirection(
                nextDirection
            )
        });

        /*
        * The module rerenders after a change.
        * Reopen the same control so the user can
        * select both the field and direction in
        * one interaction.
        */
        requestAnimationFrame(() =>
        {
            openAppSortPopover(
                id,
                section
            );
        });
    }

    menu.addEventListener(
        'click',
        event =>
        {
            const fieldButton =
                event.target.closest(
                    '[data-app-sort-field]'
                );

            if (fieldButton)
            {
                applySelection(
                    fieldButton.dataset
                        .appSortField,
                    direction,
                    'field'
                );

                return;
            }

            const directionButton =
                event.target.closest(
                    '[data-app-sort-direction]'
                );

            if (directionButton)
            {
                applySelection(
                    field,
                    directionButton.dataset
                        .appSortDirection,
                    'direction'
                );
            }
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus({
                    preventScroll: true
                });

                return;
            }

            const current =
                event.target.closest(
                    '.app-sort-option'
                );

            if (!current)
            {
                return;
            }

            const group =
                current.closest(
                    '[role="radiogroup"]'
                );

            const buttons = [
                ...group.querySelectorAll(
                    '.app-sort-option'
                )
            ];

            const index =
                buttons.indexOf(current);

            let nextIndex =
                index;

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowRight'
            )
            {
                nextIndex =
                    (index + 1)
              % buttons.length;
            }
            else if (
                event.key === 'ArrowUp'
            || event.key === 'ArrowLeft'
            )
            {
                nextIndex =
                    (
                        index - 1
                + buttons.length
                    )
              % buttons.length;
            }
            else if (
                event.key === 'Home'
            )
            {
                nextIndex = 0;
            }
            else if (
                event.key === 'End'
            )
            {
                nextIndex =
                    buttons.length - 1;
            }
            else
            {
                return;
            }

            event.preventDefault();

            buttons[nextIndex].focus();
        }
    );

    bindMenuLifecycle(anchor);

    const focusSelector =
        focusSection === 'direction'
            ? '[data-app-sort-direction][aria-checked="true"]'
            : focusSection === 'field'
                ? '[data-app-sort-field][aria-checked="true"]'
                : '.app-sort-option[aria-checked="true"]';

    menu.querySelector(
        focusSelector
    )?.focus({
        preventScroll: true
    });
}

function bindAppSortControl(
    root,
    {
        id,
        options,
        getField,
        getDirection,
        onChange
    }
)
{
    const trigger =
        document.getElementById(id);

    if (
        !trigger
        || !root?.contains(trigger)
    )
    {
        return;
    }

    appSortControlRegistry.set(
        id,
        {
            options,
            getField,
            getDirection,
            onChange
        }
    );

    trigger.addEventListener(
        'click',
        () =>
        {
            const existingMenu =
                document.getElementById(
                    'projectMenu'
                );

            if (
                existingMenu?.dataset
                    .appSortId === id
            )
            {
                closeMenu();
                return;
            }

            openAppSortPopover(id);
        }
    );
}

function treePersonToPeopleRecordId(person)
{
    return person && getPerson(person.id) ? person.id : null;
}

const CONNECTED_NOTES_PREVIEW_LIMIT = 3;

const PERSON_PANEL_PREVIEW_LIMITS =
    Object.freeze({
        photos: 3,
        archive: 3,
        notes: CONNECTED_NOTES_PREVIEW_LIMIT
    });

function personResourceDisplayName(person)
{
    return (
        person?.names?.display
        || person?.name
        || 'Person'
    );
}

function resourceLabelsIncludePerson(
    labels,
    person
)
{
    const name =
        personResourceDisplayName(person);

    return (labels || []).some(
        label =>
            String(label || '').trim()
          === name
    );
}

function getArchiveFilesForPerson(
    personId,
    {
        includeDeleted =
            false
    } = {}
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        return [];
    }

    const projectId =
        person.projectId
        || currentProjectId();

    return (
        sampleData.archiveFiles
        || []
    )
        .filter(file =>
            (
                includeDeleted
            || !file.deleted
            )
          && (
              !file.projectId
            || file.projectId
              === projectId
          )
        )
        .filter(file =>
            (
                file.linkedPersonIds
            || []
            ).includes(
                person.id
            )
        );
}

function openPersonFilesModal(
    personId
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        showToast(
            'Person record not found.'
        );

        return;
    }

    const name =
        person.names?.display
        || person.name
        || 'this person';

    const existingFileIds =
        getArchiveFilesForPerson(
            person.id
        ).map(file =>
            file.id
        );

    openConnectedFilesModal({
        projectId:
          person.projectId
          || currentProjectId(),

        title:
          `Add files to ${name}`,

        subtitle:
          'Connect existing Archive files or add new files.',

        existingFileIds,

        onSave:
          fileIds =>
          {
              const currentPerson =
                  getPerson(
                      person.id
                  );

              if (!currentPerson)
              {
                  return {
                      ok:
                  false
                  };
              }

              const writes =
                  fileIds.map(fileId => ({
                      ownerType:
                  'file',

                      ownerId:
                  fileId,

                      entityType:
                  'person',

                      entityId:
                  currentPerson.id,

                      shouldLink:
                  true
                  }));

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              return {
                  ...committed,

                  ok:
                committed.ok
                && committed.changedCount
                  === writes.length
              };
          },

        afterSave:
          () =>
          {
              renderAfterPersonConnectedResourcesChanged();
          },

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'file'
                      : 'files'
              } added to ${name}.`
    });
}

function getNotesForPerson(
    personId,
    options = {}
)
{
    return getNotesForEntity(
        'person',
        personId,
        options
    );
}

function renderPersonPhotoUnlinkButton(
    photo,
    personId
)
{
    if (!photo?.id || !personId)
    {
        return '';
    }

    const photoLabel =
        photo.title
        || photo.filename
        || 'Photo';

    const personLabel =
        getPerson(personId)
            ?.names?.display
        || 'this person';

    return `
        <button
          class="
            connected-note-unlink
            connected-photo-unlink
          "
          type="button"
          data-person-photo-unlink="${escapeHtml(
                photo.id
            )}"
          data-person-photo-unlink-person="${escapeHtml(
                personId
            )}"
          aria-label="Unlink ${escapeHtml(
                photoLabel
            )} from ${escapeHtml(
                personLabel
            )}"
          title="Unlink photo">

          ${icon.unlink}
        </button>
      `;
}

function renderFamilyPhotos(person)
{
    const photos =
        getPhotosForPerson(
            person?.id
        ).slice(
            0,
            PERSON_PANEL_PREVIEW_LIMITS
                .photos
        );

    if (!photos.length)
    {
        return `
          <div class="panel-muted">
            No photos linked to this person.
          </div>
        `;
    }

    return `
        <div class="connected-photo-grid">
          ${photos
                .map(photo =>
                {
                    const label =
                        photo.title
                || photo.filename
                || 'Photo';

                    return `
                <div
                  class="
                    person-connected-photo-item
                    family-connected-photo-item
                  ">

                  <button
                    class="connected-photo-button"
                    type="button"
                    data-family-photo="${escapeHtml(
                        photo.id
                    )}"
                    title="${escapeHtml(
                        label
                    )}"
                    aria-label="Open ${escapeHtml(
                        label
                    )}">

                    ${renderPhotoThumbnail(
                        photo,
                        { label }
                    )}
                  </button>

                  ${renderPersonPhotoUnlinkButton(
                        photo,
                        person.id
                    )}
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderFamilyArchiveItems(
    person
)
{
    const files =
        getArchiveFilesForPerson(
            person?.id
        ).slice(
            0,
            PERSON_PANEL_PREVIEW_LIMITS
                .archive
        );

    if (!files.length)
    {
        return `
          <div class="panel-muted">
            No archive files linked to this person.
          </div>
        `;
    }

    return renderConnectedFileList({
        files,

        contextType:
          'person',

        contextId:
          person?.id
          || '',

        emptyText:
          'No archive files linked to this person.'
    });
}

function renderFamilyNotes(
    person
)
{
    const notes =
        getNotesForPerson(
            person?.id
        );

    if (!notes.length)
    {
        return `
          <div class="panel-muted">
            No notes linked to this person.
          </div>
        `;
    }

    return renderConnectedNoteList({
        notes,

        contextType:
          'person',

        contextId:
          person?.id || '',

        limit:
          PERSON_PANEL_PREVIEW_LIMITS
              .notes,

        emptyText:
          'No notes linked to this person.'
    });
}

function openPersonNotesModal(
    personId,
    context = 'tree'
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        showToast(
            'Person record not found.'
        );

        return;
    }

    /*
        The same sidebar renderer is used by:
        - Family Tree: "tree"
        - People preview: "people"
      */
    const profileContext =
        context === 'profile';

    const sidebarContext =
        context === 'people'
            ? 'people'
            : 'tree';

    const personLabel =
        noteEntityLabel(
            'person',
            person
        )
        || person.names?.display
        || person.name
        || 'this person';

    const existingNoteIds =
        getNotesForPerson(
            person.id
        ).map(note =>
            note.id
        );

    openNoteLinkPickerModal({
        projectId:
          person.projectId
          || currentProjectId(),

        title:
          'Add note',

        description:
          `Link existing notes to “${personLabel}”.`,

        searchPlaceholder:
          'Search by title, content, person, place, or source',

        existingNoteIds,

        /*
          Keep person-sidebar linking aligned with
          Albums: archived Notes are not offered as
          new links.
        */
        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        onCreate:
          () =>
              openNewNoteForContext(
                  'person',
                  person.id
              ),

        onSave:
          selectedNoteIds =>
          {
              const currentPerson =
                  getPerson(
                      person.id
                  );

              if (!currentPerson)
              {
                  showToast(
                      'The person is no longer available.'
                  );

                  return false;
              }

              selectedNoteIds.forEach(
                  noteId =>
                  {
                      const note =
                          getNote(
                              noteId,
                              {
                                  projectId:
                        person.projectId
                        || currentProjectId(),

                                  includeArchived:
                        false
                              }
                          );

                      if (!note)
                      {
                          return;
                      }

                      const currentPersonIds =
                          Array.isArray(
                              note.linkedPersonIds
                          )
                              ? note.linkedPersonIds
                              : [];

                      setNoteEntityLinks(
                          note.id,
                          'person',
                          [
                              ...new Set([
                                  ...currentPersonIds,
                                  currentPerson.id
                              ])
                          ],
                          {
                              projectId:
                      note.projectId
                          }
                      );
                  }
              );

              return true;
          },

        afterSave:
          () =>
          {
              if (profileContext)
              {
                  const profileScrollTop =
                      main.scrollTop;

                  renderPeople();

                  requestAnimationFrame(
                      () =>
                      {
                          main.scrollTop =
                              profileScrollTop;

                          main
                              .querySelector(
                                  '[data-profile-resource-action="add-note"]'
                              )
                              ?.focus({
                                  preventScroll: true
                              });
                      }
                  );

                  return;
              }

              /*
              Keep the Notes accordion open and refresh
              only the sidebar that launched the modal.
            */
              state.inspectorSections
                  .notes = true;

              rerenderPersonSidebarContext(
                  sidebarContext,
                  {
                      preserveScroll:
                  true,

                      scrollSectionId:
                  'notes',

                      focusSectionId:
                  'notes'
                  }
              );
          },

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'note was'
                      : 'notes were'
              } linked to ${personLabel}.`
    });
}

function openFamilyPhoto(photoId)
{
    openAlbumsForPhoto(photoId);
}

function openFamilyArchiveItem(
    fileId
)
{
    if (!fileId)
    {
        showToast(
            'Archive item preview is simulated.'
        );

        return;
    }

    const file =
        archiveFileById(
            fileId
        );

    openArchiveLocation(
        {
            view:
            'files',

            folderId:
            archiveFileFolderId(
                file
            ),

            search:
            '',

            fileFilters:
            archiveFileFiltersWithDefaults(
                {}
            ),

            filterPresentation:
            'flat',

            filterScopeFolderId:
            null,

            selectedFileId:
            file?.id
            || null,

            inspectorCollapsed:
            false
        },
        {
            expandCurrent:
            true
        }
    );
}


function cleanFamilyTreeHeroDate(value)
{
    const clean = cleanGenealogyDateText(value);
    return clean && !/placeholder/i.test(clean) ? clean : 'Unknown date';
}

function cleanFamilyTreeHeroPlace(value)
{
    const clean = String(value || '').trim();
    if (!clean || /placeholder/i.test(clean)) return '';
    return clean;
}

function familyTreeHeroAgeSuffix(age)
{
    return age !== null && age !== undefined ? ` (${age} years)` : '';
}

function renderFamilyTreeHeroLifeDetails(person)
{
    const status = normalizeLivingStatus(person.status || person.living);
    const birthDate = parsePeoplePrototypeDate(person.birth);
    const deathDate = parsePeoplePrototypeDate(person.death);
    const birthAge = status === 'Deceased' ? null : calculatePeopleAge(birthDate);
    const deathAge = status === 'Deceased' && birthDate && deathDate ? calculatePeopleAge(birthDate, deathDate) : null;
    const rows = [
        {
            label: 'Born',
            date: `${cleanFamilyTreeHeroDate(person.birth)}${familyTreeHeroAgeSuffix(birthAge)}`,
            place: cleanFamilyTreeHeroPlace(person.place)
        }
    ];

    if (status === 'Deceased')
    {
        rows.push({
            label: 'Deceased',
            date: `${cleanFamilyTreeHeroDate(person.death)}${familyTreeHeroAgeSuffix(deathAge)}`,
            place: cleanFamilyTreeHeroPlace(person.deathPlace)
        });
    }

    return `<div class="tree-person-life">${rows.map(row => `<div class="tree-person-life-line"><div><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.date)}</div>${row.place ? `<div class="tree-person-life-place">${escapeHtml(row.place)}</div>` : ''}</div>`).join('')}</div>`;
}

function renderFamilyTreePersonHero(
    person
)
{
    const status =
        person.status
        || person.living;

    const photoCount =
        getPersonPhotoCount(
            person.id
        );

    const fileCount =
        getArchiveFilesForPerson(
            person.id
        ).length;

    const noteCount =
        getNotesForPerson(
            person.id
        ).length;

    const viewState = treeProjectViewState();
    const isFocusPerson = viewState.focusPersonId === person.id;

    return `
        <div
          class="
            people-hero
            tree-person-hero
          ">

          <div class="tree-person-hero-top">
            <button
              class="
                people-collapse-button
                people-sidebar-toggle-icon
                people-sidebar-toggle-collapse
              "
              type="button"
              id="collapseInspector"
              aria-label="Collapse person sidebar">

              ${icon.doublechevronSidebar}
            </button>

            <div class="tree-person-hero-actions">
              ${isFocusPerson
                    ? `<span class="tree-focus-status" aria-label="Current focus person">${icon.focus}<span>Current focus</span></span>`
                    : ''}
              <button
                class="tree-person-hero-profile"
                type="button"
                data-tree-view-profile="${escapeHtml(person.id)}"
                aria-label="View ${escapeHtml(person.name)} profile">
                <span>View profile</span>
              </button>
            </div>
          </div>

          <div class="tree-person-hero-main">
            ${renderEditablePersonAvatar(
                person,
                'tree-person-hero-photo'
            )}

            <div class="tree-person-hero-copy">
              <h2>
                ${escapeHtml(
                    person.name
                )}
              </h2>

              ${renderFamilyTreeHeroLifeDetails(
                    person
                )}
            </div>
          </div>

          <div
            class="
              tree-person-hero-tags
              app-chip-row
              app-chip-row--on-accent
            ">

            ${renderLivingStatusChip(
                status
            )}

            <button
              class="
                app-chip
                app-chip--photos
              "
              type="button"
              data-person-chip-section="photos"
              aria-controls="section-photos"
              aria-label="Show ${photoCount} ${
                    photoCount === 1
                        ? 'photo'
                        : 'photos'
                }">

              ${
                    state.language === 'ru'
                        ? `${photoCount} фото`
                        : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
                }
            </button>

            <button
              class="
                app-chip
                app-chip--files
              "
              type="button"
              data-person-chip-section="archive"
              aria-controls="section-archive"
              aria-label="Show ${fileCount} ${
                    fileCount === 1
                        ? 'file'
                        : 'files'
                }">

              ${fileCount}
              ${
                    fileCount === 1
                        ? 'file'
                        : 'files'
                }
            </button>

            <button
              class="
                app-chip
                app-chip--notes
              "
              type="button"
              data-person-chip-section="notes"
              aria-controls="section-notes"
              aria-label="Show ${noteCount} ${
                    noteCount === 1
                        ? 'note'
                        : 'notes'
                }">

              ${noteCount}
              ${
                    noteCount === 1
                        ? 'note'
                        : 'notes'
                }
            </button>
          </div>
        </div>
      `;
}

function personSidebarTreePerson(personOrId)
{
    const personId = typeof personOrId === 'string' ? personOrId : personOrId?.id;
    return personById(personId) || currentTreePeople()[0] || null;
}

function personSidebarRecord(personId)
{
    const centralPerson = getPerson(personId);
    if (centralPerson) return toPeopleRecord(centralPerson);
    return currentPeopleRecords().find(person => person.id === personId) || null;
}

function renderPersonRecordInfo(personId)
{
    const record = personSidebarRecord(personId);
    if (!record) return '<div class="panel-muted">No record information available.</div>';
    return `<div class="record-info">
        <div class="record-kv"><span>Added</span><span>1 May 2026</span></div>
        <div class="record-kv"><span>Updated</span><span>${escapeHtml(record.updated || '-')}</span></div>
        <div class="record-kv"><span>Parents</span><span>${escapeHtml(record.parents || 'Unknown parents')}</span></div>
        <div class="record-kv">
          <span>Sources</span>

          <span>
            ${escapeHtml(
                getPeopleSourceStatus(
                    record
                )
            )}
          </span>
        </div>
        <div class="record-kv"><span>Review status</span><span>${escapeHtml(getPeopleReviewStatus(record))}</span></div>
      </div>`;
}

function renderPersonSidebar(
    personOrId,
    context = 'tree'
)
{
    const isPeopleContext =
        context === 'people';

    const person =
        personSidebarTreePerson(
            personOrId
        );

    const contextAttribute = `
        data-person-sidebar-context="${
            escapeHtml(context)
        }"
      `;

    if (!person)
    {
        return `
          <aside
            class="
              tree-inspector
              family-person-pane
              ${
                    isPeopleContext
                        ? 'people-person-sidebar'
                        : ''
                }
            "
            ${contextAttribute}
            aria-label="Selected person details">
            <div class="panel-muted">
              Select a person to view details.
            </div>
          </aside>
        `;
    }

    if (
        isPeopleContext
        && state.peoplePreviewCollapsed
    )
    {
        return `
          <aside
            class="
              tree-inspector
              family-person-pane
              people-person-sidebar
              collapsed
            "
            ${contextAttribute}
            aria-label="Selected person sidebar collapsed">

            <button
              class="
                inspector-restore
                person-sidebar-restore-button
                sidebar-toggle-icon
                sidebar-toggle-icon-restore
              "
              type="button"
              id="restoreInspector"
              aria-label="Show person sidebar">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    const actionsContent = `<div class="panel-actions">
        <button class="button primary" type="button" id="quickEdit">
          ${renderPanelButtonLabel(icon.edit, 'Quick edit')}
        </button>
        <button class="button secondary" type="button" id="familyMoreActions" aria-haspopup="menu" aria-expanded="false">
          ${renderPanelButtonLabel(icon.more, 'More actions')}
        </button>
        <button class="button secondary" type="button" id="addRelative">
          ${renderPanelButtonLabel(icon.addperson, 'Add relative')}
        </button>
        <button class="button secondary" type="button" id="connectRelative">
          ${renderPanelButtonLabel(icon.link, 'Connect relative')}
        </button>
      </div>`;

    const timelineContent = renderFamilyTreeTimeline(person.id);
    const relationshipsContent =
        renderRelationships(person.id);

    const relationshipsCount =
        relationshipCount(person.id);
    const photosContent = renderFamilyPhotos(person);
    const archiveContent = renderFamilyArchiveItems(person);
    const notesContent =
        renderFamilyNotes(
            person
        );
    const photoCount = getPersonPhotoCount(person.id);
    const archiveCount = getArchiveFilesForPerson(person.id).length;
    const noteCount = getNotesForPerson(person.id).length;
    const centralPerson =
        getPerson(
            person.id
        );

    const personSources =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            )
            : [];

    const sourceCount =
        personSources.length;

    const sourcesContent =
        centralPerson
            ? renderConnectedSourceList({
                targetType:
                'person',

                targetId:
                centralPerson.id,

                projectId:
                centralPerson.projectId,

                sources:
                personSources,

                emptyText:
                'No sources linked to this person.'
            })
            : renderInspectorSectionEmpty(
                'No sources linked to this person.'
            );
    const contextClass = isPeopleContext ? ' people-person-sidebar' : '';

    return `
        <aside
          class="tree-inspector family-person-pane${contextClass}"
          ${contextAttribute}
          aria-label="Selected person details">
        ${renderFamilyTreePersonHero(person)}
        <div class="family-person-actions">${actionsContent}</div>
        ${renderInspectorSection('insights', 'Insights', 'No insights found', '<div class="panel-muted">No insights found for this person.</div>')}
        ${renderInspectorSection(
            'timeline',
            'Timeline',
            '',
            timelineContent,
            `<button
            class="link"
            type="button"
            data-person-add-fact>
            ${renderPanelButtonLabel(
                icon.plus,
                'Add fact'
            )}
          </button>`,
            { inlineAction: true }
        )}
        ${renderInspectorSection(
            'relationships',
            'Relationships',
            `${relationshipsCount} ${
                relationshipsCount === 1
                    ? 'relationship'
                    : 'relationships'
            }`,
            relationshipsContent
        )}
        ${renderInspectorSection(
            'photos',
            'Photos',
            state.language === 'ru'
                ? `${photoCount} фото`
                : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`,
            photosContent,
            `
            <button
              class="link"
              type="button"
              data-person-add-photos="${
                    escapeHtml(person.id)
                }">
              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add photos'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'photos',
                  count: photoCount,
                  personId: person.id
              })
            }
        )}

        ${renderInspectorSection(
            'archive',
            'Archive',
            `${archiveCount} ${
                archiveCount === 1
                    ? 'file'
                    : 'files'
            }`,
            archiveContent,
            `
            <button
              class="link"
              type="button"
              data-person-add-files="${escapeHtml(
                    person.id
                )}">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add file'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'archive',
                  count: archiveCount,
                  personId: person.id
              })
            }
        )}

        ${renderInspectorSection(
            'notes',
            'Notes',
            `${noteCount} ${
                noteCount === 1
                    ? 'note'
                    : 'notes'
            }`,
            notesContent,
            `
            <button
              class="link"
              type="button"
              data-person-add-note="${escapeHtml(
                    person.id
                )}">
              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add note'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'notes',
                  count: noteCount,
                  personId: person.id
              })
            }
        )}
        ${renderInspectorSection(
            'sources',
            'Sources',
            `${sourceCount} ${
                sourceCount === 1
                    ? 'source'
                    : 'sources'
            }`,
            sourcesContent,
            centralPerson
                ? `
              <button
                class="link"
                type="button"
                data-person-manage-sources="${escapeHtml(
                    centralPerson.id
                )}">

                ${renderPanelButtonLabel(
                    icon.plus,
                    'Add source'
                )}
              </button>
            `
                : '',
            {
                inlineAction:
              true
            }
        )}
        ${renderInspectorSection('record', 'Record Info', '', renderPersonRecordInfo(person.id))}
      </aside>`;
}

function timelineEventBoundaryRank(event)
{
    if (event?.type === 'birth') return 0;
    if (event?.type === 'death') return 2;
    return 1;
}

function compareTimelineEvents(a, b)
{
    const boundaryDiff = timelineEventBoundaryRank(a) - timelineEventBoundaryRank(b);
    if (boundaryDiff) return boundaryDiff;

    return parseTimelineSortValue(a) - parseTimelineSortValue(b);
}

function getFamilyTreeTimelineEvents(personId)
{
    return getEventsForPerson(personId)
        .slice()
        .sort(compareTimelineEvents);
}

function renderFamilyTreeTimeline(personId)
{
    const events = getFamilyTreeTimelineEvents(personId);

    if (!events.length)
    {
        return `<div class="panel-muted">No timeline events recorded for this person.</div>`;
    }

    return `<div class="timeline">
        ${events.map(event => renderTimelineItem(event, personId)).join('')}
      </div>`;
}

function parseTimelineSortValue(value)
{
    if (value && typeof value === 'object')
    {
        if (value.sortDate) return Number(value.sortDate);
        value = value.date || value.dateLabel || value.originalText || '';
    }

    const text = String(value || '').trim();
    if (!text) return Number.POSITIVE_INFINITY;

    const fullDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (fullDate)
    {
        const [, dd, mm, yyyy] = fullDate;
        return Number(`${yyyy}${mm}${dd}`);
    }

    const yearOnly = text.match(/^(\d{4})$/);
    if (yearOnly) return Number(`${yearOnly[1]}0000`);

    const labelYear = text.match(/\b(\d{4})\b/);
    if (labelYear) return Number(`${labelYear[1]}0000`);

    return Number.POSITIVE_INFINITY;
}

function timelineDateLabel(event)
{
    return formatGenealogyDateLabel(event);
}

function timelineYearFromValue(value)
{
    if (!value) return '';

    const label = formatGenealogyDateLabel(value)
        || String(value?.dateLabel || value?.date || value || '');

    const match = String(label).match(/\b(\d{4})\b/);
    return match ? match[1] : '';
}

function timelineYear(event)
{
    return timelineYearFromValue(event) || '—';
}

function timelinePlaceLabel(event)
{
    return cleanEditFieldValue(getPlaceDisplay(event?.placeId))
        || cleanEditFieldValue(event?.placeText);
}

function timelineEventIcon(event)
{
    const map = {
        birth: icon.birth,
        childBirth: icon.birth,
        marriage: icon.marriage,
        education: icon.education,
        occupation: icon.work,
        baptism: icon.baptism,
        burial: icon.mapPin,
        customFact: icon.info,
        death: icon.death
    };

    return map[event.type] || icon.clock;
}

function timelineEventColor(event)
{
    const map = {
        marriage: 'amber',
        education: 'blue',
        occupation: 'blue',
        baptism: 'blue',
        customFact: 'blue',
        burial: 'gray',
        death: 'gray'
    };

    return map[event.type] || '';
}

function timelineEventIsLasting(event)
{
    return event?.dateKind === 'span' || ['education', 'occupation'].includes(event?.type);
}

function timelineDateParts(value)
{
    if (!value) return null;

    if (value && typeof value === 'object')
    {
        const sortDate = String(value.sortDate || '').trim();

        if (/^\d{8}$/.test(sortDate))
        {
            return {
                year: Number(sortDate.slice(0, 4)),
                month: Number(sortDate.slice(4, 6)),
                day: Number(sortDate.slice(6, 8)),
                precision: 'day'
            };
        }

        const label = value.date || value.dateLabel || value.originalText || '';
        return timelineDateParts(label);
    }

    const text = String(value || '').trim();
    if (!text) return null;

    const fullDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (fullDate)
    {
        return {
            year: Number(fullDate[3]),
            month: Number(fullDate[2]),
            day: Number(fullDate[1]),
            precision: 'day'
        };
    }

    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate)
    {
        return {
            year: Number(isoDate[1]),
            month: Number(isoDate[2]),
            day: Number(isoDate[3]),
            precision: 'day'
        };
    }

    const yearMatch = text.match(/\b(\d{4})\b/);
    if (yearMatch)
    {
        return {
            year: Number(yearMatch[1]),
            month: 1,
            day: 1,
            precision: 'year'
        };
    }

    return null;
}

function timelineAgeAtEvent(event, personId)
{
    if (!event || event.type === 'birth' || timelineEventIsLasting(event)) return null;

    const person = getPerson(personId);
    if (!person?.birth) return null;

    const birth = timelineDateParts(person.birth);
    const occurrence = timelineDateParts(event);

    if (!birth?.year || !occurrence?.year) return null;

    let age = occurrence.year - birth.year;

    if (
        birth.precision === 'day'
          && occurrence.precision === 'day'
          && (
              occurrence.month < birth.month
              || (occurrence.month === birth.month && occurrence.day < birth.day)
          )
    )
    {
        age -= 1;
    }

    if (!Number.isFinite(age) || age < 0) return null;

    return age;
}

function timelineAgeLabel(event, personId)
{
    const age = timelineAgeAtEvent(event, personId);
    return age === null ? '' : `Age: ${age}`;
}

function timelineDateBlockHtml(event, personId)
{
    if (timelineEventIsLasting(event))
    {
        const fromYear = timelineYearFromValue(event.fromDate || event);
        const toYear = timelineYearFromValue(event.toDate);

        if (fromYear && toYear)
        {
            return `<span class="timeline-date-range">
            <span>${escapeHtml(fromYear)}</span>
            <span class="timeline-date-separator">to</span>
            <span>${escapeHtml(toYear)}</span>
          </span>`;
        }

        if (fromYear) return escapeHtml(fromYear);
        if (toYear) return escapeHtml(toYear);

        return '—';
    }

    const year = timelineYear(event);
    const hasYear = Boolean(
        timelineYearFromValue(event)
    );

    const age = hasYear
        ? timelineAgeLabel(event, personId)
        : '';

    return `${escapeHtml(year)}${age ? `<span>${escapeHtml(age)}</span>` : ''}`;
}

function timelineEventDateLine(event)
{
    if (timelineEventIsLasting(event))
    {
        return cleanEditFieldValue(event.dateRangeLabel)
          || timelineDateRangeLabel(event.fromDate, event.toDate)
          || '';
    }

    return timelineDateLabel(event) || '';
}

function timelineEventDatePlaceLines(event)
{
    const date = timelineEventDateLine(event);
    const place = timelinePlaceLabel(event);

    return [date, place].filter(Boolean);
}

function timelineDetailLines(...values)
{
    return values
        .flat()
        .map(value => cleanEditFieldValue(value))
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>');
}

function timelineOtherPersonNames(event, personId)
{
    return (event.personIds || [])
        .filter(id => id && id !== personId)
        .map(getPersonDisplayName)
        .filter(Boolean);
}

function timelineEventDetail(event, personId)
{
    const datePlaceLines = timelineEventDatePlaceLines(event);

    if (event.type === 'childBirth')
    {
        return timelineDetailLines(event.description, datePlaceLines);
    }

    if (event.type === 'marriage')
    {
        const otherNames = timelineOtherPersonNames(event, personId);
        const withLine = otherNames.length
            ? `With ${otherNames.join(' and ')}`
            : event.description;

        return timelineDetailLines(withLine, datePlaceLines);
    }

    if (event.type === 'education')
    {
        return timelineDetailLines(
            event.institutionName || event.description,
            datePlaceLines
        );
    }

    if (event.type === 'occupation')
    {
        return timelineDetailLines(
            event.occupation || event.description,
            event.company,
            datePlaceLines
        );
    }
    if (event.type === 'customFact')
    {
        return timelineDetailLines(
            event.description,
            datePlaceLines,
            event.notes
        );
    }

    return timelineDetailLines(datePlaceLines);
}

function renderTimelineItem(
    event,
    personId
)
{
    const sourceCount =
        sourcesForTarget(
            'event',
            event.id,
            event.projectId
        ).length;

    return `
        <div class="timeline-item">
          <div class="timeline-date">
            ${timelineDateBlockHtml(
                event,
                personId
            )}
          </div>

          <div
            class="
              timeline-dot
              ${escapeHtml(
                    timelineEventColor(
                        event
                    )
                )}
            ">

            <span
              class="timeline-dot-icon"
              aria-hidden="true">
              ${timelineEventIcon(
                    event
                )}
            </span>
          </div>

          <div class="timeline-copy">
            <strong>
              ${escapeHtml(
                    event.title
                )}
            </strong>

            <span>
              ${String(
                    timelineEventDetail(
                        event,
                        personId
                    )
                || ''
                )}
            </span>

            <button
              class="
                link
                timeline-source-action
              "
              type="button"
              data-event-manage-sources="${escapeHtml(
                    event.id
                )}"
              data-event-source-project="${escapeHtml(
                    event.projectId
                || currentProjectId()
                )}">

              ${icon.archive}

              <span>
                ${
                    sourceCount
                        ? `${sourceCount} ${
                            sourceCount === 1
                                ? 'source'
                                : 'sources'
                        }`
                        : 'Add source'
                }
              </span>
            </button>
          </div>
        </div>
      `;
}

function bindTimelineSourceControls(
    root,
    {
        afterSave =
            null
    } = {}
)
{
    root
        ?.querySelectorAll(
            '[data-event-manage-sources]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const eventId =
                        button.dataset
                            .eventManageSources;

                    const projectId =
                        button.dataset
                            .eventSourceProject
                  || currentProjectId();

                    const event =
                        sourceTargetRecord(
                            'event',
                            eventId,
                            projectId
                        );

                    if (!event)
                    {
                        showToast(
                            'The event is no longer available.'
                        );

                        return;
                    }

                    openSourcesForTargetModal({
                        targetType:
                  'event',

                        targetId:
                  event.id,

                        projectId,

                        title:
                  'Add sources',

                        subtitle:
                  `Connect existing sources to ${
                      event.title
                    || 'this event'
                  }.`,

                        afterSave
                    });
                }
            );
        });
}

function parentChildRelationshipKey(
    parentId,
    childId
)
{
    return `${parentId || ''}|${childId || ''}`;
}

function parentChildRelationshipType(
    family,
    parentId,
    childId
)
{
    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    return normalizeParentChildRelationshipType(
        family?.parentChildTypes?.[key]
    );
}

function parentChildRelationshipTypeOptions(
    selected = 'Biological'
)
{
    const active =
        normalizeParentChildRelationshipType(selected);

    return PARENT_CHILD_RELATIONSHIP_TYPES
        .map(value => `
          <option
            value="${escapeHtml(value)}"
            ${value === active ? 'selected' : ''}>
            ${escapeHtml(translateText(value))}
          </option>
        `)
        .join('');
}

function setParentChildRelationshipType(
    family,
    parentId,
    childId,
    value = 'Biological'
)
{
    if (!family || !parentId || !childId) return;

    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    family.parentChildTypes = {
        ...sanitizeParentChildTypes(
            family.parentChildTypes
        ),
        [key]:
          normalizeParentChildRelationshipType(value)
    };
}

function removeParentChildRelationshipType(
    family,
    parentId,
    childId
)
{
    if (!family || !parentId || !childId) return;

    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    const next = {
        ...sanitizeParentChildTypes(
            family.parentChildTypes
        )
    };

    delete next[key];
    family.parentChildTypes = next;
}

function relationBirthMeta(person)
{
    return person?.birth?.dateLabel
        || person?.birth?.date
        || '';
}

function relationGender(person)
{
    return String(person?.gender || '').toLowerCase();
}

function parentRelationLabel(person)
{
    if (
        person.parentRole === 'father'
        || relationGender(person) === 'male'
    )
    {
        return 'Father';
    }

    if (
        person.parentRole === 'mother'
        || relationGender(person) === 'female'
    )
    {
        return 'Mother';
    }

    return 'Parent';
}

function siblingRelationLabel(person)
{
    if (relationGender(person) === 'male')
    {
        return 'Brother';
    }

    if (relationGender(person) === 'female')
    {
        return 'Sister';
    }

    return 'Sibling';
}

function childRelationLabel(person)
{
    if (relationGender(person) === 'male')
    {
        return 'Son';
    }

    if (relationGender(person) === 'female')
    {
        return 'Daughter';
    }

    return 'Child';
}

function relationMeta(
    label,
    person,
    qualifier = ''
)
{
    const relationshipLabel = [
        label,
        qualifier
    ].filter(Boolean).join(' · ');

    const birth = relationBirthMeta(person);

    return [
        relationshipLabel,
        birth
    ].filter(Boolean).join(' - ');
}

function partnerRelationshipDateSummary(family)
{
    const type = relationshipTypeFromLegacy(family);
    const definition = partnerRelationshipDefinition(type);
    const startEvent = partnerRelationshipStartEvent(family, type);
    const endEvent = partnerRelationshipEndEvent(family, type);
    const startLabel = formatGenealogyDateLabel(startEvent?.date);
    const endLabel = definition.hasEnd
        ? formatGenealogyDateLabel(endEvent?.date)
        : '';

    return {
        startLabel,
        endLabel,
        rangeLabel: startLabel && endLabel
            ? `${startLabel} – ${endLabel}`
            : startLabel
                ? (definition.hasEnd ? `From ${startLabel}` : startLabel)
                : endLabel
                    ? `To ${endLabel}`
                    : ''
    };
}

function partnerRelationshipMeta(family)
{
    const type = relationshipTypeFromLegacy(family);
    const displayType = type === 'Unknown relationship' ? 'Partner' : type;
    const date = partnerRelationshipDateSummary(family).rangeLabel;
    return [displayType, date].filter(Boolean).join(' · ');
}

function getRelationshipGroups(personId)
{
    const parents = getParents(personId);
    const siblings = getSiblings(personId);
    const partnerRelationships =
        getPartnerRelationships(personId);
    const children = getChildren(personId);

    return [
        {
            title: 'Parents',
            items: parents.map(parent =>
            {
                const family =
                    unlinkFindCentralFamilyForParentChild(
                        parent.id,
                        personId
                    );

                const type = parentChildRelationshipType(
                    family,
                    parent.id,
                    personId
                );

                return {
                    kind: 'parent',
                    person: parent,
                    personId,
                    relatedPersonId: parent.id,
                    familyId: family?.id || '',
                    meta: relationMeta(
                        parentRelationLabel(parent),
                        parent,
                        type === 'Biological' ? '' : type
                    ),
                    canEdit: true,
                    canUnlink: true
                };
            })
        },
        {
            title: 'Siblings',
            items: siblings.map(sibling => ({
                kind: 'sibling',
                person: sibling,
                personId,
                relatedPersonId: sibling.id,
                familyId: '',
                meta: relationMeta(
                    siblingRelationLabel(sibling),
                    sibling
                ),
                canEdit: false,
                canUnlink: false
            }))
        },
        {
            title: 'Partners',
            items: partnerRelationships
                .map(relationship =>
                {
                    const partner = getRelationshipPartner(
                        relationship,
                        personId
                    );

                    if (!partner) return null;

                    return {
                        kind: 'partner',
                        person: partner,
                        personId,
                        relatedPersonId: partner.id,
                        familyId: relationship.id || '',
                        meta: partnerRelationshipMeta(relationship),
                        canEdit: true,
                        canUnlink: true
                    };
                })
                .filter(Boolean)
        },
        {
            title: 'Children',
            items: children.map(child =>
            {
                const family =
                    unlinkFindCentralFamilyForParentChild(
                        personId,
                        child.id
                    );

                const type = parentChildRelationshipType(
                    family,
                    personId,
                    child.id
                );

                return {
                    kind: 'child',
                    person: child,
                    personId,
                    relatedPersonId: child.id,
                    familyId: family?.id || '',
                    meta: relationMeta(
                        childRelationLabel(child),
                        child,
                        type === 'Biological' ? '' : type
                    ),
                    canEdit: true,
                    canUnlink: true
                };
            })
        }
    ];
}

function renderRelation(item)
{
    const person = item?.person;

    if (!person) return '';

    const name =
        person.names?.display || 'Unnamed person';

    const actions =
        item.canEdit || item.canUnlink
            ? `
            <div
              class="relation-actions"
              aria-label="Relationship actions">

              ${item.canEdit
                    ? `
                  <button
                    class="relation-action-button"
                    type="button"
                    aria-label="Edit relationship with ${escapeHtml(name)}"
                    data-edit-relationship>
                    ${icon.edit}
                  </button>
                `
                    : ''}

              ${item.canUnlink
                    ? `
                  <button
                    class="relation-action-button danger"
                    type="button"
                    aria-label="Unlink ${escapeHtml(name)}"
                    data-unlink-relationship>
                    ${icon.unlink}
                  </button>
                `
                    : ''}
            </div>
          `
            : '';

    return `
        <div
          class="relation-row"
          data-relationship-row
          data-relationship-kind="${escapeHtml(item.kind)}"
          data-relationship-person-id="${escapeHtml(item.personId)}"
          data-relationship-related-person-id="${escapeHtml(item.relatedPersonId)}"
          data-relationship-family-id="${escapeHtml(item.familyId)}">

          <button
            class="relation-row-main"
            type="button"
            data-select-relationship-person="${escapeHtml(person.id)}"
            aria-label="Select ${escapeHtml(name)}">

            ${renderPersonAvatar(
                person,
                'small-avatar',
                {
                    element: 'span',
                    decorative: true
                }
            )}

            <span class="relation-row-copy">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(item.meta)}</span>
            </span>
          </button>

          ${actions}
        </div>
      `;
}

function renderRelationshipGroup(group)
{
    if (!group?.items?.length) return '';

    return `
        <section class="relationship-group">
          <div class="relation-group-title">
            ${escapeHtml(group.title)}
          </div>

          <div>
            ${group.items.map(renderRelation).join('')}
          </div>
        </section>
      `;
}

function relationshipCount(personId)
{
    return getRelationshipGroups(personId)
        .reduce(
            (total, group) =>
                total + group.items.length,
            0
        );
}

function renderRelationships(personId)
{
    const groups = getRelationshipGroups(personId)
        .map(renderRelationshipGroup)
        .filter(Boolean);

    if (!groups.length)
    {
        return `
          <div class="panel-muted">
            No immediate relationships recorded for this person.
          </div>
        `;
    }

    return `
        <div class="relationship-list">
          ${groups.join('')}
        </div>
      `;
}

function getGenderForRelativeType(relativeType)
{
    const map = {
        father: 'Male',
        mother: 'Female',
        son: 'Male',
        daughter: 'Female',
        brother: 'Male',
        sister: 'Female',
        parent: 'Unknown',
        child: 'Unknown',
        partner: 'Unknown'
    };

    return map[String(relativeType || '').toLowerCase()] || 'Unknown';
}

function statusDotClass(status)
{
    if (status === 'Deceased') return 'deceased';
    if (status === 'Unknown') return 'unknown';
    return 'living';
}

function normalizeLivingStatus(status)
{
    if (status === 'Deceased') return 'Deceased';
    if (status === 'Unknown') return 'Unknown';
    return 'Living';
}

function livingStatusChipTone(
    status
)
{
    const safeStatus =
        normalizeLivingStatus(
            status
        );

    if (
        safeStatus === 'Deceased'
    )
    {
        return 'app-chip--deceased';
    }

    if (
        safeStatus === 'Unknown'
    )
    {
        return 'app-chip--unknown';
    }

    return 'app-chip--living';
}

function renderLivingStatusChip(
    status
)
{
    const safeStatus =
        normalizeLivingStatus(
            status
        );

    return `
        <span
          class="
            app-chip
            ${livingStatusChipTone(
                safeStatus
            )}
            living-status-chip
          ">

          <span
            class="
              add-person-status-dot
              ${statusDotClass(
                    safeStatus
                )}
            "
            aria-hidden="true">
          </span>

          <span>
            ${escapeHtml(
                safeStatus
            )}
          </span>
        </span>
      `;
}

function normalizeConnectRelationshipType(type)
{
    const value = String(type || '').toLowerCase();

    if (['father', 'mother', 'parent'].includes(value)) return 'parent';
    if (['son', 'daughter', 'child'].includes(value)) return 'child';
    if (['brother', 'sister', 'sibling'].includes(value)) return 'sibling';
    if (['partner', 'spouse', 'husband', 'wife'].includes(value)) return 'partner';

    return 'parent';
}

function connectRelationshipLabel(type)
{
    const map = {
        parent: 'Parent',
        child: 'Child',
        sibling: 'Sibling',
        partner: 'Partner'
    };

    return map[normalizeConnectRelationshipType(type)] || 'Parent';
}

function connectRelationshipSentence(type)
{
    const map = {
        parent: 'parent',
        child: 'child',
        sibling: 'sibling',
        partner: 'partner'
    };

    return map[normalizeConnectRelationshipType(type)] || 'parent';
}

function connectPersonName(person)
{
    return person?.names?.display || person?.name || 'Unknown person';
}

function connectPersonLifeLine(person)
{
    const birth = formatGenealogyDateLabel(person?.birth);
    const death = formatGenealogyDateLabel(person?.death);

    if (birth && death) return `${birth} - ${death}`;
    if (birth) return birth;
    if (death) return `Died ${death}`;

    return 'Dates unknown';
}

function connectPersonPlaceLine(person)
{
    return (
        getPlaceEventDisplay(
            person?.birth
        )
        || getPlaceEventDisplay(
            person?.death
        )
        || ''
    );
}

function connectPersonSearchText(person)
{
    return [
        connectPersonName(person),
        person?.names?.first,
        person?.names?.middle,
        person?.names?.last,
        person?.names?.maiden,
        connectPersonLifeLine(person),
        connectPersonPlaceLine(person)
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function connectPeopleAlreadyRelated(anchorPersonId, candidatePersonId, relationshipType)
{
    const type = normalizeConnectRelationshipType(relationshipType);

    if (!anchorPersonId || !candidatePersonId || anchorPersonId === candidatePersonId)
    {
        return true;
    }

    if (type === 'parent')
    {
        return getParents(anchorPersonId).some(parent => parent.id === candidatePersonId);
    }

    if (type === 'child')
    {
        return getChildren(anchorPersonId).some(child => child.id === candidatePersonId);
    }

    if (type === 'sibling')
    {
        const anchorFamilies = centralFamilyRecords().filter(family =>
            unlinkFamilyChildrenIds(family).includes(anchorPersonId)
        );

        return anchorFamilies.some(family =>
            unlinkFamilyChildrenIds(family).includes(candidatePersonId)
        );
    }

    return getPartnerRelationships(anchorPersonId)
        .some(relationship => familyPartnerId(relationship, anchorPersonId) === candidatePersonId);
}

function connectPersonCandidateScore(person, anchorPerson, relationshipType, query)
{
    let score = 0;
    const type = normalizeConnectRelationshipType(relationshipType);
    const search = connectPersonSearchText(person);
    const q = String(query || '').trim().toLowerCase();

    if (q && search.includes(q)) score += 80;

    const anchorSurname = String(anchorPerson?.names?.last || '').toLowerCase();
    const personSurname = String(person?.names?.last || '').toLowerCase();

    if (anchorSurname && personSurname && anchorSurname === personSurname) score += 24;

    const anchorBirthPlace = getPlaceEventDisplay(anchorPerson?.birth).toLowerCase();
    const personBirthPlace = getPlaceEventDisplay(person?.birth).toLowerCase();

    if (anchorBirthPlace && personBirthPlace && anchorBirthPlace === personBirthPlace) score += 12;

    const gender = String(person?.gender || '').toLowerCase();

    if (type === 'parent')
    {
        const anchorSort = Number(anchorPerson?.birth?.sortDate || 0);
        const candidateSort = Number(person?.birth?.sortDate || 0);
        if (anchorSort && candidateSort && candidateSort < anchorSort) score += 18;
    }

    if (type === 'child')
    {
        const anchorSort = Number(anchorPerson?.birth?.sortDate || 0);
        const candidateSort = Number(person?.birth?.sortDate || 0);
        if (anchorSort && candidateSort && candidateSort > anchorSort) score += 18;
    }

    if (type === 'partner' && ['male', 'female', 'unknown'].includes(gender))
    {
        score += 4;
    }

    return score;
}

function connectPersonCandidates()
{
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    if (!anchor) return [];

    const query = String(connectPersonModalState.query || '').trim().toLowerCase();
    const relationshipType = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);

    return getPeople(currentProjectId())
        .filter(person => person?.id && person.id !== anchor.id)
        .filter(person => !person.deleted)
        .filter(person => !connectPeopleAlreadyRelated(anchor.id, person.id, relationshipType))
        .filter(person => !query || connectPersonSearchText(person).includes(query))
        .map(person => ({
            person,
            score: connectPersonCandidateScore(person, anchor, relationshipType, query)
        }))
        .sort((a, b) => b.score - a.score || connectPersonName(a.person).localeCompare(connectPersonName(b.person)))
        .slice(0, query ? 12 : 3)
        .map(item => item.person);
}

function connectPersonSelectedValidation()
{
    if (!connectPersonModalState.selectedPersonId) return { ok: true };

    return validateRelationshipConnection({
        anchorPersonId: connectPersonModalState.anchorPersonId,
        relativePersonId: connectPersonModalState.selectedPersonId,
        relationshipType: connectPersonModalState.relationshipType,
        parentFamilySelection: connectPersonModalState.parentFamilySelection
    });
}

function connectPersonActiveWarning()
{
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    const selected = getPerson(connectPersonModalState.selectedPersonId);
    const type = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);

    if (!anchor) return null;

    if (!selected && type === 'parent' && getParents(anchor.id).length > 0)
    {
        return {
            severity: 'warning',
            title: 'Warning!',
            message: `${connectPersonName(anchor)} already has recorded parents. The selected person will be connected as an additional parent.`
        };
    }

    if (!selected) return null;

    return relationshipWarningForConnection({
        anchorPersonId: anchor.id,
        relativePersonId: selected.id,
        relationshipType: type
    });
}

function connectPersonNoticeHtml(notice)
{
    if (!notice)
    {
        return `<div class="connect-person-warning" data-connect-warning hidden></div>`;
    }

    const isBlocking = notice.severity === 'blocking';

    return `<div class="connect-person-warning ${isBlocking ? 'is-blocking' : ''}" data-connect-warning>
        <div class="connect-person-warning-title">${icon.warning}<span>${escapeHtml(notice.title || 'Warning!')}</span></div>
        <p>${escapeHtml(notice.message || '')}</p>
      </div>`;
}

function connectPersonWarningHtml()
{
    const validation = connectPersonSelectedValidation();

    if (!validation.ok)
    {
        return connectPersonNoticeHtml({
            severity: 'blocking',
            title: validation.title || 'Cannot connect',
            message: validation.message || 'This relationship cannot be created.'
        });
    }

    return connectPersonNoticeHtml(connectPersonActiveWarning());
}

function renderConnectPersonResult(person)
{
    const selected = person.id === connectPersonModalState.selectedPersonId;
    const place = connectPersonPlaceLine(person);

    return `<button class="connect-person-result ${selected ? 'is-selected' : ''}" type="button" data-connect-person-result="${escapeHtml(person.id)}" aria-pressed="${selected ? 'true' : 'false'}">
        ${renderPersonAvatar(person, 'connect-person-avatar')}
        <span class="connect-person-result-copy">
          <strong>${escapeHtml(connectPersonName(person))}</strong>
          <span>${escapeHtml(connectPersonLifeLine(person))}</span>
          ${place ? `<span>${escapeHtml(place)}</span>` : ''}
        </span>
      </button>`;
}

function renderConnectPersonResults()
{
    const candidates = connectPersonCandidates();

    if (!candidates.length)
    {
        return `<div class="connect-person-empty">
          No matching people found. Try another name or create a new person.
        </div>`;
    }

    return `<div class="connect-person-results">
        ${candidates.map(renderConnectPersonResult).join('')}
      </div>`;
}

function renderConnectPersonModalHtml()
{
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    const anchorName = connectPersonName(anchor);
    const relationshipType = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);
    const relationshipLabel = connectRelationshipLabel(relationshipType);
    const relationshipSentence = connectRelationshipSentence(relationshipType);
    const selectedPerson = getPerson(connectPersonModalState.selectedPersonId);
    const selectedValidation = connectPersonSelectedValidation();
    const connectDisabled = !selectedPerson || !selectedValidation.ok;
    const resultTitle = connectPersonModalState.query ? 'Search results' : 'Suggested matches';

    return `<div class="modal connect-person-modal" role="dialog" aria-modal="true" aria-labelledby="connectPersonTitle">
        <div class="modal-header connect-person-header">
          <div class="connect-person-header-icon" aria-hidden="true">${icon.link}</div>
          <div>
            <h2 id="connectPersonTitle">Connect existing person</h2>
            <p>Find a person in this project and connect them to ${escapeHtml(anchorName)}.</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button>
        </div>

        <div class="connect-person-layout">
          <aside class="connect-person-left">
            <div class="field add-person-select-field">
              <label for="connectPersonRelationship">Select relationship</label>
              <select class="compact-select add-person-select" id="connectPersonRelationship" data-connect-relationship>
                ${['parent', 'child', 'sibling', 'partner'].map(value => `<option value="${value}" ${value === relationshipType ? 'selected' : ''}>${connectRelationshipLabel(value)}</option>`).join('')}
              </select>
              <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </div>

            ${renderPartnerChildrenSelector({
                anchorPersonId: anchor?.id || '',
                relationshipType,
                selectedPersonId: connectPersonModalState.selectedPersonId,
                selectedValue: connectPersonModalState.partnerChildrenMode,
                controlId: 'connectPersonPartnerChildrenMode'
            })}


            ${renderParentFamilySelector({
                anchorPersonId: anchor?.id || '',
                relationshipType,
                selectedValue:
                connectPersonModalState
                    .parentFamilySelection,
                controlId:
                'connectPersonParentFamily',
                showSelectionLabel:
                false
            })}

            ${connectPersonWarningHtml()}
          </aside>

          <section class="connect-person-main">
            <div class="field">
              <label for="connectPersonSearch">Find person</label>
              <div class="connect-person-search-shell">
                ${icon.search}
                <input id="connectPersonSearch" data-connect-search value="${escapeHtml(connectPersonModalState.query)}" placeholder="Search people..." autocomplete="off">
              </div>
            </div>

            <div class="connect-person-results-panel">
              <div class="connect-person-results-title">${escapeHtml(resultTitle)}</div>
              ${renderConnectPersonResults()}
            </div>

            <button class="connect-person-create" type="button" data-connect-create-new>
              <span class="connect-person-create-icon" aria-hidden="true">${icon.addperson}</span>
              <span class="connect-person-create-copy">
                <strong>Can’t find the person?</strong>
                <span>Create a new person and connect as ${escapeHtml(relationshipSentence)}</span>
              </span>
              <span class="connect-person-create-chevron" aria-hidden="true">${icon.chevron}</span>
            </button>
          </section>
        </div>

        <div class="modal-footer connect-person-footer">
          <button class="button secondary" type="button" data-close>Cancel</button>
          <button class="button primary" type="button" id="connectPersonConfirm" ${connectDisabled ? 'disabled' : ''}>Connect</button>
        </div>
      </div>`;
}

function refreshConnectPersonModal()
{
    modalBackdrop.innerHTML = renderConnectPersonModalHtml();
    modalBackdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModal));
    bindConnectPersonModalControls();

    const input = modalBackdrop.querySelector('[data-connect-search]');
    if (input)
    {
        const length = input.value.length;
        input.focus();
        input.setSelectionRange(length, length);
    }

    localizeUI(modalBackdrop);
}

function bindConnectPersonModalControls()
{
    const modal = modalBackdrop.querySelector('.connect-person-modal');
    if (!modal) return;

    modal.querySelector('[data-connect-relationship]')?.addEventListener('change', event =>
    {
        connectPersonModalState.relationshipType = normalizeConnectRelationshipType(event.currentTarget.value);
        connectPersonModalState.selectedPersonId = '';
        connectPersonModalState.partnerChildrenMode =
            PARTNER_CHILDREN_ADD_PARENT;

        connectPersonModalState.parentFamilySelection = defaultParentFamilySelection(
            connectPersonModalState.anchorPersonId,
            connectPersonModalState.relationshipType
        );
        refreshConnectPersonModal();
    });

    modal.querySelector('#connectPersonParentFamily')?.addEventListener('change', event =>
    {
        connectPersonModalState.parentFamilySelection = event.currentTarget.value;
        refreshConnectPersonModal();
    });

    modal.querySelector('#connectPersonPartnerChildrenMode')
        ?.addEventListener('change', event =>
        {
            connectPersonModalState.partnerChildrenMode =
                normalizePartnerChildrenMode(event.currentTarget.value);
        });

    modal.querySelector('[data-connect-search]')?.addEventListener('input', event =>
    {
        connectPersonModalState.query = event.currentTarget.value;
        connectPersonModalState.selectedPersonId = '';
        refreshConnectPersonModal();
    });

    modal.querySelectorAll('[data-connect-person-result]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            connectPersonModalState.selectedPersonId = button.dataset.connectPersonResult || '';
            refreshConnectPersonModal();
        });
    });

    modal.querySelector('[data-connect-create-new]')?.addEventListener('click', () =>
    {
        const anchor = getPerson(connectPersonModalState.anchorPersonId);
        const relationshipType = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);
        const label = connectRelationshipSentence(relationshipType);

        closeModal();

        openAddPersonModal(
            `Add ${label}`,
            `Create a new person and connect as ${connectPersonName(anchor)}'s ${label}`,
            {
                relativeType: relationshipType,
                connectRelationshipType: relationshipType,
                connectAfterCreate: true,
                personId: anchor?.id || connectPersonModalState.anchorPersonId,
                connectToPersonId: anchor?.id || connectPersonModalState.anchorPersonId,
                parentFamilySelection: connectPersonModalState.parentFamilySelection,
                partnerChildrenMode: connectPersonModalState.partnerChildrenMode
            }
        );
    });

    modal.querySelector('#connectPersonConfirm')?.addEventListener('click', () =>
    {
        const anchor = getPerson(connectPersonModalState.anchorPersonId);
        const selected = getPerson(connectPersonModalState.selectedPersonId);

        if (!anchor || !selected) return;

        const validation = connectPersonSelectedValidation();

        if (!validation.ok)
        {
            showToast(validation.message || 'This relationship cannot be created.');
            refreshConnectPersonModal();
            return;
        }

        const result = connectPeopleByRelationship({
            anchorPersonId: anchor.id,
            relativePersonId: selected.id,
            relationshipType: connectPersonModalState.relationshipType,
            parentFamilySelection: connectPersonModalState.parentFamilySelection,
            partnerChildrenMode: connectPersonModalState.partnerChildrenMode
        });

        if (!result.ok)
        {
            showToast(result.message || 'Could not connect these people.');
            refreshConnectPersonModal();
            return;
        }

        const relationshipLabel = connectRelationshipSentence(connectPersonModalState.relationshipType);

        closeModal();

        state.selectedPersonId = anchor.id;
        state.selectedPeopleId = anchor.id;
        state.treeInspectorCollapsed = false;

        if (state.activeModule === 'Family Tree')
        {
            renderFamilyTreePreserveScroll();
        }
        else
        {
            render();
        }

        if (result.warning?.message)
        {
            showToast(`${connectPersonName(selected)} connected as ${relationshipLabel}. ${result.warning.message}`);
        }
        else
        {
            showToast(`${connectPersonName(selected)} connected as ${relationshipLabel}.`);
        }
    });
}

function openConnectRelativeModal(anchorPersonId, options = {})
{
    const anchor = getPerson(anchorPersonId);
    if (!anchor) return;

    const relationshipType =
        normalizeConnectRelationshipType(
            options.relationshipType || 'parent'
        );

    connectPersonModalState = {
        anchorPersonId: anchor.id,
        relationshipType,
        query: '',
        selectedPersonId: '',
        parentFamilySelection: defaultParentFamilySelection(
            anchor.id,
            relationshipType,
            options.parentFamilyId
            || options.parentFamilySelection
            || ''
        ),
        partnerChildrenMode: normalizePartnerChildrenMode(
            options.partnerChildrenMode
        )
    };

    openModal(renderConnectPersonModalHtml());
    bindConnectPersonModalControls();
    modalBackdrop.querySelector('[data-connect-search]')?.focus();
}

function openRelativePopover(
    anchor,
    anchorPersonId
)
{
    closeMenu();

    const person =
        personById(anchorPersonId);

    if (!person || !anchor) return;

    const popover = document.createElement('div');
    popover.className = 'relative-popover';
    popover.id = 'relativePopover';

    popover.innerHTML = `<div class="relative-popover-body"><h2>New relative</h2><p>to ${escapeHtml(person.name)}</p>
        <div class="relative-group">Parents</div><div class="relative-grid"><button class="relative-choice" data-rel="father"><span class="gender-icon">${icon.male}</span>Father</button><button class="relative-choice female" data-rel="mother"><span class="gender-icon">${icon.female}</span>Mother</button></div>
        <div class="relative-group">Partner</div><div class="relative-grid" style="grid-template-columns:1fr"><button class="relative-choice" data-rel="partner"><span class="relative-choice-icon marriage-icon">${icon.marriage}</span>Partner / Spouse</button></div>
        <div class="relative-group">Children</div><div class="relative-grid"><button class="relative-choice" data-rel="son"><span class="gender-icon">${icon.male}</span>Son</button><button class="relative-choice female" data-rel="daughter"><span class="gender-icon">${icon.female}</span>Daughter</button></div>
        <div class="relative-group">Siblings</div><div class="relative-grid"><button class="relative-choice" data-rel="brother"><span class="gender-icon">${icon.male}</span>Brother</button><button class="relative-choice female" data-rel="sister"><span class="gender-icon">${icon.female}</span>Sister</button></div>
        <button class="connect-choice" type="button" data-connect-existing><span class="connect-choice-main"><span class="connect-choice-icon">${icon.link}</span><span class="connect-choice-copy"><strong>Connect existing person</strong><span>Link someone already in this tree</span></span></span><span class="connect-choice-chevron" aria-hidden="true">${icon.chevron}</span></button></div>`;

    document.body.appendChild(popover);
    positionRelativePopover(popover, anchor);

    popover.querySelectorAll('[data-rel]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            const rel = button.dataset.rel;
            closeMenu();
            focusTreeBranchForRelative(person.id);
            openAddPersonModal(`Add ${rel}`, `Create a new person and add as ${person.name.split(' ')[0]}'s ${rel}`, {
                relativeType: rel,
                connectRelationshipType: addPersonConnectionTypeFromRelativeType(rel),
                connectAfterCreate: Boolean(addPersonConnectionTypeFromRelativeType(rel)),
                personId: person.id,
                connectToPersonId: person.id
            });
        });
    });

    popover.querySelector('[data-connect-existing]')?.addEventListener('click', () =>
    {
        closeMenu();
        focusTreeBranchForRelative(person.id);
        openConnectRelativeModal(person.id, { relationshipType: 'parent' });
    });

    bindMenuLifecycle(anchor);
}
function clampNumber(value, min, max)
{
    return Math.max(min, Math.min(value, max));
}

function positionRelativePopover(popover, anchor)
{
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    const gap = 14;
    const arrowSize = 20;
    const arrowCornerPadding = 24;

    const popoverWidth = popover.offsetWidth || 360;
    const popoverHeight = popover.offsetHeight || 560;

    const anchorCenterX = rect.left + rect.width / 2;
    const anchorCenterY = rect.top + rect.height / 2;

    const spaceRight = window.innerWidth - rect.right - margin;
    const spaceLeft = rect.left - margin;

    let left;
    let arrowSide;

    if (spaceRight >= popoverWidth + gap)
    {
        left = rect.right + gap;
        arrowSide = 'left';
    }
    else if (spaceLeft >= popoverWidth + gap)
    {
        left = rect.left - popoverWidth - gap;
        arrowSide = 'right';
    }
    else if (spaceRight >= spaceLeft)
    {
        left = clampNumber(rect.right + gap, margin, window.innerWidth - popoverWidth - margin);
        arrowSide = 'left';
    }
    else
    {
        left = clampNumber(rect.left - popoverWidth - gap, margin, window.innerWidth - popoverWidth - margin);
        arrowSide = 'right';
    }

    const preferredTop = anchorCenterY - popoverHeight / 2;
    const maxTop = Math.max(margin, window.innerHeight - popoverHeight - margin);
    const top = clampNumber(preferredTop, margin, maxTop);

    const minArrowTop = arrowCornerPadding;
    const maxArrowTop = Math.max(
        minArrowTop,
        popoverHeight - arrowSize - arrowCornerPadding
    );

    const arrowTop = clampNumber(
        anchorCenterY - top - arrowSize / 2,
        minArrowTop,
        maxArrowTop
    );

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.dataset.arrowSide = arrowSide;
    popover.style.setProperty('--relative-popover-arrow-top', `${arrowTop}px`);
}

function cleanEditFieldValue(value)
{
    const text = String(value || '').trim();

    if (!text) return '';
    if (text === '-' || text === '—') return '';
    if (text.toLowerCase() === 'unknown') return '';

    return text;
}

const RELIGION_VALUES = Object.freeze([
    'Unknown',
    'Orthodox',
    'Catholic',
    'Jewish',
    'Muslim',
    'Other'
]);

const DEFAULT_RELIGION = 'Unknown';

function normalizeReligionValue(value)
{
    if (
        typeof value !== 'string'
        && typeof value !== 'number'
    )
    {
        return DEFAULT_RELIGION;
    }

    const text = String(value).trim();

    if (
        !text
        || text === '-'
        || text === '—'
    )
    {
        return DEFAULT_RELIGION;
    }

    const canonicalValue = RELIGION_VALUES.find(
        option =>
            option.toLowerCase() === text.toLowerCase()
    );

    /*
      * Preserve imported or legacy values that are not yet
      * part of the predefined option list.
      */
    return canonicalValue || text;
}

function religionFieldOptions(selectedValue)
{
    const selected =
        normalizeReligionValue(selectedValue);

    return RELIGION_VALUES.includes(selected)
        ? [...RELIGION_VALUES]
        : [selected, ...RELIGION_VALUES];
}

function renderReligionField({
    id,
    value = DEFAULT_RELIGION,
    className = '',
    label = 'Religion'
} = {})
{
    if (!id) return '';

    const selected = normalizeReligionValue(value);
    const options = religionFieldOptions(selected);

    const fieldClass = [
        'field',
        className
    ].filter(Boolean).join(' ');

    return `
        <div class="${escapeHtml(fieldClass)}">
          <label for="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </label>

          <div class="common-select-shell">
            <select
              class="compact-select common-select"
              id="${escapeHtml(id)}">

              ${options.map(option => `
                <option
                  value="${escapeHtml(option)}"
                  ${option === selected ? 'selected' : ''}>
                  ${escapeHtml(option)}
                </option>
              `).join('')}
            </select>

            <span
              class="common-select-chevron"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </div>
        </div>
      `;
}

function readReligionField(
    root,
    fieldId
)
{
    if (!root || !fieldId)
    {
        return DEFAULT_RELIGION;
    }

    const field = root.querySelector(
        `#${CSS.escape(fieldId)}`
    );

    return normalizeReligionValue(field?.value);
}

function genderLabelFromPerson(person)
{
    const gender = String(person?.gender || '').toLowerCase();

    if (gender === 'male') return 'Male';
    if (gender === 'female') return 'Female';

    return 'Unknown';
}

function editDateValue(event)
{
    return formatGenealogyDateLabel(event);
}

function editPlaceValue(placeId, fallbackText = '')
{
    return placeInputDisplayValue(placeId, fallbackText);
}

function editPersonFormValues(person)
{
    return {
        firstName: cleanEditFieldValue(person?.names?.first),
        lastName: cleanEditFieldValue(person?.names?.last),
        middleName: cleanEditFieldValue(person?.names?.middle),
        maidenName: cleanEditFieldValue(person?.names?.maiden),

        gender: genderLabelFromPerson(person),
        livingStatus: normalizeLivingStatus(person?.livingStatus),

        birthDate: editDateValue(person?.birth),
        birthPlace: editPlaceValue(person?.birth?.placeId, person?.birth?.placeText),

        deathDate: editDateValue(person?.death),
        deathPlace: editPlaceValue(person?.death?.placeId, person?.death?.placeText),
        deathReason: cleanEditFieldValue(person?.death?.reason),
        burialPlace: editPlaceValue(person?.death?.burialPlaceId, person?.death?.burialPlaceText)
    };
}

function renderPlaceCombobox({
    id,
    label,
    value = '',
    selectedPlaceId = '',
    addressValue = '',
    showAddress = true,
    placeholder = 'Search or type a place',
    className = '',
    inputAttrs = '',
    createOptionLabel = 'Create new place'
} = {})
{
    const listId =
        `${id}PlaceList`;

    const addressFieldsId =
        `${id}AddressFields`;

    const hasAddress =
        Boolean(
            String(addressValue || '').trim()
        );

    const addressAction =
        hasAddress
            ? '- Remove address'
            : '+ Add address';

    return `<div class="field place-combobox-field ${escapeHtml(className)}" data-place-combobox data-place-create-label="${escapeHtml(createOptionLabel)}">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>

        <div class="place-combobox-shell">
          <input
            id="${escapeHtml(id)}"
            value="${escapeHtml(localizedDataFieldValue(value))}"
            data-source-value="${escapeHtml(value)}"
            placeholder="${escapeHtml(placeholder)}"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="${escapeHtml(listId)}"
            data-place-input
            data-place-id="${escapeHtml(selectedPlaceId || '')}"
            ${inputAttrs}>

          <div
            class="place-combobox-list"
            id="${escapeHtml(listId)}"
            role="listbox"
            hidden>
          </div>
        </div>

        ${showAddress ? `
          <div
            class="place-address-disclosure ${hasAddress ? 'has-address' : ''}"
            data-place-address-disclosure>

            <button
              class="place-address-toggle ${hasAddress ? 'is-remove' : ''}"
              type="button"
              data-place-address-toggle
              aria-expanded="${hasAddress ? 'true' : 'false'}"
              aria-controls="${escapeHtml(addressFieldsId)}">

              <span data-place-address-toggle-label>
                ${escapeHtml(t(addressAction))}
              </span>
            </button>

            <div
              class="place-address-fields"
              id="${escapeHtml(addressFieldsId)}"
              data-place-address-fields
              ${hasAddress ? '' : 'hidden'}>

              <label for="${escapeHtml(id)}Address">
                Address
              </label>

              <input
                id="${escapeHtml(id)}Address"
                data-place-address
                data-source-value="${escapeHtml(addressValue)}"
                value="${escapeHtml(localizedDataFieldValue(addressValue))}"
                placeholder="Street, house, parish, or site details">
            </div>
          </div>
        ` : ''}
      </div>`;
}

function educationInstitutionTypeOptions(selected = '')
{
    const options = [
        'Unknown',
        'School',
        'University',
        'College',
        'Seminary',
        'Apprenticeship',
        'Private tutoring',
        'Military academy',
        'Religious instruction',
        'Home education',
        'Other'
    ];

    const current = cleanEditFieldValue(selected || 'Unknown');

    return options
        .map(value => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value)}</option>`)
        .join('');
}

function educationValueLabel(attribute)
{
    const value = cleanEditFieldValue(attribute?.value);
    return value && value !== 'Education' ? value : '';
}

function educationInstitutionLabel(attribute)
{
    return cleanEditFieldValue(attribute?.institutionName || attribute?.agency);
}

function educationInstitutionTypeLabel(attribute)
{
    return cleanEditFieldValue(attribute?.institutionType || attribute?.type);
}

function educationPrimaryLabel(attribute)
{
    return educationInstitutionLabel(attribute)
        || educationValueLabel(attribute)
        || 'Education';
}

function educationTimelineDescription(attribute)
{
    const primary = educationPrimaryLabel(attribute);
    const credential = educationValueLabel(attribute);

    if (credential && credential !== primary)
    {
        return `${primary} - ${credential}`;
    }

    return primary;
}

function renderCustomFactFields(
    idPrefix,
    fact = null
)
{
    const type =
        cleanEditFieldValue(fact?.type);

    const value =
        cleanEditFieldValue(fact?.value);

    const notes =
        cleanEditFieldValue(fact?.notes);

    const date =
        fact?.date
          || emptyGenealogyDate('Exact date');

    return `
        <div
          class="field full custom-fact-field"
          data-custom-fact-field="type">

          <label for="${escapeHtml(idPrefix)}Type">
            Fact name *
          </label>

          <input
            id="${escapeHtml(idPrefix)}Type"
            value="${escapeHtml(type)}"
            placeholder="e.g. Skill, membership, physical description"
            aria-required="true"
            aria-describedby="
              ${escapeHtml(idPrefix)}TypeHelp
              ${escapeHtml(idPrefix)}TypeError
            ">

          <div
            class="custom-fact-help"
            id="${escapeHtml(idPrefix)}TypeHelp">
            *Required. Use a short category that describes the fact.
          </div>

          <div
            class="custom-fact-error"
            id="${escapeHtml(idPrefix)}TypeError"
            aria-live="polite">
          </div>
        </div>

        <div
          class="field full custom-fact-field"
          data-custom-fact-field="content">

          <label for="${escapeHtml(idPrefix)}Value">
            Fact details
          </label>

          <input
            id="${escapeHtml(idPrefix)}Value"
            value="${escapeHtml(value)}"
            placeholder="e. g. Woodworking, served in the army, etc."
            aria-describedby="${escapeHtml(idPrefix)}ContentError">

          <div
            class="custom-fact-error"
            id="${escapeHtml(idPrefix)}ContentError"
            aria-live="polite">
          </div>
        </div>

        ${renderGenealogyDateField(
            `${idPrefix}Date`,
            'Date or period',
            date,
            {
                inputId: `${idPrefix}DateInput`,
                typeId: `${idPrefix}DateType`,
                defaultDateType: 'Exact date',
                placeholder: 'e.g. 14 Feb 1915',
                className:
              'full genealogy-date-inline-range'
            }
        )}

        ${renderPlaceCombobox({
            id: `${idPrefix}Place`,
            label: 'Place',
            value: editPlaceValue(
                fact?.placeId,
                fact?.placeText
            ),
            selectedPlaceId:
            fact?.placeId || '',
            addressValue: fact?.address || '',
            placeholder:
            'Search or type a place',
            className: 'full'
        })}

        <div class="field full">
          <label for="${escapeHtml(idPrefix)}Notes">
            Notes
          </label>

          <textarea
            id="${escapeHtml(idPrefix)}Notes"
            placeholder="Research context or additional details">${escapeHtml(notes)}</textarea>
        </div>`;
}

function addPersonFactDefinitions()
{
    return [
        { id: 'prefix', label: 'Prefix', icon: icon.info || icon.plus },
        { id: 'suffix', label: 'Suffix', icon: icon.info || icon.plus },
        { id: 'causeOfDeath', label: 'Cause of death', icon: icon.death || icon.plus },
        { id: 'burialPlace', label: 'Burial place', icon: icon.mapPin || icon.plus },
        { id: 'education', label: 'Education', icon: icon.education || icon.plus },
        { id: 'occupation', label: 'Occupation', icon: icon.work || icon.placeholder || icon.plus },
        { id: 'religion', label: 'Religion', icon: icon.religion || icon.plus },
        { id: 'baptism', label: 'Baptism', icon: icon.baptism || icon.plus },
        { id: 'customFact', label: 'Custom fact', icon: icon.info || icon.plus },
        { id: 'alternativeNames', label: 'Alternative names', icon: icon.people || icon.plus }
    ];
}

function addPersonAddedFactsFromPerson(person)
{
    if (!person) return [];
    ensurePersonCentralStructures(person);
    const details = peopleProfileDetailsFor({ id: person.id });
    const facts = [];
    if (cleanEditFieldValue(person.names?.prefix || details.prefix)) facts.push('prefix');
    if (cleanEditFieldValue(person.names?.suffix || details.suffix)) facts.push('suffix');
    if (cleanEditFieldValue(person.death?.cause || person.death?.reason)) facts.push('causeOfDeath');
    if (editPlaceValue(person.death?.burialPlaceId) || cleanEditFieldValue(person.death?.burialPlaceText)) facts.push('burialPlace');
    if (cleanEditFieldValue(person.profile?.alternativeNames || details.alternativeNames)) facts.push('alternativeNames');
    if (personHasEducationFact(person)) facts.push('education');
    if (personHasOccupationFact(person)) facts.push('occupation');
    if (personHasReligionFact(person)) facts.push('religion');
    if (personHasBaptismFact(person)) facts.push('baptism');
    if (personAttributeByTag(person, 'FACT'))
    {
        facts.push('customFact');
    }

    const allowed = new Set(addPersonFactDefinitions().map(fact => fact.id));
    return [...new Set(facts)].filter(factId => allowed.has(factId));
}

function addPersonFactDefinition(factId)
{
    return addPersonFactDefinitions().find(fact => fact.id === factId) || addPersonFactDefinitions()[0];
}

function addPersonFactCardHtml(factId, person = null)
{
    const definition = addPersonFactDefinition(factId) || {
        id: factId,
        label: 'Additional fact',
        icon: icon.info
    };
    const centralPerson = person ? ensurePersonCentralStructures(person) : null;
    const details = centralPerson ? peopleProfileDetailsFor({ id: centralPerson.id }) : defaultPeopleProfileDetails();
    const death = centralPerson?.death || {};
    const education = centralPerson ? personAttributeByTag(centralPerson, 'EDUC') : null;
    const baptism = centralPerson ? personEventByTag(centralPerson, 'BAPM') : null;
    const customFact = centralPerson ? personAttributeByTag( centralPerson, 'FACT') : null;
    const prefixValue = cleanEditFieldValue(centralPerson?.names?.prefix || details.prefix);
    const suffixValue = cleanEditFieldValue(centralPerson?.names?.suffix || details.suffix);
    const header = `<div class="add-person-fact-card-header"><div class="add-person-fact-card-title"><span class="fact-button-icon" aria-hidden="true">${definition.icon}</span><span>${escapeHtml(definition.label)}</span></div><button class="add-person-fact-remove" type="button" data-add-person-remove-fact="${escapeHtml(factId)}" aria-label="Remove ${escapeHtml(definition.label)}">${icon.close}</button></div>`;
    const fieldWrap = content => `<div class="add-person-fact-card" data-add-person-fact-card="${escapeHtml(factId)}">${header}<div class="add-person-fact-grid">${content}</div></div>`;
    if (factId === 'prefix')
    {
        return fieldWrap(renderNameAffixCombobox({ id: 'addPersonFactPrefix', label: 'Prefix', value: prefixValue, kind: 'prefix', className: 'full' }));
    }
    if (factId === 'suffix')
    {
        return fieldWrap(renderNameAffixCombobox({ id: 'addPersonFactSuffix', label: 'Suffix', value: suffixValue, kind: 'suffix', className: 'full' }));
    }
    if (factId === 'customFact')
    {
        return fieldWrap(
            renderCustomFactFields(
                'addPersonCustomFact',
                customFact));
    }
    if (factId === 'causeOfDeath')
    {
        return fieldWrap(`<div class="field full"><label for="addPersonFactCauseOfDeath">Cause of death</label><input id="addPersonFactCauseOfDeath" value="${escapeHtml(cleanEditFieldValue(death.reason || death.cause))}" placeholder="Cause or reason"></div>`);
    }
    if (factId === 'burialPlace')
    {
        return fieldWrap(renderPlaceCombobox({
            id: 'addPersonFactBurialPlace',
            label: 'Burial place',
            value: editPlaceValue(death.burialPlaceId, death.burialPlaceText),
            selectedPlaceId: death.burialPlaceId || '',
            addressValue: death.burialAddress || '',
            placeholder: 'e.g. Old Cattery, England',
            className: 'full'
        }));
    }
    if (factId === 'education')
    {
        return fieldWrap(`<div class="field full">
            <label for="addPersonFactEducationInstitutionName">Institution name</label>
            <input id="addPersonFactEducationInstitutionName" data-source-value="${escapeHtml(details.educationInstitutionName || '')}" value="${escapeHtml(localizedDataFieldValue(details.educationInstitutionName || ''))}" placeholder="e.g. Pawford Grammar School">
          </div>

          <div class="field add-person-select-field">
            <label for="addPersonFactEducationInstitutionType">Institution type</label>
            <select class="compact-select add-person-select" id="addPersonFactEducationInstitutionType">
              ${educationInstitutionTypeOptions(details.educationInstitutionType)}
            </select>
            <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>

          <div class="field">
            <label for="addPersonFactEducationValue">Education or credential</label>
            <input id="addPersonFactEducationValue" data-source-value="${escapeHtml(details.educationValue || '')}" value="${escapeHtml(localizedDataFieldValue(details.educationValue || ''))}" placeholder="e.g. Secondary education, BA, apprenticeship">
          </div>

          ${renderPlaceCombobox({
                id: 'addPersonFactEducationPlace',
                label: 'Place',
                value: editPlaceValue(education?.placeId, education?.placeText || details.educationPlace),
                selectedPlaceId: education?.placeId || '',
                addressValue: education?.address || '',
                placeholder: 'e.g. Pawford, England',
                className: 'full'
            })}

          <div class="add-person-fact-date-row">
            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'addPersonFactEducationFrom',
                    'Start date',
                    details.educationFromDate,
                    {
                        inputId: 'addPersonFactEducationFromDate',
                        typeId: 'addPersonFactEducationFromDateType',
                        defaultDateType: 'Year only',
                        placeholder: 'e.g. 1915',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>

            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'addPersonFactEducationTo',
                    'End date',
                    details.educationToDate,
                    {
                        inputId: 'addPersonFactEducationToDate',
                        typeId: 'addPersonFactEducationToDateType',
                        defaultDateType: 'Year only',
                        placeholder: 'e.g. 1920',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>
          </div>

          <div class="field full">
            <label for="addPersonFactEducationNotes">Notes</label>
            <textarea id="addPersonFactEducationNotes" data-source-value="${escapeHtml(details.educationNotes || '')}" placeholder="Education notes">${escapeHtml(localizedDataFieldValue(details.educationNotes || ''))}</textarea>
          </div>`);
    }
    if (factId === 'occupation')
    {
        return fieldWrap(`<div class="field"><label for="addPersonFactWorkCompany">Company name</label>
          <input
            id="addPersonFactWorkCompany"
            data-source-value="${escapeHtml(
                details.workCompany || ''
            )}"
            value="${escapeHtml(
                localizedDataFieldValue(
                    details.workCompany || ''
                )
            )}"
            placeholder="e.g. Pawford School">
          </div>
          <div class="field"><label for="addPersonFactWorkOccupation">Occupation</label>
            <input
              id="addPersonFactWorkOccupation"
              data-source-value="${escapeHtml(
                    details.workOccupation || ''
                )}"
              value="${escapeHtml(
                    localizedDataFieldValue(
                        details.workOccupation || ''
                    )
                )}"
              placeholder="e.g. Teacher">
            </div>
          <div class="add-person-fact-date-row">
            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'addPersonFactWorkFrom',
                    'Start date',
                    details.workFromDate,
                    {
                        inputId: 'addPersonFactWorkFromDate',
                        typeId: 'addPersonFactWorkFromDateType',
                        defaultDateType: 'Exact date',
                        placeholder: 'e.g. 14 Feb 1915',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>

            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'addPersonFactWorkTo',
                    'End date',
                    details.workToDate,
                    {
                        inputId: 'addPersonFactWorkToDate',
                        typeId: 'addPersonFactWorkToDateType',
                        defaultDateType: 'Exact date',
                        placeholder: 'e.g. 14 Feb 1920',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>
          </div>
          <div class="field full"><label for="addPersonFactWorkNotes">Notes</label>
            <textarea
              id="addPersonFactWorkNotes"
              data-source-value="${escapeHtml(
                    details.workNotes || ''
                )}"
              placeholder="Work notes">${escapeHtml(
                    localizedDataFieldValue(
                        details.workNotes || ''
                    )
                )}</textarea>
            </div>`);
    }
    if (factId === 'religion')
    {
        return fieldWrap(
            renderReligionField({
                id: 'addPersonFactReligion',
                value: details.religion,
                className: 'full'
            })
        );
    }
    if (factId === 'baptism')
    {
        return fieldWrap(`${renderPlaceCombobox({
            id: 'addPersonFactBaptismPlace',
            label: 'Baptism place',
            value: editPlaceValue(baptism?.placeId, baptism?.placeText || details.baptismPlace),
            selectedPlaceId: baptism?.placeId || '',
            addressValue: baptism?.address || '',
            placeholder: 'Search or type a place',
            className: 'full'
        })}
          ${renderGenealogyDateField('addPersonFactBaptism', 'Baptism date', details.baptismDate, {
                inputId: 'addPersonFactBaptismDate',
                typeId: 'addPersonFactBaptismDateType',
                className: 'full genealogy-date-inline-range',
                defaultDateType: 'Exact date',
                placeholder: 'e.g. 14 Feb 1915'
            })}`);
    }
    return fieldWrap(`<div class="field full"><label for="addPersonFactAlternativeNames">Alternative names</label><input id="addPersonFactAlternativeNames" value="${escapeHtml(details.alternativeNames || '')}" placeholder="Nickname, spelling variant, or former name"></div>`);
}

function formatAddPersonFactSummary(count)
{
    const numericCount = Number(count);

    const normalizedCount =
        Number.isFinite(numericCount)
            ? Math.max(0, Math.trunc(numericCount))
            : 0;

    return translateText(
        normalizedCount
            ? `${normalizedCount} added`
            : 'Optional'
    );
}

function renderAddPersonAdditionalFacts(person = null)
{
    const activeFacts = addPersonAddedFactsFromPerson(person);
    const expanded = activeFacts.length > 0;
    const definitions = addPersonFactDefinitions();
    return `<section class="add-person-additional-section">
        <div class="add-person-facts-section" data-add-person-facts>
          <button class="add-person-facts-header" type="button" data-add-person-facts-toggle aria-expanded="${expanded ? 'true' : 'false'}">
            <span class="add-person-facts-header-main"><span class="add-person-facts-chevron" aria-hidden="true">${icon.chevron}</span><span>Additional facts</span></span>
            <span class="add-person-facts-meta" data-add-person-facts-count>${escapeHtml(formatAddPersonFactSummary(activeFacts.length))}</span>
          </button>
          <div class="add-person-facts-body" data-add-person-facts-body ${expanded ? '' : 'hidden'}>
            <div class="fact-buttons" data-add-person-fact-buttons>
              ${definitions.map(fact => `<button class="fact-button ${activeFacts.includes(fact.id) ? 'is-added' : ''}" type="button" data-add-person-add-fact="${escapeHtml(fact.id)}" ${activeFacts.includes(fact.id) ? 'disabled' : ''}><span class="fact-button-icon" aria-hidden="true">${fact.icon}</span><span>${escapeHtml(fact.label)}</span></button>`).join('')}
            </div>
            <div class="add-person-facts-added" data-add-person-facts-added>${activeFacts.map(factId => addPersonFactCardHtml(factId, person)).join('')}</div>
          </div>
        </div>
      </section>`;
}


const PARTNER_RELATIONSHIP_DEFINITIONS = Object.freeze({
    'Married': Object.freeze({ status: 'active', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Marriage date', startPlaceLabel: 'Marriage place', showsMarriageType: true }),
    'Partner': Object.freeze({ status: 'active', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false }),
    'Unmarried partner': Object.freeze({ status: 'active', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false }),
    'Former partner': Object.freeze({ status: 'ended', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: 'EVEN', endEventType: 'Partnership', endTypeLabel: 'Partnership ended', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: false }),
    'Separated': Object.freeze({ status: 'separated', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'EVEN', endEventType: 'Separation', endTypeLabel: 'Separation', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Divorced': Object.freeze({ status: 'divorced', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'DIV', endEventType: 'Divorce', endTypeLabel: '', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Annulled': Object.freeze({ status: 'annulled', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'ANUL', endEventType: 'Annulment', endTypeLabel: '', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Engaged': Object.freeze({ status: 'active', startTag: 'ENGA', startEventType: 'Engagement', startTypeLabel: '', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Engagement date', startPlaceLabel: 'Engagement place', showsMarriageType: false }),
    'Unknown relationship': Object.freeze({ status: 'unknown', startTag: 'EVEN', startEventType: 'Relationship', startTypeLabel: 'Relationship began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false })
});

const ADD_PERSON_RELATIONSHIP_TYPES = Object.freeze(Object.keys(PARTNER_RELATIONSHIP_DEFINITIONS));
const ADD_PERSON_MARRIAGE_TYPES = ['Civil', 'Religious', 'Common law', 'Customary', 'Tribal custom', 'Unknown'];

function addPersonRelationshipTypeOptions(selected = 'Married')
{
    const active = ADD_PERSON_RELATIONSHIP_TYPES.includes(selected) ? selected : 'Married';
    return ADD_PERSON_RELATIONSHIP_TYPES.map(value => `<option value="${escapeHtml(value)}" ${value === active ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}
function partnerRelationshipDefinition(type)
{
    return PARTNER_RELATIONSHIP_DEFINITIONS[type] || PARTNER_RELATIONSHIP_DEFINITIONS['Unknown relationship'];
}
function addPersonRelationshipShowsMarriageType(type)
{
    return partnerRelationshipDefinition(String(type || '').trim()).showsMarriageType;
}
function addPersonMarriageTypeOptions(selected = 'Civil')
{
    const active = ADD_PERSON_MARRIAGE_TYPES.includes(selected) ? selected : 'Civil';
    return ADD_PERSON_MARRIAGE_TYPES.map(value => `<option value="${escapeHtml(value)}" ${value === active ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function relationshipEventMatches(event, tag, typeLabel = '')
{
    if (!event || String(event.gedcomTag || event.tag || '').toUpperCase() !== tag) return false;
    if (tag !== 'EVEN') return true;
    return cleanEditFieldValue(event.typeLabel).toLowerCase() === cleanEditFieldValue(typeLabel).toLowerCase();
}

function partnerRelationshipManagedEvent(family, tag, typeLabel = '')
{
    return (family?.events || []).find(event => relationshipEventMatches(event, tag, typeLabel)) || null;
}

function legacyRelationshipDate(family, prefix = 'start')
{
    return normalizeGenealogyDateInput({
        date: family?.[`${prefix}Date`] || '',
        dateLabel: family?.[`${prefix}DateLabel`] || '',
        dateType: family?.[`${prefix}DateType`] || 'Exact date',
        sortDate: family?.[`${prefix}SortDate`] || '',
        calendar: family?.[`${prefix}Calendar`] || 'Gregorian',
        originalText: family?.[`${prefix}OriginalText`] || ''
    }, 'Exact date');
}

function partnerRelationshipStartEvent(family, type = relationshipTypeFromLegacy(family))
{
    const definition = partnerRelationshipDefinition(type);
    const exact = partnerRelationshipManagedEvent(family, definition.startTag, definition.startTypeLabel);
    if (exact) return exact;
    const legacy = ['MARR', 'ENGA'].map(tag => relationshipEventByTag(family, tag)).find(Boolean);
    if (legacy) return legacy;
    return createRelationshipEvent(definition.startTag, definition.startEventType, {
        id: `${family?.id || 'new-relationship'}-start`,
        typeLabel: definition.startTypeLabel,
        date: legacyRelationshipDate(family, 'start'),
        placeId: family?.startPlaceId || null,
        placeText: family?.startPlaceText || ''
    });
}

function partnerRelationshipEndEvent(family, type = relationshipTypeFromLegacy(family))
{
    const definition = partnerRelationshipDefinition(type);
    if (!definition.hasEnd) return null;
    const exact = partnerRelationshipManagedEvent(family, definition.endTag, definition.endTypeLabel);
    if (exact) return exact;
    const legacy = ['DIV', 'ANUL'].map(tag => relationshipEventByTag(family, tag)).find(Boolean);
    if (legacy) return legacy;
    return createRelationshipEvent(definition.endTag, definition.endEventType, {
        id: `${family?.id || 'new-relationship'}-end`,
        typeLabel: definition.endTypeLabel,
        date: legacyRelationshipDate(family, 'end'),
        placeId: family?.endPlaceId || null,
        placeText: family?.endPlaceText || ''
    });
}

function renderPartnerRelationshipDateFields({ prefix, relationshipType, family = null } = {})
{
    const definition = partnerRelationshipDefinition(relationshipType);
    const startEvent = partnerRelationshipStartEvent(family, relationshipType);
    const endEvent = partnerRelationshipEndEvent(family, relationshipType);
    const startPlace = editPlaceValue(startEvent?.placeId || family?.startPlaceId, startEvent?.placeText || family?.startPlaceText);
    const endPlace = editPlaceValue(endEvent?.placeId || family?.endPlaceId, endEvent?.placeText || family?.endPlaceText);

    return `<div class="partner-relationship-start" data-partner-relationship-start>
        ${renderGenealogyDateField(`${prefix}StartDate`, definition.startLabel, startEvent?.date || emptyGenealogyDate('Exact date'), {
            inputId: `${prefix}StartDateInput`, typeId: `${prefix}StartDateType`, placeholder: 'e.g. 14 Feb 1915', defaultDateType: 'Exact date', className: 'full genealogy-date-inline-range'
        })}
        ${renderPlaceCombobox({ id: `${prefix}StartPlace`, label: definition.startPlaceLabel, value: startPlace, selectedPlaceId: startEvent?.placeId || family?.startPlaceId || '', addressValue: startEvent?.address || family?.startAddress || '', placeholder: 'e.g. Meowbridge, England', className: 'full', inputAttrs: 'data-partner-relationship-start-place' })}
      </div>
      <div class="partner-relationship-end" data-partner-relationship-end ${definition.hasEnd ? '' : 'hidden'}>
        ${renderGenealogyDateField(`${prefix}EndDate`, definition.endLabel || 'To', endEvent?.date || emptyGenealogyDate('Exact date'), {
            inputId: `${prefix}EndDateInput`, typeId: `${prefix}EndDateType`, placeholder: 'e.g. 12 Jun 2025', defaultDateType: 'Exact date', className: 'full genealogy-date-inline-range'
        })}
        ${renderPlaceCombobox({ id: `${prefix}EndPlace`, label: definition.endPlaceLabel || 'To place', value: endPlace, selectedPlaceId: endEvent?.placeId || family?.endPlaceId || '', addressValue: endEvent?.address || family?.endAddress || '', placeholder: 'e.g. Pawford, England', className: 'full', inputAttrs: 'data-partner-relationship-end-place' })}
      </div>`;
}

function relationshipBlockShouldShow(options = {}, editPerson = null)
{
    if (options.relativeType === 'partner') return true;
    if (options.mode === 'edit' && editPerson) return getPartnerRelationships(editPerson.id).length > 0;
    return false;
}

function renderAddPersonRelationshipCard({
    relationship = null,
    personId = '',
    partner = null,
    index = 0,
    mode = 'edit',
    partnerChildrenMode = PARTNER_CHILDREN_ADD_PARENT
} = {})
{
    const relationshipType = relationship
        ? relationshipTypeFromLegacy(relationship)
        : mode === 'addPartner'
            ? 'Married'
            : 'Partner';
    const partnerName = partner?.names?.display || (mode === 'addPartner' ? 'Selected person' : 'Unknown person');
    const fieldPrefix = `addPersonRelationship${index}`;
    const startEvent = partnerRelationshipStartEvent(relationship, relationshipType);
    const marriageType = startEvent?.typeLabel || relationship?.marriageType || 'Civil';
    const showMarriageType = addPersonRelationshipShowsMarriageType(relationshipType);
    const showPartnerUnlinkToast = Boolean(mode === 'edit' && relationship?.id && personId && partner?.id);

    return `<div class="add-person-relationship-card" data-add-person-relationship-card data-relationship-id="${escapeHtml(relationship?.id || '')}" data-partner-id="${escapeHtml(partner?.id || '')}" data-relationship-index="${index}">
        <div class="add-person-relationship-grid">
          <div class="field add-person-select-field add-person-relationship-type-field">
            <label for="${fieldPrefix}Type">Relationship type</label>
            <select class="compact-select add-person-select" id="${fieldPrefix}Type" data-add-person-relationship-type>
              ${addPersonRelationshipTypeOptions(relationshipType)}
            </select>
            <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>

          <div class="field add-person-relationship-partner-field">
            <label>Person</label>
            <div class="add-person-relationship-partner-shell">
              <div class="add-person-relationship-partner">
                ${renderPersonAvatar(
                    partner,
                    'small-avatar'
                )}
                <span>${escapeHtml(partnerName)}</span>
              </div>
              ${showPartnerUnlinkToast ? `
                <button
                  class="add-person-relationship-partner-unlink"
                  type="button"
                  aria-label="Unlink ${escapeHtml(partnerName)}"
                  data-add-person-unlink-partner
                  data-person-id="${escapeHtml(personId)}"
                  data-partner-id="${escapeHtml(partner?.id || '')}"
                  data-relationship-id="${escapeHtml(relationship?.id || '')}">
                  ${icon.unlink}
                </button>
              ` : ''}
            </div>
          </div>

          ${renderPartnerRelationshipDateFields({ prefix: fieldPrefix, relationshipType, family: relationship })}

          <div class="field add-person-select-field add-person-marriage-type-field" data-add-person-marriage-type-field ${showMarriageType ? '' : 'hidden'}>
            <label for="${fieldPrefix}MarriageType">Marriage type</label>
            <select class="compact-select add-person-select" id="${fieldPrefix}MarriageType" data-add-person-marriage-type>
              ${addPersonMarriageTypeOptions(marriageType)}
            </select>
            <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>
          ${mode === 'addPartner'
                ? renderPartnerChildrenSelector({
                    anchorPersonId: partner?.id || '',
                    relationshipType: 'partner',
                    selectedPersonId: '',
                    selectedValue: partnerChildrenMode,
                    controlId: 'addPersonPartnerChildrenMode'
                })
                : ''}
        </div>
      </div>`;
}

function renderAddPersonRelationshipBlock(options = {}, editPerson = null)
{
    const isPartnerMode = options.relativeType === 'partner';
    const anchorPerson = isPartnerMode ? getPerson(options.personId || state.selectedPersonId) : null;
    const relationships = editPerson ? getPartnerRelationships(editPerson.id) : [];
    const cards = isPartnerMode
        ? [
            renderAddPersonRelationshipCard({
                relationship: null,
                personId: '',
                partner: anchorPerson,
                index: 0,
                mode: 'addPartner',
                partnerChildrenMode:
                normalizePartnerChildrenMode(
                    options.partnerChildrenMode
                )
            })
        ]
        : relationships.map((relationship, index) => renderAddPersonRelationshipCard({
            relationship,
            personId: editPerson?.id || '',
            partner: getRelationshipPartner(relationship, editPerson?.id),
            index,
            mode: 'edit'
        }));

    if (!cards.length) return '';

    return `<section class="add-person-relationship-section" data-add-person-relationship-section>
        <div class="add-person-relationship-panel">
          <button class="add-person-relationship-header" type="button" data-add-person-relationship-toggle aria-expanded="true">
            <span class="add-person-relationship-header-main">
              <span class="add-person-relationship-chevron" aria-hidden="true">${icon.chevron}</span>
              <span>Relationship</span>
            </span>
          </button>

          <div class="add-person-relationship-body" data-add-person-relationship-body>
            ${cards.join('')}
          </div>
        </div>
      </section>`;
}

function updatePartnerRelationshipFields(
    card,
    relationshipType
)
{
    const definition =
        partnerRelationshipDefinition(
            relationshipType
        );

    const start =
        card?.querySelector(
            '[data-partner-relationship-start]'
        );

    const end =
        card?.querySelector(
            '[data-partner-relationship-end]'
        );

    const marriageTypeField =
        card?.querySelector(
            [
                '[data-add-person-marriage-type-field]',
                '[data-relationship-edit-marriage-type]'
            ].join(', ')
        );

    const startDateLabel =
        start?.querySelector(
            '.genealogy-date-field > label'
        );

    const startPlaceLabel =
        start?.querySelector(
            '.place-combobox-field > label'
        );

    const endDateLabel =
        end?.querySelector(
            '.genealogy-date-field > label'
        );

    const endPlaceLabel =
        end?.querySelector(
            '.place-combobox-field > label'
        );

    if (startDateLabel)
    {
        startDateLabel.textContent =
            t(definition.startLabel);
    }

    if (startPlaceLabel)
    {
        startPlaceLabel.textContent =
            t(definition.startPlaceLabel);
    }

    if (endDateLabel)
    {
        endDateLabel.textContent =
            t(
                definition.endLabel
            || 'To'
            );
    }

    if (endPlaceLabel)
    {
        endPlaceLabel.textContent =
            t(
                definition.endPlaceLabel
            || 'To place'
            );
    }

    if (end)
    {
        end.hidden =
            !definition.hasEnd;
    }

    if (marriageTypeField)
    {
        marriageTypeField.hidden =
            !definition.showsMarriageType;
    }
}

function partnerRelationshipDateOrderIsValid(startDate, endDate)
{
    const comparableTypes = new Set(['Exact date', 'Year only']);
    const start = normalizeGenealogyDateInput(startDate || {}, 'Exact date');
    const end = normalizeGenealogyDateInput(endDate || {}, 'Exact date');

    if (!start.sortDate || !end.sortDate) return true;
    if (!comparableTypes.has(start.dateType) || !comparableTypes.has(end.dateType)) return true;

    return Number(end.sortDate) >= Number(start.sortDate);
}

function updateAddPersonPartnerChildrenLabel()
{
    const selector =
        modalBackdrop?.querySelector(
            '#addPersonPartnerChildrenMode'
        );

    if (!selector) return;

    const addParentOption =
        selector.querySelector(
            `option[value="${PARTNER_CHILDREN_ADD_PARENT}"]`
        );

    if (!addParentOption) return;

    const gender =
        modalBackdrop?.querySelector('#addPersonGender')?.value
        || 'Unknown';

    addParentOption.textContent = t(
        partnerChildrenAddLabel('', gender)
    );
}

function bindAddPersonRelationshipBlock()
{
    modalBackdrop?.querySelectorAll('[data-add-person-relationship-toggle]').forEach(button =>
    {
        if (button.dataset.relationshipToggleBound === 'true') return;
        button.dataset.relationshipToggleBound = 'true';

        const section = button.closest('[data-add-person-relationship-section]');
        const body = section?.querySelector('[data-add-person-relationship-body]');

        button.addEventListener('click', () =>
        {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');

            if (body)
            {
                body.hidden = isExpanded;
            }
        });
    });
    modalBackdrop?.querySelectorAll('[data-add-person-relationship-type]').forEach(select =>
    {
        const card = select.closest('[data-add-person-relationship-card]');

        const updateRelationshipFields = () =>
        {
            updatePartnerRelationshipFields(card, select.value);
        };

        select.addEventListener('change', updateRelationshipFields);
        updateRelationshipFields();
    });

    const partnerChildrenSelector =
        modalBackdrop?.querySelector(
            '#addPersonPartnerChildrenMode'
        );

    const addPersonGender =
        modalBackdrop?.querySelector('#addPersonGender');

    if (
        partnerChildrenSelector
        && addPersonGender
        && addPersonGender.dataset.partnerChildrenLabelBound !== 'true'
    )
    {
        addPersonGender.dataset.partnerChildrenLabelBound = 'true';

        addPersonGender.addEventListener(
            'change',
            updateAddPersonPartnerChildrenLabel
        );
    }

    updateAddPersonPartnerChildrenLabel();

    modalBackdrop
        ?.querySelectorAll(
            '[data-add-person-unlink-partner]'
        )
        .forEach(button =>
        {
            if (
                button.dataset
                    .unlinkPartnerBound === 'true'
            )
            {
                return;
            }

            button.dataset
                .unlinkPartnerBound = 'true';

            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    const personId =
                        button.dataset.personId
                || '';

                    const partnerId =
                        button.dataset.partnerId
                || '';

                    const familyId =
                        button.dataset.relationshipId
                || '';

                    if (
                        !personId
                || !partnerId
                || !familyId
                    )
                    {
                        showToast(
                            'Relationship information is missing.'
                        );

                        return;
                    }

                    const sidebarContext =
                        state.activeModule === 'People'
                            ? state.peopleView === 'profile'
                                ? 'profile'
                                : 'people'
                            : 'tree';

                    openUnlinkRelationshipModal({
                        kind: 'partner',
                        personId,
                        relatedPersonId:
                  partnerId,
                        familyId,
                        sidebarContext
                    });
                }
            );
        });
}

function collectAddPersonRelationshipBlock()
{
    const cards = Array.from(modalBackdrop?.querySelectorAll('[data-add-person-relationship-card]') || []);
    const relationships = [];

    for (const card of cards)
    {
        const index = card.dataset.relationshipIndex || '0';
        const relationshipType = card.querySelector('[data-add-person-relationship-type]')?.value || 'Married';
        const definition = partnerRelationshipDefinition(relationshipType);
        const marriageTypeSelect = card.querySelector('[data-add-person-marriage-type]');
        const marriageType = definition.showsMarriageType
            ? marriageTypeSelect?.value || 'Civil'
            : '';

        const prefix = `addPersonRelationship${index}`;
        const startDate = collectGenealogyDateField(`${prefix}StartDate`);
        const endDate = definition.hasEnd
            ? collectGenealogyDateField(`${prefix}EndDate`)
            : emptyGenealogyDate('Exact date');

        if (!startDate || (definition.hasEnd && !endDate))
        {
            return {
                invalid: true,
                message: 'Check the relationship dates before saving.'
            };
        }

        if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
        {
            return {
                invalid: true,
                message: 'The relationship end date must be after or equal to the start date.'
            };
        }

        relationships.push({
            relationshipId: card.dataset.relationshipId || '',
            partnerId: card.dataset.partnerId || '',
            relationshipType,
            marriageType,
            startDate,
            startPlace: readPlaceInputValue('[data-partner-relationship-start-place]', card),
            endDate,
            endPlace: definition.hasEnd
                ? readPlaceInputValue('[data-partner-relationship-end-place]', card)
                : { text: '', selectedPlaceId: '' }
        });
    }

    return {
        invalid: false,
        relationships
    };
}

function relationshipIdForPartners(personAId, personBId)
{
    const left = String(personAId || 'person-a').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const right = String(personBId || 'person-b').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    return `rel-${left}-${right}-family`;
}

function upsertManagedRelationshipEvent(relationship, role, definition, dateInput, placeInput, marriageType = '')
{
    relationship.events = Array.isArray(relationship.events) ? relationship.events : [];
    const isStart = role === 'start';
    const tag = isStart ? definition.startTag : definition.endTag;
    const eventType = isStart ? definition.startEventType : definition.endEventType;
    const managedTypeLabel = isStart ? definition.startTypeLabel : definition.endTypeLabel;
    const typeLabel = tag === 'MARR' ? marriageType : managedTypeLabel;
    let event = partnerRelationshipManagedEvent(relationship, tag, managedTypeLabel);
    const date = normalizeGenealogyDateInput(dateInput || {}, 'Exact date');
    const resolvedPlace = resolvePlaceAssignment(placeInput, event?.placeId || relationship?.[`${role}PlaceId`] || '');

    if (!event)
    {
        event = createRelationshipEvent(tag, eventType, {
            id: `${relationship.id}-${role}`,
            typeLabel,
            date,
            placeId: resolvedPlace.placeId,
            placeText: resolvedPlace.placeText,
            address: resolvedPlace.address
        });
        event.relationshipManagedRole = role;
        relationship.events.push(event);
    }
    else
    {
        event.eventType = eventType;
        event.gedcomTag = tag;
        event.typeLabel = typeLabel;
        event.date = date;
        event.placeId = resolvedPlace.placeId;
        event.placeText = resolvedPlace.placeText;
        event.address = resolvedPlace.address;
        event.sortDate = date.sortDate || '';
        event.relationshipManagedRole = role;
    }

    relationship[`${role}Date`] = date.date;
    relationship[`${role}DateLabel`] = date.dateLabel;
    relationship[`${role}DateType`] = date.dateType;
    relationship[`${role}SortDate`] = date.sortDate;
    relationship[`${role}Calendar`] = date.calendar;
    relationship[`${role}OriginalText`] = date.originalText;
    relationship[`${role}PlaceId`] = resolvedPlace.placeId;
    relationship[`${role}PlaceText`] = resolvedPlace.placeText;
    relationship[`${role}Address`] = resolvedPlace.address;
    return event;
}

function removeManagedRelationshipEndEvents(relationship)
{
    relationship.events = (relationship.events || []).filter(event =>
    {
        if (event.relationshipManagedRole === 'end') return false;
        const tag = String(event.gedcomTag || event.tag || '').toUpperCase();
        const type = cleanEditFieldValue(event.typeLabel).toLowerCase();
        return !(['DIV', 'ANUL'].includes(tag) || (tag === 'EVEN' && ['partnership ended', 'separation'].includes(type)));
    });
    ['endDate', 'endDateLabel', 'endDateType', 'endSortDate', 'endCalendar', 'endOriginalText', 'endPlaceId', 'endPlaceText']
        .forEach(key =>
        {
            relationship[key] = key.endsWith('Id') ? null : '';
        });
}

function upsertPartnerRelationshipEvents(relationship, values)
{
    const relationshipType = ADD_PERSON_RELATIONSHIP_TYPES.includes(values.relationshipType)
        ? values.relationshipType
        : 'Unknown relationship';
    const definition = partnerRelationshipDefinition(relationshipType);
    const marriageType = definition.showsMarriageType
        ? values.marriageType || relationship.marriageType || 'Civil'
        : '';

    relationship.relationshipType = relationshipType;
    relationship.relationshipStatus = definition.status;
    relationship.marriageType = marriageType;

    upsertManagedRelationshipEvent(relationship, 'start', definition, values.startDate, values.startPlace, marriageType);

    if (definition.hasEnd)
    {
        upsertManagedRelationshipEvent(relationship, 'end', definition, values.endDate, values.endPlace, marriageType);
    }
    else
    {
        removeManagedRelationshipEndEvents(relationship);
    }
}

function savePersonRelationshipBlock(personId, collected)
{
    if (!collected || collected.invalid || !collected.relationships?.length) return;

    collected.relationships.forEach(values =>
    {
        const relationship = centralFamilyRecords().find(rel => rel.id === values.relationshipId && isFamilyRelationship(rel));
        if (!relationship) return;

        upsertPartnerRelationshipEvents(relationship, values);
        relationship.updatedAt = 'Just now';
    });
}

function createPersonIdFromName(firstName, lastName)
{
    const base = [firstName, lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'person';
    let id = base;
    let counter = 2;
    while (getPerson(id))
    {
        id = `${base}-${counter}`;
        counter += 1;
    }
    return id;
}

function createPersonFromAddPersonModal(options = {}, additionalFacts = {})
{
    const projectId = requireActiveProjectId();
    if (!projectId) return null;
    const enteredFirstName = readAddPersonModalValue('#addPersonFirstName');
    const firstName = enteredFirstName || 'Unknown';
    const lastName = readAddPersonModalValue('#addPersonLastName');
    const middleName = readAddPersonModalValue('#addPersonMiddleName');
    const maidenName = readAddPersonModalValue('#addPersonMaidenName');
    const id = createPersonIdFromName( firstName, lastName);
    const genderValue = readAddPersonModalValue('#addPersonGender');
    const livingStatus = normalizeLivingStatus(readAddPersonModalValue('#addPersonLivingStatus'));
    const birthDate = collectGenealogyDateField('addPersonBirth') || emptyGenealogyDate('Exact date');
    const deathDate = livingStatus === 'Deceased' ? collectGenealogyDateField('addPersonDeath') || emptyGenealogyDate('Exact date') : emptyGenealogyDate('Exact date');
    const display = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const initials = `${firstName[0] || 'U'}${lastName[0] || ''}`.toUpperCase();
    const birthPlace = resolvePlaceInputSelector('#addPersonBirthPlace');
    const deathPlace = livingStatus === 'Deceased'
        ? resolvePlaceInputSelector('#addPersonDeathPlace')
        : { placeId: null, placeText: '', address: '', created: false };
    const now =
        new Date().toISOString();
    const person = {
        id,
        projectId,
        createdAt: now,
        updatedAt: now,
        names: { first: firstName, middle: middleName, last: lastName, maiden: maidenName, display, initials },
        gender: genderValue === 'Male' ? 'male' : genderValue === 'Female' ? 'female' : 'unknown',
        livingStatus,
        avatarClass: genderValue === 'Female' ? 'avatar-purple' : genderValue === 'Male' ? 'avatar-green' : '',
        birth: {
            ...birthDate,
            placeId: birthPlace.placeId,
            placeText: birthPlace.placeText,
            address: birthPlace.address
        },
        death: {
            ...deathDate,

            placeId:
            deathPlace.placeId,

            placeText:
            deathPlace.placeText,

            address:
            deathPlace.address,

            reason:
            '',

            cause:
            '',

            burialPlaceId:
            null,

            burialPlaceText:
            ''
        },
        profile: { alternativeNames: null },
        attributes: [],
        events: [],
        notes: [],
        citations: [],
        counts: { files: 0, notes: 0 },
        meta: { updated: 'Just now', sourceStatus: 'Unsourced', reviewStatus: 'New record' }
    };

    applyAddPersonAdditionalFacts(person, additionalFacts);
    sampleData.people.push(person);
    return person;
}

function relationshipRoleHintForPerson(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'male') return 'HUSB';
    if (gender === 'female') return 'WIFE';

    return '';
}

function parentSlotPreference(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'female') return 'mother';
    return 'father';
}

function uniqueFamilyId(baseId)
{
    const cleanBase = String(baseId || 'family')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'family';

    let id = cleanBase;
    let counter = 2;

    while (centralFamilyRecords().some(family => family.id === id))
    {
        id = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return id;
}

function syncFamilyPartnerAliases(family)
{
    const partnerA = family.partnerAId || family.partner1Id || family.personAId || '';
    const partnerB = family.partnerBId || family.partner2Id || family.personBId || '';

    family.partnerAId = partnerA;
    family.partner1Id = partnerA;
    family.personAId = partnerA;

    family.partnerBId = partnerB;
    family.partner2Id = partnerB;
    family.personBId = partnerB;

    family.childIds = [...new Set([...(family.childIds || []), ...(family.childrenIds || [])].filter(Boolean))];
    family.childrenIds = [...family.childIds];

    family.events = Array.isArray(family.events) ? family.events : [];
    family.attributes = Array.isArray(family.attributes) ? family.attributes : [];
    family.notes = Array.isArray(family.notes) ? family.notes : [];
    family.citations = Array.isArray(family.citations) ? family.citations : [];
    family.mediaIds = Array.isArray(family.mediaIds) ? family.mediaIds : [];

    family.relationshipStatus = family.relationshipStatus || 'active';
    family.gedcomXref = family.gedcomXref || `@F${family.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;

    return family;
}

function personDisplayName(personId)
{
    return connectPersonName(getPerson(personId));
}

function parentIdsForPerson(personId)
{
    return getParents(personId)
        .map(parent => parent.id)
        .filter(Boolean);
}

function childIdsForPerson(personId)
{
    return getChildren(personId)
        .map(child => child.id)
        .filter(Boolean);
}

function collectAncestorIds(personId, visited = new Set())
{
    parentIdsForPerson(personId).forEach(parentId =>
    {
        if (!parentId || visited.has(parentId)) return;
        visited.add(parentId);
        collectAncestorIds(parentId, visited);
    });

    return visited;
}

function collectDescendantIds(personId, visited = new Set())
{
    childIdsForPerson(personId).forEach(childId =>
    {
        if (!childId || visited.has(childId)) return;
        visited.add(childId);
        collectDescendantIds(childId, visited);
    });

    return visited;
}

function hasParentChildRelationship(parentId, childId)
{
    return centralFamilyRecords().some(family =>
        (family.childIds || family.childrenIds || []).includes(childId)
          && familyIncludesPerson(family, parentId)
    );
}

function hasPartnerRelationship(personAId, personBId)
{
    return Boolean(getPartnerRelationshipBetween(personAId, personBId));
}

function validateParentChildConnection(parentId, childId)
{
    if (!parentId || !childId)
    {
        return {
            ok: false,
            title: 'Missing person',
            message: 'Select a person to connect.'
        };
    }

    if (!getPerson(parentId) || !getPerson(childId))
    {
        return {
            ok: false,
            title: 'Person not found',
            message: 'Person record not found.'
        };
    }

    if (parentId === childId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected to themselves.'
        };
    }

    if (hasParentChildRelationship(parentId, childId))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: `${personDisplayName(parentId)} is already connected as a parent of ${personDisplayName(childId)}.`
        };
    }

    if (collectDescendantIds(childId).has(parentId))
    {
        return {
            ok: false,
            title: 'Relationship loop',
            message: `${personDisplayName(parentId)} is already a descendant of ${personDisplayName(childId)}. Connecting them as a parent would create a cycle.`
        };
    }

    if (collectAncestorIds(parentId).has(childId))
    {
        return {
            ok: false,
            title: 'Relationship loop',
            message: `${personDisplayName(childId)} is already an ancestor of ${personDisplayName(parentId)}. Connecting them as a child would create a cycle.`
        };
    }

    return { ok: true };
}

function validatePartnerConnection(personAId, personBId)
{
    if (!personAId || !personBId)
    {
        return {
            ok: false,
            title: 'Missing person',
            message: 'Select a person to connect.'
        };
    }

    if (!getPerson(personAId) || !getPerson(personBId))
    {
        return {
            ok: false,
            title: 'Person not found',
            message: 'Person record not found.'
        };
    }

    if (personAId === personBId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected to themselves.'
        };
    }

    if (hasPartnerRelationship(personAId, personBId))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: `${personDisplayName(personAId)} and ${personDisplayName(personBId)} are already connected as partners.`
        };
    }

    return { ok: true };
}

function parentWarningForConnection(parentId, childId)
{
    if (!parentId || !childId) return null;

    const existingParents = getParents(childId)
        .filter(parent => parent.id && parent.id !== parentId);

    if (!existingParents.length) return null;

    return {
        severity: 'warning',
        title: 'Warning!',
        message: `${personDisplayName(childId)} already has ${existingParents.length === 1 ? 'a recorded parent' : 'recorded parents'}. The selected person will be connected as an additional parent.`
    };
}

const SINGLE_PARENT_FAMILY_CHOICE = '__single_parent__';

function activeProjectFamiliesForPerson(personId)
{
    const person = getPerson(personId);
    const projectId = person?.projectId || currentProjectId();

    return centralFamilyRecords().filter(family =>
        family
          && family.projectId === projectId
          && family.relationshipStatus !== 'deleted'
    );
}

function partnerFamiliesForPerson(personId)
{
    return activeProjectFamiliesForPerson(personId)
        .filter(family => familyIncludesPerson(family, personId));
}

function parentFamiliesForPerson(personId)
{
    return activeProjectFamiliesForPerson(personId)
        .filter(family => unlinkFamilyChildrenIds(family).includes(personId));
}

function familyHasSecondPartner(family, personId)
{
    return Boolean(familyPartnerId(family, personId));
}

function parentFamilyDisplayLabel(family)
{
    const names = [
        familyPartnerAId(family),
        familyPartnerBId(family)
    ]
        .filter(Boolean)
        .map(personDisplayName)
        .map(translateText)
        .filter(Boolean);

    return names.length > 1
        ? `${names[0]} ${t('and')} ${names[1]}`
        : names[0] || 'Unknown family';
}

function parentFamilyChoices(anchorPersonId, relationshipType)
{
    const type = normalizeConnectRelationshipType(relationshipType);

    if (type === 'sibling')
    {
        return parentFamiliesForPerson(anchorPersonId).map(family => ({
            value: family.id,
            label: parentFamilyDisplayLabel(family),
            family
        }));
    }

    if (type !== 'child') return [];

    const existing = partnerFamiliesForPerson(anchorPersonId)
        .filter(family => familyHasSecondPartner(family, anchorPersonId))
        .map(family => ({
            value: family.id,
            label: parentFamilyDisplayLabel(family),
            family
        }));

    return [
        ...existing,
        {
            value: SINGLE_PARENT_FAMILY_CHOICE,
            label: `${t('Single parent')} — ${translateText(personDisplayName(anchorPersonId))}`,
            family: null
        }
    ];
}

function defaultParentFamilySelection(
    anchorPersonId,
    relationshipType,
    preferredFamilyId = ''
)
{
    const type = normalizeConnectRelationshipType(relationshipType);
    const choices = parentFamilyChoices(anchorPersonId, type);
    const preferred = String(preferredFamilyId || '');

    if (choices.some(choice => choice.value === preferred))
    {
        return preferred;
    }

    if (type === 'sibling')
    {
        return choices.length === 1 ? choices[0].value : '';
    }

    const partnerChoices = choices.filter(choice =>
        choice.value !== SINGLE_PARENT_FAMILY_CHOICE
    );

    if (partnerChoices.length === 1)
    {
        return partnerChoices[0].value;
    }

    if (!partnerChoices.length)
    {
        return SINGLE_PARENT_FAMILY_CHOICE;
    }

    return '';
}

function validateParentFamilySelection({
    anchorPersonId,
    relationshipType,
    selection
} = {})
{
    const type = normalizeConnectRelationshipType(relationshipType);

    if (!['child', 'sibling'].includes(type))
    {
        return { ok: true };
    }

    const choices = parentFamilyChoices(anchorPersonId, type);
    const selected = String(selection || '');

    if (!selected)
    {
        return {
            ok: false,
            title: 'Select a parent family',
            message: type === 'sibling'
                ? 'Choose the parent family the siblings share.'
                : 'Choose the family this child will be added to.'
        };
    }

    if (!choices.some(choice => choice.value === selected))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: type === 'sibling'
                ? 'Add or connect a parent before creating a sibling.'
                : 'The selected parent family is no longer available.'
        };
    }

    return { ok: true };
}

function renderParentFamilySelector({
    anchorPersonId,
    relationshipType,
    selectedValue = '',
    controlId = 'addPersonParentFamily',
    showSelectionLabel = true
} = {})
{
    const type =
        normalizeConnectRelationshipType(
            relationshipType
        );

    if (!['child', 'sibling'].includes(type))
    {
        return '';
    }

    const choices =
        parentFamilyChoices(
            anchorPersonId,
            type
        );

    const selected =
        selectedValue
        || defaultParentFamilySelection(
            anchorPersonId,
            type
        );

    const isSibling =
        type === 'sibling';

    const headingId =
        `${controlId}Heading`;

    const selectionLabel =
        isSibling
            ? 'Shared parent family'
            : 'Family for this child';

    return `
        <section
          class="add-person-parent-family"
          data-parent-family-selector>

          <h3
            class="form-section-title"
            id="${escapeHtml(headingId)}">
            Parent family
          </h3>

          <div class="field">
            ${
                showSelectionLabel
                    ? `
                  <label for="${escapeHtml(controlId)}">
                    ${selectionLabel}
                  </label>
                `
                    : ''
            }

            <div class="add-person-select-field">
              <select
                class="compact-select add-person-select"
                id="${escapeHtml(controlId)}"
                data-parent-family-selection
                ${
                    showSelectionLabel
                        ? ''
                        : `aria-labelledby="${escapeHtml(headingId)}"`
                }
                ${choices.length ? '' : 'disabled'}>

                ${
                    selected
                        ? ''
                        : '<option value="">Select a parent family</option>'
                }

                ${
                    choices.length
                        ? choices
                            .map(choice => `
                          <option
                            value="${escapeHtml(choice.value)}"
                            ${
                                choice.value === selected
                                    ? 'selected'
                                    : ''
                            }>
                            ${escapeHtml(choice.label)}
                          </option>
                        `)
                            .join('')
                        : `
                        <option value="">
                          No parent family available
                        </option>
                      `
                }
              </select>

              <span
                class="add-person-select-chevron"
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </div>

            <span class="field-help">
              ${
                    isSibling
                        ? 'The new sibling will be added to this existing parent family.'
                        : 'This determines which parent or partner family receives the child.'
                }
            </span>
          </div>
        </section>
      `;
}

const PARTNER_CHILDREN_ADD_PARENT = 'add-parent';
const PARTNER_CHILDREN_KEEP_SINGLE = 'keep-single-parent';

function normalizePartnerChildrenMode(value)
{
    return value === PARTNER_CHILDREN_KEEP_SINGLE
        ? PARTNER_CHILDREN_KEEP_SINGLE
        : PARTNER_CHILDREN_ADD_PARENT;
}

function singleParentFamilyWithChildrenForPerson(personId)
{
    return partnerFamiliesForPerson(personId).find(family =>
        !familyHasSecondPartner(family, personId)
          && unlinkFamilyChildrenIds(family).length > 0
    ) || null;
}

function partnerChildrenParentRole(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'male') return 'father';
    if (gender === 'female') return 'mother';

    return 'parent';
}

function partnerChildrenAddLabel(
    selectedPersonId = '',
    genderValue = ''
)
{
    const normalizedGender =
        String(genderValue || '').trim().toLowerCase();

    const role = selectedPersonId
        ? partnerChildrenParentRole(selectedPersonId)
        : normalizedGender === 'male'
            ? 'father'
            : normalizedGender === 'female'
                ? 'mother'
                : 'parent';

    if (role === 'father')
    {
        return 'Add new partner as the children\'s father';
    }

    if (role === 'mother')
    {
        return 'Add new partner as the children\'s mother';
    }

    return 'Add new partner as the children\'s parent';
}

function renderPartnerChildrenSelector({
    anchorPersonId,
    relationshipType,
    selectedPersonId = '',
    selectedValue = PARTNER_CHILDREN_ADD_PARENT,
    controlId = 'connectPersonPartnerChildrenMode'
} = {})
{
    const type = normalizeConnectRelationshipType(relationshipType);
    const singleParentFamily =
        singleParentFamilyWithChildrenForPerson(anchorPersonId);

    if (type !== 'partner' || !singleParentFamily)
    {
        return '';
    }

    const selectedMode =
        normalizePartnerChildrenMode(selectedValue);

    const addParentLabel =
        partnerChildrenAddLabel(selectedPersonId);

    return `<div class="connect-partner-children-selector" data-partner-children-selector>
        <div class="field">
          <label for="${escapeHtml(controlId)}">${escapeHtml(t('Existing children'))}</label>

          <div class="add-person-select-field">
            <select
              class="compact-select add-person-select"
              id="${escapeHtml(controlId)}"
              data-partner-children-mode>
              <option
                value="${PARTNER_CHILDREN_ADD_PARENT}"
                ${selectedMode === PARTNER_CHILDREN_ADD_PARENT ? 'selected' : ''}>
                ${escapeHtml(t(addParentLabel))}
              </option>

              <option
                value="${PARTNER_CHILDREN_KEEP_SINGLE}"
                ${selectedMode === PARTNER_CHILDREN_KEEP_SINGLE ? 'selected' : ''}>
                ${escapeHtml(t('Keep the children with the single parent only'))}
              </option>
            </select>

            <span class="add-person-select-chevron" aria-hidden="true">
              ${icon.chevron}
            </span>
          </div>

          <span class="field-help">
            ${escapeHtml(t('Choose whether the new partner becomes a parent of the existing children.'))}
          </span>
        </div>
      </div>`;
}

function connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType)
{
    const anchorId = String(anchorPersonId || '');
    const relativeId = String(relativePersonId || '');
    const type = normalizeConnectRelationshipType(relationshipType);

    if (type === 'parent')
    {
        return {
            type,
            parentId: relativeId,
            childId: anchorId
        };
    }

    if (type === 'child')
    {
        return {
            type,
            parentId: anchorId,
            childId: relativeId
        };
    }

    if (type === 'sibling')
    {
        return {
            type,
            anchorPersonId: anchorId,
            siblingPersonId: relativeId
        };
    }

    return {
        type,
        personAId: anchorId,
        personBId: relativeId
    };
}

function validateRelationshipConnection({
    anchorPersonId,
    relativePersonId,
    relationshipType,
    parentFamilySelection = ''
} = {})
{
    const pair = connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType);

    if (pair.type === 'parent' || pair.type === 'child')
    {
        const parentChildValidation = validateParentChildConnection(pair.parentId, pair.childId);
        if (!parentChildValidation.ok) return parentChildValidation;

        return pair.type === 'child'
            ? validateParentFamilySelection({
                anchorPersonId: pair.parentId,
                relationshipType: 'child',
                selection: parentFamilySelection
            })
            : parentChildValidation;
    }

    if (pair.type === 'sibling')
    {
        return validateSiblingConnection(
            pair.anchorPersonId,
            pair.siblingPersonId,
            parentFamilySelection
        );
    }

    return validatePartnerConnection(pair.personAId, pair.personBId);
}

function relationshipWarningForConnection({ anchorPersonId, relativePersonId, relationshipType } = {})
{
    const pair = connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType);

    if (pair.type === 'parent' || pair.type === 'child')
    {
        return parentWarningForConnection(pair.parentId, pair.childId);
    }

    return null;
}

function familyCanAcceptParent(family, parentId)
{
    if (!family) return false;
    if (familyIncludesPerson(family, parentId)) return true;

    const preferredSlot = parentSlotPreference(parentId);

    if (preferredSlot === 'mother' && !familyPartnerBId(family)) return true;
    if (preferredSlot === 'father' && !familyPartnerAId(family)) return true;

    return !familyPartnerAId(family) || !familyPartnerBId(family);
}

function assignParentToFamily(family, parentId)
{
    if (!family || !parentId) return false;
    if (familyIncludesPerson(family, parentId)) return true;

    const preferredSlot = parentSlotPreference(parentId);
    const roleHint = relationshipRoleHintForPerson(parentId);

    if (preferredSlot === 'mother' && !familyPartnerBId(family))
    {
        family.partnerBId = parentId;
        family.partner2Id = parentId;
        family.personBId = parentId;
        family.motherId = parentId;
        family.partnerBRoleHint = roleHint || 'WIFE';
        family.partner2RoleHint = family.partnerBRoleHint;
        family.personBRoleHint = family.partnerBRoleHint;
        return true;
    }

    if (preferredSlot === 'father' && !familyPartnerAId(family))
    {
        family.partnerAId = parentId;
        family.partner1Id = parentId;
        family.personAId = parentId;
        family.fatherId = parentId;
        family.partnerARoleHint = roleHint || 'HUSB';
        family.partner1RoleHint = family.partnerARoleHint;
        family.personARoleHint = family.partnerARoleHint;
        return true;
    }

    if (!familyPartnerAId(family))
    {
        family.partnerAId = parentId;
        family.partner1Id = parentId;
        family.personAId = parentId;
        family.fatherId = parentSlotPreference(parentId) === 'father' ? parentId : family.fatherId || '';
        family.partnerARoleHint = roleHint;
        family.partner1RoleHint = roleHint;
        family.personARoleHint = roleHint;
        return true;
    }

    if (!familyPartnerBId(family))
    {
        family.partnerBId = parentId;
        family.partner2Id = parentId;
        family.personBId = parentId;
        family.motherId = parentSlotPreference(parentId) === 'mother' ? parentId : family.motherId || '';
        family.partnerBRoleHint = roleHint;
        family.partner2RoleHint = roleHint;
        family.personBRoleHint = roleHint;
        return true;
    }

    return false;
}

function createParentChildFamily(parentId, childId)
{
    const parent = getPerson(parentId);
    const child = getPerson(childId);
    const projectId = child?.projectId || parent?.projectId || currentProjectId();

    const family = {
        id: uniqueFamilyId(`fam-${parentId}-${childId}-parent`),
        projectId,
        type: 'family',
        fatherId: '',
        motherId: '',
        partnerAId: '',
        partnerBId: '',
        partner1Id: '',
        partner2Id: '',
        personAId: '',
        personBId: '',
        partnerARoleHint: '',
        partnerBRoleHint: '',
        relationshipType: 'Unknown relationship',
        relationshipStatus: 'active',
        childIds: [childId],
        childrenIds: [childId],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: 'Just now',
        updatedAt: 'Just now'
    };

    assignParentToFamily(family, parentId);
    syncFamilyPartnerAliases(family);
    centralFamilyRecords().push(family);

    return family;
}

function findOrCreateSingleParentFamily(parentId)
{
    const existing = partnerFamiliesForPerson(parentId).find(family =>
        !familyHasSecondPartner(family, parentId)
    );

    if (existing)
    {
        syncFamilyPartnerAliases(existing);
        return existing;
    }

    const parent = getPerson(parentId);
    const family = {
        id: uniqueFamilyId(`fam-${parentId}-single-parent`),
        projectId: parent?.projectId || currentProjectId(),
        type: 'family',
        fatherId: '',
        motherId: '',
        partnerAId: '',
        partnerBId: '',
        partner1Id: '',
        partner2Id: '',
        personAId: '',
        personBId: '',
        partnerARoleHint: '',
        partnerBRoleHint: '',
        relationshipType: 'Unknown relationship',
        relationshipStatus: 'active',
        childIds: [],
        childrenIds: [],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: 'Just now',
        updatedAt: 'Just now'
    };

    assignParentToFamily(family, parentId);
    syncFamilyPartnerAliases(family);
    centralFamilyRecords().push(family);
    return family;
}

function addChildToFamily(family, parentId, childId)
{
    if (!family || !familyIncludesPerson(family, parentId))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: 'The selected person is not a parent in this family.'
        };
    }

    const existingChildren = unlinkFamilyChildrenIds(family);

    if (existingChildren.includes(childId))
    {
        return {
            ok: true,
            family,
            relationshipType: 'parentChild',
            warning: null,
            reused: true
        };
    }

    const validation = validateParentChildConnection(parentId, childId);
    if (!validation.ok) return validation;

    unlinkSetFamilyChildren(family, [...existingChildren, childId]);
    syncFamilyPartnerAliases(family);
    family.updatedAt = 'Just now';

    return {
        ok: true,
        family,
        relationshipType: 'parentChild',
        warning: parentWarningForConnection(parentId, childId)
    };
}

function connectChildToParentFamily(parentId, childId, selection)
{
    const familySelection = String(selection || '');
    const selectionValidation = validateParentFamilySelection({
        anchorPersonId: parentId,
        relationshipType: 'child',
        selection: familySelection
    });

    if (!selectionValidation.ok) return selectionValidation;

    const family = familySelection === SINGLE_PARENT_FAMILY_CHOICE
        ? findOrCreateSingleParentFamily(parentId)
        : centralFamilyRecords().find(candidate => candidate.id === familySelection);

    return addChildToFamily(family, parentId, childId);
}

function validateSiblingConnection(anchorPersonId, siblingPersonId, familyId)
{
    if (!anchorPersonId || !siblingPersonId || anchorPersonId === siblingPersonId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected as their own sibling.'
        };
    }

    const selectionValidation = validateParentFamilySelection({
        anchorPersonId,
        relationshipType: 'sibling',
        selection: familyId
    });

    if (!selectionValidation.ok) return selectionValidation;

    const family = centralFamilyRecords().find(candidate => candidate.id === familyId);
    if (!family || !unlinkFamilyChildrenIds(family).includes(anchorPersonId))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: 'The selected parent family does not contain the reference person.'
        };
    }

    if (unlinkFamilyChildrenIds(family).includes(siblingPersonId))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: `${personDisplayName(anchorPersonId)} and ${personDisplayName(siblingPersonId)} are already siblings in this family.`
        };
    }

    if (
        collectAncestorIds(anchorPersonId).has(siblingPersonId)
        || collectDescendantIds(anchorPersonId).has(siblingPersonId)
    )
    {
        return {
            ok: false,
            title: 'Relationship loop',
            message: 'An ancestor or descendant cannot also be added as a sibling.'
        };
    }

    for (const parentId of [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean))
    {
        const validation = validateParentChildConnection(parentId, siblingPersonId);
        if (!validation.ok) return validation;
    }

    return { ok: true, family };
}

function connectSiblingsThroughFamily(anchorPersonId, siblingPersonId, familyId)
{
    const validation = validateSiblingConnection(
        anchorPersonId,
        siblingPersonId,
        familyId
    );

    if (!validation.ok) return validation;

    const family = validation.family;
    unlinkSetFamilyChildren(family, [
        ...unlinkFamilyChildrenIds(family),
        siblingPersonId
    ]);
    syncFamilyPartnerAliases(family);
    family.updatedAt = 'Just now';

    return {
        ok: true,
        family,
        relationshipType: 'sibling',
        warning: null
    };
}

function connectParentToChild(parentId, childId)
{
    const validation = validateParentChildConnection(parentId, childId);

    if (!validation.ok)
    {
        return validation;
    }

    const warning = parentWarningForConnection(parentId, childId);

    let family = centralFamilyRecords().find(candidate =>
        (candidate.childIds || candidate.childrenIds || []).includes(childId)
          && familyCanAcceptParent(candidate, parentId)
    );

    if (!family)
    {
        family = createParentChildFamily(parentId, childId);
    }
    else
    {
        family.childIds = [...new Set([...(family.childIds || []), childId])];
        family.childrenIds = [...family.childIds];
        assignParentToFamily(family, parentId);
        syncFamilyPartnerAliases(family);
        family.updatedAt = 'Just now';
    }

    return {
        ok: true,
        family,
        relationshipType: 'parentChild',
        warning
    };
}

function getPartnerRelationshipBetween(personAId, personBId)
{
    return centralFamilyRecords().find(family =>
    {
        const a = familyPartnerAId(family);
        const b = familyPartnerBId(family);

        return (a === personAId && b === personBId) || (a === personBId && b === personAId);
    }) || null;
}

function connectPartners(personAId, personBId, options = {})
{
    const validation =
        validatePartnerConnection(personAId, personBId);

    if (!validation.ok)
    {
        return validation;
    }

    const personA = getPerson(personAId);
    const personB = getPerson(personBId);

    const existingChildrenFamilyId =
        String(options.existingChildrenFamilyId || '');

    const existingChildrenFamily = existingChildrenFamilyId
        ? centralFamilyRecords().find(family =>
            family.id === existingChildrenFamilyId
              && familyIncludesPerson(family, personAId)
              && !familyHasSecondPartner(family, personAId)
              && unlinkFamilyChildrenIds(family).length > 0
        )
        : null;

    if (existingChildrenFamily)
    {
        const assigned =
            assignParentToFamily(existingChildrenFamily, personBId);

        if (!assigned)
        {
            return {
                ok: false,
                title: 'Family cannot accept another parent',
                message: 'The selected family already has two recorded parents.'
            };
        }

        existingChildrenFamily.relationshipType = 'Partner';
        existingChildrenFamily.relationshipStatus = 'active';
        existingChildrenFamily.updatedAt = 'Just now';

        syncFamilyPartnerAliases(existingChildrenFamily);

        return {
            ok: true,
            family: existingChildrenFamily,
            relationshipType: 'partner',
            warning: null,
            reused: true,
            inheritedChildren: true
        };
    }

    const id =
        uniqueFamilyId(
            relationshipIdForPartners(personAId, personBId)
        );

    const family = {
        id,
        projectId:
          personA.projectId
          || personB.projectId
          || currentProjectId(),
        type: 'family',
        gedcomXref:
          `@F${id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`,
        partnerAId: personAId,
        partnerBId: personBId,
        partner1Id: personAId,
        partner2Id: personBId,
        personAId,
        personBId,
        fatherId: '',
        motherId: '',
        partnerARoleHint:
          relationshipRoleHintForPerson(personAId),
        partnerBRoleHint:
          relationshipRoleHintForPerson(personBId),
        relationshipType: 'Partner',
        relationshipStatus: 'active',
        childIds: [],
        childrenIds: [],
        events: [],
        nonEvents: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: 'Just now',
        updatedAt: 'Just now'
    };

    syncFamilyPartnerAliases(family);
    centralFamilyRecords().push(family);

    return {
        ok: true,
        family,
        relationshipType: 'partner',
        warning: null
    };
}

function connectPeopleByRelationship({
    anchorPersonId,
    relativePersonId,
    relationshipType,
    parentFamilySelection = '',
    partnerChildrenMode = PARTNER_CHILDREN_ADD_PARENT
} = {})
{
    const anchorId = String(anchorPersonId || '');
    const relativeId = String(relativePersonId || '');
    const type =
        normalizeConnectRelationshipType(relationshipType);

    const normalizedPartnerChildrenMode =
        normalizePartnerChildrenMode(partnerChildrenMode);

    const validation = validateRelationshipConnection({
        anchorPersonId: anchorId,
        relativePersonId: relativeId,
        relationshipType: type,
        parentFamilySelection
    });

    if (!validation.ok)
    {
        return validation;
    }

    let result;

    if (type === 'parent')
    {
        result = connectParentToChild(relativeId, anchorId);
    }
    else if (type === 'child')
    {
        result = connectChildToParentFamily(
            anchorId,
            relativeId,
            parentFamilySelection
        );
    }
    else if (type === 'sibling')
    {
        result = connectSiblingsThroughFamily(
            anchorId,
            relativeId,
            parentFamilySelection
        );
    }
    else
    {
        const existingChildrenFamily =
            normalizedPartnerChildrenMode ===
            PARTNER_CHILDREN_ADD_PARENT
                ? singleParentFamilyWithChildrenForPerson(anchorId)
                : null;

        result = connectPartners(
            anchorId,
            relativeId,
            {
                existingChildrenFamilyId:
              existingChildrenFamily?.id || ''
            }
        );
    }

    if (!result.ok) return result;

    syncFamilyReciprocalLinks();
    rebuildSampleEventsAndPruneSourceLinks();

    return {
        ...result,
        anchorPersonId: anchorId,
        relativePersonId: relativeId,
        connectType: type,
        partnerChildrenMode:
          type === 'partner'
              ? normalizedPartnerChildrenMode
              : ''
    };
}

function addPersonConnectionTypeFromRelativeType(relativeType)
{
    const value = String(relativeType || '').toLowerCase();

    if (['father', 'mother', 'parent'].includes(value)) return 'parent';
    if (['son', 'daughter', 'child'].includes(value)) return 'child';
    if (['brother', 'sister', 'sibling'].includes(value)) return 'sibling';
    if (['partner', 'spouse'].includes(value)) return 'partner';

    return '';
}

function addPersonCreateConnectionIntent(options = {})
{
    const relationshipType = addPersonConnectionTypeFromRelativeType(
        options.connectRelationshipType || options.relativeType
    );

    const anchorPersonId = String(
        options.connectToPersonId
          || options.anchorPersonId
          || options.personId
          || ''
    );

    return {
        shouldConnect: Boolean(options.mode !== 'edit' && relationshipType && anchorPersonId),
        anchorPersonId,
        relationshipType
    };
}

function addPersonPartnerChildrenMode(options = {})
{
    const liveValue =
        modalBackdrop
            ?.querySelector('#addPersonPartnerChildrenMode')
            ?.value;

    return normalizePartnerChildrenMode(
        liveValue || options.partnerChildrenMode
    );
}

function addPersonParentFamilySelection(options = {})
{
    const intent = addPersonCreateConnectionIntent(options);
    if (!['child', 'sibling'].includes(intent.relationshipType)) return '';

    return modalBackdrop
        ?.querySelector('#addPersonParentFamily')
        ?.value
        || defaultParentFamilySelection(
            intent.anchorPersonId,
            intent.relationshipType,
            options.parentFamilyId
            || options.parentFamilySelection
            || ''
        );
}

function addPersonConnectionToastLabel(relationshipType)
{
    const map = {
        parent: 'parent',
        child: 'child',
        sibling: 'sibling',
        partner: 'partner'
    };

    return map[relationshipType] || 'relative';
}

function applyPartnerDetailsToCreatedConnection(connectionResult, relationshipValues)
{
    if (!connectionResult?.ok || connectionResult.connectType !== 'partner') return;
    if (!connectionResult.family) return;

    const values = relationshipValues?.relationships?.[0];
    if (!values) return;

    upsertPartnerRelationshipEvents(connectionResult.family, values);

    if (typeof syncFamilyPartnerAliases === 'function')
    {
        syncFamilyPartnerAliases(connectionResult.family);
    }

    syncFamilyReciprocalLinks();
    rebuildSampleEventsAndPruneSourceLinks();
}

function addPersonDateFieldHasTypedValue(fieldId)
{
    const root = modalBackdrop?.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
    if (!root) return false;

    return Boolean(
        root.querySelector('[data-genealogy-date-input]')?.value.trim()
          || root.querySelector('[data-genealogy-date-input-to]')?.value.trim()
    );
}

function addPersonPlaceFieldHasTypedValue(selector)
{
    const value = modalBackdrop?.querySelector(selector)?.value || '';
    return hasTextValue(value);
}

function addPersonFactsHaveIdentifyingValue(facts = {})
{
    if (!facts || facts.invalid) return false;

    const burialPlaceText = facts.burialPlace?.text || '';
    const education = facts.education || {};
    const educationPlaceText = education.place?.text || '';
    const work = facts.work || {};
    const baptism = facts.baptism || {};
    const baptismPlaceText = baptism.place?.text || '';
    const customFact = facts.customFact || {};
    const customFactPlaceText = customFact.place?.text || '';

    return Boolean(
        hasTextValue(facts.alternativeNames)
          || hasTextValue(burialPlaceText)
          || hasTextValue(education.institutionName)
          || hasTextValue(education.value)
          || hasTextValue(educationPlaceText)
          || hasTextValue(education.notes)
          || hasGenealogyDateValue(education.fromDate, 'Year only')
          || hasGenealogyDateValue(education.toDate, 'Year only')
          || hasTextValue(work.company)
          || hasTextValue(work.occupation)
          || hasTextValue(work.notes)
          || hasGenealogyDateValue(work.fromDate, 'Year only')
          || hasGenealogyDateValue(work.toDate, 'Year only')
          || hasTextValue(baptismPlaceText)
          || hasGenealogyDateValue(baptism.date, 'Exact date')
          || hasTextValue(customFact.value)
          || hasTextValue(customFact.notes)
          || hasTextValue(customFactPlaceText)
          || hasGenealogyDateValue(
              customFact.date,
              'Exact date'
          )
    );
}

function addPersonHasCoreIdentifyingValue()
{
    const livingStatus = normalizeLivingStatus(readAddPersonModalValue('#addPersonLivingStatus'));

    return Boolean(
        readAddPersonModalValue('#addPersonFirstName')
          || readAddPersonModalValue('#addPersonLastName')
          || readAddPersonModalValue('#addPersonMiddleName')
          || readAddPersonModalValue('#addPersonMaidenName')
          || addPersonDateFieldHasTypedValue('addPersonBirth')
          || addPersonPlaceFieldHasTypedValue('#addPersonBirthPlace')
          || (
              livingStatus === 'Deceased'
              && (
                  addPersonDateFieldHasTypedValue('addPersonDeath')
                  || addPersonPlaceFieldHasTypedValue('#addPersonDeathPlace')
              )
          )
    );
}

function focusAddPersonFirstIdentifyingField()
{
    const target = modalBackdrop?.querySelector('#addPersonFirstName')
        || modalBackdrop?.querySelector('#addPersonLastName')
        || modalBackdrop?.querySelector('#addPersonBirthDate');

    target?.focus({ preventScroll: true });
}

function validateAddPersonCreateIdentity(options = {}, additionalFacts = {})
{
    const connectionIntent = addPersonCreateConnectionIntent(options);

    if (
        connectionIntent.shouldConnect
          || addPersonHasCoreIdentifyingValue()
          || addPersonFactsHaveIdentifyingValue(additionalFacts)
    )
    {
        return { ok: true };
    }

    return {
        ok: false,
        message: 'Add a name or at least one identifying fact before creating a person.'
    };
}

function applyAddPersonAttachmentDrafts(personId)
{
    const person =
        getPerson(personId);

    if (!person) return;

    setPersonPhotoIds(
        person.id,
        readAddPersonPhotoIds(),
        {
            rerender: false
        }
    );

    const fileWrites =
        readAddPersonFileIds().map(fileId => ({
            ownerType: 'file',
            ownerId: fileId,
            entityType: 'person',
            entityId: person.id,
            shouldLink: true
        }));

    if (fileWrites.length)
    {
        archiveSetConnectionsAtomically(
            fileWrites
        );
    }

    readAddPersonNoteIds().forEach(noteId =>
    {
        const note =
            getNote(noteId, {
                projectId:
              person.projectId,
                includeArchived:
              true
            });

        if (!note) return;

        setNoteEntityLinks(
            note.id,
            'person',
            [
                ...new Set([
                    ...(note.linkedPersonIds || []),
                    person.id
                ])
            ],
            {
                projectId:
              note.projectId
            }
        );
    });
}

function commitAddPersonModalCreate(title, subtitle, options = {})
{
    const createAnother = modalBackdrop.querySelector('#addPersonCreateAnother')?.checked;
    const additionalFacts = collectAddPersonAdditionalFacts('');

    if (additionalFacts.invalid)
    {
        showToast(additionalFacts.message || 'Check the additional facts before creating.');
        return null;
    }

    const identityValidation = validateAddPersonCreateIdentity(options, additionalFacts);

    if (!identityValidation.ok)
    {
        showToast(identityValidation.message);
        focusAddPersonFirstIdentifyingField();
        return null;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();

    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before creating.');
        return null;
    }

    const connectionIntent = addPersonCreateConnectionIntent(options);
    const parentFamilySelection = addPersonParentFamilySelection(options);
    const familySelectionValidation = validateParentFamilySelection({
        anchorPersonId: connectionIntent.anchorPersonId,
        relationshipType: connectionIntent.relationshipType,
        selection: parentFamilySelection
    });

    if (!familySelectionValidation.ok)
    {
        showToast(familySelectionValidation.message);
        modalBackdrop.querySelector('#addPersonParentFamily')?.focus({
            preventScroll: true
        });
        return null;
    }

    const projectPeopleBeforeCreate = getPeople(currentProjectId()).length;
    const newPerson = createPersonFromAddPersonModal(options, additionalFacts);
    if (!newPerson) return null;
    applyAddPersonAttachmentDrafts(
        newPerson.id
    );
    let connectionResult = null;

    if (connectionIntent.shouldConnect)
    {
        connectionResult = connectPeopleByRelationship({
            anchorPersonId: connectionIntent.anchorPersonId,
            relativePersonId: newPerson.id,
            relationshipType: connectionIntent.relationshipType,
            parentFamilySelection,
            partnerChildrenMode:
            addPersonPartnerChildrenMode(options)
        });

        if (connectionResult.ok)
        {
            applyPartnerDetailsToCreatedConnection(connectionResult, relationshipValues);
        }
    }

    rebuildSampleEventsAndPruneSourceLinks();

    if (projectPeopleBeforeCreate === 0)
    {
        const project = validProjectById(newPerson.projectId);
        if (project)
        {
            project.defaultPersonId = newPerson.id;
            touchProjectModified(project);
        }
        const treeView = treeProjectViewState(newPerson.projectId);
        treeView.focusPersonId = newPerson.id;
        treeView.recentPersonIds = [newPerson.id];
        treeView.navigationBackStack = [];
        treeView.navigationForwardStack = [];
        state.treeCenterTargetId = newPerson.id;
    }

    clearPeopleSelection();

    const selectedAfterCreateId =
        connectionIntent.shouldConnect
        && getPerson(
            connectionIntent.anchorPersonId
        )
            ? connectionIntent.anchorPersonId
            : newPerson.id;

    state.selectedPersonId = selectedAfterCreateId;

    state.selectedPeopleId = selectedAfterCreateId;

    closeModal();

    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }

    if (connectionIntent.shouldConnect)
    {
        if (connectionResult?.ok)
        {
            showToast(`Person created and connected as ${addPersonConnectionToastLabel(connectionIntent.relationshipType)}.`);
        }
        else
        {
            showToast(connectionResult?.message || 'Person created, but could not connect the relationship.');
        }
    }
    else
    {
        showToast('Person created.');
    }

    if (createAnother)
    {
        requestAnimationFrame(() =>
        {
            if (connectionIntent.shouldConnect)
            {
                openAddPersonModal(title, subtitle, {
                    ...options,
                    personId: connectionIntent.anchorPersonId,
                    connectToPersonId: connectionIntent.anchorPersonId,
                    connectAfterCreate: true,
                    connectRelationshipType: connectionIntent.relationshipType,
                    parentFamilySelection
                });
            }
            else
            {
                openAddPersonModal('Add person', 'Create a new person in this project');
            }
        });
    }

    return {
        ok: true,
        person: newPerson,
        connectionResult
    };
}

function normalizeAddPersonMatchText(value)
{
    return cleanEditFieldValue(value)
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function addPersonMatchTextVariants(value)
{
    const source = value == null ? '' : String(value);

    return [...new Set([
        source,
        localizedDataFieldValue(source)
    ]
        .map(normalizeAddPersonMatchText)
        .filter(Boolean))];
}

function addPersonMatchValues(...values)
{
    return [...new Set(values.flatMap(addPersonMatchTextVariants))];
}

function addPersonDraftDateValue(selector)
{
    return normalizeAddPersonMatchText(modalBackdrop?.querySelector(selector)?.value || '');
}

function addPersonDraftPlaceValue(selector)
{
    return normalizeAddPersonMatchText(modalBackdrop?.querySelector(selector)?.value || '');
}

function addPersonPersonDateValues(event)
{
    return addPersonMatchValues(
        event?.date,
        event?.dateLabel,
        event?.originalText,
        event?.sortDate
    );
}

function addPersonPersonPlaceValues(event)
{
    return addPersonMatchValues(
        getPlaceEventDisplay(event),
        getPlaceDisplay(event?.placeId),
        event?.placeText
    );
}

function collectAddPersonDraftForMatching()
{
    const firstName = normalizeAddPersonMatchText(readAddPersonModalValue('#addPersonFirstName'));
    const middleName = normalizeAddPersonMatchText(readAddPersonModalValue('#addPersonMiddleName'));
    const lastName = normalizeAddPersonMatchText(readAddPersonModalValue('#addPersonLastName'));
    const maidenName = normalizeAddPersonMatchText(readAddPersonModalValue('#addPersonMaidenName'));
    const birthDate = addPersonDraftDateValue('#addPersonBirthDate');
    const deathDate = addPersonDraftDateValue('#addPersonDeathDate');
    const birthPlace = addPersonDraftPlaceValue('#addPersonBirthPlace');
    const deathPlace = addPersonDraftPlaceValue('#addPersonDeathPlace');

    return {
        firstName,
        middleName,
        lastName,
        maidenName,
        birthDate,
        deathDate,
        birthPlace,
        deathPlace,
        hasSignal: Boolean(
            firstName
            || middleName
            || lastName
            || maidenName
            || birthDate
            || deathDate
            || birthPlace
            || deathPlace
        )
    };
}

function addPersonNameValuesForPerson(person)
{
    return [
        person?.names?.prefix,
        person?.names?.first,
        person?.names?.middle,
        person?.names?.last,
        person?.names?.suffix,
        person?.names?.maiden,
        person?.names?.display,
        person?.name
    ]

        .map(normalizeAddPersonMatchText)
        .filter(Boolean);
}

function scoreAddPersonPossibleMatch(person, draft, options = {})
{
    let score = 0;
    const names = person?.names || {};
    const personFirst = addPersonMatchTextVariants(names.first);
    const personMiddle = addPersonMatchTextVariants(names.middle);
    const personLast = addPersonMatchTextVariants(names.last);
    const personMaiden = addPersonMatchTextVariants(names.maiden);
    const personDisplay = addPersonMatchTextVariants(names.display || person?.name);
    const birthDates = addPersonPersonDateValues(person?.birth);
    const deathDates = addPersonPersonDateValues(person?.death);
    const birthPlaces = addPersonPersonPlaceValues(person?.birth);
    const deathPlaces = addPersonPersonPlaceValues(person?.death);

    if (draft.firstName && personFirst.includes(draft.firstName)) score += 34;
    else if (draft.firstName && personFirst.some(value => value.startsWith(draft.firstName))) score += 18;
    else if (draft.firstName && personDisplay.some(value => value.includes(draft.firstName))) score += 12;

    if (draft.middleName && personMiddle.includes(draft.middleName)) score += 10;

    if (draft.lastName && personLast.includes(draft.lastName)) score += 32;
    else if (draft.lastName && personDisplay.some(value => value.includes(draft.lastName))) score += 16;

    if (draft.maidenName && (personMaiden.includes(draft.maidenName) || personLast.includes(draft.maidenName))) score += 22;

    if (draft.birthDate && birthDates.includes(draft.birthDate)) score += 34;
    else if (draft.birthDate && birthDates.some(value => value.includes(draft.birthDate) || draft.birthDate.includes(value))) score += 24;

    if (draft.deathDate && deathDates.includes(draft.deathDate)) score += 26;
    else if (draft.deathDate && deathDates.some(value => value.includes(draft.deathDate) || draft.deathDate.includes(value))) score += 24;

    if (draft.birthPlace && birthPlaces.some(value => value === draft.birthPlace)) score += 24;
    else if (draft.birthPlace && birthPlaces.some(value => value.includes(draft.birthPlace) || draft.birthPlace.includes(value))) score += 24;

    if (draft.deathPlace && deathPlaces.some(value => value === draft.deathPlace)) score += 24;
    else if (draft.deathPlace && deathPlaces.some(value => value.includes(draft.deathPlace) || draft.deathPlace.includes(value))) score += 24;

    const anchor = getPerson(options.connectToPersonId || options.personId || '');
    if (anchor)
    {
        const anchorLast = addPersonMatchTextVariants(anchor.names?.last);
        if (anchorLast.some(value => personLast.includes(value))) score += 8;
    }

    return score;
}

let addPersonPossibleMatchState = {
    selectedPersonId: ''
};

function findAddPersonPossibleMatches(options = {}, editPerson = null)
{
    const draft = collectAddPersonDraftForMatching();
    if (!draft.hasSignal) return [];

    const currentPersonId = editPerson?.id || '';

    return getPeople(currentProjectId())
        .filter(person => person?.id && person.id !== currentPersonId)
        .filter(person => !person.deleted)
        .map(person => ({
            person,
            score: scoreAddPersonPossibleMatch(person, draft, options)
        }))
        .filter(item => item.score >= 24)
        .sort((a, b) => b.score - a.score || connectPersonName(a.person).localeCompare(connectPersonName(b.person)))
        .slice(0, 2);
}

function addPersonPossibleMatchMeta(person)
{
    const life =
        connectPersonLifeLine(
            person
        );

    const place =
        getPlaceEventDisplay(
            person?.birth
        )
        || getPlaceEventDisplay(
            person?.death
        )
        || '';

    return [
        life,
        place
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>');
}

function renderAddPersonPossibleMatchRow(
    item,
    {
        context = 'family-tree',
        selectedPersonId =
            addPersonPossibleMatchState
                .selectedPersonId
    } = {}
)
{
    const person = item.person;
    const selected =
        person.id === selectedPersonId;

    const selectionAttribute =
        context === 'geneograph'
            ? 'data-geneo-person-possible-match'
            : 'data-add-person-possible-match';

    return `<button
        class="match-row is-possible-duplicate ${selected ? 'is-selected' : ''}"
        type="button"
        ${selectionAttribute}="${escapeHtml(person.id)}"
        aria-pressed="${selected ? 'true' : 'false'}">
        ${renderPersonAvatar(person, 'small-avatar')}
        <div>
          <strong>${escapeHtml(connectPersonName(person))}</strong><br>
          ${addPersonPossibleMatchMeta(person)}
        </div>
      </button>`;
}

function addPersonPossibleMatchActionLabel(options = {})
{
    const connectionIntent = addPersonCreateConnectionIntent(options);
    return connectionIntent.shouldConnect ? 'Connect selected' : 'Open selected';
}

function renderAddPersonPossibleMatchesCard(options = {}, editPerson = null)
{
    const matches = findAddPersonPossibleMatches(options, editPerson);
    const draft = collectAddPersonDraftForMatching();
    const selectedPerson = getPerson(addPersonPossibleMatchState.selectedPersonId);
    const actionLabel = addPersonPossibleMatchActionLabel(options);

    if (!draft.hasSignal)
    {
        return `<div class="modal-side-card" data-add-person-possible-matches>
          <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
          <div class="add-person-match-empty">Enter a name, date, or place to check for existing people.</div>
        </div>`;
    }

    if (!matches.length)
    {
        return `<div class="modal-side-card" data-add-person-possible-matches>
          <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
          <div class="add-person-match-empty">No strong matches found in this project.</div>
        </div>`;
    }

    const selectedStillVisible = matches.some(item => item.person.id === addPersonPossibleMatchState.selectedPersonId);

    if (addPersonPossibleMatchState.selectedPersonId && !selectedStillVisible)
    {
        addPersonPossibleMatchState.selectedPersonId = '';
    }

    return `<div class="modal-side-card" data-add-person-possible-matches>
        <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
        <div class="add-person-match-list">
          ${matches.map(renderAddPersonPossibleMatchRow).join('')}
        </div>
        <button
          class="button secondary add-person-match-action"
          type="button"
          data-add-person-match-action
          ${selectedPerson && selectedStillVisible ? '' : 'disabled'}>
          ${icon.link}
          <span>${escapeHtml(actionLabel)}</span>
        </button>
      </div>`;
}

let addPersonAttachmentDraftState = {
    photoIds: [],
    fileIds: [],
    noteIds: []
};

function initializeAddPersonAttachmentDraft(editPerson = null)
{
    addPersonAttachmentDraftState = {
        photoIds:
          editPerson
              ? getPhotosForPerson(editPerson.id)
                  .map(photo => photo.id)
              : [],

        fileIds:
          editPerson
              ? getArchiveFilesForPerson(editPerson.id)
                  .map(file => file.id)
              : [],

        noteIds:
          editPerson
              ? getNotesForPerson(editPerson.id)
                  .map(note => note.id)
              : []
    };
}

function readAddPersonPhotoIds()
{
    return [
        ...addPersonAttachmentDraftState.photoIds
    ];
}

function readAddPersonFileIds()
{
    return [
        ...addPersonAttachmentDraftState.fileIds
    ];
}

function readAddPersonNoteIds()
{
    return [
        ...addPersonAttachmentDraftState.noteIds
    ];
}

function refreshAddPersonAttachmentCounts()
{
    const counts = {
        photo:
          addPersonAttachmentDraftState.photoIds.length,

        file:
          addPersonAttachmentDraftState.fileIds.length,

        note:
          addPersonAttachmentDraftState.noteIds.length
    };

    Object.entries(counts).forEach(
        ([type, count]) =>
        {
            const element =
                modalBackdrop.querySelector(
                    `[data-add-person-attachment-count="${type}"]`
                );

            if (element)
            {
                element.textContent =
                    `${count} selected`;
            }
        }
    );
}

function setAddPersonPhotoDraftIds(photoIds)
{
    addPersonAttachmentDraftState.photoIds = [
        ...new Set(photoIds || [])
    ].filter(id => Boolean(getPhoto(id)));

    refreshAddPersonAttachmentCounts();
}

function setAddPersonFileDraftIds(fileIds)
{
    addPersonAttachmentDraftState.fileIds = [
        ...new Set(fileIds || [])
    ].filter(id =>
        Boolean(archiveFileById(id))
    );

    refreshAddPersonAttachmentCounts();
}

function setAddPersonNoteDraftIds(noteIds)
{
    addPersonAttachmentDraftState.noteIds = [
        ...new Set(noteIds || [])
    ].filter(id =>
        Boolean(
            getNote(id, {
                includeArchived: true
            })
        )
    );

    refreshAddPersonAttachmentCounts();
}

function renderAddPersonAttachmentSideCard()
{
    const row = ({
        type,
        title,
        iconHtml,
        extraClass = '',
        attribute
    }) =>
    {
        const count =
            addPersonAttachmentDraftState[
                `${type}Ids`
            ]?.length || 0;

        return `<button
          class="attach-row"
          type="button"
          ${attribute}>
          <div
            class="attach-icon ${escapeHtml(extraClass)}"
            aria-hidden="true">
            ${iconHtml}
          </div>

          <div>
            <strong>${escapeHtml(title)}</strong><br>

            <span
              data-add-person-attachment-count="${escapeHtml(type)}">
              ${count} selected
            </span>
          </div>
        </button>`;
    };

    return `<div class="modal-side-card">
        <h3>Attach to this person</h3>

        ${row({
            type: 'photo',
            title: 'Add photos',
            iconHtml: icon.image,
            extraClass: 'photo',
            attribute: 'data-add-person-photos'
        })}

        ${row({
            type: 'file',
            title: 'Add file',
            iconHtml: icon.file,
            extraClass: 'file',
            attribute: 'data-add-person-files'
        })}

        ${row({
            type: 'note',
            title: 'Add note',
            iconHtml: icon.note,
            extraClass: 'note',
            attribute: 'data-add-person-note'
        })}
      </div>`;
}

function refreshAddPersonPossibleMatchesCard(options = {}, editPerson = null)
{
    const container = modalBackdrop?.querySelector('[data-add-person-possible-matches]');
    if (!container) return;

    const previousSelection = addPersonPossibleMatchState.selectedPersonId;

    container.outerHTML = renderAddPersonPossibleMatchesCard(options, editPerson);

    const stillExists = modalBackdrop?.querySelector(
        `[data-add-person-possible-match="${CSS.escape(previousSelection)}"]`
    );

    if (previousSelection && !stillExists)
    {
        addPersonPossibleMatchState.selectedPersonId = '';
        const refreshed = modalBackdrop?.querySelector('[data-add-person-possible-matches]');
        if (refreshed) refreshed.outerHTML = renderAddPersonPossibleMatchesCard(options, editPerson);
    }

    bindAddPersonPossibleMatchRows(options, editPerson);
}

function openAddPersonPossibleMatch(personId)
{
    const person = getPerson(personId);
    if (!person) return;

    closeModal();

    state.selectedPersonId = person.id;
    state.selectedPeopleId = person.id;
    state.treeInspectorCollapsed = false;

    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }

    showToast(`Opened possible match: ${connectPersonName(person)}.`);
}

function bindAddPersonPossibleMatchRows(options = {}, editPerson = null)
{
    modalBackdrop?.querySelectorAll('[data-add-person-possible-match]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            selectAddPersonPossibleMatch(button.dataset.addPersonPossibleMatch || '', options, editPerson);
        });
    });

    modalBackdrop?.querySelector('[data-add-person-match-action]')?.addEventListener('click', () =>
    {
        commitAddPersonPossibleMatchAction(options);
    });
}

function bindAddPersonSideCards(options = {}, editPerson = null)
{
    const projectId =
        editPerson?.projectId
        || currentProjectId();

    const subjectLabel =
        editPerson?.names?.display
        || 'New person';

    modalBackdrop
        ?.querySelector('[data-add-person-photos]')
        ?.addEventListener('click', () =>
        {
            openAddPhotosForPersonDraftModal({
                projectId,
                subjectLabel,
                existingPhotoIds:
              readAddPersonPhotoIds(),

                onSave:
              setAddPersonPhotoDraftIds
            });
        });

    modalBackdrop
        ?.querySelector('[data-add-person-files]')
        ?.addEventListener('click', () =>
        {
            openConnectedFilesModal({
                projectId,

                title:
              `Add files to ${subjectLabel}`,

                subtitle:
              'Connect existing Archive files or add new files.',

                existingFileIds:
              readAddPersonFileIds(),

                modalOpener:
              openNestedModal,

                onSave:
              fileIds =>
              {
                  setAddPersonFileDraftIds([
                      ...readAddPersonFileIds(),
                      ...fileIds
                  ]);

                  return {
                      ok: true,
                      addedLinkCount:
                    fileIds.length
                  };
              },

                afterSave:
              refreshAddPersonAttachmentCounts,

                successMessage:
              null
            });
        });

    modalBackdrop
        ?.querySelector('[data-add-person-note]')
        ?.addEventListener('click', () =>
        {
            openNoteLinkPickerModal({
                projectId,

                title:
              'Add note',

                description:
              `Link existing notes to “${subjectLabel}”.`,

                existingNoteIds:
              readAddPersonNoteIds(),

                includeArchived:
              false,

                existingStatus:
              'Already selected',

                existingMetaLabel:
              'already selected',

                createLabel:
              'Create note',

                modalOpener:
              openNestedModal,

                onCreate:
              () =>
              {
                  const note =
                      createCentralNote({
                          projectId,
                          activate: false,
                          renderAfterCreate: false,
                          focusTitleAfterCreate: false,
                          showCreatedToast: false,
                          inheritActiveContext: false,
                          inheritActiveCollection: false
                      });

                  if (!note) return;

                  setAddPersonNoteDraftIds([
                      ...readAddPersonNoteIds(),
                      note.id
                  ]);

                  showToast(
                      'Note created and selected.'
                  );
              },

                onSave:
              noteIds =>
              {
                  setAddPersonNoteDraftIds([
                      ...readAddPersonNoteIds(),
                      ...noteIds
                  ]);

                  return {
                      addedLinkCount:
                    noteIds.length
                  };
              },

                afterSave:
              refreshAddPersonAttachmentCounts,

                successMessage:
              null
            });
        });

    bindAddPersonPossibleMatchRows(options, editPerson);

    const refresh = () =>
    {
        addPersonPossibleMatchState.selectedPersonId = '';
        refreshAddPersonPossibleMatchesCard(options, editPerson);
    };
    const selectors = [
        '#addPersonFirstName',
        '#addPersonMiddleName',
        '#addPersonLastName',
        '#addPersonMaidenName',
        '#addPersonBirthDate',
        '#addPersonDeathDate',
        '#addPersonBirthPlace',
        '#addPersonDeathPlace'
    ];

    selectors.forEach(selector =>
    {
        const input = modalBackdrop?.querySelector(selector);
        if (!input) return;
        input.addEventListener('input', refresh);
        input.addEventListener('change', refresh);
    });
}

function unlinkStoredFamilies()
{
    if (!Array.isArray(sampleData.families)) sampleData.families = [];
    return sampleData.families;
}

function unlinkPersonName(personOrId)
{
    const person = typeof personOrId === 'string' ? getPerson(personOrId) : personOrId;
    return person?.names?.display || person?.name || 'Unknown person';
}

function unlinkFamilyPartnerAId(family)
{
    return familyPartnerAId(family) || family?.fatherId || family?.husbandId || '';
}

function unlinkFamilyPartnerBId(family)
{
    return familyPartnerBId(family) || family?.motherId || family?.wifeId || '';
}

function unlinkFamilyIncludesPerson(family, personId)
{
    return Boolean(personId && (
        unlinkFamilyPartnerAId(family) === personId
          || unlinkFamilyPartnerBId(family) === personId
    ));
}

function unlinkFamilyPartnerId(family, personId)
{
    if (unlinkFamilyPartnerAId(family) === personId) return unlinkFamilyPartnerBId(family);
    if (unlinkFamilyPartnerBId(family) === personId) return unlinkFamilyPartnerAId(family);
    return '';
}

function unlinkFamilyChildrenIds(family)
{
    return [...new Set([...(family?.childIds || []), ...(family?.childrenIds || [])].filter(Boolean))];
}

function unlinkSetFamilyChildren(family, childIds = [])
{
    const ids = [...new Set(childIds.filter(Boolean))];
    family.childIds = ids;
    family.childrenIds = [...ids];
    return ids;
}

function unlinkStoredFamilyById(familyId)
{
    return unlinkStoredFamilies().find(family => family.id === familyId) || null;
}

function unlinkCentralFamilyById(familyId)
{
    return centralFamilyRecords().find(family => family.id === familyId) || null;
}

function unlinkMaterializeFamily(family)
{
    if (!family?.id) return null;

    const existing = unlinkStoredFamilyById(family.id);
    if (existing) return existing;

    const copy = {
        ...family,
        childIds: unlinkFamilyChildrenIds(family),
        childrenIds: unlinkFamilyChildrenIds(family),
        events: Array.isArray(family.events) ? [...family.events] : [],
        attributes: Array.isArray(family.attributes) ? [...family.attributes] : [],
        notes: Array.isArray(family.notes) ? [...family.notes] : [],
        citations: Array.isArray(family.citations) ? [...family.citations] : [],
        mediaIds: Array.isArray(family.mediaIds) ? [...family.mediaIds] : [],
        parentChildTypes: sanitizeParentChildTypes(
            family.parentChildTypes
        ),
    };

    unlinkStoredFamilies().push(copy);
    return copy;
}

function unlinkFindCentralFamilyForParentChild(parentId, childId, preferredFamilyId = '')
{
    const families = centralFamilyRecords();

    if (preferredFamilyId)
    {
        const family = families.find(item =>
            item.id === preferredFamilyId
            && unlinkFamilyIncludesPerson(item, parentId)
            && unlinkFamilyChildrenIds(item).includes(childId)
        );

        if (family) return family;
    }

    return families.find(family =>
        unlinkFamilyIncludesPerson(family, parentId)
          && unlinkFamilyChildrenIds(family).includes(childId)
    ) || null;
}

function unlinkFindStoredFamilyForParentChild(parentId, childId, preferredFamilyId = '')
{
    return unlinkMaterializeFamily(
        unlinkFindCentralFamilyForParentChild(parentId, childId, preferredFamilyId)
    );
}

function unlinkFindCentralPartnerFamily(personAId, personBId, preferredFamilyId = '')
{
    const families = centralFamilyRecords();

    if (preferredFamilyId)
    {
        const family = families.find(item =>
            item.id === preferredFamilyId
            && unlinkFamilyIncludesPerson(item, personAId)
            && unlinkFamilyIncludesPerson(item, personBId)
        );

        if (family) return family;
    }

    return families.find(family =>
        unlinkFamilyIncludesPerson(family, personAId)
          && unlinkFamilyIncludesPerson(family, personBId)
    ) || null;
}

function unlinkFindStoredPartnerFamily(personAId, personBId, preferredFamilyId = '')
{
    return unlinkMaterializeFamily(
        unlinkFindCentralPartnerFamily(personAId, personBId, preferredFamilyId)
    );
}

function unlinkUniqueFamilyId(base = 'family')
{
    const cleanBase = String(base || 'family')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'family';

    let id = cleanBase;
    let counter = 2;

    while (centralFamilyRecords().some(family => family.id === id) || unlinkStoredFamilyById(id))
    {
        id = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return id;
}

function unlinkParentSlotForPerson(parentId)
{
    const gender = String(getPerson(parentId)?.gender || '').toLowerCase();

    if (gender === 'female')
    {
        return {
            partnerAId: '',
            partnerBId: parentId,
            fatherId: '',
            motherId: parentId,
            partnerARoleHint: '',
            partnerBRoleHint: 'WIFE'
        };
    }

    return {
        partnerAId: parentId,
        partnerBId: '',
        fatherId: parentId,
        motherId: '',
        partnerARoleHint: 'HUSB',
        partnerBRoleHint: ''
    };
}

function unlinkApplyFamilyAliases(family)
{
    const partnerA = unlinkFamilyPartnerAId(family);
    const partnerB = unlinkFamilyPartnerBId(family);

    family.partnerAId = partnerA;
    family.partner1Id = partnerA;
    family.personAId = partnerA;

    family.partnerBId = partnerB;
    family.partner2Id = partnerB;
    family.personBId = partnerB;

    unlinkSetFamilyChildren(family, unlinkFamilyChildrenIds(family));

    family.events = Array.isArray(family.events) ? family.events : [];
    family.attributes = Array.isArray(family.attributes) ? family.attributes : [];
    family.notes = Array.isArray(family.notes) ? family.notes : [];
    family.citations = Array.isArray(family.citations) ? family.citations : [];
    family.mediaIds = Array.isArray(family.mediaIds) ? family.mediaIds : [];

    family.type = family.type || 'family';
    family.relationshipStatus = family.relationshipStatus || 'active';

    return family;
}

function unlinkFindStoredSingleParentFamily(parentId)
{
    return unlinkStoredFamilies().find(family =>
    {
        const partnerA = unlinkFamilyPartnerAId(family);
        const partnerB = unlinkFamilyPartnerBId(family);
        const partners = [partnerA, partnerB].filter(Boolean);

        return partners.length === 1 && partners[0] === parentId;
    }) || null;
}

function unlinkCreateSingleParentFamily(parentId, childIds = [], projectId = '')
{
    const slot = unlinkParentSlotForPerson(parentId);
    const family = {
        id: unlinkUniqueFamilyId(`family-${parentId}-single-parent`),
        projectId: projectId || currentProjectId(),
        type: 'family',

        fatherId: slot.fatherId,
        motherId: slot.motherId,

        partnerAId: slot.partnerAId,
        partner1Id: slot.partnerAId,
        personAId: slot.partnerAId,
        partnerARoleHint: slot.partnerARoleHint,

        partnerBId: slot.partnerBId,
        partner2Id: slot.partnerBId,
        personBId: slot.partnerBId,
        partnerBRoleHint: slot.partnerBRoleHint,

        relationshipType: 'Single parent',
        relationshipStatus: 'active',
        childIds: [],
        childrenIds: [],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        parentChildTypes: {},
        gedcomXref: ''
    };

    family.gedcomXref = `@F${family.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
    unlinkSetFamilyChildren(family, childIds);

    unlinkStoredFamilies().push(family);
    return family;
}

function unlinkAddChildrenToSingleParentFamily(parentId, childIds = [], projectId = '')
{
    if (!parentId || !childIds.length) return null;

    const family = unlinkFindStoredSingleParentFamily(parentId)
        || unlinkCreateSingleParentFamily(parentId, [], projectId);

    unlinkSetFamilyChildren(family, [
        ...unlinkFamilyChildrenIds(family),
        ...childIds
    ]);

    return unlinkApplyFamilyAliases(family);
}

function unlinkFamilyHasPartnerPair(family)
{
    return Boolean(unlinkFamilyPartnerAId(family) && unlinkFamilyPartnerBId(family));
}

function unlinkFamilyHasPayload(family)
{
    return Boolean(
        (family?.events || []).length
          || (family?.attributes || []).length
          || (family?.notes || []).length
          || (family?.citations || []).length
          || (family?.mediaIds || []).length
    );
}

function unlinkRemoveFamilyById(familyId)
{
    const families = unlinkStoredFamilies();
    const index = families.findIndex(family => family.id === familyId);

    if (index >= 0)
    {
        families.splice(index, 1);
        return true;
    }

    return false;
}

function unlinkRemoveFamilyIfEmptyAndOrphaned(family)
{
    if (!family?.id) return false;
    if (unlinkFamilyChildrenIds(family).length) return false;
    if (unlinkFamilyHasPartnerPair(family)) return false;
    if (unlinkFamilyHasPayload(family)) return false;

    return unlinkRemoveFamilyById(family.id);
}

function unlinkParentChildRelationship({ parentId, childId, familyId = '' } = {})
{
    if (!parentId || !childId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    const family = unlinkFindStoredFamilyForParentChild(parentId, childId, familyId);

    if (!family)
    {
        return { ok: false, message: 'Relationship record not found.' };
    }

    const children = unlinkFamilyChildrenIds(family);

    if (!children.includes(childId))
    {
        return { ok: false, message: 'This parent-child relationship has already been removed.' };
    }

    const otherParentId =
        unlinkFamilyPartnerId(family, parentId);

    const otherParentType = otherParentId
        ? parentChildRelationshipType(
            family,
            otherParentId,
            childId
        )
        : 'Biological';

    unlinkSetFamilyChildren(
        family,
        children.filter(id => id !== childId)
    );

    /*
      * The child is no longer represented by this family,
      * so remove all connection-type keys for that child.
      */
    removeParentChildRelationshipType(
        family,
        parentId,
        childId
    );

    if (otherParentId)
    {
        removeParentChildRelationshipType(
            family,
            otherParentId,
            childId
        );

        const singleParentFamily =
            unlinkAddChildrenToSingleParentFamily(
                otherParentId,
                [childId],
                family.projectId
            );

        setParentChildRelationshipType(
            singleParentFamily,
            otherParentId,
            childId,
            otherParentType
        );
    }

    unlinkApplyFamilyAliases(family);
    unlinkRemoveFamilyIfEmptyAndOrphaned(family);

    return {
        ok: true,
        message: 'Relationship unlinked.'
    };
}

function unlinkPartnerRelationship({ personAId, personBId, familyId = '', keepChildrenWithParentId = '' } = {})
{
    if (!personAId || !personBId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    const family = unlinkFindStoredPartnerFamily(personAId, personBId, familyId);

    if (!family)
    {
        return { ok: false, message: 'Relationship record not found.' };
    }

    const childIds = unlinkFamilyChildrenIds(family);

    if (childIds.length)
    {
        if (![personAId, personBId].includes(keepChildrenWithParentId))
        {
            return { ok: false, message: 'Choose which parent should keep the children.' };
        }
        const retainedTypes = childIds.map(childId => ({
            childId,
            type: parentChildRelationshipType(
                family,
                keepChildrenWithParentId,
                childId
            )
        }));

        const singleParentFamily =
            unlinkAddChildrenToSingleParentFamily(
                keepChildrenWithParentId,
                childIds,
                family.projectId
            );

        retainedTypes.forEach(({ childId, type }) =>
        {
            setParentChildRelationshipType(
                singleParentFamily,
                keepChildrenWithParentId,
                childId,
                type
            );
        });
    }

    unlinkRemoveFamilyById(family.id);

    return {
        ok: true,
        message: 'Relationship unlinked.'
    };
}

function refreshAfterRelationshipChange(
    focusPersonId,
    context = 'tree'
)
{
    syncFamilyReciprocalLinks();
    rebuildSampleEventsAndPruneSourceLinks();

    if (focusPersonId)
    {
        state.selectedPersonId = focusPersonId;

        if (
            context === 'people'
          || context === 'profile'
        )
        {
            state.selectedPeopleId = focusPersonId;
        }
    }

    closeModal();

    if (context === 'profile')
    {
        state.activeModule = 'People';
        state.peopleView = 'profile';
        state.peopleSide = 'profile';
        state.peopleProfileEditing = false;
        renderPeople();
        return;
    }

    if (context === 'people')
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
        return;
    }

    state.treeInspectorCollapsed = false;

    renderFamilyTreePreserveScroll?.()
        || renderFamilyTree();
}

function buildUnlinkRelationshipContext(raw = {})
{
    const kind = String(raw.kind || '').toLowerCase();
    const personId = String(raw.personId || '');
    const relatedPersonId = String(raw.relatedPersonId || '');
    const familyId = String(raw.familyId || '');
    const sidebarContext = raw.sidebarContext || 'tree';

    if (!personId || !relatedPersonId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    if (kind === 'sibling')
    {
        return {
            ok: false,
            message: 'Sibling relationships come from shared parents. Remove or edit parent-child links instead.'
        };
    }

    if (kind === 'parent')
    {
        const family = unlinkFindCentralFamilyForParentChild(relatedPersonId, personId, familyId);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            parentId: relatedPersonId,
            childId: personId,
            familyId: family?.id || familyId,
            childrenIds: []
        };
    }

    if (kind === 'child')
    {
        const family = unlinkFindCentralFamilyForParentChild(personId, relatedPersonId, familyId);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            parentId: personId,
            childId: relatedPersonId,
            familyId: family?.id || familyId,
            childrenIds: []
        };
    }

    if (kind === 'partner')
    {
        const family = unlinkFindCentralPartnerFamily(personId, relatedPersonId, familyId);
        const childrenIds = unlinkFamilyChildrenIds(family);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            personAId: personId,
            personBId: relatedPersonId,
            familyId: family?.id || familyId,
            childrenIds
        };
    }

    return {
        ok: false,
        message: 'Unsupported relationship type.'
    };
}

function renderUnlinkRelationshipChildren(context)
{
    if (context.kind !== 'partner' || !context.childrenIds.length) return '';

    const personAName = unlinkPersonName(context.personAId);
    const personBName = unlinkPersonName(context.personBId);

    return `<div class="unlink-relationship-children">
        <div class="unlink-relationship-children-title">Children connected through this relationship</div>
        <ul class="unlink-relationship-child-list">
          ${context.childrenIds.map(childId => `<li>${escapeHtml(unlinkPersonName(childId))}</li>`).join('')}
        </ul>

        <div class="unlink-relationship-options" role="radiogroup" aria-label="Choose parent to keep children">
          <label class="unlink-relationship-option">
            <input type="radio" name="unlinkKeepChildrenWith" value="${escapeHtml(context.personAId)}">
            <span>Keep children with ${escapeHtml(personAName)}</span>
          </label>
          <label class="unlink-relationship-option">
            <input type="radio" name="unlinkKeepChildrenWith" value="${escapeHtml(context.personBId)}">
            <span>Keep children with ${escapeHtml(personBName)}</span>
          </label>
        </div>
      </div>`;
}

function unlinkRelationshipDescription(context)
{
    if (context.kind === 'parent')
    {
        return `This will remove ${unlinkPersonName(context.parentId)} as ${unlinkPersonName(context.childId)}’s parent. Neither person will be deleted.`;
    }

    if (context.kind === 'child')
    {
        return `This will remove ${unlinkPersonName(context.childId)} as ${unlinkPersonName(context.parentId)}’s child. Neither person will be deleted.`;
    }

    if (context.kind === 'partner')
    {
        const base = `This will remove the partner relationship between ${unlinkPersonName(context.personAId)} and ${unlinkPersonName(context.personBId)}. Neither person will be deleted.`;

        if (context.childrenIds.length)
        {
            return `${base} Choose which parent should keep the children after unlinking.`;
        }

        return base;
    }

    return 'This will remove the selected relationship. No person will be deleted.';
}

function renderUnlinkRelationshipModal(context)
{
    const needsChildDecision = context.kind === 'partner' && context.childrenIds.length > 0;

    return `<div class="modal unlink-relationship-modal" role="dialog" aria-modal="true" aria-labelledby="unlinkRelationshipTitle">
        <div class="modal-header">
          <div>
            <h2 id="unlinkRelationshipTitle">Remove relationship?</h2>
            <p>This changes the relationship only. People records will remain in the project.</p>
          </div>
          <button
            class="close-button"
            type="button"
            data-close
            aria-label="Close">
            ${icon.close}
          </button>
        </div>

        <div class="modal-body unlink-relationship-body">
          <div class="unlink-relationship-warning">
            ${escapeHtml(unlinkRelationshipDescription(context))}
          </div>

          ${renderUnlinkRelationshipChildren(context)}
        </div>

        <div class="modal-footer">
          <button class="button secondary" type="button" data-close>Cancel</button>
          <button class="button danger" type="button" data-confirm-unlink-relationship ${needsChildDecision ? 'disabled' : ''}>
            Unlink relationship
          </button>
        </div>
      </div>`;
}

function openUnlinkRelationshipModal(rawContext = {})
{
    const context = buildUnlinkRelationshipContext(rawContext);

    if (!context.ok)
    {
        showToast(context.message || 'Relationship cannot be unlinked.');
        return;
    }

    openModal(renderUnlinkRelationshipModal(context));
    bindUnlinkRelationshipModal(context);
}

function bindUnlinkRelationshipModal(context)
{
    const confirmButton = modalBackdrop.querySelector('[data-confirm-unlink-relationship]');
    const keepChildrenInputs = [...modalBackdrop.querySelectorAll('input[name="unlinkKeepChildrenWith"]')];

    keepChildrenInputs.forEach(input =>
    {
        input.addEventListener('change', () =>
        {
            if (confirmButton) confirmButton.disabled = false;
        });
    });

    confirmButton?.addEventListener('click', () =>
    {
        let result = null;

        if (context.kind === 'parent' || context.kind === 'child')
        {
            result = unlinkParentChildRelationship({
                parentId: context.parentId,
                childId: context.childId,
                familyId: context.familyId
            });
        }

        if (context.kind === 'partner')
        {
            const keepChildrenWithParentId = modalBackdrop.querySelector('input[name="unlinkKeepChildrenWith"]:checked')?.value || '';

            result = unlinkPartnerRelationship({
                personAId: context.personAId,
                personBId: context.personBId,
                familyId: context.familyId,
                keepChildrenWithParentId
            });
        }

        if (!result?.ok)
        {
            showToast(result?.message || 'Relationship could not be unlinked.');
            return;
        }

        refreshAfterRelationshipChange(
            context.personId,
            context.sidebarContext
        );
    });
}

function buildRelationshipEditContext(raw = {})
{
    const kind =
        String(raw.kind || '').toLowerCase();

    const personId =
        String(raw.personId || '');

    const relatedPersonId =
        String(raw.relatedPersonId || '');

    const familyId =
        String(raw.familyId || '');

    const sidebarContext =
        raw.sidebarContext || 'tree';

    if (!personId || !relatedPersonId)
    {
        return {
            ok: false,
            message: 'Relationship information is missing.'
        };
    }

    if (kind === 'sibling')
    {
        return {
            ok: false,
            message:
            'Sibling relationships are derived from shared parents.'
        };
    }

    if (kind === 'parent')
    {
        const family =
            unlinkFindCentralFamilyForParentChild(
                relatedPersonId,
                personId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId,
            parentId: relatedPersonId,
            childId: personId
        };
    }

    if (kind === 'child')
    {
        const family =
            unlinkFindCentralFamilyForParentChild(
                personId,
                relatedPersonId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId,
            parentId: personId,
            childId: relatedPersonId
        };
    }

    if (kind === 'partner')
    {
        const family =
            unlinkFindCentralPartnerFamily(
                personId,
                relatedPersonId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId
        };
    }

    return {
        ok: false,
        message: 'Unsupported relationship type.'
    };
}

function relationshipEditPersonName(personId)
{
    return getPerson(personId)?.names?.display
        || 'Unknown person';
}

function renderParentChildRelationshipEditFields(
    context
)
{
    const currentType = parentChildRelationshipType(
        context.family,
        context.parentId,
        context.childId
    );

    return `
        <div class="field add-person-select-field">
          <label for="relationshipEditParentChildType">
            Parent–child connection
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditParentChildType">
            ${parentChildRelationshipTypeOptions(
                currentType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>

        <div class="panel-muted">
          This value describes how this parent and child are
          connected. It does not change either person record.
        </div>
      `;
}

function renderPartnerRelationshipEditFields(
    context
)
{
    const family = context.family;

    const relationshipType =
        relationshipTypeFromLegacy(family);

    const startEvent =
        partnerRelationshipStartEvent(
            family,
            relationshipType
        );

    const marriageType =
        startEvent.typeLabel
        || family.marriageType
        || 'Civil';

    const showMarriageType =
        addPersonRelationshipShowsMarriageType(
            relationshipType
        );

    return `
        <div class="field add-person-select-field">
          <label for="relationshipEditType">
            Relationship type
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditType">
            ${addPersonRelationshipTypeOptions(
                relationshipType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>

        <div data-relationship-edit-fields>
          ${renderPartnerRelationshipDateFields({
                prefix: 'relationshipEdit',
                relationshipType,
                family
            })}
        </div>

        <div
          class="field add-person-select-field"
          data-relationship-edit-marriage-type
          ${showMarriageType ? '' : 'hidden'}>

          <label for="relationshipEditMarriageType">
            Marriage type
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditMarriageType">
            ${addPersonMarriageTypeOptions(
                marriageType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>
      `;
}

function renderRelationshipEditModal(context)
{
    const personName =
        relationshipEditPersonName(context.personId);

    const relatedName =
        relationshipEditPersonName(
            context.relatedPersonId
        );

    return `
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="relationshipEditTitle">

          <div class="modal-header">
            <div>
              <h2 id="relationshipEditTitle">
                Edit relationship
              </h2>

              <p>
                ${escapeHtml(personName)}
                and
                ${escapeHtml(relatedName)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body form-grid">
            ${context.kind === 'partner'
                ? renderPartnerRelationshipEditFields(
                    context
                )
                : renderParentChildRelationshipEditFields(
                    context
                )}
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
              type="button"
              data-save-relationship-edit>
              Save relationship
            </button>
          </div>
        </div>
      `;
}

function bindRelationshipEditModal(context)
{
    if (context.kind === 'partner')
    {
        bindGenealogyDateFields(modalBackdrop);
        bindPlaceComboboxes(modalBackdrop);
        bindNameAffixComboboxes(modalBackdrop);


        const typeSelect =
            modalBackdrop.querySelector(
                '#relationshipEditType'
            );

        const marriageTypeField =
            modalBackdrop.querySelector(
                '[data-relationship-edit-marriage-type]'
            );

        const updateMarriageTypeVisibility = () =>
        {
            if (!marriageTypeField || !typeSelect)
            {
                return;
            }
            updatePartnerRelationshipFields(
                modalBackdrop,
                typeSelect.value
            );
        };

        typeSelect?.addEventListener(
            'change',
            updateMarriageTypeVisibility
        );

        updateMarriageTypeVisibility();
    }

    modalBackdrop
        .querySelector(
            '[data-save-relationship-edit]'
        )
        ?.addEventListener('click', () =>
        {
            const family = context.family;

            if (!family)
            {
                showToast(
                    'Relationship record not found.'
                );
                return;
            }

            if (context.kind === 'partner')
            {
                const relationshipType =
                    modalBackdrop.querySelector(
                        '#relationshipEditType'
                    )?.value || 'Partner';

                const definition =
                    partnerRelationshipDefinition(
                        relationshipType
                    );

                const startDate =
                    collectGenealogyDateField(
                        'relationshipEditStartDate'
                    );

                const endDate = definition.hasEnd
                    ? collectGenealogyDateField(
                        'relationshipEditEndDate'
                    )
                    : emptyGenealogyDate('Exact date');

                if (!startDate || (definition.hasEnd && !endDate))
                {
                    showToast(
                        'Check the relationship dates before saving.'
                    );
                    return;
                }

                if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
                {
                    showToast(
                        'The relationship end date must be after or equal to the start date.'
                    );
                    return;
                }

                const marriageType =
                    addPersonRelationshipShowsMarriageType(
                        relationshipType
                    )
                        ? modalBackdrop.querySelector(
                            '#relationshipEditMarriageType'
                        )?.value || 'Civil'
                        : '';

                upsertPartnerRelationshipEvents(family, {
                    relationshipType,
                    marriageType,
                    startDate,
                    startPlace: readPlaceInputValue(
                        '#relationshipEditStartPlace',
                        modalBackdrop
                    ),
                    endDate,
                    endPlace: definition.hasEnd
                        ? readPlaceInputValue(
                            '#relationshipEditEndPlace',
                            modalBackdrop
                        )
                        : { text: '', selectedPlaceId: '' }
                });

                if (
                    typeof syncFamilyPartnerAliases
              === 'function'
                )
                {
                    syncFamilyPartnerAliases(family);
                }
            }
            else
            {
                const value = modalBackdrop.querySelector(
                    '#relationshipEditParentChildType'
                )?.value;

                if (!PARENT_CHILD_RELATIONSHIP_TYPES.includes(value))
                {
                    showToast(
                        state.language === 'ru'
                            ? 'Выберите тип связи между родителем и ребёнком.'
                            : 'Choose a parent–child relationship type.'
                    );
                    return;
                }

                const key = parentChildRelationshipKey(
                    context.parentId,
                    context.childId
                );

                family.parentChildTypes = {
                    ...sanitizeParentChildTypes(
                        family.parentChildTypes
                    ),
                    [key]: value
                };
            }

            family.updatedAt = 'Just now';

            refreshAfterRelationshipChange(
                context.personId,
                context.sidebarContext
            );

            showToast('Relationship updated.');
        });
}

function openRelationshipEditModal(
    rawContext = {}
)
{
    const context =
        buildRelationshipEditContext(rawContext);

    if (!context.ok)
    {
        showToast(
            context.message
          || 'Relationship cannot be edited.'
        );
        return;
    }

    openModal(
        renderRelationshipEditModal(context)
    );

    bindRelationshipEditModal(context);
}

function openAddPersonModal(title, subtitle, options = {})
{
    const isEditMode = options.mode === 'edit';
    const editPerson = isEditMode ? getPerson(options.personId) : null;
    initializeAddPersonAttachmentDraft(
        editPerson
    );
    addPersonPossibleMatchState = {
        selectedPersonId: ''
    };
    const editValues = editPersonFormValues(editPerson);
    const isPartnerMode = options.relativeType === 'partner';
    const showRelationshipBlock = relationshipBlockShouldShow(options, editPerson);
    const connectionIntent = addPersonCreateConnectionIntent(options);
    const initialParentFamilySelection = defaultParentFamilySelection(
        connectionIntent.anchorPersonId,
        connectionIntent.relationshipType,
        options.parentFamilyId
          || options.parentFamilySelection
          || ''
    );

    const relativeGender = getGenderForRelativeType(options.relativeType);

    const initialGender = options.gender
        || (isEditMode ? editValues.gender : relativeGender)
        || 'Unknown';

    const initialStatus = options.livingStatus
        || (isEditMode ? editValues.livingStatus : 'Living');
    openModal(`<div class="modal add-person-modal" role="dialog" aria-modal="true" aria-labelledby="addPersonTitle">
        <div class="modal-header add-person-header"><div class="add-person-icon">${icon.people}</div><div><h2 id="addPersonTitle">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
        <div class="modal-body add-person-grid">
          <div class="form-grid">
            <section><h3 class="form-section-title">Identity</h3><div class="two-col-form">
              <div class="field add-person-select-field">
                <label for="addPersonGender">Gender</label>
                <select class="compact-select add-person-select" id="addPersonGender">
                  <option ${initialGender === 'Male' ? 'selected' : ''}>Male</option>
                  <option ${initialGender === 'Female' ? 'selected' : ''}>Female</option>
                  <option ${initialGender === 'Unknown' ? 'selected' : ''}>Unknown</option>
                </select>
                <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>
              <div class="field add-person-status-field"><label>Living status</label><button class="add-person-status-button" type="button" id="addPersonStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(initialStatus)}"></span><span id="addPersonStatusLabel">${initialStatus}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="addPersonLivingStatus" value="${initialStatus}"><div class="add-person-status-menu" id="addPersonStatusMenu" role="listbox" hidden>${['Living','Deceased','Unknown'].map(status => `<button class="add-person-status-option ${status === initialStatus ? 'active' : ''}" type="button" role="option" aria-selected="${status === initialStatus ? 'true' : 'false'}" data-status-value="${status}"><span><span class="add-person-status-dot ${statusDotClass(status)}"></span>${status}</span><span data-status-check>${status === initialStatus ? icon.check : ''}</span></button>`).join('')}</div></div>
              <div class="field">
                <label for="addPersonFirstName">First name</label>
                <input id="addPersonFirstName" data-source-value="${escapeHtml(editValues.firstName)}" value="${escapeHtml(localizedDataFieldValue(editValues.firstName))}" placeholder="e.g. Silver">
              </div>

              <div class="field">
                <label for="addPersonLastName">Last name</label>
                <input id="addPersonLastName" data-source-value="${escapeHtml(editValues.lastName)}" value="${escapeHtml(localizedDataFieldValue(editValues.lastName))}" placeholder="e.g. Whiskerfield">
              </div>

              <div class="field">
                <label for="addPersonMiddleName">Middle name / Patronym</label>
                <input id="addPersonMiddleName" data-source-value="${escapeHtml(editValues.middleName)}" value="${escapeHtml(localizedDataFieldValue(editValues.middleName))}" placeholder="e.g. Purrington">
              </div>

              <div class="field add-person-conditional-field" id="maidenNameField">
                <label for="addPersonMaidenName">Maiden name</label>
                <input id="addPersonMaidenName" data-source-value="${escapeHtml(editValues.maidenName)}" value="${escapeHtml(localizedDataFieldValue(editValues.maidenName))}" placeholder="e.g. Milkpaw">
              </div>
            </div></section>
          ${isEditMode ? '' : renderParentFamilySelector({
                anchorPersonId: connectionIntent.anchorPersonId,
                relationshipType: connectionIntent.relationshipType,
                selectedValue: initialParentFamilySelection,
                controlId: 'addPersonParentFamily'
            })}
          <section>
            <h3 class="form-section-title">Life events</h3>
            <div class="add-person-life-grid">
              <div class="add-person-life-event-block">
                ${renderGenealogyDateField('addPersonBirth', 'Birth date', editPerson?.birth || emptyGenealogyDate('Exact date'), {
                    inputId: 'addPersonBirthDate',
                    typeId: 'addPersonBirthDateType',
                    placeholder: 'e.g. 14 Feb 1915',
                    defaultDateType: 'Exact date',
                    className: 'genealogy-date-inline-range'
                })}

              ${renderPlaceCombobox({
                    id: 'addPersonBirthPlace',
                    label: 'Birth place',
                    value: editValues.birthPlace,
                    selectedPlaceId: editPerson?.birth?.placeId || '',
                    addressValue: editPerson?.birth?.address || '',
                    placeholder: 'e.g. Pawford, England'
                })}

              <div class="add-person-life-event-block add-person-death-fields" id="deathFieldsGroup">
                ${renderGenealogyDateField('addPersonDeath', 'Death date', editPerson?.death || emptyGenealogyDate('Exact date'), {
                    inputId: 'addPersonDeathDate',
                    typeId: 'addPersonDeathDateType',
                    placeholder: 'e.g. 14 Feb 1925',
                    defaultDateType: 'Exact date',
                    className: 'genealogy-date-inline-range'
                })}

                ${renderPlaceCombobox({
                    id: 'addPersonDeathPlace',
                    label: 'Death place',
                    value: editValues.deathPlace,
                    selectedPlaceId: editPerson?.death?.placeId || '',
                    addressValue: editPerson?.death?.address || '',
                    placeholder: 'e.g. Meowbridge, England'
                })}
              </div>
            </div>
          </section>
          </div>
          <aside>
            ${renderAddPersonAttachmentSideCard(editPerson)}
            ${isEditMode ? '' : renderAddPersonPossibleMatchesCard(options, editPerson)}
          </aside>
          ${showRelationshipBlock ? renderAddPersonRelationshipBlock(options, editPerson) : ''}
          ${renderAddPersonAdditionalFacts(editPerson)}
        </div>
        <div class="modal-footer add-person-footer">
          <div class="add-person-footer-left">
            ${isEditMode ? '' : `
              <label class="checkbox-row add-person-repeat">
                <input type="checkbox" id="addPersonCreateAnother">
                <span>
                  Create and add another<br>
                  <span class="panel-muted">Add person and reopen this window</span>
                </span>
              </label>
            `}
          </div>

          <div class="add-person-footer-actions">
            <button class="button secondary" type="button" data-close>Cancel</button>
            <button class="button primary" type="button" ${isEditMode ? 'data-save-edit-person' : 'data-create-person'}>
              ${isEditMode ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>`);
    bindAddPersonModalControls(options.mode === 'edit' ? options.personId || '' : '');
    bindAddPersonSideCards(options, editPerson);
    updateAddPersonConditionalFields();
    if (isEditMode)
    {
        modalBackdrop.querySelector('[data-save-edit-person]')?.addEventListener('click', () =>
        {
            saveEditPersonModalValues(options.personId);
        });
    }
    else
    {
        modalBackdrop.querySelector('[data-create-person]')?.addEventListener('click', event =>
        {
            const button = event.currentTarget;
            if (button.disabled) return;

            button.disabled = true;
            const result = commitAddPersonModalCreate(title, subtitle, options);

            if (!result?.ok && modalBackdrop.contains(button))
            {
                button.disabled = false;
            }
        });
    }
}

function selectAddPersonPossibleMatch(personId, options = {}, editPerson = null)
{
    addPersonPossibleMatchState.selectedPersonId = personId || '';
    refreshAddPersonPossibleMatchesCard(options, editPerson);
}

function refreshAfterPossibleMatchConnection(anchorPersonId)
{
    closeModal();

    state.selectedPersonId = anchorPersonId || state.selectedPersonId;
    state.selectedPeopleId = anchorPersonId || state.selectedPeopleId;
    state.treeInspectorCollapsed = false;

    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }
}

function commitAddPersonPossibleMatchAction(options = {})
{
    const selectedPerson = getPerson(addPersonPossibleMatchState.selectedPersonId);

    if (!selectedPerson)
    {
        showToast('Select a possible match first.');
        return;
    }

    const connectionIntent = addPersonCreateConnectionIntent(options);

    if (!connectionIntent.shouldConnect)
    {
        openAddPersonPossibleMatch(selectedPerson.id);
        return;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();

    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before connecting.');
        return;
    }

    const result = connectPeopleByRelationship({
        anchorPersonId: connectionIntent.anchorPersonId,
        relativePersonId: selectedPerson.id,
        relationshipType: connectionIntent.relationshipType,
        parentFamilySelection: addPersonParentFamilySelection(options),
        partnerChildrenMode:
          addPersonPartnerChildrenMode(options)
    });

    if (!result.ok)
    {
        showToast(result.message || 'Could not connect the selected match.');
        return;
    }

    applyPartnerDetailsToCreatedConnection(result, relationshipValues);

    rebuildSampleEventsAndPruneSourceLinks();
    refreshAfterPossibleMatchConnection(connectionIntent.anchorPersonId);

    showToast(`${connectPersonName(selectedPerson)} connected as ${addPersonConnectionToastLabel(connectionIntent.relationshipType)}.`);
}

function readAddPersonModalValue(selector)
{
    const control =
        modalBackdrop.querySelector(selector);

    if (!control)
    {
        return '';
    }

    return collectLocalizedDataFieldValue(
        control,
        control.dataset.sourceValue
          ?? control.value
    ).trim();
}

function updateAddPersonFactSummary()
{
    const section =
        modalBackdrop?.querySelector(
            '[data-add-person-facts]'
        );

    if (!section) return;

    const count =
        section.querySelectorAll(
            '[data-add-person-fact-card]'
        ).length;

    const countLabel =
        section.querySelector(
            '[data-add-person-facts-count]'
        );

    if (countLabel)
    {
        countLabel.textContent =
            formatAddPersonFactSummary(count);
    }
}

function collectAddPersonActiveFactIds()
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    if (!section) return [];
    return Array.from(section.querySelectorAll('[data-add-person-fact-card]'))
        .map(card => card.dataset.addPersonFactCard)
        .filter(Boolean);
}

function addPersonFactToModal(factId, personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    const target = section?.querySelector('[data-add-person-facts-added]');
    if (!section || !target || target.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`)) return;
    const person = personId ? getPerson(personId) : null;
    target.insertAdjacentHTML('beforeend', addPersonFactCardHtml(factId, person));
    const button = section.querySelector(`[data-add-person-add-fact="${CSS.escape(factId)}"]`);
    if (button)
    {
        button.disabled = true;
        button.classList.add('is-added');
    }
    const body = section.querySelector('[data-add-person-facts-body]');
    const toggle = section.querySelector('[data-add-person-facts-toggle]');
    if (body) body.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    const insertedFact = target.lastElementChild || target;
    bindGenealogyDateFields(insertedFact);
    bindPlaceComboboxes(insertedFact);
    bindNameAffixComboboxes(insertedFact);

    updateAddPersonFactSummary();
}

function removeAddPersonFactCard(section, factId)
{
    section.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`)?.remove();
    const button = section.querySelector(`[data-add-person-add-fact="${CSS.escape(factId)}"]`);
    if (button)
    {
        button.disabled = false;
        button.classList.remove('is-added');
    }
    updateAddPersonFactSummary();
}

function confirmRemoveAddPersonFact(
    factId,
    onConfirm
)
{
    const definition =
        addPersonFactDefinition(factId);

    document
        .querySelector(
            '[data-add-person-fact-confirm]'
        )
        ?.remove();

    const backdrop =
        document.createElement('div');

    backdrop.className =
        'add-person-fact-confirm-backdrop';

    backdrop.dataset.addPersonFactConfirm =
        'true';

    backdrop.innerHTML = `
        <div class="add-person-fact-confirm-card" role="dialog" aria-modal="true" aria-labelledby="removeFactTitle">
          <div class="add-person-fact-confirm-header">
            <h3 id="removeFactTitle">Remove ${escapeHtml(definition.label)}?</h3>
            <button class="close-button" type="button" data-cancel-remove-fact aria-label="Cancel removing fact">${icon.close}</button>
          </div>

          <div class="add-person-fact-confirm-body">
            Removing this fact will clear the saved ${escapeHtml(definition.label.toLowerCase())} data when you save the person.
          </div>

          <div class="add-person-fact-confirm-actions">
            <button class="button secondary" type="button" data-cancel-remove-fact>Cancel</button>
            <button class="button primary" type="button" data-confirm-remove-fact>Remove fact</button>
          </div>
        </div>
      `;

    let backdropDismissBinding = null;

    function handleKeydown(event)
    {
        if (event.key === 'Escape')
        {
            close();
        }
    }

    function close()
    {
        backdropDismissBinding?.destroy();
        backdropDismissBinding = null;

        document.removeEventListener(
            'keydown',
            handleKeydown
        );

        backdrop.remove();
    }

    backdrop.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-cancel-remove-fact]'
                )
            )
            {
                close();
                return;
            }

            if (
                event.target.closest(
                    '[data-confirm-remove-fact]'
                )
            )
            {
                close();
                onConfirm?.();
            }
        }
    );

    document.addEventListener(
        'keydown',
        handleKeydown
    );

    document.body.appendChild(backdrop);

    backdropDismissBinding =
        bindIntentionalBackdropDismiss(
            backdrop,
            close
        );

    backdrop
        .querySelector(
            '[data-cancel-remove-fact]'
        )
        ?.focus({
            preventScroll: true
        });
}

function bindAddPersonAdditionalFacts(personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    if (!section) return;
    const toggle = section.querySelector('[data-add-person-facts-toggle]');
    const body = section.querySelector('[data-add-person-facts-body]');
    toggle?.addEventListener('click', () =>
    {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (body) body.hidden = expanded;
    });
    section.querySelectorAll('[data-add-person-add-fact]').forEach(button => button.addEventListener('click', () =>
    {
        addPersonFactToModal(button.dataset.addPersonAddFact, personId);
    }));
    section.addEventListener('click', event =>
    {
        const remove = event.target.closest('[data-add-person-remove-fact]');
        if (!remove) return;
        const factId = remove.dataset.addPersonRemoveFact;
        confirmRemoveAddPersonFact(factId, () => removeAddPersonFactCard(section, factId));
    });
    updateAddPersonFactSummary();
}

function collectCustomFactFields(
    idPrefix,
    root = modalBackdrop
)
{
    const select = suffix =>
        root?.querySelector(
            `#${CSS.escape(`${idPrefix}${suffix}`)}`
        );

    const typeInput = select('Type');
    const valueInput = select('Value');
    const notesInput = select('Notes');

    const typeField =
        typeInput?.closest(
            '[data-custom-fact-field="type"]'
        );

    const contentField =
        valueInput?.closest(
            '[data-custom-fact-field="content"]'
        );

    const typeError =
        select('TypeError');

    const contentError =
        select('ContentError');

    typeField?.classList.remove('has-error');
    contentField?.classList.remove('has-error');

    typeInput?.removeAttribute('aria-invalid');
    valueInput?.removeAttribute('aria-invalid');

    if (typeError)
    {
        typeError.textContent = '';
    }

    if (contentError)
    {
        contentError.textContent = '';
    }

    const type =
        String(typeInput?.value || '').trim();

    const value =
        String(valueInput?.value || '').trim();

    const notes =
        String(notesInput?.value || '').trim();

    const place = readPlaceInputValue(
        `#${idPrefix}Place`,
        root
    );

    const date = collectGenealogyDateField(
        `${idPrefix}Date`
    );

    if (!type)
    {
        typeField?.classList.add('has-error');

        typeInput?.setAttribute(
            'aria-invalid',
            'true'
        );

        if (typeError)
        {
            typeError.textContent =
                'Enter a short name for this fact.';
        }

        typeInput?.focus({
            preventScroll: true
        });

        return {
            invalid: true,
            message:
            'Enter a name for the custom fact.'
        };
    }

    if (!date)
    {
        root
            ?.querySelector(
                `[data-genealogy-date-field="${CSS.escape(
                    `${idPrefix}Date`
                )}"] [data-genealogy-date-input]`
            )
            ?.focus({
                preventScroll: true
            });

        return {
            invalid: true,
            message:
            'Check the custom fact date before saving.'
        };
    }

    const hasContent = Boolean(
        value
          || notes
          || place.text
          || place.selectedPlaceId
          || hasGenealogyDateValue(
              date,
              'Exact date'
          )
    );

    if (!hasContent)
    {
        contentField?.classList.add('has-error');

        valueInput?.setAttribute(
            'aria-invalid',
            'true'
        );

        if (contentError)
        {
            contentError.textContent =
                'Add a value, date, place, or note.';
        }

        valueInput?.focus({
            preventScroll: true
        });

        return {
            invalid: true,
            message:
            'Add some information to the custom fact.'
        };
    }

    return {
        invalid: false,

        value: {
            type,
            value,
            date,
            place,
            notes
        }
    };
}

function collectAddPersonAdditionalFacts(personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    const facts = { activeFactIds: collectAddPersonActiveFactIds() };
    if (!section) return facts;
    const hasFact = factId => Boolean(section.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`));
    if (hasFact('prefix')) facts.prefix = readAddPersonModalValue('#addPersonFactPrefix');
    if (hasFact('suffix')) facts.suffix = readAddPersonModalValue('#addPersonFactSuffix');
    if (hasFact('causeOfDeath')) facts.deathReason = readAddPersonModalValue('#addPersonFactCauseOfDeath');
    if (hasFact('burialPlace'))
    {
        facts.burialPlace = readPlaceInputValue('#addPersonFactBurialPlace', modalBackdrop);
    }
    if (hasFact('alternativeNames')) facts.alternativeNames = readAddPersonModalValue('#addPersonFactAlternativeNames');
    if (hasFact('customFact'))
    {
        const result = collectCustomFactFields('addPersonCustomFact',  modalBackdrop);
        if (result.invalid)
        {
            return result;
        }
        facts.customFact = result.value;
    }
    if (hasFact('education'))
    {
        const fromDate = collectGenealogyDateField('addPersonFactEducationFrom');
        const toDate = collectGenealogyDateField('addPersonFactEducationTo');
        if (!fromDate || !toDate) return { invalid: true, message: 'Check the education dates before saving.' };
        facts.education = {
            institutionName: readAddPersonModalValue('#addPersonFactEducationInstitutionName'),
            institutionType: modalBackdrop.querySelector('#addPersonFactEducationInstitutionType')?.value || 'Unknown',
            value: readAddPersonModalValue('#addPersonFactEducationValue'),
            place: readPlaceInputValue('#addPersonFactEducationPlace', modalBackdrop),
            notes: readAddPersonModalValue('#addPersonFactEducationNotes'),
            fromDate,
            toDate
        };
    }
    if (hasFact('occupation'))
    {
        const fromDate = collectGenealogyDateField('addPersonFactWorkFrom');
        const toDate = collectGenealogyDateField('addPersonFactWorkTo');
        if (!fromDate || !toDate) return { invalid: true, message: 'Check the occupation dates before saving.' };
        facts.work = {
            company: readAddPersonModalValue('#addPersonFactWorkCompany'),
            occupation: readAddPersonModalValue('#addPersonFactWorkOccupation'),
            notes: readAddPersonModalValue('#addPersonFactWorkNotes'),
            fromDate,
            toDate
        };
    }
    if (hasFact('religion'))
    {
        facts.religion = readReligionField(
            modalBackdrop,
            'addPersonFactReligion'
        );
    }
    if (hasFact('baptism'))
    {
        const baptismDate = collectGenealogyDateField('addPersonFactBaptism');
        if (!baptismDate) return { invalid: true, message: 'Check the baptism date before saving.' };
        facts.baptism = {
            place: readPlaceInputValue('#addPersonFactBaptismPlace', modalBackdrop),
            date: baptismDate
        };
    }
    return facts;
}

function applyPersonCustomFact(
    person,
    values
)
{
    ensurePersonCentralStructures(person);

    if (!values)
    {
        removePersonAttribute(
            person,
            'FACT'
        );

        return null;
    }

    const existing =
        personAttributeByTag(
            person,
            'FACT'
        );

    const resolvedPlace =
        resolvePlaceAssignment(
            values.place,
            existing?.placeId
        );

    return upsertPersonAttribute(
        person,
        'FACT',
        {
            type:
            valueOrNull(values.type) || '',

            value:
            valueOrNull(values.value) || '',

            date:
            genealogyDateOrNull(
                values.date,
                'Exact date'
            ),

            placeId:
            resolvedPlace.placeId,

            placeText:
            resolvedPlace.placeText,

            address:
            resolvedPlace.address,

            notes:
            valueOrNull(values.notes) || ''
        }
    );
}

function applyAddPersonAdditionalFacts(person, facts = {})
{
    ensurePersonCentralStructures(person);
    const active = new Set(facts.activeFactIds || []);

    person.names.prefix = active.has('prefix') ? (normalizeNameSegment(facts.prefix)) : '';
    person.names.suffix = active.has('suffix') ? (normalizeNameSegment(facts.suffix)) : '';
    rebuildPersonDisplayName(person);


    if (person.livingStatus === 'Deceased' && active.has('causeOfDeath'))
    {
        person.death.reason = valueOrNull(facts.deathReason) || '';
        person.death.cause = person.death.reason;
    }
    else
    {
        person.death.reason = '';
        person.death.cause = '';
    }

    if (person.livingStatus === 'Deceased' && active.has('burialPlace'))
    {
        const burialPlace = resolvePlaceAssignment(facts.burialPlace, person.death?.burialPlaceId);
        person.death.burialPlaceText = burialPlace.placeText;
        person.death.burialPlaceId = burialPlace.placeId;
        person.death.burialAddress = burialPlace.address;
    }
    else
    {
        person.death.burialPlaceText = '';
        person.death.burialPlaceId = null;
        person.death.burialAddress = '';
    }

    person.profile.alternativeNames = active.has('alternativeNames') ? valueOrNull(facts.alternativeNames) : null;

    if (active.has('customFact') && facts.customFact)
    {
        applyPersonCustomFact(person, facts.customFact);
    }
    else
    {
        applyPersonCustomFact(person, null);
    }

    if (active.has('education') && facts.education)
    {
        const existingEducation = personAttributeByTag(person, 'EDUC');
        const educationPlace = resolvePlaceAssignment(facts.education.place, existingEducation?.placeId);
        const institutionType = valueOrNull(facts.education.institutionType) || 'Unknown';

        upsertPersonAttribute(person, 'EDUC', {
            value: valueOrNull(facts.education.value) || 'Education',
            type: institutionType === 'Unknown' ? '' : institutionType,
            institutionName: valueOrNull(facts.education.institutionName) || '',
            institutionType,
            placeText: educationPlace.placeText,
            placeId: educationPlace.placeId,
            address: educationPlace.address,
            notes: valueOrNull(facts.education.notes) || '',
            fromDate: genealogyDateOrNull(facts.education.fromDate, 'Year only'),
            toDate: genealogyDateOrNull(facts.education.toDate, 'Year only')
        });
    }
    else
    {
        removePersonAttribute(person, 'EDUC');
    }

    if (active.has('occupation') && facts.work)
    {
        upsertPersonAttribute(person, 'OCCU', {
            value: valueOrNull(facts.work.occupation) || '',
            company: valueOrNull(facts.work.company) || '',
            notes: valueOrNull(facts.work.notes) || '',
            fromDate: genealogyDateOrNull(facts.work.fromDate, 'Exact date'),
            toDate: genealogyDateOrNull(facts.work.toDate, 'Exact date')
        });
    }
    else
    {
        removePersonAttribute(person, 'OCCU');
    }

    if (active.has('religion'))
    {
        upsertPersonAttribute(
            person,
            'RELI',
            {
                value: normalizeReligionValue(
                    facts.religion
                )
            }
        );
    }
    else
    {
        removePersonAttribute(person, 'RELI');
    }

    if (active.has('baptism') && facts.baptism)
    {
        const existingBaptism = personEventByTag(person, 'BAPM');
        const baptismPlace = resolvePlaceAssignment(facts.baptism.place, existingBaptism?.placeId);

        upsertPersonEvent(person, 'BAPM', {
            date: genealogyDateOrNull(facts.baptism.date, 'Exact date'),
            placeText: baptismPlace.placeText,
            placeId: baptismPlace.placeId,
            address: baptismPlace.address
        });
    }
    else
    {
        removePersonEvent(person, 'BAPM');
    }
}
function updatePersonInitials(person)
{
    const first = person.names.first || '';
    const last = person.names.last || '';
    person.names.initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase() || person.names.initials || '??';
}

function saveEditPersonModalValues(personId)
{
    const person = getPerson(personId);

    if (!person)
    {
        closeModal();
        showToast('Person record was not found.');
        return;
    }

    const genderValue = readAddPersonModalValue('#addPersonGender');
    const livingStatus = readAddPersonModalValue('#addPersonLivingStatus');
    const birthPlace = resolvePlaceInputSelector('#addPersonBirthPlace');
    const deathPlace = resolvePlaceInputSelector('#addPersonDeathPlace');

    person.names.first = readAddPersonModalValue('#addPersonFirstName');
    person.names.last = readAddPersonModalValue('#addPersonLastName');
    person.names.middle = readAddPersonModalValue('#addPersonMiddleName');
    person.names.maiden = readAddPersonModalValue('#addPersonMaidenName');

    rebuildPersonDisplayName(person);


    person.gender = genderValue === 'Male'
        ? 'male'
        : genderValue === 'Female'
            ? 'female'
            : 'unknown';

    person.livingStatus = normalizeLivingStatus(livingStatus);

    const additionalFacts = collectAddPersonAdditionalFacts(personId);
    if (additionalFacts.invalid)
    {
        showToast(additionalFacts.message || 'Check the additional facts before saving.');
        return;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();
    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before saving.');
        return;
    }

    const birthDate = collectGenealogyDateField('addPersonBirth');
    if (!birthDate)
    {
        showToast('Check the birth date before saving.');
        return;
    }
    person.birth = {
        ...birthDate,
        placeId: birthPlace.placeId,
        placeText: birthPlace.placeText,
        address: birthPlace.address
    };

    if (person.livingStatus === 'Deceased')
    {
        const deathDate = collectGenealogyDateField('addPersonDeath');
        if (!deathDate)
        {
            showToast('Check the death date before saving.');
            return;
        }
        person.death = {
            ...deathDate,
            placeId: deathPlace.placeId,
            placeText: deathPlace.placeText,
            address: deathPlace.address,
            reason: person.death?.reason || '',
            cause: person.death?.cause || person.death?.reason || '',
            burialPlaceId: cleanDatePlaceId(person.death?.burialPlaceId),
            burialPlaceText: person.death?.burialPlaceText || ''
        };
    }
    else
    {
        person.death = {
            ...emptyGenealogyDate('Exact date'),
            placeId: null,
            placeText: '',
            reason: '',
            cause: '',
            burialPlaceId: null,
            burialPlaceText: ''
        };
    }

    applyAddPersonAdditionalFacts(person, additionalFacts);
    savePersonRelationshipBlock(personId, relationshipValues);
    applyAddPersonAttachmentDrafts(
        personId
    );
    syncFamilyReciprocalLinks();

    markPersonUpdated(person);
    rebuildSampleEventsAndPruneSourceLinks();

    closeModal();
    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }
    showToast('Person updated.');
}

function openEditPersonModal(personId)
{
    const person = getPerson(personId);

    if (!person)
    {
        showToast('Person record was not found.');
        return;
    }

    openAddPersonModal('Edit person', person.names.display, {
        mode: 'edit',
        personId
    });
}

function bindAddPersonModalControls(personId = '')
{
    bindGenealogyDateFields(modalBackdrop);
    bindPlaceComboboxes(modalBackdrop);
    bindNameAffixComboboxes(modalBackdrop);

    bindAddPersonAdditionalFacts(personId);
    bindAddPersonRelationshipBlock();
    const gender = modalBackdrop.querySelector('#addPersonGender');
    const statusButton = modalBackdrop.querySelector('#addPersonStatusButton');
    const statusMenu = modalBackdrop.querySelector('#addPersonStatusMenu');
    gender?.addEventListener('change', updateAddPersonConditionalFields);
    statusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const open = statusMenu?.hidden;
        if (statusMenu) statusMenu.hidden = !open;
        statusButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    statusMenu?.querySelectorAll('[data-status-value]').forEach(button => button.addEventListener('click', () =>
    {
        const status = button.dataset.statusValue;
        modalBackdrop.querySelector('#addPersonLivingStatus').value = status;
        modalBackdrop.querySelector('#addPersonStatusLabel').textContent = status;
        const dot = modalBackdrop.querySelector('.add-person-status-current .add-person-status-dot');
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        statusMenu.hidden = true;
        statusButton.setAttribute('aria-expanded', 'false');
        statusMenu.querySelectorAll('[data-status-value]').forEach(item =>
        {
            item.classList.toggle('active', item.dataset.statusValue === status);
            item.setAttribute('aria-selected', item.dataset.statusValue === status ? 'true' : 'false');
            const check = item.querySelector('[data-status-check]');
            if (check) check.innerHTML = item.dataset.statusValue === status ? icon.check : '';
        });
        const deathModel = modalBackdrop.querySelector('[data-genealogy-date-field="addPersonDeath"] [data-genealogy-date-model]');
        if (deathModel)
        {
            const currentDeath = normalizeGenealogyDateInput(JSON.parse(deathModel.value || '{}'));
            if (status === 'Deceased' && !currentDeath.date && !currentDeath.dateLabel)
            {
                applyGenealogyDateToField('addPersonDeath', emptyGenealogyDate('Exact date'));
            }

            if (status !== 'Deceased')
            {
                applyGenealogyDateToField('addPersonDeath', emptyGenealogyDate('Exact date'));
            }
        }
        updateAddPersonConditionalFields();
    }));
    modalBackdrop.querySelectorAll('[data-possible-match]').forEach(button => button.addEventListener('click', () => showToast(`Possible match selected: ${button.dataset.possibleMatch}. Connect/merge flow will be added later.`)));
}

function updateAddPersonConditionalFields()
{
    const gender = modalBackdrop.querySelector('#addPersonGender')?.value || 'Unknown';
    const status = modalBackdrop.querySelector('#addPersonLivingStatus')?.value || 'Living';
    const maiden = modalBackdrop.querySelector('#maidenNameField');
    const death = modalBackdrop.querySelector('#deathFieldsGroup');
    if (maiden) maiden.hidden = gender !== 'Female';
    if (death) death.hidden = status !== 'Deceased';
}

function defaultPeopleProfileDetails()
{
    return {
        prefix: '',
        suffix: '',
        maidenName: '',
        alternativeNames: '',
        birthDateType: 'Exact date',
        deathDateType: 'Exact date',
        deathReason: '',
        burialPlace: '',
        educationInstitutionName: '',
        educationInstitutionType: '',
        educationValue: '',
        educationPlace: '',
        educationNotes: '',
        educationFromDate: emptyGenealogyDate('Year only'),
        educationToDate: emptyGenealogyDate('Year only'),
        workCompany: '',
        workOccupation: '',
        workNotes: '',
        workFromDate: emptyGenealogyDate('Exact date'),
        workToDate: emptyGenealogyDate('Exact date'),
        religion: '',
        baptismPlace: '',
        baptismDate: emptyGenealogyDate('Exact date')
    };
}

function valueOrNull(value)
{
    const text = String(value ?? '').trim();
    return text ? text : null;
}

function genealogyDateOrNull(value, fallbackType = 'Exact date')
{
    if (!value) return null;
    const date = normalizeGenealogyDateInput(value, fallbackType);
    return formatGenealogyDateLabel(date) ? date : null;
}

function dateForForm(value, fallbackType = 'Exact date')
{
    return normalizeGenealogyDateInput(value || emptyGenealogyDate(fallbackType), fallbackType);
}

function ensurePersonCentralStructures(person)
{
    if (!person) return null;
    person.profile = person.profile && typeof person.profile === 'object' ? person.profile : {};
    person.attributes = Array.isArray(person.attributes) ? person.attributes : [];
    person.events = Array.isArray(person.events) ? person.events : [];
    person.notes = Array.isArray(person.notes) ? person.notes : [];
    person.citations = Array.isArray(person.citations) ? person.citations : [];
    person.names = person.names || {};
    person.birth = person.birth || emptyGenealogyDate('Exact date');
    person.death = person.death || { ...emptyGenealogyDate('Exact date'), placeId: null, reason: '', cause: '', burialPlaceId: null };
    if (typeof person.birth.placeText === 'undefined') person.birth.placeText = '';
    if (typeof person.birth.address === 'undefined') person.birth.address = '';
    if (typeof person.death.placeText === 'undefined') person.death.placeText = '';
    if (typeof person.death.address === 'undefined') person.death.address = '';
    if (typeof person.death.burialPlaceText === 'undefined') person.death.burialPlaceText = '';
    if (typeof person.death.burialAddress === 'undefined') person.death.burialAddress = '';
    if (typeof person.death.cause === 'undefined') person.death.cause = person.death.reason || '';
    if (typeof person.death.reason === 'undefined') person.death.reason = person.death.cause || '';
    return person;
}

function personAttributeByTag(person, tag)
{
    ensurePersonCentralStructures(person);
    return person?.attributes?.find(attribute => attribute.tag === tag) || null;
}

function upsertPersonAttribute(person, tag, values = {})
{
    ensurePersonCentralStructures(person);
    let attribute = person.attributes.find(item => item.tag === tag);
    if (!attribute)
    {
        attribute = {
            id: `${tag.toLowerCase()}-${person.id}`,
            tag,
            value: '',
            type: '',
            institutionName: '',
            institutionType: '',
            date: null,
            fromDate: null,
            toDate: null,
            placeId: null,
            placeText: '',
            notes: '',
            citations: [],
            mediaIds: []
        };
        person.attributes.push(attribute);
    }
    Object.assign(attribute, values);
    return attribute;
}

function removePersonAttribute(person, tag)
{
    ensurePersonCentralStructures(person);
    person.attributes = person.attributes.filter(attribute => attribute.tag !== tag);
}

function personEventByTag(person, tag)
{
    ensurePersonCentralStructures(person);
    return person?.events?.find(event => event.tag === tag || event.gedcomTag === tag) || null;
}

function upsertPersonEvent(person, tag, values = {})
{
    ensurePersonCentralStructures(person);
    let event = person.events.find(item => item.tag === tag || item.gedcomTag === tag);
    if (!event)
    {
        event = {
            id: `${tag.toLowerCase()}-${person.id}`,
            tag,
            gedcomTag: tag,
            type: tag,
            date: null,
            placeId: null,
            placeText: '',
            notes: '',
            citations: [],
            mediaIds: []
        };
        person.events.push(event);
    }
    Object.assign(event, values, { tag, gedcomTag: tag });
    return event;
}

function removePersonEvent(person, tag)
{
    ensurePersonCentralStructures(person);
    person.events = person.events.filter(event => event.tag !== tag && event.gedcomTag !== tag);
}

function hasTextValue(value)
{
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function hasGenealogyDateValue(value, fallbackType = 'Exact date')
{
    return Boolean(value && formatGenealogyDateLabel(normalizeGenealogyDateInput(value, fallbackType)));
}

function personHasEducationFact(person)
{
    const fact = personAttributeByTag(person, 'EDUC');

    return Boolean(fact && (
        hasTextValue(educationInstitutionLabel(fact))
        || hasTextValue(educationInstitutionTypeLabel(fact))
        || hasTextValue(educationValueLabel(fact))
        || hasTextValue(fact.placeText)
        || hasTextValue(fact.placeId)
        || hasTextValue(fact.notes)
        || hasGenealogyDateValue(fact.fromDate, 'Year only')
        || hasGenealogyDateValue(fact.toDate, 'Year only')
    ));
}

function personHasOccupationFact(person)
{
    const fact = personAttributeByTag(person, 'OCCU');
    return Boolean(fact && (hasTextValue(fact.company) || hasTextValue(fact.value) || hasTextValue(fact.notes) || hasGenealogyDateValue(fact.fromDate, 'Exact date') || hasGenealogyDateValue(fact.toDate, 'Exact date')));
}

function personHasReligionFact(person)
{
    const fact = personAttributeByTag(person, 'RELI');
    return Boolean(fact && hasTextValue(fact.value));
}

function personHasBaptismFact(person)
{
    const event = personEventByTag(person, 'BAPM');
    return Boolean(event && (hasTextValue(event.placeText) || hasTextValue(event.placeId) || hasGenealogyDateValue(event.date, 'Exact date')));
}

function peopleProfileDetailsFor(person)
{
    const centralPerson = ensurePersonCentralStructures(getPerson(person?.id) || person);
    if (!centralPerson) return defaultPeopleProfileDetails();

    return new Proxy({}, {
        get(_target, prop)
        {
            const education = personAttributeByTag(centralPerson, 'EDUC');
            const work = personAttributeByTag(centralPerson, 'OCCU');
            const religion = personAttributeByTag(centralPerson, 'RELI');
            const baptism = personEventByTag(centralPerson, 'BAPM');
            if (prop === 'prefix') return centralPerson.names.prefix || '';
            if (prop === 'suffix') return centralPerson.names.suffix || '';
            if (prop === 'maidenName') return centralPerson.names.maiden || '';
            if (prop === 'alternativeNames') return centralPerson.profile.alternativeNames || '';
            if (prop === 'birthDateType') return centralPerson.birth?.dateType || 'Exact date';
            if (prop === 'deathDateType') return centralPerson.death?.dateType || 'Exact date';
            if (prop === 'deathReason') return centralPerson.death?.cause || centralPerson.death?.reason || '';
            if (prop === 'burialPlace') return editPlaceValue(centralPerson.death?.burialPlaceId, centralPerson.death?.burialPlaceText);
            if (prop === 'educationInstitutionName') return educationInstitutionLabel(education);
            if (prop === 'educationInstitutionType') return educationInstitutionTypeLabel(education) || 'Unknown';
            if (prop === 'educationValue') return educationValueLabel(education);
            if (prop === 'educationPlace') return editPlaceValue(education?.placeId, education?.placeText);
            if (prop === 'educationNotes') return education?.notes || '';
            if (prop === 'educationFromDate') return dateForForm(education?.fromDate, 'Year only');
            if (prop === 'educationToDate') return dateForForm(education?.toDate, 'Year only');
            if (prop === 'workCompany') return work?.company || work?.agency || '';
            if (prop === 'workOccupation') return work?.value || '';
            if (prop === 'workNotes') return work?.notes || '';
            if (prop === 'workFromDate') return dateForForm(work?.fromDate, 'Exact date');
            if (prop === 'workToDate') return dateForForm(work?.toDate, 'Exact date');
            if (prop === 'religion') return religion?.value || '';
            if (prop === 'baptismPlace') return editPlaceValue(baptism?.placeId, baptism?.placeText);
            if (prop === 'baptismDate') return dateForForm(baptism?.date, 'Exact date');
            return undefined;
        },
        set(_target, prop, value)
        {
            if (prop === 'prefix')
            {
                centralPerson.names.prefix = normalizeNameSegment(value); rebuildPersonDisplayName(centralPerson); return true;
            }
            if (prop === 'suffix')
            {
                centralPerson.names.suffix = normalizeNameSegment(value); rebuildPersonDisplayName(centralPerson); return true;
            }

            if (prop === 'maidenName')
            {
                centralPerson.names.maiden = valueOrNull(value) || ''; return true;
            }
            if (prop === 'alternativeNames')
            {
                centralPerson.profile.alternativeNames = valueOrNull(value); return true;
            }
            if (prop === 'birthDateType')
            {
                centralPerson.birth.dateType = value || centralPerson.birth.dateType || 'Exact date'; return true;
            }
            if (prop === 'deathDateType')
            {
                centralPerson.death.dateType = value || centralPerson.death.dateType || 'Exact date'; return true;
            }
            if (prop === 'deathReason')
            {
                centralPerson.death.reason = valueOrNull(value) || ''; centralPerson.death.cause = centralPerson.death.reason; return true;
            }
            if (prop === 'burialPlace')
            {
                const resolved = resolvePlaceAssignment(value, centralPerson.death?.burialPlaceId);
                centralPerson.death.burialPlaceText = resolved.placeText;
                centralPerson.death.burialPlaceId = resolved.placeId;
                centralPerson.death.burialAddress = resolved.address;
                return true;
            }
            if (prop === 'educationInstitutionName')
            {
                upsertPersonAttribute(centralPerson, 'EDUC', {
                    institutionName: valueOrNull(value) || ''
                });
                return true;
            }

            if (prop === 'educationInstitutionType')
            {
                const institutionType = valueOrNull(value) || 'Unknown';

                upsertPersonAttribute(centralPerson, 'EDUC', {
                    institutionType,
                    type: institutionType === 'Unknown' ? '' : institutionType
                });

                return true;
            }

            if (prop === 'educationValue')
            {
                upsertPersonAttribute(centralPerson, 'EDUC', {
                    value: valueOrNull(value) || 'Education'
                });

                return true;
            }
            if (prop === 'educationPlace')
            {
                const attr = upsertPersonAttribute(centralPerson, 'EDUC');
                const resolved = resolvePlaceAssignment(value, attr.placeId);
                attr.placeText = resolved.placeText;
                attr.placeId = resolved.placeId;
                attr.address = resolved.address;
                return true;
            }
            if (prop === 'educationNotes')
            {
                upsertPersonAttribute(centralPerson, 'EDUC', { notes: valueOrNull(value) || '' }); return true;
            }
            if (prop === 'educationFromDate')
            {
                upsertPersonAttribute(centralPerson, 'EDUC', { fromDate: genealogyDateOrNull(value, 'Year only') }); return true;
            }
            if (prop === 'educationToDate')
            {
                upsertPersonAttribute(centralPerson, 'EDUC', { toDate: genealogyDateOrNull(value, 'Year only') }); return true;
            }
            if (prop === 'workCompany')
            {
                upsertPersonAttribute(centralPerson, 'OCCU', { company: valueOrNull(value) || '' }); return true;
            }
            if (prop === 'workOccupation')
            {
                upsertPersonAttribute(centralPerson, 'OCCU', { value: valueOrNull(value) || '' }); return true;
            }
            if (prop === 'workNotes')
            {
                upsertPersonAttribute(centralPerson, 'OCCU', { notes: valueOrNull(value) || '' }); return true;
            }
            if (prop === 'workFromDate')
            {
                upsertPersonAttribute(centralPerson, 'OCCU', { fromDate: genealogyDateOrNull(value, 'Exact date') }); return true;
            }
            if (prop === 'workToDate')
            {
                upsertPersonAttribute(centralPerson, 'OCCU', { toDate: genealogyDateOrNull(value, 'Exact date') }); return true;
            }
            if (prop === 'religion')
            {
                upsertPersonAttribute(
                    centralPerson,
                    'RELI',
                    {
                        value: normalizeReligionValue(value)
                    }
                );

                return true;
            }
            if (prop === 'baptismPlace')
            {
                const event = upsertPersonEvent(centralPerson, 'BAPM');
                const resolved = resolvePlaceAssignment(value, event.placeId);
                event.placeText = resolved.placeText;
                event.placeId = resolved.placeId;
                event.address = resolved.address;
                return true;
            }
            if (prop === 'baptismDate')
            {
                upsertPersonEvent(centralPerson, 'BAPM', { date: genealogyDateOrNull(value, 'Exact date') }); return true;
            }
            return true;
        }
    });
}

function profileDetailDateLabel(input, fallback = '-')
{
    return formatGenealogyDateLabel(input) || fallback;
}

const SHARED_FILTER_UNKNOWN_VALUE =
    '__unknown__';

function normalizeSharedFilterSearch(
    value
)
{
    return String(value || '')
        .normalize('NFKD')
        .replace(
            /\p{Diacritic}/gu,
            ''
        )
        .trim()
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function normalizeSharedFilterYearRange(
    value
)
{
    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const requestedMode =
        String(
            source.mode || ''
        ).toLowerCase();

    const mode =
        [
            'before',
            'after',
            'between'
        ].includes(requestedMode)
            ? requestedMode
            : '';

    return {
        mode,

        from:
          String(
              source.from ?? ''
          ).trim(),

        to:
          String(
              source.to ?? ''
          ).trim()
    };
}

function sharedFilterYearNumber(
    value
)
{
    const text =
        String(value ?? '')
            .trim();

    if (
        !/^\d{1,4}$/.test(text)
    )
    {
        return null;
    }

    const year =
        Number(text);

    return (
        Number.isInteger(year)
        && year >= 1
        && year <= 9999
    )
        ? year
        : null;
}

function sharedFilterYearRangeError(
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (!range.mode)
    {
        return '';
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    if (fromYear == null)
    {
        return translateText(
            range.mode === 'between'
                ? 'Enter a valid starting year.'
                : 'Enter a valid year.'
        );
    }

    if (
        range.mode !== 'between'
    )
    {
        return '';
    }

    const toYear =
        sharedFilterYearNumber(
            range.to
        );

    if (toYear == null)
    {
        return translateText(
            'Enter a valid ending year.'
        );
    }

    if (fromYear > toYear)
    {
        return translateText(
            'The starting year must not be later than the ending year.'
        );
    }

    return '';
}

function sharedFilterYearRangeLabel(
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (
        range.mode === 'before'
    )
    {
        return `${
            translateText('Before')
        } ${range.from}`;
    }

    if (
        range.mode === 'after'
    )
    {
        return `${
            translateText('After')
        } ${range.from}`;
    }

    if (
        range.mode === 'between'
    )
    {
        return `${
            range.from
        }–${
            range.to
        }`;
    }

    return '';
}

function sharedFilterYearMatches(
    yearValue,
    rangeValue
)
{
    const range =
        normalizeSharedFilterYearRange(
            rangeValue
        );

    if (
        !range.mode
        || sharedFilterYearRangeError(
            range
        )
    )
    {
        return true;
    }

    const year =
        sharedFilterYearNumber(
            yearValue
        );

    if (year == null)
    {
        return false;
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    if (
        range.mode === 'before'
    )
    {
        return year < fromYear;
    }

    if (
        range.mode === 'after'
    )
    {
        return year > fromYear;
    }

    const toYear =
        sharedFilterYearNumber(
            range.to
        );

    return (
        year >= fromYear
        && year <= toYear
    );
}

function cloneSharedFilterValues(
    schema,
    source = {}
)
{
    const result = {};

    schema.forEach(definition =>
    {
        const fallback =
            definition.control
            === 'year-range'
                ? definition.defaultValue
              || {}
                : definition.multiple
                    ? []
                    : definition.defaultValue
                ?? '';

        const sourceValue =
            Object.prototype
                .hasOwnProperty.call(
                    source || {},
                    definition.key
                )
                ? source[
                    definition.key
                ]
                : fallback;

        if (
            definition.control
            === 'year-range'
        )
        {
            result[
                definition.key
            ] =
                normalizeSharedFilterYearRange(
                    sourceValue
                );

            return;
        }

        result[
            definition.key
        ] =
            definition.multiple
                ? [
                    ...new Set(
                        (
                            Array.isArray(sourceValue)
                                ? sourceValue
                                : sourceValue
                                    ? [sourceValue]
                                    : []
                        )
                            .map(value =>
                                String(value)
                            )
                            .filter(Boolean)
                    )
                ]
                : sourceValue
              ?? fallback;
    });

    return result;
}

function sharedFilterOptions(
    definition
)
{
    const source =
        typeof definition.getOptions
          === 'function'
            ? definition.getOptions()
            : definition.options
            || [];

    return source.map(option =>
    {
        if (
            typeof option === 'string'
        )
        {
            return {
                value:
              option,

                label:
              option
            };
        }

        return {
            value:
            String(
                option?.value
              ?? ''
            ),

            label:
            String(
                option?.label
              ?? option?.value
              ?? ''
            ),

            keywords:
            Array.isArray(
                option?.keywords
            )
                ? option.keywords
                : [],

            count:
            Number.isFinite(
                Number(option?.count)
            )
                ? Number(option.count)
                : null
        };
    });
}

function sharedFilterDefinitionByKey(
    schema,
    key
)
{
    return schema.find(
        definition =>
            definition.key === key
    ) || null;
}

function sharedFilterValueIsActive(
    definition,
    value
)
{
    if (!definition)
    {
        return false;
    }

    if (
        definition.control
          === 'year-range'
    )
    {
        const range =
            normalizeSharedFilterYearRange(
                value
            );

        return Boolean(
            range.mode
          && !sharedFilterYearRangeError(
              range
          )
        );
    }

    if (definition.multiple)
    {
        return (
            Array.isArray(value)
          && value.length > 0
        );
    }

    if (
        definition.control === 'boolean'
    )
    {
        return Boolean(value);
    }

    return (
        String(value ?? '')
        !== String(
            definition.defaultValue
          ?? ''
        )
    );
}

function sharedFilterOptionLabel(
    definition,
    value
)
{
    const option =
        sharedFilterOptions(
            definition
        ).find(item =>
            item.value === String(value)
        );

    return translateText(
        option?.label
        || String(value || '')
    );
}

function sharedFilterDisplayValue(
    definition,
    value
)
{
    if (
        definition?.control
          === 'year-range'
    )
    {
        return sharedFilterYearRangeLabel(
            value
        );
    }
    if (
        definition?.multiple
    )
    {
        const values =
            Array.isArray(value)
                ? value
                : [];

        if (!values.length)
        {
            return '';
        }

        const labels =
            values.map(item =>
                sharedFilterOptionLabel(
                    definition,
                    item
                )
            );

        if (labels.length === 1)
        {
            return labels[0];
        }

        return `${
            labels[0]
        } +${
            labels.length - 1
        }`;
    }

    return sharedFilterOptionLabel(
        definition,
        value
    );
}

function sharedFilterOptionStatus(
    count
)
{
    if (
        state.language === 'ru'
    )
    {
        const rule =
            new Intl.PluralRules('ru')
                .select(count);

        const word =
            rule === 'one'
                ? 'вариант'
                : rule === 'few'
                    ? 'варианта'
                    : 'вариантов';

        return `${count} ${word}`;
    }

    return `${count} ${
        count === 1
            ? 'option'
            : 'options'
    } available`;
}

function sharedFilterRemoveValueLabel(
    label
)
{
    return state.language === 'ru'
        ? `Удалить: ${label}`
        : `Remove ${label}`;
}

function sharedFilterSafeId(
    value
)
{
    return String(value || '')
        .replace(
            /[^a-z0-9_-]+/gi,
            '-'
        );
}

function renderSharedFilterFields({
    schema,
    values,
    prefix
})
{
    const normalized =
        cloneSharedFilterValues(
            schema,
            values
        );

    const fields =
        schema.map(definition =>
        {
            const fieldId =
                `${prefix}-${
                    sharedFilterSafeId(
                        definition.key
                    )
                }`;

            const fieldClass =
                definition.layout === 'full'
                    ? 'shared-filter-field shared-filter-field--full'
                    : 'shared-filter-field';

            if (
                definition.control === 'combobox'
            )
            {
                const listboxId =
                    `${fieldId}-listbox`;

                return `
              <div
                class="${fieldClass}">

                <label
                  for="${escapeHtml(fieldId)}">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </label>

                <div
                  class="shared-filter-combobox"
                  data-shared-filter-combobox="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  <div
                    class="shared-filter-selected"
                    data-shared-filter-selected
                    hidden>
                  </div>

                  <div
                    class="
                      shared-filter-combobox-input
                    ">

                    ${icon.search}

                    <input
                      id="${escapeHtml(fieldId)}"
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded="false"
                      aria-controls="${
                            escapeHtml(
                                listboxId
                            )
                        }"
                      autocomplete="off"
                      placeholder="${
                            escapeHtml(
                                translateText(
                                    definition.placeholder
                            || 'Search'
                                )
                            )
                        }"
                      data-shared-filter-input>

                    <button
                      class="
                        shared-filter-combobox-toggle
                      "
                      type="button"
                      aria-label="${
                            escapeHtml(
                                translateText(
                                    'Open options'
                                )
                            )
                        }"
                      data-shared-filter-toggle>

                      ${icon.chevron}
                    </button>
                  </div>

                  <div
                    class="shared-filter-listbox"
                    id="${escapeHtml(listboxId)}"
                    role="listbox"
                    ${
                        definition.multiple
                            ? 'aria-multiselectable="true"'
                            : ''
                    }
                    data-shared-filter-listbox
                    hidden>
                  </div>

                  <span
                    class="
                      shared-filter-visually-hidden
                    "
                    aria-live="polite"
                    data-shared-filter-status>
                  </span>
                </div>
              </div>
            `;
            }
            if (
                definition.control
              === 'year-range'
            )
            {
                const range =
                    normalizeSharedFilterYearRange(
                        normalized[
                            definition.key
                        ]
                    );

                const isBetween =
                    range.mode === 'between';

                const error =
                    sharedFilterYearRangeError(
                        range
                    );

                const errorId =
                    `${fieldId}-error`;

                return `
              <div
                class="
                  ${fieldClass}
                  shared-filter-year-field
                ">
                <label id="${escapeHtml(fieldId)}-label">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </label>

                <div
                  class="shared-filter-year-range"
                  data-shared-filter-year-range="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  <div
                    class="
                      shared-filter-year-controls
                      ${range.mode ? '' : 'is-empty'}
                      ${isBetween ? 'is-between' : ''}
                    "
                    data-shared-filter-year-controls>

                    <div class="common-select-shell">
                      <select
                        class="compact-select common-select"
                        aria-labelledby="${escapeHtml(fieldId)}-label"
                        data-shared-filter-year-mode>

                        <option
                          value=""
                          ${range.mode ? '' : 'selected'}>

                          ${escapeHtml(
                                translateText(
                                    'Any year'
                                )
                            )}
                        </option>

                        <option
                          value="before"
                          ${
                                range.mode === 'before'
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'Before'
                                )
                            )}
                        </option>

                        <option
                          value="after"
                          ${
                                range.mode === 'after'
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'After'
                                )
                            )}
                        </option>

                        <option
                          value="between"
                          ${
                                isBetween
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'Between'
                                )
                            )}
                        </option>
                      </select>

                      <span
                        class="common-select-chevron"
                        aria-hidden="true">

                        ${icon.chevron}
                      </span>
                    </div>

                    <label
                      class="shared-filter-year-input-shell"
                      data-shared-filter-year-from-shell
                      ${range.mode ? '' : 'hidden'}>

                      <span
                        class="shared-filter-visually-hidden"
                        data-shared-filter-year-from-label>

                        ${escapeHtml(
                            translateText(
                                isBetween
                                    ? 'Year from'
                                    : 'Year'
                            )
                        )}
                      </span>

                      <input
                        class="shared-filter-year-input"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        placeholder="${
                            escapeHtml(
                                translateText(
                                    isBetween
                                        ? 'From'
                                        : 'Year'
                                )
                            )
                        }"
                        value="${escapeHtml(range.from)}"
                        aria-describedby="${escapeHtml(errorId)}"
                        data-shared-filter-year-from>
                    </label>

                    <label
                      class="shared-filter-year-input-shell"
                      data-shared-filter-year-to-shell
                      ${isBetween ? '' : 'hidden'}>

                      <span
                        class="shared-filter-visually-hidden">

                        ${escapeHtml(
                            translateText(
                                'Year to'
                            )
                        )}
                      </span>

                      <input
                        class="shared-filter-year-input"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        placeholder="${
                            escapeHtml(
                                translateText('To')
                            )
                        }"
                        value="${escapeHtml(range.to)}"
                        aria-describedby="${escapeHtml(errorId)}"
                        data-shared-filter-year-to>
                    </label>
                  </div>

                  <p
                    class="shared-filter-field-error"
                    id="${escapeHtml(errorId)}"
                    role="alert"
                    data-shared-filter-year-error
                    ${error ? '' : 'hidden'}>
                    ${escapeHtml(error)}
                  </p>
                </div>
              </div>
            `;
            }
            if (
                definition.control === 'boolean'
            )
            {
                return `
              <div
                class="
                  ${fieldClass}
                  shared-filter-boolean-field
                ">

                <span
                  class="
                    shared-filter-boolean-title
                  ">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </span>

                <label
                  class="
                    shared-filter-boolean-control
                  ">

                  <input
                    type="checkbox"
                    data-shared-filter-boolean="${
                        escapeHtml(
                            definition.key
                        )
                    }"
                    ${
                        normalized[
                            definition.key
                        ]
                            ? 'checked'
                            : ''
                    }>

                  <span>
                    ${escapeHtml(
                        translateText(
                            definition.checkboxLabel
                        || definition.label
                        )
                    )}
                  </span>
                </label>
              </div>
            `;
            }

            const options =
                sharedFilterOptions(
                    definition
                );

            return `
            <div class="${fieldClass}">
              <label
                for="${escapeHtml(fieldId)}">
                ${escapeHtml(
                    translateText(
                        definition.label
                    )
                )}
              </label>

              <div class="common-select-shell">
                <select
                  class="compact-select common-select"
                  id="${escapeHtml(fieldId)}"
                  data-shared-filter-select="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  ${options.map(option => `
                    <option
                      value="${
                            escapeHtml(
                                option.value
                            )
                        }"
                      ${
                            String(
                                normalized[
                                    definition.key
                                ]
                            ) === option.value
                                ? 'selected'
                                : ''
                        }>

                      ${escapeHtml(
                            translateText(
                                option.label
                            )
                        )}
                    </option>
                  `).join('')}
                </select>

                <span
                  class="common-select-chevron"
                  aria-hidden="true">

                  ${icon.chevron}
                </span>
              </div>
            </div>
          `;
        }).join('');

    return `
        <div
          class="shared-filter-fields"
          data-shared-filter-root="${
                escapeHtml(prefix)
            }">

          ${fields}
        </div>
      `;
}

