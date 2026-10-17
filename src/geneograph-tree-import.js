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
    if (!selected?.size || ![...selected.values()].includes('tree')) return;
    const names = normalizeGeneographPersonNames(boardPerson);
    for (const key of ['first', 'middle', 'last', 'maiden'])
        if (selected.get(`names.${key}`) === 'tree') treePerson.names[key] = names[key];
    if (['first', 'middle', 'last'].some(key => selected.get(`names.${key}`) === 'tree'))
    {
        treePerson.names.display = [treePerson.names.first, treePerson.names.middle, treePerson.names.last].filter(Boolean).join(' ');
        treePerson.names.initials = `${treePerson.names.first?.[0] || ''}${treePerson.names.last?.[0] || ''}`.toUpperCase();
    }
    for (const key of ['gender', 'livingStatus']) if (selected.get(key) === 'tree') treePerson[key] = boardPerson[key];
    for (const key of ['birth', 'death'])
    {
        if (selected.get(`${key}.date`) === 'tree')
        {
            const placeId = treePerson[key]?.placeId || null;
            const placeText = treePerson[key]?.placeText || '';
            treePerson[key] = { ...structuredClone(boardPerson[key]), placeId, placeText };
        }
        if (selected.get(`${key}.place`) === 'tree')
        {
            treePerson[key] = treePerson[key] || emptyGenealogyDate('Exact date');
            treePerson[key].placeId = boardPerson[key]?.placeId || null;
            treePerson[key].placeText = boardPerson[key]?.placeText || '';
        }
    }
    treePerson.updatedAt = new Date().toISOString();
}

function geneoTreeImportApplyBoardFields(boardPerson, treePerson, selected)
{
    if (!selected?.size) return;
    for (const key of ['first', 'middle', 'last', 'maiden'])
        if (selected.get(`names.${key}`) === 'board') boardPerson.names[key] = treePerson.names?.[key] || '';
    for (const key of ['gender', 'livingStatus'])
        if (selected.get(key) === 'board') boardPerson[key] = treePerson[key];
    for (const key of ['birth', 'death'])
    {
        if (selected.get(`${key}.date`) === 'board')
        {
            const placeId = boardPerson[key]?.placeId || null;
            const placeText = boardPerson[key]?.placeText || '';
            boardPerson[key] = { ...structuredClone(treePerson[key]), placeId, placeText };
        }
        if (selected.get(`${key}.place`) === 'board')
        {
            boardPerson[key] = boardPerson[key] || emptyGenealogyDate('Exact date');
            boardPerson[key].placeId = treePerson[key]?.placeId || null;
            boardPerson[key].placeText = treePerson[key]?.placeText || '';
        }
    }
    boardPerson.syncState = 'linked';
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
    if (!board || currentProjectId() !== draft.projectId || JSON.stringify(board.diagram) !== draft.diagramSnapshot
        || JSON.stringify(sampleData.people) !== draft.peopleSnapshot || JSON.stringify(sampleData.families) !== draft.familiesSnapshot)
        return { error: t('The board or Family Tree changed. Reopen the review.') };
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

function geneoTreeImportRelationSentence(relation, people)
{
    const names = relation.ids.map(id => geneoPersonDisplayName(people.find(person => person.id === id)));
    if (relation.type === 'child') return `${t('Child')}: ${names.at(-1)} · ${t('Parents')}: ${names.slice(0, -1).join(', ')}`;
    if (relation.type === 'partner') return `${t('Partners')}: ${names.join(', ')}`;
    return `${t('Siblings')}: ${names.join(', ')}`;
}

function geneoTreeImportAvatar(person, isBoard = false)
{
    return renderPersonAvatar(isBoard ? geneoPersonAvatarModel(person) : person, 'geneo-review-avatar', { element: 'span' });
}

function geneoTreeImportRelationOwner(relation)
{
    return relation.type === 'child' ? relation.ids.at(-1) : relation.ids[1];
}

function geneoTreeImportFactRows(personId, fields, decisions)
{
    if (!fields.length) return '';
    return `<div class="geneo-review-facts"><h4>${escapeHtml(t('Fact differences'))}</h4><p class="geneo-review-fact-help">${escapeHtml(t('Select a value to copy. Otherwise, both stay unchanged.'))}</p>${fields.map(([key, label, boardValue, treeValue]) =>
    {
        const decision = decisions.get(key);
        return `<div class="geneo-review-fact"><div class="geneo-review-fact-head"><strong>${escapeHtml(t(label))}</strong>${decision ? `<span>${escapeHtml(t(decision === 'tree' ? 'Use on Tree' : 'Use on board'))}</span>` : ''}</div><div class="geneo-review-values"><button type="button" class="geneo-review-value ${decision === 'tree' ? 'is-selected' : ''}" data-geneo-import-field="${escapeHtml(personId)}" data-field="${escapeHtml(key)}" data-value="tree" aria-pressed="${decision === 'tree'}" aria-label="${escapeHtml(`${t('Use board value in Tree')}: ${t(label)}, ${boardValue || t('Not recorded')}`)}"><strong>${escapeHtml(String(boardValue || t('Not recorded')))}</strong></button><button type="button" class="geneo-review-value ${decision === 'board' ? 'is-selected' : ''}" data-geneo-import-field="${escapeHtml(personId)}" data-field="${escapeHtml(key)}" data-value="board" aria-pressed="${decision === 'board'}" aria-label="${escapeHtml(`${t('Use Tree value on board')}: ${t(label)}, ${treeValue || t('Not recorded')}`)}"><strong>${escapeHtml(String(treeValue || t('Not recorded')))}</strong></button></div>${decision ? `<button type="button" class="geneo-review-reset" data-geneo-import-field="${escapeHtml(personId)}" data-field="${escapeHtml(key)}" data-value="none">${escapeHtml(t('Keep both unchanged'))}</button>` : ''}</div>`;
    }).join('')}</div>`;
}

function geneoTreeImportRender()
{
    const draft = geneoTreeImportDraft;
    const modal = modalBackdrop.querySelector('.geneo-tree-import-modal');
    if (!draft || !modal) return;
    const body = modal.querySelector('[data-geneo-import-body]');
    const oldScroll = body.scrollTop;
    const preview = geneoTreeImportPreview(draft);
    const active = draft.people.find(person => person.id === draft.activePersonId) || draft.people[0];
    const choice = active ? draft.choices.get(active.id) : 'skip';
    const treePerson = choice !== 'skip' && choice !== 'create' ? getPerson(choice) : null;
    const showLifeDates = !treePerson || formatGenealogyDateLabel(active.birth) !== formatGenealogyDateLabel(treePerson.birth)
        || formatGenealogyDateLabel(active.death) !== formatGenealogyDateLabel(treePerson.death);
    const fields = treePerson ? geneoTreeImportFields(active, treePerson) : [];
    const decisions = draft.fields.get(active?.id) || new Map();
    const query = draft.matchQueries.get(active?.id) || '';
    const matches = active ? geneoTreeImportMatches(active, draft.projectId)
        .filter(item => !query || `${connectPersonName(item.person)} ${connectPersonLifeLine(item.person)} ${getPlaceEventDisplay(item.person.birth)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
        .slice(0, query ? 30 : 8) : [];
    if (treePerson && !matches.some(item => item.person.id === treePerson.id)) matches.unshift({ person: treePerson, score: 0 });
    const relationshipRows = draft.relations.filter(relation => geneoTreeImportRelationOwner(relation) === active?.id).map(relation =>
    {
        const personSkipped = relation.ids.some(id => draft.choices.get(id) === 'skip');
        const skipped = draft.skippedRelations.has(relation.id) || personSkipped;
        const conflict = preview.relationId === relation.id;
        const status = skipped ? 'Skipped' : conflict ? 'Needs resolution' : preview.statuses?.get(relation.id) || (preview.error ? 'Pending' : 'Will add');
        const detail = personSkipped ? t('A connected person is skipped.') : conflict ? preview.error : '';
        return `<div class="geneo-import-relation ${conflict ? 'is-conflict' : ''}"><span><strong>${escapeHtml(geneoTreeImportRelationSentence(relation, draft.people))}</strong><small>${escapeHtml(t(status))}${detail ? ` · ${escapeHtml(detail)}` : ''}</small></span>${personSkipped ? '' : `<label><input type="checkbox" data-geneo-import-skip-relation="${escapeHtml(relation.id)}" ${draft.skippedRelations.has(relation.id) ? 'checked' : ''}> ${escapeHtml(t('Skip'))}</label>`}</div>`;
    }).join('');
    const matchEditorOpen = draft.matchEditorOpenId === active?.id;
    const matchPicker = active && (matchEditorOpen || !active.treePersonId && choice !== 'create' && choice !== 'skip') ? `<div class="geneo-review-match"><label>${escapeHtml(t('Find existing person'))}<input class="common-input" type="search" data-geneo-import-match-search="${escapeHtml(active.id)}" value="${escapeHtml(query)}" placeholder="${escapeHtml(t('Search by name, date, or place'))}" autocomplete="off"></label><label>${escapeHtml(t('Select Tree person'))}<span class="common-select-shell"><select class="common-select" data-geneo-import-person="${escapeHtml(active.id)}"><option value="" disabled ${choice === 'create' || choice === 'skip' ? 'selected' : ''}>${escapeHtml(t('Choose a person'))}</option>${matches.map(({ person, score }) => `<option value="${escapeHtml(person.id)}" ${choice === person.id ? 'selected' : ''}>${score >= 50 ? `${escapeHtml(t('Possible match'))}: ` : ''}${escapeHtml(connectPersonName(person))} · ${escapeHtml(connectPersonLifeLine(person))}</option>`).join('')}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>${active.treePersonId ? `<button class="button secondary" type="button" data-geneo-import-match-cancel>${escapeHtml(t('Done'))}</button>` : ''}</div>` : '';
    const personEntries = draft.people.map(person =>
        {
            const target = draft.choices.get(person.id);
            const linked = Boolean(person.treePersonId);
            const match = target !== 'skip' && target !== 'create' ? getPerson(target) : null;
            const differences = match ? geneoTreeImportFields(person, match) : [];
            const undecided = differences.filter(([key]) => !draft.fields.get(person.id)?.has(key)).length;
            const changedMatch = match && target !== person.treePersonId;
            const awaitingMatch = draft.matchEditorOpenId === person.id && !linked && (target === 'create' || target === 'skip');
            const ownedRelations = draft.relations.filter(relation => geneoTreeImportRelationOwner(relation) === person.id);
            const conflict = ownedRelations.some(relation => preview.relationId === relation.id);
            const linkCount = ownedRelations.filter(relation => preview.statuses?.get(relation.id) === 'Will add').length;
            const needsReview = conflict || awaitingMatch || target === 'create' || changedMatch || undecided > 0 || linkCount > 0;
            const status = conflict ? t('Needs resolution') : awaitingMatch ? t('Choose a Tree person') : target === 'skip' ? t('Skipped') : target === 'create' ? t('Create in Tree') : changedMatch ? t('Change Tree match') : undecided ? `${undecided} ${t(undecided === 1 ? 'fact difference' : 'fact differences')}` : linkCount ? `${linkCount} ${t(linkCount === 1 ? 'family link' : 'family links')} ${t('to add')}` : differences.length ? t('Fact choice made') : linked ? t('No changes') : t('Matched');
            return { needsReview, html: `<button type="button" class="geneo-review-person ${draft.activePersonId === person.id ? 'active' : ''} ${needsReview ? 'needs-review' : 'no-change'}" data-geneo-review-person="${escapeHtml(person.id)}" aria-current="${draft.activePersonId === person.id ? 'true' : 'false'}">${geneoTreeImportAvatar(person, true)}<span class="geneo-review-person-copy"><strong>${escapeHtml(geneoPersonDisplayName(person))}</strong><small>${escapeHtml(status)}</small></span><span class="geneo-review-status-dot" aria-hidden="true"></span></button>` };
        });
    body.innerHTML = `<div class="geneo-review-layout"><nav class="geneo-review-rail" aria-label="${escapeHtml(t('People'))}"><div class="geneo-review-rail-title">${escapeHtml(t('People'))}</div>${personEntries.map(entry => entry.html).join('')}</nav>
        <div class="geneo-review-main"><section>
          <div class="geneo-review-columns"><div class="geneo-review-card"><h4>${escapeHtml(t('On board'))}</h4><div class="geneo-review-identity">${geneoTreeImportAvatar(active, true)}<span><strong>${escapeHtml(geneoPersonDisplayName(active))}</strong>${showLifeDates ? `<small>${escapeHtml(geneoPersonLifeDates(active))}</small>` : ''}</span></div></div>
          <div class="geneo-review-card"><div class="geneo-review-card-head"><h4>${escapeHtml(t('In Family Tree'))}</h4>${active.treePersonId ? `<button type="button" class="geneo-review-text-action" data-geneo-import-match-toggle>${escapeHtml(t('Change match'))}</button>` : ''}</div>${treePerson ? `<div class="geneo-review-identity">${geneoTreeImportAvatar(treePerson)}<span><strong>${escapeHtml(connectPersonName(treePerson))}</strong>${showLifeDates ? `<small>${escapeHtml(connectPersonLifeLine(treePerson))}</small>` : ''}</span></div>` : `<span class="geneo-review-empty-target">${escapeHtml(t(matchEditorOpen ? 'Choose a Tree person' : choice === 'skip' ? 'This person will be skipped.' : 'A new Tree person will be created.'))}</span>`}</div></div>
          ${!active.treePersonId ? `<div class="geneo-review-action-row"><button type="button" class="geneo-review-mode ${choice === 'create' && !matchEditorOpen ? 'is-selected' : ''}" data-geneo-import-mode="create" aria-pressed="${choice === 'create' && !matchEditorOpen}">${escapeHtml(t('Create new Tree person'))}</button><button type="button" class="geneo-review-mode ${choice !== 'create' && choice !== 'skip' || matchEditorOpen ? 'is-selected' : ''}" data-geneo-import-mode="match" aria-pressed="${choice !== 'create' && choice !== 'skip' || matchEditorOpen}">${escapeHtml(t('Match existing'))}</button><button type="button" class="geneo-review-mode ${choice === 'skip' && !matchEditorOpen ? 'is-selected' : ''}" data-geneo-import-mode="skip" aria-pressed="${choice === 'skip' && !matchEditorOpen}">${escapeHtml(t('Skip person'))}</button></div>` : ''}
          ${matchPicker}
          ${treePerson ? geneoTreeImportFactRows(active.id, fields, decisions) : ''}
          ${relationshipRows ? `<div class="geneo-review-relationships"><h4>${escapeHtml(t('Family connections'))}</h4><div class="geneo-import-relations">${relationshipRows}</div></div>` : ''}
        </section></div></div>`;
    localizeUI(body);
    body.scrollTop = oldScroll;
    const activeChoice = body.querySelector('.geneo-review-rail [aria-current="true"]');
    const rail = body.querySelector('.geneo-review-rail');
    if (rail && activeChoice && getComputedStyle(rail).flexDirection === 'row')
        rail.scrollLeft = Math.max(0, activeChoice.offsetLeft - rail.offsetLeft - 12);
    const error = modal.querySelector('[data-geneo-import-error]');
    error.textContent = preview.error || '';
    const awaitingMatch = Boolean(draft.matchEditorOpenId && draft.people.some(person => person.id === draft.matchEditorOpenId && !person.treePersonId && ['create', 'skip'].includes(draft.choices.get(person.id))));
    const newCount = [...draft.choices].filter(([id, value]) => value === 'create' && (!awaitingMatch || id !== draft.matchEditorOpenId)).length;
    const matchCount = draft.people.filter(person => {
        const choice = draft.choices.get(person.id);
        return choice !== 'skip' && choice !== 'create' && choice !== person.treePersonId;
    }).length;
    const factCount = [...draft.fields.values()].reduce((count, values) => count + values.size, 0);
    const linkCount = [...(preview.statuses?.values() || [])].filter(status => status === 'Will add').length;
    const summaryParts = [[newCount, 'new person', 'new people'], [matchCount, 'match', 'matches'], [factCount, 'fact change', 'fact changes'], [linkCount, 'family link', 'family links']].filter(([count]) => count).map(([count, singular, plural]) => `${count} ${t(count === 1 ? singular : plural)}`);
    modal.querySelector('[data-geneo-import-summary]').textContent = summaryParts.join(' · ') || t('No changes selected');
    const commit = modal.querySelector('[data-geneo-import-commit]');
    commit.textContent = summaryParts.length ? t('Apply changes') : t('Done');
    commit.disabled = Boolean(preview.error) || awaitingMatch;
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
        peopleSnapshot: JSON.stringify(sampleData.people), familiesSnapshot: JSON.stringify(sampleData.families),
        people, relations: geneoTreeImportRelations(board.diagram, ids), choices,
        activePersonId: startId,
        newIds: new Map(people.map(person => [person.id, createRuntimeId('person')])),
        fields: new Map(), skippedRelations: new Set(), matchQueries: new Map()
    };
    openModal(`<div class="modal geneo-transfer-modal geneo-tree-import-modal" role="dialog" aria-modal="true" aria-labelledby="geneoTreeImportTitle">
        <div class="modal-header"><div><h2 id="geneoTreeImportTitle">Review board and Family Tree</h2></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="geneo-transfer-body" data-geneo-import-body></div>
        <div class="modal-footer"><div class="geneo-review-footer-copy"><span data-geneo-import-summary></span><span class="geneo-import-error" role="alert" data-geneo-import-error></span></div><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-geneo-import-commit>Apply reviewed changes</button></div>
      </div>`);
    const modal = modalBackdrop.querySelector('.geneo-tree-import-modal');
    modal.addEventListener('click', event =>
    {
        const mode = event.target.closest('[data-geneo-import-mode]');
        if (mode)
        {
            const draft = geneoTreeImportDraft;
            const id = draft.activePersonId;
            if (mode.dataset.geneoImportMode === 'match') draft.matchEditorOpenId = id;
            else
            {
                draft.choices.set(id, mode.dataset.geneoImportMode);
                draft.fields.delete(id);
                draft.matchEditorOpenId = null;
            }
            geneoTreeImportRender();
            modal.querySelector(mode.dataset.geneoImportMode === 'match' ? '[data-geneo-import-match-search]' : `[data-geneo-import-mode="${mode.dataset.geneoImportMode}"]`)?.focus({ preventScroll: true });
            return;
        }
        const field = event.target.closest('[data-geneo-import-field]');
        if (field)
        {
            const draft = geneoTreeImportDraft;
            const { geneoImportField: id, field: key, value } = field.dataset;
            if (!draft.fields.has(id)) draft.fields.set(id, new Map());
            const choices = draft.fields.get(id);
            if (value === 'none' || choices.get(key) === value) choices.delete(key);
            else choices.set(key, value);
            geneoTreeImportRender();
            modal.querySelector(`[data-geneo-import-field="${CSS.escape(id)}"][data-field="${CSS.escape(key)}"][data-value="${value}"]`)?.focus({ preventScroll: true });
            return;
        }
        if (event.target.closest('[data-geneo-import-match-toggle]'))
        {
            geneoTreeImportDraft.matchEditorOpenId = geneoTreeImportDraft.activePersonId;
            geneoTreeImportRender();
            modal.querySelector('[data-geneo-import-match-search]')?.focus({ preventScroll: true });
            return;
        }
        if (event.target.closest('[data-geneo-import-match-cancel]'))
        {
            geneoTreeImportDraft.matchEditorOpenId = null;
            geneoTreeImportRender();
            modal.querySelector('[data-geneo-import-match-toggle]')?.focus({ preventScroll: true });
            return;
        }
        const person = event.target.closest('[data-geneo-review-person]');
        if (!person) return;
        if (geneoTreeImportDraft.matchEditorOpenId !== person.dataset.geneoReviewPerson)
            geneoTreeImportDraft.matchEditorOpenId = null;
        geneoTreeImportDraft.activePersonId = person.dataset.geneoReviewPerson;
        geneoTreeImportRender();
        modal.querySelector('.geneo-review-rail [aria-current="true"]')?.focus({ preventScroll: true });
    });
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
        const personChoiceId = event.target.dataset.geneoImportPerson;
        const relationId = event.target.dataset.geneoImportSkipRelation;
        if (event.target.matches('[data-geneo-import-person]'))
        {
            if (!event.target.value) return;
            draft.choices.set(event.target.dataset.geneoImportPerson, event.target.value);
            draft.fields.delete(event.target.dataset.geneoImportPerson);
            draft.matchEditorOpenId = null;
        }
        else if (event.target.matches('[data-geneo-import-skip-relation]'))
        {
            const id = event.target.dataset.geneoImportSkipRelation;
            if (event.target.checked) draft.skippedRelations.add(id);
            else draft.skippedRelations.delete(id);
        }
        else return;
        geneoTreeImportRender();
        const focusTarget = personChoiceId
            ? modal.querySelector(`[data-geneo-import-person="${CSS.escape(personChoiceId)}"]`)
            : relationId
                ? modal.querySelector(`[data-geneo-import-skip-relation="${CSS.escape(relationId)}"]`)
                : null;
        focusTarget?.focus({ preventScroll: true });
    });
    modal.querySelector('[data-geneo-import-commit]').addEventListener('click', () => {
        const draft = geneoTreeImportDraft;
        const preview = draft && geneoTreeImportPreview(draft);
        const pending = draft && ([...draft.choices.values()].some(value => value === 'create') || draft.people.some(person => { const choice = draft.choices.get(person.id); return choice !== 'skip' && choice !== 'create' && choice !== person.treePersonId; }) || [...draft.fields.values()].some(values => values.size) || [...(preview.statuses?.values() || [])].some(status => status === 'Will add'));
        if (!pending && !preview.error) closeModal();
        else geneoTreeImportCommit();
    });
    geneoTreeImportRender();
}

function geneoTreeImportCommit()
{
    const draft = geneoTreeImportDraft;
    if (!draft) return;
    if (draft.matchEditorOpenId && draft.people.some(person => person.id === draft.matchEditorOpenId && !person.treePersonId && ['create', 'skip'].includes(draft.choices.get(person.id)))) return;
    const preview = geneoTreeImportPreview(draft);
    if (preview.error) { geneoTreeImportRender(); return; }
    const snapshot = geneoTreeImportSnapshot();
    const board = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
    const boardSnapshot = structuredClone(board.diagram);
    const historyUndo = [...geneoHistoryRuntime.undo];
    const historyRedo = [...geneoHistoryRuntime.redo];
    let result;
    try {
        result = geneoTreeImportApply(draft);
        if (!result.error)
        {
            const linkChanges = draft.people.filter(person => result.mapping.has(person.id) && person.treePersonId !== result.mapping.get(person.id));
            const boardFactChanges = draft.people.filter(person => [...(draft.fields.get(person.id)?.values() || [])].includes('board'));
            if (linkChanges.length || boardFactChanges.length) geneoPushHistory();
            boardFactChanges.forEach(person =>
            {
                const current = board.diagram.people.find(item => item.id === person.id);
                const tree = getPerson(result.mapping.get(person.id));
                if (!current || !tree) throw new Error('Reviewed person is no longer available.');
                geneoTreeImportApplyBoardFields(current, tree, draft.fields.get(person.id));
                current.syncState = geneoTreeImportFields(current, tree).length ? 'modified' : 'linked';
            });
            linkChanges.forEach(person =>
            {
                person.treePersonId = result.mapping.get(person.id);
                if (person.syncState !== 'modified') person.syncState = 'linked';
            });
            if (linkChanges.length || boardFactChanges.length) touchGeneographBoard(board);
        }
    }
    catch (error) { console.error(error); result = { error: 'Import failed. No changes were kept.' }; }
    if (result.error)
    {
        geneoTreeImportRestore(snapshot);
        board.diagram = boardSnapshot;
        geneoHistoryRuntime.undo = historyUndo;
        geneoHistoryRuntime.redo = historyRedo;
        geneoTreeImportRender();
        showToast(result.error);
        return;
    }
    geneoTreeImportDraft = null;
    closeModal();
    renderGeneographEditorPreserveScroll();
    showToast('Family Tree import complete.');
}
