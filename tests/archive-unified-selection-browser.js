const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const width of [390, 1280]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                state.archiveSelectedFolderId = null;
                sampleData.archiveFiles.push({ ...archiveProjectFiles()[0], id: 'bulk-test-root-file',
                    folderId: null, name: 'Bulk test document.pdf', favorite: false });
                renderArchive();
            });
            const folders = await page.evaluate(() => archiveFolderChildren().slice(0, 2).map(item => item.id));
            if (width <= 900) await page.locator('[data-archive-mobile-select]').first().click();
            await page.locator(`[data-archive-folder-checkbox="${folders[0]}"]:visible`).check();
            await page.locator('[data-archive-file-checkbox="bulk-test-root-file"]:visible').check();
            assert.deepEqual(await page.evaluate(() => [state.archiveSelectedFolderIds.length,
                state.archiveSelectedFileIds.length]), [1, 1]);
            const bar = width <= 900 ? page.locator('.archive-mobile-bulk') : page.locator('.archive-selection-bar');
            assert.equal(await bar.isVisible(), true);
            if (width > 900) {
                await page.locator('[data-archive-selection-more]').click();
                assert.equal(await page.locator('[data-archive-mobile-choice="links"]').count(), 0);
                await page.keyboard.press('Escape');
                await page.locator('[data-archive-selection-action="move"]:visible').click();
                const destination = folders[1];
                assert.equal(await page.locator(`[data-archive-bulk-destination] option[value="${folders[0]}"]`).getAttribute('disabled'), '');
                await page.locator('[data-archive-bulk-destination]').selectOption(destination);
                await page.locator('[data-archive-bulk-move-confirm]').click();
                assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), folders[0]), destination);
                assert.equal(await page.evaluate(() => archiveFileFolderId(archiveFileById('bulk-test-root-file'))), destination);
                await page.getByRole('button', { name: 'Undo' }).last().click();
                assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), folders[0]), null);
                assert.equal(await page.evaluate(() => archiveFileFolderId(archiveFileById('bulk-test-root-file'))), null);
                await page.locator(`[data-archive-folder-checkbox="${folders[0]}"]:visible`).check();
                await page.locator('[data-archive-file-checkbox="bulk-test-root-file"]:visible').check();
                await page.locator('[data-archive-selection-action="favorite"]:visible').click();
                assert.equal(await page.evaluate(id => archiveFolderById(id).favorite, folders[0]), true);
                await page.evaluate(() => archiveNavigateToLocation({ view: 'favorites',
                    folderId: null, search: '', filterPresentation: 'flat' }));
                assert.equal(await page.locator(`[data-archive-folder-row="${folders[0]}"]:visible`).count(), 1);
                await page.locator(`[data-archive-folder-row="${folders[0]}"]:visible`).press('Enter');
                assert.equal(await page.evaluate(() => state.archiveView), 'files');
                await page.evaluate(() => archiveNavigateToLocation({ view: 'files', folderId: null,
                    search: '', fileFilters: { favouriteOnly: false }, filterPresentation: 'folders' }));
                await page.locator(`[data-archive-folder-checkbox="${folders[0]}"]:visible`).check();
                await page.locator('[data-archive-file-checkbox="bulk-test-root-file"]:visible').check();
                await page.locator('[data-archive-selection-more]').click();
                await page.locator('[data-archive-mobile-choice="delete"]').click();
                const impact = await page.locator('#archiveBulkDeleteTitle').locator('..').innerText();
                assert.match(impact, /\d+ folders, \d+ files/);
                await page.locator('[data-archive-bulk-delete-confirm]').click();
                assert.equal(await page.evaluate(id => archiveFolderById(id), folders[0]), null);
                assert.equal(await page.evaluate(() => archiveFileById('bulk-test-root-file')), null);
            } else {
                assert.match(await bar.innerText(), /2/);
                await page.locator('[data-archive-mobile-select]').last().click();
                assert.deepEqual(await page.evaluate(() => [state.archiveSelectedFolderIds.length,
                    state.archiveSelectedFileIds.length]), [0, 0]);
            }
            assert.deepEqual(errors, [], `${width}px browser console`);
            await page.close();
        }
        console.log('Archive unified folder/file selection, mixed move, and folder favourites passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
