const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const width of [320, 390, 1280]) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('https://**/*', route => route.abort());
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.waitForFunction(() => document.querySelector('#topbar')?.children.length > 0, null,
                { timeout: 5000 }).catch(async error => {
                throw new Error(`${error.message}; page errors: ${errors.join(' | ')}`);
            });
            const ids = await page.evaluate(() => {
                activateProject('p1', { moduleName: 'Archive' });
                state.activeModule = 'Archive';
                state.archiveView = 'files';
                state.archiveInspectorCollapsed = false;
                const file = sampleData.archiveFiles.find(item => item.projectId === 'p1' && item.linkedPlaceIds?.length);
                const extra = sampleData.places.find(place => place.projectId === 'p1' && place.id !== archiveDocumentPlace(file).placeId);
                file.linkedPlaceIds = [...archiveFilePlaceIds(file), extra.id];
                file.placeIds = [...file.linkedPlaceIds];
                state.archiveSelectedFolderId = file.folderId;
                state.archiveSelectedFileId = file.id;
                renderArchiveMain();
                if (innerWidth <= 900) openMobileSurface('details');
                return { fileId: file.id, original: [...archiveFilePlaceIds(file)], count: sampleData.places.length };
            });
            await page.locator('#archiveEditFile').click();
            assert.equal(await page.locator('#archiveFileNameInput').count(), 0);
            assert.equal(await page.locator('#archiveSaveFileEdit').count(), 1);
            assert.equal(await page.locator('.archive-inspector-toolbar #archiveSaveFileEdit').count(), 0);
            await page.locator('#archiveSaveFileEdit').click();
            await page.locator('#archiveRenameFile').click();
            const archiveLayout = await page.locator('.archive-file-identity .inspector-name-editor').evaluate(editor => ({
                noOverflow: editor.scrollWidth <= editor.clientWidth,
                fullWidthInput: editor.querySelector('input').offsetWidth === editor.clientWidth,
                alignedActions: [...editor.querySelectorAll('.inspector-name-edit-button')].every(button => button.getBoundingClientRect().height >= 40)
            }));
            assert.ok(archiveLayout.noOverflow && archiveLayout.fullWidthInput && archiveLayout.alignedActions,
                JSON.stringify({ width, archiveLayout }));
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.locator('.archive-file-identity').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `file-rename-${width}.png`) });
            await page.locator('#archiveFileNameInput').fill(`Renamed file ${width}`);
            await page.locator('#archiveFileNameInput').press('Enter');
            assert.equal(await page.evaluate(fileId => archiveFileById(fileId).name, ids.fileId), `Renamed file ${width}`);
            await page.locator('[data-archive-add-file-place]').click();
            assert.equal(await page.evaluate(() => sampleData.places.length), ids.count);
            await page.locator('[data-notes-place-choice][value="place-fishmarket-row"]').click();
            await page.locator('[data-notes-place-save]').click();
            const saved = await page.evaluate(fileId => {
                const file = archiveFileById(fileId);
                return { ids: archiveFilePlaceIds(file), primary: file.documentPlaceId,
                    names: archiveFilePlaceIds(file).map(id => getPlace(id)?.name) };
            }, ids.fileId);
            assert.ok(ids.original.every(id => saved.ids.includes(id)));
            assert.equal(saved.primary, null);

            await page.evaluate(() => {
                state.archiveView = 'sources';
                state.archiveSelectedSourceId = sampleData.sources.find(item => item.projectId === 'p1').id;
                renderArchiveMain();
                if (innerWidth <= 900) openMobileSurface('details');
            });
            await page.evaluate(() => beginArchiveSourceDetailEdit(state.archiveSelectedSourceId));
            assert.equal(await page.locator('#archiveSourceDetailTitle').count(), 1);
            await page.evaluate(() => {
                document.querySelector('#archiveSourceDetailNotes').value = 'Details edit browser check';
                saveArchiveSourceDetailEdit();
            });
            assert.equal(await page.evaluate(() => archiveSourceById(state.archiveSelectedSourceId).notes),
                'Details edit browser check');
            await page.evaluate(() => { state.language = 'ru'; renderArchiveMain(); });
            assert.equal(await page.locator('[data-archive-edit-source-details]').count(), 1);
            await page.evaluate(() => {
                state.language = 'ru';
                state.activeModule = 'Albums';
                state.selectedPhotoId = sampleData.media.find(item => item.projectId === 'p1').id;
                state.albumsDetailCollapsed = false;
                renderAlbums();
                if (innerWidth <= 900) openMobileSurface('details');
            });
            await page.locator('#albumsEditPhoto').click();
            assert.equal(await page.locator('#albumsPhotoNameInput').count(), 0);
            assert.equal(await page.locator('.albums-detail-toolbar #albumsSavePhotoEdit').count(), 0);
            await page.locator('#albumsCancelPhotoEdit').click();
            assert.equal(await page.locator('#albumsEditPhoto').count(), 1);
            await page.locator('#albumsRenamePhoto').click();
            assert.equal(await page.locator('#albumsPhotoNameInput').count(), 1);
            const photoLayout = await page.locator('.albums-detail-identity .inspector-name-editor').evaluate(editor => ({
                noOverflow: editor.scrollWidth <= editor.clientWidth,
                fullWidthInput: editor.querySelector('input').offsetWidth === editor.clientWidth,
                labelsVisible: [...editor.querySelectorAll('.inspector-name-edit-button')].every(button => button.textContent.trim() && button.getBoundingClientRect().height >= 40)
            }));
            assert.ok(photoLayout.noOverflow && photoLayout.fullWidthInput && photoLayout.labelsVisible,
                JSON.stringify({ width, photoLayout }));
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.locator('.albums-detail-identity').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `photo-rename-${width}.png`) });
            await page.locator('#albumsPhotoNameInput').press('Escape');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Albums and Archive Details edit checks passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
