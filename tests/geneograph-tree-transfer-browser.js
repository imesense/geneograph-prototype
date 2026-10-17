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
            const page = await browser.newPage({ viewport: { width, height: 720 } });
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
                geneoBoardChooserDraft.boardId = 'gb1';
                geneoAddPeopleToBoard('gb1');
                const after = board.diagram.nodes.length;
                const undo = geneoHistoryRuntime.undo.length;
                openGeneographBoardChooser(['cleo']);
                geneoBoardChooserDraft.boardId = 'gb1';
                geneoAddPeopleToBoard('gb1');
                const repeat = board.diagram.nodes.length;

                selectGeneographNode(selectedGeneographDiagram().nodes.find(node => node.personId === 'gp-iris').id);
                const peopleBefore = sampleData.people.length;
                openGeneographTreeImport();
                const importWidth = document.querySelector('.geneo-tree-import-modal').getBoundingClientRect().width;
                const draft = geneoTreeImportDraft;
                const group = draft.people.map(person => person.id);
                draft.choices.set('gp-iris', 'barnaby');
                const conflict = geneoTreeImportPreview(draft);
                const unchanged = sampleData.people.length;
                draft.choices.set('gp-iris', 'create');
                const clean = geneoTreeImportPreview(draft);
                geneoTreeImportCommit();
                const imported = sampleData.people.length;
                const linked = board.diagram.people.find(person => person.id === 'gp-iris').treePersonId;
                openGeneographTreeImport();
                const repeatImport = geneoTreeImportPreview(geneoTreeImportDraft);
                return { before, after, repeat, undo, chooserWidth, importWidth, group,
                    conflict: conflict.error, clean: clean.error, peopleBefore, unchanged, imported,
                    linked, repeatError: repeatImport.error, pageOverflow: document.documentElement.scrollWidth - innerWidth };
            });
            assert.equal(result.after, result.before + 1);
            assert.equal(result.repeat, result.after);
            assert.equal(result.undo, 1);
            assert.ok(result.chooserWidth <= width);
            assert.ok(result.importWidth <= width);
            assert.ok(result.group.includes('gp-iris'));
            assert.ok(result.conflict);
            assert.equal(result.unchanged, result.peopleBefore);
            assert.equal(result.clean, undefined);
            assert.equal(result.imported, result.peopleBefore + 1);
            assert.ok(result.linked);
            assert.equal(result.repeatError, undefined);
            assert.equal(result.pageOverflow, 0);
            assert.deepEqual(errors, []);
            await page.reload();
            const merge = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                selectGeneographNode(selectedGeneographDiagram().nodes.find(node => node.personId === 'gp-iris').id);
                const before = { first: getPerson('cleo').names.first, last: getPerson('cleo').names.last,
                    count: sampleData.people.length };
                openGeneographTreeImport();
                geneoTreeImportDraft.choices.set('gp-iris', 'cleo');
                geneoTreeImportDraft.fields.set('gp-iris', new Set(['names.first']));
                geneoTreeImportDraft.relations.forEach(relation => geneoTreeImportDraft.skippedRelations.add(relation.id));
                const preview = geneoTreeImportPreview(geneoTreeImportDraft);
                geneoTreeImportCommit();
                return { before, error: preview.error, after: {
                    first: getPerson('cleo').names.first, last: getPerson('cleo').names.last,
                    count: sampleData.people.length }, link: selectedGeneographDiagram().people.find(person => person.id === 'gp-iris').treePersonId };
            });
            assert.equal(merge.error, undefined);
            assert.equal(merge.after.first, 'Iris');
            assert.equal(merge.after.last, merge.before.last);
            assert.equal(merge.after.count, merge.before.count);
            assert.equal(merge.link, 'cleo');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph Tree transfer checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
