let geneoBoardChooserDraft = null;

function geneoBoardHasTreePerson(board, personId)
{
    return (board.diagram?.people || []).some(person => person.treePersonId === personId);
}

function openGeneographBoardChooser(personIds)
{
    const projectId = currentProjectId();
    const ids = [...new Set(personIds || [])].filter(id =>
    {
        const person = getPerson(id);
        return person && !person.deleted && person.projectId === projectId;
    });
    if (!projectId || !ids.length) return;

    geneoBoardChooserDraft = { projectId, personIds: ids, boardId: '', query: '', includeArchived: false };
    const description = state.language === 'ru'
        ? ids.length === 1 ? `Добавить ${connectPersonName(getPerson(ids[0]))} на холст Генеографа.` : `Добавить выбранных людей (${ids.length}) на холст Генеографа.`
        : `Add ${ids.length === 1 ? connectPersonName(getPerson(ids[0])) : `${ids.length} selected people`} to a Geneograph board.`;
    openModal(`<div class="modal geneo-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="geneoBoardChooserTitle">
        <div class="modal-header"><div><h2 id="geneoBoardChooserTitle">Choose a board</h2><p>${escapeHtml(description)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="geneo-transfer-body"><label class="field" for="geneoBoardSearch">Search boards</label><div class="search-input">${icon.search}<input id="geneoBoardSearch" type="search" autocomplete="off" placeholder="Search boards" data-geneo-board-search></div>
          <label class="geneo-transfer-check"><input type="checkbox" data-geneo-include-archived> Include archived boards</label><div class="geneo-transfer-list" data-geneo-board-list></div>
          <div class="geneo-transfer-create"><label for="geneoNewBoardName">New board</label><div><input id="geneoNewBoardName" type="text" maxlength="120" placeholder="Board name"><button class="button secondary" type="button" data-geneo-create-board>Create and add</button></div></div></div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-geneo-add-to-board disabled>Add to board</button></div>
      </div>`);

    const modal = modalBackdrop.querySelector('.geneo-transfer-modal');
    const search = modal.querySelector('[data-geneo-board-search]');
    const list = modal.querySelector('[data-geneo-board-list]');
    const add = modal.querySelector('[data-geneo-add-to-board]');
    const renderList = () =>
    {
        const draft = geneoBoardChooserDraft;
        if (!draft) return;
        const boards = getProjectBoards(draft.projectId, { includeArchived: draft.includeArchived })
            .filter(board => board.title.toLowerCase().includes(draft.query.toLowerCase()));
        list.innerHTML = boards.length ? boards.map(board =>
        {
            const present = draft.personIds.filter(id => geneoBoardHasTreePerson(board, id)).length;
            const count = state.language === 'ru' ? `${present} из ${draft.personIds.length} уже на холсте` : `${present} of ${draft.personIds.length} already on board`;
            return `<label class="geneo-transfer-choice"><input type="radio" name="geneoBoardChoice" value="${escapeHtml(board.id)}" ${draft.boardId === board.id ? 'checked' : ''}><span class="geneo-transfer-preview" aria-hidden="true">${renderGeneographBoardPreview(board, 'square')}</span><span class="geneo-transfer-copy"><strong>${escapeHtml(board.title)}</strong><small>${board.archived ? 'Archived · ' : ''}${count}</small></span></label>`;
        }).join('') : '<p class="panel-muted">No boards found. Create one below.</p>';
        localizeUI(list);
        add.disabled = !boards.some(board => board.id === draft.boardId);
    };
    search.addEventListener('input', () => { geneoBoardChooserDraft.query = search.value.trim(); renderList(); });
    modal.querySelector('[data-geneo-include-archived]').addEventListener('change', event => { geneoBoardChooserDraft.includeArchived = event.target.checked; renderList(); });
    list.addEventListener('change', event => { if (event.target.name === 'geneoBoardChoice') { geneoBoardChooserDraft.boardId = event.target.value; renderList(); } });
    add.addEventListener('click', () => geneoAddPeopleToBoard(geneoBoardChooserDraft.boardId));
    modal.querySelector('[data-geneo-create-board]').addEventListener('click', () =>
    {
        const title = modal.querySelector('#geneoNewBoardName').value.trim();
        if (!title) { modal.querySelector('#geneoNewBoardName').focus(); return; }
        if (currentProjectId() !== projectId || geneoBoardChooserDraft.personIds.some(id =>
        {
            const person = getPerson(id);
            return !person || person.deleted || person.projectId !== projectId;
        })) { showToast('The selected people are no longer available.'); return; }
        const now = new Date().toISOString();
        const board = { id: createRuntimeId('board'), projectId, title, description: '', collectionIds: [], modified: 'Just now', modifiedAt: now, createdAt: now, favorite: false, archived: false, diagram: createEmptyGeneographDiagram() };
        sampleData.boards.unshift(board);
        geneoAddPeopleToBoard(board.id);
    });
    renderList();
    search.focus();
}

function geneoAddPeopleToBoard(boardId)
{
    const draft = geneoBoardChooserDraft;
    const board = draft && getGeneographBoard(boardId, { projectId: draft.projectId });
    if (!board || currentProjectId() !== draft.projectId) return;
    const people = draft.personIds.map(id => getPerson(id));
    if (people.some(person => !person || person.deleted || person.projectId !== board.projectId)) return;

    closeModal();
    navigateToProjectModule(board.projectId, 'Geneograph');
    openGeneographBoard(board.id);
    const diagram = selectedGeneographDiagram();
    const existing = people.map(person => geneoBoardRepresentationForTreePerson(person.id));
    const needsChange = existing.some(entry => !entry.person || !entry.node);
    if (needsChange) geneoPushHistory();
    const nodes = people.map(person =>
    {
        let { person: boardPerson, node } = geneoBoardRepresentationForTreePerson(person.id);
        if (!boardPerson)
        {
            boardPerson = createGeneographLinkedBoardPerson(person, board.projectId);
            diagram.people.push(boardPerson);
        }
        if (!node)
        {
            node = createGeneographPersonNodeForBoardPerson(boardPerson);
        }
        return node;
    }).filter(Boolean);
    if (needsChange) touchGeneographBoard(board);
    if (nodes.length)
    {
        setGeneographNodeSelection(nodes.map(node => node.id), nodes[0].id);
        renderGeneographEditorPreserveCenter(geneoNodeCenter(nodes[0]));
    }
    geneoBoardChooserDraft = null;
    showToast(needsChange ? `${people.length} ${people.length === 1 ? 'person' : 'people'} added to board.` : 'Already on this board.');
}
