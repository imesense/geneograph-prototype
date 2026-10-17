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
                document.querySelector('[data-geneo-toggle-create]').click();
                const nameInput = document.querySelector('#geneoNewBoardName');
                nameInput.value = 'Test board';
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                const createReady = !document.querySelector('[data-geneo-add-to-board]').disabled
                    && document.querySelector('[data-geneo-add-to-board]').textContent === 'Create and add';
                document.querySelector('input[name="geneoBoardChoice"]').click();
                const createCollapsed = document.querySelector('#geneoTransferCreate').hidden;
                geneoBoardChooserDraft.boardId = 'gb1';
                geneoAddPeopleToBoard('gb1');
                const after = board.diagram.nodes.length;
                const undo = geneoHistoryRuntime.undo.length;
                openGeneographBoardChooser(['cleo']);
                geneoBoardChooserDraft.boardId = 'gb1';
                document.querySelector('input[name="geneoBoardChoice"]').click();
                const openAction = document.querySelector('[data-geneo-add-to-board]').textContent;
                geneoAddPeopleToBoard('gb1');
                const repeat = board.diagram.nodes.length;

                selectGeneographNode(selectedGeneographDiagram().nodes.find(node => node.personId === 'gp-iris').id);
                const peopleBefore = sampleData.people.length;
                openGeneographTreeImport();
                const importWidth = document.querySelector('.geneo-tree-import-modal').getBoundingClientRect().width;
                const draft = geneoTreeImportDraft;
                const group = draft.people.map(person => person.id);
                const modal = document.querySelector('.geneo-tree-import-modal');
                const photoAvatar = Boolean(modal.querySelector('.geneo-review-rail .geneo-review-avatar.has-photo'));
                const noFamilyDestination = !modal.querySelector('[data-geneo-review-person="family"]');
                let inlineRelations = 0;
                for (const person of draft.people)
                {
                    modal.querySelector(`[data-geneo-review-person="${person.id}"]`).click();
                    inlineRelations += modal.querySelectorAll('[data-geneo-import-skip-relation]').length;
                }
                modal.querySelector('[data-geneo-review-person="gp-iris"]').click();
                const relationControl = modal.querySelector('[data-geneo-import-skip-relation]');
                const relationId = relationControl?.dataset.geneoImportSkipRelation;
                relationControl?.click();
                const inlineSkipWorks = Boolean(relationId && draft.skippedRelations.has(relationId));
                modal.querySelector(`[data-geneo-import-skip-relation="${relationId}"]`)?.click();
                modal.querySelector('[data-geneo-import-mode="skip"]')?.click();
                const autoSkippedRelation = Boolean(modal.querySelector('.geneo-import-relation small')?.textContent.includes('A connected person is skipped.'))
                    && !modal.querySelector('[data-geneo-import-skip-relation]');
                modal.querySelector('[data-geneo-import-mode="create"]')?.click();
                const createChoice = Boolean(modal.querySelector('[data-geneo-import-mode="create"]'));
                const searchHiddenForCreate = !modal.querySelector('[data-geneo-import-match-search]');
                modal.querySelector('[data-geneo-import-mode="match"]')?.click();
                const searchShownForMatch = Boolean(modal.querySelector('[data-geneo-import-match-search]'));
                const onlyMatchSelected = modal.querySelector('[data-geneo-import-mode="match"]')?.getAttribute('aria-pressed') === 'true'
                    && modal.querySelector('[data-geneo-import-mode="create"]')?.getAttribute('aria-pressed') === 'false';
                const pendingMatchBlocksApply = modal.querySelector('[data-geneo-import-commit]').disabled;
                const pendingMatchCopy = modal.querySelector('.geneo-review-empty-target')?.textContent === 'Choose a Tree person';
                modal.querySelector('[data-geneo-import-mode="create"]')?.click();
                const createRestored = modal.querySelector('[data-geneo-import-mode="create"]')?.getAttribute('aria-pressed') === 'true'
                    && !modal.querySelector('[data-geneo-import-commit]').disabled;
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
                return { before, after, repeat, undo, chooserWidth, createReady, createCollapsed, openAction, importWidth, group,
                    photoAvatar, noFamilyDestination, inlineRelations, inlineSkipWorks, autoSkippedRelation,
                    relationCount: draft.relations.length,
                    createChoice, searchHiddenForCreate, searchShownForMatch,
                    onlyMatchSelected, pendingMatchBlocksApply, pendingMatchCopy, createRestored,
                    conflict: conflict.error, clean: clean.error, peopleBefore, unchanged, imported,
                    linked, repeatError: repeatImport.error, pageOverflow: document.documentElement.scrollWidth - innerWidth };
            });
            assert.equal(result.after, result.before + 1);
            assert.equal(result.repeat, result.after);
            assert.equal(result.undo, 1);
            assert.ok(result.chooserWidth <= width);
            assert.equal(result.createReady, true);
            assert.equal(result.createCollapsed, true);
            assert.equal(result.openAction, 'Open board');
            assert.ok(result.importWidth <= width);
            assert.ok(result.group.includes('gp-iris'));
            assert.equal(result.photoAvatar, true);
            assert.equal(result.noFamilyDestination, true);
            assert.equal(result.inlineRelations, result.relationCount);
            assert.equal(result.inlineSkipWorks, true);
            assert.equal(result.autoSkippedRelation, true);
            assert.equal(result.createChoice, true);
            assert.equal(result.searchHiddenForCreate, true);
            assert.equal(result.searchShownForMatch, true);
            assert.equal(result.onlyMatchSelected, true);
            assert.equal(result.pendingMatchBlocksApply, true);
            assert.equal(result.pendingMatchCopy, true);
            assert.equal(result.createRestored, true);
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
                geneoTreeImportDraft.fields.set('gp-iris', new Map([['names.first', 'tree']]));
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
            const reverse = await page.evaluate(() =>
            {
                const board = getGeneographBoard('gb1');
                const person = board.diagram.people.find(item => item.id === 'gp-iris');
                const tree = getPerson('cleo');
                openGeneographTreeImport();
                geneoTreeImportDraft.choices.set('gp-iris', 'cleo');
                geneoTreeImportDraft.fields.set('gp-iris', new Map([['names.last', 'board']]));
                geneoTreeImportDraft.relations.forEach(relation => geneoTreeImportDraft.skippedRelations.add(relation.id));
                const error = geneoTreeImportPreview(geneoTreeImportDraft).error;
                geneoTreeImportCommit();
                return { error, boardLast: person.names.last, treeLast: tree.names.last };
            });
            assert.equal(reverse.error, undefined);
            assert.equal(reverse.boardLast, reverse.treeLast);
            const review = await page.evaluate(() =>
            {
                openGeneographTreeImport();
                const modal = document.querySelector('.geneo-tree-import-modal');
                const decision = modal.querySelector('[data-geneo-import-field][data-value="tree"]');
                if (!decision) return { missingDecision: true };
                decision.click();
                const selected = modal.querySelector('[data-geneo-import-field][data-value="tree"][aria-pressed="true"]') !== null;
                const staged = geneoTreeImportDraft.fields.get(geneoTreeImportDraft.activePersonId)?.size || 0;
                modal.querySelector('[data-geneo-import-field][data-value="none"]')?.click();
                const reset = (geneoTreeImportDraft.fields.get(geneoTreeImportDraft.activePersonId)?.size || 0) === 0;
                modal.querySelector('[data-geneo-import-match-toggle]')?.click();
                const matchOpen = Boolean(modal.querySelector('[data-geneo-import-match-search]'));
                const modalOverflow = modal.querySelector('[data-geneo-import-body]').scrollWidth - modal.querySelector('[data-geneo-import-body]').clientWidth;
                return { selected, staged, reset, matchOpen, modalOverflow };
            });
            assert.equal(review.missingDecision, undefined);
            assert.equal(review.selected, true);
            assert.equal(review.staged, 1);
            assert.equal(review.reset, true);
            assert.equal(review.matchOpen, true);
            assert.equal(review.modalOverflow, 0);
            const russian = await page.evaluate(() =>
            {
                setLanguage('ru');
                openGeneographTreeImport();
                const modal = document.querySelector('.geneo-tree-import-modal');
                const owner = geneoTreeImportDraft.relations.find(relation => relation.type === 'child');
                if (owner) modal.querySelector(`[data-geneo-review-person="${geneoTreeImportRelationOwner(owner)}"]`)?.click();
                return {
                    relation: modal.querySelector('.geneo-import-relation strong')?.textContent || '',
                    footer: modal.querySelector('[data-geneo-import-commit]')?.textContent || '',
                    overflow: modal.querySelector('[data-geneo-import-body]').scrollWidth - modal.querySelector('[data-geneo-import-body]').clientWidth
                };
            });
            assert.ok(russian.relation.includes('Ребёнок'));
            assert.ok(russian.footer.includes('Применить'));
            assert.equal(russian.overflow, 0);
            if (process.env.GENEO_REVIEW_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_REVIEW_SCREENSHOT_DIR, `review-${width}.png`) });
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph Tree transfer checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
