const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try
    {
        for (const [width, language] of [[1280, 'en'], [1280, 'ru'], [1920, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(200);
            await page.evaluate(() =>
            {
                if (geneoTourRuntime.active) geneoTourClose();
                startGeneoProductTour();
            });
            let originalCenter;
            for (const id of ['geneograph-objects', 'geneograph-sockets-intro', 'geneograph-sockets-partners',
                'geneograph-sockets-children', 'geneograph-sockets-context', 'geneograph-inspector'])
            {
                await page.evaluate(stepId =>
                {
                    geneoTourRuntime.transitioning = false;
                    geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === stepId));
                }, id);
                await page.waitForFunction(stepId => geneoTourSteps[geneoTourRuntime.index]?.id === stepId
                    && !geneoTourRuntime.transitioning, id, { timeout: 5000 });
                if (id === 'geneograph-objects' && width === 1280)
                {
                    originalCenter = await page.evaluate(() =>
                    {
                        const wrap = document.querySelector('[data-geneo-canvas-wrap]');
                        wrap.scrollLeft += 460;
                        return geneoCurrentViewportCenter();
                    });
                }
                const view = await page.evaluate(() =>
                {
                    const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
                    const viewport = rect('.geneo-canvas-viewport');
                    return {
                        fallback: geneoTourRuntime.fallback,
                        unanchored: geneoTourRuntime.root?.classList.contains('is-unanchored'),
                        sockets: document.querySelector('.geneo-canvas-stage')?.classList.contains('show-sockets'),
                        inspectorDisplay: getComputedStyle(document.querySelector('.geneo-inspector')).display,
                        scroll: document.querySelector('[data-geneo-canvas-wrap]')?.scrollLeft,
                        center: geneoCurrentViewportCenter(),
                        viewport: viewport && { left: viewport.left, right: viewport.right,
                            top: viewport.top, bottom: viewport.bottom },
                        card: rect('.geneo-tour-card')?.toJSON(),
                        panel: rect('[data-geneo-node="gn-panel"]')?.toJSON(),
                        blocks: [...document.querySelectorAll('.geneo-tour-target-block')]
                            .filter(block => !block.hidden)
                            .map(block => block.getBoundingClientRect().toJSON())
                    };
                });
                assert.equal(view.fallback, false, `${width} ${id}: target fallback`);
                assert.equal(view.unanchored, false, `${width} ${id}: unanchored card ${JSON.stringify(view)}`);
                if (id === 'geneograph-sockets-intro')
                {
                    if (!originalCenter) originalCenter = view.center;
                    assert.equal(view.blocks.length, 2, `${width} ${language}: missing connection spotlights`);
                    for (const block of view.blocks)
                        assert.ok(block.left >= view.viewport.left - 1 && block.right <= view.viewport.right + 1
                            && block.top >= view.viewport.top - 1 && block.bottom <= view.viewport.bottom + 1,
                        `${width} ${language}: connection focus is outside the canvas`);
                    assert.ok(view.card.right + 8 <= Math.min(...view.blocks.map(block => block.left)),
                        `${width} ${language}: card covers the connection focus`);
                }
                if (id === 'geneograph-sockets-children' && width === 1280)
                    assert.ok(view.card.right + 8 <= Math.min(...view.blocks.map(block => block.left)),
                        `${width} ${language}: card is not left of all three sockets`);
                if (id === 'geneograph-sockets-context')
                {
                    assert.equal(view.blocks.length, 2);
                    for (const block of view.blocks)
                        assert.ok(block.left >= view.viewport.left && block.right <= view.viewport.right + 1,
                            `${width}: image or note spotlight outside canvas`);
                }
                if (id === 'geneograph-inspector')
                {
                    assert.equal(view.sockets, false);
                    assert.notEqual(view.inspectorDisplay, 'none');
                    assert.ok(Math.abs(view.center.x - originalCenter.x) < 2
                        && Math.abs(view.center.y - originalCenter.y) < 2,
                    `${width} ${language}: canvas position not restored`);
                }
                else
                {
                    assert.equal(view.inspectorDisplay, 'none', `${width} ${id}: inspector visible`);
                    if (id !== 'geneograph-objects')
                        assert.equal(view.sockets, true, `${width} ${id}: sockets hidden`);
                }
            }
            if (width === 1280)
            {
                await page.evaluate(() =>
                {
                    const wrap = document.querySelector('[data-geneo-canvas-wrap]');
                    wrap.scrollLeft = wrap.scrollWidth - wrap.clientWidth;
                    wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight;
                    geneoTourRuntime.transitioning = false;
                    geneoTourMoveTo(geneoTourSteps.findIndex(step => step.id === 'geneograph-sockets-intro'));
                });
                await page.waitForFunction(() => !geneoTourRuntime.transitioning);
                const panned = await page.evaluate(() => ({
                    unanchored: geneoTourRuntime.root.classList.contains('is-unanchored'),
                    blocks: [...document.querySelectorAll('.geneo-tour-target-block')]
                        .filter(block => !block.hidden).map(block => block.getBoundingClientRect().toJSON()),
                    card: document.querySelector('.geneo-tour-card').getBoundingClientRect().toJSON()
                }));
                assert.equal(panned.unanchored, false, `${language}: panned board lost its spotlight`);
                assert.equal(panned.blocks.length, 2, `${language}: panned board lost a focus area`);
                assert.ok(panned.card.right + 8 <= Math.min(...panned.blocks.map(block => block.left)),
                    `${language}: panned board card covers the focus`);
            }
            await page.evaluate(() =>
            {
                geneoTourClose();
                state.geneoTool = 'connect';
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await page.locator('body').evaluate(body => body.classList.contains('geneo-tour-geneo-focus-canvas')),
                false, `${width}: tour-only inspector hiding persisted`);
            const widths = await page.evaluate(() =>
            {
                const group = document.querySelector('.geneo-tool-group');
                const last = group.lastElementChild.getBoundingClientRect();
                const bounds = group.getBoundingClientRect();
                return { group: bounds.width, trailingGap: bounds.right - last.right };
            });
            assert.ok(widths.group <= 130 && widths.trailingGap < 10,
                `${width}: Connect leaves empty mode-group space (${JSON.stringify(widths)})`);
            if (width === 1280)
            {
                const targetToolbar = await page.evaluate(() =>
                {
                    const toolbar = document.querySelector('.geneo-editor-toolbar');
                    return {
                        hidden: toolbar.querySelectorAll('[data-geneo-hidden]').length,
                        more: toolbar.querySelector('[data-geneo-toolbar-overflow]').getClientRects().length > 0
                    };
                });
                assert.equal(targetToolbar.hidden, 0, `${language}: tools moved to More at 1280px`);
                assert.equal(targetToolbar.more, false, `${language}: empty More button at 1280px`);
            }
            if (width === 1280 && language === 'en')
            {
                const order = ['export', 'shape', 'content', 'panel', 'image', 'place',
                    'person', 'connect', 'modes', 'history'];
                for (const viewportWidth of [1920, 1400, 1280, 1200, 1100, 1024, 900, 760, 600, 320])
                {
                    await page.setViewportSize({ width: viewportWidth, height: 720 });
                    await page.waitForTimeout(80);
                    const layout = await page.evaluate(() =>
                    {
                        const toolbar = document.querySelector('.geneo-editor-toolbar');
                        const left = toolbar.querySelector('.geneo-editor-toolbar-left');
                        const controls = id => id === 'modes' ? toolbar.querySelector('.geneo-tool-group')
                            : id === 'history' ? toolbar.querySelector('.geneo-history-group')
                                : toolbar.querySelector(`[data-geneo-toolbar-item="${id}"]`);
                        const ids = ['export', 'shape', 'content', 'panel', 'image', 'place',
                            'person', 'connect', 'modes', 'history'];
                        return {
                            density: toolbar.dataset.toolbarDensity,
                            hidden: ids.filter(id => controls(id).hasAttribute('data-geneo-hidden')),
                            more: toolbar.querySelector('[data-geneo-toolbar-overflow]').getClientRects().length > 0,
                            clipped: left.scrollWidth > left.clientWidth + 1,
                            invalidNames: [...toolbar.querySelectorAll('[data-geneo-icon-only] button')]
                                .filter(button => !button.getAttribute('aria-label') || !button.getAttribute('title'))
                                .length
                        };
                    });
                    assert.deepEqual(layout.hidden, order.slice(0, layout.hidden.length),
                        `${viewportWidth}: toolbar hiding is not right-to-left`);
                    assert.equal(layout.more, layout.hidden.length > 0,
                        `${viewportWidth}: More visibility does not match hidden tools`);
                    assert.equal(layout.clipped, false, `${viewportWidth}: toolbar clips controls`);
                    assert.equal(layout.invalidNames, 0, `${viewportWidth}: icon-only button lacks a name`);
                    if (viewportWidth === 1280) assert.deepEqual(layout.hidden, []);
                    if (viewportWidth === 1920) assert.equal(layout.density, 'expanded');
                }
                await page.setViewportSize({ width: 600, height: 720 });
                await page.waitForTimeout(80);
                await page.locator('[data-geneo-toolbar-overflow]').click();
                const actions = await page.locator('#projectMenu [data-geneo-toolbar-action]')
                    .evaluateAll(buttons => buttons.map(button => button.dataset.geneoToolbarAction));
                assert.ok(actions.includes('shape') && actions.includes('shape-style')
                    && actions.includes('export'));
                assert.equal(new Set(actions).size, actions.length);
                await page.locator('#projectMenu [data-geneo-toolbar-action="shape-style"]').click();
                await page.locator('.geneo-shape-options-menu').waitFor({ state: 'visible' });
                assert.equal(await page.locator('.geneo-shape-options-menu').isVisible(), true);
                await page.keyboard.press('Escape');
                await page.setViewportSize({ width: 320, height: 720 });
                await page.waitForTimeout(80);
                await page.locator('[data-geneo-toolbar-overflow]').focus();
                await page.keyboard.press('Enter');
                await page.locator('#projectMenu [data-geneo-toolbar-action="pan"]').click();
                assert.equal(await page.evaluate(() => state.geneoTool), 'pan');
            }
            assert.deepEqual(errors, [], `${width}: browser errors`);
            await page.close();
        }
        console.log('Geneograph socket tour and compact mode toolbar passed at 1280 and 1920px.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
