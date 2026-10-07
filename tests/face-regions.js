const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const mediaSource = fs.readFileSync(path.join(root, 'shared-media.js'), 'utf8');
const albumsSource = fs.readFileSync(path.join(root, 'albums.js'), 'utf8');
const data = {
    people: [{ id: 'person', projectId: 'one', primaryPhotoId: 'photo', primaryPhotoCrop: null }],
    media: [{ id: 'photo', projectId: 'one', personIds: ['person'], personRegions: {}, updatedAt: '' }],
    albums: []
};
const context = vm.createContext({
    sampleData: data,
    getPerson: id => data.people.find(person => person.id === id),
    render: () => {},
    showToast: () => {},
    currentProjectId: () => 'one'
});
vm.runInContext(mediaSource, context);
const evaluate = expression => vm.runInContext(expression, context);

assert.equal(evaluate('normalizeFaceRegion(null)'), null);
assert.equal(evaluate('normalizeFaceRegion({ x: 0, y: 0, width: NaN, height: 1 })'), null);
assert.deepEqual(JSON.parse(JSON.stringify(evaluate('normalizeFaceRegion({ x: .9, y: -.2, width: .4, height: .01 })'))), {
    x: .6, y: 0, width: .4, height: .06
});
assert.equal(evaluate('setPhotoPersonRegion(sampleData.media[0], "person", { x: .2, y: .3, width: .25, height: .3 })'), true);
assert.equal(evaluate('photoPersonRegion(sampleData.media[0], "person").x'), .2);
assert.equal(evaluate('setPhotoPersonRegion(sampleData.media[0], "other", { x: .1, y: .1, width: .2, height: .2 })'), false);
assert.equal(evaluate('setPersonPrimaryPhoto("person", "photo", null, { rerender: false, notify: false })'), true);
assert.equal(data.people[0].primaryPhotoId, 'photo');
assert.equal(data.people[0].primaryPhotoCrop, null);
assert.equal(evaluate('setPhotoPersonRegion(sampleData.media[0], "person", null)'), true);
assert.equal(evaluate('setPersonPrimaryPhoto("person", "photo", { centerX: .3, centerY: .4, zoom: 1.5, rotation: 0 }, { rerender: false, notify: false })'), true);
assert.equal(data.people[0].primaryPhotoCrop.zoom, 1.5);
assert.equal(evaluate('setPhotoPersonRegion(sampleData.media[0], "person", { x: .2, y: .3, width: .25, height: .3 })'), true);
assert.equal(evaluate('setPhotoPersonIds("photo", [], { rerender: false })'), true);
assert.equal(evaluate('photoPersonRegion(sampleData.media[0], "person")'), null);
assert.equal(data.people[0].primaryPhotoId, '');
assert.deepEqual(JSON.parse(JSON.stringify(data.media[0].personRegions)), {});
assert.equal(evaluate('setPhotoPersonIds("photo", ["person"], { rerender: false })'), true);
assert.equal(evaluate('photoPersonRegion(sampleData.media[0], "person")'), null);
assert.equal(evaluate('setPhotoPersonRegion(sampleData.media[0], "person", { x: .1, y: .1, width: .2, height: .2 })'), true);
assert.equal(evaluate('setPersonPhotoIds("person", [], { rerender: false })'), true);
assert.equal(evaluate('photoPersonRegion(sampleData.media[0], "person")'), null);

assert.match(albumsSource, /renderFaceRegionSelector\(photo, region\)/);
assert.match(albumsSource, /renderFaceRegionSelector\(photo, activePerson \? regions\[activePerson\.id\] : null/);
assert.match(albumsSource, /otherRegions = \[\.\.\.selectedIds\]/);
assert.match(albumsSource, /data-albums-person-region/);
console.log('Face regions: normalization, tagging, primary-photo cleanup, and shared selector checks passed.');
