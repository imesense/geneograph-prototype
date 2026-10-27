const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        const result = await page.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'People' });
            const base = getPerson('silver');
            const make = id =>
            {
                const person = structuredClone(base);
                person.id = id;
                person.names = { ...person.names, first: id, display: id };
                sampleData.people.push(person);
                return person;
            };
            make('sibling-a');
            make('sibling-b');
            make('sibling-c');
            make('sibling-d');
            const firstChoice = defaultParentFamilySelection('sibling-a', 'sibling');
            const first = connectPeopleByRelationship({ anchorPersonId: 'sibling-a',
                relativePersonId: 'sibling-b', relationshipType: 'sibling',
                parentFamilySelection: firstChoice });
            const father = getParents('sibling-a')[0];
            const inheritedChoice = defaultParentFamilySelection('sibling-c', 'sibling', '', 'sibling-b');
            const inherited = connectPeopleByRelationship({ anchorPersonId: 'sibling-c',
                relativePersonId: 'sibling-b', relationshipType: 'sibling',
                parentFamilySelection: inheritedChoice, detailType: 'Adoptive' });
            const shared = validateSiblingConnection('sibling-a', 'sibling-c', inheritedChoice);
            const otherParent = make('different-parent');
            createParentChildFamily(otherParent.id, 'sibling-d');
            const beforeConflict = centralFamilyRecords().length;
            const conflict = validateSiblingConnection('sibling-a', 'sibling-d', '');
            openAddPersonModal('Add person', '');
            const defaultGender = document.querySelector('#addPersonGender')?.value;
            return { first: first.ok, inherited: inherited.ok, shared: shared.message,
                conflict: conflict.message, noWrites: centralFamilyRecords().length === beforeConflict,
                father: { role: father.meta?.placeholderRole, gender: father.gender,
                    living: father.livingStatus, name: father.names.display },
                parentA: parentIdsForPerson('sibling-a'),
                parentC: parentIdsForPerson('sibling-c'),
                inheritedType: parentChildRelationshipType(inherited.family, father.id, 'sibling-c'),
                defaultGender };
        });
        assert.equal(result.first, true);
        assert.equal(result.inherited, true);
        assert.equal(result.father.role, 'father');
        assert.equal(result.father.gender, 'male');
        assert.equal(result.father.living, 'Unknown');
        assert.equal(result.father.name, 'Unknown father');
        assert.equal(result.parentA.length, 1);
        assert.deepEqual(result.parentC, result.parentA);
        assert.equal(result.inheritedType, 'Adoptive');
        assert.match(result.shared, /already share/);
        assert.match(result.conflict, /different recorded parents/);
        assert.equal(result.noWrites, true);
        assert.equal(result.defaultGender, 'Male');

        const creation = await page.evaluate(() =>
        {
            closeModal({ force: true });
            const base = getPerson('silver');
            const anchor = structuredClone(base);
            anchor.id = 'new-sibling-anchor';
            anchor.names = { ...anchor.names, first: 'Anchor', display: 'Anchor' };
            sampleData.people.push(anchor);
            const options = { relativeType: 'sibling', personId: anchor.id };
            const peopleBefore = sampleData.people.length;
            openAddPersonModal('Add sibling', '', options);
            const selection = document.querySelector('#addPersonParentFamily')?.value;
            const hint = document.querySelector('[data-parent-family-selector] .field-help')?.textContent.trim();
            const typeFixed = document.querySelector('#addPersonConnectionDetailType')?.disabled
                && document.querySelector('#addPersonConnectionDetailType')?.value === 'Biological';
            closeModal({ force: true });
            const cancelled = sampleData.people.length === peopleBefore;
            openAddPersonModal('Add sibling', '', options);
            document.querySelector('#addPersonFirstName').value = 'New';
            document.querySelector('#addPersonLastName').value = 'Sibling';
            const saved = commitAddPersonModalCreate('Add sibling', '', options);
            const parents = parentIdsForPerson(anchor.id);
            return { selection, hint, typeFixed, cancelled, saved: saved?.ok,
                newSiblingParents: parentIdsForPerson(saved?.person?.id),
                anchorParents: parents,
                fatherRole: getPerson(parents[0])?.meta?.placeholderRole,
                biological: parentChildRelationshipType(saved?.connectionResult?.family,
                    parents[0], saved?.person?.id) };
        });
        assert.equal(creation.selection, '__unknown_father__');
        assert.match(creation.hint, /unknown father/);
        assert.equal(creation.typeFixed, true);
        assert.equal(creation.cancelled, true);
        assert.equal(creation.saved, true);
        assert.deepEqual(creation.newSiblingParents, creation.anchorParents);
        assert.equal(creation.fatherRole, 'father');
        assert.equal(creation.biological, 'Biological');

        const localeAndChoice = await page.evaluate(() =>
        {
            setLanguage('ru', false);
            const father = getPerson(parentIdsForPerson('new-sibling-anchor')[0]);
            const localizedName = translateText(father.names.display);
            const unparented = structuredClone(getPerson('sibling-c'));
            unparented.id = 'unparented-for-connect';
            sampleData.people.push(unparented);
            openConnectRelativeModal(unparented.id);
            document.querySelector('[data-connect-relationship]').value = 'sibling';
            document.querySelector('[data-connect-relationship]').dispatchEvent(new Event('change'));
            const noChoiceBeforeSelection = !document.querySelector('.connect-person-modal [data-parent-family-selector]');
            return { localizedName, noChoiceBeforeSelection };
        });
        assert.equal(localeAndChoice.localizedName, 'Неизвестный отец');
        assert.equal(localeAndChoice.noChoiceBeforeSelection, true);
        const possibleMatch = await page.evaluate(() =>
        {
            closeModal({ force: true });
            setLanguage('en', false);
            const options = { relativeType: 'sibling', personId: 'unparented-for-connect' };
            const fathersBefore = getPeople(currentProjectId()).filter(person =>
                person.meta?.placeholderRole === 'father').length;
            openAddPersonModal('Add sibling', '', options);
            document.querySelector('#addPersonFirstName').value = 'sibling-b';
            document.querySelector('#addPersonLastName').value = 'Whiskerfield';
            refreshAddPersonPossibleMatchesCard(options);
            selectAddPersonPossibleMatch('sibling-b', options);
            const selected = addPersonPossibleMatchState.selectedPersonId;
            const selectedFamily = document.querySelector('#addPersonParentFamily')?.value;
            const configurable = !document.querySelector('#addPersonConnectionDetailType')?.disabled;
            commitAddPersonPossibleMatchAction(options);
            return { selected, selectedFamily, configurable,
                parents: parentIdsForPerson('unparented-for-connect'),
                siblingParents: parentIdsForPerson('sibling-b'),
                fathersBefore,
                fathersAfter: getPeople(currentProjectId()).filter(person =>
                    person.meta?.placeholderRole === 'father').length };
        });
        assert.equal(possibleMatch.selected, 'sibling-b');
        assert.ok(possibleMatch.selectedFamily);
        assert.equal(possibleMatch.configurable, true);
        assert.deepEqual(possibleMatch.parents, possibleMatch.siblingParents);
        assert.equal(possibleMatch.fathersAfter, possibleMatch.fathersBefore);
        assert.deepEqual(errors, []);
        await page.close();
        console.log('Sibling parent selection passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
