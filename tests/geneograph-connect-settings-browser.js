const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const root = path.resolve(__dirname, '../src');
    const server = http.createServer((request, response) => {
        const target = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
            response.writeHead(404).end(); return;
        }
        const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
            '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(target)] || 'application/octet-stream';
        response.setHeader('Content-Type', type);
        fs.createReadStream(target).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/index.html`;
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            let step = 'load';
            page.on('pageerror', error => errors.push(`${step}: ${error.message}`));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                state.selectedGeneoNodeId = null;
                state.selectedGeneoNodeIds = [];
                state.selectedGeneoConnectionId = null;
                state.selectedGeneoConnectionIds = [];
                renderGeneographEditorPreserveScroll();
            }, language);
            const initial = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                return {
                    defaults: diagram.connectionDefaults,
                    inherited: geneoEffectiveConnectionStyle(getGeneographConnection('gc-child-silver')).line.color,
                    custom: geneoEffectiveConnectionStyle(getGeneographConnection('gc-visual-solid')).line.color
                };
            });
            assert.equal(initial.defaults.line.color, '#D9E5E1');
            assert.equal(initial.inherited, '#D9E5E1');
            assert.equal(initial.custom, '#D4AA6B');
            if (width < 900) await page.evaluate(() => document.body.classList.add('mobile-details-open'));
            const defaultsSection = page.locator('[data-geneo-inspector-section="canvas:connectionDefaults"]');
            assert.equal(await defaultsSection.count(), 1);
            if (await defaultsSection.getAttribute('aria-expanded') === 'false') await defaultsSection.click();
            const defaultControls = page.locator('[data-geneo-connection-fields="default"]');
            const layout = await defaultControls.evaluate(root => {
                const pattern = root.querySelector('[data-geneo-connection-default-pattern]').closest('.geneo-field').getBoundingClientRect();
                const widthField = root.querySelector('[data-geneo-connection-default-width]').closest('.geneo-field').getBoundingClientRect();
                const color = root.querySelector('.geneo-paint-row').getBoundingClientRect();
                const arrows = root.querySelector('.geneo-connection-arrows').getBoundingClientRect();
                const label = getComputedStyle(root.querySelector('.geneo-setting-label'));
                const paintLabel = getComputedStyle(root.querySelector('.geneo-paint-label'));
                return { pattern: { top: pattern.top, right: pattern.right, bottom: pattern.bottom },
                    width: { top: widthField.top, left: widthField.left }, color: { top: color.top, bottom: color.bottom },
                    arrowsTop: arrows.top, fontSize: label.fontSize, fontWeight: label.fontWeight,
                    labelColor: label.color, paintWeight: paintLabel.fontWeight };
            });
            assert.ok(Math.abs(layout.pattern.top - layout.width.top) < 2);
            assert.ok(layout.pattern.right <= layout.width.left);
            assert.ok(layout.color.top >= layout.pattern.bottom);
            assert.ok(layout.arrowsTop >= layout.color.bottom);
            assert.equal(layout.fontSize, '12px');
            assert.equal(layout.fontWeight, '700');
            assert.equal(layout.paintWeight, '700');
            step = 'default pattern';
            await defaultControls.locator('[data-geneo-connection-default-pattern]').click();
            assert.equal(await page.locator('[data-geneo-connector] .geneo-line-sample').count(), 4);
            if (width > 900) await defaultControls.locator('[data-geneo-connection-default-pattern]').click();
            else await page.keyboard.press('Escape');
            assert.equal(await page.locator('#projectMenu').count(), 0);
            await defaultControls.locator('[data-geneo-connection-default-pattern]').click();
            await page.locator('[data-geneo-connector="alternating"]').click();
            assert.equal(await page.evaluate(() => selectedGeneographDiagram().connectionDefaults.pattern), 'alternating');
            assert.equal(await page.evaluate(() => state.geneoTool), 'pan');
            step = 'default color';
            await defaultControls.locator('[data-geneo-paint-scope="connection-default"] [data-geneo-paint-open]').click();
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').fill('#447766');
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').blur();
            await page.locator('#geneoPaintPopover [data-geneo-paint-close]').click();
            assert.deepEqual(await page.evaluate(() => {
                const inherited = getGeneographConnection('gc-child-silver');
                return [geneoEffectiveConnectionStyle(inherited).line.color, Object.keys(inherited.style).length,
                    geneoEffectiveConnectionStyle(getGeneographConnection('gc-visual-solid')).line.color];
            }), ['#447766', 0, '#D4AA6B']);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(() => selectedGeneographDiagram().connectionDefaults.line.color), '#D9E5E1');
            await page.evaluate(() => redoGeneographChange());
            assert.deepEqual(await page.evaluate(() => {
                const reference = { scope: 'connection', id: 'gc-child-silver', property: 'line' };
                commitGeneoPaintAction(reference, target => { target.paint.color = '#BB6688'; });
                const connection = getGeneographConnection('gc-child-silver');
                const custom = [connection.style.line.color, connection.style.width];
                commitGeneoPaintAction(reference, target => { Object.assign(target.paint, target.defaultPaint); }, { resetOverride: true });
                return [...custom, connection.style.line, geneoEffectiveConnectionStyle(connection).line.color];
            }), ['#BB6688', undefined, undefined, '#447766']);
            if (width < 900) await page.evaluate(() => document.body.classList.remove('mobile-details-open'));
            step = 'activate tool';
            await page.locator('[data-geneo-connection-main]').click();
            assert.equal(await page.locator('[data-geneo-connection-panel]').count(), 1);
            const strip = page.locator('[data-geneo-connection-panel]');
            assert.ok(await strip.evaluate(element => element.getBoundingClientRect().height < 65));
            assert.ok(await strip.evaluate(element => element.getBoundingClientRect().right <= window.innerWidth + 1));
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `connect-panel-${width}.png`) });
            if (width < 900) {
                const metrics = await strip.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }));
                assert.ok(metrics.scrollWidth >= metrics.width);
                await strip.locator('[data-geneo-connection-tool-reset]').scrollIntoViewIfNeeded();
                assert.equal(await strip.locator('[data-geneo-connection-tool-reset]').isVisible(), true);
            }
            const menuButton = page.locator('[data-geneo-connection-menu]');
            if (await menuButton.isVisible()) {
                step = 'menu';
                await menuButton.click();
                assert.equal(await page.locator('[data-geneo-connector]').count(), 4);
                assert.equal(await page.locator('[data-geneo-connector] .geneo-line-sample').count(), 4);
                if (width > 900) await menuButton.click();
                else await page.keyboard.press('Escape');
                assert.equal(await page.locator('#projectMenu').count(), 0);
                assert.equal(await menuButton.getAttribute('aria-expanded'), 'false');
                await menuButton.click();
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('[data-tool-split="connection"]').evaluate(split => {
                    const focused = split.querySelector(':focus-visible');
                    return focused ? getComputedStyle(focused).outlineStyle : 'none';
                }), 'none');
                await menuButton.click();
                await page.locator('[data-geneo-connector="alternating"]').click();
            }
            const tool = strip;
            step = 'tool pattern';
            await tool.locator('[data-geneo-connection-tool-pattern]').click();
            await page.locator('[data-geneo-connector="dotted"]').click();
            step = 'tool width';
            await tool.locator('[data-geneo-connection-tool-width]').fill('4');
            await tool.locator('[data-geneo-connection-tool-width]').dispatchEvent('change');
            await page.waitForFunction(() => geneoConnectionToolRuntime.overrides.width === 4);
            assert.equal(await tool.locator('[data-geneo-connection-tool-width]').inputValue(), '4');
            step = 'tool color';
            await tool.locator('[data-geneo-connection-tool-swatch]').click();
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').fill('#CC6644');
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').blur();
            await page.locator('#geneoPaintPopover [data-geneo-paint-close]').click();
            step = 'tool arrows';
            await tool.locator('[data-geneo-connection-tool-arrows]').click();
            if (width > 900) {
                const samples = await page.locator('[data-geneo-connector]').evaluateAll(options =>
                    Object.fromEntries(options.map(option => [option.dataset.geneoConnector, {
                        start: option.querySelector('line')?.getAttribute('x1'),
                        end: option.querySelector('line')?.getAttribute('x2'),
                        arrow: [...option.querySelectorAll('path')].map(path => path.getAttribute('d')).join(' ')
                    }])));
                for (const option of ['none', 'start', 'end', 'both']) {
                    assert.equal(samples[option].start, '3');
                    assert.equal(samples[option].end, '85');
                }
                assert.match(samples.start.arrow, /M3 8/);
                assert.match(samples.end.arrow, /M85 8/);
                assert.match(samples.both.arrow, /M3 8.*M85 8/);
            }
            await page.locator('[data-geneo-connector="both"]').click();
            const created = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const source = { nodeId: 'gn-image', port: 'bottom' };
                const target = { nodeId: 'gn-sticky', port: 'top' };
                const visual = geneoCreateConnection('visual', source, target);
                visual.route = { mode: 'manual', waypoints: [{ x: 2100, y: 400 }] };
                visual.id = 'test-visual-arrow';
                const family = geneoCreateConnection('family-child', source, target, 'gf-whiskerfield');
                family.id = 'test-family-no-arrow';
                diagram.connections.push(visual, family);
                return { visual: visual.style, family: family.style, defaults: diagram.connectionDefaults };
            });
            assert.deepEqual([created.visual.pattern, created.visual.width, created.visual.line.color, created.visual.arrows], ['dotted', 4, '#CC6644', 'both']);
            assert.equal(created.family.arrows, undefined);
            assert.equal(created.defaults.width, 2);
            await page.evaluate(() => renderGeneographEditorPreserveScroll());
            assert.equal(await page.locator('[data-geneo-connection-group="test-visual-arrow"] marker').count(), 1);
            assert.equal(await page.locator('[data-geneo-connection-group="test-family-no-arrow"] marker').count(), 0);
            assert.equal(await page.locator('[data-geneo-connection-group="test-visual-arrow"] .geneo-connection-line').getAttribute('stroke-dasharray'), '4 12');
            await page.locator('[data-geneo-connection-tool-reset]').click();
            assert.deepEqual(await page.evaluate(() => geneoConnectionToolRuntime.overrides), {});
            assert.equal(await page.evaluate(() => getGeneographConnection('test-visual-arrow').style.pattern), 'dotted');
            await page.locator('[data-geneo-connection-panel-close]').click();
            assert.equal(await page.evaluate(() => state.geneoTool), 'connect');
            await page.evaluate(() => {
                state.selectedGeneoConnectionId = 'test-visual-arrow';
                state.selectedGeneoConnectionIds = ['test-visual-arrow'];
                renderGeneographEditorPreserveScroll();
            });
            if (width < 900) await page.evaluate(() => document.body.classList.add('mobile-details-open'));
            const lineInspector = page.locator('.geneo-inspector');
            const inspectorFields = lineInspector.locator('[data-geneo-connection-fields="inspector"]');
            const inspectorLayout = await inspectorFields.evaluate(root => {
                const pattern = root.querySelector('[data-geneo-connection-inspector-pattern]').closest('.geneo-field').getBoundingClientRect();
                const widthField = root.querySelector('[data-geneo-stroke-width="connection"]').closest('.geneo-field').getBoundingClientRect();
                const color = root.querySelector('.geneo-paint-row').getBoundingClientRect();
                const arrows = root.querySelector('.geneo-connection-arrows').getBoundingClientRect();
                return { pattern: { top: pattern.top, right: pattern.right, bottom: pattern.bottom },
                    width: { top: widthField.top, left: widthField.left }, colorTop: color.top, arrowsTop: arrows.top };
            });
            assert.ok(Math.abs(inspectorLayout.pattern.top - inspectorLayout.width.top) < 2);
            assert.ok(inspectorLayout.pattern.right <= inspectorLayout.width.left);
            assert.ok(inspectorLayout.colorTop >= inspectorLayout.pattern.bottom);
            assert.ok(inspectorLayout.arrowsTop >= inspectorLayout.colorTop);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `connection-inspector-${width}.png`) });
            await inspectorFields.locator('[data-geneo-connection-inspector-pattern]').click();
            assert.equal(await page.locator('[data-geneo-connector]').count(), 4, `${width}: inspector pattern menu`);
            if (width > 900) await inspectorFields.locator('[data-geneo-connection-inspector-pattern]').click();
            else await page.keyboard.press('Escape');
            assert.equal(await page.locator('#projectMenu').count(), 0);
            await inspectorFields.locator('[data-geneo-connection-inspector-pattern]').click();
            await page.locator('[data-geneo-connector="dashed"]').click();
            assert.equal(await page.evaluate(() => getGeneographConnection('test-visual-arrow').style.pattern), 'dashed');
            assert.equal(await lineInspector.locator('[data-geneo-connection-reset-property]').count(), 0);
            assert.equal(await lineInspector.locator('[data-geneo-connection-arrows]').count(), 4);
            await lineInspector.locator('label:has([data-geneo-connection-arrows][value="start"])').click();
            assert.equal(await page.locator('[data-geneo-connection-group="test-visual-arrow"] .geneo-connection-line').getAttribute('marker-start'), 'url(#geneo-arrow-test-visual-arrow)');
            const resetAppearance = lineInspector.locator('[data-geneo-connection-reset-default]');
            assert.equal(await resetAppearance.isEnabled(), true);
            await resetAppearance.click();
            assert.deepEqual(await page.evaluate(() => {
                const connection = getGeneographConnection('test-visual-arrow');
                return { style: connection.style, route: connection.route };
            }), { style: {}, route: { mode: 'manual', waypoints: [{ x: 2100, y: 400 }] } });
            assert.equal(await resetAppearance.isDisabled(), true);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(() => {
                const style = getGeneographConnection('test-visual-arrow').style;
                return [style.pattern, style.width, style.line.color, style.arrows];
            }), ['dashed', 4, '#CC6644', 'start']);
            await page.evaluate(() => redoGeneographChange());
            assert.deepEqual(await page.evaluate(() => getGeneographConnection('test-visual-arrow').style), {});
            await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.connectionDefaults.cornerRadius = 16;
                const first = getGeneographConnection('test-visual-arrow');
                const second = getGeneographConnection('test-family-no-arrow');
                first.style.cornerRadius = 32;
                second.style.width = 5;
                state.selectedGeneoConnectionId = first.id;
                state.selectedGeneoConnectionIds = [first.id, second.id];
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await page.locator('[data-geneo-connection-multi-reset-default]').isEnabled(), true);
            assert.match(await page.locator('[data-geneo-connection-group="test-visual-arrow"] .geneo-connection-line').getAttribute('d'), / Q /);
            await page.locator('[data-geneo-connection-multi-reset-default]').click();
            assert.deepEqual(await page.evaluate(() => {
                const first = getGeneographConnection('test-visual-arrow');
                const second = getGeneographConnection('test-family-no-arrow');
                return [first.style, second.style, first.route.waypoints,
                    geneoEffectiveConnectionStyle(first).cornerRadius];
            }), [{}, {}, [{ x: 2100, y: 400 }], 16]);
            assert.equal(await page.locator('[data-geneo-connection-multi-reset-default]').isDisabled(), true);
            await page.evaluate(() => undoGeneographChange());
            assert.deepEqual(await page.evaluate(() => [
                getGeneographConnection('test-visual-arrow').style.cornerRadius,
                getGeneographConnection('test-family-no-arrow').style.width
            ]), [32, 5]);
            await page.evaluate(() => redoGeneographChange());
            assert.deepEqual(await page.evaluate(() => {
                const first = getGeneographConnection('test-visual-arrow');
                const second = getGeneographConnection('test-family-no-arrow');
                first.route = { mode: 'manual', waypoints: [{ x: 2100, y: 400 }, { x: 2180, y: 400 }] };
                second.route = { mode: 'manual', waypoints: [{ x: 2200, y: 500 }, { x: 2280, y: 500 }] };
                state.selectedGeneoConnectionIds = [first.id, second.id];
                state.selectedGeneoConnectionId = first.id;
                const before = [first.route.waypoints[0].x, second.route.waypoints[0].x];
                const started = startGeneographSelectedConnectionDrag({ button: 0, isPrimary: true,
                    pointerId: 1, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} }, first);
                applyGeneographSelectionTranslation(geneoPointerState, 40, 20);
                const after = [first.route.waypoints[0].x, second.route.waypoints[0].x];
                geneoPointerState = null;
                undoGeneographChange();
                return [started, before, after,
                    [getGeneographConnection(first.id).route.waypoints[0].x,
                        getGeneographConnection(second.id).route.waypoints[0].x]];
            }), [true, [2100, 2200], [2140, 2240], [2100, 2200]]);
            await page.evaluate(() => {
                state.selectedGeneoConnectionId = 'test-family-no-arrow';
                state.selectedGeneoConnectionIds = ['test-family-no-arrow'];
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await lineInspector.locator('[data-geneo-connection-arrows]').count(), 0);
            assert.equal(await lineInspector.locator('[data-geneo-connection-reset-default]').isDisabled(), true);
            const serialized = await page.evaluate(() => {
                const board = structuredClone(selectedGeneographBoard());
                return normalizeGeneographBoardRecord(board, new Map([[board.projectId, new Set()]])).diagram;
            });
            assert.equal(serialized.connectionDefaults.line.color, '#447766');
            assert.equal(serialized.connections.find(item => item.id === 'test-visual-arrow').style.arrows, undefined);
            const exported = await page.evaluate(async () => JSON.parse(await buildGeneographBoardFile()).board.diagram);
            assert.equal(exported.connectionDefaults.line.color, '#447766');
            assert.equal(exported.connections.find(item => item.id === 'test-visual-arrow').style.pattern, undefined);
            await page.evaluate(() => {
                const second = structuredClone(selectedGeneographBoard());
                second.id = 'test-other-board';
                sampleData.boards.push(second);
                openGeneographBoard(second.id);
                openGeneographBoard('gb1');
                activateGeneographConnectionTool();
            });
            assert.deepEqual(await page.evaluate(() => geneoConnectionToolRuntime.overrides), {});
            await page.evaluate(() => {
                state.geneoTool = 'pan';
                state.selectedGeneoConnectionId = null;
                state.selectedGeneoConnectionIds = [];
                renderGeneographEditorPreserveScroll();
            });
            if (width < 900) await page.evaluate(() => document.body.classList.add('mobile-details-open'));
            await page.locator('[data-geneo-reset-canvas-defaults]').click();
            assert.equal(await page.evaluate(() => selectedGeneographDiagram().connectionDefaults.line.color), '#D9E5E1');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph connection settings passed.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
