const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true });
    try
    {
        for (const [width, language] of [[320, 'en'], [390, 'ru'], [768, 'en'], [900, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'Family Tree';
                render();
            });
            await page.locator('[data-mobile-details]').click();
            const sheet = page.locator('.tree-inspector');
            assert.equal(await sheet.isVisible(), true);
            await page.locator('#quickEdit').click();
            assert.equal(await page.locator('#modalBackdrop').evaluate(el => el.classList.contains('open')), true);
            await page.keyboard.press('Escape');
            assert.equal(await sheet.isVisible(), true, `Family Tree sheet survives modal at ${width}`);
            await page.waitForFunction(() => document.activeElement?.id === 'quickEdit');
            assert.equal(await page.locator('#quickEdit').evaluate(el => el === document.activeElement), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#mobileDetailsClose').count(), 0);

            await page.evaluate(() => { state.activeModule = 'People'; render(); });
            const peopleToolbar = page.locator('.people-normal-toolbar');
            assert.equal(await page.locator('[data-people-mobile-search]').isVisible(), true);
            await page.locator('[data-people-mobile-search]').click();
            await page.locator('#peopleSearch').fill('Silver');
            assert.equal(await page.locator('#peopleSearch').isVisible(), true);
            await page.locator('[data-people-mobile-search-close]').click();
            assert.equal(await peopleToolbar.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);

            await page.evaluate(() => { state.activeModule = 'Geneograph'; state.geneoView = 'home'; render(); });
            await page.locator('[data-geneo-mobile-search]').click();
            await page.locator('#geneoBoardSearch').fill('family');
            assert.equal(await page.locator('#geneoBoardSearch').isVisible(), true);
            await page.locator('[data-geneo-mobile-search-close]').click();
            assert.equal(await page.locator('.geneo-board-toolbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);

            await page.evaluate(() => { state.geneoBoardSearch = ''; renderGeneographHome(); openGeneographBoard('gb1'); });
            const modeWidth = await page.locator('.geneo-tool-group').evaluate(el => el.getBoundingClientRect().width);
            await page.locator('[data-geneo-tool="pan"]').click();
            assert.equal(await page.locator('.geneo-tool-group').evaluate(el => el.getBoundingClientRect().width), modeWidth);
            await page.locator('[data-geneo-tool="select"]').click();
            await page.locator('article[data-geneo-node="gn-silver"]').click();
            assert.equal(await page.locator('.geneo-tool-group').evaluate(el => el.getBoundingClientRect().width), modeWidth);
            const connect = page.locator('[data-geneo-connection-main]');
            assert.equal(await connect.isVisible(), true);
            assert.equal(await page.locator('[data-geneo-connection-menu]').isVisible(), false);
            await connect.click();
            assert.equal(await page.evaluate(() => state.geneoTool), 'connect');
            await page.locator('[data-geneo-connection-main]').click();
            assert.equal(await page.locator('[data-geneo-connector="dashed"]').isVisible(), true);
            await page.locator('[data-geneo-connector="dashed"]').click();
            assert.equal(await page.evaluate(() => state.geneoConnectorPattern), 'dashed');
            assert.equal(await page.locator('.geneo-editor-toolbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
