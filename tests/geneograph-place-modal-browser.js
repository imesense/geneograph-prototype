const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, height, language] of [[1280, 720, 'en'], [390, 720, 'ru'], [320, 568, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(language => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                searchSharedPlaceMapResults = async query => {
                    if (query.startsWith('Offline')) throw new Error('Map unavailable');
                    if (query.startsWith('Empty')) return [];
                    if (query.startsWith('Khark')) return Array.from({ length: 5 }, (_, index) => ({
                        name: `Khark ${index + 1}, Long Region, Test Country`,
                        primary: `Khark ${index + 1}`,
                        context: 'Long Region, Test Country, Northern Hemisphere',
                        coordinates: { lat: 51.2 + index, lng: 24.5 }
                    }));
                    return [{
                        name: `${query}, Test Country`, primary: query,
                        context: 'Test Country', coordinates: { lat: 51.2, lng: 24.5 }
                    }];
                };
                openGeneographPlaceModal();
            }, language);
            const modal = page.locator('.geneo-place-modal');
            const results = modal.locator('.geneo-place-picker-options');
            const map = modal.locator('[data-geneo-place-map-results]').locator('..');
            assert.equal(await map.isVisible(), false);
            assert.equal(await results.locator('[data-geneo-place-picker-choice="project"]').count() > 0, true);
            assert.equal(await modal.locator('.geneo-place-picker-results-section').count(), 2);
            assert.equal(await modal.locator('.geneo-place-board-choice-host').isVisible(), false);
            assert.equal(await modal.locator('[data-geneo-place-picker-options] [data-geneo-place-board-choice-host]').count(), 1);
            assert.equal(await modal.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
            assert.equal(await modal.locator('.modal-footer').isVisible(), true);
            assert.equal(await modal.locator('.modal-footer').evaluate(element => element.getBoundingClientRect().bottom <= innerHeight + 1), true);
            assert.equal(await results.evaluate(element => element.scrollHeight > element.clientHeight), true);
            assert.equal(await results.evaluate(element => getComputedStyle(element).overflowY), 'auto');
            assert.equal(await modal.locator('.geneo-place-picker-results').first().evaluate(element => getComputedStyle(element).overflowY), 'visible');
            assert.equal(await page.locator('html').evaluate(element => element.scrollWidth <= innerWidth), true);
            assert.equal(await modal.locator('#geneoPlaceModalTitle').textContent().then(text => text.trim()), language === 'ru' ? 'Добавить место' : 'Add place');
            assert.equal(await modal.locator('.geneo-place-modal-help').count(), 0);
            if (process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR)
                await modal.screenshot({ path: path.join(process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR, `place-${language}-${width}.png`) });
            const search = modal.locator('#geneoPlacePickerSearch');
            await search.fill('Khark');
            await modal.locator('[data-geneo-place-picker-choice="map"]').first().waitFor();
            assert.equal(await modal.locator('[data-geneo-place-picker-choice="map"]').count(), 5);
            assert.equal(await results.evaluate(element => {
                const lastMap = [...element.querySelectorAll('[data-geneo-place-picker-choice="map"]')].at(-1);
                const boardChoice = element.querySelector('[data-geneo-place-picker-choice="board"]');
                return boardChoice.getBoundingClientRect().top >= lastMap.getBoundingClientRect().bottom;
            }), true);
            assert.equal(await results.evaluate(element => element.scrollHeight > element.clientHeight), true);
            await modal.locator('[data-geneo-place-picker-choice="board"]').scrollIntoViewIfNeeded();
            assert.equal(await modal.locator('[data-geneo-place-picker-choice="board"]').isVisible(), true);
            if (process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR)
                await modal.screenshot({ path: path.join(process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR, `place-many-${language}-${width}.png`) });
            await search.fill('Offline Hamlet');
            await modal.locator('[data-geneo-place-map-retry]').waitFor();
            assert.equal(await modal.locator('[data-geneo-place-project-group]').isVisible(), false);
            assert.equal(await modal.locator('[data-geneo-place-picker-choice="board"]').isVisible(), true);
            await modal.locator('[data-geneo-place-map-retry]').click();
            await modal.locator('[data-geneo-place-map-retry]').waitFor();
            await search.fill('Empty Hamlet');
            await modal.locator('[data-geneo-place-map-group]').waitFor({ state: 'hidden' });
            await modal.locator('[data-geneo-place-picker-status]').filter({ hasText: language === 'ru' ? 'не найдено' : 'No matching places' }).waitFor();
            assert.equal(await modal.locator('[data-geneo-place-picker-choice="board"]').isVisible(), true);
            await search.focus();
            await search.fill('');
            await search.press('ArrowDown');
            assert.equal(await results.locator('[data-geneo-place-picker-choice="project"]').first().evaluate(element => element === document.activeElement), true);
            await search.fill('Meowbridge');
            assert.equal(await map.isVisible(), false);
            const projectChoice = modal.locator('[data-geneo-place-picker-choice="project"]').first();
            await projectChoice.click();
            const staleId = await projectChoice.getAttribute('data-geneo-place-picker-id');
            await page.evaluate(id => { getPlace(id).deleted = true; }, staleId);
            await modal.locator('[data-geneo-place-picker-submit]').click();
            assert.equal(await modal.locator('[data-geneo-place-error]').textContent().then(text => text.includes(language === 'ru' ? 'недоступно' : 'no longer available')), true);
            assert.equal(await search.inputValue(), 'Meowbridge');
            await page.evaluate(id => { getPlace(id).deleted = false; }, staleId);
            await modal.locator('#geneoPlacePickerSearch').fill('Board Hamlet');
            await map.waitFor({ state: 'visible' });
            await modal.locator('[data-geneo-place-picker-choice="map"]').waitFor();
            assert.equal(await modal.locator('[data-geneo-place-project-group]').isVisible(), false);
            assert.equal(await results.evaluate(element => {
                const sections = [...element.querySelectorAll('.geneo-place-picker-results-section:not([hidden])')];
                return sections.every((section, index) => index === 0 || section.getBoundingClientRect().top >= sections[index - 1].getBoundingClientRect().bottom);
            }), true);
            if (process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR)
                await modal.screenshot({ path: path.join(process.env.GENEO_PLACE_MODAL_SCREENSHOT_DIR, `place-search-${language}-${width}.png`) });
            assert.equal(await modal.locator('[data-geneo-place-picker-choice="board"]').count(), 1);
            await modal.locator('[data-geneo-place-picker-choice="board"]').click();
            assert.equal(await modal.locator('[data-geneo-place-picker-submit]').isEnabled(), true);
            assert.equal(await modal.locator('[data-geneo-place-picker-submit]').textContent().then(text => text.trim()), language === 'ru' ? 'Добавить место только на холст' : 'Add board-only place');
            const beforeCancel = await page.evaluate(() => ({
                places: sampleData.places.length,
                nodes: selectedGeneographDiagram().nodes.length
            }));
            await modal.locator('[data-geneo-place-picker-choice="map"]').click();
            await modal.locator('[data-close]').last().click();
            assert.deepEqual(await page.evaluate(() => ({
                places: sampleData.places.length,
                nodes: selectedGeneographDiagram().nodes.length
            })), beforeCancel);
            await page.evaluate(() => openGeneographPlaceModal());
            await page.locator('#geneoPlacePickerSearch').fill('Board Hamlet');
            await page.locator('[data-geneo-place-picker-choice="map"]').waitFor();
            await page.locator('[data-geneo-place-picker-choice="map"]').click();
            await page.locator('[data-geneo-place-picker-submit]').click();
            const created = await page.evaluate(() => ({
                places: sampleData.places.length,
                nodes: selectedGeneographDiagram().nodes.length,
                nodeId: selectedGeneographDiagram().nodes.at(-1).id,
                place: sampleData.places.find(place => place.name === 'Board Hamlet, Test Country')
            }));
            assert.equal(created.places, beforeCancel.places + 1);
            assert.equal(created.nodes, beforeCancel.nodes + 1);
            assert.equal(created.place.projectId, 'p1');
            await page.evaluate(id => openGeneographPlaceModal(id), created.nodeId);
            assert.equal(await page.locator('#geneoPlaceModalTitle').textContent().then(text => text.trim()), language === 'ru' ? 'Изменить место' : 'Change place');
            assert.equal(await page.locator('[data-geneo-place-picker-choice="project"].selected').count(), 1);
            await page.locator('.geneo-place-modal [data-close]').last().click();
            assert.equal(await page.locator('html').evaluate(element => element.scrollWidth <= innerWidth), true);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph place modal passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
