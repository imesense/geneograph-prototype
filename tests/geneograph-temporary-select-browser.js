const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {})
    });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
        });
        const empty = await page.evaluate(() => {
            const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
            for (let y = rect.top + 90; y < rect.bottom - 70; y += 35)
                for (let x = rect.left + 90; x < rect.right - 70; x += 35)
                    if (!document.elementFromPoint(x, y)?.closest('[data-geneo-node],button,[data-geneo-connection]'))
                        return { x, y };
            return null;
        });
        assert.ok(empty, 'Empty canvas point');

        await page.locator('[data-geneo-tool="pencil"]').click();
        await page.keyboard.down('Control');
        assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'select');
        assert.equal(await page.evaluate(() => state.geneoTool), 'pencil');
        assert.equal(await page.locator('[data-geneo-tool="pencil"]').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.geneo-canvas-stage.temporary-select-tool').count(), 1);
        await page.evaluate(() => {
            state.geneoTool = 'pan';
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'pan');
        assert.equal(await page.locator('.geneo-canvas-stage.temporary-select-tool').count(), 0);
        await page.keyboard.up('Control');
        await page.locator('[data-geneo-tool="pencil"]').click();
        await page.locator('[data-geneo-creation-width]').focus();
        await page.keyboard.down('Control');
        assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'pencil');
        await page.keyboard.up('Control');
        await page.locator('[data-geneo-tool="pencil"]').focus();
        await page.keyboard.down('Control');
        await page.mouse.move(empty.x, empty.y);
        await page.mouse.down();
        assert.equal(await page.evaluate(() => geneoPointerState?.kind), 'marquee');
        await page.keyboard.up('Control');
        assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'pencil');
        assert.equal(await page.evaluate(() => geneoPointerState?.kind), 'marquee');
        await page.mouse.up();
        assert.equal(await page.locator('.geneo-canvas-stage.temporary-select-tool').count(), 0);

        const drawingsBefore = await page.evaluate(() =>
            selectedGeneographDiagram().nodes.filter(node => node.type === 'drawing').length);
        await page.mouse.move(empty.x, empty.y);
        await page.mouse.down();
        assert.equal(await page.evaluate(() => geneoPointerState?.kind), 'pencil');
        await page.mouse.move(empty.x + 35, empty.y + 22, { steps: 5 });
        await page.keyboard.down('Control');
        assert.equal(await page.evaluate(() => geneoPointerState?.kind), 'pencil');
        await page.mouse.up();
        await page.keyboard.up('Control');
        assert.equal(await page.evaluate(() =>
            selectedGeneographDiagram().nodes.filter(node => node.type === 'drawing').length),
        drawingsBefore + 1);
        assert.equal(await page.evaluate(() => state.geneoTool), 'pencil');

        await page.keyboard.down('Control');
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'pencil');
        await page.keyboard.up('Control');

        const rightClickPoint = await page.evaluate(() => {
            const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
            for (let y = rect.top + 90; y < rect.bottom - 70; y += 35)
                for (let x = rect.left + 90; x < rect.right - 70; x += 35)
                    if (!document.elementFromPoint(x, y)?.closest('[data-geneo-node],button,[data-geneo-connection]'))
                        return { x, y };
            return null;
        });
        assert.ok(rightClickPoint);
        await page.mouse.click(rightClickPoint.x, rightClickPoint.y, { button: 'right' });
        assert.equal(await page.evaluate(() => state.geneoTool), 'pan');
        assert.equal(await page.locator('[data-geneo-creation-panel="drawing"]').count(), 0);

        await page.locator('[data-geneo-tool="pencil"]').click();
        await page.mouse.move(rightClickPoint.x, rightClickPoint.y);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(rightClickPoint.x + 24, rightClickPoint.y + 18, { steps: 4 });
        await page.mouse.down({ button: 'right' });
        await page.mouse.up({ button: 'right' });
        assert.equal(await page.evaluate(() => geneoPointerState?.kind), 'pencil');
        await page.mouse.up({ button: 'left' });
        assert.equal(await page.evaluate(() => state.geneoTool), 'pan');

        await page.locator('[data-geneo-tool="pencil"]').click();
        const card = page.locator('[data-geneo-node="gn-barnaby"]');
        await card.scrollIntoViewIfNeeded();
        const box = await card.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        assert.equal(await page.evaluate(() => state.geneoTool), 'pencil');

        for (const tool of ['pan', 'connect', 'shape']) {
            await page.evaluate(next => {
                state.geneoTool = next;
                renderGeneographEditorPreserveScroll();
            }, tool);
            await page.keyboard.down('Control');
            assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), 'select');
            assert.equal(await page.evaluate(() => state.geneoTool), tool);
            await page.keyboard.up('Control');
            assert.equal(await page.evaluate(() => geneoEffectiveCanvasTool()), tool);
        }

        assert.deepEqual(errors, []);
        console.log('Geneograph temporary Select and Draw-to-Pan passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
