const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '../src');

(async () =>
{
    const server = http.createServer((request, response) =>
    {
        const target = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target))
        {
            response.writeHead(404).end();
            return;
        }
        const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
            '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(target)] || 'application/octet-stream';
        response.setHeader('Content-Type', type);
        fs.createReadStream(target).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/index.html`;
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}),
        headless: true
    });
    try
    {
        for (const [width, language] of [[1280, 'en'], [390, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 }, acceptDownloads: true });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                selectedGeneographDiagram().connections[0].visible = false;
            });
            const before = await page.evaluate(() => ({
                board: structuredClone(selectedGeneographBoard()),
                count: sampleData.boards.length
            }));
            const json = await page.evaluate(() => buildGeneographBoardFile());
            const payload = JSON.parse(json);
            assert.equal(payload.format, 'geneograph-board');
            assert.equal(payload.version, 1);
            assert.equal(payload.board.diagram.nodes.length, before.board.diagram.nodes.length);
            assert.equal(payload.board.diagram.connections.length, before.board.diagram.connections.length);
            assert.equal(payload.board.diagram.connections[0].visible, false);
            assert.ok(payload.board.diagram.assets.every(asset => /^data:image\/(?:jpeg|png|webp);base64,/.test(asset.src)));
            assert.ok(payload.board.diagram.nodes.some(node => node.type === 'image' && node.imageRef?.scope === 'board'));
            assert.ok(payload.board.diagram.people.some(person => person.photoAssetId));
            assert.ok(payload.viewport?.center && Number.isFinite(payload.viewport.zoom));
            assert.deepEqual(await page.evaluate(() => selectedGeneographBoard().diagram), before.board.diagram,
                'export does not mutate the board');

            if (await page.locator('[data-geneo-export]').isVisible())
                await page.locator('[data-geneo-export]').click();
            else
            {
                await page.locator('[data-geneo-toolbar-overflow]').click();
                await page.locator('[data-geneo-toolbar-action="export"]').click();
            }
            assert.ok(await page.locator('[data-geneo-export-file]').isVisible());
            assert.ok(await page.locator('[data-geneo-export-png]').isVisible());
            const downloadPromise = page.waitForEvent('download');
            await page.locator('[data-geneo-export-file]').click();
            assert.match((await downloadPromise).suggestedFilename(), /\.ggboard$/);
            if (width === 1280)
            {
                await page.locator('[data-geneo-export]').click();
                const pngDownload = page.waitForEvent('download', { timeout: 60000 });
                await page.locator('[data-geneo-export-png]').click();
                assert.match((await pngDownload).suggestedFilename(), /\.png$/);
            }

            await page.evaluate(() =>
            {
                state.geneoView = 'home';
                render();
            });
            const input = page.locator('[data-geneo-import-file]');
            await input.setInputFiles({ name: 'roundtrip.ggboard', mimeType: 'application/json', buffer: Buffer.from(json) });
            await page.waitForFunction(() => state.geneoView === 'board' && sampleData.boards.length > 1);
            const imported = await page.evaluate(() => ({
                board: structuredClone(selectedGeneographBoard()),
                viewport: geneoSavedViewport(selectedGeneographBoard().id),
                count: sampleData.boards.length
            }));
            assert.notEqual(imported.board.id, before.board.id);
            assert.equal(imported.count, before.count + 1);
            assert.equal(imported.board.diagram.nodes.length, before.board.diagram.nodes.length);
            assert.equal(imported.board.diagram.connections.length, before.board.diagram.connections.length);
            assert.equal(imported.board.diagram.connections[0].visible, false);
            assert.equal(imported.board.favorite, false);
            assert.equal(imported.board.archived, false);
            assert.deepEqual(imported.board.collectionIds, []);
            assert.ok(imported.viewport);
            assert.ok(imported.board.diagram.people.some(person => person.photoAssetId));

            const second = await page.evaluate(payload =>
            {
                const board = importGeneographBoardPayload(payload);
                return { id: board.id, count: sampleData.boards.length };
            }, payload);
            assert.notEqual(second.id, imported.board.id);
            assert.equal(second.count, imported.count + 1);

            const detached = await page.evaluate(payload =>
            {
                const project = createBlankProject({ name: 'Other family' });
                activateProject(project.id, { moduleName: 'Geneograph' });
                const board = importGeneographBoardPayload(payload);
                const person = board.diagram.people.find(item => item.photoAssetId);
                return {
                    links: board.diagram.people.filter(item => item.treePersonId).length,
                    photo: geneoPersonAvatarModel(person).embeddedPhoto?.src,
                    placeLinks: board.diagram.nodes.filter(node => node.placeRef?.scope === 'project').length,
                    image: board.diagram.nodes.find(node => node.type === 'image')?.imageRef,
                    active: selectedGeneographBoard()?.id === board.id
                };
            }, payload);
            assert.equal(detached.links, 0);
            assert.equal(detached.placeLinks, 0);
            assert.match(detached.photo, /^data:image\//);
            assert.equal(detached.image.scope, 'board');
            assert.equal(detached.active, true);

            const failedExport = await page.evaluate(async () =>
            {
                const board = selectedGeneographBoard();
                const image = board.diagram.nodes.find(node => node.type === 'image');
                const previous = image.imageRef;
                image.imageRef = { scope: 'project', id: 'missing-photo' };
                const before = JSON.stringify(board.diagram);
                let rejected = false;
                try { await buildGeneographBoardFile(board); }
                catch (_) { rejected = true; }
                const unchanged = JSON.stringify(board.diagram) === before;
                image.imageRef = previous;
                return { rejected, unchanged };
            });
            assert.deepEqual(failedExport, { rejected: true, unchanged: true });

            const invalidCount = await page.evaluate(payload =>
            {
                const count = sampleData.boards.length;
                try { importGeneographBoardPayload({ format: 'geneograph-board', version: 9 }); }
                catch (_) { /* expected */ }
                const bad = structuredClone(payload);
                bad.board.diagram.assets[0].src = 'data:image/png;base64,PHNjcmlwdD4=';
                try { importGeneographBoardPayload(bad); }
                catch (_) { /* expected */ }
                return [count, sampleData.boards.length];
            }, payload);
            assert.deepEqual(invalidCount, [second.count + 1, second.count + 1]);
            assert.deepEqual(errors, [], 'no browser errors');
            await page.close();
        }
    }
    finally
    {
        await browser.close();
        server.close();
    }
    console.log('Geneograph editable board file checks passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
