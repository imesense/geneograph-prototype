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
        for (const [width, language] of [[320, 'en'], [390, 'ru'], [768, 'en'], [900, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(250);
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'Albums';
                render();
            });

            if (width <= 900)
            {
                await page.locator('[data-mobile-menu]').click();
                assert.equal(await page.locator('#mobileModuleDrawer').isVisible(), true);
                assert.equal(await page.locator('#mobileModuleDrawer [data-mobile-destination="notifications"]').count(), 0);
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#mobileModuleDrawer').count(), 0);

                await page.locator('[data-mobile-sections]').click();
                assert.equal(await page.locator('#mobileSectionsHeader').isVisible(), true);
                await page.keyboard.press('Escape');

                const albumDetails = page.locator('.album-photo-card .mobile-item-details').first();
                assert.equal(await albumDetails.count() > 0, true);
                await albumDetails.click();
                assert.equal(await page.locator('.albums-detail').isVisible(), true);
                await page.locator('#mobileDetailsClose').click();
            }

            await page.evaluate(() =>
            {
                state.activeModule = 'Archive';
                render();
            });
            if (width <= 900)
            {
                const openFolder = page.locator('[data-archive-mobile-open-folder]').first();
                assert.equal(await openFolder.isVisible(), true);
                await openFolder.click();
                assert.notEqual(await page.locator('.archive-breadcrumb-current').innerText(), 'All files');
            }

            await page.evaluate(() =>
            {
                state.activeModule = 'Geneograph';
                state.geneoView = 'home';
                render();
                openGeneographBoard('gb1');
            });
            if (width <= 900)
            {
                assert.equal(await page.locator('.geneo-tool-group').isVisible(), true);
                if (width <= 400)
                    assert.equal(await page.locator('.geneo-history-group').isVisible(), false);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
