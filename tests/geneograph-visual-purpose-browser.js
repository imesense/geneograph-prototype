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
            activateProject('p1', { moduleName: 'Geneograph' }); openGeneographBoard('gb1');
            const diagram = selectedGeneographDiagram();
            const partner = diagram.connections.find(item => item.kind === 'family-partner' && getGeneographFamily(item.familyId)?.children.length);
            window.purposePartnerId = partner.id;
            window.purposeTreeBefore = JSON.stringify({ people: sampleData.people, families: sampleData.families });
            const source = partner.source, target = partner.target;
            const familyCount = diagram.families.length;
            activateGeneographConnectionTool();
            geneoConnectionToolRuntime.purpose = 'visual';
            const valid = canCreateGeneographConnection(source, target, 'visual');
            const created = commitGeneographConnection(source, target);
            const duplicate = commitGeneographConnection(target, source);
            const visual = selectedGeneographDiagram().connections.find(item => item.kind === 'visual' && geneoConnectionReferencesMatch(item.source, source) && geneoConnectionReferencesMatch(item.target, target));
            const sameFamilies = selectedGeneographDiagram().families.length === familyCount;
            undoGeneographChange();
            activateGeneographConnectionTool();
            return { kind: valid.kind, created, duplicate, visual: Boolean(visual), sameFamilies, purpose: geneoConnectionToolRuntime.purpose };
        });
        assert.deepEqual(result, { kind: 'visual', created: true, duplicate: false, visual: true, sameFamilies: true, purpose: 'automatic' });
        await page.locator('[data-geneo-connection-purpose]').selectOption('visual');
        assert.equal(await page.evaluate(() => geneoConnectionToolRuntime.purpose), 'visual');
        const before = await page.evaluate(() => {
            const connection = getGeneographConnection(purposePartnerId);
            const family = getGeneographFamily(connection.familyId);
            const result = { source: connection.source, target: connection.target, route: connection.route,
                style: connection.style, parents: family.partnerIds, children: family.children.map(child => child.personId) };
            openGeneoMakeVisualConfirmation(connection);
            return result;
        });
        await page.locator('[data-geneo-confirm-visual]').click();
        const converted = await page.evaluate(() => {
            const connection = getGeneographConnection(purposePartnerId);
            return { kind: connection.kind, source: connection.source, target: connection.target,
                route: connection.route, style: connection.style,
                parentsRetained: selectedGeneographDiagram().families.flatMap(family => family.partnerIds.flatMap(parent => family.children.map(child => `${parent}:${child.personId}`))) };
        });
        assert.equal(converted.kind, 'visual');
        for (const key of ['source', 'target', 'route', 'style']) assert.deepEqual(converted[key], before[key]);
        for (const parent of before.parents) for (const child of before.children) assert.ok(converted.parentsRetained.includes(`${parent}:${child}`));
        await page.evaluate(() => undoGeneographChange());
        assert.equal(await page.evaluate(() => getGeneographConnection(purposePartnerId).kind), 'family-partner');
        const childLine = await page.evaluate(() => {
            const line = selectedGeneographDiagram().connections.find(item => item.kind === 'family-child' && item.source.familyId);
            openGeneoMakeVisualConfirmation(line);
            return { id: line.id, familyId: line.familyId, childId: geneoPersonIdForNode(line.target.nodeId) };
        });
        await page.locator('[data-geneo-confirm-visual]').click();
        assert.equal(await page.evaluate(id => getGeneographConnection(id).kind, childLine.id), 'visual');
        assert.equal(await page.evaluate(id => Boolean(getGeneographConnection(id).source.nodeId), childLine.id), true);
        assert.equal(await page.evaluate(({ familyId, childId }) => getGeneographFamily(familyId).children.some(child => child.personId === childId), childLine), false);
        await page.evaluate(() => undoGeneographChange());
        assert.equal(await page.evaluate(id => getGeneographConnection(id).kind, childLine.id), 'family-child');
        assert.equal(await page.evaluate(() => JSON.stringify({ people: sampleData.people, families: sampleData.families }) === purposeTreeBefore), true);
        assert.deepEqual(errors, []);
        console.log('Geneograph visual connection purpose passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
