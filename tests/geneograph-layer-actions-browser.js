const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: width < 900 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                setGeneographSelection([], []);
                renderGeneographEditorPreserveScroll();
                if (window.innerWidth < 900) openMobileSurface('sections');
            }, language);
            const sidebar = page.locator('.geneo-board-panel');
            const row = sidebar.locator('[data-geneo-layer]').first();
            const actions = row.locator('.geneo-layer-actions');
            const geometry = async () => row.evaluate(element => {
                const name = element.querySelector('.name').getBoundingClientRect();
                const group = element.querySelector('.geneo-layer-actions');
                const buttons = [...group.querySelectorAll('button')];
                return { nameRight: name.right, groupWidth: group.getBoundingClientRect().width,
                    display: getComputedStyle(group).display,
                    gaps: buttons.slice(1).map((button, index) => button.getBoundingClientRect().left - buttons[index].getBoundingClientRect().right),
                    centered: buttons.every(button => {
                        const box = button.getBoundingClientRect();
                        const svg = button.querySelector('svg').getBoundingClientRect();
                        return Math.abs((box.left + box.right) / 2 - (svg.left + svg.right) / 2) < 1
                            && Math.abs((box.top + box.bottom) / 2 - (svg.top + svg.bottom) / 2) < 1;
                    }) };
            });
            const before = await geometry();
            assert.equal(before.display, 'none');
            assert.equal(before.groupWidth, 0);
            await row.hover();
            const hovered = await geometry();
            assert.equal(hovered.display, 'flex');
            assert.equal(hovered.groupWidth > 75, true);
            assert.deepEqual(hovered.gaps.map(Math.round), [2, 2]);
            assert.equal(hovered.centered, true);
            assert.equal(hovered.nameRight < before.nameRight, true);
            await sidebar.locator('#geneoLayerSearch').hover();
            assert.equal((await geometry()).display, 'none');
            await row.click();
            assert.equal(await actions.evaluate(group => getComputedStyle(group).display), 'flex');
            await sidebar.locator('[data-geneo-layer]').nth(1).click();
            assert.equal(await actions.evaluate(group => getComputedStyle(group).display), 'none');
            await row.focus();
            assert.equal(await actions.evaluate(group => getComputedStyle(group).display), 'flex');
            await page.keyboard.press('Tab');
            assert.equal(await row.locator('[data-geneo-locate-node]').evaluate(button => document.activeElement === button), true);

            const panel = sidebar.locator('.geneo-layer-panel-head .geneo-layer-row').first();
            assert.equal(await panel.locator('.geneo-layer-actions button').count(), 3);
            await panel.hover();
            assert.equal(await panel.locator('.geneo-layer-actions').evaluate(group => getComputedStyle(group).display), 'flex');
            const connection = sidebar.locator('[data-geneo-layer-connection]').first();
            assert.equal(await connection.locator('.geneo-layer-actions button').count(), 2);
            await connection.hover();
            assert.equal(await connection.locator('.geneo-layer-actions').evaluate(group => getComputedStyle(group).display), 'flex');
            await connection.click();
            await sidebar.locator('#geneoLayerSearch').hover();
            assert.equal(await connection.locator('.geneo-layer-actions').evaluate(group => getComputedStyle(group).display), 'flex');
            await page.evaluate(() => {
                const ids = selectedGeneographDiagram().nodes.slice(0, 2).map(node => node.id);
                getGeneographNode(ids[0]).visible = false;
                setGeneographSelection(ids, []);
                renderGeneographEditorPreserveScroll();
            });
            const selected = sidebar.locator('[data-geneo-layer].selected');
            assert.equal(await selected.count(), 2);
            assert.equal(await selected.evaluateAll(rows => rows.every(row => getComputedStyle(row.querySelector('.geneo-layer-actions')).display === 'flex')), true);
            const hiddenId = await page.evaluate(() => selectedGeneographDiagram().nodes[0].id);
            assert.equal(await sidebar.locator(`[data-geneo-layer="${hiddenId}"] [data-geneo-locate-node]`).isDisabled(), true);
            assert.equal(await sidebar.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph layer actions passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
