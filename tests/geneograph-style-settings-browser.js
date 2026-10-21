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
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const result = await page.evaluate(() => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                const diagram = selectedGeneographDiagram();
                const node = diagram.nodes.find(item => item.type === 'person');
                const nodeId = node.id;
                diagram.personCardDefaults = geneoDefaultPersonCardSettings();
                node.personCard = geneoEmptyPersonCardOverrides();
                state.selectedGeneoNodeId = null;
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();

                const pick = (scope, style) => {
                    document.querySelector(`[data-geneo-person-card-style="${style}"][data-geneo-person-card-scope="${scope}"]`).click();
                };
                const set = (scope, key, value) => {
                    const control = document.querySelector(`[data-geneo-person-card-setting="${key}"][data-geneo-person-card-scope="${scope}"]`);
                    control.value = value;
                    control.dispatchEvent(new Event('change', { bubbles: true }));
                };
                const toggle = (scope, field, checked) => {
                    const control = document.querySelector(`[data-geneo-person-card-field="${field}"][data-geneo-person-card-scope="${scope}"]`);
                    control.checked = checked;
                    control.dispatchEvent(new Event('change', { bubbles: true }));
                };
                const visible = (scope, field) => Boolean(document.querySelector(
                    `[data-geneo-person-card-field="${field}"][data-geneo-person-card-scope="${scope}"]`
                ));

                set('board', 'alignment', 'center');
                set('board', 'nameFormat', 'first-last');
                toggle('board', 'birthPlace', false);
                pick('board', 'compact');
                const compactCopy = document.querySelector('.geneo-inspector').textContent.includes(
                    state.language === 'ru' ? t('Centered by this style') : 'Centered by this style'
                );
                const compactHidden = !visible('board', 'photo') && !visible('board', 'birthPlace');
                pick('board', 'chart');
                set('board', 'alignment', 'left');
                set('board', 'nameFormat', 'surname-first');
                pick('board', 'portrait');
                set('board', 'dateFormat', 'years');
                pick('board', 'standard');
                const standard = normalizeGeneographPersonCardSettings(selectedGeneographDiagram().personCardDefaults);
                pick('board', 'chart');
                const chart = normalizeGeneographPersonCardSettings(selectedGeneographDiagram().personCardDefaults);
                pick('board', 'portrait');
                const portrait = normalizeGeneographPersonCardSettings(selectedGeneographDiagram().personCardDefaults);

                state.selectedGeneoNodeId = nodeId;
                state.selectedGeneoNodeIds = [nodeId];
                renderGeneographEditorPreserveScroll();
                pick('node', 'standard');
                set('node', 'alignment', 'left');
                pick('node', 'compact');
                const compactNodeHidden = !visible('node', 'photo') && !visible('node', 'livingStatus');
                pick('node', 'portrait');
                pick('node', 'standard');
                const nodeStandard = geneoPersonCardEffectiveSettings(getGeneographNode(nodeId));

                const legacyNode = normalizeGeneographPersonCardOverrides({
                    custom: true, style: 'compact', alignment: 'center',
                    fields: { dates: false }
                });
                const serialized = JSON.parse(JSON.stringify(selectedGeneographDiagram().personCardDefaults));
                const restored = normalizeGeneographPersonCardSettings(serialized);
                const other = selectedGeneographDiagram().nodes.find(item =>
                    item.type === 'person' && item.id !== nodeId);
                other.personCard = { ...geneoEmptyPersonCardOverrides(true), style: 'compact' };
                state.selectedGeneoNodeIds = [nodeId, other.id];
                state.selectedGeneoNodeId = nodeId;
                renderGeneographEditorPreserveScroll();
                const mixedHidden = !document.querySelector('[data-geneo-person-multi-field="photo"]')
                    && !document.querySelector('[data-geneo-person-multi-field="birthPlace"]');

                const legacy = normalizeGeneographPersonCardSettings({
                    style: 'compact', alignment: 'center', fields: { dates: false }
                });
                return {
                    compactCopy, compactHidden, compactNodeHidden,
                    standardAlignment: standard.alignment,
                    standardName: standard.nameFormat,
                    standardPlace: standard.fields.birthPlace,
                    chartAlignment: chart.alignment,
                    chartName: chart.nameFormat,
                    portraitAlignment: portrait.alignment,
                    portraitDates: portrait.dateFormat,
                    nodeAlignment: nodeStandard.alignment,
                    legacyCompact: legacy.alignment,
                    legacyStandard: legacy.styleSettings.standard.alignment,
                    savedPresets: Object.keys(selectedGeneographDiagram().personCardDefaults.styleSettings).length,
                    restoredStandard: restored.styleSettings.standard.nameFormat,
                    legacyNodeStandard: legacyNode.styleSettings.standard.alignment,
                    mixedHidden
                };
            });
            assert.deepEqual(result, {
                compactCopy: true,
                compactHidden: true,
                compactNodeHidden: true,
                standardAlignment: 'center',
                standardName: 'first-last',
                standardPlace: false,
                chartAlignment: 'left',
                chartName: 'surname-first',
                portraitAlignment: 'center',
                portraitDates: 'years',
                nodeAlignment: 'left',
                legacyCompact: 'center',
                legacyStandard: 'left',
                savedPresets: 4,
                restoredStandard: 'first-last',
                legacyNodeStandard: null,
                mixedHidden: true
            });
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph style settings passed.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
