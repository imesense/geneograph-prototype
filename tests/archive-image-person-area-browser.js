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
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Archive' });
                openArchiveFilePeopleModal('af7');
            }, language);
            const modal = page.locator('.archive-unified-image-modal');
            await modal.waitFor();
            assert.equal(await modal.locator('[data-photo-people-search]').isVisible(), true);
            if (width <= 900) assert.equal(await modal.locator('[data-photo-people-search]').evaluate(input => input === document.activeElement), false);
            assert.equal(await modal.locator('[data-photo-people-primary]').count(), 0);
            const overflow = await modal.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth,
                children: [...element.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > element.getBoundingClientRect().right + 1)
                    .slice(0, 8).map(child => [child.className, Math.round(child.getBoundingClientRect().right)]) }));
            assert.equal(overflow.scroll > overflow.width + 1, false, JSON.stringify(overflow));
            await modal.locator('[data-albums-search-back]').click();
            assert.equal(await modal.locator('[data-lightbox-tag]').isVisible(), true);
            await modal.locator('[data-lightbox-tag]').click();
            await page.keyboard.press('Escape');
            assert.equal(await modal.count(), 1);
            await modal.locator('[data-lightbox-tag]').click();
            const personId = await modal.locator('[data-photo-people-choice]').first().getAttribute('data-photo-people-choice');
            await modal.locator(`[data-photo-people-choice="${personId}"]`).first().click();
            assert.equal(await page.evaluate(id => archiveFileById('af7').linkedPersonIds.includes(id), personId), true);
            assert.equal(await modal.locator(`[data-photo-people-region="${personId}"]`).getAttribute('aria-pressed'), 'true');
            const previewGeometry = await modal.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth,
                done: element.querySelector('.albums-preview-done').getBoundingClientRect().right,
                download: element.querySelector('[data-archive-image-download]').getBoundingClientRect().right }));
            assert.ok(previewGeometry.scroll <= previewGeometry.width + 1 && previewGeometry.done <= width + 1
                && previewGeometry.download <= width + 1, JSON.stringify(previewGeometry));
            const stage = modal.locator('[data-face-region-selector]');
            await stage.scrollIntoViewIfNeeded();
            const bounds = await stage.boundingBox();
            await page.mouse.move(bounds.x + bounds.width * .16, bounds.y + bounds.height * .2);
            await page.mouse.down();
            await page.mouse.move(bounds.x + bounds.width * .52, bounds.y + bounds.height * .4, { steps: 4 });
            await page.mouse.up();
            assert.ok(await page.evaluate(id => archiveFileById('af7').personRegions?.[id], personId));
            await modal.locator('[data-photo-people-clear-region]').click();
            await modal.locator('[data-photo-people-add-region]').click();
            const region = await page.evaluate(id => archiveFileById('af7').personRegions?.[id], personId);
            assert.ok(region && region.width > 0 && region.height > 0);
            await modal.locator(`[data-photo-people-region="${personId}"]`).hover();
            assert.equal(await modal.locator('[data-face-region-box] .face-region-name').isVisible(), true);
            await modal.locator('[data-face-region-box]').focus();
            await page.keyboard.press('ArrowRight');
            assert.ok(await page.evaluate(id => archiveFileById('af7').personRegions[id].x, personId) > region.x);
            await modal.locator('.albums-preview-done').click();
            assert.equal(await modal.count(), 0);
            await page.evaluate(() => openArchiveDocumentViewer('af7'));
            await modal.waitFor();
            assert.equal(await modal.locator(`[data-lightbox-person="${personId}"]`).count(), 1);
            await modal.locator(`[data-photo-people-remove="${personId}"]`).click();
            await page.locator('#photoPeoplePreviewRemovalOverlay [data-keep]').click();
            assert.equal(await page.evaluate(id => archiveFileById('af7').linkedPersonIds.includes(id), personId), true);
            await modal.locator(`[data-photo-people-remove="${personId}"]`).click();
            await page.locator('#photoPeoplePreviewRemovalOverlay [data-remove]').click();
            assert.equal(await page.evaluate(id => archiveFileById('af7').linkedPersonIds.includes(id), personId), false);
            assert.equal(await page.evaluate(id => archiveFileById('af7').personRegions?.[id], personId), undefined);
            await modal.locator('.albums-preview-done').click();
            await page.evaluate(() => {
                sampleData.archiveFiles.push({ id: 'broken-image-test', projectId: 'p1', folderId: 'fond12',
                    name: 'missing.png', kind: 'img', previewUrl: 'assets/does-not-exist.png', linkedPersonIds: ['silver'] });
                openArchiveDocumentViewer('broken-image-test');
            });
            await modal.locator('.photo-people-image-error').waitFor();
            assert.equal(await modal.locator('[data-photo-people-add-region]').count(), 0);
            await modal.locator('.albums-preview-done').click();
            await page.evaluate(() => {
                sampleData.archiveFiles.push({ id: 'test-pdf', projectId: 'p1', folderId: 'delo44',
                    name: 'fallback.pdf', kind: 'pdf', mimeType: 'application/pdf', linkedPersonIds: [] });
                openArchiveFilePeopleModal('test-pdf');
            });
            assert.equal(await page.locator('.archive-unified-image-modal').count(), 0);
            assert.equal(await page.locator('.notes-people-modal').count(), 1);
            await page.evaluate(() => closeModal());
            await page.evaluate(() => openArchiveFilesPeopleModal(['af7', 'af1']));
            assert.equal(await page.locator('.archive-unified-image-modal').count(), 0);
            assert.deepEqual(errors, [], `${width}px ${language} console`);
            await page.close();
        }
        console.log('Archive unified image tagging and non-image fallback passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
