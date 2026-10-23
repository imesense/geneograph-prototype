const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {})
    });
    try {
        for (const [width, language] of [[1440, 'en'], [390, 'ru'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
            }, language);
            assert.equal(await page.evaluate(() => state.geneoPersonGender), 'male');
            for (const selector of ['[data-geneo-content-menu]', '[data-geneo-shape-menu]']) {
                const trigger = page.locator(selector);
                if (!await trigger.isVisible()) continue;
                await trigger.click();
                assert.equal(await page.locator('#projectMenu').count(), 1);
                await trigger.click();
                assert.equal(await page.locator('#projectMenu').count(), 0);
                assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
            }
            const visible = await page.locator('[data-tool-split="person"]').isVisible();
            if (visible) {
                assert.equal(await page.locator('[data-geneo-person-main] span').innerText(), language === 'ru' ? 'Человек' : 'Person');
                await page.locator('[data-geneo-person-menu]').click();
                await page.locator('[data-geneo-person-menu]').click();
                assert.equal(await page.locator('#projectMenu').count(), 0);
                await page.locator('[data-geneo-person-menu]').click();
            } else {
                await page.locator('[data-geneo-toolbar-overflow]').click();
                await page.locator('[data-geneo-toolbar-action="person-gender"]').click();
            }
            const menu = page.locator('#projectMenu');
            await menu.waitFor({ state: 'visible' });
            assert.equal(await menu.locator('[role="menuitemradio"]').count(), 3,
                `${width}: ${await page.evaluate(() => document.querySelector('#projectMenu')?.outerHTML || 'no menu')}`);
            assert.equal(await menu.locator('[data-geneo-person-gender="male"]').getAttribute('aria-checked'), 'true');
            await menu.locator('[data-geneo-person-gender="female"]').click();
            assert.equal(await page.locator('#geneoPersonGender').inputValue(), 'female');
            assert.equal(await page.evaluate(() => state.geneoPersonGender), 'female');
            await page.locator('#geneoPersonGender').selectOption('unknown');
            await page.locator('.geneo-person-modal .close-button').click();
            await page.waitForTimeout(50);
            if (visible) assert.equal(await page.locator('[data-geneo-person-menu]').evaluate(el => el === document.activeElement), false);
            if (visible) {
                await page.locator('[data-geneo-person-main]').click();
            } else {
                await page.locator('[data-geneo-toolbar-overflow]').click();
                await page.locator('[data-geneo-toolbar-action="person"]').click();
            }
            assert.equal(await page.locator('#geneoPersonGender').inputValue(), 'female');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.geneo-person-modal').count(), 0);
            if (visible) assert.equal(await page.locator('[data-tool-split="person"]').evaluate(split => {
                const focused = split.querySelector(':focus-visible');
                return focused ? getComputedStyle(focused).outlineStyle : 'none';
            }), 'none');
            if (visible) {
                await page.locator('[data-geneo-person-menu]').click();
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#projectMenu').count(), 0);
                assert.equal(await page.locator('[data-tool-split="person"]').evaluate(split => {
                    const focused = split.querySelector(':focus-visible');
                    return focused ? getComputedStyle(focused).outlineStyle : 'none';
                }), 'none');
                await page.keyboard.press('Tab');
                assert.equal(await page.locator('[data-tool-split="person"]').evaluate(split => split.classList.contains('escape-dismissed')), false);
                await page.locator('[data-geneo-person-menu]').click();
            } else {
                await page.locator('[data-geneo-toolbar-overflow]').click();
                await page.locator('[data-geneo-toolbar-action="person-gender"]').click();
            }
            await page.locator('#projectMenu').waitFor({ state: 'visible' });
            await page.locator('#projectMenu [data-geneo-person-gender="unknown"]').click();
            assert.equal(await page.locator('#geneoPersonGender').inputValue(), 'unknown');
            await page.locator('.geneo-person-modal .close-button').click();
            assert.equal(await page.evaluate(() => {
                openGeneographPersonModal('gp-daisy');
                return document.querySelector('#geneoPersonGender')?.value;
            }), 'female');
            await page.locator('.geneo-person-modal .close-button').click();
            assert.equal(await page.evaluate(() => {
                openGeneographPersonModal('', { relative: { type: 'mother', anchorNodeId: 'gn-silver' } });
                return document.querySelector('#geneoPersonGender')?.value;
            }), 'female');
            await page.locator('.geneo-person-modal .close-button').click();
            assert.equal(await page.evaluate(() => {
                const board = structuredClone(getGeneographBoard('gb1', { projectId: 'p1' }));
                board.id = 'person-toolbar-test-board';
                sampleData.boards.push(board);
                openGeneographBoard(board.id);
                openGeneographBoard('gb1');
                return state.geneoPersonGender;
            }), 'unknown');
            assert.deepEqual(errors, []);
            await page.reload();
            assert.equal(await page.evaluate(() => state.geneoPersonGender), 'male');
            await page.close();
        }
    } finally {
        await browser.close();
    }
    process.stdout.write('Geneograph person toolbar passed.\n');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
