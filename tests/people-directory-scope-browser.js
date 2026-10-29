const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const [width, language] of [[1600, 'en'], [900, 'ru'], [390, 'en'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                sampleData.projects.push({ ...sampleData.projects[0], id: 'people-scope-test', name: 'Empty project' });
                activateProject('p1', { moduleName: 'People' });
            }, language);
            assert.equal(await page.evaluate(() => peopleProjectSavedViews().length), 3);
            for (const id of ['whiskerfield-line', 'meowbridge-places', 'born-before-1900'])
            {
                const expected = await page.evaluate(id =>
                {
                    const view = peopleProjectSavedViews().find(view => view.id === id);
                    openPeopleSavedViewModal({ mode: 'edit', viewId: id });
                    return { name: translateText(view.name), description: translateText(view.description) };
                }, id);
                assert.equal(await page.locator('#peopleSavedViewName').inputValue(), expected.name);
                assert.equal(await page.locator('#peopleSavedViewDescription').inputValue(), expected.description);
                if (language === 'ru')
                {
                    assert.equal(await page.locator('#peopleSavedViewName').inputValue(), { 'whiskerfield-line': 'Фамилия Вискерфильд', 'meowbridge-places': 'Мяубридж', 'born-before-1900': 'Родившиеся до 1900 года' }[id]);
                }
                await page.locator('#peopleSavedViewForm [data-close]').click();
            }
            await page.evaluate(() => openPeopleSavedViewModal({ mode: 'edit', viewId: 'whiskerfield-line' }));
            await page.locator('#peopleSavedViewForm [type=submit]').click();
            assert.equal(await page.evaluate(() => peopleProjectSavedViews()[0].name), 'Whiskerfield surname');
            const retired = await page.evaluate(() =>
            {
                applyPeopleSavedView('born-before-1900');
                return { filters: state.peopleFilters, rows: filteredPeople().map(person => person.birth),
                    schema: peopleFilterSchema.map(field => field.key),
                    metadata: sampleData.people.some(person => Object.hasOwn(person.meta || {}, 'reviewStatus')) };
            });
            assert.deepEqual(retired.filters.birthYear, { mode: 'before', from: '1900', to: '' });
            assert.equal(retired.schema.includes('reviewStatus'), false);
            assert.equal(retired.metadata, false);
            assert.ok(retired.rows.length > 0);
            assert.deepEqual(await page.evaluate(() => peopleRecordsMatchingFilters([
                { id: 'before', birth: '1899', birthYear: 1899 },
                { id: 'boundary', birth: '1900', birthYear: 1900 },
                { id: 'after', birth: '1901', birthYear: 1901 },
                { id: 'undated', birth: '', birthYear: null }
            ], { birthYear: { mode: 'before', from: '1900', to: '' } }, '').map(person => person.id)), ['before']);
            await page.evaluate(() =>
            {
                state.peopleSearch = 'Whiskerfield';
                applyPeopleSavedView('whiskerfield-line');
                activateProject('people-scope-test', { moduleName: 'People' });
            });
            assert.equal(await page.evaluate(() => peopleProjectSavedViews().length), 0);
            assert.equal(await page.evaluate(() => state.peopleSearch), '');
            assert.equal(await page.evaluate(() => state.peopleSavedViewId), '');
            assert.equal(await page.locator('[data-people-add-first]').count(), 1);
            assert.ok(await page.locator('[data-people-select-visible]').first().isDisabled());
            const geometry = () => page.locator('.people-table-wrap').evaluate(element =>
            {
                const rect = element.getBoundingClientRect();
                return { top: rect.top, bottom: rect.bottom, height: rect.height };
            });
            const empty = await geometry();
            assert.ok(empty.height > 400, JSON.stringify(empty));
            await page.screenshot({ path: path.join(require('node:os').tmpdir(), `people-empty-${width}.png`) });
            await page.evaluate(() =>
            {
                applyPeopleSavedView('whiskerfield-line');
                deletePeopleSavedView('whiskerfield-line');
            });
            await page.locator('[data-people-add-first]').click();
            await page.locator('#addPersonFirstName').fill('First');
            await page.locator('[data-create-person]').click();
            await page.locator('[data-people-add-first]').waitFor({ state: 'detached' });
            assert.equal(await page.evaluate(() => peopleSavedViews.some(view => view.id === 'whiskerfield-line')), true);
            const populated = await geometry();
            assert.ok(Math.abs(populated.bottom - empty.bottom) < 2, JSON.stringify({ empty, populated }));
            await page.evaluate(() => { state.peoplePreviewCollapsed = true; renderPeople(); });
            assert.ok(Math.abs((await geometry()).bottom - empty.bottom) < 2);
            await page.evaluate(() => { state.peoplePreviewCollapsed = false; renderPeople(); });
            assert.equal(await page.locator('[data-people-add-first]').count(), 0);
            assert.equal(await page.locator('.people-actions-column .sr-only').count(), 1);
            assert.equal(await page.locator('.people-actions-column .sr-only').evaluate(element => getComputedStyle(element).clipPath), 'inset(50%)');
            await page.locator('.people-page-size-trigger').click();
            await page.locator('.people-page-size-menu [data-page-size="50"]').click();
            assert.equal(await page.evaluate(() => state.peopleRowsPerPage), 50);
            if (!await page.locator('#peopleSearch').isVisible()) await page.locator('[data-people-mobile-search]').click();
            await page.locator('#peopleSearch').fill('no-such-person');
            await page.locator('[data-people-clear-empty]').waitFor();
            await page.locator('[data-people-clear-empty]').click();
            assert.equal(await page.locator('[data-people-clear-empty]').count(), 0);
            await page.screenshot({ path: path.join(require('node:os').tmpdir(), `people-directory-${width}.png`) });
            if (width === 1600)
            {
                await page.evaluate(() => openPeopleSavedViewModal({ initialName: 'Whiskerfield surname', initialFilters: { surnames: ['Scope'] } }));
                await page.locator('#peopleSavedViewForm [type=submit]').click();
                await page.locator('#peopleSavedViewForm').waitFor({ state: 'detached' });
                const ownId = await page.evaluate(() => peopleProjectSavedViews()[0].id);
                assert.equal(await page.evaluate(() => peopleProjectSavedViews()[0].projectId), 'people-scope-test');
                await page.evaluate(() => activateProject('p1', { moduleName: 'People' }));
                assert.equal(await page.evaluate(id => peopleProjectSavedViews().some(view => view.id === id), ownId), false);
                await page.evaluate(id => deletePeopleSavedView(id), ownId);
                assert.equal(await page.evaluate(id => peopleSavedViews.some(view => view.id === id), ownId), true);
                await page.evaluate(() => activateProject('people-scope-test', { moduleName: 'People' }));
                await page.evaluate(id => deletePeopleSavedView(id), ownId);
                assert.equal(await page.evaluate(() => peopleProjectSavedViews().length), 0);
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('People project scope, empty state, stable height and page-size menu passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
