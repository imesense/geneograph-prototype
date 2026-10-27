const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false }); setLanguage(language, false);
                activateProject('p1', { moduleName: 'People' });
                openAddPersonModal('Add person', 'Create a new person in this project');
            }, language);
            const field = page.locator('[data-genealogy-date-field="addPersonBirth"]');
            const editor = page.locator('.genealogy-date-popover');
            assert.equal(await field.locator('option[value="Year only"]').count(), 0);
            await field.locator('[data-genealogy-date-input]').fill('14');
            await page.locator('#addPersonFirstName').click();
            assert.equal(await field.locator('[data-date-resolve]').count(), 2);
            await field.locator('[data-date-resolve="year"]').click();
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), 'year 14');
            await field.locator('[data-genealogy-date-input]').fill('1900');
            await field.locator('[data-genealogy-date-details]').click();
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1900');
            await editor.locator('[data-editor-day]').fill('14');
            await editor.locator('[data-editor-month]').selectOption('02');
            await editor.locator('[data-editor-year]').fill('');
            await editor.locator('[data-genealogy-date-apply]').click();
            let value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.deepEqual(value.first, { year: null, month: 2, day: 14 });
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill(language === 'ru' ? 'около 1900' : 'about 1900');
            assert.equal(await editor.locator('[data-editor-month]').inputValue(), '');
            assert.equal(await editor.locator('[data-editor-day]').inputValue(), '');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.equal(value.dateType, 'About / Circa'); assert.equal(value.first.year, 1900);
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill('day 21');
            await editor.locator('[data-editor-smart]').press('Escape');
            assert.equal(await editor.count(), 0);
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            assert.equal(JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue()).first.year, 1900);
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill('Between 14 Feb and 1901');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.equal(value.second.year, 1901); assert.equal(value.first.year, null);
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('.genealogy-calendar > summary').click();
            const beforeBrowse = await editor.locator('[data-editor-smart]').inputValue();
            await editor.locator('[data-grid-month="1"]').click();
            assert.equal(await editor.locator('[data-editor-smart]').inputValue(), beforeBrowse);
            await editor.locator('[data-grid-year]').fill('1900');
            await editor.locator('[data-grid-year]').dispatchEvent('change');
            await editor.locator('[data-grid-month-select]').selectOption('02');
            await editor.locator('[data-grid-target]').selectOption('');
            await editor.locator('[data-grid-day="14"]').click();
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1900');
            assert.ok(await editor.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `editor fits ${width}`);
            if (process.env.GENEO_DATE_SCREENSHOTS)
                await page.screenshot({ path: path.join(process.env.GENEO_DATE_SCREENSHOTS, `date-editor-${width}.png`) });
            await editor.locator('[data-genealogy-date-close]').first().click();
            await page.evaluate(() => { closeModal({ force: true }); openArchiveSourceModal(); });
            const accessed = page.locator('[data-genealogy-date-field="archiveSourceAccessed"]');
            await accessed.locator('[data-genealogy-date-input]').fill('February');
            const sourceDate = await page.evaluate(() => collectArchiveSourceAccessedDate());
            assert.deepEqual(sourceDate.first, { year: null, month: 2, day: null });
            const integrations = await page.evaluate(() =>
            {
                const date = buildGenealogyDateFromParts('Exact date', { day: 14, year: 1900 }).value;
                const media = mediaDateFromGenealogyModel(date);
                const photo = photoDateModel({ date: JSON.parse(JSON.stringify(media)) });
                const target = { birth: { ...normalizeGenealogyDateInput('1900'), placeId: 'keep-place', reason: 'keep-reason' } };
                geneoReviewSetFact(target, 'birth.date', date);
                const payload = { format: GENEO_BOARD_FILE_FORMAT, version: GENEO_BOARD_FILE_VERSION,
                    board: { title: 'Partial dates', description: '', diagram: { canvas: {}, personCardDefaults: {},
                        assets: [], people: [{ id: 'partial', names: {}, birth: date }], families: [], nodes: [], connections: [] } } };
                validateGeneographBoardFile(payload);
                payload.board.diagram.people[0].birth.first.day = 32;
                let rejectedInvalid = false;
                try { validateGeneographBoardFile(payload); } catch { rejectedInvalid = true; }
                return { photo: photo.first, copied: target.birth.first, place: target.birth.placeId, reason: target.birth.reason,
                    rejectedInvalid,
                    sourceLabel: archiveFormatDate(normalizeGenealogyDateInput('February')),
                    compatible: genealogyDatesCompatible('1900', '14 Feb 1900') };
            });
            assert.deepEqual(integrations.photo, { year: 1900, month: null, day: 14 });
            assert.deepEqual(integrations.copied, integrations.photo);
            assert.equal(integrations.place, 'keep-place'); assert.equal(integrations.reason, 'keep-reason');
            assert.equal(integrations.compatible, true);
            assert.equal(integrations.rejectedInvalid, true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Partial genealogy date editor and module integration passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
