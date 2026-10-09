const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;
const widths = [1920, 1760, 1600, 1440, 1366, 1281, 1280];

async function focusGeometry(page)
{
    return page.evaluate(() =>
    {
        const root = geneoTourRuntime.root;
        const bounds = element => element.getBoundingClientRect().toJSON();
        const blocks = [...root.querySelectorAll(
            '[data-geneo-tour-block], [data-geneo-tour-block-secondary], ' +
            '[data-geneo-tour-block-tertiary], [data-geneo-tour-block-quaternary]'
        )].filter(element => !element.hidden).map(bounds);
        return {
            unanchored: root.classList.contains('is-unanchored'),
            blocks,
            card: bounds(root.querySelector('.geneo-tour-card')),
            scrollTop: main.scrollTop
        };
    });
}

(async () =>
{
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try
    {
        for (const language of ['en', 'ru'])
        {
            for (const height of [720, 900])
            {
                for (const width of widths)
                {
                    const page = await browser.newPage({ viewport: { width, height } });
                    const errors = [];
                    page.on('pageerror', error => errors.push(error.message));
                    await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
                    await page.evaluate(() =>
                    {
                        if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                        activateProject('p1', { moduleName: 'People' });
                        main.scrollTop = 120;
                        startGeneoProductTour();
                        geneoTourNavigate(geneoTourSteps.findIndex(step => step.id === 'people-connected'));
                    });
                    await page.waitForFunction(() => geneoTourSteps[geneoTourRuntime.index]?.id === 'people-connected'
                        && !geneoTourRuntime.transitioning);
                    const geometry = await focusGeometry(page);
                    const label = `${width}x${height} ${language}`;
                    assert.equal(geometry.unanchored, false, `${label}: spotlight is missing`);
                    assert.equal(geometry.blocks.length, width <= 1280 ? 1 : 4,
                        `${label}: wrong number of related-record focus areas`);
                    for (const block of geometry.blocks)
                    {
                        assert.ok(block.width >= 80 && block.height >= 80,
                            `${label}: focus area is too small`);
                        assert.ok(block.top >= 8 && block.bottom <= height - 8,
                            `${label}: focus area is outside the viewport`);
                        assert.equal(geometry.card.left < block.right && geometry.card.right > block.left
                            && geometry.card.top < block.bottom && geometry.card.bottom > block.top, false,
                        `${label}: tour card covers related research`);
                    }
                    assert.ok(geometry.scrollTop > 0, `${label}: tour did not bring resources into view`);
                    assert.deepEqual(errors, [], `${label}: browser errors`);
                    await page.close();
                }
            }
        }
        const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const originScroll = await page.evaluate(() =>
        {
            if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'People' });
            state.peopleView = 'profile';
            state.peopleSide = 'profile';
            state.selectedPeopleId = 'silver';
            render();
            main.scrollTop = 120;
            const scrollTop = main.scrollTop;
            startGeneoProductTour();
            geneoTourNavigate(geneoTourSteps.findIndex(step => step.id === 'people-connected'));
            return scrollTop;
        });
        await page.waitForFunction(() => geneoTourSteps[geneoTourRuntime.index]?.id === 'people-connected'
            && !geneoTourRuntime.transitioning);
        assert.ok(originScroll > 0, 'pre-tour Profile scroll was not established');
        await page.setViewportSize({ width: 1440, height: 720 });
        await page.waitForFunction(() =>
        {
            const root = geneoTourRuntime.root;
            return root && !root.classList.contains('is-unanchored')
                && [...root.querySelectorAll('[data-geneo-tour-block], [data-geneo-tour-block-secondary], '
                    + '[data-geneo-tour-block-tertiary], [data-geneo-tour-block-quaternary]')]
                    .filter(block => !block.hidden).every(block => block.getBoundingClientRect().height >= 80);
        });
        const resized = await focusGeometry(page);
        assert.equal(resized.blocks.length, 4, 'resize lost the related-record focus areas');
        assert.equal(await page.evaluate(() => geneoTourRuntime.origin.scroll['.main'].y), originScroll,
            'resize changed the pre-tour scroll snapshot');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => geneoTourRuntime.active), false);
        await page.close();
        console.log('People related-research spotlight passed across desktop and compact widths.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
