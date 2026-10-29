const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH });
    try {
        for (const [width, height] of [[1280, 900], [390, 800], [320, 560]]) for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'file:///E:/Geneograph/Concept/geneograph-prototype/src/index.html');
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false); activateProject('p1', { moduleName: 'Family Tree' });
            }, language);
            for (const type of ['notes', 'sources']) for (const stateName of ['available', 'linked', 'empty', 'search']) {
                await page.evaluate(({ type, stateName }) => {
                    window.__pickerOriginalNotes = sampleData.notes;
                    window.__pickerOriginalSources = sampleData.sources;
                    if (stateName === 'empty') { sampleData.notes = []; sampleData.sources = []; }
                    if (type === 'notes') openNoteLinkPickerModal({ projectId: 'p1',
                        existingNoteIds: stateName === 'linked' ? getProjectNotes('p1', { includeArchived: true }).map(note => note.id) : [],
                        onSave: () => ({ ok: true }), autoFocusSearch: false });
                    else openSourcesForTargetModal({ projectId: 'p1', targetType: 'person', targetId: 'silver',
                        draftSourceIds: stateName === 'linked' ? sampleData.sources.filter(source => source.projectId === 'p1').map(source => source.id) : [],
                        onDraftSave: () => true, autoFocusSearch: false });
                }, { type, stateName });
                const modal = page.locator(`[data-resource-picker="${type}"]`);
                if (stateName === 'search') await modal.locator('input[type="search"]').fill('__no_matching_record__');
                assert.equal(await modal.locator('[data-note-picker-results-meta],[data-target-source-results-meta]').count(), 0);
                if (stateName === 'linked') {
                    assert.ok(await modal.locator('[data-rp-check]:checked').count() > 0);
                    assert.equal(await modal.locator('[data-rp-check]:not(:checked)').count(), 0);
                    assert.ok(await modal.locator('[data-rp-action="save"]').isDisabled());
                } else if (stateName !== 'available') {
                    const layout = await modal.evaluate(modal => {
                        const results = modal.querySelector('.rp-content');
                        const empty = results.querySelector('.rp-empty');
                        const body = empty.getBoundingClientRect(), region = results.getBoundingClientRect();
                        const footer = modal.querySelector('.modal-footer').getBoundingClientRect();
                        const style = getComputedStyle(empty);
                        return { fills: body.height >= results.clientHeight - 21 && Math.abs(body.top - region.top) < 1,
                            solid: style.borderTopStyle === 'solid', background: style.backgroundColor,
                            expectedBackground: getComputedStyle(document.documentElement).getPropertyValue('--surface-main').trim(),
                            heading: getComputedStyle(empty.querySelector('h3')).fontSize,
                            description: getComputedStyle(empty.querySelector('p')).fontSize,
                            footerFits: footer.bottom <= innerHeight + 1,
                            overflow: modal.scrollWidth > modal.clientWidth };
                    });
                    assert.equal(layout.fills, true, `${type}/${stateName}/${width}/${language}: ${JSON.stringify(layout)}`);
                    assert.equal(layout.solid, true); assert.notEqual(layout.background, 'rgba(0, 0, 0, 0)');
                    assert.equal(layout.heading, '16px'); assert.equal(layout.description, '14px');
                    assert.equal(layout.footerFits, true); assert.equal(layout.overflow, false);
                } else {
                    const choice = modal.locator('[data-rp-check]').first();
                    await choice.click();
                    const count = modal.locator('.rp-selected');
                    assert.match(await count.innerText(), /1/);
                    assert.equal(await modal.locator('[data-note-picker-results-meta],[data-target-source-results-meta]').count(), 0);
                }
                await page.evaluate(() => { closeModal({ force: true }); sampleData.notes = window.__pickerOriginalNotes; sampleData.sources = window.__pickerOriginalSources; });
            }
            assert.deepEqual(errors, []); await page.close();
        }
        console.log('Note/source picker empty states passed in English/Russian at desktop and phone widths.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
