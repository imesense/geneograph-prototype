const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}),
        headless: true
    });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        const types = await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            createGeneographShapeFromRect({ x: 2000, y: 2000, width: 180, height: 120 });
            createGeneographPlaceNode({ scope: 'board', name: 'Test place' });
            return [...new Set(selectedGeneographDiagram().nodes.map(node => node.type))];
        });
        assert.ok(['image', 'place', 'panel', 'sticky', 'text', 'shape'].every(type => types.includes(type)));
        for (const type of ['image', 'place', 'panel', 'sticky', 'text', 'shape']) {
            if (!types.includes(type)) continue;
            const original = await page.evaluate(type => {
                const node = selectedGeneographDiagram().nodes.find(item => item.type === type);
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
                return { id: node.id, x: node.x, y: node.y, width: node.width, height: node.height,
                    appearance: structuredClone(node.appearance), shapeKind: node.shapeKind,
                    imageRef: structuredClone(node.imageRef || null) };
            }, type);
            const inspector = page.locator('.geneo-inspector');
            if (type === 'place') {
                assert.equal(await inspector.locator('[data-geneo-edit-place]').count(), 1);
                assert.equal(await inspector.locator('.geneo-place-inspector-actions [data-geneo-edit-place]').count(), 0);
            }
            if (type === 'shape') {
                const kind = inspector.locator('[data-geneo-inspector-shape-kind]');
                await kind.selectOption(original.shapeKind === 'ellipse' ? 'rectangle' : 'ellipse');
                assert.notEqual(await page.evaluate(id => getGeneographNode(id).shapeKind, original.id), original.shapeKind);
                await page.evaluate(({ id, kind }) => {
                    getGeneographNode(id).shapeKind = kind;
                    renderGeneographEditorPreserveScroll();
                }, { id: original.id, kind: original.shapeKind });
            }
            if (type === 'sticky' || type === 'text') {
                const preview = inspector.locator('[data-geneo-edit-rich-text]');
                assert.equal(await preview.count(), 1);
                await preview.focus();
                await preview.press('Enter');
                assert.equal(await inspector.locator('[data-geneo-rich-text-inspector]').count(), 1);
                await inspector.locator('[data-geneo-rich-text-cancel]').click();
            }
            const radius = inspector.locator('[data-geneo-node-corner-radius]');
            assert.equal(await radius.count(), type === 'shape' && original.shapeKind === 'ellipse' ? 0 : 1, type);
            if (await radius.count()) {
                await radius.fill('32');
                await radius.press('Enter');
                assert.equal(await page.evaluate(id => getGeneographNode(id).appearance.cornerRadius, original.id), 32);
            }
            const reset = inspector.locator('[data-geneo-node-appearance-reset]');
            assert.equal(await reset.count(), 1);
            if (await reset.isEnabled()) await reset.click();
            const after = await page.evaluate(id => {
                const node = getGeneographNode(id);
                return { x: node.x, y: node.y, width: node.width, height: node.height,
                    shapeKind: node.shapeKind, imageRef: node.imageRef || null,
                    appearance: node.appearance, defaults: geneoNodeDefaults(node.type).appearance };
            }, original.id);
            assert.deepEqual(after.appearance, after.defaults, `${type} reset`);
            for (const field of ['x', 'y', 'width', 'height', 'shapeKind', 'imageRef'])
                assert.deepEqual(after[field], original[field], `${type} ${field}`);
            assert.equal(await reset.isDisabled(), true, `${type} reset disabled`);
            if (await radius.count()) {
                await page.evaluate(() => undoGeneographChange());
                assert.equal(await page.evaluate(id => getGeneographNode(id).appearance.cornerRadius, original.id), 32);
                await page.evaluate(() => redoGeneographChange());
                assert.deepEqual(await page.evaluate(id => getGeneographNode(id).appearance, original.id), after.defaults);
            }
            if (type === 'image') {
                const fit = inspector.locator('[data-geneo-image-fit]');
                assert.equal(await fit.count(), 1);
                if (await fit.isEnabled()) {
                    await fit.click();
                    const sizing = await page.evaluate(id => {
                        const node = getGeneographNode(id);
                        const source = resolveGeneographImageSource(node);
                        return { nodeRatio: node.width / node.height,
                            sourceRatio: source.width / source.height };
                    }, original.id);
                    assert.ok(Math.abs(sizing.nodeRatio - sizing.sourceRatio) < 0.02);
                }
            }
        }
        await page.setViewportSize({ width: 320, height: 800 });
        await page.evaluate(() => {
            setLanguage('ru', false);
            const node = selectedGeneographDiagram().nodes.find(item => item.type === 'shape');
            state.selectedGeneoNodeId = node.id;
            state.selectedGeneoNodeIds = [node.id];
            document.body.classList.add('mobile-details-open');
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('.geneo-inspector [data-geneo-node-corner-radius]').count(), 1);
        assert.ok(await page.locator('.geneo-inspector').evaluate(element => element.scrollWidth <= element.clientWidth + 1));
        assert.deepEqual(errors, []);
        console.log('Geneograph object settings passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
