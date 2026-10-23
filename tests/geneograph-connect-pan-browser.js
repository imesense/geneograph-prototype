const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            activateGeneographConnectionTool();
        });

        const wrap = page.locator('[data-geneo-canvas-wrap]');
        const drag = async (x, y) => {
            const before = await wrap.evaluate(element => ({ left: element.scrollLeft, top: element.scrollTop }));
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x - 55, y - 35, { steps: 5 });
            await page.mouse.up();
            const after = await wrap.evaluate(element => ({ left: element.scrollLeft, top: element.scrollTop }));
            assert.ok(after.left > before.left || after.top > before.top, `Expected Connect drag to pan from ${JSON.stringify(before)} to ${JSON.stringify(after)}`);
            assert.equal(await page.evaluate(() => state.geneoTool), 'connect');
        };

        await wrap.evaluate(element => { element.scrollLeft = 400; element.scrollTop = 300; });
        const empty = await page.evaluate(() => {
            const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
            for (let y = rect.top + 90; y < rect.bottom - 90; y += 45)
                for (let x = rect.left + 90; x < rect.right - 90; x += 45)
                    if (!document.elementFromPoint(x, y)?.closest('[data-geneo-node],button,[data-geneo-connection]')) return { x, y };
            return null;
        });
        assert.ok(empty, 'An empty canvas drag point should be available');
        await drag(empty.x, empty.y);

        const card = page.locator('article[data-geneo-node="gn-barnaby"]');
        await card.scrollIntoViewIfNeeded();
        const cardBox = await card.boundingBox();
        assert.ok(cardBox);
        await drag(cardBox.x + cardBox.width * 0.7, cardBox.y + cardBox.height * 0.6);

        await page.evaluate(() => {
            selectGeneographNode('gn-barnaby');
            renderGeneographEditorPreserveScroll();
        });
        const selectedBox = await card.boundingBox();
        const beforeMove = await page.evaluate(() => {
            const node = getGeneographNode('gn-barnaby');
            const canvas = document.querySelector('[data-geneo-canvas-wrap]');
            return { x: node.x, y: node.y, left: canvas.scrollLeft, top: canvas.scrollTop };
        });
        await page.mouse.move(selectedBox.x + selectedBox.width * 0.7, selectedBox.y + selectedBox.height * 0.6);
        await page.mouse.down();
        await page.mouse.move(selectedBox.x + selectedBox.width * 0.7 - 30,
            selectedBox.y + selectedBox.height * 0.6 - 20, { steps: 5 });
        await page.mouse.up();
        const afterMove = await page.evaluate(() => {
            const node = getGeneographNode('gn-barnaby');
            const canvas = document.querySelector('[data-geneo-canvas-wrap]');
            return { x: node.x, y: node.y, left: canvas.scrollLeft, top: canvas.scrollTop, tool: state.geneoTool };
        });
        assert.ok(afterMove.x !== beforeMove.x || afterMove.y !== beforeMove.y, 'Selected card should move in Connect mode');
        assert.equal(afterMove.left, beforeMove.left);
        assert.equal(afterMove.top, beforeMove.top);
        assert.equal(afterMove.tool, 'connect');

        const socket = page.locator('[data-geneo-port-node="gn-barnaby"][data-geneo-port="right"]');
        await socket.click();
        const draft = await page.evaluate(() => ({ draft: state.geneoConnectionDraft, tool: state.geneoTool }));
        assert.equal(draft.draft?.nodeId, 'gn-barnaby');
        assert.equal(draft.tool, 'connect');

        await wrap.evaluate(element => { element.scrollLeft += 120; element.scrollTop += 80; });
        const next = await page.evaluate(() => {
            const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
            for (let y = rect.top + 90; y < rect.bottom - 90; y += 45)
                for (let x = rect.left + 90; x < rect.right - 90; x += 45)
                    if (!document.elementFromPoint(x, y)?.closest('[data-geneo-node],button,[data-geneo-connection]')) return { x, y };
            return null;
        });
        assert.ok(next);
        await drag(next.x, next.y);
        assert.equal(await page.evaluate(() => state.geneoConnectionDraft?.nodeId), 'gn-barnaby');
        assert.deepEqual(errors, []);
        console.log('Geneograph Connect panning passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
