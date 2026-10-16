const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = process.env.GENEO_TEST_URL || pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [768, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 680 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url);
            await page.evaluate(language => {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Family Tree' });
                render();
                window.__pickerLinks = [];
                window.__openPicker = () => openConnectedFilesModal({
                    projectId: 'p1', existingFileIds: ['af-letter-transcription'],
                    onSave: ids => { window.__pickerLinks.push(...ids); return { ok: true }; },
                    autoFocusSearch: false,
                });
                window.__openPicker();
            }, language);
            const modal = page.locator('.connected-files-modal');
            assert.ok(await modal.isVisible());
            assert.ok(await modal.evaluate(element => {
                const toolbar = element.querySelector('.connected-files-toolbar').getBoundingClientRect();
                const search = element.querySelector('.connected-files-search').getBoundingClientRect();
                const add = element.querySelector('[data-connected-files-add-new]').getBoundingClientRect();
                const footer = element.querySelector('.modal-footer').getBoundingClientRect();
                return toolbar.left >= 0 && toolbar.right <= innerWidth + 1
                    && search.right <= add.left && Math.abs(search.top - add.top) < 5
                    && footer.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth;
            }), `${width}px picker layout`);
            await modal.locator('[data-connected-files-open-folder="pawford"]').click();
            await modal.locator('[data-connected-files-open-folder="interviews"]').click();
            if (process.env.GENEO_CAPTURE) await page.screenshot({ path: path.join(os.tmpdir(), `connected-files-browse-${width}.png`) });
            assert.ok(await modal.locator('[data-connected-files-choice][value="af-letter-transcription"]').isDisabled());
            await modal.locator('[data-connected-files-choice]:not(:disabled)').first().check();
            await modal.locator('[data-connected-files-folder-path=""]').click();
            await modal.locator('[data-connected-files-open-folder="documents"]').click();
            await modal.locator('[data-connected-files-open-folder="opis3"]').click();
            await modal.locator('[data-connected-files-open-folder="delo44"]').click();
            await modal.locator('[data-connected-files-choice]:not(:disabled)').first().focus();
            await page.keyboard.press('Space');
            assert.ok(await modal.locator('[data-connected-files-choice]:focus').count() === 1);
            assert.equal(await modal.locator('[data-connected-files-choice]:checked').count(), 1);
            assert.ok((await modal.locator('[data-connected-files-count]').innerText()).includes('2'));
            await modal.locator('[data-connected-files-search]').fill('Correspondence');
            assert.ok(await modal.locator('[data-connected-files-choice]').count() > 0);
            assert.ok((await modal.locator('[data-connected-files-count]').innerText()).includes('2'));
            await modal.locator('[data-connected-files-save]').click();
            assert.equal(await page.evaluate(() => window.__pickerLinks.length), 2);
            assert.equal(await modal.count(), 0);

            await page.evaluate(() => window.__openPicker());
            await modal.locator('[data-connected-files-open-folder="pawford"]').click();
            await modal.locator('[data-connected-files-open-folder="fond12"]').click();
            await modal.locator('[data-connected-files-search]').fill('Correspondence');
            await modal.locator('[data-connected-files-add-new]').click();
            const upload = page.locator('.archive-document-import');
            const destinationName = await page.evaluate(() => archiveFolderById('fond12', 'p1').name);
            assert.ok((await upload.locator('.modal-header').innerText()).includes(destinationName));
            await upload.locator('[data-document-input]').setInputFiles([
                { name: 'picker-upload.txt', mimeType: 'text/plain', buffer: Buffer.from('Sample record') },
                { name: 'bad.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('bad') },
            ]);
            await page.waitForFunction(() => sampleData.archiveFiles.some(file => file.name === 'picker-upload.txt'));
            assert.equal(await page.evaluate(() => sampleData.archiveFiles.find(file => file.name === 'picker-upload.txt').folderId), 'fond12');
            assert.ok((await upload.locator('[data-import-results]').innerText()).includes('bad.mp3'));
            await upload.locator('[data-close]').first().click();
            assert.ok(await modal.isVisible());
            assert.equal(await modal.locator('[data-connected-files-search]').inputValue(), 'Correspondence');
            await modal.locator('[data-connected-files-search]').fill('picker-upload');
            assert.ok(await modal.locator('.connected-files-choice.is-existing').count());
            await modal.locator('.connected-files-footer [data-close]').click();

            await page.evaluate(() => openPersonFilesModal('silver'));
            await modal.locator('[data-connected-files-open-folder="pawford"]').click();
            await modal.locator('[data-connected-files-open-folder="interviews"]').click();
            await modal.locator('[data-connected-files-add-new]').click();
            await upload.locator('[data-document-input]').setInputFiles({ name: 'tree-upload.txt', mimeType: 'text/plain', buffer: Buffer.from('Family Tree record') });
            await page.waitForFunction(() => sampleData.archiveFiles.some(file => file.name === 'tree-upload.txt'));
            assert.deepEqual(await page.evaluate(() => {
                const file = sampleData.archiveFiles.find(item => item.name === 'tree-upload.txt');
                return { folderId: file.folderId, linked: file.linkedPersonIds.includes('silver') };
            }), { folderId: 'interviews', linked: true });
            await upload.locator('[data-close]').first().click();
            await modal.locator('.connected-files-footer [data-close]').click();
            await page.evaluate(() => openConnectedFilesModal({
                projectId: 'p1', onSave: () => false, autoFocusSearch: false,
            }));
            await modal.locator('[data-connected-files-add-new]').click();
            await upload.locator('[data-document-input]').setInputFiles({ name: 'failed-link.txt', mimeType: 'text/plain', buffer: Buffer.from('Not linked') });
            await page.waitForFunction(() => document.querySelector('.archive-document-import-row.error')?.textContent.includes('failed-link.txt'));
            assert.equal(await page.evaluate(() => sampleData.archiveFiles.some(file => file.name === 'failed-link.txt')), false);
            assert.ok((await upload.locator('[data-import-summary]').innerText()).includes(language === 'ru' ? 'не добавлено' : 'not added'));
            await upload.locator('[data-close]').first().click();
            await modal.locator('.connected-files-footer [data-close]').click();
            await page.evaluate(() => {
                const template = sampleData.archiveFiles.find(file => file.projectId === 'p1');
                for (let index = 0; index < 105; index++) {
                    sampleData.archiveFiles.push({ ...template, id: `af-picker-many-${index}`, name: `record-${index}.txt`, folderId: null, linkedPersonIds: [] });
                }
                window.__openPicker();
            });
            assert.equal(await modal.locator('[data-connected-files-choice]').count(), 100);
            await modal.locator('[data-connected-files-more]').click();
            assert.ok(await modal.locator('[data-connected-files-choice]').count() >= 105);
            await modal.locator('.connected-files-footer [data-close]').click();
            await page.evaluate(() => {
                openModal('<div class="modal" data-picker-parent role="dialog"><button data-close type="button">Close</button></div>');
                openConnectedFilesModal({
                    projectId: 'p1', onSave: () => ({ ok: true }),
                    modalOpener: openNestedModal, autoFocusSearch: false,
                });
            });
            await modal.locator('[data-connected-files-results]').evaluate(element => { element.scrollTop = 180; });
            const browseScrollTop = await modal.locator('[data-connected-files-results]').evaluate(element => element.scrollTop);
            await modal.locator('[data-connected-files-add-new]').click();
            await upload.locator('[data-close]').first().click();
            assert.ok(await modal.isVisible());
            assert.equal(await modal.locator('[data-connected-files-results]').evaluate(element => element.scrollTop), browseScrollTop);
            await modal.locator('.connected-files-footer [data-close]').click();
            assert.ok(await page.locator('[data-picker-parent]').isVisible());
            await page.locator('[data-picker-parent] [data-close]').click();
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Connected files folder browsing and upload passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
