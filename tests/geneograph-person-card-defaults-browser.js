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
                node.appearance.paintOverrides = { fill: false, stroke: false, text: false };
                node.appearance.styleOverrides = { strokeWidth: false, strokePattern: false };
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
            });
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').isDisabled(), true);
            assert.equal(await inspector.locator('[data-geneo-person-card-use-defaults]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-style]:disabled').count(), 0);
            assert.equal(await inspector.locator('#geneoPersonCardRadius').count(), 1);
            assert.equal(await inspector.locator('.panel-section:has([data-geneo-inspector-section="person:appearance"]) #geneoPersonCardRadius').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="person:appearance"]')
                .count(), 1);
            await page.evaluate(() => {
                const section = document.querySelector('[data-geneo-inspector-section="person:card"]');
                if (section.getAttribute('aria-expanded') === 'false') section.click();
            });
            const previews = await inspector.locator('.geneo-person-style-preview').evaluateAll(elements =>
                elements.map(element => ({
                    style: element.className,
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    bars: element.querySelectorAll('span').length,
                    photo: element.querySelector('.preview-photo') !== null
                })));
            assert.equal(previews.length, 4);
            assert.ok(previews.every(preview => preview.bars >= 3), JSON.stringify(previews));
            assert.equal(previews.find(preview => preview.style.includes('preview-compact')).photo, false);
            if (process.env.GENEO_STYLE_PREVIEW_SCREENSHOT_DIR) {
                await page.evaluate(() => {
                    const capture = document.createElement('div');
                    capture.id = 'geneo-style-preview-capture';
                    capture.style.cssText = 'position:fixed;z-index:99999;top:20px;left:20px;width:270px;padding:12px;background:var(--surface-input)';
                    capture.append(document.querySelector('.geneo-person-style-picker').cloneNode(true));
                    document.body.append(capture);
                });
                await page.locator('#geneo-style-preview-capture').screenshot({
                    path: path.join(process.env.GENEO_STYLE_PREVIEW_SCREENSHOT_DIR, `styles-${language}.png`)
                });
                await page.locator('#geneo-style-preview-capture').evaluate(element => element.remove());
            }
            await page.evaluate(() => {
                document.querySelector('[data-geneo-person-card-style="compact"]').click();
            });
            assert.equal(await page.locator('.geneo-node-person[data-geneo-person-card-style="compact"] .geneo-person-avatar').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-field="photo"]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-card-setting="photoSize"]').count(), 0);
            assert.equal(await page.locator('.geneo-node-person[data-geneo-person-card-style="compact"] .geneo-person-identity-block').evaluate(element => getComputedStyle(element).textAlign), 'center');
            assert.equal(await page.locator('.geneo-node-person[data-geneo-person-card-style="compact"] .geneo-person-life-summary').count(), 1);
            if (process.env.GENEO_TREE_SCREENSHOT_DIR)
                await page.locator('.geneo-node-person[data-geneo-person-card-style="compact"]').first()
                    .screenshot({ path: path.join(process.env.GENEO_TREE_SCREENSHOT_DIR, `tree-${language}.png`) });
            await page.evaluate(() => {
                const node = selectedGeneographNode();
                node.personCard.photoByStyle.compact = true;
                node.personCard.fields.photo = true;
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await page.locator('.geneo-node-person[data-geneo-person-card-style="compact"] .geneo-person-avatar').count(), 0);
            await page.evaluate(() => {
                const node = selectedGeneographNode();
                delete node.personCard.photoByStyle.compact;
                delete node.personCard.fields.photo;
                renderGeneographEditorPreserveScroll();
            });
            await page.evaluate(() => {
                document.querySelector('[data-geneo-person-card-style="portrait"]').click();
            });
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').isDisabled(), true);
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.style), 'portrait');
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-style="standard"]').click());
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-style="portrait"]').click());
            await page.evaluate(() => {
                const radius = document.querySelector('#geneoPersonCardRadius');
                radius.value = '12';
                radius.dispatchEvent(new Event('change', { bubbles: true }));
            });
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), 12);
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').isEnabled(), true);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), 12);
            await page.evaluate(() => document.querySelector('[data-geneo-person-card-reset]').click());
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.cornerRadius), null);
            assert.equal(await page.evaluate(() => selectedGeneographNode().personCard.style), 'portrait');
            assert.equal(await inspector.locator('[data-geneo-person-card-reset]').isDisabled(), true);
            await page.evaluate(() => {
                selectedGeneographDiagram().cardAppearanceDefaults.neutral.cornerRadius = 16;
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
