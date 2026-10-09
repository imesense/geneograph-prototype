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
            const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                const photo = getPhoto('photo-silver-luna-wedding');
                delete photo.personRegions.luna;
                state.selectedPhotoId = photo.id;
                render();
            });

            const menuButton = page.locator('[data-albums-photo-person-menu="luna"]');
            await page.locator('[data-albums-person-region="luna"]').hover();
            await menuButton.click();
            const selectFace = page.locator('[data-albums-person-action="select-face"]');
            assert.equal(await selectFace.textContent().then(text => text.trim()),
                language === 'ru' ? 'Выбрать лицо' : 'Select face');
            await selectFace.click();

            const modal = page.locator('.photo-people-modal');
            await modal.waitFor();
            assert.equal(await modal.locator('[data-photo-people-region="luna"]').getAttribute('aria-pressed'), 'true');
            assert.equal(await modal.locator('[data-photo-people-region="luna"]').evaluate(element => element === document.activeElement), true);
            assert.equal(await modal.locator('[data-photo-people-primary]').isChecked(), false);
            assert.equal(await modal.locator('[data-face-region-box]').count(), 0);
            await modal.locator('[data-close]').last().click();
            assert.equal(await page.evaluate(() => photoPersonRegion(getPhoto('photo-silver-luna-wedding'), 'luna')), null);

            await page.locator('[data-albums-person-region="luna"]').hover();
            await menuButton.click();
            await selectFace.click();
            await modal.locator('[data-photo-people-add-region]').click();
            await modal.locator('[data-photo-people-save]').click();
            const saved = await page.evaluate(() => ({
                region: photoPersonRegion(getPhoto('photo-silver-luna-wedding'), 'luna'),
                primary: getPerson('luna').primaryPhotoId
            }));
            assert.ok(saved.region);
            assert.notEqual(saved.primary, 'photo-silver-luna-wedding');
            await page.locator('[data-albums-person-region="luna"]').hover();
            assert.equal(await page.locator('[data-albums-face-highlight]')
                .evaluateAll(elements => elements.some(element => !element.hidden)), true);
            await menuButton.click();
            assert.equal(await page.locator('[data-albums-person-action="select-face"]').count(), 0);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Albums Select face menu and modal flow passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
