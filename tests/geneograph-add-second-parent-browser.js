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
        const result = await page.evaluate(() => {
            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            const diagram = selectedGeneographDiagram();
            const templateNode = diagram.nodes.find(node => node.type === 'person');
            const templatePerson = diagram.people.find(person => person.id === templateNode.personId);
            const makePerson = (id, x, y) => {
                const person = { ...structuredClone(templatePerson), id };
                const node = { ...structuredClone(templateNode), id: `node-${id}`, personId: id,
                    x, y, parentPanelId: null, name: id };
                diagram.people.push(person);
                diagram.nodes.push(node);
                return node;
            };
            const child = makePerson('test-child', 6200, 6500);
            const sibling = makePerson('test-sibling', 6700, 6500);
            const first = makePerson('test-first-parent', 6200, 6100);
            const second = makePerson('test-second-parent', 6700, 6100);
            connectGeneographCreatedRelative(child, first, 'father');
            const firstFamily = diagram.families.find(family => family.partnerIds.includes(first.personId));
            const originalLine = diagram.connections.find(connection => connection.familyId === firstFamily.id && connection.kind === 'family-child');
            originalLine.style = { width: 5, pattern: 'dashed' };
            originalLine.route = { mode: 'manual', waypoints: [{ x: 6300, y: 6300 }] };
            firstFamily.children.push({ personId: sibling.personId, parentageType: 'adoptive' });
            const placement = geneoRelativeNodePlacement(child, 'mother', second.width, second.height);
            const beside = Math.abs(placement.y - first.y) <= 20;
            const originalId = originalLine.id;
            geneoPushHistory();
            connectGeneographCreatedRelative(child, second, 'mother');
            touchGeneographBoard();
            const family = findGeneographFamilyForPartners(first.personId, second.personId);
            const line = diagram.connections.find(connection => connection.id === originalId);
            const paired = { partnerCount: diagram.connections.filter(connection =>
                    connection.familyId === family.id && connection.kind === 'family-partner').length,
                childCount: diagram.connections.filter(connection => connection.kind === 'family-child'
                    && connection.target?.nodeId === child.id).length,
                source: line.source, style: line.style, route: line.route,
                children: family.children.map(item => item.personId),
                formerChildren: firstFamily.children.map(item => item.personId), beside };
            undoGeneographChange();
            const undone = { familyCount: selectedGeneographDiagram().families.filter(item =>
                    item.partnerIds.includes(first.personId) && item.partnerIds.includes(second.personId)).length,
                lineFamilyId: getGeneographConnection(originalId).familyId };
            const currentDiagram = selectedGeneographDiagram();
            const existingPartner = createGeneographPartnerRelationship(first.personId, second.personId,
                { nodeId: first.id, port: 'right' }, { nodeId: second.id, port: 'left' });
            existingPartner.relationshipType = 'Separated';
            connectGeneographCreatedRelative(child, second, 'mother');
            const reused = { familyId: getGeneographConnection(originalId).familyId,
                status: existingPartner.relationshipType,
                partnerCount: currentDiagram.connections.filter(item => item.kind === 'family-partner'
                    && item.familyId === existingPartner.id).length };
            removeGeneographRelationship(originalId);
            createGeneographParentChildRelationship(first.personId, child.personId,
                { nodeId: first.id, port: 'bottom' }, { nodeId: child.id, port: 'top' });
            createGeneographParentChildRelationship(second.personId, child.personId,
                { nodeId: second.id, port: 'bottom' }, { nodeId: child.id, port: 'top' });
            const reconnected = currentDiagram.connections.filter(item => item.kind === 'family-child'
                && item.target?.nodeId === child.id).length;
            const another = { ...structuredClone(first), id: 'node-test-third-parent',
                personId: 'test-third-parent', x: 7200 };
            currentDiagram.people.push({ ...structuredClone(templatePerson), id: another.personId });
            currentDiagram.nodes.push(another);
            const ambiguous = geneoFirstParentForAddedParent(child, another.personId);
            connectGeneographCreatedRelative(child, another, 'parent');
            const thirdPaired = currentDiagram.families.some(item => item.partnerIds.includes(another.personId)
                && item.partnerIds.length === 2);
            const loneChild = { ...structuredClone(child), id: 'node-lone-child',
                personId: 'lone-child', x: 8000 };
            const loneFirst = { ...structuredClone(first), id: 'node-lone-first',
                personId: 'lone-first', x: 8000 };
            const loneSecond = { ...structuredClone(second), id: 'node-lone-second',
                personId: 'lone-second', x: 8500 };
            [loneChild, loneFirst, loneSecond].forEach(node => {
                currentDiagram.people.push({ ...structuredClone(templatePerson), id: node.personId });
                currentDiagram.nodes.push(node);
            });
            connectGeneographCreatedRelative(loneChild, loneFirst, 'father');
            const emptyFamilyId = currentDiagram.families.find(item =>
                item.partnerIds.length === 1 && item.partnerIds[0] === loneFirst.personId).id;
            connectGeneographCreatedRelative(loneChild, loneSecond, 'mother');
            const cleaned = !currentDiagram.families.some(item => item.id === emptyFamilyId);
            return { paired, undone, originalFamilyId: firstFamily.id,
                reused, existingPartnerId: existingPartner.id, reconnected,
                ambiguous: Boolean(ambiguous), thirdPaired, cleaned };
        });
        assert.equal(result.paired.partnerCount, 1);
        assert.equal(result.paired.childCount, 1);
        assert.deepEqual(result.paired.source, { familyId: result.paired.source.familyId, port: 'bottom' });
        assert.deepEqual(result.paired.style, { width: 5, pattern: 'dashed' });
        assert.deepEqual(result.paired.route, { mode: 'auto', waypoints: [] });
        assert.deepEqual(result.paired.children, ['test-child']);
        assert.deepEqual(result.paired.formerChildren, ['test-sibling']);
        assert.equal(result.paired.beside, true);
        assert.deepEqual(result.undone, { familyCount: 0, lineFamilyId: result.originalFamilyId });
        assert.deepEqual(result.reused, { familyId: result.existingPartnerId,
            status: 'Separated', partnerCount: 1 });
        assert.equal(result.reconnected, 2);
        assert.equal(result.ambiguous, false);
        assert.equal(result.thirdPaired, false);
        assert.equal(result.cleaned, true);
        assert.deepEqual(errors, []);
        await page.close();
    } finally {
        await browser.close();
    }
    process.stdout.write('Geneograph second-parent pairing passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
