const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[320, 'ru'], [390, 'en'], [900, 'ru'], [1280, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'http://localhost:8765/index.html');
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver';
                render();
            });
            await page.evaluate(language => setLanguage(language, false), language);
            const seed = await page.evaluate(() => ({
                birth: archiveFileById('af7').linkedEventIds,
                marriage: archiveFileById('af5').linkedEventIds,
                html: renderFamilyTreeTimeline('silver')
            }));
            assert(seed.birth.includes('event-silver-birth'));
            assert(seed.marriage.length);
            assert(seed.html.includes('Evidence files'));
            assert.equal(seed.html.includes('Year unknown'), false);
            assert.equal(seed.html.includes('<h4'), false);
            assert.equal(await page.evaluate(() => {
                const events = getFamilyTreeTimelineEvents('silver');
                const firstUndated = events.findIndex(event => !Number.isFinite(parseTimelineSortValue(event)));
                return firstUndated < 0 || events.slice(firstUndated).every(event => !Number.isFinite(parseTimelineSortValue(event)));
            }), true);
            const layout = await page.evaluate(() => {
                timelineExpandedEvidence.add('p1:event-silver-birth');
                const host = document.createElement('div');
                host.style.cssText = `position:fixed;z-index:99999;top:0;left:0;width:${innerWidth <= 540 ? 320 : 550}px;padding:16px;background:var(--surface-main)`;
                host.innerHTML = renderFamilyTreeTimeline('silver');
                document.body.append(host);
                const item = host.querySelector('[data-timeline-evidence-toggle="event-silver-birth"]').closest('.timeline-item');
                const center = selector => {
                    const rect = item.querySelector(selector).getBoundingClientRect();
                    return rect.top + rect.height / 2;
                };
                const result = { dot: center('.timeline-dot'), date: center('.timeline-date'),
                    heading: center('.timeline-copy'), overflow: host.scrollWidth > host.clientWidth };
                const dotBox = item.querySelector('.timeline-dot').getBoundingClientRect();
                result.linesAligned = ['::before', '::after'].every(pseudo => {
                    const style = getComputedStyle(item, pseudo);
                    const probe = document.createElement('i');
                    probe.style.cssText = `position:absolute;grid-area:${style.gridArea};left:${style.left};top:${style.top};bottom:${style.bottom};width:${style.width};pointer-events:none`;
                    item.append(probe);
                    const rect = probe.getBoundingClientRect();
                    probe.remove();
                    return Math.abs(rect.left + rect.width / 2 - dotBox.left - dotBox.width / 2) < 1;
                });
                item.querySelector('.timeline-evidence').hidden = true;
                result.stable = Math.abs(center('.timeline-dot') - result.dot) < 1
                    && Math.abs(center('.timeline-date') - result.date) < 1
                    && Math.abs(center('.timeline-copy') - result.heading) < 1;
                host.remove();
                return result;
            });
            assert.equal(layout.overflow, false);
            assert.equal(layout.stable, true);
            assert.equal(layout.linesAligned, true);
            assert(Math.abs(layout.dot - layout.date) < 1, JSON.stringify(layout));
            assert(Math.abs(layout.dot - layout.heading) < 1, JSON.stringify(layout));
            const rows = await page.evaluate(() => {
                const file = archiveFileById('af7');
                const originalName = file.name;
                file.name = 'silver_birth_announcement_with_a_very_long_description_1998.png';
                const host = document.createElement('div');
                host.style.cssText = `position:fixed;z-index:99999;top:0;left:0;width:${innerWidth <= 540 ? 320 : 550}px;padding:16px;background:var(--surface-main)`;
                host.innerHTML = renderFamilyTreeTimeline('silver');
                document.body.append(host);
                const birth = host.querySelector('[data-timeline-evidence-toggle="event-silver-birth"]').closest('.timeline-item');
                const name = birth.querySelector('[data-event-open-file="af7"]');
                const compact = { overflow: host.scrollWidth > host.clientWidth,
                    clipped: name.scrollWidth > name.clientWidth,
                    title: name.title, whiteSpace: getComputedStyle(name).whiteSpace,
                    height: name.getBoundingClientRect().height };
                name.focus();
                const focused = { whiteSpace: getComputedStyle(name).whiteSpace,
                    height: name.getBoundingClientRect().height };
                file.name = originalName;
                host.remove();
                return { compact, focused };
            });
            assert.equal(rows.compact.overflow, false);
            assert.equal(rows.compact.clipped, true);
            assert.equal(rows.compact.whiteSpace, 'nowrap');
            assert(rows.compact.title.includes('very_long_description'));
            assert.equal(rows.focused.whiteSpace, 'normal');
            assert(rows.focused.height > rows.compact.height, JSON.stringify(rows));
            await page.evaluate(() => {
                const factEventId = 'event-fact-silver';
                openAddFactOverlay(getPerson('silver'));
                const bounds = document.querySelector('#timelineCustomFactForm').getBoundingClientRect();
                window.__factModalFits = bounds.left >= -1 && bounds.right <= innerWidth + 1;
                window.__factModalBounds = { left: bounds.left, right: bounds.right, width: innerWidth };
                document.querySelector('[data-fact-add-file]').click();
                document.querySelector('[data-connected-files-choice]')?.click();
                document.querySelector('[data-connected-files-save]')?.click();
                closeModal();
                window.__cancelledFactLinks = (sampleData.archiveFiles || []).some(file => (file.linkedEventIds || []).includes(factEventId));
            });
            assert.equal(await page.evaluate(() => window.__cancelledFactLinks), false);
            assert.equal(await page.evaluate(() => window.__factModalFits), true,
                JSON.stringify(await page.evaluate(() => window.__factModalBounds)));
            const saved = await page.evaluate(() => {
                openAddFactOverlay(getPerson('silver'));
                document.querySelector('#timelineCustomFactType').value = 'Research finding';
                document.querySelector('#timelineCustomFactValue').value = 'Matched household index';
                document.querySelector('[data-fact-add-file]').click();
                const search = document.querySelector('[data-connected-files-search]');
                search.value = 'pawford_household_register';
                search.dispatchEvent(new Event('input', { bubbles: true }));
                const file = [...document.querySelectorAll('[data-connected-files-choice]')]
                    .find(input => input.value === 'af1');
                if (!file) throw new Error('Expected sample file in picker');
                file.click();
                document.querySelector('[data-connected-files-save]').click();
                document.querySelector('[data-fact-add-source]').click();
                const source = document.querySelector('[data-target-source-choice]:not(:disabled)');
                if (!source) throw new Error('Expected source in picker');
                const sourceId = source.value;
                source.click();
                document.querySelector('[data-target-source-save]').click();
                document.querySelector('#timelineCustomFactForm button[type="submit"]').click();
                return { event: sampleData.events.find(item => item.id === 'event-fact-silver'),
                    fileLinked: archiveFileById('af1').linkedEventIds.includes('event-fact-silver'),
                    sourceLinked: sourceIdsForTarget('event', 'event-fact-silver', 'p1').includes(sourceId),
                    formOpen: Boolean(document.querySelector('#timelineCustomFactForm')) };
            });
            assert(saved.event);
            assert.equal(saved.fileLinked, true);
            assert.equal(saved.sourceLinked, true);
            assert.equal(saved.formOpen, false);
            const expanded = await page.evaluate(() => {
                const toggle = document.querySelector('[data-timeline-evidence-toggle="event-fact-silver"]');
                toggle?.click();
                const first = toggle?.getAttribute('aria-expanded');
                rerenderPersonSidebarContext('tree', { preserveScroll: true });
                return { first, restored: document.querySelector('[data-timeline-evidence-toggle="event-fact-silver"]')?.getAttribute('aria-expanded') };
            });
            assert.deepEqual(expanded, { first: 'true', restored: 'true' });
            const created = await page.evaluate(() => {
                openAddFactOverlay(getPerson('daisy'));
                document.querySelector('[data-fact-add-source]').click();
                document.querySelector('[data-target-source-create]').click();
                document.querySelector('[data-archive-source-title]').value = 'Temporary fact citation';
                document.querySelector('[data-archive-source-form] button[type="submit"]').click();
                const source = sampleData.sources.find(item => item.title === 'Temporary fact citation');
                const stagedText = document.querySelector('[data-fact-sources]')?.textContent;
                const staged = stagedText?.includes('Temporary fact citation');
                closeModal();
                return { id: source?.id, staged, stagedText, linked: sourceIdsForTarget('event', 'event-fact-daisy', 'p1').includes(source?.id) };
            });
            assert(created.id);
            assert.equal(created.staged, true, JSON.stringify({ width, language, created }));
            assert.equal(created.linked, false);
            const pruned = await page.evaluate(() => {
                removePersonAttribute(getPerson('silver'), 'FACT');
                rebuildSampleEventsAndPruneSourceLinks();
                return {
                    file: archiveFileById('af1').linkedEventIds.includes('event-fact-silver'),
                    source: sourceIdsForTarget('event', 'event-fact-silver', 'p1').length
                };
            });
            assert.deepEqual(pruned, { file: false, source: 0 });
            const peopleTimeline = await page.evaluate(() => {
                activateProject('p1', { moduleName: 'People' });
                state.peopleView = 'directory';
                state.selectedPeopleId = 'silver';
                renderPeople();
                const toggle = document.querySelector('[data-timeline-evidence-toggle="event-silver-birth"]');
                toggle?.click();
                return { found: Boolean(toggle), expanded: toggle?.getAttribute('aria-expanded') === 'true',
                    stored: timelineExpandedEvidence.has('p1:event-silver-birth') };
            });
            assert.equal(peopleTimeline.found, true);
            assert.equal(peopleTimeline.expanded, peopleTimeline.stored);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
