const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;
const cases = [
    ['Projects', 'openCreateModal()'],
    ['Projects', 'openImportModal()'],
    ['Family Tree', 'openAddPhotosToPersonModal(state.selectedPersonId)'],
    ['People', 'openAddPhotosToPersonModal(state.selectedPeopleId)'],
    ['People', 'openConnectRelativeModal(state.selectedPeopleId)'],
    ['Albums', 'openNewAlbumModal()'],
    ['Albums', 'openAddPhotosModal()'],
    ['Albums', "openPhotoLightbox('photo-silver-luna-wedding')"],
    ['Albums', "openPhotoPeopleModal('photo-silver-luna-wedding')"],
    ['Archive', 'openArchiveCreateFolderModal()'],
    ['Archive', 'openArchiveCreateSourceModal()'],
    ['Notes', 'openNewCollectionModal()'],
    ['Places', 'openPlaceModal()'],
    ['Geneograph', 'openCreateGeneographBoardModal()']
];

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, height, language] of [[320, 568, 'en'], [390, 720, 'ru'], [540, 700, 'en'], [541, 700, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`);
            for (const [module, action] of cases)
            {
                await page.evaluate(({ module, action, language }) =>
                {
                    geneoTourClose({ offerRestore: false });
                    closeModal();
                    state.projectOpen = module !== 'Projects';
                    state.currentProjectId = 'p1';
                    state.activeModule = module;
                    state.language = language;
                    render();
                    eval(action);
                }, { module, action, language });
                const modal = page.locator('#modalBackdrop > .modal');
                assert.ok(await modal.count(), `${module} ${width}px opens`);
                const metrics = await modal.evaluate(element =>
                {
                    const box = element.getBoundingClientRect();
                    const close = element.querySelector('[data-close]')?.getBoundingClientRect();
                    const form = element.querySelector(':scope > form');
                    const body = element.querySelector('.modal-body');
                    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom,
                        scrollWidth: document.documentElement.scrollWidth,
                        footerBottom: element.querySelector('.modal-footer')?.getBoundingClientRect().bottom,
                        close: close ? { left: close.left, top: close.top, right: close.right, bottom: close.bottom } : null,
                        modalDisplay: getComputedStyle(element).display,
                        form: form ? { display: getComputedStyle(form).display, height: form.getBoundingClientRect().height,
                            flex: getComputedStyle(form).flex } : null,
                        body: body ? { height: body.getBoundingClientRect().height,
                            overflow: getComputedStyle(body).overflowY } : null };
                });
                if (process.env.GENEO_SCREENSHOT_DIR && width === 390)
                {
                    const slug = `${module}-${action}`.replace(/[^a-z0-9]+/gi, '-').slice(0, 64);
                    await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `${slug}.png`) });
                }
                if (width <= 540)
                {
                    assert.ok(Math.abs(metrics.left) <= 1 && Math.abs(metrics.top) <= 1
                        && Math.abs(metrics.right - width) <= 1 && Math.abs(metrics.bottom - height) <= 1,
                    `${module} ${width}px bounds ${JSON.stringify(metrics)}`);
                    assert.ok(metrics.scrollWidth <= width + 1, `${module} ${width}px horizontal overflow`);
                    if (metrics.close) assert.ok(metrics.close.left >= 0 && metrics.close.right <= width
                        && metrics.close.top >= 0 && metrics.close.bottom <= height,
                    `${module} ${width}px Close bounds ${JSON.stringify(metrics)}`);
                    if (metrics.footerBottom) assert.ok(metrics.footerBottom <= height + 1,
                        `${module} ${width}px footer bounds ${JSON.stringify(metrics)}`);
                }
                else
                {
                    assert.ok(metrics.left > 0 && metrics.right < width,
                        `${module} ${width}px stays contained`);
                }
                if (module === 'People' || module === 'Family Tree')
                {
                    if (action.includes('AddPhotos'))
                    {
                        assert.ok(await modal.locator('[data-person-photos-adder-save]').isVisible());
                        assert.ok(metrics.footerBottom <= height + 1, `${module} Add photos footer fits`);
                        await modal.locator('[data-person-photos-adder-tab="upload"]').click();
                        assert.ok(await modal.locator('[data-person-photos-adder-choose-files]').isVisible());
                        await modal.locator('[data-person-photos-adder-tab="project"]').click();
                    }
                }
                if (width === 390 && action.includes('AddPhotosToPerson'))
                {
                    await page.setViewportSize({ width, height: 420 });
                    assert.ok(await modal.evaluate(element =>
                    {
                        const box = element.getBoundingClientRect();
                        const footer = element.querySelector('.person-photos-adder-footer').getBoundingClientRect();
                        return Math.abs(box.height - innerHeight) <= 1 && footer.bottom <= innerHeight + 1;
                    }), `${module} shrinks with viewport`);
                    await page.setViewportSize({ width, height });
                }
            }
            assert.deepEqual(errors, [], `${width}px console errors`);
            await page.close();
        }
        for (const module of ['Family Tree', 'People'])
        {
            const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
            await page.goto(url);
            await page.evaluate(module =>
            {
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = module;
                render();
                openMobileSurface('details');
                openAddPhotosToPersonModal(module === 'People' ? state.selectedPeopleId : state.selectedPersonId);
            }, module);
            assert.ok(await page.locator('.person-photos-adder-modal').isVisible());
            assert.ok(await page.locator('#modalBackdrop').evaluate(backdrop =>
                getComputedStyle(backdrop).paddingLeft === '0px'), `${module} Details modal is edge to edge`);
            await page.locator('.person-photos-adder-modal [data-close]').first().click();
            assert.equal(await page.evaluate(() => mobileSurface), 'details');
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
