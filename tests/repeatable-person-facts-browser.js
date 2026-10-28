const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.GENEO_BROWSER_PATH || process.env.GENEO_BROWSER_EXECUTABLE });
    try {
        for (const width of [1280, 390, 320]) {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'file:///E:/Geneograph/Concept/geneograph-prototype/src/index.html');
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver';
                const person = getPerson('silver');
                person.attributes = person.attributes.filter(record => !['EDUC', 'OCCU', 'FACT'].includes(record.tag));
                for (const tag of ['EDUC', 'OCCU', 'FACT']) for (let n = 1; n <= 3; n++)
                    person.attributes.push({ id: `repeat-${tag}-${n}`, tag, value: tag === 'OCCU' ? '' : `Value ${n}`,
                        type: tag === 'FACT' ? `Custom ${n}` : '', institutionName: tag === 'EDUC' ? `School ${n}` : '',
                        company: tag === 'OCCU' ? `Company ${n}` : '', notes: `Note ${n}`, mediaIds: ['preserved-media'], citations: [{ id: 'preserved-citation' }],
                        fromDate: n === 1 ? parseGenealogyDateTextAsType('1900', 'Exact date').value : null, toDate: null });
                rebuildSampleEventsAndPruneSourceLinks(); render();
                archiveFileById('af1').linkedEventIds.push('event-repeat-EDUC-2');
            });
            const targeted = await page.evaluate(async () => {
                const pane = document.querySelector('.tree-inspector');
                if (pane) pane.scrollTop = 300;
                const expectedScroll = pane?.scrollTop || 0;
                const event = sampleData.events.find(item => item.id === 'event-repeat-EDUC-2');
                openTimelinePersonEditor(event.editTarget);
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const focused = document.activeElement.closest('[data-repeat-entry]')?.dataset.repeatId;
                const entries = document.querySelectorAll('[data-repeat-entry]').length;
                document.querySelector('[data-repeat-id="repeat-EDUC-2"] [data-repeat-field="institutionName"]').value = 'Changed school';
                saveEditPersonModalValues('silver');
                await new Promise(resolve => setTimeout(resolve, 50));
                const records = getPerson('silver').attributes;
                return { focused, entries, first: records.find(record => record.id === 'repeat-EDUC-1').institutionName,
                    second: records.find(record => record.id === 'repeat-EDUC-2').institutionName,
                    evidence: archiveFileById('af1').linkedEventIds.includes('event-repeat-EDUC-2'),
                    metadata: records.find(record => record.id === 'repeat-EDUC-2').mediaIds,
                    citations: records.find(record => record.id === 'repeat-EDUC-2').citations,
                    expectedScroll, scroll: document.querySelector('.tree-inspector')?.scrollTop || 0,
                    selected: state.selectedPersonId };
            });
            assert.equal(targeted.focused, 'repeat-EDUC-2');
            assert.equal(targeted.entries, 9);
            assert.equal(targeted.first, 'School 1'); assert.equal(targeted.second, 'Changed school');
            assert.equal(targeted.evidence, true); assert.deepEqual(targeted.metadata, ['preserved-media']);
            assert.deepEqual(targeted.citations, [{ id: 'preserved-citation' }]);
            assert(Math.abs(targeted.scroll - targeted.expectedScroll) < 1);
            assert.equal(targeted.selected, 'silver');
            const validation = await page.evaluate(() => {
                openEditPersonModal('silver');
                const before = JSON.stringify(getPerson('silver'));
                addPersonFactToModal('customFact', 'silver');
                const blank = collectAddPersonAdditionalFacts('silver');
                const entry = document.querySelector('[data-repeat-list="FACT"] [data-repeat-entry]:last-child');
                entry.querySelector('input[id$="Value"]').value = 'Missing required name';
                document.querySelector('#addPersonFirstName').value = 'Must not save';
                saveEditPersonModalValues('silver');
                const unchanged = before === JSON.stringify(getPerson('silver'));
                closeModal({ force: true });
                return { blankRows: blank.repeatable.rows.length, unchanged };
            });
            assert.deepEqual(validation, { blankRows: 9, unchanged: true });
            const appended = await page.evaluate(() => {
                const person = getPerson('daisy');
                const before = Object.fromEntries(['EDUC', 'OCCU', 'FACT'].map(tag => [tag, person.attributes.filter(record => record.tag === tag).length]));
                openEditPersonModal('daisy');
                for (const kind of ['education', 'occupation', 'customFact']) for (let n = 0; n < 2; n++) {
                    const tag = document.querySelector(`[data-add-person-add-fact="${kind}"]`);
                    if (tag.disabled) throw new Error('Repeatable fact tag must stay enabled');
                    tag.click();
                    const entry = document.querySelector(`[data-repeat-list="${REPEATABLE_PERSON_FACTS[kind]}"] [data-repeat-entry]:last-child`);
                    if (kind === 'customFact') entry.querySelector('input[id$="Type"]').value = `New custom ${n}`;
                    else entry.querySelector(`[data-repeat-field="${kind === 'education' ? 'institutionName' : 'company'}"]`).value = `New record ${n}`;
                }
                saveEditPersonModalValues('daisy');
                return ['EDUC', 'OCCU', 'FACT'].map(tag => person.attributes.filter(record => record.tag === tag).length - before[tag]);
            });
            assert.deepEqual(appended, [2, 2, 2]);
            const derived = await page.evaluate(async () => {
                const childEvent = sampleData.events.find(event => event.type === 'childBirth' && event.personIds.includes('silver'));
                const key = `${childEvent.projectId}:${childEvent.id}`;
                timelineExpandedEvidence.add(key); render();
                document.querySelector(`[data-timeline-edit-fact="${childEvent.id}"]`).click();
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const focusedBirth = document.activeElement.matches('[data-genealogy-date-input]');
                const childId = childEvent.editTarget.personId;
                const input = document.querySelector('[data-genealogy-date-field="addPersonBirth"] [data-genealogy-date-input]');
                input.value = '2020'; saveEditPersonModalValues(childId);
                await new Promise(resolve => setTimeout(resolve, 50));
                const familyEvent = sampleData.events.find(event => event.type === 'marriage' && event.personIds.includes('silver'));
                openTimelinePersonEditor({ ...familyEvent.editTarget, personId: 'silver' });
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const relationshipTarget = document.activeElement.closest('[data-relationship-id]')?.dataset.relationshipId;
                closeModal({ force: true });
                return { focusedBirth, year: getPerson(childId).birth.first.year, selected: state.selectedPersonId,
                    expanded: timelineExpandedEvidence.has(key), relationshipTarget, familyId: familyEvent.familyId };
            });
            assert.equal(derived.focusedBirth, true); assert.equal(derived.year, 2020);
            assert.equal(derived.selected, 'silver'); assert.equal(derived.expanded, true);
            assert.equal(derived.relationshipTarget, derived.familyId);
            const period = await page.evaluate(() => {
                state.language = 'ru';
                const exact = parseGenealogyDateTextAsType('1900', 'Exact date').value;
                const about = parseGenealogyDateTextAsType('1905', 'About / Circa').value;
                return { until: timelineDateRangeLabel(null, exact), both: timelineDateRangeLabel(exact, exact),
                    qualified: timelineDateRangeLabel(about, exact),
                    company: timelineEventDetail(sampleData.events.find(event => event.id === 'event-repeat-OCCU-2'), 'silver') };
            });
            assert.match(period.until, /^До /); assert.match(period.both, / — /);
            assert.match(period.qualified, /^Начало:/); assert.match(period.qualified, /Окончание:/);
            assert.equal((period.company.match(/Company 2/g) || []).length, 1);
            const profile = await page.evaluate(async () => {
                state.language = 'en'; state.activeModule = 'People'; state.peopleView = 'profile'; state.selectedPeopleId = 'silver';
                state.peopleProfileEditing = true; state.peopleProfileEditTab = 'education'; renderPeople();
                const card = document.querySelector('.profile-full-card');
                const height = card.getBoundingClientRect().height;
                document.querySelector('[data-repeat-add="EDUC"]').click();
                const entry = document.querySelector('[data-repeat-list="EDUC"] [data-repeat-entry]:last-child');
                entry.querySelector('[data-repeat-field="institutionName"]').value = 'Fourth school';
                const collected = collectProfileEditSections();
                if (!collected.ok) throw new Error(JSON.stringify(collected));
                const changedSections = Object.keys(collected.payloads);
                applyProfileEditSections(selectedPeopleRecord(), collected.payloads);
                const serialized = JSON.parse(JSON.stringify(getPerson('silver')));
                return { count: getPerson('silver').attributes.filter(record => record.tag === 'EDUC').length,
                    serialized: serialized.attributes.filter(record => record.tag === 'EDUC').map(record => record.id),
                    height, after: card.getBoundingClientRect().height, changedSections,
                    scroll: card.querySelector('[data-profile-card-panel="education"]').scrollHeight > card.querySelector('[data-profile-card-panel="education"]').clientHeight,
                    custom: renderProfileLockedPanelContent(selectedPeopleRecord(), 'other').includes('Custom 3'),
                    place: Boolean(document.querySelector('[data-repeat-list="OCCU"] [data-place-combobox]')) };
            });
            assert.equal(profile.count, 4); assert.equal(profile.height, profile.after);
            assert.deepEqual(profile.changedSections, ['education']);
            assert.equal(new Set(profile.serialized).size, 4);
            assert.equal(profile.scroll, true); assert.equal(profile.custom, true); assert.equal(profile.place, true);
            const cancelledProfile = await page.evaluate(() => {
                const before = JSON.stringify(getPerson('silver').attributes);
                document.querySelector('[data-repeat-add="OCCU"]').click();
                const entry = document.querySelector('[data-repeat-list="OCCU"] [data-repeat-entry]:last-child');
                entry.querySelector('[data-repeat-field="company"]').value = 'Cancelled company';
                openTimelinePersonEditor(sampleData.events.find(event => event.id === 'event-repeat-EDUC-2').editTarget);
                const guarded = Boolean(document.querySelector('#manageRelationshipsDiscardOverlay'));
                document.querySelector('[data-manage-continue-editing]').click();
                cancelPeopleProfileEditing();
                return guarded && before === JSON.stringify(getPerson('silver').attributes);
            });
            assert.equal(cancelledProfile, true);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Repeatable person facts: passed at 1280, 390 and 320px');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
