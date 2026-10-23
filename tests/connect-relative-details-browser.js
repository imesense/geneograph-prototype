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
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'ru']])
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
                const base = getPerson('silver');
                for (const [id, gender] of [['test-father', 'Male'], ['test-sibling', 'Female'],
                    ['test-partner', 'Unknown'], ['test-child', 'Unknown']])
                {
                    sampleData.people.push({ ...structuredClone(base), id, gender,
                        names: { ...base.names, display: id, first: id, last: 'Test' } });
                }
            }, language);

            await page.evaluate(() => openConnectRelativeModal('silver'));
            const modal = page.locator('.connect-person-modal');
            await modal.locator('[data-connect-relationship]').selectOption('parent');
            assert.deepEqual(await modal.locator('[data-connect-detail-type] option').evaluateAll(
                options => options.map(option => option.value)),
            ['Biological', 'Adoptive', 'Step', 'Foster', 'Guardian']);
            await page.evaluate(() => {
                connectPersonModalState.selectedPersonId = 'test-father';
                refreshConnectPersonModal();
            });
            assert.equal(await modal.locator('[data-connect-detail-type]').inputValue(), 'Adoptive');
            await modal.locator('[data-connect-detail-type]').selectOption('Biological');
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), true);
            await modal.locator('[data-connect-detail-type]').selectOption('Adoptive');
            assert.equal(await modal.locator('#connectPersonConfirm').isDisabled(), false);

            const result = await page.evaluate(() =>
            {
                const parent = connectPeopleByRelationship({ anchorPersonId: 'silver',
                    relativePersonId: 'test-father', relationshipType: 'parent', detailType: 'Adoptive' });
                const siblingChoice = parentFamilyChoices('silver', 'sibling')
                    .find(choice => choice.parentIds.length === 1 && choice.parentIds[0] === 'barnaby');
                const sibling = connectPeopleByRelationship({ anchorPersonId: 'silver',
                    relativePersonId: 'test-sibling', relationshipType: 'sibling',
                    parentFamilySelection: siblingChoice.value, detailType: 'Foster' });
                const partner = connectPeopleByRelationship({ anchorPersonId: 'test-sibling',
                    relativePersonId: 'test-partner', relationshipType: 'partner', detailType: 'Divorced',
                    partnerChildrenMode: PARTNER_CHILDREN_KEEP_SINGLE });
                const childChoice = parentFamilyChoices('test-sibling', 'child')
                    .find(choice => choice.family && choice.family.id === partner.family.id);
                const child = connectPeopleByRelationship({ anchorPersonId: 'test-sibling',
                    relativePersonId: 'test-child', relationshipType: 'child',
                    parentFamilySelection: childChoice.value, detailType: 'Step' });
                return {
                    ok: [parent.ok, sibling.ok, partner.ok, child.ok],
                    parentType: parentChildRelationshipType(parent.family, 'test-father', 'silver'),
                    siblingParents: parentIdsForPerson('test-sibling'),
                    siblingType: parentChildRelationshipType(sibling.family, 'barnaby', 'test-sibling'),
                    partnerType: partner.family.relationshipType,
                    partnerStatus: partner.family.relationshipStatus,
                    childTypes: ['test-sibling', 'test-partner'].map(id =>
                        parentChildRelationshipType(child.family, id, 'test-child'))
                };
            });
            assert.deepEqual(result.ok, [true, true, true, true]);
            assert.equal(result.parentType, 'Adoptive');
            assert.ok(result.siblingParents.includes('barnaby'));
            assert.ok(!result.siblingParents.includes('daisy'));
            assert.equal(result.siblingType, 'Foster');
            assert.equal(result.partnerType, 'Divorced');
            assert.equal(result.partnerStatus, 'divorced');
            assert.deepEqual(result.childTypes, ['Step', 'Step']);

            await page.evaluate(() => openConnectRelativeModal('silver'));
            await modal.locator('[data-connect-relationship]').selectOption('sibling');
            const oneParentChoice = await page.evaluate(() => parentFamilyChoices('silver', 'sibling')
                .find(choice => choice.parentIds.length === 1 && choice.parentIds[0] === 'barnaby').value);
            await modal.locator('#connectPersonParentFamily').selectOption(oneParentChoice);
            await modal.locator('[data-connect-detail-type]').selectOption('Guardian');
            await modal.locator('[data-connect-create-new]').click();
            assert.equal(await page.locator('#addPersonConnectionDetailType').inputValue(), 'Guardian');
            assert.equal(await page.locator('#addPersonParentFamily').inputValue(), oneParentChoice);

            await page.evaluate(() => openConnectRelativeModal('silver'));
            await modal.locator('[data-connect-relationship]').selectOption('parent');
            await modal.locator('[data-connect-create-new]').click();
            assert.equal(await page.locator('#addPersonConnectionDetailType').inputValue(), 'Adoptive');
            await page.locator('#addPersonFirstName').fill('Newly');
            await page.locator('#addPersonLastName').fill('Connected');
            await page.locator('[data-create-person]').click();
            assert.equal(await page.evaluate(() => {
                const person = sampleData.people.find(item => item.names?.first === 'Newly'
                    && item.names?.last === 'Connected');
                if (!person) return '';
                const family = centralFamilyRecords().find(item => familyIncludesPerson(item, person.id)
                    && unlinkFamilyChildrenIds(item).includes('silver'));
                return parentChildRelationshipType(family, person.id, 'silver');
            }), 'Adoptive');

            await page.evaluate(() => openConnectRelativeModal('test-father'));
            await modal.locator('[data-connect-relationship]').selectOption('partner');
            await modal.locator('[data-connect-detail-type]').selectOption('Divorced');
            await modal.locator('[data-connect-create-new]').click();
            assert.equal(await page.locator('[data-add-person-relationship-type]').inputValue(), 'Divorced');
            await page.locator('#addPersonFirstName').fill('Former');
            await page.locator('#addPersonLastName').fill('Partner');
            await page.locator('[data-create-person]').click();
            assert.equal(await page.evaluate(() => {
                const person = sampleData.people.find(item => item.names?.first === 'Former'
                    && item.names?.last === 'Partner');
                const family = person && getPartnerRelationshipBetween('test-father', person.id);
                return family?.relationshipType || '';
            }), 'Divorced');
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Connect relative details passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
