const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const archive = fs.readFileSync(path.join(root, 'archive.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(root, 'state-tree-core.js'), 'utf8');
const state = {
    activeModule: 'Albums', archiveView: 'favorites', archiveSelectedFolderId: 'inbox',
    archiveSelectedFolderItemId: null, archiveSelectedFileId: null,
    archiveSelectedFileIds: [], archiveSelectedSourceId: 'as1', archiveSearch: 'original',
    archiveFileFilters: { scope: 'all' }, archiveFilterPresentation: 'flat',
    archiveFilterScopeFolderId: null, archiveExpandedFolders: {},
    archiveNavigationBackStack: [], archiveNavigationForwardStack: [],
    archiveInspectorCollapsed: true, archiveFileEditing: false,
    archiveFileEditDraft: null, archiveInspectorSections: { details: false }
};
const original = structuredClone(state);
let modalOpen = false;
let modalParent = null;
const context = vm.createContext({
    state, structuredClone, console, innerWidth: 1280,
    document: {
        body: { classList: { add()
        {
        }, remove()
        {
        } } },
        querySelector()
        {
            return null;
        }
    },
    modalBackdrop: { inert: false, classList: { contains(name)
    {
        return name === 'open' && modalOpen;
    } } },
    archiveFileFiltersWithDefaults: values => ({ scope: 'all', ...values }),
    archiveNormalizeLocationSnapshot: values => values,
    activateProject(_id, { moduleName })
    {
        state.activeModule = moduleName;
    },
    render()
    {
    },
    renderArchive()
    {
    },
    requestAnimationFrame(callback)
    {
        callback();
    },
    openArchiveCreateFolderModal(parentId)
    {
        modalParent = parentId;
        modalOpen = true;
    },
    closeModal()
    {
        modalOpen = false;
    }
});
vm.runInContext(source, context);
const evaluate = expression => vm.runInContext(expression, context);
const steps = evaluate('geneoTourSteps');
const archiveSteps = steps.filter(step => step.module === 'Archive');
assert.deepEqual(Array.from(archiveSteps, step => step.id), [
    'archive-welcome', 'archive-navigation', 'archive-folders', 'archive-location',
    'archive-table', 'archive-folder-actions', 'archive-folder-modal',
    'archive-inspector', 'archive-file-actions', 'archive-to-notes'
]);
assert.equal(archiveSteps[0].presentation, 'centered');
assert.equal(steps[steps.indexOf(archiveSteps.at(-1)) + 1].module, 'Notes');
assert.ok(archive.includes("id: 'opis3'") && archive.includes("id: 'delo44'") && archive.includes("id: 'af1'"));

const start = localization.indexOf('const RU_UI_TOUR =');
const end = localization.indexOf('const RU_UI_MODULE_BLOCKS =', start);
const russian = vm.runInNewContext(`${localization.slice(start, end)}\nRU_UI_TOUR`);
for (const step of archiveSteps)
{
    assert.ok(russian[step.title], `Missing Russian title: ${step.title}`);
    assert.ok(russian[step.body], `Missing Russian copy: ${step.body}`);
}

const prepare = id => evaluate(`geneoTourPrepare(geneoTourSteps.findIndex(step => step.id === '${id}'))`);
prepare('archive-location');
assert.equal(state.archiveSelectedFolderId, 'opis3');
assert.equal(state.archiveSelectedFileId, null);
prepare('archive-folder-actions');
assert.equal(state.archiveSelectedFolderItemId, 'delo44');
prepare('archive-folder-modal');
evaluate("geneoTourOpenPreview({ id: 'archive-folder-modal' })");
assert.equal(modalParent, 'delo44');
assert.equal(modalOpen, true);
assert.equal(context.modalBackdrop.inert, true);
evaluate('geneoTourClosePreview()');
assert.equal(modalOpen, false);
prepare('archive-inspector');
assert.equal(state.archiveSelectedFolderId, 'delo44');
assert.equal(state.archiveSelectedFileId, 'af1');
assert.equal(state.archiveInspectorSections.details, true);
context.main = { querySelector(selector)
{
    if (selector === '#archive-file-section-details')
        return { getBoundingClientRect: () => ({ bottom: 540 }) };
    if (selector === '.archive-inspector-scroll')
        return { getBoundingClientRect: () => ({ left: 900, right: 1250, top: 120, bottom: 650 }) };
    return null;
} };
evaluate("geneoTourRuntime.index = geneoTourSteps.findIndex(step => step.id === 'archive-inspector')");
const bounds = evaluate('geneoTourTargetRect({ getBoundingClientRect: () => ({ top: 150 }) })');
assert.deepEqual(Array.from([bounds.left, bounds.top, bounds.right, bounds.bottom]), [900, 150, 1250, 540]);
assert.ok(!source.includes("'archive-inspector': '#archive-file-section-details'"));
assert.match(stateSource, /archiveInspectorSections:\s*\{\s*details: true,\s*sources: false,/);
evaluate('geneoTourRestoreArchiveState()');
for (const key of Object.keys(original).filter(key => key.startsWith('archive')))
    assert.deepEqual(state[key], original[key], `Archive state was not restored: ${key}`);

assert.equal(evaluate("geneoTourTertiarySelectors['archive-folder-actions']"),
    '.archive-folder-inspector-actions [data-archive-create-folder]');
assert.match(source, /data-geneo-tour-block-tertiary/);
console.log('Archive tour route, localization, preparation, dialog cleanup, and state restoration passed.');
