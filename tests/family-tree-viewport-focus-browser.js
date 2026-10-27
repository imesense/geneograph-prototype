const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const width of [1440, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const snapshot = () => page.evaluate(() => ({ ...getTreeCanvasScroll(), zoom: state.treeZoom,
                focus: treeProjectViewState().focusPersonId, selected: state.selectedPersonId }));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage('en', false);
                activateProject('p1', { moduleName: 'Family Tree' });
                state.treeZoom = 125;
                renderFamilyTree();
            });
            await settle();
            await page.evaluate(() =>
            {
                const canvas = document.querySelector('.tree-canvas');
                canvas.scrollLeft = Math.min(500, canvas.scrollWidth - canvas.clientWidth);
                canvas.scrollTop = Math.min(180, canvas.scrollHeight - canvas.clientHeight);
            });
            const before = await snapshot();
            assert.ok(before.left > 0 || before.top > 0, 'fixture is panned');
            for (const language of ['ru', 'en'])
            {
                await page.evaluate(language => setLanguage(language), language);
                await settle();
                const after = await snapshot();
                assert.ok(Math.abs(after.left - before.left) <= 1 && Math.abs(after.top - before.top) <= 1,
                    `viewport survives ${language} at ${width}px: ${JSON.stringify({ before, after })}`);
                assert.equal(after.zoom, before.zoom);
                assert.equal(after.focus, before.focus);
                assert.equal(after.selected, before.selected);
            }
            await page.evaluate(() => { state.treeZoom = 100; setTreeFocusPerson('silver'); renderFamilyTree(); });
            await settle();
            const card = page.locator('.tree-person-card[data-person-id="barnaby"]');
            await card.scrollIntoViewIfNeeded();
            await card.locator('.tree-name').dblclick();
            await settle();
            const doubleFocus = await snapshot();
            assert.equal(doubleFocus.focus, 'barnaby', 'double-click focuses the branch');
            assert.equal(doubleFocus.selected, 'barnaby');
            await page.evaluate(() => setTreeFocusPerson('silver'));
            await settle();
            await page.locator('[data-tree-card-focus="barnaby"]').click();
            await settle();
            const buttonFocus = await snapshot();
            assert.deepEqual(buttonFocus, doubleFocus, 'double-click matches the Focus button');
            await page.evaluate(() => setTreeFocusPerson('silver'));
            await settle();
            await page.locator('.tree-person-card[data-person-id="barnaby"] [data-card-edit]').dispatchEvent('dblclick');
            assert.equal(await page.evaluate(() => treeProjectViewState().focusPersonId), 'silver', 'card actions do not focus');
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Family Tree language viewport and double-click focus passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
