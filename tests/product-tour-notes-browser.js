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
        for (const [width, height, language] of [
            [1280, 720, 'en'], [1280, 720, 'ru'], [1280, 600, 'en'],
            [1600, 900, 'en'], [600, 720, 'en']
        ])
        {
            const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose();
                startGeneoProductTour();
                geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'notes-add-events'));
            });
            await page.waitForFunction(() => geneoTourSteps[geneoTourRuntime.index]?.id === 'notes-add-events'
                && !geneoTourRuntime.transitioning);
            const view = await page.evaluate(() =>
            {
                const rect = selector => document.querySelector(selector)?.getBoundingClientRect().toJSON();
                return {
                    modal: rect('.notes-events-modal'),
                    focus: rect('[data-geneo-tour-block]'),
                    card: rect('.geneo-tour-card'),
                    search: rect('.notes-event-search-field'),
                    firstResult: rect('.notes-event-person-result'),
                    hidden: document.querySelector('[data-geneo-tour-block]').hidden,
                    unanchored: geneoTourRuntime.root.classList.contains('is-unanchored'),
                    owned: geneoTourRuntime.ownedPreview,
                    inert: modalBackdrop.inert
                };
            });
            assert.equal(view.owned, 'modal');
            assert.equal(view.inert, true);
            assert.equal(view.hidden, false, `${width}x${height} ${language}: spotlight missing ${JSON.stringify(view)}`);
            assert.equal(view.unanchored, false, `${width}x${height} ${language}: unanchored`);
            assert.ok(view.focus.left >= view.modal.left - 10 && view.focus.right <= view.modal.right + 10);
            assert.ok(view.focus.top >= view.modal.top - 10 && view.focus.bottom <= view.modal.bottom + 10);
            if (width > 640)
                assert.ok(view.focus.left <= view.search.left && view.focus.right >= view.search.right
                    && view.focus.top <= view.search.top && view.focus.bottom >= view.search.bottom,
                `${width}x${height} ${language}: search outside focus`);
            if (view.firstResult && width > 640)
                assert.ok(view.focus.bottom >= view.firstResult.bottom,
                    `${width}x${height} ${language}: first result outside focus`);
            if (width > 640)
                assert.ok(view.card.right <= view.focus.left || view.card.left >= view.focus.right
                    || view.card.bottom <= view.focus.top || view.card.top >= view.focus.bottom,
                `${width}x${height} ${language}: card covers spotlight`);
            await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'notes-to-places')));
            await page.waitForFunction(() => !geneoTourRuntime.transitioning);
            assert.equal(await page.locator('.notes-events-modal').count(), 0,
                `${width}x${height} ${language}: dialog persisted after Next`);
            if (width === 1280 && height === 720)
            {
                await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'notes-add-events')));
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                await page.locator('[data-geneo-tour-action="back"]').click();
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                assert.equal(await page.locator('.notes-events-modal').count(), 0,
                    `${language}: dialog persisted after Back`);
                await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'notes-add-events')));
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'places-welcome')));
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                assert.equal(await page.locator('.notes-events-modal').count(), 0,
                    `${language}: dialog persisted after chapter jump`);
                await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'notes-add-events')));
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('.notes-events-modal').count(), 0,
                    `${language}: dialog persisted after Escape`);
            }
            assert.deepEqual(errors, [], `${width}x${height} ${language}: browser errors`);
            await page.close();
        }
        console.log('Notes Link an event tour focus passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
