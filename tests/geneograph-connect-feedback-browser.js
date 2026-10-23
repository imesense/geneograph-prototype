const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                activateGeneographConnectionTool();
            }, language);
            const evaluateTarget = async (source, target) => page.evaluate(({ source, target }) => {
                state.geneoConnectionDraft = source;
                const selector = target.familyId
                    ? `[data-geneo-family-junction="${target.familyId}"]`
                    : `[data-geneo-port-node="${target.nodeId}"][data-geneo-port="${target.port}"]`;
                const element = document.querySelector(selector);
                setGeneographConnectionHoverTarget(element);
                const tip = document.querySelector('[data-geneo-connection-tip]');
                return { text: tip?.textContent || '', invalid: tip?.classList.contains('invalid') || false,
                    snapped: JSON.stringify(geneoCanvasRuntime.connectionPreviewPoint) === JSON.stringify(geneoConnectionPoint(target)) };
            }, { source, target });
            const socket = (nodeId, port) => ({ nodeId, port });
            const family = familyId => ({ familyId, port: 'bottom' });
            const partners = await evaluateTarget(socket('gn-silver', 'right'), socket('gn-luna', 'left'));
            assert.equal(partners.text, language === 'ru' ? 'Связать как партнёров' : 'Connect as partners');
            assert.equal(partners.invalid, false);
            assert.equal(partners.snapped, true);
            assert.match((await evaluateTarget(socket('gn-silver', 'top'), socket('gn-luna', 'top'))).text,
                language === 'ru' ? /братьев или сестёр/ : /siblings/);
            const parent = await evaluateTarget(socket('gn-barnaby', 'bottom'), socket('gn-theo', 'top'));
            assert.match(parent.text, /Barnaby/);
            assert.match(parent.text, /Theo/);
            assert.equal(parent.invalid, false);
            assert.equal((await evaluateTarget(socket('gn-theo', 'top'), socket('gn-barnaby', 'bottom'))).text, parent.text);
            assert.match((await evaluateTarget(family('gf-whiskerfield'), socket('gn-theo', 'top'))).text, /Theo/);
            assert.equal((await evaluateTarget(socket('gn-image', 'left'), socket('gn-sticky', 'right'))).text, '');
            assert.equal((await evaluateTarget(family('gf-whiskerfield'), socket('gn-silver', 'top'))).invalid, true);
            assert.equal((await evaluateTarget(socket('gn-silver', 'bottom'), socket('gn-barnaby', 'top'))).invalid, true);
            assert.equal((await evaluateTarget(socket('gn-silver', 'right'), socket('gn-luna', 'top'))).invalid, true);
            await page.evaluate(() => { state.geneoConnectionDraft = null; setGeneographConnectionHoverTarget(null); });

            const target = page.locator('[data-geneo-port-node="gn-daisy"][data-geneo-port="left"]');
            await target.scrollIntoViewIfNeeded();
            await page.evaluate(() => { state.geneoConnectionDraft = { nodeId: 'gn-silver', port: 'right' }; });
            await target.hover();
            assert.equal(await page.locator('[data-geneo-connection-tip]').count(), 1);
            if (language === 'en' && process.env.GENEO_FEEDBACK_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_FEEDBACK_SCREENSHOT_DIR, 'connect-feedback-desktop.png') });
            const geometry = await page.locator('[data-geneo-connection-tip]').evaluate(tip => {
                const rect = tip.getBoundingClientRect();
                const viewport = document.querySelector('[data-geneo-canvas-viewport]').getBoundingClientRect();
                const card = document.querySelector('[data-geneo-node="gn-daisy"]').getBoundingClientRect();
                return { contained: rect.left >= viewport.left && rect.right <= viewport.right && rect.top >= viewport.top && rect.bottom <= viewport.bottom,
                    clearOfCard: rect.right <= card.left || rect.left >= card.right || rect.bottom <= card.top || rect.top >= card.bottom };
            });
            assert.equal(geometry.contained, true);
            assert.equal(geometry.clearOfCard, true);
            await page.mouse.move(10, 200);
            assert.equal(await page.locator('[data-geneo-connection-tip]').count(), 0);
            await target.focus();
            assert.equal(await page.locator('[data-geneo-connection-tip]').count(), 1);
            await page.keyboard.press('Tab');
            assert.equal(await page.locator('[data-geneo-connection-tip]').count(), 0);

            const card = page.locator('[data-geneo-node="gn-daisy"]');
            await card.scrollIntoViewIfNeeded();
            const cardBox = await card.boundingBox();
            await page.mouse.click(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2, { button: 'right' });
            assert.equal(await page.evaluate(() => state.geneoTool), 'connect');
            assert.equal(await page.locator('.geneo-object-context-menu').count(), 1,
                await page.evaluate(({ x, y }) => JSON.stringify({ hit: document.elementFromPoint(x, y)?.outerHTML.slice(0, 160), menus: [...document.querySelectorAll('.menu-popover')].map(menu => menu.className) }),
                    { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 }));
            await page.evaluate(() => closeGeneographObjectContextMenu());
            const empty = await page.evaluate(() => {
                const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
                for (let y = rect.top + 60; y < rect.bottom - 60; y += 25)
                    for (let x = rect.left + 60; x < rect.right - 60; x += 25)
                        if (!geneographCanvasTargetIsInteractive(document.elementFromPoint(x, y))) return { x, y };
                return null;
            });
            assert.ok(empty);
            await page.mouse.click(empty.x, empty.y, { button: 'right' });
            assert.deepEqual(await page.evaluate(() => ({ tool: state.geneoTool, draft: state.geneoConnectionDraft,
                strip: Boolean(document.querySelector('[data-geneo-connection-panel]')) })),
                { tool: 'pan', draft: null, strip: false });
            await page.evaluate(() => activateGeneographConnectionTool());
            const emptyAgain = await page.evaluate(() => {
                const rect = document.querySelector('[data-geneo-canvas-wrap]').getBoundingClientRect();
                for (let y = rect.top + 60; y < rect.bottom - 60; y += 25)
                    for (let x = rect.left + 60; x < rect.right - 60; x += 25)
                        if (!geneographCanvasTargetIsInteractive(document.elementFromPoint(x, y))) return { x, y };
                return null;
            });
            assert.ok(emptyAgain);
            await page.mouse.click(emptyAgain.x, emptyAgain.y, { button: 'right' });
            assert.equal(await page.evaluate(() => state.geneoTool), 'pan');
            assert.deepEqual(errors, []);
            await page.close();
        }
        const phone = await browser.newPage({ viewport: { width: 320, height: 700 } });
        await phone.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await phone.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            activateGeneographConnectionTool();
            state.geneoConnectionDraft = { nodeId: 'gn-silver', port: 'right' };
        });
        const phoneTarget = phone.locator('[data-geneo-port-node="gn-luna"][data-geneo-port="left"]');
        await phoneTarget.scrollIntoViewIfNeeded();
        await phoneTarget.focus();
        const phoneTip = await phone.locator('[data-geneo-connection-tip]').evaluate(tip => {
            const rect = tip.getBoundingClientRect();
            const viewport = document.querySelector('[data-geneo-canvas-viewport]').getBoundingClientRect();
            const card = document.querySelector('[data-geneo-node="gn-luna"]').getBoundingClientRect();
            return { left: rect.left >= viewport.left, right: rect.right <= viewport.right,
                top: rect.top >= viewport.top, bottom: rect.bottom <= viewport.bottom,
                clearOfCard: rect.right <= card.left || rect.left >= card.right || rect.bottom <= card.top || rect.top >= card.bottom };
        });
        assert.deepEqual(phoneTip, { left: true, right: true, top: true, bottom: true, clearOfCard: true });
        if (process.env.GENEO_FEEDBACK_SCREENSHOT_DIR)
            await phone.screenshot({ path: path.join(process.env.GENEO_FEEDBACK_SCREENSHOT_DIR, 'connect-feedback-phone.png') });
        await phone.close();
        console.log('Geneograph connection feedback passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
