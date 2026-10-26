function geneoReviewRelationSubjects(relation, personId)
{
    return relation.type === 'child'
        ? relation.ids.at(-1) === personId ? relation.ids.slice(0, -1) : [relation.ids.at(-1)]
        : relation.ids.filter(id => id !== personId);
}

function geneoReviewRelationType(draft, relation, direction)
{
    if (relation.origin === 'tree' && direction === 'board') return '';
    if (relation.origin === 'tree' && relation.type === 'sibling')
    {
        const family = sampleData.families.find(item => item.id === relation.treeFamilyId);
        const types = geneoReviewFamilyParents(family).map(id => parentChildRelationshipType(family, id, relation.treeIds.at(-1)));
        return new Set(types).size === 1 ? types[0] : '';
    }
    const treeChoice = id => draft.relativeTargets?.get(`${relation.id}|${id}`) || draft.choices.get(id);
    if (relation.type === 'partner')
    {
        const family = direction === 'board' ? draft.diagram.families.find(item => item.id === relation.familyId)
            : sampleData.families.find(item => item.id === relation.treeFamilyId || item.projectId === draft.projectId
                && geneoReviewEqual(geneoReviewFamilyParents(item).sort(), relation.ids.map(treeChoice).sort()));
        return family ? family.relationshipType || 'Unknown relationship' : '';
    }
    if (direction === 'board' && relation.origin !== 'tree' && relation.type === 'child')
    {
        const family = draft.diagram.families.find(item => item.id === relation.familyId);
        const child = family?.children.find(item => item.personId === relation.ids.at(-1));
        const types = relation.ids.slice(0, -1).map(id => geneoReviewParentType(family, child, id));
        return new Set(types).size === 1 ? types[0] || '' : '';
    }
    const treeIds = relation.treeIds || relation.ids.map(treeChoice);
    const candidates = geneoReviewTreeFamilyCandidates(draft, relation);
    const family = relation.treeFamilyId ? sampleData.families.find(item => item.id === relation.treeFamilyId)
        : candidates.length === 1 ? candidates[0] : candidates.find(item => item.id === draft.treeFamilyChoices?.get(relation.id));
    if (!family) return '';
    const types = treeIds.slice(0, -1).map(id => parentChildRelationshipType(family, id, treeIds.at(-1)));
    return new Set(types).size === 1 ? types[0] : '';
}

function geneoReviewRelativeTarget(draft, relation, personId)
{
    return draft.relativeTargets?.get(`${relation.id}|${personId}`) || draft.choices.get(personId) || '';
}

function geneoReviewRelativeTreeCell(draft, relation, personId, plan)
{
    const person = geneoReviewPersonById(draft, personId);
    const sourceId = relation.treeIds?.[relation.ids.indexOf(personId)];
    const choice = relation.origin === 'tree' ? sourceId : geneoReviewRelativeTarget(draft, relation, personId);
    const attrs = `data-relation="${escapeHtml(relation.id)}" data-person="${escapeHtml(personId)}"`;
    const editChoice = relation.origin !== 'tree' && draft.relativeTargets.has(`${relation.id}|${personId}`)
        ? `<div class="gr-record-actions"><button type="button" class="gr-text" data-gr-relative-search ${attrs}>${escapeHtml(t('Change person'))}</button><button type="button" class="gr-text" data-gr-relative-reset ${attrs}>${escapeHtml(t('Reset'))}</button></div>` : '';
    const search = draft.relativeSearch?.relationId === relation.id && draft.relativeSearch?.personId === personId ? geneoReviewCandidates(draft, person, relation.id) : '';
    const tree = !['skip', 'create', 'unlink'].includes(choice) ? getPerson(choice) : null;
    if (tree && !tree.deleted && tree.projectId === draft.projectId)
        return `${geneoReviewIdentity(tree)}<span class="gr-record-type">${escapeHtml(t(geneoReviewRelationType(draft, relation, 'tree') || 'Not yet connected'))}</span>${editChoice}${search}`;
    if (choice === 'create')
        return `<div class="gr-projected-record">${geneoReviewIdentity(person, true)}<span class="gr-record-type">${escapeHtml(t('New Tree person'))}</span></div>${editChoice}${search}`;
    const matches = geneoTreeImportMatches(person, draft.projectId, draft);
    const suggestion = matches.find(item => item.score > 0);
    const duplicate = suggestion && geneoReviewDuplicate(draft, personId, suggestion.person.id);
    return `${suggestion ? `<div class="gr-suggested-record">${geneoReviewIdentity(suggestion.person)}<span class="gr-record-type">${escapeHtml(t(suggestion.strong ? 'Strong match' : 'Possible match'))}${suggestion.context.length ? ` · ${escapeHtml(suggestion.context.join(', '))}` : ''}</span>${duplicate ? `<button type="button" class="gr-text" data-gr-locate="${escapeHtml(duplicate.id)}">${escapeHtml(t('Locate existing'))}</button>` : `<button type="button" class="gr-text" data-gr-relative-candidate="${escapeHtml(suggestion.person.id)}" ${attrs}>${escapeHtml(t('Use this person'))}</button>`}</div>` : `<span class="gr-muted">${escapeHtml(t('Choose a Tree record or create a new person'))}</span>`}
        <div class="gr-record-actions"><button type="button" class="gr-text" data-gr-relative-create ${attrs}>${escapeHtml(t('Create a new person'))}</button><button type="button" class="gr-text" data-gr-relative-search ${attrs}>${escapeHtml(t('Search Family Tree'))}</button></div>
        ${search}`;
}

function geneoReviewRelations(draft, person, plan)
{
    const relations = plan.relations.filter(relation => relation.ids.includes(person.id));
    if (!relations.length) return '';
    const groups = new Map(['Parents', 'Partners', 'Children', 'Siblings'].map(group => [group, []]));
    for (const relation of relations)
    {
        const group = relation.type === 'child' ? relation.ids.at(-1) === person.id ? 'Parents' : 'Children' : relation.type === 'partner' ? 'Partners' : 'Siblings';
        groups.get(group).push(relation);
    }
    return `<section class="gr-section gr-relationships"><h3>${escapeHtml(t('Family relationships'))}</h3>${[...groups].filter(([, rows]) => rows.length).map(([group, rows]) =>
    {
        const rendered = rows.map(relation =>
        {
            const subjects = geneoReviewRelationSubjects(relation, person.id);
            const choice = draft.relationChoices.get(relation.id);
            const sourceType = geneoReviewRelationType(draft, relation, choice || (relation.origin === 'tree' ? 'tree' : 'board'));
            const proposedType = draft.transferTypes?.get(relation.id) ?? sourceType;
            const status = plan.statuses.get(relation.id);
            const parentFamilies = relation.origin !== 'tree' && relation.type === 'child' ? geneoReviewTreeFamilyCandidates(draft, relation) : [];
            const error = plan.errors.find(item => item.relationId === relation.id);
            const title = subjects.map(id => geneoPersonDisplayName(geneoReviewPersonById(draft, id))).join(' / ');
            const role = { Parents: subjects.length > 1 ? 'Parents' : 'Parent', Partners: 'Partner', Children: 'Child', Siblings: 'Sibling' }[group];
            const types = relation.type === 'partner' ? ADD_PERSON_RELATIONSHIP_TYPES : PARENT_CHILD_RELATIONSHIP_TYPES;
            const parentIds = relation.type === 'child' ? (relation.treeIds || []).slice(0, -1) : [];
            const parentCardsPresent = parentIds.every(id => draft.diagram.nodes.some(node => draft.diagram.people.find(record => record.id === node.personId)?.treePersonId === id));
            const boardFamily = relation.origin === 'tree' && draft.diagram.families.find(family => geneoReviewEqual(family.partnerIds.map(id => draft.choices.get(id)).sort(), [...parentIds].sort()));
            const missingParents = relation.origin === 'tree' && parentIds.length > 1 && (!parentCardsPresent || !draft.diagram.connections.some(connection => connection.kind === 'family-partner' && connection.familyId === boardFamily?.id));
            const parentChoice = draft.treeParentChoices?.get(relation.id);
            const ready = plan.mapping.has(draft.anchorId) && relation.ids.every(id => id === person.id || subjects.includes(id)
                ? relation.origin === 'tree' || !['', 'skip', 'unlink'].includes(geneoReviewRelativeTarget(draft, relation, id))
                : plan.mapping.has(id));
            const canRight = relation.origin !== 'tree' && ready && proposedType;
            const canLeft = plan.mapping.has(draft.anchorId) && proposedType && (relation.origin === 'tree' ? !missingParents || parentChoice : ['Same relationship', 'Relationship differs'].includes(status));
            const arrow = (direction, enabled) => `<button type="button" class="gr-transfer ${direction === 'tree' ? 'is-left' : ''} ${choice === direction ? 'is-selected' : ''}" data-gr-relation="${escapeHtml(relation.id)}" data-source="${direction}" aria-pressed="${choice === direction}" ${enabled ? '' : 'disabled'} aria-label="${escapeHtml(`${t(direction === 'board' ? 'Copy to Family Tree' : 'Copy to board')}: ${title}`)}" title="${escapeHtml(`${t(direction === 'board' ? 'Copy to Family Tree' : 'Copy to board')}: ${title}`)}">${icon.arrow}</button>`;
            if (status === 'Same relationship' && !choice)
                return `<div class="gr-relation gr-relationship-same">${icon.check}<span>${subjects.map(id => geneoReviewIdentity(geneoReviewPersonById(draft, id), true)).join('')}<small>${escapeHtml(t(role))} · ${escapeHtml(t(sourceType))} · ${escapeHtml(t('Already connected in Family Tree'))}</small></span></div>`;
            const boardCell = subjects.map(id =>
            {
                const boardPerson = draft.people.find(item => item.id === id);
                if (boardPerson) return `${geneoReviewIdentity(boardPerson, true)}<span class="gr-record-type">${escapeHtml(t(geneoReviewRelationType(draft, relation, 'board') || 'Not yet connected'))}</span>`;
                return choice === 'tree' ? `<div class="gr-projected-record">${geneoReviewIdentity(geneoReviewPersonById(draft, id), true)}<span class="gr-record-type">${escapeHtml(t('New board card'))}</span></div>` : `<div class="gr-empty-record">${icon.plus}<span>${escapeHtml(t('Not on this board'))}</span></div>`;
            }).join('');
            const treeCell = subjects.map(id => geneoReviewRelativeTreeCell(draft, relation, id, plan)).join('');
            return `<article class="gr-relation gr-record-row" data-gr-record-row="${escapeHtml(relation.id)}"><div class="gr-relative-config"><strong>${escapeHtml(t(role))}</strong><select class="common-select" data-gr-transfer-type="${escapeHtml(relation.id)}" aria-label="${escapeHtml(`${t('Relationship type')}: ${title}`)}"><option value="">${escapeHtml(t('Choose relationship type'))}</option>${types.map(type => `<option value="${escapeHtml(type)}" ${type === proposedType ? 'selected' : ''}>${escapeHtml(t(type))}</option>`).join('')}</select></div>
                <div class="gr-values"><div class="gr-relative-cell ${choice === 'tree' ? 'is-destination' : ''}">${boardCell}${choice === 'tree' ? `<strong class="gr-destination-type">${icon.check}${escapeHtml(t(proposedType))}</strong>` : ''}</div><div class="gr-transfers">${arrow('board', canRight)}${arrow('tree', canLeft)}</div><div class="gr-relative-cell ${choice === 'board' ? 'is-destination' : ''}">${treeCell}${choice === 'board' ? `<strong class="gr-destination-type">${icon.check}${escapeHtml(t(proposedType))}</strong>` : ''}</div></div>
                ${missingParents ? `<label class="gr-label gr-parent-choice">${escapeHtml(t('Parents involved'))}<select class="common-select" data-gr-tree-parents="${escapeHtml(relation.id)}"><option value="">${escapeHtml(t('Choose parents'))}</option>${parentIds.map(id => `<option value="${escapeHtml(id)}" ${parentChoice === id ? 'selected' : ''} ${draft.diagram.nodes.some(node => draft.diagram.people.find(record => record.id === node.personId)?.treePersonId === id) ? '' : 'disabled'}>${escapeHtml(connectPersonName(getPerson(id)))}</option>`).join('')}<option value="all" ${parentChoice === 'all' ? 'selected' : ''} ${parentCardsPresent ? '' : 'disabled'}>${escapeHtml(parentCardsPresent ? parentIds.map(id => connectPersonName(getPerson(id))).join(' / ') : t('Both parents must be on the board first'))}</option></select></label>` : ''}
                ${relation.type === 'sibling' && relation.origin !== 'tree' ? `<label class="gr-label gr-parent-choice">${escapeHtml(t('Parents involved'))}<select class="common-select" data-gr-sibling="${escapeHtml(relation.id)}"><option value="">${escapeHtml(t('Choose parent family'))}</option>${sampleData.families.filter(family => family.projectId === draft.projectId && (family.childIds || []).some(id => relation.ids.map(personId => draft.choices.get(personId)).includes(id))).map(family => `<option value="${escapeHtml(family.id)}" ${draft.siblingFamilies.get(relation.id) === family.id ? 'selected' : ''}>${escapeHtml(geneoReviewFamilyParents(family).map(id => connectPersonName(getPerson(id))).join(' / '))}</option>`).join('')}</select></label>` : ''}
                ${parentFamilies.length > 1 ? `<label class="gr-label gr-parent-choice">${escapeHtml(t('Parents involved'))}<select class="common-select" data-gr-tree-family="${escapeHtml(relation.id)}"><option value="">${escapeHtml(t('Choose parent family'))}</option>${parentFamilies.map(family => `<option value="${escapeHtml(family.id)}" ${draft.treeFamilyChoices?.get(relation.id) === family.id ? 'selected' : ''}>${escapeHtml(geneoReviewFamilyParents(family).map(id => connectPersonName(getPerson(id))).join(' / '))}</option>`).join('')}</select></label>` : ''}
                ${choice ? `<div class="gr-staged">${icon.check}${escapeHtml(t(status === 'Same relationship' && !plan.operations.some(operation => operation.type === 'relationship' && operation.relationId === relation.id) ? 'Already connected in Family Tree' : choice === 'board' ? 'Will be connected in Family Tree' : 'Will be updated on the board'))} · ${escapeHtml(t(proposedType))}<button type="button" class="gr-text" data-gr-relation="${escapeHtml(relation.id)}" data-source="none">${escapeHtml(t('Undo'))}</button></div>` : ''}
                ${error ? `<p class="gr-error">${escapeHtml(error.message)}</p>` : ''}</article>`;
        });
        return `<section class="gr-relative-group"><h4>${escapeHtml(t(group))}</h4>${rendered[0]}${rendered.length > 1 ? `<details class="gr-other-relations" data-gr-relative-disclosure="${group}"><summary>${escapeHtml(t('Other family relationships'))} (${rendered.length - 1})</summary>${rendered.slice(1).join('')}</details>` : ''}</section>`;
    }).join('')}</section>`;
}
