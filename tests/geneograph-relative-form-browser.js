const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
        await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            const diagram = selectedGeneographDiagram();
            const template = structuredClone(diagram.people[0]);
            diagram.people = []; diagram.nodes = []; diagram.families = []; diagram.connections = [];
            window.relativeFixture = (id, gender = 'male') => {
                const person = { ...structuredClone(template), id, treePersonId: null,
                    names: { first: id, middle: '', last: '', maiden: '' }, gender };
                selectedGeneographDiagram().people.push(person);
                return createGeneographPersonNodeForBoardPerson(person);
            };
            const father = relativeFixture('father');
            const mother = relativeFixture('mother', 'female');
            const lone = relativeFixture('lone');
            const family = createGeneographPartnerRelationship(father.personId, mother.personId,
                { nodeId: father.id, port: 'right' }, { nodeId: mother.id, port: 'left' });
            window.relativeIds = { father: father.id, mother: mother.id, lone: lone.id, family: family.id };
            window.treeBeforeRelative = JSON.stringify({ people: sampleData.people, families: sampleData.families });
            for (const type of ['parent', 'child', 'sibling']) {
                openGeneographPersonModal('', { relative: { anchorNodeId: father.id, type } });
                if (document.querySelector('#geneoPersonGender').value !== 'unknown') throw new Error(`${type} must default to Unknown`);
            }
            openGeneographPersonModal('', { relative: { anchorNodeId: father.id, type: 'son' } });
        });
        assert.equal(await page.locator('#geneoRelativeFamily').inputValue(), await page.evaluate(() => `family:${relativeIds.family}`));
        await page.locator('#geneoPersonFirstName').fill('Child');
        await page.locator('#geneoPersonFirstName').press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'geneoPersonMiddleName');
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'geneoPersonLastName');
        await page.locator('#geneoPersonForm').evaluate(form => form.requestSubmit());
        const childId = await page.evaluate(() => {
            const child = selectedGeneographDiagram().people.find(person => person.names.first === 'Child');
            const family = getGeneographFamily(relativeIds.family);
            if (!family.children.some(item => item.personId === child.id)) throw new Error('Child did not join couple');
            const node = selectedGeneographDiagram().nodes.find(item => item.personId === child.id);
            openGeneographPersonModal('', { relative: { anchorNodeId: node.id, type: 'sister' } });
            return child.id;
        });
        await page.locator('#geneoPersonFirstName').fill('Sibling');
        await page.locator('#geneoPersonForm').evaluate(form => form.requestSubmit());
        assert.equal(await page.evaluate(() => getGeneographFamily(relativeIds.family).children.length), 2);
        assert.equal(await page.evaluate(() => selectedGeneographDiagram().connections.some(item => item.kind === 'family-sibling')), false);
        await page.evaluate(() => openGeneographPersonModal('', { relative: { anchorNodeId: relativeIds.lone, type: 'brother' } }));
        assert.equal(await page.locator('#geneoRelativeFamily').inputValue(), 'unknown-father');
        await page.locator('#geneoPersonFirstName').fill('New brother');
        await page.locator('#geneoPersonAddAnother').check();
        await page.locator('#geneoPersonForm').evaluate(form => form.requestSubmit());
        assert.notEqual(await page.locator('#geneoRelativeFamily').inputValue(), 'unknown-father');
        assert.equal(await page.evaluate(() => selectedGeneographDiagram().people.filter(person => person.names.first === 'Unknown father').length), 1);
        await page.locator('#geneoPersonForm [data-close]').click();
        await page.evaluate(() => {
            const extra = relativeFixture('other partner', 'female');
            const father = getGeneographNode(relativeIds.father);
            createGeneographPartnerRelationship(father.personId, extra.personId,
                { nodeId: father.id, port: 'right' }, { nodeId: extra.id, port: 'left' });
            openGeneographPersonModal('', { relative: { anchorNodeId: father.id, type: 'daughter' } });
        });
        assert.equal(await page.locator('#geneoRelativeFamily').inputValue(), '');
        const before = await page.evaluate(() => geneoSnapshot());
        await page.locator('#geneoPersonForm').evaluate(form => form.requestSubmit());
        assert.equal(await page.evaluate(() => geneoSnapshot()), before);
        assert.equal(await page.locator('[data-geneo-relative-config]').getAttribute('open') !== null, true);
        await page.locator('#geneoPersonForm [data-close]').click();
        await page.evaluate(() => openGeneographPersonModal('', { relative: { anchorNodeId: relativeIds.lone, type: 'partner' } }));
        assert.equal(await page.locator('#geneoPersonAddAnother').count(), 0);
        await page.locator('#geneoPersonFirstName').fill('Partner');
        await page.locator('#geneoRelativePartnerType').selectOption('Separated');
        await page.locator('#geneoPersonForm').evaluate(form => form.requestSubmit());
        assert.equal(await page.evaluate(() => selectedGeneographDiagram().families.some(family => family.relationshipType === 'Separated')), true);
        await page.evaluate(childId => {
            const anchor = selectedGeneographDiagram().nodes.find(node => node.personId === childId);
            openGeneographPersonModal('', { relative: { anchorNodeId: anchor.id, type: 'sister' } });
            document.querySelector('#geneoRelativeType').value = 'Adoptive';
            geneoPersonPossibleMatchState.selectedPersonId = sampleData.people.find(person => person.projectId === currentProjectId() && !person.deleted).id;
            commitGeneographPersonPossibleMatch({ relative: { anchorNodeId: anchor.id, type: 'sister' } });
        }, childId);
        assert.equal(await page.evaluate(() => getGeneographFamily(relativeIds.family).children.filter(child => child.parentageType === 'adoptive').length), 1);
        await page.evaluate(() => undoGeneographChange());
        assert.equal(await page.evaluate(() => getGeneographFamily(relativeIds.family).children.filter(child => child.parentageType === 'adoptive').length), 0);
        const borrowed = await page.evaluate(childId => {
            const candidate = getGeneographPerson(childId);
            candidate.treePersonId = sampleData.people.find(person => person.projectId === currentProjectId() && !person.deleted).id;
            const anchor = relativeFixture('unparented sibling');
            const options = { relative: { anchorNodeId: anchor.id, type: 'sister' } };
            openGeneographPersonModal('', options);
            geneoPersonPossibleMatchState.selectedPersonId = candidate.treePersonId;
            commitGeneographPersonPossibleMatch(options);
            const selectedFamily = document.querySelector('#geneoRelativeFamily').value;
            commitGeneographPersonPossibleMatch(options);
            return { selectedFamily, connected: getGeneographFamily(relativeIds.family).children.some(child => child.personId === anchor.personId) };
        }, childId);
        assert.equal(borrowed.selectedFamily, await page.evaluate(() => `family:${relativeIds.family}`));
        assert.equal(borrowed.connected, true);
        for (const width of [390, 320]) {
            await page.setViewportSize({ width, height: 800 });
            await page.evaluate(() => {
                state.language = 'ru';
                openGeneographPersonModal('', { relative: { anchorNodeId: relativeIds.lone, type: 'daughter' } });
                document.querySelector('[data-geneo-relative-config]').open = true;
            });
            assert.equal(await page.locator('.geneo-person-modal').evaluate(modal => {
                const rect = modal.getBoundingClientRect();
                return rect.left >= 0 && rect.right <= innerWidth + 1 && modal.scrollWidth <= modal.clientWidth + 1;
            }), true);
            await page.locator('#geneoPersonForm [data-close]').click();
        }
        assert.equal(await page.evaluate(() => JSON.stringify({ people: sampleData.people, families: sampleData.families }) === treeBeforeRelative), true);
        assert.deepEqual(errors, []);
        console.log('Geneograph relative form passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
