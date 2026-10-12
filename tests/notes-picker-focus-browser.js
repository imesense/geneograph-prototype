const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });

    try
    {
        for (const language of ['en', 'ru'])
        {
            for (const width of [320, 390, 768, 900])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`);
                await page.evaluate(() =>
                {
                    geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = 'Notes';
                    render();
                    state.selectedNoteId = document.querySelector('[data-note-id]').dataset.noteId;
                    openNoteFilesModal();
                });
                await page.waitForTimeout(50);
                assert.ok(await page.locator('[data-connected-files-modal]').isVisible());
                assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-close')));
                await page.locator('[data-connected-files-search]').click();
                assert.ok(await page.evaluate(() => document.activeElement?.matches('[data-connected-files-search]')));
                await page.keyboard.press('Escape');

                await page.evaluate(() => openNotesPlacesModal());
                await page.waitForTimeout(50);
                assert.ok(await page.locator('.notes-places-modal').isVisible());
                assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-close')));
                assert.ok(await page.locator('.notes-place-result').first().evaluate(row =>
                {
                    const icon = row.querySelector('.notes-place-result-icon').getBoundingClientRect();
                    const name = row.querySelector('.photo-people-result-copy').getBoundingClientRect();
                    return name.left >= icon.right + 4 && row.scrollWidth <= row.clientWidth + 1;
                }));
                await page.locator('[data-notes-place-search]').click();
                assert.ok(await page.evaluate(() => document.activeElement?.matches('[data-notes-place-search]')));
                await page.keyboard.press('Escape');
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
