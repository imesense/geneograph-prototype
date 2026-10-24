const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {})
    });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                selectGeneographCanvas();
                renderGeneographEditorPreserveScroll();
                document.body.classList.toggle('mobile-details-open', window.innerWidth < 900);
            }, language);
            const inspector = page.locator('.geneo-inspector');
            const originalName = await page.evaluate(() => selectedGeneographBoard().title);
            const displayedName = await page.evaluate(() => localizedDataFieldValue(selectedGeneographBoard().title));
            assert.equal(await page.locator('.geneo-current-board-summary').count(), 0);
            assert.equal(await page.locator('.geneo-board-panel > .geneo-sidebar-section').count(), 3);
            assert.equal((await inspector.locator('.geneo-inspector-title h2').textContent()).trim(), displayedName);
            assert.equal(await inspector.locator('.geneo-inspector-title h2').getAttribute('title'), displayedName);
            assert.equal(await inspector.locator('[data-geneo-settings]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-header-rename]').count(), 0);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:appearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:cardAppearance"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:personCards"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-inspector-section="canvas:connectionDefaults"]').count(), 1);
            assert.equal(await inspector.locator('[data-geneo-settings]').evaluate(button => {
                const header = button.closest('.geneo-inspector-header').getBoundingClientRect();
                const action = button.getBoundingClientRect();
                return action.left >= header.left && action.right <= header.right;
            }), true);
            await inspector.locator('[data-geneo-settings]').focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('#geneographBoardSettingsForm').count(), 1);
            assert.equal(await page.locator('#geneographSettingsName').inputValue(), originalName);
            assert.equal(await page.locator('#geneographBoardSettingsForm').getByText(language === 'ru' ? 'Коллекции' : 'Collections').count() > 0, true);
            assert.equal(await page.locator('[data-geneo-collection-results-title]').count(), 0);
            assert.equal(await page.locator('.geneo-collection-chooser-head > span').count(), 0);
            assert.equal(await page.locator('.geneo-collection-results .album-picker-cover, .geneo-collection-results .album-picker-meta').count(), 0);
            assert.equal(await page.locator('#geneographSettingsDescription').getAttribute('rows'), '2');
            assert.equal(await page.locator('.geneo-collection-create-panel').textContent().then(value => value.includes(language === 'ru' ? 'создаётся сразу' : 'immediately')), true);
            assert.equal(await page.locator('.geneo-collection-search-row').evaluate(row => {
                const search = row.querySelector('input').getBoundingClientRect();
                const create = row.querySelector('button').getBoundingClientRect();
                return Math.abs(search.top - create.top) < 8 && create.right <= row.getBoundingClientRect().right;
            }), true);
            assert.equal(await page.locator('.geneo-collection-results').evaluate(list => {
                const style = getComputedStyle(list);
                return style.overflowY === 'visible' && list.scrollHeight <= list.clientHeight + 1;
            }), true);
            assert.equal(await page.locator('.geneo-board-settings-modal').evaluate(modal => {
                const footer = modal.querySelector('.modal-footer').getBoundingClientRect();
                const bounds = modal.getBoundingClientRect();
                return footer.bottom <= bounds.bottom + 1 && bounds.bottom <= window.innerHeight + 1;
            }), true);
            if (width === 1280) {
                const search = page.locator('[data-geneo-collection-search]');
                await search.fill('Research theory');
                assert.equal(await page.locator('[data-geneo-collection-row]').count(), 1);
                await search.fill('');
                const firstChoice = page.locator('[data-geneo-collection-row]').first();
                const wasSelected = await firstChoice.locator('input').isChecked();
                await firstChoice.click();
                assert.equal(await firstChoice.locator('input').isChecked(), !wasSelected);
                assert.match(await page.locator('[data-geneo-collection-results-meta]').textContent(), /selected/);
                await page.locator('.geneo-collection-search-row [data-geneo-inline-collection-toggle]').click();
                await page.locator('[data-geneo-inline-collection-name]').fill('Inspector test collection');
                await page.locator('[data-geneo-inline-collection-create]').click();
                assert.equal(await page.locator('[data-geneo-collection-row].is-selected').filter({ hasText: 'Inspector test collection' }).count(), 1);
                await page.locator('#geneographBoardSettingsForm .modal-footer [data-close]').click();
                assert.equal(await page.evaluate(() => getProjectBoardCollections('p1')
                    .some(collection => collection.name === 'Inspector test collection')), true);
                await inspector.locator('[data-geneo-settings]').click();
            }
            await page.locator('#geneographSettingsName').fill('A very long board title for inspector header layout and truncation');
            await page.locator('#geneographBoardSettingsForm button[type="submit"]').click();
            const updatedName = await page.evaluate(() => selectedGeneographBoard().title);
            const displayedUpdatedName = await page.evaluate(() => localizedDataFieldValue(selectedGeneographBoard().title));
            assert.equal((await inspector.locator('.geneo-inspector-title h2').textContent()).trim(), displayedUpdatedName);
            assert.equal(await inspector.locator('.geneo-inspector-title h2').getAttribute('title'), displayedUpdatedName);
            assert.equal(await inspector.locator('.geneo-inspector-title h2').evaluate(heading =>
                heading.scrollWidth <= heading.clientWidth || getComputedStyle(heading).textOverflow === 'ellipsis'), true);
            await page.evaluate(() => {
                selectGeneographNode(selectedGeneographDiagram().nodes[0].id);
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await inspector.locator('[data-geneo-settings]').count(), 0);
            await page.evaluate(() => {
                selectGeneographCanvas();
                renderGeneographEditorPreserveScroll();
            });
            assert.equal(await inspector.locator('[data-geneo-settings]').count(), 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally {
        await browser.close();
    }
    process.stdout.write('Geneograph board inspector passed.\n');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
