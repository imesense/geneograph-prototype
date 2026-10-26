const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const width of [1280, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const basic = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                const board = selectedGeneographBoard();
                selectGeneographNode(board.diagram.nodes.find(node => node.personId === 'gp-iris').id);
                openGeneographTreePersonPicker();
                const draft = geneoTreeImportDraft;
                const refs = { people: sampleData.people, families: sampleData.families, events: sampleData.events, first: sampleData.people[0] };
                const before = JSON.stringify({ data: sampleData, board: board.diagram });
                const noDefault = !geneoTreeImportPreview(draft).patches.length;
                draft.choices.set('gp-iris', 'create');
                const plan = geneoTreeImportPreview(draft);
                const pure = before === JSON.stringify({ data: sampleData, board: board.diagram })
                    && refs.people === sampleData.people && refs.families === sampleData.families && refs.events === sampleData.events && refs.first === sampleData.people[0];
                draft.choices.set('gp-iris', 'barnaby');
                const duplicate = Boolean(geneoTreeImportPreview(draft).error);
                draft.choices.set('gp-iris', 'skip');
                draft.activePersonId = 'gp-silver';
                draft.mobileDetail = true;
                geneoTreeImportRender();
                const anchorStable = draft.anchorId === 'gp-iris';
                const relativeContext = document.querySelector('.gr-detail').innerText.includes('Sibling of Iris');
                const embedded = document.querySelector('.gr-detail').innerText.includes('Family Tree relationship');
                const allPeople = draft.people.length;
                const branchPeople = geneoTreeImportGroup(draft.diagram, draft.anchorId).length;
                const candidateCount = geneoTreeImportMatches(draft.people[0], draft.projectId).length;
                draft.scope = 'board'; draft.search = 'nothing'; draft.choices.set('gp-iris', 'create'); draft.summaryOpen = true;
                geneoTreeImportRender();
                const hiddenChangesVisible = document.querySelector('.gr-final').innerText.includes('Iris');
                const modal = document.querySelector('.geneo-family-review');
                return { pure, noDefault, duplicate, anchorStable, relativeContext, embedded, allPeople, branchPeople, candidateCount,
                    hiddenChangesVisible, width: modal.getBoundingClientRect().width, overflow: modal.scrollWidth - modal.clientWidth };
            });
            assert.equal(basic.pure, true);
            assert.equal(basic.noDefault, true);
            assert.equal(basic.duplicate, true);
            assert.equal(basic.anchorStable, true);
            assert.equal(basic.relativeContext, true);
            assert.equal(basic.embedded, true);
            assert.ok(basic.allPeople > basic.branchPeople);
            assert.ok(basic.candidateCount > 8);
            assert.equal(basic.hiddenChangesVisible, true);
            assert.ok(basic.width <= width && basic.overflow <= 1);
            await page.evaluate(() => { geneoTreeImportDraft.summaryOpen = false; geneoTreeImportDraft.search = ''; geneoTreeImportDraft.status = 'all'; geneoTreeImportRender(); });
            if (process.env.GENEO_REVIEW_SCREENSHOT_DIR)
                await page.screenshot({ path: path.join(process.env.GENEO_REVIEW_SCREENSHOT_DIR, `geneograph-family-review-${width}.png`) });
            const engine = await page.evaluate(() =>
            {
                closeModal();
                const board = selectedGeneographBoard();
                const base = structuredClone(board.diagram.nodes.find(node => node.type === 'person'));
                const make = (id, first, gender) => ({ id, names: { first, middle: '', last: 'Review', maiden: '' }, gender, livingStatus: 'Unknown',
                    birth: emptyGenealogyDate('Exact date'), death: emptyGenealogyDate('Exact date') });
                board.diagram = createEmptyGeneographDiagram();
                board.diagram.people = [make('a', 'Alpha', 'male'), make('b', 'Beta', 'female'), make('c', 'Child', 'unknown')];
                board.diagram.nodes = board.diagram.people.map((person, index) => ({ ...structuredClone(base), id: `node-${person.id}`, personId: person.id, x: index * 400 }));
                board.diagram.families = [{ id: 'review-family', partnerIds: ['a', 'b'], children: [{ personId: 'c', parentageType: 'adoptive' }],
                    relationshipType: 'Divorced', relationshipStatus: 'ended', marriageType: 'Civil', events: [], startDate: '2000', startDateType: 'Year only', startPlaceText: 'Recorded place' }];
                upsertPartnerRelationshipEvents(board.diagram.families[0], { relationshipType: 'Divorced', marriageType: 'Civil',
                    startDate: normalizeGenealogyDateInput({ date: '2000', dateType: 'Year only' }), startPlace: { text: 'Recorded place', selectedPlaceId: '' },
                    endDate: emptyGenealogyDate('Exact date'), endPlace: { text: '', selectedPlaceId: '' } });
                normalizeGeneographRuntimeData();
                selectGeneographNode('node-a');
                openGeneographTreeImport();
                let draft = geneoTreeImportDraft;
                draft.people.forEach(person => draft.choices.set(person.id, 'create'));
                draft.relations.forEach(relation => draft.relationChoices.set(relation.id, 'board'));
                const before = JSON.stringify(sampleData);
                const plan = geneoTreeImportPreview(draft);
                const pure = JSON.stringify(sampleData) === before;
                const idA = draft.newIds.get('a'), idB = draft.newIds.get('b'), idC = draft.newIds.get('c');
                const familyPatch = plan.patches.find(patch => patch.key === 'families');
                const metadata = familyPatch?.after.relationshipType === 'Divorced'
                    && familyPatch.after.events.some(event => event.placeText === 'Recorded place')
                    && familyPatch.after.parentChildTypes[`${idA}|${idC}`] === 'Adoptive';
                const countBefore = sampleData.people.length;
                const applied = geneoTreeImportCommit();
                const countAfter = sampleData.people.length;
                const linked = board.diagram.people.every(person => Boolean(person.treePersonId));
                const undoEntry = JSON.parse(geneoHistoryRuntime.undo.at(-1));
                const unsafePatches = undoEntry.patches.filter(patch => !geneoReviewEqual(geneoReviewCollection(patch.key, board).find(item => item.id === patch.id) || null, patch.after))
                    .map(patch => ({ key: patch.key, id: patch.id, expected: patch.after, actual: geneoReviewCollection(patch.key, board).find(item => item.id === patch.id) }));
                undoGeneographChange();
                const undone = sampleData.people.length === countBefore && board.diagram.people.every(person => !person.treePersonId);
                redoGeneographChange();
                const redone = sampleData.people.length === countAfter && board.diagram.people.every(person => person.treePersonId);
                const undoSize = geneoHistoryRuntime.undo.length;
                getPerson(idA).names.middle = 'External edit';
                undoGeneographChange();
                const refused = geneoHistoryRuntime.undo.length === undoSize && getPerson(idA).names.middle === 'External edit';
                selectGeneographNode('node-a');
                openGeneographTreeImport();
                draft = geneoTreeImportDraft;
                draft.fields.set('a', new Map([['names.middle', 'board']]));
                const clearing = geneoTreeImportPreview(draft);
                const clearAllowed = !clearing.error && clearing.operations.some(operation => operation.clear && operation.key === 'names.middle');
                const unrelated = getPeople('p1').find(person => ![idA, idB, idC].includes(person.id));
                unrelated.meta.reviewTest = true;
                const unrelatedAllowed = !geneoTreeImportPreview(draft).error;
                getPerson(idA).names.middle = 'Changed while reviewing';
                const staleBlocked = Boolean(geneoTreeImportPreview(draft).error);
                const decisionsKept = draft.fields.get('a').get('names.middle') === 'board';
                const partial = structuredClone(getPerson(idA));
                partial.birth = { ...normalizeGenealogyDateInput({ date: '1900', dateType: 'Year only' }), placeId: null, placeText: 'Original place', address: 'Original address' };
                geneoReviewSetFact(partial, 'birth.date', geneoReviewFact({ birth: normalizeGenealogyDateInput({ date: '1901', dateType: 'Year only' }) }, 'birth.date'));
                const datePreservesPlace = partial.birth.placeText === 'Original place' && partial.birth.address === 'Original address';
                const dateValue = geneoReviewFact(partial, 'birth.date');
                geneoReviewSetFact(partial, 'birth.place', { placeId: null, placeText: '', address: '' });
                const placePreservesDate = geneoReviewEqual(dateValue, geneoReviewFact(partial, 'birth.date'));
                draft.baseline = geneoReviewRecordSnapshot(board);
                const refreshed = geneoTreeImportPreview(draft);
                const invalidBefore = JSON.stringify(sampleData);
                draft.choices.set('b', idA);
                const failed = !geneoTreeImportCommit();
                const atomicFailure = failed && invalidBefore === JSON.stringify(sampleData);
                draft.choices.set('b', idB);
                draft.fields.clear();
                const idempotent = !geneoTreeImportPreview(draft).patches.length;
                return { error: plan.error, pure, metadata, applied, linked, countBefore, countAfter, undone, redone, refused,
                    clearAllowed, unrelatedAllowed, staleBlocked, decisionsKept, datePreservesPlace, placePreservesDate, refreshError: refreshed.error, atomicFailure, idempotent, unsafePatches };
            });
            assert.equal(engine.error, '');
            for (const key of ['pure', 'metadata', 'applied', 'linked', 'undone', 'redone', 'refused', 'clearAllowed', 'unrelatedAllowed', 'staleBlocked', 'decisionsKept', 'datePreservesPlace', 'placePreservesDate', 'atomicFailure', 'idempotent'])
                assert.equal(engine[key], true, `${width}: ${key}: ${JSON.stringify(engine)}`);
            assert.equal(engine.refreshError, '');
            assert.equal(engine.countAfter, engine.countBefore + 3);
            if (width === 1280)
            {
                const relatives = await page.evaluate(() =>
                {
                    closeModal();
                    const board = selectedGeneographBoard();
                    const child = board.diagram.people.find(person => person.id === 'c');
                    const treeChild = getPerson(child.treePersonId);
                    const parents = board.diagram.people.filter(person => ['a', 'b'].includes(person.id));
                    const treeFamily = sampleData.families.find(family => (family.childIds || []).includes(treeChild.id));
                    const originalFamily = JSON.stringify(treeFamily);
                    const fourth = { ...structuredClone(child), id: 'd', treePersonId: null, syncState: 'local',
                        names: { first: 'Another', middle: '', last: 'Review', maiden: '' } };
                    board.diagram.people.push(fourth);
                    board.diagram.nodes.push({ ...structuredClone(board.diagram.nodes[2]), id: 'node-d', personId: 'd', x: 1200 });
                    board.diagram.connections.push({ id: 'sibling-test', kind: 'family-sibling', source: { nodeId: 'node-c', socket: 'right' },
                        target: { nodeId: 'node-d', socket: 'left' }, route: { mode: 'auto', waypoints: [] }, style: {} });
                    normalizeGeneographRuntimeData();
                    selectGeneographNode('node-c'); openGeneographTreeImport();
                    const draft = geneoTreeImportDraft;
                    draft.choices.set('d', 'create');
                    draft.relationChoices.set('sibling-test', 'board');
                    draft.parentTypes.set('sibling-test', 'Adoptive');
                    const needsParents = Boolean(geneoTreeImportPreview(draft).error);
                    const parentA = parents[0].treePersonId;
                    draft.siblingFamilies.set('sibling-test', `${treeFamily.id}::${parentA}`);
                    const half = geneoTreeImportPreview(draft);
                    const halfFamily = half.patches.find(patch => patch.key === 'families' && !patch.before)?.after;
                    const halfValid = !half.error && halfFamily && geneoReviewEqual(geneoReviewFamilyParents(halfFamily), [parentA])
                        && halfFamily.childIds.includes(treeChild.id) && halfFamily.childIds.includes(draft.newIds.get('d'))
                        && halfFamily.parentChildTypes[`${parentA}|${treeChild.id}`] === 'Adoptive';
                    const preserve = JSON.stringify(treeFamily) === originalFamily;
                    draft.siblingFamilies.set('sibling-test', treeFamily.id);
                    const both = geneoTreeImportPreview(draft);
                    const bothFamily = both.patches.find(patch => patch.key === 'families' && patch.id === treeFamily.id)?.after;
                    const bothValid = !both.error && bothFamily?.childIds.includes(draft.newIds.get('d'))
                        && parents.every(person => bothFamily.parentChildTypes[`${person.treePersonId}|${treeChild.id}`] === 'Adoptive');
                    draft.relationChoices.clear();
                    draft.choices.set('d', 'skip');
                    const probe = draft.people.find(person => person.id === 'd');
                    probe.names = structuredClone(treeChild.names);
                    probe.birth = normalizeGenealogyDateInput({ date: '2005', dateType: 'Year only' });
                    treeChild.birth = structuredClone(probe.birth);
                    draft.diagram.families[0].children.push({ personId: 'd', parentageType: 'adoptive' });
                    const strong = geneoTreeImportMatches(probe, draft.projectId, draft).find(item => item.person.id === treeChild.id)?.strong;
                    probe.birth = emptyGenealogyDate('Exact date');
                    const nameOnly = geneoTreeImportMatches(probe, draft.projectId, draft).find(item => item.person.id === treeChild.id)?.strong;
                    draft.activePersonId = 'd'; draft.matchEditorOpenId = 'd'; geneoTreeImportRender();
                    const locate = Boolean(document.querySelector(`[data-gr-locate="c"]`));
                    const duplicate = geneoReviewDuplicate(draft, 'd', treeChild.id)?.id === 'c';
                    closeModal();
                    board.diagram.families = [];
                    board.diagram.connections = [];
                    selectGeneographNode('node-a'); openGeneographTreeImport();
                    const returnDraft = geneoTreeImportDraft;
                    const treeRelations = geneoTreeImportPreview(returnDraft).relations.filter(relation => relation.origin === 'tree');
                    treeRelations.forEach(relation => returnDraft.relationChoices.set(relation.id, 'tree'));
                    const returnPlan = geneoTreeImportPreview(returnDraft);
                    const boardOnlyPatches = returnPlan.patches.every(patch => patch.key.startsWith('board.'));
                    const addedToBoard = !returnPlan.error && geneoTreeImportCommit() && board.diagram.families.some(family => family.relationshipType === 'Divorced')
                        && board.diagram.connections.some(connection => connection.kind === 'family-child');
                    undoGeneographChange();
                    const boardUndo = board.diagram.families.length === 0 && board.diagram.connections.length === 0;
                    return { needsParents, halfValid: Boolean(halfValid), preserve, bothValid: Boolean(bothValid), strong, nameOnly, locate, duplicate,
                        boardOnlyPatches, addedToBoard: Boolean(addedToBoard), boardUndo, error: returnPlan.error };
                });
                for (const key of ['needsParents', 'halfValid', 'preserve', 'bothValid', 'strong', 'locate', 'duplicate', 'boardOnlyPatches', 'addedToBoard', 'boardUndo']) assert.equal(relatives[key], true, `${key}: ${JSON.stringify(relatives)}`);
                assert.equal(relatives.nameOnly, false);
            }
            const ru = await page.evaluate(() =>
            {
                closeModal(); state.language = 'ru'; applyLanguage(); selectGeneographNode('node-a'); openGeneographTreeImport();
                return { text: document.querySelector('.geneo-family-review').innerText, width: document.querySelector('.geneo-family-review').scrollWidth,
                    client: document.querySelector('.geneo-family-review').clientWidth };
            });
            assert.ok(ru.text.includes('Ветка семьи'));
            assert.ok(ru.width <= ru.client + 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph family-centered review: passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
