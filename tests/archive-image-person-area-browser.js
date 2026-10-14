const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[320, 'ru'], [390, 'en'], [900, 'ru'], [1280, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Archive' });
                openArchiveFilePeopleModal('af7');
            });
            await page.evaluate(language => setLanguage(language, false), language);
            const modal = page.locator('.archive-person-area-modal');
            await modal.waitFor();
            assert.equal(await modal.locator('[data-notes-people-search]').evaluate(input => document.activeElement === input), false);
            assert.equal(await modal.locator('[data-archive-person-area-person]').evaluate(select =>
                select.classList.contains('common-select') && getComputedStyle(select).appearance === 'none'), true);
            const stage = modal.locator('[data-face-region-selector]');
            const box = await stage.boundingBox();
            assert.ok(box && box.width > 100 && box.height > 100);
            const overflow = await modal.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth,
                backdropPadding: getComputedStyle(element.parentElement).padding,
                modalRect: [element.getBoundingClientRect().left, element.getBoundingClientRect().right],
                modalGrid: getComputedStyle(element).gridTemplateColumns,
                children: [...element.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > element.getBoundingClientRect().right + 1)
                    .slice(0, 5).map(child => [child.className, Math.round(child.getBoundingClientRect().right)]) }));
            assert.ok(overflow.scroll <= overflow.width + 1, `${width}px overflow: ${JSON.stringify(overflow)}`);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await modal.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, `archive-person-area-${width}.png`) });
            await stage.scrollIntoViewIfNeeded();
            const visibleBox = await stage.boundingBox();
            await page.mouse.move(visibleBox.x + visibleBox.width * .2, visibleBox.y + visibleBox.height * .2);
            await page.mouse.down();
            await page.mouse.move(visibleBox.x + visibleBox.width * .55, visibleBox.y + visibleBox.height * .38, { steps: 5 });
            await page.mouse.up();
            assert.equal(await modal.locator('[data-face-region-box]').count(), 1);
            await modal.locator('[data-notes-people-save]').click();
            const region = await page.evaluate(() => archiveFileById('af7').personRegions?.silver);
            assert.ok(region && region.width > .2 && region.height > .1);
            assert.match(await page.evaluate(() => renderArchiveFilePeople(archiveFileById('af7'), false)), /data-archive-person-region="silver"/);
            assert.doesNotMatch(await page.evaluate(() => renderArchiveFilePeople(archiveFileById('af7'), false)), /Area marked in image/);
            if (width === 1280) {
                await page.evaluate(() => {
                    archiveNavigateToLocation({ view: 'files', folderId: 'fond12', search: '', filterPresentation: 'folders' });
                    state.archiveSelectedFileId = 'af-birth-sample';
                    state.archiveSelectedFolderItemId = null;
                    state.archiveInspectorCollapsed = false;
                    renderArchiveMain();
                });
                const sampleImage = page.locator('.archive-file-preview > .archive-file-preview-image');
                await sampleImage.evaluate(image => image.decode());
                assert.equal(await sampleImage.getAttribute('src'), 'assets/daisy-birth-record-sample.png');
                if (!await page.locator('[data-archive-person-region="daisy"]').isVisible())
                    await page.locator('[data-archive-section-toggle="people"]').click();
                await page.locator('[data-archive-person-region="daisy"]').hover();
                const floatingHighlight = page.locator('[data-archive-floating-region-highlight]');
                const inlineHighlight = page.locator('[data-archive-person-region-highlight]');
                const highlight = await floatingHighlight.isVisible() ? floatingHighlight : inlineHighlight;
                assert.equal(await highlight.isVisible(), true);
                const bounds = await highlight.boundingBox();
                assert.ok(bounds.width > 40 && bounds.height > 10);
                if (process.env.GENEO_SCREENSHOT_DIR)
                    await page.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR, 'archive-person-region-hover.png') });
                await page.mouse.move(0, 0);
                assert.equal(await highlight.isVisible(), false);
            }
            await page.evaluate(() => openArchiveFilePeopleModal('af7'));
            await modal.waitFor();
            assert.equal(await modal.locator('[data-face-region-box]').count(), 1);
            await modal.locator('[data-archive-person-area-clear]').click();
            await modal.locator('[data-notes-people-save]').click();
            assert.equal(await page.evaluate(() => archiveFileById('af7').personRegions?.silver), undefined);
            await page.evaluate(() => openArchiveFilePeopleModal('af7'));
            await modal.waitFor();
            const addedPersonId = await modal.locator('[data-notes-people-choice]').first().getAttribute('value');
            await modal.locator(`[data-notes-people-choice][value="${addedPersonId}"]`).click();
            assert.equal(await modal.locator('[data-archive-person-area-person]').inputValue(), addedPersonId);
            await modal.locator('[data-notes-people-save]').click();
            assert.ok(await page.evaluate(id => archiveFileById('af7').linkedPersonIds.includes(id), addedPersonId));
            await page.evaluate(() => {
                sampleData.archiveFiles.push({ id: 'test-pdf', projectId: 'p1', folderId: 'delo44',
                    name: 'fallback.pdf', kind: 'pdf', mimeType: 'application/pdf', linkedPersonIds: [] });
                openArchiveFilePeopleModal('test-pdf');
            });
            assert.equal(await page.locator('.archive-person-area-modal').count(), 0);
            assert.equal(await page.locator('.notes-people-modal').count(), 1);
            await page.evaluate(() => closeModal());
            await page.evaluate(() => openArchiveFilePeopleModal('af2'));
            await page.locator('.archive-person-area-modal').waitFor();
            await page.evaluate(() => closeModal());
            await page.evaluate(() => openArchiveFilesPeopleModal(['af7', 'af1']));
            assert.equal(await page.locator('.archive-person-area-modal').count(), 0);
            await page.evaluate(() => {
                archiveFileById('af7').personRegions = { silver: { x: .1, y: .1, width: .2, height: .2 } };
                setArchiveFileConnectionIds('af7', 'person', []);
            });
            assert.equal(await page.evaluate(() => archiveFileById('af7').personRegions?.silver), undefined);
            assert.deepEqual(errors, [], `${width}px console`);
            await page.close();
        }
        console.log('Archive image person area selection, persistence, and non-image fallback passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
