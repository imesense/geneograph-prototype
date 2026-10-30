const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const language of ['en', 'ru']) for (const width of [1280, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('https://**/*', route => route.abort());
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            for (const moduleName of ['Archive', 'Albums'])
            {
                await page.evaluate(({ language, moduleName }) =>
                {
                    geneoTourClose({ offerRestore: false });
                    setLanguage(language, false);
                    activateProject('p1', { moduleName });
                    geneoTourClose({ offerRestore: false });
                    closeModal();
                    if (moduleName === 'Archive')
                    {
                        const file = sampleData.archiveFiles.find(item => item.projectId === 'p1' && archiveCanViewFile(item));
                        file.name = `A very long filename that must remain on one line even in a narrow inspector.${file.name.split('.').pop()}`;
                        state.archiveView = 'files';
                        state.archiveSelectedFileId = file.id;
                        state.archiveSelectedFolderId = file.folderId;
                        state.archiveInspectorCollapsed = false;
                        renderArchiveMain();
                    }
                    else
                    {
                        const photo = sampleData.media.find(item => item.projectId === 'p1');
                        photo.title = 'A very long photo title that must remain on one line even in a narrow inspector';
                        state.selectedPhotoId = photo.id;
                        state.albumsDetailCollapsed = false;
                        renderAlbums();
                    }
                    if (innerWidth <= 900) openMobileSurface('details');
                }, { language, moduleName });
                const root = page.locator(moduleName === 'Albums' ? '.albums-detail' : '.archive-inspector');
                const heading = root.locator('.inspector-name-heading h2');
                assert.equal(await heading.evaluate(element => getComputedStyle(element).whiteSpace), 'nowrap');
                assert.ok(await heading.getAttribute('title'));
                const open = root.locator(moduleName === 'Albums' ? '.albums-detail-open' : '.archive-file-open');
                assert.ok(await open.evaluate(element => element.classList.contains('secondary')));
                await page.evaluate(moduleName => moduleName === 'Albums' ? beginAlbumsPhotoEdit() : beginArchiveFileEdit(), moduleName);
                const form = root.locator(moduleName === 'Albums' ? '.albums-form-grid' : '.archive-file-form-grid');
                const label = form.locator(moduleName === 'Albums' ? 'label[for="albumPhotoCaption"]' : 'label[for="archiveFileDescription"]');
                assert.equal((await label.innerText()).trim(), language === 'ru' ? 'Сведения' : 'Details');
                assert.deepEqual(await label.evaluate(element => ({ size: getComputedStyle(element).fontSize, weight: getComputedStyle(element).fontWeight })), { size: '13px', weight: '700' });
                assert.equal(await form.evaluate(element => getComputedStyle(element).rowGap), '16px');
                const spacing = await form.evaluate(element =>
                {
                    const fields = [...element.children].filter(child => !child.classList.contains('details-edit-actions'));
                    return {
                        labelGaps: fields.map(field =>
                        {
                            const label = field.querySelector(':scope > label').getBoundingClientRect();
                            const control = field.querySelector(':scope > .genealogy-date-controls, :scope > .place-combobox-shell, :scope > textarea').getBoundingClientRect();
                            return control.top - label.bottom;
                        }),
                        fieldGaps: fields.slice(1).map((field, index) => field.getBoundingClientRect().top - fields[index].getBoundingClientRect().bottom),
                        dateBottomGap: fields[0].getBoundingClientRect().bottom - fields[0].querySelector('.genealogy-date-controls').getBoundingClientRect().bottom
                    };
                });
                assert.ok(spacing.labelGaps.every(gap => Math.abs(gap - 8) < 1), JSON.stringify({ moduleName, width, language, spacing }));
                assert.ok(spacing.fieldGaps.every(gap => Math.abs(gap - 16) < 1), JSON.stringify(spacing));
                assert.ok(Math.abs(spacing.dateBottomGap) < 1, 'empty date status reserves no space');
                assert.ok(await form.evaluate(element => element.scrollWidth <= element.clientWidth));
                if (process.env.GENEO_SCREENSHOT_DIR)
                    await root.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `inspector-${moduleName}-${language}-${width}.png`) });
                await page.evaluate(moduleName => moduleName === 'Albums' ? cancelAlbumsPhotoEdit() : cancelArchiveFileEdit(), moduleName);
                const discard = page.locator(moduleName === 'Albums' ? '[data-discard-photo-edit]' : '[data-discard-archive-file-edit]');
                if (await discard.count()) await discard.click();
                await page.evaluate(moduleName => moduleName === 'Albums' ? beginAlbumsPhotoRename() : beginArchiveFileRename(state.archiveSelectedFileId), moduleName);
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                assert.equal(await root.locator('.inspector-name-editor-footer').count(), 1);
                assert.ok(await root.locator('.inspector-name-editor').evaluate(element => element.scrollWidth <= element.clientWidth));
                await root.locator(moduleName === 'Albums' ? '#albumsPhotoNameInput' : '#archiveFileNameInput').press('Escape');
                assert.equal(await root.locator('.inspector-name-editor').count(), 0, `${moduleName} ${language} ${width}: ${JSON.stringify(await page.evaluate(() => ({ name: state.archiveFileNameEditingId, modal: modalBackdrop.innerText, input: document.querySelector('#archiveFileNameInput')?.value, original: state.archiveFileNameOriginal, module: state.activeModule })))} errors ${errors.join(';')}`);
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Media inspector layout passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
