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
            for (const width of [320, 390, 540, 768, 900, 1200])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
                await page.evaluate(() => activateProject('p1', { moduleName: 'Family Tree' }));
                const cases = [
                    ['Family Tree / People', 'person', 'silver'],
                    ['Albums', 'photo', 'photo-silver-portrait'],
                    ['Notes', 'note', await page.evaluate(() => getProjectNotes('p1')[0]?.id)],
                    ['Archive', 'file', await page.evaluate(() => sampleData.archiveFiles.find(file => file.projectId === 'p1')?.id)]
                ];
                for (const [module, targetType, targetId] of cases)
                {
                    assert.ok(targetId, `${module} fixture exists`);
                    await page.evaluate(({ targetType, targetId }) =>
                        openSourcesForTargetModal({
                            targetType, targetId,
                            subtitle: 'Connect existing sources to Sample checklist.'
                        }), { targetType, targetId });
                    const geometry = await page.evaluate(() =>
                    {
                        const toolbar = document.querySelector('.target-source-picker-modal .notes-related-toolbar');
                        const search = toolbar.querySelector('.app-search-field');
                        const button = toolbar.querySelector('[data-target-source-create]');
                        const rect = element => element.getBoundingClientRect().toJSON();
                        return {
                            toolbar: rect(toolbar), search: rect(search), button: rect(button),
                            label: button.getAttribute('aria-label'),
                            subtitle: document.querySelector('.target-source-picker-modal .modal-header p').textContent.trim(),
                            count: document.querySelector('[data-target-source-count]').textContent.trim(),
                            overflow: document.documentElement.scrollWidth > innerWidth
                        };
                    });
                    assert.equal(geometry.label, language === 'ru' ? 'Создать источник' : 'Create source');
                    assert.ok(Math.abs(geometry.search.top - geometry.button.top) < 3,
                        `${module} ${language} ${width}: search and create share a row`);
                    assert.ok(geometry.search.right + 4 <= geometry.button.left,
                        `${module} ${language} ${width}: controls do not overlap`);
                    assert.ok(geometry.button.left - geometry.search.right <= 20,
                        `${module} ${language} ${width}: controls have a compact gap`);
                    assert.equal(geometry.subtitle, language === 'ru'
                        ? 'Связать существующие источники с «Sample checklist».'
                        : 'Connect existing sources to Sample checklist.');
                    assert.equal(geometry.count, language === 'ru'
                        ? 'Выбрано источников: 0' : '0 sources selected');
                    assert.ok(geometry.button.right <= geometry.toolbar.right + 1,
                        `${module} ${language} ${width}: button stays in toolbar`);
                    assert.ok(!geometry.overflow, `${module} ${language} ${width}: no page overflow`);
                    if (module === 'Family Tree / People')
                    {
                        await page.locator('.target-source-picker-modal [data-target-source-choice]:not(:disabled)').first().click();
                        assert.equal(await page.locator('[data-target-source-count]').innerText(),
                            language === 'ru' ? 'Выбрано источников: 1' : '1 source selected');
                    }
                    await page.evaluate(() => closeModal());
                }
                await page.evaluate(() => openArchiveConnectionPicker({
                    ownerType: 'file', ownerIds: [sampleData.archiveFiles.find(file => file.projectId === 'p1').id], entityType: 'source'
                }));
                const bulk = await page.evaluate(() =>
                {
                    const toolbar = document.querySelector('.archive-link-picker-toolbar');
                    const search = toolbar.querySelector('.archive-link-picker-search').getBoundingClientRect();
                    const button = toolbar.querySelector('[data-archive-create-source-from-picker]').getBoundingClientRect();
                    const bounds = toolbar.getBoundingClientRect();
                    return { searchTop: search.top, buttonTop: button.top, gap: button.left - search.right,
                        buttonRight: button.right, toolbarRight: bounds.right };
                });
                assert.ok(Math.abs(bulk.searchTop - bulk.buttonTop) < 3,
                    `Archive bulk ${language} ${width}: search and create share a row`);
                assert.ok(bulk.gap >= 4 && bulk.buttonRight <= bulk.toolbarRight + 1,
                    `Archive bulk ${language} ${width}: controls fit`);
                assert.deepEqual(errors, [], `${language} ${width}: no browser errors`);
                await page.close();
            }
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Mobile Add source toolbars passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
