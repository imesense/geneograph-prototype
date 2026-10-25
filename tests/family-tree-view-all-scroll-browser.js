const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() =>
        {
            if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'Family Tree' });
            state.selectedPersonId = 'silver';
            state.inspectorSections.photos = true;
            state.inspectorSections.archive = true;
            state.inspectorSections.notes = true;
            render();
        });

        for (const [resource, destination] of [
            ['photos', 'Albums'], ['archive', 'Archive'], ['notes', 'Notes']
        ])
        {
            const before = await page.evaluate(() =>
            {
                const canvas = document.querySelector('.tree-canvas');
                canvas.scrollLeft = Math.min(350, canvas.scrollWidth - canvas.clientWidth);
                canvas.scrollTop = Math.min(220, canvas.scrollHeight - canvas.clientHeight);
                return { left: canvas.scrollLeft, top: canvas.scrollTop };
            });
            assert.ok(before.left > 0 || before.top > 0, 'tree can be panned');
            const link = page.locator(`[data-person-resource-view="${resource}"]`);
            assert.ok(await link.count(), `${resource} View all exists`);
            await link.first().click();
            assert.equal(await page.evaluate(() => state.activeModule), destination);
            await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Family Tree'));
            await page.waitForFunction(expected =>
            {
                const canvas = document.querySelector('.tree-canvas');
                return canvas?.scrollLeft === expected.left && canvas?.scrollTop === expected.top;
            }, before);
            const after = await page.locator('.tree-canvas').evaluate(canvas => ({
                left: canvas.scrollLeft, top: canvas.scrollTop
            }));
            assert.deepEqual(after, before, `${resource} View all restores tree scroll`);
        }
        assert.deepEqual(errors, [], 'no browser errors');
        await page.close();
    }
    finally
    {
        await browser.close();
    }
    console.log('Family Tree View all scroll restoration passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
