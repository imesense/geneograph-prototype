const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = process.env.GENEO_TEST_URL || pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

async function chooseArchiveLayout(page, layout)
{
    const button = page.locator(`[data-archive-file-layout="${layout}"]`).first();
    if (await button.isVisible()) await button.click();
    else await page.locator('[data-archive-layout-select]').selectOption(layout);
}

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[390, 'en'], [900, 'ru'], [901, 'en'], [1180, 'ru'], [1280, 'en'], [1920, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                render();
            }, language);
            assert.equal(await page.locator('.archive-files-page > .archive-page-head').count(), 0);
            assert.ok(await page.locator('.archive-file-navigation').evaluate(el => {
                const controls = el.querySelector('.archive-toolbar').getBoundingClientRect();
                const path = el.querySelector('.archive-location-row').getBoundingClientRect();
                return path.top >= controls.bottom && path.left === controls.left;
            }), 'file controls and breadcrumbs occupy two aligned rows');
            if (width === 1920)
                assert.equal(await page.locator('.archive-file-create-actions [data-archive-create-folder]').isVisible(), true);
            if (language === 'ru') {
                const translated = await page.evaluate(() => {
                    const root = document.querySelector('.archive-files-page').innerText;
                    state.archiveSelectedFolderId = 'delo45';
                    renderArchiveMain();
                    const emptyFolder = document.querySelector('.archive-empty-dropzone')?.innerText || '';
                    state.archiveSelectedFolderId = null;
                    renderArchiveMain();
                    return { root, emptyFolder, path: archiveFolderPath('delo44'),
                        document: translateText(archiveFileTypeLabel(archiveFileById('af-pawford-trip'))),
                        spreadsheet: translateText(archiveFileTypeLabel(archiveFileById('af-household-csv'))),
                        links: t('Add links'), count: translateCountPhrase('2 folders, 5 files') };
                });
                assert.match(translated.root, /Семейные записи/);
                assert.match(translated.root, /Исследовательские поездки/);
                assert.match(translated.emptyFolder, /папку «Мяубридж»/);
                assert.equal(translated.path, 'Исследовательские поездки / Поуфорд / Выписки из реестров');
                assert.equal(translated.document, 'Документ');
                assert.equal(translated.spreadsheet, 'Таблица');
                assert.equal(translated.links, 'Добавить связи');
                assert.equal(translated.count, '2 папки, 5 файлов');
            }
            if (width <= 900) {
                assert.equal(await page.locator('.archive-mobile-items').isVisible(), true);
                assert.ok(await page.locator('.archive-layout-switch').isVisible() || await page.locator('.archive-view-picker').isVisible());
            } else {
                const details = page.locator('[data-archive-file-layout="details"]');
                const tiles = page.locator('[data-archive-file-layout="tiles"]');
                assert.equal(await details.evaluate(button => button.classList.contains('toolbar-button')), true);
                assert.equal(await details.getAttribute('aria-pressed'), 'true');
                assert.equal(await page.locator('.archive-table-wrap').isVisible(), true);
                assert.equal(await page.locator('.archive-table th.archive-col-name').getAttribute('aria-sort'), 'ascending');
                await page.locator('.archive-table-folder-row').first().click();
                assert.equal(await page.locator('.archive-selection-bar').count(), 0);
                if (process.env.GENEO_SCREENSHOT_DIR && [901, 1280].includes(width))
                    await page.locator('.archive-files-page').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `archive-details-${width}.png`) });
                const tableBounds = await page.locator('.archive-table-wrap').evaluate(wrap => ({ client: wrap.clientWidth, scroll: wrap.scrollWidth,
                    table: wrap.querySelector('table').getBoundingClientRect().width,
                    columns: [...wrap.querySelector('tbody tr.archive-table-folder-row').cells].map(cell => [Math.round(cell.getBoundingClientRect().width), getComputedStyle(cell).display]),
                    lastActionRight: wrap.querySelector('.archive-table-folder-row [data-archive-row-actions]')?.getBoundingClientRect().right,
                    wrapRight: wrap.getBoundingClientRect().right }));
                assert.ok(tableBounds.lastActionRight <= tableBounds.wrapRight + 1, `${width}px action column remains visible: ${JSON.stringify(tableBounds)}`);
                assert.equal(await page.locator('.archive-table-folder-row .archive-file-icon.folder').count() > 0, true);
                assert.equal(await page.locator('.archive-table-folder-row .archive-file-icon.folder').first().evaluate(icon => getComputedStyle(icon).backgroundColor), 'rgba(0, 0, 0, 0)');
                await chooseArchiveLayout(page, 'tiles');
                assert.equal(await tiles.getAttribute('aria-pressed'), 'true');
                assert.equal(await page.locator('.archive-tiles').isVisible(), true);
                if (process.env.GENEO_SCREENSHOT_DIR && width === 1280)
                    await page.locator('.archive-files-page').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, 'archive-tiles.png') });
                assert.equal(await page.locator('.archive-table-wrap').count(), 0);
                if (width === 1280) {
                    const folder = page.locator('.archive-tile[data-archive-folder-row]').first();
                    const folderId = await folder.getAttribute('data-archive-folder-row');
                    await folder.click();
                    assert.equal(await page.evaluate(() => state.archiveSelectedFolderItemId), folderId);
                    assert.equal(await page.locator('.archive-selection-bar').count(), 0);
                    await page.locator(`.archive-tile[data-archive-folder-row="${folderId}"]`).click();
                    assert.equal(await page.evaluate(() => state.archiveSelectedFolderId), folderId);
                }
                await page.evaluate(() => {
                    state.archiveSelectedFolderId = 'delo44';
                    renderArchiveMain();
                });
                await page.locator('.archive-tile[data-archive-file-row]').first().click();
                assert.ok(await page.evaluate(() => state.archiveSelectedFileId));
                assert.equal(await page.locator('.archive-selection-bar').count(), 0);
                await page.locator('.archive-tile[data-archive-file-row] [data-archive-row-actions="file"]').first().click();
                assert.ok(await page.locator('[data-archive-item-action]').count());
                await page.keyboard.press('Escape');
                const favoriteFileId = await page.locator('.archive-tile[data-archive-file-row]').first().getAttribute('data-archive-file-row');
                const wasFavorite = await page.evaluate(id => archiveFileById(id).favorite, favoriteFileId);
                await page.locator('.archive-tile[data-archive-file-row] [data-archive-row-actions="file"]').first().click();
                await page.locator('[data-archive-item-action="favorite"]').click();
                assert.notEqual(await page.evaluate(id => archiveFileById(id).favorite, favoriteFileId), wasFavorite);
                if (width === 1280) {
                    const fileId = await page.locator('.archive-tile[data-archive-file-row]').first().getAttribute('data-archive-file-row');
                    await page.locator(`.archive-tile[data-archive-file-row="${fileId}"]`).click();
                    await page.locator('.archive-document-modal').waitFor();
                    await page.locator('.archive-document-modal [data-close]').click();
                }
                await page.locator('.archive-tile[data-archive-file-row] input[type="checkbox"]').first().check();
                assert.equal(await page.evaluate(() => state.archiveSelectedFileIds.length), 1);
                await chooseArchiveLayout(page, 'details');
                assert.equal(await page.locator('.archive-table-wrap').isVisible(), true);
                assert.equal(await page.locator('.archive-table-file-row.is-checked').count(), 1);
                await page.locator('[data-archive-column-sort="name"]').click();
                assert.equal(await page.evaluate(() => state.archiveFileSort), 'name');
                assert.equal(await page.locator('.archive-table th.archive-col-name').getAttribute('aria-sort'), 'descending');
                assert.ok(await page.locator('.archive-files-page').evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            }
            assert.deepEqual(errors, [], `${width}px ${language} console`);
            await page.close();
        }
        console.log('Archive Details and Icons layouts, selection, sorting, and mobile boundary passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
