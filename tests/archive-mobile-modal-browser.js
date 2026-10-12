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
        for (const language of ['en', 'ru'])
        {
            for (const width of [320, 390, 900, 1100])
            {
                const page = await browser.newPage({ viewport: { width, height: 720 } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`);
                await page.evaluate(() =>
                {
                    geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = 'Archive';
                    state.archiveView = 'files';
                    state.archiveSelectedFolderId = 'delo44';
                    state.archiveSelectedFileId = 'af1';
                    render();
                    openMobileSurface('details');
                });

                for (const [trigger, search] of [
                    ['[data-archive-add-file-event]', '[data-notes-event-search]'],
                    ['[data-archive-add-file-note]', '[data-note-picker-search]'],
                    ['[data-archive-add-file-source]', '[data-target-source-search]']
                ])
                {
                    await page.locator(trigger).click();
                    await page.locator('#modalBackdrop.open .modal .close-button').waitFor();
                    await page.waitForTimeout(50);
                    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-close')));
                    assert.ok(await page.evaluate(() => Number(getComputedStyle(modalBackdrop).zIndex) > 1002));
                    assert.equal(await page.evaluate(() => mobileSurface), 'details');
                    if (await page.locator(search).isVisible())
                    {
                        await page.locator(search).click();
                        assert.ok(await page.locator(search).evaluate(input => document.activeElement === input));
                    }
                    await page.keyboard.press('Escape');
                    await page.locator('#modalBackdrop.open').waitFor({ state: 'hidden' });
                    assert.equal(await page.evaluate(() => mobileSurface), 'details');
                    await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), trigger);
                    assert.ok(await page.locator(trigger).evaluate(button => document.activeElement === button));
                }

                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), null);

                await page.evaluate(() =>
                {
                    state.archiveView = 'sources';
                    render();
                    openMobileSurface('details');
                });
                for (const type of ['event', 'note'])
                {
                    const trigger = page.locator(`[data-archive-add-connection="${type}"]`).first();
                    await trigger.click();
                    await page.locator('#modalBackdrop.open .modal .close-button').waitFor();
                    await page.waitForTimeout(50);
                    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-close')));
                    await page.locator('#modalBackdrop .close-button').click();
                    assert.equal(await page.evaluate(() => mobileSurface), 'details');
                }
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), null);

                await page.evaluate(() =>
                {
                    state.archiveView = 'files';
                    render();
                    openArchiveConnectionPicker({ ownerType: 'file', ownerIds: ['af1'], entityType: 'source' });
                });
                await page.waitForTimeout(50);
                assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-close')));
                await page.keyboard.press('Escape');

                if (width <= 900)
                {
                    await page.evaluate(() => openMobileSurface('sections'));
                    const createFolder = page.locator('.sidebar [data-archive-create-folder]');
                    await createFolder.click();
                    await page.locator('#modalBackdrop.open .modal').waitFor();
                    await page.locator('#modalBackdrop').click({ position: { x: 2, y: 2 } });
                    await page.locator('#modalBackdrop.open').waitFor({ state: 'hidden' });
                    assert.equal(await page.evaluate(() => mobileSurface), 'sections');
                    await page.waitForFunction(() => document.activeElement === document.querySelector('.sidebar [data-archive-create-folder]'));
                    assert.ok(await createFolder.evaluate(button => document.activeElement === button));
                    await page.keyboard.press('Escape');
                    assert.equal(await page.evaluate(() => mobileSurface), null);
                }

                assert.deepEqual(errors, []);
                await page.close();
            }
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
