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
            assert.deepEqual(await page.evaluate(() => [state.activeModule, state.selectedPhotoId]), ['Albums', 'photo-silver-portrait']);
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
                assert.deepEqual(await page.evaluate(() => [state.projectOpen, state.activeModule]), [true, 'Projects']);
                await page.locator('[data-app-navigation="back"]').click();
                assert.equal(await page.evaluate(() => state.activeModule), 'People');
                await page.evaluate(() => navigateToProjectModule(currentProjectId(), 'Places'));
                assert.equal(await page.locator('[data-app-navigation="forward"]').isDisabled(), true, 'new navigation clears Forward');
                await page.evaluate(() => { appNavigation.back.push({ projectId: 'deleted-project', module: 'People' }); appNavigationUpdateControls(); });
                await page.locator('[data-app-navigation="back"]').click();
                assert.equal(await page.evaluate(() => state.activeModule), 'People', 'unavailable entry skipped');
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
                await page.locator('[data-app-navigation="back"]').click();
                assert.deepEqual(await page.evaluate(() => [state.currentProjectId, state.activeModule, state.selectedGeneoBoardId]), ['p1', 'Geneograph', 'gb1']);
                await page.locator('[data-app-navigation="forward"]').click();
                assert.equal(await page.evaluate(() => state.currentProjectId), 'navigation-test-project');
            }
            assert.ok(await page.locator('.topbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `header fits ${width}px`);
            assert.deepEqual(errors, [], `no errors at ${width}px`);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('App navigation browser flows passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
