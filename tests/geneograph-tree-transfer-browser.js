const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const width of [320, 390, 1280])
        {
            const page = await browser.newPage({ viewport: { width, height: 780 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const result = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'People' });
                const board = getGeneographBoard('gb1');
                const before = board.diagram.nodes.length;
                openGeneographBoardChooser(['cleo']);
                const chooserWidth = document.querySelector('.geneo-transfer-modal').getBoundingClientRect().width;
                document.querySelector('[data-geneo-toggle-create]').click();
                const name = document.querySelector('#geneoNewBoardName');
                name.value = 'Test board'; name.dispatchEvent(new Event('input', { bubbles: true }));
                const createReady = !document.querySelector('[data-geneo-add-to-board]').disabled;
                document.querySelector('input[name="geneoBoardChoice"]').click();
                const createCollapsed = document.querySelector('#geneoTransferCreate').hidden;
                geneoBoardChooserDraft.boardId = 'gb1'; geneoAddPeopleToBoard('gb1');
                const after = board.diagram.nodes.length;
                openGeneographBoardChooser(['cleo']);
                geneoBoardChooserDraft.boardId = 'gb1';
                document.querySelector('input[name="geneoBoardChoice"]').click();
                const openAction = document.querySelector('[data-geneo-add-to-board]').textContent;
                geneoAddPeopleToBoard('gb1');
                const repeat = board.diagram.nodes.length;
                selectGeneographNode(board.diagram.nodes.find(node => node.personId === 'gp-iris').id);
                render();
                const singleEntry = !document.querySelector('[data-geneo-import-family]') && Boolean(document.querySelector('[data-geneo-link-person]'));
                normalizeCentralNoteRelationships();
                const beforeReview = JSON.stringify(sampleData);
                document.querySelector('[data-geneo-link-person]').click();
                const unified = Boolean(document.querySelector('.geneo-family-review')) && !document.querySelector('.geneo-tree-person-picker-modal');
                const anchored = geneoTreeImportDraft.anchorId === 'gp-iris';
                const pending = geneoTreeImportDraft.choices.get('gp-iris') === 'skip';
                const overview = !document.querySelector('[data-gr-match-search]') && Boolean(document.querySelector('.gr-identity-comparison .gr-empty-transfer'));
                closeModal();
                const cancelUnchanged = JSON.stringify(sampleData) === beforeReview;
                setLanguage('ru', false); openGeneographTreeImport();
                const russian = document.querySelector('.geneo-family-review').innerText.includes('Ветка семьи');
                return { singleEntry, overview, before, after, repeat, chooserWidth, createReady, createCollapsed, openAction, unified, anchored, pending, cancelUnchanged, russian };
            });
            assert.equal(result.after, result.before + 1);
            assert.equal(result.repeat, result.after);
            assert.ok(result.chooserWidth <= width);
            assert.equal(result.openAction, 'Open board');
            for (const key of ['singleEntry', 'overview', 'createReady', 'createCollapsed', 'unified', 'anchored', 'pending', 'cancelUnchanged', 'russian']) assert.equal(result[key], true, key);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph board chooser and unified review entry points: passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
