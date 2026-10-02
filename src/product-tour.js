const GENEO_TOUR_STORAGE_KEY = 'geneograph.productTour';
const GENEO_TOUR_VERSION = 2;
const GENEO_TOUR_PROJECT_ID = 'p1';
const geneoTourSteps = [
    { id: 'projects', module: 'Projects', title: 'Everything starts with a project', body: "A project brings one family's tree, records, photographs, and research together. Open the sample project to explore." },
    { id: 'tree-group', module: 'Family Tree', title: 'Follow the connections', body: 'See Silver and his relatives across generations. Focus on a person to explore a different branch.' },
    { id: 'tree-sidebar', module: 'Family Tree', title: 'Details stay connected', body: 'The selected person’s details and linked records stay beside the tree.' },
    { id: 'tree-relative', module: 'Family Tree', title: 'Add or connect a relative', body: 'Choose a relationship to add someone new or connect a person already in the project. This is a read-only preview.' },
    { id: 'tree-edit', module: 'Family Tree', title: 'Quick edit a person', body: 'Edit names and life events without leaving the tree. This is a read-only preview.' },
    { id: 'people-navigation', module: 'People', title: 'Explore People', body: 'Use the navigation to move between the directory and a person’s full profile.' },
    { id: 'people-list', module: 'People', title: 'Find people in the directory', body: 'Search the directory and select a person to see their details alongside the list.' },
    { id: 'people-profile', module: 'People', title: "A person's story in one place", body: 'Their profile brings together relationships, photographs, files, notes, and places.' },
    { id: 'albums-navigation', module: 'Albums', title: 'Browse albums', body: 'Albums organize photographs into groups you can explore together.' },
    { id: 'albums-photo', module: 'Albums', title: 'Explore a photograph', body: 'Select a photo to see it in the album and inspect its context.' },
    { id: 'albums-context', module: 'Albums', title: 'Keep photographs in context', body: 'The detail panel connects a photograph to its caption, people, and place.' },
    { id: 'archive-navigation', module: 'Archive', title: 'Find your evidence', body: 'Browse folders and sources from the Archive navigation.' },
    { id: 'archive-file', module: 'Archive', title: 'Keep the evidence close', body: 'Select a file from the main list to inspect the record you collected.' },
    { id: 'archive-context', module: 'Archive', title: 'Trace a file’s context', body: 'The file panel shows connected records and source information, including where evidence came from.' },
    { id: 'notes-list', module: 'Notes', title: 'Choose a research note', body: 'All notes keeps observations and open questions easy to find.' },
    { id: 'notes-editor', module: 'Notes', title: 'Record questions and discoveries', body: 'Write research notes alongside the people, places, and evidence they concern.' },
    { id: 'places-navigation', module: 'Places', title: 'Browse places', body: 'Find the locations connected to this family from the Places navigation.' },
    { id: 'places-map', module: 'Places', title: 'Put the story on a map', body: 'Explore where family events happened. The selected place remains available even when map tiles are unavailable.' },
    { id: 'places-people', module: 'Places', title: 'See connected people', body: 'The place inspector shows the people and events linked to this location.' },
    { id: 'geneograph-toolbar', module: 'Geneograph', title: 'Choose your tools', body: 'The toolbar gives you tools to navigate, add, connect, and arrange board objects.' },
    { id: 'geneograph-board', module: 'Geneograph', title: 'Connect ideas visually', body: 'Arrange people and evidence on a canvas to explore relationships and research questions.' },
    { id: 'geneograph-settings', module: 'Geneograph', title: 'Shape the board', body: 'Canvas settings let you adjust the board’s appearance while keeping the research connected.' }
];
const geneoTourModules = [...new Set(geneoTourSteps.map(step => step.module))];

const geneoTourRuntime = {
    active: false,
    invited: false,
    transitioning: false,
    index: -1,
    token: 0,
    root: null,
    target: null,
    fallback: false,
    origin: null,
    returnFocus: null,
    observer: null,
    resizeObserver: null,
    positionFrame: 0,
    mobileScrollAdjusted: false,
    history: [],
    ownedPreview: null,
    openingPreview: false
};

function geneoTourReadStatus()
{
    try
    {
        const value = JSON.parse(localStorage.getItem(GENEO_TOUR_STORAGE_KEY) || 'null');
        return value?.version === GENEO_TOUR_VERSION ? value.status : 'unseen';
    }
    catch (_error)
    {
        return 'unseen';
    }
}

function geneoTourWriteStatus(status)
{
    try
    {
        localStorage.setItem(GENEO_TOUR_STORAGE_KEY, JSON.stringify({ version: GENEO_TOUR_VERSION, status }));
    }
    catch (_error)
    {
        // The session flag still prevents a repeated invitation.
    }
}

function geneoTourCaptureOrigin()
{
    if (state.activeModule === 'Family Tree') captureTreeCanvasScroll(state.currentProjectId);
    if (state.activeModule === 'Geneograph' && state.geneoView === 'board') captureGeneographViewport();
    const values = structuredClone(state);
    const scroll = {};
    ['.main', '.tree-canvas', '[data-geneo-canvas-wrap]', '.notes-browser-scroll',
        '.albums-sidebar', '.albums-detail', '.archive-sidebar', '.archive-inspector-scroll',
        '.places-sidebar', '.places-inspector'].forEach(selector =>
    {
        const element = document.querySelector(selector);
        if (element) scroll[selector] = { x: element.scrollLeft, y: element.scrollTop };
    });
    return { values, scroll };
}

function geneoTourRestoreOrigin(origin)
{
    if (!origin) return;
    Object.entries(origin.values).forEach(([key, value]) => { state[key] = structuredClone(value); });
    render();
    requestAnimationFrame(() =>
    {
        Object.entries(origin.scroll).forEach(([selector, point]) =>
        {
            const element = document.querySelector(selector);
            if (element) element.scrollTo(point.x, point.y);
        });
    });
}

function maybeOfferGeneoProductTour()
{
    if (geneoTourRuntime.active || geneoTourRuntime.invited || geneoTourReadStatus() !== 'unseen') return;
    if (state.activeModule !== 'Projects' || state.projectOpen) return;
    requestAnimationFrame(() =>
    {
        if (geneoTourRuntime.active || geneoTourRuntime.invited || state.projectOpen
            || state.activeModule !== 'Projects' || modalBackdrop.classList.contains('open')) return;
        geneoTourRuntime.invited = true;
        geneoTourWriteStatus('skipped');
        startGeneoProductTour();
    });
}

function startGeneoProductTour()
{
    if (geneoTourRuntime.active || modalBackdrop.classList.contains('open')) return false;
    if (!validProjectById(GENEO_TOUR_PROJECT_ID)) return false;
    geneoTourRuntime.origin = geneoTourCaptureOrigin();
    geneoTourRuntime.returnFocus = document.querySelector('[data-topbar-help]');
    geneoTourRuntime.active = true;
    geneoTourRuntime.invited = true;
    geneoTourRuntime.history = [];
    document.addEventListener('keydown', geneoTourOnKeydown, true);
    closeMenu();
    closeTopbarPopover();
    geneoTourRuntime.transitioning = true;
    state.activeModule = 'Projects';
    state.projectOpen = false;
    render();
    geneoTourRuntime.transitioning = false;
    geneoTourMoveTo(-1);
    return true;
}

function geneoTourPrepare(index)
{
    const step = geneoTourSteps[index];
    if (index === 0)
    {
        state.activeModule = 'Projects';
        state.projectOpen = false;
        state.search = '';
        render();
        return;
    }

    activateProject(GENEO_TOUR_PROJECT_ID, { moduleName: step.module, renderNow: false });
    if (step.module === 'Family Tree')
    {
        treeProjectViewState(GENEO_TOUR_PROJECT_ID).focusPersonId = 'silver';
        state.selectedPersonId = 'silver';
    }
    if (step.module === 'People')
    {
        state.peopleView = step.id === 'people-profile' ? 'profile' : 'directory';
        state.peopleSide = step.id === 'people-profile' ? 'profile' : 'people';
        state.selectedPeopleId = 'silver';
        state.selectedPersonId = 'silver';
        state.peopleSearch = '';
        state.peoplePreviewCollapsed = false;
    }
    if (step.module === 'Albums')
    {
        state.albumsView = 'album';
        state.activeAlbumId = 'al-family';
        state.albumsSearch = '';
        state.selectedPhotoId = 'photo-young-family';
        state.albumsDetailCollapsed = false;
    }
    if (step.module === 'Archive')
    {
        state.archiveView = 'files';
        state.archiveSelectedFolderId = 'certificates';
        state.archiveSelectedFileId = 'af5';
        state.archiveInspectorCollapsed = false;
        if (state.archiveInspectorSections) state.archiveInspectorSections.sources = true;
    }
    if (step.module === 'Notes')
    {
        state.notesView = 'all';
        state.selectedNoteId = 'note-silver-luna-marriage';
        state.notesRightCollapsed = false;
        state.notesMobilePane = step.id === 'notes-list' ? 'browser' : 'editor';
        state.notesSearch = '';
    }
    if (step.module === 'Places')
    {
        state.placesView = 'all';
        state.placesViewMode = 'map';
        state.selectedPlaceId = 'place-meowbridge';
        state.placesInspectorCollapsed = false;
    }
    if (step.module === 'Geneograph')
    {
        openGeneographBoard('gb1');
        return;
    }
    render();
}

function geneoTourTarget(index)
{
    const id = geneoTourSteps[index]?.id;
    const selectors = {
        projects: '[data-project-id="p1"]',
        'tree-group': '.tree-person-card[data-person-id="silver"]',
        'tree-sidebar': '.tree-inspector',
        'tree-relative': '#relativePopover',
        'tree-edit': '#modalBackdrop .add-person-modal section:first-of-type',
        'people-navigation': '.side-nav [data-people-side="people"]',
        'people-list': '[data-people-row="silver"]',
        'people-profile': '.profile-hero',
        'albums-navigation': '[data-album-open="al-family"]',
        'albums-photo': '[data-photo-id="photo-young-family"]',
        'albums-context': '.albums-detail',
        'archive-navigation': '.archive-sidebar',
        'archive-file': '[data-archive-file-row="af5"]',
        'archive-context': '#archive-file-section-sources',
        'notes-list': '.notes-browser-pane',
        'notes-editor': '.notes-editor-card',
        'places-navigation': '.places-sidebar',
        'places-map': '.places-map-panel',
        'places-people': '.places-inspector-person-groups',
        'geneograph-toolbar': '.geneo-editor-toolbar',
        'geneograph-board': '[data-geneo-node="gn-panel"]',
        'geneograph-settings': '.geneo-inspector'
    };
    const target = document.querySelector(selectors[id]);
    if (id === 'places-map' && (!target || !target.getBoundingClientRect().width))
        return document.querySelector('[data-places-inspector] .places-inspector-summary');
    if (target?.getBoundingClientRect().width) return target;
    if (id === 'people-list') return document.querySelector('[data-person-sidebar-context="people"]');
    if (id === 'places-people') return document.querySelector('[data-places-inspector]');
    return target;
}

function geneoTourFirstVisible(...selectors)
{
    return selectors.map(selector => main.querySelector(selector))
        .find(element => element?.getBoundingClientRect().width > 0) || null;
}

function geneoTourWaitForTarget(index, token)
{
    return new Promise(resolve =>
    {
        let observer = null;
        let timer = null;
        const check = () =>
        {
            if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return finish(null);
            const target = geneoTourTarget(index);
            if (target?.isConnected && target.getBoundingClientRect().width > 0) finish(target);
        };
        const finish = target =>
        {
            observer?.disconnect();
            clearTimeout(timer);
            resolve(target);
        };
        observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        timer = setTimeout(() => finish(null), 2500);
        check();
    });
}

function geneoTourDestroyOverlay({ keepInert = false } = {})
{
    geneoTourRuntime.observer?.disconnect();
    geneoTourRuntime.resizeObserver?.disconnect();
    geneoTourRuntime.observer = null;
    geneoTourRuntime.resizeObserver = null;
    cancelAnimationFrame(geneoTourRuntime.positionFrame);
    geneoTourRuntime.root?.remove();
    geneoTourRuntime.root = null;
    if (!keepInert)
    {
        document.querySelector('.app').inert = false;
        modalBackdrop.inert = false;
    }
    document.removeEventListener('scroll', geneoTourQueuePosition, true);
    window.removeEventListener('resize', geneoTourQueuePosition);
}

function geneoTourClosePreview()
{
    if (geneoTourRuntime.ownedPreview === 'relative')
        closeMenu();
    if (geneoTourRuntime.ownedPreview === 'modal' && modalBackdrop.classList.contains('open'))
        closeModal({ force: true });
    geneoTourRuntime.ownedPreview = null;
}

function geneoTourOpenPreview(step)
{
    if (step.id === 'tree-relative')
    {
        const anchor = document.querySelector('#addRelative');
        if (!anchor) return;
        openRelativePopover(anchor, 'silver');
        const popover = document.querySelector('#relativePopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = 'relative';
        }
    }
    if (step.id === 'tree-edit')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openEditPersonModal('silver');
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
}

function geneoTourClose({ completed = false, offerRestore = true } = {})
{
    if (!geneoTourRuntime.active) return;
    const index = geneoTourRuntime.index;
    const origin = geneoTourRuntime.origin;
    geneoTourRuntime.active = false;
    geneoTourRuntime.token += 1;
    geneoTourRuntime.transitioning = false;
    geneoTourClosePreview();
    geneoTourDestroyOverlay();
    document.removeEventListener('keydown', geneoTourOnKeydown, true);
    geneoTourWriteStatus(completed ? 'completed' : 'skipped');
    const focusTarget = geneoTourRuntime.returnFocus?.isConnected
        ? geneoTourRuntime.returnFocus : document.querySelector('[data-topbar-help]');
    focusTarget?.focus({ preventScroll: true });
    if (!completed && offerRestore && index < 0 && origin)
        geneoTourRestoreOrigin(origin);
    else if (!completed && offerRestore && index >= 0 && origin)
    {
        showActionToast({
            message: t('Tour closed.'),
            actions: [{ label: t('Return to where you were'), onClick: () => geneoTourRestoreOrigin(origin) }],
            duration: 9000
        });
    }
}

function geneoTourOnKeydown(event)
{
    if (!geneoTourRuntime.active) return;
    if (event.key === 'Escape')
    {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (geneoTourRuntime.root?.classList.contains('is-module-map')) geneoTourCloseModuleMap();
        else geneoTourClose();
        return;
    }
    if (!geneoTourRuntime.root) return;
    if (event.key === 'Tab')
    {
        const controls = [...geneoTourRuntime.root.querySelectorAll('button:not([disabled])')]
            .filter(control => control.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first)
        {
            event.preventDefault();
            last?.focus();
        }
        else if (!event.shiftKey && document.activeElement === last)
        {
            event.preventDefault();
            first?.focus();
        }
    }
    event.stopPropagation();
}

function geneoTourCardCopy()
{
    const index = geneoTourRuntime.index;
    const step = geneoTourSteps[index];
    const title = index < 0 ? 'Explore a family story'
        : index >= geneoTourSteps.length ? 'Your turn to explore' : step.title;
    const body = index < 0
        ? 'Follow a sample family across eight connected modules. You can skip a section at any time.'
        : index >= geneoTourSteps.length
            ? 'The tour is complete. Return to any module and follow the connections that interest you.'
            : step.body;
    return { title: t(title), body: t(body) };
}

function geneoTourOpenModuleMap()
{
    const root = geneoTourRuntime.root;
    if (!root || geneoTourRuntime.transitioning) return;
    root.classList.add('is-module-map', 'is-unanchored');
    root.querySelector('[data-geneo-tour-step-view]').hidden = true;
    root.querySelector('[data-geneo-tour-map-view]').hidden = false;
    root.querySelector('.geneo-tour-card').setAttribute('aria-labelledby', 'geneoTourMapTitle');
    root.querySelector('.geneo-tour-card').removeAttribute('aria-describedby');
    geneoTourPosition();
    const current = root.querySelector('[data-geneo-tour-module].is-current');
    const list = root.querySelector('.geneo-tour-map-list');
    if (current)
    {
        list.scrollTop = current.offsetTop - list.offsetTop - (list.clientHeight - current.offsetHeight) / 2;
        current.focus({ preventScroll: true });
    }
}

function geneoTourCloseModuleMap()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    root.classList.remove('is-module-map', 'is-unanchored');
    root.querySelector('[data-geneo-tour-step-view]').hidden = false;
    root.querySelector('[data-geneo-tour-map-view]').hidden = true;
    root.querySelector('.geneo-tour-card').setAttribute('aria-labelledby', 'geneoTourTitle');
    root.querySelector('.geneo-tour-card').setAttribute('aria-describedby', 'geneoTourBody');
    geneoTourPosition();
    root.querySelector('[data-geneo-tour-action="browse-modules"]')?.focus({ preventScroll: true });
}

function geneoTourRefreshCopy()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const { title, body } = geneoTourCardCopy();
    root.querySelector('[data-geneo-tour-title]').textContent = title;
    root.querySelector('[data-geneo-tour-body]').textContent = body;
    const moduleName = root.querySelector('[data-geneo-tour-module-name]');
    if (moduleName)
    {
        const currentModule = geneoTourSteps[geneoTourRuntime.index].module;
        moduleName.textContent = t(currentModule);
        const browse = root.querySelector('[data-geneo-tour-action="browse-modules"]');
        browse.setAttribute('aria-label', t('Browse modules'));
        browse.title = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-title]').textContent = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-return]').textContent = t('Return to tour');
        root.querySelectorAll('[data-geneo-tour-module]').forEach(button =>
        {
            const isCurrent = button.dataset.geneoTourModule === currentModule;
            button.querySelector('span').textContent = t(button.dataset.geneoTourModule);
            button.classList.toggle('is-current', isCurrent);
            if (isCurrent) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    }
    root.querySelectorAll('[data-geneo-tour-label]').forEach(button =>
    {
        const nextModule = geneoTourSteps[geneoTourRuntime.index + 1]?.module;
        const currentModule = geneoTourSteps[geneoTourRuntime.index]?.module;
        button.textContent = button.dataset.geneoTourAction === 'next' && nextModule && nextModule !== currentModule
            ? t('Continue to {module}').replace('{module}', t(nextModule))
            : t(button.dataset.geneoTourLabel);
    });
    root.querySelector('.geneo-tour-close').setAttribute('aria-label', t('Skip tour'));
    geneoTourQueuePosition();
}

function geneoTourRenderOverlay(target = null)
{
    geneoTourDestroyOverlay({ keepInert: true });
    const index = geneoTourRuntime.index;
    const centered = index < 0 || index >= geneoTourSteps.length;
    const actions = centered
        ? index < 0
            ? [['dismiss', 'Explore on my own'], ['start', 'Start tour']]
            : [['finish', 'Explore the demo']]
        : [['back', 'Back'], ['next', index === geneoTourSteps.length - 1 ? 'Finish tour' : 'Next']];
    const root = document.createElement('div');
    root.className = `geneo-tour${centered ? ' is-centered' : ''}${index < 0 ? ' is-welcome' : ''}`;
    root.dataset.geneoTour = '';
    root.innerHTML = `
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block></div>
        <section class="geneo-tour-card" role="dialog" aria-modal="true" aria-labelledby="geneoTourTitle" aria-describedby="geneoTourBody">
            <div class="geneo-tour-card-head">
                ${centered ? '' : `<div class="geneo-tour-chapter"><span data-geneo-tour-module-name aria-live="polite"></span><button class="geneo-tour-browse" type="button" data-geneo-tour-action="browse-modules">${icon.grid}</button></div>`}
                <button class="geneo-tour-close" type="button" aria-label="${escapeHtml(t('Skip tour'))}" data-geneo-tour-action="skip">${icon.close}</button>
            </div>
            <div data-geneo-tour-step-view>
                ${index < 0 ? `<div class="geneo-tour-welcome"><span class="geneo-tour-brand">${icon.logo}<strong>GeneoGraph</strong></span><div class="geneo-tour-cover" aria-hidden="true"></div></div>` : ''}
                <h2 id="geneoTourTitle" data-geneo-tour-title></h2>
                <p id="geneoTourBody" data-geneo-tour-body></p>
                <p class="geneo-tour-fallback" data-geneo-tour-fallback hidden>${escapeHtml(t('This part of the sample is unavailable. Continue to the next stop.'))}</p>
                <div class="geneo-tour-actions">${actions.map(([action, label]) => `<button class="button ${action === 'next' || action === 'start' || action === 'finish' ? 'primary' : 'secondary'}" type="button" data-geneo-tour-action="${action}" data-geneo-tour-label="${escapeHtml(label)}"></button>`).join('')}</div>
            </div>
            ${centered ? '' : `<div class="geneo-tour-map" data-geneo-tour-map-view hidden><h2 id="geneoTourMapTitle" data-geneo-tour-map-title></h2><div class="geneo-tour-map-list">${geneoTourModules.map(module => `<button type="button" data-geneo-tour-module="${escapeHtml(module)}"><span></span></button>`).join('')}</div><button class="geneo-tour-map-return" type="button" data-geneo-tour-action="return-to-tour" data-geneo-tour-map-return></button></div>`}
        </section>`;
    document.body.appendChild(root);
    geneoTourRuntime.root = root;
    geneoTourRuntime.target = target;
    document.querySelector('.app').inert = true;
    modalBackdrop.inert = true;
    document.addEventListener('scroll', geneoTourQueuePosition, true);
    window.addEventListener('resize', geneoTourQueuePosition);
    root.querySelectorAll('[data-geneo-tour-action]').forEach(button => button.addEventListener('click', () =>
    {
        const action = button.dataset.geneoTourAction;
        if (action === 'dismiss' || action === 'skip') geneoTourClose();
        else if (action === 'finish') geneoTourClose({ completed: true, offerRestore: false });
        else if (action === 'start') geneoTourNavigate(0);
        else if (action === 'back') geneoTourNavigate(geneoTourRuntime.history.pop() ?? -1, false);
        else if (action === 'next') geneoTourNavigate(index + 1);
        else if (action === 'browse-modules') geneoTourOpenModuleMap();
        else if (action === 'return-to-tour') geneoTourCloseModuleMap();
    }));
    root.querySelectorAll('[data-geneo-tour-module]').forEach(button => button.addEventListener('click', () =>
    {
        const targetIndex = geneoTourSteps.findIndex(step => step.module === button.dataset.geneoTourModule);
        if (button.dataset.geneoTourModule === geneoTourSteps[index].module) geneoTourCloseModuleMap();
        else if (targetIndex >= 0) geneoTourNavigate(targetIndex);
    }));
    root.querySelector('.geneo-tour-close').hidden = index < 0 || index >= geneoTourSteps.length;
    root.querySelector('[data-geneo-tour-fallback]').hidden = !geneoTourRuntime.fallback;
    geneoTourRefreshCopy();
    geneoTourRuntime.observer = new MutationObserver(geneoTourQueuePosition);
    geneoTourRuntime.observer.observe(main, { childList: true, subtree: true });
    geneoTourRuntime.resizeObserver = new ResizeObserver(geneoTourQueuePosition);
    geneoTourRuntime.resizeObserver.observe(root.querySelector('.geneo-tour-card'));
    if (target) geneoTourRuntime.resizeObserver.observe(target);
    root.querySelector('[data-geneo-tour-action="start"], [data-geneo-tour-action="next"], [data-geneo-tour-action="finish"]')?.focus({ preventScroll: true });
    geneoTourQueuePosition();
    document.fonts.ready.then(geneoTourQueuePosition);
}

function geneoTourQueuePosition()
{
    if (!geneoTourRuntime.root || geneoTourRuntime.positionFrame) return;
    geneoTourRuntime.positionFrame = requestAnimationFrame(() =>
    {
        geneoTourRuntime.positionFrame = 0;
        geneoTourPosition();
    });
}

function geneoTourPosition()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const scrims = [...root.querySelectorAll('[data-geneo-tour-scrim]')];
    const block = root.querySelector('[data-geneo-tour-block]');
    const card = root.querySelector('.geneo-tour-card');
    if (!geneoTourRuntime.target?.isConnected)
    {
        geneoTourRuntime.target = geneoTourTarget(geneoTourRuntime.index);
        if (geneoTourRuntime.target) geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.target);
        else if (!root.classList.contains('is-centered'))
        {
            geneoTourRuntime.fallback = true;
            root.querySelector('[data-geneo-tour-fallback]').hidden = false;
            console.warn(`GeneoGraph tour target unavailable after render: ${geneoTourSteps[geneoTourRuntime.index].id}`);
        }
    }
    const target = geneoTourRuntime.target;
    const centered = root.classList.contains('is-centered') || root.classList.contains('is-module-map')
        || !target?.isConnected || geneoTourRuntime.fallback;
    if (centered)
    {
        if (!root.classList.contains('is-centered')) root.classList.add('is-unanchored');
        scrims[0].style.cssText = 'inset:0';
        scrims.slice(1).forEach(scrim => { scrim.style.cssText = 'display:none'; });
        block.hidden = true;
        card.style.left = '';
        card.style.top = '';
        return;
    }
    const rect = geneoTourTargetRect(target);
    const x = Math.max(8, Math.min(innerWidth - 8, rect.left - 8));
    const y = Math.max(8, Math.min(innerHeight - 8, rect.top - 8));
    const right = Math.max(x + 1, Math.min(innerWidth - 8, rect.right + 8));
    const bottom = Math.max(y + 1, Math.min(innerHeight - 8, rect.bottom + 8));
    const regions = [
        [0, 0, innerWidth, y], [0, bottom, innerWidth, innerHeight - bottom],
        [0, y, x, bottom - y], [right, y, innerWidth - right, bottom - y]
    ];
    scrims.forEach((scrim, index) =>
    {
        const [left, top, width, height] = regions[index];
        scrim.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
    });
    block.hidden = false;
    block.style.cssText = `left:${x}px;top:${y}px;width:${right - x}px;height:${bottom - y}px`;
    if (innerWidth <= 640)
    {
        const sheetHeight = card.offsetHeight;
        const bottomSheetTop = innerHeight - sheetHeight;
        const topOverlap = Math.max(0, Math.min(bottom, sheetHeight) - y);
        const bottomOverlap = Math.max(0, bottom - Math.max(y, bottomSheetTop));
        if (topOverlap > 0 && bottomOverlap > 0 && !geneoTourRuntime.mobileScrollAdjusted)
        {
            geneoTourRuntime.mobileScrollAdjusted = true;
            const upward = bottom - bottomSheetTop + 8;
            const downward = sheetHeight - y + 8;
            if (rect.top - upward >= 56 && geneoTourScrollTarget(target, upward)) return;
            if (rect.bottom + downward <= innerHeight - 8 && geneoTourScrollTarget(target, -downward)) return;
        }
        root.classList.toggle('is-top-sheet', topOverlap < bottomOverlap);
        card.style.left = '';
        card.style.top = '';
        return;
    }
    root.classList.remove('is-top-sheet');
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const candidates = [
        [Math.min(x, innerWidth - width - 12), bottom + 12],
        [Math.min(x, innerWidth - width - 12), y - height - 12],
        [right + 12, Math.min(y, innerHeight - height - 12)],
        [x - width - 12, Math.min(y, innerHeight - height - 12)]
    ];
    const position = candidates.find(([left, top]) => left >= 12 && top >= 12 && left + width <= innerWidth - 12 && top + height <= innerHeight - 12);
    if (!position)
    {
        root.classList.add('is-unanchored');
        scrims[0].style.cssText = 'inset:0';
        scrims.slice(1).forEach(scrim => { scrim.style.cssText = 'display:none'; });
        block.hidden = true;
        card.style.left = '';
        card.style.top = '';
        return;
    }
    root.classList.remove('is-unanchored');
    card.style.left = `${position[0]}px`;
    card.style.top = `${position[1]}px`;
}

function geneoTourScrollTarget(target, delta)
{
    for (let parent = target.parentElement; parent; parent = parent.parentElement)
    {
        if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
            || parent.scrollHeight <= parent.clientHeight + 1) continue;
        const before = parent.scrollTop;
        parent.scrollTop += delta;
        if (Math.abs(parent.scrollTop - before) < Math.abs(delta) - 2)
        {
            parent.scrollTop = before;
            continue;
        }
        geneoTourQueuePosition();
        return true;
    }
    const page = document.scrollingElement;
    if (!page || page.scrollHeight <= page.clientHeight + 1) return false;
    const before = page.scrollTop;
    page.scrollTop += delta;
    if (Math.abs(page.scrollTop - before) < Math.abs(delta) - 2)
    {
        page.scrollTop = before;
        return false;
    }
    geneoTourQueuePosition();
    return true;
}

function geneoTourTargetRect(target)
{
    const rect = target.getBoundingClientRect();
    if (geneoTourSteps[geneoTourRuntime.index]?.id !== 'geneograph-board') return rect;
    const partner = main.querySelector('[data-geneo-node="gn-silver"]');
    const viewport = main.querySelector('.geneo-canvas-viewport');
    if (!partner?.isConnected || !viewport) return rect;
    const other = partner.getBoundingClientRect();
    const visible = viewport.getBoundingClientRect();
    return {
        left: Math.max(visible.left, Math.min(rect.left, other.left)),
        top: Math.max(visible.top, Math.min(rect.top, other.top)),
        right: Math.min(visible.right, Math.max(rect.right, other.right)),
        bottom: Math.min(visible.bottom, Math.max(rect.bottom, other.bottom))
    };
}

function geneoTourNavigate(index, remember = true)
{
    if (geneoTourRuntime.transitioning) return;
    if (remember) geneoTourRuntime.history.push(geneoTourRuntime.index);
    geneoTourMoveTo(index);
}

async function geneoTourMoveTo(index)
{
    if (!geneoTourRuntime.active || geneoTourRuntime.transitioning) return;
    geneoTourRuntime.transitioning = true;
    const token = ++geneoTourRuntime.token;
    geneoTourDestroyOverlay({ keepInert: true });
    geneoTourClosePreview();
    geneoTourRuntime.index = index;
    geneoTourRuntime.fallback = false;
    geneoTourRuntime.mobileScrollAdjusted = false;
    if (index < 0 || index >= geneoTourSteps.length)
    {
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
    }
    try
    {
        geneoTourPrepare(index);
        geneoTourOpenPreview(geneoTourSteps[index]);
    }
    catch (error)
    {
        console.warn(`GeneoGraph tour could not prepare ${geneoTourSteps[index].id}:`, error);
    }
    const target = await geneoTourWaitForTarget(index, token);
    if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return;
    if (!target)
    {
        geneoTourRuntime.fallback = true;
        console.warn(`GeneoGraph tour target unavailable: ${geneoTourSteps[index].id}`);
    }
    else
    {
        if (geneoTourSteps[index].id === 'tree-group')
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('silver');
        }
        else if (geneoTourSteps[index].id === 'geneograph-board' || !target.getBoundingClientRect().width)
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        else if (target.getBoundingClientRect().top < 60 || target.getBoundingClientRect().bottom > innerHeight - 40)
        {
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        }
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return;
    geneoTourRenderOverlay(target);
    geneoTourRuntime.transitioning = false;
}

function geneoProductTourOnRender()
{
    if (!geneoTourRuntime.active || geneoTourRuntime.transitioning) return;
    const step = geneoTourSteps[geneoTourRuntime.index];
    const expectedModule = step?.module || (geneoTourRuntime.index < 0 ? 'Projects' : 'Geneograph');
    if (expectedModule && state.activeModule !== expectedModule)
    {
        geneoTourClose({ offerRestore: false });
        return;
    }
    queueMicrotask(geneoTourRefreshCopy);
}
