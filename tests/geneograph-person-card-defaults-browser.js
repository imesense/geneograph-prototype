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
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(() => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                const node = selectedGeneographDiagram().nodes.find(item => item.type === 'person');
                node.personCard = geneoEmptyPersonCardOverrides();
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
            });
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-use-defaults]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-style]:disabled').count(), 0);
            assert.equal(await inspector.locator('#geneoPersonCardRadius').count(), 1);
            assert.equal(await inspector.locator('.panel-section:has([data-geneo-inspector-section="person:appearance"]) #geneoPersonCardRadius').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="person:appearance"]')
                .count(), 1);
            await page.evaluate(() => {
                const section = document.querySelector('[data-geneo-inspector-section="person:card"]');
                if (section.getAttribute('aria-expanded') === 'false') section.click();
                document.querySelector('[data-geneo-person-card-style="portrait"]').click();
            });
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 1);
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.style), 'portrait');
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-style="standard"]').click());
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 0);
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-style="portrait"]').click());
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-reset]').click());
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 0);
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.custom), false);
            await page.evaluate(() => {
                const radius = document.querySelector('#geneoPersonCardRadius');
                radius.value = '12';
                radius.dispatchEvent(new Event('change', { bubbles: true }));
            });
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), 12);
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').count(), 1);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), 12);
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-reset]').click());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), null);
            await page.evaluate(() => {
                selectedGeneographDiagram().personCardDefaults.cornerRadius = 16;
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await inspector.locator('#geneoPersonCardRadius').inputValue(), '16');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph person card defaults passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
