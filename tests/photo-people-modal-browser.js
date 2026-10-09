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
        for (const [width, language] of [[1280, 'en'], [1280, 'ru'], [390, 'en'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Albums' });
                openPhotoPeopleModal('photo-silver-luna-wedding');
            });
            const modal = page.locator('.photo-people-modal');
            await modal.waitFor();
            const initial = await modal.evaluate(element =>
            {
                const rect = selector => element.querySelector(selector).getBoundingClientRect();
                const modalRect = element.getBoundingClientRect();
                return {
                    modal: modalRect.toJSON(),
                    people: rect('.photo-people-sidebar').toJSON(),
                    photo: rect('.photo-people-workspace').toJSON(),
                    stage: rect('[data-face-region-selector]').toJSON(),
                    selected: element.querySelectorAll('[data-photo-people-region]').length,
                    suggestionHeight: rect('.photo-people-result').height,
                    overflow: element.scrollWidth > element.clientWidth + 1
                };
            });
            assert.equal(initial.selected, 2, `${width} ${language}: sample tags missing`);
            assert.equal(await modal.locator('[data-face-region-other]').count(), 1,
                `${width} ${language}: existing sample regions not shown`);
            assert.ok(initial.stage.width > 0 && initial.stage.height > 0, `${width}: photo hidden`);
            assert.ok(initial.suggestionHeight <= 56, `${width}: suggestions are not compact`);
            assert.equal(initial.overflow, false, `${width}: modal overflows horizontally`);
            if (width > 760) assert.ok(initial.people.right <= initial.photo.left, `${width}: photo not on right`);
            else assert.ok(initial.people.bottom <= initial.photo.top, `${width}: mobile photo not below people`);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `tag-people-${width}-${language}.png`) });

            await modal.locator('[data-photo-people-choice]').first().click();
            assert.equal(await modal.locator('[data-photo-people-region]').count(), 3);
            const firstAddedId = await modal.locator('[data-photo-people-region][aria-pressed="true"]')
                .getAttribute('data-photo-people-region');
            await modal.locator('[data-photo-people-add-region]').click();
            assert.equal(await modal.locator('[data-face-region-box]').count(), 1);
            await modal.locator('[data-face-region-box]').focus();
            await page.keyboard.press('ArrowRight');
            const firstRegion = await modal.locator('[data-face-region-box]').evaluate(box =>
                [box.style.left, box.style.top, box.style.width, box.style.height]);
            await modal.locator('[data-photo-people-choice]').first().click();
            const secondAddedId = await modal.locator('[data-photo-people-region][aria-pressed="true"]')
                .getAttribute('data-photo-people-region');
            assert.notEqual(secondAddedId, firstAddedId);
            await modal.locator('[data-photo-people-add-region]').click();
            await modal.locator('[data-photo-people-region="silver"]').click();
            assert.equal(await modal.locator('[data-photo-people-region]').count(), 4);
            assert.equal(await modal.locator('[data-face-region-other]').count(), 3);
            assert.ok(await modal.locator('[data-face-region-selector]').isVisible());
            await modal.locator(`[data-photo-people-region="${firstAddedId}"]`).click();
            assert.deepEqual(await modal.locator('[data-face-region-box]').evaluate(box =>
                [box.style.left, box.style.top, box.style.width, box.style.height]), firstRegion);
            await modal.locator('[data-close]').last().click();
            assert.equal(await page.evaluate(() => getPhoto('photo-silver-luna-wedding').personIds.length), 2,
                `${width}: Cancel changed photo tags`);
            await page.evaluate(() => openPhotoPeopleModal('photo-silver-luna-wedding'));
            await modal.locator('[data-photo-people-remove]').first().click();
            await modal.locator('[data-photo-people-remove]').first().click();
            assert.equal(await modal.locator('[data-photo-people-region]').count(), 0);
            assert.ok(await modal.locator('[data-face-region-selector]').isVisible(),
                `${width}: photo disappears when no person is selected`);
            await modal.locator('[data-close]').last().click();
            await page.evaluate(() => openPhotoPeopleModal('photo-silver-luna-wedding'));
            await modal.locator(`[data-photo-people-choice="${firstAddedId}"]`).click();
            assert.equal(await modal.locator('[data-photo-people-primary]').isChecked(), false);
            await modal.locator('[data-photo-people-primary]').check();
            await modal.locator('[data-photo-people-save]').click();
            assert.equal(await modal.locator('[data-photo-people-region-error]').isVisible(), true,
                `${width}: profile photo accepted without an area`);
            await modal.locator('[data-photo-people-add-region]').click();
            await modal.locator('[data-photo-people-save]').click();
            const saved = await page.evaluate(personId =>
            {
                const photo = getPhoto('photo-silver-luna-wedding');
                return { tagged: photo.personIds.includes(personId), region: photo.personRegions?.[personId],
                    primary: getPerson(personId)?.primaryPhotoId };
            }, firstAddedId);
            assert.equal(saved.tagged, true, `${width}: selected person was not saved`);
            assert.ok(saved.region, `${width}: selected area was not saved`);
            assert.equal(saved.primary, 'photo-silver-luna-wedding');
            assert.deepEqual(errors, [], `${width} ${language}: browser errors`);
            await page.close();
        }
        console.log('Tag people modal layout and multi-person selection passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
