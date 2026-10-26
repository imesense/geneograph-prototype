const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 740 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => { state.projectOpen = false; state.currentProjectId = null; state.activeModule = 'Projects'; render(); });
            assert.equal(await page.locator('.app-navigation-controls').count(), 0, 'arrows are absent in the project library');
            await page.evaluate(() =>
            {
                if (typeof geneoTourClose === 'function') geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'People' });
                openPeopleProfileFromRow('silver');
            });
            assert.equal(await page.evaluate(() => state.peopleView), 'profile');
            await page.evaluate(() => openAlbumsForPhoto('photo-silver-portrait'));
            assert.equal(await page.evaluate(() => state.activeModule), 'Albums');
            assert.equal(await page.locator('[data-app-navigation="back"]').isEnabled(), true);
            assert.doesNotMatch(await page.locator('[data-app-navigation="back"]').getAttribute('title'), /GeneoGraph Project|Whiskerfield project/i, 'tooltip omits the project name');
            if (width <= 390) assert.ok(await page.locator('[data-app-navigation="back"]').evaluate(button =>
                button.getBoundingClientRect().width >= 44 && button.getBoundingClientRect().height >= 44), 'phone navigation has a 44px target');
            assert.ok(await page.locator('.app-navigation-controls').evaluate(group =>
            {
                const style = getComputedStyle(group);
                const iconStyle = getComputedStyle(group.querySelector('svg path'));
                return style.backgroundColor === 'rgba(0, 0, 0, 0)'
                    && style.borderTopWidth === '0px'
                    && style.borderRightWidth === '1px'
                    && Number.parseFloat(iconStyle.strokeWidth) >= 2.5;
            }), 'arrows are unboxed, with a separator and stronger strokes');
            assert.ok(await page.locator('.topbar').evaluate(bar =>
            {
                const arrows = bar.querySelector('.app-navigation-controls').getBoundingClientRect();
                const home = bar.querySelector('.home-tab').getBoundingClientRect();
                return arrows.right <= home.left || getComputedStyle(bar.querySelector('.home-tab')).display === 'none';
            }), 'app arrows precede Home');
            if (language === 'ru') assert.match(await page.locator('[data-app-navigation="back"]').getAttribute('aria-label'), /Назад/);
            await page.locator('[data-app-navigation="back"]').click();
            assert.deepEqual(await page.evaluate(() => [state.activeModule, state.peopleView, state.selectedPeopleId]), ['People', 'profile', 'silver']);
            await page.locator('[data-app-navigation="forward"]').click();
            assert.deepEqual(await page.evaluate(() => [state.activeModule, state.selectedPhotoId, state.albumsDetailCollapsed]), ['Albums', 'photo-silver-portrait', false]);
            await page.keyboard.press('Alt+ArrowLeft');
            assert.equal(await page.evaluate(() => state.activeModule), 'People');
            if (width === 1280)
            {
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Archive'));
                const backCount = await page.evaluate(() => appNavigation.back.length);
                await page.evaluate(() => { state.archiveView = 'sources'; state.archiveSelectedSourceId = 'as1'; renderArchive(); });
                assert.equal(await page.evaluate(() => appNavigation.back.length), backCount, 'Archive local changes do not add global entries');
                await page.evaluate(() =>
                {
                    state.archiveFileNameEditingId = 'draft';
                    state.archiveFileNameOriginal = 'unsaved name';
                    appNavigationGo('back');
                });
                assert.equal(await page.locator('#modalBackdrop.open').count(), 1, 'dirty Archive edit is guarded');
                assert.equal(await page.evaluate(() => state.activeModule), 'Archive');
                assert.equal(await page.evaluate(() => appNavigation.back.length), backCount, 'cancel does not consume history');
                await page.locator('#modalBackdrop [data-close]').click();
                await page.evaluate(() => { state.archiveFileNameEditingId = ''; state.archiveFileNameOriginal = ''; });
                await page.keyboard.press('Alt+ArrowLeft');
                assert.equal(await page.evaluate(() => state.activeModule), 'People', 'global shortcut wins in Archive');
                await page.locator('[data-app-navigation="forward"]').click();
                assert.deepEqual(await page.evaluate(() => [state.archiveView, state.archiveSelectedSourceId]), ['sources', 'as1']);
                await page.locator('[data-app-navigation="back"]').click();
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Projects'));
                await page.evaluate(() => { state.projectOpen = false; state.currentProjectId = null; state.activeModule = 'Projects'; render(); });
                assert.equal(await page.locator('.app-navigation-controls').count(), 0);
                await page.keyboard.press('Alt+ArrowLeft');
                assert.deepEqual(await page.evaluate(() => [state.projectOpen, state.activeModule, appNavigation.back.length, appNavigation.forward.length]), [false, 'Projects', 0, 0]);
                await page.evaluate(() => activateProject('p1', { moduleName: 'People' }));
                assert.equal(await page.locator('[data-app-navigation="back"]').isDisabled(), true, 'reopening a project starts fresh history');
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Places'));
                assert.equal(await page.locator('[data-app-navigation="forward"]').isDisabled(), true, 'new navigation clears Forward');
                await page.evaluate(() => { appNavigation.back.push({ projectId: 'deleted-project', module: 'People' }); appNavigationUpdateControls(); });
                await page.locator('[data-app-navigation="back"]').click();
                assert.equal(await page.evaluate(() => state.activeModule), 'People', 'unavailable entry skipped');
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Family Tree'));
                const treeStart = await page.evaluate(() => ({ focus: treeProjectViewState().focusPersonId, selected: state.selectedPersonId }));
                await page.evaluate(() => navigateFamilyTreeToPerson('barnaby', { center: false }));
                await page.evaluate(() => navigateFamilyTreeToPerson('daisy', { center: false }));
                assert.equal(await page.evaluate(() => state.selectedPersonId), 'daisy');
                await page.locator('[data-app-navigation="back"]').click();
                assert.equal(await page.evaluate(() => state.selectedPersonId), 'barnaby', 'same-branch selections have separate steps');
                await page.locator('[data-app-navigation="back"]').click();
                assert.deepEqual(await page.evaluate(() => ({ focus: treeProjectViewState().focusPersonId, selected: state.selectedPersonId })), treeStart);
                await page.locator('[data-app-navigation="forward"]').click();
                assert.equal(await page.evaluate(() => state.selectedPersonId), 'barnaby');
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Geneograph'));
                await page.evaluate(() => openGeneographBoard('gb1'));
                assert.deepEqual(await page.evaluate(() => [state.geneoView, state.selectedGeneoBoardId]), ['board', 'gb1']);
                await page.locator('[data-app-navigation="back"]').click();
                assert.deepEqual(await page.evaluate(() => [state.activeModule, state.geneoView]), ['Geneograph', 'home']);
                await page.locator('[data-app-navigation="forward"]').click();
                assert.deepEqual(await page.evaluate(() => [state.geneoView, state.selectedGeneoBoardId]), ['board', 'gb1']);
                await page.evaluate(() =>
                {
                    sampleData.projects.push({ ...sampleData.projects[0], id: 'navigation-test-project', name: 'Other project' });
                    activateProject('navigation-test-project', { moduleName: 'Projects' });
                });
                assert.equal(await page.locator('[data-app-navigation="back"]').isDisabled(), true, 'switching projects resets history');
                assert.equal(await page.evaluate(() => state.currentProjectId), 'navigation-test-project');
            }
            assert.ok(await page.locator('.topbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `header fits ${width}px`);
            await page.evaluate(() =>
            {
                sampleData.projects.push({ ...sampleData.projects[0], id: 'remaining-project', name: 'Remaining project' });
                deleteProject(currentProjectId());
            });
            assert.deepEqual(await page.evaluate(() => [state.projectOpen, state.currentProjectId, state.selectedProjectId, state.activeModule]),
                [false, null, '', 'Projects'], 'deletion returns to the library without opening a remaining project');
            assert.ok(await page.evaluate(() => sampleData.projects.length > 0), 'other projects remain available');
            assert.equal(await page.locator('.app-navigation-controls').count(), 0, 'project navigation is hidden after deletion');
            assert.deepEqual(errors, [], `no errors at ${width}px`);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('App navigation browser flows passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
