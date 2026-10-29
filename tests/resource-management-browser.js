const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    const output = path.join(os.tmpdir(), 'geneograph-resource-management');
    fs.mkdirSync(output, { recursive: true });
    try
    {
        for (const [width, height, language] of [[1280, 900, 'en'], [900, 760, 'ru'], [390, 720, 'en'], [320, 568, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Family Tree' });
            }, language);
            for (const kind of ['photos', 'files', 'notes', 'sources', 'places'])
            {
                await page.evaluate(kind =>
                {
                    if (kind === 'photos') window.manager = rpOpenPhotoLinkPicker({ projectId: 'p1', onSave: () => true });
                    if (kind === 'files') window.manager = openConnectedFilesModal({ projectId: 'p1', onSave: () => true });
                    if (kind === 'notes')
                    {
                        const template = sampleData.notes.find(note => note.projectId === 'p1');
                        sampleData.notes.push({ ...template, id: 'manager-archived-note', title: 'Archived fixture', archived: true, favorite: true });
                        window.manager = openNoteLinkPickerModal({ projectId: 'p1', includeArchived: true, onSave: () => true });
                    }
                    if (kind === 'sources') window.manager = openSourcesForTargetModal({ projectId: 'p1', draftSourceIds: [], onDraftSave: () => true });
                    if (kind === 'places') window.manager = openNotesPlacesModal({ noteId: sampleData.notes.find(note => note.projectId === 'p1').id });
                }, kind);
                const root = page.locator(`[data-resource-picker="${kind}"]`);
                await page.waitForFunction(() => document.activeElement?.matches('[data-rp-heading]'));
                assert.equal(await page.locator('.rp-sort [data-rp-sort]').count(), 1);
                await page.locator('.rp-sort-trigger').click();
                await page.locator('.rp-sort-menu [data-sort-value="updated"]').click();
                assert.equal(await page.locator('[data-rp-sort]').inputValue(), 'updated');
                await page.locator('.rp-sort-trigger').click();
                await page.locator('.rp-sort-menu [data-sort-value="name"]').click();
                const toolbarStyles = await page.locator('.rp-toolbar').evaluate(toolbar => [...toolbar.children].map(element =>
                {
                    const style = getComputedStyle(element);
                    return [style.backgroundColor, style.borderTopColor, style.borderRadius, element.getBoundingClientRect().height];
                }));
                toolbarStyles.forEach(style => assert.deepEqual(style, toolbarStyles[0], 'Toolbar surfaces and dimensions match'));
                if (kind === 'files')
                {
                    const geometry = () => page.locator('.rp-content').evaluate(element => element.getBoundingClientRect().top);
                    const initialTop = await geometry();
                    await page.locator('.rp-content [data-rp-scope^="folder:"]').first().click();
                    const breadcrumbCenters = await page.locator('.rp-path').evaluate(path => [...path.children].map(element =>
                    {
                        const rect = element.getBoundingClientRect();
                        return rect.top + rect.height / 2;
                    }));
                    assert.ok(Math.max(...breadcrumbCenters) - Math.min(...breadcrumbCenters) < 1, 'Breadcrumb items share a vertical center');
                    assert.equal(await geometry(), initialTop, 'Folder navigation keeps results position stable');
                    assert.equal(await page.locator('.rp-path').evaluate(element => element.getBoundingClientRect().height), 48);
                    await page.locator('.rp-path [data-rp-scope="all"]').click();
                    assert.equal(await geometry(), initialTop);
                    assert.ok(await page.locator('.rp-record-icon .archive-file-icon').count());
                }
                assert.ok(await root.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
                const before = await root.locator('[data-rp-check]').count();
                if (kind === 'photos')
                {
                    const photo = root.locator('.rp-thumbnail img').nth(2);
                    await photo.evaluate(image => image.decode());
                    assert.ok(await photo.evaluate(image =>
                    {
                        const bounds = image.getBoundingClientRect();
                        const frame = image.closest('.rp-thumbnail').getBoundingClientRect();
                        return bounds.bottom <= frame.bottom + 1 && bounds.height <= frame.height + 1 && getComputedStyle(image).objectFit === 'contain';
                    }));
                }
                if (kind === 'files')
                {
                    await root.locator('[data-rp-search]').fill(' ');
                    assert.equal(await root.locator('[data-rp-check]').count(), before);
                    await root.locator('[data-rp-search]').fill('');
                }
                await page.screenshot({ path: path.join(output, `${kind}-${width}-${language}.png`) });
                await root.locator('[data-rp-action="filters"]').click();
                const field = root.locator(`[data-rp-filter="${kind === 'places' ? 'coordinates' : 'favorite'}"]`);
                assert.ok(await field.evaluate(input =>
                {
                    const box = input.getBoundingClientRect();
                    const label = input.closest('label').getBoundingClientRect();
                    return box.width === 18 && box.height === 18 && label.height >= 44
                        && Math.abs(box.top + box.height / 2 - label.top - label.height / 2) < 1
                        && getComputedStyle(input).flexShrink === '0';
                }), `${kind}: fixed checkbox size and alignment at ${width}px`);
                if (kind === 'photos')
                {
                    assert.ok(await root.locator('[data-rp-filter="dateFrom"]').evaluate(input =>
                    {
                        const label = input.closest('label').querySelector('span').getBoundingClientRect();
                        const box = input.getBoundingClientRect();
                        return Math.abs(box.left - label.left) < 1 && box.top >= label.bottom + 7;
                    }));
                    await page.screenshot({ path: path.join(output, `filters-${width}-${language}.png`) });
                }
                await field.check();
                assert.equal(await page.evaluate(() => window.manager.filters.favorite || window.manager.filters.coordinates), true);
                assert.ok(await root.locator('[data-rp-check]').count() <= before);
                assert.ok(await root.locator('[data-rp-action="filters"]').evaluate(element => element.classList.contains('is-active')));
                if (kind === 'notes')
                {
                    await root.locator('[data-rp-filter="archived"]').check();
                    assert.equal(await root.locator('[data-rp-check="manager-archived-note"]').count(), 1);
                }
                if (['files', 'sources', 'photos'].includes(kind))
                {
                    await field.uncheck();
                    const key = kind === 'files' ? 'type' : kind === 'sources' ? 'provider' : 'person';
                    const option = kind === 'photos' ? await page.evaluate(() => getPhotoPeople(window.manager.adapter.records().find(photo => getPhotoPeople(photo).length))[0].id)
                        : await root.locator(`[data-rp-filter="${key}"] option`).nth(1).getAttribute('value');
                    await root.locator(`[data-rp-filter="${key}"]`).selectOption(option);
                    assert.equal(await page.evaluate(key => window.manager.filters[key], key), option);
                    assert.ok(await root.locator('[data-rp-check]').count() > 0, `${kind}: ${option}`);
                    assert.ok(await page.evaluate(({ key, option }) => [...document.querySelectorAll('[data-rp-check]')].every(input =>
                    {
                        const record = window.manager.adapter.records().find(record => record.id === input.dataset.rpCheck);
                        return key === 'type' ? archiveFileKind(record) === option : key === 'provider'
                            ? String(record.providedBy || '').trim() === option : getPhotoPeople(record).some(person => person.id === option);
                    }), { key, option }));
                }
                await root.locator('[data-rp-action="close-filters"]').click();
                assert.equal(await root.locator('.rp-filter-panel').count(), 0);
                if (kind === 'photos')
                {
                    await root.locator('[data-rp-action="filters"]').click();
                    await root.locator('[data-rp-filter="dateFrom"]').fill('2000-01-01');
                    await root.locator('[data-rp-filter="dateTo"]').fill('1900-01-01');
                    assert.ok(await root.locator('.rp-filter-error').isVisible());
                    await root.locator('[data-rp-action="reset-filters"]').click();
                    await root.locator('[data-rp-action="close-filters"]').click();
                }
                else
                {
                    await page.evaluate(() => { window.manager.filters = {}; window.manager.render(); });
                }
                await root.locator('[data-rp-action="browse"]').click();
                await root.locator('.rp-footer-actions [data-rp-action="close"]').click();
                assert.ok(await root.isVisible());
                assert.equal(await page.evaluate(() => window.manager.view), 'results');
                if (await root.locator('[data-rp-action^="preview:"]').count())
                {
                    await root.locator('[data-rp-action^="preview:"]').first().click();
                    if (kind === 'notes' || kind === 'sources')
                    {
                        await page.screenshot({ path: path.join(output, `${kind}-preview-${width}-${language}.png`) });
                        assert.equal(await root.locator(kind === 'notes' ? '.rp-note-preview' : '.rp-source-preview').count(), 1);
                    }
                    if (kind === 'photos') await page.screenshot({ path: path.join(output, `preview-${width}-${language}.png`) });
                    assert.equal(await root.locator('.rp-toolbar').isVisible(), false);
                    await root.locator('.rp-footer-actions [data-rp-action="close"]').click();
                    assert.equal(await page.evaluate(() => window.manager.view), 'results');
                    await root.locator('[data-rp-action^="preview:"]').first().click();
                    await root.locator('[data-rp-action="preview-transfer"]').click();
                    assert.ok(await root.locator('[data-rp-action="save"]').isEnabled());
                    await root.locator('.rp-footer-actions [data-rp-action="close"]').click();
                    await page.locator('.rp-discard-modal').waitFor();
                    await page.locator('[data-rp-discard]').click();
                }
                else
                {
                    if (kind === 'places') assert.equal(await root.locator('[data-rp-action^="preview:"]').count(), 0);
                    await root.locator('.rp-footer-actions [data-rp-action="close"]').click();
                }
            }
            await page.evaluate(() =>
            {
                window.manager = openNoteLinkPickerModal({ projectId: 'p1', onSave: () => true });
            });
            await page.locator('[data-rp-action="create"]').click();
            const title = page.locator('[data-rp-note-form] [name="title"]');
            assert.ok(await title.evaluate(element => element.getBoundingClientRect().width > element.closest('.modal-body').clientWidth * 0.8));
            await page.screenshot({ path: path.join(output, `note-${width}-${language}.png`) });
            await page.locator('[data-rp-note-form] [data-close]').first().click();
            await page.waitForFunction(() => document.activeElement?.matches('[data-rp-action="create"]'));
            await page.locator('[data-rp-action="create"]').click();
            await page.locator('[data-rp-note-form] [name="title"]').fill('Unsaved note fixture');
            await page.locator('[data-rp-note-form] [data-close]').first().click();
            await page.locator('.rp-discard-modal [data-close]').click();
            assert.equal(await page.locator('[data-rp-note-form] [name="title"]').inputValue(), 'Unsaved note fixture');
            await page.locator('[data-rp-note-form] [data-close]').first().click();
            await page.locator('[data-rp-discard]').click();
            assert.equal(await page.evaluate(() => sampleData.notes.some(note => note.title === 'Unsaved note fixture')), false);
            await page.evaluate(() => closeModal({ force: true }));
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Resource management filters, subviews, focus, forms and EN/RU responsive checks passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
