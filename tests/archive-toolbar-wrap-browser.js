const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH });
    try
    {
        for (const language of ['en', 'ru'])
        {
            const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                render();
            }, language);
            for (const width of [1200, 1000, 800, 680, 560, 440, 390, 320, 272])
            {
                await page.locator('.archive-main').evaluate((element, width) =>
                {
                    element.style.width = `${width}px`;
                    element.style.maxWidth = `${width}px`;
                    element.style.boxSizing = 'content-box';
                }, width);
                const geometry = await page.locator('.archive-files-toolbar').evaluate(toolbar =>
                {
                    const bounds = toolbar.getBoundingClientRect();
                    const create = toolbar.querySelector('.archive-toolbar-create').getBoundingClientRect();
                    const search = toolbar.querySelector('.app-search-field');
                    const folder = toolbar.querySelector('[data-archive-create-folder]');
                    const items = [...toolbar.querySelectorAll('button, .app-search-field, .archive-view-picker')]
                        .filter(element => element.getClientRects().length && getComputedStyle(element).display !== 'none')
                        .map(element => element.getBoundingClientRect());
                    return { overflow: items.some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1),
                        createFirstRow: Math.abs(create.top - bounds.top) < 2,
                        folderVisible: !!folder?.getClientRects().length,
                        searchVisible: !!search.getClientRects().length };
                });
                assert.equal(geometry.overflow, false, `${language} ${width}: no control overflow`);
                assert.equal(geometry.folderVisible, true, `${language} ${width}: folder remains accessible`);
                assert.equal(geometry.searchVisible, width > 1000, `${width}: search compacts first`);
                if (width >= 320) assert.equal(geometry.createFirstRow, true, `${width}: creation wraps last`);
            }
            await page.locator('.archive-main').evaluate(element => element.removeAttribute('style'));
            for (const width of [1920, 1600, 1440, 1280, 1180, 1024, 900, 768, 640, 540, 440, 390, 320])
            {
                await page.setViewportSize({ width, height: 900 });
                const geometry = await page.locator('.archive-files-toolbar').evaluate(toolbar =>
                {
                    const bounds = toolbar.getBoundingClientRect();
                    const trigger = toolbar.querySelector('.app-sort-trigger');
                    const button = trigger.getBoundingClientRect();
                    const icon = trigger.querySelector('.app-sort-icon').getBoundingClientRect();
                    const compact = !toolbar.querySelector('.app-sort-current').getClientRects().length;
                    const items = [...toolbar.querySelectorAll('button, .app-search-field, .archive-view-picker')]
                        .filter(element => element.getClientRects().length)
                        .map(element => element.getBoundingClientRect());
                    return { overflow: items.some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1),
                        centered: !compact || Math.abs((button.left + button.right) / 2 - (icon.left + icon.right) / 2) < 1,
                        aligned: Math.abs((button.top + button.bottom) / 2 - (icon.top + icon.bottom) / 2) < 1 };
                });
                assert.equal(geometry.overflow, false, `${language} viewport ${width}: no overflow`);
                assert.equal(geometry.centered, true, `${language} viewport ${width}: compact sort centered`);
                assert.equal(geometry.aligned, true, `${language} viewport ${width}: sort vertically aligned`);
                assert.equal(await page.locator('.archive-layout-switch').isVisible(), true, 'view icons stay visible');
                assert.equal(await page.locator('.archive-view-picker').isVisible(), false, 'no view dropdown');
                const searchTrigger = page.locator('[data-archive-mobile-search-open]');
                if (await searchTrigger.isVisible())
                {
                    await searchTrigger.click();
                    assert.equal(await page.locator('#archiveSearch').isVisible(), true);
                    await page.locator('[data-archive-mobile-search-close]').click();
                    assert.equal(await searchTrigger.isVisible(), true);
                }
                if (process.env.GENEO_SCREENSHOT_DIR && [1280, 768, 320].includes(width))
                    await page.locator('.archive-file-navigation').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `archive-toolbar-${language}-${width}.png`) });
            }
            await page.close();
        }
        console.log('Archive gradual toolbar wrapping passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
