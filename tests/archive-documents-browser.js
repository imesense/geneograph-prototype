const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');
const { Document, Paragraph, Packer } = require('docx');

const base = process.env.GENEO_TEST_URL || 'http://localhost:8765/index.html';
const assets = path.resolve(__dirname, '../src/assets');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 760 }, acceptDownloads: true });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(base, { waitUntil: 'domcontentloaded' });
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                state.archiveSelectedFolderId = 'interviews';
                state.archiveSelectedFileId = 'af-letter-transcription';
                state.archiveInspectorCollapsed = false;
                render();
            }, language);
            for (const [id, expected] of [
                ['af-letter-transcription', 'Dear Luna'],
                ['af-household-csv', 'Barnaby Whiskerfield'],
                ['af-pawford-trip', 'Pawford research visit'],
            ]) {
                await page.evaluate(id => openArchiveDocumentViewer(id), id);
                await page.waitForTimeout(400);
                assert.ok((await page.locator('.archive-document-body').innerText()).includes(expected), `${id}: ${await page.locator('.archive-document-body').innerText()}`);
                const download = page.waitForEvent('download');
                await page.locator('[data-document-download]').click();
                assert.ok((await download).suggestedFilename());
                await page.locator('.archive-document-modal [data-close]').click();
            }
            await page.evaluate(() => openArchiveDocumentViewer('af-marriage-packet'));
            await page.locator('.archive-document-pdf-canvas').waitFor();
            await page.locator('[data-pdf-in]').click();
            await page.waitForFunction(() => document.querySelector('[data-pdf-zoom]')?.textContent === '125%');
            assert.equal(await page.locator('[data-pdf-zoom]').textContent(), '125%');
            await page.locator('[data-pdf-next]').click();
            await page.waitForFunction(() => document.querySelector('[data-pdf-page]')?.textContent === '2 / 2');
            await page.locator('.archive-document-modal [data-close]').click();
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'af-letter-transcription');
            assert.equal(await page.evaluate(() => state.archiveSelectedFolderId), 'interviews');
            await page.evaluate(() => openArchiveDocumentImport());
            const footerActions = () => page.locator('.archive-document-import .modal-footer button').evaluateAll(buttons =>
                buttons.map(button => ({ action: button.hasAttribute('data-document-choose') ? 'choose' : 'done', primary: button.classList.contains('primary') })));
            assert.deepEqual(await footerActions(), [{ action: 'done', primary: false }, { action: 'choose', primary: true }]);
            const fileChooser = page.waitForEvent('filechooser');
            await page.locator('.archive-document-import [data-document-choose]').click();
            assert.ok(await fileChooser);
            await page.locator('[data-document-drop]').evaluate(drop => {
                const transfer = new DataTransfer();
                transfer.items.add(new File(['invalid'], 'invalid.mp3', { type: 'audio/mpeg' }));
                drop.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
            });
            await page.waitForFunction(() => document.querySelectorAll('[data-import-results] p').length === 1);
            assert.deepEqual(await footerActions(), [{ action: 'done', primary: false }, { action: 'choose', primary: true }]);
            await page.locator('[data-document-input]').setInputFiles([
                path.join(assets, 'daisy_letter_transcription.txt'),
                path.join(assets, 'pawford_household_index.csv'),
                path.join(assets, 'pawford_visit_notes.docx'),
                path.join(assets, 'silver_luna_marriage_packet.pdf'),
            ]);
            await page.locator('[data-import-results] p').last().waitFor();
            await page.waitForFunction(() => document.querySelectorAll('[data-import-results] p').length === 5);
            assert.deepEqual(await footerActions(), [{ action: 'choose', primary: false }, { action: 'done', primary: true }]);
            await page.locator('[data-document-input]').setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a pdf') });
            await page.waitForFunction(() => document.querySelectorAll('[data-import-results] p').length === 6);
            assert.deepEqual(await footerActions(), [{ action: 'choose', primary: false }, { action: 'done', primary: true }]);
            await page.locator('[data-document-input]').setInputFiles([
                { name: 'uploaded-record.png', mimeType: 'image/png', buffer: fs.readFileSync(path.join(assets, 'daisy-birth-record-sample.png')) },
                { name: 'bad-image.png', mimeType: 'image/png', buffer: Buffer.from('not a png') },
                { name: 'uploaded-portrait.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(path.join(assets, 'unidentified-studio-portrait.jpg')) },
            ]);
            await page.waitForFunction(() => document.querySelectorAll('[data-import-results] p').length === 9);
            const webp = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 2; canvas.height = 2;
                canvas.getContext('2d').fillRect(0, 0, 2, 2);
                return canvas.toDataURL('image/webp').split(',')[1];
            });
            await page.locator('[data-document-input]').setInputFiles({ name: 'uploaded-image.webp', mimeType: 'image/webp', buffer: Buffer.from(webp, 'base64') });
            await page.waitForFunction(() => document.querySelectorAll('[data-import-results] p').length === 10);
            assert.equal(await page.evaluate(() => sampleData.archiveFiles.filter(file => file.id.startsWith('af-upload-')).length), 7);
            assert.ok((await page.locator('[data-import-results]').innerText()).includes('bad.pdf'));
            assert.ok((await page.locator('[data-import-results]').innerText()).includes('bad-image.png'));
            await page.locator('.archive-document-import [data-close]').first().click();
            const imageId = await page.evaluate(() => sampleData.archiveFiles.find(file => file.name === 'uploaded-record.png')?.id);
            const imageState = await page.evaluate(id => {
                const file = archiveFileById(id);
                return { kind: archiveFileKind(file), url: file.previewUrl, bytes: archiveDocumentBytes.has(id) };
            }, imageId);
            assert.equal(imageState.kind, 'img');
            assert.ok(imageState.url.startsWith('blob:') && imageState.bytes);
            await page.evaluate(id => { state.archiveSelectedFileId = id; renderArchiveMain(); }, imageId);
            await page.locator('.archive-file-preview-image').first().evaluate(image => image.decode());
            await page.evaluate(id => openArchiveDocumentViewer(id), imageId);
            await page.locator('.archive-unified-image-modal .albums-lightbox-image').evaluate(image => image.decode());
            const imageDownload = page.waitForEvent('download');
            await page.locator('[data-archive-image-download]').click();
            assert.equal((await imageDownload).suggestedFilename(), 'uploaded-record.png');
            await page.locator('.archive-unified-image-modal [data-lightbox-tag]').click();
            const taggedId = await page.locator('.archive-unified-image-modal [data-photo-people-choice]').first().getAttribute('data-photo-people-choice');
            await page.locator(`.archive-unified-image-modal [data-photo-people-choice="${taggedId}"]`).first().click();
            await page.locator('.archive-unified-image-modal [data-photo-people-add-region]').click();
            assert.ok(await page.evaluate(({ imageId, taggedId }) => archiveFileById(imageId).personRegions?.[taggedId], { imageId, taggedId }));
            await page.locator('.archive-unified-image-modal .albums-preview-done').click();
            for (const name of ['uploaded-portrait.jpg', 'uploaded-image.webp']) {
                const id = await page.evaluate(name => sampleData.archiveFiles.find(file => file.name === name)?.id, name);
                await page.evaluate(id => openArchiveDocumentViewer(id), id);
                await page.locator('.archive-unified-image-modal .albums-lightbox-image').evaluate(image => image.decode());
                await page.locator('.archive-unified-image-modal .albums-preview-done').click();
            }
            await page.evaluate(id => deleteArchiveFilesPermanently([id]), imageId);
            assert.equal(await page.evaluate(id => archiveDocumentBytes.has(id) || archiveUploadedImageUrls.has(id), imageId), false);
            const uploadedId = await page.evaluate(() => sampleData.archiveFiles.find(file => file.id.startsWith('af-upload-') && file.name.endsWith('.txt'))?.id);
            await page.evaluate(id => openArchiveDocumentViewer(id), uploadedId);
            assert.ok((await page.locator('.archive-document-body').innerText()).includes('Dear Luna'));
            await page.locator('.archive-document-modal [data-close]').click();
            await page.evaluate(() => {
                window.__documentLinks = [];
                openConnectedFilesModal({
                    title: 'Add files',
                    onSave: ids => { window.__documentLinks = ids; return { ok: true }; },
                    autoFocusSearch: false,
                });
            });
            await page.locator('[data-connected-files-tab="new"]').click();
            await page.locator('[data-connected-files-add-new]').click();
            await page.locator('[data-document-input]').setInputFiles(path.join(assets, 'daisy_letter_transcription.txt'));
            await page.waitForFunction(() => window.__documentLinks.length === 1);
            assert.equal(await page.evaluate(() => archiveFileById(window.__documentLinks[0]).folderId), 'interviews');
            await page.locator('.archive-document-import [data-close]').first().click();
            await page.evaluate(() => {
                activateProject('p1', { moduleName: 'Notes' });
                render();
                window.__noteForUpload = sampleData.notes.find(note => note.projectId === 'p1').id;
                openNoteFilesModal(window.__noteForUpload);
            });
            await page.locator('[data-connected-files-tab="new"]').click();
            await page.locator('[data-connected-files-add-new]').click();
            await page.locator('[data-document-input]').setInputFiles(path.join(assets, 'daisy_letter_transcription.txt'));
            await page.waitForFunction(() => (getNote(window.__noteForUpload)?.linkedArchiveFileIds || []).some(id => id.startsWith('af-upload-')));
            assert.equal(await page.evaluate(() => state.activeModule), 'Notes');
            await page.locator('.archive-document-import [data-close]').first().click();
            const hostile = '<img src=x onerror="window.__injected=1"><script>window.__injected=2</script>';
            const hostileDocx = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph(hostile)] }] }));
            await page.evaluate(() => { activateProject('p1', { moduleName: 'Archive' }); render(); openArchiveDocumentImport(); });
            for (const [name, mimeType, buffer] of [
                ['hostile.txt', 'text/plain', Buffer.from(hostile)],
                ['hostile.csv', 'text/csv', Buffer.from(`Heading\n"${hostile.replaceAll('"', '""')}"`)],
                ['hostile.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', hostileDocx],
            ]) {
                await page.locator('[data-document-input]').setInputFiles({ name, mimeType, buffer });
                await page.waitForTimeout(700);
                assert.ok(await page.evaluate(name => sampleData.archiveFiles.some(file => file.name === name), name), `${name}: ${await page.locator('[data-import-results]').innerText()}`);
            }
            await page.locator('.archive-document-import [data-close]').first().click();
            for (const name of ['hostile.txt', 'hostile.csv', 'hostile.docx']) {
                const id = await page.evaluate(name => sampleData.archiveFiles.find(file => file.name === name).id, name);
                await page.evaluate(id => openArchiveDocumentViewer(id), id);
                assert.equal(await page.locator('.archive-document-body img, .archive-document-body script').count(), 0);
                assert.equal(await page.evaluate(() => window.__injected), undefined);
                await page.locator('.archive-document-modal [data-close]').click();
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Archive document samples and imports passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
