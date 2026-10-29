const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH || process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const [width, language] of [[1280, 'en'], [768, 'en'], [390, 'ru'], [320, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 680 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Family Tree' });
                window.pickerLinks = [];
                window.fileSession = openConnectedFilesModal({ projectId: 'p1', existingFileIds: ['af-letter-transcription'],
                    onSave: ids => { window.pickerLinks.push(...ids); return { ok: true }; } });
            }, language);
            const modal = page.locator('[data-resource-picker="files"]');
            assert.ok(await modal.evaluate(element =>
            {
                const bounds = element.getBoundingClientRect();
                const footer = element.querySelector('.modal-footer').getBoundingClientRect();
                return bounds.left >= 0 && bounds.right <= innerWidth + 1 && footer.bottom <= innerHeight + 1 && element.scrollWidth <= element.clientWidth;
            }));
            await modal.locator('[data-rp-scope="folder:pawford"]').click();
            await modal.locator('[data-rp-scope="folder:interviews"]').click();
            assert.equal(await modal.locator('[data-rp-check="af-letter-transcription"]').isChecked(), true);
            await modal.locator('[data-rp-search]').fill('letter');
            assert.equal(await modal.locator('[data-rp-check="af-letter-transcription"]').isChecked(), true);
            await modal.locator('[data-rp-search]').fill('');
            const id = await modal.locator('[data-rp-check]:not(:checked)').first().getAttribute('data-rp-check');
            await modal.locator(`[data-rp-check="${id}"]`).check();
            await modal.locator('[data-rp-scope="all"]').click();
            await modal.locator('[data-rp-scope="folder:documents"]').click();
            await modal.locator('[data-rp-scope="folder:opis3"]').click();
            await modal.locator('[data-rp-scope="folder:delo44"]').click();
            await modal.locator('[data-rp-check]').first().focus();
            await page.keyboard.press('Space');
            assert.equal(await modal.locator('[data-rp-check]:focus').count(), 1);
            assert.match(await modal.locator('.rp-selected').innerText(), /3/);
            await modal.locator('[data-rp-action="selected"]').click();
            assert.equal(await modal.locator('[data-rp-check]').count(), 3);
            await modal.locator('.rp-footer-actions [data-rp-action="results"]').click();
            await modal.locator('[data-rp-action="save"]').click();
            await modal.waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => window.pickerLinks.length), 3);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Connected files scoped browsing, selection, and responsive layout passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
