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
        for (const [width, language] of [[320, 'ru'], [390, 'ru'], [1280, 'en']])
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
            const initialGender = await page.locator('#addPersonGender').inputValue();
            assert.deepEqual(await page.locator('.add-person-name-fields input').evaluateAll(inputs =>
                inputs.map(input => input.id)),
            ['addPersonFirstName', 'addPersonMiddleName', 'addPersonLastName', 'addPersonMaidenName']);
            const identityGroups = await page.locator('.add-person-demographics, .add-person-name-fields')
                .evaluateAll(groups => groups.map(group => ({
                    top: group.getBoundingClientRect().top,
                    bottom: group.getBoundingClientRect().bottom,
                    background: getComputedStyle(group).backgroundColor
                })));
            assert.ok(identityGroups[1].top - identityGroups[0].bottom >= 20);
            assert.equal(identityGroups[0].background, 'rgba(0, 0, 0, 0)');
            assert.equal(await page.locator('#addPersonMaidenName').isVisible(), false);
            await page.locator('#addPersonGender').selectOption('Female');
            assert.equal(await page.locator('#addPersonMaidenName').isVisible(), true);
            const namePositions = await page.locator('.add-person-name-fields input').evaluateAll(inputs =>
                Object.fromEntries(inputs.map(input => [input.id, {
                    top: Math.round(input.getBoundingClientRect().top),
                    left: Math.round(input.getBoundingClientRect().left)
                }])));
            assert.ok(namePositions.addPersonFirstName.top < namePositions.addPersonMiddleName.top);
            if (width > 600)
            {
                assert.equal(namePositions.addPersonFirstName.top, namePositions.addPersonLastName.top);
                assert.equal(namePositions.addPersonMiddleName.top, namePositions.addPersonMaidenName.top);
            }
            else
            {
                assert.ok(namePositions.addPersonLastName.top < namePositions.addPersonMiddleName.top);
                assert.ok(namePositions.addPersonMiddleName.top < namePositions.addPersonMaidenName.top);
            }
            await first.focus();
            assert.equal(await page.evaluate(() => document.activeElement?.id), 'addPersonFirstName');
            for (const id of ['addPersonMiddleName', 'addPersonLastName', 'addPersonMaidenName'])
            {
                await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(() => document.activeElement?.id), id);
            }
            await page.keyboard.press('Shift+Tab');
            assert.equal(await page.evaluate(() => document.activeElement?.id), 'addPersonLastName');
            await page.locator('#addPersonGender').selectOption(initialGender);
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
            assert.deepEqual(await page.locator('.add-person-name-fields input').evaluateAll(inputs =>
                inputs.map(input => input.id)),
            ['addPersonFirstName', 'addPersonMiddleName', 'addPersonLastName', 'addPersonMaidenName']);
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
