const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1440, 'en'], [1280, 'ru'], [390, 'en'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            const fullName = 'silver_birth_announcement_1998_with_extended_archive_reference_and_record_identification.png';
            await page.evaluate(name =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Archive' });
                const file = archiveFileById('af7');
                file.name = name;
                file.size = '2.3 MB';
                state.archiveSelectedFolderId = archiveFileFolderId(file);
                state.archiveSelectedFileId = file.id;
                state.archiveInspectorCollapsed = false;
                renderArchiveMain();
                if (innerWidth <= 1100) openMobileSurface('details');
            }, fullName);
            const heading = page.locator('.archive-file-identity h2');
            assert.equal(await heading.getAttribute('title'), fullName);
            assert.ok(await heading.evaluate(el => {
                const style = getComputedStyle(el);
                return style.whiteSpace === 'nowrap' && style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth;
            }), 'long file names use a single ellipsized line');
            if (process.env.GENEO_IDENTITY_SCREENSHOTS)
                await page.locator('.archive-file-identity').screenshot({ path: path.join(process.env.GENEO_IDENTITY_SCREENSHOTS, `archive-name-${width}.png`) });
            await page.locator('#archiveRenameFile').click();
            assert.equal(await page.locator('#archiveFileNameInput').inputValue(), fullName);
            assert.ok(await page.locator('.archive-file-rename-footer').evaluate(el => {
                const summary = el.querySelector('.archive-file-summary').getBoundingClientRect();
                const save = el.querySelector('#archiveSaveFileName').getBoundingClientRect();
                const cancel = el.querySelector('#archiveCancelFileName').getBoundingClientRect();
                return el.scrollWidth <= el.clientWidth + 1 && Math.abs(save.top - cancel.top) < 1
                    && Math.abs((summary.top + summary.bottom) / 2 - (save.top + save.bottom) / 2) < 2;
            }), 'format, size, Save and Cancel share one row');
            assert.match(await page.locator('.archive-file-rename-footer .archive-file-summary').innerText(), /2\.3/);
            if (process.env.GENEO_IDENTITY_SCREENSHOTS)
                await page.locator('.archive-file-identity').screenshot({ path: path.join(process.env.GENEO_IDENTITY_SCREENSHOTS, `archive-name-edit-${width}.png`) });
            await page.locator('#archiveFileNameInput').fill('renamed_birth_announcement.png');
            await page.locator('#archiveSaveFileName').click();
            assert.equal(await page.evaluate(() => archiveFileById('af7').name), 'renamed_birth_announcement.png');
            await page.locator('#archiveRenameFile').click();
            await page.locator('#archiveFileNameInput').fill('discarded.png');
            await page.locator('#archiveCancelFileName').click();
            await page.locator('[data-discard-file-name]').click();
            assert.equal(await page.evaluate(() => archiveFileById('af7').name), 'renamed_birth_announcement.png');
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Archive filename ellipsis and compact rename metadata passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
