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
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('https://**/*', route => route.abort());
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.waitForFunction(() => document.querySelector('#topbar')?.children.length > 0);
            const nodeId = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                const person = diagram.people.find(item => item.id === 'gp-daisy');
                person.names.last = 'Purrington';
                person.names.maiden = 'Milkpaw';
                person.birth.placeText = 'Pawford, North Yorkshire, England';
                person.death.placeText = 'Pawford, North Yorkshire, England';
                diagram.personCardDefaults.fields.birthPlace = true;
                diagram.personCardDefaults.fields.deathPlace = true;
                diagram.personCardDefaults.fields.maidenName = true;
                const node = createGeneographPersonNodeForBoardPerson(person);
                if (node.width !== 360 || node.height !== 160
                    || node.personCard.heightMode !== 'manual'
                    || node.appearance.stroke.enabled
                    || !node.appearance.paintOverrides.stroke) {
                    throw new Error('New standard card defaults were not applied.');
                }
                diagram.personCardDefaults.style = 'portrait';
                const portrait = createGeneographPersonNodeForBoardPerson(person);
                if (!portrait.appearance.stroke.enabled || portrait.appearance.paintOverrides.stroke) {
                    throw new Error('Other card styles must keep their stroke defaults.');
                }
                diagram.nodes = diagram.nodes.filter(item => item.id !== portrait.id);
                diagram.personCardDefaults.style = 'standard';
                renderGeneographEditorPreserveScroll();
                return node.id;
            }, language);
            const card = page.locator(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
            const base = await card.evaluate(element => {
                const photo = element.querySelector('.geneo-person-avatar');
                const name = element.querySelector('.geneo-person-name');
                const maiden = element.querySelector('.geneo-person-maiden');
                return {
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    photoWidth: photo.offsetWidth,
                    photoHeight: photo.offsetHeight,
                    nameSize: getComputedStyle(name).fontSize,
                    nameWeight: getComputedStyle(name).fontWeight,
                    nameLineHeight: getComputedStyle(name).lineHeight,
                    maidenSize: maiden ? getComputedStyle(maiden).fontSize : null,
                    maidenWeight: maiden ? getComputedStyle(maiden).fontWeight : null,
                    stroke: getComputedStyle(element).borderTopStyle,
                    labels: [...element.querySelectorAll('.geneo-person-life-event-kind')]
                        .map(item => item.textContent.trim()),
                    fullLabels: [...element.querySelectorAll('.geneo-person-life-event-kind abbr')]
                        .map(item => item.getAttribute('aria-label')),
                    labelWeights: [...element.querySelectorAll('.geneo-person-life-event-kind')]
                        .map(item => getComputedStyle(item).fontWeight),
                    labelSizes: [...element.querySelectorAll('.geneo-person-life-event-kind')]
                        .map(item => getComputedStyle(item).fontSize),
                    labelColors: [...element.querySelectorAll('.geneo-person-life-event-kind')]
                        .map(item => getComputedStyle(item).color),
                    placeColors: [...element.querySelectorAll('.geneo-person-life-event-place')]
                        .map(item => getComputedStyle(item).color),
                    dateWeights: [...element.querySelectorAll('.geneo-person-life-event-date')]
                        .map(item => getComputedStyle(item).fontWeight),
                    placeWeights: [...element.querySelectorAll('.geneo-person-life-event-place')]
                        .map(item => getComputedStyle(item).fontWeight),
                    edit: element.querySelectorAll('[data-geneo-edit-person-node]').length
                };
            });
            assert.equal(base.width, 360);
            assert.equal(base.height, 160);
            assert.equal(base.photoWidth, 64);
            assert.equal(base.photoHeight, 64);
            assert.equal(base.nameSize, '19px');
            assert.equal(base.nameWeight, '600');
            assert.equal(base.nameLineHeight, '25.65px');
            assert.equal(base.maidenSize, '14px');
            assert.equal(base.maidenWeight, '450');
            assert.equal(base.stroke, 'none');
            assert.equal(base.edit, 1);
            if (process.env.GENEO_STANDARD_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_STANDARD_SCREENSHOT_DIR, `standard-${language}-both.png`) });
            assert.deepEqual(base.labels, language === 'ru' ? ['род.', 'ум.'] : ['Born:', 'Died:']);
            assert.deepEqual(base.fullLabels, language === 'ru' ? ['Рождение', 'Смерть'] : ['Born', 'Died']);
            assert.deepEqual(base.labelWeights, ['500', '500']);
            assert.deepEqual(base.labelSizes, ['13px', '13px']);
            assert.deepEqual(base.dateWeights, ['500', '500']);
            assert.deepEqual(base.placeWeights, ['400', '400']);
            assert.deepEqual(base.labelColors, base.placeColors);
            assert.equal(await card.evaluate(element => {
                const stage = document.createElement('div');
                stage.appendChild(element.cloneNode(true));
                geneoPngRemoveEditorContent(stage);
                return stage.querySelectorAll('.geneo-person-edit-action').length;
            }), 0);

            await card.hover();
            await page.waitForFunction(nodeId => {
                const button = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"] .geneo-person-edit-action`);
                return button && getComputedStyle(button).visibility === 'visible';
            }, nodeId);
            const hover = await card.evaluate(element => {
                const edit = element.querySelector('.geneo-person-edit-action');
                const addRelative = element.querySelector('.geneo-person-add-relative');
                const place = element.querySelector('.geneo-person-life-event-place');
                return {
                    hovered: element.matches(':hover'),
                    editVisible: getComputedStyle(edit).visibility === 'visible',
                    editName: edit.getAttribute('aria-label'),
                    editTarget: edit.offsetWidth,
                    editRight: edit.getBoundingClientRect().right,
                    addRelativeLeft: addRelative.getBoundingClientRect().left,
                    placeWidth: place.getBoundingClientRect().width,
                    placeTitle: place.title,
                    cardRight: element.getBoundingClientRect().right
                };
            });
            assert.equal(hover.editVisible, true, JSON.stringify(hover));
            assert.ok(hover.editName);
            assert.equal(hover.editTarget, 44);
            assert.ok(hover.editRight <= hover.addRelativeLeft, JSON.stringify(hover));
            assert.ok(hover.placeWidth > 0);
            assert.ok(hover.placeTitle.length > 0);
            assert.ok(hover.editRight <= hover.cardRight);
            for (const [fill, foreground] of [
                ['#60afe8', '#101820'],
                ['#17362e', '#f8faf9']
            ]) {
                await card.evaluate((element, colors) => {
                    element.style.setProperty('--geneo-node-bg', colors.fill);
                    element.style.setProperty('--geneo-node-text', colors.foreground);
                }, { fill, foreground });
                for (const action of ['.geneo-person-edit-action', '.geneo-person-add-relative']) {
                    const button = card.locator(action);
                    assert.equal(await button.evaluate(element => getComputedStyle(element).color), 'rgb(248, 250, 249)');
                    await button.hover();
                    assert.equal(await button.evaluate(element => getComputedStyle(element, '::before').backgroundColor),
                        'rgba(8, 14, 11, 0.9)');
                }
                if (fill === '#60afe8' && process.env.GENEO_SCREENSHOT_DIR) {
                    await card.screenshot({
                        path: path.join(process.env.GENEO_SCREENSHOT_DIR, `geneo-standard-bright-${language}.png`)
                    });
                }
            }
            await card.evaluate(element => {
                element.style.removeProperty('--geneo-node-bg');
                element.style.removeProperty('--geneo-node-text');
            });
            if (process.env.GENEO_SCREENSHOT_DIR) {
                await card.screenshot({
                    path: path.join(process.env.GENEO_SCREENSHOT_DIR, `geneo-standard-${language}.png`)
                });
            }
            for (const [width, height] of [[260, 144], [350, 160], [420, 220]]) {
                const layout = await page.evaluate(({ nodeId, width, height }) => {
                    const node = getGeneographNode(nodeId);
                    node.width = width;
                    node.height = height;
                    renderGeneographEditorPreserveScroll();
                    const card = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
                    const cardBounds = card.getBoundingClientRect();
                    const scale = cardBounds.width / card.offsetWidth;
                    const content = card.querySelector('.geneo-person-node-content').getBoundingClientRect();
                    const photo = card.querySelector('.geneo-person-avatar').getBoundingClientRect();
                    const rows = [...card.querySelectorAll('.geneo-person-life-event')]
                        .map(row => {
                            const label = row.querySelector('.geneo-person-life-event-kind').getBoundingClientRect();
                            const labelText = row.querySelector('.geneo-person-life-event-kind abbr').getBoundingClientRect();
                            const value = row.querySelector('.geneo-person-life-event-value').getBoundingClientRect();
                            return {
                                inside: labelText.right <= value.left + 1 && value.right <= cardBounds.right + 1,
                                dateStart: value.left / scale,
                                labelGap: (value.left - label.right) / scale,
                                top: row.getBoundingClientRect().top / scale,
                                bottom: row.getBoundingClientRect().bottom / scale
                            };
                        });
                    return {
                        width: card.offsetWidth,
                        height: card.offsetHeight,
                        contentInside: content.right <= cardBounds.right + 1 && content.bottom <= cardBounds.bottom + 1,
                        photoBottom: photo.bottom / scale,
                        bottomInset: (cardBounds.bottom - card.querySelector('.geneo-person-life-event:last-child').getBoundingClientRect().bottom) / scale,
                        rows
                    };
                }, { nodeId, width, height });
                assert.equal(layout.width, width);
                assert.equal(layout.height, height);
                assert.ok(layout.contentInside && layout.rows.every(row => row.inside), JSON.stringify(layout));
                assert.ok(layout.rows.every(row => Math.abs(row.labelGap - 3) < 1), JSON.stringify(layout));
                assert.ok(Math.abs(layout.rows[0].dateStart - layout.rows[1].dateStart) < 1, JSON.stringify(layout));
                const eventGap = layout.rows[1].top - layout.rows[0].bottom;
                assert.ok(Math.abs(eventGap - (height === 144 ? 4 : 10)) < 1, JSON.stringify(layout));
                assert.ok(layout.rows[0].top - layout.photoBottom >= 8, JSON.stringify(layout));
                assert.ok(layout.bottomInset >= 14, JSON.stringify(layout));
            }
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                node.width = 350;
                node.height = 160;
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            assert.deepEqual(await page.evaluate(({ nodeId, language }) => {
                setLanguage(language === 'en' ? 'ru' : 'en');
                const labels = [...document.querySelectorAll(
                    `.geneo-node-person[data-geneo-node="${nodeId}"] .geneo-person-life-event-kind`
                )].map(item => item.textContent.trim());
                setLanguage(language);
                return labels;
            }, { nodeId, language }), language === 'en' ? ['род.', 'ум.'] : ['Born:', 'Died:']);
            assert.equal(await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = getGeneographPerson(node.personId);
                person.livingStatus = 'Living';
                person.death = {};
                renderGeneographEditorPreserveScroll();
                return document.querySelectorAll(`.geneo-node-person[data-geneo-node="${nodeId}"] .geneo-person-life-event`).length;
            }, nodeId), 1);
            const singleEventGap = await card.evaluate(element => {
                const scale = element.getBoundingClientRect().width / element.offsetWidth;
                const photo = element.querySelector('.geneo-person-avatar').getBoundingClientRect();
                const event = element.querySelector('.geneo-person-life-event').getBoundingClientRect();
                return (event.top - photo.bottom) / scale;
            });
            assert.ok(singleEventGap >= 8 && singleEventGap <= 16, singleEventGap);
            if (process.env.GENEO_STANDARD_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_STANDARD_SCREENSHOT_DIR, `standard-${language}-single.png`) });
            await card.locator('[data-geneo-edit-person-node]').click();
            assert.equal(await page.locator('.geneo-person-modal').count(), 1);
            assert.deepEqual(await page.evaluate(() => {
                const selectedGender = (person, relative = null) => {
                    const modal = new DOMParser().parseFromString(
                        renderGeneographPersonModal(person, { relative }), 'text/html'
                    );
                    return modal.querySelector('#geneoPersonGender').value;
                };
                return [
                    selectedGender(null),
                    selectedGender(null, { type: 'partner' }),
                    selectedGender(null, { type: 'mother' }),
                    selectedGender({ gender: 'unknown' })
                ];
            }), ['male', 'male', 'female', 'unknown']);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph standard card passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
