const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

async function touch(cdp, type, points)
{
    await cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points.map(([x, y, id]) => ({ x, y, id }))
    });
}

(async () =>
{
    const browser = await chromium.launch({ headless: true });
    try
    {
        for (const width of [320, 390, 768])
        {
            const page = await browser.newPage({
                viewport: { width, height: 720 },
                isMobile: true,
                hasTouch: true
            });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'Family Tree';
                render();
            });
            const cdp = await page.context().newCDPSession(page);
            const canvas = page.locator('.tree-canvas');
            const rect = await canvas.boundingBox();
            assert.ok(rect, 'tree canvas visible');
            const x = rect.x + rect.width * .65;
            const y = rect.y + rect.height * .45;
            const before = await page.evaluate(() => state.treeZoom);
            await touch(cdp, 'touchStart', [[x - 25, y, 1], [x + 25, y, 2]]);
            for (let n = 1; n <= 6; n++)
            {
                await touch(cdp, 'touchMove', [[x - 25 - n * 5, y, 1], [x + 25 + n * 5, y, 2]]);
            }
            await touch(cdp, 'touchEnd', []);
            assert.ok(await page.evaluate(() => state.treeZoom) > before, `pinch zoom at ${width}px`);
            const scrollBefore = await canvas.evaluate(element => element.scrollLeft);
            await touch(cdp, 'touchStart', [[x, y, 7]]);
            for (let n = 1; n <= 6; n++)
            {
                await touch(cdp, 'touchMove', [[x - n * 12, y, 7]]);
            }
            await touch(cdp, 'touchEnd', []);
            assert.ok(await canvas.evaluate(element => element.scrollLeft) > scrollBefore, `one-finger pan at ${width}px`);

            await page.evaluate(() =>
            {
                state.activeModule = 'Geneograph';
                state.geneoView = 'home';
                render();
                openGeneographBoard('gb1');
            });
            const node = page.locator('article[data-geneo-node="gn-silver"]');
            await node.scrollIntoViewIfNeeded();
            const nodeRect = await node.boundingBox();
            assert.ok(nodeRect, 'sample person visible');
            const startX = nodeRect.x + nodeRect.width / 2;
            const startY = nodeRect.y + Math.min(30, nodeRect.height / 2);
            const nodeBefore = await page.evaluate(() => getGeneographNode('gn-silver').x);
            await touch(cdp, 'touchStart', [[startX, startY, 3]]);
            for (let n = 1; n <= 8; n++)
            {
                await touch(cdp, 'touchMove', [[startX + n * 9, startY, 3]]);
            }
            await touch(cdp, 'touchEnd', []);
            const nodeAfter = await page.evaluate(() => getGeneographNode('gn-silver').x);
            assert.ok(nodeAfter > nodeBefore + 50, `object drag at ${width}px`);
            const movedRect = await node.boundingBox();
            const movedX = movedRect.x + movedRect.width / 2;
            const movedY = movedRect.y + Math.min(30, movedRect.height / 2);
            await touch(cdp, 'touchStart', [[movedX, movedY, 4]]);
            await touch(cdp, 'touchMove', [[movedX + 18, movedY, 4]]);
            await touch(cdp, 'touchStart', [[movedX + 18, movedY, 4], [movedX - 25, movedY + 30, 5]]);
            await touch(cdp, 'touchMove', [[movedX + 40, movedY, 4], [movedX - 25, movedY + 30, 5]]);
            await touch(cdp, 'touchCancel', []);
            assert.equal(await page.evaluate(() => getGeneographNode('gn-silver').x), nodeAfter,
                `canceled drag restored at ${width}px`);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
