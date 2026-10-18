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
