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
        for (const [width, language] of [[320, 'en'], [390, 'ru'], [768, 'en'], [900, 'ru'], [1280, 'en']])
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
                state.placesView = 'review';
                state.language = language;
                render();
                localizeUI(main);
            }, language);

            const mobile = width <= 900;
            assert.equal(await page.locator('.places-review-mobile-issue').first().isVisible(), mobile);
            assert.equal(await page.locator('.places-review-list-head').isVisible(), !mobile);
            if (mobile)
            {
                assert.ok(await page.locator('.places-review-head').isVisible());
                assert.ok(await page.locator('.places-review-list-row').first().evaluate(row =>
                {
                    const name = row.querySelector('div:first-child strong').getBoundingClientRect();
                    const issue = row.querySelector('.places-review-mobile-issue').getBoundingClientRect();
                    const actions = row.querySelector('.places-review-mobile-issue .places-review-row-actions').getBoundingClientRect();
                    const search = document.querySelector('.places-review-controls').getBoundingClientRect();
                    return name.width > 80 && name.bottom < issue.top && issue.bottom <= actions.bottom
                        && search.height < 90 && document.documentElement.scrollWidth <= innerWidth;
                }), `${width}px ${language} review layout`);
            }

            await page.locator('#placesReviewSearch').fill('no matching review item');
            assert.ok(await page.locator('.places-review-empty').isVisible());
            await page.locator('#placesReviewSearch').fill('');
            assert.ok(await page.locator('.places-review-list-row').first().isVisible());
            const fix = mobile
                ? page.locator('.places-review-mobile-issue [data-place-review-fix]').first()
                : page.locator('.places-review-list-row > .places-review-row-actions [data-place-review-fix]').first();
            await fix.click();
            assert.ok(await page.locator('#modalBackdrop.open .modal').isVisible());
            await page.keyboard.press('Escape');

            const before = await page.locator('.places-review-list-row').count();
            const dismiss = mobile
                ? page.locator('.places-review-mobile-issue [data-place-review-dismiss]').first()
                : page.locator('.places-review-list-row > .places-review-row-actions [data-place-review-dismiss]').first();
            await dismiss.click();
            assert.equal(await page.locator('.places-review-list-row').count(), before - 1);
            assert.deepEqual(errors, [], `${width}px ${language} console`);
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
