const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 720 }])
        {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Family Tree' });
            });

            for (const kind of ['photos', 'files'])
            {
                const ids = await page.evaluate(kind =>
                {
                    const records = kind === 'photos' ? getProjectPhotos('p1') : connectedFilesForProject('p1');
                    const ids = records.slice(0, 2).map(record => record.id);
                    window.mediaSaved = null;
                    const config = { projectId: 'p1', onSave: (selected, context) =>
                    {
                        window.mediaSaved = { selected, existing: [...context.existingIds], changes: context.changes,
                            sameSession: context.session === window.mediaManager };
                        return true;
                    } };
                    window.mediaManager = kind === 'photos'
                        ? rpOpenPhotoLinkPicker({ ...config, existingPhotoIds: ids })
                        : rpOpenFilePicker({ ...config, existingFileIds: ids });
                    return ids;
                }, kind);
                assert.equal(ids.length, 2);
                const root = page.locator(`[data-resource-picker="${kind}"]`);
                assert.ok(await root.locator(`[data-rp-check="${ids[0]}"]`).isChecked());
                assert.ok(await root.locator(`[data-rp-check="${ids[1]}"]`).isChecked());
                await root.locator(`[data-rp-check="${ids[0]}"]`).uncheck();
                await root.locator('[data-rp-action="save"]').click();
                await root.waitFor({ state: 'hidden' });
                const saved = await page.evaluate(() => window.mediaSaved);
                assert.deepEqual(saved.selected, [ids[1]]);
                assert.deepEqual(saved.existing, ids);
                assert.deepEqual(saved.changes.addedIds, []);
                assert.deepEqual(saved.changes.removedIds, [ids[0]]);
                assert.deepEqual(saved.changes.decisions, [{ id: ids[0], linked: false }]);
                assert.equal(saved.sameSession, true);
            }

            await page.evaluate(() =>
            {
                const person = getPerson('silver');
                const photos = getProjectPhotos('p1');
                window.unlinkPhotoId = photos[0].id;
                window.concurrentPhotoId = photos[1].id;
                window.otherPersonId = sampleData.people.find(item => item.projectId === 'p1' && item.id !== person.id).id;
                ensurePhotoPersonTag(photos[0], person);
                person.primaryPhotoId = photos[0].id;
                person.primaryPhotoCrop = null;
                setPhotoPersonIds(photos[1].id, (photos[1].personIds || []).filter(id => id !== person.id), { rerender: false });
                window.mediaManager = rpOpenPersonPhotoPicker(person.id);
                ensurePhotoPersonTag(photos[1], person);
                photos[0].personIds = [...new Set([...photos[0].personIds, window.otherPersonId])];
            });
            const unlinkPhotoId = await page.evaluate(() => window.unlinkPhotoId);
            await page.locator(`[data-rp-check="${unlinkPhotoId}"]`).uncheck();
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('[data-confirm-photo-unlink]').waitFor();
            await page.locator('.modal-footer [data-close]').click();
            await page.locator('.resource-picker').waitFor();
            assert.ok(await page.evaluate(() => getPerson('silver').primaryPhotoId === window.unlinkPhotoId));
            assert.ok(await page.evaluate(() => getPhoto(window.unlinkPhotoId).personIds.includes('silver')));
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('[data-confirm-photo-unlink]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => getPerson('silver').primaryPhotoId), '');
            assert.equal(await page.evaluate(() => getPhoto(window.unlinkPhotoId).personIds.includes('silver')), false);
            assert.ok(await page.evaluate(() => getPhoto(window.unlinkPhotoId).personIds.includes(window.otherPersonId)));
            assert.ok(await page.evaluate(() => getPhoto(window.concurrentPhotoId).personIds.includes('silver')));

            const fileIds = await page.evaluate(() =>
            {
                const files = connectedFilesForProject('p1').slice(0, 2);
                archiveSetConnectionsAtomically(files.map(file => ({ ownerType: 'file', ownerId: file.id,
                    entityType: 'person', entityId: 'silver', shouldLink: false })));
                archiveSetConnection('file', files[0].id, 'person', 'silver', true);
                openPersonFilesModal('silver');
                archiveSetConnection('file', files[1].id, 'person', 'silver', true);
                archiveSetConnection('file', files[0].id, 'person', window.otherPersonId, true);
                return files.map(file => file.id);
            });
            assert.ok(await page.locator(`[data-rp-check="${fileIds[0]}"]`).isChecked());
            await page.locator(`[data-rp-check="${fileIds[0]}"]`).uncheck();
            await page.locator('[data-rp-action="save"]').click();
            await page.locator('.resource-picker').waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(id => archiveConnectionIds('file', id, 'person').includes('silver'), fileIds[0]), false);
            assert.ok(await page.evaluate(id => archiveConnectionIds('file', id, 'person').includes(window.otherPersonId), fileIds[0]));
            assert.ok(await page.evaluate(id => archiveConnectionIds('file', id, 'person').includes('silver'), fileIds[1]));

            for (const kind of ['photos', 'files'])
            {
                await page.evaluate(kind =>
                {
                    window.uploadSaveCount = 0;
                    openModal('<section class="modal" data-media-parent><button type="button" data-close>Close</button></section>');
                    const config = { projectId: 'p1', modalOpener: openNestedModal,
                        onSave: () => { window.uploadSaveCount++; return true; } };
                    window.mediaManager = kind === 'photos' ? rpOpenDraftPhotoPicker(config) : rpOpenFilePicker(config);
                }, kind);
                await page.locator('[data-rp-action="create"]').click();
                const name = `media-manager-${viewport.width}.${kind === 'photos' ? 'png' : 'txt'}`;
                const file = kind === 'photos'
                    ? { name, mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNFkAAAAASUVORK5CYII=', 'base64') }
                    : { name, mimeType: 'text/plain', buffer: Buffer.from('Library-only evidence') };
                await page.locator(kind === 'photos' ? '[data-rp-upload-input]' : '[data-document-input]').setInputFiles([
                    { name: 'unsupported.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid') }, file
                ]);
                const upload = page.locator(kind === 'photos' ? '[data-rp-photo-upload]' : '.archive-document-import');
                await page.waitForFunction(() => document.querySelector('[data-rp-photo-upload], .archive-document-import')?.getAttribute('aria-busy') === 'false');
                assert.equal(await upload.locator(kind === 'photos' ? '.rp-upload-result.is-error' : '.archive-document-import-row.error').count(), 1);
                assert.equal(await upload.locator(kind === 'photos' ? '.rp-upload-result.is-success' : '.archive-document-import-row.success').count(), 1);
                assert.equal(await upload.locator('progress').getAttribute('value'), '2');
                assert.equal(await upload.locator('[type="submit"], [data-document-confirm]').count(), 0);
                assert.equal(await page.evaluate(() => window.uploadSaveCount), 0);
                assert.equal(await page.evaluate(() => window.mediaManager.selectedIds.size), 1);
                assert.ok(await page.evaluate(({ kind, name }) =>
                {
                    const record = kind === 'photos' ? sampleData.media.find(item => item.filename === name)
                        : sampleData.archiveFiles.find(item => item.name === name);
                    return record && (kind === 'photos' ? record.personIds : record.linkedPersonIds).length === 0;
                }, { kind, name }));
                await upload.locator('.modal-footer [data-close]').click();
                await page.locator('.rp-footer-actions [data-rp-action="close"]').click();
                await page.locator('[data-rp-discard]').click();
                await page.locator('[data-media-parent]').waitFor();
                assert.equal(await page.evaluate(() => window.uploadSaveCount), 0);
                assert.ok(await page.evaluate(({ kind, name }) => (kind === 'photos' ? sampleData.media : sampleData.archiveFiles)
                    .some(item => (kind === 'photos' ? item.filename : item.name) === name), { kind, name }));
                await page.locator('[data-media-parent] [data-close]').click();
            }
            assert.deepEqual(errors, []);
            console.log(`Media manager removal context, concurrent links, primary confirmation and immediate library-only uploads passed (${viewport.width}px)`);
            await page.close();
        }
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
