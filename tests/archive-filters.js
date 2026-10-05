const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'archive.js'), 'utf8');
const start = source.indexOf('const archiveFileFilterSchema =');
const end = source.indexOf('const archiveSourceFilterSchema =', start);
assert.ok(start >= 0 && end > start, 'Archive file filter schema was not found');

const options = () => [];
const schema = vm.runInNewContext(`${source.slice(start, end)}\narchiveFileFilterSchema`, {
    connectedSourceFilterOptions: options,
    archivePersonFilterOptions: options,
    archivePlaceFilterOptions: options
});
const keys = Array.from(schema, field => field.key);
assert.equal(keys[0], 'scope');
assert.deepEqual(keys.slice(-2), ['documentYears', 'sourceId']);
assert.equal(schema.at(-1).control, 'combobox');
assert.equal(schema.at(-1).getOptions, options);
assert.match(source, /panel\.querySelector\('\[data-shared-filter-select\]'\)\?\.focus\(\{ preventScroll: true \}\)/);
console.log('Archive file filter order and opening focus checks passed.');
