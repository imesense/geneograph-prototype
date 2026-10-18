const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, height, language] of [[320, 568, 'en'], [390, 720, 'ru'], [768, 720, 'en'], [900, 720, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'People';
                state.language = language;
                render();
                openMobileSurface('details');
            }, language);
            await page.locator('#connectRelative').click();
            await page.waitForFunction(() => document.activeElement?.classList.contains('close-button'));
            const modal = page.locator('.connect-person-modal');
            assert.equal(await modal.locator('[data-connect-relationship]').inputValue(), '');
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);
            assert.equal(await modal.locator('[data-connect-create-new]').isDisabled(), true);
            assert.match(await modal.locator('.connect-person-results-title').innerText(), language === 'ru' ? /Люди в этом проекте/ : /People in this project/);
            assert.ok(await modal.evaluate(element =>
            {
                const box = element.getBoundingClientRect();
                const footer = element.querySelector('.connect-person-footer').getBoundingClientRect();
                const results = element.querySelector('.connect-person-results');
                const layout = element.querySelector('.connect-person-layout');
                return box.top >= 0 && box.bottom <= innerHeight + 1
                    && footer.bottom <= box.bottom && footer.top < footer.bottom
                    && getComputedStyle(layout).overflowY === 'auto'
                    && getComputedStyle(results).overflowY === 'visible'
                    && layout.scrollTop === 0;
            }), `${width}px modal bounds and single scroll`);
            await modal.locator('.connect-person-layout').evaluate(layout =>
            {
                layout.scrollTop = layout.scrollHeight;
            });
            assert.ok(await modal.locator('[data-connect-create-new]').evaluate(button =>
                button.getBoundingClientRect().bottom <= document.querySelector('.connect-person-footer').getBoundingClientRect().top + 1));
            await modal.locator('[data-connect-person-result]').first().click();
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);
            await modal.locator('[data-connect-relationship]').selectOption('parent');
            assert.equal(await modal.locator('[data-connect-create-new]').isEnabled(), true);
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);
            await modal.locator('[data-connect-person-result]').first().click();
            assert.equal(await modal.locator('#connectPersonConfirm').isEnabled(), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.evaluate(() => mobileSurface), 'details');
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
