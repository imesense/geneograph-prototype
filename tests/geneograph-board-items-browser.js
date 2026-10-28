const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                if (window.innerWidth <= 900) openMobileSurface('sections');
            }, language);
            const sidebar = page.locator('.geneo-board-panel');
            assert.equal(await sidebar.locator('.geneo-layers').count(), 1);
            assert.equal(await sidebar.locator('[data-geneo-sidebar-section="connections"]').count(), 0);
            const connectionId = await page.evaluate(() => selectedGeneographDiagram().connections
                .find(connection => connection.kind === 'family-child').id);
            const derived = await page.evaluate(id => geneoDefaultConnectionLabel(getGeneographConnection(id)), connectionId);
            assert.equal(/[→←↔]/.test(derived), false);
            assert.equal(derived.includes(':'), true);
            const connectionRow = sidebar.locator(`[data-geneo-layer-connection="${connectionId}"]`);
            assert.equal(await connectionRow.count(), 1);
            const endpoint = await page.evaluate(id => geneoConnectionEndpointNames(getGeneographConnection(id).target)[0], connectionId);
            await sidebar.locator('#geneoLayerSearch').fill(endpoint);
            assert.equal(await connectionRow.count(), 1);
            await sidebar.locator('#geneoLayerSearch').fill('no-such-board-item');
            assert.equal(await sidebar.locator('.geneo-item-empty').count(), 1);
            await sidebar.locator('#geneoLayerSearch').fill('');
            const trigger = sidebar.locator('[data-geneo-item-filter-trigger]');
            await trigger.click();
            assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
            assert.equal(await sidebar.locator('[data-geneo-item-filter-menu]').evaluate(menu => {
                const rect = menu.getBoundingClientRect();
                return rect.left >= 0 && rect.right <= window.innerWidth;
            }), true);
            await sidebar.locator('[data-geneo-item-filter-type="family-child"]').check();
            if (width < 900) assert.equal(await page.evaluate(() => document.body.classList.contains('mobile-sections-open')), true);
            assert.equal(await sidebar.locator('[data-geneo-layer]').evaluateAll(rows => rows.every(row => row.closest('[data-geneo-layer-block]').querySelector('[data-geneo-layer-connection]'))), true);
            assert.equal(await sidebar.locator('[data-geneo-layer-connection]').count() > 0, true);
            await page.keyboard.press('Escape');
            if (width < 900) assert.equal(await page.evaluate(() => document.body.classList.contains('mobile-sections-open')), true);
            assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
            assert.equal(await trigger.evaluate(button => document.activeElement === button), true);
            await trigger.click();
            await sidebar.locator('[data-geneo-item-filter-clear]').first().click();
            const originalVisible = await page.evaluate(id => getGeneographConnection(id).visible, connectionId);
            await connectionRow.hover();
            await connectionRow.locator('[data-geneo-toggle-connection-visible]').click();
            assert.equal(await page.evaluate(id => getGeneographConnection(id).visible, connectionId), !originalVisible);
            await trigger.click();
            await sidebar.locator('[data-geneo-item-filter-status="hidden"]').check();
            assert.equal(await connectionRow.count(), 1);
            await page.keyboard.press('Escape');
            await connectionRow.hover();
            await connectionRow.locator('[data-geneo-toggle-connection-visible]').click();
            assert.equal(await connectionRow.count(), 0);
            await trigger.click();
            await sidebar.locator('[data-geneo-item-filter-clear]').first().click();
            await connectionRow.hover();
            await connectionRow.locator('[data-geneo-locate-connection]').click();
            assert.equal(await page.evaluate(id => state.selectedGeneoConnectionId === id, connectionId), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally {
        await browser.close();
    }
    process.stdout.write('Geneograph board items passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
