const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');
(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language, context] of [[1280, 'en', 'tree'], [390, 'ru', 'people'], [320, 'en', 'tree']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(({ language, context }) => {
                activateProject('p1', { moduleName: context === 'tree' ? 'Family Tree' : 'People' });
                setLanguage(language, false);
                const person = structuredClone(sampleData.people.find(person => person.projectId === 'p1'));
                person.id = 'empty-relative-person'; person.names = { first: 'Empty', middle: '', last: 'Person', maiden: '', display: 'Empty Person', initials: 'EP' };
                sampleData.people.push(person);
                openManageRelationshipsModal(person.id, context);
            }, { language, context });
            assert.equal(await page.locator('.manage-relationships-modal.is-empty').count(), 1);
            assert.equal(await page.locator('.manage-relationships-rail').count(), 0);
            assert.equal(await page.locator('.manage-relationships-empty h3').evaluate(el => getComputedStyle(el).fontSize), '16px');
            assert.equal(await page.locator('.manage-relationships-modal').evaluate(el => el.getBoundingClientRect().height < 600 && el.scrollWidth <= el.clientWidth + 1), true);
            await page.locator('[data-manage-connect-existing]').click();
            assert.equal(await page.locator('.connect-person-modal').count(), 1);
            await page.locator('.connect-person-modal [data-close]').first().click();
            await page.waitForSelector('.manage-relationships-modal.is-empty');
            await page.locator('[data-manage-connect-existing]').click();
            await page.locator('[data-connect-relationship]').selectOption('child');
            await page.locator('[data-connect-create-new]').click();
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            assert.equal(await page.locator('.manage-relationships-modal').count(), 0);
            await page.locator('.add-person-modal [data-close]').first().click();
            await page.waitForSelector('.manage-relationships-modal.is-empty');
            await page.locator('[data-manage-add-relative]').click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.manage-relationships-modal.is-empty').count(), 1);
            await page.locator('[data-manage-add-relative]').click();
            await page.locator('[data-manage-relative="child"]').click();
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            await page.locator('.add-person-modal [data-close]').first().click();
            await page.waitForSelector('.manage-relationships-modal.is-empty');
            await page.locator('[data-manage-add-relative]').click();
            await page.locator('[data-manage-relative="child"]').click();
            await page.locator('#addPersonFirstName').fill('Created Child');
            if (width === 1280) await page.locator('#addPersonCreateAnother').check();
            await page.locator('[data-create-person]').click();
            if (width === 1280) {
                await page.waitForFunction(() => document.querySelector('#addPersonFirstName')?.value === '');
                assert.equal(await page.locator('.manage-relationships-modal').count(), 0);
                await page.locator('.add-person-modal [data-close]').first().click();
            }
            await page.waitForSelector('.manage-relationships-choice.is-selected');
            assert.equal(await page.locator('.manage-relationships-modal.is-empty').count(), 0);
            const createdId = await page.evaluate(() => sampleData.people.find(person => person.names.first === 'Created Child').id);
            assert.ok((await page.locator('.manage-relationships-choice.is-selected').getAttribute('data-manage-select')).includes(createdId));
            assert.equal(await page.evaluate(() => getRelationshipGroups('empty-relative-person').flatMap(group => group.items).length), 1);
            if (width === 1280) {
                await page.evaluate(() => {
                    const person = structuredClone(getPerson('empty-relative-person'));
                    person.id = 'empty-relative-two'; person.names.display = 'Second Person';
                    sampleData.people.push(person);
                    openManageRelationshipsModal(person.id, 'tree');
                });
                for (const category of ['parent', 'partner', 'sibling']) {
                    await page.locator('[data-manage-add-relative]').click();
                    await page.locator(`[data-manage-relative="${category}"]`).click();
                    assert.equal(await page.locator('.add-person-modal').count(), 1);
                    await page.locator('.add-person-modal [data-close]').first().click();
                    await page.waitForSelector('.manage-relationships-modal.is-empty');
                }
                await page.locator('[data-manage-connect-existing]').click();
                await page.locator('[data-connect-relationship]').selectOption('partner');
                await page.locator('[data-connect-search]').fill('Silver');
                await page.locator('[data-connect-person-result="silver"]').click();
                await page.locator('#connectPersonConfirm').click();
                await page.waitForSelector('.manage-relationships-choice.is-selected');
                assert.ok((await page.locator('.manage-relationships-choice.is-selected').getAttribute('data-manage-select')).includes('silver'));
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Manage relationships empty state passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
