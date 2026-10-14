const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const width of [390, 768, 1280, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Notes' });
            });
            const toggle = page.locator('#notesMobileSearchToggle');
            const close = page.locator('#notesMobileSearchClose');
            const search = page.locator('.notes-toolbar-search');
            if (width <= 540) {
                assert.equal(await toggle.isVisible(), true);
                assert.equal(await close.isVisible(), false);
                assert.equal(await search.isVisible(), false);
                await toggle.click();
                assert.equal(await toggle.isVisible(), false);
                assert.equal(await close.isVisible(), true);
                assert.equal(await search.isVisible(), true);
                await close.click();
                assert.equal(await toggle.isVisible(), true);
            } else {
                assert.equal(await toggle.isVisible(), false);
                assert.equal(await close.isVisible(), false);
                assert.equal(await search.isVisible(), true);
            }
            assert.deepEqual(errors, [], `${width}px browser errors`);
            await page.close();
        }
        console.log('Notes search controls display correctly at phone, tablet, and desktop widths.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
