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
            const page = await browser.newPage({ viewport: { width, height: 720 }, hasTouch: true, isMobile: true });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            assert.equal(await page.locator('[data-mobile-menu]').count(), 0);
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'Family Tree';
                render();
            });
            assert.equal(await page.locator('[data-mobile-menu]').isVisible(), true);
            await page.locator('[data-mobile-details]').click();
            const sheet = page.locator('.tree-inspector');
            assert.equal(await sheet.isVisible(), true);
            const sheetScroll = await sheet.evaluate(el =>
            {
                el.scrollTop = Math.min(120, el.scrollHeight - el.clientHeight);
                return el.scrollTop;
            });
            await page.locator('#quickEdit').tap();
            assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
            await page.keyboard.press('Escape');
            assert.equal(await sheet.isVisible(), true, `Family Tree sheet survives modal at ${width}`);
            assert.equal(await sheet.evaluate(el => el.scrollTop), sheetScroll);
            await page.waitForFunction(() => document.activeElement?.id === 'quickEdit');
            assert.equal(await page.locator('#quickEdit').evaluate(el => el === document.activeElement), true);
            await page.locator('#quickEdit').tap();
            await page.locator('#modalBackdrop').tap({ position: { x: 2, y: 2 } });
            assert.equal(await page.locator('#modalBackdrop').evaluate(el => el.classList.contains('open')), false);
            assert.equal(await sheet.isVisible(), true);
            await page.locator('#familyMoreActions').tap();
            assert.equal(await page.locator('#projectMenu').isVisible(), true);
            assert.equal(await sheet.isVisible(), true);
            assert.equal(await page.locator('#familyMoreActions').getAttribute('aria-expanded'), 'true');
            await page.locator('#familyMoreActions').tap();
            assert.equal(await page.locator('#projectMenu').count(), 0);
            await page.locator('#familyMoreActions').tap();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#projectMenu').count(), 0);
            assert.equal(await sheet.isVisible(), true);
            await page.locator('#addRelative').tap();
            assert.equal(await page.locator('#relativePopover').isVisible(), true);
            await page.locator('#addRelative').tap();
            assert.equal(await page.locator('#relativePopover').count(), 0);
            await page.locator('#addRelative').tap();
            const popoverBox = await page.locator('#relativePopover').boundingBox();
            assert.ok(popoverBox.x >= 0 && popoverBox.x + popoverBox.width <= width);
            await page.keyboard.press('Escape');
            assert.equal(await sheet.isVisible(), true);
            await page.locator('#connectRelative').tap();
            assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
            if (width <= 390)
                assert.ok(await page.locator('.connect-person-results-panel').evaluate(el => el.getBoundingClientRect().height >= 220));
            await page.locator('#modalBackdrop [data-close]').first().tap();
            assert.equal(await sheet.isVisible(), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#mobileDetailsClose').count(), 0);

            await page.evaluate(() => { state.activeModule = 'People'; render(); });
            const peopleToolbar = page.locator('.people-normal-toolbar');
            assert.equal(await page.locator('[data-people-mobile-search]').isVisible(), width <= 540);
            assert.ok(await page.locator('#addPeoplePerson').evaluate(el => el.getBoundingClientRect().width > 44));
            if (width <= 540) await page.locator('[data-people-mobile-search]').click();
            await page.locator('#peopleSearch').fill('Silver');
            assert.equal(await page.locator('#peopleSearch').isVisible(), true);
            if (width <= 540) await page.locator('[data-people-mobile-search-close]').click();
            assert.equal(await peopleToolbar.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
            assert.ok(await peopleToolbar.evaluate(el =>
            {
                const rightmost = [...el.children].filter(child => child.getBoundingClientRect().width && getComputedStyle(child).display !== 'none').at(-1);
                return Math.abs(rightmost.getBoundingClientRect().right - el.getBoundingClientRect().right) <= 2;
            }));
            if (await page.locator('[data-mobile-details]').isVisible())
            {
                await page.locator('[data-mobile-details]').click();
                const peopleSheet = page.locator('.people-person-sidebar');
                assert.equal(await peopleSheet.isVisible(), true);
                await peopleSheet.locator('#familyMoreActions').click();
                assert.equal(await page.locator('#projectMenu').isVisible(), true);
                await peopleSheet.locator('#familyMoreActions').click();
                assert.equal(await page.locator('#projectMenu').count(), 0);
                await peopleSheet.locator('#addRelative').click();
                assert.equal(await page.locator('#relativePopover').isVisible(), true);
                await peopleSheet.locator('#addRelative').click();
                assert.equal(await page.locator('#relativePopover').count(), 0);
                await peopleSheet.locator('#quickEdit').click();
                assert.equal(await page.locator('#modalBackdrop .modal').isVisible(), true);
                await page.keyboard.press('Escape');
                assert.equal(await peopleSheet.isVisible(), true);
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#mobileDetailsClose').count(), 0);
            }
            await page.locator('[data-mobile-sections]').click();
            await page.locator('[data-open-profile]').click();
            assert.equal(await page.locator('[data-mobile-details]').isVisible(), false);
            await page.locator('#backPeopleList').click();
            assert.equal(await page.locator('[data-mobile-details]').isVisible(), true);

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
        for (const language of ['en', 'ru'])
        {
            const page = await browser.newPage({ viewport: { width: 540, height: 720 } });
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() =>
            {
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'People';
                render();
            });
            const toolbar = page.locator('.people-normal-toolbar');
            const checkFit = async () => assert.ok(await toolbar.evaluate(el =>
            {
                const visible = [...el.children].filter(child => getComputedStyle(child).display !== 'none');
                const bounds = el.getBoundingClientRect();
                return visible.every(child => child.getBoundingClientRect().right <= bounds.right + 1)
                    && Math.abs(visible.at(-1).getBoundingClientRect().right - bounds.right) <= 2
                    && el.scrollWidth <= el.clientWidth + 1;
            }));
            await checkFit();
            await page.locator('[data-people-mobile-search]').click();
            await page.locator('#peopleSearch').fill('Luna');
            await page.setViewportSize({ width: 541, height: 720 });
            assert.equal(await page.locator('#peopleSearch').isVisible(), true);
            assert.equal(await page.locator('[data-people-mobile-search-close]').isVisible(), false);
            assert.equal(await page.locator('#peopleSearch').inputValue(), 'Luna');
            await checkFit();
            await page.setViewportSize({ width: 540, height: 720 });
            assert.equal(await page.locator('[data-people-mobile-search-close]').isVisible(), true);
            await page.locator('[data-people-mobile-search-close]').click();
            await checkFit();
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
