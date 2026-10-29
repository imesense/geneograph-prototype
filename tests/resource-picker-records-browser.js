const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1200, 'en'], [390, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                window.rpRecordTestSaved = [];
                window.rpRecordTestSession = rpOpenNotePicker({ projectId: 'p1',
                    onSave: ids => { window.rpRecordTestSaved = ids; return true; } });
                const record = sampleData.notes.find(note => note.projectId === 'p1' && !note.archived && !note.deleted);
                window.rpRecordTestSession.selectedIds.add(record.id);
                window.rpRecordTestSession.render();
            }, language);
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('[data-rp-note-form] [data-close]').first().click();
            await page.locator('.resource-picker').waitFor();
            assert.equal(await page.evaluate(() => window.rpRecordTestSession.selectedIds.size), 1);
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('[data-rp-note-form] [name="title"]').fill('Picker-only note');
            await page.locator('[data-rp-note-form] [name="body"]').evaluate(element =>
            {
                const rich = element.closest('form').querySelector('.ql-editor');
                if (rich) rich.textContent = 'Read-only preview text';
                else element.value = 'Read-only preview text';
            });
            await page.locator('[data-rp-note-form] [type="submit"]').click();
            await page.locator('.resource-picker').waitFor();
            assert.equal(await page.evaluate(() => window.rpRecordTestSession.selectedIds.size), 2);
            assert.equal(await page.evaluate(() => window.rpRecordTestSaved.length), 0);
            assert.equal(await page.evaluate(() =>
            {
                const note = sampleData.notes.find(record => record.title === 'Picker-only note');
                return note.linkedPersonIds.length + note.linkedPlaceIds.length + note.relatedNoteIds.length;
            }), 0);
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => window.rpRecordTestSaved.length), 2);

            await page.evaluate(() =>
            {
                window.rpRecordTestSaved = [];
                window.rpRecordTestSession = rpOpenSourcePicker({ projectId: 'p1', draftSourceIds: [],
                    onDraftSave: ids => { window.rpRecordTestSaved = ids; } });
                window.rpRecordTestLinkCount = sampleData.sourceLinks.length;
            });
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('.archive-source-modal [data-close]').first().click();
            await page.locator('.resource-picker').waitFor();
            assert.equal(await page.evaluate(() => window.rpRecordTestSession.selectedIds.size), 0);
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('[data-archive-source-title]').fill('Picker-only source');
            await page.locator('[data-archive-source-form] [type="submit"]').click();
            await page.locator('.resource-picker').waitFor();
            assert.equal(await page.evaluate(() => window.rpRecordTestSession.selectedIds.size), 1);
            assert.equal(await page.evaluate(() => sampleData.sourceLinks.length === window.rpRecordTestLinkCount), true);
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => window.rpRecordTestSaved.length), 1);
            await page.evaluate(() =>
            {
                const note = sampleData.notes.find(record => record.projectId === 'p1' && !record.deleted);
                window.rpRecordTestNoteId = note.id;
                window.rpRecordTestSession = rpOpenSourcePicker({ projectId: 'p1', targetType: 'note', targetId: note.id });
                window.rpRecordTestSession.selectCreated(window.rpRecordTestSaved);
            });
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => sourceIdsForTarget('note', window.rpRecordTestNoteId, 'p1')
                .includes(window.rpRecordTestSaved[0])), true);

            await page.evaluate(() =>
            {
                const note = sampleData.notes.find(record => record.projectId === 'p1' && !record.deleted);
                window.rpRecordTestNoteId = note.id;
                window.rpRecordTestPlaces = JSON.stringify(note.linkedPlaceIds);
                window.rpRecordTestSession = rpOpenPlacePicker({ noteId: note.id });
            });
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('[data-place-editor] [data-close]').first().click();
            await page.locator('.resource-picker').waitFor();
            assert.equal(await page.evaluate(() => placeEditorDraft), null);
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('#placeNameInput').fill('Picker-only village, Test County');
            await page.locator('#placeForm [type="submit"]').click();
            await page.locator('.resource-picker').waitFor();
            await page.waitForFunction(() => window.rpRecordTestSession.getChanges().addedIds.length === 1);
            assert.equal(await page.evaluate(() => JSON.stringify(getNote(window.rpRecordTestNoteId).linkedPlaceIds) === window.rpRecordTestPlaces), true);
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() =>
                getNote(window.rpRecordTestNoteId).linkedPlaceIds.includes(sampleData.places.find(place => place.name === 'Picker-only village, Test County').id)), true);

            await page.evaluate(() =>
            {
                const note = sampleData.notes.find(record => record.projectId === 'p1' && !record.deleted);
                window.rpRecordTestNoteId = note.id;
                note.linkedPlaceIds = [projectPlaces('p1')[0].id];
                window.rpRecordTestSession = rpOpenManagePlaces({ noteId: note.id });
                window.rpRecordTestSession.selectedIds.clear();
                window.rpRecordTestSession.render();
            });
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => getNote(window.rpRecordTestNoteId).linkedPlaceIds.length), 0);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Resource picker record browser tests passed (desktop EN, mobile RU).');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
