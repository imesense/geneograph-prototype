const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const width of [1280, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage('ru', false);
                activateProject('p1', { moduleName: 'People' });
                const person = structuredClone(getPerson('barnaby'));
                person.id = 'localization-parent';
                person.names = { first: 'Арчибальд', last: 'Вискерфилд', display: 'Арчибальд Вискерфилд' };
                sampleData.people.push(person);
                openConnectRelativeModal('silver');
            });
            const modal = page.locator('.connect-person-modal');
            for (const type of ['parent', 'child', 'sibling', 'partner'])
            {
                await modal.locator('[data-connect-relationship]').selectOption(type);
                const text = await modal.innerText();
                assert.doesNotMatch(text, /Connect existing|Create a new person|Select relationship|recorded parents|connected as|Warning!/);
                assert.match(await modal.locator('[data-connect-create-new]').innerText(), /Создать и добавить/);
            }
            await modal.locator('[data-connect-relationship]').selectOption('parent');
            await page.evaluate(() =>
            {
                connectPersonModalState.selectedPersonId = 'localization-parent';
                connectPersonModalState.detailType = 'Adoptive';
                refreshConnectPersonModal();
            });
            assert.match(await modal.locator('[data-connect-warning]').innerText(), /родител/);
            await modal.locator('#connectPersonConfirm').click();
            const toast = await page.locator('#toast').innerText();
            assert.match(toast, /Арчибальд Вискерфилд.*родитель/);
            assert.match(toast, /родительские связи сохранены/);
            assert.doesNotMatch(toast, /connected|parent|selected|recorded|\{\w+\}|будет/i);
            const messages = await page.evaluate(() =>
            {
                const types = ['parent', 'child', 'sibling', 'partner'];
                return [
                    ...types.map(type => connectedRelativeToast('Арчибальд Вискерфилд', type)),
                    ...types.map(createdPersonConnectionToast),
                    validateParentChildConnection('barnaby', 'silver').message,
                    validateParentChildConnection('silver', 'barnaby').message,
                    validatePartnerConnection('barnaby', 'daisy').message,
                    t(validateSiblingConnection('silver', 'silver', '').message),
                    t(validateParentFamilySelection({ anchorPersonId: 'silver', relationshipType: 'sibling', selection: '' }).message),
                    t(validateParentFamilySelection({ anchorPersonId: 'silver', relationshipType: 'child', selection: 'missing' }).message),
                    connectRelativeText('Create a new person and connect them as a sibling of {person}.', { person: 'Сильвер' })
                ];
            });
            for (const message of messages)
            {
                assert.match(message, /[А-Яа-яЁё]/);
                assert.doesNotMatch(message, /connected|parent|sibling|partner|family|person|cycle|\{\w+\}/i);
            }
            await page.evaluate(() => openConnectRelativeModal('silver'));
            await modal.locator('[data-connect-relationship]').selectOption('sibling');
            await modal.locator('[data-connect-create-new]').click();
            assert.match(await page.locator('.modal-header').innerText(), /Создайте человека/);
            assert.ok(await page.locator('.modal').evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Connect relative Russian localization passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
