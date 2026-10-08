const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const tourSource = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localizationSource = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const peopleSource = fs.readFileSync(path.join(root, 'people.js'), 'utf8');
const dictionaryStart = localizationSource.indexOf('const RU_TOUR_CARD_COPY =');
const dictionaryEnd = localizationSource.indexOf('const RU_UI_TOUR =', dictionaryStart);
const russian = vm.runInNewContext(`${localizationSource.slice(dictionaryStart, dictionaryEnd)}\nRU_TOUR_CARD_COPY`);
const initialFilters = { surnames: ['Butterpaws'] };
const state = {
    activeModule: 'Projects', peopleFilters: structuredClone(initialFilters),
    peopleSavedViewId: 'historic-records', peopleSearch: 'Mochi', selectedPeopleId: 'mochi',
    peopleSelectedIds: ['mochi'], peopleSelectionAnchorId: 'mochi', peoplePage: 3,
    peopleView: 'directory', peopleSide: 'people', peoplePreviewCollapsed: true,
    peopleProfileEditTab: 'relationships'
};
const elements = new Map();
const document = {
    body: { classList: {
        add()
        {
        },
        remove()
        {
        }
    } },
    getElementById(id)
    {
        return elements.get(id) || null;
    }
};
const context = vm.createContext({
    state, document, structuredClone, console,
    activateProject(_id, { moduleName })
    {
        state.activeModule = moduleName;
    },
    peopleFiltersWithDefaults(filters = {})
    {
        return { surnames: [], ...filters };
    },
    render()
    {
    },
    currentProjectId()
    {
        return 'p1';
    },
    openPeopleColumnsPopover()
    {
        elements.set('peopleColumnsPopover', { inert: false });
    },
    closePeopleColumnsPopover()
    {
        elements.delete('peopleColumnsPopover');
    },
    openPeopleFilterPopover()
    {
        elements.set('peopleFilterPopover', { inert: false });
    },
    closePeopleFilterPopover()
    {
        elements.delete('peopleFilterPopover');
    }
});
vm.runInContext(tourSource, context);
const evaluate = expression => vm.runInContext(expression, context);
const steps = evaluate('geneoTourSteps');
const peopleSteps = steps.filter(step => step.module === 'People');
const expectedIds = [
    'people-welcome', 'people-navigation', 'people-table', 'people-columns',
    'people-filters', 'people-save-filter', 'people-saved-filters', 'people-to-profile',
    'people-profile-welcome', 'people-profile-hero', 'people-profile-card',
    'people-connected', 'people-to-geneograph'
];
assert.deepEqual(Array.from(peopleSteps, step => step.id), expectedIds);
assert.equal(steps[steps.indexOf(peopleSteps.at(-1)) + 1].module, 'Geneograph');
assert.equal(steps.at(-1).module, 'Places');
assert.equal(peopleSteps[0].presentation, 'centered');
assert.equal(peopleSteps[8].presentation, 'centered');
for (const step of peopleSteps)
{
    assert.ok(russian[step.id]?.title && russian[step.id].title !== step.title, `Missing Russian title: ${step.id}`);
    assert.ok(russian[step.id]?.body && russian[step.id].body !== step.body, `Missing Russian body: ${step.id}`);
}
assert.ok(!tourSource.includes("id: 'people-list'"));
assert.ok(!tourSource.includes("id: 'people-profile'"));
assert.ok(!localizationSource.includes("'Explore People':"));
assert.ok(!localizationSource.includes("'Find people in the directory':"));
assert.ok(peopleSource.includes('id="peopleSaveView"'));
assert.ok(peopleSource.includes('profile-resource-card--${type}'));

const prepare = id => evaluate(`geneoTourPrepare(geneoTourSteps.findIndex(step => step.id === '${id}'))`);
prepare('people-table');
assert.equal(state.peopleView, 'directory');
assert.equal(state.peopleFilters.surnames.length, 0);
assert.equal(state.selectedPeopleId, 'silver');
assert.equal(state.peopleSelectedIds.length, 0);
assert.equal(state.peoplePage, 1);
prepare('people-save-filter');
assert.equal(state.peopleFilters.surnames[0], 'Whiskerfield');
assert.equal(state.peopleSavedViewId, null);
prepare('people-profile-hero');
assert.equal(state.peopleView, 'profile');
assert.equal(state.peopleFilters.surnames.length, 0);
evaluate('geneoTourRestorePeopleState()');
assert.deepEqual(state.peopleFilters, initialFilters);
assert.equal(state.peopleSavedViewId, 'historic-records');
assert.equal(state.selectedPeopleId, 'mochi');
assert.deepEqual(state.peopleSelectedIds, ['mochi']);
assert.equal(state.peoplePage, 3);

elements.set('peopleColumnsButton', {});
evaluate("geneoTourOpenPreview({ id: 'people-columns' })");
assert.equal(elements.get('peopleColumnsPopover').inert, true);
evaluate('geneoTourClosePreview()');
assert.equal(elements.has('peopleColumnsPopover'), false);
elements.set('peopleFilterButton', {});
evaluate("geneoTourOpenPreview({ id: 'people-filters' })");
assert.equal(elements.get('peopleFilterPopover').inert, true);
evaluate('geneoTourClosePreview()');
assert.equal(elements.has('peopleFilterPopover'), false);
console.log('People tour route, copy, preparation, cleanup, and previews passed.');
