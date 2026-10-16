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
            for (const module of ['Family Tree', 'People'])
            {
                const page = await browser.newPage({ viewport: { width, height } });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${url}?lang=${language}`);
                await page.evaluate(({ module, language }) =>
                {
                    geneoTourClose({ offerRestore: false });
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = module;
                    state.language = language;
                    render();
                    openMobileSurface('details');
                }, { module, language });

                await page.locator('#addRelative').click();
                assert.ok(await page.locator('#relativePopover').evaluate(sheet =>
                {
                    const rect = sheet.getBoundingClientRect();
                    const body = sheet.querySelector('.relative-popover-body');
                    body.scrollTop = body.scrollHeight;
                    return Math.abs(rect.top) < 1 && Math.abs(rect.height - innerHeight) < 1
                        && body.scrollTop + body.clientHeight >= body.scrollHeight - 1
                        && sheet.querySelector('[data-connect-existing]').getBoundingClientRect().bottom <= innerHeight + 1;
                }), `${module} ${width}px Add relative`);
                await page.locator('.mobile-choice-heading button').click();
                assert.equal(await page.evaluate(() => mobileSurface), 'details');

                for (const kind of ['files', 'notes', 'sources'])
                {
                    await page.evaluate(kind =>
                    {
                        document.querySelector('#addRelative').focus({ preventScroll: true });
                        const id = state.activeModule === 'People' ? state.selectedPeopleId : state.selectedPersonId;
                        if (kind === 'files') openPersonFilesModal(id);
                        if (kind === 'notes') openPersonNotesModal(id, state.activeModule === 'People' ? 'people' : 'tree');
                        if (kind === 'sources') openSourcesForTargetModal({ targetType: 'person', targetId: id });
                    }, kind);
                    const modal = page.locator('#modalBackdrop.open .modal');
                    assert.ok(await modal.isVisible());
                    await page.waitForFunction(() => document.activeElement?.classList.contains('close-button'));
                    assert.ok(await modal.evaluate(element =>
                    {
                        const rect = element.getBoundingClientRect();
                        const results = element.querySelector('.connected-files-results,.notes-related-results');
                        const footer = element.querySelector('.modal-footer,.notes-related-footer').getBoundingClientRect();
                        return rect.left >= 0 && rect.right <= innerWidth + 1
                            && rect.top >= 0 && rect.bottom <= innerHeight + 1
                            && results.clientHeight >= 70 && footer.bottom <= innerHeight + 1
                            && document.documentElement.scrollWidth <= innerWidth;
                    }), `${module} ${width}px ${kind} layout`);

                    const search = modal.locator('input[type="search"]').first();
                    if (kind === 'files')
                    {
                        await modal.locator('[data-connected-files-add-new]').click();
                        assert.ok(await page.locator('.archive-document-import').isVisible());
                        await page.locator('.archive-document-import [data-close]').first().click();
                        assert.ok(await modal.isVisible());
                    }
                    else
                    {
                        const choice = modal.locator(kind === 'notes'
                            ? '[data-note-picker-choice]:not(:disabled)'
                            : '[data-target-source-choice]:not(:disabled)').first();
                        await choice.click();
                        await page.waitForFunction(() => /\b1\b/.test(
                            document.querySelector('.notes-related-selection-count')?.textContent || ''));
                        assert.ok(await modal.locator('.notes-related-footer').isVisible());
                        assert.ok(await modal.locator(kind === 'notes'
                            ? '[data-note-picker-create]' : '[data-target-source-create]').isVisible());
                    }
                    await search.click();
                    assert.ok(await search.evaluate(input => document.activeElement === input));
                    await search.fill('family');
                    await page.keyboard.press('Escape');
                    assert.equal(await page.evaluate(() => mobileSurface), 'details');
                    await page.waitForFunction(() => document.activeElement?.id === 'addRelative');
                }
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(() => mobileSurface), null);
                if (module === 'Family Tree')
                {
                    await page.locator('.tree-person-card[data-person-id="silver"] [data-card-add="relative"]').click();
                    assert.ok(await page.locator('#relativePopover').evaluate(sheet =>
                    {
                        const rect = sheet.getBoundingClientRect();
                        const body = sheet.querySelector('.relative-popover-body');
                        body.scrollTop = body.scrollHeight;
                        return Math.abs(rect.top) < 1 && Math.abs(rect.height - innerHeight) < 1
                            && body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
                    }), `${width}px tree-card Add relative fills the viewport`);
                    await page.locator('#relativePopover .mobile-choice-heading button').click();
                    assert.equal(await page.locator('#relativePopover').count(), 0);
                }
                assert.deepEqual(errors, [], `${module} ${width}px console`);
                await page.close();
            }
        }

        const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await desktop.goto(url);
        await desktop.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            state.projectOpen = true;
            state.currentProjectId = 'p1';
            state.activeModule = 'Family Tree';
            render();
            openPersonNotesModal(state.selectedPersonId);
        });
        await desktop.waitForFunction(() => document.activeElement?.matches('[data-note-picker-search]'));
        await desktop.evaluate(() =>
        {
            closeModal();
            openPersonFilesModal(state.selectedPersonId);
        });
        await desktop.waitForFunction(() => document.activeElement?.matches('[data-connected-files-search]'));
        await desktop.evaluate(() =>
        {
            closeModal();
            openSourcesForTargetModal({ targetType: 'person', targetId: state.selectedPersonId });
        });
        await desktop.waitForFunction(() => document.activeElement?.matches('[data-target-source-search]'));
        await desktop.close();
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
