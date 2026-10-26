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
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                state.projectOpen = false;
                state.currentProjectId = null;
                state.activeModule = 'Projects';
                state.search = '';
                render();
            });
            for (const view of ['grid', 'list'])
            {
                await page.evaluate(view => { state.viewMode = view; renderStartup(); }, view);
                const tile = page.locator('[data-project-create-tile]');
                assert.equal(await tile.locator('button').count(), 2);
                assert.equal(await tile.locator('button button').count(), 0);
                assert.equal(await tile.locator('.library-import-action').isDisabled(), true);
                assert.ok(await tile.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'project tile fits');
                assert.equal(await tile.locator('.library-create-primary strong').textContent().then(value => value.trim()), language === 'ru' ? 'Создать древо' : 'Create family tree');
                if (process.env.GENEO_TILE_SCREENSHOTS && view === 'grid')
                    await tile.screenshot({ path: path.join(process.env.GENEO_TILE_SCREENSHOTS, `project-tile-${width}.png`) });
            }
            await page.locator('[data-startup-create]').click();
            assert.equal(await page.locator('#createForm fieldset').count(), 0);
            assert.equal(await page.locator('#createTitle').textContent(), language === 'ru' ? 'Новый проект' : 'New project');
            if (width === 1280)
            {
                await page.locator('#projectName').fill('Tile-created project');
                await page.locator('#createForm [type="submit"]').click();
                assert.equal(await page.evaluate(() => currentProject().name), 'Tile-created project');
            }
            else await page.locator('#modalBackdrop [data-close]').first().click();
            await page.evaluate(() => activateProject('p1', { moduleName: 'Geneograph' }));
            for (const view of ['grid', 'list'])
            {
                await page.evaluate(view => { state.geneoBoardViewMode = view; renderGeneographHome(); }, view);
                const tile = page.locator('[data-geneo-create-tile]');
                assert.equal(await tile.locator('button').count(), 2);
                assert.equal(await tile.locator('button button').count(), 0);
                assert.ok(await tile.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'board tile fits');
                if (process.env.GENEO_TILE_SCREENSHOTS && view === 'grid')
                    await tile.screenshot({ path: path.join(process.env.GENEO_TILE_SCREENSHOTS, `board-tile-${width}.png`) });
            }
            await page.locator('[data-geneo-create-tile] [data-geneo-create]').click();
            assert.equal(await page.locator('[data-geneo-board-details-form]').count(), 1);
            if (width === 1280)
            {
                await page.locator('#geneoBoardDetailsName').fill('Tile-created board');
                await page.locator('[data-geneo-board-details-form] [type="submit"]').click();
                assert.equal(await page.evaluate(() => selectedGeneographBoard().title), 'Tile-created board');
                await page.evaluate(() => { state.geneoView = 'home'; render(); });
            }
            else await page.locator('#modalBackdrop [data-close]').first().click();
            for (const trigger of ['[data-geneo-create-tile] [data-geneo-import]', '.archive-page-head [data-geneo-import]'])
            {
                const button = page.locator(trigger);
                assert.equal(await button.count(), 1);
                const chooser = page.waitForEvent('filechooser');
                await button.click();
                await chooser;
                assert.equal(await page.locator('#modalBackdrop.open').count(), 0, 'import never starts board creation');
            }
            const result = await page.evaluate(async () =>
            {
                const before = sampleData.boards.length;
                const tile = main.querySelector('[data-geneo-create-tile]');
                const transfer = new DataTransfer();
                transfer.items.add(new File(['invalid'], 'wrong.txt', { type: 'text/plain' }));
                tile.dispatchEvent(new DragEvent('dragover', { dataTransfer: transfer, bubbles: true, cancelable: true }));
                const feedback = tile.classList.contains('is-dragging');
                tile.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
                return { feedback, clear: !tile.classList.contains('is-dragging'), unchanged: before === sampleData.boards.length };
            });
            assert.deepEqual(result, { feedback: true, clear: true, unchanged: true });
            const json = await page.evaluate(() => buildGeneographBoardFile({
                ...getGeneographBoard('gb1'), diagram: createEmptyGeneographDiagram()
            }));
            await page.evaluate(json =>
            {
                const transfer = new DataTransfer();
                transfer.items.add(new File([json], 'board.ggboard', { type: 'application/json' }));
                main.querySelector('[data-geneo-create-tile]').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
            }, json);
            await page.waitForFunction(() => state.geneoView === 'board' && selectedGeneographBoard().id !== 'gb1');
            assert.deepEqual(await page.evaluate(() => selectedGeneographBoard().collectionIds), []);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Create-first project and board tiles passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
