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
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const nodeId = await page.evaluate(({ language, width }) => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const node = selectedGeneographDiagram().nodes.find(item => item.type === 'person');
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
                if (width < 900) document.body.classList.add('mobile-details-open');
                return node.id;
            }, { language, width });
            const inspector = page.locator('.geneo-inspector');
            for (const action of ['rename', 'lock', 'visible'])
                assert.equal(await inspector.locator(`[data-geneo-header-${action}]`).count(), 1);
            assert.equal(await inspector.locator('[data-geneo-node-locked], [data-geneo-node-visible], .geneo-layout-name').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-edit-person]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-apply-gender-color]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="person:content"]').count(), 2);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="person:appearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="person:card"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-size], .geneo-person-size-presets').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-layout="x"], [data-geneo-layout="y"], [data-geneo-layout="width"], [data-geneo-layout="height"]').count(), 4);
            assert.equal((await inspector.locator('#geneo-inspector-person-layout').textContent()).includes('90%'), false);
            assert.ok(await inspector.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            if (process.env.GENEO_INSPECTOR_SCREENSHOT_DIR)
                await inspector.screenshot({ path: path.join(process.env.GENEO_INSPECTOR_SCREENSHOT_DIR, `person-${language}-${width}.png`) });

            const originalName = await page.evaluate(id => getGeneographNode(id).name || '', nodeId);
            await inspector.locator('[data-geneo-header-rename]').click();
            await inspector.locator('[data-geneo-header-name-input]').fill('Cancelled layer');
            await inspector.locator('[data-geneo-header-name-input]').press('Escape');
            assert.equal(await page.evaluate(id => getGeneographNode(id).name || '', nodeId), originalName);
            await inspector.locator('[data-geneo-header-rename]').click();
            await inspector.locator('[data-geneo-header-name-input]').fill('Inspector layer');
            await inspector.locator('[data-geneo-header-name-input]').press('Enter');
            assert.equal(await page.evaluate(id => getGeneographNode(id).name, nodeId), 'Inspector layer');
            assert.equal((await inspector.locator('.geneo-inspector-title h2').textContent()).trim(), 'Inspector layer');

            const locked = await page.evaluate(id => getGeneographNode(id).locked, nodeId);
            await inspector.locator('[data-geneo-header-lock]').click();
            assert.equal(await page.evaluate(id => getGeneographNode(id).locked, nodeId), !locked);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => getGeneographNode(id).locked, nodeId), locked);
            const visible = await page.evaluate(id => getGeneographNode(id).visible, nodeId);
            await inspector.locator('[data-geneo-header-visible]').click();
            assert.equal(await page.evaluate(id => getGeneographNode(id).visible, nodeId), !visible);
            await inspector.locator('[data-geneo-header-visible]').click();
            assert.equal(await page.evaluate(id => getGeneographNode(id).visible, nodeId), visible);
            await inspector.locator('[data-geneo-edit-person]').click();
            assert.equal(await page.locator('.geneo-person-modal').count(), 1);
            await page.locator('.geneo-person-modal .close-button').click();

            await page.evaluate(id => {
                const diagram = selectedGeneographDiagram();
                const node = getGeneographNode(id);
                const person = getGeneographPerson(node.personId);
                person.gender = 'male';
                diagram.canvas.colorPersonCardsByGender = false;
                diagram.cardAppearanceDefaults.male.fill.color = '#3978AB';
                diagram.cardAppearanceDefaults.male.strokeWidth = 5;
                diagram.cardAppearanceDefaults.male.cornerRadius = 15;
                node.x = 333; node.y = 222; node.width = 420; node.height = 160;
                node.personCard = geneoEmptyPersonCardOverrides(true, 'manual');
                node.personCard.style = 'chart';
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            await inspector.locator('[data-geneo-apply-gender-color]').click();
            const snapshot = await page.evaluate(id => {
                const node = getGeneographNode(id);
                const diagram = selectedGeneographDiagram();
                diagram.cardAppearanceDefaults.male.fill.color = '#D73572';
                getGeneographPerson(node.personId).gender = 'female';
                return {
                    fill: geneoResolveVisibleNodeAppearance(node).fill.color,
                    width: geneoResolveVisibleNodeAppearance(node).strokeWidth,
                    radius: geneoPersonCardEffectiveSettings(node).cornerRadius,
                    paintOverrides: node.appearance.paintOverrides,
                    styleOverrides: node.appearance.styleOverrides,
                    resetEnabled: geneoPersonHasResettableSettings(node)
                };
            }, nodeId);
            assert.equal(snapshot.fill, '#3978AB');
            assert.equal(snapshot.width, 5);
            assert.equal(snapshot.radius, 15);
            assert.deepEqual(snapshot.paintOverrides, { fill: true, stroke: true, text: true });
            assert.deepEqual(snapshot.styleOverrides, { strokeWidth: true, strokePattern: true });
            assert.equal(snapshot.resetEnabled, true);
            await page.evaluate(() => {
                const input = document.querySelector('[data-geneo-stroke-width="node"]');
                input.value = '7';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            assert.equal(await page.evaluate(id => getGeneographNode(id).appearance.strokeWidth, nodeId), 7);
            assert.equal(await page.evaluate(() => selectedGeneographDiagram().cardAppearanceDefaults.male.strokeWidth), 5);
            await inspector.locator('[data-geneo-person-card-reset]').click();
            const reset = await page.evaluate(id => {
                const node = getGeneographNode(id);
                return {
                    style: geneoPersonCardEffectiveSettings(node).style,
                    geometry: [node.x, node.y, node.width, node.height],
                    heightMode: node.personCard.heightMode,
                    radius: node.personCard.cornerRadius,
                    paintOverrides: node.appearance.paintOverrides,
                    resetEnabled: geneoPersonHasResettableSettings(node)
                };
            }, nodeId);
            assert.equal(reset.style, 'chart');
            assert.deepEqual(reset.geometry, [333, 222, 420, 160]);
            assert.equal(reset.heightMode, 'manual');
            assert.equal(reset.radius, null);
            assert.deepEqual(reset.paintOverrides, { fill: false, stroke: false, text: false });
            assert.equal(reset.resetEnabled, false);
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').isDisabled(), true);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(id => geneoResolveVisibleNodeAppearance(getGeneographNode(id)).fill.color, nodeId), '#3978AB');
            for (const [gender, color, automatic] of [['female', '#B471B8', true], ['unknown', '#6C9B77', false]]) {
                await page.evaluate(({ id, gender, color, automatic }) => {
                    const diagram = selectedGeneographDiagram();
                    getGeneographPerson(getGeneographNode(id).personId).gender = gender;
                    diagram.canvas.colorPersonCardsByGender = automatic;
                    diagram.cardAppearanceDefaults[gender].fill.color = color;
                    renderGeneographEditorPreserveScroll();
                }, { id: nodeId, gender, color, automatic });
                await inspector.locator('[data-geneo-apply-gender-color]').click();
                assert.equal(await page.evaluate(id => geneoResolveVisibleNodeAppearance(getGeneographNode(id)).fill.color, nodeId), color);
            }

            for (const type of ['panel', 'image', 'sticky', 'text']) {
                await page.evaluate(type => {
                    const node = selectedGeneographDiagram().nodes.find(item => item.type === type);
                    state.selectedGeneoNodeId = node.id;
                    state.selectedGeneoNodeIds = [node.id];
                    renderGeneographEditorPreserveScroll();
                }, type);
                assert.equal(await inspector.locator('[data-geneo-header-rename], [data-geneo-header-lock], [data-geneo-header-visible]').count(), 3);
                assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 0);
                assert.ok(await inspector.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            }
            for (const type of ['place', 'shape', 'drawing']) {
                await page.evaluate(type => {
                    const diagram = selectedGeneographDiagram();
                    const defaults = geneoNodeDefaults(type);
                    const node = {
                        id: `inspector-test-${type}`, type, x: 100, y: 100,
                        width: defaults.width, height: defaults.height,
                        order: diagram.nodes.length + 1, parentPanelId: null,
                        visible: true, locked: false,
                        appearance: structuredClone(defaults.appearance),
                        ...(type === 'place' ? { placeRef: { scope: 'board', name: 'Test place' } } : {}),
                        ...(type === 'shape' ? { shapeKind: 'rectangle' } : {}),
                        ...(type === 'drawing' ? { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] } : {})
                    };
                    diagram.nodes.push(node);
                    state.selectedGeneoNodeId = node.id;
                    state.selectedGeneoNodeIds = [node.id];
                    renderGeneographEditorPreserveScroll();
                }, type);
                assert.equal(await inspector.locator('[data-geneo-header-rename], [data-geneo-header-lock], [data-geneo-header-visible]').count(), 3);
                assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 0);
                assert.ok(await inspector.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            }
            assert.deepEqual(errors, []);
            if (process.env.GENEO_INSPECTOR_SCREENSHOT_DIR)
                await inspector.screenshot({ path: path.join(process.env.GENEO_INSPECTOR_SCREENSHOT_DIR, `inspector-${language}-${width}.png`) });
            await page.close();
        }
        console.log('Geneograph object inspector passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
