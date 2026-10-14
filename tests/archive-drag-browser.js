const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() => {
            if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'Archive' });
            state.archiveView = 'files';
            render();
        });
        const [source, destination] = await page.evaluate(() =>
            archiveFolderChildren().slice(0, 2).map(folder => folder.id));

        await page.locator(`[data-archive-folder-row="${source}"]`).dragTo(
            page.locator(`[data-archive-folder-row="${destination}"]`));
        assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), source), destination);
        await page.getByRole('button', { name: 'Undo' }).last().click();
        assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), source), null);

        await page.locator('[data-archive-file-layout="tiles"]').click();
        await page.locator(`.archive-tile[data-archive-folder-row="${source}"]`).dragTo(
            page.locator(`.archive-tile[data-archive-folder-row="${destination}"]`));
        assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), source), destination);
        await page.getByRole('button', { name: 'Undo' }).last().click();
        assert.equal(await page.evaluate(id => archiveFolderParentId(archiveFolderById(id)), source), null);

        const file = await page.evaluate(() => {
            const item = archiveProjectFiles().find(candidate => archiveFileFolderId(candidate));
            return item && { id: item.id, folderId: archiveFileFolderId(item) };
        });
        assert.ok(file, 'sample project contains a filed item');
        await page.evaluate(id => archiveOpenFolder(id), file.folderId);
        const fileId = file.id;
        const fileDestination = file.folderId === destination ? source : destination;
        await page.locator(`[data-archive-file-row="${fileId}"]`).dragTo(
            page.locator(`[data-archive-folder="${fileDestination}"]`));
        assert.equal(await page.evaluate(id => archiveFileFolderId(archiveFileById(id)), fileId), fileDestination);
        await page.getByRole('button', { name: 'Undo' }).last().click();
        assert.equal(await page.evaluate(id => archiveFileFolderId(archiveFileById(id)), fileId), file.folderId);
        assert.deepEqual(errors, []);
        await page.close();
        console.log('Archive Details/Icons folder and file drag-to-move with Undo passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
