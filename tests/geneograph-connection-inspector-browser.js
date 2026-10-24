const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1440, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const id = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const partner = selectedGeneographDiagram().connections.find(item => item.kind === 'family-partner');
                selectGeneographConnection(partner.id);
                renderGeneographEditorPreserveScroll();
                return partner.id;
            }, language);
            if (width < 900) await page.evaluate(() => document.body.classList.add('mobile-details-open'));
            assert.equal(await page.locator('[data-geneo-inspector-section="connection:connection"]').count(), 0);
            assert.equal(await page.locator('[data-geneo-header-lock]').count(), 0);
            assert.equal(await page.locator('[data-geneo-header-rename]').count(), 1);
            assert.equal(await page.locator('[data-geneo-header-visible]').count(), 1);
            assert.equal(await page.locator('[data-geneo-save-relationship]').count(), 0);
            assert.equal(await page.locator('.geneo-relationship-storage').count(), 0);
            await page.locator('[data-geneo-header-rename]').click();
            await page.locator('[data-geneo-header-name-input]').fill('Test relationship');
            await page.locator('[data-geneo-header-name-input]').press('Escape');
            assert.notEqual(await page.evaluate(id => getGeneographConnection(id).name, id), 'Test relationship');
            await page.locator('[data-geneo-header-rename]').click();
            await page.locator('[data-geneo-header-name-input]').fill('Test relationship');
            await page.locator('[data-geneo-header-name-input]').press('Enter');
            assert.equal(await page.evaluate(id => getGeneographConnection(id).name, id), 'Test relationship');
            await page.locator('[data-geneo-header-visible]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, id), false);
            assert.equal(await page.locator(`[data-geneo-connection-group="${id}"]`).count(), 0);
            assert.equal(await page.locator(`[data-geneo-layer-connection="${id}"] [data-geneo-toggle-connection-visible]`).evaluate(button => button.getAttribute('aria-label').startsWith(t('Show'))), true);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, id), true);
            await page.locator('[data-geneo-header-visible]').click();
            await page.locator(`[data-geneo-layer-connection="${id}"]`).evaluate(row => row.click());
            await page.locator('[data-geneo-header-visible]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, id), true);
            const otherIds = await page.evaluate(() => selectedGeneographDiagram().connections
                .filter(item => item.kind !== 'family-partner')
                .filter((item, index, all) => all.findIndex(candidate => candidate.kind === item.kind) === index)
                .map(item => item.id));
            for (const otherId of otherIds) {
                await page.evaluate(id => {
                    selectGeneographConnection(id);
                    renderGeneographEditorPreserveScroll();
                }, otherId);
                await page.locator('[data-geneo-header-visible]').click();
                assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, otherId), false);
                await page.locator('[data-geneo-header-visible]').click();
                assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, otherId), true);
            }
            await page.evaluate(id => {
                selectGeneographConnection(id);
                renderGeneographEditorPreserveScroll();
            }, id);
            const editor = page.locator('[data-geneo-relationship-editor]');
            assert.equal(await editor.locator('[data-geneo-show-relationship-dates]').count(), 0);
            const dateToggle = page.locator('#geneo-inspector-connection-appearance .geneo-check.geneo-connection-date-default [data-geneo-show-relationship-dates]');
            assert.equal(await dateToggle.count(), 1);
            const dateToggleStyle = await dateToggle.evaluate(input => {
                const style = getComputedStyle(input.closest('label'));
                return [style.fontSize, style.fontWeight];
            });
            const canvasToggleStyle = await page.evaluate(() => {
                const label = document.createElement('label');
                label.className = 'geneo-check geneo-connection-date-default';
                document.body.appendChild(label);
                const style = getComputedStyle(label);
                const result = [style.fontSize, style.fontWeight];
                label.remove();
                return result;
            });
            assert.deepEqual(dateToggleStyle, canvasToggleStyle);
            const labelStyle = await editor.locator('.genealogy-date-field > label').first().evaluate(label => {
                const style = getComputedStyle(label);
                return [style.fontSize, style.fontWeight];
            });
            assert.deepEqual(labelStyle, ['12px', '700']);
            const before = await editor.locator('[data-geneo-relationship-type]').inputValue();
            await editor.locator('[data-geneo-relationship-type]').focus();
            await editor.locator('[data-geneo-relationship-type]').selectOption(before === 'Separated' ? 'Married' : 'Separated');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'geneoRelationshipType');
            assert.equal(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                return relationshipTypeFromLegacy(geneoRelationshipForFamily(family).relationship);
            }, id), before === 'Separated' ? 'Married' : 'Separated');
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                return relationshipTypeFromLegacy(geneoRelationshipForFamily(family).relationship);
            }, id), before);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                return relationshipTypeFromLegacy(geneoRelationshipForFamily(family).relationship);
            }, id), before === 'Separated' ? 'Married' : 'Separated');
            const dateBefore = await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                const relationship = geneoRelationshipForFamily(family).relationship;
                return JSON.stringify(partnerRelationshipStartEvent(relationship,
                    relationshipTypeFromLegacy(relationship))?.date || null);
            }, id);
            const dateInput = page.locator('#geneoRelationshipStartDateInput');
            await dateInput.fill('not a date');
            await dateInput.press('Tab');
            assert.equal(await page.locator('#geneoRelationshipStartDateInput').inputValue(), 'not a date');
            assert.equal(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                const relationship = geneoRelationshipForFamily(family).relationship;
                return JSON.stringify(partnerRelationshipStartEvent(relationship,
                    relationshipTypeFromLegacy(relationship))?.date || null);
            }, id), dateBefore);
            await dateInput.fill('14 Feb 1915');
            await dateInput.press('Tab');
            assert.notEqual(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                const relationship = geneoRelationshipForFamily(family).relationship;
                return JSON.stringify(partnerRelationshipStartEvent(relationship,
                    relationshipTypeFromLegacy(relationship))?.date || null);
            }, id), dateBefore);
            await page.evaluate(() => {
                const parsed = parseGenealogyDateTextAsType('21 Mar 1920', 'Exact date');
                applyGenealogyDateToField('geneoRelationshipStartDate', parsed.value);
            });
            assert.match(await page.locator('#geneoRelationshipStartDateInput').inputValue(), /1920/);
            await page.locator('#geneoRelationshipStartPlace').fill('Test Place');
            await page.locator('#geneoRelationshipStartPlace').press('Tab');
            assert.equal(await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                const relationship = geneoRelationshipForFamily(family).relationship;
                return partnerRelationshipStartEvent(relationship,
                    relationshipTypeFromLegacy(relationship))?.placeText;
            }, id), 'Test Place');
            await page.evaluate(id => {
                const family = getGeneographFamily(getGeneographConnection(id).familyId);
                family.partnerIds.forEach(personId => { getGeneographPerson(personId).treePersonId = null; });
                renderGeneographEditorPreserveScroll();
            }, id);
            const boardTypeBefore = await page.locator('[data-geneo-relationship-type]').inputValue();
            await page.locator('[data-geneo-relationship-type]').selectOption(boardTypeBefore === 'Married' ? 'Separated' : 'Married');
            assert.notEqual(await page.evaluate(id => getGeneographFamily(getGeneographConnection(id).familyId).relationshipType, id), boardTypeBefore);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => getGeneographFamily(getGeneographConnection(id).familyId).relationshipType, id), boardTypeBefore);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph connection inspector passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
