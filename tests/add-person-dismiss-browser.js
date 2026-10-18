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
        for (const [width, language] of [[390, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 780 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language =>
            {
                activateProject('p1', { moduleName: 'People' });
                setLanguage(language);
                openAddPersonModal('Add person', 'Create a new person in this project');
            }, language);
            await page.mouse.click(2, 2);
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            await page.locator('.add-person-modal [data-close]').first().click();
            assert.equal(await page.locator('.add-person-modal').count(), 0);

            await page.evaluate(() => openAddPersonModal('Add person', 'Create a new person in this project'));
            const first = page.locator('#addPersonFirstName');
            await first.fill('Test name');
            await first.fill('');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#addPersonDiscardOverlay').count(), 0);
            assert.equal(await page.locator('.add-person-modal').count(), 0);

            await page.evaluate(() => openAddPersonModal('Add person', 'Create a new person in this project'));
            await page.locator('#addPersonFirstName').fill('Test name');
            await page.evaluate(() => openNestedModal('<div class="modal" role="dialog" aria-modal="true"><button type="button" data-close>Close</button></div>'));
            await page.locator('#modalBackdrop [data-close]').click();
            assert.equal(await page.locator('#addPersonFirstName').inputValue(), 'Test name');
            await page.mouse.click(2, 2);
            assert.equal(await page.locator('#addPersonDiscardOverlay').count(), 0);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#addPersonDiscardOverlay').count(), 1);
            if (language === 'ru') assert.match(await page.locator('#addPersonDiscardOverlay').innerText(), /Несохранённые изменения/);
            await page.locator('[data-add-person-continue-editing]').click();
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            assert.equal(await page.locator('#addPersonFirstName').inputValue(), 'Test name');
            await page.locator('[data-add-person-discard]').count().then(count => assert.equal(count, 0));
            await page.locator('.add-person-modal [data-close]').last().click();
            await page.locator('[data-add-person-discard]').click();
            assert.equal(await page.locator('.add-person-modal').count(), 0);

            await page.evaluate(() => openEditPersonModal(getPeople(currentProjectId())[0].id));
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            const original = await page.locator('#addPersonFirstName').inputValue();
            await page.locator('#addPersonFirstName').fill(`${original} changed`);
            await page.locator('.add-person-modal [data-close]').last().click();
            assert.equal(await page.locator('#addPersonDiscardOverlay').count(), 1);
            await page.locator('[data-add-person-discard]').click();

            await page.evaluate(() => openAddPersonModal('Add person', 'Create a new person in this project'));
            const staged = await page.evaluate(() =>
            {
                const file = sampleData.archiveFiles.find(item => item.projectId === currentProjectId());
                if (file) setAddPersonFileDraftIds([file.id]);
                return Boolean(file);
            });
            if (staged)
            {
                await page.locator('.add-person-modal [data-close]').last().click();
                assert.equal(await page.locator('#addPersonDiscardOverlay').count(), 1);
                await page.locator('[data-add-person-discard]').click();
            }
            else await page.locator('.add-person-modal [data-close]').last().click();
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Add/Edit Person dismissal checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
