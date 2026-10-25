const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        const ids = await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            const diagram = selectedGeneographDiagram();
            diagram.nodes = [];
            diagram.connections = [];
            diagram.canvas.snapToGrid = false;
            const panel = createGeneographPanelFromRect({ x: 300, y: 200, width: 460, height: 300 });
            const children = [340, 540].map(x => createGeneographShapeFromRect({ x, y: 320, width: 100, height: 80 }));
            children.forEach(child => { child.parentPanelId = panel.id; });
            state.geneoTool = 'select';
            selectGeneographCanvas();
            renderGeneographEditorPreserveScroll();
            return { panel: panel.id, children: children.map(child => child.id) };
        });
        const panel = page.locator(`[data-geneo-node="${ids.panel}"]`);
        await panel.scrollIntoViewIfNeeded();
        const box = await panel.boundingBox();
        const drag = async (start, end) => {
            await page.mouse.move(...start);
            await page.mouse.down();
            await page.mouse.move(...end, { steps: 8 });
            await page.mouse.up();
        };
        await drag([box.x + 28, box.y + 55], [box.x + 355, box.y + 220]);
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedNodeIdSet()].sort()), [...ids.children].sort());
        await page.locator(`[data-geneo-node="${ids.children[0]}"]`).click();
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedNodeIdSet()]), [ids.children[0]]);
        await page.mouse.click(box.x + 5, box.y + 90);
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedNodeIdSet()]), [ids.panel]);
        const positions = await page.evaluate(ids => [ids.panel, ...ids.children].map(id => {
            const node = getGeneographNode(id);
            return { x: node.x, y: node.y };
        }), ids);
        await drag([box.x + 5, box.y + 90], [box.x + 35, box.y + 110]);
        const moves = await page.evaluate(({ ids, positions }) => [ids.panel, ...ids.children].map((id, index) => {
            const node = getGeneographNode(id);
            return { dx: node.x - positions[index].x, dy: node.y - positions[index].y };
        }), { ids, positions });
        assert.equal(moves[0].dx > 0 && moves[0].dy > 0, true);
        moves.slice(1).forEach(move => {
            assert.equal(Math.abs(move.dx - moves[0].dx) < .01, true);
            assert.equal(Math.abs(move.dy - moves[0].dy) < .01, true);
        });
        await page.evaluate(({ ids, positions }) => {
            [ids.panel, ...ids.children].forEach((id, index) => {
                Object.assign(getGeneographNode(id), positions[index]);
            });
            renderGeneographEditorPreserveScroll();
        }, { ids, positions });
        await drag([box.x - 20, box.y - 20], [box.x + box.width + 20, box.y + box.height + 20]);
        assert.deepEqual(await page.evaluate(() => [...geneoSelectedNodeIdSet()]), [ids.panel]);
        assert.deepEqual(errors, []);
    } finally { await browser.close(); }
    process.stdout.write('Geneograph panel selection passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
