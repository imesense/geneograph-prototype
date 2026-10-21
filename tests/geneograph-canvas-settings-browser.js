const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                state.geneoInspectorCollapsed = false;
                state.selectedGeneoNodeId = '';
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();
            }, language);
            if (width === 320) await page.evaluate(() => document.body.classList.add('mobile-details-open'));
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:appearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:cardAppearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:personCards"]').count(), 1);
            for (const section of ['appearance', 'cardAppearance', 'personCards']) {
                const toggle = inspector.locator(`[data-geneo-inspector-section="canvas:${section}"]`);
                if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
            }
            assert.equal(await inspector.locator('.geneo-pattern-preview').count(), 3);
            assert.equal(await inspector.locator('[data-geneo-person-card-field="linkIndicator"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-card-setting="photoSize"]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-setting="photoAlignment"]:not(:disabled)').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-card-field="livingStatus"]').count(), 0);
            assert.equal(await page.evaluate(() =>
                geneoResolveVisibleNodeAppearance(getGeneographNode('gn-daisy')).fill.color), '#2D2437');
            if (process.env.GENEO_SCREENSHOT_DIR)
                await inspector.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `canvas-${language}-${width}.png`) });
            const columns = await inspector.locator('.geneo-person-card-options').evaluate(element =>
                getComputedStyle(element).gridTemplateColumns);
            assert.equal(columns.trim().split(/\s+/).length, width === 320 ? 1 : 2, columns);

            await inspector.locator('[data-geneo-background-pattern="grid"]').click();
            assert.equal(await inspector.locator('[data-geneo-background-pattern="grid"]').getAttribute('aria-pressed'), 'true');
            assert.equal(await page.locator('.geneo-board-space.pattern-grid').count(), 1);
            await inspector.locator('[data-geneo-object-highlight]').selectOption('image');
            assert.equal(await page.locator('.geneo-node-person.geneo-object-dimmed').count() > 0, true);
            for (const type of ['person', 'linked', 'unlinked', 'place', 'sticky', 'text', 'shape', 'drawing', 'panel']) {
                await inspector.locator('[data-geneo-object-highlight]').selectOption(type);
                assert.equal(await page.evaluate(() => geneoCanvasRuntime.objectHighlight), type);
                assert.equal(await page.locator('.geneo-object-dimmed').count() > 0, true);
            }
            await inspector.locator('[data-geneo-object-highlight]').selectOption('none');
            assert.equal(await page.locator('.geneo-object-dimmed').count(), 0);

            const neutral = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const template = diagram.nodes.find(item => item.type === 'person');
                const node = structuredClone(template);
                node.id = 'test-inherited-card';
                node.appearance.paintOverrides = { fill: false, stroke: false, text: false };
                node.appearance.styleOverrides = { strokeWidth: false, strokePattern: false };
                const genderNode = structuredClone(node);
                genderNode.id = 'test-gender-card';
                diagram.nodes.push(node, genderNode);
                const original = geneoResolveVisibleNodeAppearance(node).fill.color;
                commitGeneoPaintAction({ scope: 'card-default', id: 'neutral', property: 'fill' },
                    target => { target.paint.color = '#366A58'; });
                const changed = geneoResolveVisibleNodeAppearance(node).fill.color;
                commitGeneoPaintAction({ scope: 'node', id: node.id, property: 'fill' },
                    target => { target.paint.color = '#B45A32'; });
                commitGeneoPaintAction({ scope: 'card-default', id: 'neutral', property: 'fill' },
                    target => { target.paint.color = '#246C63'; });
                return { original, changed, custom: geneoResolveVisibleNodeAppearance(node).fill.color };
            });
            assert.equal(neutral.changed, '#366A58');
            assert.equal(neutral.custom, '#B45A32');
            await page.evaluate(() => renderGeneographEditorPreserveScroll());
            await inspector.locator('[data-geneo-person-gender-colors]').check();
            assert.equal(await inspector.locator('.geneo-card-default-group').count(), 3);
            if (process.env.GENEO_SCREENSHOT_DIR) {
                await inspector.evaluate(element => { element.scrollTop = 580; });
                await inspector.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `appearance-${language}-${width}.png`) });
            }
            const genderDefaults = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const node = diagram.nodes.find(item => item.id === 'test-gender-card');
                const person = diagram.people.find(item => item.id === node.personId);
                const result = {};
                for (const gender of ['male', 'female', 'unknown']) {
                    person.gender = gender;
                    result[gender] = geneoResolveVisibleNodeAppearance(node).fill.color;
                }
                const board = structuredClone(selectedGeneographBoard());
                normalizeGeneographBoardRecord(board, new Map([[board.projectId, new Set()]]));
                result.roundTrip = board.diagram.cardAppearanceDefaults.male.fill.color;
                return result;
            });
            assert.deepEqual(genderDefaults, {
                male: '#172A32', female: '#2D2437', unknown: '#173029', roundTrip: '#172A32'
            });
            await inspector.locator('[data-geneo-card-default-stroke-width="male"]').fill('5');
            await inspector.locator('[data-geneo-card-default-stroke-width="male"]').dispatchEvent('change');
            await inspector.locator('[data-geneo-card-default-radius="female"]').fill('14');
            await inspector.locator('[data-geneo-card-default-radius="female"]').dispatchEvent('change');
            assert.deepEqual(await page.evaluate(() => [
                selectedGeneographDiagram().cardAppearanceDefaults.male.strokeWidth,
                selectedGeneographDiagram().cardAppearanceDefaults.female.cornerRadius
            ]), [5, 14]);
            assert.deepEqual(await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const node = diagram.nodes.find(item => item.id === 'test-gender-card');
                const person = diagram.people.find(item => item.id === node.personId);
                person.gender = 'female';
                const inherited = geneoNodeCornerRadius(node);
                node.personCard.custom = true;
                node.personCard.cornerRadius = 8;
                return [inherited, geneoNodeCornerRadius(node)];
            }), [14, 8]);
            assert.equal(await inspector.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
            await inspector.locator('[data-geneo-reset-canvas-defaults]').click();
            assert.equal(await inspector.locator('.geneo-card-default-group').count(), 1);
            assert.equal(await page.locator('.geneo-board-space.pattern-dots').count(), 1);
            assert.equal(await page.evaluate(() => {
                const node = selectedGeneographDiagram().nodes.find(item => item.id === 'test-inherited-card');
                return geneoResolveVisibleNodeAppearance(node).fill.color;
            }), '#B45A32');
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await inspector.locator('.geneo-card-default-group').count(), 3);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph canvas settings passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
