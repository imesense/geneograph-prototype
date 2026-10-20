const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
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
                const node = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-daisy');
                const person = diagram.people.find(item => item.id === 'gp-daisy');
                person.birth.placeText = 'Pawford, North Yorkshire, England';
                person.death.placeText = 'Pawford, North Yorkshire, England';
                node.personCard = geneoEmptyPersonCardOverrides();
                node.personCard.custom = true;
                node.personCard.style = 'portrait';
                diagram.personCardDefaults.fields.linkIndicator = false;
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
                return node.id;
            }, language);
            const card = page.locator(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
            const migration = await page.evaluate(nodeId => {
                const board = structuredClone(selectedGeneographBoard());
                const node = board.diagram.nodes.find(item => item.id === nodeId);
                node.width = 180;
                node.height = 280;
                node.x = 100;
                node.y = 120;
                delete node.portraitCardLayoutVersion;
                const people = new Map([[board.projectId, new Set()]]);
                normalizeGeneographBoardRecord(board, people);
                const grown = board.diagram.nodes.find(item => item.id === nodeId);
                const first = [grown.x, grown.y, grown.width, grown.height, grown.portraitCardLayoutVersion];
                grown.width = 205;
                grown.height = 305;
                normalizeGeneographBoardRecord(board, people);
                const resized = board.diagram.nodes.find(item => item.id === nodeId);
                return { first, resized: [resized.width, resized.height] };
            }, nodeId);
            assert.deepEqual(migration.first, [72.5, 90, 235, 340, 1]);
            assert.deepEqual(migration.resized, [205, 305]);
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), null);
            await page.locator('[data-geneo-person-card-field="linkIndicator"][data-geneo-person-card-scope="node"]').check();
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), 'linked');
            assert.equal(await card.locator('.geneo-person-link-indicator').count(), 0);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await card.getAttribute('data-geneo-person-link-status'), 'linked');

            if (language === 'ru') await page.setViewportSize({ width: 390, height: 800 });
            for (const [width, height] of [[200, 300], [235, 340], [420, 420]]) {
                const layout = await page.evaluate(({ nodeId, width, height }) => {
                    const node = getGeneographNode(nodeId);
                    node.width = width;
                    node.height = height;
                    renderGeneographEditorPreserveScroll();
                    const card = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
                    const bounds = card.getBoundingClientRect();
                    const content = card.querySelector('.geneo-person-node-content').getBoundingClientRect();
                    const avatar = card.querySelector('.geneo-person-avatar').getBoundingClientRect();
                    const name = card.querySelector('.geneo-person-name').getBoundingClientRect();
                    const date = card.querySelector('.geneo-person-life').getBoundingClientRect();
                    const editButton = card.querySelector('.geneo-person-edit-action');
                    const addButton = card.querySelector('.geneo-person-add-relative');
                    const edit = editButton.getBoundingClientRect();
                    const add = addButton.getBoundingClientRect();
                    return { avatar: [avatar.width, avatar.height],
                        noOverflow: content.right <= bounds.right + 1 && content.bottom <= bounds.bottom + 1,
                        ordered: avatar.bottom < name.top && name.bottom <= date.top && date.bottom < edit.top,
                        actions: editButton.offsetWidth >= 44 && addButton.offsetWidth >= 44 && edit.right <= add.left + 1,
                        date: card.querySelector('.geneo-portrait-date-full')?.textContent.trim(),
                        placeRows: card.querySelectorAll('.geneo-person-life-event').length };
                }, { nodeId, width, height });
                assert.equal(layout.placeRows, 0);
                assert.ok(layout.noOverflow && layout.ordered && layout.actions && layout.date && Math.abs(layout.avatar[0] - layout.avatar[1]) < 1,
                    JSON.stringify({ language, width, height, layout }));
                if (process.env.GENEO_SCREENSHOT_DIR && language === 'ru')
                    await card.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `geneo-portrait-${width}.png`) });
            }
            if (language === 'ru') await page.setViewportSize({ width: 1280, height: 800 });

            const dense = await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = selectedGeneographDiagram().people.find(item => item.id === node.personId);
                node.width = 235;
                node.height = 340;
                person.names.first = 'Alexandra Alexandra';
                person.names.middle = 'Alexandrovna';
                person.names.last = 'Whiskerfield';
                renderGeneographEditorPreserveScroll();
                const card = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
                const name = card.querySelector('.geneo-person-name').getBoundingClientRect();
                const date = card.querySelector('.geneo-person-life').getBoundingClientRect();
                const edit = card.querySelector('.geneo-person-edit-action').getBoundingClientRect();
                return { nameBeforeDate: name.bottom <= date.top,
                    dateBeforeActions: date.bottom < edit.top,
                    photo: !!card.querySelector('.geneo-person-avatar') };
            }, nodeId);
            assert.ok(dense.photo && dense.nameBeforeDate && dense.dateBeforeActions,
                JSON.stringify({ language, dense }));

            const noPhoto = await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                const person = selectedGeneographDiagram().people.find(item => item.id === node.personId);
                node.width = 200;
                node.height = 300;
                node.personCard.fields.photo = false;
                renderGeneographEditorPreserveScroll();
                const card = document.querySelector(`.geneo-node-person[data-geneo-node="${nodeId}"]`);
                const content = card.querySelector('.geneo-person-node-content');
                const name = card.querySelector('.geneo-person-name').getBoundingClientRect();
                const date = card.querySelector('.geneo-person-life').getBoundingClientRect();
                const edit = card.querySelector('.geneo-person-edit-action').getBoundingClientRect();
                return { noPhoto: content.classList.contains('no-photo'),
                    noOverlap: name.bottom <= date.top && date.bottom < edit.top,
                    fullDate: card.querySelector('.geneo-portrait-date-full').textContent,
                    wrapped: card.classList.contains('geneo-portrait-date-tight') };
            }, nodeId);
            assert.ok(noPhoto.noPhoto && noPhoto.noOverlap && noPhoto.fullDate.includes('–'),
                JSON.stringify({ language, noPhoto }));

            await page.evaluate(() => {
                state.selectedGeneoNodeId = '';
                state.selectedGeneoNodeIds = [];
                renderGeneographEditorPreserveScroll();
            });
            await page.locator('[data-geneo-person-card-field="linkIndicator"][data-geneo-person-card-scope="board"]').check();
            const boardCard = page.locator('.geneo-node-person[data-geneo-node="gn-iris"]');
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), 'board');
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await boardCard.getAttribute('data-geneo-person-link-status'), 'board');

            const statuses = await page.evaluate(() => {
                const diagram = selectedGeneographDiagram();
                const linkedNode = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-daisy');
                const boardNode = diagram.nodes.find(item => item.type === 'person' && item.personId === 'gp-iris');
                diagram.personCardDefaults.fields.linkIndicator = true;
                sampleData.people.find(item => item.id === 'daisy').deleted = true;
                renderGeneographEditorPreserveScroll();
                return {
                    broken: document.querySelector(`.geneo-node-person[data-geneo-node="${linkedNode.id}"]`).dataset.geneoPersonLinkStatus,
                    board: document.querySelector(`.geneo-node-person[data-geneo-node="${boardNode.id}"]`).dataset.geneoPersonLinkStatus
                };
            });
            assert.deepEqual(statuses, { broken: 'attention', board: 'board' });
            await page.evaluate(() => { sampleData.people.find(item => item.id === 'daisy').deleted = false; });
            await page.evaluate(() => {
                state.geneoView = 'home';
                renderGeneograph();
                openGeneographBoard('gb1');
            });
            assert.equal(await page.locator('.geneo-node-person[data-geneo-node="gn-iris"]')
                .getAttribute('data-geneo-person-link-status'), 'board');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph portrait layout and link indicator passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
