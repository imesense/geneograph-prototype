const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('https://**/*', route => route.abort());
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.waitForFunction(() => document.querySelector('#topbar')?.children.length > 0);
            const nodeId = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                const node = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-daisy');
                const person = diagram.people.find(item => item.id === 'gp-daisy');
                person.birth.placeText = 'Pawford, North Yorkshire, England';
                person.death.placeText = 'Pawford, North Yorkshire, England';
                node.personCard = geneoEmptyPersonCardOverrides();
                node.personCard.custom = true;
                node.personCard.style = 'portrait';
                diagram.personCardDefaults.fields.linkIndicator = false;
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
                return node.id;
            }, language);
            const card = page.locator(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), null);
            await page.locator('[data-geneo-person-card-field="linkIndicator"][data-geneo-person-card-scope="node"]').check();
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), 'linked');
            assert.equal(await card.locator('.geneo-person-link-indicator').count(), 0);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), 'linked');

            if (language === 'ru') await page.setViewportSize({ width: 390, height: 800 });
            for (const [width, height] of [[170, 260], [200, 330], [420, 420]]) {
                const layout = await page.evaluate(({ nodeId, width, height }) => {
                    const node = getGeneographNode(nodeId);
                    node.width = width;
                    node.height = height;
                    renderGeneographEditorPreserveScroll();
                    const card = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
                    const bounds = card.getBoundingClientRect();
                    const content = card.querySelector('.geneo-person-node-content').getBoundingClientRect();
                    const events = [...card.querySelectorAll('.geneo-person-life-event')].map(row => {
                        const label = row.querySelector('.geneo-person-life-event-kind').getBoundingClientRect();
                        const value = row.querySelector('.geneo-person-life-event-value').getBoundingClientRect();
                        return { separate: label.right <= value.left + 1 || label.bottom <= value.top + 1,
                            inside: label.left >= bounds.left - 1 && value.right <= bounds.right + 1 };
                    });
                    return { count: events.length, events,
                        noOverflow: content.right <= bounds.right + 1 && content.bottom <= bounds.bottom + 1 };
                }, { nodeId, width, height });
                assert.equal(layout.count, 2);
                assert.ok(layout.events.every(event => event.separate && event.inside) && layout.noOverflow,
                    JSON.stringify({ language, width, height, layout }));
                if (process.env.GENEO_SCREENSHOT_DIR && language === 'ru')
                    await card.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `geneo-portrait-${width}.png`) });
            }
            if (language === 'ru') await page.setViewportSize({ width: 1280, height: 800 });

            await page.evaluate(() => {
                state.selectedGeneoNodeId = '';
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();
            });
            await page.locator('[data-geneo-person-card-field="linkIndicator"][data-geneo-person-card-scope="board"]').check();
            const boardCard = page.locator('.geneo-node-person[data-geneo-node="gn-iris"]');
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), 'board');
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), 'board');

            const statuses = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const linkedNode = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-daisy');
                const boardNode = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-iris');
                diagram.personCardDefaults.fields.linkIndicator = true;
                sampleData.people.find(item => item.id === 'daisy').deleted = true;
                renderGeneographEditorPreserveScroll();
                return {
                    broken: document.querySelector(`.geneo-node-person[data-geneo-node="${linkedNode.id}"]`).dataset.geneoPersonLinkStatus,
                    board: document.querySelector(`.geneo-node-person[data-geneo-node="${boardNode.id}"]`).dataset.geneoPersonLinkStatus
                };
            });
            assert.deepEqual(statuses, { broken: 'attention', board: 'board' });
            await page.evaluate(() => { sampleData.people.find(item => item.id === 'daisy').deleted = false; });
            await page.evaluate(() => {
                state.geneoView = 'home';
                renderGeneograph();
                openGeneographBoard('gb1');
            });
            assert.equal(await page.locator('.geneo-node-person[data-geneo-node="gn-iris"]')
                .getAttribute('data-geneo-person-link-status'), 'board');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph portrait layout and link indicator passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
