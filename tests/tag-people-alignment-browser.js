const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const width of [1340, 900, 390]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'load' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                const photo = getProjectPhotos('p1').find(item => item.personIds?.length);
                openPhotoPeopleModal(photo.id);
            });
            const modal = page.locator('.albums-tag-people-modal');
            await modal.waitFor();
            const search = await modal.locator('.photo-people-search-field').boundingBox();
            const results = await modal.locator('.photo-people-results-panel').boundingBox();
            const initialTagged = await modal.locator('.albums-unified-preview .albums-unified-person-row').count();
            assert.ok(search && results);
            assert.ok(results.y - (search.y + search.height) < 40, `${width}px: gap after search`);
            await modal.locator('[data-photo-people-choice]').first().click();
            const selected = await modal.locator('.albums-unified-preview').boundingBox();
            assert.ok(selected && selected.height > 40, `${width}px: tagged list is inaccessible`);
            assert.equal(await modal.locator('.albums-unified-preview .albums-unified-person-row').count(), initialTagged + 1);
            assert.equal(await modal.locator('.albums-unified-preview-stage [data-face-region-selector]').isVisible(), true);
            assert.deepEqual(errors, [], `${width}px browser errors`);
            await page.close();
        }
        console.log('Tag people sidebar sections stay aligned at desktop and mobile widths.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
