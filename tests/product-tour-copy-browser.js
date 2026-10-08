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
        for (const width of [1280, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=en`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                startGeneoProductTour();
            });
            await page.waitForFunction(() => geneoTourRuntime.root && !geneoTourRuntime.transitioning);
            const results = await page.evaluate(() =>
            {
                const failures = [];
                for (const language of ['en', 'ru'])
                {
                    geneoTourRuntime.index = -1;
                    setLanguage(language);
                    const card = document.querySelector('.geneo-tour-card');
                    card.style.width = `min(280px, calc(100vw - 24px))`;
                    for (let index = -1; index <= geneoTourSteps.length; index += 1)
                    {
                        geneoTourRuntime.index = index;
                        geneoTourRefreshCopy();
                        const copy = geneoTourCardCopy();
                        const title = card.querySelector('[data-geneo-tour-title]');
                        const body = card.querySelector('[data-geneo-tour-body]');
                        if (title.textContent !== copy.title || body.textContent !== copy.body)
                            failures.push(`${language} ${index}: wrong copy`);
                        if (card.scrollWidth > card.clientWidth + 1)
                            failures.push(`${language} ${index}: horizontal card overflow`);
                        if (title.scrollWidth > title.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1)
                            failures.push(`${language} ${index}: clipped text`);
                    }
                }
                return { failures, count: geneoTourSteps.length + 2 };
            });
            assert.equal(results.count, 113);
            assert.deepEqual(results.failures, [], `${width}px copy/layout failures`);
            await page.evaluate(() =>
            {
                geneoTourRuntime.index = -1;
                setLanguage('en', false);
                geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'people-saved-filters'));
            });
            await page.waitForFunction(() => geneoTourSteps[geneoTourRuntime.index]?.id === 'people-saved-filters'
                && !geneoTourRuntime.transitioning);
            assert.equal(await page.locator('[data-geneo-tour-title]').textContent(), 'Open saved filters');
            await page.evaluate(() => setLanguage('ru'));
            await page.waitForFunction(() => document.querySelector('[data-geneo-tour-title]')?.textContent
                === RU_TOUR_CARD_COPY['people-saved-filters'].title);
            await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'places-saved-filters')));
            await page.waitForFunction(() => geneoTourSteps[geneoTourRuntime.index]?.id === 'places-saved-filters'
                && !geneoTourRuntime.transitioning);
            assert.equal(await page.locator('[data-geneo-tour-title]').textContent(),
                await page.evaluate(() => RU_TOUR_CARD_COPY['places-saved-filters'].title));
            assert.deepEqual(errors, [], `${width}px browser errors`);
            await page.close();
        }
        console.log('All tour card text renders in English and Russian at 1280px and 320px.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
