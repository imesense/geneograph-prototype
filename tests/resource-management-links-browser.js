const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'Family Tree' });
        });
        for (const entityType of ['note', 'source', 'place', 'photo', 'file'])
        {
            const data = await page.evaluate(entityType =>
            {
                const ownerType = ['file', 'photo'].includes(entityType) ? 'source' : 'file';
                const owners = ownerType === 'file' ? sampleData.archiveFiles.filter(file => file.projectId === 'p1').slice(0, 2).map(file => file.id)
                    : sampleData.sources.filter(source => source.projectId === 'p1').slice(0, 2).map(source => source.id);
                const records = archiveEntityConfig(entityType).records().filter(record => record.projectId === 'p1');
                const [first, second, concurrent] = records;
                archiveSetConnectionsAtomically(owners.flatMap(ownerId => records.slice(0, 3).map(record => ({ ownerType, ownerId, entityType, entityId: record.id, shouldLink: false }))));
                archiveSetConnectionsAtomically([{ ownerType, ownerId: owners[0], entityType, entityId: first.id, shouldLink: true }]);
                window.manager = rpOpenArchiveResourcePicker({ ownerType, ownerIds: owners, entityType });
                archiveSetConnectionsAtomically(owners.map(ownerId => ({ ownerType, ownerId, entityType, entityId: concurrent.id, shouldLink: true })));
                return { ownerType, owners, first: first.id, second: second.id, concurrent: concurrent.id, entityType };
            }, entityType);
            assert.equal(await page.locator(`[data-rp-check="${data.first}"]`).evaluate(input => input.indeterminate), true,
                `${entityType}: ${JSON.stringify(await page.evaluate(() => ({ partial: [...window.manager.partialIds], existing: [...window.manager.existingIds] })))}`);
            await page.locator(`[data-rp-check="${data.second}"]`).check();
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.ok(await page.evaluate(data => data.owners.every(ownerId => archiveConnectionIds(data.ownerType, ownerId, data.entityType).includes(data.second)
                && archiveConnectionIds(data.ownerType, ownerId, data.entityType).includes(data.concurrent)), data));
            assert.ok(await page.evaluate(data => archiveConnectionIds(data.ownerType, data.owners[0], data.entityType).includes(data.first)
                && !archiveConnectionIds(data.ownerType, data.owners[1], data.entityType).includes(data.first), data));
            await page.evaluate(data => { window.manager = rpOpenArchiveResourcePicker({ ownerType: data.ownerType, ownerIds: data.owners, entityType: data.entityType }); }, data);
            await page.locator(`[data-rp-check="${data.second}"]`).uncheck();
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.ok(await page.evaluate(data => data.owners.every(ownerId => !archiveConnectionIds(data.ownerType, ownerId, data.entityType).includes(data.second)
                && archiveConnectionIds(data.ownerType, ownerId, data.entityType).includes(data.concurrent)), data));
        }
        await page.evaluate(() =>
        {
            const note = sampleData.notes.find(note => note.projectId === 'p1');
            const places = projectPlaces('p1').slice(0, 3);
            setNoteEntityLinks(note.id, 'place', [places[0].id], { projectId: 'p1' });
            window.manager = openNotesPlacesModal({ noteId: note.id });
            window.placeLinkFixture = { noteId: note.id, ids: places.map(place => place.id) };
            setNoteEntityLinks(note.id, 'place', [places[0].id, places[2].id], { projectId: 'p1' });
        });
        const fixture = await page.evaluate(() => window.placeLinkFixture);
        await page.locator(`[data-rp-check="${fixture.ids[0]}"]`).uncheck();
        await page.locator(`[data-rp-check="${fixture.ids[1]}"]`).check();
        await page.locator('[data-rp-action="save"]').click();
        await page.locator('.resource-picker').waitFor({ state: 'hidden' });
        assert.deepEqual(await page.evaluate(() => getNote(window.placeLinkFixture.noteId).linkedPlaceIds.slice().sort()), [fixture.ids[1], fixture.ids[2]].sort());
        await page.evaluate(() =>
        {
            sampleData.places.push({ id: 'country-verified', projectId: 'p1', name: 'Verified town', country: 'Verifiedland' },
                { id: 'country-not-inferred', projectId: 'p1', name: 'Town, Guessedland' });
            openNotesPlacesModal({ noteId: window.placeLinkFixture.noteId });
        });
        const countries = await page.locator('.rp-country-heading').allTextContents();
        assert.equal(countries.includes('Verifiedland'), false);
        assert.ok(countries.includes('Other places'));
        assert.ok(countries.includes('Guessedland'));
        assert.deepEqual(countries, await page.evaluate(() => [...new Set(sampleData.places.filter(place => place.projectId === 'p1' && !place.deleted).map(place => placeCountry(place)))].sort((a, b) => a.localeCompare(b, 'en'))));
        await page.evaluate(() => closeModal({ force: true }));
        await page.evaluate(() =>
        {
            sampleData.media.push({ ...getProjectPhotos('p1')[0], id: 'missing-image-fixture', title: 'Missing image fixture', src: 'data:image/png;base64,invalid' });
            rpOpenPhotoLinkPicker({ projectId: 'p1', onSave: () => true });
        });
        const missing = page.locator('.rp-record:has([data-rp-check="missing-image-fixture"]) .rp-media-thumbnail');
        await page.waitForFunction(() => document.querySelector('.rp-record:has([data-rp-check="missing-image-fixture"]) .rp-media-thumbnail')?.classList.contains('is-placeholder'));
        assert.match(await missing.getAttribute('aria-label'), /Image unavailable/);
        assert.equal(await missing.locator('img').count(), 0);
        assert.deepEqual(errors, []);
        console.log('All resource link/unlink deltas, partial bulk state and concurrent-link preservation passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
