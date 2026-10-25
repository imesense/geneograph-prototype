const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                createGeneographShapeFromRect({ x: 2000, y: 2000, width: 180, height: 120 });
                createGeneographDrawingFromPoints([{ x: 2300, y: 2000 }, { x: 2400, y: 2080 }]);
                createGeneographPlaceNode({ scope: 'board', name: 'Bulk test place' });
                if (window.innerWidth < 900) document.body.classList.add('mobile-details-open');
            }, language);
            const appearance = page.locator('#geneo-inspector-multi-appearance');
            const selectPair = async type => page.evaluate(type => {
                const diagram = selectedGeneographDiagram();
                const first = diagram.nodes.find(node => node.type === type);
                if (!first) throw new Error(`Missing ${type} sample`);
                const second = structuredClone(first);
                second.id += '-bulk';
                second.x += 500;
                second.parentPanelId = null;
                diagram.nodes.push(second);
                first.appearance.strokeWidth = 2;
                second.appearance.strokeWidth = 4;
                if (type === 'person') {
                    first.appearance.styleOverrides.strokeWidth = true;
                    second.appearance.styleOverrides.strokeWidth = true;
                }
                setGeneographSelection([first.id, second.id]);
                renderGeneographEditorPreserveScroll();
                return [first.id, second.id];
            }, type);
            for (const type of ['image', 'place', 'panel', 'sticky', 'text', 'shape', 'drawing']) {
                const ids = await selectPair(type);
                assert.equal(await appearance.count(), 1, type);
                assert.equal(await appearance.locator('[data-geneo-bulk-appearance="strokeWidth"]').inputValue(), '', type);
                assert.equal(await appearance.locator('[data-geneo-bulk-paint-color="fill"]').count(), ['image', 'drawing'].includes(type) ? 0 : 1, type);
                assert.equal(await appearance.locator('[data-geneo-bulk-paint-color="text"]').count(), ['image', 'shape', 'drawing'].includes(type) ? 0 : 1, type);
                assert.equal(await appearance.locator('[data-geneo-bulk-appearance="cornerRadius"]').count(), type === 'drawing' ? 0 : 1, type);
                await appearance.locator('[data-geneo-bulk-appearance="strokeWidth"]').fill('8');
                await appearance.locator('[data-geneo-bulk-appearance="strokeWidth"]').press('Tab');
                assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.strokeWidth), ids), [8, 8], type);
                await page.evaluate(() => undoGeneographChange());
                assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.strokeWidth), ids), [2, 4], `${type} undo`);
                await appearance.locator('[data-geneo-bulk-paint-hex="stroke"]').fill('#123456');
                await appearance.locator('[data-geneo-bulk-paint-hex="stroke"]').press('Tab');
                assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.stroke.color), ids), ['#123456', '#123456'], type);
                if (type === 'sticky') {
                    await appearance.locator('[data-geneo-bulk-paint-opacity="stroke"]').fill('38');
                    await appearance.locator('[data-geneo-bulk-paint-opacity="stroke"]').press('Tab');
                    await appearance.locator('[data-geneo-bulk-appearance="strokePattern"]').selectOption('dashed');
                    await appearance.locator('[data-geneo-bulk-appearance="cornerRadius"]').fill('32');
                    await appearance.locator('[data-geneo-bulk-appearance="cornerRadius"]').press('Tab');
                    await appearance.locator('[data-geneo-bulk-paint-toggle="stroke"]').click();
                    assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                        const appearance = getGeneographNode(id).appearance;
                        return [appearance.stroke.opacity, appearance.stroke.enabled, appearance.strokePattern, appearance.cornerRadius];
                    }), ids), [[38, false, 'dashed', 32], [38, false, 'dashed', 32]]);
                }
                if (type === 'shape') {
                    await page.evaluate(ids => {
                        getGeneographNode(ids[0]).appearance.cornerRadius = 21;
                        getGeneographNode(ids[1]).appearance.cornerRadius = 27;
                    }, ids);
                    await appearance.locator('[data-geneo-bulk-shape-kind]').selectOption('ellipse');
                    assert.equal(await appearance.locator('[data-geneo-bulk-appearance="cornerRadius"]').count(), 0);
                    await appearance.locator('[data-geneo-bulk-shape-kind]').selectOption('rectangle');
                    assert.equal(await appearance.locator('[data-geneo-bulk-appearance="cornerRadius"]').count(), 1);
                    assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.cornerRadius), ids), [21, 27]);
                    await appearance.locator('[data-geneo-bulk-shape-kind]').selectOption('ellipse');
                }
                await page.locator('[data-geneo-bulk-node-reset]').click();
                assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance), ids),
                    await page.evaluate(type => [geneoNodeDefaults(type).appearance, geneoNodeDefaults(type).appearance], type), `${type} reset`);
                if (type === 'shape')
                    assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).shapeKind), ids), ['ellipse', 'ellipse']);
                await page.evaluate(ids => { selectedGeneographDiagram().nodes = selectedGeneographDiagram().nodes.filter(node => node.id !== ids[1]); }, ids);
            }
            const mixed = await page.evaluate(() => {
                const nodes = selectedGeneographDiagram().nodes;
                const person = nodes.find(node => node.type === 'person');
                const shape = nodes.find(node => node.type === 'shape');
                person.personCard = geneoEmptyPersonCardOverrides(true);
                person.personCard.style = 'compact';
                setGeneographSelection([person.id, shape.id]);
                renderGeneographEditorPreserveScroll();
                return [person.id, shape.id];
            });
            assert.equal(await appearance.locator('[data-geneo-bulk-paint-color="fill"]').count(), 1);
            assert.equal(await appearance.locator('[data-geneo-bulk-paint-color="text"]').count(), 0);
            await appearance.locator('[data-geneo-bulk-paint-hex="fill"]').fill('#456789');
            await appearance.locator('[data-geneo-bulk-paint-hex="fill"]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => geneoBulkNodeValue(getGeneographNode(id), 'fill', 'color')), mixed), ['#456789', '#456789']);
            await page.locator('[data-geneo-bulk-node-reset]').click();
            assert.equal(await page.evaluate(id => getGeneographNode(id).appearance.paintOverrides.fill, mixed[0]), false);
            assert.equal(await page.evaluate(id => getGeneographNode(id).personCard.style, mixed[0]), 'compact');
            await page.evaluate(id => {
                setGeneographSelection([id], [selectedGeneographDiagram().connections[0].id]);
                renderGeneographEditorPreserveScroll();
            }, mixed[0]);
            assert.equal(await appearance.count(), 1);
            assert.equal(await page.locator('#geneo-inspector-multi-connectionAppearance').count(), 1);
            assert.equal(await page.locator('[data-geneo-bulk-action="lock"]').count(), 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph bulk object appearance passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
