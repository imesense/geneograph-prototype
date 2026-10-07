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
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose();
                startGeneoProductTour();
            });
            for (const [id, sectionId] of [
                ['albums-connections', 'albums-detail-section-people'],
                ['albums-add-to-album-action', 'albums-detail-section-albums']
            ])
            {
                await page.evaluate(stepId => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === stepId)), id);
                await page.waitForFunction(stepId => geneoTourSteps[geneoTourRuntime.index]?.id === stepId
                    && !geneoTourRuntime.transitioning, id);
                const geometry = await page.evaluate(targetId =>
                {
                    const section = document.getElementById(targetId).closest('.panel-section');
                    const block = document.querySelector('[data-geneo-tour-block]');
                    const inspector = document.querySelector('.albums-detail');
                    return {
                        section: section.getBoundingClientRect().toJSON(),
                        block: block.getBoundingClientRect().toJSON(),
                        inspector: inspector.getBoundingClientRect().toJSON(),
                        hidden: block.hidden,
                        unanchored: geneoTourRuntime.root.classList.contains('is-unanchored')
                    };
                }, sectionId);
                assert.equal(geometry.hidden, false, `${language} ${id}: no spotlight`);
                assert.equal(geometry.unanchored, false, `${language} ${id}: unanchored card`);
                assert.ok(Math.abs(geometry.block.top - Math.max(geometry.section.top, geometry.inspector.top) + 8) < 2,
                    `${language} ${id}: spotlight does not begin at section`);
                assert.ok(geometry.block.bottom <= geometry.section.bottom + 9,
                    `${language} ${id}: spotlight extends beyond section`);
                if (geometry.section.bottom <= Math.min(geometry.inspector.bottom, 712))
                    assert.ok(Math.abs(geometry.block.bottom - geometry.section.bottom - 8) < 2,
                        `${language} ${id}: spotlight misses the end of the section`);
            }
            await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'albums-tag-person-modal')));
            await page.waitForFunction(() => !geneoTourRuntime.transitioning);
            const preview = await page.evaluate(() => ({
                owned: geneoTourRuntime.ownedPreview,
                inert: modalBackdrop.inert,
                photoVisible: Boolean(document.querySelector('.photo-people-modal [data-face-region-selector]')
                    ?.getBoundingClientRect().width),
                focusVisible: !document.querySelector('[data-geneo-tour-block]')?.hidden
            }));
            assert.equal(preview.owned, 'modal');
            assert.equal(preview.inert, true);
            assert.equal(preview.photoVisible, true);
            assert.equal(preview.focusVisible, true);
            await page.evaluate(() => geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'albums-add-to-album-action')));
            await page.waitForFunction(() => !geneoTourRuntime.transitioning);
            assert.equal(await page.locator('.photo-people-modal').count(), 0,
                `${language}: tour-owned tagging modal was not cleaned up`);
            assert.deepEqual(errors, [], `${language}: browser errors`);
            await page.close();
        }
        console.log('Albums section tour spotlights passed at 1280x720 in English and Russian.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
