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
            await page.waitForFunction(() => document.querySelector('#topbar')?.children.length > 0);
            const nodeId = await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const diagram = selectedGeneographDiagram();
                diagram.personCardDefaults.style = 'chart';
                diagram.personCardDefaults.alignment = 'left';
                diagram.personCardDefaults.fields.photo = true;
                diagram.personCardDefaults.photoByStyle.chart = true;
                diagram.personCardDefaults.fields.maidenName = true;
                const person = diagram.people.find(item => item.id === 'gp-daisy');
                person.names.last = 'Purrington';
                person.names.maiden = 'Milkpaw';
                const node = createGeneographPersonNodeForBoardPerson(person);
                node.x = 400; node.y = 350;
                renderGeneographEditorPreserveScroll();
                return node.id;
            }, language);
            const card = page.locator(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
            const base = await card.evaluate(element => ({
                width: element.offsetWidth,
                height: element.offsetHeight,
                photo: element.querySelector('.geneo-person-avatar')?.offsetWidth,
                nameSize: getComputedStyle(element.querySelector('.geneo-person-name')).fontSize,
                nameLineHeight: getComputedStyle(element.querySelector('.geneo-person-name')).lineHeight,
                dateSize: getComputedStyle(element.querySelector('.geneo-person-life-summary')).fontSize,
                date: element.querySelector('.geneo-person-life-summary')?.textContent,
                maiden: element.querySelector('.geneo-person-maiden')?.textContent,
                placeCount: element.querySelectorAll('.geneo-person-life-event-place').length,
                statusCount: element.querySelectorAll('.geneo-person-status').length,
                align: getComputedStyle(element.querySelector('.geneo-person-life')).textAlign,
                groupGap: (() => {
                    const scale = element.getBoundingClientRect().width / element.offsetWidth;
                    const identity = element.querySelector('.geneo-person-identity-block').getBoundingClientRect();
                    const life = element.querySelector('.geneo-person-life').getBoundingClientRect();
                    return (life.top - identity.bottom) / scale;
                })()
            }));
            assert.equal(base.width, 440);
            assert.equal(base.height, 160);
            assert.equal(base.photo, 130, JSON.stringify(base));
            assert.equal(base.nameSize, '20px');
            assert.equal(base.nameLineHeight, '27px');
            assert.equal(base.dateSize, '16px');
            assert.ok(base.groupGap >= 8 && base.groupGap <= 12, JSON.stringify(base));
            assert.ok(base.maiden);
            assert.equal(base.placeCount, 0);
            assert.equal(base.statusCount, 0);
            assert.equal(base.align, 'left');
            if (process.env.GENEO_CHART_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_CHART_SCREENSHOT_DIR, `chart-${language}-default.png`) });
            await card.hover();
            await page.waitForTimeout(80);
            const hover = await card.evaluate(element => ({
                editWidth: element.querySelector('.geneo-person-edit-action').offsetWidth,
                addWidth: element.querySelector('.geneo-person-add-relative').offsetWidth,
                date: element.querySelector('.geneo-person-life-summary').textContent.trim(),
                lineCount: element.querySelector('.geneo-person-life-summary').getClientRects().length,
                whiteSpace: getComputedStyle(element.querySelector('.geneo-person-life-summary')).whiteSpace,
                editZ: getComputedStyle(element.querySelector('.geneo-person-edit-action')).zIndex
            }));
            assert.equal(hover.editWidth, 44);
            assert.equal(hover.addWidth, 44);
            assert.equal(hover.date, base.date.trim());
            assert.equal(hover.whiteSpace, 'nowrap');
            assert.ok(Number(hover.editZ) > 0);
            if (process.env.GENEO_CHART_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_CHART_SCREENSHOT_DIR, `chart-${language}-hover.png`) });
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                node.width = 600;
                node.personCard.custom = true;
                node.personCard.alignment = 'center';
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            const wide = await card.evaluate(element => ({
                align: getComputedStyle(element.querySelector('.geneo-person-life')).textAlign,
                full: element.querySelector('.geneo-person-life-summary').textContent,
                photo: element.querySelector('.geneo-person-avatar')?.offsetWidth
            }));
            assert.equal(wide.align, 'center');
            assert.ok(wide.full);
            assert.equal(wide.photo, 130);
            await card.hover();
            await page.waitForTimeout(80);
            assert.equal(await card.locator('.geneo-person-life-summary').textContent(), wide.full);
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = getGeneographPerson(node.personId);
                node.width = 420;
                person.names.first = 'Alexandera';
                person.names.middle = 'Alexandrovna';
                person.names.last = 'Alexandretta-Longlastname';
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            await card.hover();
            await page.waitForTimeout(80);
            const centered = await card.evaluate(element => {
                const rect = selector => element.querySelector(selector).getBoundingClientRect();
                const identity = rect('.geneo-person-identity-block');
                const date = rect('.geneo-person-life-summary');
                const content = rect('.geneo-person-node-content');
                const name = rect('.geneo-person-name');
                const life = rect('.geneo-person-life');
                const edit = rect('.geneo-person-edit-action');
                return {
                    axis: (identity.left + identity.right) / 2,
                    dateAxis: (date.left + date.right) / 2,
                    dateText: element.querySelector('.geneo-person-life-summary').textContent,
                    whiteSpace: getComputedStyle(element.querySelector('.geneo-person-life-summary')).whiteSpace,
                    topGap: name.top - content.top, bottomGap: content.bottom - life.bottom };
            });
            assert.ok(Math.abs(centered.dateAxis - centered.axis) < 2, JSON.stringify(centered));
            assert.ok(centered.dateText.includes('–'), JSON.stringify(centered));
            assert.equal(centered.whiteSpace, 'nowrap');
            assert.ok(Math.abs(centered.topGap - centered.bottomGap) < 15, JSON.stringify(centered));
            if (process.env.GENEO_CHART_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_CHART_SCREENSHOT_DIR, `chart-${language}-center-hover.png`) });
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = getGeneographPerson(node.personId);
                window.__chartTestDeath = structuredClone(person.death);
                person.livingStatus = 'Living';
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            await card.hover();
            await page.waitForTimeout(80);
            assert.equal(await card.locator('.geneo-person-life-summary').count(), 1);
            assert.ok((await card.locator('.geneo-person-life-summary').getAttribute('title')).length > 0);
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = getGeneographPerson(node.personId);
                person.livingStatus = 'Deceased';
                person.death = window.__chartTestDeath;
                node.width = 260; node.height = 120;
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            await card.hover();
            await page.waitForTimeout(80);
            const minimum = await card.evaluate(element => ({
                contentHeight: element.querySelector('.geneo-person-node-content').clientHeight,
                contentScrollHeight: element.querySelector('.geneo-person-node-content').scrollHeight,
                dateHeight: element.querySelector('.geneo-person-life-summary').getBoundingClientRect().height,
                dateLineHeight: parseFloat(getComputedStyle(element.querySelector('.geneo-person-life-summary')).lineHeight)
            }));
            assert.ok(minimum.contentScrollHeight <= minimum.contentHeight + 1, JSON.stringify(minimum));
            assert.ok(minimum.dateHeight <= minimum.dateLineHeight + 1, JSON.stringify(minimum));
            if (process.env.GENEO_CHART_SCREENSHOT_DIR)
                await card.screenshot({ path: path.join(process.env.GENEO_CHART_SCREENSHOT_DIR, `chart-${language}-minimum-hover.png`) });
            await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                node.personCard.photoByStyle.chart = false;
                renderGeneographEditorPreserveScroll();
            }, nodeId);
            assert.equal(await card.locator('.geneo-person-avatar').count(), 0);
            const narrow = await card.evaluate(element => ({
                card: element.offsetWidth,
                name: element.querySelector('.geneo-person-name').offsetWidth,
                content: element.querySelector('.geneo-person-node-content').scrollWidth
            }));
            assert.ok(narrow.name <= narrow.card && narrow.content <= narrow.card, JSON.stringify(narrow));
            const migrated = await page.evaluate(() => {
                const board = structuredClone(selectedGeneographBoard());
                const node = board.diagram.nodes.find(item => item.type === 'person');
                node.personCard = { custom: true, style: 'chart' };
                node.width = 260; node.height = 120; node.x = 100; node.y = 200;
                delete node.chartCardLayoutVersion;
                const people = new Map([[board.projectId, new Set()]]);
                const once = normalizeGeneographBoardRecord(board, people);
                const result = once.diagram.nodes.find(item => item.id === node.id);
                const twice = normalizeGeneographBoardRecord(once, people).diagram.nodes.find(item => item.id === node.id);
                return { width: result.width, height: result.height, x: result.x, y: result.y,
                    version: result.chartCardLayoutVersion, twiceWidth: twice.width, twiceX: twice.x };
            });
            assert.deepEqual(migrated, { width: 420, height: 160, x: 20, y: 180,
                version: 1, twiceWidth: 420, twiceX: 20 });
            assert.deepEqual(errors, []);
            await page.close();
        }
        process.stdout.write('Geneograph chart card passed.\n');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
