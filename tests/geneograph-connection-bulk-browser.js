const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const ids = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                const first = diagram.connections[0];
                const second = diagram.connections.find(connection => connection.id !== first.id);
                first.style = { width: 3, cornerRadius: 4 };
                second.style = { width: 5, pattern: 'dotted' };
                setGeneographSelection([], [first.id, second.id]);
                renderGeneographEditorPreserveScroll();
                if (window.innerWidth < 900) document.body.classList.add('mobile-details-open');
                return [first.id, second.id];
            }, language);
            const appearance = page.locator('#geneo-inspector-multi-appearance');
            assert.equal(await appearance.count(), 1);
            assert.equal(await appearance.locator('[data-geneo-connection-multi-width]').inputValue(), '');
            assert.equal(await appearance.locator('[data-geneo-connection-multi-pattern]').getAttribute('aria-label')
                .then(label => label.includes(language === 'en' ? 'Mixed' : 'Разн')), true);
            await appearance.locator('[data-geneo-connection-multi-width]').fill('7');
            await appearance.locator('[data-geneo-connection-multi-width]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                const connection = getGeneographConnection(id);
                return [connection.style.width, connection.style.pattern ?? null, connection.style.cornerRadius ?? null];
            }), ids), [[7, null, 4], [7, 'dotted', null]]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.width), ids), [3, 5]);
            await appearance.locator('[data-geneo-connection-multi-pattern]').click();
            await page.locator('#projectMenu [data-geneo-connector="alternating"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.pattern), ids), ['alternating', 'alternating']);
            await appearance.locator('[data-geneo-connection-multi-radius]').fill('12');
            await appearance.locator('[data-geneo-connection-multi-radius]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.cornerRadius), ids), [12, 12]);
            await appearance.locator('[data-geneo-connection-multi-hex]').fill('#aabbcc');
            await appearance.locator('[data-geneo-connection-multi-hex]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.line.color), ids), ['#AABBCC', '#AABBCC']);
            await appearance.locator('[data-geneo-connection-multi-opacity]').fill('42');
            await appearance.locator('[data-geneo-connection-multi-opacity]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.line.opacity), ids), [42, 42]);
            await appearance.locator('[data-geneo-connection-multi-paint-toggle]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.line.enabled), ids), [false, false]);
            await page.locator('[data-geneo-connection-multi-reset-default]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style), ids), [{}, {}]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.line.enabled), ids), [false, false]);

            const kinds = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const visual = diagram.connections.find(connection => connection.kind === 'visual');
                const partner = diagram.connections.find(connection => connection.kind === 'family-partner');
                const duplicate = (connection, suffix) => {
                    const copy = structuredClone(connection);
                    copy.id += suffix;
                    copy.style = {};
                    diagram.connections.push(copy);
                    return copy.id;
                };
                const visualIds = [visual.id, duplicate(visual, '-bulk')];
                const partnerIds = [partner.id, duplicate(partner, '-bulk')];
                setGeneographSelection([], visualIds);
                renderGeneographEditorPreserveScroll();
                return { visualIds, partnerIds };
            });
            assert.equal(await appearance.locator('[data-geneo-connection-multi-arrows]').count(), 4);
            assert.equal(await appearance.locator('[data-geneo-connection-multi-dates]').count(), 0);
            await appearance.locator('[data-geneo-connection-multi-arrows][value="both"]').check();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).style.arrows), kinds.visualIds), ['both', 'both']);
            await page.evaluate(ids => { setGeneographSelection([], ids); renderGeneographEditorPreserveScroll(); }, kinds.partnerIds);
            assert.equal(await appearance.locator('[data-geneo-connection-multi-arrows]').count(), 0);
            assert.equal(await appearance.locator('[data-geneo-connection-multi-dates]').count(), 1);
            await page.evaluate(id => {
                getGeneographConnection(id).showRelationshipDates = true;
                renderGeneographEditorPreserveScroll();
            }, kinds.partnerIds[0]);
            assert.equal(await appearance.locator('[data-geneo-connection-multi-dates]').evaluate(input => input.indeterminate), true);
            await appearance.locator('[data-geneo-connection-multi-dates]').check();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => geneoEffectiveShowRelationshipDates(getGeneographConnection(id))), kinds.partnerIds), [true, true]);
            await page.locator('[data-geneo-connection-multi-reset-default]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographConnection(id).showRelationshipDates), kinds.partnerIds), [undefined, undefined]);
            await page.evaluate(() => {
                selectedGeneographDiagram().connectionDefaults.showRelationshipDates = true;
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await appearance.locator('[data-geneo-connection-multi-dates]').isChecked(), true);
            await page.evaluate(id => {
                setGeneographSelection([selectedGeneographDiagram().nodes[0].id], [id]);
                renderGeneographEditorPreserveScroll();
            }, kinds.partnerIds[0]);
            assert.equal(await appearance.count(), 1);
            assert.equal(await page.locator('#geneo-inspector-multi-connectionAppearance').count(), 1);
            await page.evaluate(id => {
                selectedGeneographDiagram().connectionDefaults.showRelationshipDates = false;
                const connection = getGeneographConnection(id);
                connection.style = {};
                connection.showRelationshipDates = true;
                selectGeneographConnection(id);
                renderGeneographEditorPreserveScroll();
            }, kinds.partnerIds[0]);
            await page.locator('[data-geneo-connection-reset-default]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).showRelationshipDates, kinds.partnerIds[0]), undefined);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph bulk connection appearance passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
