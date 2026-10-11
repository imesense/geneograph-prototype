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
            for (const width of [320, 390, 768, 900])
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
                assert.ok(await page.locator('.archive-files-toolbar').evaluate((toolbar, width) =>
                {
                    const bounds = toolbar.getBoundingClientRect();
                    const controls = [toolbar.querySelector(width <= 540 ? '.archive-mobile-search-trigger' : '.app-search-field'),
                        toolbar.querySelector('#archiveFilterButton'), toolbar.querySelector('#archiveSort'),
                        toolbar.querySelector('.archive-mobile-new-folder'), toolbar.querySelector('.archive-mobile-add-files')]
                        .map(control => control.getBoundingClientRect());
                    return controls.every(rect => rect.width >= 39 && rect.height >= 40
                        && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1)
                        && controls[0].left >= bounds.left - 1
                        && controls.at(-1).right <= bounds.right + 1
                        && controls.every((rect, index) => !index || rect.left >= controls[index - 1].right);
                }, width), `toolbar ${width} ${language}`);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                assert.equal(await page.locator('.archive-page-actions').isVisible(), false);
                assert.equal(await page.locator('.archive-mobile-add-files').isVisible(), true);
                await page.locator('.archive-mobile-new-folder').click();
                assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('.archive-mobile-add-files').click();
                assert.equal(await page.locator('.toast.show').count() > 0, true);
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
                assert.equal(await page.locator('[data-archive-select-all]').isVisible(), true);
                assert.ok(await page.locator('[data-archive-folder-row]').first().evaluate(row =>
                    row.getBoundingClientRect().width < innerWidth / 2
                    && row.getBoundingClientRect().width > row.getBoundingClientRect().height
                    && row.scrollWidth <= row.clientWidth + 1
                    && row.cells[1].getBoundingClientRect().width >= row.getBoundingClientRect().width - 30
                    && row.querySelector('.archive-file-icon').getBoundingClientRect().right
                        < row.querySelector('.archive-folder-name-line').getBoundingClientRect().left
                    && [3, 4, 5, 6].every(index => getComputedStyle(row.cells[index - 1]).display === 'none')));
                assert.equal(await page.locator('[data-archive-folder-details]').count(), 0);
                await page.locator('[data-archive-folder-row]').first().focus();
                await page.keyboard.press('Space');
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                assert.ok(await page.evaluate(() =>
                {
                    const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
                    const toolbar = document.querySelector('.archive-inspector-toolbar').getBoundingClientRect();
                    return close.top >= toolbar.top && close.bottom <= toolbar.bottom && close.right <= toolbar.right;
                }));
                await page.locator('#mobileDetailsClose').click();
                let folder = await page.locator('[data-archive-folder-row]').first().boundingBox();
                const client = await page.context().newCDPSession(page);
                await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{
                    x: folder.x + Math.min(95, folder.width / 2), y: folder.y + 26
                }] });
                await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
                    x: folder.x + Math.min(95, folder.width / 2), y: folder.y - 30
                }] });
                await page.waitForTimeout(520);
                await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                assert.equal(await page.locator('#mobileDetailsClose').count(), 0);
                folder = await page.locator('[data-archive-folder-row]').first().boundingBox();
                await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{
                    x: folder.x + Math.min(95, folder.width / 2), y: folder.y + 26
                }] });
                await page.waitForTimeout(520);
                await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                await client.detach();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                assert.equal(await page.evaluate(() => state.archiveSelectedFolderId), null);
                await page.locator('#mobileDetailsClose').click();
                await page.locator('[data-archive-folder-row]').first().click({ position: { x: 80, y: 26 } });
                assert.notEqual(await page.locator('.archive-breadcrumb-current').innerText(), 'All files');
                await page.evaluate(() =>
                {
                    state.archiveSelectedFolderId = 'delo44';
                    state.archiveSelectedFolderItemId = null;
                    renderArchiveMain();
                });
                assert.ok(await page.locator('[data-archive-file-row]').count() > 0);
                assert.ok(await page.locator('[data-archive-file-row]').first().evaluate(row =>
                    row.scrollWidth <= row.clientWidth + 1));
                await page.locator('[data-archive-file-checkbox]').first().check();
                assert.ok(await page.evaluate(() => state.archiveSelectedFileIds.length > 0));
                await page.locator('[data-archive-select-all]').check();
                await page.locator('[data-archive-toggle-favorite]').first().click();
                await page.locator('[data-archive-row-actions="file"]').first().click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await page.keyboard.press('Escape');
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
