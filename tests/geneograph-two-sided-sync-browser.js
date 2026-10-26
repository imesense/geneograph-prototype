const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const width of [1440, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 950 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const result = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Geneograph' }); openGeneographBoard('gb1'); selectGeneographNode('gn-luna'); openGeneographTreeImport();
                const modal = document.querySelector('.geneo-family-review');
                const click = selector => modal.querySelector(selector).click();
                const select = (selector, value) => { const input = modal.querySelector(selector); input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
                const noBanner = !modal.querySelector('[data-gr-anchor]');
                const globalColumns = modal.querySelectorAll('.gr-comparison-head').length === 1 && Boolean(modal.querySelector('.gr-facts h3'));
                const dropdownShells = [...modal.querySelectorAll('select')].every(select => select.parentElement.classList.contains('common-select-shell'));
                const verticalActions = getComputedStyle(modal.querySelector('.gr-identity-actions')).flexDirection === 'column';
                const factsFirst = Boolean(modal.querySelector('.gr-facts').compareDocumentPosition(modal.querySelector('.gr-relationships')) & Node.DOCUMENT_POSITION_FOLLOWING);
                const actionsInTree = modal.querySelector('[data-gr-unlink]').closest('.gr-identities > div') === modal.querySelectorAll('.gr-identities > div')[1];
                const actionsMatch = modal.querySelector('[data-gr-unlink]').className === modal.querySelector('[data-gr-link]').className;
                const titleInRail = modal.querySelector('.gr-branch-title').textContent.includes('Luna');
                click('[data-gr-change-anchor]'); select('[data-gr-anchor-select]', 'gp-silver');
                const focusSwitch = geneoTreeImportDraft.anchorId === 'gp-silver' && geneoTreeImportDraft.activePersonId === 'gp-silver';
                click('[data-gr-person="gp-barnaby"]');
                const railDoesNotRefocus = geneoTreeImportDraft.anchorId === 'gp-silver';
                click('[data-gr-change-anchor]'); select('[data-gr-anchor-select]', 'gp-luna');
                const rowId = 'gf-luna:child:gp-theo';
                const row = () => modal.querySelector(`[data-gr-record-row="${rowId}"]`);
                const noInitialTransfer = row().querySelector('[data-gr-relation][data-source="board"]').disabled;
                const live = JSON.stringify(sampleData);
                const refs = [sampleData.people, sampleData.families, sampleData.events];
                click(`[data-gr-record-row="${rowId}"] [data-gr-relative-create]`);
                modal.querySelector(`[data-gr-transfer-type="${rowId}"]`).focus();
                select(`[data-gr-transfer-type="${rowId}"]`, 'Adoptive');
                const dropdownFocus = document.activeElement.dataset.grTransferType === rowId;
                const selectionOnly = geneoTreeImportPreview(geneoTreeImportDraft).patches.length === 0;
                click(`[data-gr-record-row="${rowId}"] [data-gr-relation][data-source="board"]`);
                const draft = geneoTreeImportDraft;
                const newId = draft.newIds.get('gp-theo');
                const plan = geneoTreeImportPreview(draft);
                const pure = JSON.stringify(sampleData) === live && refs[0] === sampleData.people && refs[1] === sampleData.families && refs[2] === sampleData.events;
                const adopted = plan.patches.some(patch => patch.key === 'families' && patch.after.parentChildTypes?.[`luna|${newId}`] === 'Adoptive');
                const noFactCopy = !plan.operations.some(operation => operation.type === 'fact');
                const sourceKept = selectedGeneographDiagram().families.find(family => family.id === 'gf-luna').children[0].parentageType === 'biological';
                click('[data-gr-next]');
                const apply = Boolean(getPerson(newId)) && !document.querySelector('.geneo-family-review');
                undoGeneographChange();
                const undo = !getPerson(newId) && !getGeneographPerson('gp-theo').treePersonId;
                selectGeneographNode('gn-luna'); openGeneographTreeImport();
                const d = geneoTreeImportDraft;
                const reverse = geneoTreeImportPreview(d).relations.find(relation => relation.origin === 'tree' && relation.type === 'child'
                    && relation.ids.at(-1) === 'gp-luna' && !d.people.some(person => person.id === relation.ids[0]));
                const parentTreeId = reverse.treeIds[0];
                const sourceFamily = sampleData.families.find(family => family.id === reverse.treeFamilyId);
                const treeBefore = JSON.stringify({ people: sampleData.people, families: sampleData.families, events: sampleData.events });
                const nodeBefore = JSON.stringify(selectedGeneographDiagram().nodes);
                d.transferTypes.set(reverse.id, 'Foster'); d.relationChoices.set(reverse.id, 'tree');
                const reversePlan = geneoTreeImportPreview(d);
                const newPerson = reversePlan.patches.find(patch => patch.key === 'board.people' && patch.after.treePersonId === parentTreeId)?.after;
                const newNode = reversePlan.patches.find(patch => patch.key === 'board.nodes' && patch.after.personId === newPerson?.id)?.after;
                const parentType = reversePlan.patches.some(patch => patch.key === 'board.families' && patch.after.children.some(child => child.personId === 'gp-luna' && child.parentageType === 'foster'));
                const reverseAtomic = !reversePlan.error && newPerson && newNode && reversePlan.patches.some(patch => patch.key === 'board.connections');
                const clearArea = newNode && selectedGeneographDiagram().nodes.filter(node => node.type !== 'panel').every(node =>
                    newNode.x >= node.x + node.width || newNode.x + newNode.width <= node.x || newNode.y >= node.y + node.height || newNode.y + newNode.height <= node.y);
                const reverseSourceKept = parentChildRelationshipType(sourceFamily, parentTreeId, 'luna') !== 'Foster';
                const committed = geneoTreeImportCommit();
                const undoEntry = JSON.parse(geneoHistoryRuntime.undo.at(-1));
                const mismatched = undoEntry.patches.filter(patch => !geneoReviewEqual(geneoReviewCollection(patch.key, selectedGeneographBoard()).find(item => item.id === patch.id) || null, patch.after)).map(patch => ({ key: patch.key, id: patch.id }));
                const noTreeMutation = treeBefore === JSON.stringify({ people: sampleData.people, families: sampleData.families, events: sampleData.events });
                const existingNotMoved = selectedGeneographDiagram().nodes.filter(node => node.id !== newNode?.id).every(node =>
                    JSON.parse(nodeBefore).some(old => old.id === node.id && old.x === node.x && old.y === node.y));
                undoGeneographChange();
                const reverseUndo = JSON.stringify(selectedGeneographDiagram().nodes) === nodeBefore;
                redoGeneographChange();
                const reverseRedo = selectedGeneographDiagram().nodes.some(node => node.id === newNode?.id);
                return { noBanner, globalColumns, dropdownShells, verticalActions, factsFirst, actionsInTree, actionsMatch, titleInRail, focusSwitch, railDoesNotRefocus, noInitialTransfer,
                    selectionOnly, dropdownFocus, pure, adopted, noFactCopy, sourceKept, apply, undo, reverseAtomic: Boolean(reverseAtomic), clearArea: Boolean(clearArea),
                    parentType, reverseSourceKept, committed, noTreeMutation, existingNotMoved, reverseUndo, reverseRedo, reverseError: reversePlan.error, mismatched };
            });
            for (const [key, value] of Object.entries(result))
                if (!['reverseError', 'mismatched'].includes(key)) assert.equal(value, true, `${width}: ${key}: ${JSON.stringify(result)}`);
            assert.equal(result.reverseError, '');
            if (width === 1440)
            {
                const extra = await page.evaluate(() =>
                {
                    closeModal(); selectGeneographNode('gn-luna'); openGeneographTreeImport();
                    const draft = geneoTreeImportDraft, modal = document.querySelector('.geneo-family-review');
                    const parentRelation = draft.relations.find(relation => relation.type === 'child' && relation.ids.at(-1) === 'gp-luna');
                    const existingParentRecognized = geneoReviewRelationType(draft, parentRelation, 'tree') === 'Biological';
                    draft.relationChoices.set(parentRelation.id, 'tree');
                    const parentCopy = geneoTreeImportPreview(draft);
                    const parentCopyKeepsOtherParent = !parentCopy.error && parentCopy.patches.every(patch => patch.key.startsWith('board.'))
                        && parentCopy.patches.some(patch => patch.key === 'board.families' && patch.after.partnerIds.length === 1 && patch.after.children.some(child => child.parentageType === 'biological'));
                    draft.relationChoices.clear();
                    const child = geneoTreeImportPreview(draft).relations.find(relation => relation.origin === 'tree' && relation.type === 'child'
                        && relation.treeIds?.at(-1) === 'oliver');
                    const selectedChild = child || geneoTreeImportPreview(draft).relations.find(relation => relation.origin === 'tree' && relation.type === 'child'
                        && relation.treeIds?.length === 3 && !draft.people.some(person => person.id === relation.ids.at(-1)));
                    const row = modal.querySelector(`[data-gr-record-row="${selectedChild.id}"]`);
                    const needsNamedParents = row.querySelector('[data-source="tree"]').disabled;
                    draft.treeParentChoices.set(selectedChild.id, 'luna'); draft.transferTypes.set(selectedChild.id, 'Guardian');
                    draft.relationChoices.set(selectedChild.id, 'tree');
                    const plan = geneoTreeImportPreview(draft);
                    const knownOnly = !plan.error && plan.patches.some(patch => patch.key === 'board.families' && patch.after.partnerIds.length === 1
                        && patch.after.partnerIds[0] === 'gp-luna' && patch.after.children.some(child => child.parentageType === 'guardian'));
                    draft.relationChoices.delete(selectedChild.id);
                    const undoRow = geneoTreeImportPreview(draft).patches.length === 0;
                    draft.treeParentChoices.set(selectedChild.id, 'all'); draft.relationChoices.set(selectedChild.id, 'tree');
                    const both = geneoTreeImportPreview(draft);
                    const explicitBoth = !both.error && both.patches.some(patch => patch.key === 'board.connections' && patch.after.kind === 'family-partner');
                    closeModal();
                    const family = selectedGeneographDiagram().families.find(item => item.id === 'gf-whiskerfield');
                    family.relationshipType = 'Separated'; family.relationshipStatus = 'separated';
                    selectGeneographNode('gn-barnaby'); openGeneographTreeImport();
                    const d = geneoTreeImportDraft, relation = d.relations.find(item => item.type === 'partner');
                    d.transferTypes.set(relation.id, 'Divorced'); geneoTreeImportRender();
                    const noTypeOnlyWrite = geneoTreeImportPreview(d).patches.length === 0;
                    const click = direction => modalBackdrop.querySelector(`[data-gr-record-row="${relation.id}"] [data-source="${direction}"]`).click();
                    click('board');
                    const forward = geneoTreeImportPreview(d);
                    const partnerOverride = !forward.error && forward.patches.some(patch => patch.key === 'families' && patch.after.relationshipType === 'Divorced')
                        && selectedGeneographDiagram().families.find(item => item.id === family.id).relationshipType === 'Separated';
                    click('tree');
                    const resetOnDirection = d.transferTypes.get(relation.id) === geneoReviewRelationType(d, relation, 'tree');
                    const backward = geneoTreeImportPreview(d);
                    const oppositeOnly = !backward.error && backward.patches.every(patch => patch.key.startsWith('board.'));
                    closeModal();
                    const parentFamily = sampleData.families.find(item => (item.childIds || []).includes('luna') && geneoReviewFamilyParents(item).length === 2);
                    const savedFamily = structuredClone(parentFamily);
                    const siblingPerson = structuredClone(getPerson('luna'));
                    siblingPerson.id = 'sync-sibling-fixture'; siblingPerson.names = { first: 'Sibling', middle: '', last: 'Fixture', maiden: '', display: 'Sibling Fixture', initials: 'SF' };
                    siblingPerson.primaryPhotoId = null; sampleData.people.push(siblingPerson);
                    parentFamily.childIds.push(siblingPerson.id); parentFamily.childrenIds = [...parentFamily.childIds]; parentFamily.parentChildTypes = parentFamily.parentChildTypes || {};
                    geneoReviewFamilyParents(parentFamily).forEach(id => { parentFamily.parentChildTypes[`${id}|${siblingPerson.id}`] = 'Adoptive'; });
                    selectGeneographNode('gn-luna'); openGeneographTreeImport();
                    const siblingDraft = geneoTreeImportDraft;
                    const siblingRelation = geneoTreeImportPreview(siblingDraft).relations.find(item => item.origin === 'tree' && item.type === 'sibling' && item.treeIds.includes(siblingPerson.id));
                    siblingDraft.relationChoices.set(siblingRelation.id, 'tree');
                    const siblingPlan = geneoTreeImportPreview(siblingDraft);
                    const siblingWithoutParents = !siblingPlan.error && siblingPlan.patches.some(patch => patch.key === 'board.connections' && patch.after.kind === 'family-sibling')
                        && siblingPlan.patches.some(patch => patch.key === 'board.families' && patch.after.partnerIds.length === 0);
                    const siblingApplied = geneoTreeImportCommit(); undoGeneographChange();
                    const siblingUndo = !selectedGeneographDiagram().people.some(person => person.treePersonId === siblingPerson.id);
                    sampleData.people.splice(sampleData.people.findIndex(person => person.id === siblingPerson.id), 1);
                    Object.assign(parentFamily, savedFamily);
                    return { existingParentRecognized, parentCopyKeepsOtherParent, needsNamedParents, knownOnly, undoRow, explicitBoth, noTypeOnlyWrite, partnerOverride, resetOnDirection, oppositeOnly,
                        siblingWithoutParents, siblingApplied, siblingUndo, error: plan.error, bothError: both.error };
                });
                for (const [key, value] of Object.entries(extra)) if (!key.endsWith('Error') && key !== 'error') assert.equal(value, true, `${key}: ${JSON.stringify(extra)}`);
            }
            await page.evaluate(() => { selectGeneographNode('gn-luna'); openGeneographTreeImport(); geneoTreeImportDraft.mobileDetail = innerWidth < 760; geneoTreeImportRender(); });
            if (process.env.GENEO_REVIEW_SCREENSHOT_DIR)
            {
                await page.evaluate(() => { document.querySelector('#toast').style.display = 'none'; document.querySelector('.gr-relationships').scrollIntoView({ block: 'start' }); });
                await page.screenshot({ path: path.join(process.env.GENEO_REVIEW_SCREENSHOT_DIR, `two-sided-relatives-${width}.png`) });
            }
            const ru = await page.evaluate(() =>
            {
                closeModal(); setLanguage('ru', false); selectGeneographNode('gn-luna'); openGeneographTreeImport();
                geneoTreeImportDraft.mobileDetail = true; geneoTreeImportRender(); const modal = document.querySelector('.geneo-family-review');
                return { text: modal.innerText, overflow: modal.scrollWidth - modal.clientWidth };
            });
            assert.ok(/Родственные связи|Семейные связи/.test(ru.text), ru.text);
            assert.ok(ru.overflow <= 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Two-sided Geneograph sync passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
