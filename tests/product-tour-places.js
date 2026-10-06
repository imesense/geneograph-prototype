const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(source, context);
const steps = vm.runInContext('geneoTourSteps', context);
const places = Array.from(steps.filter(step => step.module === 'Places'));
assert.deepEqual(places.map(step => step.id), [
    'places-welcome', 'places-map', 'places-navigation', 'places-countries',
    'places-list', 'places-filters', 'places-saved-filters', 'places-routes',
    'places-inspector', 'places-actions', 'places-edit-modal', 'places-outro'
]);
assert.equal(places[0].presentation, 'centered');
assert.equal(steps.at(-1).id, 'places-outro');
assert.equal(steps.findIndex(step => step.id === 'places-welcome'),
    steps.findIndex(step => step.id === 'notes-to-places') + 1);

const start = localization.indexOf('const RU_UI_TOUR =');
const end = localization.indexOf('const RU_UI_MODULE_BLOCKS =', start);
const russian = vm.runInNewContext(`${localization.slice(start, end)}\nRU_UI_TOUR`);
for (const step of places)
{
    assert.ok(russian[step.title], `Missing Russian title: ${step.title}`);
    assert.ok(russian[step.body], `Missing Russian copy: ${step.body}`);
}
assert.match(source, /openPlacesFilterPopover\(anchor\)/);
assert.match(source, /openPlacesRouteMenu\(anchor\)/);
assert.match(source, /openPlaceModal\('place-meowbridge'\)/);
assert.match(source, /openTopbarPopover\('help', anchor\)/);
assert.match(source, /'places-outro': '#topbarPopover'/);
assert.match(source, /'places-outro': '\[data-topbar-help\]'/);
assert.match(source, /target\.querySelector\('\[data-help-tour\]'\)/);
assert.match(source, /geneoTourRestorePlacesState\(\)/);
assert.match(source, /if \(leavingPlaces\) geneoTourRestorePlacesState/);
assert.match(source, /\['restart', 'Start again'\], \['finish', 'Explore the demo'\]/);
assert.match(source, /else if \(action === 'restart'\)/);
assert.equal(russian['Start again'], 'Начать заново');
assert.ok(!steps.some(step => step.id === 'places-people'));
console.log('Places tour route, localization, previews, and restoration checks passed.');
