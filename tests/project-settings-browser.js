const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName: 'Projects' });
                state.openSide = 'settings';
                renderOpenProject();
            });
            const initial = await page.evaluate(() => ({
                name: currentProject().name,
                cover: currentProject().cover,
                path: currentProject().projectPath,
                backup: currentProject().lastBackupAt
            }));
            await page.locator('#settingsProjectName').fill('A revised project');
            await page.locator('[data-cover-style="golden-tree"]').click();
            assert.equal(await page.locator('#settingsProjectName').inputValue(), 'A revised project');
            assert.equal(await page.evaluate(() => currentProject().cover), initial.cover);
            await page.locator('#resetProjectSettings').click();
            assert.equal(await page.evaluate(() => currentProject().name), initial.name);
            assert.equal(await page.evaluate(() => currentProject().cover), initial.cover);
            await page.locator('#settingsProjectName').fill('A revised project');
            await page.locator('[data-cover-style="golden-tree"]').click();
            await page.locator('#saveProjectSettings').click();
            assert.equal(await page.evaluate(() => currentProject().name), 'A revised project');
            assert.equal(await page.evaluate(() => currentProject().cover), 'golden-tree');

            for (const selector of ['#viewProjectFolder', '#createProjectBackup', '#enableProjectSync']) {
                assert.equal(await page.locator(selector).evaluate(el => el.classList.contains('project-settings-unavailable')), true);
                await page.locator(selector).click();
                assert.equal(await page.locator('.toast.show').count() > 0, true);
            }
            assert.equal(await page.locator('#moveProjectLocation').evaluate(el => el.classList.contains('project-settings-unavailable')), false);
            await page.locator('#moveProjectLocation').click();
            assert.equal(await page.locator('#confirmMoveProject').isDisabled(), true);
            const moveStyle = await page.locator('#confirmMoveProject').evaluate(el => {
                const style = getComputedStyle(el);
                return { background: style.backgroundColor, opacity: Number(style.opacity), cursor: style.cursor };
            });
            assert.equal(moveStyle.background, await page.locator('#saveProjectSettings').evaluate(el => getComputedStyle(el).backgroundColor));
            assert.ok(moveStyle.opacity < 1);
            assert.equal(moveStyle.cursor, 'not-allowed');
            await page.locator('#confirmMoveProject').hover();
            assert.deepEqual(await page.locator('#confirmMoveProject').evaluate(el => {
                const style = getComputedStyle(el);
                return { transform: style.transform, filter: style.filter };
            }), { transform: 'none', filter: 'none' });
            assert.match(await page.locator('#newProjectLocation').inputValue(), /\.ggproj$/);
            assert.equal(await page.locator('#newProjectLocation').isDisabled(), true);
            await page.locator('#moveProjectTitle').waitFor();
            await page.locator('.modal-footer [data-close]').click();
            assert.equal(await page.locator('#confirmMoveProject').count(), 0);
            await page.locator('#moveProjectLocation').click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#confirmMoveProject').count(), 0);
            assert.equal(await page.evaluate(() => currentProject().projectPath), initial.path);
            assert.equal(await page.evaluate(() => currentProject().lastBackupAt), initial.backup);
            for (const selector of ['#settingsLivingProtection', '#settingsPublishLiving', '#settingsPrivateNotes', '#settingsDateFormat'])
                assert.equal(await page.locator(selector).isDisabled(), true);
            assert.equal(await page.locator('.project-settings-coming-later').count(), 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Project settings draft, unavailable actions, and privacy controls passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
