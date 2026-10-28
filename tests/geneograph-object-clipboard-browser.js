const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE }
            : {}),
        headless: true
    });
    try {
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            page.setDefaultTimeout(5000);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                renderGeneographEditorPreserveScroll();
            }, language);
            await page.waitForTimeout(150);

            const object = page.locator('.geneo-node[data-geneo-node="gn-luna"]');
            await page.evaluate(() => {
                document.querySelector('.geneo-node[data-geneo-node="gn-luna"]').dispatchEvent(
                    new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
                        button: 2, clientX: 1080, clientY: 700 })
                );
            });
            const menu = page.locator('.geneo-object-context-menu');
            assert.equal(await menu.count(), 1);
            assert.equal(await menu.getAttribute('role'), 'menu');
            const menuBounds = await menu.evaluate(element => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
                    width: innerWidth, height: innerHeight };
            });
            assert.ok(menuBounds.left >= 0 && menuBounds.top >= 0
                && menuBounds.right <= menuBounds.width && menuBounds.bottom <= menuBounds.height,
            JSON.stringify(menuBounds));
            assert.equal(await menu.locator('[data-geneo-object-action="copy"]').textContent(),
                language === 'ru' ? 'Копировать' : 'Copy');
            const enabledActions = await menu.locator('[role="menuitem"]:not(:disabled)').evaluateAll(items => items.map(item => item.dataset.geneoObjectAction));
            assert.equal(await menu.evaluate(() => document.activeElement?.dataset.geneoObjectAction), enabledActions[0]);
            await page.keyboard.press('ArrowDown');
            assert.equal(await menu.evaluate(() => document.activeElement?.dataset.geneoObjectAction), enabledActions[1]);
            await page.keyboard.press('Escape');
            assert.equal(await menu.count(), 0);
            assert.equal(await object.evaluate(element => document.activeElement === element), true);
            await page.setViewportSize({ width: 320, height: 600 });
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            await page.evaluate(() => openGeneographObjectContextMenu('gn-luna', 310, 590));
            const mobileBounds = await menu.evaluate(element => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
            });
            assert.ok(mobileBounds.left >= 0 && mobileBounds.top >= 0
                && mobileBounds.right <= 320 && mobileBounds.bottom <= 600, JSON.stringify(mobileBounds));
            await page.mouse.click(4, 4);
            assert.equal(await menu.count(), 0);
            await page.setViewportSize({ width: 1100, height: 720 });
            await page.waitForTimeout(150);
            await object.press('Shift+F10');
            assert.equal(await menu.count(), 1);
            await menu.locator('[data-geneo-object-action="copy"]').click();
            assert.equal(await page.evaluate(() => geneoObjectClipboard?.mode), 'copy');
            await page.keyboard.press('Control+v');
            const copied = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const clone = diagram.nodes.find(node => node.type === 'person' && node.personId !== 'gp-luna'
                    && diagram.people.find(person => person.id === node.personId)?.names.first === 'Luna');
                return {
                    cloneId: clone?.id,
                    personId: clone?.personId,
                    linked: diagram.people.find(person => person.id === clone?.personId)?.treePersonId,
                    family: diagram.families.some(family => family.partnerIds.includes(clone?.personId)
                        || family.children.some(child => child.personId === clone?.personId)),
                    connections: diagram.connections.some(connection => connection.source.nodeId === clone?.id
                        || connection.target.nodeId === clone?.id)
                };
            });
            assert.ok(copied.cloneId && copied.personId);
            assert.equal(copied.linked, null);
            assert.equal(copied.family, false);
            assert.equal(copied.connections, false);
            await page.keyboard.press('Control+z');
            assert.equal(await page.evaluate(id => Boolean(getGeneographNode(id)), copied.cloneId), false);

            await page.evaluate(() => {
                selectGeneographNode('gn-luna');
                renderGeneographEditorPreserveScroll();
            });
            await page.keyboard.press('Control+x');
            assert.equal(await page.evaluate(() => Boolean(getGeneographNode('gn-luna'))), false);
            assert.equal(await page.evaluate(() => getGeneographPerson('gp-luna')?.treePersonId), 'luna');
            await page.keyboard.press('Control+z');
            assert.equal(await page.evaluate(() => pasteGeneographObjects()), false);
            assert.equal(await page.evaluate(() => geneoObjectClipboard), null);
            await page.evaluate(() => {
                selectGeneographNode('gn-luna');
                cutGeneographSelection();
            });
            await page.keyboard.press('Control+v');
            const moved = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const node = diagram.nodes.find(item => item.personId === 'gp-luna');
                return {
                    id: node?.id,
                    link: getGeneographPerson('gp-luna')?.treePersonId,
                    connected: diagram.connections.some(connection => connection.source.nodeId === node?.id
                        || connection.target.nodeId === node?.id),
                    family: diagram.families.some(family => family.partnerIds.includes('gp-luna')
                        || family.children.some(child => child.personId === 'gp-luna')),
                    clipboard: geneoObjectClipboard
                };
            });
            assert.ok(moved.id);
            assert.equal(moved.link, 'luna');
            assert.equal(moved.connected, false);
            assert.equal(moved.family, false);
            assert.equal(moved.clipboard, null);
            await page.keyboard.press('Control+z');
            assert.equal(await page.evaluate(id => Boolean(getGeneographNode(id)), moved.id), false);
            await page.keyboard.press('Control+z');
            assert.equal(await page.evaluate(() => Boolean(getGeneographNode('gn-luna'))), true);

            const panelCopy = await page.evaluate(() => {
                selectGeneographNode('gn-panel');
                const sourceCount = geneoObjectGroupNodes().length;
                duplicateGeneographSelection();
                const clones = selectedGeneographNodes();
                const panel = clones.find(node => node.type === 'panel');
                return { sourceCount, cloneCount: clones.length, children: clones.filter(node => node.parentPanelId === panel?.id).length };
            });
            assert.ok(panelCopy.sourceCount > 1);
            assert.equal(panelCopy.cloneCount, panelCopy.sourceCount);
            assert.ok(panelCopy.children > 0);

            const otherTypes = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                for (const type of ['shape', 'place', 'drawing']) {
                    const defaults = geneoNodeDefaults(type);
                    diagram.nodes.push({ id: `clipboard-${type}`, type, x: 2200, y: 800,
                        width: defaults.width, height: defaults.height,
                        order: 1000, visible: true, locked: false, parentPanelId: null,
                        appearance: structuredClone(defaults.appearance),
                        ...(type === 'shape' ? { shapeKind: 'rectangle' } : {}),
                        ...(type === 'place' ? { placeRef: { scope: 'board', name: 'Test place' }, placeSizeMode: 'auto' } : {}),
                        ...(type === 'drawing' ? { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] } : {}) });
                }
                const results = [];
                for (const type of ['image', 'sticky', 'text', 'shape', 'place', 'drawing']) {
                    const node = selectedGeneographDiagram().nodes.find(item => item.type === type);
                    selectGeneographNode(node.id);
                    duplicateGeneographSelection();
                    const clone = selectedGeneographNodes()[0];
                    results.push({ type: clone?.type, changedId: clone?.id !== node.id,
                        offset: clone?.x - node.x });
                }
                return results;
            });
            assert.deepEqual(otherTypes.map(item => item.type),
                ['image', 'sticky', 'text', 'shape', 'place', 'drawing']);
            assert.ok(otherTypes.every(item => item.changedId && item.offset === 24));

            const menuActions = await page.evaluate(() => {
                const open = () => {
                    selectGeneographNode('gn-sticky');
                    openGeneographObjectContextMenu('gn-sticky', 200, 200);
                };
                open();
                document.querySelector('[data-geneo-object-action="lock"]').click();
                const locked = getGeneographNode('gn-sticky').locked;
                undoGeneographChange();
                open();
                document.querySelector('[data-geneo-object-action="hide"]').click();
                const hidden = !getGeneographNode('gn-sticky').visible;
                undoGeneographChange();
                const connection = selectedGeneographDiagram().connections[0];
                setGeneographSelection(['gn-sticky'], [connection.id]);
                openGeneographObjectContextMenu('gn-sticky', 200, 200);
                document.querySelector('[data-geneo-object-action="delete"]').click();
                return { locked, hidden, connectionSurvived: Boolean(getGeneographConnection(connection.id)),
                    stickyDeleted: !getGeneographNode('gn-sticky') };
            });
            assert.deepEqual(menuActions, { locked: true, hidden: true,
                connectionSurvived: true, stickyDeleted: true });
            await page.evaluate(() => undoGeneographChange());

            const assetMove = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.assets.push({ id: 'clipboard-asset', kind: 'photo', filename: 'test.png',
                    displayName: 'Test', src: 'data:image/png;base64,iVBORw0KGgo=', mimeType: 'image/png',
                    width: 1, height: 1, sizeBytes: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                diagram.nodes.push({ ...structuredClone(geneoNodeDefaults('image')),
                    id: 'clipboard-image', type: 'image', x: 2400, y: 300,
                    order: 999, visible: true, locked: false, parentPanelId: null,
                    imageRef: { scope: 'board', id: 'clipboard-asset' } });
                selectGeneographNode('clipboard-image');
                cutGeneographSelection();
                const pruned = !selectedGeneographDiagram().assets.some(asset => asset.id === 'clipboard-asset');
                pasteGeneographObjects();
                const restored = selectedGeneographDiagram().assets.some(asset => asset.id === 'clipboard-asset');
                return { pruned, restored, pasted: selectedGeneographNodes()[0]?.imageRef?.id };
            });
            assert.deepEqual(assetMove, { pruned: true, restored: true, pasted: 'clipboard-asset' });
            await page.evaluate(() => {
                selectGeneographNode('gn-sticky');
                copyGeneographSelection();
                openGeneographBoard('gb1');
            });
            assert.equal(await page.evaluate(() => geneoObjectClipboard?.boardId), 'gb1');
            await page.evaluate(() => {
                const board = structuredClone(getGeneographBoard('gb1'));
                board.id = 'gb-clipboard-other';
                sampleData.boards.push(board);
                openGeneographBoard(board.id);
            });
            assert.equal(await page.evaluate(() => geneoObjectClipboard), null);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph object context menu and clipboard passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
