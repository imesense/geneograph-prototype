const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const language of ['en', 'ru'])
        {
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Albums' });
                state.selectedPhotoId = sampleData.media.find(photo => photo.projectId === 'p1').id;
                state.albumsDetailCollapsed = false;
                renderAlbums();
            }, language);

            const section = page.locator('.albums-detail .panel-section:has(#albumsTagPeople)');
            const arrow = section.locator('.panel-section-chevron-toggle');
            const heading = section.locator('.panel-section-header');
            assert.equal(await arrow.getAttribute('aria-expanded'), 'true');
            assert.ok(await arrow.evaluate(button => button.getBoundingClientRect().width >= 36));
            await arrow.click();
            assert.equal(await arrow.getAttribute('aria-expanded'), 'false');
            assert.equal(await heading.getAttribute('aria-expanded'), 'false');
            assert.equal(await section.locator('.panel-section-body').isVisible(), false);
            await arrow.focus();
            await page.keyboard.press('Enter');
            assert.equal(await arrow.getAttribute('aria-expanded'), 'true');
            assert.equal(await section.locator('.panel-section-body').isVisible(), true);
            await section.locator('#albumsTagPeople').click();
            assert.equal(await arrow.getAttribute('aria-expanded'), 'true');
            assert.equal(await page.locator('.albums-tag-people-modal').isVisible(), true);
            await page.evaluate(() => closeModal());

            await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                state.archiveSelectedFolderId = 'delo44';
                state.archiveSelectedFileId = 'af1';
                state.archiveInspectorCollapsed = false;
                render();
            });
            const archiveSection = page.locator('.panel-section:has([data-archive-add-file-person])');
            const archiveArrow = archiveSection.locator('.panel-section-chevron-toggle');
            const archiveInitial = await archiveArrow.getAttribute('aria-expanded');
            await archiveArrow.click();
            const archiveNext = archiveInitial === 'true' ? 'false' : 'true';
            assert.equal(await archiveArrow.getAttribute('aria-expanded'), archiveNext);
            assert.equal(await archiveSection.locator('.panel-section-header').getAttribute('aria-expanded'), archiveNext);
            await archiveArrow.click();
            assert.equal(await archiveArrow.getAttribute('aria-expanded'), archiveInitial);

            await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver';
                state.inspectorSections.photos = true;
                state.inspectorSections.archive = false;
                render();
            });
            const aligned = await page.evaluate(() =>
            {
                const center = selector =>
                {
                    const rect = document.querySelector(selector).getBoundingClientRect();
                    return rect.left + rect.width / 2;
                };
                return {
                    open: center('[data-toggle-section="photos"].panel-section-chevron-toggle .panel-section-arrow'),
                    closed: center('[data-toggle-section="archive"] .panel-section-arrow')
                };
            });
            assert.ok(Math.abs(aligned.open - aligned.closed) <= 1,
                `open and closed chevrons align: ${JSON.stringify(aligned)}`);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Inspector section chevrons passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
