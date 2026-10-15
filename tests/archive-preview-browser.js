const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = process.env.GENEO_TEST_URL || 'http://localhost:8766/index.html';

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        for (const [width, language] of [[320, 'en'], [390, 'en'], [900, 'ru'], [1280, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 760 }, acceptDownloads: true });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Archive' });
                state.archiveView = 'files';
                state.archiveSelectedFolderId = 'delo44';
                state.archiveSelectedFileId = 'af1';
                state.archiveInspectorCollapsed = false;
                render();
            }, language);
            if (width <= 900) await page.evaluate(() => openMobileSurface('details'));
            await page.locator('.archive-file-preview-image').first().waitFor();
            await page.waitForFunction(() => [...document.querySelectorAll('.archive-file-preview > [data-archive-region-box]')].every(box => box.dataset.archiveRegionReady === 'true'));
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]').count(), 4);
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]:not([hidden])').count(), 4);
            const regionGeometry = await page.locator('.archive-file-preview > [data-archive-region-box]').first().evaluate(box => {
                const preview = box.closest('.archive-file-preview').getBoundingClientRect();
                const region = box.getBoundingClientRect();
                return { inside: region.left >= preview.left && region.top >= preview.top
                    && region.right <= preview.right && region.bottom <= preview.bottom,
                sized: region.width > 0 && region.height > 0 };
            });
            assert.ok(regionGeometry.inside && regionGeometry.sized, JSON.stringify(regionGeometry));
            if (process.env.GENEO_CAPTURE_DIR && [390, 1280].includes(width))
                await page.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `archive-sidebar-regions-${width}.png`) });
            await page.locator('.archive-file-hero [data-archive-region-toggle]').uncheck();
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]:not([hidden])').count(), 0);
            await page.evaluate(() => document.querySelector('[data-archive-person-region="barnaby"]').dispatchEvent(new PointerEvent('pointerenter')));
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]:not([hidden])').count(), 1);
            await page.evaluate(() => document.querySelector('[data-archive-person-region="barnaby"]').dispatchEvent(new PointerEvent('pointerleave')));
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]:not([hidden])').count(), 0);
            await page.locator('[data-archive-person-region="barnaby"] .relation-row-main').evaluate(el => el.dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
            assert.equal(await page.locator('.archive-file-preview > [data-archive-region-box]:not([hidden])').count(), 1);
            await page.locator('[data-archive-open-file="af1"]').click();
            await page.locator('.archive-document-image').waitFor();
            if (process.env.GENEO_CAPTURE_DIR && [390, 1280].includes(width))
                await page.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `archive-image-${width}.png`) });
            assert.equal(await page.locator('.archive-document-region').count(), 4);
            assert.equal(await page.locator('.archive-document-tools [data-archive-region-toggle]').isChecked(), false);
            await page.locator('[data-document-region-person="barnaby"]').focus();
            assert.equal(await page.locator('.archive-document-region:not([hidden])').count(), 1);
            await page.locator('.archive-document-tools [data-archive-region-toggle]').check();
            assert.equal(await page.locator('.archive-document-region:not([hidden])').count(), 4);
            const download = page.waitForEvent('download');
            await page.locator('[data-document-download]').click();
            assert.match((await download).suggestedFilename(), /\.png$/);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.archive-file-hero [data-archive-region-toggle]').isChecked(), true);
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'af1');

            await page.evaluate(() => openArchiveDocumentViewer('af2'));
            await page.locator('.archive-document-image').waitFor();
            assert.equal(await page.locator('.archive-document-region').count(), 0);
            assert.equal(await page.locator('.archive-document-tools:not([hidden])').count(), 0);
            await page.keyboard.press('Escape');
            await page.evaluate(() => openArchiveDocumentViewer('af-birth-sample'));
            await page.locator('.archive-document-image').waitFor();
            assert.equal(await page.locator('.archive-document-region').count(), 1);
            await page.keyboard.press('Escape');

            for (const id of ['af-letter-transcription', 'af-household-csv', 'af-pawford-trip', 'af-marriage-packet']) {
                await page.evaluate(id => { state.archiveSelectedFolderId = archiveFileById(id).folderId; state.archiveSelectedFileId = id; renderArchiveMain(); }, id);
                assert.equal(await page.locator('.archive-file-preview').count(), 0);
                assert.equal(await page.locator(`[data-archive-open-file="${id}"]`).count(), 1);
            }
            await page.evaluate(() => openArchiveDocumentViewer('af-marriage-packet'));
            await page.waitForTimeout(750);
            assert.equal(await page.locator('.archive-document-pdf-canvas').count(), 1, await page.locator('.archive-document-body').innerText());
            const geometry = await page.evaluate(() => {
                const header = document.querySelector('.archive-document-modal .modal-header').getBoundingClientRect();
                const tools = document.querySelector('.archive-document-pdf-tools').getBoundingClientRect();
                const body = document.querySelector('.archive-document-body');
                const pageCanvas = document.querySelector('.archive-document-pdf-canvas').getBoundingClientRect();
                return { headerBottom: header.bottom, toolsTop: tools.top, toolsBottom: tools.bottom,
                    bodyTop: body.getBoundingClientRect().top, canvasTop: pageCanvas.top,
                    bodyOverflow: body.scrollWidth > body.clientWidth + 1,
                    documentOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
            });
            assert.ok(geometry.toolsTop >= geometry.headerBottom - 1, JSON.stringify(geometry));
            assert.ok(geometry.bodyTop >= geometry.toolsBottom - 1, JSON.stringify(geometry));
            assert.ok(geometry.canvasTop >= geometry.bodyTop, JSON.stringify(geometry));
            assert.equal(geometry.bodyOverflow, false, JSON.stringify(geometry));
            assert.equal(geometry.documentOverflow, false, JSON.stringify(geometry));
            const toolsBeforeScroll = await page.locator('.archive-document-pdf-tools').evaluate(element => element.getBoundingClientRect().top);
            await page.locator('.archive-document-body').evaluate(element => { element.scrollTop = 120; });
            const toolsAfterScroll = await page.locator('.archive-document-pdf-tools').evaluate(element => element.getBoundingClientRect().top);
            assert.equal(toolsAfterScroll, toolsBeforeScroll);
            if (process.env.GENEO_CAPTURE_DIR && [390, 1280].includes(width))
                await page.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `archive-pdf-${width}.png`) });
            await page.locator('[data-pdf-in]').click({ clickCount: 2 });
            await page.locator('[data-pdf-next]').click();
            await page.waitForFunction(() => document.querySelector('[data-pdf-page]')?.textContent === '2 / 2');
            await page.keyboard.press('Escape');
            if (width === 1280) {
                await page.evaluate(() => { state.archiveSelectedFolderId = 'delo44'; renderArchiveMain(); });
                await page.locator('[data-archive-file-row="af1"]').dblclick();
                await page.locator('.archive-document-image').waitFor();
                await page.keyboard.press('Escape');
            }
            assert.deepEqual(errors, [], `${width}px ${language} console`);
            await page.close();
        }
        console.log('Archive PDF toolbar, image viewer, marked areas, and inspector preview passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
