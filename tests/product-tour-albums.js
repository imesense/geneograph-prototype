const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(source, context);
const evaluate = expression => vm.runInContext(expression, context);
const steps = evaluate('geneoTourSteps');
const albums = Array.from(steps.filter(step => step.module === 'Albums'), step => step.id);
assert.deepEqual(albums, [
    'albums-welcome', 'albums-photos', 'albums-navigation', 'albums-albums',
    'albums-filters', 'albums-summary', 'albums-actions', 'albums-connections',
    'albums-tag-person', 'albums-tag-person-modal', 'albums-add-to-album-action',
    'albums-add-to-album', 'albums-to-archive'
]);
assert.match(source, /state\.selectedPhotoId = 'photo-silver-luna-wedding'/);
assert.ok(source.indexOf("if (step.module === 'Albums' && !geneoTourRuntime.albumsOrigin)")
    < source.indexOf("activateProject(GENEO_TOUR_PROJECT_ID, { moduleName: step.module, renderNow: false });"));
assert.match(source, /'albums-tag-person': '#albumsTagPeople'/);
assert.match(source, /'albums-tag-person-modal': '#modalBackdrop \.photo-people-modal'/);
assert.match(source, /'albums-add-to-album-action': '#albumsLinkAlbum'/);
assert.match(source, /openPhotoPeopleModal\('photo-silver-luna-wedding'\)/);
assert.match(source, /state\.selectedPhotoIds = \['photo-silver-luna-wedding'\]/);
assert.match(source, /state\.albumsDetailSections\.people = true;\s*state\.albumsDetailSections\.albums = true;/);
assert.match(source, /'people-filters', 'albums-filters', 'archive-filters'\]\.includes\(stepId\) \? 2 : 8/);

const dictionaryStart = localization.indexOf('const RU_UI_TOUR =');
const dictionaryEnd = localization.indexOf('const RU_UI_MODULE_BLOCKS =', dictionaryStart);
const russian = vm.runInNewContext(`${localization.slice(dictionaryStart, dictionaryEnd)}\nRU_UI_TOUR`);
for (const id of albums)
{
    const step = steps.find(candidate => candidate.id === id);
    assert.ok(russian[step.title], `Missing Russian title: ${step.title}`);
    assert.ok(russian[step.body], `Missing Russian copy: ${step.body}`);
}
console.log('Albums tour order, photo selection, modal targets, and Russian copy checks passed.');
