const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const tour = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const start = localization.indexOf('const RU_TOUR_CARD_COPY =');
const end = localization.indexOf('const RU_UI_TOUR =', start);
assert.ok(start >= 0 && end > start, 'Missing ID-keyed Russian tour copy');
const russian = vm.runInNewContext(`${localization.slice(start, end)}\nRU_TOUR_CARD_COPY`);
const context = vm.createContext({
    state: { language: 'en' }, window: { L: {} }, placesMapRuntime: { map: {} }
});
vm.runInContext(localization.slice(start, end), context);
vm.runInContext(tour, context);
const steps = vm.runInContext('geneoTourSteps', context);
const ids = Array.from(steps, step => step.id);
assert.equal(steps.length, 111);
assert.equal(new Set(ids).size, 111);
assert.deepEqual(Object.keys(russian).sort(), ['welcome', ...ids, 'finish'].sort());
assert.deepEqual(Object.fromEntries(['Projects', 'Family Tree', 'People', 'Geneograph',
    'Albums', 'Archive', 'Notes', 'Places'].map(module =>
    [module, steps.filter(step => step.module === module).length])), {
    Projects: 8, 'Family Tree': 15, People: 13, Geneograph: 23,
    Albums: 12, Archive: 11, Notes: 12, Places: 17
});
assert.ok(!ids.includes('places-edit-modal'));

const card = (index, language) =>
{
    context.state.language = language;
    vm.runInContext(`geneoTourRuntime.index = ${index}`, context);
    return vm.runInContext('geneoTourCardCopy()', context);
};
const indexes = [-1, ...steps.map((_, index) => index), steps.length];
const rows = indexes.map(index =>
{
    const module = index < 0 || index >= steps.length ? 'Tour' : steps[index].module;
    const english = card(index, 'en');
    const translated = card(index, 'ru');
    for (const value of [english.title, english.body, translated.title, translated.body])
        assert.ok(typeof value === 'string' && value.trim(), `Blank copy at stop ${index}`);
    return [module, english.title, english.body, translated.title, translated.body];
});
assert.equal(rows.length, 113);
assert.notEqual(russian['people-saved-filters'].title, russian['places-saved-filters'].title);

// SHA-256 of the 113 approved workbook rows, excluding its removed Edit a place row.
const digest = createHash('sha256').update(rows.map(row => row.join('\0')).join('\n')).digest('hex');
assert.equal(digest, '187c24ccff29b98d42bdc565cd2de5165bbd511985a0b4943ac45bba60aa78d9',
    'Tour copy differs from the approved workbook or its slide order');
console.log('All 113 tour cards match the approved workbook.');
