const GENEO_TOUR_STORAGE_KEY = 'geneograph.productTour';
const GENEO_TOUR_VERSION = 1;
const GENEO_TOUR_PROJECT_ID = 'p1';
const geneoTourSteps = [
    { id: 'projects', module: 'Projects', title: 'Everything starts with a project', body: "A project brings one family's tree, records, photographs, and research together. Let's open the sample project." },
    { id: 'tree', module: 'Family Tree', title: 'Follow the connections', body: 'See relatives across generations. Focus on a person to explore their family from a different point of view.' },
    { id: 'people', module: 'People', title: 'Meet the people behind the tree', body: 'Find a person and see the events and records connected to their life. Open their profile for the fuller story.' },
    { id: 'profile', module: 'People', title: "A person's story in one place", body: 'Their profile brings together family relationships, photographs, files, notes, and places. Follow any connection to learn more.' },
    { id: 'albums', module: 'Albums', title: 'Keep photographs in context', body: 'Collect related images in an album so a set of moments can be explored together.' },
    { id: 'archive', module: 'Archive', title: 'Keep the evidence close', body: 'Store documents and other files, then connect them to people, notes, and sources so their context stays clear.' },
    { id: 'notes', module: 'Notes', title: 'Record questions and discoveries', body: 'Write down observations and research questions alongside the people, places, and evidence they concern.' },
    { id: 'places', module: 'Places', title: 'Put the story on a map', body: "Explore where family events happened. When dated events have mapped places, Routes can show a person's journey." },
    { id: 'geneograph', module: 'Geneograph', title: 'Connect ideas visually', body: 'Arrange people, evidence, and research ideas on a canvas to see relationships and work through a question.' }
];

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
    mobileScrollAdjusted: false
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
    const keys = [
        'projectOpen', 'currentProjectId', 'selectedProjectId', 'activeModule', 'openSide', 'search',
        'selectedPersonId', 'treeProjectViews', 'peopleView', 'peopleSide', 'selectedPeopleId',
        'peopleSearch', 'peoplePreviewCollapsed', 'albumsView', 'activeAlbumId', 'albumsSearch',
        'archiveView', 'archiveSelectedFolderId', 'archiveSelectedFolderItemId',
        'archiveSelectedFileId', 'archiveSelectedSourceId', 'archiveInspectorCollapsed',
        'notesView', 'selectedNoteId', 'notesRightCollapsed', 'notesMobilePane', 'notesSearch',
        'placesView', 'placesViewMode', 'selectedPlaceId', 'placesInspectorCollapsed', 'placesMapView',
        'geneoView', 'selectedGeneoBoardId', 'geneoZoom', 'geneoBoardViewports'
    ];
    const values = {};
    keys.forEach(key => { values[key] = structuredClone(state[key]); });
    const scroll = {};
    ['.main', '.tree-canvas', '[data-geneo-canvas-wrap]', '.notes-browser-scroll'].forEach(selector =>
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
    if (!state.projectOpen || state.currentProjectId !== GENEO_TOUR_PROJECT_ID) return;
    requestAnimationFrame(() =>
    {
        if (geneoTourRuntime.active || geneoTourRuntime.invited || !state.projectOpen
            || state.currentProjectId !== GENEO_TOUR_PROJECT_ID || modalBackdrop.classList.contains('open')) return;
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
    document.addEventListener('keydown', geneoTourOnKeydown, true);
    closeMenu();
    closeTopbarPopover();
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
    if (step.id === 'tree')
    {
        treeProjectViewState(GENEO_TOUR_PROJECT_ID).focusPersonId = 'silver';
        state.selectedPersonId = 'silver';
    }
    if (step.id === 'people' || step.id === 'profile')
    {
        state.peopleView = step.id === 'profile' ? 'profile' : 'directory';
        state.peopleSide = step.id === 'profile' ? 'profile' : 'people';
        state.selectedPeopleId = 'silver';
        state.selectedPersonId = 'silver';
        state.peopleSearch = '';
        state.peoplePreviewCollapsed = false;
    }
    if (step.id === 'albums')
    {
        state.albumsView = 'album';
        state.activeAlbumId = 'al-family';
        state.albumsSearch = '';
    }
    if (step.id === 'archive')
    {
        state.archiveView = 'files';
        state.archiveSelectedFolderId = 'certificates';
        state.archiveSelectedFileId = 'af5';
        state.archiveInspectorCollapsed = false;
    }
    if (step.id === 'notes')
    {
        state.notesView = 'all';
        state.selectedNoteId = 'note-silver-luna-marriage';
        state.notesRightCollapsed = false;
        state.notesMobilePane = 'editor';
        state.notesSearch = '';
    }
    if (step.id === 'places')
    {
        state.placesView = 'all';
        state.placesViewMode = 'map';
        state.selectedPlaceId = 'place-meowbridge';
        state.placesInspectorCollapsed = false;
    }
    if (step.id === 'geneograph')
    {
        openGeneographBoard('gb1');
        return;
    }
    render();
}

function geneoTourTarget(index)
{
    const id = geneoTourSteps[index]?.id;
    if (id === 'projects') return main.querySelector(innerHeight <= 600
        ? '[data-project-id="p1"] .project-body' : '[data-project-id="p1"]');
    if (id === 'tree') return main.querySelector('.tree-person-card[data-person-id="silver"]');
    if (id === 'people') return geneoTourFirstVisible('[data-person-sidebar-context="people"]',
        innerWidth <= 640 ? '[data-people-row="silver"] .person-cell-copy' : '[data-people-row="silver"]');
    if (id === 'profile') return main.querySelector(innerWidth <= 640 ? '.profile-hero-copy' : '.profile-hero')
        || main.querySelector('.profile-hero');
    if (id === 'albums') return main.querySelector(innerWidth <= 640
        ? innerHeight <= 420 ? '[data-photo-id="photo-young-family"] .albums-card-title'
            : '[data-photo-id="photo-young-family"] .albums-thumb'
        : '[data-photo-id="photo-young-family"]')
        || main.querySelector('.albums-title');
    if (id === 'archive') return geneoTourFirstVisible('.archive-file-preview', '[data-archive-file-row="af5"]');
    if (id === 'notes') return main.querySelector(innerWidth <= 640 ? '#notesTitleInput' : '.notes-editor-header')
        || main.querySelector('[data-note-row="note-silver-luna-marriage"]');
    if (id === 'places') return main.querySelector(innerHeight <= 420
        ? '[data-places-inspector] .places-inspector-summary h2'
        : '[data-places-inspector] .places-inspector-summary') || main.querySelector('[data-places-inspector]');
    if (id === 'geneograph') return main.querySelector('[data-geneo-node="gn-silver"]');
    return null;
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
        observer.observe(main, { childList: true, subtree: true });
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

function geneoTourClose({ completed = false, offerRestore = true } = {})
{
    if (!geneoTourRuntime.active) return;
    const index = geneoTourRuntime.index;
    const origin = geneoTourRuntime.origin;
    geneoTourRuntime.active = false;
    geneoTourRuntime.token += 1;
    geneoTourRuntime.transitioning = false;
    geneoTourDestroyOverlay();
    document.removeEventListener('keydown', geneoTourOnKeydown, true);
    geneoTourWriteStatus(completed ? 'completed' : 'skipped');
    const focusTarget = geneoTourRuntime.returnFocus?.isConnected
        ? geneoTourRuntime.returnFocus : document.querySelector('[data-topbar-help]');
    focusTarget?.focus({ preventScroll: true });
    if (!completed && offerRestore && index >= 0 && origin)
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
        geneoTourClose();
        return;
    }
    if (!geneoTourRuntime.root) return;
    if (event.key === 'Tab')
    {
        const buttons = [...geneoTourRuntime.root.querySelectorAll('button:not([disabled])')];
        const first = buttons[0];
        const last = buttons.at(-1);
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
        ? 'Follow a sample family through its people, records, places, and research. This guided tour takes about three minutes.'
        : index >= geneoTourSteps.length
            ? 'The tour is complete. Return to any module and follow the connections that interest you.'
            : step.body;
    return { title: t(title), body: t(body) };
}

function geneoTourRefreshCopy()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const { title, body } = geneoTourCardCopy();
    root.querySelector('[data-geneo-tour-title]').textContent = title;
    root.querySelector('[data-geneo-tour-body]').textContent = body;
    const progress = root.querySelector('[data-geneo-tour-progress]');
    if (progress)
    {
        progress.textContent = t('Step {current} of {total}')
            .replace('{current}', String(geneoTourRuntime.index + 1))
            .replace('{total}', String(geneoTourSteps.length));
    }
    root.querySelectorAll('[data-geneo-tour-label]').forEach(button =>
    {
        button.textContent = t(button.dataset.geneoTourLabel);
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
        : [['back', 'Back'], ['skip', 'Skip tour'], ['next', index === geneoTourSteps.length - 1 ? 'Finish tour' : 'Next']];
    const root = document.createElement('div');
    root.className = `geneo-tour${centered ? ' is-centered' : ''}`;
    root.dataset.geneoTour = '';
    root.innerHTML = `<div class="geneo-tour-scrim" data-geneo-tour-scrim></div><div class="geneo-tour-scrim" data-geneo-tour-scrim></div><div class="geneo-tour-scrim" data-geneo-tour-scrim></div><div class="geneo-tour-scrim" data-geneo-tour-scrim></div><div class="geneo-tour-target-block" data-geneo-tour-block></div><section class="geneo-tour-card" role="dialog" aria-modal="true" aria-labelledby="geneoTourTitle" aria-describedby="geneoTourBody"><div class="geneo-tour-card-head"><span class="geneo-tour-progress" data-geneo-tour-progress aria-live="polite"></span><button class="geneo-tour-close" type="button" aria-label="${escapeHtml(t('Skip tour'))}" data-geneo-tour-action="skip">${icon.close}</button></div><h2 id="geneoTourTitle" data-geneo-tour-title></h2><p id="geneoTourBody" data-geneo-tour-body></p><p class="geneo-tour-fallback" data-geneo-tour-fallback hidden>${escapeHtml(t('This part of the sample is unavailable. Continue to the next stop.'))}</p><div class="geneo-tour-actions">${actions.map(([action, label]) => `<button class="button ${action === 'next' || action === 'start' || action === 'finish' ? 'primary' : 'secondary'}" type="button" data-geneo-tour-action="${action}" data-geneo-tour-label="${escapeHtml(label)}"></button>`).join('')}</div></section>`;
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
        else if (action === 'start') geneoTourMoveTo(0);
        else if (action === 'back') geneoTourMoveTo(index - 1);
        else if (action === 'next') geneoTourMoveTo(index + 1);
    }));
    root.querySelector('.geneo-tour-close').hidden = index < 0 || index >= geneoTourSteps.length;
    root.querySelector('[data-geneo-tour-fallback]').hidden = !geneoTourRuntime.fallback;
    if (centered) root.querySelector('[data-geneo-tour-progress]').hidden = true;
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
    const centered = root.classList.contains('is-centered') || !target?.isConnected || geneoTourRuntime.fallback;
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
    if (geneoTourSteps[geneoTourRuntime.index]?.id !== 'geneograph') return rect;
    const partner = main.querySelector('[data-geneo-node="gn-iris"]');
    if (!partner?.isConnected) return rect;
    const other = partner.getBoundingClientRect();
    return {
        left: Math.min(rect.left, other.left),
        top: Math.min(rect.top, other.top),
        right: Math.max(rect.right, other.right),
        bottom: Math.max(rect.bottom, other.bottom)
    };
}

async function geneoTourMoveTo(index)
{
    if (!geneoTourRuntime.active || geneoTourRuntime.transitioning) return;
    geneoTourRuntime.transitioning = true;
    const token = ++geneoTourRuntime.token;
    geneoTourDestroyOverlay({ keepInert: true });
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
        if (index === 1)
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('silver');
        }
        else if (index === 8 || !target.getBoundingClientRect().width) target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
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
    const expectedModule = step?.module || (geneoTourRuntime.index < 0
        ? geneoTourRuntime.origin?.values.activeModule : 'Geneograph');
    if (expectedModule && state.activeModule !== expectedModule)
    {
        geneoTourClose({ offerRestore: false });
        return;
    }
    queueMicrotask(geneoTourRefreshCopy);
}
