const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() => activateProject('p1', { moduleName: 'Family Tree' }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        for (const language of ['ru', 'en']) {
            const before = await page.evaluate(() => {
                const canvas = document.querySelector('.tree-canvas');
                canvas.scrollLeft = Math.min(350, canvas.scrollWidth - canvas.clientWidth);
                canvas.scrollTop = Math.min(220, canvas.scrollHeight - canvas.clientHeight);
                openGlobalSettingsModal('general');
                return { left: canvas.scrollLeft, top: canvas.scrollTop, zoom: state.treeZoom,
                    selected: state.selectedPersonId, focus: treeProjectViewState().focusPersonId };
            });
            assert.ok(before.left > 0 || before.top > 0);
            await page.locator('#globalLanguageSelect').selectOption(language);
            await page.waitForFunction(expected => {
                const canvas = document.querySelector('.tree-canvas');
                return canvas.scrollLeft === expected.left && canvas.scrollTop === expected.top;
            }, before);
            assert.deepEqual(await page.evaluate(() => ({ zoom: state.treeZoom,
                selected: state.selectedPersonId, focus: treeProjectViewState().focusPersonId })),
                { zoom: before.zoom, selected: before.selected, focus: before.focus });
            await page.locator('.global-settings-modal [data-close]').first().click();
        }
        assert.deepEqual(errors, []);
        console.log('Family Tree language scroll passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
