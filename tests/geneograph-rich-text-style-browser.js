const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1440, 'en'], [390, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 820 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            for (const type of ['sticky', 'text'])
            {
                const found = await page.evaluate(type =>
                {
                    activateProject('p1', { moduleName: 'Geneograph' });
                    openGeneographBoard('gb1');
                    const node = selectedGeneographDiagram().nodes.find(item => item.type === type);
                    if (!node) return false;
                    state.selectedGeneoNodeId = node.id;
                    state.selectedGeneoNodeIds = [node.id];
                    state.geneoInlineEditNodeId = node.id;
                    renderGeneographEditorPreserveScroll();
                    return true;
                }, type);
                assert(found, `${type} sample node exists`);
                if (width <= 900)
                {
                    await page.evaluate(() =>
                    {
                        if (mobileSurface !== 'details') openMobileSurface('details');
                        state.geneoInlineEditNodeId = state.selectedGeneoNodeId;
                        renderGeneographEditorPreserveScroll();
                    });
                }
                await page.waitForTimeout(800);
                const diagnostic = await page.evaluate(() => ({
                    shell: Boolean(document.querySelector('.geneo-rich-text-inspector-editor-shell')),
                    editor: Boolean(document.querySelector('.geneo-rich-text-inspector-editor-shell .ql-editor')),
                    fallback: Boolean(document.querySelector('.geneo-rich-text-inspector-fallback')),
                }));
                assert(diagnostic.shell && (diagnostic.editor || diagnostic.fallback), JSON.stringify(diagnostic));
                const result = await page.evaluate(() =>
                {
                    const shell = document.querySelector('.geneo-rich-text-inspector-editor-shell');
                    const editor = shell.querySelector('.ql-editor') || shell.querySelector('.geneo-rich-text-inspector-fallback');
                    const toolbar = shell.querySelector('.ql-toolbar');
                    const probe = document.createElement('div');
                    probe.className = 'ql-snow';
                    probe.innerHTML = '<svg><path class="ql-stroke"></path></svg>';
                    shell.append(probe);
                    const stroke = getComputedStyle(probe.querySelector('.ql-stroke')).stroke;
                    probe.remove();
                    const rect = shell.getBoundingClientRect();
                    return {
                        sharedShell: shell.classList.contains('notes-rich-editor-shell'),
                        fontSize: getComputedStyle(editor).fontSize,
                        iconStroke: stroke,
                        toolbarPresent: Boolean(toolbar),
                        withinViewport: rect.left >= 0 && rect.right <= innerWidth + 1,
                        visible: rect.width > 0 && rect.height > 0,
                        overflow: document.documentElement.scrollWidth > innerWidth
                    };
                });
                assert.equal(result.sharedShell, true);
                assert.equal(result.fontSize, '15px');
                assert.equal(result.iconStroke, 'rgb(242, 244, 243)');
                assert.equal(result.toolbarPresent, diagnostic.editor);
                assert.equal(result.withinViewport, true);
                assert.equal(result.visible, true);
                assert.equal(result.overflow, false);
                if (process.env.GENEO_CAPTURE)
                    await page.screenshot({ path: path.join(os.tmpdir(), `geneograph-${type}-editor-${width}.png`) });
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph rich-text editor styling passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
