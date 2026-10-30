const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        const page = await browser.newPage();
        page.on('pageerror', error => console.error(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        for (const [count, noun] of [[1, 'фотографию'], [2, 'фотографии'], [5, 'фотографий'], [21, 'фотографию']])
        {
            await page.evaluate(count =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Albums' });
                setLanguage('ru', false);
                const source = sampleData.media.find(photo => photo.projectId === 'p1');
                const photos = Array.from({ length: count }, (_, index) => ({ ...source, id: `delete-localization-${index}`, title: 'Фотография' }));
                sampleData.media.push(...photos);
                openDeletePhotoConfirm(photos.map(photo => photo.id));
            }, count);
            const title = await page.locator('#deletePhotoTitle').innerText();
            assert.ok(title.includes(noun), title);
            assert.doesNotMatch(title, /[A-Za-z«»]/);
            assert.doesNotMatch(await page.locator('.albums-delete-copy').innerText(), /[A-Za-z]/);
            await page.evaluate(() => { closeModal(); sampleData.media = sampleData.media.filter(photo => !photo.id.startsWith('delete-localization-')); });
        }
        console.log('Photo deletion Russian localization and plurals passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
