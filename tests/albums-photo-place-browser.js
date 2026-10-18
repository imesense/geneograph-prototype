const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const width of [390, 1280])
        {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const initial = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Albums' });
                state.activeModule = 'Albums';
                const photo = sampleData.media.find(item => item.projectId === currentProjectId());
                state.selectedPhotoId = photo.id;
                state.albumsDetailCollapsed = false;
                renderAlbums();
                beginAlbumsPhotoEdit();
                if (innerWidth <= 900) openMobileSurface('details');
                return { placeCount: sampleData.places.length, photoId: photo.id,
                    dirty: albumsPhotoEditIsDirty() };
            });
            assert.equal(initial.dirty, false);
            const input = page.locator('#albumPhotoPlace');
            const name = `Test Place ${width} Unique`;
            await input.fill('');
            for (const character of name) await input.press(character === ' ' ? 'Space' : character);
            const beforeSave = await page.evaluate(() => ({ count: sampleData.places.length,
                draft: collectAlbumsPhotoEditDraft(), dirty: albumsPhotoEditIsDirty() }));
            assert.equal(beforeSave.count, initial.placeCount);
            assert.equal(beforeSave.draft.placeText, name);
            assert.equal(beforeSave.dirty, true);
            const saved = await page.evaluate(photoId =>
            {
                saveAlbumsPhotoEdit();
                const photo = getPhoto(photoId);
                return { count: sampleData.places.length, placeId: photo.placeId,
                    placeName: getPlace(photo.placeId)?.name };
            }, initial.photoId);
            assert.equal(saved.count, initial.placeCount + 1);
            assert.equal(saved.placeName, name);
            assert.ok(saved.placeId);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Albums photo place save checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
