const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;
const uploadPath = path.resolve(__dirname, '../src/assets/silver-portrait.jpg');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const [width, language] of [[1440, 'en'], [1280, 'ru'], [390, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 }, deviceScaleFactor: 1.5 });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            if (errors.length) throw new Error(`Startup errors: ${errors.join('; ')}`);
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Projects' });
                state.openSide = 'settings';
                renderOpenProject();
            });
            await page.locator('[data-cover-style="golden-tree"]').click();
            assert.equal(await page.evaluate(() => currentProject().cover), 'golden-tree');
            await page.locator('#projectCoverPreview.cover-positionable').waitFor();
            const coverBox = await page.locator('#projectCoverPreview').boundingBox();
            await page.mouse.move(coverBox.x + coverBox.width / 2, coverBox.y + coverBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(coverBox.x + coverBox.width / 2 - 45, coverBox.y + coverBox.height / 2);
            await page.mouse.up();
            assert.ok((await page.evaluate(() => currentProject().coverPosition.x)) > 50);
            await page.locator('#projectCoverReset').click();
            assert.equal(await page.evaluate(() => currentProject().coverPosition.x), 50);
            await page.locator('[data-cover-style="paper"]').click();
            await page.locator('[data-cover-photo]').click();
            const picker = page.locator('.project-cover-photo-modal');
            await picker.waitFor();
            assert.equal(await picker.locator('.project-cover-photo-search svg').count(), 1);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await picker.screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `project-cover-picker-${width}-${language}.png`) });
            assert.equal(await picker.locator('[data-cover-photo-add-albums]').isChecked(), false);
            const overflow = await picker.evaluate(el => ({
                scroll: el.scrollWidth, client: el.clientWidth,
                offenders: [...el.querySelectorAll('*')].filter(node => node.getBoundingClientRect().right > el.getBoundingClientRect().right + 1)
                    .slice(0, 5).map(node => `${node.tagName}.${node.className}`)
            }));
            assert.equal(overflow.scroll > overflow.client + 1, false, JSON.stringify(overflow));
            await page.keyboard.press('Escape');
            assert.equal(await picker.count(), 0, `${width}: Escape did not close picker`);
            assert.equal(await page.evaluate(() => currentProject().cover), 'paper');
            await page.locator('[data-cover-photo]').click();
            await page.mouse.click(2, 2);
            assert.equal(await picker.count(), 0, `${width}: backdrop did not close picker`);
            await page.locator('[data-cover-photo]').click();
            await picker.locator('[data-cover-photo-search]').fill('Silver portrait');
            assert.equal(await picker.locator('[data-cover-photo-id]').count(), 1);
            await picker.locator('[data-cover-photo-id]').click();
            await picker.locator('[data-cover-photo-preview].cover-positionable').waitFor();
            await picker.locator('[data-cover-photo-preview]').focus();
            await page.keyboard.press('ArrowUp');
            await picker.locator('[data-cover-photo-confirm]').click();
            assert.equal(await page.evaluate(() => currentProject().coverPhotoId), 'photo-silver-portrait');
            assert.ok((await page.evaluate(() => currentProject().coverPosition.y)) > 50);
            assert.match(await page.locator('#projectCoverPreview').getAttribute('style'), /silver-portrait\.jpg/);
            await page.evaluate(() => { state.openSide = 'overview'; renderOpenProject(); });
            assert.equal(await page.locator('.project-hero.has-photo-cover').count(), 1);
            assert.match(await page.locator('.project-hero').getAttribute('style'), /silver-portrait\.jpg/);
            if (process.env.GENEO_SCREENSHOT_DIR)
                await page.locator('.project-hero').screenshot({ path: path.join(process.env.GENEO_SCREENSHOT_DIR,
                    `project-photo-hero-${width}-${language}.png`) });
            await page.evaluate(() => { state.openSide = 'settings'; renderOpenProject(); });

            await page.evaluate(() => openProjectCoverModal('p1'));
            await page.locator('[data-project-cover-choice="golden-tree"]').click();
            await page.locator('.project-cover-modal-preview.cover-positionable').waitFor();
            await page.locator('.project-cover-modal-preview').focus();
            await page.keyboard.press('ArrowLeft');
            assert.equal(await page.evaluate(() => currentProject().cover), 'photo');
            await page.locator('[data-save-project-cover]').click();
            assert.equal(await page.evaluate(() => currentProject().cover), 'golden-tree');
            assert.ok((await page.evaluate(() => currentProject().coverPosition.x)) > 50);
            const savedPosition = await page.evaluate(() => currentProject().coverPosition.x);
            await page.evaluate(() => openProjectCoverModal('p1'));
            await page.locator('.project-cover-modal-preview').focus();
            await page.keyboard.press('ArrowLeft');
            await page.locator('[data-close]').last().click();
            assert.equal(await page.evaluate(() => currentProject().coverPosition.x), savedPosition);
            await page.evaluate(() => { state.openSide = 'overview'; renderOpenProject(); });
            assert.match(await page.locator('.project-hero').getAttribute('style'), /--cover-position:/);
            await page.evaluate(() => { state.openSide = 'settings'; renderOpenProject(); });
            await page.evaluate(() => openProjectCoverModal('p1'));
            await page.locator('[data-project-cover-choice="tree"]').click();
            await page.locator('.project-cover-modal-preview ~ .project-cover-options [data-project-cover-choice="photo"]').click();
            await picker.locator('[data-cover-photo-id="photo-luna-portrait"]').click();
            await picker.locator('[data-close]').first().click();
            assert.equal(await page.locator('[data-project-cover-choice="tree"]').getAttribute('aria-pressed'), 'true');
            await page.locator('[data-close]').last().click();
            assert.equal(await page.evaluate(() => currentProject().cover), 'golden-tree');

            await page.evaluate(() => openProjectCoverModal('p1'));
            await page.locator('[data-project-cover-choice="photo"]').click();
            await picker.locator('[data-cover-photo-id="photo-luna-portrait"]').click();
            await picker.locator('[data-cover-photo-confirm]').click();
            assert.equal(await page.locator('[data-project-cover-choice="photo"]').getAttribute('aria-pressed'), 'true');
            await page.locator('[data-save-project-cover]').click();
            assert.equal(await page.evaluate(() => currentProject().coverPhotoId), 'photo-luna-portrait');

            await page.evaluate(() => { state.openSide = 'settings'; renderOpenProject(); });
            await page.locator('[data-cover-photo]').click();
            await picker.locator('[data-cover-photo-file]').setInputFiles(uploadPath);
            await picker.locator('[data-cover-photo-albums]').waitFor({ state: 'visible' });
            await picker.locator('[data-cover-photo-confirm]').click();
            assert.equal(await page.evaluate(() => currentProject().coverPhotoId), '');
            assert.match(await page.evaluate(() => currentProject().coverImageSrc), /^data:image\/jpeg;base64,/);
            const countBefore = await page.evaluate(() => sampleData.media.length);
            await page.locator('[data-cover-photo]').click();
            await picker.locator('[data-cover-photo-file]').setInputFiles(uploadPath);
            await picker.locator('[data-cover-photo-albums]').waitFor({ state: 'visible' });
            await picker.locator('[data-cover-photo-add-albums]').check();
            await picker.locator('[data-cover-photo-confirm]').click();
            assert.equal(await page.evaluate(() => sampleData.media.length), countBefore + 1);
            const uploadedId = await page.evaluate(() => currentProject().coverPhotoId);
            assert.ok(uploadedId);
            await page.evaluate(() => { const copy = duplicateProject('p1'); if (!copy) throw Error('Duplicate failed'); });
            assert.equal(await page.evaluate(() => sampleData.projects.find(p => p.id === state.selectedProjectId).coverPhotoId || ''), '');
            assert.match(await page.evaluate(() => sampleData.projects.find(p => p.id === state.selectedProjectId).coverImageSrc), /^data:image\/jpeg;base64,/);
            await page.evaluate(id => { activateProject('p1', { moduleName: 'Albums' }); deletePhotosPermanently([id]); }, uploadedId);
            assert.equal(await page.evaluate(() => sampleData.projects.find(p => p.id === 'p1').cover), 'paper');
            await page.evaluate(() => {
                const blank = createBlankProject({ name: 'Empty cover test' });
                openProjectCoverPhotoPicker(blank.id, { onSelect: () => {} });
            });
            assert.equal(await picker.locator('[data-cover-photo-id]').count(), 0);
            assert.equal(await picker.locator('[data-cover-photo-confirm]').isDisabled(), true);
            await picker.locator('[data-cover-photo-file]').setInputFiles({
                name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image')
            });
            assert.equal(await picker.locator('[data-cover-photo-error]').isVisible(), true);
            await picker.locator('[data-close]').first().click();
            await page.evaluate(() => {
                const project = sampleData.projects.find(p => p.id === 'p1');
                project.cover = 'photo'; project.coverPhotoId = ''; project.coverImageSrc = '';
            });
            assert.equal(await page.evaluate(() => resolvedProjectCoverStyle(sampleData.projects.find(p => p.id === 'p1'))), 'paper');
            assert.deepEqual(errors, [], `${width} ${language}: browser errors`);
            await page.close();
        }
        console.log('Project cover photo selection, upload, duplication, and deletion passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
