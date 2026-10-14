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
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(() => activateProject('p1', { moduleName: 'Geneograph' }));
            const grid = await page.evaluate(() => {
                state.geneoView = 'home';
                state.geneoLibraryView = 'all';
                state.geneoBoardViewMode = 'grid';
                const board = getGeneographBoard('gb1', { projectId: 'p1' });
                const empty = structuredClone(board);
                empty.id = 'preview-empty';
                empty.title = 'Empty preview';
                empty.diagram.nodes = [];
                empty.diagram.connections = [];
                sampleData.boards.push(empty);
                const hidden = structuredClone(board);
                hidden.id = 'preview-hidden';
                hidden.title = 'Hidden preview';
                hidden.diagram.nodes.forEach(node => { node.visible = false; });
                sampleData.boards.push(hidden);
                renderGeneographHome();
                return {
                    markup: renderGeneographBoardPreview(board, 'wide'),
                    cacheSize: geneoBoardPreviewCache.size,
                    boardCount: sampleData.boards.length
                };
            });
            assert.ok(grid.markup.includes('geneo-preview-art'));
            assert.ok(grid.markup.includes('<image'));
            assert.ok(grid.markup.includes('<polyline'));
            assert.ok(grid.cacheSize >= 3);
            const card = page.locator('[data-geneo-board-id="gb1"] .geneo-preview-art');
            assert.equal(await card.count(), 1);
            assert.ok((await card.boundingBox()).height > 40);
            assert.ok((await page.locator('[data-geneo-board-id="preview-empty"] .geneo-preview-art').count()) === 1);
            assert.equal(await page.locator('[data-geneo-board-id="preview-hidden"] .geneo-preview-art').count(), 1);
            if (process.env.GENEO_PREVIEW_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_PREVIEW_SCREENSHOT_DIR, `geneograph-cover-grid-${width}.png`) });
            const frames = await page.evaluate(() => {
                const board = getGeneographBoard('gb1', { projectId: 'p1' });
                const wide = renderGeneographBoardPreview(board, 'wide');
                state.geneoBoardViewMode = 'list';
                renderGeneographHome();
                const square = renderGeneographBoardPreview(board, 'square');
                const parse = markup => {
                    const div = document.createElement('div');
                    div.innerHTML = markup;
                    return div.querySelector('svg').viewBox.baseVal;
                };
                const w = parse(wide);
                const s = parse(square);
                const before = geneoBoardPreviewCache.get(board.id);
                touchGeneographBoard(board);
                return {
                    wideRatio: w.width / w.height,
                    squareRatio: s.width / s.height,
                    meaningfulFrames: w.width > 0 && s.width > 0
                        && Math.abs(w.x - s.x) < 1800,
                    invalidated: !geneoBoardPreviewCache.has(board.id),
                    boardIntact: board.diagram.nodes.length > 0 && before.board === board
                };
            });
            assert.ok(Math.abs(frames.wideRatio - 400 / 184) < .01);
            assert.ok(Math.abs(frames.squareRatio - 1) < .01);
            assert.ok(frames.meaningfulFrames);
            assert.ok(frames.invalidated && frames.boardIntact);
            const media = await page.evaluate(() => {
                const board = getGeneographBoard('gb1', { projectId: 'p1' });
                const imageNode = board.diagram.nodes.find(node => node.type === 'image'
                    && node.imageRef?.scope === 'project');
                const otherProject = structuredClone(board);
                otherProject.id = 'preview-other-project';
                otherProject.projectId = 'p2';
                const isolated = imageNode ? geneoPreviewImage(imageNode, otherProject) === '' : true;
                const before = renderGeneographBoardPreview(board, 'wide');
                const personNode = board.diagram.nodes.find(node => node.type === 'person');
                personNode.x += 100;
                touchGeneographBoard(board);
                const after = renderGeneographBoardPreview(board, 'wide');
                const changedAfterEdit = before !== after;
                const photo = imageNode ? getPhoto(imageNode.imageRef.id, { projectId: 'p1' }) : null;
                let changedAfterPhotoDeletion = true;
                if (photo) {
                    const cached = geneoBoardPreviewCache.get(board.id);
                    photo.deletedAt = new Date().toISOString();
                    renderGeneographBoardPreview(board, 'wide');
                    changedAfterPhotoDeletion = geneoBoardPreviewCache.get(board.id) !== cached;
                }
                return { isolated, changedAfterEdit, changedAfterPhotoDeletion };
            });
            assert.ok(media.isolated && media.changedAfterEdit && media.changedAfterPhotoDeletion);
            const crop = await page.evaluate(() => {
                const nodes = Array.from({ length: 5 }, (_, index) => ({
                    id: `dense-${index}`, type: 'person', x: index * 170, y: index % 2 * 140,
                    width: 130, height: 100, visible: true
                }));
                nodes.push({ id: 'distant', type: 'image', x: 6000, y: 0,
                    width: 300, height: 200, visible: true });
                const scene = geneoPreviewScene(nodes);
                const wide = geneoPreviewFrame(scene, 'wide');
                const square = geneoPreviewFrame(scene, 'square');
                return {
                    wideCropsOutlier: wide.x + wide.width < 6000,
                    squareCropsOutlier: square.x + square.width < 6000,
                    squareContainsCluster: square.x < 0 && square.x + square.width > 810
                };
            });
            assert.ok(crop.wideCropsOutlier && crop.squareCropsOutlier && crop.squareContainsCluster);
            if (process.env.GENEO_PREVIEW_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_PREVIEW_SCREENSHOT_DIR, `geneograph-cover-list-${width}.png`) });
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph board preview checks passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
