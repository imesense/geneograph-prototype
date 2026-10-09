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
        for (const [width, language] of [[1440, 'en'], [1280, 'ru'], [390, 'en'], [320, 'ru']]) {
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
            assert.ok(await lightbox.locator('[data-lightbox-face-name]').textContent());
            await first.focus();
            assert.equal(await lightbox.locator('[data-lightbox-face]').isVisible(), true);
            await first.click();
            assert.equal(await lightbox.locator('[data-lightbox-face]').isVisible(), true,
                `${width}: clicking a person cleared the highlight`);
            await lightbox.locator('[data-lightbox-tag]').click();
            assert.equal(await page.locator('.photo-people-modal').count(), 1);
            await page.keyboard.press('Escape');
            assert.equal(await lightbox.count(), 1, `${width}: Escape did not return to preview`);
            await lightbox.locator('[data-lightbox-tag]').click();
            await page.locator('.photo-people-modal [data-close]').first().click();
            assert.equal(await lightbox.count(), 1, `${width}: close did not return to preview`);
            await lightbox.locator('[data-lightbox-tag]').click();
            await page.mouse.click(2, 2);
            assert.equal(await lightbox.count(), 1, `${width}: backdrop did not return to preview`);
            await lightbox.locator('[data-lightbox-tag]').click();
            await page.locator('.photo-people-modal [data-photo-people-choice]').first().click();
            await page.locator('.photo-people-modal [data-photo-people-save]').click();
            assert.equal(await lightbox.count(), 1, `${width}: save did not return to preview`);
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 3);
            await page.evaluate(() => {
                const photo = getPhoto('photo-silver-luna-wedding');
                delete photo.personRegions.silver;
                openPhotoLightbox(photo.id);
            });
            await lightbox.locator('[data-lightbox-person="silver"]').hover();
            assert.equal(await lightbox.locator('[data-lightbox-face]').isVisible(), false,
                `${width}: regionless tag received a fabricated highlight`);
            await page.evaluate(() => openPhotoLightbox('photo-unidentified-studio'));
            assert.equal(await lightbox.locator('[data-lightbox-person]').count(), 0);
            assert.deepEqual(errors, [], `${width} ${language}: browser errors`);
            await page.close();
        }
        console.log('Photo lightbox tagged people and nested tagging passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
