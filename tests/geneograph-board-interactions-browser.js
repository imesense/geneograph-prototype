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
            return {
                image: selectedGeneographDiagram().nodes.find(node => node.type === 'image').id,
                panel: selectedGeneographDiagram().nodes.find(node => node.type === 'panel').id,
                partner: selectedGeneographDiagram().connections.find(connection => connection.kind === 'family-partner').familyId
            };
        });
        const image = page.locator(`article[data-geneo-node="${ids.image}"]`);
        await page.evaluate(id => {
            const node = getGeneographNode(id);
            const source = resolveGeneographImageSource(node);
            if (!source.available || !source.photo.src) throw new Error('Sample image missing');
            restoreGeneographViewportCenter({ x: node.x + node.width / 2, y: node.y + node.height / 2 });
        }, ids.image);
        await image.dblclick();
        assert.equal(await page.locator('[data-geneo-image-crop-toolbar]').count(), 1);
        for (const corner of ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w']) {
            const handle = page.locator(`[data-geneo-image-crop-handle="${corner}"]`);
            await handle.press('Shift+ArrowUp');
            assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom > 1), true);
            await page.locator('[data-geneo-image-crop-fit]').click();
            assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom), 1);
        }
        await page.locator('[data-geneo-image-crop-handle="nw"]').press('ArrowDown');
        assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom), 1);
        await page.locator('[data-geneo-image-crop-cancel]').click();
        assert.equal(await page.evaluate(id => getGeneographNode(id).imageCrop, ids.image), null);
        assert.equal(await image.locator('[data-geneo-resize]').count(), 8);
        await image.dblclick();
        const southEast = page.locator('[data-geneo-image-crop-handle="se"]');
        const handleBox = await southEast.boundingBox();
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(handleBox.x + handleBox.width / 2 + 80, handleBox.y + handleBox.height / 2 + 60);
        await page.mouse.up();
        assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom > 1), true);
        await page.locator('[data-geneo-image-crop-reset]').click();
        assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom), 1);
        await southEast.press('ArrowUp');
        const savedZoom = await page.evaluate(() => geneoImageCropRuntime.draft.zoom);
        await page.locator('[data-geneo-image-crop-apply]').click();
        assert.equal(await page.evaluate(id => getGeneographNode(id).imageCrop.zoom, ids.image), savedZoom);
        assert.equal(await page.evaluate(id => {
            normalizeGeneographRuntimeData();
            return getGeneographNode(id).imageCrop.zoom;
        }, ids.image), savedZoom);
        await image.dblclick();
        await page.locator('[data-geneo-image-crop-handle="se"]').press('ArrowUp');
        await page.locator('[data-geneo-image-crop-reset]').click();
        assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.zoom), savedZoom);
        await page.locator('[data-geneo-image-crop-fit]').click();
        assert.deepEqual(await page.evaluate(() => geneoImageCropRuntime.draft), { zoom: 1, x: 0, y: 0 });
        await page.locator('[data-geneo-image-crop-cancel]').click();
        await page.evaluate(() => undoGeneographChange());
        assert.equal(await page.evaluate(id => getGeneographNode(id).imageCrop, ids.image), null);
        await image.dblclick();
        await page.locator('[data-geneo-image-crop-handle="se"]').press('ArrowUp');
        const frame = await image.locator('.geneo-image-node-media').boundingBox();
        await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
        await page.mouse.down();
        await page.mouse.move(frame.x + frame.width / 2 + 30, frame.y + frame.height / 2 + 20);
        await page.mouse.up();
        assert.equal(await page.evaluate(() => geneoImageCropRuntime.draft.x > 0), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(id => getGeneographNode(id).imageCrop, ids.image), null);

        await page.evaluate(id => {
            const node = getGeneographNode(id);
            restoreGeneographViewportCenter({ x: node.x + node.width / 2, y: node.y + node.height / 2 });
        }, ids.panel);
        const panel = page.locator(`article[data-geneo-node="${ids.panel}"]`);
        await panel.dblclick({ position: { x: 30, y: 20 } });
        const title = panel.locator('[data-geneo-inline-input]');
        assert.equal(await title.evaluate(input => input.selectionStart === 0 && input.selectionEnd === input.value.length), true);
        assert.equal(await title.evaluate(input => getComputedStyle(input).textAlign), 'left');
        await title.press('Escape');

        const junction = await page.evaluate(id => {
            const point = geneoFamilyJunction(id);
            const partner = geneoPartnerConnectionForFamily(id);
            const points = geneoConnectionPoints(partner);
            return { point, points };
        }, ids.partner);
        assert.equal(junction.points.some((start, index) => {
            const end = junction.points[index + 1];
            if (!end) return false;
            const cross = (junction.point.x - start.x) * (end.y - start.y)
                - (junction.point.y - start.y) * (end.x - start.x);
            return Math.abs(cross) < 1.5
                && junction.point.x >= Math.min(start.x, end.x) - 1
                && junction.point.x <= Math.max(start.x, end.x) + 1
                && junction.point.y >= Math.min(start.y, end.y) - 1
                && junction.point.y <= Math.max(start.y, end.y) + 1;
        }), true);
        const movedJunction = await page.evaluate(id => {
            const partner = geneoPartnerConnectionForFamily(id);
            const moved = getGeneographNode(partner.target.nodeId);
            moved.x += 40;
            moved.y += 20;
            updateGeneographLiveGeometry(moved);
            const point = geneoFamilyJunction(id);
            const circle = document.querySelector(`[data-geneo-family-junction="${id}"]`);
            return { point, x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) };
        }, ids.partner);
        assert.equal(movedJunction.point.x, movedJunction.x);
        assert.equal(movedJunction.point.y, movedJunction.y);
        assert.equal(await page.evaluate(id => {
            const partner = geneoPartnerConnectionForFamily(id);
            const path = document.querySelector(`[data-geneo-connection-group="${partner.id}"] .geneo-connection-line`);
            const point = geneoFamilyJunction(id);
            const length = path.getTotalLength();
            let distance = Infinity;
            for (let index = 0; index <= 500; index++) {
                const sample = path.getPointAtLength(length * index / 500);
                distance = Math.min(distance, Math.hypot(sample.x - point.x, sample.y - point.y));
            }
            return distance < 2;
        }, ids.partner), true);

        assert.equal(await page.locator('[data-geneo-layer-connection]').evaluateAll(rows => rows.length > 0
            && rows.every(row => row.closest('[data-geneo-layer-block]'))
            && new Set(rows.map(row => row.dataset.geneoLayerConnection)).size === rows.length), true);

        for (const width of [390, 320]) {
            await page.setViewportSize({ width, height: 800 });
            await page.evaluate(id => {
                const node = getGeneographNode(id);
                restoreGeneographViewportCenter({ x: node.x + node.width / 2, y: node.y + node.height / 2 });
                geneoBeginImageCrop(node);
            }, ids.image);
            assert.equal(await page.locator('[data-geneo-image-crop-toolbar]').evaluate(toolbar => {
                const bar = toolbar.getBoundingClientRect();
                const view = document.querySelector('[data-geneo-canvas-viewport]').getBoundingClientRect();
                return bar.left >= view.left - 1 && bar.right <= view.right + 1;
            }), true);
            await page.keyboard.press('Escape');
        }

        await page.evaluate(() => {
            selectedGeneographDiagram().nodes = [];
            selectedGeneographDiagram().connections = [];
            renderGeneographEditorPreserveScroll();
        });
        assert.equal(await page.locator('.geneo-item-empty').innerText(), 'No items on this board');
        assert.equal(await page.locator('.geneo-item-empty [data-geneo-item-filter-clear]').count(), 0);
        assert.deepEqual(errors, []);
        console.log('Geneograph board interactions passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
