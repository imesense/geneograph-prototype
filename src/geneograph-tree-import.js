function geneoReviewButton(label, attributes = '', selected = false)
{
    return `<button type="button" class="gr-choice ${selected ? 'is-selected' : ''}" ${attributes} aria-pressed="${selected}">${escapeHtml(t(label))}</button>`;
}

function geneoReviewAvatar(person, boardPerson = false)
{
    if (!person) return '';
    const avatar = renderPersonAvatar(boardPerson ? geneoPersonAvatarModel(person) : person, 'small-avatar', { element: 'span' });
    return `<span class="gr-avatar" aria-hidden="true">${avatar}</span>`;
}

function geneoReviewIdentity(person, boardPerson = false)
{
    if (!person) return `<span class="gr-muted">${escapeHtml(t('Unavailable'))}</span>`;
    const name = boardPerson ? geneoPersonDisplayName(person) : connectPersonName(person);
    const dates = boardPerson ? geneoPersonLifeDates(person) : connectPersonLifeLine(person);
    return `<div class="gr-identity">${geneoReviewAvatar(person, boardPerson)}<span><strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong><small>${escapeHtml(dates || '')}</small></span></div>`;
}

function geneoReviewStatus(draft, person, plan)
{
    if (plan.errors.some(error => error.personId === person.id)) return { key: 'conflicts', label: 'Needs resolution', icon: icon.warning };
    if (plan.operations.some(operation => operation.personId === person.id || operation.ids?.includes(person.id)))
        return { key: 'staged', label: 'Changes selected', icon: icon.checklist };
    const choice = draft.choices.get(person.id);
    const tree = getPerson(choice);
    if (!tree || tree.deleted || tree.projectId !== draft.projectId)
        return { key: 'unlinked', label: person.treePersonId ? 'Tree record unavailable' : 'Board only', icon: person.treePersonId ? icon.warning : icon.people };
    if (geneoTreeImportFields(person, tree).length || plan.relations.some(relation => relation.ids.includes(person.id) && plan.statuses.get(relation.id) !== 'Same relationship'))
        return { key: 'differences', label: 'Differences to review', icon: icon.checklist };
    return { key: 'linked', label: 'Linked to Family Tree', icon: icon.link };
}

function geneoReviewRoleText(draft, personId)
{
    const role = geneoReviewRoles(draft.diagram, draft.anchorId).get(personId);
    if (!role) return t('Other board people');
    if (!role.path.length) return t('Anchor person');
    return role.path.map(edge =>
    {
        const from = draft.people.find(person => person.id === edge.from);
        const singular = { Parents: 'Parent of', Partners: 'Partner of', Children: 'Child of', Siblings: 'Sibling of' }[edge.role];
        const qualifier = edge.qualifier && !['biological', 'Biological'].includes(edge.qualifier)
            ? `${t(PARENT_CHILD_RELATIONSHIP_TYPES.find(type => type.toLowerCase() === edge.qualifier.toLowerCase()) || (edge.qualifier === 'unknown' ? 'Unknown' : edge.qualifier))} · ` : '';
        return `${qualifier}${t(singular)} ${geneoPersonDisplayName(from)}`;
    }).join(' / ');
}

function geneoReviewRail(draft, plan)
{
    const roles = geneoReviewRoles(draft.diagram, draft.anchorId);
    const query = draft.search.trim().toLocaleLowerCase();
    const groups = ['Anchor person', 'Parents', 'Partners', 'Children', 'Siblings', 'Extended family', 'Other board people'];
    let count = 0;
    const rows = groups.map(group =>
    {
        const people = draft.people.filter(person =>
        {
            const role = roles.get(person.id)?.group || 'Other board people';
            const status = geneoReviewStatus(draft, person, plan);
            return role === group && (draft.scope === 'board' || roles.has(person.id))
                && (!query || `${geneoPersonDisplayName(person)} ${geneoPersonLifeDates(person)}`.toLocaleLowerCase().includes(query))
                && (draft.status === 'all' || status.key === draft.status);
        });
        count += people.length;
        if (!people.length) return '';
        return `<section class="gr-rail-group"><h3>${escapeHtml(t(group))}</h3>${people.map(person =>
        {
            const status = geneoReviewStatus(draft, person, plan);
            return `<button type="button" class="gr-person ${draft.activePersonId === person.id ? 'is-selected' : ''}" data-gr-person="${escapeHtml(person.id)}" aria-current="${draft.activePersonId === person.id}">
                ${geneoReviewAvatar(person, true)}<span><strong title="${escapeHtml(geneoPersonDisplayName(person))}">${escapeHtml(geneoPersonDisplayName(person))}</strong><small>${escapeHtml(t(status.label))}</small></span><span class="gr-state ${status.key}" title="${escapeHtml(t(status.label))}" aria-hidden="true">${status.icon || icon.people}</span></button>`;
        }).join('')}</section>`;
    }).join('');
    return `<nav class="gr-rail" aria-label="${escapeHtml(t('People'))}"><div class="gr-scope" role="group" aria-label="${escapeHtml(t('Review scope'))}">
        ${geneoReviewButton('Family branch', 'data-gr-scope="branch"', draft.scope === 'branch')}${geneoReviewButton('Entire board', 'data-gr-scope="board"', draft.scope === 'board')}</div>
        <div class="gr-search-row"><input type="search" class="common-input" data-gr-search aria-label="${escapeHtml(t('Search board people'))}" placeholder="${escapeHtml(t('Search board people'))}" value="${escapeHtml(draft.search)}">
        <div class="gr-filter"><button type="button" class="icon-button ${draft.status !== 'all' ? 'active' : ''}" data-gr-filter-toggle aria-expanded="${Boolean(draft.filterOpen)}" aria-label="${escapeHtml(t('Filter review status'))}" title="${escapeHtml(t('Filter review status'))}">${icon.filter}</button>
        ${draft.filterOpen ? `<div class="gr-filter-menu" role="group" aria-label="${escapeHtml(t('Filter review status'))}">${[['all', 'All people'], ['unlinked', 'Board only'], ['linked', 'Linked to Family Tree'], ['differences', 'Differences to review'], ['staged', 'Changes selected'], ['conflicts', 'Needs resolution']].map(([key, label]) => geneoReviewButton(label, `data-gr-status="${key}"`, draft.status === key)).join('')}</div>` : ''}</div></div>
        ${draft.status !== 'all' ? `<button class="gr-text" type="button" data-gr-status="all">${escapeHtml(t('Clear status filter'))}: ${escapeHtml(t({ unlinked: 'Board only', linked: 'Linked to Family Tree', differences: 'Differences to review', staged: 'Changes selected', conflicts: 'Needs resolution' }[draft.status]))}</button>` : ''}
        <div class="gr-people-list">${rows}${!count ? `<p class="gr-muted">${escapeHtml(t('No people match these filters.'))}</p>` : ''}</div></nav>`;
}

function geneoReviewDuplicate(draft, personId, treeId)
{
    return draft.diagram.people.find(person => person.id !== personId
        && (draft.choices.has(person.id) ? draft.choices.get(person.id) : person.treePersonId) === treeId);
}

function geneoReviewCandidates(draft, person)
{
    if (draft.matchEditorOpenId !== person.id) return '';
    const query = draft.matchQueries.get(person.id) || '';
    const matches = geneoTreeImportMatches(person, draft.projectId, draft).filter(({ person: candidate, context }) =>
        !query || `${connectPersonName(candidate)} ${connectPersonLifeLine(candidate)} ${getPlaceEventDisplay(candidate.birth)} ${context.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return `<section class="gr-candidates"><label class="gr-label" for="grCandidateSearch">${escapeHtml(t('Link existing'))}</label><input id="grCandidateSearch" type="search" class="common-input" data-gr-match-search value="${escapeHtml(query)}" placeholder="${escapeHtml(t('Search by name, date, or place'))}">
        <div class="gr-candidate-list">${matches.map(({ person: candidate, context, strong, score }) =>
        {
            const duplicate = geneoReviewDuplicate(draft, person.id, candidate.id);
            const parents = sampleData.families.filter(family => family.projectId === draft.projectId && (family.childIds || []).includes(candidate.id))
                .flatMap(geneoReviewFamilyParents).map(id => getPerson(id)).filter(Boolean).map(connectPersonName);
            return `<div class="gr-candidate">${geneoReviewIdentity(candidate)}<div class="gr-candidate-context"><span class="${strong ? 'gr-strong' : 'gr-muted'}">${escapeHtml(t(strong ? 'Strong match' : score > 0 ? 'Possible match' : 'Project record'))}</span>${context.length ? `<small>${escapeHtml(t('Recorded family'))}: ${escapeHtml(context.join(', '))}</small>` : parents.length ? `<small>${escapeHtml(t('Parents'))}: ${escapeHtml([...new Set(parents)].join(', '))}</small>` : ''}</div>
            ${duplicate ? `<button type="button" class="gr-text" data-gr-locate="${escapeHtml(duplicate.id)}">${escapeHtml(t('Locate existing'))}</button>` : `<button type="button" class="gr-choice" data-gr-match="${escapeHtml(candidate.id)}">${escapeHtml(t('Choose person'))}</button>`}</div>`;
        }).join('') || `<p class="gr-muted">${escapeHtml(t('No matching records. Try another name or create a person.'))}</p>`}</div>
        <button type="button" class="gr-text" data-gr-match-close>${escapeHtml(t('Close search'))}</button></section>`;
}

function geneoReviewFactRows(draft, person, tree)
{
    const fields = geneoTreeImportFields(person, tree);
    const decisions = draft.fields.get(person.id) || new Map();
    if (!fields.length) return `<section class="gr-section"><h3>${escapeHtml(t('Facts'))}</h3><p class="gr-muted">${escapeHtml(t('No fact differences'))}</p></section>`;
    return `<section class="gr-section"><h3>${escapeHtml(t('Facts'))}</h3><div class="gr-comparison-head"><span>${escapeHtml(t('On board'))}</span><span>${escapeHtml(t('In Family Tree'))}</span></div>
        ${fields.map(([key, label, boardValue, treeValue]) =>
        {
            const source = decisions.get(key);
            const from = source === 'board' ? person : tree;
            const clear = source && geneoReviewFactEmpty(geneoReviewFact(from, key));
            return `<div class="gr-fact"><h4>${escapeHtml(t(label))}</h4><div class="gr-values">
                <button type="button" class="gr-value ${source === 'board' ? 'is-selected' : ''}" data-gr-fact="${key}" data-source="board" aria-pressed="${source === 'board'}" aria-label="${escapeHtml(`${t(label)}: ${t('Use board value')}, ${boardValue}`)}">${source === 'board' ? icon.check : ''}<span>${escapeHtml(boardValue)}</span></button>
                <button type="button" class="gr-value ${source === 'tree' ? 'is-selected' : ''}" data-gr-fact="${key}" data-source="tree" aria-pressed="${source === 'tree'}" aria-label="${escapeHtml(`${t(label)}: ${t('Use Tree value')}, ${treeValue}`)}">${source === 'tree' ? icon.check : ''}<span>${escapeHtml(treeValue)}</span></button></div>
                <div class="gr-result"><span>${escapeHtml(source ? `${t(source === 'board' ? 'In Family Tree' : 'On board')}: ${clear ? t('Clear value') : geneoReviewFactText(from, key)}` : t('Keep separate'))}</span>${source ? `<button type="button" class="gr-text" data-gr-fact="${key}" data-source="none">${escapeHtml(t('Reset'))}</button>` : ''}</div></div>`;
        }).join('')}</section>`;
}

function geneoReviewRelationTitle(draft, relation)
{
    const name = id => geneoPersonDisplayName(draft.people.find(person => person.id === id));
    if (relation.type === 'child') return `${name(relation.ids.at(-1))} · ${t('Child of')} ${relation.ids.slice(0, -1).map(name).join(' / ')}`;
    return `${relation.ids.map(name).join(' / ')} · ${t(relation.type === 'partner' ? 'Partners' : 'Siblings')}`;
}

function geneoReviewRelationDetail(draft, relation, source)
{
    if (relation.origin === 'tree' && source === 'board') return t('Not connected on board');
    if (relation.type === 'partner')
    {
        const family = relation.origin === 'tree' ? sampleData.families.find(item => item.id === relation.treeFamilyId)
            : source === 'board' ? draft.diagram.families.find(item => item.id === relation.familyId)
            : sampleData.families.find(item => item.projectId === draft.projectId && geneoReviewEqual(geneoReviewFamilyParents(item).sort(), relation.ids.map(id => draft.choices.get(id)).sort()));
        if (!family) return t('Not connected in Tree');
        const data = geneoReviewRelationshipData(family);
        const details = [t(data.relationshipType || 'Unknown relationship'), t(data.marriageType || ''), partnerRelationshipDateSummary(family).rangeLabel,
            ...data.events.map(event => event.placeText || getPlaceDisplay(event.placeId))];
        return details.filter(Boolean).join(' · ');
    }
    if (relation.type === 'sibling') return t('Choose the recorded parent family');
    if (relation.origin === 'tree')
    {
        const family = sampleData.families.find(item => item.id === relation.treeFamilyId);
        return [...new Set(relation.ids.slice(0, -1).map(id => t(parentChildRelationshipType(family, draft.choices.get(id), draft.choices.get(relation.ids.at(-1))))))].join(' / ');
    }
    const family = draft.diagram.families.find(item => item.id === relation.familyId);
    const child = family.children.find(item => item.personId === relation.ids.at(-1));
    return [...new Set(relation.ids.slice(0, -1).map(id => t(geneoReviewParentType(family, child, id) || 'Unavailable')))].join(' / ');
}

function geneoReviewRelations(draft, person, plan)
{
    const relations = plan.relations.filter(relation => relation.ids.includes(person.id));
    if (!relations.length) return '';
    const anchorReady = plan.mapping.has(draft.anchorId);
    return `<section class="gr-section"><h3>${escapeHtml(t('Family connections'))}</h3>${relations.map(relation =>
    {
        const choice = draft.relationChoices.get(relation.id);
        const ready = anchorReady && relation.ids.every(id => plan.mapping.has(id));
        const error = plan.errors.find(item => item.relationId === relation.id);
        const status = anchorReady ? plan.statuses.get(relation.id) : 'Resolve anchor identity';
        const missing = relation.ids.filter(id => !plan.mapping.has(id));
        const siblingFamilies = relation.type === 'sibling' ? sampleData.families.filter(family => family.projectId === draft.projectId
            && (family.childIds || []).some(id => relation.ids.map(personId => plan.mapping.get(personId)).includes(id))) : [];
        return `<article class="gr-relation"><h4>${escapeHtml(geneoReviewRelationTitle(draft, relation))}</h4><p class="gr-muted">${escapeHtml(geneoReviewRelationDetail(draft, relation, 'board'))}</p>
            <span class="gr-relation-status">${escapeHtml(t(status))}</span>
            ${relation.type === 'partner' && ready && status !== 'Not connected in Tree' ? `<p class="gr-muted">${escapeHtml(t('In Family Tree'))}: ${escapeHtml(geneoReviewRelationDetail(draft, relation, 'tree'))}</p>` : ''}
            ${relation.type === 'sibling' ? `<label class="gr-label">${escapeHtml(t('Parents involved'))}<select class="common-select" data-gr-sibling="${escapeHtml(relation.id)}"><option value="">${escapeHtml(t('Choose parent family'))}</option>${siblingFamilies.map(family =>
            {
                const parents = geneoReviewFamilyParents(family);
                const options = [{ id: family.id, names: parents }, ...(parents.length > 1 ? parents.map(id => ({ id: `${family.id}::${id}`, names: [id] })) : [])];
                return options.map(option => `<option value="${escapeHtml(option.id)}" ${draft.siblingFamilies.get(relation.id) === option.id ? 'selected' : ''}>${escapeHtml(option.names.map(id => connectPersonName(getPerson(id))).join(' / '))}</option>`).join('');
            }).join('')}</select></label>` : ''}
            ${relation.type === 'sibling' || relation.origin !== 'tree' && relation.type === 'child' && !geneoReviewParentType(draft.diagram.families.find(family => family.id === relation.familyId), draft.diagram.families.find(family => family.id === relation.familyId).children.find(child => child.personId === relation.ids.at(-1))) ? `<label class="gr-label">${escapeHtml(t('Relationship type'))}<select class="common-select" data-gr-parent-type="${escapeHtml(relation.id)}"><option value="">${escapeHtml(t('Choose relationship type'))}</option>${PARENT_CHILD_RELATIONSHIP_TYPES.map(type => `<option value="${type}" ${draft.parentTypes.get(relation.id) === type ? 'selected' : ''}>${escapeHtml(t(type))}</option>`).join('')}</select></label>` : ''}
            <div class="gr-actions">${geneoReviewButton('Keep separate', `data-gr-relation="${escapeHtml(relation.id)}" data-source="none"`, !choice)}
            ${relation.origin !== 'tree' ? geneoReviewButton(relation.type === 'sibling' || status === 'Not connected in Tree' ? 'Add to Tree' : 'Use board relationship', `data-gr-relation="${escapeHtml(relation.id)}" data-source="board" ${ready ? '' : 'disabled'}`, choice === 'board') : ''}
            ${relation.type !== 'sibling' && !['Not connected in Tree', 'Resolve identities first'].includes(status) ? geneoReviewButton(relation.origin === 'tree' ? 'Add connection to board' : 'Use Tree relationship', `data-gr-relation="${escapeHtml(relation.id)}" data-source="tree" ${ready ? '' : 'disabled'}`, choice === 'tree') : ''}</div>
            ${!anchorReady ? `<button type="button" class="gr-text" data-gr-person="${escapeHtml(draft.anchorId)}">${escapeHtml(t('Resolve anchor identity'))}</button>` : missing.map(id => `<button type="button" class="gr-text" data-gr-person="${escapeHtml(id)}">${escapeHtml(t('Resolve identity'))}: ${escapeHtml(geneoPersonDisplayName(draft.people.find(item => item.id === id)))}</button>`).join('')}
            ${error ? `<p class="gr-error">${escapeHtml(error.message)}</p>` : ''}</article>`;
    }).join('')}</section>`;
}

function geneoReviewPersonOperations(draft, person, plan, includeConnections = true)
{
    const operations = plan.operations.filter(operation => operation.personId === person.id || includeConnections && operation.ids?.includes(person.id));
    return operations.length ? `<ul class="gr-operation-list">${operations.map(operation => `<li>${escapeHtml(t(operation.label))}${operation.type === 'fact' ? ` · ${escapeHtml(t(operation.destination))}: <strong>${escapeHtml(operation.clear ? t('Clear value') : operation.value)}</strong>` : operation.type === 'relationship' ? ` · ${escapeHtml(geneoReviewRelationTitle(draft, plan.relations.find(relation => relation.id === operation.relationId)))} · ${escapeHtml(t(operation.source === 'board' ? 'In Family Tree' : 'On board'))}: ${escapeHtml(geneoReviewRelationDetail(draft, plan.relations.find(relation => relation.id === operation.relationId), operation.source))}${operation.clears?.length ? ` · <strong>${escapeHtml(t('Clear value'))}: ${escapeHtml(operation.clears.map(t).join(', '))}</strong>` : ''}` : ''}</li>`).join('')}</ul>` : `<p class="gr-muted">${escapeHtml(t('No changes selected'))}</p>`;
}

function geneoReviewPersonDetail(draft, plan)
{
    const person = draft.people.find(item => item.id === draft.activePersonId);
    if (!person) return '';
    const choice = draft.choices.get(person.id);
    const candidate = choice !== 'create' && choice !== 'skip' ? getPerson(choice) : null;
    const tree = candidate && !candidate.deleted && candidate.projectId === draft.projectId ? candidate : null;
    const original = getPerson(person.treePersonId);
    const canCreate = !original || original.deleted || original.projectId !== draft.projectId;
    const anchorReady = plan.mapping.has(draft.anchorId);
    return `<div class="gr-detail"><button type="button" class="gr-text gr-back-list" data-gr-list>${escapeHtml(t('Back to people'))}</button>
        <div class="gr-identities"><div><h3>${escapeHtml(t('On board'))}</h3>${geneoReviewIdentity(person, true)}</div><div><h3>${escapeHtml(t('In Family Tree'))}</h3>${tree ? geneoReviewIdentity(tree) : `<p class="gr-muted">${escapeHtml(t(choice === 'create' ? 'New person selected' : person.treePersonId ? 'Tree record unavailable' : 'No identity selected'))}</p>`}</div></div>
        <div class="gr-actions">${geneoReviewButton(tree ? 'Change link' : 'Link existing', 'data-gr-link', draft.matchEditorOpenId === person.id)}
        ${canCreate ? geneoReviewButton('Create in Tree', 'data-gr-create', choice === 'create') : ''}
        ${choice !== (person.treePersonId || 'skip') ? `<button type="button" class="gr-text" data-gr-identity-reset>${escapeHtml(t('Reset identity choice'))}</button>` : ''}</div>
        ${geneoReviewCandidates(draft, person)}
        ${person.id !== draft.anchorId ? `<section class="gr-section"><h3>${escapeHtml(t('Relationship to anchor'))}</h3><p>${escapeHtml(geneoReviewRoleText(draft, person.id))}</p>${!anchorReady ? `<button type="button" class="gr-text" data-gr-person="${escapeHtml(draft.anchorId)}">${escapeHtml(t('Resolve anchor identity'))}</button>` : ''}</section>` : ''}
        ${tree && (anchorReady || person.id === draft.anchorId) ? geneoReviewFactRows(draft, person, tree) : ''}
        ${geneoReviewRelations(draft, person, plan)}
        <section class="gr-section"><h3>${escapeHtml(t('Planned result'))}</h3>${geneoReviewPersonOperations(draft, person, plan)}</section></div>`;
}

function geneoReviewSummary(draft, plan)
{
    const ids = new Set(plan.operations.map(operation => operation.personId));
    return `<div class="gr-final"><h3>${escapeHtml(t('Review changes'))}</h3>${[...ids].map(id =>
    {
        const person = draft.people.find(item => item.id === id);
        return `<section class="gr-summary-person">${geneoReviewIdentity(person, true)}${geneoReviewPersonOperations(draft, person, plan, false)}<button type="button" class="gr-text" data-gr-person="${escapeHtml(id)}">${escapeHtml(t('Review person'))}</button></section>`;
    }).join('') || `<p class="gr-muted">${escapeHtml(t('No changes selected'))}</p>`}</div>`;
}

function geneoTreeImportRender()
{
    const draft = geneoTreeImportDraft;
    const modal = modalBackdrop.querySelector('.geneo-family-review');
    if (!draft || !modal) return;
    const plan = geneoTreeImportPreview(draft);
    const active = document.activeElement;
    const focusKey = active && modal.contains(active) ? active.dataset.grFocus : '';
    const selection = active instanceof HTMLInputElement ? active.selectionStart : null;
    const scrolls = ['.gr-rail', '.gr-detail', '.gr-final', '.gr-candidate-list'].map(selector => [selector, modal.querySelector(selector)?.scrollTop || 0]);
    const anchor = draft.people.find(person => person.id === draft.anchorId);
    const body = modal.querySelector('[data-gr-body]');
    modal.classList.toggle('gr-mobile-detail', draft.mobileDetail || draft.page === 'review');
    modal.querySelector('[data-gr-anchor]').innerHTML = `${geneoReviewIdentity(anchor, true)}<span class="gr-anchor-label">${escapeHtml(t('Anchor person'))}</span><button type="button" class="gr-text" data-gr-change-anchor aria-expanded="${Boolean(draft.changingAnchor)}">${escapeHtml(t('Change anchor'))}</button>
        ${draft.changingAnchor ? `<label class="gr-anchor-select">${escapeHtml(t('Choose anchor'))}<select class="common-select" data-gr-anchor-select>${draft.people.map(person => `<option value="${escapeHtml(person.id)}" ${person.id === draft.anchorId ? 'selected' : ''}>${escapeHtml(geneoPersonDisplayName(person))}</option>`).join('')}</select></label>` : ''}`;
    body.innerHTML = draft.page === 'review' ? geneoReviewSummary(draft, plan) : `${geneoReviewRail(draft, plan)}${geneoReviewPersonDetail(draft, plan)}`;
    modal.querySelector('[data-gr-error]').textContent = draft.error || plan.error || '';
    modal.querySelector('[data-gr-refresh]').hidden = !plan.errors.some(error => error.message === t('A reviewed record changed. Refresh the review to keep your choices and compare the latest values.'));
    const peopleCount = new Set(plan.operations.map(operation => operation.personId)).size;
    modal.querySelector('[data-gr-summary]').textContent = peopleCount ? `${peopleCount} ${t(peopleCount === 1 ? 'person with changes' : 'people with changes')}` : t('No changes selected');
    const next = modal.querySelector('[data-gr-next]');
    next.textContent = t(draft.page === 'review' ? 'Apply changes' : 'Review changes');
    next.disabled = !plan.patches.length || Boolean(plan.error);
    modal.querySelector('[data-gr-review-back]').hidden = draft.page !== 'review';
    for (const [selector, scroll] of scrolls) if (modal.querySelector(selector)) modal.querySelector(selector).scrollTop = scroll;
    modal.querySelectorAll('button, input, select').forEach(element =>
    {
        element.dataset.grFocus = [...element.attributes].filter(attribute => attribute.name.startsWith('data-gr-') && attribute.name !== 'data-gr-focus').map(attribute => `${attribute.name}:${attribute.value}`).join('|') + (element.dataset.source || '');
    });
    if (focusKey)
    {
        const target = [...modal.querySelectorAll('[data-gr-focus]')].find(element => element.dataset.grFocus === focusKey);
        target?.focus({ preventScroll: true });
        if (target instanceof HTMLInputElement && ['text', 'search'].includes(target.type) && selection !== null) target.setSelectionRange(selection, selection);
    }
}

function openGeneographTreeImport(options = {})
{
    const board = selectedGeneographBoard();
    const node = selectedGeneographNode();
    const startId = options.personId || (node?.type === 'person' ? node.personId : '');
    if (!board || board.projectId !== currentProjectId() || !board.diagram.people.some(person => person.id === startId)) return;
    geneoTreeImportDraft = geneoReviewDraft(board, startId);
    if (options.match) geneoTreeImportDraft.matchEditorOpenId = startId;
    openModal(`<div class="modal geneo-family-review" role="dialog" aria-modal="true" aria-labelledby="geneoReviewTitle">
        <header class="modal-header"><h2 id="geneoReviewTitle">${escapeHtml(t('Review board and Family Tree'))}</h2><button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></header>
        <div class="gr-anchor" data-gr-anchor></div><div class="gr-body" data-gr-body></div>
        <div class="gr-errors"><span role="alert" data-gr-error></span><button type="button" class="gr-text" data-gr-refresh hidden>${escapeHtml(t('Refresh review'))}</button></div>
        <footer class="modal-footer"><span class="gr-footer-summary" role="status" aria-live="polite" data-gr-summary></span><button type="button" class="gr-text" data-gr-review-back hidden>${escapeHtml(t('Back to people'))}</button><button type="button" class="button secondary" data-close>${escapeHtml(t('Cancel'))}</button><button type="button" class="button primary" data-gr-next>${escapeHtml(t('Review changes'))}</button></footer></div>`);
    const modal = modalBackdrop.querySelector('.geneo-family-review');
    modal.addEventListener('click', event =>
    {
        const draft = geneoTreeImportDraft;
        if (!draft) return;
        const dismissFilter = draft.filterOpen && !event.target.closest('.gr-filter');
        if (dismissFilter) draft.filterOpen = false;
        const button = event.target.closest('button');
        if (!button || button.disabled || button.hasAttribute('data-close'))
        { if (dismissFilter && !button?.hasAttribute('data-close')) geneoTreeImportRender(); return; }
        const person = draft.people.find(item => item.id === draft.activePersonId);
        draft.error = '';
        if (button.hasAttribute('data-gr-change-anchor')) draft.changingAnchor = !draft.changingAnchor;
        else if (button.hasAttribute('data-gr-scope')) draft.scope = button.dataset.grScope;
        else if (button.hasAttribute('data-gr-status')) { draft.status = button.dataset.grStatus; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-filter-toggle')) draft.filterOpen = !draft.filterOpen;
        else if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate'))
        {
            draft.activePersonId = button.dataset.grPerson || button.dataset.grLocate;
            draft.page = 'people'; draft.mobileDetail = true;
            if (button.hasAttribute('data-gr-locate')) { draft.scope = 'board'; draft.search = ''; draft.status = 'all'; }
        }
        else if (button.hasAttribute('data-gr-list')) draft.mobileDetail = false;
        else if (button.hasAttribute('data-gr-link')) draft.matchEditorOpenId = draft.matchEditorOpenId === person.id ? '' : person.id;
        else if (button.hasAttribute('data-gr-match-close')) draft.matchEditorOpenId = '';
        else if (button.hasAttribute('data-gr-create'))
        {
            draft.choices.set(person.id, draft.choices.get(person.id) === 'create' ? 'skip' : 'create');
            draft.fields.delete(person.id); draft.matchEditorOpenId = '';
        }
        else if (button.hasAttribute('data-gr-identity-reset'))
        {
            const tree = getPerson(person.treePersonId);
            draft.choices.set(person.id, tree && !tree.deleted && tree.projectId === draft.projectId ? tree.id : 'skip');
            draft.fields.delete(person.id);
        }
        else if (button.hasAttribute('data-gr-match'))
        {
            const treeId = button.dataset.grMatch;
            const duplicate = geneoReviewDuplicate(draft, person.id, treeId);
            if (duplicate) draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
            else { draft.choices.set(person.id, treeId); draft.fields.delete(person.id); draft.matchEditorOpenId = ''; }
        }
        else if (button.hasAttribute('data-gr-fact'))
        {
            if (!draft.fields.has(person.id)) draft.fields.set(person.id, new Map());
            const fields = draft.fields.get(person.id);
            const key = button.dataset.grFact;
            if (button.dataset.source === 'none' || fields.get(key) === button.dataset.source) fields.delete(key);
            else fields.set(key, button.dataset.source);
        }
        else if (button.hasAttribute('data-gr-relation'))
        {
            if (button.dataset.source === 'none' || draft.relationChoices.get(button.dataset.grRelation) === button.dataset.source) draft.relationChoices.delete(button.dataset.grRelation);
            else draft.relationChoices.set(button.dataset.grRelation, button.dataset.source);
        }
        else if (button.hasAttribute('data-gr-next'))
        {
            if (draft.page === 'review') { geneoTreeImportCommit(); return; }
            draft.page = 'review';
        }
        else if (button.hasAttribute('data-gr-review-back')) draft.page = 'people';
        else if (button.hasAttribute('data-gr-refresh'))
        {
            const current = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
            draft.baseline = geneoReviewRecordSnapshot(current);
            draft.diagram = structuredClone(current.diagram);
            const represented = new Set(current.diagram.nodes.filter(item => item.type === 'person').map(item => item.personId));
            draft.people = draft.diagram.people.filter(item => represented.has(item.id));
            draft.relations = geneoTreeImportRelations(draft.diagram, represented);
            geneoReviewPrepareTreeRelationIds(draft);
            for (const item of draft.people)
            {
                if (!draft.choices.has(item.id)) draft.choices.set(item.id, item.treePersonId || 'skip');
                if (!draft.newIds.has(item.id)) draft.newIds.set(item.id, createRuntimeId('person'));
                if (!draft.siblingFamilyIds.has(item.id)) draft.siblingFamilyIds.set(item.id, createRuntimeId('family'));
            }
            for (const family of draft.diagram.families)
                if (!draft.familyIds.has(family.id)) draft.familyIds.set(family.id, createRuntimeId('family'));
            if (!draft.people.some(item => item.id === draft.activePersonId)) draft.activePersonId = draft.anchorId;
        }
        else return;
        geneoTreeImportRender();
        if (button.hasAttribute('data-gr-link')) modal.querySelector('[data-gr-match-search]')?.focus();
        if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate'))
        {
            modal.querySelector('.gr-detail')?.scrollTo(0, 0);
            const heading = modal.querySelector('.gr-detail h3');
            if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
        }
        if (button.hasAttribute('data-gr-list')) modal.querySelector('.gr-person.is-selected')?.scrollIntoView({ block: 'nearest' });
    });
    modal.addEventListener('input', event =>
    {
        if (event.target.hasAttribute('data-gr-search')) geneoTreeImportDraft.search = event.target.value;
        else if (event.target.hasAttribute('data-gr-match-search')) geneoTreeImportDraft.matchQueries.set(geneoTreeImportDraft.activePersonId, event.target.value);
        else return;
        geneoTreeImportRender();
    });
    modal.addEventListener('change', event =>
    {
        const draft = geneoTreeImportDraft;
        if (event.target.hasAttribute('data-gr-anchor-select'))
        { draft.anchorId = event.target.value; draft.changingAnchor = false; }
        else if (event.target.hasAttribute('data-gr-sibling')) draft.siblingFamilies.set(event.target.dataset.grSibling, event.target.value);
        else if (event.target.hasAttribute('data-gr-parent-type')) draft.parentTypes.set(event.target.dataset.grParentType, event.target.value);
        else return;
        geneoTreeImportRender();
    });
    modal.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape' && geneoTreeImportDraft?.filterOpen)
        { event.preventDefault(); event.stopPropagation(); geneoTreeImportDraft.filterOpen = false; geneoTreeImportRender(); modal.querySelector('[data-gr-filter-toggle]')?.focus(); }
    });
    geneoTreeImportRender();
}
