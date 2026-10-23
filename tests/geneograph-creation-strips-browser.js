const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[1280, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
            }, language);
            const activate = async (tool, overflowAction = tool) => {
                const button = page.locator(tool === 'shape' ? '[data-geneo-shape-main]' : `[data-geneo-tool="${tool}"]`);
                if (await button.isVisible()) await button.click();
                else {
                    await page.locator('[data-geneo-toolbar-overflow]').click();
                    await page.locator(`[data-geneo-toolbar-action="${overflowAction}"]`).click();
                    if (tool === 'shape') await page.locator('[data-geneo-shape-kind="rectangle"]').click();
                }
            };
            await activate('pencil');
            const drawing = page.locator('[data-geneo-creation-panel="drawing"]');
            assert.equal(await drawing.count(), 1);
            assert.ok(await drawing.evaluate(element => element.getBoundingClientRect().height < 65));
            await drawing.locator('[data-geneo-creation-swatch="stroke"]').click();
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').fill('#AA5533');
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').blur();
            await page.locator('#geneoPaintPopover [data-geneo-paint-close]').click();
            assert.equal(await page.locator('#geneoPaintPopover').count(), 0);
            await drawing.locator('[data-geneo-creation-width]').fill('5');
            await drawing.locator('[data-geneo-creation-width]').dispatchEvent('change');
            await drawing.locator('[data-geneo-creation-pattern]').click();
            assert.equal(await page.locator('[data-geneo-creation-pattern-option]').count(), 2);
            if (width > 900) await drawing.locator('[data-geneo-creation-pattern]').click();
            else await page.locator('#mobileChoiceBackdrop').click({ position: { x: 4, y: 4 } });
            assert.equal(await page.locator('[data-geneo-creation-pattern-option]').count(), 0);
            await drawing.locator('[data-geneo-creation-pattern]').click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('[data-geneo-creation-pattern-option]').count(), 0);
            await drawing.locator('[data-geneo-creation-pattern]').click();
            await page.locator('[data-geneo-creation-pattern-option="dashed"]').click();
            const drawingResult = await page.evaluate(() => {
                updateGeneographPencilPreview([{ x: 100, y: 100 }, { x: 130, y: 120 }]);
                const preview = document.querySelector('[data-geneo-pencil-preview]');
                const node = createGeneographDrawingFromPoints([{ x: 100, y: 100 }, { x: 130, y: 120 }]);
                return { appearance: node.appearance, preview: [preview.style.strokeWidth, preview.style.strokeDasharray] };
            });
            assert.deepEqual([drawingResult.appearance.stroke.color, drawingResult.appearance.strokeWidth,
                drawingResult.appearance.strokePattern], ['#AA5533', 5, 'dashed']);
            assert.deepEqual(drawingResult.preview, ['5', '8, 7']);
            await drawing.locator('[data-geneo-creation-reset]').click();
            assert.equal(await page.evaluate(() => geneoCreationToolSettings('drawing').appearance.strokeWidth), 2);
            await drawing.locator('[data-geneo-creation-close]').click();
            assert.equal(await page.evaluate(() => state.geneoTool), 'pencil');
            await activate('pencil');
            assert.equal(await drawing.count(), 1);

            await activate('shape');
            const shape = page.locator('[data-geneo-creation-panel="shape"]');
            assert.equal(await shape.count(), 1);
            assert.ok(await shape.evaluate(element => element.getBoundingClientRect().height < 65));
            if (width < 900) assert.ok(await shape.evaluate(element => element.scrollWidth >= element.clientWidth));
            await shape.locator('[data-geneo-creation-shape-kind]').click();
            await page.locator('[data-geneo-shape-kind="triangle"]').click();
            await shape.locator('[data-geneo-creation-swatch="fill"]').click();
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').fill('#335577');
            await page.locator('#geneoPaintPopover [data-geneo-paint-hex]').blur();
            await page.locator('#geneoPaintPopover [data-geneo-paint-close]').click();
            await shape.locator('[data-geneo-creation-swatch="stroke"]').click();
            await page.locator('#geneoPaintPopover [data-geneo-paint-toggle]').click();
            await shape.locator('[data-geneo-creation-radius]').fill('12');
            await shape.locator('[data-geneo-creation-radius]').dispatchEvent('change');
            const shapeResult = await page.evaluate(() => {
                updateGeneographPanelDraftDom({ x: 100, y: 100 }, { x: 240, y: 190 });
                const preview = document.querySelector('[data-geneo-panel-draft]');
                const node = createGeneographShapeFromRect({ x: 100, y: 100, width: 140, height: 90 });
                return { kind: node.shapeKind, appearance: node.appearance,
                    preview: [preview.classList.contains('shape-preview'), preview.querySelector('.geneo-shape-svg path') !== null] };
            });
            assert.equal(shapeResult.kind, 'triangle');
            assert.equal(shapeResult.appearance.fill.color, '#335577');
            assert.equal(shapeResult.appearance.stroke.enabled, false);
            assert.equal(shapeResult.appearance.cornerRadius, 12);
            assert.deepEqual(shapeResult.preview, [true, true]);
            await shape.locator('[data-geneo-creation-shape-kind]').click();
            await page.locator('[data-geneo-shape-kind="ellipse"]').dispatchEvent('click');
            assert.equal(await shape.locator('[data-geneo-creation-radius]').count(), 0);
            await shape.locator('[data-geneo-creation-reset]').click();
            assert.deepEqual(await page.evaluate(() => [geneoCreationToolSettings('shape').shapeKind,
                geneoCreationToolSettings('shape').appearance.fill.color]), ['rectangle', '#173029']);
            await shape.locator('[data-geneo-creation-close]').click();
            assert.equal(await page.evaluate(() => state.geneoTool), 'shape');
            await activate('shape');
            assert.equal(await shape.count(), 1);
            await page.evaluate(() => {
                const board = structuredClone(selectedGeneographBoard());
                board.id = 'creation-strips-other-board';
                sampleData.boards.push(board);
                openGeneographBoard(board.id);
                openGeneographBoard('gb1');
            });
            assert.equal(await page.evaluate(() => geneoCreationToolSettings('shape').appearance.stroke.enabled), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph creation strips passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
