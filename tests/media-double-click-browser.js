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
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() => activateProject('p1', { moduleName: 'Albums' }));
        const photo = page.locator('.album-photo-card[data-photo-id]').first();
        await photo.click();
        assert.equal(await page.locator('.photo-people-modal').count(), 0);
        await page.locator('.album-photo-card[data-photo-id]').first().click();
        assert.equal(await page.locator('.photo-people-modal').count(), 1);
        await page.locator('.photo-people-modal [data-close]').first().click();

        await page.evaluate(() =>
        {
            activateProject('p1', { moduleName: 'Archive' });
            state.archiveView = 'files';
            state.archiveSelectedFolderId = 'interviews';
            state.archiveFileLayout = 'details';
            renderArchiveMain();
        });
        const file = page.locator('[data-archive-file-row="af-letter-transcription"]');
        await file.click();
        assert.equal(await page.locator('.archive-document-modal').count(), 0);
        await page.locator('[data-archive-file-row="af-letter-transcription"]').click();
        assert.equal(await page.locator('.archive-document-modal').count(), 1);
        await page.locator('.archive-document-modal [data-close]').click();
        await page.evaluate(() =>
        {
            state.archiveSelectedFolderId = 'fond12';
            state.archiveFileLayout = 'icons';
            renderArchiveMain();
        });
        await page.locator('[data-archive-file-row="af7"]').click();
        await page.locator('[data-archive-file-row="af7"]').click();
        assert.equal(await page.locator('.photo-people-modal').count(), 1);
        await page.locator('.photo-people-modal [data-close]').first().click();
        assert.deepEqual(errors, []);
        console.log('Albums and Archive double-click previews passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
