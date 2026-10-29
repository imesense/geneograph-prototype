const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const [width, height, language] of [[1280,900,'en'],[900,760,'ru'],[390,720,'en'],[320,568,'ru']])
        {
            const page = await browser.newPage({ viewport:{ width,height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore:false });
                setLanguage(language,false);
                activateProject('p1',{ moduleName:'Albums' });
            }, language);
            for (const kind of ['album','note-collection'])
            {
                await page.evaluate(kind =>
                {
                    if (kind === 'album')
                    {
                        const photo = getProjectPhotos('p1')[0];
                        state.selectedPhotoIds = [photo.id];
                        window.membershipOriginal = JSON.stringify(photo.albumIds);
                        window.membershipTarget = photo.id;
                        openAddToAlbumModal();
                    }
                    else
                    {
                        const note = sampleData.notes.find(note => note.projectId === 'p1' && !note.deleted);
                        window.membershipOriginal = JSON.stringify(note.collectionIds);
                        window.membershipTarget = note.id;
                        openNoteCollectionsModal(note.id);
                    }
                },kind);
                const modal=page.locator('.membership-picker');
                await page.waitForFunction(() => document.activeElement === document.querySelector('.membership-picker .modal-header h2'));
                assert.equal(await modal.locator('.album-picker-results-head').count(),0);
                assert.ok(await modal.locator('.album-picker-description').count()>0);
                assert.equal(await modal.locator('.album-picker-meta').count(),0);
                assert.ok(await modal.locator(kind === 'album' ? '[data-album-picker-save]' : '[data-note-collection-picker-save]').isDisabled());
                const geometry = await modal.locator('.album-picker-results').evaluate(element => ({height:element.clientHeight,max:getComputedStyle(element).maxHeight}));
                assert.equal(geometry.max,'none');
                assert.ok(geometry.height > (width < 600 ? 180 : 350),JSON.stringify(geometry));
                await page.screenshot({path:path.join(os.tmpdir(),`membership-${kind}-${width}.png`)});
                const search=modal.locator('input[type=search]');
                await search.fill('no match for existing items');
                await modal.locator('.album-picker-new-button').click();
                const name=modal.locator(kind === 'album' ? '[data-album-picker-name]' : '[data-note-collection-picker-name]');
                await name.fill('Membership test '+width);
                await page.keyboard.press('Escape');
                await page.locator('.rp-discard-modal').waitFor();
                await page.locator('[data-rp-discard]').click();
                assert.ok(await search.isVisible());
                assert.equal(await search.inputValue(),'no match for existing items');
                await modal.locator('.album-picker-new-button').click();
                await name.fill('Membership test '+width);
                await modal.locator('.album-picker-create [type=submit]').count().then(async count =>
                {
                    if(count) await modal.locator('.album-picker-create [type=submit]').click();
                    else await modal.locator('.album-picker-footer [type=submit]').click();
                });
                await search.waitFor({state:'visible'});
                assert.equal(await search.inputValue(),'no match for existing items');
                assert.equal(await modal.locator('.album-picker-result').count(),1);
                assert.ok(await modal.locator('.album-picker-result input').isChecked());
                assert.equal(await page.evaluate(kind => JSON.stringify(kind === 'album' ? getPhoto(window.membershipTarget).albumIds : getNote(window.membershipTarget).collectionIds),kind),await page.evaluate(() => window.membershipOriginal));
                await modal.locator('.album-picker-footer [data-album-picker-cancel],.album-picker-footer [data-note-collection-picker-cancel]').click();
                assert.equal(await modal.count(),0);
                const createdId = await page.evaluate(({kind,width}) =>
                {
                    const library = kind === 'album' ? sampleData.albums : sampleData.noteCollections;
                    const created = library.find(record => record.name === 'Membership test '+width);
                    if (kind === 'album') { state.selectedPhotoIds=[window.membershipTarget]; openAddToAlbumModal(); }
                    else openNoteCollectionsModal(window.membershipTarget);
                    return created.id;
                },{kind,width});
                await modal.locator(`input[type=checkbox][value="${createdId}"]`).check();
                await modal.locator(kind === 'album' ? '[data-album-picker-save]' : '[data-note-collection-picker-save]').click();
                assert.equal(await page.evaluate(({kind,createdId}) => (kind === 'album' ? getPhoto(window.membershipTarget).albumIds : getNote(window.membershipTarget).collectionIds).includes(createdId),{kind,createdId}),true);
                await page.evaluate(kind =>
                {
                    if(kind === 'album') { state.selectedPhotoIds=[window.membershipTarget]; openAddToAlbumModal(); }
                    else openNoteCollectionsModal(window.membershipTarget);
                },kind);
                const existing=modal.locator(`input[value="${createdId}"]`);
                assert.ok(await existing.isEnabled());
                assert.ok(await existing.isChecked());
                await existing.uncheck();
                await modal.locator(kind === 'album' ? '[data-album-picker-save]' : '[data-note-collection-picker-save]').click();
                assert.equal(await page.evaluate(({kind,createdId}) => (kind === 'album' ? getPhoto(window.membershipTarget).albumIds : getNote(window.membershipTarget).collectionIds).includes(createdId),{kind,createdId}),false);
                assert.equal(await page.evaluate(({kind,createdId}) => (kind === 'album' ? sampleData.albums : sampleData.noteCollections).some(record=>record.id===createdId),{kind,createdId}),true);
            }
            if(width===1280)
            {
                await page.evaluate(() =>
                {
                    const photos=getProjectPhotos('p1').slice(0,2);
                    window.partialPhotoIds=photos.map(photo=>photo.id);
                    sampleData.albums.push({id:'partial-membership-test',projectId:'p1',name:'Partial membership',description:'Partial fixture'});
                    photos[0].albumIds=[...(photos[0].albumIds||[]),'partial-membership-test'];
                    state.selectedPhotoIds=window.partialPhotoIds;
                    openAddToAlbumModal();
                });
                const partial=page.locator('input[value="partial-membership-test"]');
                assert.ok(await partial.evaluate(element=>element.indeterminate));
                assert.ok(await page.locator('[data-album-picker-save]').isDisabled());
                await partial.check();
                await page.evaluate(() =>
                {
                    sampleData.albums.push({id:'concurrent-album-test',projectId:'p1',name:'Concurrent album'});
                    getPhoto(window.partialPhotoIds[0]).albumIds.push('concurrent-album-test');
                });
                await page.locator('[data-album-picker-save]').click();
                assert.ok(await page.evaluate(()=>window.partialPhotoIds.every(id=>getPhoto(id).albumIds.includes('partial-membership-test'))));
                assert.ok(await page.evaluate(()=>getPhoto(window.partialPhotoIds[0]).albumIds.includes('concurrent-album-test')));
                await page.evaluate(()=>{state.selectedPhotoIds=window.partialPhotoIds;openAddToAlbumModal();});
                await partial.uncheck();
                await page.locator('[data-album-picker-save]').click();
                assert.ok(await page.evaluate(()=>window.partialPhotoIds.every(id=>!getPhoto(id).albumIds.includes('partial-membership-test'))));
            }
            assert.deepEqual(errors,[]);
            await page.close();
        }
        console.log('Membership managers: layout, creation, add/remove, partial state and concurrent-link preservation passed');
    }
    finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
