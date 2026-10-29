const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH || process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const language of ['en', 'ru']) for (const width of [320, 390, 540, 768, 900, 1200])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Family Tree' });
            }, language);
            const contexts = await page.evaluate(() => [
                ['person', 'silver'], ['photo', 'photo-silver-portrait'],
                ['note', getProjectNotes('p1')[0].id],
                ['file', sampleData.archiveFiles.find(file => file.projectId === 'p1').id]
            ]);
            for (const [targetType, targetId] of contexts)
            {
                await page.evaluate(({ targetType, targetId }) =>
                    openSourcesForTargetModal({ targetType, targetId }), { targetType, targetId });
                const modal = page.locator('[data-resource-picker="sources"]');
                assert.ok(await modal.isVisible());
                assert.ok(await modal.evaluate(element =>
                {
                    const toolbar = element.querySelector('.rp-toolbar').getBoundingClientRect();
                    const search = element.querySelector('.rp-search').getBoundingClientRect();
                    const create = element.querySelector('[data-rp-action="create"]').getBoundingClientRect();
                    const footer = element.querySelector('.modal-footer').getBoundingClientRect();
                    return search.left >= toolbar.left && search.right <= toolbar.right + 1
                        && create.right <= toolbar.right + 1 && footer.bottom <= innerHeight + 1
                        && element.scrollWidth <= element.clientWidth;
                }));
                await modal.locator('[data-rp-check]').first().click();
                assert.ok(await modal.locator('[data-rp-action="save"]').isEnabled());
                await modal.locator('[data-rp-action="close"]').first().click();
                await page.locator('[data-rp-discard]').click();
            }
            await page.evaluate(() => openArchiveConnectionPicker({
                ownerType: 'file', ownerIds: sampleData.archiveFiles.filter(file => file.projectId === 'p1').slice(0, 2).map(file => file.id), entityType: 'source'
            }));
            assert.ok(await page.locator('[data-resource-picker="sources"]').isVisible());
            await page.locator('[data-rp-check]').first().click();
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Source picker owner contexts and Archive bulk links passed at mobile/desktop widths in EN/RU');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
