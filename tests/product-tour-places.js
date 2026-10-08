const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const tourCss = fs.readFileSync(path.join(root, 'product-tour.css'), 'utf8');
const placesCss = fs.readFileSync(path.join(root, 'notes-places.css'), 'utf8');
const placesSource = fs.readFileSync(path.join(root, 'places.js'), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(source, context);
const steps = vm.runInContext('geneoTourSteps', context);
const places = Array.from(steps.filter(step => step.module === 'Places'));
assert.deepEqual(places.map(step => step.id), [
    'places-welcome', 'places-navigation', 'places-countries', 'places-map',
    'places-routes', 'places-list', 'places-filters', 'places-save-filter',
    'places-saved-filters', 'places-add-button', 'places-add-modal',
    'places-add-coordinates', 'places-add-map', 'places-add-create',
    'places-inspector', 'places-actions', 'places-outro'
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
assert.match(placesSource, /id="placesRouteSubjectSearch"/);
assert.match(placesSource, /id="placesRouteSubjectOption\$\{index\}"/);
assert.match(placesSource, /popover\.classList\.toggle\('is-constrained'/);
assert.match(placesCss, /\.places-route-popover\.is-constrained \.places-route-popup-body\s*\{\s*overflow-y: auto;/);
assert.match(source, /'places-routes': '#placesRouteMenu'/);
assert.match(source, /stepId === 'places-routes' && innerWidth > 640/);
assert.match(source, /preferred\.push\(\[x - width - 12/);
assert.match(source, /'places-save-filter': '#placesSaveFilter'/);
assert.match(source, /step\.id === 'places-save-filter' \? \{ mapped: 'mapped' \} : \{\}/);
assert.match(source, /if \(stepId === 'places-actions'\)/);
assert.match(source, /target\.closest\('\.places-inspector-toolbar'\)/);
assert.match(source, /'places-filters', 'places-routes', 'places-actions',\s*'places-add-coordinates'\]\.includes\(stepId\) \? 2 : 8/);
assert.doesNotMatch(source, /places-edit-modal/);
assert.match(source, /startPlaceEditorMapSelection\(\)/);
assert.match(source, /handlePlacesMapClick\(\{ latlng:/);
assert.match(source, /map\.containerPointToLatLng\(/);
assert.match(source, /placesDraftCoordinates = \{ lat: pending\.lat, lng: pending\.lng \}/);
assert.match(source, /geneoTourRuntime\.placesDraftCoordinates = null/);
assert.match(tourCss, /\.geneo-tour\.is-modal-stop\.is-places-add-modal \.geneo-tour-card\s*\{\s*width: 248px;/);
assert.match(source, /stepId === 'places-add-coordinates' && innerWidth >= 1260 && innerWidth <= 1280/);
assert.match(source, /details\.getBoundingClientRect\(\)\.bottom - body\.getBoundingClientRect\(\)\.bottom \+ 8/);
assert.match(source, /bottom: Math\.min\(body\.bottom, Math\.max\(buttonBottom, details\.bottom\)\)/);
assert.match(source, /bottom: Math\.min\(rect\.bottom, body\.bottom\)/);
assert.match(tourCss, /\.geneo-tour\.is-finish \.geneo-tour-card-head\s*\{\s*display: none;/);
assert.match(placesCss, /@media \(min-width: 1180px\) and \(max-width: 1280px\)\s*\{\s*\.places-coordinate-bar/);
assert.match(placesCss, /\.places-coordinate-bar > div\s*\{\s*grid-column: 1 \/ -1;/);
assert.match(source, /cancelPlacesMapEditing\(\{ reopenEditor: false \}\)/);
assert.match(source, /openTopbarPopover\('help', anchor\)/);
assert.match(source, /'places-outro': '#topbarPopover \[data-help-tour\]'/);
assert.match(source, /'places-outro': '\[data-topbar-help\]'/);
assert.match(source, /stepId === 'places-filters' && innerWidth > 640/);
assert.match(source, /stepId === 'places-add-coordinates' && innerWidth > 640/);
assert.match(source, /stepId === 'places-add-map' && innerWidth > 640/);
assert.match(source, /geneoTourRestorePlacesState\(\)/);
assert.match(source, /if \(leavingPlaces\) geneoTourRestorePlacesState/);
assert.match(source, /\['restart', 'Start again'\], \['finish', 'Explore the demo'\]/);
assert.match(source, /else if \(action === 'restart'\)/);
assert.equal(russian['Start again'], 'Начать заново');
assert.ok(!steps.some(step => step.id === 'places-people'));
console.log('Places tour route, localization, previews, and restoration checks passed.');
