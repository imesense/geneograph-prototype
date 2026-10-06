const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'notes.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'notes-places.css'), 'utf8');
const start = source.indexOf('const defaultNotesFilters =');
const end = source.indexOf('function notesFilterCount()', start);
assert.ok(start >= 0 && end > start, 'Notes filter definitions were not found');

const links = [
    { projectId: 'p1', targetId: 'n1', sourceId: 's1' },
    { projectId: 'p2', targetId: 'n1', sourceId: 's2' }
];
const context = vm.createContext({
    state: { language: 'en', notesFilters: {} },
    currentProjectId: () => 'p1',
    getPeople: () => [],
    sampleData: { places: [] },
    getPlaceDisplay: () => '',
    personResourceDisplayName: () => '',
    connectedSourceFilterOptions: () => [],
    cloneSharedFilterValues: (schema, values) => Object.fromEntries(
        schema.map(field => [field.key, values[field.key]])
    ),
    sourceIdsForTarget: (type, id, projectId) => links
        .filter(link => type === 'note' && link.targetId === id && link.projectId === projectId)
        .map(link => link.sourceId)
});
vm.runInContext(source.slice(start, end), context);
const evaluate = expression => vm.runInContext(expression, context);
const keys = Array.from(evaluate('notesFilterSchema'), field => field.key);
assert.deepEqual(keys, [
    'personId', 'placeId', 'sourceId', 'hasNotes', 'hasPhotos',
    'hasFiles', 'hasEvents', 'noCollections'
]);
assert.ok(evaluate('notesFilterSchema.slice(0, 3).every(field => field.control === "combobox" && !field.multiple)'));
assert.ok(evaluate('notesFilterSchema.slice(3).every(field => field.control === "boolean")'));

const matches = (note, filters, projectId = 'p1') => {
    context.note = note;
    context.filters = { ...Object.fromEntries(keys.map(key => [key, false])), ...filters };
    context.projectId = projectId;
    return evaluate('noteMatchesNotesFilters(note, filters, projectId)');
};
const full = {
    id: 'n1', linkedPersonIds: ['person-1'], linkedPlaceIds: ['place-1'],
    relatedNoteIds: ['n2'], linkedPhotoIds: ['photo-1'],
    linkedArchiveFileIds: ['file-1'], linkedEventIds: ['event-1'],
    collectionIds: ['collection-1']
};
const empty = { id: 'n2', collectionIds: [] };
assert.equal(matches(full, { personId: 'person-1', placeId: 'place-1', sourceId: 's1',
    hasNotes: true, hasPhotos: true, hasFiles: true, hasEvents: true }), true);
for (const [key, value] of Object.entries({
    personId: 'other', placeId: 'other', sourceId: 'other', noCollections: true
}))
{
    assert.equal(matches(full, { [key]: value }), false, key);
}
for (const key of ['hasNotes', 'hasPhotos', 'hasFiles', 'hasEvents'])
{
    assert.equal(matches(empty, { [key]: true }), false, key);
}
assert.equal(matches(empty, { noCollections: true }), true);
assert.equal(matches(full, { sourceId: 's2' }, 'p1'), false);
assert.equal(matches(full, { sourceId: 's2' }, 'p2'), true);

const state = fs.readFileSync(path.join(root, 'state-tree-core.js'), 'utf8');
const shared = fs.readFileSync(path.join(root, 'shared-actions.js'), 'utf8');
assert.match(shared, /state\.notesFilters = \{\s*\.\.\.defaultNotesFilters/);
assert.match(source, /state\.notesFilters = \{ \.\.\.defaultNotesFilters \}/);
assert.match(state, /notesFilters: \{\s*personId: ''/);
assert.match(styles, /\.notes-filter-popover \{[\s\S]*?width: min\(420px, calc\(100vw - 24px\)\)/);
assert.match(styles, /\.notes-filter-popover \.shared-filter-fields \{\s*grid-template-columns: repeat\(3/);
assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*?\.notes-filter-popover \.shared-filter-fields \{\s*grid-template-columns: repeat\(2/);
assert.match(source, /const available = placeBelow \? below : above;/);
assert.match(source, /if \(menuRect\.height > available\) menu\.style\.maxHeight/);
console.log('Notes filter schema, matching, and reset checks passed.');
