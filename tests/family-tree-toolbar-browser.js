const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1440, 'en'], [1180, 'ru'], [900, 'en'], [390, 'ru'], [320, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 740 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Family Tree' });
                render();
            });
            assert.equal(await page.locator('.tree-toolbar [data-tree-navigation], .tree-toolbar #familyMoreActions, .tree-toolbar [data-tree-search]').count(), 0);
            assert.equal(await page.locator('[data-tree-view="Pedigree"]').isDisabled(), true);
            assert.equal(await page.locator('[data-tree-view="Fan"]').isDisabled(), true);
            assert.equal(await page.locator('.tree-people-status').isVisible(), true);
            assert.ok((await page.locator('.tree-people-status').innerText()).match(/\d+/));
            if (language === 'ru') assert.match(await page.locator('.tree-people-status').innerText(), /человек/);
            assert.equal(await page.locator('.tree-people-status').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
            const geometry = await page.evaluate(() =>
            {
                const rect = selector => document.querySelector(selector).getBoundingClientRect();
                const toolbar = rect('.tree-toolbar');
                const canvas = rect('.tree-canvas');
                const inspector = rect('.tree-inspector');
                return { toolbar: { top: toolbar.top, right: toolbar.right, bottom: toolbar.bottom },
                    canvas: { top: canvas.top, right: canvas.right },
                    inspector: { top: inspector.top, left: inspector.left },
                    viewport: innerWidth };
            });
            assert.ok(Math.abs(geometry.toolbar.right - geometry.canvas.right) <= 1, `toolbar ends at canvas edge ${width}px`);
            assert.ok(geometry.canvas.top >= geometry.toolbar.bottom - 1, `canvas begins below toolbar ${width}px`);
            if (width > 900)
            {
                assert.ok(Math.abs(geometry.inspector.top - geometry.toolbar.top) <= 1, `inspector rises to toolbar ${width}px`);
                assert.ok(Math.abs(geometry.inspector.left - geometry.toolbar.right) <= 1, `inspector abuts toolbar ${width}px`);
                await page.evaluate(() => { state.treeInspectorCollapsed = true; renderFamilyTree(); });
                assert.ok(await page.locator('.tree-toolbar').evaluate(el => Math.abs(el.getBoundingClientRect().right - innerWidth) <= 1), `collapsed toolbar fills width ${width}px`);
                assert.ok(await page.locator('.tree-canvas').evaluate(el => Math.abs(el.getBoundingClientRect().right - innerWidth) <= 1), `collapsed canvas fills width ${width}px`);
                await page.evaluate(() => { state.treeInspectorCollapsed = false; renderFamilyTree(); });
            }
            assert.ok(await page.locator('[data-tree-person-picker]').innerText());
            assert.ok(await page.locator('.tree-toolbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `toolbar fits ${width}px`);

            await page.locator('[data-tree-person-picker]').click();
            const search = page.locator('.tree-person-picker input');
            assert.equal(await search.isVisible(), true);
            assert.ok(await page.locator('[data-tree-picker-person]').count() > 0, 'recent people shown before typing');
            if (width <= 900) await page.locator('#mobileChoiceBackdrop').click({ position: { x: 8, y: 8 } });
            else await page.locator('.tree-canvas').click({ position: { x: 8, y: 8 } });
            assert.equal(await page.locator('.tree-person-picker').count(), 0, 'outside click closes picker');
            await page.locator('[data-tree-person-picker]').click();
            const searchAgain = page.locator('.tree-person-picker input');
            await searchAgain.fill('zzzz-no-such-person');
            assert.equal(await page.locator('[data-tree-picker-person]').count(), 0);
            await searchAgain.fill('Silver');
            assert.ok(await page.locator('[data-tree-picker-person]').count() > 0);
            const before = await page.evaluate(() => state.selectedPersonId);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.tree-person-picker').count(), 0);
            assert.equal(await page.evaluate(() => state.selectedPersonId), before);
            await page.locator('[data-tree-person-picker]').click();
            await page.locator('.tree-person-picker input').fill('Silver');
            await page.keyboard.press('Enter');
            assert.equal(await page.evaluate(() => state.selectedPersonId), 'silver');
            await page.locator('[data-tree-settings]').click();
            assert.equal(await page.locator('#modalBackdrop.open').count(), 1);
            assert.deepEqual(errors, [], `no errors at ${width}px`);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Family Tree toolbar and person picker passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
