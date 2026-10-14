const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;
const destinations = [
    ['People', null, 'People'],
    ['Albums', null, 'Albums'],
    ['Archive', 'files', 'Archive'],
    ['Notes', null, 'Notes'],
    ['Places', null, 'Places'],
    ['Archive', 'sources', 'Archive']
];

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const [width, language] of [[1440, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            for (const [moduleName, archiveView] of destinations) {
                await page.evaluate(language => {
                    if (geneoTourRuntime.active) geneoTourClose();
                    setLanguage(language, false);
                    activateProject('p1', { moduleName: 'Projects' });
                    state.openSide = 'overview';
                    render();
                }, language);
                const chip = page.locator(`.project-hero .stat-chips button[data-open-project-module="${moduleName}"]${archiveView ? `[data-open-project-archive-view="${archiveView}"]` : ':not([data-open-project-archive-view])'}`);
                assert.equal(await chip.count(), 1);
                const expectedCount = await page.evaluate(({ moduleName, archiveView }) => {
                    const projectId = currentProjectId();
                    if (moduleName === 'People') return getProjectPeopleCount(projectId);
                    if (moduleName === 'Albums') return getProjectPhotos(projectId).length;
                    if (moduleName === 'Notes') return getProjectNotes(projectId).length;
                    if (moduleName === 'Places') return projectPlaces(projectId).length;
                    if (archiveView === 'files') return connectedFilesForProject(projectId).length;
                    return sampleData.sources.filter(source => source.projectId === projectId).length;
                }, { moduleName, archiveView });
                const label = await chip.innerText();
                assert.equal(Number(label.match(/^\d+/)?.[0]), expectedCount);
                if (language === 'ru') assert.match(label, /[А-Яа-яЁё]/);
                await chip.focus();
                await page.keyboard.press('Enter');
                assert.equal(await page.evaluate(() => state.activeModule), moduleName);
                if (archiveView) assert.equal(await page.evaluate(() => state.archiveView), archiveView);
            }
            assert.deepEqual(errors, [], `${width} ${language}: browser errors`);
            await page.close();
        }
        console.log('Project overview tags navigate to their modules and Archive views.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
