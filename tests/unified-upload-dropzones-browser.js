const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH });
    try {
        for (const width of [1280, 390, 320]) for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'file:///E:/Geneograph/Concept/geneograph-prototype/src/index.html');
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false); activateProject('p1', { moduleName: 'Albums' });
            }, language);
            let previousStyle;
            let photoModalWidth;
            for (const scope of ['albums', 'files', 'person', 'notes']) {
                await page.evaluate(scope => {
                    closeModal({ force: true });
                    if (scope === 'albums') openAddPhotosModal();
                    if (scope === 'files') openArchiveDocumentImport();
                    if (scope === 'person') { openAddPhotosToPersonModal('silver'); document.querySelector('[data-person-photos-adder-tab="upload"]')?.click(); }
                    if (scope === 'notes') {
                        state.selectedNoteId = sampleData.notes.find(note => note.projectId === 'p1' && !note.deleted).id;
                        openNotesPhotosModal(); document.querySelector('[data-notes-photos-adder-tab="upload"]')?.click();
                    }
                }, scope);
                const zone = page.locator('.modal-backdrop .upload-dropzone');
                await page.mouse.move(0, 0);
                await page.waitForTimeout(180);
                assert.equal(await zone.count(), 1, scope);
                assert.equal(await zone.locator('button').count(), 0);
                const modalWidth = await page.locator('.modal-backdrop > .modal').evaluate(element => element.getBoundingClientRect().width);
                if (scope === 'albums') photoModalWidth = modalWidth;
                if (scope === 'files') {
                    assert.equal(modalWidth, photoModalWidth);
                    assert.equal(await page.locator('.archive-document-import .modal-header .archive-document-import-notice').count(), 0);
                    assert.equal(await page.locator('.archive-document-import .modal-footer .archive-document-import-notice svg').count(), 1);
                    assert.equal(await page.locator('.archive-document-import-notice').innerText(), language === 'ru' ? 'Доступны до перезагрузки страницы' : 'Available until page reload');
                }
                const layout = await zone.evaluate(element => {
                    const icon = element.querySelector('.upload-dropzone-icon').getBoundingClientRect();
                    const text = element.querySelector('.upload-dropzone-copy').getBoundingClientRect();
                    const box = element.getBoundingClientRect(), style = getComputedStyle(element);
                    return { leftIcon: icon.right <= text.left && Math.abs(icon.top + icon.height / 2 - text.top - text.height / 2) < 1,
                        fits: box.left >= 0 && box.right <= innerWidth && element.scrollWidth <= element.clientWidth,
                        style: [style.minHeight, style.padding, style.borderRadius, style.backgroundColor, style.borderTopStyle] };
                });
                assert.equal(layout.leftIcon, true, `${scope}/${width}/${language}`);
                assert.equal(layout.fits, true);
                if (previousStyle) assert.deepEqual(layout.style, previousStyle);
                previousStyle = layout.style;
                for (const action of ['click', 'Enter', 'Space']) {
                    const chooser = page.waitForEvent('filechooser');
                    if (action === 'click') await zone.locator('strong').click();
                    else { await zone.focus(); await zone.press(action); }
                    await (await chooser).setFiles([]);
                }
                assert.equal(await zone.count(), 1);
                if (scope === 'albums' && width === 1280 && language === 'en') {
                    const chooser = page.waitForEvent('filechooser');
                    await zone.click();
                    await (await chooser).setFiles({ name: 'dropzone-test.png', mimeType: 'image/png',
                        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=', 'base64') });
                    await page.locator('[data-person-photos-adder-remove-upload]').waitFor();
                    assert.equal(await page.locator('.upload-dropzone button').count(), 0);
                }
                if (scope === 'files' && width === 1280 && language === 'en') {
                    const chooser = page.waitForEvent('filechooser');
                    await zone.click();
                    await (await chooser).setFiles({ name: 'dropzone-test.txt', mimeType: 'text/plain', buffer: Buffer.from('Upload verification') });
                    await page.locator('[data-import-rows] .success').waitFor();
                    assert.equal(await page.locator('.upload-dropzone button').count(), 0);
                }
            }
            assert.deepEqual(errors, []); await page.close();
        }
        console.log('Unified upload dropzones passed in English/Russian at desktop, 390 and 320px.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
