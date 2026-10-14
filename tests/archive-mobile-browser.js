const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_PATH
        ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try
    {
        for (const language of ['en', 'ru'])
        {
            for (const width of [320, 390, 541, 768, 900])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 }, hasTouch: true, isMobile: true });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
                await page.evaluate(() =>
                {
                    if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = 'Archive';
                    state.archiveView = 'files';
                    render();
                });
                assert.equal(await page.locator('.archive-mobile-location').isVisible(), true);
                assert.equal(await page.locator('.archive-mobile-items').isVisible(), true);
                assert.equal(await page.locator('.archive-table-wrap').isVisible(), false);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                assert.equal(await page.locator('.archive-page-actions').isVisible(), false);
                assert.equal(await page.locator('.archive-mobile-add-files').isVisible(), true);
                await page.locator('[data-archive-mobile-add-menu]').click();
                await page.locator('[data-archive-mobile-choice="folder"]').click();
                assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('[data-archive-mobile-add-menu]').click();
                assert.equal(await page.locator('[data-archive-mobile-choice="files"]').isVisible(), true);
                await page.locator('[data-archive-mobile-choice="files"]').click();
                assert.equal(await page.locator('.archive-document-import').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('#archiveFilterButton').click();
                assert.equal(await page.locator('#archiveFilterButton').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                await page.locator('#archiveSort').click();
                assert.equal(await page.locator('#archiveSort').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                if (width <= 540) await page.locator('.archive-mobile-search-trigger').click();
                assert.equal(await page.locator('[data-archive-search]').isVisible(), true);
                await page.locator('[data-archive-search]').fill('Pawford');
                if (width <= 540)
                {
                    await page.locator('.archive-mobile-search-close').click();
                    await page.locator('.archive-mobile-search-trigger').click();
                }
                assert.equal(await page.locator('[data-archive-search]').inputValue(), 'Pawford');
                await page.locator('[data-archive-search]').fill('');
                if (width <= 540) await page.locator('.archive-mobile-search-close').click();
                assert.ok(await page.locator('.archive-mobile-folder').first().evaluate(row => row.getBoundingClientRect().width > innerWidth * .8));
                await page.locator('.archive-mobile-folder [data-archive-row-actions="folder"]').first().click();
                await page.locator('[data-archive-item-action="details"]').click();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                await page.locator('#mobileDetailsClose').click();
                await page.locator('[data-archive-mobile-folder]').first().click();
                assert.notEqual(await page.locator('.archive-mobile-location-name').innerText(), 'All files');
                await page.locator('.archive-mobile-path summary').click();
                await page.locator('.archive-mobile-path-menu [data-archive-breadcrumb-root]').click();
                assert.equal(await page.locator('.archive-mobile-location-name').innerText(), language === 'ru' ? 'Все файлы' : 'All files');
                await page.evaluate(() =>
                {
                    state.archiveSelectedFolderId = 'delo44';
                    state.archiveSelectedFolderItemId = null;
                    renderArchiveMain();
                });
                assert.ok(await page.locator('.archive-mobile-file').count() > 0);
                await page.locator('[data-archive-mobile-file]').first().click();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                await page.locator('#mobileDetailsClose').click();
                assert.equal(await page.locator('[data-archive-mobile-file]').first().evaluate(button => button === document.activeElement), true);
                await page.locator('[data-archive-mobile-select]').first().click();
                await page.locator('.archive-mobile-file [data-archive-file-checkbox]').first().check();
                assert.ok(await page.evaluate(() => state.archiveSelectedFileIds.length > 0));
                await page.locator('.archive-mobile-select-all [data-archive-select-all]').check();
                await page.locator('[data-archive-mobile-bulk-actions]').click();
                assert.equal(await page.locator('[data-archive-mobile-choice="move"]').isVisible(), true);
                await page.keyboard.press('Escape');
                if (width === 390 && language === 'en')
                {
                    await page.locator('[data-archive-mobile-bulk-actions]').click();
                    await page.locator('[data-archive-mobile-choice="move"]').click();
                    assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                    await page.keyboard.press('Escape');
                    await page.locator('[data-archive-mobile-bulk-actions]').click();
                    await page.locator('[data-archive-mobile-choice="links"]').click();
                    assert.equal(await page.locator('#projectMenu, #modalBackdrop .modal').first().isVisible(), true);
                    await page.keyboard.press('Escape');
                    await page.locator('[data-archive-mobile-bulk-actions]').click();
                    await page.locator('[data-archive-mobile-choice="favorite"]').click();
                    assert.equal(await page.evaluate(() => state.archiveSelectedFileIds.length), 0);
                    await page.locator('.archive-mobile-select-all [data-archive-select-all]').check();
                    assert.ok(await page.evaluate(() => state.archiveSelectedFileIds.length > 0));
                    await page.locator('[data-archive-mobile-bulk-actions]').click();
                    await page.locator('[data-archive-mobile-choice="delete"]').click();
                    assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                    await page.keyboard.press('Escape');
                }
                await page.locator('.archive-mobile-file [data-archive-row-actions="file"]').first().click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('.archive-mobile-bulk [data-archive-mobile-select]').click();
                assert.equal(await page.evaluate(() => state.archiveSelectedFileIds.length), 0);
                assert.equal(await page.locator('.archive-mobile-file [data-archive-file-checkbox]').count(), 0);
                if (width === 390 && language === 'en')
                {
                    const file = await page.locator('.archive-mobile-file').first().boundingBox();
                    const client = await page.context().newCDPSession(page);
                    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: file.x + 90, y: file.y + 30 }] });
                    await page.waitForTimeout(550);
                    assert.equal(await page.evaluate(() => state.archiveSelectedFileIds.length), 1);
                    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await client.detach();
                    assert.equal(await page.evaluate(() => archiveMobileSelectMode), true);
                    assert.equal(await page.evaluate(() => state.archiveSelectedFileIds.length), 1);
                    assert.equal(await page.locator('#mobileDetailsClose').count(), 0);
                    await page.locator('.archive-mobile-bulk [data-archive-mobile-select]').click();
                    const scrollFile = await page.locator('.archive-mobile-file').first().boundingBox();
                    const scrollClient = await page.context().newCDPSession(page);
                    await scrollClient.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: scrollFile.x + 90, y: scrollFile.y + 30 }] });
                    await scrollClient.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: scrollFile.x + 90, y: scrollFile.y - 35 }] });
                    await page.waitForTimeout(550);
                    await scrollClient.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await scrollClient.detach();
                    assert.equal(await page.evaluate(() => archiveMobileSelectMode), false);
                }
                if (width === 390)
                {
                    await page.evaluate(() => {
                        startGeneoProductTour();
                        geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'archive-location'));
                    });
                    await page.waitForTimeout(350);
                    assert.equal(await page.locator('[data-geneo-tour-fallback]').isVisible(), false);
                    assert.equal(await page.evaluate(() => geneoTourRuntime.target?.classList.contains('archive-mobile-location')), true);
                    await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'archive-table')));
                    await page.waitForTimeout(350);
                    assert.equal(await page.locator('[data-geneo-tour-fallback]').isVisible(), false);
                    assert.equal(await page.evaluate(() => geneoTourRuntime.target?.classList.contains('archive-mobile-items')), true);
                    await page.evaluate(() => geneoTourClose({ offerRestore: false }));
                }
                if (width === 390 && language === 'en')
                {
                    await page.evaluate(() => {
                        const original = archiveFileById('af1');
                        for (let index = 0; index < 20; index++)
                            sampleData.archiveFiles.push({ ...original, id: `scroll-test-${index}`, name: `Research file ${index}.pdf` });
                        state.archiveView = 'files';
                        state.archiveSelectedFolderId = 'delo44';
                        renderArchiveMain();
                        document.scrollingElement.scrollTop = 300;
                        main.querySelector('[data-archive-mobile-file]').click();
                    });
                    assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                    await page.locator('#mobileDetailsClose').click();
                    assert.equal(await page.evaluate(() => document.scrollingElement.scrollTop), 300);
                }
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
        const tablet = await browser.newPage({ viewport: { width: 1100, height: 720 } });
        await tablet.goto(url, { waitUntil: 'domcontentloaded' });
        await tablet.evaluate(() =>
        {
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Archive';
            state.archiveView = 'files';
            state.archiveSelectedFolderId = 'delo44';
            state.archiveSelectedFileId = 'af1';
            render();
        });
        await tablet.locator('[data-mobile-details]').click();
        assert.ok(await tablet.evaluate(() =>
        {
            const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
            const toolbar = document.querySelector('.archive-inspector-toolbar').getBoundingClientRect();
            return close.top >= toolbar.top && close.bottom <= toolbar.bottom && close.right <= toolbar.right;
        }));
        await tablet.locator('#archiveEditFile').click();
        assert.equal(await tablet.locator('#archiveSaveFileEdit').isVisible(), true);
        assert.ok(await tablet.evaluate(() =>
        {
            const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
            const toolbar = document.querySelector('.archive-inspector-toolbar').getBoundingClientRect();
            return close.top >= toolbar.top && close.bottom <= toolbar.bottom && close.right <= toolbar.right;
        }));
        await tablet.locator('#archiveCancelFileEdit').click();
        await tablet.locator('#mobileDetailsClose').click();
        await tablet.close();

        const sources = await browser.newPage({ viewport: { width: 390, height: 720 } });
        await sources.goto(url, { waitUntil: 'domcontentloaded' });
        await sources.evaluate(() =>
        {
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Archive';
            state.archiveView = 'sources';
            render();
        });
        assert.equal(await sources.locator('.archive-files-toolbar').count(), 0);
        assert.equal(await sources.locator('.archive-mobile-add-files').count(), 0);
        await sources.close();

        const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await desktop.goto(url, { waitUntil: 'domcontentloaded' });
        await desktop.evaluate(() =>
        {
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Archive';
            state.archiveView = 'files';
            render();
        });
        assert.equal(await desktop.locator('.archive-page-actions [data-archive-add-files]').isVisible(), true);
        assert.equal(await desktop.locator('.archive-mobile-add-files').isVisible(), false);
        assert.equal(await desktop.locator('.archive-table thead').isVisible(), true);
        await desktop.close();
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
