const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;
const viewports = [[1920, 900], [1600, 900], [1440, 720], [1280, 720], [900, 720], [640, 720]];

async function waitForStep(page, id)
{
    await page.waitForFunction(stepId => geneoTourSteps[geneoTourRuntime.index]?.id === stepId
        && !geneoTourRuntime.transitioning, id);
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
            for (const [width, height] of viewports)
            {
                const page = await browser.newPage({ viewport: { width, height } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
                await page.evaluate(() =>
                {
                    if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                    activateProject('p1', { moduleName: 'People' });
                    startGeneoProductTour();
                    geneoTourNavigate(geneoTourSteps.findIndex(step => step.id === 'people-profile-card'));
                });
                await waitForStep(page, 'people-profile-card');
                for (let pass = 0; pass < 2; pass += 1)
                {
                    await page.locator('[data-geneo-tour-action="next"]').click();
                    await waitForStep(page, 'people-connected');
                    await page.locator('[data-geneo-tour-action="back"]').click();
                    await waitForStep(page, 'people-profile-card');
                    const geometry = await page.evaluate(() =>
                    {
                        const root = geneoTourRuntime.root;
                        const target = document.querySelector('[data-profile-card-root]').getBoundingClientRect();
                        const focus = root.querySelector('[data-geneo-tour-block]').getBoundingClientRect();
                        const card = root.querySelector('.geneo-tour-card').getBoundingClientRect();
                        return {
                            unanchored: root.classList.contains('is-unanchored'),
                            hidden: root.querySelector('[data-geneo-tour-block]').hidden,
                            targetTop: target.top,
                            focus: focus.toJSON(),
                            card: card.toJSON(),
                            mainScroll: main.scrollTop,
                            pageScroll: document.scrollingElement.scrollTop
                        };
                    });
                    const label = `${width}x${height} ${language}, pass ${pass + 1}`;
                    assert.equal(geometry.unanchored || geometry.hidden, false, `${label}: missing focus`);
                    assert.ok(geometry.targetTop >= Math.max(80, height * .16) - 2,
                        `${label}: Profile card was not scrolled back into view`);
                    assert.ok(geometry.focus.height >= 250, `${label}: Profile focus is clipped`);
                    assert.equal(geometry.card.left < geometry.focus.right && geometry.card.right > geometry.focus.left
                        && geometry.card.top < geometry.focus.bottom && geometry.card.bottom > geometry.focus.top,
                    false, `${label}: tour card covers Profile details`);
                    assert.ok(width > 900 ? geometry.mainScroll > 0 : geometry.pageScroll > 0,
                        `${label}: the active scroll container did not move`);
                }
                assert.deepEqual(errors, [], `${width}x${height} ${language}: browser errors`);
                await page.close();
            }
        }
        console.log('People Profile details Next/Back scroll and focus passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
