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
        for (const language of ['en', 'ru'])
        {
            const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            const recordsBefore = await page.evaluate(() => JSON.stringify(sampleData));
            for (const [id, preview] of [
                ['projects-hero', null],
                ['people-welcome', null],
                ['people-columns', 'people-columns'],
                ['tree-quick-edit-modal', 'modal']
            ])
            {
                await page.evaluate(() =>
                {
                    if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                    startGeneoProductTour();
                });
                await page.waitForFunction(() => geneoTourRuntime.index === -1 && !geneoTourRuntime.transitioning);
                await page.evaluate(stepId =>
                {
                    geneoTourNavigate(0);
                    const index = geneoTourSteps.findIndex(step => step.id === stepId);
                    window.resumeTestTargetIndex = index;
                }, id);
                await page.waitForFunction(() => geneoTourRuntime.index === 0 && !geneoTourRuntime.transitioning);
                await page.evaluate(() => geneoTourNavigate(window.resumeTestTargetIndex));
                await page.waitForFunction(stepId => geneoTourSteps[geneoTourRuntime.index]?.id === stepId
                    && !geneoTourRuntime.transitioning, id);
                assert.equal(await page.evaluate(() => geneoTourRuntime.ownedPreview), preview);
                const history = await page.evaluate(() => [...geneoTourRuntime.history]);
                const origin = await page.evaluate(() => JSON.stringify(geneoTourRuntime.origin));
                await page.locator('.geneo-tour-close').click();
                assert.equal(await page.evaluate(() => geneoTourRuntime.active), false);
                assert.equal(await page.locator('.toast-action').textContent(),
                    language === 'ru' ? 'Продолжить экскурсию' : 'Resume tour');
                await page.locator('.toast-action').click();
                await page.waitForFunction(stepId => geneoTourRuntime.active
                    && geneoTourSteps[geneoTourRuntime.index]?.id === stepId
                    && !geneoTourRuntime.transitioning, id);
                assert.deepEqual(await page.evaluate(() => geneoTourRuntime.history), history);
                assert.equal(await page.evaluate(() => JSON.stringify(geneoTourRuntime.origin)), origin);
                assert.equal(await page.evaluate(() => geneoTourRuntime.ownedPreview), preview);
                assert.equal(await page.locator('[data-geneo-tour-title]').textContent(),
                    await page.evaluate(stepId => t(geneoTourSteps.find(step => step.id === stepId).title), id));
                await page.locator('[data-geneo-tour-action="back"]').click();
                await page.waitForFunction(() => geneoTourRuntime.index === 0 && !geneoTourRuntime.transitioning);
                assert.equal(await page.evaluate(() => geneoTourRuntime.ownedPreview), null);
            }
            await page.locator('.geneo-tour-close').click();
            const staleAction = page.locator('.toast-action');
            await page.evaluate(() => startGeneoProductTour());
            await page.waitForFunction(() => geneoTourRuntime.index === -1 && !geneoTourRuntime.transitioning);
            await staleAction.evaluate(button => button.click());
            assert.equal(await page.evaluate(() => geneoTourRuntime.index), -1,
                'A stale toast changed the newer tour');
            await page.keyboard.press('Escape');
            await page.waitForFunction(() => !geneoTourRuntime.active);
            assert.equal(await page.locator('.toast-action').count(), 0,
                'Closing Welcome offered a resume action');
            assert.equal(await page.evaluate(() => JSON.stringify(sampleData)), recordsBefore);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Product tour resume checks passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
