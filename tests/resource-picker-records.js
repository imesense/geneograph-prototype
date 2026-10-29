const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/resource-picker-records.js'), 'utf8');
const data = {
    notes: [
        { id: 'n1', projectId: 'p1', title: 'Research', body: 'A short note', collectionIds: ['c1', 'c2'], linkedPlaceIds: ['p-a'] },
        { id: 'n2', projectId: 'p1', title: 'Archived', archived: true, collectionIds: [] },
        { id: 'n3', projectId: 'p2', title: 'Other project' }
    ],
    noteCollections: [{ id: 'c1', projectId: 'p1', name: 'Family' }, { id: 'c2', projectId: 'p1', name: 'Research' }],
    sources: [
        { id: 's1', projectId: 'p1', title: 'Archive', providedBy: 'Archive', category: 'institution' },
        { id: 's2', projectId: 'p1', title: 'Book', providedBy: 'Publisher', category: '', favorite: true },
        { id: 's3', projectId: 'p2', title: 'Private' }
    ],
    places: [
        { id: 'p-a', projectId: 'p1', name: 'Town, Region', alternativeNames: ['Oldtown'] },
        { id: 'p-b', projectId: 'p1', name: 'City, Country', alternativeNames: ['Historic City'], coordinates: { lat: 0, lng: 0 } },
        { id: 'p-c', projectId: 'p2', name: 'Other place' }
    ],
    sourceLinks: [{ sourceId: 's1', targetId: 'n1', targetType: 'note', projectId: 'p1' }]
};
let project = 'p1';
let captured;
let editorLaunch;
let createdOptions;
let renderCount = 0;
let toast;
const plain = value => String(value || '');
const ids = values => Array.from(values);
const context = vm.createContext({
    sampleData: data, window: {}, state: { selectedNoteId: 'n1', selectedPlaceId: 'previous', language: 'en' },
    currentProjectId: () => project,
    validProjectById: id => ['p1', 'p2'].includes(id) ? { id } : null,
    rpText: en => en, t: plain, localizedDataFieldValue: plain, localizedNoteBodyText: plain,
    escapeHtml: value => plain(value).replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    icon: { close: '', note: '<svg></svg>', source: '', archive: '', place: '', pin: '' },
    noteSearchText: note => `${note.title} ${note.body || ''}`,
    renderRichTextDeltaHtml: (delta, fallback) => `<p>${plain(fallback).replaceAll('<', '&lt;')}</p>`,
    SOURCE_CATEGORIES: [{ value: 'institution', label: 'Institution', shortLabel: 'Institutions' }],
    localizedSourceCategoryLabel: value => value || '',
    getNote: (id, options = {}) => data.notes.find(note => note.id === id && (!options.projectId || note.projectId === options.projectId)),
    projectPlaces: id => data.places.filter(place => place.projectId === id),
    notesSuggestedPlaceIds: () => new Set(['p-b']),
    placePrimaryName: place => place.name.split(',')[0],
    placeSecondaryName: place => place.name.split(',').slice(1).join(',').trim(),
    placeAlternativeNames: place => place.alternativeNames || [],
    normalizePlaceLookupText: value => plain(value).trim().toLowerCase(),
    normalizePlaceCoordinates: place => place.coordinates || null,
    formatPlaceCoordinates: place => `${place.coordinates.lat}, ${place.coordinates.lng}`,
    sourceTargetRecord: (type, id, projectId) => data.notes.find(note => type === 'note' && note.id === id && note.projectId === projectId),
    connectedSourceTargetLabel: (type, record) => record.title || record.name || '',
    sourceIdsForTarget: (type, id, projectId) => data.sourceLinks.filter(link => link.targetType === type && link.targetId === id && link.projectId === projectId).map(link => link.sourceId),
    setSourceIdsForTarget: (type, id, next, { projectId }) =>
    {
        data.sourceLinks = next.map(sourceId => ({ sourceId, targetId: id, targetType: type, projectId }));
        return next;
    },
    setNoteEntityLinks: (id, type, next) =>
    {
        const note = data.notes.find(note => note.id === id);
        note.linkedPlaceIds = Array.from(next);
        return note;
    },
    openResourcePicker: (adapter, options) =>
    {
        captured = { adapter, options };
        return { existingIds: new Set(adapter.existingIds), selectedIds: new Set(adapter.mode === 'manage' ? adapter.existingIds : []),
            query: '', render() {}, selectCreated(values) { values.forEach(id => this.selectedIds.add(id)); },
            openEditor(launch) { launch(() => {}); }, error(message) { throw new Error(message); } };
    },
    openArchiveSourceModal: (id, options) => { editorLaunch = options; },
    openPlaceModal: (id, options) => { editorLaunch = options; },
    createCentralNote: options =>
    {
        createdOptions = options;
        const note = { id: 'created-note', projectId: options.projectId, title: options.title };
        data.notes.unshift(note);
        return note;
    },
    closeModal() {}, renderNotesPreservingInteraction: () => renderCount++, showToast: message => { toast = message; }
});
vm.runInContext(source, context);

async function main()
{
    let savedNotes;
    context.rpOpenNotePicker({ projectId: 'p1', includeArchived: true, excludeNoteIds: ['n1'],
        onSave: values => { savedNotes = values; return { addedLinkCount: 4 }; },
        successMessage: count => `${count} links`, onCreate: () => assert.fail('Legacy creation must not run') });
    let adapter = captured.adapter;
    assert.deepEqual(ids(adapter.records().map(note => note.id)), ['n2']);
    assert.equal(adapter.matchesFilters(data.notes[1], {}), false);
    assert.equal(adapter.matchesFilters(data.notes[1], { archived: true }), true);
    assert.equal(adapter.matchesScope(data.notes[0], 'collection:c2'), true);
    assert.equal(adapter.matchesScope(data.notes[1], 'unfiled'), true);
    assert.equal(adapter.commit(['n3']), false);
    const result = adapter.commit(['n2']);
    assert.deepEqual(savedNotes, ['n2']);
    adapter.afterCommit(['n2'], result);
    assert.equal(toast, '4 links');

    let submitted;
    const form = { elements: { title: { value: 'Created in picker' }, body: { value: '<script>not HTML</script>' } },
        reportValidity: () => true, addEventListener: (name, listener) => { submitted = listener; } };
    const selected = [];
    adapter.create({ openForm: (html, bind) =>
    {
        assert.match(html, /class="modal"/);
        bind({ querySelector: selector => selector === '[data-rp-note-form]' ? form : null });
    }, selectCreated: values => selected.push(...values) });
    submitted({ preventDefault() {} });
    assert.equal(createdOptions.activate, false);
    assert.equal(createdOptions.renderAfterCreate, false);
    assert.equal(createdOptions.inheritActiveContext, false);
    assert.equal(createdOptions.inheritActiveCollection, false);
    assert.deepEqual(selected, ['created-note']);
    assert.equal(data.notes[0].body, '<script>not HTML</script>');
    assert.ok(!adapter.preview(data.notes[0]).includes('<script>'));

    let draftSaved;
    context.rpOpenSourcePicker({ projectId: 'p1', draftSourceIds: ['s1'], onDraftSave: values => { draftSaved = values; } });
    adapter = captured.adapter;
    assert.deepEqual(ids(adapter.records().map(record => record.id)), ['s1', 's2']);
    assert.equal(adapter.matchesScope(data.sources[1], 'uncategorized'), true);
    assert.equal(adapter.describe(data.sources[0]).description, '');
    assert.equal(adapter.matchesFilters(data.sources[1], { favorite: true, provider: 'Publisher' }), true);
    await adapter.commit(['s1', 's2']);
    assert.deepEqual(ids(draftSaved), ['s1', 's2']);
    assert.equal(data.sourceLinks.length, 1);
    const sourceSelected = [];
    adapter.create({ openEditor: launch => launch(() => {}), selectCreated: values => sourceSelected.push(...values) });
    assert.equal(editorLaunch.targetProjectId, 'p1');
    assert.equal(typeof editorLaunch.modalOpener, 'function');
    editorLaunch.onCreated({ id: 's2' });
    assert.deepEqual(sourceSelected, ['s2']);
    assert.equal(data.sourceLinks.length, 1);

    context.rpOpenSourcePicker({ projectId: 'p1', targetType: 'note', targetId: 'n1' });
    adapter = captured.adapter;
    assert.equal(await adapter.commit(['s2']), true);
    assert.deepEqual(ids(context.sourceIdsForTarget('note', 'n1', 'p1')), ['s2']);
    const before = JSON.stringify(data.sourceLinks);
    context.setSourceIdsForTarget = () => null;
    assert.equal(await adapter.commit(['s2']), false);
    assert.equal(JSON.stringify(data.sourceLinks), before);

    let session = context.rpOpenPlacePicker({ noteId: 'n1', selectedIds: ['p-a', 'p-b', 'p-c'], query: 'Historic' });
    adapter = captured.adapter;
    assert.deepEqual(ids(session.selectedIds), ['p-a', 'p-b']);
    assert.equal(session.query, 'Historic');
    assert.equal(adapter.rank(data.places[1], 'Historic City'), 3);
    assert.match(adapter.searchText(data.places[1]), /Country.*Historic City|Historic City.*Country/);
    assert.equal(adapter.matchesScope(data.places[1], 'contextSuggested'), true);
    assert.equal(adapter.matchesFilters(data.places[1], { coordinates: true }), true);
    assert.equal(adapter.commit(['p-c']), false);
    assert.equal(adapter.commit(['p-b']), true);
    assert.deepEqual(ids(data.notes.find(note => note.id === 'n1').linkedPlaceIds), ['p-b']);
    adapter.afterCommit(['p-b'], true, session);
    assert.equal(renderCount, 1);
    assert.equal(adapter.matchesScope(data.places[1], 'recent'), true);
    adapter.create(session);
    assert.equal(typeof editorLaunch.modalOpener, 'function');
    context.state.selectedPlaceId = 'p-b';
    editorLaunch.completion.onComplete(data.places[1]);
    assert.equal(context.state.selectedPlaceId, 'previous');
    assert.deepEqual(ids(session.selectedIds), ['p-a', 'p-b']);

    context.rpOpenManagePlaces({ noteId: 'n1' });
    adapter = captured.adapter;
    assert.equal(adapter.mode, 'manage');
    assert.equal(adapter.commit([]), true);
    assert.deepEqual(ids(data.notes.find(note => note.id === 'n1').linkedPlaceIds), []);

    const owner = data.notes.find(note => note.id === 'n1');
    const linkContext = context.rpCreatePlaceOwnerContext({ projectId: 'p1', getRecord: () => owner,
        getIds: record => record.linkedPlaceIds, setIds: () => false });
    context.rpOpenPlacePicker({ linkContext });
    adapter = captured.adapter;
    assert.equal(adapter.commit(['p-b']), false);
    assert.deepEqual(ids(owner.linkedPlaceIds), []);
    owner.deleted = true;
    assert.notEqual(adapter.validate(), true);
    assert.equal(adapter.commit(['p-a']), false);
    project = 'p2';
    assert.equal(context.rpOpenPlacePicker({ linkContext }), null);
    assert.equal(context.rpOpenNotePicker({ projectId: 'p1', onSave() {} }), null);
    console.log('Resource picker record adapter tests passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
