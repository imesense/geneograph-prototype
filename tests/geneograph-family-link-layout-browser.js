const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE }
            : {}),
        headless: true
    });
    try {
        for (const width of [390, 1280]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                const person = selectedGeneographDiagram().nodes.find(node => node.type === 'person');
                state.selectedGeneoNodeId = person.id;
                state.selectedGeneoNodeIds = [person.id];
                openGeneographTreePersonPicker();
            });
            const layout = await page.locator('.geneo-tree-person-picker-modal').evaluate(modal => {
                const body = modal.querySelector('.photo-people-body');
                const results = modal.querySelector('.photo-people-results');
                const footer = modal.querySelector('.modal-footer');
                const rect = element => element.getBoundingClientRect();
                return {
                    modal: rect(modal).toJSON(),
                    body: rect(body).toJSON(),
                    results: rect(results).toJSON(),
                    footer: rect(footer).toJSON(),
                    columns: getComputedStyle(body).gridTemplateColumns
                };
            });
            assert.ok(layout.modal.width <= (width <= 540 ? width : 600));
            assert.ok(layout.results.width > layout.body.width * .8);
            assert.ok(layout.results.height > 150);
            assert.ok(layout.results.bottom <= layout.footer.top);
            assert.ok(layout.footer.bottom <= 720);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph Family Tree link picker layout passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
