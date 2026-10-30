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
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            await page.route('https://**/*', route => route.abort());
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            for (const moduleName of ['Albums', 'Archive'])
            {
                await page.evaluate(({ moduleName, language }) =>
                {
                    activateProject('p1', { moduleName });
                    geneoTourClose({ offerRestore: false });
                    closeModal();
                    setLanguage(language, false);
                    if (moduleName === 'Albums')
                    {
                        state.selectedPhotoId = 'photo-grandparents-garden';
                        state.albumsDetailCollapsed = false;
                        state.albumsDetailSections.people = true;
                        renderAlbums();
                    }
                    else
                    {
                        const file = sampleData.archiveFiles.find(item => item.projectId === 'p1' && archiveFileKind(item) === 'img' && archiveCanViewFile(item));
                        state.archiveView = 'files';
                        state.archiveSelectedFileId = file.id;
                        state.archiveSelectedFolderId = file.folderId;
                        state.archiveInspectorCollapsed = false;
                        state.archiveInspectorSections.people = true;
                        renderArchiveMain();
                    }
                    if (innerWidth <= 900) openMobileSurface('details');
                }, { moduleName, language });
                const trigger = page.locator(moduleName === 'Albums' ? '#albumsTagPeople' : '[data-archive-add-file-person]');
                for (const cancel of ['button', 'escape'])
                {
                    await trigger.click();
                    const modal = page.locator('.photo-people-modal');
                    assert.equal(await modal.evaluate(element => element.classList.contains('is-tagging')), true);
                    if (cancel === 'button') await modal.locator('[data-albums-search-back]').click();
                    else await page.keyboard.press('Escape');
                    assert.equal(await modal.count(), 0, `${moduleName} sidebar closes`);
                    await page.waitForFunction(selector => document.activeElement?.matches(selector), moduleName === 'Albums' ? '#albumsTagPeople' : '[data-archive-add-file-person]');
                }
                await page.evaluate(moduleName =>
                {
                    if (moduleName === 'Albums') openPhotoPeopleModal(state.selectedPhotoId, { mode: 'preview' });
                    else openArchiveImagePeopleModal(state.archiveSelectedFileId);
                }, moduleName);
                for (const cancel of ['button', 'escape'])
                {
                    const modal = page.locator('.photo-people-modal');
                    await modal.locator('[data-lightbox-tag]').click();
                    if (cancel === 'button') await modal.locator('[data-albums-search-back]').click();
                    else await page.keyboard.press('Escape');
                    assert.equal(await modal.count(), 1);
                    assert.equal(await modal.evaluate(element => element.classList.contains('is-preview')), true, `${moduleName} returns to preview`);
                }
                await page.evaluate(() => closeModal());
            }
            await page.close();
        }
        console.log('Tag person sidebar and preview return contexts passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
