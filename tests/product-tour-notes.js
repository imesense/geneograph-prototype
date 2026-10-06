const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const notes = fs.readFileSync(path.join(root, 'notes.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'product-tour.css'), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(source, context);
const steps = vm.runInContext('geneoTourSteps', context);
const ids = Array.from(steps.filter(step => step.module === 'Notes'), step => step.id);
assert.deepEqual(ids, [
    'notes-welcome', 'notes-navigation', 'notes-collections', 'notes-list-example', 'notes-filters',
    'notes-editor-overview', 'notes-rich-text', 'notes-sections', 'notes-checklist',
    'notes-add-actions', 'notes-add-events', 'notes-to-places'
]);
assert.equal(steps.find(step => step.id === 'notes-welcome').presentation, 'centered');
assert.equal(steps.findIndex(step => step.id === 'notes-welcome'),
    steps.findIndex(step => step.id === 'archive-to-notes') + 1);
assert.equal(steps.findIndex(step => step.id === 'places-welcome'),
    steps.findIndex(step => step.id === 'notes-to-places') + 1);
assert.match(source, /state\.selectedNoteId = 'note-daisy-parentage'/);
assert.match(source, /'notes-list-example': '\[data-note-id="note-daisy-parentage"\]'/);

const start = localization.indexOf('const RU_UI_TOUR =');
const end = localization.indexOf('const RU_UI_MODULE_BLOCKS =', start);
const russian = vm.runInNewContext(`${localization.slice(start, end)}\nRU_UI_TOUR`);
for (const step of steps.filter(step => step.module === 'Notes'))
{
    assert.ok(russian[step.title], `Missing Russian title: ${step.title}`);
    assert.ok(russian[step.body], `Missing Russian copy: ${step.body}`);
}
for (const legacy of ['Choose a research note',
    'All notes keeps observations and open questions easy to find.'])
{
    assert.ok(!source.includes(legacy), `Legacy Notes stop remains: ${legacy}`);
}
assert.ok(!ids.includes('notes-list') && !ids.includes('notes-editor'));
assert.match(source, /openNotesFilterMenu\(anchor\)/);
assert.match(source, /openNotesEventsModal\(\)/);
assert.match(source, /geneoTourRuntime\.ownedPreview = 'notes-filters'/);
assert.match(source, /if \(leavingNotes\) geneoTourRestoreNotesState/);
assert.match(source, /geneoTourRestoreNotesState\(\);/);
assert.match(notes, /data-notes-tour-target="navigation"/);
assert.match(notes, /data-notes-tour-target="collections"/);
assert.match(styles, /geneo-tour-notes-sidebar/);
assert.match(styles, /geneo-tour-notes-tabs/);
assert.match(source, /'archive-filters',\s*'notes-filters', 'places-filters'/);
assert.equal(vm.runInContext("geneoTourSecondarySelectors['notes-add-actions']", context), undefined);
assert.match(source, /'notes-add-actions': '\[data-note-editor-section="events"\] \[data-note-manage-links="event"\]'/);
context.innerWidth = 900;
context.innerHeight = 720;
context.main = { querySelector: selector => ({
    '.notes-right-pane': { left: 0, top: 52, right: 900, bottom: 720 },
    '.notes-editor-header': { bottom: 219 }
}[selector] ? { getBoundingClientRect: () => ({
    '.notes-right-pane': { left: 0, top: 52, right: 900, bottom: 720 },
    '.notes-editor-header': { bottom: 219 }
}[selector]) } : null) };
vm.runInContext("geneoTourRuntime.index = geneoTourSteps.findIndex(step => step.id === 'notes-rich-text')", context);
const richBounds = vm.runInContext('geneoTourTargetRect({ getBoundingClientRect: () => ({ left: 20, top: 243, right: 880, bottom: 563 }) })', context);
assert.deepEqual(Array.from([richBounds.left, richBounds.right]), [20, 508]);
context.innerWidth = 1280;
context.main = { querySelector: selector => ({
    '.notes-right-pane': { left: 820, top: 52, right: 1280, bottom: 720 },
    '.notes-editor-header': { bottom: 260 }
}[selector] ? { getBoundingClientRect: () => ({
    '.notes-right-pane': { left: 820, top: 52, right: 1280, bottom: 720 },
    '.notes-editor-header': { bottom: 260 }
}[selector]) } : null) };
vm.runInContext("geneoTourRuntime.index = geneoTourSteps.findIndex(step => step.id === 'notes-sections')", context);
const sectionBounds = vm.runInContext('geneoTourTargetRect({ getBoundingClientRect: () => ({ left: 841, top: 105, right: 1260, bottom: 696 }) })', context);
assert.equal(sectionBounds.top, 272);
const pane = { scrollTop: 0, getBoundingClientRect: () => ({ top: 52 }) };
const page = { scrollTop: 0 };
context.document = { scrollingElement: page };
context.main = { querySelector: selector => selector === '.notes-right-pane' ? pane
    : selector === '.notes-editor-header' ? { getBoundingClientRect: () => ({ bottom: 260 }) } : null };
vm.runInContext('geneoTourAlignNotesTarget({ getBoundingClientRect: () => ({ top: 801 }) })', context);
assert.equal(pane.scrollTop, 529);
context.innerWidth = 900;
pane.scrollTop = 20;
vm.runInContext('geneoTourAlignNotesTarget({ getBoundingClientRect: () => ({ top: 500 }) })', context);
assert.equal(pane.scrollTop, 0);
assert.equal(page.scrollTop, 410);
assert.match(source, /geneoTourAlignNotesTarget\(target\)/);
assert.match(source, /notesOriginScroll\.page = document\.scrollingElement/);
console.log('Notes tour route, localization, previews, and restoration checks passed.');
