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
                assert.equal(await page.locator('#mobileSectionsHeader strong').innerText(),
                    await page.evaluate(() => t('Albums')));
                assert.equal(await page.locator('.workspace .sidebar').getAttribute('aria-label'),
                    await page.evaluate(() => `${t('Albums')} ${t('Navigation')}`));
                await page.keyboard.press('Escape');

                const albumDetails = page.locator('.album-photo-card .mobile-item-details').first();
                assert.equal(await albumDetails.count() > 0, true);
                await albumDetails.click();
                assert.equal(await page.locator('.albums-detail').isVisible(), true);
                assert.equal(await page.locator('.albums-detail [data-albums-detail-toggle]').isVisible(), false);
                await page.locator('#mobileDetailsClose').click();
                assert.equal(await albumDetails.evaluate(button => button === document.activeElement), true);
            }

            await page.evaluate(() =>
            {
                state.activeModule = 'Archive';
                render();
            });
            if (width <= 900)
            {
                const openFolder = page.locator('[data-archive-mobile-folder]').first();
                assert.equal(await openFolder.isVisible(), true);
                await openFolder.click();
                assert.notEqual(await page.locator('.archive-mobile-location-name').innerText(), 'All files');
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
                assert.equal(await page.locator('[data-geneo-toolbar-item="connect"]').isVisible(), true);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }

        for (const [width, moduleName, selector] of [
            [390, 'Family Tree', '#collapseInspector'],
            [390, 'People', '#collapseInspector'],
            [390, 'Archive', '[data-archive-inspector-collapse]'],
            [390, 'Places', '[data-places-inspector-toggle]'],
            [390, 'Geneograph', '[data-geneo-inspector-toggle]'],
            [980, 'Albums', '[data-albums-detail-toggle]'],
            [1100, 'Archive', '[data-archive-inspector-collapse]'],
            [1180, 'People', '#collapseInspector']
        ])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(250);
            await page.evaluate(module =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = module;
                if (module === 'Places') state.selectedPlaceId = 'place-meowbridge';
                if (module === 'Geneograph')
                {
                    state.geneoView = 'home';
                    render();
                    openGeneographBoard('gb1');
                }
                else render();
            }, moduleName);
            await page.locator('[data-mobile-details]').click();
            assert.equal(await page.locator(selector).first().isVisible(), false, `${moduleName} at ${width}px`);
            assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
            if (moduleName === 'Archive')
            {
                assert.ok(await page.evaluate(() =>
                {
                    const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
                    const toolbar = document.querySelector('.archive-inspector-toolbar').getBoundingClientRect();
                    return close.top >= toolbar.top && close.bottom <= toolbar.bottom
                        && close.right <= toolbar.right;
                }));
            }
            if (moduleName === 'Geneograph')
            {
                assert.ok(await page.evaluate(() =>
                {
                    const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
                    const header = document.querySelector('.geneo-inspector-header').getBoundingClientRect();
                    const identity = document.querySelector('.geneo-inspector-identity').getBoundingClientRect();
                    return close.top >= header.top && close.bottom <= header.bottom
                        && close.right <= header.right && close.left > identity.right;
                }));
            }
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#mobileDetailsClose').count(), 0);
            assert.equal(await page.locator('[data-mobile-details]').evaluate(button => button === document.activeElement), true);
            if (width > 500)
            {
                await page.locator('[data-mobile-details]').click();
                await page.locator('#mobileSurfaceBackdrop').click({ position: { x: 4, y: 100 } });
                assert.equal(await page.locator('#mobileDetailsClose').count(), 0);
                assert.equal(await page.locator('[data-mobile-details]').evaluate(button => button === document.activeElement), true);
            }
            await page.close();
        }

        const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await desktop.goto(url, { waitUntil: 'domcontentloaded' });
        await desktop.waitForTimeout(250);
        await desktop.evaluate(() =>
        {
            if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Albums';
            render();
        });
        assert.equal(await desktop.locator('.albums-detail [data-albums-detail-toggle]').isVisible(), true);
        await desktop.locator('.albums-detail [data-albums-detail-toggle]').click();
        assert.equal(await desktop.evaluate(() => state.albumsDetailCollapsed), true);
        await desktop.close();
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
