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
                assert.ok(await page.locator('.albums-main').evaluate(el => el.scrollHeight > el.clientHeight + 100));
                assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2));
                assert.equal(await page.locator('#albumsAddPhotos').isVisible(), false);
                assert.equal(await page.locator('#albumsMobileAddPhotos').isVisible(), true);
                assert.equal(await page.locator('#albumsMobileAddPhotos .albums-add-label-short').isVisible(), width <= 540);
                assert.equal(await page.locator('#albumsMobileAddPhotos .albums-add-label-full').isVisible(), width > 540);
                assert.ok(await page.locator('.albums-toolbar').evaluate(toolbar =>
                {
                    const search = toolbar.querySelector('.app-search-field').getBoundingClientRect();
                    const add = toolbar.querySelector('#albumsMobileAddPhotos').getBoundingClientRect();
                    const row = toolbar.querySelector('.albums-toolbar-right').getBoundingClientRect();
                    const controls = [toolbar.querySelector('.albums-filter-button'), toolbar.querySelector('.app-sort-trigger'),
                        ...toolbar.querySelectorAll('.albums-view-button')].map(el => el.getBoundingClientRect());
                    const bounds = toolbar.getBoundingClientRect();
                    return search.width >= 100 && search.left >= bounds.left - 1
                        && add.left > search.right && Math.abs(add.right - bounds.right) <= 2
                        && search.bottom <= row.top
                        && controls.every((rect, index) => rect.width > 40 && rect.left >= bounds.left - 1
                            && rect.right <= bounds.right + 1 && (!index || rect.left > controls[index - 1].right))
                        && Math.abs(controls.at(-1).right - bounds.right) <= 2;
                }), `toolbar fits at ${width} (${language})`);
                await page.locator('#albumsMobileAddPhotos').click();
                assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                await page.keyboard.press('Escape');

                const firstImage = await page.locator('.album-photo-card .albums-thumb').first().boundingBox();
                await swipe(page, firstImage.x + firstImage.width / 2, firstImage.y + firstImage.height - 12,
                    firstImage.y + 12);
                assert.ok(await page.locator('.albums-main').evaluate(el => el.scrollTop > 20),
                    `photo swipe scrolls at ${width} (${language})`);
                assert.ok(await page.locator('.albums-header').evaluate(el => el.getBoundingClientRect().top < 52),
                    `Albums header scrolls with photos at ${width} (${language})`);
                await page.waitForTimeout(250);
                await page.locator('.albums-main').evaluate(el => { el.scrollTop = 0; });
                await page.locator('.albums-card-body').first().evaluate(el => el.scrollIntoView({ block: 'center' }));
                const bodyBox = await page.locator('.albums-card-body').first().boundingBox();
                const beforeTextSwipe = await page.locator('.albums-main').evaluate(el => el.scrollTop);
                await swipe(page, bodyBox.x + bodyBox.width / 2, bodyBox.y + bodyBox.height - 8,
                    bodyBox.y - 90);
                assert.ok(await page.locator('.albums-main').evaluate((el, top) => el.scrollTop > top + 20,
                    beforeTextSwipe), `card text swipe scrolls at ${width} (${language})`);
                await page.waitForTimeout(250);
                await page.locator('.albums-main').evaluate(el => { el.scrollTop = 180; });
                await page.locator('.albums-card-body').first().click();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                const selectedScroll = await page.locator('.albums-main').evaluate(el => el.scrollTop);
                assert.ok(Math.abs(selectedScroll - 180) <= 24,
                    `selection scroll ${selectedScroll} at ${width} (${language})`);
                assert.ok(await page.locator('.album-photo-card.selected-detail .albums-card-footer').evaluate(footer =>
                {
                    const details = footer.querySelector('.mobile-item-details').getBoundingClientRect();
                    const more = footer.querySelector('.albums-card-more').getBoundingClientRect();
                    const bounds = footer.getBoundingClientRect();
                    return details.width >= 32 && more.width >= 32 && details.right < more.left
                        && more.right <= bounds.right + 1 && details.top >= bounds.top - 1;
                }), `selected photo actions fit at ${width} (${language})`);
                await page.locator('#mobileDetailsClose').click();
                await page.locator('.album-photo-card.selected-detail .albums-card-more').click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('.album-photo-card.selected-detail .mobile-item-details').click();
                assert.equal(await page.locator('#mobileDetailsClose').isVisible(), true);
                const closeInToolbar = async () => assert.ok(await page.evaluate(() =>
                {
                    const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
                    const toolbar = document.querySelector('.albums-detail-toolbar').getBoundingClientRect();
                    const actions = [...document.querySelectorAll('.albums-detail-toolbar button:not([data-albums-detail-toggle])')]
                        .map(button => button.getBoundingClientRect()).filter(rect => rect.width);
                    return close.top >= toolbar.top && close.bottom <= toolbar.bottom
                        && close.right <= toolbar.right && actions.every(rect => rect.right < close.left);
                }));
                await closeInToolbar();
                await page.locator('#albumsLinkAlbum').click();
                assert.ok(await page.locator('.album-picker-results').evaluate(el =>
                {
                    const panel = el.closest('.album-picker-results-panel');
                    return el.clientHeight > 100
                        && panel.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom < 2;
                }));
                assert.equal(await page.evaluate(() => document.activeElement?.matches('input[type="search"]')), false);
                await page.locator('[data-album-picker-create]').click();
                assert.equal(await page.locator('[data-album-picker-create-form]').isVisible(), true);
                await page.locator('[data-album-picker-back]').click();
                assert.equal(await page.locator('[data-album-picker-browse]').isVisible(), true);
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), 'details');
                for (const trigger of ['#albumsTagPeople', '#albumsManagePhotoNotes', '#albumsManagePhotoSources'])
                {
                    await page.locator(trigger).click();
                    assert.equal(await page.evaluate(() => document.activeElement?.matches('input[type="search"]')), false);
                    if (trigger === '#albumsTagPeople' && width <= 760)
                    {
                        assert.ok(await page.locator('.albums-tag-people-modal').evaluate(modal =>
                        {
                            const body = modal.querySelector('.photo-people-body');
                            const sidebar = modal.querySelector('.photo-people-sidebar');
                            const results = modal.querySelector('.photo-people-results-panel');
                            const workspace = modal.querySelector('.photo-people-workspace');
                            return body.scrollHeight > body.clientHeight
                                && sidebar.getBoundingClientRect().bottom <= workspace.getBoundingClientRect().top + 1
                                && results.getBoundingClientRect().bottom <= workspace.getBoundingClientRect().top;
                        }), `Tag people flows to photo at ${width} (${language})`);
                    }
                    await page.keyboard.press('Escape');
                    assert.equal(await page.evaluate(() => mobileSurface), 'details');
                }
                await page.locator('#albumsInspectorMore').click();
                assert.ok(await page.locator('#projectMenu').evaluate(menu =>
                {
                    const rect = menu.getBoundingClientRect();
                    return document.elementFromPoint(rect.left + 20, rect.top + 20)?.closest('#projectMenu') === menu;
                }));
                await page.keyboard.press('Escape');
                await page.locator('#albumsEditPhoto').click();
                assert.equal(await page.locator('#albumsCancelPhotoEdit').isVisible(), true);
                await closeInToolbar();
                await page.locator('#albumsCancelPhotoEdit').click();
                const beforeDetails = await page.locator('.albums-main').evaluate(el => el.scrollTop);
                await page.locator('#mobileDetailsClose').click();
                assert.ok(await page.locator('.albums-main').evaluate((el, top) => Math.abs(el.scrollTop - top) <= 8,
                    beforeDetails));
                await page.locator('[data-mobile-sections]').click();
                await page.locator('#albumsNewAlbum').click();
                assert.equal(await page.locator('#newAlbumForm').isVisible(), true);
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), 'sections');
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), null);
                await page.locator('#albumsFilterButton').click();
                assert.equal(await page.locator('#albumsFilterButton').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                await page.locator('#albumsSort').click();
                assert.equal(await page.locator('#albumsSort').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                await page.locator('[data-albums-mode="list"]').click();
                assert.equal(await page.locator('.albums-list-row:not(.header)').count() > 0, true);
                assert.equal(await page.locator('.albums-list-row:not(.header) .albums-row-more').first().isVisible(), true);
                assert.ok(await page.locator('.albums-list').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
                assert.ok(await page.locator('.albums-list-row:not(.header)').first().evaluate(row =>
                {
                    const bounds = row.getBoundingClientRect();
                    const people = row.querySelector('.albums-list-people > span:last-child').getBoundingClientRect();
                    return people.width >= 100 && people.right <= bounds.right;
                }));
                await page.locator('[data-albums-select-visible]').check();
                assert.ok(await page.evaluate(() => state.selectedPhotoIds.length > 0));
                await page.locator('[data-albums-select-visible]').uncheck();
                await page.locator('.albums-list-row:not(.header) .albums-row-more').first().click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.locator('[data-albums-mode="grid"]').click();
                await page.locator('[data-mobile-sections]').click();
                await page.locator('[data-album-menu]').first().click();
                assert.equal(await page.evaluate(() => mobileSurface), 'sections');
                await page.locator('[data-album-action="edit"]').click();
                assert.equal(await page.locator('#editAlbumForm').isVisible(), true);
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), 'sections');
                assert.equal(await page.locator('[data-album-menu]').first().evaluate(el => document.activeElement === el), true);
                await page.keyboard.press('Escape');
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
        const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await desktop.goto(url, { waitUntil: 'domcontentloaded' });
        await desktop.evaluate(() =>
        {
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Albums';
            render();
        });
        assert.equal(await desktop.locator('#albumsAddPhotos').isVisible(), true);
        assert.equal(await desktop.locator('#albumsMobileAddPhotos').isVisible(), false);
        assert.equal(await desktop.locator('.albums-toolbar').evaluate(el => getComputedStyle(el).display), 'flex');
        await desktop.locator('#albumsAddPhotos').click();
        assert.equal(await desktop.locator('#modalBackdrop .modal').isVisible(), true);
        await desktop.close();

        const tablet = await browser.newPage({ viewport: { width: 940, height: 720 } });
        await tablet.goto(url, { waitUntil: 'domcontentloaded' });
        await tablet.evaluate(() =>
        {
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Albums';
            render();
        });
        await tablet.locator('.album-photo-card').first().click();
        await tablet.locator('[data-mobile-details]').click();
        assert.ok(await tablet.evaluate(() =>
        {
            const close = document.querySelector('#mobileDetailsClose').getBoundingClientRect();
            const toolbar = document.querySelector('.albums-detail-toolbar').getBoundingClientRect();
            return close.top >= toolbar.top && close.bottom <= toolbar.bottom
                && close.right <= toolbar.right && close.left > toolbar.left;
        }));
        await tablet.locator('#mobileDetailsClose').click();
        await tablet.close();
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
