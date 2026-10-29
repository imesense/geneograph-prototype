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
        for (const [width, language] of [[320, 'ru'], [823, 'ru'], [1200, 'ru'], [1200, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 760 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                openEventLinkModal({ projectId: 'p1', onSave: () => true });
            }, language);
            const modal = page.locator('.notes-events-modal');
            assert.equal((await modal.locator('.notes-event-timeline-empty strong').innerText()).trim(),
                language === 'ru' ? 'Выберите человека' : 'Select a person');
            const bounds = await page.evaluate(() =>
            {
                const modal = document.querySelector('.notes-events-modal').getBoundingClientRect();
                const people = document.querySelector('.notes-event-person-pane').getBoundingClientRect();
                return { modalWidth: modal.width, peopleWidth: people.width,
                    overflow: document.documentElement.scrollWidth > innerWidth };
            });
            assert.ok(!bounds.overflow, `${width} ${language}: no page overflow`);
            if (width > 720)
                assert.ok(bounds.peopleWidth >= 319, `${width} ${language}: wider people list`);
            if (width === 1200)
                assert.ok(bounds.modalWidth >= 979, 'desktop modal is wider');
            assert.deepEqual(errors, []);
            await page.evaluate(() =>
            {
                sampleData.people = sampleData.people.filter(person => person.projectId !== 'p1');
                openEventLinkModal({ projectId: 'p1', onSave: () => true });
            });
            assert.equal((await modal.locator('.notes-event-empty strong').innerText()).trim(),
                language === 'ru' ? 'В проекте пока нет людей' : 'No people in this project yet');
            assert.equal(await modal.locator('[data-notes-event-clear-search]').count(), 0);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Notes Add Events empty state passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
