const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const root = path.resolve(__dirname, '../src');
    const server = http.createServer((request, response) => {
        const target = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
            response.writeHead(404).end(); return;
        }
        const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
            '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(target)] || 'application/octet-stream';
        response.setHeader('Content-Type', type);
        fs.createReadStream(target).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            const diagram = selectedGeneographDiagram();
            diagram.canvas.snapToGrid = true;
            renderGeneographEditorPreserveScroll();
            restoreGeneographViewportCenter({ x: 700, y: 440 });
        });
        const initial = await page.evaluate(() => {
            const diagram = selectedGeneographDiagram();
            const { buses, byConnection } = geneoFamilyChildBusGroups(diagram);
            const bus = byConnection.get('gc-child-silver');
            const partner = geneoFamilyJunction('gf-whiskerfield');
            return { sizes: ['standard', 'compact', 'chart', 'portrait'].map(style =>
                [GENEO_PERSON_CARD_GEOMETRY[style].width, GENEO_PERSON_CARD_GEOMETRY[style].height]),
                busCount: buses.length, members: bus?.connectionIds, railY: bus?.railY,
                start: bus?.start, partner, drops: [...bus?.ends.values() || []],
                paths: [...document.querySelectorAll('.geneo-connection-hit')]
                    .filter(el => ['gc-child-silver', 'gc-child-iris'].includes(el.dataset.geneoConnection))
                    .map(el => el.getAttribute('d')) };
        });
        assert.deepEqual(initial.sizes, [[360, 160], [320, 160], [440, 160], [280, 360]]);
        assert.equal(initial.busCount, 1);
        assert.deepEqual(initial.members, ['gc-child-silver', 'gc-child-iris']);
        assert.equal(initial.start.x, initial.partner.x);
        assert.equal(initial.start.x % 20, 0);
        assert.equal(initial.railY % 20, 0);
        assert.ok(initial.drops.every(point => point.x % 20 === 0));
        assert.ok(initial.paths.every(value => /^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+$/.test(value)));
        if (process.env.GENEO_FAMILY_BUS_SCREENSHOT)
            await page.locator('[data-geneo-canvas-wrap]').screenshot({ path: process.env.GENEO_FAMILY_BUS_SCREENSHOT });

        const railPoint = await page.evaluate(() => {
            const bus = geneoFamilyChildBusGroups().buses[0];
            const svg = document.querySelector('.geneo-connections');
            const point = new DOMPoint((bus.minX + bus.maxX) / 2, bus.railY)
                .matrixTransform(svg.getScreenCTM());
            return { x: point.x, y: point.y };
        });
        const historyBeforeSelect = await page.evaluate(() => geneoHistoryRuntime.undo.length);
        await page.mouse.click(railPoint.x, railPoint.y);
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedConnectionIdSet()].sort()),
            ['gc-child-iris', 'gc-child-silver']);
        assert.equal(await page.evaluate(() => geneoHistoryRuntime.undo.length), historyBeforeSelect);
        assert.equal(await page.locator('[data-geneo-family-bus-rail]').evaluate(path =>
            getComputedStyle(path).outlineStyle), 'none');
        if (process.env.GENEO_FAMILY_BUS_SELECTED_SCREENSHOT)
            await page.locator('[data-geneo-canvas-wrap]').screenshot({ path: process.env.GENEO_FAMILY_BUS_SELECTED_SCREENSHOT });
        await page.mouse.move(railPoint.x, railPoint.y);
        await page.mouse.down();
        await page.mouse.move(railPoint.x, railPoint.y + 35, { steps: 5 });
        await page.mouse.up();
        assert.deepEqual(await page.evaluate(() => {
            const bus = geneoFamilyChildBusGroups().buses[0];
            return [bus.railY, ...bus.connectionIds.map(id => getGeneographConnection(id).route.railY)];
        }), [480, 480, 480]);
        await page.evaluate(() => undoGeneographChange());
        assert.equal(await page.evaluate(() => geneoFamilyChildBusGroups().buses[0].railY), initial.railY);
        await page.evaluate(() => redoGeneographChange());
        assert.equal(await page.evaluate(() => geneoFamilyChildBusGroups().buses[0].railY), 480);
        await page.locator('[data-geneo-family-bus-rail]').focus();
        await page.keyboard.press('ArrowUp');
        assert.deepEqual(await page.evaluate(() => {
            const board = structuredClone(selectedGeneographBoard());
            const people = new Map([[board.projectId, new Set()]]);
            const normalized = normalizeGeneographBoardRecord(board, people);
            return normalized.diagram.connections.filter(item =>
                ['gc-child-silver', 'gc-child-iris'].includes(item.id)).map(item => item.route.railY);
        }), [460, 460]);
        assert.deepEqual(await page.evaluate(async () => {
            const payload = validateGeneographBoardFile(JSON.parse(await buildGeneographBoardFile()));
            return payload.board.diagram.connections.filter(item =>
                ['gc-child-silver', 'gc-child-iris'].includes(item.id)).map(item => item.route.railY);
        }), [460, 460]);
        const dropPoint = await page.evaluate(() => {
            restoreGeneographViewportCenter({ x: 500, y: 470 });
            const bus = geneoFamilyChildBusGroups().byConnection.get('gc-child-silver');
            const end = bus.ends.get('gc-child-silver');
            const point = new DOMPoint(end.x, (bus.railY + end.y) / 2)
                .matrixTransform(document.querySelector('.geneo-connections').getScreenCTM());
            return { x: point.x, y: point.y };
        });
        await page.mouse.click(dropPoint.x, dropPoint.y);
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedConnectionIdSet()]), ['gc-child-silver']);
        await page.evaluate(() => main.querySelector('[data-geneo-reset-route]')?.click());
        assert.deepEqual(await page.evaluate(() => [
            getGeneographConnection('gc-child-silver').route.railY,
            getGeneographConnection('gc-child-iris').route.railY,
            geneoFamilyChildBusGroups().buses[0].railY
        ]), [undefined, undefined, initial.railY]);

        await page.evaluate(() => {
            getGeneographConnection('gc-child-iris').route = {
                mode: 'manual', waypoints: [{ x: 700, y: 420 }]
            };
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('[data-geneo-family-bus-group]').count(), 0);
        await page.evaluate(() => {
            const connection = getGeneographConnection('gc-child-iris');
            connection.route = { mode: 'auto', waypoints: [] };
            connection.style = { pattern: 'dashed' };
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('[data-geneo-family-bus-group]').count(), 0);
        await page.evaluate(() => {
            getGeneographConnection('gc-child-iris').style = {};
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('[data-geneo-family-bus-group]').count(), 1);
        await page.locator('[data-geneo-family-bus]:not([data-geneo-family-bus-rail])').focus();
        await page.keyboard.press('Enter');
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedConnectionIdSet()].sort()),
            ['gc-child-iris', 'gc-child-silver']);
        if (process.env.GENEO_FAMILY_BUS_KEYBOARD_SCREENSHOT)
            await page.locator('[data-geneo-canvas-wrap]').screenshot({ path: process.env.GENEO_FAMILY_BUS_KEYBOARD_SCREENSHOT });

        await page.evaluate(() => {
            const diagram = selectedGeneographDiagram();
            diagram.nodes.find(node => node.id === 'gn-iris').y = 700;
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('[data-geneo-family-bus-group]').count(), 1);
        await page.evaluate(() => {
            selectedGeneographDiagram().nodes.find(node => node.id === 'gn-iris').y = 100;
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('[data-geneo-family-bus-group]').count(), 0);
        await page.evaluate(() => {
            selectedGeneographDiagram().nodes.find(node => node.id === 'gn-iris').y = 500;
            setGeneographSelection(['gn-barnaby'], [], { nodeId: 'gn-barnaby' });
            renderGeneographEditorPreserveScroll();
            restoreGeneographViewportCenter({ x: 420, y: 280 });
        });
        const resize = page.locator('[data-geneo-node="gn-barnaby"][data-geneo-resize="e"]');
        const handle = await resize.boundingBox();
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2 + 35, handle.y + handle.height / 2, { steps: 5 });
        await page.mouse.up();
        assert.equal(await page.evaluate(() => getGeneographNode('gn-barnaby').width % 40), 0);
        assert.deepEqual(errors, []);
        await page.close();
        console.log('Geneograph shared family bus browser regression passed.');
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
