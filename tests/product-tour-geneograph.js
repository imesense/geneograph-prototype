const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const tour = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const geneograph = fs.readFileSync(path.join(root, 'geneograph.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'product-tour.css'), 'utf8');
const russian = vm.runInNewContext(`${localization}\nRU_UI`, {
    document: { title: 'GeneoGraph' }
});
assert.equal(russian['Current board'], 'Текущий холст');
const state = {
    activeModule: 'People', geneoView: 'home', selectedGeneoBoardId: null,
    geneoInspectorCollapsed: false, geneoSidebarSections: { layers: true },
    selectedGeneoNodeId: null, selectedGeneoConnectionId: null
};
let boardOpens = 0;
let renders = 0;
let modalOpens = 0;
let modalCloses = 0;
const classes = new Set();
const modalBackdrop = { inert: false, classList: {
    contains(value)
    {
        return value === 'open' && modalOpens > modalCloses;
    }
} };
const context = vm.createContext({
    state, structuredClone, console, modalBackdrop,
    document: { body: { classList: {
        add(value)
        {
            classes.add(value);
        },
        remove(...values)
        {
            values.forEach(value => classes.delete(value));
        }
    } } },
    main: { querySelector(selector)
    {
        return selector === '.geneo-editor' && state.geneoView === 'board' ? {} : null;
    } },
    activateProject(_id, { moduleName })
    {
        state.activeModule = moduleName;
    },
    render()
    {
        renders++;
    },
    openGeneographBoard(id)
    {
        boardOpens++;
        state.geneoView = 'board';
        state.selectedGeneoBoardId = id;
    },
    captureGeneographViewport()
    {
    },
    openCreateGeneographBoardModal()
    {
        modalOpens++;
    },
    closeModal()
    {
        modalCloses++;
    }
});
vm.runInContext(tour, context);
const evaluate = expression => vm.runInContext(expression, context);
const steps = evaluate('geneoTourSteps');
assert.deepEqual(Object.keys(evaluate('geneoTourModuleIconNames')), [
    'Projects', 'Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places'
]);
assert.equal(new Set(Object.values(evaluate('geneoTourModuleIconNames'))).size, 8);
assert.match(tour, /data-geneo-tour-action="browse-modules">\$\{icon\.grid\}<span data-geneo-tour-module-name/);
assert.match(tour, /geneo-tour-map-icon[^`]*icon\[geneoTourModuleIconNames\[module\]\]/);
assert.match(css, /\.geneo-tour-browse\s*\{[^}]*background: transparent/s);
assert.doesNotMatch(css, /\.geneo-tour-browse:hover\s*\{[^}]*background:/s);
assert.match(css, /\.geneo-tour\.is-module-map \.geneo-tour-card\s*\{[^}]*560px/s);
assert.match(css, /\.geneo-tour-map-list\s*\{[^}]*grid-template-columns: repeat\(2/s);
assert.match(css, /@media \(max-width: 480px\)\s*\{\s*\.geneo-tour-map-list\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s);
const chapter = steps.filter(step => step.module === 'Geneograph');
assert.deepEqual(Array.from(chapter, step => step.id), [
    'geneograph-welcome', 'geneograph-navigation', 'geneograph-collections',
    'geneograph-create-actions', 'geneograph-create-modal', 'geneograph-card',
    'geneograph-editor-welcome', 'geneograph-all-boards', 'geneograph-current-board',
    'geneograph-layers', 'geneograph-objects', 'geneograph-topbar',
    'geneograph-modes', 'geneograph-connect', 'geneograph-person',
    'geneograph-other-objects', 'geneograph-inspector', 'geneograph-export',
    'geneograph-to-albums'
]);
assert.equal(steps[steps.indexOf(chapter[0]) - 1].module, 'People');
assert.equal(steps[steps.indexOf(chapter.at(-1)) + 1].module, 'Albums');
assert.equal(chapter[0].presentation, 'centered');
assert.equal(chapter[6].presentation, 'centered');
const byId = id => chapter.find(step => step.id === id);
assert.equal(byId('geneograph-create-modal').title, 'Describe your board');
assert.match(byId('geneograph-create-actions').body, /New board window/);
assert.match(byId('geneograph-all-boards').body, /^All Boards /);
assert.equal(byId('geneograph-current-board').title, 'Current board');
assert.match(byId('geneograph-editor-welcome').body, /board’s canvas/);
assert.match(byId('geneograph-inspector').body, /canvas settings for the current board/);
assert.equal(byId('geneograph-export').title, 'Share your board');
assert.ok(!chapter.some(step => /canvases|current canvas|new canvas|sample canvas/i.test(`${step.title} ${step.body}`)));
for (const step of chapter)
{
    assert.ok(russian[step.title] && russian[step.title] !== step.title, step.title);
    assert.ok(russian[step.body] && russian[step.body] !== step.body, step.body);
    assert.ok(!russian[step.title].includes('доск'), step.title);
    assert.ok(!russian[step.body].includes('доск'), step.body);
}
assert.ok(russian[steps.find(step => step.id === 'people-to-geneograph').body].includes('холст'));
assert.ok(!geneograph.includes('function openGeneographImportBoardModal('));
assert.match(geneograph, /data-geneo-import\s+disabled/);
assert.match(geneograph, /data-geneo-tour-target="library-navigation"/);
assert.match(geneograph, /data-geneo-tour-target="library-collections"/);
assert.match(css, /geneo-tour-geneo-toolbar/);
assert.match(css, /geneo-tour-geneo-toolbar \.geneo-editor-toolbar-left\s*\{[^}]*overflow-x: auto/s);
assert.doesNotMatch(css, /geneo-tour-geneo-toolbar \.geneo-editor-toolbar\s*\{[^}]*display: flex/s);

const prepare = id => evaluate(`geneoTourPrepare(geneoTourSteps.findIndex(step => step.id === '${id}'))`);
prepare('geneograph-card');
assert.equal(state.geneoView, 'home');
assert.equal(boardOpens, 0);
assert.equal(renders, 1);
prepare('geneograph-editor-welcome');
assert.equal(state.selectedGeneoBoardId, 'gb1');
assert.equal(boardOpens, 1);
prepare('geneograph-layers');
prepare('geneograph-export');
assert.equal(boardOpens, 1, 'Adjacent editor stops must preserve the board viewport');
assert.ok(classes.has('geneo-tour-geneo-toolbar'));
context.main.querySelector = selector => selector === '[data-geneo-toolbar-item="shape"]'
    ? { getBoundingClientRect: () => ({ left: 230, top: 10, right: 360, bottom: 50 }) }
    : selector === '.geneo-editor-toolbar-left'
        ? { getBoundingClientRect: () => ({ left: 0, top: 0, right: 300, bottom: 58 }) }
        : {};
evaluate("geneoTourRuntime.index = geneoTourSteps.findIndex(step => step.id === 'geneograph-other-objects')");
const toolsHighlight = context.geneoTourTargetRect({
    getBoundingClientRect: () => ({ left: 180, top: 10, right: 220, bottom: 50 })
});
assert.equal(toolsHighlight.right, 300, 'Tools spotlight must stop before the pinned Export column');
evaluate("geneoTourOpenPreview({ id: 'geneograph-create-modal' })");
assert.equal(modalOpens, 1);
assert.equal(modalBackdrop.inert, true);
assert.equal(evaluate('geneoTourRuntime.ownedPreview'), 'modal');
evaluate('geneoTourClosePreview()');
assert.equal(modalCloses, 1);
evaluate('geneoTourClearTreeReveal()');
assert.ok(!classes.has('geneo-tour-geneo-toolbar'));
const mapClasses = new Set();
let currentFocused = false;
let browseFocused = false;
const mapCard = { setAttribute()
{
}, removeAttribute()
{
} };
const currentCard = { offsetTop: 100, offsetHeight: 68, focus()
{
    currentFocused = true;
} };
const mapList = { offsetTop: 0, clientHeight: 300, scrollTop: 0 };
const browseButton = { focus()
{
    browseFocused = true;
} };
const stepView = { hidden: false };
const mapView = { hidden: true };
const fakeRoot = {
    classList: { add(...values)
    {
        values.forEach(value => mapClasses.add(value));
    }, remove(...values)
    {
        values.forEach(value => mapClasses.delete(value));
    } },
    querySelector(selector)
    {
        return ({ '[data-geneo-tour-step-view]': stepView,
            '[data-geneo-tour-map-view]': mapView, '.geneo-tour-card': mapCard,
            '[data-geneo-tour-module].is-current': currentCard,
            '.geneo-tour-map-list': mapList,
            '[data-geneo-tour-action="browse-modules"]': browseButton })[selector];
    }
};
context.fakeRoot = fakeRoot;
context.geneoTourPosition = () => {};
evaluate('geneoTourRuntime.root = fakeRoot; geneoTourRuntime.transitioning = false; geneoTourOpenModuleMap()');
assert.ok(mapClasses.has('is-module-map'));
assert.equal(stepView.hidden, true);
assert.equal(mapView.hidden, false);
assert.ok(currentFocused);
evaluate('geneoTourCloseModuleMap()');
assert.ok(!mapClasses.has('is-module-map'));
assert.equal(stepView.hidden, false);
assert.equal(mapView.hidden, true);
assert.ok(browseFocused);
console.log('Geneograph tour route, Russian copy, editor preparation, modal cleanup, and disabled import passed.');
