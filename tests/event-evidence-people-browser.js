const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {})
    });

    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(process.env.GENEO_TEST_URL || 'http://localhost:8765/index.html');

        const result = await page.evaluate(() =>
        {
            if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
            activateProject('p1', { moduleName: 'Family Tree' });
            const eventId = 'event-rel-silver-luna-partner-rel-silver-luna-partner-marriage';
            const file = archiveFileById('af1');
            const sourceId = 'as6';
            const seeded = getArchiveFilesForPerson('silver').some(item => item.id === 'af7');

            const linkedFile = archiveSetConnection('file', file.id, 'event', eventId, true);
            const linkedSource = setSourceLink(sourceId, 'event', eventId, true, { projectId: 'p1' });
            const bothPeople = ['silver', 'luna'].every(personId =>
                getArchiveFilesForPerson(personId).some(item => item.id === file.id)
                && sourceIdsForTarget('person', personId, 'p1').includes(sourceId));
            const noDuplicates = file.linkedPersonIds.filter(id => id === 'silver').length === 1
                && sourceIdsForTarget('person', 'silver', 'p1').filter(id => id === sourceId).length === 1;

            archiveSetConnection('file', file.id, 'event', eventId, false);
            setSourceLink(sourceId, 'event', eventId, false, { projectId: 'p1' });
            const survivesEventUnlink = file.linkedPersonIds.includes('silver')
                && sourceIdsForTarget('person', 'silver', 'p1').includes(sourceId);

            archiveSetConnection('file', file.id, 'person', 'silver', false);
            setSourceLink(sourceId, 'person', 'silver', false, { projectId: 'p1' });
            const independentPersonUnlink = !file.linkedPersonIds.includes('silver')
                && !sourceIdsForTarget('person', 'silver', 'p1').includes(sourceId);

            const invalid = archiveSetConnectionsAtomically([
                { ownerType: 'file', ownerId: file.id, entityType: 'event', entityId: eventId, shouldLink: true },
                { ownerType: 'file', ownerId: file.id, entityType: 'event', entityId: 'missing-event', shouldLink: true }
            ]);
            const atomic = !invalid.ok && !file.linkedEventIds.includes(eventId)
                && !file.linkedPersonIds.includes('silver');
            const originalSetConnection = archiveSetConnection;
            let calls = 0;
            archiveSetConnection = function (...args)
            {
                calls += 1;
                return calls === 2 ? false : originalSetConnection(...args);
            };
            let failedBatch;
            try
            {
                failedBatch = archiveSetConnectionsAtomically([
                    { ownerType: 'file', ownerId: file.id, entityType: 'event', entityId: eventId, shouldLink: true },
                    { ownerType: 'file', ownerId: file.id, entityType: 'event', entityId: 'event-silver-birth', shouldLink: true }
                ]);
            }
            finally
            {
                archiveSetConnection = originalSetConnection;
            }
            const rolledBack = !failedBatch.ok && !file.linkedEventIds.includes(eventId)
                && !file.linkedPersonIds.includes('silver');
            const crossProject = !setSourceLink(sourceId, 'event', 'missing-event', true, { projectId: 'p2' });

            openAddFactOverlay(getPerson('silver'));
            document.querySelector('#timelineCustomFactType').value = 'Research finding';
            document.querySelector('#timelineCustomFactValue').value = 'Evidence propagation check';
            document.querySelector('[data-fact-add-file]').click();
            const search = document.querySelector('[data-connected-files-search]');
            search.value = 'pawford_household_register';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector('[data-connected-files-choice][value="af1"]').click();
            document.querySelector('[data-connected-files-save]').click();
            document.querySelector('[data-fact-add-source]').click();
            const factSourceChoice = document.querySelector('[data-target-source-choice]:not(:disabled)');
            const factSourceId = factSourceChoice.value;
            factSourceChoice.click();
            document.querySelector('[data-target-source-save]').click();
            document.querySelector('#timelineCustomFactForm button[type="submit"]').click();
            const factLinks = file.linkedEventIds.includes('event-fact-silver')
                && file.linkedPersonIds.includes('silver')
                && sourceIdsForTarget('event', 'event-fact-silver', 'p1').includes(factSourceId)
                && sourceIdsForTarget('person', 'silver', 'p1').includes(factSourceId);

            return { seeded, linkedFile, linkedSource, bothPeople, noDuplicates,
                survivesEventUnlink, independentPersonUnlink, atomic, rolledBack, crossProject, factLinks };
        });

        for (const [name, passed] of Object.entries(result))
        {
            assert.equal(passed, true, name);
        }
        assert.deepEqual(errors, []);
        await page.close();
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
