const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE }
            : {})
    });

    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);

        for (const language of ['ru', 'en', 'ru'])
        {
            const noteTitle = await page.evaluate(language =>
            {
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                const note = sampleData.notes.find(item => item.projectId === 'p1' && !item.deleted);
                state.selectedNoteId = note.id;
                openNotesPhotosModal();
                return t(note.title);
            }, language);

            const modal = page.locator('[data-notes-photos-adder]');
            assert.equal(await modal.locator('h2').innerText(), language === 'ru'
                ? 'Добавить фотографии к заметке' : 'Add photos to note');
            const description = await modal.locator('.modal-header p').innerText();
            if (language === 'ru')
            {
                assert.match(description, /^Выбранные и загруженные фотографии будут связаны с «.+»\.$/);
                assert.doesNotMatch(description, /\bphotos\b|\blinked\b/);
            }
            else
            {
                assert.equal(description, `Selected and uploaded photos will be linked to ${noteTitle}.`);
            }
            await page.evaluate(() => closeModal());
        }

        assert.deepEqual(errors, []);
    }
    finally
    {
        await browser.close();
    }

    console.log('Notes Add Photos localization passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
