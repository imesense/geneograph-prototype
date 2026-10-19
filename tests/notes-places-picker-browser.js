const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1200, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 760 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const noteId = await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                const note = sampleData.notes.find(item => item.projectId === 'p1' && !item.deleted);
                sampleData.places.push({
                    id: 'picker-long-place', projectId: 'p1',
                    name: 'A particularly long historical place name used to check text wrapping and icon alignment, North Yorkshire, England',
                    alternativeNames: ['Old Meadow Register Name']
                });
                state.selectedNoteId = note.id;
                openNotesPlacesModal();
                return note.id;
            }, language);
            const modal = page.locator('.notes-places-modal');
            assert.equal(await modal.locator('[data-notes-place-results-meta]').count(), 0);
            assert.equal(await modal.locator('.notes-place-result-meta').count(), 0);
            assert.equal(await modal.locator('.notes-place-search-label').innerText(), language === 'ru' ? 'Найти места' : 'Find places');
            assert.equal(await modal.locator('[data-notes-place-create]').getAttribute('aria-label'), language === 'ru' ? 'Новое место' : 'New place');
            assert.equal(await modal.locator('[data-notes-place-save]').innerText(), language === 'ru' ? 'Сохранить места' : 'Save places');
            const longRow = modal.locator('.notes-place-result:has([value="picker-long-place"])');
            assert.ok(await longRow.evaluate(row =>
            {
                const icon = row.querySelector('.notes-place-result-icon').getBoundingClientRect();
                const copy = row.querySelector('.photo-people-result-copy').getBoundingClientRect();
                const input = row.querySelector('input').getBoundingClientRect();
                return copy.left >= icon.right + 7 && copy.right <= input.left - 7
                    && row.scrollWidth <= row.clientWidth + 1;
            }));
            assert.match(await longRow.locator('strong').getAttribute('title'), /historical place name/);
            if (process.env.GENEO_CAPTURE)
                await page.screenshot({ path: path.join(os.tmpdir(), `notes-places-picker-${width}-${language}.png`) });
            await longRow.locator('input').focus();
            assert.equal(await longRow.locator('strong').evaluate(name => getComputedStyle(name).whiteSpace), 'normal');
            await modal.locator('[data-notes-place-search]').fill('Old Meadow');
            assert.match(await modal.locator('.notes-place-result-meta').innerText(), language === 'ru' ? /Историческое название/ : /Historical name/);
            await modal.locator('[data-notes-place-search]').fill('no such place 123');
            assert.match(await modal.locator('.photo-people-empty').innerText(), language === 'ru' ? /места не найдены/ : /No places match/);
            await modal.locator('[data-notes-place-search]').fill('');
            await modal.locator('.notes-place-result:has([value="picker-long-place"]) input').click();
            assert.ok(await modal.locator('[data-notes-place-remove="picker-long-place"]').isVisible());
            assert.match(await modal.locator('[data-notes-place-count]').innerText(), language === 'ru' ? /Выбрано мест:/ : /places? selected/);
            await modal.locator('[data-notes-place-save]').click();
            assert.ok(await page.evaluate(noteId => getNote(noteId).linkedPlaceIds.includes('picker-long-place'), noteId));

            await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Archive' });
                openArchiveSourcePlacesModal('as4');
            });
            assert.equal(await modal.locator('[data-notes-place-results-meta]').count(), 0);
            assert.ok(await modal.locator('.notes-place-result').count() > 0);
            await modal.locator('.notes-place-result:has([value="picker-long-place"]) input').click();
            await modal.locator('[data-notes-place-save]').click();
            assert.ok(await page.evaluate(() => sourceTargetIds('as4', 'place', 'p1').includes('picker-long-place')));
            await page.evaluate(() => openArchiveSourcePlacesModal('as4'));
            await modal.locator('[data-notes-place-create]').click();
            assert.ok(await page.locator('.place-editor-modal').isVisible());
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Notes and Archive source place picker passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
