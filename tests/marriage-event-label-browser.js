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
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const event = await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver';
                render();
                const marriage = sampleData.events.find(item =>
                    item.type === 'marriage' && item.personIds.includes('silver'));
                return { title: marriage.title, type: marriage.marriageType,
                    pickerTitle: placeInspectorEventPresentation(marriage, 'silver').title,
                    civilLabel: t('Civil'), civilMarriageLabel: t('Civil marriage') };
            }, language);
            assert.equal(event.title, 'Marriage');
            assert.equal(event.pickerTitle, 'Marriage');
            assert.equal(event.type, 'Civil');
            assert.equal(event.civilLabel, language === 'ru' ? 'Зарегистрированный брак' : 'Civil');
            assert.equal(event.civilMarriageLabel, language === 'ru' ? 'Зарегистрированный брак' : 'Civil marriage');
            const timelineText = await page.locator('.timeline').innerText();
            assert.match(timelineText, language === 'ru' ? /Брак/ : /Marriage/);
            assert.doesNotMatch(timelineText, /Civil marriage|Гражданский брак/);

            await page.evaluate(() => openEventLinkModal({
                projectId: 'p1', primaryPersonIds: ['silver'], onSave: () => true
            }));
            const titles = await page.locator('.notes-event-result-copy strong').allInnerTexts();
            assert.ok(titles.some(title => title.trim() === (language === 'ru' ? 'Брак' : 'Marriage')),
                `${language}: generic marriage title in event picker`);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Marriage timeline and event labels passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
