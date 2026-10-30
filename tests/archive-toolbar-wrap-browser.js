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
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
                        searchVisible: !!search.getClientRects().length,
                        density: Number(toolbar.dataset.density),
                        wrapped: toolbar.querySelector('.archive-toolbar-main').getBoundingClientRect().height > 45,
                        expected: toolbar.dataset.fitWidths.split(',').map(Number).findIndex(value => value <= bounds.width) };
                });
                assert.equal(geometry.overflow, false, `${language} ${width}: no control overflow`);
                assert.equal(geometry.folderVisible, true, `${language} ${width}: folder remains accessible`);
                assert.equal(geometry.density, geometry.expected < 0 ? 4 : geometry.expected, `${width}: use least compact fitting layout`);
                if (width > 440 && geometry.expected >= 0) assert.equal(geometry.wrapped, false, `${width}: no unnecessary row wrapping`);
                assert.equal(geometry.searchVisible, geometry.density === 0, `${width}: search compacts first`);
                if (width >= 320) assert.equal(geometry.createFirstRow, true, `${width}: creation wraps last`);
            }
            await page.locator('.archive-main').evaluate(element => element.removeAttribute('style'));
            for (const width of [1920, 1600, 1440, 1280, 1180, 1024, 900, 768, 640, 540, 440, 390, 320])
            {
                await page.setViewportSize({ width, height: 900 });
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
                    const expanded = await page.locator('.archive-files-toolbar').evaluate(toolbar =>
                    {
                        const row = toolbar.getBoundingClientRect();
                        const search = toolbar.querySelector('.app-search-field').getBoundingClientRect();
                        const close = toolbar.querySelector('[data-archive-mobile-search-close]').getBoundingClientRect();
                        return { closeWidth: close.width, closeHeight: close.height, gap: close.left - search.right,
                            fills: Math.abs(close.right - row.right) < 1 && Math.abs(search.left - row.left) < 1 };
                    });
                    assert.equal(expanded.closeWidth, 44);
                    assert.equal(expanded.closeHeight, 44);
                    assert.equal(expanded.fills, true, `${width}: expanded search fills row`);
                    assert.ok(expanded.gap >= 4 && expanded.gap <= 8);
                    if (process.env.GENEO_SCREENSHOT_DIR && [1280, 768, 320].includes(width))
                        await page.locator('.archive-file-navigation').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `archive-search-${language}-${width}.png`) });
                    await page.locator('#archiveSearch').fill('birth');
                    await page.locator('#archiveSearch').press('Escape');
                    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                    const compactSearch = await searchTrigger.isVisible();
                    assert.equal(await (compactSearch ? searchTrigger : page.locator('#archiveSearch')).evaluate(element => element === document.activeElement), true, `${language} ${width}: focus ${await page.evaluate(() => document.activeElement.outerHTML.slice(0, 200))}`);
                    assert.equal(await searchTrigger.getAttribute('aria-expanded'), 'false');
                    assert.equal(await searchTrigger.evaluate(element => element.classList.contains('has-query')), true);
                    if (compactSearch) await searchTrigger.click();
                    assert.equal(await page.locator('#archiveSearch').inputValue(), 'birth');
                    await page.locator('#archiveSearch').fill('');
                    if (await page.locator('[data-archive-mobile-search-close]').isVisible())
                        await page.locator('[data-archive-mobile-search-close]').click();
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
