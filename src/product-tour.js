const GENEO_TOUR_STORAGE_KEY = 'geneograph.productTour';
const GENEO_TOUR_VERSION = 2;
const GENEO_TOUR_PROJECT_ID = 'p1';
const geneoTourSteps = [
    { id: 'projects-welcome', module: 'Projects', projectView: 'library', presentation: 'centered', title: 'Welcome to Projects', body: 'Projects bring your family tree, photographs, records, and notes into one workspace. This is where each family-history project begins.' },
    { id: 'projects-actions', module: 'Projects', projectView: 'library', title: 'Create or open a project', body: 'Create family tree starts a blank project. Import GEDCOM and Open project will later allow bringing in existing research into the app.' },
    { id: 'projects-continue', module: 'Projects', projectView: 'library', title: 'Pick up where you left off', body: 'This shortcut reopens the last project and module you visited.' },
    { id: 'projects-card', module: 'Projects', projectView: 'library', title: 'Explore a sample project', body: 'The Whiskerfield Family Tree project card summarizes a sample project. Let’s open it to see the research inside.' },
    { id: 'projects-hero', module: 'Projects', projectView: 'overview', title: 'Project overview', body: 'The hero keeps the project name, description, status, dates, and project actions together.' },
    { id: 'projects-tags', module: 'Projects', projectView: 'overview', title: 'Research at a glance', body: 'These tags show how many people, photographs, files, and notes belong to this project.' },
    { id: 'projects-back', module: 'Projects', projectView: 'overview', title: 'Return to all projects', body: 'Back to all projects button returns you to the project library. Your open project saves automatically.' },
    { id: 'projects-tabs', module: 'Projects', projectView: 'overview', title: 'Move between modules', body: 'Navigation tabs open the connected modules inside the project. Continue to Family Tree to explore its people and relationships.' },
    { id: 'tree-welcome', module: 'Family Tree', presentation: 'centered', title: 'Welcome to Family Tree', body: 'See your family across generations, discover how people are related, and explore different branches of the tree.' },
    { id: 'tree-person-card', module: 'Family Tree', title: 'Meet a person in the tree', body: 'Silver’s card shows his name, photograph, and key life dates. Each card is a starting point for exploring a person.' },
    { id: 'tree-focus-switch', module: 'Family Tree', title: 'Change the focus', body: 'Focus on Luna to explore her tree branch.' },
    { id: 'tree-navigation', module: 'Family Tree', title: 'Move through the tree', body: 'Previous and Next buttons revisit your selections. The people menu gives you quick access to recently selected people.' },
    { id: 'tree-sidebar', module: 'Family Tree', title: 'Details beside the tree', body: 'The right sidebar shows information about the selected person, brining important context right to the family tree.' },
    { id: 'tree-sidebar-hero', module: 'Family Tree', title: 'Person at a glance', body: 'The hero brings together photograph, identity, life details, and a link to his full profile.' },
    { id: 'tree-sidebar-actions', module: 'Family Tree', title: 'Work with this person', body: 'Use these actions to edit, add a relative, or connect someone already in the project as a new relative.' },
    { id: 'tree-quick-edit-button', module: 'Family Tree', title: 'Quick edit from the tree', body: 'Quick edit opens the person’s details without leaving the Family Tree. Next, take a look at the window.' },
    { id: 'tree-quick-edit-modal', module: 'Family Tree', title: 'Edit person details', body: 'This window organizes identity and life events so you can update the person without leaving the tree.' },
    { id: 'tree-add-relative', module: 'Family Tree', title: 'Add or connect a relative', body: 'Choose a relationship, then add someone new or connect a person who is already in the project.' },
    { id: 'tree-sections-overview', module: 'Family Tree', title: 'Explore connected details', body: 'Expand these sections to find insights, events, relationships, photos, files, notes, sources, and record information.' },
    { id: 'tree-timeline', module: 'Family Tree', title: 'Follow a life over time', body: 'The open Timeline section puts dated events together so you can follow person’s story in order.' },
    { id: 'tree-to-people', module: 'Family Tree', title: 'Continue to People', body: 'Use the People tab to browse everyone in the project. You can also open the full profile directly from the sidebar. The tour continues in People.' },
    { id: 'people-welcome', module: 'People', presentation: 'centered', title: 'Welcome to People', body: 'People brings everyone in this project together. Browse the directory, follow connections, and open a fuller profile for each person.' },
    { id: 'people-navigation', module: 'People', title: 'Choose a People view', body: 'Use People to browse the directory, or Profile to see the selected person in greater detail.' },
    { id: 'people-table', module: 'People', title: 'Browse everyone in the project', body: 'The table brings all project people into a searchable, sortable list with their key life details.' },
    { id: 'people-columns', module: 'People', title: 'Choose your columns', body: 'Show the details you need in the directory and hide the columns you do not need right now.' },
    { id: 'people-filters', module: 'People', title: 'Narrow the directory', body: 'Filters help you find people by names, dates, places, and other details without changing their records.' },
    { id: 'people-save-filter', module: 'People', title: 'Save a useful filter', body: 'This surname filter is an example. Save filter can keep a view you want to return to later.' },
    { id: 'people-saved-filters', module: 'People', title: 'Return to saved filters', body: 'Saved filters are available from the left sidebar, where you can open or edit them.' },
    { id: 'people-to-profile', module: 'People', title: 'Open a full profile', body: 'Use Profile in the sidebar or View profile beside the directory to explore the selected person.' },
    { id: 'people-profile-welcome', module: 'People', presentation: 'centered', title: 'Inside a person’s profile', body: 'A profile brings the person’s life details and connected research together in one place.' },
    { id: 'people-profile-hero', module: 'People', title: 'Silver’s profile at a glance', body: 'The hero summarizes Silver’s identity, photograph, life details, and profile actions.' },
    { id: 'people-profile-card', module: 'People', title: 'Explore the profile card', body: 'The four tabs organize the main information about Silver so you can move between different kinds of details.' },
    { id: 'people-connected', module: 'People', title: 'Follow connected items', body: 'Photographs and archive files linked to Silver appear here, keeping their context close to his profile.' },
    { id: 'people-to-geneograph', module: 'People', title: 'Continue to Geneograph', body: 'The Geneograph tab opens a visual board for arranging people, evidence, and research questions. Continue there next.' },
    { id: 'geneograph-welcome', module: 'Geneograph', presentation: 'centered', title: 'Welcome to Geneograph', body: 'Geneograph is a flexible visual workspace for family charts, evidence, and ideas you are still investigating.' },
    { id: 'geneograph-navigation', module: 'Geneograph', title: 'Find your boards', body: 'Use these four choices to see all boards, favourites, boards outside collections, or archived boards.' },
    { id: 'geneograph-collections', module: 'Geneograph', title: 'Organize with collections', body: 'Create your own collections to keep related boards together without changing their contents.' },
    { id: 'geneograph-create-actions', module: 'Geneograph', title: 'Start a new board', body: 'Create a new board here. Import board is unavailable for now; next, look at the New board window.' },
    { id: 'geneograph-create-modal', module: 'Geneograph', title: 'Describe your board', body: 'Give a new board a name, an optional description, and collections before creating it.' },
    { id: 'geneograph-card', module: 'Geneograph', title: 'Open the sample board', body: 'This card shows the sample board and its details. Next, open it to explore how editing works.' },
    { id: 'geneograph-editor-welcome', module: 'Geneograph', presentation: 'centered', title: 'Explore the board editor', body: 'Arrange people, connections, and research materials freely on the board’s canvas.' },
    { id: 'geneograph-all-boards', module: 'Geneograph', title: 'Return to your boards', body: 'All Boards takes you back to the board library. Changes to the current board are saved automatically.' },
    { id: 'geneograph-current-board', module: 'Geneograph', title: 'Current board', body: 'Find the board name and collection here, and open its details to make changes.' },
    { id: 'geneograph-layers', module: 'Geneograph', title: 'What is on this board?', body: 'Layers list the items on the board’s canvas. Use them to find an item, show or hide it, or keep it in place.' },
    { id: 'geneograph-objects', module: 'Geneograph', title: 'A family group on the canvas', body: 'This panel groups sample people together. You can find the panel and its people in the Layers list.' },
    { id: 'geneograph-topbar', module: 'Geneograph', title: 'Board tools at hand', body: 'The top toolbar brings together editing modes, objects, history, and export.' },
    { id: 'geneograph-modes', module: 'Geneograph', title: 'Select, move, or draw', body: 'Switch between selecting items, moving around the canvas, and drawing with the pencil whenever you need.' },
    { id: 'geneograph-connect', module: 'Geneograph', title: 'Connect items', body: 'Connect draws lines between items. Choose a solid or dashed line to show a different kind of link.' },
    { id: 'geneograph-person', module: 'Geneograph', title: 'Add a person', body: 'Person is the main family-chart item. Add a person to the canvas and connect them to other people or evidence.' },
    { id: 'geneograph-other-objects', module: 'Geneograph', title: 'Add more than people', body: 'Place, Image, Panel, Notes & text, and Shapes add context and structure to the canvas.' },
    { id: 'geneograph-inspector', module: 'Geneograph', title: 'Adjust the canvas and its items', body: 'This panel shows canvas settings for the current board. Select an item to see settings for that item instead.' },
    { id: 'geneograph-export', module: 'Geneograph', title: 'Share your board', body: 'Export downloads the visible board content as a PNG image.' },
    { id: 'geneograph-to-albums', module: 'Geneograph', title: 'Continue to Albums', body: 'Albums brings photographs together with the people and places they document. Continue there next.' },
    { id: 'albums-welcome', module: 'Albums', presentation: 'centered', title: 'Welcome to Albums', body: 'Albums brings your project photographs together. Browse the images, group them into albums, and keep the people and research behind each photo close.' },
    { id: 'albums-photos', module: 'Albums', title: 'Explore your photos', body: 'The main area shows photographs in this album. Open one to see the image and its connected details.' },
    { id: 'albums-navigation', module: 'Albums', title: 'Find your photos', body: 'Use the left navigation to see all photos, favourites, or photos that have not been placed in an album.' },
    { id: 'albums-albums', module: 'Albums', title: 'Organize with albums', body: 'Albums group related photographs. Open an existing album here, or create a new one with the plus button.' },
    { id: 'albums-filters', module: 'Albums', title: 'Narrow your photos', body: 'Filters help you find photographs by person, place, source, date, or favourite status without changing them.' },
    { id: 'albums-summary', module: 'Albums', title: 'Inspect a photograph', body: 'The right panel shows a photo preview and its main details, including its name, date, place, and caption.' },
    { id: 'albums-actions', module: 'Albums', title: 'Work with a photo', body: 'Use these controls to edit photo details, mark it as a favourite, or open more actions.' },
    { id: 'albums-connections', module: 'Albums', title: 'Keep photos connected', body: 'People and Albums show who is in this photograph and which albums contain it. These links keep each photo in the context of your research.' },
    { id: 'albums-connect-actions', module: 'Albums', title: 'Connect a photograph', body: 'Tag person links someone in the photo to their profile. Add to album groups the photo with related images. Next, see how to choose an album.' },
    { id: 'albums-add-to-album', module: 'Albums', title: 'Add a photo to an album', body: 'Choose an existing album or create a new one to organize this photograph with related images.' },
    { id: 'albums-to-archive', module: 'Albums', title: 'Continue to Archive', body: 'Archive keeps documents, files, and their sources alongside your photographs. Continue there next.' },
    { id: 'archive-welcome', module: 'Archive', presentation: 'centered', title: 'Welcome to Archive', body: 'Archive keeps research files and their sources in your project. Browse folders, inspect a file, and connect evidence to the rest of your work.' },
    { id: 'archive-navigation', module: 'Archive', title: 'Browse the Archive', body: 'Use the left navigation to open files, favourites, and sources.' },
    { id: 'archive-folders', module: 'Archive', title: 'Explore folders', body: 'The folder tree organizes files by location or subject. Open a branch to find its nested folders.' },
    { id: 'archive-location', module: 'Archive', title: 'Move between folders', body: 'The path shows where you are. Use Back, Forward, Up, or a breadcrumb to move through folders.' },
    { id: 'archive-table', module: 'Archive', title: 'Browse folder contents', body: 'Folders appear in the main table. Select one to see its details, or double-click it to open it.' },
    { id: 'archive-folder-actions', module: 'Archive', title: 'Create a folder', body: 'Create a folder from the sidebar or page header. Select a folder to add a subfolder inside it.' },
    { id: 'archive-folder-modal', module: 'Archive', title: 'Name and place a folder', body: 'Give the new folder a name and choose its parent. Nothing is created until you confirm.' },
    { id: 'archive-inspector', module: 'Archive', title: 'Inspect a file', body: 'The right panel shows a conceptual preview in this prototype and the file’s recorded details.' },
    { id: 'archive-file-actions', module: 'Archive', title: 'Work with a file', body: 'Edit details, move the file, mark it as a favourite, or open More actions from the toolbar.' },
    { id: 'archive-to-notes', module: 'Archive', title: 'Continue to Notes', body: 'Notes keeps your observations and research questions alongside the files you collect. Continue there next.' },
    { id: 'notes-welcome', module: 'Notes', presentation: 'centered', title: 'Welcome to Notes', body: 'Keep observations, questions, and discoveries beside the people and evidence they concern.' },
    { id: 'notes-navigation', module: 'Notes', title: 'Find your notes', body: 'Use the left navigation to browse all notes, favourites, or archived notes.' },
    { id: 'notes-collections', module: 'Notes', title: 'Organize note collections', body: 'Collections group notes by topic or research question. Open one here or create your own.' },
    { id: 'notes-list-example', module: 'Notes', title: 'Browse the note list', body: 'Each note shows its question or title with a short preview. Select a note, like “Who was Daisy Milkpaw’s father?”, to explore its details and connections.' },
    { id: 'notes-filters', module: 'Notes', title: 'Narrow your notes', body: 'Find notes linked to a person, place, or source, or filter by their connected records and collections.' },
    { id: 'notes-editor-overview', module: 'Notes', title: 'Work beside your notes', body: 'The right pane keeps the selected note, its writing area, and collection assignment together.' },
    { id: 'notes-rich-text', module: 'Notes', title: 'Write with rich text', body: 'Use the editor to write observations and questions, with formatting for headings, lists, and emphasis.' },
    { id: 'notes-sections', module: 'Notes', title: 'Explore note connections', body: 'These sections organize collections, tasks, and links to people, events, photos, files, places, sources, and other notes.' },
    { id: 'notes-checklist', module: 'Notes', title: 'Track research tasks', body: 'Open Checklist to keep follow-up tasks with the note and mark them complete as you work.' },
    { id: 'notes-add-actions', module: 'Notes', title: 'Connect more research', body: 'Use Add person or Add event to connect this note to records already in the project. Next, see how an event is linked.' },
    { id: 'notes-add-events', module: 'Notes', title: 'Link an event', body: 'Choose an existing project event to connect it to this note. Nothing changes until you confirm.' },
    { id: 'notes-to-places', module: 'Notes', title: 'Continue to Places', body: 'Places brings the locations in your research together. Continue there to explore where events happened.' },
    { id: 'places-navigation', module: 'Places', title: 'Browse places', body: 'Find the locations connected to this family from the Places navigation.' },
    { id: 'places-map', module: 'Places', title: 'Put the story on a map', body: 'Explore where family events happened. The selected place remains available even when map tiles are unavailable.' },
    { id: 'places-people', module: 'Places', title: 'See connected people', body: 'The place inspector shows the people and events linked to this location.' }
];
const geneoTourModules = ['Projects', 'Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places'];
const geneoTourModuleIconNames = {
    Projects: 'home',
    'Family Tree': 'tree',
    People: 'people',
    Geneograph: 'whiteboard',
    Albums: 'image',
    Archive: 'archive',
    Notes: 'note',
    Places: 'mapPin'
};
const geneoTourLibrarySteps = new Set([
    'geneograph-welcome', 'geneograph-navigation', 'geneograph-collections',
    'geneograph-create-actions', 'geneograph-create-modal', 'geneograph-card'
]);
const geneoTourOptionalTargets = new Set(['projects-actions', 'projects-continue', 'projects-back', 'projects-tabs']);
const geneoTourSecondarySelectors = {
    'tree-to-people': '.tree-person-hero-profile',
    'tree-add-relative': '.tree-inspector #addRelative',
    'people-columns': '#peopleColumnsButton',
    'people-filters': '#peopleFilterButton',
    'albums-filters': '#albumsFilterButton',
    'albums-connect-actions': '#albumsLinkAlbum',
    'archive-folder-actions': '.archive-page-head [data-archive-create-folder]',
    'people-to-profile': '.people-layout .tree-person-hero-profile',
    'people-connected': '.profile-resource-card--archive',
    'notes-filters': '#notesFilterButton',
    'notes-add-actions': '[data-note-editor-section="events"] [data-note-manage-links="event"]'
};
const geneoTourTertiarySelectors = {
    'archive-folder-actions': '.archive-folder-inspector-actions [data-archive-create-folder]'
};

const geneoTourRuntime = {
    active: false,
    invited: false,
    transitioning: false,
    index: -1,
    token: 0,
    root: null,
    target: null,
    secondaryTarget: null,
    tertiaryTarget: null,
    fallback: false,
    optionalFallback: false,
    origin: null,
    returnFocus: null,
    observer: null,
    resizeObserver: null,
    positionFrame: 0,
    mobileScrollAdjusted: false,
    history: [],
    ownedPreview: null,
    openingPreview: false,
    peopleOrigin: null,
    albumsOrigin: null,
    albumsModalSelection: null,
    archiveOrigin: null,
    archiveOriginScroll: null,
    notesOrigin: null,
    notesOriginScroll: null
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
    ['.main', '.tree-canvas', '.tree-inspector', '[data-geneo-canvas-wrap]', '.notes-browser-scroll',
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
    if (step.module === 'Notes' && !geneoTourRuntime.notesOrigin)
    {
        geneoTourRuntime.notesOrigin = Object.fromEntries([
            ...Object.keys(state).filter(key => key.startsWith('notes')),
            'selectedNoteId'
        ].map(key => [key, structuredClone(state[key])]));
        geneoTourRuntime.notesOriginScroll = Object.fromEntries(
            ['.main', '.notes-browser-scroll', '.notes-right-pane'].map(selector =>
                [selector, document.querySelector(selector)?.scrollTop || 0]));
    }
    if (step.module === 'People' && !geneoTourRuntime.peopleOrigin)
    {
        geneoTourRuntime.peopleOrigin = Object.fromEntries([
            'peopleFilters', 'peopleSavedViewId', 'peopleSavedView', 'peopleSearch',
            'selectedPeopleId', 'selectedPersonId', 'peopleSelectedIds', 'peopleSelectionAnchorId',
            'peoplePage', 'peoplePaginationQueryKey', 'peopleView', 'peopleSide',
            'peoplePreviewCollapsed', 'peopleProfileEditing', 'peopleProfileEditTab'
        ].map(key => [key, structuredClone(state[key])]));
    }
    if (step.module === 'Projects' && step.projectView === 'library')
    {
        state.activeModule = 'Projects';
        state.projectOpen = false;
        state.search = '';
        render();
        return;
    }

    if (step.module === 'Family Tree' && state.activeModule === 'Family Tree' && currentProjectId() === GENEO_TOUR_PROJECT_ID)
    {
        captureTreeCanvasScroll(GENEO_TOUR_PROJECT_ID);
    }
    activateProject(GENEO_TOUR_PROJECT_ID, { moduleName: step.module, renderNow: false });
    if (step.module === 'Albums' && !geneoTourRuntime.albumsOrigin)
    {
        geneoTourRuntime.albumsOrigin = Object.fromEntries([
            'albumsView', 'activeAlbumId', 'albumsSearch', 'albumsFilters',
            'albumsViewMode', 'selectedPhotoId', 'selectedPhotoIds',
            'albumsDetailCollapsed', 'albumsDetailSections'
        ].map(key => [key, structuredClone(state[key])]));
    }
    if (step.module === 'Archive' && !geneoTourRuntime.archiveOrigin)
    {
        geneoTourRuntime.archiveOrigin = Object.fromEntries(Object.keys(state)
            .filter(key => key.startsWith('archive'))
            .map(key => [key, structuredClone(state[key])]));
        geneoTourRuntime.archiveOriginScroll = Object.fromEntries(
            ['.archive-sidebar', '.archive-inspector-scroll'].map(selector =>
                [selector, document.querySelector(selector)?.scrollTop || 0]));
    }
    if (step.module === 'Family Tree')
    {
        treeProjectViewState(GENEO_TOUR_PROJECT_ID).focusPersonId = 'silver';
        state.selectedPersonId = 'silver';
        state.treeInspectorCollapsed = false;
        if (step.id === 'tree-sections-overview' || step.id === 'tree-timeline')
        {
            ['insights', 'timeline', 'relationships', 'photos', 'archive', 'notes', 'sources', 'record']
                .forEach(section => { state.inspectorSections[section] = step.id === 'tree-timeline' && section === 'timeline'; });
        }
    }
    if (step.module === 'People')
    {
        const profile = ['people-profile-welcome', 'people-profile-hero', 'people-profile-card',
            'people-connected', 'people-to-geneograph'].includes(step.id);
        state.peopleView = profile ? 'profile' : 'directory';
        state.peopleSide = profile ? 'profile' : 'people';
        state.selectedPeopleId = 'silver';
        state.selectedPersonId = 'silver';
        state.peopleSelectedIds = [];
        state.peopleSelectionAnchorId = '';
        state.peoplePage = 1;
        state.peoplePaginationQueryKey = '';
        state.peopleSavedView = 'All people';
        state.peopleSearch = '';
        state.peoplePreviewCollapsed = false;
        state.peopleProfileEditing = false;
        state.peopleFilters = step.id === 'people-save-filter' || step.id === 'people-saved-filters'
            ? peopleFiltersWithDefaults({ surnames: ['Whiskerfield'] })
            : peopleFiltersWithDefaults({});
        state.peopleSavedViewId = null;
    }
    if (step.module === 'Albums')
    {
        state.albumsView = 'album';
        state.activeAlbumId = 'al-family';
        state.albumsSearch = '';
        state.albumsFilters = albumsFiltersWithDefaults({});
        state.albumsViewMode = 'grid';
        state.selectedPhotoId = 'photo-young-family';
        state.selectedPhotoIds = [];
        state.albumsDetailCollapsed = false;
        state.albumsDetailSections.details = true;
        if (step.id === 'albums-connections' || step.id === 'albums-connect-actions')
        {
            state.albumsDetailSections.people = true;
            state.albumsDetailSections.albums = true;
        }
    }
    if (step.module === 'Archive')
    {
        state.archiveView = 'files';
        const fileStop = ['archive-inspector', 'archive-file-actions', 'archive-to-notes'].includes(step.id);
        const folderStop = ['archive-location', 'archive-table', 'archive-folder-actions', 'archive-folder-modal'].includes(step.id);
        state.archiveSelectedFolderId = fileStop ? 'delo44' : folderStop ? 'opis3' : null;
        state.archiveSelectedFolderItemId = ['archive-folder-actions', 'archive-folder-modal'].includes(step.id)
            ? 'delo44' : null;
        state.archiveSelectedFileId = fileStop ? 'af1' : null;
        state.archiveSelectedFileIds = [];
        state.archiveSelectedSourceId = null;
        state.archiveSearch = '';
        state.archiveFileFilters = archiveFileFiltersWithDefaults({});
        state.archiveFilterPresentation = 'folders';
        state.archiveFilterScopeFolderId = null;
        state.archiveExpandedFolders = { ...state.archiveExpandedFolders,
            pawford: true, fond12: true, opis3: true };
        state.archiveNavigationBackStack = folderStop || fileStop
            ? [archiveNormalizeLocationSnapshot({ view: 'files', folderId: null })] : [];
        state.archiveNavigationForwardStack = [];
        state.archiveInspectorCollapsed = false;
        state.archiveFileEditing = false;
        state.archiveFileEditDraft = null;
        state.archiveInspectorSections.details = true;
    }
    if (step.module === 'Notes')
    {
        state.notesView = 'all';
        state.notesActiveCollectionId = null;
        state.selectedNoteId = 'note-daisy-parentage';
        state.notesRightCollapsed = false;
        state.notesMobilePane = ['notes-navigation', 'notes-collections', 'notes-list-example', 'notes-filters'].includes(step.id)
            ? 'browser' : 'editor';
        state.notesSearch = '';
        state.notesFilters = notesFiltersWithDefaults({});
        Object.keys(state.notesEditorSections).forEach(key =>
        {
            state.notesEditorSections[key] = step.id === 'notes-editor-overview' && key === 'collections'
                || step.id === 'notes-checklist' && key === 'checklist';
        });
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
        if (geneoTourLibrarySteps.has(step.id))
        {
            if (state.geneoView === 'board') captureGeneographViewport();
            state.geneoView = 'home';
            state.geneoLibraryView = 'all';
            state.geneoActiveCollectionId = null;
            render();
        }
        else if (state.geneoView !== 'board' || state.selectedGeneoBoardId !== 'gb1'
            || !main.querySelector('.geneo-editor'))
        {
            state.geneoInspectorCollapsed = false;
            state.geneoSidebarSections.layers = true;
            openGeneographBoard('gb1');
        }
        else
        {
            const needsRender = state.geneoInspectorCollapsed
                || state.geneoSidebarSections?.layers === false
                || state.selectedGeneoNodeId || state.selectedGeneoConnectionId;
            state.geneoInspectorCollapsed = false;
            state.geneoSidebarSections.layers = true;
            if (state.selectedGeneoNodeId || state.selectedGeneoConnectionId)
                selectGeneographCanvas();
            if (needsRender) renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        }
        geneoTourApplyTreeReveal(step);
        return;
    }
    render();
    geneoTourApplyTreeReveal(step);
}

function geneoTourClearTreeReveal()
{
    document.body.classList.remove('geneo-tour-tree-sidebar', 'geneo-tour-tree-tabs',
        'geneo-tour-people-sidebar', 'geneo-tour-people-preview', 'geneo-tour-people-tabs',
        'geneo-tour-people-popover', 'geneo-tour-geneo-sidebar', 'geneo-tour-geneo-toolbar',
        'geneo-tour-geneo-tabs', 'geneo-tour-albums-sidebar',
        'geneo-tour-albums-inspector', 'geneo-tour-albums-tabs',
        'geneo-tour-albums-popover', 'geneo-tour-archive-sidebar',
        'geneo-tour-archive-inspector', 'geneo-tour-archive-tabs',
        'geneo-tour-notes-sidebar', 'geneo-tour-notes-tabs', 'geneo-tour-notes-popover');
}

function geneoTourRestorePeopleState()
{
    if (!geneoTourRuntime.peopleOrigin) return;
    Object.entries(geneoTourRuntime.peopleOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.peopleOrigin = null;
}

function geneoTourRestoreAlbumsState()
{
    if (!geneoTourRuntime.albumsOrigin) return;
    Object.entries(geneoTourRuntime.albumsOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.albumsOrigin = null;
}

function geneoTourRestoreArchiveState()
{
    if (!geneoTourRuntime.archiveOrigin) return;
    Object.entries(geneoTourRuntime.archiveOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.archiveOrigin = null;
    const scroll = geneoTourRuntime.archiveOriginScroll;
    geneoTourRuntime.archiveOriginScroll = null;
    if (state.activeModule === 'Archive')
    {
        renderArchive();
        requestAnimationFrame(() =>
        {
            Object.entries(scroll || {}).forEach(([selector, top]) =>
            {
                document.querySelector(selector)?.scrollTo(0, top);
            });
        });
    }
}

function geneoTourRestoreNotesState({ renderNow = true } = {})
{
    if (!geneoTourRuntime.notesOrigin) return;
    Object.entries(geneoTourRuntime.notesOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.notesOrigin = null;
    const scroll = geneoTourRuntime.notesOriginScroll;
    geneoTourRuntime.notesOriginScroll = null;
    if (renderNow && state.activeModule === 'Notes')
    {
        renderNotes();
        requestAnimationFrame(() =>
        {
            Object.entries(scroll || {}).forEach(([selector, top]) =>
            {
                document.querySelector(selector)?.scrollTo(0, top);
            });
        });
    }
}

function geneoTourApplyTreeReveal(step)
{
    if (step.module === 'Notes')
    {
        if (['notes-navigation', 'notes-collections'].includes(step.id))
            document.body.classList.add('geneo-tour-notes-sidebar');
        if (step.id === 'notes-filters')
            document.body.classList.add('geneo-tour-notes-popover');
        if (step.id === 'notes-to-places')
            document.body.classList.add('geneo-tour-notes-tabs');
        return;
    }
    if (step.module === 'Archive')
    {
        if (['archive-navigation', 'archive-folders'].includes(step.id)
            || (step.id === 'archive-folder-actions' && innerWidth > 1100))
            document.body.classList.add('geneo-tour-archive-sidebar');
        if (['archive-folder-actions', 'archive-inspector', 'archive-file-actions'].includes(step.id))
            document.body.classList.add('geneo-tour-archive-inspector');
        if (step.id === 'archive-to-notes') document.body.classList.add('geneo-tour-archive-tabs');
        return;
    }
    if (step.module === 'Albums')
    {
        if (step.id === 'albums-navigation' || step.id === 'albums-albums')
            document.body.classList.add('geneo-tour-albums-sidebar');
        if (['albums-summary', 'albums-actions', 'albums-connections', 'albums-connect-actions'].includes(step.id))
            document.body.classList.add('geneo-tour-albums-inspector');
        if (step.id === 'albums-filters')
            document.body.classList.add('geneo-tour-albums-popover');
        if (step.id === 'albums-to-archive')
            document.body.classList.add('geneo-tour-albums-tabs');
        return;
    }
    if (step.module === 'People')
    {
        if (['people-navigation', 'people-saved-filters', 'people-to-profile'].includes(step.id))
            document.body.classList.add('geneo-tour-people-sidebar');
        if (step.id === 'people-to-profile') document.body.classList.add('geneo-tour-people-preview');
        if (step.id === 'people-to-geneograph') document.body.classList.add('geneo-tour-people-tabs');
        if (step.id === 'people-columns' || step.id === 'people-filters')
            document.body.classList.add('geneo-tour-people-popover');
        return;
    }
    if (step.module === 'Geneograph')
    {
        if (['geneograph-navigation', 'geneograph-collections', 'geneograph-all-boards',
            'geneograph-current-board', 'geneograph-layers'].includes(step.id))
            document.body.classList.add('geneo-tour-geneo-sidebar');
        if (['geneograph-topbar', 'geneograph-modes', 'geneograph-connect',
            'geneograph-person', 'geneograph-other-objects', 'geneograph-export'].includes(step.id))
            document.body.classList.add('geneo-tour-geneo-toolbar');
        if (step.id === 'geneograph-to-albums') document.body.classList.add('geneo-tour-geneo-tabs');
        return;
    }
    if (step.module !== 'Family Tree') return;
    if (['tree-sidebar', 'tree-sidebar-hero', 'tree-sidebar-actions', 'tree-quick-edit-button',
        'tree-quick-edit-modal', 'tree-add-relative', 'tree-sections-overview', 'tree-timeline', 'tree-to-people'].includes(step.id))
        document.body.classList.add('geneo-tour-tree-sidebar');
    if (step.id === 'tree-to-people') document.body.classList.add('geneo-tour-tree-tabs');
}

function geneoTourTarget(index)
{
    const id = geneoTourSteps[index]?.id;
    const selectors = {
        'projects-actions': '.button-stack',
        'projects-continue': '.startup-continue',
        'projects-card': '[data-project-id="p1"]',
        'projects-hero': '.project-hero',
        'projects-tags': '.project-hero .stat-chips',
        'projects-back': '#backToProjects',
        'projects-tabs': '.topnav',
        'tree-person-card': '.tree-person-card[data-person-id="silver"]',
        'tree-focus-switch': '[data-tree-card-focus="luna"]',
        'tree-navigation': '[data-tree-navigation="back"]',
        'tree-sidebar': '.tree-inspector',
        'tree-sidebar-hero': '.tree-inspector .tree-person-hero',
        'tree-sidebar-actions': '.tree-inspector .panel-actions',
        'tree-quick-edit-button': '.tree-inspector #quickEdit',
        'tree-quick-edit-modal': '#modalBackdrop .add-person-modal',
        'tree-add-relative': '#relativePopover',
        'tree-sections-overview': '.tree-inspector .panel-section',
        'tree-timeline': '.tree-inspector [data-toggle-section="timeline"]',
        'tree-to-people': '.topnav [data-module="People"]',
        'people-navigation': '.side-nav [data-people-side="people"]',
        'people-table': '.people-table-wrap',
        'people-columns': '#peopleColumnsPopover',
        'people-filters': '#peopleFilterPopover',
        'people-save-filter': '#peopleSaveView',
        'people-saved-filters': '.people-saved-filter-row',
        'people-to-profile': '.side-nav [data-open-profile]',
        'people-profile-hero': '.profile-hero',
        'people-profile-card': '[data-profile-card-root]',
        'people-connected': '.profile-resource-card--photos',
        'people-to-geneograph': '.topnav [data-module="Geneograph"]',
        'albums-photos': '.albums-justified-grid .albums-justified-row',
        'albums-navigation': '[data-albums-tour-target="navigation"]',
        'albums-albums': '[data-albums-tour-target="albums"]',
        'albums-filters': '#albumsFilterPopover',
        'albums-summary': '.albums-detail-toolbar',
        'albums-actions': '#albumsEditPhoto',
        'albums-connections': '[data-albums-section-toggle="people"]',
        'albums-connect-actions': '#albumsTagPeople',
        'albums-add-to-album': '#modalBackdrop .album-picker-modal',
        'albums-to-archive': '.topnav [data-module="Archive"]',
        'archive-navigation': '.archive-sidebar .side-nav',
        'archive-folders': '.archive-sidebar-folder-tree',
        'archive-location': '.archive-location-row',
        'archive-table': '.archive-table-wrap',
        'archive-folder-actions': '.archive-sidebar [data-archive-create-folder]',
        'archive-folder-modal': '#modalBackdrop .archive-create-folder-modal',
        'archive-inspector': '.archive-file-preview',
        'archive-file-actions': '#archiveEditFile',
        'archive-to-notes': '.topnav [data-module="Notes"]',
        'notes-navigation': '[data-notes-tour-target="navigation"]',
        'notes-collections': '[data-notes-tour-target="collections"]',
        'notes-list-example': '[data-note-id="note-daisy-parentage"]',
        'notes-filters': '#projectMenu.notes-filter-popover',
        'notes-editor-overview': '.notes-editor-header',
        'notes-rich-text': '.notes-rich-editor-shell',
        'notes-sections': '.notes-editor-sections',
        'notes-checklist': '[data-note-editor-section="checklist"]',
        'notes-add-actions': '[data-note-editor-section="people"] [data-note-manage-links="person"]',
        'notes-add-events': '#modalBackdrop [aria-labelledby="notesEventsTitle"]',
        'notes-to-places': '.topnav [data-module="Places"]',
        'places-navigation': '.places-sidebar',
        'places-map': '.places-map-panel',
        'places-people': '.places-inspector-person-groups',
        'geneograph-navigation': '[data-geneo-tour-target="library-navigation"] .side-nav',
        'geneograph-collections': '[data-geneo-tour-target="library-collections"]',
        'geneograph-create-actions': '.geneo-home-page .archive-page-actions',
        'geneograph-create-modal': '#modalBackdrop .geneo-board-create-modal',
        'geneograph-card': '[data-geneo-board-id="gb1"]',
        'geneograph-all-boards': '[data-geneo-all-boards]',
        'geneograph-current-board': '.geneo-board-panel > .geneo-sidebar-section:nth-child(2)',
        'geneograph-layers': '.geneo-board-panel .geneo-layers',
        'geneograph-objects': '[data-geneo-node="gn-panel"]',
        'geneograph-topbar': '.geneo-editor-toolbar',
        'geneograph-modes': '.geneo-editor-toolbar .geneo-tool-group',
        'geneograph-connect': '[data-geneo-toolbar-item="connect"]',
        'geneograph-person': '[data-geneo-toolbar-item="person"]',
        'geneograph-other-objects': '[data-geneo-toolbar-item="place"]',
        'geneograph-inspector': '.geneo-inspector:not(.collapsed)',
        'geneograph-export': '.geneo-editor-toolbar [data-geneo-export]',
        'geneograph-to-albums': '.topnav [data-module="Albums"]'
    };
    const target = id === 'archive-folder-actions' && innerWidth <= 1100
        ? document.querySelector(geneoTourTertiarySelectors[id])
        : document.querySelector(selectors[id]);
    if (id === 'people-saved-filters') return target?.parentElement?.parentElement || null;
    if (id === 'places-map' && (!target || !target.getBoundingClientRect().width))
        return document.querySelector('[data-places-inspector] .places-inspector-summary');
    if (target?.getBoundingClientRect().width) return target;
    if (id === 'people-table') return document.querySelector('[data-person-sidebar-context="people"]');
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
    geneoTourRuntime.positionFrame = 0;
    geneoTourRuntime.root?.remove();
    geneoTourRuntime.root = null;
    geneoTourRuntime.secondaryTarget = null;
    geneoTourRuntime.tertiaryTarget = null;
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
    if (geneoTourRuntime.ownedPreview === 'people-columns') closePeopleColumnsPopover();
    if (geneoTourRuntime.ownedPreview === 'people-filters') closePeopleFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'albums-filters') closeAlbumsFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'notes-filters') closeMenu();
    if (geneoTourRuntime.albumsModalSelection)
    {
        state.selectedPhotoIds = geneoTourRuntime.albumsModalSelection;
        geneoTourRuntime.albumsModalSelection = null;
    }
    geneoTourRuntime.ownedPreview = null;
}

function geneoTourOpenPreview(step)
{
    if (step.id === 'notes-filters')
    {
        const anchor = document.getElementById('notesFilterButton');
        if (!anchor) return;
        openNotesFilterMenu(anchor);
        const popover = document.querySelector('#projectMenu.notes-filter-popover');
        if (popover)
        {
            popover.inert = true;
            menuLifecycleController?.abort();
            geneoTourRuntime.ownedPreview = 'notes-filters';
        }
    }
    if (step.id === 'notes-add-events')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openNotesEventsModal();
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
    if (step.id === 'archive-folder-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openArchiveCreateFolderModal('delo44');
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
    if (step.id === 'albums-filters')
    {
        const anchor = document.getElementById('albumsFilterButton');
        if (!anchor) return;
        openAlbumsFilterPopover(anchor);
        const popover = document.getElementById('albumsFilterPopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = 'albums-filters';
        }
    }
    if (step.id === 'albums-add-to-album')
    {
        geneoTourRuntime.openingPreview = true;
        geneoTourRuntime.albumsModalSelection = [...(state.selectedPhotoIds || [])];
        try
        {
            state.selectedPhotoIds = ['photo-young-family'];
            openAddToAlbumModal();
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
            if (geneoTourRuntime.ownedPreview !== 'modal')
            {
                state.selectedPhotoIds = geneoTourRuntime.albumsModalSelection;
                geneoTourRuntime.albumsModalSelection = null;
            }
        }
    }
    if (step.id === 'geneograph-create-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openCreateGeneographBoardModal();
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
    if (step.id === 'people-columns' || step.id === 'people-filters')
    {
        const columns = step.id === 'people-columns';
        const anchor = document.getElementById(columns ? 'peopleColumnsButton' : 'peopleFilterButton');
        if (!anchor) return;
        if (columns) openPeopleColumnsPopover(anchor);
        else openPeopleFilterPopover(anchor);
        const popover = document.getElementById(columns ? 'peopleColumnsPopover' : 'peopleFilterPopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = columns ? 'people-columns' : 'people-filters';
        }
    }
    if (step.id === 'tree-add-relative')
    {
        const anchor = document.querySelector('#addRelative');
        if (!anchor) return;
        openRelativePopover(anchor, 'silver');
        const popover = document.querySelector('#relativePopover');
        if (popover)
        {
            popover.inert = true;
            menuLifecycleController?.abort();
            geneoTourRuntime.ownedPreview = 'relative';
        }
    }
    if (step.id === 'tree-quick-edit-modal')
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
    geneoTourRestorePeopleState();
    geneoTourRestoreAlbumsState();
    geneoTourRestoreArchiveState();
    geneoTourRestoreNotesState();
    geneoTourDestroyOverlay();
    geneoTourClearTreeReveal();
    if (state.activeModule === 'People') renderPeople();
    if (state.activeModule === 'Albums') renderAlbums();
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
        ? 'Follow a sample family project across eight connected modules. You can skip a module at any time.'
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
        browse.setAttribute('aria-label', `${t('Browse modules')}: ${t(currentModule)}`);
        browse.title = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-title]').textContent = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-return]').textContent = t('Return to tour');
        root.querySelectorAll('[data-geneo-tour-module]').forEach(button =>
        {
            const isCurrent = button.dataset.geneoTourModule === currentModule;
            button.querySelector('.geneo-tour-map-name').textContent = t(button.dataset.geneoTourModule);
            button.classList.toggle('is-current', isCurrent);
            if (isCurrent) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    }
    root.querySelectorAll('[data-geneo-tour-label]').forEach(button =>
    {
        const nextModule = geneoTourSteps[geneoTourRuntime.index + 1]?.module;
        const currentModule = geneoTourSteps[geneoTourRuntime.index]?.module;
        const crossesModule = button.dataset.geneoTourAction === 'next'
            && nextModule && nextModule !== currentModule;
        button.textContent = crossesModule ? t('Next') : t(button.dataset.geneoTourLabel);
        if (crossesModule)
        {
            const destination = t('Continue to {module}').replace('{module}', t(nextModule));
            button.setAttribute('aria-label', destination);
            button.title = destination;
        }
        else if (button.dataset.geneoTourAction === 'next')
        {
            button.removeAttribute('aria-label');
            button.removeAttribute('title');
        }
    });
    root.querySelector('.geneo-tour-close').setAttribute('aria-label', t('Skip tour'));
    geneoTourQueuePosition();
}

function geneoTourRenderOverlay(target = null)
{
    geneoTourDestroyOverlay({ keepInert: true });
    const index = geneoTourRuntime.index;
    const outerScreen = index < 0 || index >= geneoTourSteps.length;
    const projectIntro = geneoTourSteps[index]?.presentation === 'centered';
    const centered = outerScreen || projectIntro;
    const actions = outerScreen
        ? index < 0
            ? [['dismiss', 'Explore on my own'], ['start', 'Start tour']]
            : [['finish', 'Explore the demo']]
        : [['back', 'Back'], ['next', index === geneoTourSteps.length - 1 ? 'Finish tour' : 'Next']];
    const root = document.createElement('div');
    root.className = `geneo-tour${centered ? ' is-centered' : ''}${index < 0 ? ' is-welcome' : ''}${projectIntro ? ' is-project-intro' : ''}${['tree-quick-edit-modal', 'geneograph-create-modal', 'albums-add-to-album', 'archive-folder-modal', 'notes-add-events'].includes(geneoTourSteps[index]?.id) ? ' is-modal-stop' : ''}`;
    root.dataset.geneoTour = '';
    root.innerHTML = `
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block-secondary hidden></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block-tertiary hidden></div>
        <section class="geneo-tour-card" role="dialog" aria-modal="true" aria-labelledby="geneoTourTitle" aria-describedby="geneoTourBody">
            <div class="geneo-tour-card-head">
                ${outerScreen ? '' : `<div class="geneo-tour-chapter"><button class="geneo-tour-browse" type="button" data-geneo-tour-action="browse-modules">${icon.grid}<span data-geneo-tour-module-name aria-live="polite"></span></button></div>`}
                ${outerScreen ? '' : '<h2 class="geneo-tour-map-title" id="geneoTourMapTitle" data-geneo-tour-map-title></h2>'}
                <button class="geneo-tour-close" type="button" aria-label="${escapeHtml(t('Skip tour'))}" data-geneo-tour-action="skip">${icon.close}</button>
            </div>
            <div data-geneo-tour-step-view>
                ${index < 0 ? `<div class="geneo-tour-welcome"><span class="geneo-tour-brand">${icon.logo}<strong>GeneoGraph</strong></span><div class="geneo-tour-cover" aria-hidden="true"></div></div>` : ''}
                <h2 id="geneoTourTitle" data-geneo-tour-title></h2>
                <p id="geneoTourBody" data-geneo-tour-body></p>
                <p class="geneo-tour-fallback" data-geneo-tour-fallback hidden>${escapeHtml(t('This part of the sample is unavailable. Continue to the next stop.'))}</p>
                <div class="geneo-tour-actions">${actions.map(([action, label]) => `<button class="button ${action === 'next' || action === 'start' || action === 'finish' ? 'primary' : 'secondary'}" type="button" data-geneo-tour-action="${action}" data-geneo-tour-label="${escapeHtml(label)}"></button>`).join('')}</div>
            </div>
            ${outerScreen ? '' : `<div class="geneo-tour-map" data-geneo-tour-map-view hidden><div class="geneo-tour-map-list">${geneoTourModules.map(module => `<button type="button" data-geneo-tour-module="${escapeHtml(module)}"><span class="geneo-tour-map-icon" aria-hidden="true">${icon[geneoTourModuleIconNames[module]]}</span><span class="geneo-tour-map-name"></span><span class="geneo-tour-map-current" aria-hidden="true">${icon.check}</span></button>`).join('')}</div><button class="geneo-tour-map-return" type="button" data-geneo-tour-action="return-to-tour" data-geneo-tour-map-return></button></div>`}
        </section>`;
    document.body.appendChild(root);
    geneoTourRuntime.root = root;
    root.addEventListener('click', event => event.stopPropagation());
    root.addEventListener('pointerdown', event => event.stopPropagation());
    geneoTourRuntime.target = target;
    const secondarySelector = geneoTourSteps[index]?.id === 'archive-folder-actions' && innerWidth <= 1100
        ? null : geneoTourSecondarySelectors[geneoTourSteps[index]?.id];
    geneoTourRuntime.secondaryTarget = secondarySelector ? document.querySelector(secondarySelector) : null;
    const tertiarySelector = innerWidth > 1100 ? geneoTourTertiarySelectors[geneoTourSteps[index]?.id] : null;
    geneoTourRuntime.tertiaryTarget = tertiarySelector ? document.querySelector(tertiarySelector) : null;
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
    root.querySelector('[data-geneo-tour-fallback]').hidden = !geneoTourRuntime.fallback || geneoTourRuntime.optionalFallback;
    geneoTourRefreshCopy();
    geneoTourRuntime.observer = new MutationObserver(geneoTourQueuePosition);
    geneoTourRuntime.observer.observe(main, { childList: true, subtree: true });
    geneoTourRuntime.resizeObserver = new ResizeObserver(geneoTourQueuePosition);
    geneoTourRuntime.resizeObserver.observe(root.querySelector('.geneo-tour-card'));
    if (target) geneoTourRuntime.resizeObserver.observe(target);
    if (geneoTourRuntime.secondaryTarget) geneoTourRuntime.resizeObserver.observe(geneoTourRuntime.secondaryTarget);
    if (geneoTourRuntime.tertiaryTarget) geneoTourRuntime.resizeObserver.observe(geneoTourRuntime.tertiaryTarget);
    root.querySelector('[data-geneo-tour-action="start"], [data-geneo-tour-action="next"], [data-geneo-tour-action="finish"]')?.focus({ preventScroll: true });
    geneoTourPosition();
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

function geneoTourPaintScrims(root, holes)
{
    let regions = [{ left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
    holes.forEach(hole =>
    {
        regions = regions.flatMap(region =>
        {
            const left = Math.max(region.left, hole.left);
            const top = Math.max(region.top, hole.top);
            const right = Math.min(region.right, hole.right);
            const bottom = Math.min(region.bottom, hole.bottom);
            if (right <= left || bottom <= top) return [region];
            return [
                { left: region.left, top: region.top, right: region.right, bottom: top },
                { left: region.left, top: bottom, right: region.right, bottom: region.bottom },
                { left: region.left, top, right: left, bottom },
                { left: right, top, right: region.right, bottom }
            ].filter(part => part.right > part.left && part.bottom > part.top);
        });
    });
    const scrims = [...root.querySelectorAll('[data-geneo-tour-scrim]')];
    while (scrims.length < regions.length)
    {
        const scrim = document.createElement('div');
        scrim.className = 'geneo-tour-scrim';
        scrim.dataset.geneoTourScrim = '';
        root.insertBefore(scrim, root.querySelector('[data-geneo-tour-block]'));
        scrims.push(scrim);
    }
    scrims.forEach((scrim, index) =>
    {
        const region = regions[index];
        scrim.style.cssText = region
            ? `left:${region.left}px;top:${region.top}px;width:${region.right - region.left}px;height:${region.bottom - region.top}px`
            : 'display:none';
    });
}

function geneoTourPosition()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const block = root.querySelector('[data-geneo-tour-block]');
    const secondaryBlock = root.querySelector('[data-geneo-tour-block-secondary]');
    const tertiaryBlock = root.querySelector('[data-geneo-tour-block-tertiary]');
    const card = root.querySelector('.geneo-tour-card');
    if (!root.classList.contains('is-centered') && !geneoTourRuntime.target?.isConnected)
    {
        geneoTourRuntime.target = geneoTourTarget(geneoTourRuntime.index);
        if (geneoTourRuntime.target) geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.target);
        else if (!geneoTourRuntime.optionalFallback)
        {
            geneoTourRuntime.fallback = true;
            root.querySelector('[data-geneo-tour-fallback]').hidden = false;
            console.warn(`GeneoGraph tour target unavailable after render: ${geneoTourSteps[geneoTourRuntime.index].id}`);
        }
    }
    const target = geneoTourRuntime.target;
    if (geneoTourRuntime.secondaryTarget && !geneoTourRuntime.secondaryTarget.isConnected)
    {
        const selector = geneoTourSecondarySelectors[geneoTourSteps[geneoTourRuntime.index]?.id];
        geneoTourRuntime.secondaryTarget = selector ? document.querySelector(selector) : null;
        if (geneoTourRuntime.secondaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.secondaryTarget);
    }
    if (geneoTourRuntime.tertiaryTarget && !geneoTourRuntime.tertiaryTarget.isConnected)
    {
        const selector = geneoTourTertiarySelectors[geneoTourSteps[geneoTourRuntime.index]?.id];
        geneoTourRuntime.tertiaryTarget = selector ? document.querySelector(selector) : null;
        if (geneoTourRuntime.tertiaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.tertiaryTarget);
    }
    const centered = root.classList.contains('is-centered') || root.classList.contains('is-module-map')
        || !target?.isConnected || geneoTourRuntime.fallback;
    if (centered)
    {
        if (!root.classList.contains('is-centered')) root.classList.add('is-unanchored');
        geneoTourPaintScrims(root, []);
        block.hidden = true;
        secondaryBlock.hidden = true;
        tertiaryBlock.hidden = true;
        card.style.left = '';
        card.style.top = '';
        return;
    }
    const rect = geneoTourTargetRect(target);
    const toHole = bounds => ({
        left: Math.max(8, Math.min(innerWidth - 8, bounds.left - 8)),
        top: Math.max(8, Math.min(innerHeight - 8, bounds.top - 8)),
        right: Math.max(9, Math.min(innerWidth - 8, bounds.right + 8)),
        bottom: Math.max(9, Math.min(innerHeight - 8, bounds.bottom + 8))
    });
    const primary = toHole(rect);
    const secondaryTarget = geneoTourRuntime.secondaryTarget;
    const secondaryRect = secondaryTarget?.isConnected ? secondaryTarget.getBoundingClientRect() : null;
    const secondary = secondaryRect?.width && secondaryRect.bottom > 0 && secondaryRect.top < innerHeight
        ? toHole(secondaryRect) : null;
    const tertiaryRect = geneoTourRuntime.tertiaryTarget?.isConnected
        ? geneoTourRuntime.tertiaryTarget.getBoundingClientRect() : null;
    const tertiary = tertiaryRect?.width && tertiaryRect.bottom > 0 && tertiaryRect.top < innerHeight
        ? toHole(tertiaryRect) : null;
    const holes = [primary, ...(secondary ? [secondary] : []), ...(tertiary ? [tertiary] : [])];
    geneoTourPaintScrims(root, holes);
    const { left: x, top: y, right, bottom } = primary;
    block.hidden = false;
    block.style.cssText = `left:${x}px;top:${y}px;width:${right - x}px;height:${bottom - y}px`;
    secondaryBlock.hidden = !secondary;
    if (secondary)
        secondaryBlock.style.cssText = `left:${secondary.left}px;top:${secondary.top}px;width:${secondary.right - secondary.left}px;height:${secondary.bottom - secondary.top}px`;
    tertiaryBlock.hidden = !tertiary;
    if (tertiary)
        tertiaryBlock.style.cssText = `left:${tertiary.left}px;top:${tertiary.top}px;width:${tertiary.right - tertiary.left}px;height:${tertiary.bottom - tertiary.top}px`;
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
        if (['notes-editor-overview', 'notes-rich-text', 'notes-sections',
            'notes-checklist', 'notes-add-actions'].includes(geneoTourSteps[geneoTourRuntime.index]?.id))
            root.classList.remove('is-top-sheet');
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
    const position = candidates.find(([left, top]) => left >= 12 && top >= 12
        && left + width <= innerWidth - 12 && top + height <= innerHeight - 12
        && !holes.some(hole => left < hole.right && left + width > hole.left
            && top < hole.bottom && top + height > hole.top));
    if (!position)
    {
        if (['tree-quick-edit-modal', 'geneograph-create-modal', 'albums-add-to-album', 'archive-folder-modal'].includes(geneoTourSteps[geneoTourRuntime.index]?.id) && innerWidth > 640)
        {
            root.classList.remove('is-unanchored');
            card.style.left = `${innerWidth - width - 12}px`;
            card.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, y + (bottom - y - height) / 2))}px`;
            return;
        }
        root.classList.add('is-unanchored');
        geneoTourPaintScrims(root, []);
        block.hidden = true;
        secondaryBlock.hidden = true;
        tertiaryBlock.hidden = true;
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
    const stepId = geneoTourSteps[geneoTourRuntime.index]?.id;
    if (['notes-editor-overview', 'notes-rich-text', 'notes-sections', 'notes-checklist'].includes(stepId))
    {
        const pane = main.querySelector('.notes-right-pane')?.getBoundingClientRect();
        const collections = main.querySelector('[data-note-editor-section="collections"]')?.getBoundingClientRect();
        if (pane)
        {
            const bottom = stepId === 'notes-editor-overview' && collections
                ? collections.bottom : rect.bottom;
            const top = Math.max(rect.top, pane.top);
            return { left: pane.left, right: pane.right, top,
                bottom: Math.max(top + 40, Math.min(bottom, pane.bottom, innerHeight - 8)) };
        }
    }
    if (stepId === 'archive-inspector')
    {
        const details = main.querySelector('#archive-file-section-details')?.getBoundingClientRect();
        const inspector = main.querySelector('.archive-inspector-scroll')?.getBoundingClientRect();
        if (details && inspector)
        {
            const top = Math.max(rect.top, inspector.top);
            return { left: inspector.left, right: inspector.right, top,
                bottom: Math.max(top + 40, Math.min(details.bottom, inspector.bottom)) };
        }
    }
    if (stepId === 'archive-file-actions')
    {
        const last = main.querySelector('.archive-inspector-toolbar [data-archive-row-actions="file"]')
            ?.getBoundingClientRect();
        if (last) return { left: rect.left, top: Math.min(rect.top, last.top),
            right: last.right, bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'archive-table')
        return { left: rect.left, right: rect.right, top: Math.max(rect.top, 64),
            bottom: Math.min(rect.bottom, innerHeight - 64) };
    if (stepId === 'albums-photos')
    {
        const viewport = main.querySelector('.albums-content')?.getBoundingClientRect();
        return viewport ? { left: Math.max(rect.left, viewport.left), top: Math.max(rect.top, viewport.top),
            right: Math.min(rect.right, viewport.right), bottom: Math.min(rect.bottom, viewport.bottom) } : rect;
    }
    if (stepId === 'albums-summary' || stepId === 'albums-connections')
    {
        const inspector = main.querySelector('.albums-detail')?.getBoundingClientRect();
        const end = stepId === 'albums-summary'
            ? main.querySelector('[data-albums-section-toggle="details"]')?.closest('.panel-section')
            : main.querySelector('[data-albums-section-toggle="albums"]')?.closest('.panel-section');
        const endRect = end?.getBoundingClientRect();
        if (inspector && endRect)
        {
            const top = Math.max(rect.top, inspector.top);
            const visibleBottom = innerWidth <= 640
                ? Math.min(inspector.bottom, innerHeight * .66)
                : Math.min(inspector.bottom, innerHeight - 8);
            return { left: inspector.left, right: inspector.right, top,
                bottom: Math.max(top + 40, Math.min(endRect.bottom, visibleBottom)) };
        }
    }
    if (stepId === 'albums-actions')
    {
        const last = main.querySelector('#albumsInspectorMore')?.getBoundingClientRect();
        if (last) return { left: rect.left, top: Math.min(rect.top, last.top),
            right: last.right, bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'people-table')
        return { left: rect.left, right: rect.right, top: Math.max(rect.top, 72),
            bottom: Math.min(rect.bottom, innerHeight - 80) };
    if (stepId === 'people-navigation')
    {
        const other = main.closest('.workspace')?.querySelector('.side-nav [data-open-profile]')?.getBoundingClientRect();
        return other ? { left: Math.min(rect.left, other.left), top: Math.min(rect.top, other.top),
            right: Math.max(rect.right, other.right), bottom: Math.max(rect.bottom, other.bottom) } : rect;
    }
    if (stepId === 'tree-navigation')
    {
        const controls = [...main.querySelectorAll('[data-tree-navigation], [data-tree-recent-toggle]')]
            .map(control => control.getBoundingClientRect());
        return {
            left: Math.min(...controls.map(control => control.left)),
            top: Math.min(...controls.map(control => control.top)),
            right: Math.max(...controls.map(control => control.right)),
            bottom: Math.max(...controls.map(control => control.bottom))
        };
    }
    if (stepId === 'tree-timeline')
    {
        const section = target.closest('.panel-section')?.getBoundingClientRect() || rect;
        return innerWidth <= 640
            ? { ...section.toJSON(), bottom: Math.max(section.top + 40, Math.min(section.bottom, innerHeight * .66)) }
            : section;
    }
    if (stepId === 'tree-add-relative' && innerWidth <= 640)
        return { ...rect.toJSON(), bottom: Math.max(rect.top + 40, Math.min(rect.bottom, innerHeight * .66)) };
    if (stepId === 'tree-sections-overview')
    {
        const sections = [...main.querySelectorAll('.tree-inspector .panel-section')];
        const inspector = main.querySelector('.tree-inspector')?.getBoundingClientRect();
        const last = sections.at(-1)?.getBoundingClientRect();
        if (inspector && last)
            return { left: inspector.left, right: inspector.right,
                top: Math.max(inspector.top, rect.top), bottom: Math.min(inspector.bottom, last.bottom) };
    }
    if (stepId === 'geneograph-other-objects')
    {
        const last = main.querySelector('[data-geneo-toolbar-item="shape"]')?.getBoundingClientRect();
        const tools = main.querySelector('.geneo-editor-toolbar-left')?.getBoundingClientRect();
        if (last && tools) return { left: Math.max(rect.left, tools.left),
            top: Math.min(rect.top, last.top), right: Math.min(last.right, tools.right),
            bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'geneograph-objects' || stepId === 'geneograph-layers')
    {
        const viewport = stepId === 'geneograph-objects'
            ? main.querySelector('.geneo-canvas-viewport')?.getBoundingClientRect()
            : main.querySelector('.geneo-board-panel')?.getBoundingClientRect();
        if (viewport) return { left: Math.max(rect.left, viewport.left),
            top: Math.max(rect.top, viewport.top), right: Math.min(rect.right, viewport.right),
            bottom: Math.min(rect.bottom, viewport.bottom) };
    }
    return rect;
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
    const leavingPeople = geneoTourSteps[geneoTourRuntime.index]?.module === 'People'
        && geneoTourSteps[index]?.module !== 'People';
    const leavingAlbums = geneoTourSteps[geneoTourRuntime.index]?.module === 'Albums'
        && geneoTourSteps[index]?.module !== 'Albums';
    const leavingArchive = geneoTourSteps[geneoTourRuntime.index]?.module === 'Archive'
        && geneoTourSteps[index]?.module !== 'Archive';
    const leavingNotes = geneoTourSteps[geneoTourRuntime.index]?.module === 'Notes'
        && geneoTourSteps[index]?.module !== 'Notes';
    geneoTourDestroyOverlay({ keepInert: true });
    geneoTourClosePreview();
    if (leavingPeople) geneoTourRestorePeopleState();
    if (leavingAlbums) geneoTourRestoreAlbumsState();
    if (leavingArchive) geneoTourRestoreArchiveState();
    if (leavingNotes) geneoTourRestoreNotesState({ renderNow: false });
    geneoTourClearTreeReveal();
    geneoTourRuntime.index = index;
    geneoTourRuntime.fallback = false;
    geneoTourRuntime.optionalFallback = false;
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
        if (geneoTourSteps[index].id === 'tree-add-relative')
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        geneoTourOpenPreview(geneoTourSteps[index]);
    }
    catch (error)
    {
        console.warn(`GeneoGraph tour could not prepare ${geneoTourSteps[index].id}:`, error);
    }
    if (geneoTourSteps[index].presentation === 'centered')
    {
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
    }
    const optionalTarget = geneoTourOptionalTargets.has(geneoTourSteps[index].id);
    const mountedTarget = optionalTarget ? geneoTourTarget(index) : null;
    if (optionalTarget && (!mountedTarget?.isConnected || !mountedTarget.getBoundingClientRect().width))
    {
        geneoTourRuntime.fallback = true;
        geneoTourRuntime.optionalFallback = true;
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
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
        if (geneoTourSteps[index].id === 'tree-person-card')
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('silver');
        }
        else if (geneoTourSteps[index].id === 'tree-focus-switch')
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('luna');
        }
        else if (geneoTourSteps[index].id === 'tree-sections-overview' || geneoTourSteps[index].id === 'tree-timeline')
        {
            const inspector = main.querySelector('.tree-inspector');
            const section = target.closest('.panel-section');
            if (inspector && section)
                inspector.scrollTop += section.getBoundingClientRect().top - inspector.getBoundingClientRect().top - 8;
        }
        else if (geneoTourSteps[index].id === 'tree-to-people')
            main.querySelector('.tree-inspector')?.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'people-connected')
        {
            const archive = main.querySelector('.profile-resource-card--archive');
            const photos = target.getBoundingClientRect();
            const files = archive?.getBoundingClientRect();
            if (files) geneoTourScrollTarget(target, (photos.top + files.bottom) / 2 - innerHeight / 2);
        }
        else if (geneoTourSteps[index].id === 'albums-summary' || geneoTourSteps[index].id === 'albums-actions')
            main.querySelector('.albums-detail')?.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'albums-connections' || geneoTourSteps[index].id === 'albums-connect-actions')
        {
            const inspector = main.querySelector('.albums-detail');
            const section = target.closest('.panel-section');
            if (inspector && section)
                inspector.scrollTop += section.getBoundingClientRect().top - inspector.getBoundingClientRect().top - 8;
        }
        else if (geneoTourSteps[index].id === 'notes-list-example')
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        else if (['notes-editor-overview', 'notes-rich-text'].includes(geneoTourSteps[index].id))
            main.querySelector('.notes-right-pane')?.scrollTo(0, 0);
        else if (['notes-sections', 'notes-checklist', 'notes-add-actions'].includes(geneoTourSteps[index].id))
        {
            const pane = main.querySelector('.notes-right-pane');
            const section = geneoTourSteps[index].id === 'notes-add-actions'
                ? target.closest('.notes-panel-section') : target;
            if (pane && section)
                pane.scrollTop += section.getBoundingClientRect().top - pane.getBoundingClientRect().top - 12;
            const visibleTarget = geneoTourSteps[index].id === 'notes-add-actions'
                ? geneoTourRuntime.secondaryTarget || target : target;
            visibleTarget.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        }
        else if (geneoTourSteps[index].id === 'notes-to-places' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'archive-inspector'
            || geneoTourSteps[index].id === 'archive-file-actions')
            main.querySelector('.archive-inspector-scroll')?.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'archive-to-notes' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'albums-to-archive' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'people-to-geneograph' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'geneograph-objects' || !target.getBoundingClientRect().width)
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'geneograph-to-albums' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (document.body.classList.contains('geneo-tour-geneo-toolbar'))
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
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
