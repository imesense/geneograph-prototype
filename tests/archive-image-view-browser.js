const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

async function chooseImageLayout(page, layout)
{
    const button = page.locator(`[data-archive-file-layout="${layout}"]`).first();
    if (await button.isVisible()) await button.click();
    else await page.locator('[data-archive-layout-select]').selectOption(layout);
}

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1440, 'en'], [390, 'en'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 500 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Archive' });
                const canvas = document.createElement('canvas');
                canvas.width = 600; canvas.height = 900;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f5f3ed'; ctx.fillRect(0, 0, 600, 900);
                ctx.fillStyle = '#222'; ctx.font = '24px serif';
                ctx.fillText('Family Register, 1846', 45, 60);
                ctx.font = '15px serif';
                for (let y = 100; y < 870; y += 35)
                {
                    ctx.fillText('Marriage record    Name and residence    Date', 45, y);
                    ctx.strokeStyle = '#aaa'; ctx.beginPath(); ctx.moveTo(40, y + 8); ctx.lineTo(560, y + 8); ctx.stroke();
                }
                window.avSource = canvas.toDataURL('image/png');
                sampleData.archiveFolders.push({ id: 'av-folder', projectId: 'p1', parentId: null, name: 'Register scans' });
                sampleData.archiveFolders.push({ id: 'av-child', projectId: 'p1', parentId: 'av-folder', name: 'Another volume' });
                sampleData.archiveFiles.push({ id: 'av-child-image', projectId: 'p1', folderId: 'av-child', name: 'child.png', kind: 'img', previewUrl: avSource, linkedPersonIds: [] });
                sampleData.archiveFiles.push(...Array.from({ length: 1000 }, (_, index) => ({
                    id: `av-${index}`, projectId: 'p1', folderId: 'av-folder', name: `scan${index + 1}.png`, kind: 'img',
                    previewUrl: index === 7 ? '' : avSource, thumbnailUrl: index === 7 ? '' : avSource,
                    linkedPersonIds: ['silver'], personRegions: { silver: { x: .1, y: .2, width: .3, height: .1 } }, linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: []
                })), { id: 'av-other', projectId: 'p1', folderId: 'av-folder', name: 'notes.txt', kind: 'doc' });
                state.archiveSelectedFolderId = 'av-folder';
                state.archiveSelectedFileId = 'av-0';
                renderArchive();
            });
            const padding = await page.locator('.archive-main').evaluate(el => getComputedStyle(el).padding);
            await chooseImageLayout(page, 'images');
            assert.equal(await page.locator('.archive-main').evaluate(el => getComputedStyle(el).padding), padding, 'layout switches preserve all workspace margins');
            assert.equal(await page.locator('.archive-files-page > .archive-page-head').count(), 0);
            assert.equal(await page.locator('.archive-image-counts, [data-av-name], .archive-image-navigation').count(), 0);
            assert.equal(await page.locator('.archive-image-tools [data-av-position]').count(), 1);
            assert.equal(await page.locator('.archive-image-tools [data-av-action="expand"]').count(), 1);
            assert.ok(await page.locator('.archive-image-tools').evaluate(el => {
                const tools = el.getBoundingClientRect();
                const position = el.querySelector('.archive-image-position').getBoundingClientRect();
                return Math.abs((position.left + position.right) / 2 - (tools.left + tools.right) / 2) < 1;
            }), 'the image position is centered independently of the other controls');
            const stage = page.locator('.archive-image-stage');
            await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
            assert.equal(await page.locator('.archive-file-preview, .archive-file-open').count(), 0);
            assert.equal(await page.locator('[data-av-action="previous"]').isDisabled(), true);
            assert.ok(await page.locator('[data-av-index]').count() < 40, '1000 images use a bounded thumbnail DOM');
            assert.equal(await page.evaluate(() => archiveImageView.files.length), 1000);
            const history = await page.evaluate(() => [appNavigation.back.length, state.archiveNavigationBackStack.length]);
            await page.evaluate(() => { window.avStage = document.querySelector('.archive-image-stage'); });
            await page.locator('[data-av-action="next"]').click();
            assert.equal(await page.evaluate(() => document.querySelector('.archive-image-stage') === avStage), true, 'navigation does not rebuild the stage');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-1');
            assert.deepEqual(await page.evaluate(() => [appNavigation.back.length, state.archiveNavigationBackStack.length]), history);
            await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
            const wheelBounds = await stage.boundingBox();
            const beforeWheel = await page.evaluate(() => archiveImageView.geometry.scale);
            await page.mouse.move(wheelBounds.x + wheelBounds.width / 2, wheelBounds.y + wheelBounds.height / 2);
            await page.mouse.wheel(0, -100);
            await page.waitForFunction(scale => archiveImageView.geometry.scale > scale, beforeWheel);
            await page.locator('[data-av-action="width"]').click();
            await stage.focus();
            await page.keyboard.press('ArrowRight');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-2');
            await page.locator('[data-av-action="width"]').focus();
            await page.keyboard.press('ArrowLeft');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-1');
            await page.keyboard.press('ArrowRight');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-2', 'arrow keys work from the bottom controls');
            assert.equal(await page.evaluate(() => archiveImageView.mode), 'width');
            await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
            const bounds = await stage.boundingBox();
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            await page.mouse.down();
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 - 60, { steps: 4 });
            await page.mouse.up();
            assert.ok(await page.evaluate(() => archiveImageView.panY > 0), 'a magnified image can be panned');
            if (width > 1100)
            {
                await page.locator('[data-archive-section-toggle="people"]').first().click();
                await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
                const row = page.locator('[data-archive-person-region="silver"]').first();
                const camera = await page.evaluate(() => [archiveImageView.mode, archiveImageView.panX, archiveImageView.panY]);
                await row.hover();
                assert.equal(await page.locator('[data-av-person-region]').evaluate(el => el.hidden), false);
                assert.deepEqual(await page.evaluate(() => [archiveImageView.mode, archiveImageView.panX, archiveImageView.panY]), camera, 'person hover does not move the camera');
                assert.ok(await page.evaluate(() => {
                    const box = document.querySelector('[data-av-person-region]');
                    const geometry = archiveImageView.geometry;
                    return Math.abs(parseFloat(box.style.width) - geometry.w * .3) < 1
                        && Math.abs(parseFloat(box.style.left) - (geometry.left + geometry.w * .1)) < 1;
                }), 'region overlay follows the transformed image');
                await stage.hover();
                assert.equal(await page.locator('[data-av-person-region]').evaluate(el => el.hidden), true);
                await row.locator('button').first().focus();
                assert.equal(await page.locator('[data-av-person-region]').evaluate(el => el.hidden), false, 'keyboard focus highlights the region');
                await stage.focus();
            }
            if (width < 500)
            {
                const session = await page.context().newCDPSession(page);
                const x = bounds.x + bounds.width / 2;
                const y = bounds.y + bounds.height / 2;
                await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
                await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 50, y, id: 1 }, { x: x + 50, y, id: 2 }] });
                await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                assert.equal(await page.evaluate(() => archiveImageView.mode), 'manual', 'touch pinch controls image zoom');
                await session.detach();
            }
            const beforeTagging = await page.evaluate(() => ({ mode: archiveImageView.mode, pan: archiveImageView.panY, id: state.archiveSelectedFileId }));
            await page.evaluate(() => openArchiveImagePeopleModal(state.archiveSelectedFileId));
            await page.locator('.archive-unified-image-modal').waitFor();
            await page.evaluate(() => closeModal({ force: true }));
            assert.deepEqual(await page.evaluate(() => ({ mode: archiveImageView.mode, pan: archiveImageView.panY, id: state.archiveSelectedFileId })), beforeTagging);
            await page.locator('[data-av-position]').fill('500');
            await page.locator('[data-av-position]').press('Enter');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-499');
            assert.ok(await page.locator('[data-av-index]').count() < 40);
            assert.ok(await page.evaluate(() => archiveImageView.cache.size <= 3));
            await page.evaluate(() =>
            {
                const strip = document.querySelector('[data-av-strip]');
                strip.scrollLeft = 800 * 88;
                strip.dispatchEvent(new Event('scroll'));
            });
            assert.ok(await page.locator('[data-av-index]').count() < 40, 'scrolling remains virtualized');
            await page.evaluate(() => archiveImageNavigate(7));
            await page.locator('[data-av-action="retry"]').waitFor();
            await page.locator('[data-av-action="next"]').click();
            await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-8', 'missing originals do not block stepping');
            await page.locator('[data-av-action="expand"]').click();
            assert.equal(await page.evaluate(() => document.body.classList.contains('archive-image-expanded')), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.evaluate(() => document.body.classList.contains('archive-image-expanded')), false);
            if (width > 1100)
            {
                await page.locator('#archiveRenameFile').click();
                await page.locator('#archiveFileNameInput').fill('Changed scan name');
                await page.locator('[data-av-action="next"]').click();
                await page.locator('#archiveDiscardFileNameTitle').waitFor();
                assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-8');
                await page.locator('#modalBackdrop [data-close]').first().click();
                assert.equal(await page.locator('#archiveFileNameInput').inputValue(), 'Changed scan name');
                await page.locator('#archiveCancelFileName').click();
                await page.locator('[data-discard-file-name]').click();
            }
            else
            {
                await page.locator('[data-av-action="details"]').click();
                assert.equal(await page.evaluate(() => mobileSurface), 'details');
                await page.evaluate(() => closeMobileSurface(false));
            }
            await chooseImageLayout(page, 'tiles');
            assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-8');
            await chooseImageLayout(page, 'images');
            await page.waitForFunction(() => !document.querySelector('[data-av-image]').hidden);
            await page.evaluate(() =>
            {
                state.archiveSearch = 'scan1000'; renderArchiveMain();
            });
            assert.equal(await page.evaluate(() => archiveImageView.files.length), 1);
            assert.equal(await page.locator('[data-av-action="next"]').isDisabled(), true);
            await page.evaluate(() => { state.archiveSearch = ''; renderArchiveMain(); archiveImageNavigate(30); });
            const removed = await page.evaluate(() =>
            {
                const index = sampleData.archiveFiles.findIndex(file => file.id === state.archiveSelectedFileId);
                const id = sampleData.archiveFiles[index].id;
                sampleData.archiveFiles.splice(index, 1); renderArchiveMain();
                return { id, selected: state.archiveSelectedFileId };
            });
            assert.notEqual(removed.id, removed.selected);
            await page.evaluate(() => { state.archiveSearch = 'no-matching-scan'; renderArchiveMain(); });
            assert.equal(await page.locator('.archive-image-empty').count(), 1);
            await page.locator('.archive-image-empty [data-archive-file-layout="details"]').click();
            assert.equal(await page.evaluate(() => state.archiveFileLayout), 'details');
            await page.evaluate(() => { state.archiveSearch = ''; state.archiveFileLayout = 'images'; renderArchiveMain(); });
            if (process.env.GENEO_IMAGE_SCREENSHOTS)
                await page.screenshot({ path: path.join(process.env.GENEO_IMAGE_SCREENSHOTS, `archive-image-view-${width}.png`) });
            assert.ok(await stage.evaluate(el => el.clientHeight >= 100));
            assert.ok(await page.locator('.archive-image-workspace').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'viewer has no horizontal overflow');
            assert.ok(await page.locator('.archive-files-toolbar').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'toolbar has no horizontal overflow');
            if (width === 1440)
            {
                await page.evaluate(() =>
                {
                    sampleData.archiveFiles.push(...Array.from({ length: 9000 }, (_, index) => ({
                        id: `av-large-${index}`, projectId: 'p1', folderId: 'av-folder', name: `scan${index + 1001}.png`,
                        kind: 'img', previewUrl: avSource, thumbnailUrl: avSource, linkedPersonIds: []
                    })));
                    renderArchiveMain(); archiveImageNavigate(9998);
                });
                assert.equal(await page.evaluate(() => archiveImageView.files.length), 9999);
                assert.ok(await page.locator('[data-av-index]').count() < 40, '10000 records keep a bounded DOM');
                assert.ok(await page.evaluate(() => archiveImageView.cache.size <= 3));
                await page.evaluate(() => { activateProject('p1', { moduleName: 'People' }); appNavigationGo('back'); });
                assert.equal(await page.evaluate(() => state.archiveFileLayout), 'images');
                assert.equal(await page.evaluate(() => state.archiveSelectedFileId), 'av-large-8999');
                await page.evaluate(() => archiveNavigateToLocation({ folderId: 'av-folder', selectedFileId: 'av-other' }));
                assert.equal(await page.evaluate(() => state.archiveFileLayout), 'details', 'explicit non-image destinations remain accessible');
                await page.evaluate(() => { const project = createBlankProject({ name: 'Other archive' }); activateProject(project.id, { moduleName: 'Archive' }); });
                assert.equal(await page.evaluate(() => archiveImageView.files.length), 0);
            }
            assert.deepEqual(errors, [], `no console errors at ${width}px`);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Archive Image view, virtualized sequences, and reading controls passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
