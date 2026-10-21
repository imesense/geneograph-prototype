const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}),
        headless: true
    });
    try {
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.style = 'standard';
                diagram.personCardDefaults.styleSettings.standard.fields.birthPlace = false;
                diagram.personCardDefaults.styleSettings.standard.fields.deathPlace = false;
                getGeneographNode('gn-barnaby').personCard = geneoEmptyPersonCardOverrides();
                state.selectedGeneoNodeId = null;
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();
            }, language);
            assert.deepEqual(await page.evaluate(() => {
                const defaults = geneoDefaultPersonCardSettings('standard');
                defaults.styleSettings = { standard: { alignment: 'right', fields: {} } };
                delete defaults.nameAlignment;
                const board = normalizeGeneographPersonCardSettings(defaults);
                const node = normalizeGeneographPersonCardOverrides({
                    custom: true,
                    style: 'standard',
                    styleSettings: { standard: { alignment: 'right', fields: {} } }
                });
                return [board.nameAlignment, node.styleSettings.standard.nameAlignment];
            }), ['right', 'right']);
            const card = page.locator('.geneo-node-person[data-geneo-node="gn-barnaby"]');
            assert.equal(await page.locator('[data-geneo-person-card-setting="nameAlignment"][data-geneo-person-card-scope="board"]').count(), 1);
            for (const alignment of ['left', 'center', 'right']) {
                await page.evaluate(alignment => {
                    for (const key of ['nameAlignment', 'alignment']) {
                        const control = document.querySelector(`[data-geneo-person-card-setting="${key}"][data-geneo-person-card-scope="board"]`);
                        control.value = alignment;
                        control.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, alignment);
                const position = await card.evaluate(element => {
                    const life = element.querySelector('.geneo-person-life').getBoundingClientRect();
                    const rows = element.querySelector('.geneo-person-life-events').getBoundingClientRect();
                    const dates = [...element.querySelectorAll('.geneo-person-life-event-date')]
                        .map(date => date.getBoundingClientRect().left);
                    return {
                        left: rows.left - life.left,
                        center: (rows.left + rows.right - life.left - life.right) / 2,
                        right: life.right - rows.right,
                        dateOffset: dates.length > 1 ? Math.abs(dates[0] - dates[1]) : 0,
                        nameJustify: getComputedStyle(element.querySelector('.geneo-person-name-wrap')).justifyItems
                    };
                });
                assert.ok(Math.abs(position[alignment]) < 2, JSON.stringify({ alignment, position }));
                assert.ok(position.dateOffset < 2, JSON.stringify({ alignment, position }));
                if (alignment === 'right') assert.equal(position.nameJustify, 'end');
                if (process.env.GENEO_CARD_SCREENSHOT_DIR)
                    await card.screenshot({ path: path.join(process.env.GENEO_CARD_SCREENSHOT_DIR, `standard-${language}-${alignment}.png`) });
            }
            await page.evaluate(() => {
                const name = document.querySelector('[data-geneo-person-card-setting="nameAlignment"][data-geneo-person-card-scope="board"]');
                name.value = 'left';
                name.dispatchEvent(new Event('change', { bubbles: true }));
            });
            assert.deepEqual(await card.evaluate(element => ({
                name: getComputedStyle(element.querySelector('.geneo-person-name-wrap')).justifyItems,
                dates: getComputedStyle(element.querySelector('.geneo-person-life-events')).alignSelf
            })), { name: 'normal', dates: 'flex-end' });
            await page.evaluate(() => {
                state.selectedGeneoNodeId = 'gn-barnaby';
                state.selectedGeneoNodeIds = ['gn-barnaby'];
                renderGeneographEditorPreserveScroll();
            });
            await page.locator('[data-geneo-person-card-setting="nameAlignment"][data-geneo-person-card-scope="node"]').selectOption('center');
            assert.deepEqual(await card.evaluate(element => ({
                name: getComputedStyle(element.querySelector('.geneo-person-name-wrap')).justifyItems,
                dates: getComputedStyle(element.querySelector('.geneo-person-life-events')).alignSelf
            })), { name: 'center', dates: 'flex-end' });
            await page.evaluate(() => {
                state.selectedGeneoNodeId = null;
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();
            });
            const dateAppearance = await page.evaluate(() => {
                const pick = style => {
                    document.querySelector(`[data-geneo-person-card-style="${style}"][data-geneo-person-card-scope="board"]`).click();
                    const date = document.querySelector('.geneo-node-person[data-geneo-node="gn-barnaby"] .geneo-person-life-summary');
                    return { color: getComputedStyle(date).color, whiteSpace: getComputedStyle(date).whiteSpace };
                };
                return { chart: pick('chart'), portrait: pick('portrait') };
            });
            assert.equal(dateAppearance.chart.color, dateAppearance.portrait.color);
            assert.equal(dateAppearance.chart.whiteSpace, 'nowrap');
            assert.equal(dateAppearance.portrait.whiteSpace, 'nowrap');
            await page.evaluate(() => {
                document.querySelector('[data-geneo-person-card-style="compact"][data-geneo-person-card-scope="board"]').click();
            });
            const compact = await card.evaluate(element => ({
                edit: element.querySelector('.geneo-person-edit-action')?.offsetWidth,
                add: element.querySelector('.geneo-person-add-relative')?.offsetWidth,
                dateWhiteSpace: getComputedStyle(element.querySelector('.geneo-person-life-summary')).whiteSpace
            }));
            assert.deepEqual(compact, { edit: 44, add: 44, dateWhiteSpace: 'nowrap' });
            await card.hover();
            const actions = await card.evaluate(element => {
                const edit = element.querySelector('.geneo-person-edit-action');
                const add = element.querySelector('.geneo-person-add-relative');
                const gap = element.querySelector('.geneo-person-action-gap');
                const editBox = edit.getBoundingClientRect();
                const addBox = add.getBoundingClientRect();
                const gapBox = gap.getBoundingClientRect();
                return {
                    editBackground: getComputedStyle(edit).backgroundColor,
                    addBackground: getComputedStyle(add).backgroundColor,
                    editFace: getComputedStyle(edit, '::before').backgroundColor,
                    addFace: getComputedStyle(add, '::before').backgroundColor,
                    faceInset: getComputedStyle(edit, '::before').inset,
                    gapBackground: getComputedStyle(gap).backgroundColor,
                    cardBackground: getComputedStyle(element).backgroundColor,
                    faceGap: (addBox.left + 6 * editBox.width / 44 - (editBox.right - 6 * editBox.width / 44)) * 44 / editBox.width,
                    segmentWidth: gapBox.width,
                    dateClip: getComputedStyle(element.querySelector('.geneo-person-life-summary')).clipPath
                };
            });
            assert.equal(actions.editBackground, 'rgba(0, 0, 0, 0)');
            assert.equal(actions.addBackground, 'rgba(0, 0, 0, 0)');
            assert.equal(actions.editFace, 'rgb(8, 14, 11)');
            assert.equal(actions.addFace, 'rgb(8, 14, 11)');
            assert.equal(actions.faceInset, '6px');
            assert.ok(Math.abs(actions.faceGap - 12) < 0.1, JSON.stringify(actions));
            assert.ok(actions.segmentWidth > 0);
            assert.equal(actions.gapBackground, actions.cardBackground);
            assert.equal(actions.dateClip, 'inset(0px 59px 0px 0px)');
            assert.deepEqual(await page.evaluate(() => ({
                bright: geneoPersonActionGapColor({ color: '#67ADE3', opacity: 100, enabled: true }),
                translucent: geneoPersonActionGapColor({ color: '#67ADE3', opacity: 50, enabled: true }),
                unfilled: geneoPersonActionGapColor({ color: '#67ADE3', opacity: 100, enabled: false })
            })), {
                bright: 'rgba(103, 173, 227, 1)',
                translucent: 'transparent',
                unfilled: 'transparent'
            });
            const defaults = await page.evaluate(() => ({
                compact: [GENEO_PERSON_CARD_GEOMETRY.compact.width, GENEO_PERSON_CARD_GEOMETRY.compact.height],
                portrait: [GENEO_PERSON_CARD_GEOMETRY.portrait.width, GENEO_PERSON_CARD_GEOMETRY.portrait.height]
            }));
            assert.deepEqual(defaults, { compact: [300, 130], portrait: [250, 350] });
            if (process.env.GENEO_CARD_SCREENSHOT_DIR) {
                await card.screenshot({ path: path.join(process.env.GENEO_CARD_SCREENSHOT_DIR, `compact-${language}.png`) });
            }
            await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.style = 'standard';
                diagram.personCardDefaults.styleSettings.standard.fields.birthPlace = true;
                diagram.personCardDefaults.styleSettings.standard.fields.deathPlace = true;
                renderGeneographEditorPreserveScroll();
            });
            const standardPlace = await card.evaluate(element => {
                const value = element.querySelector('.geneo-person-life-event-value');
                let place = element.querySelector('.geneo-person-life-event-place');
                if (value && !place) {
                    place = document.createElement('span');
                    place.className = 'geneo-person-life-event-place';
                    place.textContent = 'Meowbridge, North Yorkshire';
                    value.append(place);
                }
                return {
                    gapCount: element.querySelectorAll('.geneo-person-action-gap').length,
                    valueOverflow: value ? getComputedStyle(value).overflow : null,
                    placePaddingBottom: place ? getComputedStyle(place).paddingBottom : null,
                    placeClippedVertically: place ? place.scrollHeight > place.clientHeight : null
                };
            });
            assert.equal(standardPlace.gapCount, 0);
            assert.equal(standardPlace.valueOverflow, 'visible');
            assert.equal(standardPlace.placePaddingBottom, '2px');
            assert.equal(standardPlace.placeClippedVertically, false);
            if (process.env.GENEO_CARD_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_CARD_SCREENSHOT_DIR, `standard-place-${language}.png`) });
            await card.locator('.geneo-person-edit-action').click();
            assert.equal(await page.locator('.geneo-person-modal').count(), 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph card alignment passed.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
