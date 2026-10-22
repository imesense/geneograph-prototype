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
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.stack || error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            if (errors.length) throw new Error(errors.join('\n'));
            const ids = await page.evaluate(({ language, width }) => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const nodes = selectedGeneographDiagram().nodes.filter(node => node.type === 'person').slice(0, 2);
                nodes[0].personCard = geneoEmptyPersonCardOverrides(true);
                nodes[1].personCard = geneoEmptyPersonCardOverrides(true);
                nodes[1].personCard.style = 'compact';
                nodes[1].personCard.styleSettings.compact = { fields: { dates: false } };
                nodes[0].appearance.fill.color = '#184E42';
                nodes[0].appearance.paintOverrides.fill = true;
                nodes[1].appearance.fill.color = '#563F74';
                nodes[1].appearance.paintOverrides.fill = true;
                state.selectedGeneoNodeId = nodes[0].id;
                state.selectedGeneoNodeIds = nodes.map(node => node.id);
                renderGeneographEditorPreserveScroll();
                if (width < 900) document.body.classList.add('mobile-details-open');
                return nodes.map(node => node.id);
            }, { language, width });
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('[data-geneo-inspector-section="multi:appearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="multi:personCards"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-multi-size], [data-geneo-person-multi-use-defaults]').count(), 0);
            assert.equal(await inspector.locator('.geneo-person-style-option.active').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-multi-field="birthPlace"]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-multi-paint-hex="fill"]').inputValue(), '');
            assert.equal(await inspector.locator('[data-geneo-person-multi-field="dates"]')
                .evaluate(element => element.indeterminate), true);
            assert.ok(await inspector.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            if (process.env.GENEO_SCREENSHOT_DIR)
            {
                await inspector.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `bulk-${language}-${width}.png`) });
                await inspector.evaluate(element => { element.scrollTop = element.scrollHeight; });
                await inspector.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `bulk-layout-${language}-${width}.png`) });
            }

            await inspector.locator('[data-geneo-person-multi-field="dates"]').check();
            assert.deepEqual(await page.evaluate(ids => ids.map(id =>
                geneoPersonCardEffectiveSettings(getGeneographNode(id)).fields.dates), ids), [true, true]);

            await inspector.locator('[data-geneo-person-multi-paint-hex="fill"]').fill('#256B59');
            await inspector.locator('[data-geneo-person-multi-paint-hex="fill"]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                const node = getGeneographNode(id);
                return [geneoResolveVisibleNodeAppearance(node).fill.color,
                    geneoPersonCardEffectiveSettings(node).style];
            }), ids), [['#256B59', 'standard'], ['#256B59', 'compact']]);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id =>
                geneoResolveVisibleNodeAppearance(getGeneographNode(id)).fill.color), ids),
            ['#184E42', '#563F74']);

            await inspector.locator('[data-geneo-person-multi-paint-opacity="fill"]').fill('42');
            await inspector.locator('[data-geneo-person-multi-paint-opacity="fill"]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                const fill = geneoResolveVisibleNodeAppearance(getGeneographNode(id)).fill;
                return [fill.color, fill.opacity];
            }), ids), [['#184E42', 42], ['#563F74', 42]]);
            await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').fill('5');
            await inspector.locator('[data-geneo-person-multi-appearance="strokeWidth"]').press('Tab');
            await inspector.locator('[data-geneo-person-multi-appearance="strokePattern"]').selectOption('dashed');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                const appearance = geneoResolveVisibleNodeAppearance(getGeneographNode(id));
                return [appearance.strokeWidth, appearance.strokePattern];
            }), ids), [[5, 'dashed'], [5, 'dashed']]);

            await inspector.locator('[data-geneo-person-card-style="chart"][data-geneo-person-card-scope="multi"]').click();
            assert.equal(await inspector.locator('[data-geneo-person-multi-setting="photoAlignment"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-person-multi-field="birthPlace"]').count(), 0);
            await inspector.locator('[data-geneo-person-multi-setting="dateFormat"]').selectOption('years');
            assert.deepEqual(await page.evaluate(ids => ids.map(id =>
                geneoPersonCardEffectiveSettings(getGeneographNode(id)).dateFormat), ids), ['years', 'years']);
            await inspector.locator('[data-geneo-person-multi-appearance="cornerRadius"]').fill('18');
            await inspector.locator('[data-geneo-person-multi-appearance="cornerRadius"]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id =>
                geneoPersonCardEffectiveSettings(getGeneographNode(id)).cornerRadius), ids), [18, 18]);

            const geometry = await page.evaluate(ids => ids.map(id => {
                const node = getGeneographNode(id);
                return [node.x, node.y, node.width, node.height, node.personCard.heightMode];
            }), ids);
            await inspector.locator('[data-geneo-person-multi-apply-gender]').click();
            assert.equal(await page.evaluate(ids => ids.every(id => {
                const node = getGeneographNode(id);
                const person = getGeneographPerson(node.personId);
                const gender = ['male', 'female'].includes(person.gender) ? person.gender : 'unknown';
                return node.appearance.paintOverrides.fill
                    && node.appearance.fill.color === selectedGeneographDiagram().cardAppearanceDefaults[gender].fill.color;
            }), ids), true);
            await inspector.locator('[data-geneo-person-multi-reset]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => {
                const node = getGeneographNode(id);
                return [geneoPersonCardEffectiveSettings(node).style,
                    geneoPersonCardEffectiveSettings(node).dateFormat,
                    node.x, node.y, node.width, node.height, node.personCard.heightMode,
                    node.appearance.paintOverrides.fill];
            }), ids), geometry.map(item => ['chart', 'full', ...item, false]));
            assert.equal(await inspector.locator('[data-geneo-person-multi-reset]').isDisabled(), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph bulk card settings passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
