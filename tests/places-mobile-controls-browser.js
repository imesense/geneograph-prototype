const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });

    try
    {
        for (const language of ['en', 'ru'])
        {
            for (const width of [320, 390, 621, 701, 768, 900])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`);
                await page.evaluate(language =>
                {
                    geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = 'Places';
                    state.placesView = 'all';
                    state.placesViewMode = 'map';
                    state.language = language;
                    render();
                    localizeUI(main);
                }, language);

                const layout = await page.evaluate(() =>
                {
                    const rect = selector => document.querySelector(selector).getBoundingClientRect();
                    const search = rect('.places-toolbar-left');
                    const filter = rect('#placesFilterButton');
                    const add = rect('#placesMobileAddPlace');
                    const map = rect('[data-places-mode="map"]');
                    const list = rect('[data-places-mode="list"]');
                    const route = rect('#placesRouteMenu');
                    return {
                        headingHidden: rect('.places-page-head').width <= 1,
                        firstRow: search.top === filter.top && filter.top === add.top
                            && search.right < filter.left && filter.right < add.left,
                        secondRow: map.top === list.top && list.top === route.top
                            && map.top > search.bottom && map.right < list.left && list.right < route.left,
                        equalSecondRow: Math.max(map.width, list.width, route.width)
                            - Math.min(map.width, list.width, route.width) < 2,
                        addFits: document.querySelector('#placesMobileAddPlace').scrollWidth
                            <= document.querySelector('#placesMobileAddPlace').clientWidth + 1
                            && document.querySelector('#placesMobileAddPlace svg').getBoundingClientRect().width >= 18,
                        overflow: document.documentElement.scrollWidth > innerWidth
                    };
                });
                assert.deepEqual(layout, {
                    headingHidden: true, firstRow: true, secondRow: true,
                    equalSecondRow: true, addFits: true, overflow: false
                }, `${width}px ${language} Map toolbar`);

                await page.locator('#placesFilterButton').click();
                assert.equal(await page.locator('#placesFilterButton').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                await page.locator('#placesMobileAddPlace').click();
                assert.ok(await page.locator('#modalBackdrop.open .modal').isVisible());
                await page.keyboard.press('Escape');
                await page.locator('#placesRouteMenu').click();
                assert.equal(await page.locator('#placesRouteMenu').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');

                await page.locator('[data-places-mode="list"]').click();
                assert.ok(await page.locator('#placesSort').isVisible());
                assert.ok(await page.locator('.places-list-row').first().evaluate(row =>
                {
                    const name = row.querySelector('strong');
                    const more = row.querySelector('.places-row-more');
                    const nameRect = name.getBoundingClientRect();
                    const moreRect = more.getBoundingClientRect();
                    return row.getBoundingClientRect().height < 115
                        && nameRect.right < moreRect.left
                        && document.documentElement.scrollWidth <= innerWidth;
                }), `${width}px ${language} list rows`);
                assert.equal(await page.locator('#placesRouteMenu').count(), 0);
                assert.ok(await page.locator('#placesSort').evaluate(sort =>
                {
                    const map = document.querySelector('[data-places-mode="map"]').getBoundingClientRect();
                    const list = document.querySelector('[data-places-mode="list"]').getBoundingClientRect();
                    const rect = sort.getBoundingClientRect();
                    return Math.abs(rect.top - map.top) < 1 && Math.abs(rect.width - map.width) < 2
                        && Math.abs(list.width - map.width) < 2;
                }));
                await page.locator('#placesSort').click();
                assert.equal(await page.locator('#placesSort').getAttribute('aria-expanded'), 'true');
                await page.keyboard.press('Escape');
                await page.locator('[data-places-mode="map"]').click();

                const trigger = page.locator('[data-mobile-details]');
                await trigger.click();
                assert.ok(await page.locator('#mobileDetailsClose').evaluate(close =>
                {
                    const toolbar = close.closest('.places-inspector-toolbar');
                    const rect = close.getBoundingClientRect();
                    const bounds = toolbar?.getBoundingClientRect();
                    return Boolean(toolbar) && getComputedStyle(close).position === 'static'
                        && getComputedStyle(toolbar).position === 'static'
                        && rect.right <= bounds.right && rect.top >= bounds.top;
                }));
                await page.evaluate(() => renderPlacesMain());
                assert.ok(await page.locator('.places-inspector-toolbar #mobileDetailsClose').isVisible());
                assert.ok(await page.locator('.places-inspector').evaluate(inspector =>
                {
                    const toolbar = inspector.querySelector('.places-inspector-toolbar');
                    const initialTop = toolbar.getBoundingClientRect().top;
                    inspector.scrollTop = 100;
                    const scrolled = inspector.scrollTop > 0 && toolbar.getBoundingClientRect().top < initialTop;
                    inspector.scrollTop = 0;
                    return scrolled;
                }));
                await page.locator('[data-places-inspector-edit]').click();
                assert.ok(await page.locator('#modalBackdrop.open .modal').isVisible());
                await page.keyboard.press('Escape');
                assert.ok(await page.locator('.places-inspector-toolbar #mobileDetailsClose').isVisible());
                await page.locator('#mobileDetailsClose').click();
                assert.equal(await page.evaluate(() => mobileSurface), null);
                assert.ok(await trigger.evaluate(button => document.activeElement === button));
                await page.evaluate(() =>
                {
                    state.placesSearch = 'no matching place in this project';
                    renderPlacesMain();
                    openMobileSurface('details');
                });
                assert.ok(await page.locator('.places-inspector-toolbar #mobileDetailsClose').isVisible());
                await page.locator('#mobileDetailsClose').click();
                assert.deepEqual(errors, []);
                await page.close();
            }
        }

        const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url);
        await page.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Places';
            state.placesView = 'all';
            state.placesViewMode = 'list';
            render();
        });
        assert.ok(await page.locator('.places-list-row').first().isVisible());
        assert.ok(await page.locator('.places-list-mobile-status').first().isVisible());
        assert.equal(await page.locator('.places-list-country').first().isVisible(), false);
        assert.ok(await page.locator('.places-list-row').first().evaluate(row =>
            row.getBoundingClientRect().height < 115 && document.documentElement.scrollWidth <= innerWidth));

        await page.locator('[data-mobile-sections]').click();
        await page.locator('#placesSavedFilterPlus').click();
        assert.equal(await page.evaluate(() => mobileSurface), 'sections');
        assert.ok(await page.locator('#modalBackdrop.open .places-saved-filter-modal').isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => mobileSurface), 'sections');
        await page.locator('[data-place-menu]').first().click();
        assert.ok(await page.locator('#projectMenu').isVisible());
        assert.equal(await page.evaluate(() => mobileSurface), 'sections');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => mobileSurface), 'sections');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => mobileSurface), null);

        await page.locator('[data-mobile-details]').click();
        await page.locator('.places-inspector-toolbar [data-place-menu]').click();
        assert.equal(await page.evaluate(() => mobileSurface), 'details');
        assert.ok(await page.locator('#projectMenu').isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => mobileSurface), 'details');
        await page.locator('[data-places-inspector-edit]').click();
        assert.ok(await page.locator('#modalBackdrop.open .modal').isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => mobileSurface), 'details');
        assert.ok(await page.locator('.places-inspector-tags').evaluate(tags =>
            getComputedStyle(tags).flexWrap === 'nowrap'
            && getComputedStyle(tags).overflowX === 'auto'));

        const hasLeaflet = await page.evaluate(() => Boolean(window.L));
        await page.locator('[data-places-edit-position]').click();
        assert.equal(await page.evaluate(() => mobileSurface), null);
        assert.equal(await page.evaluate(() => state.placesViewMode), 'map');
        if (hasLeaflet)
        {
            await page.waitForFunction(() => placesMapRuntime.mode === 'move');
            assert.ok(await page.locator('[data-places-coordinate-bar]').isVisible());
            await page.evaluate(() => cancelPlacesMapEditing());
        }
        else
        {
            assert.ok(await page.locator('#placesLeafletMap').count());
        }
        assert.deepEqual(errors, []);
        await page.close();
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
