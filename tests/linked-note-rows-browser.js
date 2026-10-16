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
        for (const [width, language] of [[320, 'en'], [390, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({
                viewport: { width, height: 800 },
                hasTouch: width <= 390,
                isMobile: width <= 390
            });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'http://localhost:8765/index.html');

            const result = await page.evaluate(language =>
            {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Notes' });
                setLanguage(language, false);

                const person = getPeople('p1').find(item => getNotesForPerson(item.id).length);
                const photo = (sampleData.media || []).find(item => item.projectId === 'p1'
                    && getNotesForPhoto(item.id, { projectId: 'p1' }).length);
                const place = (sampleData.places || []).find(item => item.projectId === 'p1'
                    && getNotesForPlace(item.id, { projectId: 'p1' }).length);
                const file = (sampleData.archiveFiles || []).find(item => item.projectId === 'p1'
                    && archiveFileNoteRecords(item).length);
                const related = (sampleData.notes || []).find(item => item.projectId === 'p1'
                    && getRelatedNotes(item.id, { projectId: 'p1' }).length);
                if (![person, photo, place, file, related].every(Boolean))
                {
                    throw new Error(`Expected linked-note sample records: ${JSON.stringify({
                        person: person?.id, photo: photo?.id, place: place?.id,
                        file: file?.id, related: related?.id
                    })}`);
                }

                state.selectedPlaceId = place.id;
                const samples = {
                    family: renderFamilyNotes(person),
                    people: renderProfileNoteRows(person),
                    albums: renderAlbumsPhotoNotes(photo),
                    places: renderPlaceInspectorNotes(getNotesForPlace(place.id, { projectId: 'p1' })),
                    archive: renderArchiveFileNotes(file, false),
                    notes: renderNoteRelatedSection(related)
                };
                const host = document.createElement('div');
                host.style.cssText = `position:fixed;z-index:99999;top:0;left:0;width:${innerWidth <= 390 ? innerWidth : 550}px;padding:12px;background:var(--surface-main);box-sizing:border-box`;
                document.body.append(host);
                const rows = Object.fromEntries(Object.entries(samples).map(([module, html]) =>
                {
                    host.innerHTML = html;
                    const row = host.querySelector('.notes-related-item');
                    return [module, {
                        found: Boolean(row),
                        icon: Boolean(row?.querySelector('.notes-related-icon')),
                        title: Boolean(row?.querySelector('.notes-related-title')),
                        excerpt: Boolean(row?.querySelector('.notes-related-excerpt')),
                        meta: row?.querySelector('.notes-related-meta')?.textContent.trim(),
                        open: Boolean(row?.querySelector('button.notes-related-main')),
                        unlink: Boolean(row?.querySelector('.relation-action-button')),
                        unlinkVisible: row?.querySelector('.relation-actions')
                            ? getComputedStyle(row.querySelector('.relation-actions')).opacity === '1'
                            : false,
                        overflow: host.scrollWidth > host.clientWidth
                    }];
                }));
                host.innerHTML = samples.family;
                bindConnectedNoteLinks(host);
                const familyOpen = host.querySelector('[data-connected-note-id]');
                const openedId = familyOpen.dataset.connectedNoteId;
                familyOpen.click();
                const opened = state.activeModule === 'Notes' && state.selectedNoteId === openedId;
                host.querySelector('[data-connected-note-unlink]').click();
                const unlinkConfirm = Boolean(modalBackdrop.querySelector('[data-confirm-connected-note-unlink]'));
                closeModal();
                host.remove();

                const browserNote = getNotesForPerson(person.id)[0];
                return {
                    rows,
                    opened,
                    unlinkConfirm,
                    browserMetadata: noteBrowserMetadata(browserNote),
                    browserCollections: renderNoteBrowserCollectionChips(browserNote),
                    relatedMetadata: relatedNotePermanentMetadata(related)
                };
            }, language);

            for (const [module, row] of Object.entries(result.rows))
            {
                assert(row.found && row.icon && row.title && row.excerpt && row.meta && row.open,
                    `${module}: ${JSON.stringify(row)}`);
                assert.equal(row.overflow, false, `${module} overflows at ${width}px`);
                assert.equal(row.unlink, true, `${module} unlink missing`);
                if (width <= 390) assert.equal(row.unlinkVisible, true, `${module} touch unlink hidden`);
                assert(!row.meta.includes('linked record'), `${module} linked-count metadata`);
            }
            assert(!result.browserMetadata.includes('linked record'));
            assert(!result.relatedMetadata.includes('linked record'));
            assert(result.browserMetadata.length);
            assert.equal(result.opened, true);
            assert.equal(result.unlinkConfirm, true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
