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
        for (const [width, language] of [[320, 'ru'], [390, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 780 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'People' });
            }, language);

            for (const type of ['parent', 'child', 'sibling', 'partner'])
            {
                await page.evaluate(type => openAddPersonModal('Add person', '', {
                    relativeType: type, personId: 'silver'
                }), type);
                await page.locator('#addPersonFirstName').fill('Silver');
                await page.locator('#addPersonLastName').fill('Whiskerfield');
                assert.equal(await page.locator('[data-add-person-possible-match="silver"]').count(), 0,
                    `${type}: anchor is not a possible duplicate`);
            }
            await page.evaluate(() => openAddPersonModal('Add person', ''));
            await page.locator('#addPersonFirstName').fill('Silver');
            await page.locator('#addPersonLastName').fill('Whiskerfield');
            assert.equal(await page.locator('[data-add-person-possible-match="silver"]').count(), 1,
                'standalone creation still suggests a real match');

            await page.evaluate(() => openConnectRelativeModal('silver'));
            const modal = page.locator('.connect-person-modal');
            const suggested = await page.evaluate(() => connectPersonCandidates().map(person => person.id));
            for (const id of ['barnaby', 'oliver', 'luna'])
                assert.ok(!suggested.includes(id), `${id} excluded from default list`);
            await modal.locator('[data-connect-relationship]').selectOption('parent');
            assert.ok(!(await page.evaluate(() => connectPersonCandidates().map(person => person.id))).includes('barnaby'));
            await modal.locator('[data-connect-search]').fill('Barnaby');
            const parent = modal.locator('[data-connect-person-result="barnaby"]');
            assert.equal(await parent.count(), 1);
            assert.match(await parent.locator('.connect-person-related-status').innerText(),
                language === 'ru' ? /Указанное родство: Родитель/ : /Already connected as: Parent/);
            await parent.click();
            assert.equal(await parent.getAttribute('aria-pressed'), 'true');
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);

            await modal.locator('[data-connect-relationship]').selectOption('child');
            await modal.locator('[data-connect-search]').fill('Oliver');
            assert.match(await modal.locator('[data-connect-person-result="oliver"] .connect-person-related-status').innerText(),
                language === 'ru' ? /Ребёнок/ : /Child/);
            await modal.locator('[data-connect-relationship]').selectOption('partner');
            await modal.locator('[data-connect-search]').fill('Luna');
            assert.match(await modal.locator('[data-connect-person-result="luna"] .connect-person-related-status').innerText(),
                language === 'ru' ? /Партнёр/ : /Partner/);

            await page.evaluate(() => openConnectRelativeModal('oliver'));
            assert.ok(!(await page.evaluate(() => connectPersonCandidates().map(person => person.id))).includes('mochi'));
            await modal.locator('[data-connect-relationship]').selectOption('sibling');
            await modal.locator('[data-connect-search]').fill('Mochi');
            const sibling = modal.locator('[data-connect-person-result="mochi"]');
            assert.match(await sibling.locator('.connect-person-related-status').innerText(),
                language === 'ru' ? /Брат или сестра/ : /Sibling/);
            await sibling.click();
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Person suggestion connections passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
