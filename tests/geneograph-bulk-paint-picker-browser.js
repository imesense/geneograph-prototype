const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const ids = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                const shapes = [0, 1].map(index => createGeneographShapeFromRect({ x: 3000 + index * 300, y: 3000, width: 120, height: 100 }));
                shapes.forEach((node, index) => { node.appearance.fill = { color: index ? '#445566' : '#112233', opacity: index ? 70 : 30, enabled: true }; });
                const people = diagram.nodes.filter(node => node.type === 'person').slice(0, 2);
                people.forEach((node, index) => {
                    node.appearance.fill = { color: index ? '#667788' : '#334455', opacity: index ? 80 : 40, enabled: true };
                    node.appearance.paintOverrides.fill = true;
                });
                const first = diagram.connections[0];
                const second = structuredClone(first);
                second.id += '-paint-bulk';
                diagram.connections.push(second);
                [first, second].forEach((connection, index) => {
                    connection.style = { line: { color: index ? '#778899' : '#223344', opacity: index ? 90 : 50, enabled: true } };
                });
                setGeneographSelection(shapes.map(node => node.id), []);
                renderGeneographEditorPreserveScroll();
                if (window.innerWidth < 900) document.body.classList.add('mobile-details-open');
                return { shapes: shapes.map(node => node.id), people: people.map(node => node.id),
                    connections: [first.id, second.id] };
            }, language);
            assert.equal(await page.locator('.geneo-inspector input[type="color"]').count(), 0);
            const shapeSwatch = page.locator('[data-geneo-paint-scope="node-multi"][data-geneo-paint-property="fill"] [data-geneo-paint-open]');
            await shapeSwatch.click();
            const popover = page.locator('#geneoPaintPopover');
            assert.equal(await popover.locator('[data-geneo-paint-hex]').inputValue(), '');
            assert.equal(await popover.locator('[data-geneo-paint-hex]').getAttribute('placeholder'), await page.evaluate(() => t('Mixed')));
            assert.equal(await popover.locator('[data-geneo-paint-suggestion][aria-pressed="true"]').count(), 0);
            await page.keyboard.press('Escape');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.color), ids.shapes), ['#112233', '#445566']);
            await shapeSwatch.click();
            await popover.locator('[data-geneo-paint-hex]').fill('#zzzzzz');
            assert.equal(await popover.locator('[data-geneo-paint-hex]').getAttribute('aria-invalid'), 'true');
            await page.keyboard.press('Escape');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.color), ids.shapes), ['#112233', '#445566']);
            await shapeSwatch.click();
            await popover.locator('[data-geneo-paint-hex]').fill('#AABBCC');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => [getGeneographNode(id).appearance.fill.color,
                getGeneographNode(id).appearance.fill.opacity]), ids.shapes), [['#AABBCC', 30], ['#AABBCC', 70]]);
            await page.keyboard.press('Escape');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.color), ids.shapes), ['#112233', '#445566']);
            await shapeSwatch.click();
            await popover.locator('[data-geneo-paint-suggestion]').first().click();
            const chosen = await popover.locator('[data-geneo-paint-suggestion]').first().getAttribute('data-geneo-paint-suggestion');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.color), ids.shapes), [chosen, chosen]);
            await page.keyboard.press('Escape');
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.color), ids.shapes), ['#112233', '#445566']);
            await shapeSwatch.click();
            await popover.locator('[data-geneo-paint-toggle]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.enabled), ids.shapes), [false, false]);
            assert.equal(await shapeSwatch.isDisabled(), true);
            await page.locator('[data-geneo-paint-scope="node-multi"][data-geneo-paint-property="fill"] [data-geneo-bulk-paint-toggle="fill"]').click();
            assert.deepEqual(await page.evaluate(ids => ids.map(id => getGeneographNode(id).appearance.fill.enabled), ids.shapes), [true, true]);

            await page.evaluate(ids => { setGeneographSelection(ids.people, []); renderGeneographEditorPreserveScroll(); }, ids);
            const personSwatch = page.locator('[data-geneo-paint-scope="person-multi"][data-geneo-paint-property="fill"] [data-geneo-paint-open]');
            await personSwatch.click();
            assert.equal(await popover.locator('[data-geneo-paint-hex]').inputValue(), '');
            await popover.locator('[data-geneo-paint-opacity-number]').fill('55');
            await popover.locator('[data-geneo-paint-opacity-number]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => [getGeneographNode(id).appearance.fill.color,
                getGeneographNode(id).appearance.fill.opacity]), ids.people), [['#334455', 55], ['#667788', 55]]);
            await page.keyboard.press('Escape');

            await page.evaluate(ids => { setGeneographSelection([], ids.connections); renderGeneographEditorPreserveScroll(); }, ids);
            const connectionSwatch = page.locator('[data-geneo-paint-scope="connection-multi"] [data-geneo-paint-open]');
            await connectionSwatch.click();
            assert.equal(await popover.locator('[data-geneo-paint-hex]').inputValue(), '');
            await popover.locator('[data-geneo-paint-hex]').fill('#ABCDEF');
            await popover.locator('[data-geneo-paint-hex]').press('Tab');
            assert.deepEqual(await page.evaluate(ids => ids.map(id => [getGeneographConnection(id).style.line.color,
                getGeneographConnection(id).style.line.opacity]), ids.connections), [['#ABCDEF', 50], ['#ABCDEF', 90]]);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Geneograph bulk paint picker passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
