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
            const ids = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                const shapes = [100, 150, 200].map((width, index) => {
                    const node = createGeneographShapeFromRect({ x: 3000 + index * 300, y: 3000 + index * 100, width, height: 100 });
                    node.x = [3000, 3300, 3700][index];
                    node.y = [3000, 3120, 3270][index];
                    node.width = width;
                    node.parentPanelId = null;
                    return node;
                });
                diagram.canvas.snapToGrid = true;
                setGeneographSelection(shapes.map(node => node.id), []);
                renderGeneographEditorPreserveScroll();
                if (window.innerWidth < 900) document.body.classList.add('mobile-details-open');
                return shapes.map(node => node.id);
            }, language);
            const arrange = page.locator('#geneo-inspector-multi-arrange');
            assert.equal(await arrange.count(), 1);
            assert.equal(await page.locator('.geneo-inspector-body').evaluate(body => {
                const selection = body.querySelector('#geneo-inspector-multi-selection');
                const arrangeSection = body.querySelector('#geneo-inspector-multi-arrange');
                return Boolean(selection && arrangeSection && (selection.compareDocumentPosition(arrangeSection) & Node.DOCUMENT_POSITION_FOLLOWING));
            }), true);
            const commands = arrange.locator('.geneo-bulk-arrange-button');
            assert.deepEqual(await commands.evaluateAll(buttons => buttons.map(button => button.dataset.geneoBulkArrange)),
                ['left', 'centerX', 'right', 'top', 'centerY', 'bottom', 'distributeX', 'distributeY']);
            assert.equal(await commands.evaluateAll(buttons => buttons.every(button => button.querySelector('svg')
                && !button.textContent.trim() && button.title === button.getAttribute('aria-label'))), true);
            assert.equal(await arrange.locator('[data-geneo-bulk-arrange="distributeX"]').getAttribute('aria-label'),
                await page.evaluate(() => t('Distribute horizontally')));
            assert.equal(await page.locator('.geneo-inspector').evaluate(inspector => {
                const right = inspector.getBoundingClientRect().right;
                return [...inspector.querySelectorAll('.geneo-bulk-arrange-button, .geneo-bulk-header-actions button')]
                    .every(button => button.getBoundingClientRect().right <= right + 1 && button.scrollWidth <= button.clientWidth + 1);
            }), true);
            assert.equal(await arrange.evaluate(section => {
                const layout = section.querySelector('.geneo-bulk-arrange-layout');
                const strips = layout.querySelectorAll('.geneo-bulk-command-strip');
                const bounds = layout.getBoundingClientRect();
                return Math.abs(strips[2].getBoundingClientRect().right - bounds.right) < 2
                    && [...strips].every(strip => strip.getBoundingClientRect().width > 50)
                    && [...layout.querySelectorAll('.geneo-bulk-arrange-button')].every(button => button.getBoundingClientRect().width >= 24);
            }), true);
            await arrange.locator('[data-geneo-bulk-arrange="distributeX"]').focus();
            await page.keyboard.press('Enter');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3000, 3325, 3700]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3000, 3300, 3700]);
            await page.evaluate(() => redoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3000, 3325, 3700]);
            await page.evaluate(() => undoGeneographChange());
            await arrange.locator('[data-geneo-bulk-arrange="centerX"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3400, 3375, 3350]);
            await arrange.locator('[data-geneo-bulk-arrange="left"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3350, 3350, 3350]);
            await arrange.locator('[data-geneo-bulk-arrange="right"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3450, 3400, 3350]);
            await arrange.locator('[data-geneo-bulk-arrange="top"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).y), ids), [3000, 3000, 3000]);
            await page.evaluate(ids => {
                ids.forEach((id, index) => { getGeneographNode(id).y = [3000, 3120, 3270][index]; });
                renderGeneographEditorPreserveScroll();
            }, ids);
            await arrange.locator('[data-geneo-bulk-arrange="distributeY"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).y), ids), [3000, 3135, 3270]);
            await arrange.locator('[data-geneo-bulk-arrange="centerY"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).y), ids), [3135, 3135, 3135]);
            await page.evaluate(ids => {
                ids.forEach((id, index) => { getGeneographNode(id).y = [3000, 3120, 3270][index]; });
                renderGeneographEditorPreserveScroll();
            }, ids);
            await arrange.locator('[data-geneo-bulk-arrange="bottom"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).y), ids), [3270, 3270, 3270]);
            await page.evaluate(ids => {
                setGeneographSelection(ids.slice(0, 2), []);
                renderGeneographEditorPreserveScroll();
            }, ids);
            assert.equal(await arrange.locator('[data-geneo-bulk-arrange="distributeX"]').isDisabled(), false);
            assert.equal(await arrange.locator('[data-geneo-bulk-arrange="distributeY"]').isDisabled(), false);
            await page.evaluate(ids => {
                ids.slice(0, 2).forEach(id => { getGeneographNode(id).x = 3000; getGeneographNode(id).y = 3000; });
                renderGeneographEditorPreserveScroll();
            }, ids);
            await arrange.locator('[data-geneo-bulk-arrange="distributeX"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.slice(0, 2).map(id => getGeneographNode(id).x), ids), [3000, 3120]);
            await arrange.locator('[data-geneo-bulk-arrange="distributeY"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.slice(0, 2).map(id => getGeneographNode(id).y), ids), [3000, 3120]);
            await page.evaluate(ids => {
                setGeneographSelection(ids, []);
                ids.forEach(id => { getGeneographNode(id).x = 3000; });
                renderGeneographEditorPreserveScroll();
            }, ids);
            await arrange.locator('[data-geneo-bulk-arrange="distributeX"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3000, 3120, 3290]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), ids), [3000, 3000, 3000]);
            await page.evaluate(ids => {
                ids.forEach((id, index) => { getGeneographNode(id).y = [3000, 3010, 3020][index]; });
                renderGeneographEditorPreserveScroll();
            }, ids);
            await arrange.locator('[data-geneo-bulk-arrange="distributeY"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).y), ids), [3000, 3120, 3240]);
            assert.equal(await arrange.evaluate(section => {
                const label = section.querySelector('.geneo-bulk-arrange-group .geneo-setting-label');
                const row = section.querySelector('.geneo-bulk-command-row');
                const groups = section.querySelectorAll('.geneo-bulk-arrange-group');
                return label.getBoundingClientRect().bottom < row.getBoundingClientRect().top
                    && row.querySelectorAll('.geneo-bulk-command-strip').length === 2
                    && Math.abs(groups[0].getBoundingClientRect().top - groups[1].getBoundingClientRect().top) < 1;
            }), true);
            const actions = page.locator('.geneo-bulk-header-actions');
            assert.equal(await actions.locator('button').count(), 2);
            assert.equal(await actions.locator('[data-geneo-bulk-action="hide"]').getAttribute('title'),
                await actions.locator('[data-geneo-bulk-action="hide"]').getAttribute('aria-label'));
            assert.equal(await actions.locator('[data-geneo-bulk-action="hide"]').getAttribute('aria-label'),
                await page.evaluate(() => t('Hide selected')));
            assert.equal(await actions.locator('button').first().evaluate(button => button.textContent.trim()), '');
            await actions.locator('[data-geneo-bulk-action="hide"]').focus();
            await page.keyboard.press('Enter');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).visible), ids), [false, false, false]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).visible), ids), [true, true, true]);
            await actions.locator('[data-geneo-bulk-action="lock"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).locked), ids), [true, true, true]);
            assert.equal(await arrange.count(), 0);
            await actions.locator('[data-geneo-bulk-action="unlock"]').click();
            await page.evaluate(ids => {
                getGeneographNode(ids[0]).visible = false;
                getGeneographNode(ids[0]).locked = true;
                renderGeneographEditorPreserveScroll();
            }, ids);
            assert.equal(await actions.locator('[data-geneo-bulk-action="show"]').count(), 1);
            assert.equal(await actions.locator('[data-geneo-bulk-action="unlock"]').count(), 1);
            await actions.locator('[data-geneo-bulk-action="show"]').click();
            await actions.locator('[data-geneo-bulk-action="unlock"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => [getGeneographNode(id).visible, getGeneographNode(id).locked]), ids),
                [[true, false], [true, false], [true, false]]);

            const panelIds = await page.evaluate(ids => {
                const diagram = selectedGeneographDiagram();
                const panel = diagram.nodes.find(node => node.type === 'panel');
                const child = getGeneographNode(ids[0]);
                panel.x = 4500; panel.y = 4500; panel.width = 400; panel.height = 300;
                child.parentPanelId = panel.id;
                child.x = 4520; child.y = 4540;
                getGeneographNode(ids[1]).x = 5000;
                setGeneographSelection([panel.id, child.id, ids[1]]);
                renderGeneographEditorPreserveScroll();
                return [panel.id, child.id, ids[1]];
            }, ids);
            assert.equal(await arrange.count(), 1);
            await arrange.locator('[data-geneo-bulk-arrange="right"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).x), panelIds), [4750, 4770, 5000]);
            await actions.locator('[data-geneo-bulk-action="hide"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).visible), panelIds), [false, false, false]);
            await actions.locator('[data-geneo-bulk-action="show"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).visible), panelIds), [true, true, true]);
            await page.evaluate(ids => {
                setGeneographSelection([ids[0]], [selectedGeneographDiagram().connections[0].id]);
                renderGeneographEditorPreserveScroll();
            }, ids);
            assert.equal(await actions.locator('[data-geneo-bulk-action="lock"]').count(), 1);
            assert.equal(await actions.locator('button').count(), 2);
            await actions.locator('[data-geneo-bulk-action="hide"]').click();
            assert.equal(await page.evaluate(() => selectedGeneographDiagram().connections[0].visible), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph bulk arrange and actions passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
