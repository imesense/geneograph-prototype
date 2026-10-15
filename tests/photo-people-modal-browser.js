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
        for (const [width, height, language] of [[1280, 720, 'en'], [1280, 900, 'ru'], [900, 720, 'en'], [390, 720, 'en'], [320, 640, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url + '?lang=' + language, { waitUntil: 'load' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                openPhotoPeopleModal('photo-silver-luna-wedding');
            });
            const modal = page.locator('.photo-people-modal');
            await modal.waitFor();
            const layout = await modal.evaluate(element => {
                const box = selector => element.querySelector(selector).getBoundingClientRect().toJSON();
                return {
                    modal: element.getBoundingClientRect().toJSON(),
                    people: box('.photo-people-sidebar'),
                    photo: box('.photo-people-workspace'),
                    results: box('.photo-people-results'),
                    overflow: element.scrollWidth > element.clientWidth + 1
                };
            });
            assert.equal(layout.overflow, false, width + ': horizontal overflow');
            assert.equal(await modal.locator('[data-albums-panel-tab]').count(), 0);
            assert.equal(await modal.locator('.albums-unified-preview .albums-unified-person-row').count(), 2);
            assert.ok(await modal.locator('.photo-people-results .albums-unified-person-row').count() > 3);
            assert.equal(await modal.locator('.photo-people-results').evaluate(element => element.scrollWidth > element.clientWidth + 1), false);
            assert.equal(await modal.locator('.photo-people-results .albums-unified-person-copy small').first().textContent().then(value => /Pawford|North Yorkshire|Meowbridge/.test(value)), false);
            if (width <= 760) assert.ok(layout.people.top >= layout.photo.bottom - 1, width + ': photo should precede list');
            else assert.ok(layout.people.right <= layout.photo.left + 1, width + ': photo should be beside list');

            await modal.locator('[data-photo-people-search]').fill('Pearl');
            await modal.locator('[data-photo-people-choice="pearl"]').first().click();
            assert.equal(await modal.locator('.albums-unified-preview .albums-unified-person-row').count(), 3);
            assert.equal(await modal.locator('[data-photo-people-region="pearl"]').getAttribute('aria-pressed'), 'true');
            assert.equal(await modal.locator('[data-photo-people-search]').isVisible(), false);
            assert.equal(await modal.evaluate(element => element.scrollWidth > element.clientWidth + 1), false,
                width + ': tag mode overflows horizontally');
            const peopleOrder = await modal.evaluate(element => {
                const header = element.querySelector('.albums-lightbox-people-header').getBoundingClientRect();
                const toolbar = element.querySelector('.photo-people-region-heading').getBoundingClientRect();
                const photo = element.querySelector('.albums-unified-preview-stage').getBoundingClientRect();
                return { listVisible: header.height > 0, controlsBeforePhoto: toolbar.bottom <= photo.top + 1 };
            });
            assert.equal(peopleOrder.listVisible, true);
            assert.equal(peopleOrder.controlsBeforePhoto, true);
            await modal.locator('[data-photo-people-add-region]').click();
            assert.equal(await modal.locator('[data-face-region-box]').count(), 1);
            await modal.locator('[data-face-region-other][data-person-id="silver"]').hover();
            assert.equal(await modal.locator('[data-face-region-other][data-person-id="silver"].is-hovered').count(), 1);
            assert.equal(await modal.locator('[data-lightbox-person="silver"]').locator('..').getAttribute('class').then(value => value.includes('is-hovered')), true);
            await modal.locator('[data-lightbox-tag]').click();
            assert.equal(await modal.locator('[data-photo-people-search]').isVisible(), true);
            await modal.locator('[data-photo-people-search]').fill('Barnaby');
            await modal.locator('[data-photo-people-choice]').first().click();
            assert.equal(await modal.locator('.albums-unified-preview .albums-unified-person-row').count(), 4);
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.length), 4);
            await modal.locator('[data-close]').last().click();
            await page.evaluate(() => openPhotoPeopleModal('photo-silver-luna-wedding'));
            assert.equal(await modal.locator('.albums-unified-preview .albums-unified-person-row').count(), 4);
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.includes('pearl')), true);
            assert.equal(await modal.locator('[data-photo-people-save]').count(), 0);
            assert.deepEqual(errors, [], width + ' ' + language + ': browser errors');
            await page.close();
        }
        console.log('Tag people immediate selection and layout passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
