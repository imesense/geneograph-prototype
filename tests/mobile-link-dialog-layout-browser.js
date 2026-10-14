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
        for (const [width, height, language] of [[320, 480, 'en'], [320, 568, 'en'], [390, 720, 'ru'], [768, 720, 'en'], [900, 720, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`);
            const open = async (module, action) => page.evaluate(({ module, action, language }) =>
            {
                closeModal();
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = module;
                state.language = language;
                render();
                if (module === 'Notes') state.selectedNoteId = document.querySelector('[data-note-id]')?.dataset.noteId;
                eval(action);
            }, { module, action, language });
            const snapshot = async name =>
            {
                if (process.env.GENEO_SCREENSHOT_DIR && width === 390)
                    await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `mobile-dialog-${name}.png`) });
            };
            const fits = async selector => assert.ok(await page.locator(selector).evaluate(element =>
            {
                const modal = element.closest('.modal');
                const box = element.getBoundingClientRect();
                const footer = modal.querySelector('.modal-footer')?.getBoundingClientRect();
                return box.width > 0 && box.left >= -1 && box.right <= innerWidth + 1
                    && (!footer || footer.bottom <= innerHeight + 1)
                    && document.documentElement.scrollWidth <= innerWidth + 1;
            }), `${width}px ${selector} fits`);
            const sameRow = async (left, right) => assert.ok(await page.evaluate(({ left, right }) =>
            {
                const a = document.querySelector(left)?.getBoundingClientRect();
                const b = document.querySelector(right)?.getBoundingClientRect();
                return a && b && Math.abs(a.top - b.top) <= 4 && a.right + 4 <= b.left
                    && b.right <= innerWidth + 1;
            }, { left, right }), `${width}px ${left} and ${right} share a row`);

            for (const kind of ['partner', 'child'])
            {
                const relatedPersonId = kind === 'partner' ? 'luna' : 'oliver';
                await open('Family Tree', `openRelationshipEditModal({kind:'${kind}',personId:'silver',relatedPersonId:'${relatedPersonId}'})`);
                assert.ok(await page.locator('.relationship-edit-modal').isVisible());
                await fits('.relationship-edit-modal .modal-body');
                assert.ok(await page.locator('.relationship-edit-modal .add-person-select-field').first().evaluate(field =>
                {
                    const select = field.querySelector('select').getBoundingClientRect();
                    const chevron = field.querySelector('.add-person-select-chevron').getBoundingClientRect();
                    const bounds = field.getBoundingClientRect();
                    return bounds.height < 120 && chevron.top >= select.top
                        && chevron.bottom <= select.bottom;
                }), `${width}px edit selector stays compact and aligned`);
                await snapshot(`edit-${kind}`);
                await page.keyboard.press('Escape');
                await open('Family Tree', `openUnlinkRelationshipModal({kind:'${kind}',personId:'silver',relatedPersonId:'${relatedPersonId}'})`);
                assert.ok(await page.locator('.unlink-relationship-modal').isVisible());
                await fits('.unlink-relationship-modal .modal-body');
                assert.ok(await page.locator('.unlink-relationship-warning').evaluate(warning =>
                    warning.getBoundingClientRect().height < 240),
                `${width}px unlink warning stays content-sized`);
                if (kind === 'partner') assert.ok(await page.locator('.unlink-relationship-children').isVisible());
                await snapshot(`remove-${kind}`);
                await page.keyboard.press('Escape');
            }

            await open('People', "openAddPhotosToPersonModal('silver')");
            await page.locator('[data-person-photos-adder-tab="upload"]').click();
            await snapshot('upload-photos');
            await fits('.person-photos-adder-modal .person-photos-adder-body');
            assert.ok(await page.locator('.person-photo-picker-tabs').evaluate(tabs =>
            {
                const a = tabs.children[0].getBoundingClientRect();
                const b = tabs.children[1].getBoundingClientRect();
                return Math.abs(a.top - b.top) <= 1 && a.height <= 50 && b.height <= 50;
            }));
            await page.locator('[data-person-photos-adder-file]').setInputFiles(
                path.resolve(__dirname, '../src/assets/silver-portrait.jpg'));
            await page.locator('.person-photos-adder-upload-card').first().waitFor();
            await fits('.person-photos-adder-modal .person-photos-adder-body');
            assert.ok(await page.locator('.person-photo-picker-tabs').evaluate(tabs =>
                [...tabs.children].every(tab => tab.getBoundingClientRect().height <= 50)));
            await page.keyboard.press('Escape');

            await open('Archive', "openArchiveFilesPeopleModal(['af1'])");
            assert.ok(await page.locator('.notes-people-modal').isVisible());
            await fits('.notes-people-modal .photo-people-body');
            await snapshot('archive-people');
            assert.ok(await page.locator('.notes-people-modal .photo-people-result').first().evaluate(row =>
                row.getBoundingClientRect().height <= 80));
            await page.keyboard.press('Escape');

            await open('Notes', 'openNotesPeopleModal()');
            assert.ok(await page.locator('.notes-people-modal').isVisible());
            await fits('.notes-people-modal .photo-people-body');
            if (width === 390) assert.ok(await page.locator('.notes-people-modal .photo-people-selected-list')
                .evaluate(list => list.clientHeight >= list.scrollHeight - 1),
            'Two linked people should be fully visible above suggestions');
            await snapshot('notes-people');
            await page.keyboard.press('Escape');

            await open('Notes', 'openNotesPlacesModal()');
            await sameRow('.notes-place-search-toolbar .search-input', '[data-notes-place-create]');
            await snapshot('notes-places');
            assert.ok(await page.locator('.notes-place-search-label').evaluate(label =>
                getComputedStyle(label).position === 'absolute'));
            await page.keyboard.press('Escape');

            await open('People', "openPersonNotesModal('silver', 'people')");
            await sameRow('.note-link-picker-modal .app-search-field', '[data-note-picker-create]');
            await fits('.note-link-picker-modal .notes-related-modal-body');
            await snapshot('add-note');
            await page.keyboard.press('Escape');

            await open('Notes', 'openNotesRelatedModal()');
            await sameRow('.note-link-picker-modal .app-search-field', '.notes-related-archived-toggle');
            await fits('.note-link-picker-modal .notes-related-modal-body');
            await snapshot('related-note');
            await page.keyboard.press('Escape');
            assert.deepEqual(errors, [], `${width}px console`);
            await page.close();
        }
        for (const width of [1280, 1920])
        {
            const desktop = await browser.newPage({ viewport: { width, height: 800 } });
            await desktop.goto(url);
            for (const [module, action, selector] of [
                ['Archive', "openArchiveFilesPeopleModal(['af1'])", '.notes-people-modal'],
                ['Notes', 'openNotesPeopleModal()', '.notes-people-modal'],
                ['Notes', 'openNotesPlacesModal()', '.notes-places-modal']
            ])
            {
                await desktop.evaluate(({ module, action }) =>
                {
                    closeModal();
                    state.projectOpen = true;
                    state.currentProjectId = 'p1';
                    state.activeModule = module;
                    render();
                    if (module === 'Notes') state.selectedNoteId = document.querySelector('[data-note-id]')?.dataset.noteId;
                    eval(action);
                }, { module, action });
                assert.ok(await desktop.locator(selector).evaluate(modal =>
                {
                    const box = modal.getBoundingClientRect();
                    const search = modal.querySelector('.photo-people-search-field').getBoundingClientRect();
                    const results = modal.querySelector('.photo-people-results-panel').getBoundingClientRect();
                    const footer = modal.querySelector('.modal-footer').getBoundingClientRect();
                    const selected = modal.querySelector('.photo-people-selected-panel');
                    const wasHidden = selected.hidden;
                    selected.hidden = true;
                    const hiddenPanelCollapsed = getComputedStyle(selected).display === 'none';
                    selected.hidden = wasHidden;
                    return box.width <= 760 && box.left > 0 && box.right < innerWidth
                        && results.width >= search.width - 2 && Math.abs(results.left - search.left) <= 2
                        && results.top >= search.bottom && results.height > 100
                        && footer.bottom <= innerHeight + 1 && hiddenPanelCollapsed;
                }), `${width}px ${module} picker uses one full-width column`);
                if (selector === '.notes-places-modal')
                {
                    assert.ok(await desktop.locator('.notes-place-new-full').isVisible());
                    assert.equal(await desktop.locator('.notes-place-new-short').isVisible(), false);
                }
            }
            await desktop.close();
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
