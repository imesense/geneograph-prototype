const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[390, 'ru'], [1280, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 820 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(language => setLanguage(language, false), language);
            await page.evaluate(() => startGeneoProductTour());
            await page.waitForFunction(() => geneoTourRuntime.active && !geneoTourRuntime.transitioning);
            await page.evaluate(() => geneoTourNavigate(geneoTourSteps.findIndex(step => step.id === 'geneograph-export')));
            const menu = page.locator('#projectMenu.geneo-export-menu');
            await menu.waitFor();
            await page.waitForFunction(() => geneoTourRuntime.index === geneoTourSteps.findIndex(step => step.id === 'geneograph-export')
                && !geneoTourRuntime.transitioning && Boolean(geneoTourRuntime.root));
            assert.equal(await menu.evaluate(element => element.inert), true);
            assert.equal(await menu.locator('[data-geneo-export-file]').isVisible(), true);
            assert.equal(await menu.locator('[data-geneo-export-png]').isVisible(), true);
            const spotlight = await page.evaluate(() => {
                const menu = document.querySelector('#projectMenu.geneo-export-menu').getBoundingClientRect();
                const button = document.querySelector('[data-geneo-export]').getBoundingClientRect();
                const first = document.querySelector('[data-geneo-tour-block]').getBoundingClientRect();
                const second = document.querySelector('[data-geneo-tour-block-secondary]').getBoundingClientRect();
                return { menu: [menu.left, menu.top, menu.right, menu.bottom],
                    button: [button.left, button.top, button.right, button.bottom],
                    first: [first.left, first.top, first.right, first.bottom],
                    second: [second.left, second.top, second.right, second.bottom] };
            });
            const encloses = (outer, inner) => outer[0] <= inner[0] + 2 && outer[1] <= inner[1] + 2
                && outer[2] >= inner[2] - 2 && outer[3] >= inner[3] - 2;
            assert.ok(encloses(spotlight.first, spotlight.menu), JSON.stringify(spotlight));
            assert.ok(encloses(spotlight.second, spotlight.button), JSON.stringify(spotlight));
            assert.match(await page.locator('[data-geneo-tour-body]').innerText(), language === 'ru' ? /\.ggboard.*PNG/s : /\.ggboard.*PNG/s);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `geneograph-export-tour-${width}.png`) });
            await page.locator('[data-geneo-tour-action="next"]').click();
            assert.equal(await menu.count(), 0);
            await page.locator('[data-geneo-tour-action="back"]').click();
            await menu.waitFor();
            await page.locator('.geneo-tour-close').click();
            assert.equal(await menu.count(), 0);
            assert.deepEqual(errors, [], `${width}px console`);
            await page.close();
        }
        console.log('Geneograph export tour menu, dual spotlight, copy, and cleanup passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
