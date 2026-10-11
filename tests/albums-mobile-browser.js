const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

async function swipe(page, x, fromY, toY)
{
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
    for (let step = 1; step <= 8; step++)
    {
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove', touchPoints: [{ x, y: fromY + (toY - fromY) * step / 8 }]
        });
        await page.waitForTimeout(16);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
}

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const language of ['en', 'ru'])
        {
            for (const width of [320, 390, 768, 900])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 }, hasTouch: true, isMobile: true });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
                await page.evaluate(() =>
                {
                    if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = 'Albums';
                    render();
                });
                assert.ok(await page.locator('.albums-content').evaluate(el => el.scrollHeight > el.clientHeight + 100));
                assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2));
                assert.ok(await page.locator('.albums-toolbar').evaluate(toolbar =>
                {
                    const search = toolbar.querySelector('.app-search-field').getBoundingClientRect();
                    const row = toolbar.querySelector('.albums-toolbar-right').getBoundingClientRect();
                    const controls = [toolbar.querySelector('.albums-filter-button'), toolbar.querySelector('.app-sort-trigger'),
                        ...toolbar.querySelectorAll('.albums-view-button')].map(el => el.getBoundingClientRect());
                    const bounds = toolbar.getBoundingClientRect();
                    return search.width >= bounds.width - 2 && search.bottom <= row.top
                        && controls.every((rect, index) => rect.width > 40 && rect.left >= bounds.left - 1
                            && rect.right <= bounds.right + 1 && (!index || rect.left > controls[index - 1].right))
                        && Math.abs(controls.at(-1).right - bounds.right) <= 2;
                }), `toolbar fits at ${width} (${language})`);

                const firstImage = await page.locator('.album-photo-card .albums-thumb').first().boundingBox();
                await swipe(page, firstImage.x + firstImage.width / 2, firstImage.y + firstImage.height - 12,
                    firstImage.y + 12);
                assert.ok(await page.locator('.albums-content').evaluate(el => el.scrollTop > 20),
                    `photo swipe scrolls at ${width} (${language})`);
                await page.waitForTimeout(250);
                await page.locator('.albums-content').evaluate(el => { el.scrollTop = 180; });
                const contentBox = await page.locator('.albums-content').boundingBox();
                await page.touchscreen.tap(contentBox.x + contentBox.width / 2, contentBox.y + 60);
                const selectedScroll = await page.locator('.albums-content').evaluate(el => el.scrollTop);
                assert.ok(Math.abs(selectedScroll - 180) <= 8,
                    `selection scroll ${selectedScroll} at ${width} (${language})`);
                assert.ok(await page.locator('.album-photo-card.selected-detail .albums-card-footer').evaluate(footer =>
                {
                    const details = footer.querySelector('.mobile-item-details').getBoundingClientRect();
                    const more = footer.querySelector('.albums-card-more').getBoundingClientRect();
                    const bounds = footer.getBoundingClientRect();
                    return details.width >= 32 && more.width >= 32 && details.right < more.left
                        && more.right <= bounds.right + 1 && details.top >= bounds.top - 1;
                }), `selected photo actions fit at ${width} (${language})`);
                await page.locator('.album-photo-card.selected-detail .albums-card-more').click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('.album-photo-card.selected-detail .mobile-item-details').click();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                const beforeDetails = await page.locator('.albums-content').evaluate(el => el.scrollTop);
                await page.locator('#mobileDetailsClose').click();
                assert.ok(await page.locator('.albums-content').evaluate((el, top) => Math.abs(el.scrollTop - top) <= 8,
                    beforeDetails));
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
