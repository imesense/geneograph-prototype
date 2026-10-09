const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'sample-data.js'), 'utf8');
const data = vm.runInNewContext(`${source}\nsampleData`, {});
const photos = data.media;
const byId = id => photos.find(photo => photo.id === id);
const year = value => Number(String(value || '').match(/\d{4}/)?.[0]) || null;
const photoYears = photo => {
    const date = photo.date || {};
    const value = year(date.date);
    switch (date.dateType) {
    case 'Before': return [-Infinity, value - 1];
    case 'After': return [value + 1, Infinity];
    case 'Between': return [year(date.fromDate), year(date.toDate)];
    default: return [value, value];
    }
};

assert.equal(photos.length, 14);
assert.deepEqual(Array.from(byId('photo-family-table').personIds), ['silver', 'luna', 'pearl']);
assert.deepEqual(Array.from(byId('photo-purrington-family').personIds), ['pearl', 'silver']);

let taggedPhotos = 0;
let taggedPeople = 0;
for (const photo of photos) {
    const tags = photo.personIds || [];
    const regions = photo.personRegions || {};
    assert.deepEqual(Object.keys(regions).sort(), Array.from(tags).sort(), `${photo.id}: tags and regions differ`);
    if (tags.length) taggedPhotos += 1;
    taggedPeople += tags.length;
    for (const [personId, region] of Object.entries(regions)) {
        for (const key of ['x', 'y', 'width', 'height']) {
            assert.ok(Number.isFinite(region[key]), `${photo.id}/${personId}: ${key} is not finite`);
        }
        assert.ok(region.x >= 0 && region.y >= 0, `${photo.id}/${personId}: negative origin`);
        assert.ok(region.width >= .06 && region.height >= .06, `${photo.id}/${personId}: region too small`);
        assert.ok(region.x + region.width <= 1 && region.y + region.height <= 1,
            `${photo.id}/${personId}: region outside image`);
    }
    const [earliest, latest] = photoYears(photo);
    for (const personId of tags) {
        const person = data.people.find(candidate => candidate.id === personId);
        assert.ok(person, `${photo.id}: missing person ${personId}`);
        const born = year(person.birth?.date);
        const died = year(person.death?.date);
        if (earliest != null && died != null)
            assert.ok(earliest <= died, `${photo.id}: dated after ${personId} died`);
        if (latest != null && born != null)
            assert.ok(latest >= born, `${photo.id}: dated before ${personId} was born`);
    }
}
assert.equal(taggedPhotos, 12);
assert.equal(taggedPeople, 21);
console.log('Sample face regions: all 21 tags have valid, in-bounds regions.');
