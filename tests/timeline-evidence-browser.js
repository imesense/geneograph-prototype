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
            await page.evaluate(async () => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver';
                render();
            });
            await page.evaluate(language => setLanguage(language, false), language);
            const seed = await page.evaluate(async () => ({
                birth: archiveFileById('af7').linkedEventIds,
                marriage: archiveFileById('af5').linkedEventIds,
                html: renderFamilyTreeTimeline('silver')
            }));
            assert(seed.birth.includes('event-silver-birth'));
            assert(seed.marriage.length);
            assert(seed.html.includes('Evidence files'));
            assert.equal(seed.html.includes('Year unknown'), false);
            assert.equal(seed.html.includes('<h4'), false);
            assert.equal(await page.evaluate(async () => {
                const events = getFamilyTreeTimelineEvents('silver');
                const firstUndated = events.findIndex(event => !Number.isFinite(parseTimelineSortValue(event)));
                return firstUndated < 0 || events.slice(firstUndated).every(event => !Number.isFinite(parseTimelineSortValue(event)));
            }), true);
            const layout = await page.evaluate(async () => {
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
            const rows = await page.evaluate(async () => {
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
            const cancelled = await page.evaluate(async () => {
                const before = JSON.stringify(getPerson('silver').attributes);
                openAddFactOverlay(getPerson('silver'));
                const modal = document.querySelector('.add-person-modal');
                const bounds = modal.getBoundingClientRect();
                const entry = document.querySelector('[data-repeat-list="FACT"] [data-repeat-entry]:last-child');
                entry.querySelector('input[id$="Type"]').value = 'Cancelled fact';
                closeModal({ force: true });
                return { unchanged: before === JSON.stringify(getPerson('silver').attributes),
                    fits: bounds.left >= -1 && bounds.right <= innerWidth + 1 };
            });
            assert.equal(cancelled.unchanged, true);
            assert.equal(cancelled.fits, true);
            const saved = await page.evaluate(async () => {
                openAddFactOverlay(getPerson('silver'));
                const entry = document.querySelector('[data-repeat-list="FACT"] [data-repeat-entry]:last-child');
                entry.querySelector('input[id$="Type"]').value = 'Research finding';
                entry.querySelector('input[id$="Value"]').value = 'Matched household index';
                saveEditPersonModalValues('silver');
                const fact = getPerson('silver').attributes.find(record => record.type === 'Research finding');
                window.__factEventId = `event-${fact.id}`;
                document.querySelector(`[data-event-add-file="${window.__factEventId}"]`).click();
                const search = document.querySelector('[data-rp-search]');
                search.value = 'pawford_household_register';
                search.dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('[data-rp-check="af1"]').click();
                document.querySelector('[data-rp-action="save"]').click();
                await new Promise(resolve => setTimeout(resolve, 0));
                document.querySelector(`[data-event-manage-sources="${window.__factEventId}"]`).click();
                const source = document.querySelector('[data-rp-check]');
                const sourceId = source.value;
                source.click();
                document.querySelector('[data-rp-action="save"]').click();
                await new Promise(resolve => setTimeout(resolve, 0));
                return { event: sampleData.events.find(item => item.id === window.__factEventId),
                    fileLinked: archiveFileById('af1').linkedEventIds.includes(window.__factEventId),
                    sourceLinked: sourceIdsForTarget('event', window.__factEventId, 'p1').includes(sourceId) };
            });
            assert(saved.event); assert.equal(saved.fileLinked, true); assert.equal(saved.sourceLinked, true);
            const expanded = await page.evaluate(async () => {
                const toggle = document.querySelector(`[data-timeline-evidence-toggle="${window.__factEventId}"]`);
                toggle.click();
                const first = toggle.getAttribute('aria-expanded');
                rerenderPersonSidebarContext('tree', { preserveScroll: true });
                return { first, restored: document.querySelector(`[data-timeline-evidence-toggle="${window.__factEventId}"]`)?.getAttribute('aria-expanded') };
            });
            assert.deepEqual(expanded, { first: 'true', restored: 'true' });
            const pruned = await page.evaluate(async () => {
                openTimelinePersonEditor(sampleData.events.find(event => event.id === window.__factEventId).editTarget);
                document.querySelector(`[data-repeat-id="${window.__factEventId.slice(6)}"] [data-repeat-remove]`).click();
                saveEditPersonModalValues('silver');
                return { file: archiveFileById('af1').linkedEventIds.includes(window.__factEventId),
                    source: sourceIdsForTarget('event', window.__factEventId, 'p1').length };
            });
            assert.deepEqual(pruned, { file: false, source: 0 });
            const peopleTimeline = await page.evaluate(async () => {
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
