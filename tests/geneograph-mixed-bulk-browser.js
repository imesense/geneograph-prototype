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
                const first = createGeneographShapeFromRect({ x: 3000, y: 3000, width: 120, height: 100 });
                const second = createGeneographShapeFromRect({ x: 3100, y: 3000, width: 120, height: 100 });
                first.appearance.strokeWidth = 4;
                const connection = selectedGeneographDiagram().connections.find(item => item.kind === 'visual')
                    || selectedGeneographDiagram().connections[0];
                connection.style = { width: 5 };
                setGeneographSelection([first.id], [connection.id]);
                renderGeneographEditorPreserveScroll();
                if (window.innerWidth < 900) document.body.classList.add('mobile-details-open');
                return { first: first.id, second: second.id, connection: connection.id };
            }, language);
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('.geneo-selection-group').count(), 2);
            assert.equal(await inspector.locator('.geneo-mixed-selection-scope').count(), 2);
            assert.equal(await inspector.locator('#geneo-inspector-multi-appearance').count(), 1);
            assert.equal(await inspector.locator('#geneo-inspector-multi-connectionAppearance').count(), 1);
            assert.equal(await inspector.evaluate(element => {
                const right = element.getBoundingClientRect().right;
                return [...element.querySelectorAll('.geneo-mixed-selection-scope input, .geneo-mixed-selection-scope button')]
                    .every(control => control.getBoundingClientRect().right <= right + 1);
            }), true);
            assert.equal(await inspector.locator('[data-geneo-bulk-node-reset]').isDisabled(), false);
            assert.equal(await inspector.locator('[data-geneo-connection-multi-reset-default]').isDisabled(), false);
            assert.equal(await inspector.locator('.geneo-bulk-header-actions [data-geneo-bulk-action="lock"]').getAttribute('title'),
                await page.evaluate(() => t('Lock selected objects')));

            await inspector.locator('[data-geneo-bulk-appearance="strokeWidth"]').fill('8');
            await inspector.locator('[data-geneo-bulk-appearance="strokeWidth"]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => [getGeneographNode(ids.first).appearance.strokeWidth,
                getGeneographConnection(ids.connection).style.width], ids), [8, 5]);
            await inspector.locator('[data-geneo-connection-multi-width]').fill('7');
            await inspector.locator('[data-geneo-connection-multi-width]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => [getGeneographNode(ids.first).appearance.strokeWidth,
                getGeneographConnection(ids.connection).style.width], ids), [8, 7]);
            await inspector.locator('[data-geneo-bulk-node-reset]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).style.width, ids.connection), 7);
            await inspector.locator('[data-geneo-connection-multi-reset-default]').click();
            assert.deepEqual(await page.evaluate(ids => getGeneographConnection(ids.connection).style, ids), {});
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => getGeneographConnection(id).style.width, ids.connection), 7);

            await inspector.locator('.geneo-bulk-header-actions [data-geneo-bulk-action="lock"]').click();
            assert.deepEqual(await page.evaluate(ids => [getGeneographNode(ids.first).locked,
                getGeneographConnection(ids.connection).locked], ids), [true, undefined]);
            await inspector.locator('.geneo-bulk-header-actions [data-geneo-bulk-action="unlock"]').click();
            await page.evaluate(ids => {
                setGeneographSelection([ids.first, ids.second], [ids.connection]);
                renderGeneographEditorPreserveScroll();
            }, ids);
            assert.equal(await inspector.locator('#geneo-inspector-multi-arrange').count(), 1);
            await inspector.locator('[data-geneo-bulk-arrange="distributeX"]').click();
            assert.deepEqual(await page.evaluate(ids => [getGeneographNode(ids.first).x,
                getGeneographNode(ids.second).x], ids), [3000, 3140]);
            await inspector.locator('.geneo-bulk-header-actions [data-geneo-bulk-action="hide"]').click();
            assert.deepEqual(await page.evaluate(ids => [getGeneographNode(ids.first).visible,
                getGeneographNode(ids.second).visible, getGeneographConnection(ids.connection).visible], ids),
                [false, false, false]);
            await page.evaluate(() => undoGeneographChange());
            const personId = await page.evaluate(ids => {
                const person = selectedGeneographDiagram().nodes.find(node => node.type === 'person');
                setGeneographSelection([person.id], [ids.connection]);
                renderGeneographEditorPreserveScroll();
                return person.id;
            }, ids);
            assert.equal(await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').count(), 1);
            assert.equal(await inspector.locator('#geneo-inspector-multi-personCards').count(), 1);
            const connectionWidth = await page.evaluate(id => getGeneographConnection(id).style.width, ids.connection);
            await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').fill('9');
            await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').press('Tab');
            assert.equal(await page.evaluate(id => getGeneographConnection(id).style.width, ids.connection), connectionWidth);
            assert.equal(await page.evaluate(id => geneoResolveVisibleNodeAppearance(getGeneographNode(id)).strokeWidth, personId), 9);
            await inspector.locator('[data-geneo-person-multi-reset]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).style.width, ids.connection), connectionWidth);
            await page.evaluate(ids => {
                const drawing = createGeneographDrawingFromPoints([{ x: 3500, y: 3000 }, { x: 3600, y: 3060 }]);
                setGeneographSelection([ids.first, drawing.id], [ids.connection]);
                renderGeneographEditorPreserveScroll();
            }, ids);
            assert.equal(await inspector.locator('[data-geneo-bulk-paint-color="fill"]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-bulk-appearance="cornerRadius"]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-bulk-appearance="strokeWidth"]').count(), 1);
            await inspector.locator('[data-geneo-delete-selection]').click();
            assert.deepEqual(await page.evaluate(ids => [Boolean(getGeneographNode(ids.first)),
                Boolean(getGeneographConnection(ids.connection))], ids), [false, false]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => [Boolean(getGeneographNode(ids.first)),
                Boolean(getGeneographConnection(ids.connection))], ids), [true, true]);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph mixed bulk settings passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
