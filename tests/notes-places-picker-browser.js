const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const [width, language] of [[1200, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 760 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const before = await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                const note = sampleData.notes.find(item => item.projectId === 'p1' && !item.deleted);
                sampleData.places.push({ id: 'picker-long-place', projectId: 'p1',
                    name: 'A particularly long historical place name, North Yorkshire, England',
                    alternativeNames: ['Old Meadow Register Name'] });
                state.selectedNoteId = note.id;
                openNotesPlacesModal();
                return { noteId: note.id, links: [...note.linkedPlaceIds] };
            }, language);
            const modal = page.locator('[data-resource-picker="places"]');
            await modal.locator('[data-rp-search]').fill('Old Meadow');
            assert.equal(await modal.locator('[data-rp-check]').count(), 1);
            const row = modal.locator('.rp-record');
            assert.ok(await row.evaluate(element => element.scrollWidth <= element.clientWidth));
            assert.match(await row.locator('strong').getAttribute('title'), /historical place name/);
            await row.locator('input').check();
            await modal.locator('[data-rp-action="save"]').click();
            await modal.waitFor({ state: 'hidden' });
            assert.ok(await page.evaluate(({ noteId, links }) =>
            {
                const saved = getNote(noteId).linkedPlaceIds;
                return saved.includes('picker-long-place') && links.every(id => saved.includes(id));
            }, before));
            await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Archive' });
                openArchiveSourcePlacesModal('as4');
            });
            await modal.locator('[data-rp-search]').fill('Old Meadow');
            await modal.locator('[data-rp-check]').check();
            await modal.locator('[data-rp-action="save"]').click();
            await modal.waitFor({ state: 'hidden' });
            assert.ok(await page.evaluate(() => sourceTargetIds('as4', 'place', 'p1').includes('picker-long-place')));
            await page.evaluate(() => openArchiveSourcePlacesModal('as4'));
            assert.equal(await modal.locator('[data-rp-check="picker-long-place"]').isChecked(), true);
            await modal.locator('[data-rp-action="create"]').click();
            assert.ok(await page.locator('.place-editor-modal').isVisible());
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Additive Notes/Archive source places, aliases, and narrow layout passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
