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
        for (const [width, language] of [[1440, 'en'], [900, 'en'], [390, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url + '?lang=' + language, { waitUntil: 'load' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                openPhotoLightbox('photo-silver-luna-wedding');
            });
            const modal = page.locator('.photo-people-modal');
            await modal.waitFor();
            assert.equal(await modal.locator('[data-lightbox-person]').count(), 2);
            assert.equal(await modal.locator('[data-photo-people-save]').count(), 0);
            assert.equal(await modal.evaluate(element => element.scrollWidth > element.clientWidth + 1), false);
            const photo = modal.locator('.albums-lightbox-image');
            await photo.evaluate(image => image.decode());
            assert.ok(await photo.evaluate(image => image.getBoundingClientRect().height > 100));
            await modal.locator('[data-albums-show-marked]').uncheck();
            assert.equal(await modal.locator('[data-lightbox-face]:not(.is-concealed)').count(), 0);
            await modal.locator('[data-lightbox-person="silver"]').hover();
            assert.equal(await modal.locator('[data-lightbox-face="silver"].is-active').count(), 1);
            await modal.locator('[data-lightbox-face="silver"]').hover();
            assert.equal(await modal.locator('[data-lightbox-person="silver"]').locator('..').getAttribute('class').then(value => value.includes('is-hovered')), true);

            await modal.locator('[data-lightbox-tag]').click();
            assert.equal(await modal.locator('[data-photo-people-search]').isVisible(), true);
            assert.equal(await modal.locator('[data-photo-people-results-meta]').count(), 0);
            assert.equal(await modal.locator('[data-albums-show-marked]').isVisible(), false);
            assert.ok(await modal.locator('.photo-people-results .albums-unified-person-row').count() > 3);
            assert.ok(await modal.locator('.albums-lightbox-image').isVisible());
            await page.keyboard.press('Escape');
            assert.equal(await modal.count(), 1);
            assert.equal(await modal.locator('[data-lightbox-tag]').isVisible(), true);

            await modal.locator('[data-lightbox-tag]').click();
            await modal.locator('[data-photo-people-search]').fill('Pearl');
            await modal.locator('[data-photo-people-choice="pearl"]').first().click();
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.includes('pearl')), true);
            assert.equal(await page.evaluate(() => Boolean(getPhoto('photo-silver-luna-wedding').personRegions?.pearl)), false);
            assert.equal(await modal.locator('[data-photo-people-region="pearl"]').getAttribute('aria-pressed'), 'true');
            assert.equal(await modal.locator('[data-photo-people-primary]').isDisabled(), true);
            assert.equal(await modal.locator('.albums-unified-preview-stage [data-face-region-selector]').count(), 1);

            await modal.locator('[data-photo-people-add-region]').click();
            assert.equal(await page.evaluate(() => Boolean(getPhoto('photo-silver-luna-wedding').personRegions?.pearl)), true);
            const before = await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personRegions.pearl.x);
            await modal.locator('[data-face-region-box]').focus();
            await page.keyboard.press('ArrowRight');
            assert.ok(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personRegions.pearl.x) > before);
            await modal.locator('[data-photo-people-primary]').check();
            assert.equal(await page.evaluate(() => getPerson('pearl').primaryPhotoId), 'photo-silver-luna-wedding');
            await modal.locator('[data-photo-people-primary]').uncheck();
            assert.notEqual(await page.evaluate(() => getPerson('pearl').primaryPhotoId), 'photo-silver-luna-wedding');
            await modal.locator('[data-photo-people-clear-region]').click();
            assert.equal(await page.evaluate(() => Boolean(getPhoto('photo-silver-luna-wedding').personRegions?.pearl)), false);

            const stage = modal.locator('.albums-unified-preview-stage [data-face-region-selector]');
            const bounds = await stage.boundingBox();
            await page.mouse.move(bounds.x + bounds.width * 0.76, bounds.y + bounds.height * 0.73);
            await page.mouse.down();
            await page.mouse.move(bounds.x + bounds.width * 0.9, bounds.y + bounds.height * 0.9, { steps: 5 });
            await page.mouse.up();
            assert.equal(await page.evaluate(() => Boolean(getPhoto('photo-silver-luna-wedding').personRegions?.pearl)), true);
            await modal.locator('.modal-header [data-close]').click();
            assert.equal(await modal.count(), 0);
            await page.evaluate(() => openPhotoLightbox('photo-silver-luna-wedding'));
            assert.equal(await modal.locator('[data-lightbox-person="pearl"]').count(), 1);
            assert.equal(await modal.locator('[data-lightbox-face="pearl"]').count(), 1);

            await modal.locator('[data-photo-people-remove="pearl"]').click();
            assert.equal(await page.locator('#photoPeoplePreviewRemovalOverlay').count(), 1);
            await page.locator('#photoPeoplePreviewRemovalOverlay [data-keep]').click();
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.includes('pearl')), true);
            await modal.locator('[data-photo-people-remove="pearl"]').click();
            await page.locator('#photoPeoplePreviewRemovalOverlay [data-remove]').click();
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.includes('pearl')), false);
            assert.deepEqual(errors, [], width + ' ' + language + ': browser errors');
            await page.close();
        }
        console.log('Albums immediate photo tagging and area editing passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
