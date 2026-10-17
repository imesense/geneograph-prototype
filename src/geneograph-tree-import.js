let geneoTreeImportDraft = null;

function geneoTreeImportGroup(diagram, startId)
{
    const adjacent = new Map(diagram.people.map(person => [person.id, new Set()]));
    const join = ids => ids.forEach(id => ids.forEach(other =>
    {
        if (id !== other && adjacent.has(id) && adjacent.has(other)) adjacent.get(id).add(other);
    }));
    diagram.families.forEach(family => join([...family.partnerIds, ...family.children.map(child => child.personId)]));
    diagram.connections.filter(connection => connection.kind === 'family-sibling').forEach(connection =>
    {
        const ids = [connection.source?.nodeId, connection.target?.nodeId]
            .map(nodeId => diagram.nodes.find(node => node.id === nodeId)?.personId).filter(Boolean);
        join(ids);
    });
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length)
    {
        for (const id of adjacent.get(queue.shift()) || [])
        {
            if (!visited.has(id)) { visited.add(id); queue.push(id); }
        }
    }
    return diagram.people.filter(person => visited.has(person.id));
}

function geneoTreeImportRelations(diagram, ids)
{
    const relations = [];
    diagram.families.forEach(family =>
    {
        const parents = family.partnerIds.filter(id => ids.has(id));
        if (parents.length === 2) relations.push({ id: `${family.id}:partner`, type: 'partner', ids: parents, familyId: family.id });
        family.children.forEach(child =>
        {
            if (ids.has(child.personId) && parents.length)
                relations.push({ id: `${family.id}:child:${child.personId}`, type: 'child', ids: [...parents, child.personId], familyId: family.id });
        });
    });
    diagram.connections.filter(connection => connection.kind === 'family-sibling').forEach(connection =>
    {
        const idsForConnection = [connection.source?.nodeId, connection.target?.nodeId]
            .map(nodeId => diagram.nodes.find(node => node.id === nodeId)?.personId).filter(id => ids.has(id));
        if (idsForConnection.length === 2)
            relations.push({ id: connection.id, type: 'sibling', ids: idsForConnection });
    });
    return relations;
}

function geneoTreeImportMatches(boardPerson, projectId)
{
    const name = geneoPersonDisplayName(boardPerson).toLocaleLowerCase();
    const last = normalizeGeneographPersonNames(boardPerson).last.toLocaleLowerCase();
    const birth = formatGenealogyDateLabel(boardPerson.birth);
    return getPeople(projectId).filter(person => !person.deleted).map(person =>
    {
        const candidate = connectPersonName(person).toLocaleLowerCase();
        const candidateBirth = formatGenealogyDateLabel(person.birth);
        const score = (candidate === name ? 100 : 0)
            + (last && candidate.includes(last) ? 15 : 0)
            + (birth && candidateBirth === birth ? 35 : 0);
        return { person, score };
    }).sort((a, b) => b.score - a.score || connectPersonName(a.person).localeCompare(connectPersonName(b.person)));
}

function geneoTreeImportFields(boardPerson, treePerson)
{
    const boardNames = normalizeGeneographPersonNames(boardPerson);
    const fields = [
        ['names.first', 'First name', boardNames.first, treePerson.names?.first || ''],
        ['names.middle', 'Middle name', boardNames.middle, treePerson.names?.middle || ''],
        ['names.last', 'Last name', boardNames.last, treePerson.names?.last || ''],
        ['names.maiden', 'Maiden name', boardNames.maiden, treePerson.names?.maiden || ''],
        ['gender', 'Gender', boardPerson.gender, treePerson.gender],
        ['livingStatus', 'Living status', boardPerson.livingStatus, treePerson.livingStatus],
        ['birth.date', 'Birth date', formatGenealogyDateLabel(boardPerson.birth), formatGenealogyDateLabel(treePerson.birth)],
        ['birth.place', 'Birth place', geneoPersonPlaceLabel(boardPerson.birth), getPlaceEventDisplay(treePerson.birth)],
        ['death.date', 'Death date', formatGenealogyDateLabel(boardPerson.death), formatGenealogyDateLabel(treePerson.death)],
        ['death.place', 'Death place', geneoPersonPlaceLabel(boardPerson.death), getPlaceEventDisplay(treePerson.death)]
    ];
    return fields.filter(([, , board, tree]) => String(board || '') !== String(tree || '') && String(board || '').trim());
}

function geneoTreeImportNewPerson(boardPerson, id, projectId)
{
    const names = normalizeGeneographPersonNames(boardPerson);
    const now = new Date().toISOString();
    return {
        id, projectId, createdAt: now, updatedAt: now,
        names: { ...names, display: geneoPersonDisplayName(boardPerson), initials: geneoPersonInitials(boardPerson) },
        gender: boardPerson.gender || 'unknown', livingStatus: boardPerson.livingStatus || 'Unknown',
        avatarClass: '', birth: structuredClone(boardPerson.birth || emptyGenealogyDate('Exact date')),
        death: structuredClone(boardPerson.death || emptyGenealogyDate('Exact date')),
        profile: { alternativeNames: null }, attributes: [], events: [], notes: [], citations: [],
        counts: { files: 0, notes: 0 }, meta: { updated: 'Just now', sourceStatus: 'Unsourced', reviewStatus: 'New record' }
    };
}

function geneoTreeImportApplyFields(boardPerson, treePerson, selected)
{
    if (!selected?.size) return;
    const names = normalizeGeneographPersonNames(boardPerson);
    for (const key of ['first', 'middle', 'last', 'maiden'])
        if (selected.has(`names.${key}`)) treePerson.names[key] = names[key];
    if (['first', 'middle', 'last'].some(key => selected.has(`names.${key}`)))
    {
        treePerson.names.display = [treePerson.names.first, treePerson.names.middle, treePerson.names.last].filter(Boolean).join(' ');
        treePerson.names.initials = `${treePerson.names.first?.[0] || ''}${treePerson.names.last?.[0] || ''}`.toUpperCase();
    }
    for (const key of ['gender', 'livingStatus']) if (selected.has(key)) treePerson[key] = boardPerson[key];
    for (const key of ['birth', 'death'])
    {
        if (selected.has(`${key}.date`))
        {
            const placeId = treePerson[key]?.placeId || null;
            const placeText = treePerson[key]?.placeText || '';
            treePerson[key] = { ...structuredClone(boardPerson[key]), placeId, placeText };
        }
        if (selected.has(`${key}.place`))
        {
            treePerson[key] = treePerson[key] || emptyGenealogyDate('Exact date');
            treePerson[key].placeId = boardPerson[key]?.placeId || null;
            treePerson[key].placeText = boardPerson[key]?.placeText || '';
        }
    }
    treePerson.updatedAt = new Date().toISOString();
}

function geneoTreeImportSnapshot()
{
    return Object.fromEntries(['people', 'families', 'events', 'archiveFiles', 'sourceLinks'].map(key => [key, structuredClone(sampleData[key])]));
}

function geneoTreeImportRestore(snapshot)
{
    for (const [key, value] of Object.entries(snapshot)) sampleData[key] = value;
}

function geneoTreeImportApply(draft)
{
    const board = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
    if (!board || currentProjectId() !== draft.projectId || JSON.stringify(board.diagram) !== draft.diagramSnapshot)
        return { error: 'The board changed. Reopen the import review.' };
    const mapping = new Map();
    for (const boardPerson of draft.people)
    {
        const choice = draft.choices.get(boardPerson.id);
        if (choice === 'skip') continue;
        const treeId = choice === 'create' ? draft.newIds.get(boardPerson.id) : choice;
        const existing = getPerson(treeId);
        if (choice !== 'create' && (!existing || existing.deleted || existing.projectId !== draft.projectId))
            return { error: `Tree match unavailable for ${geneoPersonDisplayName(boardPerson)}.` };
        if ([...mapping.values()].includes(treeId)) return { error: 'Two board people cannot use the same Tree person.' };
        if (board.diagram.people.some(other => other.id !== boardPerson.id && other.treePersonId === treeId && !draft.people.some(person => person.id === other.id)))
            return { error: 'That Tree person is already represented elsewhere on this board.' };
        if (choice === 'create') sampleData.people.push(geneoTreeImportNewPerson(boardPerson, treeId, draft.projectId));
        else geneoTreeImportApplyFields(boardPerson, existing, draft.fields.get(boardPerson.id));
        mapping.set(boardPerson.id, treeId);
    }
    const statuses = new Map();
    const families = new Map();
    for (const relation of draft.relations)
    {
        if (draft.skippedRelations.has(relation.id) || relation.ids.some(id => !mapping.has(id)))
        { statuses.set(relation.id, 'Skipped'); continue; }
        const ids = relation.ids.map(id => mapping.get(id));
        let result = { ok: true };
        let already = false;
        if (relation.type === 'partner')
        {
            const existing = getPartnerRelationshipBetween(ids[0], ids[1]);
            if (existing) { already = true; families.set(relation.familyId, existing); }
            else { result = connectPartners(ids[0], ids[1]); if (result.ok) families.set(relation.familyId, result.family); }
        }
        else if (relation.type === 'child')
        {
            const childId = ids.at(-1);
            const parentIds = ids.slice(0, -1);
            const treeFamily = families.get(relation.familyId)
                || (parentIds.length === 2 ? getPartnerRelationshipBetween(parentIds[0], parentIds[1]) : null);
            if (parentIds.length === 2 && !treeFamily)
                result = { ok: false, message: 'Import or retain the partner link before adding this child.' };
            else if (treeFamily)
            {
                already = unlinkFamilyChildrenIds(treeFamily).includes(childId);
                if (!already)
                {
                    for (const parentId of parentIds)
                    {
                        result = validateParentChildConnection(parentId, childId);
                        if (!result.ok) break;
                    }
                    if (result.ok) result = addChildToFamily(treeFamily, parentIds[0], childId);
                }
            }
            else
            {
                already = centralFamilyRecords().some(family => unlinkFamilyChildrenIds(family).includes(childId) && parentIds.some(id => familyIncludesPerson(family, id)));
                if (!already) result = connectParentToChild(parentIds[0], childId);
            }
        }
        else if (relation.type === 'sibling')
        {
            const common = centralFamilyRecords().find(family => ids.every(id => unlinkFamilyChildrenIds(family).includes(id)));
            if (common) already = true;
            else
            {
                const family = centralFamilyRecords().find(item => unlinkFamilyChildrenIds(item).includes(ids[0]));
                if (!family) result = { ok: false, message: 'Choose a parent family for this sibling link in Family Tree first.' };
                else result = connectSiblingsThroughFamily(ids[0], ids[1], family.id);
            }
        }
        if (!result.ok) return { error: result.message || result.title || 'Relationship conflict.', relationId: relation.id, statuses };
        statuses.set(relation.id, already ? 'Already in Tree' : 'Will add');
    }
    syncFamilyReciprocalLinks();
    rebuildSampleEventsAndPruneSourceLinks();
    return { mapping, statuses };
}

function geneoTreeImportPreview(draft)
{
    const snapshot = geneoTreeImportSnapshot();
    try { return geneoTreeImportApply(draft); }
    catch (error) { console.error(error); return { error: 'Import could not be validated.' }; }
    finally { geneoTreeImportRestore(snapshot); }
}

function geneoTreeImportRelationLabel(relation, people)
{
    const names = relation.ids.map(id => geneoPersonDisplayName(people.find(person => person.id === id)));
    if (relation.type === 'partner') return `${names[0]} + ${names[1]}`;
    if (relation.type === 'child') return `${names.slice(0, -1).join(' + ')} → ${names.at(-1)}`;
    return `${names[0]} and ${names[1]} (siblings)`;
}

function geneoTreeImportRender()
{
    const draft = geneoTreeImportDraft;
    const modal = modalBackdrop.querySelector('.geneo-tree-import-modal');
    if (!draft || !modal) return;
    const body = modal.querySelector('[data-geneo-import-body]');
    const oldScroll = body.scrollTop;
    const preview = geneoTreeImportPreview(draft);
    const treePeople = getPeople(draft.projectId).filter(person => !person.deleted);
    body.innerHTML = `<section><h3>People to review <span>${draft.people.length}</span></h3><p class="panel-muted">Match board people to Tree records, create new people, or skip them. Suggested matches are never chosen automatically.</p>
        <div class="geneo-import-people">${draft.people.map(boardPerson =>
        {
            const choice = draft.choices.get(boardPerson.id);
            const query = draft.matchQueries.get(boardPerson.id) || '';
            const matches = geneoTreeImportMatches(boardPerson, draft.projectId)
                .filter(item => !query || `${connectPersonName(item.person)} ${connectPersonLifeLine(item.person)} ${getPlaceEventDisplay(item.person.birth)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
                .slice(0, query ? 20 : 8);
            const treePerson = choice !== 'skip' && choice !== 'create' ? getPerson(choice) : null;
            if (treePerson && !matches.some(item => item.person.id === treePerson.id))
                matches.unshift({ person: treePerson, score: 0 });
            const fields = treePerson ? geneoTreeImportFields(boardPerson, treePerson) : [];
            const selected = draft.fields.get(boardPerson.id) || new Set();
            return `<article class="geneo-import-person"><div class="geneo-import-person-heading"><strong>${escapeHtml(geneoPersonDisplayName(boardPerson))}</strong><small>${escapeHtml(geneoPersonLifeDates(boardPerson))}</small></div>
                <label>Find existing person<input type="search" data-geneo-import-match-search="${escapeHtml(boardPerson.id)}" value="${escapeHtml(query)}" placeholder="Search by name, date, or place" autocomplete="off"></label>
                <label>Tree action<select data-geneo-import-person="${escapeHtml(boardPerson.id)}">
                    <option value="create" ${choice === 'create' ? 'selected' : ''}>Create new person</option>
                    <option value="skip" ${choice === 'skip' ? 'selected' : ''}>Skip person</option>
                    ${matches.map(({ person, score }) => `<option value="${escapeHtml(person.id)}" ${choice === person.id ? 'selected' : ''}>${score >= 50 ? 'Possible match: ' : ''}${escapeHtml(connectPersonName(person))} · ${escapeHtml(connectPersonLifeLine(person))}</option>`).join('')}
                </select></label>
                ${treePerson && fields.length ? `<div class="geneo-import-facts"><strong>Fact differences</strong>${fields.map(([key, label, board, tree]) => `<label><span>${escapeHtml(label)}<small>Tree: ${escapeHtml(String(tree || 'Not recorded'))}<br>Board: ${escapeHtml(String(board))}</small></span><select data-geneo-import-field="${escapeHtml(boardPerson.id)}" data-field="${escapeHtml(key)}"><option value="tree">Keep Tree value</option><option value="board" ${selected.has(key) ? 'selected' : ''}>Use board value</option></select></label>`).join('')}</div>` : ''}
              </article>`;
        }).join('')}</div></section>
        <section><h3>Family links <span>${draft.relations.length}</span></h3><p class="panel-muted">Only family links are included. Decorative connections stay on the board.</p>
          <div class="geneo-import-relations">${draft.relations.map(relation =>
          {
              const skipped = draft.skippedRelations.has(relation.id) || relation.ids.some(id => draft.choices.get(id) === 'skip');
              const conflict = preview.relationId === relation.id;
              const status = skipped ? 'Skipped' : conflict ? 'Needs resolution' : preview.statuses?.get(relation.id) || (preview.error ? 'Pending' : 'Will add');
              return `<div class="geneo-import-relation ${conflict ? 'is-conflict' : ''}"><span><strong>${escapeHtml(geneoTreeImportRelationLabel(relation, draft.people))}</strong><small>${escapeHtml(status)}${conflict ? ` · ${escapeHtml(preview.error)}` : ''}</small></span><label><input type="checkbox" data-geneo-import-skip-relation="${escapeHtml(relation.id)}" ${draft.skippedRelations.has(relation.id) ? 'checked' : ''}> Skip</label></div>`;
          }).join('')}</div></section>`;
    localizeUI(body);
    body.scrollTop = oldScroll;
    const error = modal.querySelector('[data-geneo-import-error]');
    error.textContent = preview.error || '';
    modal.querySelector('[data-geneo-import-commit]').disabled = Boolean(preview.error);
}

function openGeneographTreeImport()
{
    const board = selectedGeneographBoard();
    const node = board?.diagram.nodes.find(item => item.id === state.selectedGeneoNodeId);
    const startId = node?.type === 'person' ? node.personId : '';
    if (!board || !startId || board.projectId !== currentProjectId()) return;
    const people = geneoTreeImportGroup(board.diagram, startId);
    const ids = new Set(people.map(person => person.id));
    const choices = new Map(people.map(person =>
    {
        const linked = person.treePersonId && getPerson(person.treePersonId);
        return [person.id, linked && !linked.deleted && linked.projectId === board.projectId ? linked.id : 'create'];
    }));
    geneoTreeImportDraft = {
        boardId: board.id, projectId: board.projectId, diagramSnapshot: JSON.stringify(board.diagram),
        people, relations: geneoTreeImportRelations(board.diagram, ids), choices,
        newIds: new Map(people.map(person => [person.id, createRuntimeId('person')])),
        fields: new Map(), skippedRelations: new Set(), matchQueries: new Map()
    };
    openModal(`<div class="modal geneo-transfer-modal geneo-tree-import-modal" role="dialog" aria-modal="true" aria-labelledby="geneoTreeImportTitle">
        <div class="modal-header"><div><h2 id="geneoTreeImportTitle">Add family to Family Tree</h2><p>Review people, possible matches, facts, and relationships before importing.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="geneo-transfer-body" data-geneo-import-body></div>
        <div class="modal-footer"><span class="geneo-import-error" role="alert" data-geneo-import-error></span><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-geneo-import-commit>Import</button></div>
      </div>`);
    const modal = modalBackdrop.querySelector('.geneo-tree-import-modal');
    modal.addEventListener('input', event =>
    {
        if (!event.target.matches('[data-geneo-import-match-search]')) return;
        const id = event.target.dataset.geneoImportMatchSearch;
        const position = event.target.selectionStart;
        geneoTreeImportDraft.matchQueries.set(id, event.target.value);
        geneoTreeImportRender();
        const input = modal.querySelector(`[data-geneo-import-match-search="${CSS.escape(id)}"]`);
        input?.focus();
        input?.setSelectionRange(position, position);
    });
    modal.addEventListener('change', event =>
    {
        const draft = geneoTreeImportDraft;
        if (!draft) return;
        if (event.target.matches('[data-geneo-import-person]'))
        {
            draft.choices.set(event.target.dataset.geneoImportPerson, event.target.value);
            draft.fields.delete(event.target.dataset.geneoImportPerson);
        }
        else if (event.target.matches('[data-geneo-import-field]'))
        {
            const personId = event.target.dataset.geneoImportField;
            if (!draft.fields.has(personId)) draft.fields.set(personId, new Set());
            const fields = draft.fields.get(personId);
            if (event.target.value === 'board') fields.add(event.target.dataset.field);
            else fields.delete(event.target.dataset.field);
        }
        else if (event.target.matches('[data-geneo-import-skip-relation]'))
        {
            const id = event.target.dataset.geneoImportSkipRelation;
            if (event.target.checked) draft.skippedRelations.add(id);
            else draft.skippedRelations.delete(id);
        }
        else return;
        geneoTreeImportRender();
    });
    modal.querySelector('[data-geneo-import-commit]').addEventListener('click', geneoTreeImportCommit);
    geneoTreeImportRender();
}

function geneoTreeImportCommit()
{
    const draft = geneoTreeImportDraft;
    if (!draft) return;
    const preview = geneoTreeImportPreview(draft);
    if (preview.error) { geneoTreeImportRender(); return; }
    const snapshot = geneoTreeImportSnapshot();
    let result;
    try { result = geneoTreeImportApply(draft); }
    catch (error) { console.error(error); result = { error: 'Import failed. No changes were kept.' }; }
    if (result.error)
    {
        geneoTreeImportRestore(snapshot);
        geneoTreeImportRender();
        showToast(result.error);
        return;
    }
    const board = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
    const linkChanges = draft.people.filter(person => result.mapping.has(person.id) && person.treePersonId !== result.mapping.get(person.id));
    if (linkChanges.length) geneoPushHistory();
    linkChanges.forEach(person =>
    {
        person.treePersonId = result.mapping.get(person.id);
        if (person.syncState !== 'modified') person.syncState = 'linked';
    });
    if (linkChanges.length) touchGeneographBoard(board);
    geneoTreeImportDraft = null;
    closeModal();
    renderGeneographEditorPreserveScroll();
    showToast('Family Tree import complete.');
}
