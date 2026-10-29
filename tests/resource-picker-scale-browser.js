const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        const page = await browser.newPage();
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        for (const count of [1000, 10000])
        {
            await page.evaluate(count =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Notes' });
                const items = Array.from({ length: count }, (_, index) => ({ id: `fixture-${index}`, name: `Record ${index}`, group: index % 2 ? 'one' : 'two' }));
                window.scalePicker = openResourcePicker({ kind: 'notes', projectId: 'p1', records: () => items,
                    name: item => item.name, searchText: item => item.name, existingIds: ['fixture-1'],
                    scopes: () => [{ id: 'all', label: 'All records' }, { id: 'one', label: 'One' }],
                    matchesScope: (item, scope) => scope === 'all' || item.group === scope,
                    describe: item => ({ title: item.name }), preview: item => item.name, commit: () => true });
            }, count);
            assert.equal(await page.locator('[data-rp-check]').count(), 100);
            await page.locator('[data-rp-action="more"]').click();
            assert.equal(await page.locator('[data-rp-check]').count(), 200);
            await page.locator('[data-rp-search]').fill(`Record ${count - 1}`);
            assert.equal(await page.locator('[data-rp-check]').count(), 1);
            await page.locator('[data-rp-check]').check();
            await page.locator('[data-rp-search]').fill('Record 1');
            assert.equal(await page.locator('[data-rp-check="fixture-1"]').isChecked(), true);
            await page.locator('[data-rp-action="selected"]').click();
            assert.equal(await page.locator('[data-rp-check]').count(), 2);
            await page.evaluate(() => closeModal({ force: true }));
        }
        await page.evaluate(() =>
        {
            const template = getProjectPhotos('p1')[0];
            sampleData.media.push(...Array.from({ length: 10000 }, (_, index) => ({ ...template,
                id: `large-photo-${index}`, title: `Large photo fixture ${index}`, personIds: [] })));
            rpOpenPhotoLinkPicker({ projectId: 'p1', onSave: () => true });
        });
        assert.equal(await page.locator('[data-rp-check]').count(), 36);
        assert.ok(await page.locator('.rp-photo-grid img').count() <= 36);
        await page.locator('[data-rp-search]').fill('Large photo fixture 9999');
        assert.equal(await page.locator('[data-rp-check]').count(), 1);
        console.log('Resource picker 1,000/10,000 record search and bounded list/photo rendering passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
