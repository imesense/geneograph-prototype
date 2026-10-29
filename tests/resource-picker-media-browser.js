const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'Family Tree' });
            window.savedPhotoIds = [];
            openModal('<section class="modal" data-picker-parent><button type="button" data-close>Close</button></section>');
            openAddPhotosForPersonDraftModal({ projectId: 'p1', onSave: ids => { window.savedPhotoIds = ids; } });
        });
        await page.locator('[data-rp-action="create"]').click();
        await page.locator('[data-rp-upload-input]').setInputFiles({ name: 'picker-new.png', mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNFkAAAAASUVORK5CYII=', 'base64') });
        await page.locator('.resource-picker').waitFor();
        assert.equal(await page.evaluate(() => window.savedPhotoIds.length), 0);
        assert.equal(await page.evaluate(() => sampleData.media.find(photo => photo.filename === 'picker-new.png').personIds.length), 0);
        await page.locator('[data-rp-action="save"]').click();
        await page.locator('[data-picker-parent]').waitFor();
        assert.equal(await page.evaluate(() => window.savedPhotoIds.length), 1);
        await page.locator('[data-picker-parent] [data-close]').click();
        assert.equal(await page.evaluate(() => sampleData.media.find(photo => photo.filename === 'picker-new.png').personIds.length), 0);

        await page.evaluate(() => openAddPhotosToPersonModal('silver'));
        await page.locator('[data-rp-search]').fill('picker-new');
        await page.locator('[data-rp-check]').check();
        await page.locator('[data-rp-action="save"]').click();
        await page.locator('.resource-picker').waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => sampleData.media.find(photo => photo.filename === 'picker-new.png').personIds.includes('silver')), true);

        const primary = await page.evaluate(() =>
        {
            const id = getPerson('silver').primaryPhotoId;
            openAddPhotosToPersonModal('silver');
            return id;
        });
        assert.ok(primary);
        await page.locator(`[data-rp-check="${primary}"]`).uncheck();
        await page.locator('[data-rp-action="save"]').click();
        await page.locator('[data-confirm-photo-unlink]').waitFor();
        await page.locator('[aria-labelledby="photoUnlinkTitle"] .modal-footer [data-close]').click();
        await page.waitForFunction(() => !document.querySelector('[data-rp-action="save"]').disabled);
        assert.equal(await page.locator('.rp-error').isVisible(), false);
        assert.equal(await page.evaluate(id => getPhoto(id).personIds.includes('silver'), primary), true);
        await page.locator('[data-rp-action="save"]').click();
        await page.locator('[data-confirm-photo-unlink]').click();
        await page.locator('.resource-picker').waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(id => getPhoto(id).personIds.includes('silver'), primary), false);
        assert.ok(await page.evaluate(id => Boolean(getPhoto(id)), primary));

        await page.evaluate(() =>
        {
            window.fileCommitCount = 0;
            window.filePicker = openConnectedFilesModal({ projectId: 'p1', onSave: () => { window.fileCommitCount++; return true; } });
        });
        await page.locator('[data-rp-action="create"]').click();
        await page.locator('[data-document-input]').setInputFiles({ name: 'picker-pending.txt', mimeType: 'text/plain', buffer: Buffer.from('Pending evidence') });
        await page.waitForFunction(() => sampleData.archiveFiles.some(file => file.name === 'picker-pending.txt'));
        assert.equal(await page.evaluate(() => window.fileCommitCount), 0);
        await page.locator('.resource-picker').waitFor();
        assert.equal(await page.evaluate(() => window.filePicker.selectedIds.size), 1);
        await page.locator('[data-rp-action="close"]').first().click();
        await page.locator('[data-rp-discard]').click();
        assert.equal(await page.evaluate(() => window.fileCommitCount), 0);
        assert.equal(await page.evaluate(() => sampleData.archiveFiles.some(file => file.name === 'picker-pending.txt')), true);

        await page.evaluate(() =>
        {
            window.filePicker = openConnectedFilesModal({ projectId: 'p1', onSave: () => false });
            window.filePicker.selectCreated([sampleData.archiveFiles.find(file => file.name === 'picker-pending.txt').id]);
        });
        await page.locator('[data-rp-action="save"]').click();
        await page.waitForFunction(() => !document.querySelector('.rp-error').hidden);
        assert.equal(await page.evaluate(() => window.filePicker.selectedIds.size), 1);
        await page.locator('[data-rp-search]').fill('picker-pending');
        await page.locator('[data-rp-action^="preview:"]').click();
        await page.waitForFunction(() => document.querySelector('.archive-document-text')?.textContent === 'Pending evidence');
        assert.deepEqual(errors, []);
        console.log('Resource media creation, draft isolation, and failed commit checks passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
