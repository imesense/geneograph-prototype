const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/geocoding/**', route =>
        {
            const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop().replace(/\.json$/, ''));
            if (name === 'Offline Place') return route.fulfill({ status: 503, body: '' });
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ features: [{ text: name, place_name: `${name}, Test Country`, center: [24.5, 51.2], context: [{ text: 'Test Country' }] }] })
            });
        });
        await page.goto(process.env.GENEO_TEST_URL || 'http://localhost:8765');
        await page.waitForFunction(() =>
        {
            try { return typeof DEFAULT_DOCUMENT_TITLE === 'string' && typeof clearNotesContext === 'function' && typeof openGeneographPlaceModal === 'function'; }
            catch (_) { return false; }
        });
        await page.evaluate(() =>
        {
            activateProject('p1', { moduleName: 'People' });
            sampleData.places.push({ id: 'foreign-testville', projectId: 'other-project', name: 'Testville, Test Country', alternativeNames: [], deleted: false });
            document.body.insertAdjacentHTML('beforeend', renderPlaceCombobox({ id: 'placeSearchTest', label: 'Place', showAddress: false }));
            bindPlaceComboboxes(document);
        });
        const input = page.locator('#placeSearchTest');
        const initialCount = await page.evaluate(() => sampleData.places.length);
        await input.fill('Testville');
        await page.locator('#placeSearchTestPlaceList [data-place-opt]').filter({ hasText: 'Test Country' }).first().waitFor();
        const projectMatches = await page.evaluate(() => [...document.querySelectorAll('#placeSearchTestPlaceList [data-place-id]')].map(item => item.dataset.placeId));
        assert(!projectMatches.includes('foreign-testville'));
        await page.locator('#placeSearchTestPlaceList [data-place-opt]').filter({ hasText: 'Test Country' }).first().click();
        await page.waitForTimeout(400);
        assert.equal(await page.locator('#placeSearchTestPlaceList').isHidden(), true);
        const draft = await page.evaluate(() => ({ count: sampleData.places.length, value: readPlaceInputValue('#placeSearchTest') }));
        assert.equal(draft.count, initialCount);
        assert.deepEqual(draft.value.coordinates, { lat: 51.2, lng: 24.5 });
        const saved = await page.evaluate(() =>
        {
            const result = resolvePlaceAssignment(readPlaceInputValue('#placeSearchTest'));
            return { result, place: getPlace(result.placeId), count: sampleData.places.length };
        });
        assert.equal(saved.count, initialCount + 1);
        assert.deepEqual(saved.place.coordinates, { lat: 51.2, lng: 24.5 });
        const again = await page.evaluate(() => resolvePlaceAssignment(readPlaceInputValue('#placeSearchTest')));
        assert.equal(again.placeId, saved.place.id);
        assert.equal(again.created, false);
        await page.setViewportSize({ width: 390, height: 750 });
        await input.fill('Old Parish Custom Name');
        const beforeManualSave = await page.evaluate(() => sampleData.places.length);
        await page.locator('#placeSearchTestPlaceList [data-place-create]').click();
        assert.equal(await page.evaluate(() => sampleData.places.length), beforeManualSave);
        const manual = await page.evaluate(() => resolvePlaceAssignment(readPlaceInputValue('#placeSearchTest')));
        assert.equal(manual.created, true);
        assert.equal(await page.evaluate(id => getPlace(id)?.coordinates, manual.placeId), null);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await input.fill('Offline Place');
        await page.locator('#placeSearchTestPlaceList [data-place-map-retry]').waitFor();
        assert.equal(await page.locator('#placeSearchTestPlaceList [data-place-create]').count(), 1);
        const fileId = await page.evaluate(() =>
        {
            activateProject('p1', { moduleName: 'Archive' });
            const file = sampleData.archiveFiles.find(item => item.projectId === currentProjectId());
            openArchiveFilesPlaceModal([file.id]);
            return file.id;
        });
        await page.locator('#archiveBulkPlaceInput').fill('New Map Parish');
        await page.locator('#archiveBulkPlaceInputPlaceList [data-place-opt]').filter({ hasText: 'Test Country' }).first().click();
        const countBeforeFileSave = await page.evaluate(() => sampleData.places.length);
        assert.equal(await page.locator('[data-archive-place-save]').isEnabled(), true);
        await page.locator('[data-archive-place-save]').click();
        const fileResult = await page.evaluate(id => {
            const file = sampleData.archiveFiles.find(item => item.id === id);
            return { count: sampleData.places.length,
                place: archiveFilePlaceIds(file).map(getPlace).find(place => place?.name === 'New Map Parish, Test Country'),
                primary: file.documentPlaceId };
        }, fileId);
        assert.equal(fileResult.count, countBeforeFileSave + 1);
        assert.equal(fileResult.place.name, 'New Map Parish, Test Country');
        assert.deepEqual(fileResult.place.coordinates, { lat: 51.2, lng: 24.5 });
        assert.equal(fileResult.primary, null);
        await page.evaluate(() =>
        {
            activateProject('p1', { moduleName: 'Geneograph' });
            state.selectedGeneoBoardId = getProjectBoards()[0].id;
            state.geneoView = 'board';
            renderGeneograph();
            openGeneographPlaceModal();
        });
        await page.locator('#geneoPlacePickerSearch').fill('Board Map Hamlet');
        await page.locator('[data-geneo-place-map-results] [data-geneo-place-picker-choice="map"]').first().click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const beforeBoardSave = await page.evaluate(() => sampleData.places.length);
        await page.locator('[data-geneo-place-picker-submit]').click();
        const boardResult = await page.evaluate(() => ({ count: sampleData.places.length, place: sampleData.places.find(place => place.name === 'Board Map Hamlet, Test Country') }));
        assert.equal(boardResult.count, beforeBoardSave + 1);
        assert.equal(boardResult.place.projectId, 'p1');
        assert.deepEqual(boardResult.place.coordinates, { lat: 51.2, lng: 24.5 });
        await page.evaluate(() => openGeneographPlaceModal());
        await page.locator('#geneoPlacePickerSearch').fill('Board Only Test');
        await page.locator('[data-geneo-place-picker-choice="board"]').click();
        const beforeBoardOnly = await page.evaluate(() => sampleData.places.length);
        await page.locator('[data-geneo-place-picker-submit]').click();
        assert.equal(await page.evaluate(() => sampleData.places.length), beforeBoardOnly);
        const translated = await page.evaluate(() =>
        {
            setLanguage('ru');
            return [t('Create place from entered text'), t('Find or create a place')];
        });
        assert.deepEqual(translated, ['Создать место из введённого текста', 'Найти или создать место']);
        assert.deepEqual(errors, []);
        console.log('Place search browser regression passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
