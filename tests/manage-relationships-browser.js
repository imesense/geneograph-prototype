const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[320, 'ru'], [390, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 760 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'People';
                state.language = language;
                render();
                openManageRelationshipsModal('silver', 'people');
            }, language);
            const manager = page.locator('.manage-relationships-modal');
            assert.deepEqual(await page.evaluate(() => [
                parentRelationLabel({ gender: 'unknown', parentRole: 'father' }),
                parentRelationLabel({ gender: 'unknown', parentRole: 'mother' }),
                parentRelationLabel({ parentRole: 'father' }),
                parentRelationLabel({ gender: 'male', parentRole: 'mother' }),
                parentRelationLabel({ gender: 'female', parentRole: 'father' })
            ]), ['Parent', 'Parent', 'Parent', 'Father', 'Mother']);
            assert.equal(await manager.count(), 1);
            await manager.locator('[data-manage-select^="partner:"]').first().click();
            const unlink = manager.locator('.manage-relationships-detail-head [data-manage-unlink]');
            assert.equal(await unlink.count(), 1);
            assert.equal(await manager.locator('.manage-relationships-footer [data-manage-unlink]').count(), 0);
            assert.match(await unlink.getAttribute('aria-label'), /Luna|Луна/);
            assert.ok((await unlink.boundingBox()).height >= 44);
            const restingColor = await unlink.evaluate(element => getComputedStyle(element).color);
            await unlink.hover();
            assert.notEqual(await unlink.evaluate(element => getComputedStyle(element).color), restingColor);
            await unlink.focus();
            assert.notEqual(await unlink.evaluate(element => getComputedStyle(element).color), restingColor);
            assert.equal((await unlink.innerText()).trim(), language === 'ru' ? 'Удалить связь' : 'Unlink');
            if (process.env.GENEO_SCREENSHOT_DIR)
                await manager.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `manage-relationships-${width}.png`) });
            assert.equal(await manager.locator('[data-manage-save]').isDisabled(), true);
            await manager.locator('#relationshipEditType').selectOption('Unmarried partner');
            assert.equal(await manager.locator('[data-manage-save]').isEnabled(), true);
            await manager.locator('[data-manage-select^="child:"]').first().click();
            assert.equal(await page.locator('#manageRelationshipsDiscardOverlay').count(), 1);
            await page.locator('[data-manage-continue-editing]').click();
            assert.equal(await manager.locator('#relationshipEditType').inputValue(), 'Unmarried partner');
            await manager.locator('[data-manage-save]').click();
            assert.equal(await page.evaluate(() => getPartnerRelationshipBetween('silver', 'luna')?.relationshipType), 'Unmarried partner');
            await manager.locator('[data-manage-select^="parent:"]').first().click();
            const parentKey = await manager.locator('[data-manage-select^="parent:"].is-selected').getAttribute('data-manage-select');
            const parentName = await page.evaluate(id => translateText(relationshipEditPersonName(id)), parentKey.split(':')[1]);
            const childName = await page.evaluate(() => translateText(relationshipEditPersonName('silver')));
            assert.equal((await manager.locator('label[for="relationshipEditParentChildType"]').innerText()).trim(),
                language === 'ru' ? 'Тип отношений' : 'Relationship type');
            const parentDescription = (await manager.locator('.manage-relationships-fields .panel-muted').innerText()).trim();
            assert.ok(parentDescription.includes(parentName) && parentDescription.includes(childName));
            assert.match(parentDescription, language === 'ru' ? /Они останутся связаны в семейном дереве\./ : /They will stay connected in the Family Tree\./);
            await manager.locator('#relationshipEditParentChildType').selectOption('Adoptive');
            await manager.locator('[data-manage-select^="child:"]').first().click();
            await page.locator('[data-manage-discard]').click();
            assert.equal(await manager.locator('[data-manage-select^="child:"].is-selected').count(), 1);
            const childKey = await manager.locator('[data-manage-select^="child:"].is-selected').getAttribute('data-manage-select');
            const relatedChildName = await page.evaluate(id => translateText(relationshipEditPersonName(id)), childKey.split(':')[1]);
            const childDescription = (await manager.locator('.manage-relationships-fields .panel-muted').innerText()).trim();
            assert.ok(childDescription.includes(childName) && childDescription.includes(relatedChildName));
            assert.ok(await manager.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            await manager.locator('[data-manage-select^="parent:"]').first().click();
            await manager.locator('#relationshipEditParentChildType').selectOption('Adoptive');
            await manager.locator('[data-manage-save]').click();
            assert.equal(await manager.locator('#relationshipEditParentChildType').inputValue(), 'Adoptive');
            await manager.locator('[data-manage-select^="partner:"]').first().click();
            assert.ok(await manager.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            await manager.locator('#relationshipEditType').selectOption('Married');
            await manager.locator('[data-manage-unlink]').click();
            assert.equal(await page.locator('#manageRelationshipsDiscardOverlay').count(), 1);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#manageRelationshipsDiscardOverlay').count(), 0);
            await manager.locator('[data-manage-unlink]').click();
            await page.locator('[data-manage-discard]').click();
            const confirm = page.locator('.unlink-relationship-modal');
            assert.equal(await confirm.count(), 1);
            assert.equal(await confirm.locator('[data-confirm-unlink-relationship]').isDisabled(), true);
            await confirm.locator('[data-close]').last().click();
            assert.equal(await manager.count(), 1);
            assert.equal(await page.evaluate(() => Boolean(getPartnerRelationshipBetween('silver', 'luna'))), true);
            await manager.locator('[data-manage-unlink]').click();
            await confirm.locator('input[name="unlinkKeepChildrenWith"][value="silver"]').check();
            await confirm.locator('[data-confirm-unlink-relationship]').click();
            assert.equal(await manager.count(), 1);
            assert.equal(await page.evaluate(() => Boolean(getPartnerRelationshipBetween('silver', 'luna'))), false);
            assert.equal(await manager.locator('[data-manage-select^="partner:"]').count(), 0);
            await manager.locator('[data-close]').last().click();
            await page.evaluate(() =>
            {
                state.selectedPeopleId = 'oliver';
                state.selectedPersonId = 'oliver';
                renderPeople();
                openManageRelationshipsModal('oliver', 'people');
            });
            await manager.locator('[data-manage-select^="sibling:"]').first().click();
            assert.ok(await manager.locator('[data-manage-parent-link]').count() > 0);
            await manager.locator('[data-manage-parent-link]').first().click();
            assert.equal(await manager.locator('[data-manage-select^="parent:"].is-selected').count(), 1);
            await manager.locator('[data-close]').last().click();
            if (width <= 900) await page.evaluate(() => openMobileSurface('details'));
            await page.locator('#familyMoreActions').click();
            await page.locator('[data-people-action="relationships"]').click();
            assert.equal(await manager.count(), 1);
            await manager.locator('[data-close]').last().click();
            await page.evaluate(() =>
            {
                state.inspectorSections.relationships = true;
                renderPeople();
                if (innerWidth <= 900) openMobileSurface('details');
            });
            if (width > 900)
            {
                await page.locator('[data-manage-relationships]').click();
                assert.equal(await manager.count(), 1);
            }
            await page.evaluate(() =>
            {
                const item = getRelationshipGroups('silver').flatMap(group => group.items).find(candidate => candidate.kind === 'parent');
                openRelationshipEditModal({ ...item, personId: 'silver', sidebarContext: 'people' });
            });
            const editor = page.locator('.relationship-edit-modal');
            assert.equal((await editor.locator('label[for="relationshipEditParentChildType"]').innerText()).trim(),
                language === 'ru' ? 'Тип отношений' : 'Relationship type');
            const editorDescription = (await editor.locator('.panel-muted').innerText()).trim();
            assert.ok(editorDescription.includes(parentName) && editorDescription.includes(childName));
            assert.ok(await editor.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
