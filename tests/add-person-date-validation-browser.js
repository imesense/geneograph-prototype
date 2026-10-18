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
        for (const language of ['en', 'ru'])
        {
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const initial = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'People' });
                const count = getPeople(currentProjectId()).length;
                openAddPersonModal('Add person', 'Create a new person in this project');
                return count;
            });
            await page.locator('#addPersonFirstName').fill('Date');
            await page.locator('#addPersonLastName').fill('Validation');
            const labels = await page.evaluate(() =>
            {
                const select = document.createElement('select');
                select.innerHTML = genealogyMonthOptions('02');
                return { months: [...select.options].slice(1).map(option => ({ value: option.value, label: option.textContent })),
                    selected: select.value, noMatches: t('No strong matches found in this project.') };
            });
            assert.equal(labels.months.length, 12);
            assert.equal(labels.selected, '02');
            assert.deepEqual(labels.months.map(month => month.value), Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')));
            assert.equal(labels.months[0].label, language === 'ru' ? '01 - январь' : '01 - January');
            assert.equal(labels.months[11].label, language === 'ru' ? '12 - декабрь' : '12 - December');
            assert.equal(labels.noMatches, language === 'ru'
                ? 'В этом проекте не найдено достаточно близких совпадений.'
                : 'No strong matches found in this project.');
            await page.waitForFunction(expected =>
                document.querySelector('.add-person-match-empty')?.textContent.trim() === expected,
            labels.noMatches);
            await page.locator('#addPersonBirthDate').fill('31 Feb 2000');
            await page.locator('[data-create-person]').click();
            assert.equal(await page.evaluate(() => getPeople(currentProjectId()).length), initial);
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            assert.notEqual(await page.locator('[data-genealogy-date-field="addPersonBirth"] [data-genealogy-date-validation]').innerText(), '');
            assert.equal(await page.locator('[data-create-person]').isEnabled(), true);

            await page.locator('#addPersonBirthDate').fill('29 Feb 2000');
            await page.locator('#addPersonStatusButton').click();
            await page.locator('[data-status-value="Deceased"]').click();
            await page.locator('#addPersonDeathDate').fill('31 Feb 2020');
            await page.locator('[data-create-person]').click();
            assert.equal(await page.evaluate(() => getPeople(currentProjectId()).length), initial);
            assert.notEqual(await page.locator('[data-genealogy-date-field="addPersonDeath"] [data-genealogy-date-validation]').innerText(), '');

            await page.locator('#addPersonDeathDate').fill('29 Feb 2020');
            await page.locator('[data-create-person]').click();
            assert.equal(await page.evaluate(() => getPeople(currentProjectId()).length), initial + 1);
            assert.equal(await page.locator('.add-person-modal').count(), 0);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Create Person date validation checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
