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
        for (const [width, language] of [[1440, 'en'], [1280, 'ru'], [900, 'en'], [390, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                openPhotoLightbox('photo-silver-luna-wedding');
            });
            const lightbox = page.locator('.albums-lightbox-modal');
            await lightbox.waitFor();
            assert.equal(await lightbox.evaluate(modal => modal.scrollWidth > modal.clientWidth + 1), false,
                `${width}: lightbox overflows horizontally`);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await lightbox.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `photo-lightbox-${width}-${language}.png`) });
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 2);
            const image = lightbox.locator('.albums-lightbox-image');
            await image.evaluate(img => img.decode());
            const first = lightbox.locator('[data-lightbox-person]').first();
            await first.hover();
            const bounds = await lightbox.evaluate(modal => {
                const photo = modal.querySelector('.albums-lightbox-image').getBoundingClientRect();
                const box = modal.querySelector('[data-lightbox-face]').getBoundingClientRect();
                return { photo: photo.toJSON(), box: box.toJSON(), hidden: modal.querySelector('[data-lightbox-face]').hidden };
            });
            assert.equal(bounds.hidden, false);
            assert.ok(bounds.box.left >= bounds.photo.left && bounds.box.right <= bounds.photo.right + 1);
            assert.ok(bounds.box.top >= bounds.photo.top && bounds.box.bottom <= bounds.photo.bottom + 1);
            assert.ok(await lightbox.locator('[data-lightbox-face-name]').first().textContent());
            await first.focus();
            assert.equal(await lightbox.locator('[data-lightbox-face]:not([hidden])').count(), 2);
            assert.equal(await lightbox.locator('[data-lightbox-face]:not([hidden])').count(), 2);
            await lightbox.locator('[data-albums-show-marked]').uncheck();
            assert.equal(await lightbox.locator('[data-lightbox-face]:not([hidden])').count(), 0);
            await first.hover();
            assert.equal(await lightbox.locator('[data-lightbox-face]:not([hidden])').count(), 1);
            await lightbox.locator('.modal-header [data-close]').hover();
            assert.equal(await lightbox.locator('[data-lightbox-face]:not([hidden])').count(), 0);
            await lightbox.locator('[data-lightbox-tag]').click();
            assert.equal(await lightbox.locator('[data-albums-panel-tab="search"]').getAttribute('aria-selected'), 'true');
            assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-photo-people-search]')), false);
            await lightbox.locator('[data-photo-people-search]').fill('Pearl');
            await lightbox.locator('[data-photo-people-choice="pearl"]').click();
            assert.equal(await lightbox.locator('[data-albums-panel-tab="tagged"]').getAttribute('aria-selected'), 'true');
            await lightbox.locator('[data-photo-people-save]').click();
            assert.equal(await lightbox.count(), 1, `${width}: save did not return to preview`);
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 3);
            assert.ok(await lightbox.locator('.albums-unified-group').count() >= 2);
            await lightbox.locator('[data-lightbox-tag]').click();
            await lightbox.locator('[data-albums-panel-tab="tagged"]').click();
            await lightbox.locator('[data-photo-people-remove="pearl"]').click();
            await lightbox.locator('[data-albums-cancel-edit]').click();
            await page.locator('#albumsTagDiscardOverlay [data-albums-discard]').click();
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 3);
            await lightbox.locator('[data-lightbox-tag]').click();
            await lightbox.locator('[data-photo-people-search]').fill('');
            await lightbox.locator('[data-photo-people-choice]').first().click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#albumsTagDiscardOverlay').count(), 1);
            await page.locator('#albumsTagDiscardOverlay [data-albums-keep-editing]').click();
            assert.equal(await lightbox.locator('[data-photo-people-save]').isVisible(), true);
            await lightbox.locator('.modal-header [data-close]').click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#albumsTagDiscardOverlay').count(), 0);
            await lightbox.locator('.modal-header [data-close]').click();
            await page.locator('#albumsTagDiscardOverlay [data-albums-discard]').click();
            assert.equal(await lightbox.count(), 0);
            await page.evaluate(() => {
                const photo = getPhoto('photo-silver-luna-wedding');
                delete photo.personRegions.silver;
                openPhotoLightbox(photo.id);
            });
            await lightbox.locator('[data-lightbox-person="silver"]').hover();
            assert.equal(await lightbox.locator('[data-lightbox-face="silver"]').count(), 0,
                `${width}: regionless tag received a fabricated highlight`);
            await page.evaluate(() => openPhotoLightbox('photo-unidentified-studio'));
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 0);
            assert.equal(await lightbox.locator('[data-albums-show-marked]').isChecked(), false);
            assert.deepEqual(errors, [], `${width} ${language}: browser errors`);
            await page.close();
        }
        console.log('Albums unified photo preview and tagging passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
