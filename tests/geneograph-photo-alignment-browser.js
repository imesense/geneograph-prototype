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
        for (const [width, language] of [[1440, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
            }, language);
            const getLayout = () => page.evaluate(() => {
                const card = document.querySelector('[data-geneo-node="gn-barnaby"]');
                const avatar = card.querySelector('.geneo-person-avatar')?.getBoundingClientRect();
                const name = card.querySelector('.geneo-person-identity-block').getBoundingClientRect();
                const edit = card.querySelector('.geneo-person-edit-action')?.getBoundingClientRect();
                const add = card.querySelector('.geneo-person-add-relative')?.getBoundingClientRect();
                return {
                    style: card.dataset.geneoPersonCardStyle,
                    align: card.dataset.geneoPersonCardPhotoAlign,
                    cardLeft: card.getBoundingClientRect().left,
                    avatarLeft: avatar?.left,
                    avatarRight: avatar?.right,
                    nameLeft: name.left,
                    nameRight: name.right,
                    editLeft: edit?.left,
                    editRight: edit?.right,
                    addLeft: add?.left,
                    addRight: add?.right,
                    hasAvatar: Boolean(avatar)
                };
            });
            assert.equal((await getLayout()).align, 'left');
            assert.equal(await page.evaluate(() => normalizeGeneographPersonCardSettings({}).photoAlignment), 'left');
            assert.equal(await page.evaluate(() => normalizeGeneographPersonCardSettings({ photoAlignment: 'invalid' }).photoAlignment), 'left');
            const boardSelect = page.locator('[data-geneo-person-card-setting="photoAlignment"][data-geneo-person-card-scope="board"]');
            assert.equal(await boardSelect.count(), 1);
            assert.equal(await boardSelect.inputValue(), 'left');
            await page.evaluate(() => {
                const input = document.querySelector('[data-geneo-person-card-setting="photoAlignment"][data-geneo-person-card-scope="board"]');
                input.value = 'right';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            let layout = await getLayout();
            assert.equal(layout.align, 'right');
            assert.ok(layout.avatarLeft > layout.nameRight - 1, JSON.stringify(layout));
            await page.evaluate(() => undoGeneographChange());
            assert.equal((await getLayout()).align, 'left');
            await page.evaluate(() => redoGeneographChange());
            assert.equal((await getLayout()).align, 'right');
            if (process.env.GENEO_SCREENSHOT_DIR) {
                await page.locator('.geneo-node-person[data-geneo-node="gn-barnaby"]').screenshot({
                    path: path.join(process.env.GENEO_SCREENSHOT_DIR, `photo-right-standard-${width}.png`)
                });
            }
            await page.evaluate(() => {
                selectGeneographNode('gn-barnaby');
                renderGeneographEditorPreserveScroll();
            });
            const nodeSelect = page.locator('[data-geneo-person-card-setting="photoAlignment"][data-geneo-person-card-scope="node"]');
            assert.equal(await nodeSelect.count(), 1);
            await page.evaluate(() => {
                const input = document.querySelector('[data-geneo-person-card-setting="photoAlignment"][data-geneo-person-card-scope="node"]');
                input.value = 'left';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            assert.equal((await getLayout()).align, 'left');
            assert.equal(await page.evaluate(() => getGeneographNode('gn-barnaby').personCard.styleSettings.standard.photoAlignment), 'left');
            assert.deepEqual(await page.evaluate(() => {
                const node = getGeneographNode('gn-barnaby');
                node.personCard.style = 'chart';
                const chart = geneoPersonCardEffectiveSettings(node).photoAlignment;
                node.personCard.style = null;
                const standard = geneoPersonCardEffectiveSettings(node).photoAlignment;
                return { chart, standard };
            }), { chart: 'left', standard: 'left' });
            assert.equal(await page.locator('[data-geneo-node="gn-daisy"]').getAttribute('data-geneo-person-card-photo-align'), 'right');
            await page.evaluate(() => {
                document.querySelector('[data-geneo-person-card-reset]')?.click();
            });
            assert.equal((await getLayout()).align, 'right');
            await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.style = 'chart';
                diagram.personCardDefaults.styleSettings.chart.photoAlignment = 'right';
                diagram.personCardDefaults.photoByStyle.chart = true;
                diagram.personCardDefaults.fields.photo = true;
                renderGeneographEditorPreserveScroll();
            });
            layout = await getLayout();
            assert.equal(layout.style, 'chart');
            assert.ok(layout.avatarLeft > layout.nameRight - 1, JSON.stringify(layout));
            assert.ok(layout.editRight <= layout.avatarLeft + 1, JSON.stringify(layout));
            assert.ok(layout.addRight <= layout.avatarLeft + 1, JSON.stringify(layout));
            assert.ok(layout.editLeft >= layout.cardLeft + 8, JSON.stringify(layout));
            assert.ok(layout.editRight <= layout.addLeft + 1, JSON.stringify(layout));
            const actionGap = await page.locator('.geneo-node-person[data-geneo-node="gn-barnaby"]').evaluate(element => {
                const edit = element.querySelector('.geneo-person-edit-action').getBoundingClientRect();
                const add = element.querySelector('.geneo-person-add-relative').getBoundingClientRect();
                const gap = element.querySelector('.geneo-person-action-gap');
                const segment = gap.getBoundingClientRect();
                const inset = 6 * edit.width / 44;
                return {
                    leftDifference: Math.abs(segment.left - (edit.right - inset)),
                    rightDifference: Math.abs(segment.right - (add.left + inset)),
                    fillMatches: getComputedStyle(gap).backgroundColor === getComputedStyle(element).backgroundColor,
                    dateClip: getComputedStyle(element.querySelector('.geneo-person-life-summary')).clipPath
                };
            });
            assert.ok(actionGap.leftDifference < 1, JSON.stringify(actionGap));
            assert.ok(actionGap.rightDifference < 1, JSON.stringify(actionGap));
            assert.ok(actionGap.fillMatches, JSON.stringify(actionGap));
            assert.equal(actionGap.dateClip, 'inset(0px 88px 0px 0px)');
            if (process.env.GENEO_SCREENSHOT_DIR) {
                await page.locator('.geneo-node-person[data-geneo-node="gn-barnaby"]').screenshot({
                    path: path.join(process.env.GENEO_SCREENSHOT_DIR, `photo-right-chart-${width}.png`)
                });
            }
            for (const [cardWidth, cardHeight] of [[260, 120], [420, 160], [560, 240]]) {
                const measured = await page.evaluate(([cardWidth, cardHeight]) => {
                    const diagram = selectedGeneographDiagram();
                    const node = getGeneographNode('gn-barnaby');
                    node.width = cardWidth;
                    node.height = cardHeight;
                    node.personCard.heightMode = 'manual';
                    diagram.personCardDefaults.styleSettings.chart.alignment = 'center';
                    renderGeneographEditorPreserveScroll();
                    const card = document.querySelector('.geneo-node-person[data-geneo-node="gn-barnaby"]');
                    const avatar = card.querySelector('.geneo-person-avatar').getBoundingClientRect();
                    const edit = card.querySelector('.geneo-person-edit-action').getBoundingClientRect();
                    const add = card.querySelector('.geneo-person-add-relative').getBoundingClientRect();
                    return {
                        avatarLeft: avatar.left,
                        editRight: edit.right,
                        addRight: add.right,
                        editLeft: edit.left,
                        cardLeft: card.getBoundingClientRect().left,
                        textAlign: getComputedStyle(card.querySelector('.geneo-person-life-summary')).textAlign
                    };
                }, [cardWidth, cardHeight]);
                assert.equal(measured.textAlign, 'center');
                assert.ok(measured.editRight <= measured.avatarLeft + 1, JSON.stringify(measured));
                assert.ok(measured.addRight <= measured.avatarLeft + 1, JSON.stringify(measured));
                assert.ok(measured.editLeft >= measured.cardLeft + 8, JSON.stringify(measured));
            }
            await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.fields.photo = false;
                diagram.personCardDefaults.photoByStyle.chart = false;
                renderGeneographEditorPreserveScroll();
            });
            assert.equal((await getLayout()).hasAvatar, false);
            assert.equal(await page.locator('[data-geneo-person-card-setting="photoAlignment"]:disabled').count(), 1);
            await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.style = 'portrait';
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await page.locator('[data-geneo-person-card-setting="photoAlignment"]').count(), 0);
            await page.evaluate(() => {
                selectedGeneographDiagram().personCardDefaults.style = 'compact';
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await page.locator('[data-geneo-person-card-setting="photoAlignment"]').count(), 0);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally {
        await browser.close();
    }
    process.stdout.write('Geneograph photo alignment passed.\n');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
